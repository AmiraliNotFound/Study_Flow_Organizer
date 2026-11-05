/**
 * Backup, Export & Import Modal Controller
 */

import { AppState, setAppStateData, persistCurrentState } from '../state.js';
import { isServerConnected } from '../api.js';

export function openBackupModal() {
    const modal = document.getElementById('backupModal');
    if (!modal) return;

    const isConnected = isServerConnected();
    const statusDot = document.getElementById('modalDiskSyncDot');
    const statusText = document.getElementById('modalDiskSyncText');

    if (isConnected) {
        if (statusDot) statusDot.style.background = '#10B981';
        if (statusText) statusText.textContent = '🟢 Connected to data/study_flow_data.json on disk';
    } else {
        if (statusDot) statusDot.style.background = '#F59E0B';
        if (statusText) statusText.textContent = '🟠 Standalone Browser Mode (localStorage)';
    }

    modal.classList.add('is-active');
}

export function closeBackupModal() {
    const modal = document.getElementById('backupModal');
    if (modal) modal.classList.remove('is-active');
}

export function exportDataToJson() {
    const payload = {
        $schema: "StudyFlowOrganizer_v4",
        metadata: {
            version: "4.0.0",
            appName: "Study Flow Organizer",
            exportedAt: new Date().toISOString(),
            language: "en"
        },
        user: AppState.user,
        config: AppState.config,
        subjects: AppState.subjects,
        items: AppState.items,
        materials: AppState.materials
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `study_flow_data_${dateStr}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export function initBackupModalEvents() {
    document.getElementById('backupModalCloseBtn')?.addEventListener('click', closeBackupModal);
    document.getElementById('btnCloseBackupModal')?.addEventListener('click', closeBackupModal);

    document.getElementById('btnExportJson')?.addEventListener('click', exportDataToJson);

    // Import JSON
    const fileInput = document.getElementById('importJsonFileInput');
    document.getElementById('btnImportJson')?.addEventListener('click', () => {
        fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                setAppStateData(parsed);
                await persistCurrentState();
                alert('Data restored successfully!');
                closeBackupModal();
            } catch (err) {
                alert('Import error: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Clear All Data
    document.getElementById('btnWipeData')?.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear all data? This will reset your workspace to a clean slate.")) {
            AppState.subjects = [];
            AppState.items = [];
            AppState.materials = [];
            await persistCurrentState();
            alert('Workspace cleared.');
            closeBackupModal();
        }
    });
}
