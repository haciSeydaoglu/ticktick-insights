/**
 * Internationalization module for UI strings.
 * Supports Turkish (tr) and English (en).
 */

const translations = {
  tr: {
    // Hero / Landing
    heroTitle: 'TickTick verilerinizden gizli kalmış kalıpları keşfedin',
    heroDesc: 'Yedek dosyanızı yükleyin, görsel dashboard ile kullanım alışkanlıklarınızı analiz edin ve yapay zekadan gerektiğinde güncel best practice ve trendlerle desteklenen kişiselleştirilmiş öneriler alın.',
    vpDashboard: 'Görsel Dashboard',
    vpDashboardDesc: 'Tamamlanma oranları, öncelik dağılımı, etiket analizi, zaman çizelgesi — tek bakışta tüm resmi görün.',
    vpAI: 'AI Prompt Oluşturucu',
    vpAIDesc: 'Binlerce satırlık yedeğinizi AI\'ın anlayacağı özlü bir prompt\'a dönüştürün. Uyumlu AI araçlarından güncel best practice ve seçici araştırma destekli öneriler alın.',
    vpPrivacy: '%100 Gizlilik',
    vpPrivacyDesc: 'Verileriniz tarayıcınızdan asla çıkmaz. Sunucu yok, izleme yok, çerez yok. Tercihler ve son dosyalar yalnızca yerel tarayıcı depolamasında tutulur. Tamamen açık kaynak.',
    whatYouGet: 'Ne Elde Edersiniz?',
    feat1Title: 'Tamamlanma İstatistikleri',
    feat1Desc: 'Gerçek tamamlanma oranınızı görün — hissettiğiniz değil, verinin söylediği. İhmal ettiğiniz listeleri ve sessizce biriken görevleri fark edin.',
    feat2Title: 'Davranış Kalıpları Tespiti',
    feat2Desc: 'Erteleme eğilimlerini, aşırı yüklenme sinyallerini ve terk edilen görev kalıplarını ortaya çıkarın. Hangi alışkanlıklarınızın yardımcı, hangilerinin engelleyici olduğunu görün.',
    feat3Title: 'Özellik Kullanım Skorları',
    feat3Desc: 'TickTick\'ten en iyi şekilde yararlanıyor musunuz? Hatırlatıcı, tekrarlayan görev, alt görev, bitiş tarihi ve daha fazlası için best practice skorlarınızı görün.',
    feat4Title: 'AI Verimlilik Koçu',
    feat4Desc: 'AI\'dan alışkanlıklarınızı analiz etmesini, etiket ve listelerinizi yeniden düzenlemesini, gerekirse güncel best practice ve trendleri kontrol etmesini ve size özel bir aksiyon planı oluşturmasını isteyen yapılandırılmış bir prompt alın.',
    feat5Title: 'Aktivite Zaman Çizelgesi',
    feat5Desc: '24 aylık görev oluşturma ve tamamlama trendlerinizi görselleştirin. Tükenmişlik dönemlerini, mevsimsel verimlilik değişimlerini ve sessizce TickTick\'i bıraktığınız haftaları keşfedin.',
    feat6Title: 'Klasör ve Liste Detayları',
    feat6Desc: 'Her klasör ve listeye derinlemesine dalın: liste bazlı tamamlanma oranları, etiket dağılımları ve bekleyen/tamamlanan son görevler — hiçbir liste incelenmeden kalmaz.',
    howItWorks: 'Nasıl Çalışır?',
    step1: 'TickTick Web > Avatar > Ayarlar > Yedek Oluştur adımlarını takip edin',
    step2: 'Dosyayı buraya sürükleyip bırakın',
    step3: 'Dashboard\'u inceleyin ve AI prompt\'unu kopyalayın',
    openSource: 'Tamamen açık kaynak. Kodu kendiniz inceleyin.',
    backupOnlyWeb: '(Yedek sadece web sürümünden alınabilir)',
    // Upload
    dropText: 'TickTick CSV yedeğinizi buraya sürükleyip bırakın',
    dropOr: 'veya',
    chooseFile: 'Dosya Seç',
    privacyNote: 'Verileriniz tarayıcınızdan asla çıkmaz. Hiçbir veri sunucuya gönderilmez.',
    processing: 'CSV dosyası okunuyor...',
    parsing: 'CSV verileri ayrıştırılıyor...',
    analyzing: 'Görevler analiz ediliyor...',
    generating: 'Prompt oluşturuluyor...',
    rendering: 'Dashboard hazırlanıyor...',
    newFile: 'Yeni Dosya Yükle',
    copyBtn: 'Panoya Kopyala',
    copied: 'Kopyalandı!',
    aiPromptHeading: 'AI Verimlilik Prompt\'u',
    aiPromptDesc: 'Tam prompt ile sadece analizden çıkan ham veri metni arasında geçiş yapın. Tam prompt, uyumlu AI araçlarından gerektiğinde kısa güncel araştırma ve kaynaklı best practice kıyası isteyecek şekilde hazırlanır.',
    promptViewHeading: 'Çıktı Modu',
    promptViewFull: 'Tam Prompt',
    promptViewRaw: 'Ham Data',
    promptContextHeading: 'Prompt Bağlamı',
    promptContextDesc: 'TickTick kullanımınızı en iyi anlatan seçenekleri işaretleyin. Uygun alanlarda birden fazla seçim yapabilirsiniz.',
    promptCtxUsersQ: 'Kaç kişi kullanıyor?',
    promptCtxUsersSolo: 'Tek kişi',
    promptCtxUsersTeam: 'Küçük ekip',
    promptCtxUsersMixed: 'Karışık',
    promptCtxUseCasesQ: 'TickTick\'i en çok ne için kullanıyorsunuz?',
    promptCtxUseCasesSoftware: 'Yazılım ve proje takibi',
    promptCtxUseCasesWork: 'Genel iş takibi',
    promptCtxUseCasesPersonal: 'Kişisel hayat düzeni',
    promptCtxProblemsQ: 'Sistemdeki ana sorunlar neler?',
    promptCtxProblemsClutter: 'Çok dağınık olması',
    promptCtxProblemsTracking: 'Takip edememek',
    promptCtxProblemsStalled: 'Çok dolu ama ilerlememesi',
    promptCtxProblemsPriorities: 'Öncelikleri netleştirememek',
    promptCtxOptimizeQ: 'AI en çok neyi optimize etsin?',
    promptCtxOptimizeListStructure: 'Liste/klasör yapısı',
    promptCtxOptimizeTagStructure: 'Etiket yapısı',
    promptCtxOptimizePrioritization: 'Görev önceliklendirmesi',
    promptCtxOptimizeWorkflow: 'Günlük iş akışı',
    promptCtxOptimizeVisibility: 'Proje görünürlüğü',
    promptCtxStyleQ: 'AI nasıl konuşsun?',
    promptCtxTaskLimit: 'Liste başına gösterilecek görev sayısı',
    promptCtxStyleDirect: 'Net ve direkt',
    promptCtxStyleBalanced: 'Dengeli ve açıklayıcı',
    promptCtxStyleConservative: 'Daha temkinli',
    userNotesHeading: 'Kişisel Çalışma Sistemi Notları',
    userNotesDesc: 'Bu notlar AI prompt\'una dahil edilir. Boş bırakılan alanlar prompta eklenmez.',
    pomodoroLabel: 'Pomodoro tekniği kullanıyor musunuz?',
    habitLabel: 'Alışkanlık özelliğini kullanıyor musunuz?',
    filterLabel: 'Filtreleme özelliğini kullanıyor musunuz?',
    extraLabel: 'Eklemek istedikleriniz?',
    pasteGuidance: 'Mevcut metni kopyalayıp doğrudan yapıştırın:',
    backupGuide: 'TickTick yedeğinizi almak için: TickTick Web > Avatar > Ayarlar > Yedek Oluştur',
    backupLink: 'TickTick Ayarlarını Aç',
    // Dashboard strings
    totalTasks: 'Toplam Görev',
    completed: 'Tamamlanan',
    pending: 'Bekleyen',
    deleted: 'Silinen',
    highPriority: 'Yüksek Öncelik',
    dateRange: 'Tarih Aralığı',
    completionRate: 'Tamamlanma Oranı',
    priorityDist: 'Öncelik Dağılımı',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
    none: 'Yok',
    featureUsage: 'Özellik Kullanım Analizi',
    featureGood: 'İyi',
    featureMedium: 'Orta',
    featureLow: 'Düşük',
    timeline: 'Aktivite Zaman Çizelgesi (Aylık)',
    created: 'Oluşturulan',
    keyInsights: 'Önemli Bulgular',
    avgCompletion: 'Ort. Tamamlama Süresi',
    days: 'gün',
    busiestList: 'En Yoğun Liste',
    tasks: 'görev',
    neglectedList: 'En İhmal Edilen Liste',
    completion: 'tamamlama',
    last7days: 'Son 7 Gün',
    last30days: 'Son 30 Gün',
    createdCompleted: 'oluşturulan / tamamlanan',
    oldestPending: 'En Eski Bekleyen Görevler',
    title: 'Başlık',
    list: 'Liste',
    priority: 'Öncelik',
    tags: 'Etiketler',
    total: 'Toplam',
    rate: 'Oran',
    lists: 'Listeler',
    foldersLists: 'Klasörler ve Listeler',
    pendingTasks: 'Bekleyen Görevler',
    completedTasks: 'Tamamlanan Görevler',
    latest: 'Son',
    createdDate: 'Oluşturulma',
    completedDate: 'Tamamlanma',
    urgentTasks: 'acil görev',
    routineTasks: 'Rutin Görevler',
    routineTasksDetail: 'En Sık Tamamlanan Rutinler',
    timesCompleted: 'kez',
    routineCompletions: 'rutin tamamlanma',
    uniqueCompletions: 'tekil tamamlanma',
    differentRoutines: 'farklı rutin',
    scheduledRepeatTasks: 'Zamanlanmış Tekrar Eden Görevler',
    // Feature names
    featPriority: 'Öncelik',
    featTags: 'Etiketler',
    featReminders: 'Hatırlatıcılar',
    featRecurring: 'Tekrarlayan Görevler',
    featDueDates: 'Bitiş Tarihleri',
    featStartDates: 'Başlangıç Tarihleri',
    featDescriptions: 'Açıklamalar',
    featSubtasks: 'Alt Görevler',
    // Feature tips
    tipPriority: 'Etkili zaman yönetimi için görevlerin en az %60\'ına öncelik atayın.',
    tipTags: 'Görevleri bağlam, enerji seviyesi veya proje aşamasına göre kategorize etmek için etiketleri kullanın.',
    tipReminders: 'Zamana duyarlı görevler için son tarihleri kaçırmamak adına hatırlatıcılar ayarlayın.',
    tipRecurring: 'Alışkanlıkları ve rutin görevleri tekrarlayan zamanlamalarla otomatikleştirin.',
    tipDueDates: 'Zamana bağlı görevler için daha iyi planlama adına bitiş tarihleri atayın.',
    tipStartDates: 'Görevler üzerinde ne zaman çalışmaya başlayacağınızı planlamak için başlangıç tarihlerini kullanın.',
    tipDescriptions: 'Karmaşık görevlere netlik kazandırmak için bağlam ve detay ekleyin.',
    tipSubtasks: 'Karmaşık görevleri daha iyi takip için küçük alt görevlere bölün.',
    // FAQ
    faqTitle: 'Sıkça Sorulan Sorular',
    faq1Q: 'TickTick yedeğimi nasıl dışa aktarırım?',
    faq1A: 'TickTick Web > Avatar > Ayarlar > Yedek Oluştur yolunu takip edin. Yedek alma özelliği sadece web sürümünden kullanılabilir.',
    faq2Q: 'Verilerim güvende mi?',
    faq2A: 'Evet. TickTick Insights tamamen tarayıcınızda çalışır ve hiçbir veri sunucuya yüklenmez. Tema, arayüz dili ve son dosyalar yalnızca tarayıcınızda yerel olarak saklanır. Kaynak kodu tamamen açıktır.',
    faq3Q: 'Hangi analizleri sunar?',
    faq3A: 'Tamamlanma oranları, öncelik dağılımı, etiket analizi, özellik kullanım skorları, aylık aktivite zaman çizelgesi, klasör/liste bazlı detaylar ve AI destekli kişiselleştirilmiş verimlilik önerileri.',
    faq4Q: 'AI prompt\'u nasıl çalışır?',
    faq4A: 'Binlerce satırlık CSV yedeğiniz, AI\'ın anlayacağı 5-15 KB\'lık özlü bir rapora dönüştürülür. Bu rapor davranış analizi, etiket değerlendirmesi, liste reorganizasyonu, öncelik kullanımı ve aksiyon planı talep eder; uyumlu AI araçlarından gerektiğinde güncel best practice ve trend kıyası ile kısa bir kaynak listesi de ister.',
    faq5Q: 'Prompt\'u hangi AI araçlarıyla kullanabilirim?',
    faq5A: 'Claude, ChatGPT, Gemini veya herhangi bir büyük dil modeli ile kullanabilirsiniz. Prompt\'u kopyalayıp doğrudan yapıştırmanız yeterli.',
    faq6Q: 'Her TickTick yedeğiyle çalışır mı?',
    faq6A: 'Evet. TickTick\'in standart CSV yedek formatını destekler. Dosya boyutu 50 MB\'a kadar olabilir ve UTF-8 BOM karakteri otomatik olarak işlenir.',
    // SEO content
    seoTitle: 'TickTick Yedek Dosyanızı Analize Dönüştürün',
    seoParagraph1: 'TickTick Insights, TickTick yedek CSV dosyanızı detaylı bir verimlilik analizine dönüştüren ücretsiz ve açık kaynaklı bir araçtır. Tamamlanma oranları, öncelik dağılımı, etiket kullanım kalıpları, özellik kullanım skorları ve aylık aktivite trendleri gibi metrikleri görsel bir dashboard üzerinde sunar. Erteleme eğilimlerinden tükenmişlik dönemlerine, ihmal edilen listelerden eksik kullanılan özelliklere kadar verilerinizin anlattığı hikayeyi keşfedin.',
    seoParagraph2: 'AI Verimlilik Koçu özelliği, binlerce görevinizi Claude, ChatGPT veya Gemini gibi AI araçlarına yapıştırabileceğiniz yapılandırılmış bir prompt\'a dönüştürür. Uyumlu AI araçları bu prompt ile davranış analizi yapar, etiket ve liste yapınızı yeniden düzenlemenizi önerir, gerektiğinde güncel best practice ve trendleri kısa biçimde araştırır ve somut bir aksiyon planı oluşturur. Tüm işlemler tarayıcınızda gerçekleşir — verileriniz hiçbir sunucuya gönderilmez.',
    // Motivation
    motivationTitle: 'Neden Bu Aracı Yaptım?',
    motivationText: 'Inbox\'um sürekli doluyordu. Onlarca etiket, sayısız liste... Bir noktadan sonra TickTick beni hızlandırmak yerine bakmaya korktuğum bir karmaşaya dönüştü. Her seferinde "bunu AI ile organize edebilsem" diye düşünüyordum. Claude Code ile harika kodlar yazarken aklıma geldi: neden en temel şeye, AI ile görev organizasyonuna girmiyoruz? Yeni bir uygulamaya geçmek istemiyordum — TickTick\'in pomodoro\'su, mobil uygulaması, sadeliği ve akıllı özellikleri vazgeçilmez. Bu yüzden basit bir fikir doğdu: yedek dosyanı bir prompt\'a dönüştür, AI\'a yapıştır, kişiselleştirilmiş öneriler al. Umarım sizin de işinize yarar.',
    // Recent files
    recentFiles: 'Son Yüklenen Dosyalar',
    clearAll: 'Tümünü Temizle',
    fileNotFound: 'Dosya verisi bulunamadı. Lütfen dosyayı tekrar yükleyin.',
  },
  en: {
    // Hero / Landing
    heroTitle: 'Discover hidden patterns in your TickTick data',
    heroDesc: 'Upload your backup file, analyze your habits with a visual dashboard, and get personalized AI recommendations supported by current best practices and trends when needed.',
    vpDashboard: 'Visual Dashboard',
    vpDashboardDesc: 'Completion rates, priority distribution, tag analysis, timeline — see the full picture at a glance.',
    vpAI: 'AI Prompt Generator',
    vpAIDesc: 'Transform thousands of lines of backup data into a concise AI-ready prompt. Get current best-practice guidance and selective research-backed recommendations from compatible AI tools.',
    vpPrivacy: '100% Privacy',
    vpPrivacyDesc: 'Your data never leaves your browser. No server, no tracking, no cookies. Preferences and recent files stay only in local browser storage. Fully open source.',
    whatYouGet: 'What You Get',
    feat1Title: 'Completion Statistics',
    feat1Desc: 'See your real completion rate — not what it feels like, but what the data says. Spot lists you\'re neglecting and tasks silently piling up.',
    feat2Title: 'Behavioral Pattern Detection',
    feat2Desc: 'Uncover procrastination tendencies, overcommitment signals, and abandoned task patterns. See which habits help and which hold you back.',
    feat3Title: 'Feature Usage Scores',
    feat3Desc: 'Are you getting the most out of TickTick? See best-practice scores for reminders, recurring tasks, subtasks, due dates, and more — with tips to level up.',
    feat4Title: 'AI Productivity Coach',
    feat4Desc: 'Get a structured prompt that asks AI to analyze your habits, reorganize your tags and lists, check current best practices and trends when needed, and build a personalized action plan — all from your real data.',
    feat5Title: 'Activity Timeline',
    feat5Desc: 'Visualize 24 months of task creation vs. completion trends. Spot burnout periods, seasonal productivity shifts, and weeks you quietly stopped using TickTick.',
    feat6Title: 'Folder & List Details',
    feat6Desc: 'Deep-dive into every folder and list with per-list completion rates, tag breakdowns, and the latest pending and completed tasks — no list left unexamined.',
    howItWorks: 'How It Works',
    step1: 'Go to TickTick Web > Avatar > Settings > Generate Backup',
    step2: 'Drag & drop the file here',
    step3: 'Explore the dashboard and copy the AI prompt',
    openSource: 'Fully open source. Inspect the code yourself.',
    backupOnlyWeb: '(Backup is only available from the web version)',
    // Upload
    dropText: 'Drag & drop your TickTick CSV backup here',
    dropOr: 'or',
    chooseFile: 'Choose File',
    privacyNote: 'Your data never leaves your browser. No data is sent to any server.',
    processing: 'Reading CSV file...',
    parsing: 'Parsing CSV data...',
    analyzing: 'Analyzing tasks...',
    generating: 'Generating prompt...',
    rendering: 'Rendering dashboard...',
    newFile: 'Upload New File',
    copyBtn: 'Copy to Clipboard',
    copied: 'Copied!',
    aiPromptHeading: 'AI-Ready Productivity Prompt',
    aiPromptDesc: 'Switch between the full prompt and the raw analysis text. The full prompt is designed to ask compatible AI tools for short current research and source-backed best-practice comparisons when needed.',
    promptViewHeading: 'Output Mode',
    promptViewFull: 'Full Prompt',
    promptViewRaw: 'Raw Data',
    promptContextHeading: 'Prompt Context',
    promptContextDesc: 'Select the options that best describe your TickTick setup. You can choose more than one option where it makes sense.',
    promptCtxUsersQ: 'How many people use it?',
    promptCtxUsersSolo: 'Solo',
    promptCtxUsersTeam: 'Small team',
    promptCtxUsersMixed: 'Mixed',
    promptCtxUseCasesQ: 'What do you mainly use TickTick for?',
    promptCtxUseCasesSoftware: 'Software and project tracking',
    promptCtxUseCasesWork: 'General work tracking',
    promptCtxUseCasesPersonal: 'Personal life organization',
    promptCtxProblemsQ: 'What are the main problems in the system?',
    promptCtxProblemsClutter: 'It feels too cluttered',
    promptCtxProblemsTracking: 'I lose track of things',
    promptCtxProblemsStalled: 'It is full but not moving',
    promptCtxProblemsPriorities: 'Priorities are unclear',
    promptCtxOptimizeQ: 'What should the AI optimize most?',
    promptCtxOptimizeListStructure: 'List/folder structure',
    promptCtxOptimizeTagStructure: 'Tag structure',
    promptCtxOptimizePrioritization: 'Task prioritization',
    promptCtxOptimizeWorkflow: 'Daily workflow',
    promptCtxOptimizeVisibility: 'Project visibility',
    promptCtxStyleQ: 'How should the AI speak?',
    promptCtxTaskLimit: 'Tasks shown per list',
    promptCtxStyleDirect: 'Direct and clear',
    promptCtxStyleBalanced: 'Balanced and explanatory',
    promptCtxStyleConservative: 'More cautious',
    userNotesHeading: 'Personal Work System Notes',
    userNotesDesc: 'These notes are included in the AI prompt. Empty fields are omitted from the prompt.',
    pomodoroLabel: 'Do you use the Pomodoro technique?',
    habitLabel: 'Do you use the Habit feature?',
    filterLabel: 'Do you use the Filter/Tag feature?',
    extraLabel: 'Anything else you\'d like to add?',
    pasteGuidance: 'Copy and paste the current text directly into:',
    backupGuide: 'To export your backup: TickTick Web > Avatar > Settings > Generate Backup',
    backupLink: 'Open TickTick Settings',
    totalTasks: 'Total Tasks',
    completed: 'Completed',
    pending: 'Pending',
    deleted: 'Deleted',
    highPriority: 'High Priority',
    dateRange: 'Date Range',
    completionRate: 'Completion Rate',
    priorityDist: 'Priority Distribution',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    none: 'None',
    featureUsage: 'Feature Usage Analysis',
    featureGood: 'Good',
    featureMedium: 'Medium',
    featureLow: 'Low',
    timeline: 'Activity Timeline (Monthly)',
    created: 'Created',
    keyInsights: 'Key Insights',
    avgCompletion: 'Avg. Completion Time',
    days: 'days',
    busiestList: 'Busiest List',
    tasks: 'tasks',
    neglectedList: 'Most Neglected List',
    completion: 'completion',
    last7days: 'Last 7 Days',
    last30days: 'Last 30 Days',
    createdCompleted: 'created / completed',
    oldestPending: 'Oldest Pending Tasks',
    title: 'Title',
    list: 'List',
    priority: 'Priority',
    tags: 'Tags',
    total: 'Total',
    rate: 'Rate',
    lists: 'Lists',
    foldersLists: 'Folders & Lists',
    pendingTasks: 'Pending Tasks',
    completedTasks: 'Completed Tasks',
    latest: 'Latest',
    createdDate: 'Created',
    completedDate: 'Completed',
    urgentTasks: 'urgent tasks',
    routineTasks: 'Routine Tasks',
    routineTasksDetail: 'Most Frequently Completed Routines',
    timesCompleted: 'times',
    routineCompletions: 'routine completions',
    uniqueCompletions: 'one-off completions',
    differentRoutines: 'distinct routines',
    scheduledRepeatTasks: 'Scheduled Recurring Tasks',
    featPriority: 'Priority',
    featTags: 'Tags',
    featReminders: 'Reminders',
    featRecurring: 'Recurring Tasks',
    featDueDates: 'Due Dates',
    featStartDates: 'Start Dates',
    featDescriptions: 'Descriptions',
    featSubtasks: 'Subtasks',
    tipPriority: 'Assign priority to at least 60% of tasks for effective time management.',
    tipTags: 'Use tags to categorize tasks by context, energy level, or project phase.',
    tipReminders: 'Set reminders for time-sensitive tasks to avoid missing deadlines.',
    tipRecurring: 'Automate habits and routine tasks with recurring schedules.',
    tipDueDates: 'Assign due dates to time-bound tasks for better planning.',
    tipStartDates: 'Use start dates to plan when to begin working on tasks.',
    tipDescriptions: 'Add context and details to complex tasks for clarity.',
    tipSubtasks: 'Break complex tasks into smaller subtasks for better tracking.',
    // FAQ
    faqTitle: 'Frequently Asked Questions',
    faq1Q: 'How do I export my TickTick backup?',
    faq1A: 'Go to TickTick Web > Avatar > Settings > Generate Backup. The backup feature is only available from the web version.',
    faq2Q: 'Is my TickTick data safe?',
    faq2A: 'Yes. TickTick Insights runs entirely in your browser and no data is uploaded to any server. Theme, UI language, and recent files are stored only in your browser. The source code is fully open.',
    faq3Q: 'What insights does it provide?',
    faq3A: 'Completion rates, priority distribution, tag analytics, feature usage scores, monthly activity timelines, per-folder/list breakdowns, and AI-powered personalized productivity recommendations.',
    faq4Q: 'How does the AI prompt work?',
    faq4A: 'Your thousands of lines of CSV backup are condensed into a 5-15 KB structured report that AI can understand. This report requests behavioral analysis, tag assessment, list reorganization, priority usage review, and a concrete action plan; when the AI supports browsing, it can also ask for short current best-practice and trend comparisons with a brief sources list.',
    faq5Q: 'Which AI tools can I use with the prompt?',
    faq5A: 'You can use it with Claude, ChatGPT, Gemini, or any large language model. Just copy the prompt and paste it directly.',
    faq6Q: 'Does it work with any TickTick backup?',
    faq6A: 'Yes. It supports TickTick\'s standard CSV backup format. File size can be up to 50 MB and UTF-8 BOM characters are handled automatically.',
    // SEO content
    seoTitle: 'Turn Your TickTick Backup Into Actionable Insights',
    seoParagraph1: 'TickTick Insights is a free, open-source tool that transforms your TickTick backup CSV file into a detailed productivity analysis. It presents metrics like completion rates, priority distribution, tag usage patterns, feature usage scores, and monthly activity trends on a visual dashboard. From procrastination tendencies to burnout periods, neglected lists to underused features — discover the story your data tells.',
    seoParagraph2: 'The AI Productivity Coach feature converts thousands of tasks into a structured prompt you can paste into Claude, ChatGPT, or Gemini. Compatible AI tools can use it to perform behavioral analysis, suggest list and tag restructuring, selectively check current best practices and trends, and create a concrete action plan. Everything runs in your browser — your data is never sent to any server.',
    // Motivation
    motivationTitle: 'Why I Built This',
    motivationText: 'My inbox was constantly overflowing. Dozens of tags, countless lists... At some point, TickTick stopped making me faster and turned into a mess I was afraid to look at. I kept thinking "if only I could organize this with AI." While writing great code with Claude Code, it hit me: why aren\'t we tackling the most fundamental thing — task organization with AI? I didn\'t want to switch to a new app — TickTick\'s pomodoro, mobile app, simplicity, and smart features are irreplaceable. So a simple idea was born: convert your backup into a prompt, paste it into AI, get personalized recommendations. I hope it helps you too.',
    // Recent files
    recentFiles: 'Recent Files',
    clearAll: 'Clear All',
    fileNotFound: 'File data not found. Please upload the file again.',
  },
};

let currentUILang = window.__initialLang || 'en';

/**
 * Get a translated string for the current UI language.
 * @param {string} key - Translation key
 * @returns {string}
 */
export function t(key) {
  return translations[currentUILang]?.[key] || translations.en[key] || key;
}

/**
 * Set the current UI language and update all data-i18n elements.
 * @param {'tr'|'en'} lang
 */
export function setUILang(lang) {
  currentUILang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem('ui-lang', lang);

  // Update canonical URL for SEO
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    const base = 'https://haciseydaoglu.github.io/ticktick-insights/';
    canonical.href = lang === 'tr' ? base + '?lang=tr' : base;
  }

  updateDOMTranslations();
}

/**
 * Get the current UI language.
 * @returns {'tr'|'en'}
 */
export function getUILang() {
  return currentUILang;
}

/**
 * Update all DOM elements with data-i18n attribute.
 * @public Exported for direct use in app initialization.
 */
export function updateDOMTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  for (const el of elements) {
    const key = el.dataset.i18n;
    const text = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else {
      el.textContent = text;
    }
  }
}

// Auto-apply translations on module load if language is not English
// (HTML static content is already in English, so only TR needs DOM update)
if (currentUILang !== 'en') {
  updateDOMTranslations();
}
