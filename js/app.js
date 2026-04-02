/**
 * Main application module.
 * Handles file upload, state management, i18n, and orchestration.
 * SECURITY: No external requests, no innerHTML with user data.
 * File metadata in localStorage, CSV content in IndexedDB for re-analysis.
 */

import { parseTickTickCSV, validateFile } from './csv-parser.js';
import { analyze } from './analyzer.js';
import { renderDashboard } from './dashboard.js';
import { buildPrompt, buildPromptData } from './prompt-builder.js';
import { setUILang, getUILang, t } from './i18n.js';
import { createEl } from './utils.js';
import { APP_VERSION } from './version.js';

// Initialize Lucide icons
if (window.lucide) lucide.createIcons();

const PROMPT_CONTEXT_QUESTIONS = [
  {
    id: 'users',
    type: 'single',
    labelKey: 'promptCtxUsersQ',
    options: [
      { value: 'solo', labelKey: 'promptCtxUsersSolo' },
      { value: 'team', labelKey: 'promptCtxUsersTeam' },
      { value: 'mixed', labelKey: 'promptCtxUsersMixed' },
    ],
  },
  {
    id: 'useCases',
    type: 'multi',
    labelKey: 'promptCtxUseCasesQ',
    options: [
      { value: 'software_projects', labelKey: 'promptCtxUseCasesSoftware' },
      { value: 'general_work', labelKey: 'promptCtxUseCasesWork' },
      { value: 'personal_life', labelKey: 'promptCtxUseCasesPersonal' },
    ],
  },
  {
    id: 'painPoints',
    type: 'multi',
    labelKey: 'promptCtxProblemsQ',
    options: [
      { value: 'clutter', labelKey: 'promptCtxProblemsClutter' },
      { value: 'tracking', labelKey: 'promptCtxProblemsTracking' },
      { value: 'stalled', labelKey: 'promptCtxProblemsStalled' },
      { value: 'priorities', labelKey: 'promptCtxProblemsPriorities' },
    ],
  },
  {
    id: 'optimize',
    type: 'multi',
    labelKey: 'promptCtxOptimizeQ',
    options: [
      { value: 'structure', labelKey: 'promptCtxOptimizeStructure' },
      { value: 'prioritization', labelKey: 'promptCtxOptimizePrioritization' },
      { value: 'workflow', labelKey: 'promptCtxOptimizeWorkflow' },
      { value: 'visibility', labelKey: 'promptCtxOptimizeVisibility' },
    ],
  },
  {
    id: 'style',
    type: 'single',
    labelKey: 'promptCtxStyleQ',
    options: [
      { value: 'direct', labelKey: 'promptCtxStyleDirect' },
      { value: 'balanced', labelKey: 'promptCtxStyleBalanced' },
      { value: 'conservative', labelKey: 'promptCtxStyleConservative' },
    ],
  },
];

const PROMPT_VIEW_OPTIONS = [
  { value: 'full', labelKey: 'promptViewFull' },
  { value: 'raw', labelKey: 'promptViewRaw' },
];

const PROMPT_CONTEXT_STORAGE_KEY = 'ticktick-prompt-context';

function createDefaultPromptContext() {
  return {
    users: 'solo',
    useCases: ['software_projects'],
    painPoints: ['clutter', 'stalled'],
    optimize: ['structure', 'workflow'],
    style: 'direct',
  };
}

function createEmptyPromptCache() {
  return {
    full: { tr: '', en: '' },
    raw: { tr: '', en: '' },
  };
}

function normalizePromptContext(context) {
  const defaults = createDefaultPromptContext();
  const source = context && typeof context === 'object' ? context : {};
  const normalized = {};

  for (const question of PROMPT_CONTEXT_QUESTIONS) {
    const fallbackValue = defaults[question.id];
    const rawValue = source[question.id];

    if (question.type === 'single') {
      const isValid = question.options.some((option) => option.value === rawValue);
      normalized[question.id] = isValid ? rawValue : fallbackValue;
      continue;
    }

    const nextValues = getOrderedMultiValue(question, Array.isArray(rawValue) ? rawValue : []);
    normalized[question.id] = nextValues.length > 0 ? nextValues : fallbackValue;
  }

  return normalized;
}

function loadPromptContext() {
  try {
    return normalizePromptContext(JSON.parse(localStorage.getItem(PROMPT_CONTEXT_STORAGE_KEY)));
  } catch {
    return createDefaultPromptContext();
  }
}

function savePromptContext(context) {
  localStorage.setItem(PROMPT_CONTEXT_STORAGE_KEY, JSON.stringify(normalizePromptContext(context)));
}

// State
let currentAnalysis = null;
let promptCache = createEmptyPromptCache();
let promptContext = loadPromptContext();
let promptViewMode = 'full';

