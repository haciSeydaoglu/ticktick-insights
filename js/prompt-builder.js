/**
 * Prompt builder module.
 * Generates AI-optimized prompts in Turkish and English from analysis results.
 * Uses sandwich pattern: instructions → data → instructions for better AI response quality.
 * Keeps prompt size between 5-15KB to be context-friendly.
 */

import { formatDate, formatPercent, formatNumber, priorityLabel, truncate } from './utils.js';

const DEFAULT_CONTEXT = {
  users: 'solo',
  useCases: ['software_projects'],
  painPoints: ['clutter', 'stalled'],
  optimize: ['structure', 'workflow'],
  style: 'direct',
};

function normalizeContext(context = {}) {
  return {
    users: context.users || DEFAULT_CONTEXT.users,
    useCases: Array.isArray(context.useCases) && context.useCases.length > 0 ? context.useCases : DEFAULT_CONTEXT.useCases,
    painPoints: Array.isArray(context.painPoints) && context.painPoints.length > 0 ? context.painPoints : DEFAULT_CONTEXT.painPoints,
    optimize: Array.isArray(context.optimize) && context.optimize.length > 0 ? context.optimize : DEFAULT_CONTEXT.optimize,
    style: context.style || DEFAULT_CONTEXT.style,
  };
}

function localizeContextAnswer(questionKey, values, t) {
  const selectedValues = Array.isArray(values) ? values : [values];
  return selectedValues
    .map((value) => t.contextOptionLabels[questionKey]?.[value] || value)
    .join(', ');
}

function buildContextGuidance(context, t) {
  const lines = [];

  lines.push(t.contextGuidance.users[context.users]);

  for (const value of context.useCases) {
    lines.push(t.contextGuidance.useCases[value]);
  }

  for (const value of context.painPoints) {
    lines.push(t.contextGuidance.painPoints[value]);
  }

  for (const value of context.optimize) {
    lines.push(t.contextGuidance.optimize[value]);
  }

  lines.push(t.contextGuidance.style[context.style]);

  return lines.filter(Boolean);
}

function getPriorityLabelForPrompt(priority, t) {
  return t.priorityLabels[priority] || priorityLabel(priority);
}

function getFeatureLabel(featureName, t) {
  return t.featureLabels[featureName] || featureName;
}

function getScoreLabel(score, t) {
  return t.scoreLabels[score] || score.toUpperCase();
}

function formatPriorityBreakdownLine(priorityData, t) {
  const total = formatNumber(priorityData?.count || 0);
  const completed = formatNumber(priorityData?.completedCount || 0);
  const pending = formatNumber(priorityData?.pendingCount || 0);
  return `${t.totalLabel} ${total} | ${t.completed} ${completed} | ${t.pending} ${pending}`;
}

function localizeSpecialName(name, t) {
  if (name === '(No Folder)') return t.noFolder;
  if (name === '(No List)') return t.noList;
  return name;
}

