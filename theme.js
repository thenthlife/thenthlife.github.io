/**
 * THEME ENGINE — nth Life
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the 6 visual themes. Applies saved theme on every page load.
 * Shows selector on first ever visit. Accessible from settings panel after.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const THEMES = {
  terminal:      { name: 'TERMINAL',      sub: 'Default // CRT Green',    swatch: 'swatch-terminal',      light: false },
  void:          { name: 'VOID',          sub: 'Minimal // White',        swatch: 'swatch-void',          light: false },
  blood:         { name: 'BLOOD',         sub: 'Aggressive // Red',       swatch: 'swatch-blood',         light: false },
  amber:         { name: 'AMBER',         sub: 'Warm // Commodore',       swatch: 'swatch-amber',         light: false },
  ice:           { name: 'ICE',           sub: 'Cold // Sci-Fi',          swatch: 'swatch-ice',           light: false },
  synthwave:     { name: 'SYNTHWAVE',     sub: 'Neon // Retrowave',       swatch: 'swatch-synthwave',     light: false },
  paper:         { name: 'PAPER',         sub: 'Clean // Typewriter',     swatch: 'swatch-paper',         light: true  },
  'matrix-light':{ name: 'MATRIX LIGHT', sub: 'Inverted // Terminal',    swatch: 'swatch-matrix-light',  light: true  },
  blueprint:     { name: 'BLUEPRINT',     sub: 'Technical // Blueprint',  swatch: 'swatch-blueprint',     light: true  }
};

const THEME_KEY = 'nth_theme';

/**
 * Apply a theme by adding the correct class to body.
 * Terminal is the default — no class needed, just remove others.
 */
function applyTheme(themeId) {
  const body = document.body;
  // Remove all theme classes and light flag
  Object.keys(THEMES).forEach(t => body.classList.remove(`theme-${t}`));
  body.classList.remove('theme-light');
  // Apply new theme
  if (themeId && themeId !== 'terminal') {
    body.classList.add(`theme-${themeId}`);
  }
  // Add structural light class for light themes
  if (THEMES[themeId]?.light) {
    body.classList.add('theme-light');
  }
}

/**
 * Save and apply a theme.
 */
function setTheme(themeId) {
  if (!THEMES[themeId]) return;
  localStorage.setItem(THEME_KEY, themeId);
  applyTheme(themeId);
}

/**
 * Load and apply saved theme. Call this as early as possible on every page.
 */
function loadSavedTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'terminal';
  applyTheme(saved);
  return saved;
}

/**
 * Show the theme selector overlay.
 * @param {boolean} firstVisit — if true, no skip button shown (forced choice on first boot)
 * @param {function} onComplete — callback when theme is chosen
 */
function showThemeSelector(firstVisit = false, onComplete = null) {
  const existing = document.getElementById('theme-overlay');
  if (existing) existing.remove();

  const current     = localStorage.getItem(THEME_KEY) || 'terminal';
  const darkThemes  = Object.entries(THEMES).filter(([, t]) => !t.light);
  const lightThemes = Object.entries(THEMES).filter(([, t]) =>  t.light);

  function renderGroup(entries) {
    return entries.map(([id, t]) => `
      <div class="theme-option ${id === current ? 'active' : ''}"
           data-theme="${id}"
           onclick="selectTheme('${id}')">
        <div class="theme-swatch ${t.swatch}"></div>
        <span class="theme-name">${t.name}</span>
        <span class="theme-sub">${t.sub}</span>
      </div>
    `).join('');
  }

  const overlay = document.createElement('div');
  overlay.id = 'theme-overlay';
  overlay.className = 'theme-overlay';

  overlay.innerHTML = `
    <h2>// SELECT_TERMINAL_THEME</h2>
    <p>${firstVisit ? 'Choose your interface // Can be changed anytime in settings' : 'Current: ' + THEMES[current].name}</p>
    <div class="theme-section-label">// DARK</div>
    <div class="theme-grid">${renderGroup(darkThemes)}</div>
    <div class="theme-section-label">// LIGHT</div>
    <div class="theme-grid theme-grid-light">${renderGroup(lightThemes)}</div>
    ${!firstVisit ? `<button class="theme-skip" onclick="closeThemeSelector()">[ CLOSE ]</button>` : ''}
  `;

  document.body.appendChild(overlay);
  overlay._onComplete = onComplete;
}

function selectTheme(themeId) {
  setTheme(themeId);
  const overlay = document.getElementById('theme-overlay');
  if (overlay) {
    const cb = overlay._onComplete;
    overlay.remove();
    if (cb) cb();
  }
}

function closeThemeSelector() {
  const overlay = document.getElementById('theme-overlay');
  if (overlay) overlay.remove();
}

/**
 * Check if this is the user's first ever visit.
 * Shows the theme selector before the boot sequence proceeds.
 * @param {function} onComplete — called after theme is chosen (or already set)
 */
function initTheme(onComplete) {
  // Apply saved theme immediately (prevents flash)
  loadSavedTheme();

  const hasChosen = localStorage.getItem(THEME_KEY);
  if (!hasChosen) {
    // First visit — show selector, boot continues after choice
    showThemeSelector(true, onComplete);
  } else {
    // Returning visitor — proceed immediately
    if (onComplete) onComplete();
  }
}