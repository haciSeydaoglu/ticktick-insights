/**
 * Prompt builder module.
 * Generates AI-optimized prompts in Turkish and English from analysis results.
 * Uses sandwich pattern: instructions → data → instructions for better AI response quality.
 * Keeps prompt size between 5-15KB to be context-friendly.
 */

import { formatDate, formatPercent, formatNumber, priorityLabel, truncate } from './utils.js';

/**
 * Build the complete prompt string for the given language.
 * @param {Object} analysis - Analysis result from analyzer.js
 * @param {'tr'|'en'} lang - Language code
 * @returns {string} Complete prompt text
 */
export function buildPrompt(analysis, lang = 'tr') {
  const t = translations[lang];
  const lines = [];

  // --- SANDWICH TOP: System instructions before data ---
  lines.push(t.header);
  lines.push('');
  lines.push(t.systemBlock);
  lines.push('');

  // --- DATA SECTION ---

  // Summary section
  lines.push(`## ${t.overview}`);
  lines.push(`- ${t.totalTasks}: ${formatNumber(analysis.summary.total)}`);
  lines.push(`- ${t.completed}: ${formatNumber(analysis.summary.completed)} (${formatPercent(analysis.summary.completionRate)})`);
  lines.push(`- ${t.pending}: ${formatNumber(analysis.summary.pending)}`);
  lines.push(`- ${t.deleted}: ${formatNumber(analysis.summary.deleted)}`);

  if (analysis.summary.dateRange.earliest) {
    lines.push(`- ${t.dateRange}: ${formatDate(analysis.summary.dateRange.earliest)} – ${formatDate(analysis.summary.dateRange.latest)}`);
  }

  lines.push('');

  // Priority breakdown
  lines.push(`## ${t.priorityDist}`);
  lines.push(`- ${t.priorityHigh}: ${analysis.priorityBreakdown[5]?.count || 0}`);
  lines.push(`- ${t.priorityMedium}: ${analysis.priorityBreakdown[3]?.count || 0}`);
  lines.push(`- ${t.priorityLow}: ${analysis.priorityBreakdown[1]?.count || 0}`);
  lines.push(`- ${t.priorityNone}: ${analysis.priorityBreakdown[0]?.count || 0}`);
  lines.push('');

  // Feature usage
  lines.push(`## ${t.featureUsage}`);
  for (const feature of analysis.featureUsage) {
    lines.push(`- ${feature.name}: ${formatPercent(feature.percent)} (${feature.usage}/${analysis.summary.total}) — ${t.score}: ${feature.score.toUpperCase()}`);
  }
  lines.push('');

  // Folder & List structure
  lines.push(`## ${t.folderListStructure}`);
  for (const folder of analysis.folders) {
    lines.push(`\n### ${folder.name} (${folder.total} ${t.tasks})`);
    for (const list of folder.lists) {
      lines.push(`  - ${list.name}: ${list.total} ${t.total}, ${list.completed}✓, ${list.pending} ${t.pendingLabel}, ${formatPercent(list.completionRate)}`);
    }
  }
  lines.push('');

  // Tags
  if (analysis.tags.length > 0) {
    lines.push(`## ${t.tags}`);
    for (const tag of analysis.tags) {
      lines.push(`- "${tag.name}": ${tag.total} ${t.tasks}, ${formatPercent(tag.completionRate)} ${t.completionRate} — ${t.usedIn}: ${tag.lists.join(', ')}`);
    }
    lines.push('');
  }

  // Per-list task details
  lines.push(`## ${t.perListDetail}`);
  for (const folder of analysis.folders) {
    for (const list of folder.lists) {
      if (list.pendingTasks.length === 0 && list.completedTasks.length === 0) continue;

      lines.push(`\n### ${list.name}`);

      if (list.pendingTasks.length > 0) {
        lines.push(`\n**${t.latestPending} (${list.pendingTasks.length}):**`);
        for (const task of list.pendingTasks) {
          const prio = task.priority > 0 ? ` [${priorityLabel(task.priority)}]` : '';
          const date = task.createdTime ? ` (${formatDate(task.createdTime)})` : '';
          lines.push(`  - ${truncate(task.title, 50)}${prio}${date}`);
        }
      }

      if (list.completedTasks.length > 0) {
        lines.push(`\n**${t.latestCompleted} (${list.completedTasks.length}):**`);
        for (const task of list.completedTasks) {
          const date = task.completedTime ? ` (${formatDate(task.completedTime)})` : '';
          lines.push(`  - ${truncate(task.title, 50)}${date}`);
        }
      }
    }
  }
  lines.push('');

  // Key insights
  lines.push(`## ${t.keyInsights}`);
  const ins = analysis.insights;
  if (ins.avgCompletionDays > 0) {
    lines.push(`- ${t.avgCompletion}: ${ins.avgCompletionDays.toFixed(1)} ${t.days}`);
  }
  if (ins.busiestList) {
    lines.push(`- ${t.busiestList}: ${ins.busiestList.name} (${ins.busiestList.total} ${t.tasks})`);
  }
  if (ins.mostNeglectedList) {
    lines.push(`- ${t.neglectedList}: ${ins.mostNeglectedList.name} (${formatPercent(ins.mostNeglectedList.completionRate)})`);
  }
  if (ins.oldestPendingTasks.length > 0) {
    lines.push(`- ${t.oldestPending}:`);
    for (const task of ins.oldestPendingTasks) {
      lines.push(`  - "${truncate(task.title, 60)}" — ${task.listName} (${formatDate(task.createdTime)})`);
    }
  }
  lines.push('');

  // TickTick features reference
  lines.push(`## ${t.ticktickFeatures}`);
  lines.push('');
  for (const feat of t.features) {
    lines.push(`- **${feat.name}**: ${feat.desc}`);
  }
  lines.push('');

  // --- SANDWICH BOTTOM: Analytical framework + detailed requests ---

  // Analytical framework
  lines.push('---');
  lines.push('');
  lines.push(`## ${t.frameworkTitle}`);
  lines.push('');
  lines.push(t.frameworkBody);
  lines.push('');

  // Analysis request
  lines.push('---');
  lines.push('');
  lines.push(`## ${t.requestTitle}`);
  lines.push('');
  lines.push(t.requestIntro);
  lines.push('');

  for (let i = 0; i < t.requests.length; i++) {
    lines.push(`### ${i + 1}. ${t.requests[i].title}`);
    lines.push(t.requests[i].desc);
    if (t.requests[i].format) {
      lines.push(`*${t.requests[i].format}*`);
    }
    lines.push('');
  }

  lines.push(t.requestOutro);

  return lines.join('\n');
}

