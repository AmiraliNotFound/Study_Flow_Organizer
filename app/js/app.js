/**
 * Study Flow Organizer v4.2 - Main Application Controller
 * Floating Navigation, Flat/Glass Theme Settings, Custom Controls & Master Color Palette
 */

import { AppState, subscribe, setAppStateData } from './state.js';
import { loadData, isServerConnected, openDataDirectory } from './api.js';
import { formatDate } from './dateUtils.js';
import { formatDualDate } from './jalali.js';

import { renderCardsView } from './views/cardsView.js';
import { renderTableView } from './views/tableView.js';
import { renderTimelineView } from './views/timelineView.js';
import { renderKanbanView } from './views/kanbanView.js';

import { openItemModal, initItemModalEvents } from './modals/itemModal.js';
import { openSubjectModal, initSubjectModalEvents } from './modals/subjectModal.js';
import { openFolderModal, initFolderModalEvents } from './modals/folderModal.js';
import { openBackupModal, closeBackupModal, initBackupModalEvents } from './modals/backupModal.js';
import { openAiModal, initAiModalEvents } from './modals/aiModal.js';
import { initQuickAiVoiceEvents } from './services/quickAiVoice.js';

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
    if (dual) {
        dateHeader.innerHTML = `
            <span>${dual.gregFull}</span>
            <span style="opacity: 0.5; margin: 0 5px;">•</span>
            <span style="color: var(--palette-stormy-teal); font-weight: 700;">${dual.shamsiFull}</span>
        `;
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
        text.textContent = 'AppData Storage Active';
    } else {
        badge.className = 'disk-sync-badge unlinked';
        text.textContent = 'Offline (localStorage)';
    }
}

// View switcher
const VIEW_METADATA = {
    grid: { label: 'Cards View', icon: '🗂️' },
    table: { label: 'Matrix Table', icon: '📑' },
    timeline: { label: 'Timeline View', icon: '⏳' },
    kanban: { label: 'Kanban Board', icon: '📌' }
};

