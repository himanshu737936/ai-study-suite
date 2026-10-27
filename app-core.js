
    /* Clickjacking guard: hosts that ignore the _headers file (e.g. GitHub Pages)
       cannot send frame-ancestors / X-Frame-Options, so refuse to run inside a frame. */
    if (window.top !== window.self) {
      try { window.top.location = window.self.location; }
      catch (e) { document.documentElement.style.display = 'none'; }
    }
    // ---- app version: single source of truth is the <meta name="app-version"> tag.
    // The GitHub Action (.github/workflows/version-bump.yml) bumps it on every push,
    // and this propagates it to every "vX.Y.Z" string shown in the UI. ----
    const APP_VERSION = ((document.querySelector('meta[name="app-version"]') || {}).content || 'dev').trim();
    function applyAppVersion() {
      try {
        const v = 'v' + APP_VERSION;
        document.title = document.title.replace(/v\d+\.\d+(\.\d+)?/, v);
        const walk = (node) => {
          if (node.nodeType === 3) { if (/v\d+\.\d+(\.\d+)?/.test(node.nodeValue)) node.nodeValue = node.nodeValue.replace(/v\d+\.\d+(\.\d+)?/g, v); }
          else if (node.nodeType === 1 && !/^(SCRIPT|STYLE)$/.test(node.tagName)) { for (const c of node.childNodes) walk(c); }
        };
        walk(document.body);
      } catch (e) {}
    }
    // PDF.js is loaded on demand (only when a PDF is actually used) so the app
    // starts instantly instead of waiting on a 300 KB library.
    let pdfJsPromise = null;
    function loadPdfJs() {
      if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
      if (pdfJsPromise) return pdfJsPromise;
      pdfJsPromise = new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        sc.integrity = 'sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e';
        sc.crossOrigin = 'anonymous';
        sc.referrerPolicy = 'no-referrer';
        sc.onload = () => resolve(window.pdfjsLib);
        sc.onerror = () => { pdfJsPromise = null; reject(new Error('PDF library load nahi hui — internet check karo.')); };
        document.head.appendChild(sc);
      });
      return pdfJsPromise;
    }
    if (window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // ==================== SPLASH / LOADING SCREEN (animated particles) ====================
    function startSplash() {
      const splash = document.getElementById('splash');
      if (!splash) return;
      const canvas = document.getElementById('splash-canvas');
      const ctx = (canvas && canvas.getContext) ? canvas.getContext('2d', { alpha: true }) : null;
      const fill = document.getElementById('splash-fill');
      const ring = document.getElementById('logo-progress');
      const stageEl = document.getElementById('splash-stage-text');
      const pctEl = document.getElementById('splash-pct');
      let raf = null, finished = false;

      // ---- adaptive quality: lite / medium / full -------------------------
      const cores = navigator.hardwareConcurrency;
      const mem = navigator.deviceMemory;              // Chrome only; undefined elsewhere
      const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 400;
      const knownLowCores = typeof cores === 'number' && cores <= 2;
      const knownLowMem = typeof mem === 'number' && mem <= 2;
      const knownMidCores = typeof cores === 'number' && cores <= 4;
      const knownMidMem = typeof mem === 'number' && mem <= 4;
      let tier = (reduceMotion || knownLowCores || knownLowMem) ? 0
               : (knownMidCores || knownMidMem || smallScreen) ? 1 : 2;
      const Q = [
        { n: 26, streaks: 0, dpr: 1.0,  frame: 66, links: false },  // 0 lite
        { n: 46, streaks: 1, dpr: 1.25, frame: 40, links: true  },  // 1 medium
        { n: 70, streaks: 3, dpr: 1.5,  frame: 33, links: true  }   // 2 full
      ];

      // ---- loading milestones (~6s) ----
      const MIN_MS = 3000, MAX_MS = 5000;
      const STAGES = [
        { at: 4,   label: 'Booting AI engine\u2026' },
        { at: 22,  label: 'Loading PDF & export libraries\u2026' },
        { at: 42,  label: 'Preparing OCR, voice & audio\u2026' },
        { at: 62,  label: 'Restoring your session\u2026' },
        { at: 80,  label: 'Warming up the workspace\u2026' },
        { at: 94,  label: 'Almost ready\u2026' },
        { at: 100, label: 'Ready \u2014 chalo shuru karein!' }
      ];
      let pct = 0, lastStage = '';
      function setPct(v) {
        pct = Math.max(pct, Math.min(100, v));
        if (fill) fill.style.width = pct + '%';
        if (ring) ring.style.setProperty('--pct', pct.toFixed(1));
        if (pctEl) pctEl.innerText = Math.round(pct) + '%';
        const st = STAGES.filter(x => x.at <= pct).pop();
        if (st && stageEl && st.label !== lastStage) {
          lastStage = st.label;
          stageEl.style.opacity = '0';
          setTimeout(() => { stageEl.innerText = st.label; stageEl.style.opacity = '1'; }, 180);
        }
      }
      const t0 = performance.now();
      const tickMs = 150, target = 88, ticks = MIN_MS / tickMs;
      const tick = setInterval(() => { if (pct < target) setPct(pct + (target / ticks) * (0.55 + Math.random() * 0.95)); }, tickMs);
      const cleanups = [];
      const hide = () => {
        if (finished) return;
        finished = true;
        clearInterval(tick);
        cleanups.forEach(fn => { try { fn(); } catch (e) {} });
        splash.classList.add('hide');
        setTimeout(() => { if (raf) cancelAnimationFrame(raf); try { splash.remove(); } catch (e) {} }, 900);
      };
      function checkReady() {
        const elapsed = performance.now() - t0;
        const libsReady = true;   // everything heavy (pdf.js, jsPDF, tesseract) loads on demand now
        if ((libsReady && elapsed >= MIN_MS) || elapsed >= MAX_MS) { setPct(100); setTimeout(hide, 500); }
        else setTimeout(checkReady, 150);
      }
      checkReady();

      // ---- particle field (sprite glow, grid-hashed links, frame-gated) ----
      if (ctx) {
        let W = 0, H = 0, mx = 0, my = 0;
        let DPR = Math.min(Q[tier].dpr, window.devicePixelRatio || 1);
        const parts = [], streaks = [];

        // pre-rendered radial-gradient sprites — far cheaper than ctx.shadowBlur
        function makeSprite(rgb) {
          const S = 32, c = document.createElement('canvas');
          c.width = c.height = S;
          const g = c.getContext('2d');
          const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
          grd.addColorStop(0, 'rgba(' + rgb + ',1)');
          grd.addColorStop(0.35, 'rgba(' + rgb + ',0.55)');
          grd.addColorStop(1, 'rgba(' + rgb + ',0)');
          g.fillStyle = grd; g.fillRect(0, 0, S, S);
          return c;
        }
        const SPR_CYAN = makeSprite('103,232,249');
        const SPR_VIOLET = makeSprite('165,180,252');

        const resize = () => {
          W = window.innerWidth; H = window.innerHeight;
          DPR = Math.min(Q[tier].dpr, window.devicePixelRatio || 1);
          canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
          canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
          ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        };
        resize();
        const onMove = (e) => { mx = (e.clientX / Math.max(1, W)) - 0.5; my = (e.clientY / Math.max(1, H)) - 0.5; };
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', onMove, { passive: true });
        cleanups.push(() => window.removeEventListener('resize', resize));
        cleanups.push(() => window.removeEventListener('mousemove', onMove));

        function seed() {
          parts.length = 0; streaks.length = 0;
          const q = Q[tier];
          for (let i = 0; i < q.n; i++) {
            const z = Math.random() * 0.85 + 0.15;
            parts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.5 * z, vy: (Math.random() - 0.5) * 0.5 * z,
              r: (Math.random() * 2.2 + 0.9) * z, z, cyan: Math.random() < 0.4, ph: Math.random() * Math.PI * 2 });
          }
          for (let i = 0; i < q.streaks; i++) {
            const len = 90 + Math.random() * 130;
            streaks.push({ x: Math.random() * W, y: Math.random() * H * 0.5, len, sp: 5 + Math.random() * 6,
              a: 0.45 + Math.random() * 0.4, delay: Math.random() * 3000, grad: null });
          }
        }
        seed();

        const LINK2 = 17000, CELL = 150;
        const grid = new Map();
        let lastFrame = 0, slowFrames = 0, downgraded = false;

        const frame = (now) => {
          if (!ctx || finished) return;
          raf = requestAnimationFrame(frame);
          if (document.hidden) return;
          const q = Q[tier];
          if (now - lastFrame < q.frame) return;   // frame-rate gate
          const dt = Math.min(48, now - lastFrame) / 16.67;
          lastFrame = now;

          // adaptive quality: if frames are consistently slow, step one tier down
          if (!downgraded) {
            frame._sum = (frame._sum || 0) + (now - lastFrame);
            frame._count = (frame._count || 0) + 1;
            if (frame._count >= 24) {
              const avg = frame._sum / frame._count;
              frame._sum = 0; frame._count = 0;
              if (avg > 46 && tier > 0) { tier -= 1; downgraded = true; seed(); }
              else if (avg <= 30) { downgraded = true; }
            }
          }
          const t = (now - t0) / 1000;
          ctx.clearRect(0, 0, W, H);
          const ox = mx * 26, oy = my * 26;

          for (const p of parts) {
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.x < -30) p.x = W + 30; else if (p.x > W + 30) p.x = -30;
            if (p.y < -30) p.y = H + 30; else if (p.y > H + 30) p.y = -30;
          }

          // ---- links: spatial hash grid, batched into 3 alpha buckets ----
          if (q.links) {
            grid.clear();
            for (let i = 0; i < parts.length; i++) {
              const p = parts[i];
              const key = ((p.x / CELL) | 0) + ':' + ((p.y / CELL) | 0);
              let bucket = grid.get(key);
              if (!bucket) { bucket = []; grid.set(key, bucket); }
              bucket.push(i);
            }
            const buckets = [[], [], []];
            for (let i = 0; i < parts.length; i++) {
              const a = parts[i];
              const cx = (a.x / CELL) | 0, cy = (a.y / CELL) | 0;
              for (let gx = cx - 1; gx <= cx + 1; gx++) {
                for (let gy = cy - 1; gy <= cy + 1; gy++) {
                  const bucket = grid.get(gx + ':' + gy);
                  if (!bucket) continue;
                  for (const j of bucket) {
                    if (j <= i) continue;
                    const b = parts[j];
                    const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
                    if (d2 < LINK2) {
                      const k = d2 < 5600 ? 0 : d2 < 11300 ? 1 : 2;
                      buckets[k].push([a.x + ox * a.z, a.y + oy * a.z, b.x + ox * b.z, b.y + oy * b.z]);
                    }
                  }
                }
              }
            }
            const alphas = [0.26, 0.16, 0.09];
            ctx.lineWidth = 1;
            for (let k = 0; k < 3; k++) {
              const arr = buckets[k];
              if (!arr.length) continue;
              ctx.strokeStyle = 'rgba(109,111,245,' + alphas[k] + ')';
              ctx.beginPath();
              for (const seg of arr) { ctx.moveTo(seg[0], seg[1]); ctx.lineTo(seg[2], seg[3]); }
              ctx.stroke();
            }
          }

          // ---- nodes: drawImage sprites (no shadowBlur) ----
          for (const p of parts) {
            const pulse = 0.6 + 0.4 * Math.sin(t * 2 + p.ph);
            const sz = p.r * 7 * pulse;
            ctx.globalAlpha = (0.55 + 0.45 * pulse) * (0.5 + 0.5 * p.z);
            ctx.drawImage(p.cyan ? SPR_CYAN : SPR_VIOLET,
              p.x + ox * p.z - sz / 2, p.y + oy * p.z - sz / 2, sz, sz);
          }
          ctx.globalAlpha = 1;

          // ---- streaks: gradient built once, then reused ----
          for (const sk of streaks) {
            if (now - t0 < sk.delay) continue;
            sk.x += sk.sp * dt; sk.y += sk.sp * 0.35 * dt;
            if (sk.x > W + 220) { sk.x = -220; sk.y = Math.random() * H * 0.6; }
            if (!sk.grad) {
              const g = ctx.createLinearGradient(0, 0, -sk.len, -sk.len * 0.35);
              g.addColorStop(0, 'rgba(165,243,252,' + sk.a + ')');
              g.addColorStop(1, 'rgba(165,243,252,0)');
              sk.grad = g;
            }
            ctx.save();
            ctx.translate(sk.x, sk.y);
            ctx.strokeStyle = sk.grad; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-sk.len, -sk.len * 0.35); ctx.stroke();
            ctx.restore();
          }
        };
        raf = requestAnimationFrame(frame);
      }
      // safety net: never trap the user on the splash
      setTimeout(() => { if (!finished) { setPct(100); hide(); } }, MAX_MS + 1500);
    }

    // ==================== GLOBAL STABILITY HANDLERS ====================
    let _lastErrShown = 0, _lastErrMsg = "";
    function reportUnexpectedError(msg) {
      try {
        const m = String(msg || "Unexpected error").slice(0, 220);
        const now = Date.now();
        if (m === _lastErrMsg && now - _lastErrShown < 8000) return;
        _lastErrMsg = m; _lastErrShown = now;
        showError(m);
      } catch (_) {}
    }
    window.addEventListener('error', (e) => { if (e && e.message) reportUnexpectedError(e.message); });
    window.addEventListener('unhandledrejection', (e) => {
      const r = e && e.reason;
      const m = r ? (r.message || String(r)) : "Async error";
      if (/AbortError|interrupted by a call to pause|NotAllowedError|play\(\) request was interrupted/i.test(m)) return;
      reportUnexpectedError(m);
    });

    // ==================== ZERO-CONFIG AUTO-AGENT PROVIDER PROFILES ====================
    const AUTO_AGENT_PROVIDERS = {
      gemini: {
        name: "Google Gemini AI Agent",
        modelsUrl: "https://generativelanguage.googleapis.com/v1beta/models",
        fallbackChain: ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.1-pro-preview", "gemini-4-argon", "gemini-2.5-flash"]
      },
      groq: {
        name: "Groq LPU Ultra-Fast Agent",
        modelsUrl: "https://api.groq.com/openai/v1/models",
        chatUrl: "https://api.groq.com/openai/v1/chat/completions",
        fallbackChain: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "llama-3.3-70b-versatile"]
      },
      openrouter: {
        name: "OpenRouter Multi-Model Agent",
        modelsUrl: "https://openrouter.ai/api/v1/models",
        chatUrl: "https://openrouter.ai/api/v1/chat/completions",
        fallbackChain: ["deepseek/deepseek-v4.1-flash", "z-ai/glm-5.3-flash", "qwen/qwen3.8-27b:free", "google/gemma-4-31b-it:free", "nvidia/nemotron-3-super-120b-a12b:free"]
      },
      openai: {
        name: "OpenAI ChatGPT Agent",
        modelsUrl: "https://api.openai.com/v1/models",
        chatUrl: "https://api.openai.com/v1/chat/completions",
        fallbackChain: ["gpt-6-luna", "gpt-6.1-sol", "gpt-5.6-sol", "gpt-6-astra", "gpt-4o-mini"]
      },
      deepseek: {
        name: "DeepSeek Official Agent",
        modelsUrl: "https://api.deepseek.com/models",
        chatUrl: "https://api.deepseek.com/chat/completions",
        fallbackChain: ["deepseek-flash", "deepseek-v4-pro"]
      },
      mistral: {
        name: "Mistral AI Agent",
        modelsUrl: "https://api.mistral.ai/v1/models",
        chatUrl: "https://api.mistral.ai/v1/chat/completions",
        fallbackChain: ["mistral-small-2603", "mistral-medium-3-5", "mistral-large-4", "ministral-14b-2512"]
      }
    };

    // Active Auto-Selected Agent State
    let detectedProvider = null;       // 'gemini' | 'groq' | 'openrouter' | 'openai' | 'deepseek' | 'mistral'
    let activeModelQueue = [];         // Ordered list of working models for automatic failover
    let fallbackProvider = null;       // Cross-provider fallback agent
    let fallbackModelQueue = [];
    let fallbackKeyDetectTimer = null;
    let keyDetectTimer = null;

    // App & 2GB PDF State
    let studyMode = 'quiz';
    let pdfDocInstance = null;
    let activeBlobUrl = null;
    let totalPdfPages = 0;
    let currentPdfName = "Study_Material.pdf";
    let pageTextCache = new Map();
    let visitedPagesSet = new Set();
    let previousQuestionsHistory = [];
    let lastSampledPagesList = [];

    // Quiz State
    let quizData = [];
    let currentIndex = 0;
    let score = 0;
    let isQuestionAnswered = false;
    let wrongQuestions = [];
    let qAnswers = {};        // questionIndex -> chosen option index (for Prev / review)
    let skippedCount = 0;     // questions skipped with the Skip button
    let bookmarkedQuestions = [];
    let userResponses = [];
    let topicStats = {};
    let resultsRecorded = false;   // guards stats/progress so viewing Results twice doesn't double-count
    let timerInterval = null;
    let timeLeft = 45;

    // Voice, SRS & MindMap State
    let speechRec = null;
    let voiceModeActive = false;
    let flashcardData = [];
    let fullFlashcardDeck = [];
    let fcIndex = 0;
    let srsStorage = {};
    let mindMapData = null;
    let notesData = null;

    // Part 1-5 State
    let errorLog = {};                 // { topic: {attempts, wrong} } persisted
    let currentMainsQuestion = "";
    let ttsUtterance = null;
    let ttsPlaying = false;
    let ttsSpeed = 1;
    let ttsLangMode = 'auto';          // 'auto' | 'hi-IN' | 'en-IN'
    let ttsFullText = "";
    let ttsBoundaryEnd = 0;
    let ttsEngine = 'browser';          // 'browser' | 'gemini'
    let geminiTtsVoice = 'Kore';
    let ttsAudioEl = null;
    let ttsChunkUrls = [];
    let ttsChunkBlobs = [];
    let ttsStopFlag = false;
    let ttsAudioUnlocked = false;
    const TTS_SILENT_WAV = 'data:audio/wav;base64,UklGRtQEAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YbAEAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA=';
    // Prime the audio element inside a real user gesture so later (async) playback
    // is not blocked by the mobile/desktop autoplay policy.
    function unlockTtsAudio() {
      if (ttsAudioUnlocked) return;
      try {
        if (!ttsAudioEl) ttsAudioEl = new Audio();
        ttsAudioEl.src = TTS_SILENT_WAV;
        // 'playing' fires as soon as the silent clip actually starts - the most
        // reliable signal that this element is now unlocked for later playback.
        ttsAudioEl.onplaying = () => { ttsAudioUnlocked = true; };
        const pr = ttsAudioEl.play();
        if (pr && pr.then) pr.then(() => { ttsAudioUnlocked = true; }).catch(() => {});
        else ttsAudioUnlocked = true;
      } catch (e) {}
    }
    ['pointerdown', 'click', 'touchstart', 'keydown'].forEach(ev =>
      window.addEventListener(ev, unlockTtsAudio, { capture: true, passive: true }));
    let ocrLibPromise = null;
    let subAgentBusy = false;
    let weakTopicsOverride = [];
    let imageOcrText = "";
    let imageSourceNames = [];
    let proofStats = { verified: 0, unverified: 0, total: 0 };
    let consensusStats = { agree: 0, disagree: 0, unknown: 0 };
    let qAccuracyStats = { high: 0, medium: 0, disputed: 0, unknown: 0, repaired: 0, total: 0 };
    let currentMainsModelAnswer = '';
    let teachRec = null;
    let teachActive = false;
    let lastVisualType = 'timeline';
    const SRS_INTERVALS = { 1: 60 * 1000, 2: 10 * 60 * 1000, 3: 24 * 60 * 60 * 1000, 4: 4 * 24 * 60 * 60 * 1000 };
    const MAX_PDF_BYTES_WARN = 150 * 1024 * 1024;
    const PDF_CONTEXT_BUDGET = 48000;
    const HISTORY_CAP = 60;

    // Pomodoro State
    let pomoInterval = null;
    let pomoSeconds = 25 * 60;
    let pomoRunning = false;

    // ==================== PWA: offline shell ====================
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((reg) => {
          // a new version is waiting → activate it right away
          const activate = (w) => { try { w && w.postMessage('SKIP_WAITING'); } catch (e) {} };
          activate(reg.waiting);
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) activate(nw);
            });
          });
        }).catch(() => {});
        // reload exactly once when the new worker takes control (guarded, no loops)
        let reloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloaded) return;
          reloaded = true;
          try {
            if (sessionStorage.getItem('ai_sw_updated') === '1') return;
            sessionStorage.setItem('ai_sw_updated', '1');
          } catch (e) {}
          location.reload();
        });
      });
    }

    // ==================== LIVE GALAXY BACKGROUND ====================
    // A lightweight animated starfield + nebula behind the whole app. It tints
    // itself to the current theme, pauses when the tab is hidden, and falls back
    // to a single static frame when the OS (or the in-app a11y switch) asks for
    // reduced motion.
    let _galaxyCtl = null;
    function galaxyEnabled() { try { return localStorage.getItem('ai_study_galaxy_v20') !== '0'; } catch (e) { return true; } }
    function toggleGalaxy(on) {
      try { localStorage.setItem('ai_study_galaxy_v20', on ? '1' : '0'); } catch (e) {}
      const cv = document.getElementById('galaxy-bg');
      if (cv) cv.style.display = on ? 'block' : 'none';
      if (_galaxyCtl) { if (on) _galaxyCtl.start(); else _galaxyCtl.stop(); }
    }
    function initGalaxy() {
      const cv = document.getElementById('galaxy-bg');
      if (!cv || !cv.getContext) return;
      const ctx = cv.getContext('2d', { alpha: false });
      const reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

      let W = 0, H = 0, DPR = 1, cxp = 0, cyp = 0;
      let stars = [], nebula = [], shots = [];
      let raf = null, last = 0, acc = 0, tsec = 0, resizeT = null;
      let colA = '#6d6ff5', colB = '#22d3ee', colC = '#8b5cf6', base = '#05070f';
      let lightMode = false, bright = 1;
      // Each theme gets its own galaxy palette, so the sky recolours with the UI.
      const GALAXY_THEMES = {
        midnight: { cols: ['#6d6ff5', '#22d3ee', '#a78bfa'], base: '#05070f', bright: 1.00 },
        dark:     { cols: ['#7c83ff', '#38bdf8', '#c4b5fd'], base: '#010204', bright: 1.06 },
        ocean:    { cols: ['#0ea5e9', '#22d3ee', '#67e8f9'], base: '#04121a', bright: 0.95 },
        forest:   { cols: ['#10b981', '#84cc16', '#5eead4'], base: '#050f0a', bright: 0.92 },
        sunset:   { cols: ['#f97316', '#f43f5e', '#fdba74'], base: '#140806', bright: 1.00 },
        rose:     { cols: ['#d946ef', '#8b5cf6', '#f0abfc'], base: '#100512', bright: 1.00 },
        sepia:    { cols: ['#c98a3a', '#e0b26a', '#f0c987'], base: '#17100a', bright: 0.86 },
        crystal:  { cols: ['#7dd3fc', '#a5b4fc', '#e0f2fe'], base: '#050a18', bright: 1.04 },
        glass:    { cols: ['#c4b5fd', '#67e8f9', '#e9d5ff'], base: '#0a0b12', bright: 1.02 },
        jarvis:   { cols: ['#22d3ee', '#fbbf24', '#67e8f9'], base: '#03060c', bright: 1.06 }
      };
      const starSpr = makeStarSprite('255,255,255');
      const starSprDark = makeStarSprite('46,60,110');
      const starSprCool = makeStarSprite('205,228,255');   // blue-white hot stars
      const starSprWarm = makeStarSprite('255,232,198');   // amber giants

      function hexA(hex, a) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '').trim());
        if (!m) return 'rgba(255,255,255,' + a + ')';
        return 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + a + ')';
      }
      function glowSprite(hex, peak) {
        const s = document.createElement('canvas'); s.width = s.height = 128;
        const c = s.getContext('2d');
        const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, hexA(hex, peak));
        g.addColorStop(0.4, hexA(hex, peak * 0.32));
        g.addColorStop(1, hexA(hex, 0));
        c.fillStyle = g; c.fillRect(0, 0, 128, 128);
        return s;
      }
      function makeStarSprite(rgb) {
        const s = document.createElement('canvas'); s.width = s.height = 32;
        const c = s.getContext('2d');
        const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, 'rgba(' + rgb + ',1)');
        g.addColorStop(0.3, 'rgba(' + rgb + ',0.5)');
        g.addColorStop(1, 'rgba(' + rgb + ',0)');
        c.fillStyle = g; c.fillRect(0, 0, 32, 32);
        return s;
      }
      function readTheme() {
        try {
          const name = document.body.dataset.theme || 'midnight';
          const g = GALAXY_THEMES[name];
          if (g) { colA = g.cols[0]; colB = g.cols[1]; colC = g.cols[2]; base = g.base; bright = g.bright; lightMode = false; return; }
          const cs = getComputedStyle(document.body);
          colA = (cs.getPropertyValue('--primary') || '').trim() || colA;
          colB = (cs.getPropertyValue('--cyan') || '').trim() || colB;
          colC = (cs.getPropertyValue('--violet') || '').trim() || colC;
          base = (cs.getPropertyValue('--bg') || '').trim() || base;
          const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(base);
          lightMode = !!m && (parseInt(m[1], 16) * 0.299 + parseInt(m[2], 16) * 0.587 + parseInt(m[3], 16) * 0.114) > 150;
          bright = 1;
        } catch (e) {}
      }
      function seedStars() {
        stars = [];
        const n = Math.round(Math.min(640, Math.max(190, (W * H) / 5200)));
        for (let i = 0; i < n; i++) {
          const d = Math.random();                                   // depth 0..1 (0 = far)
          stars.push({
            a: Math.random() * Math.PI * 2,
            r: Math.pow(Math.random(), 0.55),
            d: d,
            sz: (0.7 + d * 2.0) * (0.8 + Math.random() * 0.7),
            tone: Math.random(),
            tw: Math.random() * Math.PI * 2,
            sp: (0.006 + 0.05 * (1 - d)) * (Math.random() < 0.5 ? -1 : 1)
          });
        }
      }
      function seedNebula() {
        const cols = [colA, colB, colC];
        nebula = [];
        for (let i = 0; i < 6; i++) {
          const col = cols[i % cols.length];
          nebula.push({
            x: Math.random(), y: Math.random(),
            vx: (Math.random() - 0.5) * 0.006, vy: (Math.random() - 0.5) * 0.006,
            rad: 0.34 + Math.random() * 0.44,
            sprite: glowSprite(col, lightMode ? 0.32 : 0.55),
            ph: Math.random() * Math.PI * 2
          });
        }
      }
      // A soft diagonal Milky-Way band with dark dust lanes — the thing that
      // makes it read as a real galaxy rather than a plain starfield.
      function drawMilkyWay() {
        if (lightMode) return;
        ctx.save();
        ctx.translate(W * 0.5, H * 0.5);
        ctx.rotate(-0.42);
        const band = H * 0.72;
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, -band / 2, 0, band / 2);
        g.addColorStop(0.00, hexA(colA, 0));
        g.addColorStop(0.32, hexA(colA, 0.085 * bright));
        g.addColorStop(0.50, hexA(colB, 0.15 * bright));
        g.addColorStop(0.68, hexA(colC, 0.085 * bright));
        g.addColorStop(1.00, hexA(colC, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-W * 1.3, -band / 2, W * 2.6, band);
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < 4; i++) {
          const dy = (i - 1.5) * band * 0.15 + Math.sin(tsec * 0.15 + i) * 6;
          const h = 34 + i * 10;
          const dg = ctx.createLinearGradient(0, dy - h, 0, dy + h);
          dg.addColorStop(0, 'rgba(0,0,0,0)');
          dg.addColorStop(0.5, 'rgba(0,0,0,' + (0.30 * bright).toFixed(3) + ')');
          dg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = dg;
          ctx.fillRect(-W * 1.3, dy - h, W * 2.6, h * 2);
        }
        ctx.restore();
      }
      function isReduced() {
        return (reduceMQ && reduceMQ.matches) || document.body.classList.contains('a11y-reduce');
      }
      function draw(dt) {
        if (dt > 0.1) dt = 0.1;
        tsec += dt;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, W, H);
        drawMilkyWay();

        ctx.globalCompositeOperation = lightMode ? 'source-over' : 'lighter';
        for (const nb of nebula) {
          nb.x += nb.vx * dt; nb.y += nb.vy * dt;
          if (nb.x < -0.3) nb.x = 1.3; else if (nb.x > 1.3) nb.x = -0.3;
          if (nb.y < -0.3) nb.y = 1.3; else if (nb.y > 1.3) nb.y = -0.3;
          const s = nb.rad * Math.max(W, H) * 2.2 * (1 + 0.12 * Math.sin(tsec * 0.4 + nb.ph));
          ctx.globalAlpha = (lightMode ? 0.5 : 0.62) * bright;
          ctx.drawImage(nb.sprite, nb.x * W - s / 2, nb.y * H - s / 2, s, s);
        }
        const spr = lightMode ? starSprDark : starSpr;
        for (const st of stars) {
          st.a += st.sp * dt * 0.5;
          const rr = st.r * Math.hypot(W, H) * 0.56;
          const x = cxp + Math.cos(st.a) * rr;
          const y = cyp + Math.sin(st.a) * rr * 0.62;
          const tw = 0.45 + 0.55 * Math.abs(Math.sin(tsec * 1.6 + st.tw));
          const sz = st.sz * 2.7;
          ctx.globalAlpha = (lightMode ? 0.75 : 1) * bright * tw * (0.42 + 0.78 * st.d);
          const s2 = lightMode ? spr : (st.tone > 0.72 ? starSprWarm : (st.tone < 0.34 ? starSprCool : spr));
          ctx.drawImage(s2, x - sz / 2, y - sz / 2, sz, sz);

        }
        ctx.globalAlpha = 1;
        if (shots.length && !lightMode) {
          for (let i = shots.length - 1; i >= 0; i--) {
            const s = shots[i];
            s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 0.9;
            if (s.life <= 0 || s.x > W + 320 || s.y > H + 320) { shots.splice(i, 1); continue; }
            const tailX = s.x - s.len, tailY = s.y - s.len * (s.vy / s.vx);
            const g = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
            g.addColorStop(0, hexA(colB, 0.9 * s.life));
            g.addColorStop(1, hexA(colB, 0));
            ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tailX, tailY); ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      function spawnShot() {
        shots.push({
          x: Math.random() * W * 0.8, y: Math.random() * H * 0.4,
          vx: 260 + Math.random() * 260, vy: 90 + Math.random() * 120,
          life: 1.0, len: 120 + Math.random() * 160
        });
      }
      function frame(now) {
        raf = requestAnimationFrame(frame);
        if (document.hidden) { last = now; return; }
        if (isReduced()) { stop(); draw(0.001); return; }
        if (!last) last = now;
        const dt = (now - last) / 1000; last = now;
        acc += dt;
        if (acc < 1 / 40) return;        // cap ~40fps to save battery
        const step = acc; acc = 0;
        if (!lightMode && shots.length < 3 && Math.random() < 0.0025) spawnShot();
        draw(step);
      }
      function start() { if (raf || isReduced()) return; last = 0; acc = 0; raf = requestAnimationFrame(frame); }
      function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
      function resize() {
        DPR = Math.min(2, window.devicePixelRatio || 1);
        W = Math.max(1, Math.floor(window.innerWidth));
        H = Math.max(1, Math.floor(window.innerHeight));
        cv.width = Math.floor(W * DPR); cv.height = Math.floor(H * DPR);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        cxp = W * 0.5; cyp = H * 0.52;
        seedStars(); seedNebula();
        draw(0.001);
      }
      function sync() { if (isReduced()) { stop(); draw(0.001); } else start(); }
      _galaxyCtl = { start: start, stop: stop, redraw: () => draw(0.001), canvas: cv };

      readTheme();
      resize();
      if (galaxyEnabled()) { sync(); } else { cv.style.display = 'none'; }

      window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 150); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else sync(); });
      if (reduceMQ && reduceMQ.addEventListener) reduceMQ.addEventListener('change', sync);
      try {
        const mo = new MutationObserver(() => { readTheme(); seedNebula(); sync(); });
        mo.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });
      } catch (e) {}
    }

    // thin reading-progress bar at the very top
    (function scrollProgress() {
      const el = document.getElementById('scroll-progress');
      if (!el) return;
      const update = () => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        el.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + '%';
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    })();

    window.addEventListener('DOMContentLoaded', () => {
      try { restoreNavGroups(); } catch (e) {}
      startSplash();
      initGalaxy();
      initNav();
      restoreStepState();
      try { if (localStorage.getItem('ai_study_quickstart_v20') === '1') { const q = document.getElementById('quickstart-card'); if (q) q.classList.add('hidden'); } } catch (e) {}
      restoreTtsPrefs();
      loadStats();
      loadProgress();
      loadMistakes();
      loadDoubts();
      updateExamCountdown();
      restoreUILang();
      refreshSetsCount();
      updateHomeStatus();
      setTimeout(() => startTour(false), 900);
      // deep link from the PWA manifest shortcuts (?go=quiz / flashcards / mains)
      try {
        const _go = new URLSearchParams(location.search).get('go');
        if (_go) setTimeout(() => { try { navGo(_go); } catch (e) {} }, 900);
      } catch (e) {}
      const remembered = localStorage.getItem('ai_study_remember_key_v7') !== '0';   // default ON: keep the key across restarts
      document.getElementById('remember-key').checked = remembered;
      const vaultOn = localStorage.getItem('ai_study_vault_on_v9') === '1';
      const encCb = document.getElementById('encrypt-keys'); if (encCb) encCb.checked = vaultOn;
      const pbox = document.getElementById('passphrase-box'); if (pbox) pbox.classList.toggle('hidden', !vaultOn);
      (async () => {
        const savedKey = await loadSecret(K_UNIVERSAL, remembered);
        if (savedKey) { document.getElementById('api-key').value = savedKey; autoVerifyAndConfigureAgent(false); }
        const savedFb = await loadSecret(K_FALLBACK, remembered);
        if (savedFb) { document.getElementById('fallback-key').value = savedFb; verifyFallbackAgent(false); }
      })();
      loadSrsFromStorage();
      loadErrorLog();
      restoreTheme();
      restoreA11y();
      setupKeyboardShortcuts();
      initSpeechRecognition();
      initTts();
      syncTtsEngineUI();
      addAriaLabels();
      applyAppVersion();
      accountBoot();
    });



