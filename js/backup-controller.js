/**
 * Backup controller — CSV upload, analysis, prompt generation, search, and recent files.
 * Manages the backup/CSV analysis workflow and all related UI rendering.
 * Initialized by app.js with shared utility functions.
 */

import { parseTickTickCSV, validateFile } from './csv-parser.js?v=0.2.0';
import { analyze } from './analyzer.js?v=0.2.0';
import { renderDashboard } from './dashboard.js?v=0.2.0';
import { buildPrompt, buildPromptData } from './prompt-builder.js?v=0.2.0';
import { getUILang, t } from './i18n.js?v=0.2.0';
import { createEl, formatDate, truncate } from './utils.js?v=0.2.0';
import {
  PROMPT_CONTEXT_QUESTIONS, PROMPT_VIEW_OPTIONS,
  loadUserNotes, saveUserNotes, swapDefaultNotes, flattenUserNotes,
  createEmptyPromptCache, getOrderedMultiValue, loadPromptContext, savePromptContext,
  getQuestionById, isOptionSelected,
} from './prompt-context.js?v=0.2.0';

// Module state
let currentAnalysis = null;
let promptCache = createEmptyPromptCache();
let promptContext = loadPromptContext();
let promptViewMode = 'full';
let userNotes = loadUserNotes();
let userNotesSaveTimer = null;
let copyFeedbackTimer = null;

// Shared functions from app.js — set during init
let showScreen, showError, hideError;

// DOM references — set during init
let screenUpload, screenProcessing, screenResults;
let processingText, dropZone, fileInput, uploadError;
let dashboardContainer, promptSection, promptViewControls, promptContextControls;
let promptOutput, btnCopy, btnNewFile, copyFeedback;
let searchInput, searchClear, searchResults;
let recentFilesContainer, recentFilesList, btnClearRecent;

// ── IndexedDB ─────────────────────────────────────────────────────────

const RECENT_FILES_KEY = 'ticktick-recent-files';
const MAX_RECENT_FILES = 5;
const IDB_NAME = 'ticktick-insights';
const IDB_STORE = 'csv-files';

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

// ── Prompt Cache & Sync ───────────────────────────────────────────────

function syncPromptOutput() {
  promptOutput.value = promptCache[promptViewMode][getUILang()] || '';
}

function rebuildPromptCache() {
  if (!currentAnalysis) return;
  const lang = getUILang();
  const otherLang = lang === 'tr' ? 'en' : 'tr';
  const flatNotes = flattenUserNotes(userNotes);
  promptCache.full[lang] = buildPrompt(currentAnalysis, lang, promptContext, flatNotes);
  promptCache.raw[lang] = buildPromptData(currentAnalysis, lang, promptContext, flatNotes);
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

// ── Prompt UI Rendering ───────────────────────────────────────────────

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
  const selected = isOptionSelected(question, option.value, promptContext);
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

  // Separator
  const separator = document.createElement('div');
  separator.className = 'border-t border-gray-100 dark:border-gray-800 mt-4 pt-4 space-y-3';

  // Task limit stepper
  const taskLimitRow = document.createElement('div');
  taskLimitRow.className = 'flex items-center gap-3';

  taskLimitRow.appendChild(createEl('span', t('promptCtxTaskLimit'), 'text-xs font-medium text-gray-700 dark:text-gray-300'));

  const taskLimitInput = document.createElement('input');
  taskLimitInput.type = 'number';
  taskLimitInput.min = '3';
  taskLimitInput.max = '20';
  taskLimitInput.step = '1';
  taskLimitInput.value = String(promptContext.taskLimit || 7);
  taskLimitInput.className = 'w-16 px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:border-teal-400 focus:outline-none';
  taskLimitInput.addEventListener('change', () => {
    const value = parseInt(taskLimitInput.value, 10);
    if (Number.isInteger(value) && value >= 3 && value <= 20) {
      promptContext = { ...promptContext, taskLimit: value };
      savePromptContext(promptContext);
      refreshPromptFromState();
    } else {
      taskLimitInput.value = String(promptContext.taskLimit || 7);
    }
  });

  taskLimitRow.appendChild(taskLimitInput);
  separator.appendChild(taskLimitRow);
  wrapper.appendChild(separator);

  // User work system notes
  const notesSeparator = document.createElement('div');
  notesSeparator.className = 'border-t border-gray-100 dark:border-gray-800 mt-4 pt-4 space-y-3';

  notesSeparator.appendChild(createEl('p', t('userNotesHeading'), 'text-xs font-semibold text-gray-700 dark:text-gray-300'));
  notesSeparator.appendChild(createEl('p', t('userNotesDesc'), 'text-xs text-gray-500 dark:text-gray-400 leading-relaxed'));

  const noteFields = [
    { key: 'pomodoro', labelKey: 'pomodoroLabel', rows: 2 },
    { key: 'habit', labelKey: 'habitLabel', rows: 2 },
    { key: 'filter', labelKey: 'filterLabel', rows: 3 },
    { key: 'extra', labelKey: 'extraLabel', rows: 3 },
  ];

  for (const field of noteFields) {
    const fieldDiv = document.createElement('div');
    const label = document.createElement('label');
    label.className = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';
    label.textContent = t(field.labelKey);

    const textarea = document.createElement('textarea');
    textarea.rows = field.rows;
    textarea.value = userNotes[field.key].value;
    textarea.className = 'w-full p-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 resize-y focus:outline-none focus:border-teal-300 dark:focus:border-teal-600';
    textarea.addEventListener('input', () => {
      userNotes = { ...userNotes, [field.key]: { value: textarea.value, isCustom: true } };
      clearTimeout(userNotesSaveTimer);
      userNotesSaveTimer = setTimeout(() => {
        saveUserNotes(userNotes);
        refreshPromptFromState();
      }, 400);
    });

    label.htmlFor = `note-${field.key}`;
    textarea.id = `note-${field.key}`;
    fieldDiv.appendChild(label);
    fieldDiv.appendChild(textarea);
    notesSeparator.appendChild(fieldDiv);
  }

  wrapper.appendChild(notesSeparator);
  promptContextControls.appendChild(wrapper);
}

