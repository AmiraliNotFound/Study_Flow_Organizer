/**
 * Full Month Calendar Grid Viewer with Dual Day Numbering
 * Features:
 * 1. Interactive Month Navigation (‹ Prev / Next ›)
 * 2. Dual Day Numbering in each grid cell (Gregorian prominent + Shamsi secondary)
 * 3. 100% English Latin text and digits (no Persian/Arabic script)
 * 4. Zero <select> tags - pure custom designed interactive UI
 */

import { gregorianToJalali, jalaliToGregorian, formatDualDate, JALALI_MONTH_NAMES_EN, GREGORIAN_MONTH_NAMES_EN } from '../jalali.js';

export class CustomDatePicker {
    constructor({ container, initialDate = new Date(), onChange = null }) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.selectedDate = initialDate instanceof Date && !isNaN(initialDate) ? new Date(initialDate) : new Date();
        this.viewedYear = this.selectedDate.getFullYear();
        this.viewedMonth = this.selectedDate.getMonth(); // 0 - 11
        this.onChange = onChange;

        this.render();
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'month-calendar-wrapper';

        // 1. Calendar Header (Navigation & Dual Month Display)
        const header = document.createElement('div');
        header.className = 'month-calendar-header';

        const btnPrev = document.createElement('button');
        btnPrev.type = 'button';
        btnPrev.className = 'cal-nav-btn';
        btnPrev.innerHTML = '&#8249;';
        btnPrev.title = 'Previous Month';
        btnPrev.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateMonth(-1);
        });

        const titleBox = document.createElement('div');
        titleBox.className = 'cal-title-box';

        const primaryTitle = document.createElement('div');
        primaryTitle.className = 'cal-primary-title';
        primaryTitle.textContent = `${GREGORIAN_MONTH_NAMES_EN[this.viewedMonth]} ${this.viewedYear}`;

        // Compute Jalali equivalent for the viewed month
        const midMonthDate = new Date(this.viewedYear, this.viewedMonth, 15);
        const { jy, jm } = gregorianToJalali(this.viewedYear, this.viewedMonth + 1, 15);
        const jmObj = JALALI_MONTH_NAMES_EN[jm - 1] || JALALI_MONTH_NAMES_EN[0];

        const secondaryTitle = document.createElement('div');
        secondaryTitle.className = 'cal-secondary-title';
        secondaryTitle.textContent = `${jmObj.nameEn} ${jy}`;

        titleBox.appendChild(primaryTitle);
        titleBox.appendChild(secondaryTitle);

        const btnNext = document.createElement('button');
        btnNext.type = 'button';
        btnNext.className = 'cal-nav-btn';
        btnNext.innerHTML = '&#8250;';
        btnNext.title = 'Next Month';
        btnNext.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateMonth(1);
        });

        header.appendChild(btnPrev);
        header.appendChild(titleBox);
        header.appendChild(btnNext);
        wrapper.appendChild(header);

        // 2. Weekday Header Row (Saturday to Friday)
        const weekdaysRow = document.createElement('div');
        weekdaysRow.className = 'cal-weekdays-row';
        const weekdays = [
            { label: 'Sat', isWeekend: false },
            { label: 'Sun', isWeekend: false },
            { label: 'Mon', isWeekend: false },
            { label: 'Tue', isWeekend: false },
            { label: 'Wed', isWeekend: false },
            { label: 'Thu', isWeekend: false },
            { label: 'Fri', isWeekend: true }
        ];

        weekdays.forEach(w => {
            const cell = document.createElement('div');
            cell.className = `cal-weekday-cell ${w.isWeekend ? 'is-weekend' : ''}`;
            cell.textContent = w.label;
            weekdaysRow.appendChild(cell);
        });
        wrapper.appendChild(weekdaysRow);

        // 3. Days Grid
        const grid = document.createElement('div');
        grid.className = 'cal-days-grid';

        const firstDayOfMonth = new Date(this.viewedYear, this.viewedMonth, 1);
        const daysInMonth = new Date(this.viewedYear, this.viewedMonth + 1, 0).getDate();

        // Convert Sunday-indexed getDay() (0=Sun, 1=Mon, ..., 6=Sat) to Saturday-indexed (0=Sat, 1=Sun, ..., 6=Fri)
        const firstDayDayOfWeek = (firstDayOfMonth.getDay() + 1) % 7;

        // Days from previous month
        const daysInPrevMonth = new Date(this.viewedYear, this.viewedMonth, 0).getDate();
        for (let i = firstDayDayOfWeek - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const prevDate = new Date(this.viewedYear, this.viewedMonth - 1, dayNum);
            const cell = this.createDayCell(prevDate, true);
            grid.appendChild(cell);
        }

        // Days in current month
        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const curDate = new Date(this.viewedYear, this.viewedMonth, dayNum);
            const cell = this.createDayCell(curDate, false);
            grid.appendChild(cell);
        }

        // Days from next month to fill complete grid rows (multiples of 7)
        const totalCells = firstDayDayOfWeek + daysInMonth;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
            const nextDate = new Date(this.viewedYear, this.viewedMonth + 1, dayNum);
            const cell = this.createDayCell(nextDate, true);
            grid.appendChild(cell);
        }

        wrapper.appendChild(grid);

        // 4. Selected Date Summary Footer
        const footer = document.createElement('div');
        footer.className = 'cal-footer-banner';
        const dual = formatDualDate(this.selectedDate);
        if (dual) {
            footer.innerHTML = `
                <div class="cal-footer-icon">📅</div>
                <div class="cal-footer-text">
                    <strong>${dual.gregFull}</strong>
                    <span> • ${dual.shamsiFull}</span>
                </div>
            `;
        }
        wrapper.appendChild(footer);

        this.container.appendChild(wrapper);
    }

    createDayCell(dateObj, isOtherMonth) {
        const cell = document.createElement('div');
        cell.className = 'cal-day-cell';
        if (isOtherMonth) cell.classList.add('is-other-month');

        const gy = dateObj.getFullYear();
        const gm = dateObj.getMonth() + 1;
        const gd = dateObj.getDate();

        // Dual Shamsi conversion
        const { jd } = gregorianToJalali(gy, gm, gd);

        // Check if today
        const now = new Date();
        const isToday = now.getFullYear() === gy && now.getMonth() === dateObj.getMonth() && now.getDate() === gd;
        if (isToday) cell.classList.add('is-today');

        // Check if selected
        const isSelected = this.selectedDate.getFullYear() === gy &&
                           this.selectedDate.getMonth() === dateObj.getMonth() &&
                           this.selectedDate.getDate() === gd;
        if (isSelected) cell.classList.add('is-selected');

        // Primary: Gregorian Day Number
        const gregNum = document.createElement('span');
        gregNum.className = 'cal-num-greg';
        gregNum.textContent = gd;

        // Secondary: Shamsi Day Number (in English Latin digits)
        const shamsiNum = document.createElement('span');
        shamsiNum.className = 'cal-num-shamsi';
        shamsiNum.textContent = jd;

        cell.appendChild(gregNum);
        cell.appendChild(shamsiNum);

        cell.addEventListener('click', (e) => {
            e.preventDefault();
            this.selectDate(dateObj);
        });

        return cell;
    }

    navigateMonth(delta) {
        this.viewedMonth += delta;
        if (this.viewedMonth < 0) {
            this.viewedMonth = 11;
            this.viewedYear -= 1;
        } else if (this.viewedMonth > 11) {
            this.viewedMonth = 0;
            this.viewedYear += 1;
        }
        this.render();
    }

    selectDate(dateObj) {
        // Preserve current time hours/minutes
        const hours = this.selectedDate ? this.selectedDate.getHours() : 23;
        const minutes = this.selectedDate ? this.selectedDate.getMinutes() : 59;

        this.selectedDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hours, minutes, 0);
        this.viewedYear = this.selectedDate.getFullYear();
        this.viewedMonth = this.selectedDate.getMonth();

        this.render();

        if (typeof this.onChange === 'function') {
            this.onChange(this.selectedDate);
        }
    }

    setDate(newDate, triggerChange = true) {
        if (!newDate) return;
        this.selectedDate = new Date(newDate);
        this.viewedYear = this.selectedDate.getFullYear();
        this.viewedMonth = this.selectedDate.getMonth();
        this.render();
        if (triggerChange && typeof this.onChange === 'function') {
            this.onChange(this.selectedDate);
        }
    }

    getDate() {
        return this.selectedDate;
    }
}
