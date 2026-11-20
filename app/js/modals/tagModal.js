/**
 * Tag Management Modal Controller
 */

import { AppState, addGlobalTag, removeGlobalTag } from '../state.js';
import { mountModalHtml } from './modalMount.js';
import { TAG_MANAGER_MODAL_HTML } from './modalTemplates.js';
import { ICONS } from '../icons.js';
import { escapeHtml } from '../dateUtils.js';

let onTagChangedCallback = null;

export function initTagModalEvents(onTagChanged) {
    mountModalHtml('tagManagerModal', TAG_MANAGER_MODAL_HTML);
    onTagChangedCallback = onTagChanged;

    document.getElementById('btnOpenNewTagModal')?.addEventListener('click', openTagManagerModal);
    document.getElementById('tagModalCloseBtn')?.addEventListener('click', closeTagManagerModal);
    document.getElementById('btnCloseTagModal')?.addEventListener('click', closeTagManagerModal);

    const handleSaveTag = async () => {
        const input = /** @type {HTMLInputElement|null} */ (document.getElementById('inputNewTagName'));
        const val = (input?.value || '').trim().replace(/^#+/, '');
        if (val) {
            await addGlobalTag(val);
            if (input) input.value = '';
            renderTagManagerList();
            if (typeof onTagChangedCallback === 'function') {
                onTagChangedCallback();
            }
        }
    };

    document.getElementById('btnSaveNewTag')?.addEventListener('click', handleSaveTag);
    document.getElementById('inputNewTagName')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveTag();
        }
    });
}

export function openTagManagerModal() {
    mountModalHtml('tagManagerModal', TAG_MANAGER_MODAL_HTML);
    const modal = document.getElementById('tagManagerModal');
    if (!modal) return;
    renderTagManagerList();
    modal.classList.add('is-active');
    setTimeout(() => {
        document.getElementById('inputNewTagName')?.focus();
    }, 50);
}

export function closeTagManagerModal() {
    const modal = document.getElementById('tagManagerModal');
    if (modal) modal.classList.remove('is-active');
    if (typeof onTagChangedCallback === 'function') {
        onTagChangedCallback();
    }
}

export function renderTagManagerList() {
    const wrap = document.getElementById('modalAllTagsWrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    const allTags = new Set(AppState.config.tags || []);
    AppState.subjects.forEach(s => {
        if (Array.isArray(s.tags)) s.tags.forEach(t => allTags.add(t));
    });

    if (allTags.size === 0) {
        wrap.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No tags defined yet. Add one above!</span>`;
        return;
    }

    Array.from(allTags).sort().forEach(tag => {
        const count = AppState.subjects.filter(s => Array.isArray(s.tags) && s.tags.some(t => t.toLowerCase() === tag.toLowerCase())).length;
        const chip = document.createElement('div');
        chip.className = 'modal-tag-chip-row';
        chip.innerHTML = `
            <div class="modal-tag-chip-info">
                <span class="chip-tag-name">#${escapeHtml(tag)}</span>
                <span class="chip-course-count">${count} course${count === 1 ? '' : 's'}</span>
            </div>
            <button type="button" class="btn-delete-tag" title="Remove tag #${escapeHtml(tag)}" aria-label="Remove tag #${escapeHtml(tag)}">
                ${ICONS.trash}
            </button>
        `;

        chip.querySelector('.btn-delete-tag')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await removeGlobalTag(tag);
            renderTagManagerList();
            if (typeof onTagChangedCallback === 'function') {
                onTagChangedCallback();
            }
        });

        wrap.appendChild(chip);
    });
}