// ── Recent Files ──────────────────────────────────────────────��───────

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

// ── CSV Processing ────────────────────────────────────────────────────

function refreshResultsIfVisible() {
  if (!currentAnalysis) return;
  renderDashboard(currentAnalysis, dashboardContainer);
  renderPromptViewControls();
  renderPromptContextControls();
  syncPromptModeUI();
  if (window.lucide) lucide.createIcons();
  rebuildPromptCache();
  syncPromptOutput();
}

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

// ── Copy Prompt ───────────────────────────────────────────────────────

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

// ── Task Search ───────────────────────────────────────────────────────

export function getAnalysisTasksForSearch() {
  return currentAnalysis?.allTasks || [];
}

export function searchTasks(query, allTasks) {
  const q = query.toLowerCase().trim();
  if (!q || !allTasks) return [];
  return allTasks.filter((task) =>
    task.title?.toLowerCase().includes(q) ||
    task.content?.toLowerCase().includes(q) ||
    (task.tags && task.tags.join(' ').toLowerCase().includes(q)) ||
    task.listName?.toLowerCase().includes(q) ||
    task.folderName?.toLowerCase().includes(q)
  );
}

/**
 * Highlight the first occurrence of query in text using safe DOM nodes.
 * @param {string} text
 * @param {string} query
 * @returns {HTMLElement}
 */
function highlightMatch(text, query) {
  const container = document.createElement('span');
  if (!query) {
    container.textContent = text;
    return container;
  }
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) {
    container.textContent = text;
    return container;
  }
  container.appendChild(document.createTextNode(text.slice(0, idx)));
  const mark = document.createElement('mark');
  mark.className = 'bg-teal-200 dark:bg-teal-700/50 rounded px-0.5';
  mark.appendChild(document.createTextNode(text.slice(idx, idx + query.length)));
  container.appendChild(mark);
  container.appendChild(document.createTextNode(text.slice(idx + query.length)));
  return container;
}

