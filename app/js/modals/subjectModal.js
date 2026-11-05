/**
 * Add / Edit Subject Modal Controller
 */

import { AppState, SUBJECT_GRADIENTS, addOrUpdateSubject, deleteSubject } from '../state.js';

let activeSubjectId = null;
let selectedGradientIndex = 0;

export function openSubjectModal(subjectId = null) {
    const modal = document.getElementById('subjectModal');
    if (!modal) return;

    activeSubjectId = subjectId;
    const modalTitle = document.getElementById('subjectModalTitle');
    const form = document.getElementById('subjectForm');
    form.reset();

    const btnDelete = document.getElementById('btnDeleteSubject');
    if (btnDelete) btnDelete.classList.toggle('hidden', !subjectId);

    if (subjectId) {
        const subj = AppState.subjects.find(s => s.id === subjectId);
        if (subj) {
            modalTitle.textContent = 'Edit Subject';
            document.getElementById('subjectNameInput').value = subj.title;
            document.getElementById('subjectCodeInput').value = subj.code || '';
            selectedGradientIndex = subj.gradientIndex || 0;
        }
    } else {
        modalTitle.textContent = 'Create New Subject';
        selectedGradientIndex = Math.floor(Math.random() * SUBJECT_GRADIENTS.length);
    }

    renderGradientPicker();
    modal.classList.add('is-active');
}

export function closeSubjectModal() {
    const modal = document.getElementById('subjectModal');
    if (modal) modal.classList.remove('is-active');
    activeSubjectId = null;
}

function renderGradientPicker() {
    const container = document.getElementById('subjectGradientPicker');
    if (!container) return;
    container.innerHTML = '';

    SUBJECT_GRADIENTS.forEach((grad, index) => {
        const pill = document.createElement('div');
        pill.style.background = grad.css;
        pill.style.height = '32px';
        pill.style.borderRadius = '8px';
        pill.style.cursor = 'pointer';
        pill.style.transition = 'all 0.2s ease';
        pill.style.border = index === selectedGradientIndex ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)';
        pill.style.boxShadow = index === selectedGradientIndex ? '0 0 12px rgba(255,255,255,0.6)' : 'none';

        pill.addEventListener('click', () => {
            selectedGradientIndex = index;
            renderGradientPicker();
        });

        container.appendChild(pill);
    });
}

export function initSubjectModalEvents() {
    document.getElementById('subjectModalCloseBtn')?.addEventListener('click', closeSubjectModal);
    document.getElementById('btnCancelSubject')?.addEventListener('click', closeSubjectModal);

    document.getElementById('btnDeleteSubject')?.addEventListener('click', async () => {
        if (!activeSubjectId) return;
        const subj = AppState.subjects.find(s => s.id === activeSubjectId);
        if (subj && confirm(`Delete "${subj.title}" and all its scheduled tasks/events?`)) {
            await deleteSubject(activeSubjectId);
            closeSubjectModal();
        }
    });

    document.getElementById('subjectForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('subjectNameInput').value.trim();
        const code = document.getElementById('subjectCodeInput').value.trim();

        if (!title) {
            alert('Subject name is required');
            return;
        }

        await addOrUpdateSubject({
            id: activeSubjectId,
            title,
            code,
            gradientIndex: selectedGradientIndex
        });

        closeSubjectModal();
    });
}
