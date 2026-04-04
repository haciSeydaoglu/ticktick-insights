# TickTick Insights

## Project Overview
A client-side web application that analyzes TickTick backup CSV files and generates:
1. A visual insight dashboard showing usage statistics
2. An AI-optimized prompt (TR/EN) summarizing the data for productivity analysis, with optional guidance for compatible AI tools to do selective current best-practice research

**Zero backend. Local browser storage only. Privacy-first.**

## Tech Stack
- HTML/CSS/JS (ES Modules) with Tailwind CSS (CDN)
- No build step, no backend dependencies
- Hosted on GitHub Pages

## File Structure
```
index.html                - Single page application (Tailwind CDN loaded here)
css/style.css             - Custom styles beyond Tailwind (collapsible, scrollbar, state)
js/app.js                 - Main orchestrator: screen nav, theme, language, tab switching, search, settings modal
js/backup-controller.js   - CSV upload, analysis, prompt UI, recent files, search functions
js/prompt-context.js      - Prompt config constants and pure helper functions
js/csv-parser.js          - RFC 4180 CSV parser with TickTick-specific handling
js/analyzer.js            - Data analysis, statistics, feature usage scoring
js/i18n.js                - UI internationalization (TR/EN) translations
js/dashboard.js           - DOM rendering for insight dashboard
js/prompt-builder.js      - TR/EN prompt template generation
js/utils.js               - Sanitization, date formatting, helpers
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
2. **No external network requests** - No fetch/XHR/WebSocket requests permitted
3. **Local-only storage** - Theme, UI language, and recent-file metadata use localStorage; CSV content uses IndexedDB; no cookies
4. **File validation** - Check extension, size, and header format
5. **CSV files in .gitignore** - Never commit user data

## Coding Conventions
- All code in English (variables, functions, comments)
- ES Modules (`export`/`import`)
- No index.js barrel exports
- Documentation: English first, then Turkish
- CSS-only visualizations (no chart libraries)

## Versioning Rules

### Source of Truth
- `js/version.js` is the single source of truth for the app version
- Format: SemVer — `'X.Y.Z'`

### Version Bump Rules

Determine the bump level based on the scope of the change set:

| Level | When to use | Example |
|-------|------------|---------|
| **Patch** (+0.0.1) | Bug fix, copy change, style tweak, small improvement | `0.1.25` → `0.1.26` |
| **Minor** (+0.1.0) | New feature, new UI section, significant behavior change | `0.1.25` → `0.2.0` |
| **Major** (+1.0.0) | Breaking change, major architecture rewrite, public API change | `0.1.25` → `1.0.0` |

- When in doubt between patch and minor, **ask the user**
- Minor and major bumps **reset lower segments to 0** (e.g., `0.3.12` minor → `0.4.0`)
- Major bumps require explicit user approval before applying

### Required Steps After Every Code Change

1. Read `js/version.js` → get the current `APP_VERSION` value
2. Determine the appropriate bump level (patch / minor / major)
3. Update the `APP_VERSION` value in `js/version.js`
4. Update all cache-bust version stamps (see below)

### Cache-Bust Update (Required on Every Version Bump)

Replace every `?v=OLD_VERSION` with `?v=NEW_VERSION` in the following files:

| File | Lines to update |
|------|----------------|
| `index.html` | `css/style.css?v=...` and `js/app.js?v=...` |
| `js/app.js` | All `import ... from './xxx.js?v=...'` lines |
| `js/backup-controller.js` | All `import ... from './xxx.js?v=...'` lines |
| `js/prompt-context.js` | `import ... from './i18n.js?v=...'` |
| `js/analyzer.js` | `import ... from './utils.js?v=...'` |
| `js/dashboard.js` | `import ... from './utils.js?v=...'`, `import ... from './i18n.js?v=...'` |
| `js/prompt-builder.js` | `import ... from './utils.js?v=...'` |

**Method:** Use `Edit` with `replace_all: true` for each file to swap old version string with new.

**Verify:** After updating, search all `.js` and `.html` files (excluding `version.js`) for the old
version string — no stale stamps should remain.

### Completion Condition
- No task is complete unless the version bump is included in the same change set
- The footer must always display the current version in `vX.Y.Z` format

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
- Prompt may ask the pasted-into AI tool for selective current research; the app itself makes no network requests
- Per-list detail: top 5 pending + top 5 completed tasks shown in prompt; remaining count shown as "+ X more" using list totals
- Feature usage scoring: Low/Medium/Good based on usage percentages
