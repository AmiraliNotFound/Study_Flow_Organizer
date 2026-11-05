/**
 * Add / Edit Item (Task or Event) Modal Controller
 */

import { AppState, addOrUpdateItem } from '../state.js';
import { formatDate, calculateRemainingTime, getDatePreset } from '../dateUtils.js';

let activeItemId = null;
let activeKind = 'task';
let activeTypeId = 'tt_hw';

export function openItemModal(itemId = null, preselectedSubjectId = null, defaultKind = 'task') {
    const modal = document.getElementById('itemModal');
    if (!modal) return;

    activeItemId = itemId;
    activeKind = defaultKind;

    const modalTitle = document.getElementById('itemModalTitle');
    const form = document.getElementById('itemForm');
    form.reset();

    // Populate Subjects Dropdown
    const subjectSelect = document.getElementById('itemSubjectSelect');
    subjectSelect.innerHTML = AppState.subjects.map(s => `
        <option value="${s.id}">${s.title} ${s.code ? `(${s.code})` : ''}</option>
    `).join('');

    if (AppState.subjects.length === 0) {
        alert("Please create a course subject before adding tasks or events.");
        return;
    }

    if (itemId) {
        const item = AppState.items.find(i => i.id === itemId);
        if (item) {
            modalTitle.textContent = item.kind === 'task' ? 'Edit Task' : 'Edit Event';
            activeKind = item.kind;
            activeTypeId = item.typeId;

            subjectSelect.value = item.subjectId;
            document.getElementById('itemTitleInput').value = item.title;
            document.getElementById('taskDetailNumber').value = item.extraInfo?.number || '';
            document.getElementById('eventDetailNumber').value = item.extraInfo?.number || '';
            document.getElementById('eventLocationInput').value = item.extraInfo?.location || '';
            document.getElementById('itemNotesInput').value = item.extraInfo?.notes || '';

            const d = new Date(item.dueDate);
            const dateStr = d.toISOString().slice(0, 10);
            const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            document.getElementById('itemDateInput').value = dateStr;
            document.getElementById('itemTimeInput').value = timeStr;
        }
    } else {
        modalTitle.textContent = defaultKind === 'task' ? 'Add Task' : 'Add Event';
        if (preselectedSubjectId) {
            subjectSelect.value = preselectedSubjectId;
        }
        // Default date: Tomorrow 23:59
        applyDatePreset(1, 23, 59);
    }

    setKind(activeKind);
    updateTypePills();
    updateDatePreview();

    modal.classList.add('is-active');
}

export function closeItemModal() {
    const modal = document.getElementById('itemModal');
    if (modal) modal.classList.remove('is-active');
    activeItemId = null;
}

function setKind(kind) {
    activeKind = kind;
    const btnTask = document.getElementById('btnKindTask');
    const btnEvent = document.getElementById('btnKindEvent');
    const taskFields = document.getElementById('taskExtraFieldsWrap');
    const eventFields = document.getElementById('eventExtraFieldsWrap');

    if (kind === 'task') {
        btnTask.className = 'kind-tab-btn active kind-task';
        btnEvent.className = 'kind-tab-btn';
        taskFields.classList.remove('hidden');
        eventFields.classList.add('hidden');
        activeTypeId = AppState.config.taskTypes[0]?.id || 'tt_hw';
    } else {
        btnTask.className = 'kind-tab-btn';
        btnEvent.className = 'kind-tab-btn active kind-event';
        taskFields.classList.add('hidden');
        eventFields.classList.remove('hidden');
        activeTypeId = AppState.config.eventTypes[0]?.id || 'et_quiz';
    }

    updateTypePills();
}

function updateTypePills() {
    const container = document.getElementById('modalTypePillsWrap');
    if (!container) return;

    const types = activeKind === 'task' ? AppState.config.taskTypes : AppState.config.eventTypes;
    container.innerHTML = '';

    types.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `type-pill-btn ${t.id === activeTypeId ? 'active' : ''}`;
        btn.innerHTML = `<span>${t.icon}</span> <span>${t.name}</span>`;
        btn.addEventListener('click', () => {
            activeTypeId = t.id;
            updateTypePills();
            autoUpdateTitle();
        });
        container.appendChild(btn);
    });
}

function autoUpdateTitle() {
    const titleInput = document.getElementById('itemTitleInput');
    if (activeItemId) return; // Don't overwrite existing title when editing

    const types = activeKind === 'task' ? AppState.config.taskTypes : AppState.config.eventTypes;
    const typeObj = types.find(t => t.id === activeTypeId) || types[0];
    const numInput = activeKind === 'task'
        ? document.getElementById('taskDetailNumber').value.trim()
        : document.getElementById('eventDetailNumber').value.trim();

    if (numInput) {
        titleInput.value = `${typeObj.name} #${numInput}`;
    } else {
        titleInput.value = typeObj.name;
    }
}