function buildDataLines(analysis, t) {
  const lines = [];

  // Summary section
  lines.push(`## ${t.overview}`);
  lines.push(`- ${t.totalTasks}: ${formatNumber(analysis.summary.total)}`);
  lines.push(`- ${t.completed}: ${formatNumber(analysis.summary.completed)} (${formatPercent(analysis.summary.completionRate)})`);
  if (analysis.recurring && analysis.recurring.distinctTaskCount > 0) {
    const uniqueRate = (analysis.recurring.uniqueCompletions + analysis.summary.pending) > 0
      ? (analysis.recurring.uniqueCompletions / (analysis.recurring.uniqueCompletions + analysis.summary.pending)) * 100
      : 0;
    lines.push(`  - ${t.routineCompletions}: ${formatNumber(analysis.recurring.totalCompletions)} (${analysis.recurring.distinctTaskCount} ${t.differentRoutines})`);
    lines.push(`  - ${t.uniqueCompletions}: ${formatNumber(analysis.recurring.uniqueCompletions)} — ${t.uniqueCompletionRate}: ${formatPercent(uniqueRate)}`);
  }
  lines.push(`- ${t.pending}: ${formatNumber(analysis.summary.pending)}`);
  lines.push(`- ${t.deleted}: ${formatNumber(analysis.summary.deleted)}`);

  if (analysis.summary.dateRange.earliest) {
    lines.push(`- ${t.dateRange}: ${formatDate(analysis.summary.dateRange.earliest)} – ${formatDate(analysis.summary.dateRange.latest)}`);
  }

  lines.push('');

  // Priority breakdown
  lines.push(`## ${t.priorityDist}`);
  lines.push(`- ${t.priorityHigh}: ${formatPriorityBreakdownLine(analysis.priorityBreakdown[5], t)}`);
  lines.push(`- ${t.priorityMedium}: ${formatPriorityBreakdownLine(analysis.priorityBreakdown[3], t)}`);
  lines.push(`- ${t.priorityLow}: ${formatPriorityBreakdownLine(analysis.priorityBreakdown[1], t)}`);
  lines.push(`- ${t.priorityNone}: ${formatPriorityBreakdownLine(analysis.priorityBreakdown[0], t)}`);
  lines.push('');

  // Feature usage
  lines.push(`## ${t.featureUsage}`);
  for (const feature of analysis.featureUsage) {
    lines.push(`- ${getFeatureLabel(feature.name, t)}: ${formatPercent(feature.percent)} (${feature.usage}/${analysis.summary.total}) — ${t.score}: ${getScoreLabel(feature.score, t)}`);
  }
  lines.push('');

  // Folder & List structure
  lines.push(`## ${t.folderListStructure}`);
  for (const folder of analysis.folders) {
    lines.push(`\n### ${localizeSpecialName(folder.name, t)} (${folder.total} ${t.tasks})`);
    for (const list of folder.lists) {
      lines.push(`  - ${localizeSpecialName(list.name, t)}: ${list.total} ${t.total}, ${list.completed}✓, ${list.pending} ${t.pendingLabel}, ${formatPercent(list.completionRate)}`);
    }
  }
  lines.push('');

  // Tags
  if (analysis.tags.length > 0) {
    lines.push(`## ${t.tags}`);
    for (const tag of analysis.tags) {
      lines.push(`- "${tag.name}": ${tag.total} ${t.tasks}, ${formatPercent(tag.completionRate)} ${t.completionRate} — ${t.usedIn}: ${tag.lists.map((listName) => localizeSpecialName(listName, t)).join(', ')}`);
    }
    lines.push('');
  }

  // Per-list task details
  lines.push(`## ${t.perListDetail}`);
  for (const folder of analysis.folders) {
    for (const list of folder.lists) {
      if (list.pendingTasks.length === 0 && list.completedTasks.length === 0) continue;

      lines.push(`\n### ${localizeSpecialName(list.name, t)}`);

      if (list.pendingTasks.length > 0) {
        lines.push(`\n**${t.latestPending} (${list.pendingTasks.length}):**`);
        for (const task of list.pendingTasks) {
          const prio = task.priority > 0 ? ` [${getPriorityLabelForPrompt(task.priority, t)}]` : '';
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

  // Recurring tasks
  if (analysis.recurring && analysis.recurring.distinctTaskCount > 0) {
    lines.push(`## ${t.routineTasks}`);
    lines.push(`- ${t.routineTasksSummary}: ${analysis.recurring.distinctTaskCount} ${t.differentRoutines}, ${formatNumber(analysis.recurring.totalCompletions)} ${t.routineCompletions}`);
    lines.push('');
    for (const task of analysis.recurring.tasks) {
      const list = task.listName ? ` (${task.listName})` : '';
      lines.push(`  - "${truncate(task.title, 60)}"${list}: ${formatNumber(task.count)}×`);
    }
    lines.push('');
  }

  // Key insights
  lines.push(`## ${t.keyInsights}`);
  const ins = analysis.insights;
  if (ins.avgCompletionDays > 0) {
    lines.push(`- ${t.avgCompletion}: ${ins.avgCompletionDays.toFixed(1)} ${t.days}`);
  }
  if (ins.busiestList) {
    lines.push(`- ${t.busiestList}: ${localizeSpecialName(ins.busiestList.name, t)} (${ins.busiestList.total} ${t.tasks})`);
  }
  if (ins.mostNeglectedList) {
    lines.push(`- ${t.neglectedList}: ${localizeSpecialName(ins.mostNeglectedList.name, t)} (${formatPercent(ins.mostNeglectedList.completionRate)})`);
  }
  if (ins.oldestPendingTasks.length > 0) {
    lines.push(`- ${t.oldestPending}:`);
    for (const task of ins.oldestPendingTasks) {
      lines.push(`  - "${truncate(task.title, 60)}" — ${localizeSpecialName(task.listName, t)} (${formatDate(task.createdTime)})`);
    }
  }
  lines.push('');

  return lines;
}

function buildTickTickFeatureLines(t) {
  const lines = [];

  lines.push(`## ${t.ticktickFeatures}`);
  lines.push('');
  for (const feat of t.features) {
    lines.push(`- **${feat.name}**: ${feat.desc}`);
  }
  lines.push('');

  return lines;
}

export function buildPromptData(analysis, lang = 'tr') {
  const t = translations[lang] || translations.tr;
  return buildDataLines(analysis, t).join('\n');
}

/**
 * Build the complete prompt string for the given language.
 * @param {Object} analysis - Analysis result from analyzer.js
 * @param {'tr'|'en'} lang - Language code
 * @param {Object} context - Prompt context selections from UI
 * @returns {string} Complete prompt text
 */
export function buildPrompt(analysis, lang = 'tr', context = DEFAULT_CONTEXT) {
  const t = translations[lang] || translations.tr;
  const normalizedContext = normalizeContext(context);
  const lines = [];

  // --- SANDWICH TOP: System instructions before data ---
  lines.push(t.header);
  lines.push('');
  lines.push(t.systemBlock);
  lines.push('');

  lines.push(`## ${t.userContextTitle}`);
  lines.push(t.userContextIntro);
  lines.push(`- ${t.contextQuestions.users}: ${localizeContextAnswer('users', normalizedContext.users, t)}`);
  lines.push(`- ${t.contextQuestions.useCases}: ${localizeContextAnswer('useCases', normalizedContext.useCases, t)}`);
  lines.push(`- ${t.contextQuestions.painPoints}: ${localizeContextAnswer('painPoints', normalizedContext.painPoints, t)}`);
  lines.push(`- ${t.contextQuestions.optimize}: ${localizeContextAnswer('optimize', normalizedContext.optimize, t)}`);
  lines.push(`- ${t.contextQuestions.style}: ${localizeContextAnswer('style', normalizedContext.style, t)}`);
  lines.push('');

  lines.push(`## ${t.calibrationTitle}`);
  lines.push(t.calibrationIntro);
  for (const guidance of buildContextGuidance(normalizedContext, t)) {
    lines.push(`- ${guidance}`);
  }
  lines.push('');

  // --- DATA SECTION ---
  lines.push(...buildDataLines(analysis, t));

  // Emoji suggestions for lists without emoji
  const listsWithoutEmoji = [];
  for (const folder of analysis.folders) {
    for (const list of folder.lists) {
      if (list.name !== '(No List)' && list.name !== '(No Folder)') {
        listsWithoutEmoji.push(list.name);
      }
    }
  }
  if (listsWithoutEmoji.length > 0) {
    lines.push(`## ${t.emojiSuggestionsTitle}`);
    lines.push(t.emojiSuggestionsIntro);
    lines.push('');
    for (const listName of listsWithoutEmoji) {
      lines.push(`- ${listName}`);
    }
    lines.push('');
    lines.push(t.emojiSuggestionsFormat);
    lines.push('');
  }

  // TickTick features reference
  lines.push(...buildTickTickFeatureLines(t));

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
    systemBlock: `> **Rol:** TickTick uzmanı, kişisel verimlilik danışmanı ve görev sistemi tasarımcısısın. GTD, Eisenhower matrisi, PARA metodu, Time Blocking gibi çerçeveleri biliyorsun. Davranışsal psikoloji perspektifinden erteleme, aşırı yüklenme ve terk etme pattern'lerini tanıyorsun. Veriye dayalı, kanıta dayalı çıkarımlar yaparsın — spekülatif değil.
>
> **Kurallar:**
> - Verileri tekrar etme, yorumla. Sayıları zaten görebiliyorum — bana ne anlama geldiklerini söyle.
> - Jenerik verimlilik tavsiyesi verme. Her önerin bu verideki somut bir bulguya dayanmalı.
> - Her liste/etiket için şablon cümle kullanma — her birini gerçekten verideki davranışa göre değerlendir.
> - Tüm öneriler yalnızca TickTick içinde uygulanabilir olmalı. Başka uygulama veya araç önerme.
> - Bu TickTick verisini birincil kaynak kabul et. Veriden doğrudan okunabilen konular için dış araştırma uydurma veya gereksiz yere kullanma.
> - Metodoloji, best practice, görev yönetimi trendleri veya önerinin güncelliği önemliyse; web araştırması yapabiliyorsan kısa ve seçici bir güncel araştırma yap. Yapamıyorsan bunu açıkça söyle ve yalnızca bu veriye dayan.
> - Veriden gelen çıkarımlarla dış kaynaklardan gelen best practice/trend önerilerini birbirine karıştırma. Hangisinin veri temelli, hangisinin güncel dış kaynağa dayalı olduğunu netleştir.
> - Dış kaynak kullandığında popüler ama yüzeysel tavsiyeleri değil, son dönemde hâlâ işe yarayan ve TickTick içinde uygulanabilir pratikleri tercih et.
> - Bir kavram veya metodolojiden bahsettiğinde kısaca ne olduğunu açıkla.
> - Kullanıcının açıkça verdiği bağlam veriden çıkarım yapmaktan daha güvenilirdir. Çelişki varsa açık bağlamı önceliklendir.
> - Yanıtını bu prompt ile aynı dilde ver.
> - Yanıtına kullanıcı profili tahminiyle başla: liste adları, görev türleri ve kullanım pattern'lerinden bu kişinin kim olabileceğini (öğrenci, profesyonel, freelancer, vb.) ve hangi yaşam alanlarında TickTick kullandığını çıkar.`,
    userContextTitle: 'Kullanıcının Verdiği Bağlam',
    userContextIntro: 'Aşağıdaki bilgiler kullanıcı tarafından açıkça seçildi. Veriler belirsiz olduğunda bu bağlamı doğru kabul et ve analizini buna göre kalibre et.',
    calibrationTitle: 'Bu Bağlama Göre Kalibrasyon',
    calibrationIntro: 'Analizi aşağıdaki önceliklerle yap:',
    contextQuestions: {
      users: 'Kaç kişi kullanıyor?',
      useCases: 'TickTick en çok ne için kullanılıyor?',
      painPoints: 'Ana sorunlar neler?',
      optimize: 'AI en çok neyi optimize etmeli?',
      style: 'AI nasıl konuşmalı?',
    },
    contextOptionLabels: {
      users: {
        solo: 'Tek kişi',
        team: 'Küçük ekip',
        mixed: 'Karışık',
      },
      useCases: {
        software_projects: 'Yazılım ve proje takibi',
        general_work: 'Genel iş takibi',
        personal_life: 'Kişisel hayat düzeni',
      },
      painPoints: {
        clutter: 'Çok dağınık olması',
        tracking: 'Takip edememek',
        stalled: 'Çok dolu ama ilerlememesi',
        priorities: 'Öncelikleri netleştirememek',
      },
      optimize: {
        structure: 'Liste ve etiket yapısı',
        prioritization: 'Görev önceliklendirmesi',
        workflow: 'Günlük iş akışı',
        visibility: 'Proje görünürlüğü',
      },
      style: {
        direct: 'Net ve direkt',
        balanced: 'Dengeli ve açıklayıcı',
        conservative: 'Daha temkinli',
      },
    },
    contextGuidance: {
      users: {
        solo: 'Bunu tek kişinin yönettiği bir sistem olarak değerlendir; ekip koordinasyonundan çok netlik, sadelik ve düşük bakım yüküne odaklan.',
        team: 'Bunu küçük bir ekibin kullandığı sistem olarak değerlendir; sahiplik, görünürlük ve koordinasyon ihtiyacını dikkate al.',
        mixed: 'Bunu hem tek kişi hem ekip kullanımı içeren karma bir sistem olarak değerlendir; yapı hem kişisel hız hem de ortak görünürlük sağlamalı.',
      },
      useCases: {
        software_projects: 'Yazılım ve proje takibi kullanımını merkeze al; aktif projeler, backlog hijyeni, teslim takibi ve proje yapısının netliği kritik olsun.',
        general_work: 'Genel iş takibini merkeze al; takip, son tarihler, operasyonel yük ve günlük yürütme akışına dikkat et.',
        personal_life: 'Kişisel hayat düzenini merkeze al; düşük sürtünme, sürdürülebilirlik ve alışkanlık dostu yapı önemli olsun.',
      },
      painPoints: {
        clutter: 'Dağınıklık ana problemse fazla liste, fazla etiket ve gereksiz yapı karmaşasını daha sert biçimde sorgula.',
        tracking: 'Takip edememe ana problemse görünürlük, haftalık gözden geçirme ve aktif işlerin daha net görünmesini önceliklendir.',
        stalled: 'Sistem dolu ama ilerlemiyorsa biriken backlog, terk edilmiş görevler ve harekete dönüşmeyen listeleri özellikle sorgula.',
        priorities: 'Öncelikler net değilse öncelik seviyeleri, tarih kullanımı ve karar vermeyi zorlaştıran kalabalığı özellikle değerlendir.',
      },
      optimize: {
        structure: 'Liste, klasör ve etiket mimarisine daha fazla dikkat ver; sadeleştirme ve yeniden yapılandırma önerilerini somutlaştır.',
        prioritization: 'Önceliklendirme mantığına daha fazla dikkat ver; hangi görevlerin ne zaman ve neden öne çıkması gerektiğini netleştir.',
        workflow: 'Günlük iş akışına daha fazla dikkat ver; inbox, triage, bugün görünümü ve yürütme ritmini optimize et.',
        visibility: 'Proje görünürlüğüne daha fazla dikkat ver; hangi işlerin aktif, riskli veya beklemede olduğunu daha görünür hale getiren öneriler sun.',
      },
      style: {
        direct: 'Tonun net ve direkt olsun; sorunları yumuşatma.',
        balanced: 'Tonun dengeli olsun; doğrudan konuş ama kısa açıklamalarla gerekçelendir.',
        conservative: 'Tonun daha temkinli olsun; faydalı mevcut alışkanlıkları koruyup minimum gerekli değişimi öner.',
      },
    },
    overview: 'Genel Bakış',
    totalTasks: 'Toplam görev',
    totalLabel: 'Toplam',
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
    scoreLabels: {
      low: 'DÜŞÜK',
      medium: 'ORTA',
      good: 'İYİ',
    },
    priorityLabels: {
      0: 'Yok',
      1: 'Düşük',
      3: 'Orta',
      5: 'Yüksek',
    },
    featureLabels: {
      Priority: 'Öncelik',
      Tags: 'Etiketler',
      Reminders: 'Hatırlatıcılar',
      'Recurring Tasks': 'Tekrarlayan Görevler',
      'Due Dates': 'Bitiş Tarihleri',
      'Start Dates': 'Başlangıç Tarihleri',
      Descriptions: 'Açıklamalar',
      Subtasks: 'Alt Görevler',
    },
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
    noFolder: '(Klasör yok)',
    noList: '(Liste yok)',
    routineTasks: 'Rutin Görevler (En Sık Tamamlananlar)',
    routineTasksSummary: 'Özet',
    differentRoutines: 'farklı rutin',
    routineCompletions: 'rutin tamamlanma',
    uniqueCompletions: 'tekil tamamlanma',
    uniqueCompletionRate: 'tekil tamamlanma oranı',
    emojiSuggestionsTitle: 'Liste Emoji Önerileri',
    emojiSuggestionsIntro: 'Aşağıdaki listeler için uygun bir emoji ve onu bulmak için kullanılabilecek İngilizce bir arama kelimesi öner:',
    emojiSuggestionsFormat: 'Format: Liste Adı | Önerilen Emoji | Search Keyword',
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
- **Küçük listeler ve düşük performanslı etiketler:** Bağlama göre birleştirme, silme veya yeniden yapılandırma öner — karar senin.
- **Dış araştırma eşiği:** Veriden doğrudan okunabilen şeyleri araştırma ile doğrulamaya çalışma. Araştırmayı yalnızca güncel best practice, metodoloji kıyası, trend veya davranış önerisinin güncelliği için kullan.
- **Trend filtresi:** "Trend" derken moda olanı değil; son dönemde işe yaradığını koruyan, uygulanabilir ve düşük sürtünmeli pratikleri kastet.
- **Kanıt ayrımı:** Veri temelli bulgular ile dış kaynak destekli önerileri ayrı ve açık biçimde sun.`,
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
        title: 'Güncel Best Practice ve Trend Kıyaslaması',
        desc: 'Gerekliyse kısa bir güncel araştırma yaparak bu kullanıcının sistemi ile güncel productivity/task-management best practice\'lerini kıyasla. Son dönemde öne çıkan ama gerçekten faydalı olan en fazla 3-5 yaklaşımı seç. Sadece bu kullanıcının verisine ve TickTick içindeki kullanımına uyanları öner. Araştırma yapamadıysan bunu açıkça belirt.',
        format: 'Format: Yaklaşım | Bu verideki karşılığı | Neden uygun / neden gereksiz | TickTick içinde nasıl uygulanır',
      },
      {
        title: 'Aksiyon Planı',
        desc: 'Tüm analizini somut adımlara dönüştür. Her adım TickTick içinde yapılabilir olmalı ve hangi menüden/özellikten yapılacağı belli olmalı.',
        format: 'Format: 3 grup (Hemen — bu hafta | Kısa vade — bu ay | Uzun vade — alışkanlık), her grupta en fazla 5 madde',
      },
    ],
    requestOutro: `Cesur ve doğrudan ol. Verilerin söylediğini söyle — nazik olmak için gerçekleri yumuşatma. Gereksiz yapıları sadeleştirmekten, kullanılmayan şeyleri kaldırmaktan çekinme. GTD, Eisenhower matrisi, PARA gibi çerçeveleri uygun gördüğün yerde kullan ama bunlara bağlı kalma. Yanıtının sonunda kısa bir "Kaynaklar" bölümü ekle; dış araştırma yaptıysan yalnızca gerçekten dayandığın birkaç kaynak/link ver, yapmadıysan araştırma yapılmadığını kısaca belirt.`,
  },

  en: {
    header: '# TickTick Usage Analysis Report',
    systemBlock: `> **Role:** You are a TickTick expert, personal productivity consultant, and task-system designer. You know frameworks like GTD, Eisenhower Matrix, PARA method, and Time Blocking. You recognize procrastination, overcommitment, and abandonment patterns from a behavioral psychology perspective. You make data-driven, evidence-based conclusions — not speculative ones.
>
> **Rules:**
> - Don't repeat the data back to me — interpret it. I can already see the numbers — tell me what they mean.
> - No generic productivity advice. Every recommendation must be grounded in a specific finding from this data.
> - Don't use template sentences for each list/tag — evaluate each one based on actual behavioral data.
> - All recommendations must be actionable within TickTick only. Do not suggest other apps or tools.
> - Treat this TickTick data as the primary source. Do not invent or overuse external research for things that are directly visible in the data.
> - If methodology, best practice, task-management trends, or recommendation freshness matters, do a short and selective current web research pass if you have browsing access. If you do not, state that clearly and proceed from the provided data only.
> - Keep data-derived conclusions separate from externally supported best-practice or trend recommendations. Make it clear which claims come from the user's data and which come from current outside sources.
> - When you use external sources, prefer recent approaches that still appear genuinely useful and practical inside TickTick, not shallow hype or novelty.
> - When you mention a concept or methodology, briefly explain what it is.
> - Explicit user-provided context is more reliable than inferred context. If there is a conflict, prioritize the explicit context.
> - Respond in the same language as this prompt.
> - Start your response with a user profile inference: from the list names, task types, and usage patterns, infer who this person might be (student, professional, freelancer, etc.) and which life areas they use TickTick for.`,
    userContextTitle: 'User-Provided Context',
    userContextIntro: 'The following details were selected explicitly by the user. If the data is ambiguous, treat this context as true and calibrate your analysis around it.',
    calibrationTitle: 'Calibration For This Context',
    calibrationIntro: 'Use the following priorities while analyzing the data:',
    contextQuestions: {
      users: 'How many people use it?',
      useCases: 'What is TickTick mainly used for?',
      painPoints: 'What are the main problems?',
      optimize: 'What should the AI optimize most?',
      style: 'How should the AI speak?',
    },
    contextOptionLabels: {
      users: {
        solo: 'Solo',
        team: 'Small team',
        mixed: 'Mixed',
      },
      useCases: {
        software_projects: 'Software and project tracking',
        general_work: 'General work tracking',
        personal_life: 'Personal life organization',
      },
      painPoints: {
        clutter: 'It feels too cluttered',
        tracking: 'I lose track of things',
        stalled: 'It is full but not moving',
        priorities: 'Priorities are unclear',
      },
      optimize: {
        structure: 'List and tag structure',
        prioritization: 'Task prioritization',
        workflow: 'Daily workflow',
        visibility: 'Project visibility',
      },
      style: {
        direct: 'Direct and clear',
        balanced: 'Balanced and explanatory',
        conservative: 'More cautious',
      },
    },
    contextGuidance: {
      users: {
        solo: 'Treat this as a solo-managed system; optimize for clarity, simplicity, and low maintenance overhead rather than team coordination.',
        team: 'Treat this as a small-team system; consider ownership, visibility, and coordination needs.',
        mixed: 'Treat this as a mixed solo-plus-team system; the structure should support both personal speed and shared visibility.',
      },
      useCases: {
        software_projects: 'Center the analysis on software and project tracking; active projects, backlog hygiene, delivery flow, and structural clarity are critical.',
        general_work: 'Center the analysis on general work tracking; pay close attention to follow-through, deadlines, operational load, and day-to-day execution.',
        personal_life: 'Center the analysis on personal-life organization; low friction, sustainability, and habit-friendly structure matter most.',
      },
      painPoints: {
        clutter: 'If clutter is a main problem, challenge excessive lists, excessive tags, and unnecessary structural complexity more aggressively.',
        tracking: 'If tracking is a main problem, prioritize visibility, review rhythm, and making active work easier to see.',
        stalled: 'If the system is full but not moving, focus especially on backlog buildup, abandoned tasks, and lists that are not turning into action.',
        priorities: 'If priorities are unclear, focus especially on priority usage, date discipline, and structural clutter that makes decisions harder.',
      },
      optimize: {
        structure: 'Spend more attention on list, folder, and tag architecture; make simplification and restructuring recommendations concrete.',
        prioritization: 'Spend more attention on prioritization logic; clarify which tasks should rise to the top, when, and why.',
        workflow: 'Spend more attention on daily workflow; optimize inbox triage, today-view behavior, and execution rhythm.',
        visibility: 'Spend more attention on project visibility; suggest ways to make active, risky, and blocked work easier to see.',
      },
      style: {
        direct: 'Use a direct tone; do not soften problems.',
        balanced: 'Use a balanced tone; be direct, but explain the reasoning briefly.',
        conservative: 'Use a more cautious tone; preserve useful existing habits and recommend only the minimum necessary change.',
      },
    },
    overview: 'Overview',
    totalTasks: 'Total tasks',
    totalLabel: 'Total',
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
    scoreLabels: {
      low: 'LOW',
      medium: 'MEDIUM',
      good: 'GOOD',
    },
    priorityLabels: {
      0: 'None',
      1: 'Low',
      3: 'Medium',
      5: 'High',
    },
    featureLabels: {
      Priority: 'Priority',
      Tags: 'Tags',
      Reminders: 'Reminders',
      'Recurring Tasks': 'Recurring Tasks',
      'Due Dates': 'Due Dates',
      'Start Dates': 'Start Dates',
      Descriptions: 'Descriptions',
      Subtasks: 'Subtasks',
    },
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
    noFolder: '(No Folder)',
    noList: '(No List)',
    routineTasks: 'Routine Tasks (Most Frequently Completed)',
    routineTasksSummary: 'Summary',
    differentRoutines: 'distinct routines',
    routineCompletions: 'routine completions',
    uniqueCompletions: 'one-off completions',
    uniqueCompletionRate: 'unique completion rate',
    emojiSuggestionsTitle: 'List Emoji Suggestions',
    emojiSuggestionsIntro: 'For each of the following lists, suggest an appropriate emoji and an English search keyword to find it:',
    emojiSuggestionsFormat: 'Format: List Name | Suggested Emoji | Search Keyword',
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
- **Small lists and underperforming tags:** Suggest merging, deleting, or restructuring based on context — the decision is yours.
- **External research threshold:** Do not research things that are already directly answerable from the dataset. Use research only for current best practices, methodology comparisons, trends, or freshness-sensitive guidance.
- **Trend filter:** By "trend," mean approaches that have gained traction recently and still seem practical, sustainable, and low-friction, not whatever is merely fashionable.
- **Evidence separation:** Present data-grounded findings separately from recommendations supported by outside sources.`,
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
        title: 'Current Best-Practice & Trend Comparison',
        desc: 'If needed, do a short current research pass and compare this system with current productivity/task-management best practices. Select at most 3-5 approaches that seem genuinely useful right now. Recommend only the ones that fit this user\'s data and can be implemented inside TickTick. If you could not research, say so explicitly.',
        format: 'Format: Approach | Match/mismatch in this data | Why it fits / why it is unnecessary | How to apply it in TickTick',
      },
      {
        title: 'Action Plan',
        desc: 'Turn your full analysis into concrete steps. Each step must be doable within TickTick and specify which menu/feature to use.',
        format: 'Format: 3 groups (Immediate — this week | Short-term — this month | Long-term — habits), max 5 items per group',
      },
    ],
    requestOutro: `Be bold and direct. Say what the data says — don't soften the truth to be polite. Don't hesitate to simplify unnecessary structures or remove unused elements. Use frameworks like GTD, Eisenhower matrix, or PARA where appropriate, but don't be bound by them. End with a short "Sources" section: if you used external research, list only the few sources or links you actually relied on; if you did not, briefly state that no external research was performed.`,
  },
};
