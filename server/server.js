/**
 * Study Flow Organizer - Local API & Static Server (v4.1)
 * 
 * Provides:
 * 1. Zero-dependency static file server for app/
 * 2. Standard OS local data persistence (%APPDATA%\StudyFlowOrganizer on Windows)
 * 3. Safe OS integration: Windows File Explorer & native Folder Browser Dialog
 * 4. Automatic timestamped backups
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const PORT = process.env.PORT || 3456;
const ROOT_DIR = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT_DIR, 'app');
const TEMPLATE_FILE = path.join(ROOT_DIR, 'data', 'study_flow_data.template.json');

// Standard OS Application Data Directory
function resolveDataDirectory() {
    if (process.env.STUDY_FLOW_PORTABLE) {
        return path.join(ROOT_DIR, 'data');
    }
    const baseAppData = process.env.APPDATA || (
        process.platform === 'darwin'
            ? path.join(os.homedir(), 'Library', 'Application Support')
            : path.join(os.homedir(), '.config')
    );
    return path.join(baseAppData, 'StudyFlowOrganizer');
}

const DATA_DIR = resolveDataDirectory();
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DATA_FILE = path.join(DATA_DIR, 'study_flow_data.json');

// Ensure standard data and backups directories exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Seed data if AppData file does not exist yet
if (!fs.existsSync(DATA_FILE)) {
    const localRepoData = path.join(ROOT_DIR, 'data', 'study_flow_data.json');
    if (fs.existsSync(localRepoData)) {
        try {
            fs.copyFileSync(localRepoData, DATA_FILE);
            console.log(`[Seed] Initialized AppData storage from repository data file.`);
        } catch (e) {}
    } else if (fs.existsSync(TEMPLATE_FILE)) {
        try {
            fs.copyFileSync(TEMPLATE_FILE, DATA_FILE);
            console.log(`[Seed] Initialized AppData storage from template.`);
        } catch (e) {}
    }
}

// MIME types for static assets
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
};

function runCmd(cmd, args, options = {}) {
    return new Promise((resolve) => {
        const proc = spawn(cmd, args, {
            cwd: ROOT_DIR,
            shell: false,
            ...options
        });

        let stdout = '';
        let stderr = '';

        proc.stdout?.on('data', (data) => { stdout += data.toString(); });
        proc.stderr?.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
            resolve({
                code: code ?? 0,
                success: code === 0,
                stdout: stdout.trim(),
                stderr: stderr.trim()
            });
        });

        proc.on('error', (err) => {
            resolve({
                code: -1,
                success: false,
                stdout: '',
                stderr: err.message
            });
        });
    });
}

function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 10 * 1024 * 1024) {
                req.destroy();
                reject(new Error('Request payload too large'));
            }
        });
        req.on('end', () => {
            if (!body.trim()) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON in request body'));
            }
        });
        req.on('error', reject);
    });
}

function sendJson(res, statusCode, data) {
    const json = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    res.end(json);
}

function createBackupSnapshot() {
    if (!fs.existsSync(DATA_FILE)) return null;
    try {
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const backupFile = path.join(BACKUPS_DIR, `study_flow_data_backup_${timestamp}.json`);
        fs.copyFileSync(DATA_FILE, backupFile);
        return backupFile;
    } catch (e) {
        console.error('[Backup Error]', e);
        return null;
    }
}

function loadDatabase() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(raw);
        } catch (e) {
            console.error('[Load Error] reading study_flow_data.json:', e);
        }
    }
    if (fs.existsSync(TEMPLATE_FILE)) {
        try {
            const raw = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
            return JSON.parse(raw);
        } catch (e) {}
    }
    return {
        $schema: "StudyFlowOrganizer_v4",
        metadata: {
            version: "4.1.0",
            appName: "Study Flow Organizer",
            lastSaved: new Date().toISOString(),
            language: "en"
        },
        user: { username: "student" },
        config: {
            taskTypes: [
                { id: "tt_hw", name: "HW", icon: "📚" },
                { id: "tt_project", name: "Project", icon: "💻" },
                { id: "tt_report", name: "Lab Report", icon: "📄" },
                { id: "tt_reading", name: "Reading", icon: "📖" },
                { id: "tt_custom", name: "Custom", icon: "📌" }
            ],
            eventTypes: [
                { id: "et_quiz", name: "Quiz", icon: "📝" },
                { id: "et_midterm", name: "Midterm Exam", icon: "🎓" },
                { id: "et_final", name: "Final Exam", icon: "🏆" },
                { id: "et_presentation", name: "Presentation", icon: "📊" },
                { id: "et_class", name: "Review Session", icon: "🏛️" },
                { id: "et_custom", name: "Custom Event", icon: "📌" }
            ],
            materialTypes: [
                { id: "mat_folder", name: "Course Folder", icon: "📁" }
            ]
        },
        subjects: [],
        items: [],
        materials: []
    };
}

// Request Handler
async function handleRequest(req, res) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // --- API ROUTES ---

    // 1. Health check with standard data directory reporting
    if (pathname === '/api/health' && req.method === 'GET') {
        return sendJson(res, 200, {
            status: 'ok',
            version: '4.1.0',
            serverTime: new Date().toISOString(),
            platform: process.platform,
            dataDirectory: DATA_DIR,
            dataFile: DATA_FILE
        });
    }

    // 2. GET /api/data: Load active data from standard AppData
    if (pathname === '/api/data' && req.method === 'GET') {
        try {
            const data = loadDatabase();
            return sendJson(res, 200, { success: true, data, dataDirectory: DATA_DIR });
        } catch (err) {
            return sendJson(res, 500, { success: false, error: err.message });
        }
    }

    // 3. POST /api/data: Save active data with automatic backup snapshot
    if (pathname === '/api/data' && req.method === 'POST') {
        try {
            const payload = await parseJsonBody(req);
            if (!payload || typeof payload !== 'object') {
                return sendJson(res, 400, { success: false, error: 'Malformed data payload' });
            }

            const backupFile = createBackupSnapshot();

            if (!payload.metadata) payload.metadata = {};
            payload.metadata.lastSaved = new Date().toISOString();
            payload.metadata.version = "4.1.0";
            payload.$schema = "StudyFlowOrganizer_v4";

            const tempFile = `${DATA_FILE}.tmp`;
            fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
            fs.renameSync(tempFile, DATA_FILE);

            return sendJson(res, 200, {
                success: true,
                message: 'Data saved successfully to standard AppData directory',
                lastSaved: payload.metadata.lastSaved,
                dataDirectory: DATA_DIR,
                backupFile: backupFile ? path.basename(backupFile) : null
            });
        } catch (err) {
            return sendJson(res, 500, { success: false, error: err.message });
        }
    }

    // 4. POST /api/open-folder: Safe OS Explorer folder launcher
    if (pathname === '/api/open-folder' && req.method === 'POST') {
        try {
            const { folderPath } = await parseJsonBody(req);
            if (!folderPath || typeof folderPath !== 'string') {
                return sendJson(res, 400, { success: false, error: 'Path parameter is required' });
            }

            const cleanPath = path.normalize(folderPath.trim().replace(/^"|"$/g, ''));
            if (!fs.existsSync(cleanPath)) {
                return sendJson(res, 404, { success: false, error: `Path does not exist on disk: ${cleanPath}` });
            }

            if (process.platform === 'win32') {
                spawn('explorer.exe', [cleanPath], { detached: true, stdio: 'ignore' }).unref();
            } else if (process.platform === 'darwin') {
                spawn('open', [cleanPath], { detached: true, stdio: 'ignore' }).unref();
            } else {
                spawn('xdg-open', [cleanPath], { detached: true, stdio: 'ignore' }).unref();
            }

            return sendJson(res, 200, { success: true, message: 'Opened in Explorer', path: cleanPath });
        } catch (err) {
            return sendJson(res, 500, { success: false, error: err.message });
        }
    }

    // 5. POST /api/open-data-dir: Open standard AppData storage directory in Windows Explorer
    if (pathname === '/api/open-data-dir' && req.method === 'POST') {
        try {
            if (process.platform === 'win32') {
                spawn('explorer.exe', [DATA_DIR], { detached: true, stdio: 'ignore' }).unref();
            } else if (process.platform === 'darwin') {
                spawn('open', [DATA_DIR], { detached: true, stdio: 'ignore' }).unref();
            } else {
                spawn('xdg-open', [DATA_DIR], { detached: true, stdio: 'ignore' }).unref();
            }
            return sendJson(res, 200, { success: true, path: DATA_DIR });
        } catch (err) {
            return sendJson(res, 500, { success: false, error: err.message });
        }
    }

    // 6. POST /api/pick-folder: Native Folder Browser dialog executed on server
    if (pathname === '/api/pick-folder' && req.method === 'POST') {
        try {
            if (process.platform !== 'win32') {
                return sendJson(res, 501, { success: false, error: 'Native folder dialog currently supported on Windows' });
            }

            const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Select Course Material Folder"
$dialog.ShowNewFolderButton = $true
$topForm = New-Object System.Windows.Forms.Form
$topForm.TopMost = $true
$topForm.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
if ($dialog.ShowDialog($topForm) -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $dialog.SelectedPath
}
`;
            const result = await runCmd('powershell.exe', ['-NoProfile', '-Command', psScript]);
            const selectedPath = result.stdout.trim();

            if (!selectedPath) {
                return sendJson(res, 200, { success: false, cancelled: true });
            }

            const folderName = path.basename(selectedPath) || selectedPath;
            return sendJson(res, 200, {
                success: true,
                path: selectedPath,
                name: folderName
            });
        } catch (err) {
            return sendJson(res, 500, { success: false, error: err.message });
        }
    }

    // --- STATIC ASSET SERVING ---
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';

    const filePath = path.join(APP_DIR, safePath);

    if (!filePath.startsWith(APP_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Access Denied');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('File Not Found');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', (streamErr) => {
            console.error('[Stream Error]', streamErr);
            res.end();
        });
    });
}

const server = http.createServer(handleRequest);

server.listen(PORT, '127.0.0.1', () => {
    console.log(`==================================================================`);
    console.log(`  🎓 Study Flow Organizer v4.1`);
    console.log(`  🟢 Server running at: http://127.0.0.1:${PORT}`);
    console.log(`  📂 Standard AppData : ${DATA_DIR}`);
    console.log(`==================================================================`);
});

process.on('SIGINT', () => {
    console.log('\nStopping Study Flow Server...');
    server.close(() => process.exit(0));
});

module.exports = server;
