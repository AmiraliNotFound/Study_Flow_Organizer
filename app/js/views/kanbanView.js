/**
 * Interactive Kanban Board View Renderer with HTML5 Drag-and-Drop
 * 
 * Features:
 * 1. 3 Clean Workflow Columns: To Do, In Progress, Completed
 * 2. Drag & Drop between columns reliably updates item workflow status (persisted to disk)
 * 3. Chronological sorting with urgency badges (<48h highlighted at the top of active columns)
 * 4. View-aware filtering: ignores global status starvation while respecting Topics, Search, & Kind
 * 5. Full vertical scrollable card list with zero overflow/cut-off bugs
 * 6. Soft delete with Toast [Undo] notification (Zero Browser Dialogs)
 * 7. Zero Hardcoded Colors (Uses Dynamic Theme Custom Properties)
 * 8. Zero Emojis (100% Vectorized SVG Icons)
 */

import {
    AppState,
    SUBJECT_GRADIENTS,
    getFilteredItems,
    deleteItem,
    restoreItem,
    addOrUpdateItem,
    persistCurrentState
} from '../state.js';
import { formatDate, calculateRemainingTime, escapeHtml } from '../dateUtils.js';
import { renderMarkdown, bindMarkdownChecklists } from '../markdown.js';
import { openItemModal } from '../modals/itemModal.js';
import { openSubjectModal } from '../modals/subjectModal.js';
import { ICONS } from '../icons.js';
import { showToast } from '../toast.js';

