# TickTick Insights

> **Türkçe için aşağıya bakın / [Türkçe](#türkçe)**

Analyze your TickTick backup CSV and generate AI-ready productivity prompts — or connect the TickTick API to manage duplicates and edit tasks live.

**TickTick Insights** parses your TickTick backup file entirely in the browser, generates a visual dashboard with usage statistics, and creates an optimized prompt you can paste into any AI assistant for personalized productivity recommendations, current best-practice comparisons, and selective research-backed suggestions when the AI supports browsing. Optionally, connect your TickTick API token to fetch live tasks, detect duplicates, merge them directly, and edit task details — all without leaving the app.

## Features

- **Privacy-first**: Your data never leaves your browser. No server, no cookies. Preferences and recent files are stored only in your browser. API token is stored locally and never logged or displayed in full.
- **Visual Dashboard**: Summary stats, priority distribution, behavioral pattern detection, feature usage analysis, activity timeline with velocity metrics, folder/list tree with per-list task details.
- **AI Prompt Generator**: Generates a concise, structured prompt (5-15KB vs raw CSV megabytes) in Turkish or English, asking compatible AI tools to combine your data with current best practices and selective research when needed. Supports prompt customization: user work system notes (Pomodoro, habits, filters), task limit control (3–20 tasks per list), and custom priority mapping for filter-based workflows.
- **Behavioral Signals**: Detects procrastination patterns, overcommitment tendencies, abandoned task clusters, and high deletion rate warnings from your task history.
- **Feature Usage Scoring**: Analyzes how well you use TickTick features (priorities, tags, reminders, recurring tasks, etc.) with best-practice scores.
- **Duplicate Task Detection & Merge**: Automatically finds similar pending tasks using Levenshtein edit distance, Jaccard word similarity, and containment checks. With the TickTick API connected, you can merge duplicates directly from the app — combining tags and content into the kept task while deleting the rest.
- **Live Task Editing**: Connect your TickTick API token to search live tasks and edit task titles and content directly from a detail modal.
- **Instant Task Search**: Search all tasks by title, content, tags, list name, or folder name simultaneously. Works across both CSV backup data and live API tasks. Results appear as you type with match highlighting.
- **Zero Dependencies**: Pure HTML/CSS/JS, no build step, no frameworks.

## How to Use

### CSV Backup Analysis

1. Go to [TickTick Web Settings](https://ticktick.com/webapp/#q/all/tasks?modalType=settings) → Settings → Generate Backup
2. Download the CSV file (**Note:** Backup is only available from the web version)
3. Visit [TickTick Insights](https://haciseydaoglu.github.io/ticktick-insights/) and drag & drop your CSV file
4. View the dashboard and copy the AI prompt
5. Paste it into Claude, ChatGPT, Gemini, or another AI tool

### TickTick API Integration

1. Open Settings (gear icon) and paste your TickTick API bearer token
2. Switch to the **TickTick API** tab
3. Fetch your live tasks to detect duplicates
4. Merge duplicate groups or search and edit individual tasks

## Security

- **Minimal external requests**: The app only communicates with `https://api.ticktick.com/open/v1/*` when you explicitly use the API features. CSV analysis makes zero network calls.
- **Research stays outside the app**: Any optional web research happens only inside the AI tool after you paste the prompt there.
- **Content Security Policy**: Strict CSP headers prevent script injection.
- **XSS Protection**: All user data rendered via `textContent` (never `innerHTML`).
- **Local-only storage**: Theme, UI language, API token, and task cache use `localStorage`. CSV content uses `IndexedDB`. No cookies.
- **API token security**: Token is stored locally. Only the last 4 characters are displayed in the UI.
- **CSV files are gitignored**: User data is never committed to the repository.

## Development

```bash
# Clone the repository
git clone https://github.com/haciSeydaoglu/ticktick-insights.git
cd ticktick-insights

# Serve locally (ES modules require a server)
python3 -m http.server 8080
# or
npx serve .
```

Then open http://localhost:8080

## License

MIT

---

## Türkçe

TickTick yedek CSV dosyanızı analiz edin ve yapay zekaya hazır verimlilik promptları oluşturun — veya TickTick API ile duplicate'ları yönetin ve görevleri canlı düzenleyin.

**TickTick Insights** TickTick yedek dosyanızı tamamen tarayıcıda işler, kullanım istatistikleriyle görsel bir dashboard oluşturur ve kişiselleştirilmiş verimlilik önerileri, güncel best practice kıyasları ve AI destekliyorsa seçici araştırma tabanlı öneriler için herhangi bir AI asistanına yapıştırabileceğiniz optimize edilmiş bir prompt üretir. Opsiyonel olarak TickTick API tokeninizi bağlayarak canlı görevlerinizi çekin, benzer görevleri tespit edin, doğrudan birleştirin ve görev detaylarını düzenleyin — uygulamadan ayrılmadan.

### Özellikler

- **Gizlilik öncelikli**: Verileriniz tarayıcınızdan asla çıkmaz. Sunucu yok, çerez yok. Tercihler ve son dosyalar yalnızca tarayıcınızda saklanır. API tokeni yerel olarak saklanır, asla tam olarak gösterilmez.
- **Görsel Dashboard**: Özet istatistikler, öncelik dağılımı, davranış kalıpları tespiti, özellik kullanım analizi, aktivite zaman çizelgesi ve hız metrikleri, liste bazlı görev detayları.
- **AI Prompt Oluşturucu**: Türkçe veya İngilizce, yapılandırılmış ve özlü bir prompt oluşturur (ham CSV megabaytlarına karşı 5-15KB); uyumlu AI araçlarından gerektiğinde güncel best practice ve seçici araştırma desteği ister. Prompt özelleştirme desteği: kullanıcı çalışma sistemi notları (Pomodoro, alışkanlıklar, filtreler), görev limiti kontrolü (liste başına 3–20 görev) ve filtre tabanlı iş akışları için özel öncelik eşleştirmesi.
- **Davranış Sinyalleri**: Görev geçmişinizden erteleme kalıpları, aşırı yüklenme eğilimleri, terk edilen görev kümeleri ve yüksek silme oranı uyarılarını tespit eder.
- **Özellik Kullanım Skorlaması**: TickTick özelliklerini (öncelik, etiket, hatırlatıcı, tekrarlayan görevler vb.) ne kadar iyi kullandığınızı best practice skorlarıyla analiz eder.
- **Duplicate Görev Tespiti ve Birleştirme**: Bekleyen görevler arasındaki benzerleri Levenshtein mesafesi, Jaccard kelime benzerliği ve containment kontrolü ile otomatik olarak bulur. TickTick API bağlıyken duplicate'ları doğrudan uygulamadan birleştirin — etiketleri ve içeriği saklanan göreve aktarın, geri kalanı silin.
- **Canlı Görev Düzenleme**: TickTick API tokeninizi bağlayarak canlı görevleri arayın ve görev başlık/içeriklerini doğrudan detay modalından düzenleyin.
- **Hızlı Görev Arama**: Tüm görevlerde başlık, içerik, etiket, liste adı ve klasör adını eş zamanlı arama. Hem CSV yedek verisinde hem de canlı API görevlerinde çalışır. Siz yazarken sonuçlar anında belirir.
- **Sıfır Bağımlılık**: Saf HTML/CSS/JS, build adımı yok, framework yok.

### Nasıl Kullanılır

#### CSV Yedek Analizi

1. [TickTick Web Ayarları](https://ticktick.com/webapp/#q/all/tasks?modalType=settings) → Ayarlar → Yedek Oluştur
2. CSV dosyasını indirin (**Not:** Yedek sadece web sürümünden alınabilir)
3. [TickTick Insights](https://haciseydaoglu.github.io/ticktick-insights/) adresini ziyaret edin ve CSV dosyanızı sürükleyip bırakın
4. Dashboard'u görüntüleyip AI promptunu kopyalayın
5. Prompt'u Claude, ChatGPT, Gemini veya başka bir AI aracına yapıştırın

#### TickTick API Entegrasyonu

1. Ayarlar'ı açın (dişli ikonu) ve TickTick API bearer tokeninizi yapıştırın
2. **TickTick API** tabına geçin
3. Canlı görevlerinizi çekerek duplicate'ları tespit edin
4. Duplicate gruplarını birleştirin veya görevleri arayıp düzenleyin

### Güvenlik

- **Minimum dış istek**: Uygulama yalnızca API özelliklerini kullandığınızda `https://api.ticktick.com/open/v1/*` ile iletişim kurar. CSV analizi sıfır ağ çağrısı yapar.
- **Araştırma uygulamanın dışında kalır**: Opsiyonel web araştırması yalnızca prompt'u yapıştırdığınız AI aracı içinde gerçekleşir.
- **Content Security Policy**: Katı CSP başlıkları script enjeksiyonunu önler.
- **XSS Koruması**: Tüm kullanıcı verisi `textContent` ile render edilir.
- **Yalnızca yerel depolama**: Tema, arayüz dili, API tokeni ve görev önbelleği `localStorage` içinde saklanır. CSV içeriği `IndexedDB` içinde saklanır. Çerez yok.
- **API token güvenliği**: Token yerel olarak saklanır. UI'da yalnızca son 4 karakter gösterilir.
- **CSV dosyaları gitignore'da**: Kullanıcı verisi asla repository'ye commit edilmez.

### Lisans

MIT
