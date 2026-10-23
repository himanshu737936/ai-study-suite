# 🧠 AI Study Suite PRO

**Turn any PDF — or a photo of a book page — into an AI-powered exam practice kit.**

Quiz · Flashcards (SRS) · Mind Map · Cheat Sheet · Mains Evaluator · Teach-Back — all grounded in *your* uploaded material, with page-level proof for every answer.

Built for **UPSC CSE · UPPCS · SSC CGL/GD · State PSC** preparation.

> **v18.1** · Single-file app · No build step · No backend · Bring your own API key

---

## ✨ What it does

Upload a PDF (NCERT, standard book, notes) **or click a photo of a book page**, and the app:

1. Extracts the text locally (PDF parsing / OCR — nothing is uploaded anywhere),
2. Sends only that text to your chosen AI provider,
3. Generates exam-ready material **strictly from that content** — with the source page number and an exact quote as proof.

Every question is checked back against the original page text, so you can see at a glance whether an answer is **grounded in your material** or possibly invented.

---

## 🚀 Quick start

There is **no install and no build step**. Just open the app and paste an API key.

### Option 1 — Use it locally
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
# simply open index.html in your browser, or serve it:
npx serve .
```

### Option 2 — Use the hosted version
Open the deployed URL → paste your API key in **Step 1** → upload a PDF → press **Generate**.

> 🔑 You need **one free API key** from any supported provider. The app auto-detects which provider your key belongs to — no model or provider dropdowns to configure.

---

## 🔑 Supported AI providers

| Provider | Get a free key | Notes |
| --- | --- | --- |
| **Google Gemini** | https://aistudio.google.com/app/apikey | Best all-round; also powers Gemini TTS |
| **Groq** | https://console.groq.com/keys | Extremely fast |
| **OpenRouter** | https://openrouter.ai/keys | Many models behind one key |
| **OpenAI** | https://platform.openai.com/api-keys | Browser CORS may block it — use a proxy |
| **DeepSeek** | https://platform.deepseek.com | Cheap, strong reasoning |
| **Mistral** | https://console.mistral.ai | Good European option |

**Auto-agent:** paste any key and the app detects the provider, live-probes the account, ranks the best available models, and auto-fails over if one model is rate-limited or unavailable.

**Fallback agent (optional):** add a *second* key from a different provider. If your primary provider (or all of its models) fails, the app automatically switches to the fallback agent and keeps going.

---

## 📖 How to use

1. **Step 1 — AI Engine:** paste your API key (and optionally a fallback key). Choose a teaching persona.
2. **Step 2 — Content Source:** upload a **PDF** *or* **photo(s)** of a book page. Pick full-PDF coverage, fresh unvisited pages, or a custom page range. You can also search inside the PDF and jump to a page.
3. **Step 3 — Exam & Audio Settings:** pick exam pattern, question style, language, timer, PYQ tagging, answer double-check, and TTS voice.
4. **Step 4 — Study Mode & Generate:** choose **Quiz / Flashcards / Mind Map / Cheat Sheet** and press **Generate**.

Then use the left sidebar to explore the Library, Practice Tools, and Progress.

---

## 🎯 Features

### Content generation
- **Quiz** — UPSC/UPPCS/SSC patterns (statement-based, assertion-reason, match-the-following, chronology…), 4 options, timer, 50:50 hint, bookmarks, voice answering.
- **Flashcards (SRS)** — Leitner boxes with **real due dates** (1 min / 10 min / 1 day / 4 days) and a persistent deck.
- **Mind Map** — topic → branches → expandable nodes, generated from your material.
- **Cheat Sheet** — high-yield summary, key concepts with page refs, facts, mnemonics.

### Accuracy & trust
- **Source-proof verification** — every answer's quote is checked against the real page text: ✅ verified / 🟡 partial / ⚠️ unverified.
- **🔧 Fix unverified** — one click to re-check and correct the flagged questions.
- **🔀 Multi-model consensus** — a second model independently answers the same questions; disagreements are flagged per question.
- **🔍 Double-check answers** — an optional extra accuracy pass over the generated set.
- **PYQ tagging** — each question tagged with the previous-year exam it appeared in (or "New"), plus a **PYQ-only practice** filter.

### Practice tools
- **Mains Answer Evaluator** — score out of 25 across Intro / Body / Governance / Conclusion, plus **word count**, a **structure checklist**, **keywords you used vs missed**, and a full **model answer** you can listen to.
- **Active Recall (Blurting)** — write everything you remember; AI tells you which core keywords you missed.
- **Teach-Back Mode** — explain a concept out loud or in text; get Coverage / Clarity / Accuracy scores.
- **Visual Tools** — auto-generate a **Timeline**, **Comparison Table**, or **Flowchart** from your content.
- **Weakness Heatmap + Error Notebook** — topic-wise accuracy from your past quizzes.

### Library & progress
- **🗂️ My Sets** — save generated quizzes, re-practice them, export/import them as JSON (share with friends).
- **📚 PDF Library** — store PDFs in the browser (IndexedDB) so you never re-upload them.
- **🗓️ Revision Plan** — exam countdown + today's plan (due SRS cards, weakest topics, streak).
- **📈 Progress** — accuracy trend, 4-week activity heatmap, total attempts, best score.
- **🧪 Self-Test & Data** — 16-point health check, **API usage meter**, and **Backup / Restore** (all your data in one JSON file).

### v18.1 — screen bug fixes

Five real UI defects, found by auditing every section at desktop / tablet / phone widths:

| Bug | Cause | Fix |
|---|---|---|
| **Stray text at the very top of the page** | The `<body>` tag had been lost and replaced by a literal `\1`, so browsers invented an implicit body and rendered that text above the header | `<body>` restored |
| **An 18px sliver of the sidebar was always visible on phones** | The mobile drawer was positioned with `left: calc(-1 * var(--sidebar-w) - 12px)`, but a fixed element with no explicit `width` shrink-wraps — it rendered 288px wide, not 258px | drawer now uses `transform: translateX(calc(-100% - 20px))`, which is measured from its real width |
| **The phone header ate 212px of an 844px screen (25%)** | brand title wrapped to 3 lines; controls to 2 rows | compacted to **125px** (−41%): smaller icon, tighter badges, the exam pill hidden below 480px, smaller pills |
| **Section headings showed a cyan "selection box"** | moving focus to a heading for screen readers tripped a `:focus-visible { outline: … !important }` rule | the outline is suppressed for programmatically focused headings only — keyboard focus rings are untouched |
| **Copy said "left sidebar" on phones** | the sidebar is a drawer there | now reads "menu (☰) se khulte hain" |

Verified after the fixes: all 22 sections clean at 390 / 768 / 1340 px with **zero horizontal overflow**, the drawer opens and closes correctly, and the self-test is still 27/27.

### v18 — a tidier app, and your data in your own Google Drive

**Information architecture cleanup.** The app had grown to 21 sections across 7 flat groups. The sidebar is now five collapsible groups, with the two you use most open by default:

| Group | Contains |
|---|---|
| ⚙️ **Setup** | the API key + upload + generate flow |
| 📚 **Study** *(open)* | Quiz, Flashcards (SRS), Mind Map, Cheat Sheet, Results |
| 🔁 **Revise & Practice** *(open)* | Mistake Notebook, Adaptive Practice, Listen Mode, Exam-Day Sprint, Mains Evaluator, Active Recall, Teach-Back |
| 📈 **Insights** | Progress, Weakness Heatmap, Visual Tools, Doubt History |
| 🗃️ **Library & Plan** | My Sets, PDF Library, Revision Plan |
| ☁️ **Account & Data** | Cloud Sync, Self-Test & Backup |

- Group open/closed state is remembered, and navigating to an item automatically opens its group.
- The four **demo** buttons moved out of the navigation into a compact chip row at the bottom — they are a helper, not a destination.
- Group headers are keyboard-operable with correct `aria-expanded`.

**☁️ Cloud Sync — your data stays in your own Google Drive**

Optional, off by default, and there is still no server of ours anywhere.

- **Sign in with Google** in the browser via Google Identity Services. The app requests **only** the `drive.appdata` scope.
- Backups are written to your Drive's hidden **`appDataFolder`** — visible only to this app, not even in the Drive UI. No one else can read it, and the app cannot see any of your other Drive files.
- **Backup / Restore / Delete** from Drive, plus an optional **auto-sync every 10 minutes**.
- **You bring your own OAuth client ID.** The app shows a 5-step setup card; the client ID is stored locally. This is what keeps the data inside *your* Google project rather than someone else's.
- **Sign out** revokes the token immediately.
- The file backup/restore still works exactly as before, and now shares one payload builder with the Drive path.

*Known limitation:* Google does not publish a stable SRI hash for the Identity Services script, so that one script cannot be integrity-pinned. It is reported separately in the self-test rather than counted as a gap. It is also loaded on demand — not at startup.

**Self-test is now 27 checks.**

### v17 — faster, safer, and better at teaching

**Performance**
- **~350 KB lighter first load.** jsPDF and autoTable are no longer fetched on page load — they load on demand the first time you export something (`ensureExportLibs()`). Verified: `window.jspdf` is absent at startup and present after the first export.
- The splash no longer waits for the export libraries.

**Reliability**
- **Proper network retry** — up to 3 attempts with exponential backoff + jitter, honouring the server's `Retry-After` header, and now retrying transient failures (HTTP 5xx, network drops), not just rate limits. Real HTTP status codes are surfaced in error messages.

**Accessibility**
- **Focus management** — opening a section moves keyboard/screen-reader focus to that section's heading, and the hardware back gesture does the same.
- **Live regions** — status text is `role="status" aria-live="polite"`; errors are announced via `role="alert"` plus a screen-reader-only live region.
- **Skip-to-content** link at the top of the page (visible on keyboard focus).

**PWA**
- **Install button** — appears in the header when the browser offers installation (`beforeinstallprompt`), and confirms when the app is installed.

**Data safety**
- **Storage-quota guard** — a full device now shows a clear, actionable message instead of failing silently.
- **Backup nudge** — if you have study data and haven't backed up in 14 days, the dashboard reminds you.

**Study value**
- **“Aaj ka revision” on the dashboard** — aggregates flashcards due for review (from the spaced-repetition schedule) and logged mistakes into one line, with a one-tap *Revision shuru karo* that launches the right session.
- **Mistake reason tagging** — tag every mistake as *Concept gap*, *Silly mistake*, *Guessed* or *Time out*. The notebook then shows an actionable insight, e.g. *“50% of your mistakes are silly mistakes — you know this, just slow down and read every option.”* This turns “I got it wrong” into “here is what to fix”.

**Self-test is now 24 checks**, including the security posture and the lazy-load helper.

### v16 — model refresh + attack hardening

**AI agent models brought up to date (verified against each provider's docs, Oct 2026).** Several models the app shipped with had been retired upstream.

| Provider | Now uses |
|---|---|
| **Gemini** | `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.1-pro-preview` → `gemini-4-argon` → `gemini-2.5-flash` |
| **Groq** | `openai/gpt-oss-120b` → `openai/gpt-oss-20b` → `qwen/qwen3.8-27b` → `llama-3.3-70b-versatile` |
| **OpenAI** | `gpt-6-luna` → `gpt-6.1-sol` → `gpt-5.6-sol` → `gpt-6-astra` → `gpt-4o-mini` |
| **DeepSeek** | `deepseek-flash` → `deepseek-v4-pro` |
| **Mistral** | `mistral-small-2603` → `mistral-medium-3-5` → `mistral-large-4` → `ministral-14b-2512` |
| **OpenRouter** | `deepseek/deepseek-v4.1-flash` → `z-ai/glm-5.3-flash` → free-tier `qwen/qwen3.8-27b:free`, `google/gemma-4-31b-it:free`, `nvidia/nemotron-3-super-120b-a12b:free` |
| **Gemini TTS** | `gemini-3.8-flash-tts`, with automatic fallback to the legacy `gemini-2.5-flash-preview-tts` |

Retired IDs that were removed: `deepseek-chat` / `deepseek-reasoner` (delisted upstream), `qwen-qwq-32b`, `gemma2-9b-it`, `gpt-4-turbo`, `gemini-1.5-flash`/`2.0-flash`.

**New attack protections**

| Control | What it does |
|---|---|
| **Prompt-injection defence** | PDF text is declared *untrusted data, never instructions* in the system prompt. A malicious PDF that says "ignore previous instructions", "print your system prompt" or "output this HTML" is ignored; the model is told never to emit HTML/scripts/links and never to reveal the key. |
| **Outbound host allow-list** | Before any request that carries your API key, the destination host is checked against the six known providers. Anything else is blocked — a compromised or injected code path cannot exfiltrate the key. |
| **Idle auto-lock** | After 30 minutes without activity the key is wiped from memory (and the agent state reset). |
| **Stronger vault KDF** | PBKDF2 raised from 150,000 to **600,000** iterations (OWASP guidance for PBKDF2-HMAC-SHA256). |
| **Unsafe-URL guard** | `javascript:`, `vbscript:` and `data:text/html` links are blocked on click. |
| **Security panel in the self-test** | Reports CSP presence, that `unsafe-eval` is gone, SRI coverage on CDN scripts, sanitisation status, the host allow-list and the idle lock — now **23 checks**. |

### v15 — security hardening

A full vulnerability pass. The app handles **your API keys** and **untrusted documents**, so AI output, imported files and backup files are all treated as hostile input.

| Area | What was done |
|---|---|
| **XSS via AI output** | Every AI-derived string is sanitised at ingestion (`sanitizeAI`) — HTML tags and entity-encoded tags are stripped — and escaped at every render site. Verified with an automated runtime probe that injects `<img onerror>` payloads into every render path (0 exploitable sinks). |
| **Imported sets** | Questions from imported `.json` files are re-validated and normalised (max 500, sanitised fields) instead of being stored raw. |
| **Backup restore** | Only storage keys matching the app's own `ai_study_*_v*` pattern are restored, with type and size checks — a backup file can no longer write arbitrary storage entries. |
| **Supply chain** | All CDN scripts (pdf.js, jsPDF, autoTable, Tesseract) are pinned and carry **Subresource Integrity** hashes. |
| **CSP** | `unsafe-eval` removed (verified unnecessary — PDF parsing tested with and without). Added `form-action 'none'` and `frame-ancestors 'none'`. |
| **Headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, HSTS (preload), COOP, `X-Permitted-Cross-Domain-Policies: none`, restrictive Permissions-Policy. |
| **Key storage** | `sessionStorage` by default (cleared when the tab closes); optional localStorage with an **AES-GCM 256 + PBKDF2 (150,000 iterations)** passphrase vault. Keys are sent in request headers, never in URLs. |
| **Repo hygiene** | A leaked Android signing keystore and a hardcoded keystore password in CI were removed from the public repository. |

**Known limitation:** the CSP keeps `'unsafe-inline'` for `script-src` because the UI uses inline event handlers. Inline-handler XSS is mitigated by the sanitisation + escaping above rather than by CSP. Migrating every handler to `addEventListener` would allow dropping it.

### v14 — smoother, smarter, tidier
- **Splash screen re-engineered for performance** — the particle field now uses pre-rendered glow sprites instead of per-particle canvas shadows, a spatial-hash grid for the connection lines (linear instead of quadratic), a frame-rate gate, and adaptive quality tiers (lite / medium / full) that step down automatically if frames get slow. The heavy animated `background-clip: text` gradients and drop-shadow filters on the splash were removed. Measured canvas cost: **~0.27 ms per frame**.
- **Quiz navigation** — new **← Pichla** (previous) and **Skip →** buttons, plus keyboard support (`←` previous, `→` next, `S` skip). Going back re-opens a question in review mode with the correct answer marked, without scoring it twice.
- **Auto theme** — a new *Auto (system)* option follows your OS light/dark setting and switches live when the system does.
- **Copy buttons** — one tap to copy the cheat sheet or the mind map to the clipboard.
- **Cleaner config** — the TTS engine setting now lives in one place (Step 3) instead of two, the security headers live only in `_headers`, and an unrelated auto-generated workflow was removed.

### Advanced UI (v13)
- **Refined design system** — a full token pass: layered elevation, hairline highlights, a consistent spacing scale, and a proper type stack with tabular numerals for every stat.
- **Upgraded components** — gradient buttons with hover lift, shimmer and press states; glass header with `backdrop-filter`; cards, tiles and option buttons with hover elevation and focus rings.
- **Sidebar** — active-item accent bar with a gradient highlight, smoother hover motion, and divider lines on group headers.
- **Motion** — staggered section entrance, reduced-motion support, and themed scrollbars, text selection and keyboard focus outlines.
- **Mobile polish** — larger touch targets, tighter spacing and static header on small screens.

### Smart revision (v12)
- **📕 Mistake Notebook** — every question you get wrong is collected automatically, with your answer vs the correct one, topic and source page. Retry just your mistakes, or turn them into flashcards with one tap.
- **🎚️ Adaptive Practice** — the app reads your topic-wise accuracy and builds a study plan: what's weak, what's average, what's strong. One click sets the focus and difficulty for your next quiz.
- **🎧 Listen Mode** — hands-free audio revision. It reads your due flashcards (or all cards, or your mistakes) aloud one after another with adjustable speed — perfect for a walk or commute.
- **⏱️ Exam-Day Sprint** — a 15-minute countdown that surfaces only the highest-yield points from everything you've saved: flashcards, fixed mistakes, weak topics and cheat-sheet lines.
- **💬 Doubt History** — every "Ask PDF Doubt" question and answer is saved, so you can revisit what you asked while studying.

### Experience
- **Themes:** Midnight · Ocean · Forest · Sunset · Rose · Light · Sepia · True Dark
- **Accessibility:** text size, dyslexia-friendly font, high contrast, reduce motion
- **UI language:** Hinglish · हिंदी · English
- **Onboarding tour**, mobile **swipe gestures**, **Pomodoro timer**, **voice answering**
- **TTS:** free browser voice **or** natural **Gemini TTS** (24 kHz, handles Hindi/Hinglish)
- **PWA:** installable, with an offline shell for saved content

---

## ⌨️ Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `1` `2` `3` `4` (or `A` `B` `C` `D`) | Select answer option |
| `Enter` | Next question (after answering) |
| `Space` | Flip flashcard |
| `←` / `→` | Previous / next flashcard |
| `Esc` | Close the accessibility panel |

On mobile, **swipe left** for next question and **swipe right** for the previous one.

---

## 📤 Exports

| Format | What it contains |
| --- | --- |
| **Anki CSV** | Flashcards, ready to import into Anki |
| **Flashcards PDF** | Printable deck |
| **Notes PDF** | Cheat sheet |
| **Scorecard PDF** | Full session report with proof key |
| **DOCX** | Cheat sheet as an editable Word document |
| **Question-set JSON** | Share/import a saved quiz |
| **Backup JSON** | Everything — keys, SRS, sets, library, progress, settings |

---

## 🔒 Privacy & Security

- **Your files never leave your device.** PDF parsing and OCR run entirely in the browser. Only the *extracted text* is sent to your chosen AI provider.
- **Your API key goes straight to the provider** — as a request header, never through a third-party server, and **never inside the prompt** (so a malicious PDF can't make the model leak it).
- **Key storage is opt-in:** by default keys live in `sessionStorage` and vanish when the tab closes. "Remember key" moves them to `localStorage`, and you can additionally **encrypt saved keys with a passphrase** (AES-GCM + PBKDF2, 150k iterations).
- **Content Security Policy** locks `connect-src` to the AI providers only — so even if something were injected, a key couldn't be exfiltrated elsewhere.
- **Security headers** via the included `_headers` file (`X-Frame-Options`, `nosniff`, `Referrer-Policy: no-referrer`, HSTS, Permissions-Policy, CSP).
- **XSS-safe rendering:** all AI-generated content is escaped before it touches the DOM.
- **🗑️ Clear all saved data** button wipes every locally stored key and record.

---

## 📱 PWA / offline

The app ships with `manifest.json` and `sw.js`. Once deployed over HTTPS you can **install it** (Add to Home Screen) and it works as an app.

The service worker caches the app shell and CDN libraries so the interface opens offline and your saved flashcards/notes stay readable. **AI calls always go to the network** — the service worker never intercepts or caches provider requests.

---

## 🗂️ Project structure

```
.
├── index.html          # The entire application (HTML + CSS + JS, single file)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline shell)
├── _headers            # Netlify security headers
├── icon-192.png        # PWA icon
└── icon-512.png        # PWA icon
```

Everything lives in `index.html`. The rest are progressive enhancements for the PWA and hosting.

---

## 🛠️ Tech stack

- **Vanilla HTML / CSS / JavaScript** — no framework, no bundler, no dependencies to install
- [pdf.js](https://mozilla.github.io/pdf.js/) — PDF parsing & streaming (up to ~2 GB)
- [Tesseract.js](https://tesseract.projectnaptha.com/) — photo → text OCR
- [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) — PDF exports
- **Web Crypto API** — passphrase encryption for stored keys
- **IndexedDB** — PDF library & saved question sets
- **localStorage / sessionStorage** — settings, SRS, progress
- **Service Worker + Web App Manifest** — PWA

---

## 🌐 Deployment

### Netlify (from GitHub)

1. Push this repository to GitHub.
2. In Netlify: **Add new site → Import an existing project → GitHub** → pick this repo.
3. Settings:
   - **Build command:** *(leave empty)*
   - **Publish directory:** `/` (the repository root)
4. Deploy. `index.html` is served at the site root, and `_headers` applies the security headers automatically.

Every push to the main branch redeploys automatically.

### Any other static host

Just serve the repository root as static files — GitHub Pages, Cloudflare Pages, Vercel, S3, or a plain nginx box all work identically.

> **Note:** a service worker needs **HTTPS** (or `localhost`). On plain `file://` the app still runs fully — only installability/offline shell are unavailable.

