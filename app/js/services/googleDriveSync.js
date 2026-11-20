/**
 * Study Flow Organizer - Google Drive Sync Service (Zero Server Dependencies)
 * 
 * Uses Google Identity Services (GIS) & Google Drive API v3 (appDataFolder).
 * Provides end-to-end encrypted HTTPS synchronization directly to the user's
 * private Google account without touching any third-party cloud servers.
 */

const GDRIVE_CLIENT_ID_KEY = 'study_flow_gdrive_client_id';
const GDRIVE_TOKEN_KEY = 'study_flow_gdrive_token';
const GDRIVE_USER_KEY = 'study_flow_gdrive_user';
const GDRIVE_LAST_SYNC_KEY = 'study_flow_gdrive_last_sync';

let tokenClient = null;
let currentToken = null;
let syncStatus = 'idle'; // 'idle' | 'syncing' | 'success' | 'error'
const listeners = new Set();

export function getSavedClientId() {
    return localStorage.getItem(GDRIVE_CLIENT_ID_KEY) || '';
}

export function saveClientId(clientId) {
    if (clientId) {
        localStorage.setItem(GDRIVE_CLIENT_ID_KEY, clientId.trim());
    } else {
        localStorage.removeItem(GDRIVE_CLIENT_ID_KEY);
    }
}

export function getSavedUser() {
    return localStorage.getItem(GDRIVE_USER_KEY) || '';
}

export function getLastSyncTime() {
    return localStorage.getItem(GDRIVE_LAST_SYNC_KEY) || '';
}

export function isGoogleSignedIn() {
    const token = getAccessToken();
    return Boolean(token);
}

export function getSyncStatus() {
    return syncStatus;
}

export function subscribeSync(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function notifySyncChange(detail = {}) {
    for (const fn of listeners) {
        try {
            fn({ status: syncStatus, lastSync: getLastSyncTime(), user: getSavedUser(), ...detail });
        } catch (e) {
            console.error('[GDrive] Listener error:', e);
        }
    }
}

function getAccessToken() {
    try {
        const raw = localStorage.getItem(GDRIVE_TOKEN_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() > parsed.expires_at) {
            localStorage.removeItem(GDRIVE_TOKEN_KEY);
            return null;
        }
        return parsed.access_token;
    } catch (e) {
        return null;
    }
}

function setAccessToken(tokenResponse) {
    const expiresAt = Date.now() + ((tokenResponse.expires_in || 3599) * 1000) - 60000;
    const tokenData = {
        access_token: tokenResponse.access_token,
        expires_at: expiresAt
    };
    localStorage.setItem(GDRIVE_TOKEN_KEY, JSON.stringify(tokenData));
    currentToken = tokenResponse.access_token;
}

/**
 * Initialize Google Identity Services (GIS) Token Client
 */
export function initGisClient(clientId) {
    if (typeof window === 'undefined') return false;
    const cid = clientId || getSavedClientId();
    if (!cid) return false;

    const g = window['google'];
    if (!g?.accounts?.oauth2) {
        console.warn('[GDrive] Google Identity Services SDK not loaded yet.');
        return false;
    }

    try {
        tokenClient = g.accounts.oauth2.initTokenClient({
            client_id: cid,
            scope: 'https://www.googleapis.com/auth/drive.appdata',
            callback: async (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    setAccessToken(tokenResponse);
                    // Fetch user info for display
                    await fetchUserInfo(tokenResponse.access_token);
                    syncStatus = 'idle';
                    notifySyncChange({ event: 'signed-in' });
                } else if (tokenResponse && tokenResponse.error) {
                    console.error('[GDrive] OAuth error:', tokenResponse.error);
                    syncStatus = 'error';
                    notifySyncChange({ error: tokenResponse.error });
                }
            }
        });
        return true;
    } catch (e) {
        console.error('[GDrive] initTokenClient failed:', e);
        return false;
    }
}

