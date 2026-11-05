/**
 * Mathematically Exact Jalali (Shamsi / Persian) Calendar Engine
 * Based on the astronomical Kazimierz M. Borkowski 33-year leap cycle algorithm.
 * Zero external dependencies.
 * 
 * Configured for 100% English Latin text & Latin digits (no Persian/Arabic script).
 */

export const JALALI_MONTH_NAMES_EN = [
    { nameEn: "Farvardin", days: 31 },
    { nameEn: "Ordibehesht", days: 31 },
    { nameEn: "Khordad", days: 31 },
    { nameEn: "Tir", days: 31 },
    { nameEn: "Mordad", days: 31 },
    { nameEn: "Shahrivar", days: 31 },
    { nameEn: "Mehr", days: 30 },
    { nameEn: "Aban", days: 30 },
    { nameEn: "Azar", days: 30 },
    { nameEn: "Dey", days: 30 },
    { nameEn: "Bahman", days: 30 },
    { nameEn: "Esfand", days: 29 } // 30 on leap years
];

export const GREGORIAN_MONTH_NAMES_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export const GREGORIAN_WEEKDAYS_EN = [
    { short: "Sun", full: "Sunday" },
    { short: "Mon", full: "Monday" },
    { short: "Tue", full: "Tuesday" },
    { short: "Wed", full: "Wednesday" },
    { short: "Thu", full: "Thursday" },
    { short: "Fri", full: "Friday" },
    { short: "Sat", full: "Saturday" }
];

/**
 * Check if a Jalali year is a leap year.
 */
export function isJalaliLeapYear(jy) {
    const breaks = [
        -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
        1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
    ];
    let jp = breaks[0];
    let jm = -1;
    for (let i = 1; i < breaks.length; i++) {
        const jmNext = breaks[i];
        if (jy >= jp && jy < jmNext) {
            jm = jmNext;
            break;
        }
        jp = jmNext;
    }
    const leapJ = jy - jp;
    return (leapJ % 33) % 4 === 1;
}

/**
 * Convert Gregorian (gy, gm, gd) to Jalali (jy, jm, jd).
 * gm is 1-12.
 */
export function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    jy += Math.floor((days - 1) / 365);
    if (days > 0) days = (days - 1) % 365;
    let jm, jd;
    if (days < 186) {
        jm = 1 + Math.floor(days / 31);
        jd = 1 + (days % 31);
    } else {
        jm = 7 + Math.floor((days - 186) / 30);
        jd = 1 + ((days - 186) % 30);
    }
    return { jy, jm, jd };
}

/**
 * Convert Jalali (jy, jm, jd) to Gregorian (gy, gm, gd).
 * jm is 1-12.
 */
export function jalaliToGregorian(jy, jm, jd) {
    let gy = (jy <= 979) ? 621 : 1600;
    jy -= (jy <= 979) ? 0 : 979;
    let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy += 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
        gy += 100 * Math.floor(--days / 36524);
        days %= 36524;
        if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    gy += Math.floor((days - 1) / 365);
    if (days > 0) days = (days - 1) % 365;
    let gd = days + 1;
    const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm;
    for (gm = 0; gm < 13; gm++) {
        const v = sal_a[gm];
        if (gd <= v) break;
        gd -= v;
    }
    return { gy, gm, gd };
}

/**
 * Formats a Date object into both Gregorian and exact Shamsi details in 100% English.
 */
export function formatDualDate(dateInput) {
    const dateObj = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(dateObj.getTime())) return null;

    const gy = dateObj.getFullYear();
    const gm = dateObj.getMonth() + 1;
    const gd = dateObj.getDate();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
    const dayOfWeek = dateObj.getDay();

    const monthObj = JALALI_MONTH_NAMES_EN[jm - 1] || JALALI_MONTH_NAMES_EN[0];
    const gregMonthName = GREGORIAN_MONTH_NAMES_EN[gm - 1];
    const gregWeekday = GREGORIAN_WEEKDAYS_EN[dayOfWeek];

    const shamsiShort = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    const shamsiFull = `${jd} ${monthObj.nameEn} ${jy}`;
    const gregFull = `${gregWeekday.full}, ${gregMonthName.slice(0, 3)} ${gd}, ${gy}`;

    return {
        gy,
        gm,
        gd,
        jy,
        jm,
        jd,
        monthNameEn: monthObj.nameEn,
        gregMonthName,
        weekdayEn: gregWeekday.full,
        weekdayShort: gregWeekday.short,
        timeStr: `${hours}:${minutes}`,
        shamsiShort,
        shamsiFull,
        gregFull,
        headerDual: `${gregWeekday.full}, ${gregMonthName.slice(0, 3)} ${gd}, ${gy}  •  ${jd} ${monthObj.nameEn} ${jy}`,
        dualSummary: `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')} (${jd} ${monthObj.nameEn})`
    };
}
