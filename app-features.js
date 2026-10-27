
    // ==================== PART 5: READING MODES, TTS PLAYER, EXPORTS ====================
    // Close the accessibility panel on outside click or Escape
    document.addEventListener('click', (e) => {
      const p = document.getElementById('a11y-panel');
      if (!p || p.classList.contains('hidden')) return;
      if (p.contains(e.target)) return;
      const b = document.getElementById('a11y-toggle-btn');
      if (b && b.contains(e.target)) return;
      closeA11yPanel();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeA11yPanel(); });
    // clicking anywhere outside the accessibility panel closes it
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('a11y-panel');
      const btn = document.getElementById('a11y-toggle-btn');
      if (!panel || panel.classList.contains('hidden')) return;
      if (panel.contains(e.target) || (btn && btn.contains(e.target))) return;
      closeA11yPanel();
    });

    // ==================== THEMES ====================
    const THEMES = ['midnight', 'ocean', 'forest', 'sunset', 'rose', 'sepia', 'dark', 'crystal', 'glass', 'jarvis'];
    let themePref = 'midnight';
    function systemTheme() {
      return 'midnight';   // light theme removed — the app is always dark
    }
    function setTheme(name) {
      themePref = name || 'midnight';
      if (themePref !== 'auto' && THEMES.indexOf(themePref) === -1) themePref = 'midnight';
      let applied = (themePref === 'auto') ? systemTheme() : themePref;
      if (THEMES.indexOf(applied) === -1) applied = 'midnight';
      document.body.dataset.theme = applied;
      document.body.classList.toggle('reading-sepia', applied === 'sepia');
      document.body.classList.toggle('reading-dark', applied === 'dark');
      try { localStorage.setItem('ai_study_theme_v9', themePref); } catch (e) {}
      const sel = document.getElementById('theme-select'); if (sel && sel.value !== themePref) sel.value = themePref;
    }
    function restoreTheme() {
      let t = 'midnight';
      try { t = localStorage.getItem('ai_study_theme_v9') || localStorage.getItem('ai_study_theme_v7') || 'midnight'; } catch (e) {}
      if (t === 'auto' || t === 'light') t = 'midnight';   // retired themes
      setTheme(t);
    }

    // ==================== ACCESSIBILITY ====================
    function updateA11yBtn() {
      const p = document.getElementById('a11y-panel');
      const b = document.getElementById('a11y-toggle-btn');
      const open = p && !p.classList.contains('hidden');
      if (b) { b.classList.toggle('active', open); b.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    }
    function toggleA11yPanel() { const p = document.getElementById('a11y-panel'); if (!p) return; p.classList.toggle('hidden'); updateA11yBtn(); }
    function closeA11yPanel() { const p = document.getElementById('a11y-panel'); if (p) p.classList.add('hidden'); updateA11yBtn(); }
    function resetA11y() {
      setA11yFont('md');
      ['dyslexic', 'contrast', 'reduce'].forEach(k => {
        document.body.classList.remove('a11y-' + k);
        const el = document.getElementById('a11y-' + k); if (el) el.checked = false;
        try { localStorage.removeItem('ai_study_a11y_' + k + '_v9'); } catch (e) {}
      });
      toggleGalaxy(true);
      const gEl = document.getElementById('a11y-galaxy'); if (gEl) gEl.checked = true;
    }
    function setA11yFont(size) {
      document.body.classList.remove('a11y-lg', 'a11y-xl');
      if (size === 'lg') document.body.classList.add('a11y-lg');
      if (size === 'xl') document.body.classList.add('a11y-xl');
      document.querySelectorAll('#a11y-panel .a11y-row button').forEach(b => b.classList.toggle('on', b.dataset.fs === size));
      try { localStorage.setItem('ai_study_a11y_font_v9', size); } catch (e) {}
    }
    function toggleA11y(kind, on) {
      document.body.classList.toggle('a11y-' + kind, !!on);
      try { localStorage.setItem('ai_study_a11y_' + kind + '_v9', on ? '1' : '0'); } catch (e) {}
    }
    function restoreA11y() {
      try {
        setA11yFont(localStorage.getItem('ai_study_a11y_font_v9') || 'md');
        ['dyslexic', 'contrast', 'reduce'].forEach(k => {
          const on = localStorage.getItem('ai_study_a11y_' + k + '_v9') === '1';
          document.body.classList.toggle('a11y-' + k, on);
          const el = document.getElementById('a11y-' + k); if (el) el.checked = on;
        });
        const gEl = document.getElementById('a11y-galaxy'); if (gEl) gEl.checked = galaxyEnabled();
      } catch (e) {}
      updateA11yBtn();
    }


    // ---- TTS: Browser (Web Speech) + Gemini TTS (gemini-2.5-flash-preview-tts) ----
    function initTts() { /* speechSynthesis needs no init */ }
    function ttsPickLang(text) {
      if (ttsLangMode !== 'auto') return ttsLangMode;
      return /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN';
    }
    function onTtsEngineChange() {
      const el = document.getElementById('tts-engine');
      ttsEngine = el ? el.value : 'browser';
      saveTtsPrefs();
      syncTtsEngineUI();
    }
    function syncTtsEngineUI() {
      const badge = document.getElementById('tts-engine-badge');
      const isG = ttsEngine === 'gemini';
      if (badge) { badge.innerText = isG ? '✨ Gemini TTS' : '🔈 Browser Voice'; badge.style.color = isG ? '#fde68a' : '#a5b4fc'; }
      const sel = document.getElementById('tts-engine'); if (sel && sel.value !== ttsEngine) sel.value = ttsEngine;
    }
    function saveTtsPrefs() {
      try { localStorage.setItem('ai_study_tts_v9', JSON.stringify({ engine: ttsEngine, voice: geminiTtsVoice, speed: ttsSpeed })); } catch (e) {}
    }
    function restoreTtsPrefs() {
      try {
        const p = JSON.parse(localStorage.getItem('ai_study_tts_v9') || '{}');
        if (p.engine === 'gemini' || p.engine === 'browser') ttsEngine = p.engine;
        if (p.voice) geminiTtsVoice = p.voice;
        if (p.speed) { ttsSpeed = p.speed; const sl = document.getElementById('tts-speed'); if (sl) sl.value = p.speed; const sv = document.getElementById('tts-speed-val'); if (sv) sv.innerText = Number(p.speed).toFixed(2).replace(/0$/, '') + 'x'; }
        const sel = document.getElementById('tts-engine'); if (sel) sel.value = ttsEngine;
        const vs = document.getElementById('gemini-voice'); if (vs && geminiTtsVoice) vs.value = geminiTtsVoice;
      } catch (e) {}
      syncTtsEngineUI();
    }
    function getGeminiTtsKey() {
      const f = document.getElementById('gemini-tts-key');
      let k = f ? f.value.trim() : '';
      if (!k) { const main = document.getElementById('api-key').value.trim(); if (main.startsWith('AIza')) k = main; }
      return k;
    }
    function setTtsStatus(t) { const el = document.getElementById('tts-now'); if (el) el.innerText = t; }
    function setTtsPlayBtn(t) { const p = document.getElementById('tts-play'); if (p) p.innerText = t; }

    // Dispatcher: choose engine
    function ttsSpeak(text) {
      document.getElementById('tts-bar').classList.remove('hidden');
      ttsFullText = text;
      if (ttsEngine === 'gemini') return geminiTtsSpeak(text);
      return browserTtsSpeak(text);
    }
    function browserTtsSpeak(text) {
      if (!('speechSynthesis' in window)) { showError("Is browser mein speech synthesis support nahi hai."); return; }
      ttsStop();
      ttsFullText = text;
      document.getElementById('tts-bar').classList.remove('hidden');
      ttsUtterance = new SpeechSynthesisUtterance(text);
      ttsUtterance.lang = ttsPickLang(text);
      ttsUtterance.rate = ttsSpeed;
      ttsUtterance.onboundary = (e) => { if (typeof e.charIndex === 'number') setTtsStatus(text.slice(e.charIndex, e.charIndex + 70)); };
      ttsUtterance.onend = ttsUtterance.onerror = () => { ttsPlaying = false; setTtsPlayBtn('▶ Play'); };
      window.speechSynthesis.speak(ttsUtterance);
      ttsPlaying = true;
      setTtsPlayBtn('⏸ Pause');
    }

    // ---- Gemini TTS helpers (24kHz mono 16-bit PCM -> WAV) ----
    function base64ToBytes(b64) {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }
    function pcmToWavBlob(pcm, sampleRate = 24000, channels = 1, bits = 16) {
      const dataSize = pcm.length;
      const blockAlign = channels * bits / 8;
      const byteRate = sampleRate * blockAlign;
      const buf = new ArrayBuffer(44 + dataSize);
      const v = new DataView(buf);
      const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      ws(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
      ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
      v.setUint16(22, channels, true); v.setUint32(24, sampleRate, true);
      v.setUint32(28, byteRate, true); v.setUint16(32, blockAlign, true); v.setUint16(34, bits, true);
      ws(36, 'data'); v.setUint32(40, dataSize, true);
      new Uint8Array(buf, 44).set(pcm);
      return new Blob([buf], { type: 'audio/wav' });
    }
    function chunkForTts(text, maxLen = 1200) {
      const clean = String(text || '').replace(/\s+/g, ' ').trim();
      if (!clean) return [];
      const sentences = clean.match(/[^.!?।]+[.!?।]*/g) || [clean];
      const chunks = [];
      let cur = '';
      for (let s of sentences) {
        s = s.trim();
        if (!s) continue;
        if (s.length > maxLen) {
          if (cur.trim()) { chunks.push(cur.trim()); cur = ''; }
          for (let i = 0; i < s.length; i += maxLen) chunks.push(s.slice(i, i + maxLen));
          continue;
        }
        if ((cur ? cur.length + 1 + s.length : s.length) > maxLen && cur) { chunks.push(cur.trim()); cur = ''; }
        cur = cur ? cur + ' ' + s : s;
      }
      if (cur.trim()) chunks.push(cur.trim());
      return chunks;
    }
    // Current Gemini TTS model first, legacy preview as a fallback.
    const TTS_MODELS = ['gemini-3.8-flash-tts', 'gemini-2.5-flash-preview-tts'];
    async function geminiTtsChunk(text, key, withDirective, modelIdx) {
      const idx = modelIdx || 0;
      const url = "https://generativelanguage.googleapis.com/v1beta/models/" + TTS_MODELS[idx] + ":generateContent";
      const spoken = withDirective ? ('Read the following text aloud exactly as written, in a clear natural voice:\n' + text) : text;
      const body = {
        contents: [{ parts: [{ text: spoken }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiTtsVoice } } }
        }
      };
      const res = await fetchWithTimeout(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body) }, GEN_TIMEOUT_MS);
      const data = await res.json();
      if (data.error) {
        // model retired or unavailable → try the next TTS model once
        const msg = data.error.message || "Gemini TTS error";
        if (idx + 1 < TTS_MODELS.length && /not found|not supported|does not exist|invalid|deprecated/i.test(msg)) {
          return geminiTtsChunk(text, key, withDirective, idx + 1);
        }
        throw new Error(msg);
      }
      const part = (data.candidates?.[0]?.content?.parts || []).find(p => p.inlineData && p.inlineData.data);
      if (!part) {
        // Some inputs need an explicit "read this aloud" instruction before the model returns audio.
        if (!withDirective) return geminiTtsChunk(text, key, true);
        throw new Error("Gemini TTS ne audio return nahi kiya (response mein inlineData nahi mila)");
      }
      const pcm = base64ToBytes(part.inlineData.data);
      const m = (part.inlineData.mimeType || "").match(/rate=(\d+)/);
      return pcmToWavBlob(pcm, m ? parseInt(m[1]) : 24000);
    }
    async function geminiTtsSpeak(text) {
      const key = getGeminiTtsKey();
      if (!key) {
        showError("Gemini API key nahi mili — abhi Browser voice se padh rahe hain. Gemini voice ke liye Audio section mein 'Gemini API Key' (AIza...) daalein.");
        ttsEngine = 'browser'; const sel0 = document.getElementById('tts-engine'); if (sel0) sel0.value = 'browser'; syncTtsEngineUI();
        return browserTtsSpeak(text);
      }
      const vsel = document.getElementById('gemini-voice'); if (vsel) geminiTtsVoice = vsel.value;
      ttsStop();
      ttsStopFlag = false;
      document.getElementById('tts-bar').classList.remove('hidden');
      const chunks = chunkForTts(text, 1200);
      if (chunks.length === 0) return;
      ttsChunkBlobs = new Array(chunks.length);
      setTtsPlayBtn('⏳ Loading');
      setTtsStatus(`⏳ Gemini TTS: 0/${chunks.length} chunks...`);

      const prefetch = async (i) => {
        if (i >= chunks.length || ttsStopFlag || ttsChunkBlobs[i] !== undefined) return;
        try { ttsChunkBlobs[i] = await geminiTtsChunk(chunks[i], key); }
        catch (e) { ttsChunkBlobs[i] = { error: e.message || String(e) }; }
      };
      await prefetch(0);

      // If the very first chunk failed, gracefully fall back to the browser voice.
      if (ttsChunkBlobs[0] && ttsChunkBlobs[0].error) {
        showError("Gemini TTS fail hua (" + ttsChunkBlobs[0].error + ") — Browser voice se padh rahe hain.");
        ttsEngine = 'browser'; const sel1 = document.getElementById('tts-engine'); if (sel1) sel1.value = 'browser'; saveTtsPrefs(); syncTtsEngineUI();
        return browserTtsSpeak(text);
      }

      const playNext = (i) => {
        if (ttsStopFlag) return;
        if (i >= chunks.length) { setTtsPlayBtn('▶ Play'); setTtsStatus('✅ Done'); return; }
        const blob = ttsChunkBlobs[i];
        if (!blob) { setTimeout(() => playNext(i), 250); return; }
        if (blob.error) { showError("Gemini TTS error: " + blob.error); setTtsPlayBtn('▶ Play'); return; }
        const url = URL.createObjectURL(blob);
        ttsChunkUrls.push(url);
        if (!ttsAudioEl) ttsAudioEl = new Audio();
        ttsAudioEl.src = url;
        ttsAudioEl.playbackRate = ttsSpeed;
        ttsAudioEl.onended = () => { URL.revokeObjectURL(url); prefetch(i + 2); playNext(i + 1); };
        const pr = ttsAudioEl.play();
        if (pr && pr.catch) pr.catch(() => {
          ttsPlaying = false;
          setTtsPlayBtn('▶ Play');
          setTtsStatus('⚠️ Browser ne autoplay roka — ▶ Play dabayein');
          showError("Audio autoplay block hua. Audio bar mein ▶ Play dabayein (ya page par ek baar tap karein).");
        });
        ttsPlaying = true;
        setTtsPlayBtn('⏸ Pause');
        setTtsStatus(`🔊 ${i + 1}/${chunks.length}: ` + chunks[i].slice(0, 60));
        prefetch(i + 1);
      };
      playNext(0);
    }

    function ttsToggle() {
      const p = document.getElementById('tts-play');
      if (ttsEngine === 'gemini') {
        if (!ttsAudioEl) return;
        if (ttsAudioEl.paused) { const pr2 = ttsAudioEl.play(); if (pr2 && pr2.catch) pr2.catch(() => { setTtsStatus('⚠️ Play block hua — dobara tap karein'); }); ttsPlaying = true; setTtsPlayBtn('⏸ Pause'); }
        else { ttsAudioEl.pause(); ttsPlaying = false; setTtsPlayBtn('▶ Resume'); }
        return;
      }
      if (!('speechSynthesis' in window)) return;
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause(); ttsPlaying = false; p.innerText = '▶ Resume';
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume(); ttsPlaying = true; p.innerText = '⏸ Pause';
      } else if (ttsUtterance) {
        window.speechSynthesis.speak(ttsUtterance); ttsPlaying = true; p.innerText = '⏸ Pause';
      }
    }
    function ttsStop() {
      ttsStopFlag = true;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (ttsAudioEl) { try { ttsAudioEl.pause(); } catch (e) {} ttsAudioEl.onended = null; }
      ttsChunkUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
      ttsChunkUrls = [];
      ttsChunkBlobs = [];
      ttsPlaying = false;
      setTtsPlayBtn('▶ Play');
      setTtsStatus('');
    }
    function ttsSetSpeed(v) {
      ttsSpeed = parseFloat(v) || 1;
      saveTtsPrefs();
      document.getElementById('tts-speed-val').innerText = ttsSpeed.toFixed(2).replace(/0$/, '') + 'x';
      if (ttsAudioEl) ttsAudioEl.playbackRate = ttsSpeed;
      if (ttsUtterance) ttsUtterance.rate = ttsSpeed;
      const wasSpeaking = window.speechSynthesis && window.speechSynthesis.speaking;
      if (ttsEngine === 'browser' && wasSpeaking && ttsFullText) browserTtsSpeak(ttsFullText);
    }
    function ttsCycleLang() {
      const order = ['auto', 'en-IN', 'hi-IN'];
      ttsLangMode = order[(order.indexOf(ttsLangMode) + 1) % order.length];
      document.getElementById('tts-lang-btn').innerText = ttsLangMode === 'auto' ? '🌐 Auto' : (ttsLangMode === 'hi-IN' ? '🇮🇳 हिंदी' : '🇬🇧 EN');
    }
    // ---- NEW: copy to clipboard (v14) ----
    async function copyText(text, label) {
      if (!text || !text.trim()) { showError('Copy karne ke liye pehle content banao.'); return; }
      try {
        await navigator.clipboard.writeText(text);
        showError('\ud83d\udccb ' + label + ' copy ho gaya!');
      } catch (e) {
        try {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); ta.remove();
          showError('\ud83d\udccb ' + label + ' copy ho gaya!');
        } catch (e2) { showError('Copy nahi hua — text manually select karke copy karein.'); }
      }
    }
    function copyCheatSheet() {
      const el = document.getElementById('notes-content');
      copyText(el ? el.innerText : '', 'Cheat sheet');
    }
    function copyMindMap() {
      const el = document.getElementById('mindmap-container');
      copyText(el ? el.innerText : '', 'Mind map');
    }

    function speakNotes() {
      if (!notesData) { showError("Pehle cheat sheet generate karein."); return; }
      const parts = [notesData.title || '', notesData.executiveSummary || ''];
      (notesData.keyConcepts || []).forEach(c => parts.push(`${c.term}: ${c.summary}`));
      (notesData.formulasOrFacts || []).forEach(f => parts.push(f));
      (notesData.mnemonics || []).forEach(m => parts.push(m));
      ttsSpeak(parts.join('. '));
    }
    function speakCurrentFlashcard() {
      const fc = flashcardData[fcIndex];
      if (!fc) return;
      ttsSpeak(`${fc.front}. Answer: ${fc.back}. ${fc.keyTakeaway || ''}`);
    }
    async function speakPdfContent() {
      if (!pdfDocInstance && imageOcrText) { ttsSpeak(imageOcrText.substring(0, 12000)); return; }
      if (!pdfDocInstance) { showError("Pehle PDF ya book ki photo upload karein, phir 'Read Uploaded PDF Aloud' dabayein."); return; }
      let pages = lastSampledPagesList.length ? [...lastSampledPagesList] : [];
      if (pages.length === 0) { const n = Math.min(totalPdfPages, 5); for (let i = 1; i <= n; i++) pages.push(i); }
      const parts = [];
      for (const p of pages.slice(0, 25)) {
        let t = pageTextCache.get(p);
        if (t === undefined) {
          try { const pg = await pdfDocInstance.getPage(p); const tc = await pg.getTextContent(); t = tc.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim(); pageTextCache.set(p, t); pg.cleanup(); } catch (e) { t = ''; }
        }
        if (t && t.length > 40) parts.push(`Page ${p}. ${t}`);
      }
      const text = parts.join(' ').trim();
      if (!text) { showError("PDF mein readable text nahi mila (scanned PDF ho sakti hai)."); return; }
      ttsSpeak(text);
    }

    // ---- Exports: Anki CSV, Flashcards PDF, Cheat-sheet DOCX ----
    function downloadBlob(name, blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    function exportFlashcardsAnki() {
      if (!flashcardData || flashcardData.length === 0) { showError("Pehle flashcards generate karein."); return; }
      const q = (s) => `"${String(s == null ? '' : s).replace(/"/g, '""').replace(/\r?\n/g, '<br>')}"`;
      const lines = ['#separator:Comma', '#html:true', '#columns:Front,Back,Tags'];
      flashcardData.forEach(fc => {
        lines.push([q(fc.front), q((fc.back || '') + (fc.keyTakeaway ? ' | ' + fc.keyTakeaway : '')), q('UPSC_AI ' + (fc.topic || ''))].join(','));
      });
      downloadBlob(`Anki_Flashcards_${Date.now()}.csv`, new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    }
    async function exportFlashcardsPdf() {
      if (!flashcardData || flashcardData.length === 0) { showError("Pehle flashcards generate karein."); return; }
      try { await ensureExportLibs(); } catch (e) { showError('PDF library load nahi hui — internet check karke dobara try karein.'); return; }
      if (!window.jspdf || !window.jspdf.jsPDF) { showError("PDF library load nahi hui — internet check karke page reload karein."); return; }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(15); doc.text("AI Study Suite - Flashcards", 14, 18);
      doc.autoTable({
        startY: 26,
        head: [['Topic', 'Front (Question)', 'Back (Answer)', 'Exam Hook']],
        body: flashcardData.map(fc => [fc.topic || '', fc.front || '', fc.back || '', fc.keyTakeaway || '']),
        theme: 'grid', styles: { fontSize: 8 }
      });
      doc.save(`Flashcards_${Date.now()}.pdf`);
    }
    // Minimal, dependency-free DOCX (OOXML zip) writer
    function crc32(bytes) {
      let c, crc = 0xFFFFFFFF;
      for (let i = 0; i < bytes.length; i++) {
        c = (crc ^ bytes[i]) & 0xFF;
        for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
        crc = (crc >>> 8) ^ c;
      }
      return (crc ^ 0xFFFFFFFF) >>> 0;
    }
    function zipStore(files) {
      const enc = new TextEncoder();
      const chunks = [], central = [];
      let offset = 0;
      const u16 = (n) => [n & 255, (n >> 8) & 255];
      const u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
      for (const f of files) {
        const nameBytes = enc.encode(f.name);
        const data = enc.encode(f.content);
        const crc = crc32(data);
        const local = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0));
        chunks.push(new Uint8Array(local), nameBytes, data);
        central.push({ nameBytes, crc, size: data.length, offset });
        offset += local.length + nameBytes.length + data.length;
      }
      const cdStart = offset;
      for (const c of central) {
        const h = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(c.crc), u32(c.size), u32(c.size), u16(c.nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.offset));
        chunks.push(new Uint8Array(h), c.nameBytes);
        offset += h.length + c.nameBytes.length;
      }
      const cdSize = offset - cdStart;
      const eocd = [].concat(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(cdSize), u32(cdStart), u16(0));
      chunks.push(new Uint8Array(eocd));
      return new Blob(chunks, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }
    function escapeXml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function buildDocxBlob(paragraphs) {
      const body = paragraphs.map(p => {
        const style = p.style ? `<w:pPr><w:pStyle w:val="${p.style}"/></w:pPr>` : '';
        const runs = (p.runs || [{ text: p.text || '', bold: p.bold }]).map(r => `<w:r><w:rPr>${r.bold ? '<w:b/>' : ''}</w:rPr><w:t xml:space="preserve">${escapeXml(r.text)}</w:t></w:r>`).join('');
        return `<w:p>${style}${runs}</w:p>`;
      }).join('');
      const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>`;
      const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
      const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
      return zipStore([
        { name: '[Content_Types].xml', content: ct },
        { name: '_rels/.rels', content: rels },
        { name: 'word/document.xml', content: doc }
      ]);
    }
    function exportNotesDocx() {
      if (!notesData) { showError("Pehle cheat sheet generate karein."); return; }
      const paras = [];
      paras.push({ text: notesData.title || 'Exam Cheat Sheet', bold: true });
      paras.push({ text: '' });
      if (notesData.executiveSummary) paras.push({ text: 'Summary: ' + notesData.executiveSummary });
      paras.push({ text: '' });
      paras.push({ text: 'Key Concepts', bold: true });
      (notesData.keyConcepts || []).forEach(c => paras.push({ text: `${c.term} — ${c.summary}` }));
      paras.push({ text: '' });
      paras.push({ text: 'Facts & Formulas', bold: true });
      (notesData.formulasOrFacts || []).forEach(f => paras.push({ text: '• ' + f }));
      paras.push({ text: '' });
      paras.push({ text: 'Mnemonics', bold: true });
      (notesData.mnemonics || []).forEach(m => paras.push({ text: '• ' + m }));
      downloadBlob(`Exam_Cheat_Sheet_${Date.now()}.docx`, buildDocxBlob(paras));
    }

    // ==================== AUDIO, POMODORO & SHORTCUTS ====================
    function speakText(text) { ttsSpeak(text); }
    function speakCurrentQuestion() {
      const q = quizData[currentIndex];
      if (!q || !Array.isArray(q.options)) return;
      const opts = q.options.map((o, i) => `Option ${String.fromCharCode(65 + i)}: ${o}`).join('. ');
      speakText(`${q.question}. ${opts}`);
    }
    function speakExplanation() { const q = quizData[currentIndex]; if (q) speakText(q.explanation); }

    function togglePomodoro() {
      const btn = document.getElementById('pomo-btn');
      if (pomoRunning) { clearInterval(pomoInterval); pomoRunning = false; btn.innerText = "▶"; }
      else {
        pomoRunning = true; btn.innerText = "⏸";
        pomoInterval = setInterval(() => {
          pomoSeconds--;
          const s = Math.max(0, pomoSeconds);
          document.getElementById('pomo-display').innerText = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
          if (pomoSeconds <= 0) {
            clearInterval(pomoInterval);
            pomoRunning = false;
            playBeep();
            resetPomodoro();
            showError("🍅 Pomodoro complete! Ab 5 minute ka break lein.");
          }
        }, 1000);
      }
    }
    function resetPomodoro() { clearInterval(pomoInterval); pomoRunning = false; pomoSeconds = 25 * 60; document.getElementById('pomo-display').innerText = "25:00"; document.getElementById('pomo-btn').innerText = "▶"; }

    function setupKeyboardShortcuts() {
      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        if (!document.getElementById('quiz-section').classList.contains('hidden')) {
          const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
          const k = e.key.toLowerCase();
          if (k in map && !isQuestionAnswered) {
            const btns = document.getElementById('options-container').children;
            if (btns[map[k]]) selectAnswer(map[k], btns[map[k]]);
          } else if (e.key === 'Enter' && isQuestionAnswered) nextQuestion();
          else if (e.key === 'ArrowRight' && isQuestionAnswered) nextQuestion();
          else if (e.key === 'ArrowLeft') prevQuestion();
          else if (k === 's' && !isQuestionAnswered) skipQuestion();
        }
        if (!document.getElementById('flashcard-section').classList.contains('hidden')) {
          if (e.code === 'Space') { e.preventDefault(); flipFlashcard(); }
          if (e.code === 'ArrowRight') nextFlashcard();
          if (e.code === 'ArrowLeft') prevFlashcard();
        }
      });
    }

    function hideAllSections() {
      clearInterval(timerInterval);
      window.speechSynthesis?.cancel();
      ['setup-section', 'quiz-section', 'flashcard-section', 'mindmap-section', 'notes-section', 'result-section', 'mains-section', 'blurt-section', 'weakness-section', 'visual-section', 'teach-section', 'sets-section', 'library-section', 'plan-section', 'progress-section', 'account-section', 'mistake-section', 'adaptive-section', 'listen-section', 'sprint-section', 'doubts-section', 'videos-section', 'interview-section', 'keys-section'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        document.getElementById(id).classList.add('hidden');
      });
    }

    function resetApp() {
      if (voiceModeActive) toggleVoiceAnswerMode();
      hideAllSections();
      document.getElementById('setup-section').classList.remove('hidden');
      recordNav('setup');
    }

    // Opening Quiz / Flashcards / Mind Map / Cheat Sheet from the sidebar shows
    // what you already generated; only falls back to Setup when there's nothing yet.
    function showExistingStudyMode(id) {
      try {
        if (id === 'quiz' && quizData && quizData.length) {
          hideAllSections();
          document.getElementById('quiz-section').classList.remove('hidden');
          if (!document.getElementById('question-text').innerText) renderQuestion();
          return true;
        }
        if (id === 'flashcards' && flashcardData && flashcardData.length) {
          hideAllSections();
          document.getElementById('flashcard-section').classList.remove('hidden');
          updateSrsCounters(); renderFlashcard();
          return true;
        }
        if (id === 'mindmap' && mindMapData && Array.isArray(mindMapData.branches) && mindMapData.branches.length) { launchMindMap(); return true; }
        if (id === 'notes' && notesData && (notesData.executiveSummary || (notesData.keyConcepts || []).length)) { launchNotes(); return true; }
      } catch (e) {}
      resetApp();
      return false;
    }

    // ---- reusable "Undo" toast for destructive actions ----
    let _undoTimer = null, _undoFn = null;
    function hideUndoToast() {
      const el = document.getElementById('undo-toast');
      if (el) el.classList.add('hidden');
      _undoFn = null;
      clearTimeout(_undoTimer);
    }
    function toastUndo(msg, undoFn, ms) {
      let el = document.getElementById('undo-toast');
      if (!el) { el = document.createElement('div'); el.id = 'undo-toast'; el.className = 'undo-toast'; document.body.appendChild(el); }
      _undoFn = undoFn;
      el.innerHTML = '<span>' + msg + '</span><button class="btn-secondary" id="undo-btn" style="white-space:nowrap;">&#8617; Undo</button>';
      el.classList.remove('hidden');
      const b = document.getElementById('undo-btn');
      if (b) b.onclick = () => { const fn = _undoFn; hideUndoToast(); try { if (fn) fn(); } catch (e) {} showError('\u21a9 Wapas aa gaya.'); };
      clearTimeout(_undoTimer);
      _undoTimer = setTimeout(hideUndoToast, ms || 7000);
    }
    function dismissQuickstart() {
      const q = document.getElementById('quickstart-card');
      if (q) q.classList.add('hidden');
      try { localStorage.setItem('ai_study_quickstart_v20', '1'); } catch (e) {}
    }

    // ==================== HOME STEPS (collapsible) + STATUS ====================
    function toggleStep(n) {
      const sec = document.querySelector('.step[data-step="' + n + '"]');
      if (!sec) return;
      sec.classList.toggle('collapsed');
      const b = sec.querySelector('.step-head');
      if (b) b.setAttribute('aria-expanded', String(!sec.classList.contains('collapsed')));
      saveStepState();
    }
    function setAllSteps(collapsed) {
      document.querySelectorAll('.step').forEach(sec => {
        sec.classList.toggle('collapsed', collapsed);
        const b = sec.querySelector('.step-head');
        if (b) b.setAttribute('aria-expanded', String(!collapsed));
      });
      saveStepState();
    }
    function saveStepState() {
      try {
        const st = {};
        document.querySelectorAll('.step').forEach(sec => st[sec.dataset.step] = sec.classList.contains('collapsed'));
        localStorage.setItem('ai_study_steps_v9', JSON.stringify(st));
      } catch (e) {}
    }
    function restoreStepState() {
      try {
        const st = JSON.parse(localStorage.getItem('ai_study_steps_v9') || '{}');
        document.querySelectorAll('.step').forEach(sec => {
          const c = st[sec.dataset.step] === true;
          sec.classList.toggle('collapsed', c);
          const b = sec.querySelector('.step-head');
          if (b) b.setAttribute('aria-expanded', String(!c));
        });
      } catch (e) {}
    }
    // ==================== SESSION STATS (dashboard) ====================
    let sessionStats = { questions: 0, correct: 0, attempts: 0, streakDays: 0, lastStudy: '' };
    function loadStats() { try { sessionStats = Object.assign(sessionStats, JSON.parse(localStorage.getItem('ai_study_stats_v9') || '{}')); } catch (e) {} }
    function saveStats() { try { localStorage.setItem('ai_study_stats_v9', JSON.stringify(sessionStats)); } catch (e) {} }
    function bumpStats(o) {
      o = o || {};
      sessionStats.questions += (o.questions || 0);
      sessionStats.correct += (o.correct || 0);
      sessionStats.attempts += (o.attempted || 0);
      const today = new Date().toISOString().slice(0, 10);
      if (sessionStats.lastStudy !== today) {
        const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        sessionStats.streakDays = (sessionStats.lastStudy === yest) ? ((sessionStats.streakDays || 0) + 1) : 1;
        sessionStats.lastStudy = today;
      }
      saveStats(); updateHomeStatus();
    }
    function updateHomeStatus() {
      try { refreshDueToday(); } catch (e) {}
      try {
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
        set('hs-source', pdfDocInstance ? (currentPdfName + ' (' + totalPdfPages + 'p)') : (imageOcrText ? (imageSourceNames.length + ' photo(s)') : 'none'));
        set('hs-mode', ({ quiz: 'Quiz', flashcards: 'Flashcards', mindmap: 'Mind Map', notes: 'Cheat Sheet' }[studyMode] || studyMode));
        const b = document.getElementById('agent-status-badge');
        const t = b ? b.innerText.replace(/[^\x00-\x7F]/g, '').trim() : '';
        try { set('hs-engine', (t || 'waiting for key').slice(0, 30)); } catch (e) {}
        set('hs-questions', String(sessionStats.questions || 0));
        set('hs-accuracy', sessionStats.attempts ? (Math.round((sessionStats.correct / sessionStats.attempts) * 100) + '%') : '--');
        set('hs-streak', (sessionStats.streakDays || 0) + ' day');
        const ed = localStorage.getItem('ai_study_exam_date_v10') || '';
        let ex = '--';
        if (ed) { const d = Math.ceil((new Date(ed + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()) / 86400000); ex = d > 0 ? (d + ' din') : (d === 0 ? 'aaj!' : 'past'); }
        set('hs-exam', ex);
        set('hs-sets', String(savedSetsCount || 0));
      } catch (e) {}
    }


    // ==================== INDEXEDDB (PDF library + saved sets) ====================
    let _idb = null;
    function openIDB() {
      return new Promise((resolve, reject) => {
        if (_idb) return resolve(_idb);
        if (!window.indexedDB) return reject(new Error('IndexedDB available nahi hai'));
        const req = indexedDB.open('ai_study_suite_v10', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('pdfs')) db.createObjectStore('pdfs', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('sets')) db.createObjectStore('sets', { keyPath: 'id' });
        };
        req.onsuccess = () => { _idb = req.result; resolve(_idb); };
        req.onerror = () => reject(req.error);
      });
    }
    function isQuotaError(e) {
      return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22);
    }
    function idbPut(store, val) {
      return openIDB().then(db => new Promise((res, rej) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(val);
        tx.oncomplete = () => res(true);
        tx.onerror = () => {
          const e = tx.error;
          if (isQuotaError(e)) { try { showError('Device storage full ho gayi — PDF Library se purani PDFs hataayein, ya "Clear all saved data" karein.'); } catch (x) {} }
          rej(e);
        };
      }));
    }
    function idbAll(store) { return openIDB().then(db => new Promise((res, rej) => { const rq = db.transaction(store, 'readonly').objectStore(store).getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error); })); }
    function idbGet(store, id) { return openIDB().then(db => new Promise((res, rej) => { const rq = db.transaction(store, 'readonly').objectStore(store).get(id); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); })); }
    function idbDel(store, id) { return openIDB().then(db => new Promise((res, rej) => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).delete(id); tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error); })); }
    function bufToB64(buf) {
      const bytes = new Uint8Array(buf); let bin = ''; const CH = 0x8000;
      for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
      return btoa(bin);
    }
    function b64ToBytes(b64) { const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }

    // ---- "Due today": SRS cards due + logged mistakes, surfaced on the dashboard ----
    function dueTodayCounts() {
      const now = Date.now();
      let srsDue = 0, srsTotal = 0;
      try {
        Object.keys(srsStorage || {}).forEach(k => {
          const r = srsStorage[k];
          if (!r) return;
          srsTotal++;
          if (r.dueAt && r.dueAt <= now) srsDue++;
        });
      } catch (e) {}
      const mistakes = (typeof mistakeBank !== 'undefined' && mistakeBank.length) ? mistakeBank.length : 0;
      return { srsDue, srsTotal, mistakes, total: srsDue + mistakes };
    }
    function refreshDueToday() {
      const el = document.getElementById('due-today');
      if (!el) return;
      const c = dueTodayCounts();
      if (c.total === 0) { el.classList.add('hidden'); return; }
      const parts = [];
      if (c.srsDue) parts.push(c.srsDue + ' flashcard due');
      if (c.mistakes) parts.push(c.mistakes + ' galti revise karni hai');
      const sum = document.getElementById('due-summary');
      if (sum) sum.innerText = parts.join(' + ');
      el.classList.remove('hidden');
    }
    function startDueRevision() {
      const c = dueTodayCounts();
      const deckReady = (typeof fullFlashcardDeck !== 'undefined' && fullFlashcardDeck && fullFlashcardDeck.length);
      if (c.srsDue > 0 && deckReady && typeof practiceDueSrsCards === 'function') {
        navGo('flashcards');
        setTimeout(() => { try { practiceDueSrsCards(); } catch (e) {} }, 80);
        return;
      }
      if (c.mistakes > 0) {
        navGo('mistake');
        setTimeout(() => { try { practiceMistakes(); } catch (e) {} }, 80);
        return;
      }
      showError('Revision ke liye pehle PDF se quiz ya flashcards generate karo.');
    }

    // ==================== SAVED QUESTION SETS ====================
    async function saveCurrentSet() {
      if (!quizData || !quizData.length) { showError('Pehle quiz banao, phir set save karein.'); return; }
      const name = prompt('Set ka naam:', (currentPdfName || 'Quiz').slice(0, 40) + ' — ' + new Date().toLocaleDateString());
      if (!name) return;
      try {
        await idbPut('sets', { id: 'set_' + Date.now(), name: name.trim(), count: quizData.length, savedAt: Date.now(), questions: quizData });
        showError('✅ Set save ho gaya: ' + name.trim());
        refreshSetsCount();
      } catch (e) { showError('Set save nahi hua: ' + (e.message || e)); }
    }
    async function openSets() {
      hideAllSections();
      document.getElementById('sets-section').classList.remove('hidden');
      setActiveNav('sets');
      renderSets();
    }
    async function renderSets() {
      const el = document.getElementById('sets-content');
      el.innerHTML = '<div class="section-box">⏳ Sets load ho rahe hain...</div>';
      let sets = [];
      try { sets = await idbAll('sets'); } catch (e) { el.innerHTML = '<div class="section-box">IndexedDB available nahi hai — sets save nahi ho sakte.</div>'; return; }
      if (!sets.length) { el.innerHTML = '<div class="section-box">Abhi koi saved set nahi. Quiz banao aur "💾 Save set" dabayein.</div>'; return; }
      sets.sort((a, b) => b.savedAt - a.savedAt);
      el.innerHTML = sets.map(s => `<div class="panel-row">
          <div><div class="pr-t">${escapeHtml(s.name)}</div><div class="pr-s">${s.count} questions • ${new Date(s.savedAt).toLocaleString()}</div></div>
          <div class="panel-actions">
            <button class="btn-cyan" onclick="loadSet('${s.id}')">▶ Practice</button>
            <button class="btn-secondary" onclick="exportSet('${s.id}')">⬇️ Export</button>
            <button class="btn-secondary" onclick="deleteSet('${s.id}')" style="border-color:var(--rose); color:#fda4af;">🗑️</button>
          </div>
        </div>`).join('');
    }
    async function loadSet(id) {
      try {
        const rec = await idbGet('sets', id);
        if (!rec || !rec.questions) return;
        quizData = dedupeQuestions(rec.questions.map(normalizeQuestion).filter(Boolean));
        currentPdfName = rec.name;
        try { verifySourceQuotes(quizData); } catch (e) {}
        launchQuiz();
      } catch (e) { showError('Set load nahi hua: ' + (e.message || e)); }
    }
    async function deleteSet(id) {
      if (!confirm('Ye set delete karein?')) return;
      let rec = null; try { rec = await idbGet('sets', id); } catch (e) {}
      await idbDel('sets', id); renderSets(); refreshSetsCount();
      if (rec) toastUndo('Set delete ho gaya.', async () => { try { await idbPut('sets', rec); renderSets(); refreshSetsCount(); } catch (e) {} });
    }
    async function exportSet(id) {
      const rec = await idbGet('sets', id);
      if (!rec) return;
      downloadJson({ app: 'AI Study Suite', kind: 'question-set', version: 'v' + APP_VERSION, name: rec.name, count: rec.count, questions: rec.questions }, (rec.name || 'set').replace(/[^a-z0-9]+/gi, '_').slice(0, 40) + '.json');
    }
    function downloadJson(obj, filename) {
      const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
    async function importSetFile(ev) {
      const f = ev.target.files && ev.target.files[0]; ev.target.value = '';
      if (!f) return;
      try {
        const j = JSON.parse(await f.text());
        const raw = j.questions || (Array.isArray(j) ? j : null);
        if (!raw || !raw.length) throw new Error('Is file mein questions nahi mile');
        if (raw.length > 500) throw new Error('Ye file bahut badi hai (max 500 questions).');
        const qs = raw.map(normalizeQuestion).filter(Boolean);
        if (!qs.length) throw new Error('Is file mein valid questions nahi mile.');
        await idbPut('sets', { id: 'set_' + Date.now(), name: sanitizeAI(String(j.name || f.name || 'Imported set')).slice(0, 60), count: qs.length, savedAt: Date.now(), questions: qs });
        showError('✅ Set import ho gaya (' + qs.length + ' questions).');
        refreshSetsCount();
        renderSets();
      } catch (e) { showError('Import fail: ' + (e.message || e)); }
    }

    // ==================== PDF LIBRARY (IndexedDB) ====================
    function openLibrary() {
      hideAllSections();
      document.getElementById('library-section').classList.remove('hidden');
      setActiveNav('library');
      renderLibrary();
    }
    async function addPdfToLibrary(ev) {
      const f = ev.target.files && ev.target.files[0]; ev.target.value = '';
      if (!f) return;
      if (f.size > 80 * 1024 * 1024) { showError('Library mein 80 MB tak ki PDF store kar sakte hain. Itni badi PDF ke liye normal upload use karein.'); return; }
      try {
        const b64 = bufToB64(await f.arrayBuffer());
        await idbPut('pdfs', { id: 'pdf_' + Date.now(), name: f.name, size: f.size, addedAt: Date.now(), data: b64 });
        showError('✅ ' + f.name + ' library mein add ho gayi.');
        renderLibrary();
      } catch (e) { showError('PDF library mein add nahi hui: ' + (e.message || e)); }
    }
    async function renderLibrary() {
      const el = document.getElementById('library-content');
      el.innerHTML = '<div class="section-box">⏳ Library load ho rahi hai...</div>';
      let pdfs = [];
      try { pdfs = await idbAll('pdfs'); } catch (e) { el.innerHTML = '<div class="section-box">IndexedDB available nahi hai.</div>'; return; }
      if (!pdfs.length) { el.innerHTML = '<div class="section-box">Library khaali hai. "➕ Add PDF" se apni books add karein — dobara upload nahi karni padegi.</div>'; return; }
      pdfs.sort((a, b) => b.addedAt - a.addedAt);
      el.innerHTML = pdfs.map(p2 => `<div class="panel-row">
          <div><div class="pr-t">${escapeHtml(p2.name)}</div><div class="pr-s">${(p2.size / (1024 * 1024)).toFixed(2)} MB • added ${new Date(p2.addedAt).toLocaleDateString()}</div></div>
          <div class="panel-actions">
            <button class="btn-cyan" onclick="loadPdfFromLibrary('${p2.id}')">📖 Open</button>
            <button class="btn-secondary" onclick="deletePdfFromLibrary('${p2.id}')" style="border-color:var(--rose); color:#fda4af;">🗑️</button>
          </div>
        </div>`).join('');
    }
    async function loadPdfFromLibrary(id) {
      try {
        const rec = await idbGet('pdfs', id);
        if (!rec) return;
        const bytes = b64ToBytes(rec.data);
        const file = new File([bytes], rec.name, { type: 'application/pdf' });
        resetApp();
        await processPdfFile(file);
      } catch (e) { showError('PDF open nahi hui: ' + (e.message || e)); }
    }
    async function deletePdfFromLibrary(id) {
      if (!confirm('Ye PDF library se delete karein?')) return;
      let rec = null; try { rec = await idbGet('pdfs', id); } catch (e) {}
      await idbDel('pdfs', id); renderLibrary();
      if (rec) toastUndo('PDF library se delete ho gayi.', async () => { try { await idbPut('pdfs', rec); renderLibrary(); } catch (e) {} });
    }

    // ==================== AUTO-FIX UNVERIFIED QUESTIONS ====================
    async function fixUnverifiedQuestions() {
      if (subAgentBusy) return;
      if (!quizData || !quizData.length) { showError('Pehle quiz banao.'); return; }
      const targets = quizData.map((q, i) => ({ q, i })).filter(x => x.q.proofStatus === 'unverified' || x.q.proofStatus === 'partial');
      if (!targets.length) { showError('Koi unverified question nahi mila — sab grounded hain ✅'); return; }
      subAgentBusy = true;
      const btn = document.getElementById('fix-unverified-btn'); const oldT = btn ? btn.innerText : '';
      if (btn) btn.innerText = '⏳ Fixing ' + targets.length + '...';
      try {
        const ctx = getReferenceContext();
        const items = targets.map(t => ({ i: t.i, question: t.q.question, options: t.q.options, sourcePage: t.q.sourcePage, sourceQuote: t.q.sourceQuote }));
        const prompt = 'These MCQs had a "sourceQuote" that was NOT found in the source text, so the answer may be wrong. Re-verify each against the SOURCE and return ONLY valid JSON: {"fixes":[{"i":0,"correctIndex":0,"sourceQuote":"exact sentence copied from the source","explanation":"why this is correct"}]}. If an item is actually fine, return it unchanged.\n\nItems:\n' + JSON.stringify(items) + '\n\nSOURCE:\n' + ctx;
        const r = await callAIJson(prompt);
        const fixes = (r && r.fixes) || [];
        let n = 0;
        fixes.forEach(f => {
          const q = quizData[f.i]; if (!q) return;
          const ci = normalizeIndex(f.correctIndex, q.options); if (ci != null) q.correctIndex = ci;
          if (f.sourceQuote) q.sourceQuote = f.sourceQuote;
          if (f.explanation) q.explanation = f.explanation;
          n++;
        });
        verifySourceQuotes(quizData);
        renderQuestion();
        showError('🔧 ' + n + ' questions fix kiye. Ab ' + proofStats.verified + '/' + proofStats.total + ' verified.');
      } catch (e) { showError('Auto-fix fail: ' + (e.message || e)); }
      finally { subAgentBusy = false; if (btn) btn.innerText = oldT || '🔧 Fix unverified'; }
    }

    // ==================== UI LANGUAGE ====================
    const I18N = {
      hi: { 'step.ai': 'AI इंजन', 'step.source': 'कंटेंट सोर्स', 'step.settings': 'एग्ज़ाम और ऑडियो सेटिंग्स', 'step.generate': 'स्टडी मोड और जनरेट',
            'dash.title': '🏠 डैशबोर्ड', 'dash.source': '📄 सोर्स', 'dash.mode': '🎯 मोड', 'dash.engine': '⚙️ इंजन',
            'dash.questions': '🧠 बने प्रश्न', 'dash.accuracy': '🎯 कुल सटीकता', 'dash.streak': '🔥 स्टडी स्ट्रीक', 'dash.exam': '📅 एग्ज़ाम काउंटडाउन', 'dash.sets': '🗂️ सेव किए सेट', 'btn.generate': 'AI प्रश्न बनाएँ' },
      en: { 'step.ai': 'AI Engine', 'step.source': 'Content Source', 'step.settings': 'Exam & Audio Settings', 'step.generate': 'Study Mode & Generate',
            'dash.title': '🏠 Dashboard', 'dash.source': '📄 Source', 'dash.mode': '🎯 Mode', 'dash.engine': '⚙️ Engine',
            'dash.questions': '🧠 Questions made', 'dash.accuracy': '🎯 Overall accuracy', 'dash.streak': '🔥 Study streak', 'dash.exam': '📅 Exam countdown', 'dash.sets': '🗂️ Saved sets', 'btn.generate': 'Generate Questions' }
    };
    const NAV_I18N = {
      hi: { setup:'सेटअप', quiz:'क्विज़', flashcards:'फ्लैशकार्ड', mindmap:'माइंड मैप', notes:'चीट शीट', mains:'मेन्स', blurt:'ब्लर्टिंग', teach:'टीच-बैक', visual:'विज़ुअल टूल्स', weakness:'कमज़ोरी', results:'रिज़ल्ट', sets:'मेरे सेट', library:'PDF लाइब्रेरी', plan:'रिवीज़न प्लान', progress:'प्रोग्रेस', account:'खाता', mistake:'गलती नोटबुक', adaptive:'अडैप्टिव प्रैक्टिस', listen:'लिसन मोड', sprint:'एग्ज़ाम-डे स्प्रिंट', doubts:'डाउट हिस्ट्री' },
      en: { setup:'Setup', quiz:'Quiz', flashcards:'Flashcards', mindmap:'Mind Map', notes:'Cheat Sheet', mains:'Mains', blurt:'Blurting', teach:'Teach-Back', visual:'Visual Tools', weakness:'Weakness', results:'Results', sets:'My Sets', library:'PDF Library', plan:'Revision Plan', progress:'Progress', account:'Account', mistake:'Mistake Notebook', adaptive:'Adaptive Practice', listen:'Listen Mode', sprint:'Exam-Day Sprint', doubts:'Doubt History' }
    };
    function setUILang(lang) {
      try { localStorage.setItem('ai_study_ui_lang_v10', lang); } catch (e) {}
      applyUILang(lang);
    }
    function applyUILang(lang) {
      const dict = I18N[lang];
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict && dict[key]) el.textContent = dict[key];
        else if (lang === 'hinglish' && el.dataset.orig) el.textContent = el.dataset.orig;
      });
      const nav = NAV_I18N[lang];
      document.querySelectorAll('.sb-item[data-nav]').forEach(b => {
        const ico = b.querySelector('.ico');
        const key = b.getAttribute('data-nav');
        if (nav && nav[key]) {
          const icoTxt = ico ? ico.textContent : '';
          b.textContent = '';
          const sp = document.createElement('span'); sp.className = 'ico'; sp.textContent = icoTxt;
          b.appendChild(sp); b.appendChild(document.createTextNode(' ' + nav[key]));
        }
      });
    }
    function restoreUILang() {
      const l = localStorage.getItem('ai_study_ui_lang_v10') || 'hinglish';
      const sel = document.getElementById('ui-lang'); if (sel) sel.value = l;
      document.querySelectorAll('[data-i18n]').forEach(el => { el.dataset.orig = el.textContent; });
      if (l !== 'hinglish') applyUILang(l);
    }

    // ==================== ONBOARDING TOUR ====================
    const TOUR_STEPS = [
      { t: '👋 Welcome!', d: 'Ye tumhara AI Study Suite hai. 20-second quick tour — ya Skip kar do.', sel: null },
      { t: '1️⃣ API key daalo', d: 'Step 1 mein apni API key paste karo (Gemini / Groq / OpenAI...). AI khud best model chun lega.', sel: '.step[data-step="1"]' },
      { t: '2️⃣ PDF ya photo upload', d: 'Step 2 mein book ki PDF ya uski photo daalo. Usi text se questions, cards aur mind map banenge.', sel: '.step[data-step="2"]' },
      { t: '3️⃣ Generate dabao', d: 'Step 4 mein mode chuno aur Generate dabao. Quiz, flashcards, cheat sheet — sab ready.', sel: '#generate-btn' },
      { t: '🎉 Sidebar se sab kuch', d: 'Left sidebar se My Sets, PDF Library, Progress aur Account mil jayega. All the best!', sel: '.sidebar' }
    ];
    let tourIdx = 0;
    function startTour(force) {
      if (!force && localStorage.getItem('ai_study_tour_done_v10') === '1') return;
      tourIdx = 0; showTourStep();
    }
    function showTourStep() {
      document.querySelectorAll('.tour-pop').forEach(e => e.remove());
      const st = TOUR_STEPS[tourIdx];
      if (!st) { endTour(); return; }
      const pop = document.createElement('div');
      pop.className = 'tour-pop';
      pop.innerHTML = '<h4>' + st.t + '</h4><p>' + st.d + '</p>'
        + '<div class="tour-btns"><button class="btn-secondary" onclick="endTour()">Skip</button>'
        + '<button class="btn-cyan" onclick="tourNext()">' + (tourIdx === TOUR_STEPS.length - 1 ? 'Finish' : 'Next →') + '</button></div>';
      document.body.appendChild(pop);
      let x = window.innerWidth / 2 - 160, y = window.innerHeight / 2 - 80;
      if (st.sel) {
        const el = document.querySelector(st.sel);
        if (el) { const r = el.getBoundingClientRect(); x = Math.min(Math.max(12, r.left), window.innerWidth - 336); y = Math.min(Math.max(12, r.bottom + 10), window.innerHeight - 190); if (r.bottom + 190 > window.innerHeight) y = Math.max(12, r.top - 190); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      }
      pop.style.left = x + 'px'; pop.style.top = y + 'px';
    }
    function tourNext() { tourIdx++; showTourStep(); }
    function endTour() {
      document.querySelectorAll('.tour-pop').forEach(e => e.remove());
      try { localStorage.setItem('ai_study_tour_done_v10', '1'); } catch (e) {}
    }

    // ==================== MOBILE SWIPE GESTURES ====================
    let _swX = 0, _swY = 0;
    document.addEventListener('touchstart', (e) => { const t = e.touches[0]; _swX = t.clientX; _swY = t.clientY; }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const qs = document.getElementById('quiz-section');
      if (!qs || qs.classList.contains('hidden')) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - _swX, dy = t.clientY - _swY;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 60) {
        if (dx < 0) { if (isQuestionAnswered) nextQuestion(); else showError('Pehle answer do ya "Next" dabao.'); }
        else if (currentIndex > 0) { currentIndex--; renderQuestion(); }
      }
    }, { passive: true });

    // ==================== MISTAKE NOTEBOOK ====================
    let mistakeBank = [];
    function loadMistakes() { try { mistakeBank = JSON.parse(localStorage.getItem('ai_study_mistakes_v12') || '[]'); } catch (e) { mistakeBank = []; } }
    function saveMistakes() { try { localStorage.setItem('ai_study_mistakes_v12', JSON.stringify(mistakeBank.slice(-400))); } catch (e) {} }
    function logMistake(q, chosenIndex) {
      try {
        const key = (q.question || '').slice(0, 120);
        if (mistakeBank.some(m => m.key === key)) return;
        mistakeBank.push({ key, question: q.question, options: q.options, correctIndex: q.correctIndex,
          chosenIndex, topic: q.topic || 'General', sourcePage: q.sourcePage, explanation: q.explanation,
          sourceQuote: q.sourceQuote, examTag: q.examTag, ts: Date.now(), reason: null });
        saveMistakes();
      } catch (e) {}
    }
    function openMistakes() {
      hideAllSections();
      document.getElementById('mistake-section').classList.remove('hidden');
      setActiveNav('mistake');
      renderMistakes();
    }
    // ---- mistake reason tagging: turns "I got it wrong" into "WHY I got it wrong" ----
    const MISTAKE_REASONS = [
      { id: 'concept', label: '\ud83d\udcda Concept gap', advice: 'Is topic ka concept dobara padho, phir flashcards banao.' },
      { id: 'silly',   label: '\ud83e\udd26 Silly mistake', advice: 'Aapko aata hai — bas jaldbazi. Har option dhyan se padho.' },
      { id: 'guess',   label: '\ud83c\udfb2 Guessed',       advice: 'Elimination technique practice karo (50:50 hint use karo).' },
      { id: 'time',    label: '\u23f0 Time out',            advice: 'Speed badhao — timed quiz mode me practice karo.' }
    ];
    function setMistakeReason(idx, reason) {
      const m = mistakeBank[idx];
      if (!m) return;
      m.reason = (m.reason === reason) ? null : reason;
      saveMistakes();
      renderMistakes();
    }
    function mistakeReasonInsight() {
      const tagged = mistakeBank.filter(m => m.reason);
      if (tagged.length < 3) return '';
      const counts = {};
      tagged.forEach(m => { counts[m.reason] = (counts[m.reason] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      const meta = MISTAKE_REASONS.find(r => r.id === top[0]);
      if (!meta) return '';
      const pct = Math.round((top[1] / tagged.length) * 100);
      return '<div class="panel-row" style="border-color:rgba(109,111,245,.45); background:rgba(109,111,245,.08);">'
        + '<div class="pr-t">\ud83c\udfaf Insight: ' + pct + '% galtiyan "' + escapeHtml(meta.label.replace(/^[^ ]+ /, '')) + '" hain</div>'
        + '<div class="pr-s">' + escapeHtml(meta.advice) + '</div></div>';
    }

    function renderMistakes() {
      const st = document.getElementById('mistake-stats');
      const list = document.getElementById('mistake-list');
      if (!mistakeBank.length) {
        st.innerHTML = '';
        list.innerHTML = '<div class="section-box">Abhi koi galti record nahi hui. Quiz do — jo bhi galat hoga, wo apne aap yahan aa jayega. 💪</div>';
        return;
      }
      const byTopic = {};
      mistakeBank.forEach(m => { byTopic[m.topic] = (byTopic[m.topic] || 0) + 1; });
      const top = Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 5);
      st.innerHTML = '<div class="section-box"><div class="section-title">&#128202; Summary</div><div class="hs-tiles">'
        + '<div class="hs-tile"><span class="hs-k">Total mistakes</span><span class="hs-v">' + mistakeBank.length + '</span></div>'
        + '<div class="hs-tile"><span class="hs-k">Topics affected</span><span class="hs-v">' + Object.keys(byTopic).length + '</span></div>'
        + '</div>'
        + (top.length ? '<div style="margin-top:12px;">' + top.map(([t, c]) => '<div class="panel-row"><div class="pr-t">' + escapeHtml(t) + '</div><div class="pr-s">' + c + ' galti</div></div>').join('') + '</div>' : '')
        + mistakeReasonInsight()
        + '</div>';
      const total = mistakeBank.length;
      list.innerHTML = '<div class="section-box"><div class="section-title">&#128213; Saari galtiyan (latest first) <span style="font-size:11px; color:var(--muted); font-weight:600;">Galti ka kaaran tag karein &rarr; insight milega</span></div>'
        + mistakeBank.map((m, i) => ({ m, i })).reverse().map(({ m, i }) => {
          const correct = (m.options || [])[m.correctIndex] || '';
          const chosen = (m.options || [])[m.chosenIndex] || '';
          const chips = MISTAKE_REASONS.map(r =>
            '<button class="reason-chip' + (m.reason === r.id ? ' on' : '') + '" onclick="setMistakeReason(' + i + ', \'' + r.id + '\')" title="' + escapeHtml(r.advice) + '">' + r.label + '</button>'
          ).join('');
          return '<div class="mk-item"><div class="mk-q">' + escapeHtml(m.question || '') + '</div>'
            + '<div class="mk-meta"><span class="mk-wrong">&#10007; Tumne chuna: ' + escapeHtml(chosen) + '</span>'
            + '<span class="mk-right">&#10003; Sahi: ' + escapeHtml(correct) + '</span></div>'
            + '<div class="mk-meta" style="margin-top:4px;"><span>&#128204; ' + escapeHtml(m.topic) + '</span><span>&#128196; Pg ' + escapeHtml(String(m.sourcePage || '--')) + '</span></div>'
            + '<div class="reason-row">' + chips + '</div></div>';
        }).join('') + '</div>';
    }
    function practiceMistakes() {
      if (!mistakeBank.length) { showError('Abhi koi mistake save nahi hui.'); return; }
      quizData = mistakeBank.map(m => ({ question: m.question, options: m.options, correctIndex: m.correctIndex,
        explanation: m.explanation, sourcePage: m.sourcePage, topic: m.topic, examTag: m.examTag, sourceQuote: m.sourceQuote }));
      currentPdfName = currentPdfName || 'Mistake Notebook';
      launchQuiz();
    }
    function mistakesToFlashcards() {
      if (!mistakeBank.length) { showError('Abhi koi mistake save nahi hui.'); return; }
      flashcardData = mistakeBank.map(m => ({
        front: m.question, back: ((m.options || [])[m.correctIndex] || '') + (m.explanation ? (' — ' + m.explanation) : ''),
        sourcePage: m.sourcePage, topic: m.topic }));
      fullFlashcardDeck = flashcardData.slice();
      fcIndex = 0; currentIndex = 0;
      setStudyMode('flashcards');
      launchFlashcards();
      showError('🎴 ' + flashcardData.length + ' flashcards mistakes se ban gaye.');
    }
    function exportMistakes() {
      if (!mistakeBank.length) { showError('Export karne ke liye kuch nahi hai.'); return; }
      downloadJson({ app: 'AI Study Suite', kind: 'mistake-notebook', version: 'v' + APP_VERSION, exportedAt: new Date().toISOString(), mistakes: mistakeBank }, 'mistake_notebook.json');
    }
    function clearMistakes() {
      if (!mistakeBank.length) { showError('Mistake notebook already khaali hai.'); return; }
      const snap = mistakeBank.slice();
      mistakeBank = []; saveMistakes(); renderMistakes();
      toastUndo('Mistake notebook clear ho gaya.', () => { mistakeBank = snap; saveMistakes(); renderMistakes(); });
    }

    // ==================== ADAPTIVE PRACTICE ====================
    function adaptiveWeakTopics() {
      // uses the persisted error log (same source as the Weakness Heatmap), so
      // the plan survives a page reload instead of relying on the current session
      const rows = Object.entries(errorLog || {}).map(([t, v]) => {
        const attempts = (v && v.attempts) || 0, wrong = (v && v.wrong) || 0;
        return { t, total: attempts, correct: attempts - wrong };
      }).filter(x => x.total > 0).map(x => ({ ...x, acc: Math.round((x.correct / x.total) * 100) }));
      return rows.sort((a, b) => a.acc - b.acc);
    }
    function openAdaptive() {
      hideAllSections();
      document.getElementById('adaptive-section').classList.remove('hidden');
      setActiveNav('adaptive');
      renderAdaptive();
    }
    function renderAdaptive() {
      const el = document.getElementById('adaptive-content');
      const rows = adaptiveWeakTopics();
      if (!rows.length) {
        el.innerHTML = '<div class="section-box">Abhi data nahi hai. Ek quiz do — phir main tumhari accuracy dekh kar batata hoon ki kahan mehnat chahiye. 📈</div>';
        return;
      }
      const overall = Math.round(rows.reduce((a, b) => a + b.correct, 0) / Math.max(1, rows.reduce((a, b) => a + b.total, 0)) * 100);
      const weak = rows.filter(r => r.acc < 60), mid = rows.filter(r => r.acc >= 60 && r.acc < 80), strong = rows.filter(r => r.acc >= 80);
      let plan = '';
      if (weak.length) plan += '<div class="panel-row"><div class="pr-t">&#128308; ' + weak.length + ' kamzor topics</div><div class="pr-s">Zyaada practice + easy/medium questions</div></div>';
      if (mid.length) plan += '<div class="panel-row"><div class="pr-t">&#128993; ' + mid.length + ' theek-theek topics</div><div class="pr-s">Medium difficulty se practice</div></div>';
      if (strong.length) plan += '<div class="panel-row"><div class="pr-t">&#128994; ' + strong.length + ' strong topics</div><div class="pr-s">Ab hard-level questions ka time</div></div>';
      el.innerHTML = '<div class="section-box"><div class="section-title">&#127919; Tumhara adaptive plan</div>'
        + '<div class="hs-tiles">'
        + '<div class="hs-tile"><span class="hs-k">Overall accuracy</span><span class="hs-v">' + overall + '%</span></div>'
        + '<div class="hs-tile"><span class="hs-k">Topics tracked</span><span class="hs-v">' + rows.length + '</span></div>'
        + '<div class="hs-tile"><span class="hs-k">Next focus</span><span class="hs-v">' + (weak[0] ? escapeHtml(weak[0].t).slice(0, 18) : (mid[0] ? escapeHtml(mid[0].t).slice(0, 18) : 'Hard level')) + '</span></div>'
        + '</div>' + plan + '</div>'
        + '<div class="section-box"><div class="section-title">&#128202; Topic-wise accuracy (weakest first)</div>'
        + rows.slice(0, 12).map(r => '<div class="panel-row"><div class="pr-t">' + escapeHtml(r.t) + '</div><div class="pr-s" style="color:' + (r.acc < 60 ? 'var(--rose)' : r.acc < 80 ? 'var(--amber)' : 'var(--emerald)') + ';">' + r.acc + '% (' + r.correct + '/' + r.total + ')</div></div>').join('')
        + '</div>';
    }
    function runAdaptivePractice() {
      const rows = adaptiveWeakTopics();
      if (!rows.length) { showError('Pehle ek quiz do — phir adaptive practice kaam karegi.'); return; }
      const weak = rows.filter(r => r.acc < 80).slice(0, 3).map(r => r.t);
      const list = (weak.length ? weak : rows.slice(0, 3).map(r => r.t));
      const level = weak.length ? 'Easy aur medium level ke questions rakho, concepts clear karne ke liye.' : 'Ab hard level ke tricky questions rakho.';
      const ft = document.getElementById('focus-topic');
      if (ft) ft.value = 'Sirf in topics par focus karo: ' + list.join(', ') + '. ' + level;
      showError('🎯 Adaptive quiz taiyaar — focus set ho gaya. Ab Generate dabayein.');
      navGo('setup');
      setTimeout(() => { const g = document.getElementById('generate-btn'); if (g) g.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 400);
    }

    // ==================== LISTEN MODE (hands-free audio) ====================
    let listenItems = [], listenIdx = 0, listenPlaying = false, listenRate = 1;
    function listenLoadSource() {
      const src = (document.getElementById('listen-source') || {}).value || 'due';
      const deck = (fullFlashcardDeck && fullFlashcardDeck.length) ? fullFlashcardDeck : (flashcardData || []);
      if (src === 'mistakes') {
        listenItems = mistakeBank.map(m => ({ label: 'Mistake', text: (m.question || '') + '. Sahi jawab: ' + ((m.options || [])[m.correctIndex] || '') + '. ' + (m.explanation || '') }));
      } else if (src === 'all') {
        listenItems = deck.map(fc => ({ label: 'Flashcard', text: (fc.front || '') + '. ' + (fc.back || '') }));
      } else {
        const due = deck.filter(fc => { const r = srsStorage[fc.front]; return !r || (r.dueAt || 0) <= Date.now(); });
        listenItems = (due.length ? due : deck).map(fc => ({ label: 'Due card', text: (fc.front || '') + '. ' + (fc.back || '') }));
      }
      listenIdx = 0; listenRender();
    }
    function openListenMode() {
      hideAllSections();
      document.getElementById('listen-section').classList.remove('hidden');
      setActiveNav('listen');
      listenLoadSource();
    }
    function listenRender() {
      const now = document.getElementById('listen-now');
      const counter = document.getElementById('listen-counter');
      const bar = document.getElementById('listen-bar');
      const status = document.getElementById('listen-status');
      if (!listenItems.length) {
        now.innerHTML = 'Is source mein kuch nahi mila. Pehle flashcards ya quiz banao.';
        counter.innerText = '0 / 0'; bar.style.width = '0%'; if (status) status.innerText = 'Khaali';
        return;
      }
      const it = listenItems[listenIdx];
      now.innerHTML = '<span class="sprint-badge">' + escapeHtml(it.label) + ' ' + (listenIdx + 1) + '/' + listenItems.length + '</span><br>' + escapeHtml(it.text);
      counter.innerText = (listenIdx + 1) + ' / ' + listenItems.length;
      bar.style.width = Math.round(((listenIdx + 1) / listenItems.length) * 100) + '%';
      if (status) status.innerText = listenPlaying ? 'Bol raha hai…' : 'Paused';
    }
    function listenToggle() {
      if (!listenItems.length) listenLoadSource();
      if (!listenItems.length) { showError('Listen karne ke liye pehle content banao.'); return; }
      const btn = document.getElementById('listen-play-btn');
      if (listenPlaying) {
        listenPlaying = false;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (btn) btn.innerHTML = '&#9654; Play';
        listenRender();
      } else {
        listenPlaying = true;
        if (btn) btn.innerHTML = '&#10074;&#10074; Pause';
        listenSpeak();
      }
    }
    function listenSpeak() {
      if (!listenPlaying) return;
      if (!('speechSynthesis' in window)) { showError('Is browser mein speech support nahi hai.'); listenPlaying = false; return; }
      const it = listenItems[listenIdx];
      if (!it) { listenPlaying = false; const b = document.getElementById('listen-play-btn'); if (b) b.innerHTML = '&#9654; Play'; listenRender(); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(it.text);
      u.rate = listenRate; u.lang = (typeof ttsPickLang === 'function') ? ttsPickLang(it.text) : 'en-IN';
      u.onend = () => { if (!listenPlaying) return; if (listenIdx < listenItems.length - 1) { listenIdx++; listenRender(); setTimeout(listenSpeak, 350); } else { listenPlaying = false; const b = document.getElementById('listen-play-btn'); if (b) b.innerHTML = '&#9654; Play'; listenRender(); } };
      u.onerror = () => { listenPlaying = false; listenRender(); };
      listenRender();
      window.speechSynthesis.speak(u);
    }
    function listenNext() { if (!listenItems.length) return; listenIdx = Math.min(listenItems.length - 1, listenIdx + 1); listenRender(); if (listenPlaying) listenSpeak(); }
    function listenPrev() { if (!listenItems.length) return; listenIdx = Math.max(0, listenIdx - 1); listenRender(); if (listenPlaying) listenSpeak(); }
    function listenSetRate(v) { listenRate = Number(v) || 1; const el = document.getElementById('listen-rate-val'); if (el) el.innerText = listenRate.toFixed(1) + 'x'; }

    // ==================== EXAM-DAY SPRINT ====================
    let sprintItems = [], sprintIdx = 0, sprintLeft = 15 * 60, sprintTimer = null, sprintRunning = false;
    function sprintBuild() {
      const items = [];
      const deck = (fullFlashcardDeck && fullFlashcardDeck.length) ? fullFlashcardDeck : (flashcardData || []);
      deck.forEach(fc => { if (fc && fc.front) items.push({ tag: 'Flashcard', text: (fc.front || '') + ' → ' + (fc.back || '') }); });
      mistakeBank.slice(-25).forEach(m => { const c = (m.options || [])[m.correctIndex] || ''; if (c) items.push({ tag: 'Mistake fix', text: (m.question || '') + ' → ' + c }); });
      const weak = adaptiveWeakTopics().filter(r => r.acc < 80).slice(0, 6);
      weak.forEach(r => items.push({ tag: 'Weak topic', text: r.t + ' — accuracy sirf ' + r.acc + '%. Isse ek baar phir revise karo.' }));
      const due = deck.filter(fc => { const r = srsStorage[fc.front]; return r && (r.dueAt || 0) <= Date.now(); });
      if (due.length) items.push({ tag: 'SRS', text: due.length + ' cards aaj revision ke liye due hain — Flashcards kholo.' });
      const notesEl = document.getElementById('notes-content');
      if (notesEl) {
        const txt = (notesEl.innerText || '').split('\n').map(x => x.trim()).filter(x => x.length > 40 && x.length < 260);
        txt.slice(0, 20).forEach(t => items.push({ tag: 'Cheat sheet', text: t }));
      }
      sprintItems = items; sprintIdx = 0; sprintRender();
      return items.length;
    }
    function openSprint() {
      hideAllSections();
      document.getElementById('sprint-section').classList.remove('hidden');
      setActiveNav('sprint');
      if (!sprintItems.length) { const n = sprintBuild(); if (!n) document.getElementById('sprint-card').innerHTML = '<span class="sprint-badge">Khaali</span><br>Abhi koi saved material nahi hai. Pehle flashcards, quiz ya cheat sheet banao — phir sprint kaam karega.'; }
    }
    function sprintRender() {
      const card = document.getElementById('sprint-card');
      const prog = document.getElementById('sprint-progress');
      const bar = document.getElementById('sprint-bar');
      if (!sprintItems.length) return;
      const it = sprintItems[sprintIdx];
      card.innerHTML = '<span class="sprint-badge">' + escapeHtml(it.tag) + '</span><br>' + escapeHtml(it.text);
      prog.innerText = (sprintIdx + 1) + ' / ' + sprintItems.length + ' points';
      bar.style.width = Math.round(((sprintIdx + 1) / sprintItems.length) * 100) + '%';
    }
    function sprintToggle() {
      const btn = document.getElementById('sprint-start-btn');
      if (sprintRunning) { sprintRunning = false; clearInterval(sprintTimer); if (btn) btn.innerHTML = '&#9654; Sprint shuru karo'; return; }
      if (!sprintItems.length) sprintBuild();
      if (!sprintItems.length) { showError('Sprint ke liye pehle content banao.'); return; }
      sprintRunning = true; sprintLeft = 15 * 60;
      if (btn) btn.innerHTML = '&#10074;&#10074; Roko';
      sprintTick();
      sprintTimer = setInterval(sprintTick, 1000);
    }
    function sprintTick() {
      const el = document.getElementById('sprint-timer');
      if (!sprintRunning) return;
      sprintLeft--;
      const m = Math.floor(Math.max(0, sprintLeft) / 60), sec = Math.max(0, sprintLeft) % 60;
      if (el) el.innerText = m + ':' + String(sec).padStart(2, '0');
      if (sprintLeft <= 0) { sprintRunning = false; clearInterval(sprintTimer); if (el) el.innerText = '00:00'; showError('⏱️ Sprint khatam! Achha kiya. Ab break lo.'); const b = document.getElementById('sprint-start-btn'); if (b) b.innerHTML = '&#9654; Sprint shuru karo'; }
    }
    function sprintNext() { if (!sprintItems.length) return; sprintIdx = Math.min(sprintItems.length - 1, sprintIdx + 1); sprintRender(); }
    function sprintPrev() { if (!sprintItems.length) return; sprintIdx = Math.max(0, sprintIdx - 1); sprintRender(); }

    // ==================== DOUBT HISTORY ====================
    let doubtHistory = [];
    function loadDoubts() { try { doubtHistory = JSON.parse(localStorage.getItem('ai_study_doubts_v12') || '[]'); } catch (e) { doubtHistory = []; } }
    function saveDoubts() { try { localStorage.setItem('ai_study_doubts_v12', JSON.stringify(doubtHistory.slice(-200))); } catch (e) {} }
    function logDoubt(q, a, meta) {
      try { doubtHistory.push({ q, a, topic: (meta && meta.topic) || '', page: (meta && meta.page) || '', ts: Date.now() }); saveDoubts(); } catch (e) {}
    }
    function openDoubtHistory() {
      hideAllSections();
      document.getElementById('doubts-section').classList.remove('hidden');
      setActiveNav('doubts');
      renderDoubts();
    }
    function renderDoubts() {
      const el = document.getElementById('doubts-content');
      if (!doubtHistory.length) {
        el.innerHTML = '<div class="section-box">Abhi koi doubt save nahi hua. Quiz ke dauraan <b>&#128172; Ask PDF Doubt</b> use karo — sab yahan jama ho jayenge.</div>';
        return;
      }
      el.innerHTML = '<div class="section-box"><div class="section-title">&#128172; ' + doubtHistory.length + ' saved doubts (latest first)</div>'
        + doubtHistory.slice().reverse().map(d => '<div class="doubt-item"><div class="doubt-q">&#10067; ' + escapeHtml(d.q) + '</div>'
          + '<div class="doubt-a">' + escapeHtml(d.a) + '</div>'
          + '<div class="mk-meta" style="margin-top:6px;">' + (d.topic ? '<span>&#128204; ' + escapeHtml(d.topic) + '</span>' : '') + (d.page ? '<span>&#128196; Pg ' + escapeHtml(String(d.page)) + '</span>' : '') + '<span>' + new Date(d.ts).toLocaleDateString('en-IN') + '</span></div></div>').join('')
        + '</div>';
    }
    function exportDoubts() {
      if (!doubtHistory.length) { showError('Export karne ke liye kuch nahi hai.'); return; }
      downloadJson({ app: 'AI Study Suite', kind: 'doubt-history', version: 'v' + APP_VERSION, exportedAt: new Date().toISOString(), doubts: doubtHistory }, 'doubt_history.json');
    }
    function clearDoubts() {
      if (!doubtHistory.length) { showError('Doubt history already khaali hai.'); return; }
      const snap = doubtHistory.slice();
      doubtHistory = []; saveDoubts(); renderDoubts();
      toastUndo('Doubt history clear ho gayi.', () => { doubtHistory = snap; saveDoubts(); renderDoubts(); });
    }

    // ==================== PROGRESS HISTORY ====================
    let savedSetsCount = 0;
    async function refreshSetsCount() { try { savedSetsCount = (await idbAll('sets')).length; updateHomeStatus(); } catch (e) {} }
    let progressHistory = [];
    function loadProgress() { try { progressHistory = JSON.parse(localStorage.getItem('ai_study_progress_v10') || '[]'); } catch (e) { progressHistory = []; } }
    function saveProgress() { try { localStorage.setItem('ai_study_progress_v10', JSON.stringify(progressHistory.slice(-300))); } catch (e) {} }
    function logProgress(total, score, mode) { try { progressHistory.push({ d: new Date().toISOString().slice(0, 10), t: Date.now(), total, score, mode }); saveProgress(); } catch (e) {} }
    function openProgress() {
      hideAllSections();
      document.getElementById('progress-section').classList.remove('hidden');
      setActiveNav('progress');
      renderProgress();
    }
    function renderProgress() {
      const el = document.getElementById('progress-content');
      const h = progressHistory || [];
      if (!h.length) { el.innerHTML = '<div class="section-box">Abhi koi attempt nahi. Quiz attempt karne ke baad yahan trend dikhega.</div>'; return; }
      const last14 = h.slice(-14);
      const maxT = Math.max(1, ...last14.map(x => x.total));
      const bars = last14.map(x => {
        const pct = Math.round((x.score / Math.max(1, x.total)) * 100);
        const hp = Math.max(6, Math.round((x.score / maxT) * 100));
        return '<div class="bar" style="height:' + hp + '%" title="' + x.d + ': ' + x.score + '/' + x.total + ' (' + pct + '%)"></div>';
      }).join('');
      const totalQ = h.reduce((a, b) => a + b.total, 0), totalC = h.reduce((a, b) => a + b.score, 0);
      const acc = totalQ ? Math.round((totalC / totalQ) * 100) : 0;
      const best = h.reduce((m, x) => Math.max(m, Math.round((x.score / Math.max(1, x.total)) * 100)), 0);
      const days = [];
      for (let i = 27; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); days.push({ d, c: h.filter(x => x.d === d).length }); }
      const heat = days.map(x => '<div class="heat-day ' + (x.c >= 5 ? 'on3' : x.c >= 3 ? 'on2' : x.c >= 1 ? 'on1' : '') + '" title="' + x.d + ': ' + x.c + ' attempt"></div>').join('');
      el.innerHTML = '<div class="section-box"><div class="section-title">&#128200; Accuracy Trend (last 14 attempts)</div><div class="spark">' + bars + '</div></div>'
        + '<div class="section-box"><div class="section-title">&#128197; Activity (last 4 weeks)</div><div class="heat-grid">' + heat + '</div></div>'
        + '<div class="section-box"><div class="hs-tiles">'
        + '<div class="hs-tile"><span class="hs-k">Total attempts</span><span class="hs-v">' + h.length + '</span></div>'
        + '<div class="hs-tile"><span class="hs-k">Questions attempted</span><span class="hs-v">' + totalQ + '</span></div>'
        + '<div class="hs-tile"><span class="hs-k">Overall accuracy</span><span class="hs-v">' + acc + '%</span></div>'
        + '<div class="hs-tile"><span class="hs-k">Best attempt</span><span class="hs-v">' + best + '%</span></div>'
        + '</div></div>';
    }
    function clearProgressHistory() { if (!confirm('Progress history clear karein?')) return; progressHistory = []; saveProgress(); renderProgress(); }

    // ==================== EXAM COUNTDOWN + DAILY PLAN ====================
    function saveExamDate() {
      const v = document.getElementById('exam-date').value;
      try { localStorage.setItem('ai_study_exam_date_v10', v); } catch (e) {}
      updateExamCountdown();
    }
    function updateExamCountdown() {
      const el = document.getElementById('exam-countdown');
      const v = (document.getElementById('exam-date') || {}).value || (localStorage.getItem('ai_study_exam_date_v10') || '');
      if (!el) return;
      if (!v) { el.innerText = '--'; return; }
      const days = Math.ceil((new Date(v + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
      el.innerText = days > 0 ? ('&#128197; ' + days + ' din baaki') : (days === 0 ? '&#128293; Aaj exam hai!' : ('Exam ' + (-days) + ' din pehle tha'));
      el.innerHTML = el.innerText;
    }
    function openPlan() {
      hideAllSections();
      document.getElementById('plan-section').classList.remove('hidden');
      setActiveNav('plan');
      const v = localStorage.getItem('ai_study_exam_date_v10') || '';
      const el = document.getElementById('exam-date'); if (el) el.value = v;
      updateExamCountdown();
      buildDailyPlan();
    }
    function buildDailyPlan() {
      const out = document.getElementById('plan-content');
      let due = 0;
      // SRS records store the next-review time in `dueAt` (older code read a
      // non-existent `.due`, so this always showed 0).
      try { due = Object.keys(srsStorage || {}).filter(k => ((srsStorage[k] || {}).dueAt || 0) <= Date.now()).length; } catch (e) {}
      // Weakness comes from the persisted error log (same source as the
      // Weakness Heatmap), not the per-session topicStats.
      const weak = Object.entries(errorLog || {}).map(([t, v]) => ({ t, wrong: (v && v.wrong) || 0, total: (v && v.attempts) || 0 }))
        .filter(x => x.total > 0).sort((a, b) => (b.wrong / Math.max(1, b.total)) - (a.wrong / Math.max(1, a.total))).slice(0, 6);
      const streak = (typeof sessionStats !== 'undefined' && sessionStats.streakDays) || 0;
      const v = localStorage.getItem('ai_study_exam_date_v10') || '';
      let examTxt = 'set nahi';
      if (v) { const days = Math.ceil((new Date(v + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()) / 86400000); examTxt = days > 0 ? (days + ' din') : (days === 0 ? 'aaj' : 'past'); }
      out.innerHTML = '<div class="section-box"><div class="section-title">&#9889; Aaj ka plan</div>'
        + '<div class="hs-tiles">'
        + '<div class="hs-tile"><span class="hs-k">Due SRS cards</span><span class="hs-v">' + due + '</span></div>'
        + '<div class="hs-tile"><span class="hs-k">Weak topics</span><span class="hs-v">' + weak.length + '</span></div>'
        + '<div class="hs-tile"><span class="hs-k">Streak</span><span class="hs-v">' + streak + ' day</span></div>'
        + '<div class="hs-tile"><span class="hs-k">Exam</span><span class="hs-v">' + examTxt + '</span></div>'
        + '</div>'
        + '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">'
        + '<button class="btn-cyan" onclick="navGo(\'flashcards\')">&#9200; Revise due cards (' + due + ')</button>'
        + '<button class="btn-secondary" onclick="openWeaknessReport()">&#128202; Weak topics</button>'
        + '<button class="btn-secondary" onclick="navGo(\'quiz\')">&#128221; New quiz</button>'
        + '</div></div>'
        + (weak.length ? ('<div class="section-box"><div class="section-title">&#128315; Sabse kamzor topics</div>'
            + weak.map(w => '<div class="panel-row"><div class="pr-t">' + escapeHtml(w.t) + '</div><div class="pr-s">' + w.wrong + '/' + w.total + ' galat</div></div>').join('') + '</div>') : '');
    }

    // ==================== SEARCH INSIDE PDF ====================
    async function searchPdfText() {
      const q = (document.getElementById('pdf-search').value || '').trim();
      const res = document.getElementById('pdf-search-results');
      if (!q) { res.innerHTML = ''; return; }
      if (!pdfDocInstance) { res.innerHTML = '<span style="color:var(--amber); font-size:12px;">Pehle PDF upload karein.</span>'; return; }
      res.innerHTML = '<span style="font-size:12px; color:var(--muted);">Searching...</span>';
      const ql = q.toLowerCase();
      const hits = [];
      const limit = Math.min(pdfDocInstance.numPages, 150);
      for (let i = 1; i <= limit && hits.length < 20; i++) {
        try {
          let t = pageTextCache.get(i);
          if (t === undefined) {
            const pg = await pdfDocInstance.getPage(i);
            const tc = await pg.getTextContent();
            t = tc.items.map(x => x.str).join(' ').replace(/\s+/g, ' ').trim();
            pageTextCache.set(i, t);
            pg.cleanup();
          }
          const idx = (t || '').toLowerCase().indexOf(ql);
          if (idx >= 0) hits.push({ p: i, snip: t.slice(Math.max(0, idx - 40), idx + 80) });
        } catch (e) {}
      }
      if (!hits.length) { res.innerHTML = '<span style="font-size:12px; color:var(--muted);">Koi match nahi mila (pehle ' + limit + ' pages mein).</span>'; return; }
      res.innerHTML = hits.map(h => '<div class="panel-row" style="padding:8px 10px;"><div><div class="pr-t" style="font-size:12.5px;">Page ' + h.p + '</div><div class="pr-s">…' + escapeHtml(h.snip) + '…</div></div>'
        + '<button class="btn-secondary" onclick="jumpToPage(' + h.p + ')" style="white-space:nowrap;">Go</button></div>').join('');
    }
    function jumpToPage(pg) {
      const ps = document.getElementById('page-start'), pe = document.getElementById('page-end');
      if (ps) ps.value = pg;
      if (pe) pe.value = Math.min(pdfDocInstance ? pdfDocInstance.numPages : pg + 9, pg + 9);
      const cm = document.getElementById('coverage-mode'); if (cm) cm.value = 'custom_range';
      if (typeof toggleCoverageInputs === 'function') toggleCoverageInputs();
      showError('✅ Page ' + pg + ' set ho gaya — ab Generate dabayein.');
      document.getElementById('generate-btn').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ==================== YOUTUBE VIDEOS ====================
    // The channel's uploads playlist (channel UC-... -> uploads UU-...). Playing
    // here counts as a normal YouTube view; the playlist always starts with the
    // latest upload, so new videos appear automatically with no updates needed.
    // Each card opens YouTube directly (no embed), so playback always works and
    // every watch counts on the channel. Separate Subscribe button per channel.
    const YT_CHANNELS = [
      { name: 'Me With Cariad', handle: '@mewithcariad',
        watch: 'https://www.youtube.com/@mewithcariad/videos',
        sub: 'https://www.youtube.com/@mewithcariad?sub_confirmation=1',
        img: 'https://i.ytimg.com/vi/EUgP1Ta1XJc/hqdefault.jpg' }
    ];
    function renderYtChannels() {
      const box = document.getElementById('yt-channels');
      if (!box || box.dataset.done) return;
      box.innerHTML = YT_CHANNELS.map((c, i) => {
        const n = escapeHtml(c.name), h = escapeHtml(c.handle);
        return '<div class="yt-card">' +
          '<a class="yt-thumb" href="' + c.watch + '" target="_blank" rel="noopener noreferrer" aria-label="Watch ' + n + ' on YouTube">' +
            '<img src="' + c.img + '" alt="' + n + '" loading="lazy">' +
            '<span class="yt-play" aria-hidden="true">&#9654;&#65039;</span>' +
            '<span class="yt-badge">YouTube</span>' +
          '</a>' +
          '<div class="yt-meta"><div class="yt-name">&#127916; ' + n + '</div><div class="yt-handle">' + h + '</div></div>' +
          '<div class="yt-actions">' +
            '<a class="yt-watch" href="' + c.watch + '" target="_blank" rel="noopener noreferrer">&#9654; Watch</a>' +
            '<a class="yt-sub" href="' + c.sub + '" target="_blank" rel="noopener noreferrer">&#128276; Subscribe</a>' +
            '<button class="yt-share" onclick="shareChannel(' + i + ')" aria-label="Share ' + n + '">&#128228; Share</button>' +
          '</div></div>';
      }).join('');
      box.dataset.done = '1';
    }
    // Share the app — native share sheet where available, else copy the link.
    async function shareApp() {
      const url = 'https://himanshu737936.github.io/ai-study-suite/';
      const text = 'AI Study Suite PRO — PDF ya book ki photo se AI quiz, flashcards, mind map aur cheat sheet (UPSC / UPPCS / SSC).';
      try {
        if (navigator.share) { await navigator.share({ title: 'AI Study Suite PRO', text: text, url: url }); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(url); showError('✅ Link copy ho gaya — kisi ko bhi bhej do!'); }
      catch (e) { window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener'); }
    }

    async function shareChannel(i) {
      const c = YT_CHANNELS[i]; if (!c) return;
      const text = c.name + ' — YouTube channel';
      try { if (navigator.share) { await navigator.share({ title: c.name, text: text, url: c.watch }); return; } }
      catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(c.watch); showError('✅ ' + c.name + ' ka link copy ho gaya!'); }
      catch (e) { window.open(c.watch, '_blank', 'noopener'); }
    }
    // ==================== BACKUP / RESTORE (no cloud, no third party) ====================
    function exportBackup() {
      try {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.indexOf('ai_study_') === 0) data[k] = localStorage.getItem(k);
        }
        const payload = { app: 'AI Study Suite PRO', exported: new Date().toISOString(), keys: Object.keys(data).length, data: data };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-study-suite-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        showError('✅ Backup export ho gaya — ' + payload.keys + ' items.');
      } catch (e) { showError('❌ Export fail: ' + ((e && e.message) || e)); }
    }
    async function importBackup(input) {
      const f = input.files && input.files[0];
      if (!f) return;
      try {
        const txt = await f.text();
        const p = JSON.parse(txt);
        const data = p && p.data ? p.data : p;
        if (!data || typeof data !== 'object') throw new Error('invalid backup file');
        let n = 0;
        for (const k of Object.keys(data)) {
          if (k.indexOf('ai_study_') !== 0) continue;
          const v = data[k];
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          n++;
        }
        showError('✅ ' + n + ' items restore ho gaye — page reload ho raha hai…');
        setTimeout(() => location.reload(), 1200);
      } catch (e) {
        showError('❌ Restore fail: file sahi backup JSON nahi hai.');
      } finally { input.value = ''; }
    }

    function openVideos() {
      hideAllSections();
      document.getElementById('videos-section').classList.remove('hidden');
      setActiveNav('videos');
      renderYtChannels();
    }

    // ==================== ACCOUNT (LOCAL / ON-DEVICE) ====================
    // A "temporary" local account: created and verified entirely in the browser.
    // No server, no internet, no email — the account lives in localStorage and
    // the password is stored only as a salted PBKDF2 hash. Login is OPTIONAL;
    // every study feature works without an account.
    const ACCT_KEY = 'ai_study_local_account_v20';
    const ACCT_SESSION_KEY = 'ai_study_local_session_v20';
    let _acctUser = null;   // { name } while signed in

    function localAccount() {
      try {
        const j = JSON.parse(localStorage.getItem(ACCT_KEY) || 'null');
        return (j && j.name && j.hash && j.salt) ? j : null;
      } catch (e) { return null; }
    }
    function acctStatus(msg, color) {
      const el = document.getElementById('acct-status');
      if (!el) return;
      el.innerHTML = msg || '';
      el.style.color = color || 'var(--text-muted)';
    }
    function _randSaltB64() {
      const a = new Uint8Array(16);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
      else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
      return bufToB64(a);
    }
    // Salted password hash. PBKDF2-SHA256 (150k) when Web Crypto is available;
    // a clearly-weaker salted hash otherwise (e.g. file:// in some browsers).
    async function hashPassword(password, saltB64, iterations, algo) {
      if (algo !== 'fallback' && cryptoAvailable()) {
        const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: _ub64(saltB64), iterations: iterations || 150000, hash: 'SHA-256' }, km, 256);
        return bufToB64(new Uint8Array(bits));
      }
      let h1 = 0x811c9dc5, h2 = 0x1000193;
      const s = saltB64 + '\u0000' + password;
      for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        h1 = ((h1 ^ c) * 16777619) >>> 0;
        h2 = ((h2 + c * 2654435761) ^ (h2 << 5)) >>> 0;
      }
      return 'fb$' + h1.toString(16) + h2.toString(16);
    }
    async function acctCreate() {
      const name = (document.getElementById('acct-name').value || '').trim();
      const p1 = document.getElementById('acct-pass').value || '';
      const p2 = document.getElementById('acct-pass2').value || '';
      if (name.length < 2) { acctStatus('Naam kam se kam 2 characters ka ho.', '#fda4af'); return; }
      if (p1.length < 4) { acctStatus('Password kam se kam 4 characters ka ho.', '#fda4af'); return; }
      if (p1 !== p2) { acctStatus('Dono password match nahi kar rahe.', '#fda4af'); return; }
      if (localAccount()) { acctStatus('Is device par pehle se ek account hai — pehle usse delete karein.', '#fde68a'); return; }
      const btn = document.getElementById('acct-create-btn'); const old = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = '&#9203; Bana rahe hain...'; }
      try {
        const salt = _randSaltB64();
        const algo = cryptoAvailable() ? 'pbkdf2' : 'fallback';
        const iter = 150000;
        const hash = await hashPassword(p1, salt, iter, algo);
        localStorage.setItem(ACCT_KEY, JSON.stringify({ name, salt, hash, algo, iter, createdAt: Date.now() }));
        _acctUser = { name };
        try { localStorage.setItem(ACCT_SESSION_KEY, name); } catch (e) {}
        document.getElementById('acct-pass').value = ''; document.getElementById('acct-pass2').value = '';
        acctStatus('');
        renderAccount();
        showError('✅ Account ban gaya — welcome, ' + escapeHtml(name) + '!');
      } catch (e) {
        acctStatus('Account nahi ban paya: ' + (e.message || e), '#fda4af');
      } finally { if (btn) { btn.disabled = false; btn.innerHTML = old; } }
    }
    async function acctLogin() {
      const acc = localAccount();
      if (!acc) { acctStatus('Is device par koi account nahi hai — pehle banao.', '#fde68a'); return; }
      const name = (document.getElementById('acct-login-name').value || '').trim();
      const pass = document.getElementById('acct-login-pass').value || '';
      if (name && name.toLowerCase() !== acc.name.toLowerCase()) { acctStatus('Naam match nahi kar raha.', '#fda4af'); return; }
      const btn = document.getElementById('acct-login-btn'); const old = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = '&#9203; Check kar rahe hain...'; }
      try {
        const h = await hashPassword(pass, acc.salt, acc.iter, acc.algo);
        if (h !== acc.hash) { acctStatus('&#10060; Password galat hai.', '#fda4af'); return; }
        _acctUser = { name: acc.name };
        try { localStorage.setItem(ACCT_SESSION_KEY, acc.name); } catch (e) {}
        document.getElementById('acct-login-pass').value = '';
        acctStatus('');
        renderAccount();
        showError('✅ Login ho gaya — welcome back, ' + escapeHtml(acc.name) + '!');
      } catch (e) {
        acctStatus('Login fail: ' + (e.message || e), '#fda4af');
      } finally { if (btn) { btn.disabled = false; btn.innerHTML = old; } }
    }
    function acctSignOut() {
      _acctUser = null;
      try { localStorage.removeItem(ACCT_SESSION_KEY); } catch (e) {}
      try { lockKeysNow(true); } catch (e) {}   // wipe keys from memory on sign-out
      renderAccount();
      acctStatus('Sign out ho gaya — account device par safe hai, dobara login kar sakte ho.', '#93a1bd');
    }
    function acctDelete() {
      if (!confirm('Is device se account delete kar dein? Ye undo nahi hoga.')) return;
      try { localStorage.removeItem(ACCT_KEY); localStorage.removeItem(ACCT_SESSION_KEY); } catch (e) {}
      _acctUser = null;
      renderAccount();
      acctStatus('Account delete ho gaya.', '#93a1bd');
    }
    function renderAccount() {
      const acc = localAccount();
      const signedIn = !!_acctUser;
      const show = (id, on) => { const el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); };
      show('acct-create', !acc && !signedIn);
      show('acct-login', !!acc && !signedIn);
      show('acct-signedin', signedIn);
      if (acc && !signedIn) {
        const nm = document.getElementById('acct-login-name'); if (nm && !nm.value) nm.value = acc.name;
        const who = document.getElementById('acct-who'); if (who) who.innerHTML = 'Is device ka account: <b>' + escapeHtml(acc.name) + '</b>';
      }
      if (signedIn) {
        const el = document.getElementById('acct-me');
        if (el) el.innerHTML = escapeHtml((_acctUser && _acctUser.name) || (acc && acc.name) || 'User');
      }
      // reflect the sign-in state on the sidebar item
      const item = document.querySelector('.sb-item[data-nav="account"]');
      if (item) {
        const ico = item.querySelector('.ico'); const icoTxt = ico ? ico.textContent : '\uD83D\uDC64';
        item.textContent = '';
        const sp = document.createElement('span'); sp.className = 'ico'; sp.textContent = icoTxt;
        item.appendChild(sp);
        item.appendChild(document.createTextNode(' ' + (signedIn ? ((_acctUser && _acctUser.name) || 'Account') : 'Sign in / Create account')));
      }
    }

    // ==================== UPSC INTERVIEW PRACTICE ====================
    const K_INTERVIEW = 'ai_study_interview_key_v20';
    let ivLog = [], ivRunning = false;

    function ivKey() { try { return (localStorage.getItem(K_INTERVIEW) || '').trim(); } catch (e) { return ''; } }
    function saveInterviewKey() {
      const v = (document.getElementById('interview-key').value || '').trim();
      try { localStorage.setItem(K_INTERVIEW, v); } catch (e) {}
      ivKeyStatus();
      showError(v ? '✅ Interview key save ho gayi (is device par)' : '🗑️ Interview key hata di — ab main key use hogi');
    }
    function ivKeyStatus() {
      const el = document.getElementById('interview-key-status');
      if (!el) return;
      const k = ivKey();
      el.innerHTML = k ? '✅ Alag interview key set hai' : 'ℹ️ Koi alag key nahi — main API key use hogi';
      const inp = document.getElementById('interview-key');
      if (inp && k && !inp.value) inp.value = k;
    }
    async function ivCall(prompt, json) {
      const key = ivKey();
      if (!key) return await callUniversalAI(prompt, json);
      const prov = detectProviderByPrefix(key);
      if (!prov) throw new Error('Interview key ka provider pehchana nahi gaya (Gemini/Groq/OpenRouter key daalo)');
      const models = await probeProvider(prov, key);
      if (!models || !models.length) throw new Error('Interview key verify nahi hui');
      return await callProviderChain(prov, models, key, prompt, json, '', true);
    }
    function ivRender() {
      const box = document.getElementById('interview-log');
      box.innerHTML = ivLog.map(m =>
        '<div class="' + (m.role === 'q' ? 'iv-q' : 'iv-a') + '"><div class="iv-who">' +
        (m.role === 'q' ? '&#127963;&#65039; Board' : '&#128100; You') + '</div>' + escapeHtml(m.text) + '</div>'
      ).join('');
      box.scrollTop = box.scrollHeight;
    }

    // ---- voice-to-voice interview ----
    let ivRec = null;
    let ivVoiceMode = true;
    try { ivVoiceMode = localStorage.getItem('ai_study_iv_voice_v20') !== '0'; } catch (e) {}
    function ivSyncVoiceBtn() {
      const b = document.getElementById('iv-voice-btn');
      if (b) b.textContent = ivVoiceMode ? '\uD83D\uDD0A Voice: ON' : '\uD83D\uDD07 Voice: OFF';
    }
    function ivToggleVoice() {
      ivVoiceMode = !ivVoiceMode;
      try { localStorage.setItem('ai_study_iv_voice_v20', ivVoiceMode ? '1' : '0'); } catch (e) {}
      ivSyncVoiceBtn();
      if (!ivVoiceMode) { try { ttsStop(); } catch (e) {} }
      showError(ivVoiceMode ? '🔊 Board apne sawaal bolkar sunayega' : '🔇 Voice off — sirf text');
    }
    function ivSpeak(text) {
      if (!ivVoiceMode || !text) return;
      try { ttsSpeak(text); } catch (e) {}
    }
    let ivLang = 'en-IN';
    try { ivLang = localStorage.getItem('ai_study_iv_lang_v20') || 'en-IN'; } catch (e) {}
    function ivSetLang(v) {
      ivLang = v;
      try { localStorage.setItem('ai_study_iv_lang_v20', v); } catch (e) {}
      showError('🎤 Mic language: ' + v);
    }
    function ivStopMic() {
      if (ivRec) { try { ivRec.onend = null; ivRec.stop(); } catch (e) {} ivRec = null; }
      const btn = document.getElementById('iv-mic-btn');
      if (btn) btn.innerHTML = '&#127908; Bol ke jawab do';
    }
    function ivMic() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const btn = document.getElementById('iv-mic-btn');
      if (!SR) { showError('❌ Is browser mein voice support nahi hai — Chrome use karo.'); return; }
      // already listening -> stop and send
      if (ivRec) {
        try { ivRec.stop(); } catch (e) {}
        return;
      }
      // free the mic: stop TTS and any other recogniser first
      try { ttsStop(); } catch (e) {}
      try { if (typeof speechRec !== 'undefined' && speechRec) { speechRec.onend = null; speechRec.stop(); } } catch (e) {}
      setTimeout(() => ivStartRec(SR, btn), 400);
    }
    function ivStartRec(SR, btn) {
      const ta = document.getElementById('interview-answer');
      try {
        ivRec = new SR();
        ivRec.lang = ivLang;
        ivRec.continuous = true;          // keep listening through pauses
        ivRec.interimResults = true;      // show words as they are spoken
        ivRec.maxAlternatives = 1;
      } catch (e) { showError('❌ Mic start nahi hua: ' + e.message); ivRec = null; return; }
      let finalText = (ta && ta.value) ? ta.value.trim() : '';
      ivRec.onstart = () => {
        if (btn) btn.innerHTML = '&#9209; Sun raha hoon… (band karne ke liye dabao)';
        if (jarvisMode) { ivStatus('listening'); ivOrb('listening'); }
      };
      ivRec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText = (finalText + ' ' + t).trim();
          else interim += t;
        }
        if (ta) ta.value = (finalText + (interim ? ' ' + interim : '')).trim();
        const hv = document.getElementById('iv-heard');
        if (hv) hv.textContent = (finalText + (interim ? ' ' + interim : '')).trim() ? '\u201C' + (finalText + (interim ? ' ' + interim : '')).trim().slice(-70) + '\u201D' : '';
      };
      ivRec.onerror = (e) => {
        const code = (e && e.error) || 'unknown';
        ivRec = null;
        if (btn) btn.innerHTML = '&#127908; Bol ke jawab do';
        if (code === 'not-allowed' || code === 'service-not-allowed')
          showError('❌ Mic permission band hai — browser settings mein mic allow karo.');
        else if (code === 'no-speech')
          showError('🎤 Kuch sunaai nahi diya — thoda paas se, zor se bolo.');
        else if (code === 'network')
          showError('❌ Voice ke liye internet chahiye (Chrome ka speech service).');
        else if (code !== 'aborted')
          showError('❌ Mic error: ' + code);
      };
      ivRec.onend = () => {
        ivRec = null;
        if (btn) btn.innerHTML = '&#127908; Bol ke jawab do';
        if (jarvisMode) { ivStatus('processing'); ivOrb(''); }
        const val = ta ? ta.value.trim() : '';
        if (val) { try { submitInterviewAnswer(); } catch (e) {} }
        else if (jarvisMode) { ivStatus('listening'); ivOrb('listening'); setTimeout(ivAutoMic, 900); }
        else showError('🎤 Kuch nahi suna — dobara try karo ya type karo.');
      };
      try { ivRec.start(); showError('🎤 Bolna shuru karo… rukne par "⏹" dabao.'); }
      catch (e) { ivRec = null; if (btn) btn.innerHTML = '&#127908; Bol ke jawab do'; showError('❌ ' + e.message); }
    }


    // ---- JARVIS mode ----
    let jarvisMode = false;
    try { jarvisMode = localStorage.getItem('ai_study_jarvis_v20') === '1'; } catch (e) {}
    function ivStatus(t) { const e = document.getElementById('iv-status'); if (e) e.textContent = 'JARVIS \u00B7 ' + t; }
    function ivOrb(state) {
      const o = document.getElementById('iv-orb');
      const hud = document.getElementById('iv-hud');
      if (o) { o.classList.remove('listening', 'speaking'); if (state) o.classList.add(state); }
      if (hud) { hud.classList.remove('listening', 'speaking'); if (state) hud.classList.add(state); }
    }
    function ivSyncJarvis() {
      const b = document.getElementById('iv-jarvis-btn');
      if (b) b.innerHTML = jarvisMode ? '\uD83E\uDD16 Jarvis: ON' : '\uD83E\uDD16 Jarvis';
      const hud = document.getElementById('iv-hud');
      if (hud) hud.classList.toggle('hidden', !jarvisMode);
    }
    function ivHasKey() {
      try { if ((localStorage.getItem('ai_study_interview_key_v20') || '').trim()) return true; } catch (e) {}
      const a = document.getElementById('api-key');
      return !!(a && (a.value || '').trim());
    }
    function ivToggleJarvis() {
      if (!jarvisMode && !ivHasKey()) {
        ivSyncJarvis();
        showError('⚠️ Pehle API key daalo (🔑 API Keys section) — phir JARVIS online hoga.');
        const hud = document.getElementById('iv-hud');
        if (hud) { hud.classList.remove('hidden'); ivStatus('no API key'); ivOrb(''); }
        return;
      }
      jarvisMode = !jarvisMode;
      try { localStorage.setItem('ai_study_jarvis_v20', jarvisMode ? '1' : '0'); } catch (e) {}
      ivSyncJarvis();
      if (jarvisMode) {
        ivVoiceMode = true;
        try { localStorage.setItem('ai_study_iv_voice_v20', '1'); } catch (e) {}
        ivSyncVoiceBtn(); ivBoot(); if (ivLog.length) { ivStatus('listening'); ivOrb('listening'); setTimeout(ivAutoMic, 700); }
        showError('🤖 JARVIS online, Sir. Start dabao — main sawaal poochhunga aur aap bolke jawab dijiye.');
      } else { ivStatus('standby'); try { ttsStop(); } catch (e) {} showError('JARVIS off'); }
    }
    
    let ivStartTs = 0, ivTick = null;
    function ivMetaUpdate() {
      const el = document.getElementById('iv-meta'); if (!el) return;
      let t = '00:00';
      if (ivStartTs) {
        const sec = Math.floor((Date.now() - ivStartTs) / 1000);
        t = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
      }
      el.textContent = t;
    }
    function ivMetaStart() {
      ivStartTs = Date.now();
      if (ivTick) clearInterval(ivTick);
      ivTick = setInterval(ivMetaUpdate, 1000);
      ivMetaUpdate();
    }
    function ivMetaStop() { if (ivTick) { clearInterval(ivTick); ivTick = null; } ivMetaUpdate(); }
    function ivBoot() {
      const seq = ['Initialising neural core\u2026', 'Calibrating voice input\u2026', 'online, Sir.'];
      let i = 0;
      const step = () => {
        if (i >= seq.length) { ivStatus('online'); return; }
        ivStatus(seq[i]);
        i++;
        setTimeout(step, 520);
      };
      step();
    }
    function ivJarvisDelay(text) { return Math.min(9000, 1600 + String(text || '').length * 55); }
    // Auto-listen for JARVIS: waits until the spoken question has actually
    // finished, then starts the mic WITHOUT stopping the TTS mid-sentence.
    function ivAutoMic() {
      if (!jarvisMode || ivRec) return;
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) { setTimeout(ivAutoMic, 600); return; }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      try { if (typeof speechRec !== 'undefined' && speechRec) { speechRec.onend = null; speechRec.stop(); } } catch (e) {}
      ivStartRec(SR, document.getElementById('iv-mic-btn'));
    }

    function openKeys() {
      hideAllSections();
      const _k = document.getElementById('keys-section');
      _k.classList.remove('hidden');
      setActiveNav('keys');
      if (typeof ivKeyStatus === 'function') ivKeyStatus();
      try { _k.setAttribute('tabindex','-1'); _k.focus({ preventScroll: true }); } catch (e) {}
    }
    function openInterview() {
      hideAllSections();
      const _iv = document.getElementById('interview-section');
      _iv.classList.remove('hidden');
      setActiveNav('interview');
      ivKeyStatus(); ivSyncVoiceBtn(); ivSyncJarvis(); ivMetaUpdate();
      try { _iv.setAttribute('tabindex','-1'); _iv.focus({ preventScroll: true }); } catch (e) {}
    }
    async function startInterview() {
      if (!ivHasKey()) { showError('⚠️ Pehle API key daalo (🔑 API Keys section).'); return; }
      ivLog = []; ivRunning = true; ivMetaStart();
      document.getElementById('interview-result').classList.add('hidden');
      document.getElementById('interview-input-wrap').classList.add('hidden');
      ivRender();
      await ivNext();
    }
    async function ivNext() {
      const transcript = ivLog.map(m => (m.role === 'q' ? 'BOARD: ' : 'CANDIDATE: ') + m.text).join('\n');
      const prompt = (jarvisMode
        ? 'You are JARVIS, an advanced AI interview assistant modelled on a British butler. Address the candidate as "Sir" once per question, stay formal, precise and quietly witty. You are conducting a UPSC Civil Services interview.\n'
        : 'You are a UPSC Civil Services interview board (3 members) conducting a realistic personality test.\n') +
        'Ask ONE question at a time, in a natural conversational way. Use the candidate\'s previous answers for follow-ups.\n' +
        'Cover a mix of: their background, home state, optional subject, current affairs, and a situational/ethical dilemma.\n' +
        'Ask at most 8 questions in total. Each question must be under 60 words. Be professional and warm, never hostile.\n' +
        (transcript ? 'TRANSCRIPT SO FAR:\n' + transcript + '\n' : '') +
        (ivLog.length === 0 ? 'This is the start — ask your first question.' : 'Ask the next question.') + '\n' +
        'Return ONLY JSON: {"question":"...","done":false} — set "done":true with an empty question when you have asked 8 questions.';
      try {
        const r = await ivCall(prompt, true);
        if (r && r.done) { await endInterview(); return; }
        const q = (r && r.question) ? String(r.question) : 'Tell me about yourself.';
        ivLog.push({ role: 'q', text: q }); ivRender(); ivMetaUpdate();
        const _hv = document.getElementById('iv-heard'); if (_hv) _hv.textContent = '';
        if (jarvisMode) { ivStatus('speaking'); ivOrb('speaking'); }
        ivSpeak(q);
        if (jarvisMode) setTimeout(ivAutoMic, ivJarvisDelay(q));
        document.getElementById('interview-input-wrap').classList.remove('hidden');
        document.getElementById('interview-answer').value = '';
        document.getElementById('interview-answer').focus();
      } catch (e) { ivRunning = false; showError('❌ ' + ((e && e.message) || e)); }
    }
    async function submitInterviewAnswer() {
      const ta = document.getElementById('interview-answer');
      const v = (ta.value || '').trim();
      if (!v) { showError('Pehle apna jawab likho.'); return; }
      ivLog.push({ role: 'a', text: v }); ivRender();
      document.getElementById('interview-input-wrap').classList.add('hidden');
      await ivNext();
    }
    async function endInterview() {
      if (!ivLog.length) { showError('Pehle interview shuru karo.'); return; }
      ivRunning = false;
      ivMetaStop();
      document.getElementById('interview-input-wrap').classList.add('hidden');
      const transcript = ivLog.map(m => (m.role === 'q' ? 'BOARD: ' : 'CANDIDATE: ') + m.text).join('\n');
      const box = document.getElementById('interview-result');
      box.classList.remove('hidden');
      box.innerHTML = '<div class="section-title">&#9203; Board tumhara performance assess kar raha hai&hellip;</div>';
      const prompt = 'You are a UPSC interview board evaluating this candidate. Be honest and specific.\nTRANSCRIPT:\n' + transcript + '\n' +
        'Return ONLY JSON: {"score":0-100,"verdict":"one line","knowledge":0-10,"communication":0-10,"poise":0-10,"ethics":0-10,' +
        '"strengths":["..."],"improvements":["..."],"advice":"2-3 sentences of concrete advice"}';
      try {
        const r = await ivCall(prompt, true);
        const bar = (label, val) => '<div style="margin:8px 0;"><div style="display:flex;justify-content:space-between;font-size:12.5px;"><span>' + label +
          '</span><b>' + val + '/10</b></div><div style="height:7px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:4px;">' +
          '<div style="height:100%;width:' + (Number(val) * 10) + '%;background:linear-gradient(90deg,var(--primary),var(--cyan));"></div></div></div>';
        box.innerHTML =
          '<div class="section-title">&#127942; Interview Result</div>' +
          '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:12px 0;">' +
            '<div style="font-size:40px;font-weight:900;background:linear-gradient(135deg,var(--primary),var(--cyan));-webkit-background-clip:text;background-clip:text;color:transparent;">' + (r.score || 0) + '<span style="font-size:16px;">/100</span></div>' +
            '<div style="font-size:14px;color:#dbe3ff;">' + escapeHtml(r.verdict || '') + '</div>' +
          '</div>' +
          bar('Knowledge', r.knowledge || 0) + bar('Communication', r.communication || 0) +
          bar('Poise &amp; confidence', r.poise || 0) + bar('Ethics', r.ethics || 0) +
          '<div style="margin-top:14px;"><b style="color:#6ee7b7;">✅ Strengths</b><ul>' + (r.strengths || []).map(x => '<li>' + escapeHtml(x) + '</li>').join('') + '</ul></div>' +
          '<div style="margin-top:8px;"><b style="color:#fda4af;">🔧 Improve</b><ul>' + (r.improvements || []).map(x => '<li>' + escapeHtml(x) + '</li>').join('') + '</ul></div>' +
          '<div style="margin-top:10px;padding:12px;border-radius:12px;background:rgba(109,111,245,.14);border:1px solid rgba(124,124,255,.35);"><b>Advice:</b> ' + escapeHtml(r.advice || '') + '</div>';
      } catch (e) {
        box.innerHTML = '<div class="section-title">&#9888;&#65039; Result nahi ban paya</div><p class="sec-p">' + escapeHtml((e && e.message) || String(e)) + '</p>';
      }
    }

    // ==================== BACKUP / RESTORE ====================
    function exportBackup() {
      try {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.indexOf('ai_study_') === 0) data[k] = localStorage.getItem(k);
        }
        const payload = { app: 'AI Study Suite PRO', exported: new Date().toISOString(), keys: Object.keys(data).length, data: data };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'ai-study-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        showError('✅ Backup export ho gaya — ' + payload.keys + ' items.');
      } catch (e) { showError('❌ Export fail: ' + ((e && e.message) || e)); }
    }
    async function importBackup(input) {
      const f = input.files && input.files[0];
      if (!f) return;
      try {
        const txt = await f.text();
        const p = JSON.parse(txt);
        const data = (p && p.data) ? p.data : p;
        if (!data || typeof data !== 'object') throw new Error('bad file');
        let n = 0;
        for (const k of Object.keys(data)) {
          if (k.indexOf('ai_study_') !== 0) continue;
          const v = data[k];
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          n++;
        }
        showError('✅ ' + n + ' items restore ho gaye — reload ho raha hai…');
        setTimeout(() => location.reload(), 1200);
      } catch (e) { showError('❌ Restore fail: file sahi backup JSON nahi hai.'); }
      finally { input.value = ''; }
    }

    // ==================== KEYBOARD SHORTCUTS ====================
    document.addEventListener('keydown', function (e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const open = id => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); };
      // quiz: 1-4 pick an option, Enter = next
      if (open('quiz-section')) {
        if (/^[1-4]$/.test(e.key)) {
          const opts = document.querySelectorAll('#quiz-section .option-btn');
          const o = opts[parseInt(e.key, 10) - 1];
          if (o) { o.click(); e.preventDefault(); }
        } else if (e.key === 'Enter') {
          const nb = document.querySelector('#quiz-section .btn-primary, #quiz-section .btn-cyan');
          if (nb) { nb.click(); e.preventDefault(); }
        }
      }
      // flashcards: Space = flip, 1-3 = grade
      if (open('flashcard-section') && e.key === ' ') {
        const f = document.querySelector('#flashcard-section .flashcard-inner');
        if (f) { f.click(); e.preventDefault(); }
      }
    });

    function openAccount() {
      hideAllSections();
      document.getElementById('account-section').classList.remove('hidden');
      setActiveNav('account');
      renderAccount();
    }
    function accountBoot() {
      // restore a local session — no network involved at all
      try {
        const n = localStorage.getItem(ACCT_SESSION_KEY);
        const acc = localAccount();
        if (n && acc && n.toLowerCase() === acc.name.toLowerCase()) _acctUser = { name: acc.name };
      } catch (e) {}
      renderAccount();
    }

    // ==================== NAVIGATION + BACK (history aware) ====================
    let navHistory = ['setup'];
    let navIndex = 0;
    let suppressNavRecord = false;

    function toggleSidebar() { document.body.classList.toggle('sidebar-open'); }
    function closeSidebar() { document.body.classList.remove('sidebar-open'); }

    // ---- collapsible sidebar groups (state persisted) ----
    const NAV_GROUPS = ['study', 'revise', 'insights', 'library', 'account'];
    const NAV_GROUP_DEFAULT = { study: true, revise: true, insights: false, library: false, account: false };
    function navGroupState() {
      try {
        const raw = localStorage.getItem('ai_study_navgroups_v17');
        if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') return o; }
      } catch (e) {}
      return Object.assign({}, NAV_GROUP_DEFAULT);
    }
    function saveNavGroupState(st) { try { localStorage.setItem('ai_study_navgroups_v17', JSON.stringify(st)); } catch (e) {} }
    function applyNavGroup(group, open) {
      const box = document.querySelector('.sb-items[data-group="' + group + '"]');
      const head = document.querySelector('.sb-group[data-group="' + group + '"]');
      if (box) box.classList.toggle('collapsed', !open);
      if (head) { head.setAttribute('aria-expanded', open ? 'true' : 'false'); head.classList.toggle('open', !!open); }
    }
    function toggleNavGroup(group) {
      const st = navGroupState();
      st[group] = !st[group];
      saveNavGroupState(st);
      applyNavGroup(group, st[group]);
    }
    function restoreNavGroups() {
      const st = navGroupState();
      NAV_GROUPS.forEach(g => applyNavGroup(g, !!st[g]));
    }
    function expandGroupOf(navId) {
      const el = document.querySelector('.sb-item[data-nav="' + navId + '"]');
      if (!el) return;
      const box = el.closest('.sb-items');
      if (!box || !box.dataset.group) return;
      const st = navGroupState();
      if (!st[box.dataset.group]) { st[box.dataset.group] = true; saveNavGroupState(st); applyNavGroup(box.dataset.group, true); }
    }

    function setActiveNav(id) {
      try {
        document.querySelectorAll('.sb-item').forEach(b => b.classList.toggle('active', b.dataset.nav === id));
        if (id) expandGroupOf(id);
      } catch (e) {}
    }
    function updateBackBtn() {
      const b = document.getElementById('back-btn');
      if (b) b.classList.toggle('hidden', navIndex <= 0);
    }
    function recordNav(id) {
      if (!id) return;
      setActiveNav(id);
      if (suppressNavRecord) return;
      if (navHistory[navIndex] === id) return;
      navHistory = navHistory.slice(0, navIndex + 1);
      navHistory.push(id);
      navIndex = navHistory.length - 1;
      updateBackBtn();
      try { history.pushState({ nav: id }, '', '#' + id); } catch (e) {}
    }
    // Shows the section for a nav id WITHOUT touching the history stack.
    function showNav(id) {
      suppressNavRecord = true;
      try {
        if (id === 'setup') resetApp();
        else if (['quiz', 'flashcards', 'mindmap', 'notes'].includes(id)) { setStudyMode(id); showExistingStudyMode(id); }
        else if (id === 'mains') openMainsEvaluator();
        else if (id === 'blurt') openBlurtCanvas();
        else if (id === 'teach') openTeachBack();
        else if (id === 'visual') openVisualTools();
        else if (id === 'weakness') openWeaknessReport();
        else if (id === 'results') { if (quizData && quizData.length) showResults(); else resetApp(); }
        else if (id === 'sets') openSets();
        else if (id === 'library') openLibrary();
        else if (id === 'plan') openPlan();
        else if (id === 'progress') openProgress();
        else if (id === 'account') openAccount();
        else if (id === 'videos') openVideos();
        else if (id === 'interview') openInterview();
        else if (id === 'keys') openKeys();
        else if (id === 'mistake') openMistakes();
        else if (id === 'adaptive') openAdaptive();
        else if (id === 'listen') openListenMode();
        else if (id === 'sprint') openSprint();
        else if (id === 'doubts') openDoubtHistory();
        else resetApp();
      } catch (e) { reportUnexpectedError(e.message || String(e)); }
      finally { suppressNavRecord = false; }
      setActiveNav(id);
      updateBackBtn();
    }
    // move keyboard/screen-reader focus into the section that just opened
    function focusSection(id) {
      try {
        const sec = document.getElementById(id + '-section');
        if (!sec) return;
        const h = sec.querySelector('h1, h2, h3, .sec-h2, .section-title, [data-section-title]');
        if (!h) return;
        if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      } catch (e) {}
    }
    function navGo(target) {
      closeSidebar();
      showNav(target);
      recordNav(target);          // no-op if showNav already recorded it
      window.scrollTo({ top: 0, behavior: 'smooth' });
      focusSection(target);
    }
    function goBack() {
      if (navIndex <= 0) { showError("Yahi shuruaat hai — peeche kuch nahi."); return; }
      navIndex--;
      showNav(navHistory[navIndex]);
      try { history.replaceState({ nav: navHistory[navIndex] }, '', '#' + navHistory[navIndex]); } catch (e) {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
      focusSection(navHistory[navIndex]);
    }
    function initNav() {
      try { history.replaceState({ nav: 'setup' }, '', '#setup'); } catch (e) {}
      updateBackBtn();
    }
    // Hardware / browser back button (phone back gesture bhi)
    window.addEventListener('popstate', () => {
      if (navIndex > 0) { navIndex--; showNav(navHistory[navIndex]); }
      else { try { history.pushState({ nav: 'setup' }, '', '#setup'); } catch (e) {} }
    });

    // ==================== AUTHENTIC UPSC / UPPCS / SSC DEMO MODES ====================
    function startDemo(mode) {
      currentPdfName = "NCERT_Polity_History_Science_Compendium.pdf";
      lastSampledPagesList = [6, 14, 29];
      if (mode === 'quiz') {
        quizData = [
          {
            examTag: "🏛️ UPSC CSE Prelims Pattern",
            topic: "Indian Polity (Fundamental Rights)",
            sourcePage: 6,
            question: "Consider the following statements regarding Fundamental Rights in the Indian Constitution:\n1. Article 20 and Article 21 cannot be suspended even during the operation of a National Emergency under Article 352.\n2. The 42nd Constitutional Amendment Act, 1976 enabled the enforcement of Article 20 & 21 during Emergency.\n3. Fundamental Duties in Part IV-A were added on the recommendation of the Swaran Singh Committee.\n\nHow many of the statements given above are correct?",
            options: ["Only one", "Only two", "All three", "None"],
            correctIndex: 1,
            clue: "Statement 2 mein Amendment number check karein — 42nd tha ya 44th?",
            explanation: "Statement 1 aur 3 sahi hain. Statement 2 galat hai kyunki 44th Amendment Act (1978) ne प्रावधान kiya tha ki Emergency mein Article 20 aur 21 suspend nahi honge (42nd ne nahi). Isliye 'Only two' sahi hai.",
            sourceQuote: "The 44th Amendment Act of 1978 provided that the President cannot suspend the right to move the Court for the enforcement of Fundamental Rights guaranteed by Articles 20 and 21."
          },
          {
            examTag: "🦁 UPPCS / State PSC Pattern",
            topic: "Cell Biology (Organelles)",
            sourcePage: 14,
            question: "Match List-I (Cell Organelle) with List-II (Primary Function/Nickname) and select the correct answer using the code given below:\nList-I:\n(A) Mitochondria\n(B) Ribosomes\n(C) Lysosomes\n(D) Chloroplast\n\nList-II:\n1. Suicidal Bags of the Cell\n2. Kitchen of the Plant Cell\n3. Powerhouse / ATP Synthesis\n4. Protein Factory of the Cell",
            options: [
              "A-3, B-4, C-1, D-2",
              "A-4, B-3, C-2, D-1",
              "A-3, B-1, C-4, D-2",
              "A-2, B-4, C-1, D-3"
            ],
            correctIndex: 0,
            clue: "Mitochondria = Powerhouse (A-3) aur Lysosomes = Suicidal Bags (C-1) ko match karein.",
            explanation: "Mitochondria ATP banata hai (A-3), Ribosomes protein synthesis karte hain (B-4), Lysosomes mein hydrolytic enzymes hote hain (C-1), aur Chloroplast photosynthesis karta hai (D-2).",
            sourceQuote: "Mitochondria generate ATP (Powerhouse), Ribosomes synthesize proteins, Lysosomes act as suicidal bags, and Chloroplasts are the kitchen of the cell."
          },
          {
            examTag: "⚡ SSC CGL / One-Day Pattern",
            topic: "Modern Indian History",
            sourcePage: 29,
            question: "Mahatma Gandhi aur Dr. B.R. Ambedkar ke beech 'Poona Pact' (पूना समझौता) kis din aur kis jail mein sign kiya gaya tha?",
            options: [
              "24 September 1932 — Yerwada Central Jail, Pune",
              "5 March 1931 — Sabarmati Jail, Ahmedabad",
              "16 August 1932 — Alipore Jail, Kolkata",
              "8 August 1942 — Aga Khan Palace, Pune"
            ],
            correctIndex: 0,
            clue: "Communal Award (August 1932) ke turant baad September 1932 mein Pune ki jail mein hua tha.",
            explanation: "24 September 1932 ko Pune ki Yerwada Central Jail mein Poona Pact sign hua, jisme Depressed Classes ke liye Separate Electorate ki jagah Joint Electorate mein Reserved Seats (71 se badha kar 147) di gayin.",
            sourceQuote: "The Poona Pact was signed on 24 September 1932 at Yerwada Central Jail in Poona, increasing reserved seats for Depressed Classes in provincial legislatures to 147."
          }
        ];
        launchQuiz();
      } else if (mode === 'flashcards') {
        flashcardData = [
          {
            topic: "UPSC Polity (Page 8)",
            front: "Article 32 ke tahat kaun-kaun si 5 Writs Supreme Court jari kar sakta hai?",
            back: "1. Habeas Corpus, 2. Mandamus, 3. Prohibition, 4. Certiorari, 5. Quo-Warranto.",
            keyTakeaway: "UPSC Trap: High Court ka Writ jurisdiction (Art 226) Supreme Court (Art 32) se zyada wide hota hai!"
          },
          {
            topic: "SSC Physics (Page 19)",
            front: "Light Year (Prakash Varsh) aur Parsec kiski unit hain?",
            back: "Astronomical Distance (Khagoliya Doori) ki. 1 Parsec = 3.26 Light Years.",
            keyTakeaway: "SSC Trap: Naam mein 'Year' hai par yeh Time nahi, Distance napta hai!"
          }
        ];
        launchFlashcards();
      } else if (mode === 'mindmap') {
        mindMapData = {
          rootTopic: "UPSC / UPPCS / SSC — Indian Polity & Science Tree",
          branches: [
            {
              branchTitle: "Fundamental Rights (Part III)",
              badge: "PDF Pages 3-9",
              nodes: [
                { title: "Right to Equality (Art 14-18)", detail: "Equality before law (British) & Equal protection of laws (USA).", memoryHook: "Art 17 = Abolition of Untouchability" },
                { title: "Right to Life (Art 21)", detail: "Protection of Life & Personal Liberty; never suspended in Emergency (44th Amendment).", memoryHook: "Menaka Gandhi Case (1978) — Due Process" }
              ]
            },
            {
              branchTitle: "Cell Organelles (Biology)",
              badge: "PDF Pages 12-16",
              nodes: [
                { title: "Mitochondria & Chloroplast", detail: "Semi-autonomous organelles; dono ke paas apna circular DNA aur 70S ribosomes hote hain.", memoryHook: "UPSC Prelims 2022 Direct Statement" }
              ]
            }
          ]
        };
        launchMindMap();
      } else {
        notesData = {
          title: "UPSC / UPPCS / SSC — High-Yield Revision Sheet",
          executiveSummary: "Yeh cheat sheet uploaded PDF se UPSC Prelims statements, UPPCS matching pairs aur SSC one-liner facts ko cover karti hai.",
          keyConcepts: [
            { term: "44th Amendment Act 1978 (Page 6)", summary: "Article 20 & 21 Emergency mein suspend nahi ho sakte; Right to Property (Art 300A) legal right bana." },
            { term: "Semi-Autonomous Organelles (Page 14)", summary: "Mitochondria aur Plastids (Chloroplast) ke paas khud ka DNA aur 70S ribosome hota hai." }
          ],
          formulasOrFacts: ["Poona Pact: 24 Sept 1932 (Yerwada Jail) — Page 29", "1 Parsec = 3.26 Light Years = 3.08 × 10^16 m — Page 19"],
          mnemonics: ["42nd Amendment Preamble Words Trick: 'SSI' -> Socialist, Secular, Integrity"]
        };
        launchNotes();
      }
    }
  