function switchView(viewName) {
    if (!VIEW_METADATA[viewName]) return;
    AppState.currentView = viewName;

    const activeIcon = document.getElementById('activeViewIcon');
    const activeLabel = document.getElementById('activeViewLabel');
    if (activeIcon) activeIcon.textContent = VIEW_METADATA[viewName].icon;
    if (activeLabel) activeLabel.textContent = VIEW_METADATA[viewName].label;

    document.querySelectorAll('.view-menu-item').forEach(btn => {
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

// Theme Manager (Glassmorphic vs Flat)
function applyTheme(themeName) {
    const isFlat = themeName === 'flat';
    document.body.classList.toggle('theme-flat', isFlat);
    localStorage.setItem('study_flow_theme_style', isFlat ? 'flat' : 'glass');

    const optGlass = document.getElementById('themeOptionGlass');
    const optFlat = document.getElementById('themeOptionFlat');
    if (optGlass && optFlat) {
        optGlass.classList.toggle('is-active', !isFlat);
        optFlat.classList.toggle('is-active', isFlat);
    }
}

function initTheme() {
    const saved = localStorage.getItem('study_flow_theme_style') || 'glass';
    applyTheme(saved);
}

// Setup all event listeners
function initAppEvents() {
    // 1. Floating "+" Create Button & Dropdown
    const createBtn = document.getElementById('headerMainCreateBtn');
    const createMenu = document.getElementById('headerCreateMenu');

    createBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        createMenu?.classList.toggle('hidden');
    });

    document.getElementById('menuNewTaskBtn')?.addEventListener('click', () => {
        createMenu?.classList.add('hidden');
        openItemModal(null, null, 'task');
    });

    document.getElementById('menuNewEventBtn')?.addEventListener('click', () => {
        createMenu?.classList.add('hidden');
        openItemModal(null, null, 'event');
    });

    document.getElementById('menuNewSubjectBtn')?.addEventListener('click', () => {
        createMenu?.classList.add('hidden');
        openSubjectModal();
    });

    document.getElementById('menuNewMaterialBtn')?.addEventListener('click', () => {
        createMenu?.classList.add('hidden');
        openFolderModal();
    });

    // 2. Compact View Selector Dropdown
    const viewSelectorBtn = document.getElementById('viewSelectorBtn');
    const viewSelectorMenu = document.getElementById('viewSelectorMenu');

    viewSelectorBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        viewSelectorMenu?.classList.toggle('hidden');
    });

    document.querySelectorAll('.view-menu-item').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
            viewSelectorMenu?.classList.add('hidden');
        });
    });

    // Close floating menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!createBtn?.contains(e.target) && !createMenu?.contains(e.target)) {
            createMenu?.classList.add('hidden');
        }
        if (!viewSelectorBtn?.contains(e.target) && !viewSelectorMenu?.contains(e.target)) {
            viewSelectorMenu?.classList.add('hidden');
        }
    });

    // 3. Settings & Storage Modal
    document.getElementById('diskSyncBadge')?.addEventListener('click', openBackupModal);
    document.getElementById('btnSettingsHeader')?.addEventListener('click', openBackupModal);
    document.getElementById('settingsModalCloseBtn')?.addEventListener('click', closeBackupModal);
    document.getElementById('btnCloseSettings')?.addEventListener('click', closeBackupModal);

    // Theme Switcher Options inside Settings
    document.getElementById('themeOptionGlass')?.addEventListener('click', () => applyTheme('glass'));
    document.getElementById('themeOptionFlat')?.addEventListener('click', () => applyTheme('flat'));

    // Open AppData in Explorer from Settings
    document.getElementById('btnSettingsOpenFolder')?.addEventListener('click', async () => {
        await openDataDirectory();
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

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // Edge-Safe Keyboard Shortcuts (Zero overlap with Microsoft Edge / Chromium defaults)
    window.addEventListener('keydown', (e) => {
        // If Escape is pressed, close any open modal or dropdown
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('is-active'));
            createMenu?.classList.add('hidden');
            viewSelectorMenu?.classList.add('hidden');
            return;
        }

        const tag = (document.activeElement?.tagName || '').toUpperCase();
        const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable;

        // If a modal is open, do not trigger background navigation shortcuts
        const isModalOpen = Boolean(document.querySelector('.modal-overlay.is-active'));
        if (isModalOpen) return;

        // 1. New Task / Item: Alt + N, or N when outside inputs (Replaces Ctrl+N which opened new Edge window)
        const isNewItemShortcut = (e.altKey && (e.code === 'KeyN' || e.key?.toLowerCase() === 'n'))
            || (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey && (e.code === 'KeyN' || e.key?.toLowerCase() === 'n'));
        if (isNewItemShortcut) {
            e.preventDefault();
            openItemModal(null, null, 'task');
            return;
        }

        // 2. Focus Global Search: '/' or Alt + S (Replaces Ctrl+F which opened Edge browser find bar)
        const isSearchShortcut = (e.altKey && (e.code === 'KeyS' || e.key?.toLowerCase() === 's'))
            || (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey && (e.code === 'Slash' || e.key === '/'));
        if (isSearchShortcut) {
            e.preventDefault();
            searchInput?.focus();
            return;
        }

        // 3. Switch View: Alt + V, or V when outside inputs (Replaces Ctrl+Shift+V which collided with paste)
        const isSwitchViewShortcut = (e.altKey && (e.code === 'KeyV' || e.key?.toLowerCase() === 'v'))
            || (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey && (e.code === 'KeyV' || e.key?.toLowerCase() === 'v'));
        if (isSwitchViewShortcut) {
            e.preventDefault();
            const views = ['grid', 'table', 'timeline', 'kanban'];
            const nextIdx = (views.indexOf(AppState.currentView) + 1) % views.length;
            switchView(views[nextIdx]);
            return;
        }

        // 4. Quick Number Keys 1-4 for Direct View Switching (when outside inputs)
        if (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
            if (e.code === 'Digit1' || e.key === '1') { e.preventDefault(); switchView('grid'); }
            else if (e.code === 'Digit2' || e.key === '2') { e.preventDefault(); switchView('table'); }
            else if (e.code === 'Digit3' || e.key === '3') { e.preventDefault(); switchView('timeline'); }
            else if (e.code === 'Digit4' || e.key === '4') { e.preventDefault(); switchView('kanban'); }
            else if (e.code === 'Comma' || e.key === ',') { e.preventDefault(); openBackupModal(); }
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
    try { initTheme(); } catch (e) { console.error('[App] initTheme error:', e); }
    try { renderActiveView(); } catch (e) { console.error('[App] renderActiveView error:', e); }
    try { initItemModalEvents(); } catch (e) { console.error('[App] initItemModalEvents error:', e); }
    try { initSubjectModalEvents(); } catch (e) { console.error('[App] initSubjectModalEvents error:', e); }
    try { initFolderModalEvents(); } catch (e) { console.error('[App] initFolderModalEvents error:', e); }
    try { initBackupModalEvents(); } catch (e) { console.error('[App] initBackupModalEvents error:', e); }
    try { initAiModalEvents(); } catch (e) { console.error('[App] initAiModalEvents error:', e); }
    try { initQuickAiVoiceEvents(); } catch (e) { console.error('[App] initQuickAiVoiceEvents error:', e); }
    try { initAppEvents(); } catch (e) { console.error('[App] initAppEvents error:', e); }

    subscribe(() => {
        renderActiveView();
    });

    try {
        const result = await loadData();
        if (result && result.success && result.data) {
            setAppStateData(result.data);
        } else {
            renderActiveView();
        }
    } catch (e) {
        console.warn('[App] Initial data load error:', e);
        renderActiveView();
    }

    setInterval(() => {
        renderCounters();
        updateHeaderDateDisplay();
    }, 60000);
});
