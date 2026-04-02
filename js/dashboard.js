/**
 * Dashboard renderer module.
 * Renders analysis results as visual HTML components using Tailwind classes.
 * Light theme, modern design.
 * SECURITY: All user data rendered via textContent/createTextNode only.
 */

import {
  createEl,
  createElement,
  formatNumber,
  formatPercent,
  formatDate,
  priorityLabel,
  truncate,
} from './utils.js?v=0.1.11';
import { t } from './i18n.js?v=0.1.11';

/**
 * Create a Lucide icon element.
 * @param {string} name - Lucide icon name
 * @param {string} [cls] - Additional CSS classes
 * @returns {HTMLElement}
 */
function icon(name, cls = 'w-4 h-4') {
  const el = document.createElement('i');
  el.setAttribute('data-lucide', name);
  el.className = cls;
  return el;
}

export function renderDashboard(analysis, container) {
  container.textContent = '';
  renderSummaryCards(analysis.summary, analysis.priorityBreakdown, analysis.recurring, container);
  renderPriorityChart(analysis.priorityBreakdown, container);
  renderFeatureUsage(analysis.featureUsage, container);
  renderTimeline(analysis.timeline, container);
  renderInsights(analysis.insights, container);
  renderRecurring(analysis.recurring, container);
  renderTagTable(analysis.tags, container);
  renderFolderTree(analysis.folders, container);
}

