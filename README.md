# THE nᵗʰ LIFE // SIMULATION ENGINE

The nᵗʰ Life is a brutalist, AI-driven life simulator designed for 2026 tactical realism. It runs entirely in the browser using the Gemini 2.5 Flash API to generate logical, non-sugarcoated consequences for every player action.

---

## 01 // ARCHITECTURE

- **Multi-Page Architecture:** Divided into isolated branches (`Free Roam`, `Survival`, `Archives`) to prevent state-bleeding and session corruption. Each mode loads only what it needs.
- **Storage Layer:** A dedicated `storage.js` module handles all persistence via `localStorage`. All read/write operations are routed through this layer — designed for a clean swap to a live database in Phase 2 without touching game logic.
- **Engine:** `app.js` is the single canonical game engine shared across all modes. Mode behaviour is controlled by a `MODE` constant declared per-page before the engine loads.
- **Client-Side Only:** Powered entirely by the user's own Gemini API Key. No servers, no tracking, no data leaves the browser.

---

## 02 // PORTAL STRUCTURE

The entry point (`index.html`) presents three timeline options:

### 01 — FREE ROAM
Unrestricted sandbox. No physics, no permadeath. The AI acts as an omnipotent narrator with zero constraints. Ideal for testing character concepts, high-concept scenarios, or open-ended worldbuilding.

### 02 — 2ND LIFE // SURVIVAL
Hardcore roguelike mode with permadeath.
- **Stats:** Tracks Health (HP), Funds ($), Reputation (REP), and Risk (DANGER) as visual bar indicators that update in real-time.
- **Lethality:** Every action has consequences. Fatal outcomes terminate the session permanently and wipe the local save.
- **Historical Log:** A collapsible in-session event log tracks every key outcome in the current run.

Sub-pages accessible from the portal:
- **NOTABLE_LIVES** — Personal archives of every terminated timeline. Sorted by survival duration. Tracks date, time survived, final funds, reputation, and cause of death.
- **LEADERBOARDS** — *(Phase 2 — requires database integration)*

### 03 — MULTIPLAYER
*(Phase 3 — ad-hoc session play, competitive and co-op modes)*

---

## 03 // PLAYER GUIDE

1. **INITIALIZE:** Upon entry, define your existence. Type your starting identity, location, or situation — e.g., *"I am a fixer operating out of a collapsed city-state in 2031."*
2. **THE TYPEWRITER:** The AI streams its response character-by-character. Tactical choices do not appear until the data stream is complete.
3. **DYNAMIC CHOICES:** After each turn the engine generates 4 context-aware actions. Click to execute or type a custom command directly.
4. **SURVIVAL:** In 2nd Life mode, monitor your stats bar at the top of the screen. HP and RISK bars shift colour as thresholds are crossed — amber at caution levels, red at critical. If HP reaches 0 or the AI triggers a `DEAD` status, the timeline is terminated and archived.

---

## 04 // TECHNICAL MECHANICS

- **JSON Response Engine:** The AI is prompted to return a structured JSON object on every turn — `scene`, `event`, `stats`, `choices`, and `status`. This eliminates brittle text parsing and ensures stat deltas, choice rendering, and death detection are always isolated and reliable.
- **Fallback Parser:** If the model wraps its response in markdown fences, the engine strips them before parsing. If JSON parsing still fails, a regex extraction is attempted before surfacing an error.
- **Typewriter Engine:** Streams responses character-by-character for CRT-terminal immersion.
- **Context Window:** Feeds a rolling log of the last 5 events to the AI on every turn to maintain narrative continuity without exceeding token limits.
- **Settings Panel:** The Gemini API key is managed via an in-UI settings panel (⚙ API button in the header). The key is stored in `localStorage` — do not use on shared or public devices. Server-side key handling is planned for Phase 2.

---

## 05 // FILE STRUCTURE

```
index.html          — Portal / mode selector
free-roam.html      — Free Roam mode
2nd-life.html       — Survival mode
notable-lives.html  — Personal archives
style.css           — All styles (single source of truth)
storage.js          — Persistence layer (localStorage, Phase 2 swap point)
app.js              — Game engine (shared across all modes)
manifest.json       — PWA manifest
```

---

## 06 // INSTALLATION

1. Clone the repository.
2. Deploy to **GitHub Pages** (or any static host).
3. Open the site, click **⚙ API** in the header, and paste your **Gemini API Key**.
4. The key is saved to `localStorage` on your device. You only need to do this once per browser.

To get a Gemini API Key: [aistudio.google.com](https://aistudio.google.com)

---

## 07 // ROADMAP

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Free Roam + Survival single-player | ✓ Operational |
| 1 | Notable Lives personal archives | ✓ Operational |
| 2 | Database integration (Supabase) | Planned |
| 2 | Cross-player Leaderboards | Planned |
| 3 | Multiplayer ad-hoc sessions | Planned |
| 3 | Session creator / rule definition | Planned |
| 3 | Co-op and competitive modes | Planned |

---

**SYSTEM_STATUS: OPERATIONAL**
**MODEL_CORE: GEMINI_2.5_FLASH**
**PERSISTENCE: LOCALSTORAGE // PHASE_2_READY**
