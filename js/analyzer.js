/**
 * Data analysis module.
 * Processes parsed TickTick tasks into statistics, groupings, and insights.
 * Single-pass design for performance.
 */

import { daysBetween, getMonthKey } from './utils.js?v=0.1.18';

/**
 * Analyze an array of parsed tasks and produce comprehensive statistics.
 * @param {Object[]} tasks - Array of normalized task objects from csv-parser
 * @returns {Object} Complete analysis result
 */
export function analyze(tasks) {
  const summary = {
    total: 0,
    completed: 0,
    pending: 0,
    deleted: 0,
    completionRate: 0,
    taskCreationVelocity: 0,
    taskAbandonment: 0,
    dateRange: { earliest: null, latest: null },
  };

  const priorityBreakdown = {
    0: { count: 0, pendingCount: 0, completedCount: 0, pendingTasks: [], completedTasks: [] },
    1: { count: 0, pendingCount: 0, completedCount: 0, pendingTasks: [], completedTasks: [] },
    3: { count: 0, pendingCount: 0, completedCount: 0, pendingTasks: [], completedTasks: [] },
    5: { count: 0, pendingCount: 0, completedCount: 0, pendingTasks: [], completedTasks: [] },
  };
  const kindBreakdown = { TEXT: 0, CHECKLIST: 0, NOTE: 0 };

  // Folder > List grouping
  const folderMap = new Map(); // folderName -> Map(listName -> listData)
  const tagMap = new Map();    // tagName -> { total, completed, pending, lists: Set }
  const timelineMap = new Map(); // "YYYY-MM" -> { created, completed }

  // Feature usage counters
  const featureCounters = {
    withPriority: 0,
    withTags: 0,
    withReminder: 0,
    withRepeat: 0,
    withDueDate: 0,
    withStartDate: 0,
    withContent: 0,
    withAllDay: 0,
    subtasks: 0,
    multipleTagTasks: 0,
  };

  // For completion time calculation
  const completionDays = [];

  // For recurring task detection: track completed tasks by normalized title
  const completedTitleMap = new Map();

  // Single pass through all tasks
  for (const task of tasks) {
    summary.total++;

    // Status counts
    if (task.status === 'completed') summary.completed++;
    else if (task.status === 'deleted') summary.deleted++;
    else summary.pending++;

    // Priority
    const pKey = [0, 1, 3, 5].includes(task.priority) ? task.priority : 0;
    priorityBreakdown[pKey].count++;
    if (task.status === 'completed') {
      priorityBreakdown[pKey].completedCount++;
      insertSorted(priorityBreakdown[pKey].completedTasks, task, 'completedTime', 10);
    } else if (task.status === 'pending') {
      priorityBreakdown[pKey].pendingCount++;
      insertSorted(priorityBreakdown[pKey].pendingTasks, task, 'createdTime', 10);
    }

    // Kind
    const kind = task.kind.toUpperCase();
    if (kindBreakdown[kind] !== undefined) {
      kindBreakdown[kind]++;
    } else {
      kindBreakdown.TEXT++;
    }

    // Date range
    if (task.createdTime) {
      const created = new Date(task.createdTime);
      if (!isNaN(created.getTime())) {
        if (!summary.dateRange.earliest || created < summary.dateRange.earliest) {
          summary.dateRange.earliest = created;
        }
        if (!summary.dateRange.latest || created > summary.dateRange.latest) {
          summary.dateRange.latest = created;
        }
      }
    }

    // Folder/List grouping
    const folderName = task.folderName || '(No Folder)';
    const listName = task.listName || '(No List)';

    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, new Map());
    }
    const listsInFolder = folderMap.get(folderName);
    if (!listsInFolder.has(listName)) {
      listsInFolder.set(listName, createListData(listName));
    }
    const listData = listsInFolder.get(listName);
    addTaskToList(listData, task);

    // Tags
    for (const tag of task.tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { name: tag, total: 0, completed: 0, pending: 0, lists: new Set(), pendingTasks: [], completedTasks: [] });
      }
      const tagData = tagMap.get(tag);
      tagData.total++;
      if (task.status === 'completed') {
        tagData.completed++;
        insertSorted(tagData.completedTasks, task, 'completedTime', 10);
      }
      else if (task.status === 'pending') {
        tagData.pending++;
        insertSorted(tagData.pendingTasks, task, 'createdTime', 10);
      }
      tagData.lists.add(listName);
    }

    // Timeline
    const createdMonth = getMonthKey(task.createdTime);
    if (createdMonth) {
      if (!timelineMap.has(createdMonth)) {
        timelineMap.set(createdMonth, { month: createdMonth, created: 0, completed: 0 });
      }
      timelineMap.get(createdMonth).created++;
    }
    const completedMonth = getMonthKey(task.completedTime);
    if (completedMonth) {
      if (!timelineMap.has(completedMonth)) {
        timelineMap.set(completedMonth, { month: completedMonth, created: 0, completed: 0 });
      }
      timelineMap.get(completedMonth).completed++;
    }

    // Feature usage
    if (task.priority > 0) featureCounters.withPriority++;
    if (task.tags.length > 0) featureCounters.withTags++;
    if (task.tags.length > 1) featureCounters.multipleTagTasks++;
    if (task.reminder) featureCounters.withReminder++;
    if (task.repeat) featureCounters.withRepeat++;
    if (task.dueDate) featureCounters.withDueDate++;
    if (task.startDate) featureCounters.withStartDate++;
    if (task.content) featureCounters.withContent++;
    if (task.isAllDay) featureCounters.withAllDay++;
    if (task.parentId) featureCounters.subtasks++;

    // Completion time
    if (task.status === 'completed' && task.createdTime && task.completedTime) {
      const days = daysBetween(task.createdTime, task.completedTime);
      if (days >= 0) completionDays.push(days);
    }

    // Recurring task detection: group completed tasks by normalized title
    if (task.status === 'completed') {
      const key = task.title.trim().toLowerCase();
      if (key.length > 0) {
        const existing = completedTitleMap.get(key);
        if (existing) {
          existing.count++;
          if (!existing.lastCompleted || task.completedTime > existing.lastCompleted) {
            existing.lastCompleted = task.completedTime;
          }
        } else {
          completedTitleMap.set(key, {
            title: task.title,
            count: 1,
            lastCompleted: task.completedTime || null,
            folderName: task.folderName || '',
            listName: task.listName || '',
          });
        }
      }
    }
  }

  // Completion rate (exclude deleted)
  const activeTotal = summary.completed + summary.pending;
  summary.completionRate = activeTotal > 0
    ? (summary.completed / activeTotal) * 100
    : 0;

  // Task creation velocity: average tasks created per month
  summary.taskCreationVelocity = timelineMap.size > 0 ? summary.total / timelineMap.size : 0;

  // Likely recurring tasks: same title completed 3+ times
  const RECURRING_THRESHOLD = 3;
  const recurringTasks = Array.from(completedTitleMap.values())
    .filter((e) => e.count >= RECURRING_THRESHOLD)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  const recurringCompletionCount = recurringTasks.reduce((sum, e) => sum + e.count, 0);
  const uniqueCompletionCount = summary.completed - recurringCompletionCount;

  // Deduplicate recurring task instances from summary counts.
  // In TickTick backups each recurring completion is a separate CSV row.
  // Collapse: remove (recurringCompletionCount - recurringTasks.length) from totals.
  const recurringInflation = recurringCompletionCount - recurringTasks.length;
  summary.rawTotal = summary.total;
  summary.rawCompleted = summary.completed;
  if (recurringInflation > 0) {
    summary.total -= recurringInflation;
    summary.completed -= recurringInflation;
    const deduplicatedActive = summary.completed + summary.pending;
    summary.completionRate = deduplicatedActive > 0
      ? (summary.completed / deduplicatedActive) * 100
      : 0;
    if (timelineMap.size > 0) {
      summary.taskCreationVelocity = summary.total / timelineMap.size;
    }
  }

  // Merge explicit (Repeat column) and behavior-inferred recurring counts.
  // withRepeat covers pending tasks with RRULE; recurringDistinct covers completed patterns.
  // No overlap: pending vs completed, safe to sum.
  featureCounters.recurringDistinct = recurringTasks.length;
  featureCounters.recurringTotalCompletions = recurringCompletionCount;

  // Build folders array with sorted lists
  const folders = buildFolderArray(folderMap);

  // Build tags array
  const tags = Array.from(tagMap.values())
    .map((t) => ({
      ...t,
      completionRate: t.total > 0 ? (t.completed / t.total) * 100 : 0,
      lists: Array.from(t.lists),
    }))
    .sort((a, b) => b.total - a.total);

  // Build sorted timeline
  const timeline = Array.from(timelineMap.values())
    .sort((a, b) => a.month.localeCompare(b.month));

  // Feature usage analysis with scores
  const featureUsage = buildFeatureUsage(featureCounters, summary.total);

  // Insights
  const avgCompletionDays = completionDays.length > 0
    ? completionDays.reduce((a, b) => a + b, 0) / completionDays.length
    : 0;

  const allLists = folders.flatMap((f) => f.lists);
  const busiestList = allLists.reduce(
    (max, l) => (l.total > (max?.total || 0) ? l : max),
    null
  );
  const mostNeglectedList = allLists
    .filter((l) => l.pending > 5)
    .reduce(
      (min, l) => (l.completionRate < (min?.completionRate ?? 101) ? l : min),
      null
    );

  // Oldest pending tasks (top 5)
  const oldestPendingTasks = tasks
    .filter((t) => t.status === 'pending' && t.createdTime)
    .sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime))
    .slice(0, 5);

  // Recent activity
  const now = new Date();
  const days7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const days30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const recentActivity = {
    last7days: { created: 0, completed: 0 },
    last30days: { created: 0, completed: 0 },
  };

  for (const task of tasks) {
    if (task.createdTime) {
      const d = new Date(task.createdTime);
      if (d >= days7) recentActivity.last7days.created++;
      if (d >= days30) recentActivity.last30days.created++;
    }
    if (task.completedTime) {
      const d = new Date(task.completedTime);
      if (d >= days7) recentActivity.last7days.completed++;
      if (d >= days30) recentActivity.last30days.completed++;
    }
  }

  // Task abandonment: pending tasks created 180+ days ago
  const sixMonthsAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);
  const abandonedCount = tasks.filter(
    (t) => t.status === 'pending' && t.createdTime && new Date(t.createdTime) < sixMonthsAgo
  ).length;
  summary.taskAbandonment = summary.pending > 0 ? (abandonedCount / summary.pending) * 100 : 0;

  return {
    summary,
    priorityBreakdown,
    kindBreakdown,
    folders,
    tags,
    timeline,
    featureUsage,
    recurring: {
      tasks: recurringTasks,
      totalCompletions: recurringCompletionCount,
      uniqueCompletions: uniqueCompletionCount,
      distinctTaskCount: recurringTasks.length,
      mergedCount: featureCounters.withRepeat + recurringTasks.length,
      inflation: recurringInflation,
    },
    insights: {
      avgCompletionDays,
      busiestList,
      mostNeglectedList,
      oldestPendingTasks,
      recentActivity,
    },
  };
}

