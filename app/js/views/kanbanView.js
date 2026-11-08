/**
 * Interactive Kanban Board View Renderer with HTML5 Drag-and-Drop
 * 
 * Features:
 * 1. 4 Workflow Columns: To Do, In Progress, Urgent (<48h), Completed
 * 2. Drag & Drop between columns updates item status
 * 3. Soft delete with Toast [Undo] notification (Zero Browser Dialogs)
 * 4. Zero Hardcoded Colors (Uses Dynamic Theme Custom Properties)
 * 5. Zero Emojis (100% Vectorized SVG Icons)
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

    const filteredItems = getFilteredItems();

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

    // Partition items into 4 columns using dynamic theme colors
    const now = Date.now();
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
            id: 'urgent',
            title: 'Urgent (<48h)',
            icon: ICONS.alert,
            color: 'var(--color-urgent)',
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

    filteredItems.forEach(item => {
        if (item.completed) {
            columns[3].items.push(item);
        } else {
            const diffHours = (new Date(item.dueDate).getTime() - now) / (1000 * 60 * 60);
            if (diffHours <= 48) {
                columns[2].items.push(item);
            } else if (item.inProgress) {
                columns[1].items.push(item);
            } else {
                columns[0].items.push(item);
            }
        }
    });

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
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="col-icon-svg" style="color: ${col.color};">${col.icon}</span>
                <span style="font-weight: 700; color: ${col.color};">${col.title}</span>
                <span class="kanban-count-pill">${col.items.length}</span>
            </div>
            ${col.id !== 'done' ? `
                <button type="button" class="compact-action-btn btn-kanban-add" title="Add Item">
                    ${ICONS.plus}
                </button>
            ` : ''}
        `;
        colHeader.querySelector('.btn-kanban-add')?.addEventListener('click', () => openItemModal());
        colEl.appendChild(colHeader);

        // Cards list
        const cardsList = document.createElement('div');
        cardsList.className = 'kanban-cards-list';
        cardsList.dataset.columnId = col.id;

        // Drag over / drop handlers
        cardsList.addEventListener('dragover', (e) => {
            e.preventDefault();
            cardsList.classList.add('drag-over');
        });
        cardsList.addEventListener('dragleave', () => {
            cardsList.classList.remove('drag-over');
        });
        cardsList.addEventListener('drop', async (e) => {
            e.preventDefault();
            cardsList.classList.remove('drag-over');
            const itemId = e.dataTransfer.getData('text/plain');
            if (!itemId) return;

            const item = AppState.items.find(i => i.id === itemId);
            if (!item) return;

            if (col.id === 'done') {
                item.completed = true;
                item.inProgress = false;
            } else if (col.id === 'in_progress') {
                item.completed = false;
                item.inProgress = true;
            } else {
                item.completed = false;
                item.inProgress = false;
            }

            await persistCurrentState();
            renderKanbanView(container);
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
                    <div class="kanban-card-subject-tag" style="background: ${gradient.css};">
                        ${escapeHtml(subj.title)}
                    </div>
                    <div class="kanban-card-title">${escapeHtml(item.title)}</div>
                    <div class="kanban-card-meta">
                        <span><span class="meta-icon">${ICONS.schedule}</span> ${formatted.primaryDisplay}</span>
                        ${!item.completed ? `<span class="compact-urgency-badge ${remaining.urgencyLevel}">${remaining.friendlyText}</span>` : ''}
                    </div>
                    ${item.extraInfo?.notes ? `<div class="kanban-card-notes">${renderMarkdown(item.extraInfo.notes)}</div>` : ''}
                    <div class="kanban-card-actions">
                        <span class="kanban-kind-indicator">
                            <span class="kind-svg">${isTask ? ICONS.task : ICONS.event}</span>
                            ${escapeHtml(item.typeName || (isTask ? 'Task' : 'Event'))}
                        </span>
                        <div style="display: flex; gap: 4px;">
                            <button type="button" class="compact-action-btn btn-kb-edit" title="Edit Item">
                                ${ICONS.edit}
                            </button>
                            <button type="button" class="compact-action-btn btn-kb-del" title="Delete Item">
                                ${ICONS.trash}
                            </button>
                        </div>
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
