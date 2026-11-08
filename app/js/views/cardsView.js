/**
 * Subjects Cards Grid View Renderer
 * 
 * Features:
 * 1. Prioritized Top 2 Tasks (unchecked & nearest deadlines first; checked items slide down)
 * 2. Smooth Animated Expandable Drawer with Custom Rotating Chevron
 * 3. Draggable Subjects (HTML5 Drag & Drop reordering with persistence)
 * 4. Pinnable Subjects (Pinned courses stay prominently on top)
 * 5. Tag Display & Interactive Tag Chips
 */

import {
    AppState,
    SUBJECT_GRADIENTS,
    getFilteredItems,
    doesSubjectMatchQuery,
    toggleItemComplete,
    deleteItem,
    deleteMaterial,
    togglePinSubject,
    reorderSubjects,
    deleteSubject
} from '../state.js';
import { formatDate, calculateRemainingTime, sortItemsChronologically, escapeHtml } from '../dateUtils.js';
import { openItemModal } from '../modals/itemModal.js';
import { openSubjectModal } from '../modals/subjectModal.js';
import { openFolderModal } from '../modals/folderModal.js';
import { openFolder } from '../api.js';

let draggedSubjectId = null;

export function renderCardsView(container) {
    if (!container) return;
    container.innerHTML = "";

    const filteredItems = getFilteredItems();
    const query = (AppState.searchQuery || '').trim();
    const hasSearch = Boolean(query);
    const activeTag = AppState.activeTagFilter && AppState.activeTagFilter !== 'all' ? AppState.activeTagFilter.toLowerCase() : null;

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

    // Filter visible subjects when searching or filtering by tag
    let visibleSubjects = [...AppState.subjects];

    if (activeTag) {
        visibleSubjects = visibleSubjects.filter(subj =>
            Array.isArray(subj.tags) && subj.tags.some(t => t.toLowerCase() === activeTag)
        );
    }

    if (hasSearch) {
        visibleSubjects = visibleSubjects.filter(subj => {
            const hasMatchingItems = filteredItems.some(i => i.subjectId === subj.id);
            const matchesCourse = doesSubjectMatchQuery(subj, query);
            return hasMatchingItems || matchesCourse;
        });
    }

    // Sort: Pinned first, then by custom user order
    visibleSubjects.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (a.order ?? 0) - (b.order ?? 0);
    });

    if (visibleSubjects.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1;">
                <div class="empty-workspace-banner view-flow-in">
                    <div class="empty-icon-circle">🔍</div>
                    <h3>No matching courses found</h3>
                    <p>No courses matched the active filter or query.</p>
                    <button type="button" class="btn btn-secondary" id="btnCardsClearFilter" style="margin-top: 10px;">
                        Reset Filters
                    </button>
                </div>
            </div>
        `;
        container.querySelector('#btnCardsClearFilter')?.addEventListener('click', () => {
            AppState.searchQuery = '';
            AppState.activeTagFilter = 'all';
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
        const isDrawerExpanded = hasSearch || AppState.expandedGridSubjectTasks.has(subj.id);

        // Separate and prioritize items: Uncompleted first (sorted chronologically), then Completed items
        const uncompletedItems = subjFilteredItems.filter(i => !i.completed);
        const completedList = subjFilteredItems.filter(i => i.completed);
        const prioritizedItems = [...uncompletedItems, ...completedList];

        const card = document.createElement('div');
        card.className = `subject-card view-flow-in ${subj.isPinned ? 'is-pinned-card' : ''}`;
        card.dataset.subjectId = subj.id;
        card.style.animationDelay = `${index * 0.035}s`;
        card.draggable = true;

        // --- Drag and Drop Handlers (Req 9) ---
        card.addEventListener('dragstart', (e) => {
            draggedSubjectId = subj.id;
            card.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', subj.id);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('is-dragging');
            document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('drag-over-top', 'drag-over-bottom'));
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (draggedSubjectId && draggedSubjectId !== subj.id) {
                const rect = card.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    card.classList.add('drag-over-top');
                    card.classList.remove('drag-over-bottom');
                } else {
                    card.classList.add('drag-over-bottom');
                    card.classList.remove('drag-over-top');
                }
            }
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        card.addEventListener('drop', async (e) => {
            e.preventDefault();
            card.classList.remove('drag-over-top', 'drag-over-bottom');
            if (!draggedSubjectId || draggedSubjectId === subj.id) return;

            const allSubjs = [...AppState.subjects];
            const sourceIdx = allSubjs.findIndex(s => s.id === draggedSubjectId);
            const targetIdx = allSubjs.findIndex(s => s.id === subj.id);

            if (sourceIdx !== -1 && targetIdx !== -1) {
                const [moved] = allSubjs.splice(sourceIdx, 1);
                allSubjs.splice(targetIdx, 0, moved);
                await reorderSubjects(allSubjs);
                renderCardsView(container);
            }
            draggedSubjectId = null;
        });

        // Header Banner
        const banner = document.createElement('div');
        banner.className = 'subject-header-banner';
        banner.style.background = gradient.css;

        const tagsHtml = Array.isArray(subj.tags) && subj.tags.length > 0
            ? subj.tags.map(t => `<span class="subject-tag-chip" data-tag="${escapeHtml(t)}" title="Filter by #${escapeHtml(t)}">#${escapeHtml(t)}</span>`).join('')
            : '';

        banner.innerHTML = `
            <div class="subject-top-actions">
                <div class="subject-top-left-badges">
                    <span class="subject-tag-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                        Course
                    </span>
                    ${subj.isPinned ? '<span class="pinned-badge" title="Pinned to top">📌 Pinned</span>' : ''}
                </div>
                <div class="subject-menu-btns">
                    <!-- Pin / Unpin Button (Req 9) -->
                    <button type="button" class="subject-menu-btn btn-pin-subj ${subj.isPinned ? 'is-active-pin' : ''}" title="${subj.isPinned ? 'Unpin course' : 'Pin course to top'}">
                        ${subj.isPinned ? '📌' : '📍'}
                    </button>
                    <!-- Drag Handle indicator -->
                    <span class="subject-drag-handle" title="Drag to reorder card">⠿</span>
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

            ${tagsHtml ? `<div class="subject-card-tags-strip">${tagsHtml}</div>` : ''}

            <div class="subject-progress-container">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                </div>
                <span>${progressPercent}% (${completedItems}/${totalItems})</span>
            </div>
        `;

        banner.querySelector('.btn-pin-subj').addEventListener('click', async (e) => {
            e.stopPropagation();
            await togglePinSubject(subj.id);
            renderCardsView(container);
        });

        banner.querySelector('.btn-add-item').addEventListener('click', (e) => {
            e.stopPropagation();
            openItemModal(null, subj.id);
        });

        banner.querySelector('.btn-add-folder').addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal(null, subj.id);
        });

        banner.querySelector('.btn-edit-subj').addEventListener('click', (e) => {
            e.stopPropagation();
            openSubjectModal(subj.id);
        });

        // Click on tag chip to filter
        banner.querySelectorAll('.subject-tag-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                const tag = chip.dataset.tag;
                AppState.activeTagFilter = AppState.activeTagFilter === tag ? 'all' : tag;
                const tagPills = document.querySelectorAll('.tag-filter-pill');
                tagPills.forEach(p => p.classList.toggle('active', p.dataset.tag === AppState.activeTagFilter));
                renderCardsView(container);
            });
        });

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
            if (prioritizedItems.length === 0) {
                bodyContent.innerHTML = `<div class="task-empty-state">No schedule items matching filter</div>`;
            } else {
                // Top 2 prioritized tasks
                const topTwoItems = prioritizedItems.slice(0, 2);
                const remainingItems = prioritizedItems.slice(2);

                const primaryWrap = document.createElement('div');
                primaryWrap.className = 'card-primary-tasks-list';

                topTwoItems.forEach(item => {
                    primaryWrap.appendChild(createTaskItemElement(item, subj, container));
                });
                bodyContent.appendChild(primaryWrap);

                // Smooth Sliding Expandable Drawer Container for items 3+ (Req 1b)
                if (remainingItems.length > 0) {
                    const expandableWrap = document.createElement('div');
                    expandableWrap.className = `card-drawer-expandable ${isDrawerExpanded ? 'is-expanded' : ''}`;
                    expandableWrap.id = `drawer_${subj.id}`;

                    remainingItems.forEach(item => {
                        expandableWrap.appendChild(createTaskItemElement(item, subj, container));
                    });
                    bodyContent.appendChild(expandableWrap);
                }
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

        // Drawer Footer: Customized Expanding Toggle Button (Req 1b)
        if (currentTab === 'schedule' && prioritizedItems.length > 2) {
            const footer = document.createElement('div');
            footer.className = 'card-drawer-footer';
            const extraCount = prioritizedItems.length - 2;

            footer.innerHTML = `
                <button type="button" class="card-expand-toggle-btn ${isDrawerExpanded ? 'is-expanded' : ''}" id="btnToggleDrawer_${subj.id}">
                    <span class="expand-chevron-icon">▾</span>
                    <span class="expand-btn-label">${isDrawerExpanded ? 'Show Less' : `Show More (+${extraCount})`}</span>
                </button>
                <span class="card-task-count-badge">${prioritizedItems.length} total</span>
            `;

            footer.querySelector(`#btnToggleDrawer_${subj.id}`).addEventListener('click', () => {
                const drawer = card.querySelector(`#drawer_${subj.id}`);
                const toggleBtn = footer.querySelector(`#btnToggleDrawer_${subj.id}`);
                const label = footer.querySelector('.expand-btn-label');

                if (AppState.expandedGridSubjectTasks.has(subj.id)) {
                    AppState.expandedGridSubjectTasks.delete(subj.id);
                    if (drawer) drawer.classList.remove('is-expanded');
                    if (toggleBtn) toggleBtn.classList.remove('is-expanded');
                    if (label) label.textContent = `Show More (+${extraCount})`;
                } else {
                    AppState.expandedGridSubjectTasks.add(subj.id);
                    if (drawer) drawer.classList.add('is-expanded');
                    if (toggleBtn) toggleBtn.classList.add('is-expanded');
                    if (label) label.textContent = 'Show Less';
                }
            });

            card.appendChild(footer);
        }

        container.appendChild(card);
    });
}

/**
 * Creates an individual task row with animated checkbox reordering (Req 1a)
 */
function createTaskItemElement(item, subj, container) {
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
    itemEl.dataset.itemId = item.id;

    itemEl.innerHTML = `
        <div class="compact-task-left">
            <div class="compact-checkbox ${item.completed ? 'checked' : ''}" title="${item.completed ? 'Reopen item' : 'Mark as completed'}">
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

    // Smooth check/uncheck animation (Req 1a)
    itemEl.querySelector('.compact-checkbox').addEventListener('click', async () => {
        itemEl.classList.add('task-completing-anim');
        setTimeout(async () => {
            await toggleItemComplete(item.id);
            renderCardsView(container);
        }, 180);
    });

    itemEl.querySelector('.btn-edit').addEventListener('click', () => openItemModal(item.id));
    itemEl.querySelector('.btn-del').addEventListener('click', () => {
        if (confirm(`Delete "${item.title}"?`)) deleteItem(item.id);
    });

    return itemEl;
}
