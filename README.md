# TickTick Insights

Analyze your TickTick backup CSV and generate AI-ready productivity prompts.

**TickTick Insights** parses your TickTick backup file entirely in the browser, generates a visual dashboard with usage statistics, and creates an optimized prompt you can paste into any AI assistant for personalized productivity recommendations.

---

TickTick yedek CSV dosyanızı analiz edin ve yapay zekaya hazır verimlilik promptları oluşturun.

**TickTick Insights** TickTick yedek dosyanızı tamamen tarayıcıda işler, kullanım istatistikleriyle görsel bir dashboard oluşturur ve kişiselleştirilmiş verimlilik önerileri için herhangi bir AI asistanına yapıştırabileceğiniz optimize edilmiş bir prompt üretir.

## Features / Özellikler

- **Privacy-first**: Your data never leaves your browser. No server, no storage, no cookies.
- **Visual Dashboard**: Summary stats, priority distribution, feature usage analysis, timeline, folder/list tree with per-list task details.
- **AI Prompt Generator**: Generates a concise, structured prompt (5-15KB vs raw CSV megabytes) in Turkish or English.
- **Feature Usage Scoring**: Analyzes how well you use TickTick features (priorities, tags, reminders, recurring tasks, etc.) with best-practice scores.
- **Zero Dependencies**: Pure HTML/CSS/JS, no build step, no frameworks.

---

- **Gizlilik öncelikli**: Verileriniz tarayıcınızdan asla çıkmaz. Sunucu yok, depolama yok, çerez yok.
- **Görsel Dashboard**: Özet istatistikler, öncelik dağılımı, özellik kullanım analizi, zaman çizelgesi, liste bazlı görev detayları.
- **AI Prompt Oluşturucu**: Türkçe veya İngilizce, yapılandırılmış ve özlü bir prompt oluşturur (ham CSV megabaytlarına karşı 5-15KB).
- **Özellik Kullanım Skorlaması**: TickTick özelliklerini (öncelik, etiket, hatırlatıcı, tekrarlayan görevler vb.) ne kadar iyi kullandığınızı best practice skorlarıyla analiz eder.
- **Sıfır Bağımlılık**: Saf HTML/CSS/JS, build adımı yok, framework yok.

## How to Use / Nasıl Kullanılır

### 1. Export your TickTick backup / TickTick yedeğinizi dışa aktarın

1. Go to [TickTick Web Settings](https://ticktick.com/webapp/#q/all/tasks?modalType=settings) → Settings → Generate Backup
2. Download the CSV file (**Note:** Backup is only available from the web version)

---

1. [TickTick Web Ayarları](https://ticktick.com/webapp/#q/all/tasks?modalType=settings) → Ayarlar → Yedek Oluştur
2. CSV dosyasını indirin (**Not:** Yedek sadece web sürümünden alınabilir)

### 2. Upload & Analyze / Yükle ve Analiz Et

1. Visit [TickTick Insights](https://haciseydaoglu.github.io/ticktick-insights/)
2. Drag & drop your CSV file or click "Choose File"
3. View the dashboard and copy the AI prompt

---

1. [TickTick Insights](https://haciseydaoglu.github.io/ticktick-insights/) adresini ziyaret edin
2. CSV dosyanızı sürükleyip bırakın veya "Choose File"a tıklayın
3. Dashboard'u görüntüleyin ve AI promptunu kopyalayın

## Security / Güvenlik

- **No external requests**: The app makes zero network calls. No fetch, no XHR, no WebSocket.
- **Content Security Policy**: Strict CSP headers prevent script injection.
- **XSS Protection**: All user data rendered via `textContent` (never `innerHTML`).
- **No storage**: No localStorage, sessionStorage, or cookies. Data is gone on page refresh.
- **CSV files are gitignored**: User data is never committed to the repository.

---

- **Dış istek yok**: Uygulama sıfır ağ çağrısı yapar.
- **Content Security Policy**: Katı CSP başlıkları script enjeksiyonunu önler.
- **XSS Koruması**: Tüm kullanıcı verisi `textContent` ile render edilir.
- **Depolama yok**: localStorage, sessionStorage veya çerez kullanılmaz.
- **CSV dosyaları gitignore'da**: Kullanıcı verisi asla repository'ye commit edilmez.

## Development / Geliştirme

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

## License / Lisans

MIT
