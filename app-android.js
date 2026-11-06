/* =====================================================================
   AI STUDY SUITE PRO — app-android.js
   The mobile app shell: bottom dock, More sheet, quick-settings sheet,
   haptics, screen wake-lock and the Android share-target receiver.

   Loaded after app.js / app-features.js, so every function here is a
   global and can be called from markup through data-act="…".
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Screen metadata: nav id → { title, group, icon, label }
     ------------------------------------------------------------------ */
  var SCREENS = {
    setup:      { t: 'Home',             g: 'main',     i: '🏠', l: 'Home' },
    quiz:       { t: 'Quiz',             g: 'study',    i: '📝', l: 'Quiz' },
    flashcards: { t: 'Flashcards',       g: 'study',    i: '🎴', l: 'Cards' },
    mindmap:    { t: 'Mind Map',         g: 'study',    i: '🗺️', l: 'Mind Map' },
    notes:      { t: 'Cheat Sheet',      g: 'study',    i: '⚡', l: 'Cheat Sheet' },
    results:    { t: 'Results',          g: 'study',    i: '🏆', l: 'Results' },
    mistake:    { t: 'Mistake Notebook', g: 'practice', i: '📕', l: 'Mistakes' },
    adaptive:   { t: 'Adaptive Practice',g: 'practice', i: '🎯', l: 'Adaptive' },
    listen:     { t: 'Listen Mode',      g: 'practice', i: '🎧', l: 'Listen' },
    sprint:     { t: 'Exam-Day Sprint',  g: 'practice', i: '⏱️', l: 'Sprint' },
    mains:      { t: 'Mains Evaluator',  g: 'practice', i: '✍️', l: 'Mains' },
    blurt:      { t: 'Active Recall',    g: 'practice', i: '🧠', l: 'Recall' },
    teach:      { t: 'Teach-Back',       g: 'practice', i: '🎙️', l: 'Teach' },
    progress:   { t: 'Progress',         g: 'insights', i: '📈', l: 'Progress' },
    weakness:   { t: 'Weakness Heatmap', g: 'insights', i: '🔥', l: 'Weakness' },
    visual:     { t: 'Visual Tools',     g: 'insights', i: '📊', l: 'Visuals' },
    doubts:     { t: 'Doubt History',    g: 'insights', i: '💬', l: 'Doubts' },
    sets:       { t: 'My Sets',          g: 'library',  i: '🗃️', l: 'My Sets' },
    library:    { t: 'PDF Library',      g: 'library',  i: '📚', l: 'Library' },
    plan:       { t: 'Revision Plan',    g: 'library',  i: '🗓️', l: 'Plan' },
    interview:  { t: 'Interview Practice', g: 'extras', i: '👥', l: 'Interview' },
    videos:     { t: 'Videos',           g: 'extras',   i: '🎬', l: 'Videos' },
    keys:       { t: 'API Keys',         g: 'extras',   i: '🔑', l: 'API Keys' },
    account:    { t: 'Account',          g: 'extras',   i: '👤', l: 'Account' }
  };

  var GROUPS = [
    { id: 'study',    name: 'Study' },
    { id: 'practice', name: 'Revise & practice' },
    { id: 'insights', name: 'Insights' },
    { id: 'library',  name: 'Library & plan' },
    { id: 'extras',   name: 'More tools' }
  ];

  /* Dock tabs. `more` opens the sheet instead of navigating. */
  var DOCK = [
    { id: 'setup',      i: '🏠', l: 'Home' },
    { id: 'quiz',       i: '📝', l: 'Quiz' },
    { id: 'flashcards', i: '🎴', l: 'Cards' },
    { id: 'plan',       i: '🗓️', l: 'Plan' },
    { id: '__more',     i: '▦',  l: 'More' }
  ];

  var current = 'setup';

  /* ------------------------------------------------------------------
     Haptics — a short tick on taps, silently ignored where unsupported
     ------------------------------------------------------------------ */
  var hapticsOn = true;
  try {
    if (localStorage.getItem('ai_study_haptics_v21') === 'off') hapticsOn = false;
  } catch (e) {}

  function haptic(ms) {
    if (!hapticsOn || !navigator.vibrate) return;
    if (document.body.classList.contains('a11y-reduce')) return;
    try { navigator.vibrate(ms || 8); } catch (e) {}
  }
  window.haptic = haptic;

  window.toggleHaptics = function (on) {
    hapticsOn = !!on;
    try { localStorage.setItem('ai_study_haptics_v21', hapticsOn ? 'on' : 'off'); } catch (e) {}
    if (hapticsOn) haptic(12);
  };

  /* ------------------------------------------------------------------
     Build the dock + the More sheet tiles
     ------------------------------------------------------------------ */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function buildDock() {
    var nav = document.getElementById('bnav');
    if (!nav || nav.dataset.built) return;
    nav.innerHTML = '';
    DOCK.forEach(function (d) {
      var b = el('button', 'bnav-item', '<span class="bnav-ico">' + d.i + '</span><span class="bnav-lbl">' + d.l + '</span>');
      b.type = 'button';
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (d.id === '__more') { window.openMore(); return; }
        window.navGo(d.id);
      });
      if (d.id === '__more') {
        b.dataset.act = 'openMore';
        b.dataset.args = '[]';
        b.setAttribute('aria-label', 'All tools');
      } else {
        b.dataset.act = 'navGo';
        b.dataset.args = JSON.stringify([d.id]);
        b.dataset.bnav = d.id;
        b.setAttribute('aria-label', d.l);
      }
      nav.appendChild(b);
    });
    nav.dataset.built = '1';
  }

  function buildMoreSheet() {
    var body = document.getElementById('more-body');
    if (!body || body.dataset.built) return;
    body.innerHTML = '';

    GROUPS.forEach(function (g) {
      var wrap = el('div', 'more-group');
      wrap.appendChild(el('div', 'more-group-h', g.name));
      var grid = el('div', 'more-grid');
      Object.keys(SCREENS).forEach(function (id) {
        var s = SCREENS[id];
        if (s.g !== g.id) return;
        var tile = el('button', 'more-tile',
          '<span class="more-ico">' + s.i + '</span><span>' + s.l + '</span>');
        tile.type = 'button';
        tile.addEventListener('click', function (ev) { ev.preventDefault(); window.navGo(id); });
        tile.dataset.act = 'navGo';
        tile.dataset.args = JSON.stringify([id]);
        tile.dataset.more = id;
        tile.dataset.search = (s.t + ' ' + s.l + ' ' + id).toLowerCase();
        grid.appendChild(tile);
      });
      wrap.appendChild(grid);
      body.appendChild(wrap);
    });

    body.dataset.built = '1';
  }

  /* ------------------------------------------------------------------
     Sheets
     ------------------------------------------------------------------ */
  var openSheetId = null;

  function openSheet(id) {
    var sheet = document.getElementById(id);
    if (!sheet) return;
    if (openSheetId && openSheetId !== id) closeSheet(openSheetId, true);
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sheet-open');
    openSheetId = id;
    haptic(6);
  }

  function closeSheet(id, silent) {
    var sheet = document.getElementById(id || openSheetId);
    if (!sheet) return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.sheet.open')) {
      document.body.classList.remove('sheet-open');
      openSheetId = null;
    }
    if (!silent) haptic(4);
  }

  window.openMore = function () {
    buildMoreSheet();
    syncNav(current);
    openSheet('more-sheet');
    var f = document.getElementById('more-search');
    if (f) { f.value = ''; filterMore(''); }
  };
  window.closeMore = function () { closeSheet('more-sheet'); };
  window.openTools = function () {
    moveHeaderControls();
    openSheet('tools-sheet');
  };
  window.closeTools = function () { closeSheet('tools-sheet'); };
  window.closeSheets = function () { closeSheet(); };

  /* Search inside the More sheet */
  window.filterMore = function (q) {
    q = String(q || '').trim().toLowerCase();
    var tiles = document.querySelectorAll('#more-body .more-tile');
    var groups = document.querySelectorAll('#more-body .more-group');
    var any = false;
    tiles.forEach(function (t) {
      var hit = !q || (t.dataset.search || '').indexOf(q) !== -1;
      t.classList.toggle('hidden', !hit);
      if (hit) any = true;
    });
    groups.forEach(function (g) {
      var visible = g.querySelectorAll('.more-tile:not(.hidden)').length;
      g.classList.toggle('hidden', visible === 0);
    });
    var empty = document.getElementById('more-empty');
    if (empty) empty.classList.toggle('hidden', any);
  };

  /* ------------------------------------------------------------------
     Move the header's utility controls into the quick-settings sheet.
     The nodes themselves move, so every existing id/handler keeps working.
     ------------------------------------------------------------------ */
  function moveHeaderControls() {
    var map = [
      ['qs-slot-pomodoro', function () { return document.querySelector('.header-controls .pomo-pill'); }],
      ['qs-slot-theme',    function () { return document.querySelector('.header-controls .demo-group:nth-of-type(1) .theme-select'); }],
      ['qs-slot-lang',     function () { return document.getElementById('ui-lang'); }],
      ['qs-slot-install',  function () { return document.getElementById('install-btn'); }],
      ['qs-slot-lock',     function () { return document.getElementById('lock-keys-btn'); }]
    ];
    map.forEach(function (pair) {
      var slot = document.getElementById(pair[0]);
      var node = pair[1]();
      if (!slot || !node || slot.contains(node)) return;
      slot.appendChild(node);
    });
    var pdfPill = document.getElementById('active-pdf-pill');
    var pdfSlot = document.getElementById('qs-slot-pdf');
    if (pdfPill && pdfSlot && !pdfSlot.contains(pdfPill)) pdfSlot.appendChild(pdfPill);
  }

  /* ------------------------------------------------------------------
     Keep dock + sheet + app-bar title in sync with navigation.
     setActiveNav() is the single place the app marks the active screen,
     so we wrap it once and piggyback on it.
     ------------------------------------------------------------------ */
  /* Any navigation closes whatever sheet is open (tapping a tile must not
     leave the sheet covering the screen it just opened). */
  /* Screens that only exist once something has been generated. */
  var NEEDS_CONTENT = {
    quiz: 'Quiz', flashcards: 'Flashcards', mindmap: 'Mind Map',
    notes: 'Cheat Sheet', results: 'Results'
  };

  var _navGo = window.navGo;
  window.navGo = function (id) {
    if (openSheetId) closeSheet(openSheetId, true);
    try {
      if (typeof _navGo === 'function') _navGo(id);
      else if (typeof showNav === 'function') showNav(id);
    } catch (e) { reportUnexpectedError(e.message || String(e)); return; }

    /* The app quietly falls back to Setup when a study screen has nothing in
       it yet. Say so out loud and take the user to the upload box instead of
       leaving them on a screen that looks like nothing happened. */
    var sec = document.getElementById(id + '-section');
    if (NEEDS_CONTENT[id] && sec && sec.classList.contains('hidden')) {
      try {
        showError(NEEDS_CONTENT[id] + ' abhi khaali hai — pehle Step 2 mein PDF ya photo upload karke Generate dabayein.');
      } catch (e) {}
      setTimeout(function () {
        var dz = document.getElementById('drop-zone');
        if (dz) dz.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    }
  };

  var _setActiveNav = window.setActiveNav;

  window.setActiveNav = function (id) {
    try { if (typeof _setActiveNav === 'function') _setActiveNav(id); } catch (e) {}
    if (id) syncNav(id);
  };

  function syncNav(id) {
    current = id || current;
    var meta = SCREENS[current] || { t: 'AI Study Suite' };

    /* Quiz / Cards / Mind Map only exist once something has been generated;
       the app falls back to Setup in that case, so show Home as active
       rather than pretending the empty screen opened. */
    var sec = document.getElementById(current + '-section');
    var available = !sec || !sec.classList.contains('hidden');
    if (!available && current !== 'setup') meta = { t: 'AI Study Suite' };

    document.querySelectorAll('.bnav-item').forEach(function (b) {
      var on = available && b.dataset.bnav === current;
      b.classList.toggle('active', on);
    });
    document.querySelectorAll('.more-tile').forEach(function (t) {
      t.classList.toggle('active', available && t.dataset.more === current);
    });

    var titleEl = document.getElementById('ab-title');
    var subEl = document.getElementById('ab-sub');
    if (titleEl) titleEl.textContent = meta.t === 'Home' ? 'AI Study Suite' : meta.t;
    if (subEl) {
      subEl.textContent = meta.t === 'Home'
        ? 'UPSC • UPPCS • SSC — AI prep engine'
        : 'AI Study Suite PRO';
    }

    try { wakeLockFor(current); } catch (e) {}
  }

  /* ------------------------------------------------------------------
     Screen Wake Lock — keeps the phone awake while quizzing or listening
     ------------------------------------------------------------------ */
  var wakeLock = null;
  var KEEP_AWAKE = ['quiz', 'flashcards', 'sprint', 'listen', 'mains', 'blurt', 'teach'];

  function wakeLockFor(id) {
    if (!('wakeLock' in navigator)) return;
    var want = KEEP_AWAKE.indexOf(id) !== -1;
    if (want && !wakeLock) {
      navigator.wakeLock.request('screen').then(function (l) {
        wakeLock = l;
        l.addEventListener('release', function () { wakeLock = null; });
      }).catch(function () { wakeLock = null; });
    } else if (!want && wakeLock) {
      try { wakeLock.release(); } catch (e) {}
      wakeLock = null;
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && KEEP_AWAKE.indexOf(current) !== -1) {
      wakeLock = null;
      wakeLockFor(current);
    }
  });

  /* ------------------------------------------------------------------
     Global tap feedback + sheet closing
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest(
      '[data-act="navGo"], .bnav-item, .more-tile, .btn-primary, .btn-emerald, .option-btn, .sb-item'
    );
    if (t) haptic(8);
  }, true);

  document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('sheet-scrim')) closeSheet();
    var closer = e.target.closest && e.target.closest('[data-close-sheet]');
    if (closer) closeSheet(closer.dataset.closeSheet || undefined);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openSheetId) closeSheet();
  });

  /* Android hardware back: close an open sheet instead of leaving the app */
  window.addEventListener('popstate', function () {
    if (openSheetId) {
      closeSheet();
      try { history.pushState({ nav: current }, '', '#' + current); } catch (e) {}
      try { navGo(current); } catch (e) {}
    }
  });

  /* Swipe down on a sheet grip to close it */
  (function swipeToClose() {
    var startY = null, sheetEl = null;
    document.addEventListener('touchstart', function (e) {
      var s = e.target.closest && e.target.closest('.sheet');
      if (!s) return;
      if (!(e.target.closest('.sheet-grip') || e.target.closest('.sheet-head'))) return;
      sheetEl = s; startY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (startY == null || !sheetEl) return;
      var dy = e.touches[0].clientY - startY;
      if (dy > 0) sheetEl.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    document.addEventListener('touchend', function () {
      if (startY == null || !sheetEl) return;
      var dy = 0;
      try { dy = parseFloat((sheetEl.style.transform.match(/-?\d+(\.\d+)?/) || [0])[0]) || 0; } catch (e) {}
      sheetEl.style.transform = '';
      if (dy > 90) closeSheet(sheetEl.id);
      sheetEl = null; startY = null;
    }, { passive: true });
  })();

  /* ------------------------------------------------------------------
     Android share-target receiver
     The service worker parks shared files in a cache; we pick them up here.
     ------------------------------------------------------------------ */
  async function consumeSharedFiles() {
    if (!/shared=1/.test(location.search)) return;
    try {
      var cache = await caches.open('ai-study-shared');
      var keys = await cache.keys();
      if (!keys.length) return;
      var files = [];
      for (var i = 0; i < keys.length; i++) {
        var res = await cache.match(keys[i]);
        if (!res) continue;
        var blob = await res.blob();
        var rawName = res.headers.get('x-file-name') || ('shared-' + i);
        var name = rawName;
        try { name = decodeURIComponent(rawName); } catch (e) {}
        var type = res.headers.get('x-file-type') || blob.type || 'application/octet-stream';
        files.push(new File([blob], name, { type: type }));
        await cache.delete(keys[i]);
      }
      if (files.length) {
        try { navGo('setup'); } catch (e) {}
        setTimeout(function () {
          try { routeInputFiles(files); } catch (e) { showError('Shared file khol nahi paya — dobara try karein.'); }
        }, 400);
      }
    } catch (e) { /* no cache support — nothing to do */ }
    finally {
      try { history.replaceState({ nav: current }, '', location.pathname + location.hash); } catch (e) {}
    }
  }

  /* ------------------------------------------------------------------
     Offline chip — the app is offline-first, so say so calmly
     ------------------------------------------------------------------ */
  function updateOnlineState() {
    var off = !navigator.onLine;
    var chip = document.getElementById('offline-chip');
    if (chip) chip.classList.toggle('hidden', !off);
    document.body.classList.toggle('is-offline', off);
  }
  window.addEventListener('online', updateOnlineState);
  window.addEventListener('offline', updateOnlineState);

  /* ------------------------------------------------------------------
     Never fail silently: any uncaught error is shown in the app's banner
     ------------------------------------------------------------------ */
  window.addEventListener('error', function (e) {
    if (!e || !e.message) return;
    try {
      if (typeof showError === 'function') showError('App error: ' + e.message);
    } catch (_) {}
  });
  window.addEventListener('unhandledrejection', function (e) {
    var msg = e && e.reason && (e.reason.message || e.reason);
    if (!msg) return;
    try { if (typeof showError === 'function') showError('App error: ' + msg); } catch (_) {}
  });

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    buildDock();
    buildMoreSheet();
    moveHeaderControls();
    try { syncNav((location.hash || '#setup').slice(1)); } catch (e) {}
    updateOnlineState();
    consumeSharedFiles();

    /* splash: the app is ready, so let the launch screen go a touch earlier */
    setTimeout(function () {
      var sp = document.getElementById('splash');
      if (sp && !sp.classList.contains('hide')) {
        var f = document.getElementById('splash-fill');
        if (f) f.style.width = '100%';
      }
    }, 2600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})();
