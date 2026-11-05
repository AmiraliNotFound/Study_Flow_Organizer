/**
 * Custom Dual Date Selector & Indicator Component (Gregorian + Real Shamsi/Jalali)
 */

import { gregorianToJalali, jalaliToGregorian, formatDualDate, JALALI_MONTH_NAMES, toPersianDigits, isJalaliLeapYear } from '../jalali.js';
import { MONTH_NAMES, calculateRemainingTime, formatDate } from '../dateUtils.js';

let currentDate = new Date();

export function getSelectedDate() {
    return new Date(currentDate.getTime());
}

export function setSelectedDate(dateInput) {
    currentDate = dateInput instanceof Date ? new Date(dateInput.getTime()) : new Date(dateInput);
    if (isNaN(currentDate.getTime())) currentDate = new Date();
    updateSelectorsFromDate();
}

/**
 * Initializes the dual date picker inside the modal.
 */
export function initCustomDatePicker(container, onDateChanged) {
    if (!container) return;

    container.innerHTML = `
        <div class="custom-dual-picker">
            <!-- Mode Switch Tabs -->
            <div class="dual-picker-tabs">
                <button type="button" class="dual-tab-btn active" id="tabPickShamsi">
                    <span>🗓️ تقویم شمسی (Jalali)</span>
                </button>
                <button type="button" class="dual-tab-btn" id="tabPickGregorian">
                    <span>📅 Gregorian Calendar</span>
                </button>
            </div>

            <!-- Shamsi Selector View -->
            <div id="shamsiSelectorsWrap" class="selectors-row">
                <div class="custom-field">
                    <label class="custom-field-lbl">سال (Year):</label>
                    <select id="selShamsiYear" class="form-select"></select>
                </div>
                <div class="custom-field" style="flex: 1.5;">
                    <label class="custom-field-lbl">ماه (Month):</label>
                    <select id="selShamsiMonth" class="form-select"></select>
                </div>
                <div class="custom-field">
                    <label class="custom-field-lbl">روز (Day):</label>
                    <select id="selShamsiDay" class="form-select"></select>
                </div>
            </div>

            <!-- Gregorian Selector View -->
            <div id="gregorianSelectorsWrap" class="selectors-row hidden">
                <div class="custom-field">
                    <label class="custom-field-lbl">Year:</label>
                    <select id="selGregYear" class="form-select"></select>
                </div>
                <div class="custom-field" style="flex: 1.5;">
                    <label class="custom-field-lbl">Month:</label>
                    <select id="selGregMonth" class="form-select"></select>
                </div>
                <div class="custom-field">
                    <label class="custom-field-lbl">Day:</label>
                    <select id="selGregDay" class="form-select"></select>
                </div>
            </div>

            <!-- Live Dual Date Status Indicator -->
            <div class="dual-live-indicator">
                <div class="dual-indicator-line shamsi-line">
                    <span class="indicator-tag">شمسی:</span>
                    <strong id="liveShamsiText">-</strong>
                </div>
                <div class="dual-indicator-line greg-line">
                    <span class="indicator-tag">Gregorian:</span>
                    <strong id="liveGregText">-</strong>
                </div>
                <div id="liveCountdownText" class="countdown-line">Calculating deadline...</div>
            </div>
        </div>
    `;

    // Populate Year and Month dropdowns
    populateShamsiYears();
    populateShamsiMonths();
    populateGregorianYears();
    populateGregorianMonths();

    // Setup mode tabs
    const tabShamsi = container.querySelector('#tabPickShamsi');
    const tabGreg = container.querySelector('#tabPickGregorian');
    const wrapShamsi = container.querySelector('#shamsiSelectorsWrap');
    const wrapGreg = container.querySelector('#gregorianSelectorsWrap');

    tabShamsi.addEventListener('click', () => {
        tabShamsi.classList.add('active');
        tabGreg.classList.remove('active');
        wrapShamsi.classList.remove('hidden');
        wrapGreg.classList.add('hidden');
    });

    tabGreg.addEventListener('click', () => {
        tabGreg.classList.add('active');
        tabShamsi.classList.remove('active');
        wrapGreg.classList.remove('hidden');
        wrapShamsi.classList.add('hidden');
    });

    // Event listeners on Shamsi inputs
    const sYear = container.querySelector('#selShamsiYear');
    const sMonth = container.querySelector('#selShamsiMonth');
    const sDay = container.querySelector('#selShamsiDay');

    const onShamsiChanged = () => {
        const jy = parseInt(sYear.value, 10);
        const jm = parseInt(sMonth.value, 10);
        updateShamsiDaysDropdown(jy, jm);
        const jd = parseInt(sDay.value, 10) || 1;

        const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
        currentDate.setFullYear(gy, gm - 1, gd);
        updateLiveIndicator();
        updateGregorianDropdowns(gy, gm, gd);
        if (typeof onDateChanged === 'function') onDateChanged(currentDate);
    };

    sYear.addEventListener('change', onShamsiChanged);
    sMonth.addEventListener('change', onShamsiChanged);
    sDay.addEventListener('change', onShamsiChanged);

    // Event listeners on Gregorian inputs
    const gYear = container.querySelector('#selGregYear');
    const gMonth = container.querySelector('#selGregMonth');
    const gDay = container.querySelector('#selGregDay');

    const onGregChanged = () => {
        const gy = parseInt(gYear.value, 10);
        const gm = parseInt(gMonth.value, 10);
        updateGregorianDaysDropdown(gy, gm);
        const gd = parseInt(gDay.value, 10) || 1;

        currentDate.setFullYear(gy, gm - 1, gd);
        updateLiveIndicator();
        const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
        updateShamsiDropdowns(jy, jm, jd);
        if (typeof onDateChanged === 'function') onDateChanged(currentDate);
    };

    gYear.addEventListener('change', onGregChanged);
    gMonth.addEventListener('change', onGregChanged);
    gDay.addEventListener('change', onGregChanged);

    updateSelectorsFromDate();
}

