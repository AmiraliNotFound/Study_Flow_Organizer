/**
 * Study Flow Organizer v4.1 - Main Application Controller
 */

import { AppState, subscribe, setAppStateData } from './state.js';
import { loadData, isServerConnected } from './api.js';
import { formatDate } from './dateUtils.js';
import { formatDualDate } from './jalali.js';

import { renderCardsView } from './views/cardsView.js';
import { renderTableView } from './views/tableView.js';
import { renderTimelineView } from './views/timelineView.js';
import { renderKanbanView } from './views/kanbanView.js';

import { openItemModal, initItemModalEvents } from './modals/itemModal.js';
import { openSubjectModal, initSubjectModalEvents } from './modals/subjectModal.js';
import { openFolderModal, initFolderModalEvents } from './modals/folderModal.js';
import { openBackupModal, initBackupModalEvents } from './modals/backupModal.js';

// Renders the currently selected view
export function renderActiveView() {
    const gridContainer = document.getElementById('gridContentView');
    const tableContainer = document.getElementById('tableContentView');
    const timelineContainer = document.getElementById('timelineContentView');
    const kanbanContainer = document.getElementById('kanbanContentView');

    if (!gridContainer || !tableContainer || !timelineContainer || !kanbanContainer) return;

    gridContainer.classList.toggle('hidden', AppState.currentView !== 'grid');
    tableContainer.classList.toggle('hidden', AppState.currentView !== 'table');
    timelineContainer.classList.toggle('hidden', AppState.currentView !== 'timeline');
    kanbanContainer.classList.toggle('hidden', AppState.currentView !== 'kanban');

    if (AppState.currentView === 'grid') {
        renderCardsView(gridContainer);
    } else if (AppState.currentView === 'table') {
        renderTableView(tableContainer);
    } else if (AppState.currentView === 'timeline') {
        renderTimelineView(timelineContainer);
    } else if (AppState.currentView === 'kanban') {
        renderKanbanView(kanbanContainer);
    }

    renderCounters();
    updateDiskFileBadge();
    updateHeaderDateDisplay();
}

function updateHeaderDateDisplay() {
    const dateHeader = document.getElementById('headerCurrentDateText');
    if (!dateHeader) return;
    const now = new Date();
    const dual = formatDualDate(now);
    const greg = formatDate(now);
    if (dual) {
        dateHeader.innerHTML = `
            <span>${greg.weekday}, ${greg.shortDate}</span>
            <span style="opacity: 0.6; margin: 0 4px;">•</span>
            <span style="color: #38BDF8; font-weight: 600;">${dual.shamsiFullPersian}</span>
        `;
    } else {
        dateHeader.textContent = greg.fullDisplay;
    }
}

// Updates statistics strip in toolbar
function renderCounters() {
    const total = AppState.items.length;
    const tasksCount = AppState.items.filter(i => i.kind === 'task').length;
    const eventsCount = AppState.items.filter(i => i.kind === 'event').length;
    const completedCount = AppState.items.filter(i => i.completed).length;

    const now = Date.now();
    const urgentCount = AppState.items.filter(i => {
        if (i.completed) return false;
        const diffHours = (new Date(i.dueDate).getTime() - now) / (1000 * 60 * 60);
        return diffHours <= 48;
    }).length;

    const elTotal = document.getElementById('statTotalTasks');
    const elTasks = document.getElementById('statCountTasks');
    const elEvents = document.getElementById('statCountEvents');
    const elUrgent = document.getElementById('statUrgentTasks');
    const elCompleted = document.getElementById('statCompletedTasks');

    if (elTotal) elTotal.textContent = String(total);
    if (elTasks) elTasks.textContent = String(tasksCount);
    if (elEvents) elEvents.textContent = String(eventsCount);
    if (elUrgent) elUrgent.textContent = String(urgentCount);
    if (elCompleted) elCompleted.textContent = String(completedCount);
}

// Update status badge in header
function updateDiskFileBadge() {
    const badge = document.getElementById('diskSyncBadge');
    const text = document.getElementById('diskSyncText');
    if (!badge || !text) return;

    if (isServerConnected()) {
        badge.className = 'disk-sync-badge';
        text.textContent = '🟢 AppData Sync: Active';
    } else {
        badge.className = 'disk-sync-badge unlinked';
        text.textContent = '🟠 Browser Mode (localStorage)';
    }
}

// View switcher
function switchView(viewName) {
    AppState.currentView = viewName;
    document.querySelectorAll('.view-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    renderActiveView();
}

// Filter pills
function setFilter(filterName) {
    AppState.activeFilter = filterName;
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filterName);
    });
    renderActiveView();
}

// Setup all event listeners
function initAppEvents() {
    // Header action buttons
    document.getElementById('headerNewTaskBtn')?.addEventListener('click', () => openItemModal(null, null, 'task'));
    document.getElementById('headerNewEventBtn')?.addEventListener('click', () => openItemModal(null, null, 'event'));
    document.getElementById('headerNewMaterialBtn')?.addEventListener('click', () => openFolderModal());
    document.getElementById('headerNewSubjectBtn')?.addEventListener('click', () => openSubjectModal());
    document.getElementById('diskSyncBadge')?.addEventListener('click', openBackupModal);
    document.getElementById('btnBackupModalHeader')?.addEventListener('click', openBackupModal);
    document.getElementById('btnShortcutsHeader')?.addEventListener('click', () => {
        document.getElementById('shortcutsModal')?.classList.add('is-active');
    });

    // Shortcuts modal close
    document.getElementById('shortcutsModalCloseBtn')?.addEventListener('click', () => {
        document.getElementById('shortcutsModal')?.classList.remove('is-active');
    });
    document.getElementById('btnCloseShortcuts')?.addEventListener('click', () => {
        document.getElementById('shortcutsModal')?.classList.remove('is-active');
    });

    // Search bar
    const searchInput = document.getElementById('globalSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    searchInput?.addEventListener('input', (e) => {
        AppState.searchQuery = e.target.value;
        if (clearSearchBtn) clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
        renderActiveView();
    });

    clearSearchBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        AppState.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderActiveView();
    });

    // View tabs
    document.querySelectorAll('.view-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            openItemModal(null, null, 'task');
        }
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.is-active').forEach(m => m.classList.remove('is-active'));
        }
        if ((e.ctrlKey && e.key.toLowerCase() === 'f') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))) {
            e.preventDefault();
            searchInput?.focus();
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            const views = ['grid', 'table', 'timeline', 'kanban'];
            const nextIdx = (views.indexOf(AppState.currentView) + 1) % views.length;
            switchView(views[nextIdx]);
        }
    });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('is-active');
        }
    });
}

// Bootstrap
window.addEventListener('DOMContentLoaded', async () => {
    initItemModalEvents();
    initSubjectModalEvents();
    initFolderModalEvents();
    initBackupModalEvents();
    initAppEvents();

    subscribe(() => {
        renderActiveView();
    });

    const result = await loadData();
    if (result.success && result.data) {
        setAppStateData(result.data);
    } else {
        renderActiveView();
    }

    setInterval(() => {
        renderCounters();
        updateHeaderDateDisplay();
    }, 60000);
});