function renderSummaryCards(summary, priorityBreakdown, recurring, container) {
  const grid = createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-3 mb-8' });

  const cards = [
    { label: t('totalTasks'), value: formatNumber(summary.total), color: 'text-gray-900 dark:text-gray-100' },
    {
      label: t('completed'),
      value: formatNumber(summary.completed),
      sub: recurring && recurring.distinctTaskCount > 0
        ? `${recurring.distinctTaskCount} ${t('differentRoutines')} (${formatNumber(recurring.totalCompletions)} ${t('routineCompletions')}) + ${formatNumber(recurring.uniqueCompletions)} ${t('uniqueCompletions')}`
        : formatPercent(summary.completionRate),
      color: 'text-emerald-600',
    },
    { label: t('pending'), value: formatNumber(summary.pending), color: 'text-amber-600' },
    { label: t('deleted'), value: formatNumber(summary.deleted), color: 'text-red-500' },
    { label: t('highPriority'), value: formatNumber(priorityBreakdown[5]?.count || 0), sub: t('urgentTasks'), color: 'text-red-500' },
    { label: t('completionRate'), value: formatPercent(summary.completionRate), color: summary.completionRate >= 60 ? 'text-emerald-600' : 'text-amber-600' },
  ];

  if (summary.dateRange.earliest) {
    cards.push({
      label: t('dateRange'),
      value: formatDate(summary.dateRange.earliest) + ' – ' + formatDate(summary.dateRange.latest),
      color: 'text-gray-700',
      small: true,
    });
  }

  for (const card of cards) {
    const cardEl = createElement('div', { className: 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm' }, [
      createEl('div', card.label, 'text-[11px] uppercase tracking-wider text-gray-500 mb-1 font-medium'),
      createEl('div', card.value, `${card.small ? 'text-sm' : 'text-2xl'} font-bold ${card.color}`),
    ]);
    if (card.sub) {
      cardEl.appendChild(createEl('div', card.sub, 'text-xs text-gray-500 mt-0.5'));
    }
    grid.appendChild(cardEl);
  }

  // Completion progress bar
  const progressCard = createElement('div', { className: 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm' });
  progressCard.appendChild(createEl('div', t('completionRate'), 'text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-medium'));
  const bar = createElement('div', { className: 'h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden' });
  const fill = createElement('div', { className: `h-full rounded-full transition-all duration-500 ${summary.completionRate >= 70 ? 'bg-emerald-500' : summary.completionRate >= 40 ? 'bg-amber-500' : 'bg-red-500'}` });
  fill.style.width = `${Math.min(summary.completionRate, 100)}%`;
  bar.appendChild(fill);
  progressCard.appendChild(bar);
  progressCard.appendChild(createEl('div', formatPercent(summary.completionRate), 'text-lg font-bold text-gray-800 dark:text-gray-200 mt-1'));
  grid.appendChild(progressCard);

  container.appendChild(grid);
}

function renderPriorityChart(priorityBreakdown, container) {
  const section = createElement('div', { className: 'mb-8' }, [
    createEl('h2', t('priorityDist'), 'text-base font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800'),
  ]);

  const chart = createElement('div', { className: 'flex gap-4 items-end h-36 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm' });
  const entries = [
    { key: 5, label: t('high'), color: 'bg-red-500' },
    { key: 3, label: t('medium'), color: 'bg-amber-400' },
    { key: 1, label: t('low'), color: 'bg-blue-400' },
    { key: 0, label: t('none'), color: 'bg-gray-300' },
  ];

  const maxVal = Math.max(...entries.map((e) => priorityBreakdown[e.key]?.count || 0), 1);

  for (const entry of entries) {
    const count = priorityBreakdown[entry.key]?.count || 0;
    const heightPct = (count / maxVal) * 100;

    const item = createElement('div', { className: 'flex-1 flex flex-col items-center gap-1.5 h-full justify-end' });
    item.appendChild(createEl('div', formatNumber(count), 'text-xs font-bold text-gray-600 dark:text-gray-300'));

    const barFill = createElement('div', { className: `w-full max-w-[60px] rounded-lg ${entry.color} bar-fill` });
    barFill.style.height = `${heightPct}%`;
    item.appendChild(barFill);
    item.appendChild(createEl('div', entry.label, 'text-[11px] text-gray-500 font-medium mt-1'));

    chart.appendChild(item);
  }

  section.appendChild(chart);

  // Priority-based task details
  const priorityDetails = createElement('div', { className: 'mt-3 space-y-2' });
  const priorityEntries = [
    { key: 5, label: `${t('high')} Priority` },
    { key: 3, label: `${t('medium')} Priority` },
    { key: 1, label: `${t('low')} Priority` },
  ];

  for (const pEntry of priorityEntries) {
    const pData = priorityBreakdown[pEntry.key];
    if (!pData || (pData.pendingTasks.length === 0 && pData.completedTasks.length === 0)) continue;

    const collapsible = createCollapsible(
      pEntry.label,
      `${pData.count} ${t('tasks')} · ${pData.pendingCount} ${t('pending').toLowerCase()} · ${pData.completedCount} ${t('completed').toLowerCase()}`,
      () => {
        const detail = createElement('div', { className: 'space-y-3' });
        if (pData.pendingTasks.length > 0) {
          detail.appendChild(createEl('h4', `${t('pendingTasks')} (${t('latest')} ${pData.pendingTasks.length})`, 'text-xs font-semibold text-amber-600'));
          detail.appendChild(buildTaskTable(pData.pendingTasks, [t('title'), t('list'), t('createdDate'), t('tags')], (task) => [truncate(task.title, 60), task.listName, formatDate(task.createdTime), task.tags.join(', ')]));
        }
        if (pData.completedTasks.length > 0) {
          detail.appendChild(createEl('h4', `${t('completedTasks')} (${t('latest')} ${pData.completedTasks.length})`, 'text-xs font-semibold text-emerald-600 mt-2'));
          detail.appendChild(buildTaskTable(pData.completedTasks, [t('title'), t('list'), t('completedDate')], (task) => [truncate(task.title, 60), task.listName, formatDate(task.completedTime)]));
        }
        return detail;
      }
    );
    priorityDetails.appendChild(collapsible);
  }

  section.appendChild(priorityDetails);
  container.appendChild(section);
}

function renderFeatureUsage(featureUsage, container) {
  const section = createElement('div', { className: 'mb-8' }, [
    createEl('h2', t('featureUsage'), 'text-base font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800'),
  ]);

  const featureI18nMap = { Priority: 'featPriority', Tags: 'featTags', Reminders: 'featReminders', 'Recurring Tasks': 'featRecurring', 'Due Dates': 'featDueDates', 'Start Dates': 'featStartDates', Descriptions: 'featDescriptions', Subtasks: 'featSubtasks' };
  const tipI18nMap = { Priority: 'tipPriority', Tags: 'tipTags', Reminders: 'tipReminders', 'Recurring Tasks': 'tipRecurring', 'Due Dates': 'tipDueDates', 'Start Dates': 'tipStartDates', Descriptions: 'tipDescriptions', Subtasks: 'tipSubtasks' };

  const grid = createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3' });

  for (const feature of featureUsage) {
    const scoreColors = {
      good: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
      medium: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', bar: 'bg-amber-400' },
      low: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-400' },
    };
    const sc = scoreColors[feature.score];
    const scoreLabel = t(`feature${feature.score.charAt(0).toUpperCase() + feature.score.slice(1)}`);
    const featureName = t(featureI18nMap[feature.name] || feature.name);
    const featureTip = t(tipI18nMap[feature.name] || '');

    const card = createElement('div', { className: 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm' });
    const nameSpan = createElement('span', { className: 'flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300' }, [
      icon(feature.icon, 'w-3.5 h-3.5'),
      createEl('span', featureName),
    ]);
    const header = createElement('div', { className: 'flex items-center justify-between mb-2' }, [
      nameSpan,
      createEl('span', scoreLabel, `text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`),
    ]);
    card.appendChild(header);
    card.appendChild(createEl('div', `${formatNumber(feature.usage)} / ${formatPercent(feature.percent)}`, 'text-xs text-gray-500 mb-2'));

    const bar = createElement('div', { className: 'h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2' });
    const barFill = createElement('div', { className: `h-full rounded-full ${sc.bar} progress-fill` });
    barFill.style.width = `${Math.min(feature.percent, 100)}%`;
    bar.appendChild(barFill);
    card.appendChild(bar);
    card.appendChild(createEl('div', featureTip, 'text-[10px] text-gray-500 leading-relaxed'));

    grid.appendChild(card);
  }

  section.appendChild(grid);
  container.appendChild(section);
}

function renderTimeline(timeline, container) {
  if (timeline.length === 0) return;

  const section = createElement('div', { className: 'mb-8' }, [
    createEl('h2', t('timeline'), 'text-base font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800'),
  ]);

  const displayData = timeline.length > 24 ? timeline.slice(-24) : timeline;
  const maxVal = Math.max(...displayData.map((t) => Math.max(t.created, t.completed)), 1);

  const chart = createElement('div', { className: 'flex items-end gap-1 h-28 overflow-x-auto pb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm' });

  for (const entry of displayData) {
    const item = createElement('div', { className: 'flex-1 min-w-[20px] flex items-end gap-px h-full' });
    const createdBar = createElement('div', { className: 'flex-1 bg-teal-400 rounded-t bar-fill' });
    createdBar.style.height = `${(entry.created / maxVal) * 90}%`;
    createdBar.title = `${t('created')}: ${entry.created}`;
    const completedBar = createElement('div', { className: 'flex-1 bg-emerald-400 rounded-t bar-fill' });
    completedBar.style.height = `${(entry.completed / maxVal) * 90}%`;
    completedBar.title = `${t('completed')}: ${entry.completed}`;
    item.appendChild(createdBar);
    item.appendChild(completedBar);

    const wrapper = createElement('div', { className: 'flex flex-col items-center flex-1 min-w-[20px]' });
    wrapper.appendChild(item);
    wrapper.appendChild(createEl('div', entry.month.slice(2), 'text-[8px] text-gray-500 mt-1'));
    chart.appendChild(wrapper);
  }

  section.appendChild(chart);
  const legend = createElement('div', { className: 'flex items-center gap-4 text-[10px] text-gray-500 mt-2' }, [
    createElement('span', { className: 'flex items-center gap-1' }, [
      createElement('span', { className: 'w-2 h-2 rounded-full bg-teal-400 inline-block' }),
      createEl('span', t('created')),
    ]),
    createElement('span', { className: 'flex items-center gap-1' }, [
      createElement('span', { className: 'w-2 h-2 rounded-full bg-emerald-400 inline-block' }),
      createEl('span', t('completed')),
    ]),
  ]);
  section.appendChild(legend);
  container.appendChild(section);
}

function renderRecurring(recurring, container) {
  if (!recurring || recurring.distinctTaskCount === 0) return;

  const section = createElement('div', { className: 'mb-8' }, [
    createEl('h2', t('routineTasks'), 'text-base font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800'),
  ]);

  // Summary row
  const summary = createElement('div', { className: 'flex flex-wrap gap-3 mb-4' });
  summary.appendChild(makeInsightCard(
    t('routineTasksDetail'),
    `${recurring.distinctTaskCount} ${t('differentRoutines')}`,
    `${formatNumber(recurring.totalCompletions)} ${t('routineCompletions')} · ${formatNumber(recurring.uniqueCompletions)} ${t('uniqueCompletions')}`
  ));
  section.appendChild(summary);

  // Top recurring tasks bar list
  const maxCount = recurring.tasks[0]?.count || 1;
  const listEl = createElement('div', { className: 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-2' });

  const displayTasks = recurring.tasks.slice(0, 10);
  for (const task of displayTasks) {
    const widthPct = Math.round((task.count / maxCount) * 100);
    const row = createElement('div', { className: 'flex items-center gap-3' });

    const label = createElement('div', { className: 'w-48 flex-shrink-0 text-xs text-gray-700 dark:text-gray-300 truncate' });
    label.textContent = truncate(task.title, 40);

    const barWrapper = createElement('div', { className: 'flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden' });
    const barFill = createElement('div', { className: 'h-full bg-teal-400 rounded-full progress-fill' });
    barFill.style.width = `${widthPct}%`;
    barWrapper.appendChild(barFill);

    const countEl = createElement('div', { className: 'w-16 text-right text-xs font-semibold text-teal-600 dark:text-teal-400 flex-shrink-0' });
    countEl.textContent = `${formatNumber(task.count)}×`;

    row.appendChild(label);
    row.appendChild(barWrapper);
    row.appendChild(countEl);
    listEl.appendChild(row);
  }

  section.appendChild(listEl);
  container.appendChild(section);
}

function renderInsights(insights, container) {
  const section = createElement('div', { className: 'mb-8' }, [
    createEl('h2', t('keyInsights'), 'text-base font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800'),
  ]);

  const grid = createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-3 mb-4' });

  if (insights.avgCompletionDays > 0) grid.appendChild(makeInsightCard(t('avgCompletion'), `${insights.avgCompletionDays.toFixed(1)} ${t('days')}`));
  if (insights.busiestList) grid.appendChild(makeInsightCard(t('busiestList'), insights.busiestList.name, `${formatNumber(insights.busiestList.total)} ${t('tasks')}`));
  if (insights.mostNeglectedList) grid.appendChild(makeInsightCard(t('neglectedList'), insights.mostNeglectedList.name, `${formatPercent(insights.mostNeglectedList.completionRate)} ${t('completion')}`));

  const ra = insights.recentActivity;
  grid.appendChild(makeInsightCard(t('last7days'), `${ra.last7days.created}↑ ${ra.last7days.completed}✓`, t('createdCompleted')));
  grid.appendChild(makeInsightCard(t('last30days'), `${ra.last30days.created}↑ ${ra.last30days.completed}✓`, t('createdCompleted')));
  section.appendChild(grid);

  if (insights.oldestPendingTasks.length > 0) {
    section.appendChild(createEl('h3', t('oldestPending'), 'text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2'));
    section.appendChild(buildTaskTable(insights.oldestPendingTasks, [t('title'), t('list'), t('createdDate'), t('priority')], (task) => [truncate(task.title, 60), task.listName, formatDate(task.createdTime), priorityLabel(task.priority)]));
  }

  container.appendChild(section);
}

function makeInsightCard(label, value, sub) {
  const card = createElement('div', { className: 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm' }, [
    createEl('div', label, 'text-[11px] uppercase tracking-wider text-gray-500 mb-1 font-medium'),
    createEl('div', value, 'text-sm font-bold text-gray-800 dark:text-gray-200 truncate'),
  ]);
  if (sub) card.appendChild(createEl('div', sub, 'text-xs text-gray-500 mt-0.5'));
  return card;
}

function renderTagTable(tags, container) {
  if (tags.length === 0) return;
  const section = createElement('div', { className: 'mb-8' }, [
    createEl('h2', t('tags'), 'text-base font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800'),
  ]);

  for (const tag of tags) {
    const collapsible = createCollapsible(
      tag.name,
      `${tag.total} ${t('tasks')} · ${tag.completed}✓ · ${tag.pending} ${t('pending').toLowerCase()} · ${formatPercent(tag.completionRate)}`,
      () => {
        const detail = createElement('div', { className: 'space-y-3' });
        detail.appendChild(createEl('div', `${t('lists')}: ${tag.lists.join(', ')}`, 'text-xs text-gray-500'));
        if (tag.pendingTasks?.length > 0) {
          detail.appendChild(createEl('h4', `${t('pendingTasks')} (${t('latest')} ${tag.pendingTasks.length})`, 'text-xs font-semibold text-amber-600 mt-2'));
          detail.appendChild(buildTaskTable(tag.pendingTasks, [t('title'), t('list'), t('createdDate'), t('priority')], (task) => [truncate(task.title, 60), task.listName, formatDate(task.createdTime), priorityLabel(task.priority)]));
        }
        if (tag.completedTasks?.length > 0) {
          detail.appendChild(createEl('h4', `${t('completedTasks')} (${t('latest')} ${tag.completedTasks.length})`, 'text-xs font-semibold text-emerald-600 mt-2'));
          detail.appendChild(buildTaskTable(tag.completedTasks, [t('title'), t('list'), t('completedDate')], (task) => [truncate(task.title, 60), task.listName, formatDate(task.completedTime)]));
        }
        return detail;
      }
    );
    section.appendChild(collapsible);
  }
  container.appendChild(section);
}

function renderFolderTree(folders, container) {
  const section = createElement('div', { className: 'mb-8' }, [
    createEl('h2', t('foldersLists'), 'text-base font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800'),
  ]);

  for (const folder of folders) {
    const folderEl = createCollapsible(
      folder.name,
      `${folder.total} ${t('tasks')} · ${folder.lists.length} ${t('lists').toLowerCase()}`,
      () => {
        const content = createElement('div', { className: 'space-y-2' });
        for (const list of folder.lists) {
          content.appendChild(createCollapsible(
            list.name,
            `${list.total} ${t('total').toLowerCase()} · ${list.completed}✓ · ${list.pending} ${t('pending').toLowerCase()} · ${formatPercent(list.completionRate)}`,
            () => renderListDetail(list)
          ));
        }
        return content;
      }
    );
    section.appendChild(folderEl);
  }
  container.appendChild(section);
}

function renderListDetail(list) {
  const detail = createElement('div', { className: 'space-y-3' });
  const tagEntries = Object.entries(list.tags);
  if (tagEntries.length > 0) {
    const tagLine = createElement('div', { className: 'text-xs text-gray-500' });
    tagLine.textContent = `${t('tags')}: ${tagEntries.map(([name, count]) => `${name} (${count})`).join(', ')}`;
    detail.appendChild(tagLine);
  }
  if (list.pendingTasks.length > 0) {
    detail.appendChild(createEl('h4', `${t('pendingTasks')} (${t('latest')} ${list.pendingTasks.length})`, 'text-xs font-semibold text-amber-600 mt-2'));
    detail.appendChild(buildTaskTable(list.pendingTasks, [t('title'), t('createdDate'), t('priority')], (task) => [truncate(task.title, 70), formatDate(task.createdTime), priorityLabel(task.priority)]));
  }
  if (list.completedTasks.length > 0) {
    detail.appendChild(createEl('h4', `${t('completedTasks')} (${t('latest')} ${list.completedTasks.length})`, 'text-xs font-semibold text-emerald-600 mt-2'));
    detail.appendChild(buildTaskTable(list.completedTasks, [t('title'), t('completedDate'), t('priority')], (task) => [truncate(task.title, 70), formatDate(task.completedTime), priorityLabel(task.priority)]));
  }
  return detail;
}

function buildTaskTable(tasks, headers, rowMapper) {
  const table = createElement('table', { className: 'w-full text-xs' });
  const thead = createElement('thead', {}, [
    createElement('tr', { className: 'text-left border-b border-gray-100 dark:border-gray-800' },
      headers.map((h) => createEl('th', h, 'py-2 px-2 text-[10px] uppercase text-gray-500 font-semibold'))
    ),
  ]);
  table.appendChild(thead);

  const tbody = createElement('tbody');
  for (const task of tasks) {
    const values = rowMapper(task);
    const row = createElement('tr', { className: 'border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30' },
      values.map((v) => createEl('td', v, 'py-2 px-2 text-gray-600 dark:text-gray-300'))
    );
    tbody.appendChild(row);
  }
  table.appendChild(tbody);

  const wrapper = createElement('div', { className: 'overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800' });
  wrapper.appendChild(table);
  return wrapper;
}

function createCollapsible(title, stats, contentBuilder) {
  const wrapper = createElement('div', { className: 'collapsible bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl mb-2 overflow-hidden shadow-sm' });
  const header = createElement('div', { className: 'flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors' });
  const titleEl = createElement('div', { className: 'flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300' }, [
    icon('chevron-right', 'collapsible-arrow w-3.5 h-3.5 text-gray-400 transition-transform duration-200'),
    createEl('span', title),
  ]);
  const statsEl = createEl('span', stats, 'text-[11px] text-gray-500 hidden sm:block');

  header.appendChild(titleEl);
  header.appendChild(statsEl);

  const body = createElement('div', { className: 'collapsible-body px-4 pb-3' });
  let loaded = false;

  header.addEventListener('click', () => {
    wrapper.classList.toggle('open');
    if (!loaded) {
      body.appendChild(contentBuilder());
      loaded = true;
    }
    if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide' });
  });

  wrapper.appendChild(header);
  wrapper.appendChild(body);
  return wrapper;
}
