/**
 * Interactive Kanban Board View Renderer with HTML5 Drag-and-Drop
 */

import { AppState, SUBJECT_GRADIENTS, getFilteredItems, toggleItemComplete, deleteItem, addOrUpdateItem, persistCurrentState } from '../state.js';
import { formatDate, calculateRemainingTime, escapeHtml } from '../dateUtils.js';
import { renderMarkdown, bindMarkdownChecklists } from '../markdown.js';
import { openItemModal } from '../modals/itemModal.js';
import { openSubjectModal } from '../modals/subjectModal.js';

export function renderKanbanView(container) {
    if (!container) return;
    container.innerHTML = "";

    const filteredItems = getFilteredItems();

    if (AppState.subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-workspace-banner">
                <div class="empty-icon-circle">📌</div>
                <h3>No subjects for Kanban board</h3>
                <p>Create subjects to organize your assignments and milestones into workflow columns.</p>
                <button type="button" class="btn btn-primary" id="btnEmptyKanbanAddSubj">
                    ➕ New Subject
                </button>
            </div>
        `;
        container.querySelector('#btnEmptyKanbanAddSubj')?.addEventListener('click', () => openSubjectModal());
        return;
    }

    // Partition items into 4 columns
    const now = Date.now();
    const columns = [
        {
            id: 'todo',
            title: 'To Do',
            icon: '📋',
            color: '#197278',
            items: []
        },
        {
            id: 'in_progress',
            title: 'In Progress',
            icon: '⏳',
            color: '#772E25',
            items: []
        },
        {
            id: 'urgent',
            title: 'Urgent (<48h)',
            icon: '🚨',
            color: '#C44536',
            items: []
        },
        {
            id: 'done',
            title: 'Completed',
            icon: '✅',
            color: '#2dd4bf',
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
    boardWrap.className = 'kanban-board-wrapper';

    columns.forEach(col => {
        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.dataset.columnId = col.id;

        // Header
        const colHeader = document.createElement('div');
        colHeader.className = 'kanban-column-header';
        colHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${col.icon}</span>
                <span style="font-weight: 700; color: ${col.color};">${col.title}</span>
                <span class="kanban-count-pill">${col.items.length}</span>
            </div>
            ${col.id !== 'done' ? `
                <button type="button" class="compact-action-btn btn-kanban-add" title="Add Item">
                    +
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
        });

        if (col.items.length === 0) {
            cardsList.innerHTML = `<div class="kanban-empty-slot">Drop cards here</div>`;
        } else {
            col.items.forEach(item => {
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

                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                    card.classList.add('is-dragging');
                });
                card.addEventListener('dragend', () => {
                    card.classList.remove('is-dragging');
                });

                // Checklists in notes
                const hasNotes = Boolean(item.extraInfo?.notes && item.extraInfo.notes.trim());
                const notesMarkdownHtml = hasNotes ? renderMarkdown(item.extraInfo.notes) : '';

                card.innerHTML = `
                    <div class="kanban-card-top">
                        <span class="timeline-subject-tag" style="background: ${gradient.css}; font-size: 0.68rem; padding: 1px 7px;">
                            ${escapeHtml(subj.title)}
                        </span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <button type="button" class="compact-action-btn btn-kb-edit" title="Edit">✏️</button>
                            <button type="button" class="compact-action-btn btn-del btn-kb-del" title="Delete">🗑️</button>
                        </div>
                    </div>

                    <div class="kanban-card-title-row">
                        <div class="compact-checkbox" title="${item.completed ? 'Reopen' : 'Complete'}">
                            ${item.completed ? '✓' : ''}
                        </div>
                        <span class="kanban-card-title" title="${escapeHtml(item.title)}">
                            ${item.typeIcon || (isTask ? '📋' : '📅')} ${escapeHtml(item.title)}
                        </span>
                    </div>

                    ${hasNotes ? `
                        <div class="kanban-notes-preview">
                            ${notesMarkdownHtml}
                        </div>
                    ` : ''}

                    <div class="kanban-card-footer">
                        <span>🗓️ ${formatted.primaryDisplay}</span>
                        <span class="compact-urgency-badge ${item.completed ? 'completed' : remaining.urgencyLevel}">
                            ${item.completed ? 'Done' : remaining.friendlyText}
                        </span>
                    </div>
                `;

                // Bind checkbox
                card.querySelector('.compact-checkbox').addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleItemComplete(item.id);
                });

                // Bind interactive markdown checklists
                if (hasNotes) {
                    const notesContainer = card.querySelector('.kanban-notes-preview');
                    bindMarkdownChecklists(notesContainer, item.extraInfo.notes, async (newMarkdown) => {
                        item.extraInfo.notes = newMarkdown;
                        await addOrUpdateItem(item);
                    });
                }

                card.querySelector('.btn-kb-edit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openItemModal(item.id);
                });

                card.querySelector('.btn-kb-del').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${item.title}"?`)) deleteItem(item.id);
                });

                cardsList.appendChild(card);
            });
        }

        colEl.appendChild(cardsList);
        boardWrap.appendChild(colEl);
    });

    container.appendChild(boardWrap);
}