function populateShamsiYears() {
    const sel = document.getElementById('selShamsiYear');
    if (!sel) return;
    sel.innerHTML = '';
    const nowJ = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    for (let y = nowJ.jy - 1; y <= nowJ.jy + 5; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = `${y} (${toPersianDigits(y)})`;
        sel.appendChild(opt);
    }
}

function populateShamsiMonths() {
    const sel = document.getElementById('selShamsiMonth');
    if (!sel) return;
    sel.innerHTML = '';
    JALALI_MONTH_NAMES.forEach((m, idx) => {
        const opt = document.createElement('option');
        opt.value = idx + 1;
        opt.textContent = `${idx + 1}. ${m.nameFa} (${m.nameEn})`;
        sel.appendChild(opt);
    });
}

function populateGregorianYears() {
    const sel = document.getElementById('selGregYear');
    if (!sel) return;
    sel.innerHTML = '';
    const gy = new Date().getFullYear();
    for (let y = gy - 1; y <= gy + 5; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = String(y);
        sel.appendChild(opt);
    }
}

function populateGregorianMonths() {
    const sel = document.getElementById('selGregMonth');
    if (!sel) return;
    sel.innerHTML = '';
    MONTH_NAMES.forEach((name, idx) => {
        const opt = document.createElement('option');
        opt.value = idx + 1;
        opt.textContent = `${idx + 1}. ${name}`;
        sel.appendChild(opt);
    });
}

function updateShamsiDaysDropdown(jy, jm, selectedDay = 1) {
    const daySel = document.getElementById('selShamsiDay');
    if (!daySel) return;
    let maxDays = 31;
    if (jm >= 7 && jm <= 11) maxDays = 30;
    if (jm === 12) maxDays = isJalaliLeapYear(jy) ? 30 : 29;

    const prevVal = parseInt(daySel.value, 10) || selectedDay;
    daySel.innerHTML = '';
    for (let d = 1; d <= maxDays; d++) {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = `${d} (${toPersianDigits(d)})`;
        daySel.appendChild(opt);
    }
    daySel.value = Math.min(prevVal, maxDays);
}

function updateGregorianDaysDropdown(gy, gm, selectedDay = 1) {
    const daySel = document.getElementById('selGregDay');
    if (!daySel) return;
    const maxDays = new Date(gy, gm, 0).getDate();
    const prevVal = parseInt(daySel.value, 10) || selectedDay;
    daySel.innerHTML = '';
    for (let d = 1; d <= maxDays; d++) {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = String(d);
        daySel.appendChild(opt);
    }
    daySel.value = Math.min(prevVal, maxDays);
}

function updateShamsiDropdowns(jy, jm, jd) {
    const sYear = document.getElementById('selShamsiYear');
    const sMonth = document.getElementById('selShamsiMonth');
    const sDay = document.getElementById('selShamsiDay');
    if (sYear) sYear.value = jy;
    if (sMonth) sMonth.value = jm;
    updateShamsiDaysDropdown(jy, jm, jd);
    if (sDay) sDay.value = jd;
}

function updateGregorianDropdowns(gy, gm, gd) {
    const gYear = document.getElementById('selGregYear');
    const gMonth = document.getElementById('selGregMonth');
    const gDay = document.getElementById('selGregDay');
    if (gYear) gYear.value = gy;
    if (gMonth) gMonth.value = gm;
    updateGregorianDaysDropdown(gy, gm, gd);
    if (gDay) gDay.value = gd;
}

export function updateSelectorsFromDate() {
    const gy = currentDate.getFullYear();
    const gm = currentDate.getMonth() + 1;
    const gd = currentDate.getDate();

    const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);

    updateShamsiDropdowns(jy, jm, jd);
    updateGregorianDropdowns(gy, gm, gd);
    updateLiveIndicator();
}

function updateLiveIndicator() {
    const liveShamsi = document.getElementById('liveShamsiText');
    const liveGreg = document.getElementById('liveGregText');
    const liveCountdown = document.getElementById('liveCountdownText');

    const dual = formatDualDate(currentDate);
    const gregFmt = formatDate(currentDate);
    const remaining = calculateRemainingTime(currentDate);

    if (liveShamsi && dual) {
        liveShamsi.textContent = dual.shamsiFullPersian;
    }
    if (liveGreg) {
        liveGreg.textContent = gregFmt.fullDisplay;
    }
    if (liveCountdown) {
        liveCountdown.textContent = remaining.isUrgent
            ? `🚨 ${remaining.friendlyText}`
            : `⏳ ${remaining.friendlyText}`;
        liveCountdown.className = `countdown-line ${remaining.urgencyLevel}`;
    }
}