export function applyDatePreset(daysAhead, hours, minutes) {
    const preset = getDatePreset(daysAhead, hours, minutes);
    const dateInput = document.getElementById('itemDateInput');
    const timeInput = document.getElementById('itemTimeInput');
    if (dateInput && timeInput) {
        dateInput.value = preset.toISOString().slice(0, 10);
        timeInput.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        updateDatePreview();
    }
}

export function updateDatePreview() {
    const dateInput = document.getElementById('itemDateInput');
    const timeInput = document.getElementById('itemTimeInput');
    const previewDate = document.getElementById('previewGregorianDate');
    const previewRemaining = document.getElementById('previewRemainingTime');
    const previewDayOfWeek = document.getElementById('previewDayOfWeekTag');

    if (!dateInput || !timeInput || !previewDate) return;

    const dateVal = dateInput.value;
    const timeVal = timeInput.value || '23:59';
    if (!dateVal) return;

    const [y, m, d] = dateVal.split('-').map(Number);
    const [hh, mm] = timeVal.split(':').map(Number);
    const targetDate = new Date(y, m - 1, d, hh, mm, 0);

    const formatted = formatDate(targetDate);
    const remaining = calculateRemainingTime(targetDate);

    previewDate.textContent = formatted.fullDisplay;
    if (previewDayOfWeek) previewDayOfWeek.textContent = formatted.weekday;

    if (previewRemaining) {
        previewRemaining.textContent = remaining.isUrgent
            ? `🚨 ${remaining.friendlyText}`
            : `⏳ ${remaining.friendlyText}`;
        previewRemaining.style.color = remaining.isUrgent ? '#F87171' : '#94A3B8';
    }
}

export function initItemModalEvents() {
    document.getElementById('btnKindTask')?.addEventListener('click', () => setKind('task'));
    document.getElementById('btnKindEvent')?.addEventListener('click', () => setKind('event'));

    document.getElementById('taskDetailNumber')?.addEventListener('input', autoUpdateTitle);
    document.getElementById('eventDetailNumber')?.addEventListener('input', autoUpdateTitle);

    document.getElementById('itemDateInput')?.addEventListener('change', updateDatePreview);
    document.getElementById('itemTimeInput')?.addEventListener('change', updateDatePreview);

    document.getElementById('presetBtn0')?.addEventListener('click', () => applyDatePreset(0, 23, 59));
    document.getElementById('presetBtn1')?.addEventListener('click', () => applyDatePreset(1, 23, 59));
    document.getElementById('presetBtn2')?.addEventListener('click', () => applyDatePreset(2, 23, 59));
    document.getElementById('presetBtn5')?.addEventListener('click', () => applyDatePreset(5, 23, 59));
    document.getElementById('presetBtn7')?.addEventListener('click', () => applyDatePreset(7, 23, 59));

    document.getElementById('itemModalCloseBtn')?.addEventListener('click', closeItemModal);
    document.getElementById('btnCancelItem')?.addEventListener('click', closeItemModal);

    document.getElementById('itemForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectId = document.getElementById('itemSubjectSelect').value;
        const title = document.getElementById('itemTitleInput').value.trim();
        const dateVal = document.getElementById('itemDateInput').value;
        const timeVal = document.getElementById('itemTimeInput').value || '23:59';

        if (!title) {
            alert('Title is required');
            return;
        }
        if (!dateVal) {
            alert('Due date is required');
            return;
        }

        const [y, m, d] = dateVal.split('-').map(Number);
        const [hh, mm] = timeVal.split(':').map(Number);
        const dueDate = new Date(y, m - 1, d, hh, mm, 0).toISOString();

        const types = activeKind === 'task' ? AppState.config.taskTypes : AppState.config.eventTypes;
        const matchedType = types.find(t => t.id === activeTypeId) || types[0];

        const itemPayload = {
            id: activeItemId,
            kind: activeKind,
            typeId: matchedType.id,
            typeName: matchedType.name,
            typeIcon: matchedType.icon,
            subjectId,
            title,
            dueDate,
            extraInfo: {
                number: activeKind === 'task'
                    ? document.getElementById('taskDetailNumber').value.trim()
                    : document.getElementById('eventDetailNumber').value.trim(),
                location: activeKind === 'event'
                    ? document.getElementById('eventLocationInput').value.trim()
                    : '',
                notes: document.getElementById('itemNotesInput').value.trim()
            }
        };

        await addOrUpdateItem(itemPayload);
        closeItemModal();
    });
}