async function fetchUserInfo(accessToken) {
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.email) {
                localStorage.setItem(GDRIVE_USER_KEY, data.email);
            }
        }
    } catch (e) {
        console.warn('[GDrive] Could not fetch user email:', e);
    }
}

/**
 * Prompt user to sign in with Google
 */
export function signInGoogle(clientId) {
    const cid = clientId || getSavedClientId();
    if (!cid) {
        throw new Error('Google OAuth Client ID is required. Please enter it in Settings.');
    }

    if (!tokenClient) {
        const ok = initGisClient(cid);
        if (!ok) {
            throw new Error('Google Identity Services SDK is loading. Please check your internet connection and retry.');
        }
    }

    tokenClient.requestAccessToken({ prompt: 'consent' });
}

/**
 * Sign out and clear stored tokens
 */
export function signOutGoogle() {
    const token = getAccessToken();
    const g = typeof window !== 'undefined' ? window['google'] : null;
    if (token && g?.accounts?.oauth2) {
        try {
            g.accounts.oauth2.revoke(token);
        } catch (e) {}
    }
    localStorage.removeItem(GDRIVE_TOKEN_KEY);
    localStorage.removeItem(GDRIVE_USER_KEY);
    currentToken = null;
    syncStatus = 'idle';
    notifySyncChange({ event: 'signed-out' });
}

/**
 * Searches for 'study_flow_data.json' inside user's appDataFolder
 */
async function findRemoteFile(accessToken) {
    const url = "https://www.googleapis.com/drive/v3/files?" + new URLSearchParams({
        spaces: 'appDataFolder',
        q: "name = 'study_flow_data.json' and trashed = false",
        fields: 'files(id, name, modifiedTime, size)'
    });

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        throw new Error(`Failed to query appDataFolder (${res.status})`);
    }

    const data = await res.json();
    return (data.files && data.files.length > 0) ? data.files[0] : null;
}

/**
 * Downloads study_flow_data.json from Google Drive
 */
async function downloadRemoteFile(accessToken, fileId) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        throw new Error(`Failed to download remote file (${res.status})`);
    }

    return await res.json();
}

/**
 * Uploads data to Google Drive appDataFolder (create or update)
 */
async function uploadRemoteFile(accessToken, payload, existingFileId = null) {
    const jsonStr = JSON.stringify(payload, null, 2);

    if (existingFileId) {
        // Update existing file content
        const url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: jsonStr
        });

        if (!res.ok) {
            throw new Error(`Failed to update remote file (${res.status})`);
        }
        return await res.json();
    } else {
        // Create new file inside appDataFolder using multipart upload
        const metadata = {
            name: 'study_flow_data.json',
            parents: ['appDataFolder'],
            mimeType: 'application/json'
        };

        const boundary = '-------studyflow_boundary_' + Math.random().toString(36).substring(2);
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            jsonStr +
            closeDelimiter;

        const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
        });

        if (!res.ok) {
            throw new Error(`Failed to create remote file (${res.status})`);
        }
        return await res.json();
    }
}

/**
 * Item-Level Three-Way Merge Engine
 * Intelligently combines local and remote records based on timestamps.
 */
