/**
 * Course Folder Linking & Windows Explorer Modal Controller
 */

import { AppState, addOrUpdateMaterial, deleteMaterial } from '../state.js';
import { pickFolder } from '../api.js';

let activeMaterialId = null;

export function openFolderModal(materialId = null, preselectedSubjectId = null) {
    const modal = document.getElementById('folderModal');
    if (!modal) return;

    activeMaterialId = materialId;
    const modalTitle = document.getElementById('folderModalTitle');
    const form = document.getElementById('folderForm');
    form.reset();

    const subjectSelect = document.getElementById('folderSubjectSelect');
    subjectSelect.innerHTML = AppState.subjects.map(s => `
        <option value="${s.id}">${s.title} ${s.code ? `(${s.code})` : ''}</option>
    `).join('');

    if (AppState.subjects.length === 0) {
        alert("Please create a course subject before linking course folders.");
        return;
    }

    if (materialId) {
        const mat = AppState.materials.find(m => m.id === materialId);
        if (mat) {
            modalTitle.textContent = 'Edit Course Folder';
            subjectSelect.value = mat.subjectId;
            document.getElementById('folderNameInput').value = mat.name;
            document.getElementById('folderPathInput').value = mat.filePath;
            document.getElementById('folderNotesInput').value = mat.notes || '';
        }
    } else {
        modalTitle.textContent = 'Link Course Folder';
        if (preselectedSubjectId) {
            subjectSelect.value = preselectedSubjectId;
        }
    }

    modal.classList.add('is-active');
}

export function closeFolderModal() {
    const modal = document.getElementById('folderModal');
    if (modal) modal.classList.remove('is-active');
    activeMaterialId = null;
}

export function initFolderModalEvents() {
    document.getElementById('folderModalCloseBtn')?.addEventListener('click', closeFolderModal);
    document.getElementById('btnCancelFolder')?.addEventListener('click', closeFolderModal);

    // Native Windows Folder Picker via local server
    document.getElementById('btnBrowseFolder')?.addEventListener('click', async () => {
        const btn = document.getElementById('btnBrowseFolder');
        const origText = btn.textContent;
        btn.textContent = '⏳ Selecting Folder...';
        btn.disabled = true;

        try {
            const result = await pickFolder();
            if (result.success && result.path) {
                document.getElementById('folderPathInput').value = result.path;
                const nameInput = document.getElementById('folderNameInput');
                if (!nameInput.value.trim()) {
                    nameInput.value = result.name || 'Course Folder';
                }
            } else if (!result.cancelled && result.error) {
                alert(result.error);
            }
        } catch (e) {
            alert('Folder picker error: ' + e.message);
        } finally {
            btn.textContent = origText;
            btn.disabled = false;
        }
    });

    // Paste path from clipboard
    document.getElementById('btnPasteFolderPath')?.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                const clean = text.trim().replace(/^"|"$/g, '');
                document.getElementById('folderPathInput').value = clean;
                const nameInput = document.getElementById('folderNameInput');
                if (!nameInput.value.trim()) {
                    const leaf = clean.split(/[\\\/]/).filter(Boolean).pop();
                    nameInput.value = leaf || 'Course Folder';
                }
            }
        } catch (e) {
            const manual = prompt('Paste full folder path:');
            if (manual && manual.trim()) {
                document.getElementById('folderPathInput').value = manual.trim().replace(/^"|"$/g, '');
            }
        }
    });

    document.getElementById('folderForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectId = document.getElementById('folderSubjectSelect').value;
        const name = document.getElementById('folderNameInput').value.trim();
        const filePath = document.getElementById('folderPathInput').value.trim();
        const notes = document.getElementById('folderNotesInput').value.trim();

        if (!name) {
            alert('Folder label is required');
            return;
        }
        if (!filePath) {
            alert('Folder path is required');
            return;
        }

        await addOrUpdateMaterial({
            id: activeMaterialId,
            subjectId,
            name,
            filePath,
            notes
        });

        closeFolderModal();
    });
}
