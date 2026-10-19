/**
 * SETTINGS — nth Life
 * ─────────────────────────────────────────────────────────────────────────────
 * One settings overlay shared by every page. Loaded in <head>.
 *
 * At load time this file ONLY touches <html> (text size + display flags), so it
 * is safe to run before <body> exists. The overlay UI is built on demand.
 *
 * Display prefs live in localStorage "nth_settings". The theme keeps its own
 * existing key ("nth_theme", managed by theme.js) so nobody loses their choice.
 * Phase 3: syncing prefs to an account is a one-function swap in load()/save().
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Settings = (() => {

  const KEY = 'nth_settings';

  const DEFAULTS = {
    textSize:      'default',   // small | default | large | xlarge
    narrativeCase: 'upper',     // upper | normal (story text only)
    effects:       'on',        // on | off  (scanlines + glow)
    typeSpeed:     'normal'     // normal | fast | instant
  };

  const SIZES  = { small: 87.5, default: 100, large: 115, xlarge: 130 };   // % of base font size
  const DELAYS = { normal: 15, fast: 5, instant: 0 };   // ms per character

  const OPTIONS = [
    { key: 'textSize', label: 'TEXT SIZE',
      choices: [['small', 'SMALL'], ['default', 'DEFAULT'], ['large', 'LARGE'], ['xlarge', 'XL']] },
    { key: 'narrativeCase', label: 'NARRATIVE TEXT',
      choices: [['upper', 'UPPERCASE'], ['normal', 'SENTENCE CASE']],
      note: 'STORY TEXT ONLY // EASIER TO READ IN LONG PASSAGES' },
    { key: 'effects', label: 'SCANLINES & GLOW',
      choices: [['on', 'ON'], ['off', 'OFF']] },
    { key: 'typeSpeed', label: 'TYPEWRITER SPEED',
      choices: [['normal', 'NORMAL'], ['fast', 'FAST'], ['instant', 'INSTANT']],
      note: 'TAP A MESSAGE WHILE IT IS TYPING TO SKIP' }
  ];

  // ── PERSISTENCE ──────────────────────────────────────────────────────────────
  function load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { saved = {}; }

    const p = { ...DEFAULTS, ...saved };

    // Respect the device's reduced-motion setting until the player chooses otherwise
    if (!('typeSpeed' in saved) &&
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      p.typeSpeed = 'instant';
    }

    // Validate — a corrupted value must never break the page
    if (!(p.textSize  in SIZES))  p.textSize  = DEFAULTS.textSize;
    if (!(p.typeSpeed in DELAYS)) p.typeSpeed = DEFAULTS.typeSpeed;
    if (!['upper', 'normal'].includes(p.narrativeCase)) p.narrativeCase = DEFAULTS.narrativeCase;
    if (!['on', 'off'].includes(p.effects))             p.effects       = DEFAULTS.effects;
    return p;
  }

  let prefs = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* storage full/blocked */ }
  }

  // ── APPLY (touches <html> only — safe in <head>) ─────────────────────────────
  function apply() {
    const root  = document.documentElement;
    const pct = SIZES[prefs.textSize];
    root.style.fontSize = pct + '%';
    root.style.setProperty('--text-scale', String(pct / 100));
    root.setAttribute('data-size', prefs.textSize);
    root.setAttribute('data-case', prefs.narrativeCase);
    root.setAttribute('data-fx',   prefs.effects);
  }

  function get(key)        { return prefs[key]; }
  function set(key, value) { prefs[key] = value; save(); apply(); }
  function typeDelay()     { return DELAYS[prefs.typeSpeed]; }
  function reset()         { prefs = { ...DEFAULTS }; save(); apply(); }

  // ── OVERLAY UI ───────────────────────────────────────────────────────────────
  function onKey(e) { if (e.key === 'Escape') close(); }

  function close() {
    const o = document.getElementById('settings-overlay');
    if (o) o.remove();
    document.removeEventListener('keydown', onKey);
  }

  function themeName() {
    try {
      const id = localStorage.getItem('nth_theme') || 'terminal';
      return (typeof THEMES !== 'undefined' && THEMES[id]) ? THEMES[id].name : id.toUpperCase();
    } catch { return 'TERMINAL'; }
  }

  function open() {
    if (document.getElementById('settings-overlay')) { close(); return; }

    const ov = document.createElement('div');
    ov.id = 'settings-overlay';
    ov.className = 'settings-overlay';

    // Static markup only — no user-supplied text is interpolated here.
    ov.innerHTML = `
      <div class="settings-box" role="dialog" aria-label="Settings">

        <div class="settings-head">
          <h2>// SYSTEM_SETTINGS</h2>
          <button type="button" class="settings-close" id="st-close" aria-label="Close settings">✕</button>
        </div>

        <div class="settings-section-label">// DISPLAY</div>

        <div class="settings-row">
          <span class="settings-label">INTERFACE THEME</span>
          <div class="settings-input-row">
            <span class="settings-theme-name" id="st-theme-name"></span>
            <button type="button" id="st-theme-btn">[◐] CHANGE</button>
          </div>
        </div>

        ${OPTIONS.map(o => `
          <div class="settings-row" data-key="${o.key}">
            <span class="settings-label">${o.label}</span>
            <div class="seg">
              ${o.choices.map(([v, l]) =>
                `<button type="button" class="seg-btn" data-val="${v}">${l}</button>`).join('')}
            </div>
            ${o.note ? `<span class="settings-note">${o.note}</span>` : ''}
          </div>`).join('')}

        <button type="button" class="settings-reset" id="st-reset">RESET DISPLAY DEFAULTS</button>

        <div class="settings-section-label">// OPERATOR</div>

        <div class="settings-row">
          <span class="settings-label">GEMINI API KEY</span>
          <span class="settings-key-status" id="st-key-status"></span>
          <div class="settings-input-row">
            <input type="password" id="st-key-input" placeholder="PASTE_KEY_HERE..." autocomplete="off" />
            <button type="button" id="st-key-save">SAVE</button>
          </div>
        </div>

        <div class="settings-row">
          <span class="settings-label">OPERATOR HANDLE <span style="opacity:0.5">// SHOWN ON LEADERBOARD</span></span>
          <div class="settings-input-row">
            <input type="text" id="st-handle-input" maxlength="32"
                   autocomplete="off" autocorrect="off" autocapitalize="off" />
            <button type="button" id="st-handle-save">SAVE</button>
          </div>
        </div>

        <div class="settings-warning">
          ⚠ GEMINI KEY IS STORED IN LOCALSTORAGE — DO NOT USE ON SHARED DEVICES.
        </div>

        <div class="settings-actions">
          <button type="button" id="st-done">CLOSE</button>
          <button type="button" class="btn-danger" id="st-clear-key">CLEAR KEY</button>
        </div>

      </div>`;

    document.body.appendChild(ov);
    document.addEventListener('keydown', onKey);

    const $ = id => ov.querySelector(id);

    // — Segmented controls: update the active state in place (never re-render,
    //   so half-typed key/handle text is never lost) —
    function syncSeg() {
      ov.querySelectorAll('.settings-row[data-key]').forEach(row => {
        const current = prefs[row.dataset.key];
        row.querySelectorAll('.seg-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.val === current));
      });
    }
    ov.querySelectorAll('.settings-row[data-key] .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        set(btn.closest('.settings-row').dataset.key, btn.dataset.val);
        syncSeg();
      });
    });
    syncSeg();

    $('#st-reset').addEventListener('click', () => { reset(); syncSeg(); });

    // — Theme —
    const refreshTheme = () => { $('#st-theme-name').textContent = themeName(); };
    refreshTheme();
    if (typeof showThemeSelector === 'function') {
      $('#st-theme-btn').addEventListener('click', () => showThemeSelector(false, refreshTheme));
    } else {
      $('#st-theme-btn').style.display = 'none';
    }

    // — API key (textContent only, so key characters can never be parsed as HTML) —
    const renderKeyStatus = () => {
      const el  = $('#st-key-status');
      const key = localStorage.getItem('my_gemini_key');
      if (key) {
        el.textContent = '● ACTIVE: ' + key.slice(0, 6) + '••••••••••••' + key.slice(-4);
        el.style.color = 'var(--primary)';
      } else {
        el.textContent = '● NO KEY LOADED';
        el.style.color = 'var(--death-red)';
      }
    };
    renderKeyStatus();

    $('#st-key-save').addEventListener('click', () => {
      const input = $('#st-key-input');
      const v = input.value.trim();
      if (!v) return;
      localStorage.setItem('my_gemini_key', v);
      input.value = '';
      renderKeyStatus();
      const b = $('#st-key-save');
      b.textContent = 'SAVED';
      setTimeout(() => { b.textContent = 'SAVE'; }, 1200);
    });

    $('#st-clear-key').addEventListener('click', () => {
      if (confirm('CLEAR API KEY FROM STORAGE?')) {
        localStorage.removeItem('my_gemini_key');
        renderKeyStatus();
      }
    });

    // — Handle (value set as a property, so no HTML-attribute injection) —
    $('#st-handle-input').value = localStorage.getItem('nth_handle') || '';
    $('#st-handle-input').placeholder = 'SET_YOUR_CALLSIGN...';
    $('#st-handle-save').addEventListener('click', () => {
      const v = $('#st-handle-input').value.trim();
      if (v) localStorage.setItem('nth_handle', v);
      else   localStorage.removeItem('nth_handle');
      const b = $('#st-handle-save');
      b.textContent = 'SAVED';
      setTimeout(() => { b.textContent = 'SAVE'; }, 1200);
    });

    // — Close paths —
    $('#st-close').addEventListener('click', close);
    $('#st-done').addEventListener('click', close);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
  }

  apply();   // safe in <head>: only touches <html>

  return { get, set, typeDelay, reset, apply, open, close };

})();

// Global entry point used by inline onclick handlers on every page
function openSettings() { Settings.open(); }