/**
 * Proportional Deadlines Timeline View Renderer
 */

import { AppState, SUBJECT_GRADIENTS, getFilteredItems, toggleItemComplete } from '../state.js';
import { formatDate, calculateRemainingTime, sortItemsChronologically, escapeHtml } from '../dateUtils.js';
import { openItemModal } from '../modals/itemModal.js';

export function renderTimelineView(container) {
    if (!container) return;
    container.innerHTML = "";

    const sortedItems = sortItemsChronologically(getFilteredItems());

    if (sortedItems.length === 0) {
        container.innerHTML = `
            <div class="empty-workspace-banner">
                <div class="empty-icon-circle">📅</div>
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

    // Header
    const header = document.createElement('div');
    header.className = 'timeline-header-box';
    header.innerHTML = `
        <h2>Proportional Deadlines Timeline</h2>
        <p>Vertical spacing between milestones scales proportionally to actual time intervals</p>
    `;
    wrapper.appendChild(header);

    // Spine
    const spine = document.createElement('div');
    spine.className = 'timeline-spine';

    // "NOW" anchor
    const nowAnchor = document.createElement('div');
    nowAnchor.className = 'timeline-now-anchor';
    const nowFormatted = formatDate(new Date());
    nowAnchor.innerHTML = `
        <div class="timeline-now-dot">⏳</div>
        <div class="timeline-now-pill">
            <span>NOW: ${nowFormatted.primaryDisplay}</span>
        </div>
    `;
    spine.appendChild(nowAnchor);

    // Iterate through items
    let prevDate = new Date();

    sortedItems.forEach((item, index) => {
        const itemDate = new Date(item.dueDate);
        const diffMs = itemDate.getTime() - prevDate.getTime();
        const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

        // Proportional gap spacer
        const gapHeight = Math.min(120, Math.max(16, diffDays * 12));
        const gapSpacer = document.createElement('div');
        gapSpacer.className = 'timeline-gap-spacer';
        gapSpacer.style.height = `${gapHeight}px`;

        let gapText = diffDays === 0 ? "Same day" : (diffDays === 1 ? "Next day (+1d)" : `Gap: ${diffDays} days`);
        if (index === 0 && diffMs > 0) {
            gapText = `First deadline in ${diffDays} days`;
        }

        gapSpacer.innerHTML = `<span class="timeline-gap-indicator">⏳ ${gapText}</span>`;
        spine.appendChild(gapSpacer);

        // Subject info
        const subj = AppState.subjects.find(s => s.id === item.subjectId) || { title: "General", gradientIndex: 0 };
        const gradient = SUBJECT_GRADIENTS[subj.gradientIndex || 0] || SUBJECT_GRADIENTS[0];

        const remaining = calculateRemainingTime(itemDate);
        const formatted = formatDate(itemDate);
        const isTask = item.kind === 'task';

        const node = document.createElement('div');
        node.className = `timeline-node ${item.completed ? 'is-completed' : ''} ${!item.completed && remaining.isUrgent ? 'is-urgent' : ''}`;
        node.innerHTML = `
            <div class="timeline-node-dot"></div>
            <div class="timeline-node-card">
                <div class="timeline-card-header">
                    <span class="timeline-subject-tag" style="background: ${gradient.css};">
                        ${escapeHtml(subj.title)}
                    </span>
                    <span class="compact-urgency-badge ${item.completed ? 'completed' : remaining.urgencyLevel}">
                        ${item.completed ? '✅ Done' : remaining.friendlyText}
                    </span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 700; font-size: 0.95rem; color: #F8FAFC; margin-bottom: 3px;">
                            ${item.typeIcon || (isTask ? '📋' : '📅')} ${escapeHtml(item.title)}
                        </div>
                        <div style="font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
                            <span>🗓️ ${formatted.fullDisplay}</span>
                            ${item.extraInfo?.location ? `<span>📍 ${escapeHtml(item.extraInfo.location)}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button type="button" class="btn btn-sm ${item.completed ? 'btn-secondary' : 'btn-outline-cyan'} btn-tl-complete">
                            ${item.completed ? 'Reopen' : 'Complete'}
                        </button>
                        <button type="button" class="compact-action-btn btn-tl-edit" title="Edit">
                            ✏️
                        </button>
                    </div>
                </div>
            </div>
        `;

        node.querySelector('.btn-tl-complete').addEventListener('click', () => toggleItemComplete(item.id));
        node.querySelector('.btn-tl-edit').addEventListener('click', () => openItemModal(item.id));

        spine.appendChild(node);
        prevDate = itemDate;
    });

    wrapper.appendChild(spine);
    container.appendChild(wrapper);
}