/**
 * Create an empty list data structure.
 */
function createListData(name) {
  return {
    name,
    total: 0,
    completed: 0,
    pending: 0,
    deleted: 0,
    completionRate: 0,
    pendingTasks: [],
    completedTasks: [],
    tags: new Map(),
  };
}

/**
 * Add a task to a list data structure, maintaining sorted top-10 lists.
 */
function addTaskToList(listData, task) {
  listData.total++;

  if (task.status === 'completed') {
    listData.completed++;
    insertSorted(listData.completedTasks, task, 'completedTime', 10);
  } else if (task.status === 'deleted') {
    listData.deleted++;
  } else {
    listData.pending++;
    insertSorted(listData.pendingTasks, task, 'createdTime', 10);
  }

  for (const tag of task.tags) {
    listData.tags.set(tag, (listData.tags.get(tag) || 0) + 1);
  }
}

/**
 * Insert a task into a sorted array (descending by dateField), keeping only top N.
 */
function insertSorted(arr, task, dateField, maxSize) {
  const taskDate = task[dateField] ? new Date(task[dateField]) : new Date(0);

  // Find insertion point (descending order - newest first)
  let insertAt = arr.length;
  for (let i = 0; i < arr.length; i++) {
    const existingDate = arr[i][dateField] ? new Date(arr[i][dateField]) : new Date(0);
    if (taskDate > existingDate) {
      insertAt = i;
      break;
    }
  }

  if (insertAt < maxSize) {
    arr.splice(insertAt, 0, task);
    if (arr.length > maxSize) arr.pop();
  }
}