---

## 🧪 Self-test

Open **Self-Test** in the sidebar and press **Run self-test**. It checks 16 things — sections, core functions, libraries, Web Crypto, IndexedDB, storage, CSP, duplicate IDs, providers, service worker — and shows the API usage meter plus backup/restore.

---

## 🐛 Troubleshooting

| Problem | Fix |
| --- | --- |
| "Invalid API key" | Re-check the key; make sure it's from a supported provider and has quota left. |
| Nothing generates | The PDF may be scanned/image-only — the app falls back to OCR automatically, but a clear, straight scan works best. |
| Gemini voice doesn't play | Mobile browsers block autoplay — tap **▶ Play** once in the audio bar. Also make sure a **Gemini** key is entered for TTS. |
| OpenAI key fails | OpenAI blocks browser CORS; use Gemini / Groq / OpenRouter / DeepSeek / Mistral, or a proxy. |
| Slow generation | Try fewer questions, a smaller page range, or turn off "Double-check answers". |
| Deploy shows old version | Hard-refresh (`Ctrl/Cmd + Shift + R`) — the service worker may be serving a cached shell. |

---

## 🗺️ Roadmap

- [ ] Full-length **Mock Test** mode (sectional timing, negative marking, percentile)
- [ ] Hindi/regional interface beyond Hinglish & English
- [ ] Optional server-side proxy so keys never touch the browser

---

## 🤝 Contributing

Issues and pull requests are welcome. Since the whole app is a single `index.html`, please:

- Keep it dependency-free and buildless.
- Escape any AI-generated content before inserting it into the DOM.
- Never put API keys or secrets in the code — the app is bring-your-own-key by design.

---

## 📄 License

Released under the **MIT License** — free to use, modify, and share.

> Add a `LICENSE` file to the repository to make this official.

---

## 👨‍💻 Author

**Made with ❤️ by Himanshu**

If this helped your preparation, a ⭐ on the repo means a lot.

---

<p align="center"><em>AI Study Suite PRO v14.0 — study smarter, not longer.</em></p>
