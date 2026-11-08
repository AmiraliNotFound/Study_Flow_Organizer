/**
 * Academic Calendar View Renderer
 * 
 * Features:
 * 1. Full Monthly Academic Calendar Grid
 * 2. Dual Gregorian & Shamsi (Jalali) Date Displays
 * 3. Responsive Day Cells with Task/Event chips color-coded by Course
 * 4. Day-Click / '+' button to quick-add assignments for that date
 * 5. Respects Search, Active Status Filters & Course Tag Filters
 */

import { AppState, SUBJECT_GRADIENTS, getFilteredItems } from '../state.js';
import { GREGORIAN_MONTH_NAMES_EN, JALALI_MONTH_NAMES_EN, gregorianToJalali } from '../jalali.js';
import { escapeHtml } from '../dateUtils.js';
import { openItemModal } from '../modals/itemModal.js';

let calendarDate = new Date();

export function renderCalendarView(container) {
    if (!container) return;
    container.innerHTML = "";

    const filteredItems = getFilteredItems();

    const currentYear = calendarDate.getFullYear();
    const currentMonth = calendarDate.getMonth(); // 0-11

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun, 6=Sat
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Determine dual month info for header (Gregorian month + Shamsi month range)
    const midMonthGreg = new Date(currentYear, currentMonth, 15);
    const midJalali = gregorianToJalali(midMonthGreg.getFullYear(), midMonthGreg.getMonth() + 1, midMonthGreg.getDate());
    const jalaliMonthObj = JALALI_MONTH_NAMES_EN[midJalali.jm - 1] || JALALI_MONTH_NAMES_EN[0];
    const gregMonthName = GREGORIAN_MONTH_NAMES_EN[currentMonth];

    const today = new Date();
    const isThisCurrentRealMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

    const wrapper = document.createElement('div');
    wrapper.className = 'calendar-view-container view-flow-in';

    // Top Header: Month Switcher & Title
    const header = document.createElement('div');
    header.className = 'calendar-nav-header';
    header.innerHTML = `
        <div class="calendar-title-group">
            <h2 class="calendar-month-heading">
                ${gregMonthName} <span class="calendar-year-sub">${currentYear}</span>
            </h2>
            <div class="calendar-shamsi-badge">
                <span>🗓️ ${jalaliMonthObj.nameEn} ${midJalali.jy}</span>
            </div>
        </div>

        <div class="calendar-controls-group">
            <button type="button" class="btn btn-secondary btn-sm" id="btnCalPrev">‹ Previous</button>
            <button type="button" class="btn btn-secondary btn-sm ${isThisCurrentRealMonth ? 'btn-outline-cyan' : ''}" id="btnCalToday">Today</button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnCalNext">Next ›</button>
            <button type="button" class="btn btn-primary btn-sm" id="btnCalAddNew">➕ Add Task</button>
        </div>
    `;

    header.querySelector('#btnCalPrev').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendarView(container);
    });

    header.querySelector('#btnCalToday').addEventListener('click', () => {
        calendarDate = new Date();
        renderCalendarView(container);
    });

    header.querySelector('#btnCalNext').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendarView(container);
    });

    header.querySelector('#btnCalAddNew').addEventListener('click', () => {
        openItemModal();
    });

    wrapper.appendChild(header);

    // Weekdays Strip (Sun - Sat)
    const weekdaysStrip = document.createElement('div');
    weekdaysStrip.className = 'calendar-weekdays-row';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'calendar-weekday-cell';
        cell.textContent = day;
        weekdaysStrip.appendChild(cell);
    });
    wrapper.appendChild(weekdaysStrip);

    // Month Days Grid
    const grid = document.createElement('div');
    grid.className = 'calendar-month-grid';

    // Group filtered items by date key 'YYYY-MM-DD'
    const itemsByDateKey = new Map();
    filteredItems.forEach(item => {
        if (!item.dueDate) return;
        const d = new Date(item.dueDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!itemsByDateKey.has(key)) itemsByDateKey.set(key, []);
        itemsByDateKey.get(key).push(item);
    });

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
        grid.appendChild(createDayCell({
            year: prevMonthYear,
            month: prevMonthIdx,
            day: dayNum,
            isOtherMonth: true,
            isToday: false,
            items: []
        }));
    }

    // 2. Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const dayItems = itemsByDateKey.get(dateKey) || [];
        const isToday = isThisCurrentRealMonth && today.getDate() === dayNum;

        grid.appendChild(createDayCell({
            year: currentYear,
            month: currentMonth,
            day: dayNum,
            isOtherMonth: false,
            isToday,
            items: dayItems
        }));
    }

    // 3. Next month leading days (fill up to complete weeks)
    const totalCells = firstDayIndex + daysInCurrentMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
        const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
        grid.appendChild(createDayCell({
            year: nextMonthYear,
            month: nextMonthIdx,
            day: dayNum,
            isOtherMonth: true,
            isToday: false,
            items: []
        }));
    }

    wrapper.appendChild(grid);
    container.appendChild(wrapper);
}

/**
 * Creates individual day cell in month calendar
 */
function createDayCell({ year, month, day, isOtherMonth, isToday, items }) {
    const cell = document.createElement('div');
    cell.className = `calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'is-today-cell' : ''}`;

    // Dual Date: Compute Shamsi Day
    const jDate = gregorianToJalali(year, month + 1, day);

    const cellHeader = document.createElement('div');
    cellHeader.className = 'calendar-day-header';
    cellHeader.innerHTML = `
        <div class="calendar-day-numbers">
            <span class="day-greg-num ${isToday ? 'today-pill' : ''}">${day}</span>
            <span class="day-shamsi-sub">${jDate.jd}</span>
        </div>
        ${!isOtherMonth ? `<button type="button" class="btn-cal-add-day" title="Add item for this day">+</button>` : ''}
    `;

    if (!isOtherMonth) {
        cellHeader.querySelector('.btn-cal-add-day')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetDate = new Date(year, month, day, 23, 59, 0);
            openItemModal(null, null, 'task', targetDate.toISOString());
        });
    }

    cell.appendChild(cellHeader);

    // Items Container
    const itemsList = document.createElement('div');
    itemsList.className = 'calendar-day-items-list';

    items.forEach(item => {
        const subj = AppState.subjects.find(s => s.id === item.subjectId) || { title: "General", gradientIndex: 0 };
        const gradient = SUBJECT_GRADIENTS[subj.gradientIndex || 0] || SUBJECT_GRADIENTS[0];
        const isTask = item.kind === 'task';

        const chip = document.createElement('div');
        chip.className = `calendar-item-chip ${item.completed ? 'is-completed' : ''}`;
        chip.title = `${item.title} (${subj.title}) - ${item.completed ? 'Completed' : 'Pending'}`;
        chip.style.borderLeftColor = gradient.primary || 'var(--palette-stormy-teal)';

        chip.innerHTML = `
            <span class="chip-icon">${item.typeIcon || (isTask ? '📋' : '📅')}</span>
            <span class="chip-title">${escapeHtml(item.title)}</span>
        `;

        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            openItemModal(item.id);
        });

        itemsList.appendChild(chip);
    });

    cell.appendChild(itemsList);
    return cell;
}
