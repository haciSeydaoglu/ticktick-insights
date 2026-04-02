/**
 * Utility functions for sanitization, date formatting, and DOM helpers.
 * SECURITY: All user data must go through safe DOM methods (textContent, createTextNode).
 */

function getCurrentLang() {
  if (typeof document !== 'undefined' && document.documentElement?.lang === 'tr') {
    return 'tr';
  }
  return 'en';
}

/**
 * Format a date string or Date object to a readable locale string.
 * @param {string|Date} dateInput - ISO 8601 date string or Date object
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string or empty string if invalid
 */
export function formatDate(dateInput, includeTime = false) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('en-US', options);
}

/**
 * Calculate the number of days between two dates.
 * @param {string|Date} start
 * @param {string|Date} end
 * @returns {number} Days between dates, or -1 if invalid
 */
export function daysBetween(start, end) {
  if (!start || !end) return -1;
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return -1;
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

/**
 * Get the YYYY-MM month key from a date string.
 * @param {string} dateStr - ISO 8601 date string
 * @returns {string|null} Month key like "2025-01" or null
 */
export function getMonthKey(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Safely create a text element with textContent (XSS-safe).
 * @param {string} tag - HTML tag name
 * @param {string} text - Text content
 * @param {string} [className] - Optional CSS class
 * @returns {HTMLElement}
 */
export function createEl(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined && text !== null) {
    el.textContent = String(text);
  }
  if (className) {
    el.className = className;
  }
  return el;
}

/**
 * Create an element with attributes (no innerHTML, XSS-safe).
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attribute key-value pairs
 * @param {HTMLElement[]} [children] - Child elements to append
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'textContent') {
      el.textContent = String(value);
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (child) el.appendChild(child);
  }
  return el;
}

/**
 * Format a number with thousands separator.
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return num.toLocaleString('en-US');
}

/**
 * Format a percentage value.
 * @param {number} value - Value between 0 and 100
 * @returns {string} Formatted percentage like "72.5%"
 */
export function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

/**
 * Map TickTick priority number to label.
 * @param {number} priority
 * @returns {string}
 */
export function priorityLabel(priority) {
  const isTurkish = getCurrentLang() === 'tr';
  const labels = isTurkish
    ? { 0: 'Yok', 1: 'Düşük', 3: 'Orta', 5: 'Yüksek' }
    : { 0: 'None', 1: 'Low', 3: 'Medium', 5: 'High' };
  return labels[priority] || (isTurkish ? 'Yok' : 'None');
}

/**
 * Map TickTick priority number to CSS class suffix.
 * @param {number} priority
 * @returns {string}
 */
export function priorityClass(priority) {
  const classes = { 0: 'none', 1: 'low', 3: 'medium', 5: 'high' };
  return classes[priority] || 'none';
}

/**
 * Map TickTick status number to label.
 * @param {number} status
 * @returns {string}
 */
export function statusLabel(status) {
  if (getCurrentLang() === 'tr') {
    if (status === 0) return 'Bekleyen';
    if (status === 1 || status === 2) return 'Tamamlanan';
    if (status === -1) return 'Silinen';
    return 'Bilinmiyor';
  }

  if (status === 0) return 'Pending';
  if (status === 1 || status === 2) return 'Completed';
  if (status === -1) return 'Deleted';
  return 'Unknown';
}

/**
 * Truncate a string to a max length with ellipsis.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
export function truncate(str, max = 80) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}
