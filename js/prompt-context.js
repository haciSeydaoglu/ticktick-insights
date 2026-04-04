/**
 * Prompt context configuration, constants, and pure helper functions.
 * Manages user preferences for AI prompt generation (questions, notes, storage).
 * All functions are stateless — state lives in the controller that imports this.
 */

import { getUILang } from './i18n.js?v=0.2.0';

// ── Prompt Context Questions ──────────────────────────────────────────

export const PROMPT_CONTEXT_QUESTIONS = [
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
      { value: 'list_structure', labelKey: 'promptCtxOptimizeListStructure' },
      { value: 'tag_structure', labelKey: 'promptCtxOptimizeTagStructure' },
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

export const PROMPT_VIEW_OPTIONS = [
  { value: 'full', labelKey: 'promptViewFull' },
  { value: 'raw', labelKey: 'promptViewRaw' },
];

const PROMPT_CONTEXT_STORAGE_KEY = 'ticktick-prompt-context';
const USER_NOTES_KEY = 'ticktick-user-notes';

const DEFAULT_USER_NOTES_BY_LANG = {
  tr: {
    pomodoro: 'Evet, TickTick\'in pomodoro özelliğini kullanıyorum. 52 dk çalış, 12 dk ara ver şeklinde çalışıyorum. İkinci 52 dakikadan sonra 20 dk uzun mola veriyorum.',
    habit: '',
    filter: 'Evet, TickTick\'in filtreleme özelliğini kullanıyorum. Öncelik seviyelerini custom filtrelerle birleştirerek kanban benzeri bir iş akışı sistemi kurdum: Yüksek = Sprint (bu hafta üzerinde çalıştıklarım, "Sprint" filtresiyle takip ediyorum), Orta = Next (sıradaki görevler, "Next" filtresiyle takip ediyorum), Düşük = Backlog (Next adayları, ileride ele alınacak, "Backlog" filtresi), Yok = Triage (henüz sınıflandırılmamış görevler). Görevler Next veya Backlog\'tan doğrudan tamamlanmaz; önce Sprint\'e (Yüksek öncelik) terfi eder, ardından tamamlanır. Bu nedenle Next ve Backlog\'un tamamlanma oranı düşük görünmesi tamamen normaldir, bir sorun değil. Sprint her zaman daha yüksek tamamlanma oranına sahip olacaktır. Bu öncelik dağılımı klasik aciliyet anlamında değil, kanban aşama sistemi olarak yorumlanmalıdır.',
    extra: '',
  },
  en: {
    pomodoro: 'Yes, I use TickTick\'s pomodoro feature. I work for 52 min, take a 12 min break. After the second 52 min session, I take a 20 min long break.',
    habit: '',
    filter: 'Yes, I use TickTick\'s filtering feature. I combined priority levels with custom filters to create a kanban-like workflow system: High = Sprint (tasks I\'m working on this week, tracked with "Sprint" filter), Medium = Next (upcoming tasks, tracked with "Next" filter), Low = Backlog (Next candidates, to be addressed later, "Backlog" filter), None = Triage (unclassified tasks). Tasks don\'t get completed directly from Next or Backlog; they first get promoted to Sprint (High priority), then completed. So low completion rates in Next and Backlog are perfectly normal, not a problem. Sprint will always have a higher completion rate. This priority distribution should be interpreted as a kanban stage system, not in the classic urgency sense.',
    extra: '',
  },
};

export const NOTE_KEYS = ['pomodoro', 'habit', 'filter', 'extra'];

// ── Pure Functions ────────────────────────────────────────────────────

export function getDefaultUserNotes(lang) {
  return { ...(DEFAULT_USER_NOTES_BY_LANG[lang] || DEFAULT_USER_NOTES_BY_LANG.tr) };
}

export function isDefaultNoteValue(key, value) {
  return Object.values(DEFAULT_USER_NOTES_BY_LANG).some(defaults => defaults[key] === value);
}

export function loadUserNotes() {
  const defaults = getDefaultUserNotes(getUILang());
  try {
    const stored = JSON.parse(localStorage.getItem(USER_NOTES_KEY));
    if (!stored || typeof stored !== 'object') {
      return Object.fromEntries(NOTE_KEYS.map(k => [k, { value: defaults[k], isCustom: false }]));
    }

    // Migrate old format (plain strings) to new format ({ value, isCustom })
    const firstEntry = stored[NOTE_KEYS[0]];
    const isOldFormat = typeof firstEntry === 'string';

    return Object.fromEntries(NOTE_KEYS.map(key => {
      if (isOldFormat) {
        const val = typeof stored[key] === 'string' ? stored[key] : defaults[key];
        return [key, { value: val, isCustom: !isDefaultNoteValue(key, val) }];
      }
      const entry = stored[key];
      if (entry && typeof entry === 'object' && typeof entry.value === 'string') {
        return [key, { value: entry.value, isCustom: entry.isCustom === true }];
      }
      return [key, { value: defaults[key], isCustom: false }];
    }));
  } catch {
    return Object.fromEntries(NOTE_KEYS.map(k => [k, { value: defaults[k], isCustom: false }]));
  }
}

export function saveUserNotes(notes) {
  localStorage.setItem(USER_NOTES_KEY, JSON.stringify(notes));
}

/**
 * Swap default notes when language changes; custom notes are preserved.
 * Pure function — returns new notes and whether anything changed.
 */
export function swapDefaultNotes(userNotes, newLang) {
  const newDefaults = getDefaultUserNotes(newLang);
  let changed = false;
  const result = {};
  for (const key of NOTE_KEYS) {
    if (!userNotes[key].isCustom) {
      result[key] = { value: newDefaults[key], isCustom: false };
      changed = true;
    } else {
      result[key] = userNotes[key];
    }
  }
  return { notes: result, changed };
}

export function flattenUserNotes(notes) {
  const flat = {};
  for (const [key, entry] of Object.entries(notes)) {
    flat[key] = entry && typeof entry === 'object' ? entry.value : entry;
  }
  return flat;
}

export function createDefaultPromptContext() {
  return {
    users: 'solo',
    useCases: ['software_projects'],
    painPoints: ['clutter', 'stalled'],
    optimize: ['list_structure', 'tag_structure', 'workflow'],
    style: 'direct',
    taskLimit: 7,
  };
}

export function createEmptyPromptCache() {
  return {
    full: { tr: '', en: '' },
    raw: { tr: '', en: '' },
  };
}

export function getOrderedMultiValue(question, values) {
  const currentValues = new Set(Array.isArray(values) ? values : []);
  return question.options
    .map((option) => option.value)
    .filter((value) => currentValues.has(value));
}

export function normalizePromptContext(context) {
  const defaults = createDefaultPromptContext();
  const source = context && typeof context === 'object' ? { ...context } : {};
  const normalized = {};

  // Migrate old "structure" value to split options
  if (Array.isArray(source.optimize) && source.optimize.includes('structure')) {
    source.optimize = source.optimize.flatMap((v) => (v === 'structure' ? ['list_structure', 'tag_structure'] : [v]));
  }

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

  // Extra fields outside PROMPT_CONTEXT_QUESTIONS
  const rawLimit = source.taskLimit;
  normalized.taskLimit = (Number.isInteger(rawLimit) && rawLimit >= 3 && rawLimit <= 20) ? rawLimit : defaults.taskLimit;

  return normalized;
}

export function loadPromptContext() {
  try {
    return normalizePromptContext(JSON.parse(localStorage.getItem(PROMPT_CONTEXT_STORAGE_KEY)));
  } catch {
    return createDefaultPromptContext();
  }
}

export function savePromptContext(context) {
  localStorage.setItem(PROMPT_CONTEXT_STORAGE_KEY, JSON.stringify(normalizePromptContext(context)));
}

export function getQuestionById(questionId) {
  return PROMPT_CONTEXT_QUESTIONS.find((question) => question.id === questionId);
}

export function isOptionSelected(question, optionValue, context) {
  const value = context[question.id];
  return question.type === 'multi'
    ? Array.isArray(value) && value.includes(optionValue)
    : value === optionValue;
}