// DOM references
const screenUpload = document.getElementById('screen-upload');
const screenProcessing = document.getElementById('screen-processing');
const screenResults = document.getElementById('screen-results');
const processingText = document.getElementById('processing-text');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadError = document.getElementById('upload-error');
const dashboardContainer = document.getElementById('dashboard-container');
const promptSection = document.getElementById('prompt-section');
const promptViewControls = document.getElementById('prompt-view-controls');
const promptContextControls = document.getElementById('prompt-context-controls');
const promptOutput = document.getElementById('prompt-output');
const btnCopy = document.getElementById('btn-copy');
const btnNewFile = document.getElementById('btn-new-file');
const copyFeedback = document.getElementById('copy-feedback');
const themeToggle = document.getElementById('theme-toggle');
const uiLangBtns = document.querySelectorAll('.ui-lang-btn');
const recentFilesContainer = document.getElementById('recent-files');
const recentFilesList = document.getElementById('recent-files-list');
const btnClearRecent = document.getElementById('btn-clear-recent');
const appVersion = document.getElementById('app-version');
let copyFeedbackTimer = null;

// Recent files — metadata in localStorage, CSV content in IndexedDB
const RECENT_FILES_KEY = 'ticktick-recent-files';
const MAX_RECENT_FILES = 5;
const IDB_NAME = 'ticktick-insights';
const IDB_STORE = 'csv-files';

function getQuestionById(questionId) {
  return PROMPT_CONTEXT_QUESTIONS.find((question) => question.id === questionId);
}

function getOrderedMultiValue(question, values) {
  const currentValues = new Set(Array.isArray(values) ? values : []);
  return question.options
    .map((option) => option.value)
    .filter((value) => currentValues.has(value));
}

function isOptionSelected(question, optionValue) {
  const value = promptContext[question.id];
  return question.type === 'multi'
    ? Array.isArray(value) && value.includes(optionValue)
    : value === optionValue;
}

function syncPromptOutput() {
  promptOutput.value = promptCache[promptViewMode][getUILang()] || '';
}

function rebuildPromptCache() {
  if (!currentAnalysis) return;
  const lang = getUILang();
  const otherLang = lang === 'tr' ? 'en' : 'tr';
  promptCache.full[lang] = buildPrompt(currentAnalysis, lang, promptContext);
  promptCache.raw[lang] = buildPromptData(currentAnalysis, lang);
  promptCache.full[otherLang] = '';
  promptCache.raw[otherLang] = '';
}

function refreshPromptFromState() {
  if (!currentAnalysis) return;
  rebuildPromptCache();
  syncPromptOutput();
}

function syncPromptModeUI() {
  if (!promptContextControls) return;
  promptContextControls.hidden = promptViewMode === 'raw';
}

function setPromptViewMode(mode) {
  if (!PROMPT_VIEW_OPTIONS.some((option) => option.value === mode)) return;
  if (promptViewMode === mode) return;

  promptViewMode = mode;
  renderPromptViewControls();
  syncPromptModeUI();

  if (currentAnalysis && !promptCache[mode][getUILang()]) {
    rebuildPromptCache();
  }

  syncPromptOutput();
}

function updatePromptContext(questionId, optionValue) {
  const question = getQuestionById(questionId);
  if (!question) return;

  if (question.type === 'single') {
    promptContext = { ...promptContext, [questionId]: optionValue };
  } else {
    const currentValues = getOrderedMultiValue(question, promptContext[questionId]);
    const isSelected = currentValues.includes(optionValue);

    if (isSelected && currentValues.length === 1) return;

    const nextValues = isSelected
      ? currentValues.filter((value) => value !== optionValue)
      : question.options
        .map((option) => option.value)
        .filter((value) => value === optionValue || currentValues.includes(value));

    promptContext = { ...promptContext, [questionId]: nextValues };
  }

  savePromptContext(promptContext);
  renderPromptContextControls();
  refreshPromptFromState();
}

function createPromptViewButton(option) {
  const selected = promptViewMode === option.value;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = [
    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
    selected
      ? 'bg-teal-600 text-white border-teal-600 dark:bg-teal-600 dark:text-white dark:border-teal-500'
      : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:border-teal-600 dark:hover:text-teal-300',
  ].join(' ');
  btn.textContent = t(option.labelKey);
  btn.setAttribute('aria-pressed', String(selected));
  btn.addEventListener('click', () => setPromptViewMode(option.value));
  return btn;
}

function createContextOptionButton(question, option) {
  const selected = isOptionSelected(question, option.value);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = [
    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
    selected
      ? 'bg-teal-600 text-white border-teal-600 dark:bg-teal-600 dark:text-white dark:border-teal-500'
      : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:border-teal-600 dark:hover:text-teal-300',
  ].join(' ');
  btn.textContent = t(option.labelKey);
  btn.setAttribute('aria-pressed', String(selected));
  btn.addEventListener('click', () => updatePromptContext(question.id, option.value));
  return btn;
}