/* ---- data-act dispatcher (Phase 3: replaces inline handlers) ---- */
function _actRun(el, ev, e) {
  var fn = window[el.dataset.act];
  if (typeof fn !== 'function') return;
  var args = [];
  try { args = JSON.parse(el.dataset.args || '[]'); } catch (_) {}
  args = args.map(function (a) {
    if (a === '__THIS__') return el;
    if (a === '__EVENT__') return e;
    if (a === '__VALUE__') return el.value;
    if (a === '__CHECKED__') return el.checked;
    return a;
  });
  try { fn.apply(el, args); } catch (err) { console.error('data-act', el.dataset.act, err); }
}
['click', 'change', 'input'].forEach(function (evName) {
  document.addEventListener(evName, function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el) return;
    var allowed = (el.dataset.ev || 'click').split(',');
    if (allowed.indexOf(evName) === -1) return;
    if (evName === 'click' && el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
    _actRun(el, evName, e);
  }, true);
});
document.addEventListener('keydown', function (e) {
  var el = e.target && e.target.closest ? e.target.closest('[data-keyact]') : null;
  if (!el) return;
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  var fn = window[el.dataset.keyact];
  if (typeof fn !== 'function') return;
  var args = [];
  try { args = JSON.parse(el.dataset.kargs || '[]'); } catch (_) {}
  try { fn.apply(el, args); } catch (err) { console.error('keyact', el.dataset.keyact, err); }
}, true);