export function renderKanbanView(container) {
    if (!container) return;
    container.innerHTML = "";

    // Ignore global status filters (pending/completed/urgent) so all 3 Kanban columns stay populated,
    // while still honoring topic tags, search queries, and task/event kind filters.
    const filteredItems = getFilteredItems({ ignoreStatusFilter: true });

    if (AppState.subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-workspace-banner view-flow-in">
                <div class="empty-icon-circle">${ICONS.viewKanban}</div>
                <h3>No subjects for Kanban board</h3>
                <p>Create subjects to organize your assignments and milestones into workflow columns.</p>
                <button type="button" class="btn btn-primary" id="btnEmptyKanbanAddSubj">
                    ${ICONS.plus} New Subject
                </button>
            </div>
        `;
        container.querySelector('#btnEmptyKanbanAddSubj')?.addEventListener('click', () => openSubjectModal());
        return;
    }

    // 3 True Workflow Columns (Urgency is rendered as card badges/highlights, not a trap column)
    const columns = [
        {
            id: 'todo',
            title: 'To Do',
            icon: ICONS.task,
            color: 'var(--color-primary)',
            items: []
        },
        {
            id: 'in_progress',
            title: 'In Progress',
            icon: ICONS.clock,
            color: 'var(--palette-chestnut)',
            items: []
        },
        {
            id: 'done',
            title: 'Completed',
            icon: ICONS.checkCircle,
            color: 'var(--color-success)',
            items: []
        }
    ];

    // Partition items into workflow columns
    filteredItems.forEach(item => {
        if (item.completed) {
            columns[2].items.push(item);
        } else if (item.inProgress) {
            columns[1].items.push(item);
        } else {
            columns[0].items.push(item);
        }
    });

    // Chronological sorting: active columns put earliest deadlines (most urgent) first;
    // completed column puts most recently due items first.
    const sortAsc = (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    const sortDesc = (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    columns[0].items.sort(sortAsc);
    columns[1].items.sort(sortAsc);
    columns[2].items.sort(sortDesc);

    const boardWrap = document.createElement('div');
    boardWrap.className = 'kanban-board-wrapper view-flow-in';

    columns.forEach((col, colIndex) => {
        const colEl = document.createElement('div');
        colEl.className = 'kanban-column view-flow-in';
        colEl.style.animationDelay = `${colIndex * 0.04}s`;
        colEl.dataset.columnId = col.id;

        // Header
        const colHeader = document.createElement('div');
        colHeader.className = 'kanban-column-header';
        colHeader.innerHTML = `
            <div class="kanban-column-title-wrap">
                <span class="col-icon-svg" style="color: ${col.color};">${col.icon}</span>
                <span style="font-weight: 700; color: ${col.color};">${col.title}</span>
                <span class="kanban-count-pill">${col.items.length}</span>
            </div>
            ${col.id !== 'done' ? `
                <button type="button" class="compact-action-btn btn-kanban-add" title="Add Item to ${col.title}">
                    ${ICONS.plus}
                </button>
            ` : ''}
        `;
        colHeader.querySelector('.btn-kanban-add')?.addEventListener('click', () => {
            openItemModal(null, null, 'task');
        });
        colEl.appendChild(colHeader);

        // Cards list (uses both class names for complete CSS compatibility and scrolling)
        const cardsList = document.createElement('div');
        cardsList.className = 'kanban-column-cards kanban-cards-list';
        cardsList.dataset.columnId = col.id;

        // Drag over / drop handlers
        cardsList.addEventListener('dragover', (e) => {
            e.preventDefault();
            colEl.classList.add('drag-over');
        });
        cardsList.addEventListener('dragleave', (e) => {
            if (!colEl.contains(e.relatedTarget)) {
                colEl.classList.remove('drag-over');
            }
        });
        cardsList.addEventListener('drop', async (e) => {
            e.preventDefault();
            colEl.classList.remove('drag-over');
            const itemId = e.dataTransfer.getData('text/plain');
            if (!itemId) return;

            const item = AppState.items.find(i => i.id === itemId);
            if (!item) return;

            let changed = false;
            if (col.id === 'done') {
                if (!item.completed || item.inProgress) {
                    item.completed = true;
                    item.inProgress = false;
                    changed = true;
                }
            } else if (col.id === 'in_progress') {
                if (item.completed || !item.inProgress) {
                    item.completed = false;
                    item.inProgress = true;
                    changed = true;
                }
            } else {
                if (item.completed || item.inProgress) {
                    item.completed = false;
                    item.inProgress = false;
                    changed = true;
                }
            }

            if (changed) {
                await persistCurrentState(true);
                renderKanbanView(container);
            }
        });

        if (col.items.length === 0) {
            cardsList.innerHTML = `<div class="kanban-empty-slot">Drop cards here</div>`;
        } else {
            col.items.forEach((item, cardIndex) => {
                const subj = AppState.subjects.find(s => s.id === item.subjectId) || { title: "Subject", gradientIndex: 0 };
                const gradient = SUBJECT_GRADIENTS[subj.gradientIndex || 0] || SUBJECT_GRADIENTS[0];
                const dueDate = new Date(item.dueDate);
                const formatted = formatDate(dueDate);
                const remaining = calculateRemainingTime(dueDate);
                const isTask = item.kind === 'task';

                const card = document.createElement('div');
                card.className = `kanban-card ${item.completed ? 'is-completed' : ''} ${!item.completed && remaining.isUrgent ? 'is-urgent' : ''}`;
                card.draggable = true;
                card.dataset.itemId = item.id;
                card.style.animationDelay = `${cardIndex * 0.025}s`;

                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                    card.classList.add('is-dragging');
                });
                card.addEventListener('dragend', () => {
                    card.classList.remove('is-dragging');
                });

                card.innerHTML = `
                    <div class="kanban-card-top">
                        <div class="kanban-card-subject-tag" style="background: ${gradient.css};" title="${escapeHtml(subj.title)}">
                            ${escapeHtml(subj.title)}
                        </div>
                        <div class="kanban-card-actions">
                            <button type="button" class="compact-action-btn btn-kb-edit" title="Edit Item">
                                ${ICONS.edit}
                            </button>
                            <button type="button" class="compact-action-btn btn-kb-del" title="Delete Item">
                                ${ICONS.trash}
                            </button>
                        </div>
                    </div>
                    <div class="kanban-card-title">${escapeHtml(item.title)}</div>
                    <div class="kanban-card-meta">
                        <span class="kanban-meta-date"><span class="meta-icon">${ICONS.schedule}</span> ${formatted.primaryDisplay}</span>
                        ${!item.completed
                            ? `<span class="compact-urgency-badge ${remaining.urgencyLevel}">${remaining.friendlyText}</span>`
                            : `<span class="compact-urgency-badge completed">Done</span>`}
                    </div>
                    ${item.extraInfo?.notes ? `<div class="kanban-card-notes">${renderMarkdown(item.extraInfo.notes)}</div>` : ''}
                    <div class="kanban-card-footer">
                        <span class="kanban-kind-indicator">
                            <span class="kind-svg">${isTask ? ICONS.task : ICONS.event}</span>
                            ${escapeHtml(item.typeName || (isTask ? 'Task' : 'Event'))}
                        </span>
                    </div>
                `;

                // Interactive Markdown checklist binding
                const notesContainer = card.querySelector('.kanban-card-notes');
                if (notesContainer && item.extraInfo?.notes) {
                    bindMarkdownChecklists(notesContainer, item.extraInfo.notes, async (newMarkdown) => {
                        item.extraInfo.notes = newMarkdown;
                        await addOrUpdateItem(item);
                    });
                }

                card.querySelector('.btn-kb-edit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openItemModal(item.id);
                });

                card.querySelector('.btn-kb-del').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const trashed = await deleteItem(item.id);
                    renderKanbanView(container);
                    showToast({
                        message: `"${item.title}" moved to trash`,
                        type: 'delete',
                        actionText: 'Undo',
                        onAction: async () => {
                            await restoreItem(trashed.id);
                            renderKanbanView(container);
                            showToast({ message: `"${item.title}" restored`, type: 'success' });
                        }
                    });
                });

                cardsList.appendChild(card);
            });
        }

        colEl.appendChild(cardsList);
        boardWrap.appendChild(colEl);
    });

    container.appendChild(boardWrap);
}