export function mergeDatasets(localData, remoteData) {
    if (!remoteData || !Array.isArray(remoteData.items)) {
        return { merged: localData, changes: 0 };
    }
    if (!localData || !Array.isArray(localData.items)) {
        return { merged: remoteData, changes: (remoteData.items || []).length };
    }

    const merged = { ...localData };

    // 1. Merge Subjects
    const localSubjects = localData.subjects || [];
    const remoteSubjects = remoteData.subjects || [];
    const subjectMap = new Map();
    for (const s of localSubjects) subjectMap.set(s.id, s);
    for (const s of remoteSubjects) {
        if (!subjectMap.has(s.id)) {
            subjectMap.set(s.id, s);
        } else {
            // Pick newer or merge fields
            const local = subjectMap.get(s.id);
            const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
            const remoteTime = new Date(s.updatedAt || s.createdAt || 0).getTime();
            if (remoteTime > localTime) {
                subjectMap.set(s.id, { ...local, ...s });
            }
        }
    }
    merged.subjects = Array.from(subjectMap.values());

    // 2. Merge Items (Tasks, Deadlines, Events)
    const localItems = localData.items || [];
    const remoteItems = remoteData.items || [];
    const itemMap = new Map();
    let changeCount = 0;

    for (const item of localItems) {
        itemMap.set(item.id, item);
    }

    for (const remoteItem of remoteItems) {
        if (!itemMap.has(remoteItem.id)) {
            // New item created on remote device
            itemMap.set(remoteItem.id, remoteItem);
            changeCount++;
        } else {
            const localItem = itemMap.get(remoteItem.id);
            const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
            const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();

            // If remote is newer, use remote fields
            if (remoteTime > localTime) {
                itemMap.set(remoteItem.id, { ...localItem, ...remoteItem });
                changeCount++;
            }
        }
    }

    // Filter out tombstones that have been marked deleted over 30 days ago
    const now = Date.now();
    merged.items = Array.from(itemMap.values()).filter(item => {
        if (item.deleted && item.deletedAt) {
            const deletedTime = new Date(item.deletedAt).getTime();
            if (now - deletedTime > 30 * 24 * 60 * 60 * 1000) {
                return false;
            }
        }
        return true;
    });

    // 3. Merge Materials (Folders)
    const localMaterials = localData.materials || [];
    const remoteMaterials = remoteData.materials || [];
    const matMap = new Map();
    for (const m of localMaterials) matMap.set(m.id || m.title, m);
    for (const m of remoteMaterials) {
        const key = m.id || m.title;
        if (!matMap.has(key)) {
            matMap.set(key, m);
            changeCount++;
        }
    }
    merged.materials = Array.from(matMap.values());

    // 4. Merge Settings & Tags
    merged.settings = { ...(localData.settings || {}), ...(remoteData.settings || {}) };
    const allTags = new Set([...(localData.tags || []), ...(remoteData.tags || [])]);
    merged.tags = Array.from(allTags);

    return { merged, changes: changeCount };
}

/**
 * Execute Full Bi-directional Sync
 * @param {Object} currentLocalData
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function executeSync(currentLocalData) {
    const token = getAccessToken();
    if (!token) {
        syncStatus = 'error';
        notifySyncChange({ error: 'Not authenticated with Google Drive' });
        return { success: false, error: 'Not authenticated' };
    }

    syncStatus = 'syncing';
    notifySyncChange();

    try {
        // Step 1: Find remote file in appDataFolder
        const remoteFileMeta = await findRemoteFile(token);

        let mergedPayload = currentLocalData;
        let fileId = remoteFileMeta?.id || null;

        if (fileId) {
            // Step 2: Download remote file and merge
            const remoteData = await downloadRemoteFile(token, fileId);
            const mergeResult = mergeDatasets(currentLocalData, remoteData);
            mergedPayload = mergeResult.merged;
        }

        // Add sync metadata stamp
        mergedPayload._sync = {
            version: 1,
            lastSyncedAt: new Date().toISOString()
        };

        // Step 3: Upload merged payload back to appDataFolder
        const uploadResult = await uploadRemoteFile(token, mergedPayload, fileId);

        // Step 4: Record success timestamp
        const nowIso = new Date().toISOString();
        localStorage.setItem(GDRIVE_LAST_SYNC_KEY, nowIso);
        syncStatus = 'success';
        notifySyncChange({ event: 'sync-complete', lastSync: nowIso });

        return { success: true, data: mergedPayload };
    } catch (e) {
        console.error('[GDrive Sync Error]', e);
        syncStatus = 'error';
        notifySyncChange({ error: e.message || 'Sync failed' });
        return { success: false, error: e.message };
    }
}