export function renderSearchResults(results, query) {
  searchResults.textContent = '';
  searchResults.classList.remove('hidden');

  const MAX_DISPLAY = 100;
  const statusMap = { pending: '\u23F3', completed: '\u2713', deleted: '\u2717' };

  if (results.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'px-4 py-6 text-sm text-gray-500 text-center';
    empty.textContent = t('searchNoResults');
    searchResults.appendChild(empty);
    return;
  }

  const header = document.createElement('div');
  header.className = 'px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 font-medium';
  const displayCount = Math.min(results.length, MAX_DISPLAY);
  if (results.length > MAX_DISPLAY) {
    header.textContent = `${MAX_DISPLAY} / ${results.length} ${t('searchResultCount')} \u2014 +${results.length - MAX_DISPLAY} ${t('searchResultMore')}`;
  } else {
    header.textContent = `${results.length} ${t('searchResultCount')}`;
  }
  searchResults.appendChild(header);

  const list = document.createElement('div');
  list.className = 'divide-y divide-gray-50 dark:divide-gray-800 max-h-96 overflow-y-auto';

  for (const task of results.slice(0, MAX_DISPLAY)) {
    const row = document.createElement('div');
    row.className = 'search-result-row px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors';

    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-start gap-2';

    const status = document.createElement('span');
    status.className = 'text-xs mt-0.5 flex-shrink-0 ' + (task.status === 'completed' ? 'text-emerald-500' : task.status === 'deleted' ? 'text-red-400' : 'text-amber-500');
    status.textContent = statusMap[task.status] || '\u23F3';

    const titleEl = document.createElement('span');
    titleEl.className = 'text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug';
    titleEl.appendChild(highlightMatch(truncate(task.title || '', 80), query));

    titleRow.appendChild(status);
    titleRow.appendChild(titleEl);

    const metaRow = document.createElement('div');
    metaRow.className = 'flex items-center gap-3 mt-0.5 ml-5 text-xs text-gray-400 dark:text-gray-500';

    if (task.folderName || task.listName) {
      const listMeta = document.createElement('span');
      listMeta.textContent = [task.folderName, task.listName].filter(Boolean).join(' / ');
      metaRow.appendChild(listMeta);
    }
    if (task.createdTime) {
      const dateMeta = document.createElement('span');
      dateMeta.textContent = formatDate(task.createdTime);
      metaRow.appendChild(dateMeta);
    }
    if (task.tags && task.tags.length > 0) {
      const tagMeta = document.createElement('span');
      tagMeta.textContent = task.tags.join(', ');
      metaRow.appendChild(tagMeta);
    }

    row.appendChild(titleRow);
    row.appendChild(metaRow);
    list.appendChild(row);
  }

  searchResults.appendChild(list);
}

function clearSearch() {
  searchInput.value = '';
  searchClear.classList.add('hidden');
  searchResults.classList.add('hidden');
  searchResults.textContent = '';
}

// ── Reset ─────────────────────────────────────────────────────────────

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
  clearSearch();
  hideError();
  showScreen(screenUpload);
}

// ── Language Change Handler ───────────────────────────────────────────

export function onLanguageChange(lang) {
  const swapResult = swapDefaultNotes(userNotes, lang);
  if (swapResult.changed) {
    userNotes = swapResult.notes;
    saveUserNotes(userNotes);
  }

  if (currentAnalysis) {
    refreshResultsIfVisible();
  } else {
    renderPromptContextControls();
  }
}

// ── Initialization ────────────────────────────────────────────���───────

export function init(shared) {
  showScreen = shared.showScreen;
  showError = shared.showError;
  hideError = shared.hideError;

  // DOM references
  screenUpload = shared.screenUpload;
  screenProcessing = shared.screenProcessing;
  screenResults = shared.screenResults;
  processingText = document.getElementById('processing-text');
  dropZone = document.getElementById('drop-zone');
  fileInput = document.getElementById('file-input');
  uploadError = document.getElementById('upload-error');
  dashboardContainer = document.getElementById('dashboard-container');
  promptSection = document.getElementById('prompt-section');
  promptViewControls = document.getElementById('prompt-view-controls');
  promptContextControls = document.getElementById('prompt-context-controls');
  promptOutput = document.getElementById('prompt-output');
  btnCopy = document.getElementById('btn-copy');
  btnNewFile = document.getElementById('btn-new-file');
  copyFeedback = document.getElementById('copy-feedback');
  searchInput = document.getElementById('search-input');
  searchClear = document.getElementById('search-clear');
  searchResults = document.getElementById('search-results');
  recentFilesContainer = document.getElementById('recent-files');
  recentFilesList = document.getElementById('recent-files-list');
  btnClearRecent = document.getElementById('btn-clear-recent');

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

  dropZone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
  });

  // Copy prompt
  btnCopy.addEventListener('click', copyPromptToClipboard);

  for (const link of document.querySelectorAll('.ai-copy-link')) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      copyPromptToClipboard().then(() => {
        window.open(link.href, '_blank', 'noopener,noreferrer');
      });
    });
  }

  // Reset
  btnNewFile.addEventListener('click', resetToUpload);
  document.getElementById('btn-logo').addEventListener('click', resetToUpload);
  btnClearRecent.addEventListener('click', clearRecentFiles);

  // Initial renders
  renderRecentFiles();
  renderPromptViewControls();
  renderPromptContextControls();
  syncPromptModeUI();
}