/* ---- helpers used by the converted handlers ---- */
function clickById(id) { var e = document.getElementById(id); if (e) e.click(); }
function scrollToEl(id) { var e = document.getElementById(id); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function stopAndSimplify(e) { if (e && e.stopPropagation) e.stopPropagation(); try { simplifyFlashcard(); } catch (_) {} }
function closeTtsBar() { try { ttsStop(); } catch (_) {} var b = document.getElementById('tts-bar'); if (b) b.classList.add('hidden'); }


/* ---- drag & drop dispatcher ---- */
function mainsOcrFileDrop(e) {
  try { var el = e.currentTarget || e.target; if (el && el.classList) el.classList.remove('over'); } catch (_) {}
  try { mainsOcrFile(e.dataTransfer.files[0]); } catch (err) { console.error('mainsOcrFileDrop', err); }
}
['dragover', 'dragleave', 'drop'].forEach(function (evName) {
  document.addEventListener(evName, function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-drag]') : null;
    if (!el) return;
    var mode = el.dataset.drag;
    if (mode === 'over') { e.preventDefault(); el.classList.add('over'); return; }
    if (mode === 'leave') { el.classList.remove('over'); return; }
    if (mode === 'drop') {
      e.preventDefault();
      el.classList.remove('over');
      var fn = window[el.dataset.act];
      if (typeof fn === 'function') {
        try { fn.call(el, e); } catch (err) { console.error('drop', el.dataset.act, err); }
      }
    }
  }, true);
});
