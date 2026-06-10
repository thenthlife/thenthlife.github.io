/**
 * INTRO SLIDES — nth Life Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows mode-specific intro slides on every entry.
 * Swipeable on mobile, keyboard navigable on desktop.
 * Skip always available.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SLIDES = {
  "free-roam": [
    {
      icon: "◈",
      title: "FREE ROAM",
      subtitle: "Unrestricted Reality",
      body: "No rules. No death. No limits. You define the reality — the AI follows without question. Start by describing who you are, where you exist, and what you want. The simulation will build around you.",
      highlight: null
    },
    {
      icon: "▸",
      title: "HOW TO PLAY",
      subtitle: "Command Interface",
      body: "Type anything into the command input. The AI responds and generates 4 contextual choices. You can select a choice or ignore them entirely and type your own command. There is no wrong move. There is no game over.",
      highlight: "Every input is valid. The world adapts to you."
    }
  ],

  "survival": [
    {
      icon: "⚠",
      title: "2ND LIFE",
      subtitle: "One Life. Real Consequences.",
      body: "This is a hardcore survival simulation. The AI enforces logic and consequence. Dangerous decisions have real outcomes. There are no second chances. When you die, your timeline is wiped.",
      highlight: "PERMADEATH IS PERMANENT."
    },
    {
      icon: "◫",
      title: "YOUR STATS",
      subtitle: "Monitor Everything",
      body: "Four stats govern your survival. HP tracks your health — zero means death. $FUNDS determines what you can do. REP reflects how the world sees you. RISK measures your current danger level. Watch the bars. When they turn red, act fast.",
      highlight: "HP · $FUNDS · REP · RISK"
    },
    {
      icon: "⬡",
      title: "SCORING",
      subtitle: "Every Turn Counts",
      body: "Your score builds with every turn survived. Money and reputation multiply it. High danger at the moment of death penalises it. When you die, your run is scored and submitted to the global leaderboard automatically.",
      highlight: "TURNS × 100 + FUNDS × 2 + REP × 50 − RISK × 5"
    },
    {
      icon: "▲",
      title: "HOW TO SURVIVE",
      subtitle: "Tactical Realism",
      body: "Think before you act. The 4 generated choices are contextually safe options. Custom commands carry more risk — and more reward. Resources are finite. Enemies are real. The AI will not spare you.",
      highlight: "THERE IS NO RELOAD."
    }
  ]
};

/**
 * Show intro slides for a given mode.
 * @param {string} mode — "free-roam" or "survival"
 * @param {function} onComplete — called when slides are dismissed
 */
function showSlides(mode, onComplete) {
  const slides = SLIDES[mode];
  if (!slides || slides.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  let current = 0;
  let startX = 0;

  const overlay = document.createElement('div');
  overlay.id = 'slides-overlay';
  overlay.className = 'slides-overlay';

  function render() {
    const slide = slides[current];
    const isLast = current === slides.length - 1;

    overlay.innerHTML = `
      <div class="slides-container">
        <div class="slide-content">
          <div class="slide-icon">${slide.icon}</div>
          <div class="slide-title">${slide.title}</div>
          <div class="slide-subtitle">${slide.subtitle}</div>
          <div class="slide-body">${slide.body}</div>
          ${slide.highlight ? `<div class="slide-highlight">${slide.highlight}</div>` : ''}
        </div>
        <div class="slides-nav">
          <div class="slides-dots">
            ${slides.map((_, i) => `
              <div class="slide-dot ${i === current ? 'active' : ''}" onclick="goToSlide(${i})"></div>
            `).join('')}
          </div>
          <div class="slides-actions">
            <button class="slide-skip" onclick="dismissSlides()">SKIP</button>
            <button class="slide-next" onclick="${isLast ? 'dismissSlides()' : 'nextSlide()'}">
              ${isLast ? '[ ENTER_SIMULATION ]' : '[ NEXT ]'}
            </button>
          </div>
          ${current > 0 ? `<button class="slide-back" onclick="prevSlide()">← BACK</button>` : ''}
        </div>
      </div>
    `;

    // Touch swipe support
    overlay.ontouchstart = e => { startX = e.touches[0].clientX; };
    overlay.ontouchend   = e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextSlide();
        else prevSlide();
      }
    };
  }

  function nextSlide() {
    if (current < slides.length - 1) { current++; render(); }
  }

  function prevSlide() {
    if (current > 0) { current--; render(); }
  }

  function goToSlide(i) {
    current = i; render();
  }

  function dismissSlides() {
    overlay.classList.add('slides-fade-out');
    setTimeout(() => {
      overlay.remove();
      if (onComplete) onComplete();
    }, 400);
  }

  // Expose to onclick handlers
  window.nextSlide    = nextSlide;
  window.prevSlide    = prevSlide;
  window.goToSlide    = goToSlide;
  window.dismissSlides = dismissSlides;

  // Keyboard navigation
  function handleKey(e) {
    if (e.key === 'ArrowRight' || e.key === 'Enter') nextSlide();
    if (e.key === 'ArrowLeft')  prevSlide();
    if (e.key === 'Escape')     dismissSlides();
  }
  document.addEventListener('keydown', handleKey);
  overlay.addEventListener('remove', () => document.removeEventListener('keydown', handleKey));

  render();
  document.body.appendChild(overlay);
}