function renderPromptViewControls() {
  if (!promptViewControls) return;

  promptViewControls.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-wrap items-center gap-2';

  wrapper.appendChild(createEl('span', t('promptViewHeading'), 'text-xs font-medium text-gray-700 dark:text-gray-300 mr-1'));

  for (const option of PROMPT_VIEW_OPTIONS) {
    wrapper.appendChild(createPromptViewButton(option));
  }

  promptViewControls.appendChild(wrapper);
}

function renderPromptContextControls() {
  if (!promptContextControls) return;

  promptContextControls.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4';

  wrapper.appendChild(createEl('h4', t('promptContextHeading'), 'text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1'));
  wrapper.appendChild(createEl('p', t('promptContextDesc'), 'text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4'));

  const list = document.createElement('div');
  list.className = 'space-y-3';

  for (const question of PROMPT_CONTEXT_QUESTIONS) {
    const item = document.createElement('div');
    item.className = 'space-y-2';

    item.appendChild(createEl('p', t(question.labelKey), 'text-xs font-medium text-gray-700 dark:text-gray-300'));

    const options = document.createElement('div');
    options.className = 'flex flex-wrap gap-2';

    for (const option of question.options) {
      options.appendChild(createContextOptionButton(question, option));
    }

    item.appendChild(options);
    list.appendChild(item);
  }

  wrapper.appendChild(list);
  promptContextControls.appendChild(wrapper);
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveCSVContent(name, csvText) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(csvText, name);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getCSVContent(name) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(name);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteCSVContent(name) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(name);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearCSVContent() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getRecentFiles() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_FILES_KEY)) || [];
  } catch {
    return [];
  }
}

async function saveRecentFile(name, size, csvText) {
  await saveCSVContent(name, csvText);
  const files = getRecentFiles().filter((f) => f.name !== name);
  files.unshift({ name, size, date: new Date().toISOString() });
  if (files.length > MAX_RECENT_FILES) {
    const removed = files.splice(MAX_RECENT_FILES);
    for (const old of removed) deleteCSVContent(old.name);
  }
  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(files));
  renderRecentFiles();
}

async function removeRecentFile(name) {
  await deleteCSVContent(name);
  const files = getRecentFiles().filter((f) => f.name !== name);
  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(files));
  renderRecentFiles();
}

async function clearRecentFiles() {
  await clearCSVContent();
  localStorage.removeItem(RECENT_FILES_KEY);
  renderRecentFiles();
}

async function loadRecentFile(name) {
  hideError();
  const csvText = await getCSVContent(name);
  if (!csvText) {
    showError(t('fileNotFound'));
    removeRecentFile(name);
    return;
  }
  processCSVText(csvText);
}

function renderAppVersion() {
  if (!appVersion) return;
  appVersion.textContent = `v${APP_VERSION}`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function renderRecentFiles() {
  const files = getRecentFiles();
  recentFilesList.textContent = '';

  if (files.length === 0) {
    recentFilesContainer.hidden = true;
    return;
  }

  recentFilesContainer.hidden = false;

  for (const file of files) {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg group hover:border-teal-300 dark:hover:border-teal-700 transition-colors cursor-pointer';

    const left = document.createElement('div');
    left.className = 'flex items-center gap-2.5 min-w-0';

    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'file-text');
    icon.className = 'w-4 h-4 text-teal-500 shrink-0';

    const info = document.createElement('div');
    info.className = 'min-w-0';

    const nameEl = createEl('p', file.name, 'text-sm font-medium text-gray-700 dark:text-gray-300 truncate');
    const dateStr = new Date(file.date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const meta = createEl('p', formatFileSize(file.size) + ' · ' + dateStr, 'text-xs text-gray-400 dark:text-gray-500');

    info.appendChild(nameEl);
    info.appendChild(meta);
    left.appendChild(icon);
    left.appendChild(info);

    const btnRemove = document.createElement('button');
    btnRemove.className = 'p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100';
    btnRemove.setAttribute('aria-label', 'Remove');
    const removeIcon = document.createElement('i');
    removeIcon.setAttribute('data-lucide', 'x');
    removeIcon.className = 'w-3.5 h-3.5';
    btnRemove.appendChild(removeIcon);
    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      removeRecentFile(file.name);
    });

    li.addEventListener('click', () => loadRecentFile(file.name));

    li.appendChild(left);
    li.appendChild(btnRemove);
    recentFilesList.appendChild(li);
  }

  if (window.lucide) lucide.createIcons();
}

// Screen transitions
function showScreen(screen) {
  screenUpload.classList.remove('active');
  screenProcessing.classList.remove('active');
  screenResults.classList.remove('active');
  screen.classList.add('active');
}

