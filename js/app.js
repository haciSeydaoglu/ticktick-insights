/**
 * Main application orchestrator.
 * Wires together screen navigation, theme, language toggle, tab switching, search delegation,
 * and the settings modal.
 * SECURITY: No external network requests.
 */

import { setUILang, t } from './i18n.js?v=0.2.0';
import { APP_VERSION } from './version.js?v=0.2.0';
import {
  init as initBackup,
  onLanguageChange,
  searchTasks,
  renderSearchResults,
  getAnalysisTasksForSearch,
} from './backup-controller.js?v=0.2.0';

// Initialize Lucide icons
if (window.lucide) lucide.createIcons();

// ── DOM References (shared) ───────────────────────────────────────────

const screenUpload = document.getElementById('screen-upload');
const screenProcessing = document.getElementById('screen-processing');
const screenResults = document.getElementById('screen-results');
const themeToggle = document.getElementById('theme-toggle');
const uiLangBtns = document.querySelectorAll('.ui-lang-btn');
const appVersion = document.getElementById('app-version');

// Sub-tab elements
const csvSubTabBtns = document.querySelectorAll('#csv-sub-tabs .sub-tab-btn');
const tabContentInsights = document.getElementById('tab-content-insights');
const tabContentPrompt = document.getElementById('tab-content-prompt');

// Search elements
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const searchResults = document.getElementById('search-results');

// ── Screen Navigation ─────────────────────────────────────────────────

function showScreen(screen) {
  screenUpload.classList.remove('active');
  screenProcessing.classList.remove('active');
  screenResults.classList.remove('active');
  screen.classList.add('active');
}

function showError(message) {
  const uploadError = document.getElementById('upload-error');
  uploadError.textContent = message;
  uploadError.hidden = false;
}

function hideError() {
  document.getElementById('upload-error').hidden = true;
}

// ── Version ────────────────────────────────────────────���──────────────

function renderAppVersion() {
  if (!appVersion) return;
  appVersion.textContent = `v${APP_VERSION}`;
}

// ── Theme Toggle ──────────────────────────────────────────────────────

function applyTheme(setting) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = setting === 'dark' || (setting === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', shouldBeDark);
}

function setThemeUI(setting) {
  themeToggle.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === setting);
  });
}

const currentTheme = localStorage.getItem('theme') || 'system';
setThemeUI(currentTheme);

themeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.theme-btn');
  if (!btn) return;
  const setting = btn.dataset.theme;
  localStorage.setItem('theme', setting);
  applyTheme(setting);
  setThemeUI(setting);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if ((localStorage.getItem('theme') || 'system') === 'system') {
    applyTheme('system');
  }
});

// ── Language Toggle ───────────────────────────────────────────────────

const initialLang = window.__initialLang || 'en';
for (const b of uiLangBtns) {
  b.classList.toggle('active', b.dataset.uilang === initialLang);
}

for (const btn of uiLangBtns) {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.uilang;
    for (const b of uiLangBtns) b.classList.remove('active');
    btn.classList.add('active');
    setUILang(lang);

    // Update URL without page reload
    const url = new URL(window.location);
    if (lang === 'en') {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', lang);
    }
    history.replaceState(null, '', url);

    onLanguageChange(lang);
    updateSearchPlaceholder();
  });
}

// ── Sub-Tab Switching ────────────────────────────────────────────────

function toggleTabBtnStyles(buttons, attrName, activeName) {
  for (const btn of buttons) {
    const isActive = btn.dataset[attrName] === activeName;
    btn.classList.toggle('border-teal-600', isActive);
    btn.classList.toggle('text-teal-600', isActive);
    btn.classList.toggle('dark:text-teal-400', isActive);
    btn.classList.toggle('dark:border-teal-400', isActive);
    btn.classList.toggle('border-transparent', !isActive);
    btn.classList.toggle('text-gray-500', !isActive);
  }
}

function switchCsvSubTab(subTabName) {
  toggleTabBtnStyles(csvSubTabBtns, 'subTab', subTabName);

  tabContentInsights.classList.toggle('hidden', subTabName !== 'insights');
  tabContentPrompt.classList.toggle('hidden', subTabName !== 'prompt');
}

// CSV sub-tab event listeners
for (const btn of csvSubTabBtns) {
  btn.addEventListener('click', () => switchCsvSubTab(btn.dataset.subTab));
}

// ── Search Delegation ────────────────────────────────────────────────

let searchDebounceTimer = null;

function updateSearchPlaceholder() {
  searchInput.placeholder = t('searchPlaceholder');
}

function clearSearchUI() {
  searchInput.value = '';
  searchClear.classList.add('hidden');
  searchResults.classList.add('hidden');
  searchResults.textContent = '';
}

function performSearch(query) {
  const tasks = getAnalysisTasksForSearch();
  if (!tasks || tasks.length === 0) return;

  const results = searchTasks(query, tasks);
  renderSearchResults(results, query);
}

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  searchClear.classList.toggle('hidden', query === '');
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  if (!query) {
    searchResults.classList.add('hidden');
    searchResults.textContent = '';
    return;
  }
  searchDebounceTimer = setTimeout(() => performSearch(query), 200);
});

searchClear.addEventListener('click', clearSearchUI);

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.classList.add('hidden');
  }
});

searchInput.addEventListener('focus', () => {
  if (searchInput.value.trim()) {
    const hasContent = searchResults.children.length > 0;
    if (hasContent) searchResults.classList.remove('hidden');
  }
});

// ── Settings Modal ───────────────────────────────────────────────────

const settingsModal = document.getElementById('settings-modal');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsCloseBtn = document.getElementById('settings-close');
const btnSettings = document.getElementById('btn-settings');
const clearDataCheckbox = document.getElementById('clear-data-checkbox');
const btnClearAllData = document.getElementById('btn-clear-all-data');

function openSettings() { settingsModal.classList.remove('hidden'); }
function closeSettings() { settingsModal.classList.add('hidden'); }

btnSettings.addEventListener('click', openSettings);
settingsOverlay.addEventListener('click', closeSettings);
settingsCloseBtn.addEventListener('click', closeSettings);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
    closeSettings();
  }
});

clearDataCheckbox.addEventListener('change', () => {
  btnClearAllData.disabled = !clearDataCheckbox.checked;
});

btnClearAllData.addEventListener('click', async () => {
  if (!clearDataCheckbox.checked) return;
  localStorage.clear();
  try {
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('ticktick-insights');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  } catch { /* IndexedDB deletion may fail in some browsers */ }
  window.location.reload();
});

// ── Initialization ───────────────────────────────────────────────────

initBackup({ showScreen, showError, hideError, screenUpload, screenProcessing, screenResults });
renderAppVersion();
updateSearchPlaceholder();
