/**
 * Courses & Schedule Matrix (Table View) Renderer
 */

import { AppState, SUBJECT_GRADIENTS, getFilteredItems, toggleItemComplete, deleteItem } from '../state.js';
import { formatDate, calculateRemainingTime, sortItemsChronologically, escapeHtml } from '../dateUtils.js';
import { formatDualDate } from '../jalali.js';
import { openItemModal } from '../modals/itemModal.js';
import { openSubjectModal } from '../modals/subjectModal.js';
import { openFolderModal } from '../modals/folderModal.js';
import { openFolder } from '../api.js';

export function renderTableView(container) {
    if (!container) return;
    container.innerHTML = "";

    const filteredItems = getFilteredItems();

    if (AppState.subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-workspace-banner">
                <div class="empty-icon-circle">📑</div>
                <h3>No subjects registered in matrix</h3>
                <p>Add subjects to view high-density schedule countdowns and accordion matrices.</p>
                <button type="button" class="btn btn-primary" id="btnEmptyTableAddSubject">
                    ➕ New Subject
                </button>
            </div>
        `;
        container.querySelector('#btnEmptyTableAddSubject')?.addEventListener('click', () => openSubjectModal());
        return;
    }

    // Header strip
    const headerStrip = document.createElement('div');
    headerStrip.className = 'subjects-table-header';
    headerStrip.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <h2>📑 Courses & Schedule Matrix</h2>
            <span class="badge" style="background: rgba(25, 114, 120, 0.18); color: var(--palette-stormy-teal); font-size: 0.76rem; padding: 2px 8px; border-radius: 10px;">
                ${AppState.subjects.length} Subjects
            </span>
        </div>
        <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-sm btn-primary btn-table-new-subj">
                ➕ New Subject
            </button>
        </div>
    `;
    headerStrip.querySelector('.btn-table-new-subj').addEventListener('click', () => openSubjectModal());
    container.appendChild(headerStrip);

    // List container
    const listWrap = document.createElement('div');
    listWrap.className = 'subject-table-list';

    AppState.subjects.forEach(subj => {
        const gradient = SUBJECT_GRADIENTS[subj.gradientIndex || 0] || SUBJECT_GRADIENTS[0];
        const subjItems = AppState.items.filter(i => i.subjectId === subj.id);
        const subjFilteredItems = sortItemsChronologically(filteredItems.filter(i => i.subjectId === subj.id));
        const subjMaterials = AppState.materials.filter(m => m.subjectId === subj.id);

        const total = subjItems.length;
        const completed = subjItems.filter(i => i.completed).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Next pending deadline
        const pendingItems = sortItemsChronologically(subjItems.filter(i => !i.completed));
        const nextItem = pendingItems[0] || null;

        let nextItemHtml = `<span style="color: var(--text-muted); font-size: 0.78rem;">No pending deadlines</span>`;
        if (nextItem) {
            const dueDate = new Date(nextItem.dueDate);
            const remaining = calculateRemainingTime(dueDate);
            const dual = formatDualDate(dueDate);
            nextItemHtml = `
                <div style="display: flex; flex-direction: column; gap: 1px;">
                    <div style="font-weight: 600; color: var(--palette-powder-petal); font-size: 0.82rem; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(nextItem.title)}">
                        ${nextItem.kind === 'task' ? '📋' : '📅'} ${escapeHtml(nextItem.title)}
                    </div>
                    <div style="font-size: 0.72rem; color: ${remaining.isUrgent ? 'var(--palette-tomato-jam)' : 'var(--text-muted)'}; display: flex; align-items: center; gap: 6px;">
                        <span>🗓️ ${dual ? dual.shamsiShort : ''}</span>
                        <span class="compact-urgency-badge ${remaining.urgencyLevel}">(${remaining.friendlyText})</span>
                    </div>
                </div>
            `;
        }

        const isExpanded = AppState.expandedTableSubjectIds.has(subj.id);

        const card = document.createElement('div');
        card.className = 'subject-table-card';

        // Summary row
        const summary = document.createElement('div');
        summary.className = 'subject-table-summary-row';
        summary.innerHTML = `
            <div class="subject-table-name-cell">
                <div class="subject-table-gradient-pill" style="background: ${gradient.css};"></div>
                <div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="subject-table-title">${escapeHtml(subj.title)}</span>
                        <button type="button" class="btn-edit-subj-name" title="Edit Subject Details" style="background: transparent; color: var(--palette-stormy-teal); cursor: pointer; padding: 2px;">
                            ✏️
                        </button>
                    </div>
                    <div class="subject-table-code">${escapeHtml(subj.code || 'No code')}</div>
                </div>
            </div>

            <div class="subject-table-progress-cell">
                <div style="font-size: 0.76rem; display: flex; justify-content: space-between; color: var(--text-secondary);">
                    <span>Progress:</span>
                    <strong>${percent}% (${completed}/${total})</strong>
                </div>
                <div class="progress-bar-bg" style="height: 5px;">
                    <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
            </div>

            <div class="subject-table-deadline-cell">
                ${nextItemHtml}
            </div>

            <div class="subject-table-materials-cell">
                <span>📁 ${subjMaterials.length} Folders</span>
            </div>

            <div class="subject-table-actions-cell">
                <button type="button" class="btn btn-sm btn-outline-cyan btn-add-item-table" title="Add Item">
                    + Item
                </button>
                <button type="button" class="btn btn-sm btn-secondary btn-accordion-toggle" title="Toggle Accordion">
                    <span>${isExpanded ? '▲' : '▼'}</span>
                </button>
            </div>
        `;

        summary.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            if (isExpanded) {
                AppState.expandedTableSubjectIds.delete(subj.id);
            } else {
                AppState.expandedTableSubjectIds.add(subj.id);
            }
            renderTableView(container);
        });

        summary.querySelector('.btn-edit-subj-name').addEventListener('click', (e) => {
            e.stopPropagation();
            openSubjectModal(subj.id);
        });

        summary.querySelector('.btn-add-item-table').addEventListener('click', (e) => {
            e.stopPropagation();
            openItemModal(null, subj.id);
        });

        summary.querySelector('.btn-accordion-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            if (isExpanded) {
                AppState.expandedTableSubjectIds.delete(subj.id);
            } else {
                AppState.expandedTableSubjectIds.add(subj.id);
            }
            renderTableView(container);
        });

        card.appendChild(summary);

        // Accordion content if expanded
        if (isExpanded) {
            const accordion = document.createElement('div');
            accordion.className = 'subject-accordion-content';

            // Column 1: Items list
            const colItems = document.createElement('div');
            colItems.innerHTML = `
                <div class="accordion-column-title">
                    <span>📋 All Subject Deadlines & Events (${subjFilteredItems.length})</span>
                </div>
            `;
            if (subjFilteredItems.length === 0) {
                colItems.innerHTML += `<div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px 0;">No items found</div>`;
            } else {
                subjFilteredItems.forEach(item => {
                    const dueDate = new Date(item.dueDate);
                    const formatted = formatDate(dueDate);
                    const dual = formatDualDate(dueDate);
                    const remaining = calculateRemainingTime(dueDate);
                    const isTask = item.kind === 'task';

                    const row = document.createElement('div');
                    row.className = `compact-task-item ${item.completed ? 'is-completed' : ''}`;
                    row.style.marginBottom = '6px';
                    row.innerHTML = `
                        <div class="compact-task-left">
                            <div class="compact-checkbox">
                                ${item.completed ? '✓' : ''}
                            </div>
                            <div class="compact-task-info">
                                <span class="compact-task-title">${item.typeIcon || (isTask ? '📋' : '📅')} ${escapeHtml(item.title)}</span>
                                <div class="compact-task-meta">
                                    <span>🗓️ ${dual ? dual.shamsiShort : formatted.shortDate}</span>
                                    <span>•</span>
                                    <span class="compact-urgency-badge ${remaining.urgencyLevel}">${remaining.friendlyText}</span>
                                </div>
                            </div>
                        </div>
                        <div class="compact-task-actions">
                            <button type="button" class="compact-action-btn btn-item-edit">✏️</button>
                            <button type="button" class="compact-action-btn btn-del btn-item-del">🗑️</button>
                        </div>
                    `;
                    row.querySelector('.compact-checkbox').addEventListener('click', () => toggleItemComplete(item.id));
                    row.querySelector('.btn-item-edit').addEventListener('click', () => openItemModal(item.id));
                    row.querySelector('.btn-item-del').addEventListener('click', () => {
                        if (confirm(`Delete "${item.title}"?`)) deleteItem(item.id);
                    });
                    colItems.appendChild(row);
                });
            }
            accordion.appendChild(colItems);

            // Column 2: Linked Folders list
            const colFolders = document.createElement('div');
            colFolders.innerHTML = `
                <div class="accordion-column-title" style="justify-content: space-between;">
                    <span>📁 Course Folders (${subjMaterials.length})</span>
                    <button type="button" class="btn btn-sm btn-outline-cyan btn-add-folder-acc" style="padding: 2px 8px; font-size: 0.72rem;">
                        + Link Folder
                    </button>
                </div>
            `;
            colFolders.querySelector('.btn-add-folder-acc').addEventListener('click', () => openFolderModal(null, subj.id));

            if (subjMaterials.length === 0) {
                colFolders.innerHTML += `<div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px 0;">No folders linked</div>`;
            } else {
                subjMaterials.forEach(mat => {
                    const fRow = document.createElement('div');
                    fRow.className = 'folder-item-card';
                    fRow.style.marginBottom = '6px';
                    fRow.innerHTML = `
                        <div style="flex: 1; min-width: 0;">
                            <div class="folder-name-tag">📁 ${escapeHtml(mat.name)}</div>
                            <div class="folder-path-sub">${escapeHtml(mat.filePath)}</div>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-cyan btn-acc-open-folder">
                            Open
                        </button>
                    `;
                    fRow.querySelector('.btn-acc-open-folder').addEventListener('click', async () => {
                        const res = await openFolder(mat.filePath);
                        if (!res.success) alert(res.error || 'Could not open folder in Explorer.');
                    });
                    colFolders.appendChild(fRow);
                });
            }
            accordion.appendChild(colFolders);

            card.appendChild(accordion);
        }

        listWrap.appendChild(card);
    });

    container.appendChild(listWrap);
}