function showError(message) {
  uploadError.textContent = message;
  uploadError.hidden = false;
}

function hideError() {
  uploadError.hidden = true;
}

// Insert prompt section after summary cards (first child of dashboard)
function insertPromptInDashboard() {
  const firstChild = dashboardContainer.children[0];
  if (firstChild) {
    firstChild.after(promptSection);
  } else {
    dashboardContainer.appendChild(promptSection);
  }
  promptSection.classList.remove('hidden');
}

// Re-render dashboard when UI language changes and results are visible
function refreshResultsIfVisible() {
  if (!currentAnalysis) return;
  // Stash prompt section before dashboard clears its children
  document.body.appendChild(promptSection);
  renderDashboard(currentAnalysis, dashboardContainer);
  insertPromptInDashboard();
  renderPromptViewControls();
  renderPromptContextControls();
  syncPromptModeUI();
  if (window.lucide) lucide.createIcons();
  rebuildPromptCache();
  syncPromptOutput();
}

// Shared CSV processing — used by both file upload and recent file load
function processCSVText(rawText, fileName, fileSize) {
  showScreen(screenProcessing);
  try {
    processingText.textContent = t('parsing');
    const parsed = parseTickTickCSV(rawText);

    processingText.textContent = t('analyzing');
    currentAnalysis = analyze(parsed.tasks);

    processingText.textContent = t('generating');
    rebuildPromptCache();

    processingText.textContent = t('rendering');
    renderDashboard(currentAnalysis, dashboardContainer);
    insertPromptInDashboard();
    renderPromptViewControls();
    renderPromptContextControls();
    syncPromptModeUI();
    if (window.lucide) lucide.createIcons();
    syncPromptOutput();

    if (fileName) saveRecentFile(fileName, fileSize, rawText);
    showScreen(screenResults);
  } catch (err) {
    showScreen(screenUpload);
    showError(err.message || 'Failed to parse the CSV file.');
  }
}

// File handling
function handleFile(file) {
  hideError();

  const validation = validateFile(file);
  if (!validation.valid) {
    showError(validation.error);
    return;
  }

  showScreen(screenProcessing);
  processingText.textContent = t('processing');

  const reader = new FileReader();

  reader.onerror = () => {
    showScreen(screenUpload);
    showError('Failed to read the file. Please try again.');
  };

  reader.onload = (e) => {
    processCSVText(e.target.result, file.name, file.size);
  };

  reader.readAsText(file, 'UTF-8');
}

// Drag & drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length > 0) handleFile(files[0]);
});

// Click to upload
dropZone.addEventListener('click', (e) => {
  if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
    fileInput.click();
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
});

// UI language toggle — sync active button with initial language
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

    if (currentAnalysis) {
      refreshResultsIfVisible();
    } else {
      renderPromptContextControls();
    }
  });
}

// Theme toggle
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

// Copy prompt to clipboard helper
async function copyPromptToClipboard() {
  try {
    await navigator.clipboard.writeText(promptOutput.value);
  } catch {
    promptOutput.select();
    document.execCommand('copy');
  }

  btnCopy.classList.remove('copy-success');
  copyFeedback.classList.remove('copy-visible');
  void btnCopy.offsetWidth;
  void copyFeedback.offsetWidth;
  btnCopy.classList.add('copy-success');
  copyFeedback.hidden = false;
  copyFeedback.textContent = t('copied');
  copyFeedback.classList.add('copy-visible');

  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer);
  }

  copyFeedbackTimer = setTimeout(() => {
    copyFeedback.hidden = true;
    copyFeedback.classList.remove('copy-visible');
    btnCopy.classList.remove('copy-success');
  }, 2000);
}

// Copy to clipboard button
btnCopy.addEventListener('click', copyPromptToClipboard);

// AI links — copy prompt first, then open the link
for (const link of document.querySelectorAll('.ai-copy-link')) {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    copyPromptToClipboard().then(() => {
      window.open(link.href, '_blank', 'noopener,noreferrer');
    });
  });
}

// Reset to upload screen
function resetToUpload() {
  currentAnalysis = null;
  promptCache = createEmptyPromptCache();
  promptViewMode = 'full';
  promptOutput.value = '';
  dashboardContainer.textContent = '';
  promptSection.classList.add('hidden');
  renderPromptViewControls();
  renderPromptContextControls();
  syncPromptModeUI();
  fileInput.value = '';
  hideError();
  showScreen(screenUpload);
}

btnNewFile.addEventListener('click', resetToUpload);
document.getElementById('btn-logo').addEventListener('click', resetToUpload);

// Clear recent files
btnClearRecent.addEventListener('click', clearRecentFiles);

// Initial render of recent files on page load
renderAppVersion();
renderRecentFiles();
renderPromptViewControls();
renderPromptContextControls();
syncPromptModeUI();
