# TickTick Insights

> **Türkçe için aşağıya bakın / [Türkçe](#türkçe)**

Analyze your TickTick backup CSV and generate AI-ready productivity prompts.

**TickTick Insights** parses your TickTick backup file entirely in the browser, generates a visual dashboard with usage statistics, and creates an optimized prompt you can paste into any AI assistant for personalized productivity recommendations.

## Features

- **Privacy-first**: Your data never leaves your browser. No server, no cookies. Preferences and recent files are stored only in your browser.
- **Visual Dashboard**: Summary stats, priority distribution, feature usage analysis, timeline, folder/list tree with per-list task details.
- **AI Prompt Generator**: Generates a concise, structured prompt (5-15KB vs raw CSV megabytes) in Turkish or English.
- **Feature Usage Scoring**: Analyzes how well you use TickTick features (priorities, tags, reminders, recurring tasks, etc.) with best-practice scores.
- **Zero Dependencies**: Pure HTML/CSS/JS, no build step, no frameworks.

## How to Use

### 1. Export your TickTick backup

1. Go to [TickTick Web Settings](https://ticktick.com/webapp/#q/all/tasks?modalType=settings) → Settings → Generate Backup
2. Download the CSV file (**Note:** Backup is only available from the web version)

### 2. Upload & Analyze

1. Visit [TickTick Insights](https://haciseydaoglu.github.io/ticktick-insights/)
2. Drag & drop your CSV file or click "Choose File"
3. View the dashboard and copy the AI prompt

## Security

- **No external requests**: The app makes zero network calls. No fetch, no XHR, no WebSocket.
- **Content Security Policy**: Strict CSP headers prevent script injection.
- **XSS Protection**: All user data rendered via `textContent` (never `innerHTML`).
- **Local-only storage**: Theme and UI language are stored in `localStorage`. Recent file metadata is stored in `localStorage`, and CSV content is stored in `IndexedDB` for re-analysis.
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

TickTick yedek CSV dosyanızı analiz edin ve yapay zekaya hazır verimlilik promptları oluşturun.

**TickTick Insights** TickTick yedek dosyanızı tamamen tarayıcıda işler, kullanım istatistikleriyle görsel bir dashboard oluşturur ve kişiselleştirilmiş verimlilik önerileri için herhangi bir AI asistanına yapıştırabileceğiniz optimize edilmiş bir prompt üretir.

### Özellikler

- **Gizlilik öncelikli**: Verileriniz tarayıcınızdan asla çıkmaz. Sunucu yok, çerez yok. Tercihler ve son dosyalar yalnızca tarayıcınızda saklanır.
- **Görsel Dashboard**: Özet istatistikler, öncelik dağılımı, özellik kullanım analizi, zaman çizelgesi, liste bazlı görev detayları.
- **AI Prompt Oluşturucu**: Türkçe veya İngilizce, yapılandırılmış ve özlü bir prompt oluşturur (ham CSV megabaytlarına karşı 5-15KB).
- **Özellik Kullanım Skorlaması**: TickTick özelliklerini (öncelik, etiket, hatırlatıcı, tekrarlayan görevler vb.) ne kadar iyi kullandığınızı best practice skorlarıyla analiz eder.
- **Sıfır Bağımlılık**: Saf HTML/CSS/JS, build adımı yok, framework yok.

### Nasıl Kullanılır

#### 1. TickTick yedeğinizi dışa aktarın

1. [TickTick Web Ayarları](https://ticktick.com/webapp/#q/all/tasks?modalType=settings) → Ayarlar → Yedek Oluştur
2. CSV dosyasını indirin (**Not:** Yedek sadece web sürümünden alınabilir)

#### 2. Yükle ve Analiz Et

1. [TickTick Insights](https://haciseydaoglu.github.io/ticktick-insights/) adresini ziyaret edin
2. CSV dosyanızı sürükleyip bırakın veya "Choose File"a tıklayın
3. Dashboard'u görüntüleyip AI promptunu kopyalayın

### Güvenlik

- **Dış istek yok**: Uygulama sıfır ağ çağrısı yapar.
- **Content Security Policy**: Katı CSP başlıkları script enjeksiyonunu önler.
- **XSS Koruması**: Tüm kullanıcı verisi `textContent` ile render edilir.
- **Yalnızca yerel depolama**: Tema ve arayüz dili `localStorage` içinde saklanır. Son dosya metadatası `localStorage` içinde, CSV içeriği ise yeniden analiz için `IndexedDB` içinde saklanır.
- **CSV dosyaları gitignore'da**: Kullanıcı verisi asla repository'ye commit edilmez.

### Lisans

MIT
