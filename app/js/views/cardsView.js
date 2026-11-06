/**
 * Subjects Cards Grid View Renderer
 */

import { AppState, SUBJECT_GRADIENTS, getFilteredItems, doesSubjectMatchQuery, toggleItemComplete, deleteItem, deleteMaterial } from '../state.js';
import { formatDate, calculateRemainingTime, sortItemsChronologically, escapeHtml } from '../dateUtils.js';
import { openItemModal } from '../modals/itemModal.js';
import { openSubjectModal } from '../modals/subjectModal.js';
import { openFolderModal } from '../modals/folderModal.js';
import { openFolder } from '../api.js';

export function renderCardsView(container) {
    if (!container) return;
    container.innerHTML = "";

    const filteredItems = getFilteredItems();
    const query = (AppState.searchQuery || '').trim();
    const hasSearch = Boolean(query);

    if (AppState.subjects.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1;">
                <div class="empty-workspace-banner">
                    <div class="empty-icon-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                    </div>
                    <h3>No subjects added yet</h3>
                    <p>Create your first course subject to start scheduling deadlines, exams, and linking course folders.</p>
                    <button type="button" class="btn btn-primary" id="btnEmptyCreateSubject">
                        ➕ Add First Subject
                    </button>
                </div>
            </div>
        `;
        container.querySelector('#btnEmptyCreateSubject')?.addEventListener('click', () => openSubjectModal());
        return;
    }

    // Filter visible subjects when searching: show courses that match directly OR contain matching items
    let visibleSubjects = AppState.subjects;
    if (hasSearch) {
        visibleSubjects = AppState.subjects.filter(subj => {
            const hasMatchingItems = filteredItems.some(i => i.subjectId === subj.id);
            const matchesCourse = doesSubjectMatchQuery(subj, query);
            return hasMatchingItems || matchesCourse;
        });
    }

    if (visibleSubjects.length === 0 && hasSearch) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1;">
                <div class="empty-workspace-banner view-flow-in">
                    <div class="empty-icon-circle">🔍</div>
                    <h3>No matching results</h3>
                    <p>No courses, tasks, or events matched "<strong>${escapeHtml(query)}</strong>"</p>
                    <button type="button" class="btn btn-secondary" id="btnCardsClearSearch" style="margin-top: 10px;">
                        Clear Search
                    </button>
                </div>
            </div>
        `;
        container.querySelector('#btnCardsClearSearch')?.addEventListener('click', () => {
            AppState.searchQuery = '';
            const searchInput = document.getElementById('globalSearchInput');
            if (searchInput) searchInput.value = '';
            const clearBtn = document.getElementById('clearSearchBtn');
            if (clearBtn) clearBtn.style.display = 'none';
            renderCardsView(container);
        });
        return;
    }

    visibleSubjects.forEach((subj, index) => {
        const gradient = SUBJECT_GRADIENTS[subj.gradientIndex || 0] || SUBJECT_GRADIENTS[0];
        const subjItems = AppState.items.filter(i => i.subjectId === subj.id);
        const subjFilteredItems = sortItemsChronologically(filteredItems.filter(i => i.subjectId === subj.id));
        const subjMaterials = AppState.materials.filter(m => m.subjectId === subj.id);

        const totalItems = subjItems.length;
        const completedItems = subjItems.filter(i => i.completed).length;
        const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        const currentTab = AppState.cardSubTabs[subj.id] || 'schedule';
        // Auto-expand task drawer on matching cards so user immediately sees search results
        const isDrawerExpanded = hasSearch || AppState.expandedGridSubjectTasks.has(subj.id);

        const card = document.createElement('div');
        card.className = 'subject-card view-flow-in';
        card.style.animationDelay = `${index * 0.045}s`;

        // Header Banner
        const banner = document.createElement('div');
        banner.className = 'subject-header-banner';
        banner.style.background = gradient.css;
        banner.innerHTML = `
            <div class="subject-top-actions">
                <span class="subject-tag-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    Course Subject
                </span>
                <div class="subject-menu-btns">
                    <button type="button" class="subject-menu-btn btn-add-item" title="Add Task or Event">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                    </button>
                    <button type="button" class="subject-menu-btn btn-add-folder" title="Link Course Folder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    </button>
                    <button type="button" class="subject-menu-btn btn-edit-subj" title="Edit Subject Details">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                </div>
            </div>
            <div class="subject-title">${escapeHtml(subj.title)}</div>
            <div class="subject-code-desc">${escapeHtml(subj.code || 'No course code specified')}</div>
            <div class="subject-progress-container">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                </div>
                <span>${progressPercent}% (${completedItems}/${totalItems})</span>
            </div>
        `;

        banner.querySelector('.btn-add-item').addEventListener('click', () => openItemModal(null, subj.id));
        banner.querySelector('.btn-add-folder').addEventListener('click', () => openFolderModal(null, subj.id));
        banner.querySelector('.btn-edit-subj').addEventListener('click', () => openSubjectModal(subj.id));
        card.appendChild(banner);

        // Sub-tabs (Schedule vs Folders)
        const subTabs = document.createElement('div');
        subTabs.className = 'card-sub-tabs';
        subTabs.innerHTML = `
            <button type="button" class="card-sub-tab-btn ${currentTab === 'schedule' ? 'active' : ''}" data-tab="schedule">
                <span>📋 Schedule (${subjItems.length})</span>
            </button>
            <button type="button" class="card-sub-tab-btn ${currentTab === 'folders' ? 'active' : ''}" data-tab="folders">
                <span>📁 Folders (${subjMaterials.length})</span>
            </button>
        `;
        subTabs.querySelectorAll('.card-sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                AppState.cardSubTabs[subj.id] = btn.dataset.tab;
                renderCardsView(container);
            });
        });
        card.appendChild(subTabs);

        // Sub-tab content
        const bodyContent = document.createElement('div');
        bodyContent.className = 'compact-grid-list';

        if (currentTab === 'schedule') {
            if (subjFilteredItems.length === 0) {
                bodyContent.innerHTML = `<div class="task-empty-state">No schedule items matching filter</div>`;
            } else {
                const itemsToShow = isDrawerExpanded ? subjFilteredItems : subjFilteredItems.slice(0, 2);
                itemsToShow.forEach(item => {
                    const dueDate = new Date(item.dueDate);
                    const formatted = formatDate(dueDate);
                    const remaining = calculateRemainingTime(dueDate);
                    const isTask = item.kind === 'task';

                    let urgencyClass = remaining.urgencyLevel;
                    let urgencyBadge = remaining.friendlyText;
                    if (item.completed) {
                        urgencyClass = "completed";
                        urgencyBadge = "✅ Done";
                    } else if (remaining.urgencyLevel === 'overdue') {
                        urgencyBadge = "⚠️ " + remaining.friendlyText;
                    } else if (remaining.urgencyLevel === 'urgent') {
                        urgencyBadge = "🚨 " + remaining.friendlyText;
                    }

                    const itemEl = document.createElement('div');
                    itemEl.className = `compact-task-item ${item.completed ? 'is-completed' : ''} ${!item.completed && remaining.isUrgent ? 'is-urgent' : ''}`;
                    itemEl.innerHTML = `
                        <div class="compact-task-left">
                            <div class="compact-checkbox" title="${item.completed ? 'Reopen item' : 'Mark as completed'}">
                                ${item.completed ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                            </div>
                            <div class="compact-task-info">
                                <div class="compact-task-title-row">
                                    <span class="compact-kind-tag">${item.typeIcon || (isTask ? '📋' : '📅')} ${escapeHtml(item.typeName || (isTask ? 'Task' : 'Event'))}</span>
                                    <span class="compact-task-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</span>
                                </div>
                                <div class="compact-task-meta">
                                    <span>🗓️ ${formatted.primaryDisplay}</span>
                                    <span>•</span>
                                    <span class="compact-urgency-badge ${urgencyClass}">${urgencyBadge}</span>
                                </div>
                            </div>
                        </div>
                        <div class="compact-task-actions">
                            <button type="button" class="compact-action-btn btn-edit" title="Edit Item">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button type="button" class="compact-action-btn btn-del" title="Delete Item">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    `;

                    itemEl.querySelector('.compact-checkbox').addEventListener('click', () => toggleItemComplete(item.id));
                    itemEl.querySelector('.btn-edit').addEventListener('click', () => openItemModal(item.id));
                    itemEl.querySelector('.btn-del').addEventListener('click', () => {
                        if (confirm(`Delete "${item.title}"?`)) deleteItem(item.id);
                    });

                    bodyContent.appendChild(itemEl);
                });
            }
        } else {
            // Folders Tab
            if (subjMaterials.length === 0) {
                bodyContent.innerHTML = `
                    <div class="task-empty-state">
                        <div>No folders linked yet.</div>
                        <button type="button" class="btn btn-outline-cyan btn-sm" style="margin-top: 8px;" id="btnEmptyAddFolder_${subj.id}">
                            ➕ Link Course Folder
                        </button>
                    </div>
                `;
                bodyContent.querySelector(`#btnEmptyAddFolder_${subj.id}`)?.addEventListener('click', () => openFolderModal(null, subj.id));
            } else {
                subjMaterials.forEach(mat => {
                    const folderEl = document.createElement('div');
                    folderEl.className = 'folder-item-card';
                    folderEl.innerHTML = `
                        <div style="flex: 1; min-width: 0;">
                            <div class="folder-name-tag">
                                <span>📁</span>
                                <span title="${escapeHtml(mat.name)}">${escapeHtml(mat.name)}</span>
                            </div>
                            <div class="folder-path-sub" title="${escapeHtml(mat.filePath)}">${escapeHtml(mat.filePath)}</div>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <button type="button" class="btn btn-sm btn-outline-cyan btn-open-folder" title="Open in Windows Explorer">
                                Open
                            </button>
                            <button type="button" class="compact-action-btn btn-edit-folder" title="Edit Folder">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button type="button" class="compact-action-btn btn-del btn-del-folder" title="Delete Folder Link">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    `;

                    folderEl.querySelector('.btn-open-folder').addEventListener('click', async () => {
                        const res = await openFolder(mat.filePath);
                        if (!res.success) {
                            alert(res.error || 'Could not open folder in Explorer.');
                        }
                    });
                    folderEl.querySelector('.btn-edit-folder').addEventListener('click', () => openFolderModal(mat.id));
                    folderEl.querySelector('.btn-del-folder').addEventListener('click', () => {
                        if (confirm(`Remove folder link for "${mat.name}"?`)) deleteMaterial(mat.id);
                    });

                    bodyContent.appendChild(folderEl);
                });
            }
        }

        card.appendChild(bodyContent);

        // Drawer Footer: "Show All Tasks" toggle if > 2 items
        if (currentTab === 'schedule' && subjFilteredItems.length > 2) {
            const footer = document.createElement('div');
            footer.className = 'card-drawer-footer';
            const extraCount = subjFilteredItems.length - 2;
            footer.innerHTML = `
                <button type="button" class="card-expand-toggle-btn">
                    <span>${isDrawerExpanded ? '▲ Collapse' : `▼ Show All Tasks (+${extraCount})`}</span>
                </button>
                <span style="font-size: 0.72rem; color: var(--text-muted);">${subjFilteredItems.length} total</span>
            `;
            footer.querySelector('.card-expand-toggle-btn').addEventListener('click', () => {
                if (isDrawerExpanded) {
                    AppState.expandedGridSubjectTasks.delete(subj.id);
                } else {
                    AppState.expandedGridSubjectTasks.add(subj.id);
                }
                renderCardsView(container);
            });
            card.appendChild(footer);
        }

        container.appendChild(card);
    });
}