const translations = {
  tr: {
    header: '# TickTick Kullanım Analiz Raporu',
    systemBlock: `> **Rol:** TickTick uzmanı ve kişisel verimlilik danışmanısın. GTD, Eisenhower matrisi, PARA metodu, Time Blocking gibi çerçeveleri biliyorsun. Davranışsal psikoloji perspektifinden erteleme, aşırı yüklenme ve terk etme pattern'lerini tanıyorsun. Veriye dayalı, kanıta dayalı çıkarımlar yaparsın — spekülatif değil.
>
> **Kurallar:**
> - Verileri tekrar etme, yorumla. Sayıları zaten görebiliyorum — bana ne anlama geldiklerini söyle.
> - Jenerik verimlilik tavsiyesi verme. Her önerin bu verideki somut bir bulguya dayanmalı.
> - Her liste/etiket için şablon cümle kullanma — her birini gerçekten verideki davranışa göre değerlendir.
> - Tüm öneriler yalnızca TickTick içinde uygulanabilir olmalı. Başka uygulama veya araç önerme.
> - Bir kavram veya metodolojiden bahsettiğinde kısaca ne olduğunu açıkla.
> - Yanıtına kullanıcı profili tahminiyle başla: liste adları, görev türleri ve kullanım pattern'lerinden bu kişinin kim olabileceğini (öğrenci, profesyonel, freelancer, vb.) ve hangi yaşam alanlarında TickTick kullandığını çıkar.`,
    overview: 'Genel Bakış',
    totalTasks: 'Toplam görev',
    completed: 'Tamamlanan',
    pending: 'Bekleyen',
    deleted: 'Silinen',
    dateRange: 'Kullanım aralığı',
    priorityDist: 'Öncelik Dağılımı',
    priorityHigh: 'Yüksek',
    priorityMedium: 'Orta',
    priorityLow: 'Düşük',
    priorityNone: 'Yok',
    featureUsage: 'Özellik Kullanım Oranları',
    score: 'Skor',
    folderListStructure: 'Klasör ve Liste Yapısı',
    tasks: 'görev',
    total: 'toplam',
    pendingLabel: 'bekleyen',
    tags: 'Etiketler',
    completionRate: 'tamamlanma',
    usedIn: 'Kullanıldığı listeler',
    perListDetail: 'Liste Bazlı Görev Detayları',
    latestPending: 'Son bekleyen görevler',
    latestCompleted: 'Son tamamlanan görevler',
    keyInsights: 'Önemli Bulgular',
    avgCompletion: 'Ortalama tamamlama süresi',
    days: 'gün',
    busiestList: 'En yoğun liste',
    neglectedList: 'En ihmal edilen liste',
    oldestPending: 'En eski bekleyen görevler',
    ticktickFeatures: 'TickTick Özellikleri Referansı',
    features: [
      { name: 'Smart Lists (Akıllı Listeler)', desc: 'Filtrelere göre otomatik görev toplayan sanal listeler (örn: "Bu hafta bitenler", "Yüksek öncelikli")' },
      { name: 'Filters (Filtreler)', desc: 'Etiket, öncelik, tarih, liste vb. kriterlere göre görevleri filtreleme' },
      { name: 'Kanban Board', desc: 'Görevleri sütunlarla (Column) görselleştirme' },
      { name: 'Calendar View', desc: 'Görevleri takvim üzerinde görüntüleme ve sürükle-bırak yönetim' },
      { name: 'Habit Tracker', desc: 'Günlük alışkanlık takibi' },
      { name: 'Pomodoro Timer', desc: 'Zamanlayıcı ile odaklanma seansları' },
      { name: 'Eisenhower Matrix', desc: 'Görevleri önem/aciliyet matrisinde görüntüleme' },
      { name: 'Recurring Tasks (Tekrar Eden Görevler)', desc: 'Esnek tekrarlama kuralları (günlük, haftalık, özel)' },
      { name: 'Reminders (Hatırlatıcılar)', desc: 'Zamana veya konuma dayalı bildirimler' },
      { name: 'Subtasks (Alt Görevler)', desc: 'Görevleri daha küçük adımlara bölme' },
      { name: 'Tags (Etiketler)', desc: 'Çapraz-liste görev gruplandırma' },
      { name: 'Priority Levels', desc: '4 seviye önceliklendirme (Yok, Düşük, Orta, Yüksek)' },
      { name: 'Duration (Süre)', desc: 'Görevlere tahmini süre atama' },
      { name: 'Description/Notes', desc: 'Görevlere detaylı açıklama ve not ekleme' },
      { name: 'Start Date & Due Date', desc: 'Başlangıç ve bitiş tarihi ile planlama' },
    ],
    frameworkTitle: 'Analiz Rehberi',
    frameworkBody: `Verileri yorumlarken şunlara dikkat et:
- **Tamamlanma oranı:** Liste amacına göre değerlendir — bir fikir listesinde düşük oran normal olabilirken, bir iş listesinde sorunlu olabilir. Bağlamdan karar ver.
- **Bekleyen görev yaşı:** Uzun süredir bekleyen görevler terk edilmiş veya amacını yitirmiş olabilir. Süreyi ve bağlamı birlikte değerlendir.
- **Silme oranı:** Yüksek silme oranı aşırı yüklenme veya plansız görev ekleme sinyali olabilir.
- **Öncelik kullanımı:** Düşük kullanım oranı önceliklendirme alışkanlığının eksikliğine işaret edebilir.
- **Feature usage skorları:** LOW = neredeyse hiç kullanılmıyor, MEDIUM = kısmen, GOOD = aktif kullanılıyor.
- **Küçük listeler ve düşük performanslı etiketler:** Bağlama göre birleştirme, silme veya yeniden yapılandırma öner — karar senin.`,
    requestTitle: 'Senden İstenen Analiz ve Öneriler',
    requestIntro: 'Yukarıdaki verileri ve referans çerçevesini kullanarak aşağıdaki başlıklarda analiz yap. Başlıklar yol gösterici — verilerde dikkatini çeken ama bu başlıklara sığmayan şeyleri de paylaş.',
    requests: [
      {
        title: 'Kullanıcı Profili',
        desc: 'Liste adları, görev türleri, etiketler ve kullanım pattern\'lerinden bu kişinin kim olabileceğini tahmin et. Hangi yaşam/iş alanlarında TickTick kullanıyor? Analizinin geri kalanını bu profile göre kalibre et.',
        format: 'Format: 2-3 cümlelik profil özeti',
      },
      {
        title: 'Davranış Analizi',
        desc: 'Kullanım alışkanlıklarını, güçlü yönlerini ve sorunlu pattern\'leri tespit et. Her tespiti veriden bir kanıtla destekle. Erteleme eğilimleri, aşırı yüklenme belirtileri, terk edilen görevler, görev ekleme vs tamamlama dengesi gibi davranışsal sinyalleri yorumla.',
        format: 'Format: Her tespit için "Bulgu → Kanıt → Yorum" yapısını kullan',
      },
      {
        title: 'Etiket Değerlendirmesi',
        desc: 'Her etiket için verideki davranışa dayalı bir açıklama yaz — şablon cümle kullanma, her birini gerçekten farklı değerlendir. Sonra cesur öneriler sun: silinecekler, birleştirilecekler, eklenmesi gerekenler. Düşük performanslı etiketleri sorgula.',
        format: 'Format: Etiket adı | Durum özeti | Öneri (Koru / Sil / Birleştir / Yeniden adlandır)',
      },
      {
        title: 'Liste ve Klasör Değerlendirmesi',
        desc: 'Her liste için amacını ve barındırdığı görev türlerini verideki görev başlıklarından çıkar. Sonra tüm yapıyı bir bütün olarak değerlendir. Çok küçük listeleri birleştirmeyi, çok geniş listeleri bölmeyi, anlamsız klasörleri kaldırmayı değerlendir. Yeniden yapılandırma önerini somut bir before/after olarak göster.',
        format: 'Format: Mevcut yapı → Önerilen yapı karşılaştırması',
      },
      {
        title: 'Öncelik ve Özellik Kullanımı',
        desc: 'Öncelik dağılımını ve TickTick özelliklerinin kullanım oranlarını birlikte değerlendir. Kullanılmayan veya az kullanılan her özellik için bu kullanıcının verisine özel somut bir senaryo ver — "hatırlatıcı kullanabilirsin" gibi jenerik öneriler değil, "X listesindeki Y tarzı görevler için haftalık hatırlatıcı kur" gibi spesifik öneriler.',
        format: 'Format: Özellik | Mevcut kullanım | Spesifik öneri',
      },
      {
        title: 'Aksiyon Planı',
        desc: 'Tüm analizini somut adımlara dönüştür. Her adım TickTick içinde yapılabilir olmalı ve hangi menüden/özellikten yapılacağı belli olmalı.',
        format: 'Format: 3 grup (Hemen — bu hafta | Kısa vade — bu ay | Uzun vade — alışkanlık), her grupta en fazla 5 madde',
      },
    ],
    requestOutro: `Cesur ve doğrudan ol. Verilerin söylediğini söyle — nazik olmak için gerçekleri yumuşatma. Gereksiz yapıları sadeleştirmekten, kullanılmayan şeyleri kaldırmaktan çekinme. GTD, Eisenhower matrisi, PARA gibi çerçeveleri uygun gördüğün yerde kullan ama bunlara bağlı kalma.`,
  },

  en: {
    header: '# TickTick Usage Analysis Report',
    systemBlock: `> **Role:** You are a TickTick expert and personal productivity consultant. You know frameworks like GTD, Eisenhower Matrix, PARA method, and Time Blocking. You recognize procrastination, overcommitment, and abandonment patterns from a behavioral psychology perspective. You make data-driven, evidence-based conclusions — not speculative ones.
>
> **Rules:**
> - Don't repeat the data back to me — interpret it. I can already see the numbers — tell me what they mean.
> - No generic productivity advice. Every recommendation must be grounded in a specific finding from this data.
> - Don't use template sentences for each list/tag — evaluate each one based on actual behavioral data.
> - All recommendations must be actionable within TickTick only. Do not suggest other apps or tools.
> - When you mention a concept or methodology, briefly explain what it is.
> - Start your response with a user profile inference: from the list names, task types, and usage patterns, infer who this person might be (student, professional, freelancer, etc.) and which life areas they use TickTick for.`,
    overview: 'Overview',
    totalTasks: 'Total tasks',
    completed: 'Completed',
    pending: 'Pending',
    deleted: 'Deleted',
    dateRange: 'Usage range',
    priorityDist: 'Priority Distribution',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    priorityNone: 'None',
    featureUsage: 'Feature Usage Rates',
    score: 'Score',
    folderListStructure: 'Folder & List Structure',
    tasks: 'tasks',
    total: 'total',
    pendingLabel: 'pending',
    tags: 'Tags',
    completionRate: 'completion',
    usedIn: 'Used in lists',
    perListDetail: 'Per-List Task Details',
    latestPending: 'Latest pending tasks',
    latestCompleted: 'Latest completed tasks',
    keyInsights: 'Key Insights',
    avgCompletion: 'Average completion time',
    days: 'days',
    busiestList: 'Busiest list',
    neglectedList: 'Most neglected list',
    oldestPending: 'Oldest pending tasks',
    ticktickFeatures: 'TickTick Features Reference',
    features: [
      { name: 'Smart Lists', desc: 'Virtual lists that automatically collect tasks based on filters (e.g., "Due this week", "High priority")' },
      { name: 'Filters', desc: 'Filter tasks by tag, priority, date, list, and other criteria' },
      { name: 'Kanban Board', desc: 'Visualize tasks in columns for workflow management' },
      { name: 'Calendar View', desc: 'View and manage tasks on a calendar with drag-and-drop' },
      { name: 'Habit Tracker', desc: 'Daily habit tracking and streaks' },
      { name: 'Pomodoro Timer', desc: 'Focus timer for productivity sessions' },
      { name: 'Eisenhower Matrix', desc: 'View tasks in an urgency/importance matrix' },
      { name: 'Recurring Tasks', desc: 'Flexible recurrence rules (daily, weekly, custom)' },
      { name: 'Reminders', desc: 'Time-based or location-based notifications' },
      { name: 'Subtasks', desc: 'Break tasks into smaller actionable steps' },
      { name: 'Tags', desc: 'Cross-list task grouping and categorization' },
      { name: 'Priority Levels', desc: '4 levels of prioritization (None, Low, Medium, High)' },
      { name: 'Duration', desc: 'Assign estimated time to tasks' },
      { name: 'Description/Notes', desc: 'Add detailed notes and descriptions to tasks' },
      { name: 'Start Date & Due Date', desc: 'Plan tasks with start and end dates' },
    ],
    frameworkTitle: 'Analytical Guide',
    frameworkBody: `When interpreting the data, pay attention to:
- **Completion rate:** Evaluate based on the list's purpose — a low rate in an ideas list may be normal, while the same rate in a work list may be problematic. Decide based on context.
- **Pending task age:** Long-pending tasks may have been abandoned or lost their purpose. Evaluate the duration and context together.
- **Deletion rate:** A high deletion rate may signal overcommitment or unplanned task creation.
- **Priority usage:** Low usage may indicate a lack of prioritization habits.
- **Feature usage scores:** LOW = barely used, MEDIUM = partially used, GOOD = actively used.
- **Small lists and underperforming tags:** Suggest merging, deleting, or restructuring based on context — the decision is yours.`,
    requestTitle: 'Requested Analysis & Recommendations',
    requestIntro: 'Using the data and reference framework above, analyze the following topics. These are guiding topics — also share anything else you notice in the data that doesn\'t fit these headings.',
    requests: [
      {
        title: 'User Profile',
        desc: 'From the list names, task types, tags, and usage patterns, infer who this person might be. What life/work areas do they use TickTick for? Calibrate the rest of your analysis to this profile.',
        format: 'Format: 2-3 sentence profile summary',
      },
      {
        title: 'Behavioral Analysis',
        desc: 'Identify usage habits, strengths, and problematic patterns. Support each finding with evidence from the data. Interpret behavioral signals: procrastination tendencies, overcommitment signs, abandoned tasks, task creation vs completion balance.',
        format: 'Format: Use "Finding → Evidence → Interpretation" structure for each point',
      },
      {
        title: 'Tag Assessment',
        desc: 'Write a data-driven description for each tag — no template sentences, evaluate each one differently based on actual behavior. Then recommend boldly: which to delete, merge, and what new ones to add. Question underperforming tags.',
        format: 'Format: Tag name | Status summary | Action (Keep / Delete / Merge / Rename)',
      },
      {
        title: 'List & Folder Assessment',
        desc: 'For each list, infer its purpose and task types from the task titles in the data. Then evaluate the entire structure as a whole. Consider merging small lists, splitting overly broad ones, and removing meaningless folders. Show your restructuring proposal as a concrete before/after.',
        format: 'Format: Current structure → Proposed structure comparison',
      },
      {
        title: 'Priority & Feature Usage',
        desc: 'Evaluate priority distribution and TickTick feature usage rates together. For each unused or underused feature, provide a scenario specific to this user\'s data — not "you could use reminders" but "set a weekly reminder for X-type tasks in Y list."',
        format: 'Format: Feature | Current usage | Specific recommendation',
      },
      {
        title: 'Action Plan',
        desc: 'Turn your full analysis into concrete steps. Each step must be doable within TickTick and specify which menu/feature to use.',
        format: 'Format: 3 groups (Immediate — this week | Short-term — this month | Long-term — habits), max 5 items per group',
      },
    ],
    requestOutro: `Be bold and direct. Say what the data says — don't soften the truth to be polite. Don't hesitate to simplify unnecessary structures or remove unused elements. Use frameworks like GTD, Eisenhower matrix, or PARA where appropriate, but don't be bound by them.`,
  },
};
