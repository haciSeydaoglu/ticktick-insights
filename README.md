# TickTick Insights

> **Turkce icin asagiya bakin / [Turkce](#turkce)**

Analyze your TickTick backup CSV and generate AI-ready productivity prompts.

**TickTick Insights** parses your TickTick backup file entirely in the browser, generates a visual dashboard with usage statistics, and creates an optimized prompt you can paste into any AI assistant for personalized productivity recommendations.

## Features

- **Privacy-first**: Your data never leaves your browser. No server, no storage, no cookies.
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
- **No storage**: No localStorage, sessionStorage, or cookies. Data is gone on page refresh.
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

<a id="turkce"></a>

# TickTick Insights (Turkce)

TickTick yedek CSV dosyanizi analiz edin ve yapay zekaya hazir verimlilik promptlari olusturun.

**TickTick Insights** TickTick yedek dosyanizi tamamen tarayicida isler, kullanim istatistikleriyle gorsel bir dashboard olusturur ve kisisellestirilmis verimlilik onerileri icin herhangi bir AI asistanina yapistirabileceginiz optimize edilmis bir prompt uretir.

## Ozellikler

- **Gizlilik oncelikli**: Verileriniz tarayicinizdan asla cikmaz. Sunucu yok, depolama yok, cerez yok.
- **Gorsel Dashboard**: Ozet istatistikler, oncelik dagilimi, ozellik kullanim analizi, zaman cizelgesi, liste bazli gorev detaylari.
- **AI Prompt Olusturucu**: Turkce veya Ingilizce, yapilandirilmis ve ozlu bir prompt olusturur (ham CSV megabaylarina karsi 5-15KB).
- **Ozellik Kullanim Skorlamasi**: TickTick ozelliklerini (oncelik, etiket, hatirlatici, tekrarlayan gorevler vb.) ne kadar iyi kullandiginizi best practice skorlariyla analiz eder.
- **Sifir Bagimlilik**: Saf HTML/CSS/JS, build adimi yok, framework yok.

## Nasil Kullanilir

### 1. TickTick yedeginizi disa aktarin

1. [TickTick Web Ayarlari](https://ticktick.com/webapp/#q/all/tasks?modalType=settings) → Ayarlar → Yedek Olustur
2. CSV dosyasini indirin (**Not:** Yedek sadece web surumunden alinabilir)

### 2. Yukle ve Analiz Et

1. [TickTick Insights](https://haciseydaoglu.github.io/ticktick-insights/) adresini ziyaret edin
2. CSV dosyanizi surukleyip birakin veya "Choose File"a tiklayin
3. Dashboard'u goruntuleyip AI promptunu kopyalayin

## Guvenlik

- **Dis istek yok**: Uygulama sifir ag cagrisi yapar.
- **Content Security Policy**: Kati CSP basliklari script enjeksiyonunu onler.
- **XSS Korumasi**: Tum kullanici verisi `textContent` ile render edilir.
- **Depolama yok**: localStorage, sessionStorage veya cerez kullanilmaz.
- **CSV dosyalari gitignore'da**: Kullanici verisi asla repository'ye commit edilmez.

## Lisans

MIT
