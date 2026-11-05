/**
 * Gregorian ISO-8601 Date & Urgency Calculation Utilities
 * Zero external dependencies.
 */

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

/**
 * Format a Date object into human-readable strings.
 */
export function formatDate(dateInput) {
    let dateObj = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(dateObj.getTime())) dateObj = new Date();

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    const weekday = WEEKDAYS[dateObj.getDay()];
    const monthName = MONTH_NAMES[month];

    const shortDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const timeStr = `${hours}:${minutes}`;
    const fullDisplay = `${weekday}, ${monthName} ${day}, ${year} (${timeStr})`;
    const primaryDisplay = `${weekday}, ${monthName} ${day} (${timeStr})`;

    return {
        year,
        month: month + 1,
        day,
        weekday,
        timeStr,
        shortDate,
        primaryDisplay,
        fullDisplay,
        iso: dateObj.toISOString()
    };
}

/**
 * Calculate remaining time and smart urgency classification for a deadline.
 */
export function calculateRemainingTime(dueDateInput) {
    const targetDate = dueDateInput instanceof Date ? dueDateInput : new Date(dueDateInput);
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.floor(diffHours / 24);

    let friendlyText = "";
    let urgencyLevel = "calm";
    let isUrgent = false;

    if (diffMs < 0) {
        const pastDays = Math.abs(diffDays);
        friendlyText = pastDays === 0 ? "Expired today" : `${pastDays}d ago`;
        urgencyLevel = "overdue";
    } else if (diffHours < 2) {
        friendlyText = "< 2 hours left!";
        urgencyLevel = "urgent";
        isUrgent = true;
    } else if (diffHours < 24) {
        const h = Math.max(1, Math.floor(diffHours));
        friendlyText = `${h}h left (today)`;
        urgencyLevel = "urgent";
        isUrgent = true;
    } else if (diffHours < 48) {
        const h = Math.floor(diffHours % 24);
        friendlyText = `1d & ${h}h left`;
        urgencyLevel = "urgent";
        isUrgent = true;
    } else if (diffDays <= 7) {
        friendlyText = `${diffDays} days left`;
        urgencyLevel = "medium";
    } else {
        friendlyText = `${diffDays} days left`;
        urgencyLevel = "calm";
    }

    return { diffMs, diffHours, diffDays, friendlyText, urgencyLevel, isUrgent };
}

/**
 * Returns a new Date object offset by daysAhead with specified hours/minutes.
 */
export function getDatePreset(daysAhead = 0, hours = 23, minutes = 59) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hours, minutes, 0, 0);
    return d;
}

/**
 * Sort items chronologically by due date ascending.
 */
export function sortItemsChronologically(items = []) {
    return [...items].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/**
 * Escape HTML special characters for safe string rendering.
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