/**
 * Build the folders array from the folder map, computing rates and sorting.
 */
function buildFolderArray(folderMap) {
  const folders = [];

  for (const [folderName, listsMap] of folderMap) {
    const lists = [];
    for (const [, listData] of listsMap) {
      const activeTotal = listData.completed + listData.pending;
      listData.completionRate = activeTotal > 0
        ? (listData.completed / activeTotal) * 100
        : 0;
      listData.tags = Object.fromEntries(listData.tags);
      lists.push(listData);
    }
    lists.sort((a, b) => b.total - a.total);

    folders.push({
      name: folderName,
      lists,
      total: lists.reduce((s, l) => s + l.total, 0),
      completed: lists.reduce((s, l) => s + l.completed, 0),
      pending: lists.reduce((s, l) => s + l.pending, 0),
    });
  }

  folders.sort((a, b) => b.total - a.total);
  return folders;
}

/**
 * Build feature usage analysis with best-practice scores.
 */
function buildFeatureUsage(counters, total) {
  if (total === 0) return [];

  const pct = (count) => (count / total) * 100;

  return [
    {
      name: 'Priority',
      icon: 'target',
      usage: counters.withPriority,
      percent: pct(counters.withPriority),
      score: scoreLevel(pct(counters.withPriority), 30, 60),
      detail: `${counters.withPriority} of ${total} tasks have a priority set`,
      tip: 'Best practice: Assign priority to at least 60% of tasks for effective time management.',
    },
    {
      name: 'Tags',
      icon: 'tag',
      usage: counters.withTags,
      percent: pct(counters.withTags),
      score: scoreLevel(pct(counters.withTags), 20, 50),
      detail: `${counters.withTags} tasks tagged, ${counters.multipleTagTasks} with multiple tags`,
      tip: 'Best practice: Use tags to categorize tasks by context, energy level, or project phase.',
    },
    {
      name: 'Reminders',
      icon: 'bell',
      usage: counters.withReminder,
      percent: pct(counters.withReminder),
      score: scoreLevel(pct(counters.withReminder), 10, 30),
      detail: `${counters.withReminder} tasks have reminders`,
      tip: 'Best practice: Set reminders for time-sensitive tasks to avoid missing deadlines.',
    },
    {
      name: 'Recurring Tasks',
      icon: 'repeat',
      usage: counters.withRepeat + (counters.recurringDistinct || 0),
      percent: pct(counters.withRepeat + (counters.recurringDistinct || 0)),
      score: scoreLevel(pct(counters.withRepeat + (counters.recurringDistinct || 0)), 3, 10),
      detail: `${counters.withRepeat + (counters.recurringDistinct || 0)} recurring tasks (${counters.recurringTotalCompletions || 0} total completions)`,
      tip: 'Best practice: Automate habits and routine tasks with recurring schedules.',
    },
    {
      name: 'Due Dates',
      icon: 'calendar',
      usage: counters.withDueDate,
      percent: pct(counters.withDueDate),
      score: scoreLevel(pct(counters.withDueDate), 30, 60),
      detail: `${counters.withDueDate} tasks have due dates`,
      tip: 'Best practice: Assign due dates to time-bound tasks for better planning.',
    },
    {
      name: 'Start Dates',
      icon: 'play',
      usage: counters.withStartDate,
      percent: pct(counters.withStartDate),
      score: scoreLevel(pct(counters.withStartDate), 10, 30),
      detail: `${counters.withStartDate} tasks have start dates`,
      tip: 'Best practice: Use start dates to plan when to begin working on tasks.',
    },
    {
      name: 'Descriptions',
      icon: 'file-text',
      usage: counters.withContent,
      percent: pct(counters.withContent),
      score: scoreLevel(pct(counters.withContent), 20, 40),
      detail: `${counters.withContent} tasks have descriptions or notes`,
      tip: 'Best practice: Add context and details to complex tasks for clarity.',
    },
    {
      name: 'Subtasks',
      icon: 'list-tree',
      usage: counters.subtasks,
      percent: pct(counters.subtasks),
      score: scoreLevel(pct(counters.subtasks), 5, 15),
      detail: `${counters.subtasks} subtasks found`,
      tip: 'Best practice: Break complex tasks into smaller subtasks for better tracking.',
    },
  ];
}

/**
 * Determine score level based on percentage thresholds.
 * @param {number} pct - Usage percentage
 * @param {number} lowThreshold - Below this = Low
 * @param {number} goodThreshold - Above this = Good, between = Medium
 * @returns {'low'|'medium'|'good'}
 */
function scoreLevel(pct, lowThreshold, goodThreshold) {
  if (pct >= goodThreshold) return 'good';
  if (pct >= lowThreshold) return 'medium';
  return 'low';
}
