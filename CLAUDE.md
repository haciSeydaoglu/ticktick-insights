# TickTick Insights

## Project Overview
A client-side web application that analyzes TickTick backup CSV files and generates:
1. A visual insight dashboard showing usage statistics
2. An AI-optimized prompt (TR/EN) summarizing the data for productivity analysis

**Zero backend. Zero data storage. Privacy-first.**

## Tech Stack
- HTML/CSS/JS (ES Modules) with Tailwind CSS (CDN)
- No build step, no backend dependencies
- Hosted on GitHub Pages

## File Structure
```
index.html              - Single page application (Tailwind CDN loaded here)
css/style.css           - Custom styles beyond Tailwind (collapsible, scrollbar, state)
js/app.js               - Main orchestration, event handlers, state management
js/csv-parser.js        - RFC 4180 CSV parser with TickTick-specific handling
js/analyzer.js          - Data analysis, statistics, feature usage scoring
js/i18n.js              - UI internationalization (TR/EN) translations
js/dashboard.js         - DOM rendering for insight dashboard
js/prompt-builder.js    - TR/EN prompt template generation
js/utils.js             - Sanitization, date formatting, helpers
```

## TickTick CSV Format
- First 6 rows are metadata (date, version, status legend)
- Row 7 is the header row
- Data starts at row 8
- 24 columns: Folder Name, List Name, Title, Kind, Tags, Content, Is Check list, Start Date, Due Date, Reminder, Repeat, Priority, Status, Created Time, Completed Time, Order, Timezone, Is All Day, Is Floating, Column Name, Column Order, View Mode, taskId, parentId
- Status values: 0=pending, 1=completed, 2=completed/archived, -1=deleted
- Priority values: 0=none, 1=low, 3=medium, 5=high
- Content field can contain newlines (multiline CSV fields)
- File may start with UTF-8 BOM character

## Security Rules (CRITICAL)
1. **No innerHTML with user data** - Always use `textContent` or `createTextNode()`
2. **No external requests** - No fetch(), XMLHttpRequest, WebSocket
3. **No storage** - No localStorage, sessionStorage, cookies
4. **CSP enforced** - Content-Security-Policy meta tag in HTML
5. **File validation** - Check extension, size, and header format
6. **CSV files in .gitignore** - Never commit user data

## Coding Conventions
- All code in English (variables, functions, comments)
- ES Modules (`export`/`import`)
- No index.js barrel exports
- Documentation: English first, then Turkish
- CSS-only visualizations (no chart libraries)

## How to Test Locally
```bash
python3 -m http.server 8080
# or
npx serve .
```
Then open http://localhost:8080

## Key Design Decisions
- Single-pass analysis: analyzer.js iterates tasks once to build all groupings
- Prompt size target: 5-15KB (vs raw CSV which can be megabytes)
- Per-list detail: last 10 pending + last 10 completed tasks only
- Feature usage scoring: Low/Medium/Good based on usage percentages
