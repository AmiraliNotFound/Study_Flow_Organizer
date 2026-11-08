/**
 * Proportional Deadlines Timeline View Renderer
 * 
 * Features:
 * 1. Mathematically Accurate "Current Location" Anchor (positioned between past and upcoming milestones)
 * 2. Proportional Vertical Spacing across past, current location, and future events
 * 3. Quick "Jump to Current Location" Navigation
 * 4. Custom Checkbox and 3-Dot Overflow Menu with Edit and Delete options
 */

import { AppState, SUBJECT_GRADIENTS, getFilteredItems, toggleItemComplete, deleteItem } from '../state.js';
import { formatDate, calculateRemainingTime, sortItemsChronologically, escapeHtml } from '../dateUtils.js';
import { openItemModal } from '../modals/itemModal.js';

export function renderTimelineView(container) {
    if (!container) return;
    container.innerHTML = "";

    const sortedItems = sortItemsChronologically(getFilteredItems());

    if (sortedItems.length === 0) {
        container.innerHTML = `
            <div class="empty-workspace-banner">
                <div class="empty-icon-circle">⏳</div>
                <h3>No deadlines recorded yet</h3>
                <p>As you add assignments, projects, quizzes, and exams, the smart proportional timeline will map them here.</p>
                <button type="button" class="btn btn-primary" id="btnEmptyTimelineAddItem">
                    ➕ Add First Item
                </button>
            </div>
        `;
        container.querySelector('#btnEmptyTimelineAddItem')?.addEventListener('click', () => openItemModal());
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'timeline-view-wrapper';

    // Header with "Jump to Current Location" button
    const header = document.createElement('div');
    header.className = 'timeline-header-box';
    header.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div>
                <h2>⏳ Proportional Deadlines Timeline</h2>
                <p>Vertical spacing scales proportionally to actual time intervals • Positioned around Current Location</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btnJumpToNow">
                📍 Jump to Current Location
            </button>
        </div>
    `;
    wrapper.appendChild(header);

    const spine = document.createElement('div');
    spine.className = 'timeline-spine';

    const now = new Date();
    const nowTime = now.getTime();
    const nowFormatted = formatDate(now);

    // Split items into past items and future items relative to now
    const pastItems = sortedItems.filter(item => new Date(item.dueDate).getTime() < nowTime);
    const futureItems = sortedItems.filter(item => new Date(item.dueDate).getTime() >= nowTime);

    // Function to create "NOW / Current Location" anchor element (Req 4)
    function createNowAnchor(label = "CURRENT LOCATION (TODAY)") {
        const nowAnchor = document.createElement('div');
        nowAnchor.className = 'timeline-now-anchor timeline-current-location';
        nowAnchor.id = 'timelineCurrentLocationAnchor';
        nowAnchor.innerHTML = `
            <div class="timeline-now-dot-wrap">
                <span class="timeline-radar-pulse"></span>
                <div class="timeline-now-dot">📍</div>
            </div>
            <div class="timeline-now-pill">
                <span class="pill-label">${label}:</span>
                <span class="pill-date">${nowFormatted.primaryDisplay}</span>
            </div>
        `;
        return nowAnchor;
    }

    // Function to create a gap spacer element
    function createGapSpacer(diffMs, customText = null, isPast = false) {
        const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        const gapHeight = Math.min(100, Math.max(34, diffDays * 9));

        const gapSpacer = document.createElement('div');
        gapSpacer.className = `timeline-gap-spacer ${isPast ? 'is-past-gap' : ''}`;
        gapSpacer.style.height = `${gapHeight}px`;

        let text = customText;
        if (!text) {
            text = diffDays === 0 ? "Same day" : (diffDays === 1 ? "Next day (+1d)" : `Gap: ${diffDays} days`);
        }

        gapSpacer.innerHTML = `<span class="timeline-gap-indicator">⏳ ${text}</span>`;
        return gapSpacer;
    }

    // 1. Render Past Items (if any)
    let prevDate = pastItems.length > 0 ? new Date(pastItems[0].dueDate) : null;

    pastItems.forEach((item, index) => {
        const itemDate = new Date(item.dueDate);
        if (index > 0 && prevDate) {
            const gapMs = itemDate.getTime() - prevDate.getTime();
            spine.appendChild(createGapSpacer(gapMs, null, true));
        }
        spine.appendChild(createTimelineNode(item, true, container));
        prevDate = itemDate;
    });

    // Spacer from last past item to NOW (if past items exist)
    if (pastItems.length > 0) {
        const diffToNow = nowTime - prevDate.getTime();
        const daysAgo = Math.max(0, Math.round(diffToNow / (1000 * 60 * 60 * 24)));
        const gapText = daysAgo === 0 ? "Earlier today" : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
        spine.appendChild(createGapSpacer(diffToNow, gapText, true));
    }

    // 2. Render "NOW / Current Location" Anchor
    spine.appendChild(createNowAnchor(pastItems.length > 0 ? "CURRENT LOCATION (NOW)" : "TODAY (CURRENT LOCATION)"));

    // Spacer from NOW to first future item (if future items exist)
    if (futureItems.length > 0) {
        const firstFutureDate = new Date(futureItems[0].dueDate);
        const diffFromNow = firstFutureDate.getTime() - nowTime;
        const daysAhead = Math.max(0, Math.round(diffFromNow / (1000 * 60 * 60 * 24)));
        const gapText = daysAhead === 0 ? "Later today" : (daysAhead === 1 ? "First deadline tomorrow" : `First deadline in ${daysAhead} days`);
        spine.appendChild(createGapSpacer(diffFromNow, gapText, false));
        prevDate = firstFutureDate;
    }

    // 3. Render Future Items
    futureItems.forEach((item, index) => {
        const itemDate = new Date(item.dueDate);
        if (index > 0 && prevDate) {
            const gapMs = itemDate.getTime() - prevDate.getTime();
            spine.appendChild(createGapSpacer(gapMs, null, false));
        }
        spine.appendChild(createTimelineNode(item, false, container));
        prevDate = itemDate;
    });

    wrapper.appendChild(spine);
    container.appendChild(wrapper);

    // Jump to Now button click handler
    header.querySelector('#btnJumpToNow')?.addEventListener('click', () => {
        const anchor = document.getElementById('timelineCurrentLocationAnchor');
        if (anchor) {
            anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
            anchor.classList.add('anchor-highlight');
            setTimeout(() => anchor.classList.remove('anchor-highlight'), 1200);
        }
    });

    // Close any floating timeline 3-dot menus on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.timeline-menu-dropdown-wrap')) {
            document.querySelectorAll('.timeline-dropdown-floating-menu').forEach(m => m.classList.add('hidden'));
        }
    });
}

/**
 * Creates individual timeline item card with custom checkbox and 3-dot dropdown menu (Req 6)
 */
function createTimelineNode(item, isPast, container) {
    const itemDate = new Date(item.dueDate);
    const subj = AppState.subjects.find(s => s.id === item.subjectId) || { title: "General Course", gradientIndex: 0 };
    const gradient = SUBJECT_GRADIENTS[subj.gradientIndex || 0] || SUBJECT_GRADIENTS[0];

    const remaining = calculateRemainingTime(itemDate);
    const formatted = formatDate(itemDate);
    const isTask = item.kind === 'task';

    const node = document.createElement('div');
    node.className = `timeline-node ${item.completed ? 'is-completed' : ''} ${!item.completed && remaining.isUrgent ? 'is-urgent' : ''} ${isPast ? 'is-past-node' : ''}`;

    let urgencyBadge = remaining.friendlyText;
    let urgencyClass = remaining.urgencyLevel;
    if (item.completed) {
        urgencyBadge = "✅ Completed";
        urgencyClass = "completed";
    } else if (isPast) {
        urgencyBadge = "⚠️ Past Deadline";
        urgencyClass = "overdue";
    }

    node.innerHTML = `
        <div class="timeline-node-dot"></div>
        <div class="timeline-node-card">
            <div class="timeline-card-header">
                <span class="timeline-subject-tag" style="background: ${gradient.css};">
                    ${escapeHtml(subj.title)}
                </span>
                <span class="compact-urgency-badge ${urgencyClass}">
                    ${urgencyBadge}
                </span>
            </div>
            <div class="timeline-card-content-row">
                <div class="timeline-card-main-info">
                    <div class="timeline-item-title ${item.completed ? 'completed-text' : ''}">
                        ${item.typeIcon || (isTask ? '📋' : '📅')} ${escapeHtml(item.title)}
                    </div>
                    <div class="timeline-item-meta">
                        <span>🗓️ ${formatted.fullDisplay}</span>
                        ${item.extraInfo?.location ? `<span>• 📍 ${escapeHtml(item.extraInfo.location)}</span>` : ''}
                    </div>
                </div>

                <!-- Custom Checkbox + 3-Dot Menu (Req 6) -->
                <div class="timeline-node-actions">
                    <!-- Custom Checkbox -->
                    <div class="compact-checkbox ${item.completed ? 'checked' : ''}" title="${item.completed ? 'Reopen item' : 'Mark as completed'}">
                        ${item.completed ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                    </div>

                    <!-- 3-Dot More Menu Dropdown -->
                    <div class="timeline-menu-dropdown-wrap">
                        <button type="button" class="timeline-dots-menu-btn" title="Options">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <circle cx="12" cy="5" r="2"/>
                                <circle cx="12" cy="12" r="2"/>
                                <circle cx="12" cy="19" r="2"/>
                            </svg>
                        </button>
                        <div class="timeline-dropdown-floating-menu hidden">
                            <button type="button" class="timeline-dropdown-item btn-tl-edit">
                                <span>✏️</span> <span>Edit</span>
                            </button>
                            <button type="button" class="timeline-dropdown-item btn-tl-delete danger">
                                <span>🗑️</span> <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Checkbox toggle
    node.querySelector('.compact-checkbox').addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleItemComplete(item.id);
        renderTimelineView(container);
    });

    // 3-Dot Menu toggle
    const dotsBtn = node.querySelector('.timeline-dots-menu-btn');
    const menu = node.querySelector('.timeline-dropdown-floating-menu');

    dotsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = menu.classList.contains('hidden');
        document.querySelectorAll('.timeline-dropdown-floating-menu').forEach(m => m.classList.add('hidden'));
        if (isHidden) menu.classList.remove('hidden');
    });

    // Edit Item
    node.querySelector('.btn-tl-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.add('hidden');
        openItemModal(item.id);
    });

    // Delete Item
    node.querySelector('.btn-tl-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        menu.classList.add('hidden');
        if (confirm(`Delete "${item.title}"?`)) {
            await deleteItem(item.id);
            renderTimelineView(container);
        }
    });

    return node;
}
