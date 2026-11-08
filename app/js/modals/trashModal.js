/**
 * Course Trash / Bin Modal Controller (Req 7)
 * 
 * Supports:
 * 1. Viewing all soft-deleted courses and their scheduled tasks/materials
 * 2. One-click course restoration with full task & material recovery
 * 3. Permanent course obliteration
 * 4. Empty all trash
 */

import { AppState, restoreSubject, permanentlyDeleteSubject, emptyTrash } from '../state.js';
import { escapeHtml } from '../dateUtils.js';

export function openTrashModal() {
    const modal = document.getElementById('trashModal');
    if (!modal) return;

    renderTrashList();
    modal.classList.add('is-active');
}

export function closeTrashModal() {
    const modal = document.getElementById('trashModal');
    if (modal) modal.classList.remove('is-active');
}

export function renderTrashList() {
    const container = document.getElementById('trashItemsList');
    const countBadge = document.getElementById('trashCountBadge');
    const btnEmptyAll = document.getElementById('btnEmptyAllTrash');
    if (!container) return;

    const trashedSubjs = AppState.trash?.subjects || [];
    if (countBadge) countBadge.textContent = `${trashedSubjs.length} course${trashedSubjs.length === 1 ? '' : 's'}`;
    if (btnEmptyAll) btnEmptyAll.style.display = trashedSubjs.length > 0 ? 'inline-flex' : 'none';

    container.innerHTML = '';

    if (trashedSubjs.length === 0) {
        container.innerHTML = `
            <div class="empty-trash-box">
                <span class="empty-trash-icon">🗑️</span>
                <h4>Trash is empty</h4>
                <p>Deleted courses will be held here safely so you can restore them whenever needed.</p>
            </div>
        `;
        return;
    }

    trashedSubjs.forEach(subj => {
        const trashedItems = (AppState.trash?.items || []).filter(i => i.subjectId === subj.id);
        const trashedMats = (AppState.trash?.materials || []).filter(m => m.subjectId === subj.id);

        const card = document.createElement('div');
        card.className = 'trash-item-row';
        card.innerHTML = `
            <div class="trash-item-info">
                <div class="trash-item-title-row">
                    <span class="trash-item-name">${escapeHtml(subj.title)}</span>
                    ${subj.code ? `<span class="trash-item-code">${escapeHtml(subj.code)}</span>` : ''}
                </div>
                <div class="trash-item-meta">
                    <span>Deleted: ${new Date(subj.deletedAt || Date.now()).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>${trashedItems.length} tasks/events</span>
                    <span>•</span>
                    <span>${trashedMats.length} folders</span>
                </div>
            </div>
            <div class="trash-item-actions">
                <button type="button" class="btn btn-sm btn-outline-cyan btn-restore-course">
                    ↺ Restore
                </button>
                <button type="button" class="btn btn-sm btn-secondary btn-perm-delete-course" style="color: var(--palette-tomato-jam); border-color: rgba(196, 69, 54, 0.4);">
                    Delete Forever
                </button>
            </div>
        `;

        card.querySelector('.btn-restore-course').addEventListener('click', async () => {
            await restoreSubject(subj.id);
            renderTrashList();
        });

        card.querySelector('.btn-perm-delete-course').addEventListener('click', async () => {
            if (confirm(`Permanently delete "${subj.title}" forever? This cannot be undone.`)) {
                await permanentlyDeleteSubject(subj.id);
                renderTrashList();
            }
        });

        container.appendChild(card);
    });
}

export function initTrashModalEvents() {
    document.getElementById('trashModalCloseBtn')?.addEventListener('click', closeTrashModal);
    document.getElementById('btnCloseTrashModal')?.addEventListener('click', closeTrashModal);

    document.getElementById('btnEmptyAllTrash')?.addEventListener('click', async () => {
        if (confirm("Are you sure you want to empty the trash? All deleted courses and tasks will be erased permanently.")) {
            await emptyTrash();
            renderTrashList();
        }
    });
}
