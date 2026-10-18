# THE nᵗʰ LIFE // SIMULATION ENGINE

The nᵗʰ Life is a brutalist, AI-driven life simulator designed for 2026 tactical realism. It runs in the browser using the Gemini 2.5 Flash API to generate logical, non-sugarcoated consequences for every player action.

---

## 01 // ARCHITECTURE

- **Multi-Page Architecture:** Isolated pages for `Free Roam`, `Survival`, `Notable Lives`, and `Leaderboard` prevent state-bleeding and session corruption. Each page loads only what it needs.
- **Storage Layer:** `storage.js` is the single point for all persistence. localStorage remains as a fallback; Supabase is layered on top for cloud saves, run history, and the leaderboard. Game logic never talks to a backend directly.
- **Anonymous Identity:** `supabase-client.js` signs each player in anonymously and silently on first load. No signup, no prompt. Runs and cloud saves are tied to that identity. A future account upgrade keeps the same user ID, so no data is lost.
- **Engine:** `app.js` is the single game engine shared by all modes. Mode behaviour is set by a `MODE` constant declared per page.
- **Your Gemini key stays on your device.** It is stored in localStorage and sent only to Google's API. Game data (runs, scores, handle, cloud save) is stored in Supabase.

---

## 02 // PORTAL STRUCTURE

### 01 — FREE ROAM
Unrestricted sandbox. No physics, no permadeath. The AI acts as an omnipotent narrator.

### 02 — 2ND LIFE // SURVIVAL
Hardcore roguelike with permadeath.
- **Stats:** HP, Funds ($), Reputation (REP), and Risk, shown as live bars that shift amber and red at thresholds.
- **Turns + Score:** every successful action advances the turn counter and the live score.
- **Cloud Save:** the active run syncs to Supabase after every turn.
- **Death:** the run is scored, archived, and (if it is your best) placed on the global leaderboard.

Sub-pages:
- **NOTABLE_LIVES** — your full run history, sorted by score. Reads from the cloud with a localStorage fallback.
- **LEADERBOARDS** — global rankings. **One entry per player: their best run only.** It updates only if a new run beats the previous best.

### 03 — MULTIPLAYER
*(Phase 3 — ad-hoc sessions, competitive and co-op)*

---

## 03 // PLAYER GUIDE

1. **THEME:** on first visit, choose an interface theme. Change it any time from the portal footer or the in-game ⚙ settings panel.
2. **INTRO SLIDES:** each mode opens with a short swipeable briefing (arrow keys on desktop). Use SKIP to bypass.
3. **INITIALIZE:** define your existence — identity, location, situation.
4. **THE TYPEWRITER:** wait for the response to finish streaming; choices appear when it completes.
5. **CHOICES:** 4 contextual actions each turn. Click one or type your own command.
6. **HANDLE:** set an operator callsign in ⚙ settings. It appears on the leaderboard.
7. **API ERRORS:** transient errors (high demand, network) are retried automatically in the background while the loading animation continues. Only if all attempts fail do you see a `[ RETRY ]` button, which re-sends your exact input.

---

## 04 // THEMES

Nine themes, chosen on first visit and stored per device.

| Dark | Light |
|------|-------|
| TERMINAL (default CRT green) | PAPER (clean typewriter) |
| VOID (minimal white) | MATRIX LIGHT (inverted terminal) |
| BLOOD (aggressive red) | BLUEPRINT (technical blue) |
| AMBER (Commodore warm) | |
| ICE (cold sci-fi) | |
| SYNTHWAVE (neon retrowave) | |

Themes are CSS variable sets in `style.css`. Light themes additionally use a shared `.theme-light` class for structural overrides (no text glow, lighter scanlines, light overlays).

---

## 05 // TECHNICAL MECHANICS

- **JSON Response Engine:** each turn the model returns a structured object — `scene`, `event`, `stats`, `choices`, `status` — so stat deltas, choices, and death detection are isolated and reliable. Markdown fences are stripped; a regex fallback extracts JSON if needed.
- **Silent Retry:** up to 3 attempts per input, 2s apart, for 429/5xx, empty, or malformed responses. Auth and bad-request errors (400/401/403) are never retried. The turn counter and stats only change on success.
- **Score Formula:** `(turns × 100) + (money × 2) + (reputation × 50) − (danger × 5)`. Weights live in one object (`SCORE_WEIGHTS`) in `storage.js`, so rebalancing or adding a stat is a single edit. The live in-run score omits the danger penalty; the final score at death includes it.
- **Context Window:** the last 5 events are sent to the model each turn.
- **Output Escaping:** all user- and AI-supplied text rendered via `innerHTML` (handles, causes, event log) passes through `escapeHTML()`.

---

## 06 // FILE STRUCTURE

```
index.html            — Portal / mode selector / boot sequence
free-roam.html        — Free Roam mode
2nd-life.html         — Survival mode
notable-lives.html    — Personal run history
leaderboard.html      — Global best-run rankings
waitlist.html         — Founding Operator registration (Supabase)
style.css             — All styles and theme definitions
theme.js              — Theme engine and selector
slides.js             — Mode intro slides
storage.js            — Persistence layer + escapeHTML helper
supabase-client.js    — Supabase init + anonymous auth
app.js                — Game engine
manifest.json         — PWA manifest
```

---

## 07 // INSTALLATION

1. Clone the repository and deploy to **GitHub Pages** (or any static host).
2. Open the site, click **⚙ API**, and paste your **Gemini API Key** ([aistudio.google.com](https://aistudio.google.com)).
3. Optionally set an **Operator Handle** in the same panel.

### Self-hosting the backend (Supabase)

1. Create a Supabase project.
2. **Authentication → Providers → enable "Anonymous Sign-ins"** (required; the game cannot save runs without it).
3. Run the SQL below in the SQL Editor.
4. Put your project URL and anon key in `supabase-client.js` and `waitlist.html`. Use the legacy `eyJ…` anon key for raw REST calls.

```sql
-- Full run history
create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  handle text, turns integer not null default 0,
  money integer not null default 0, reputation integer not null default 0,
  danger integer not null default 0, score integer not null default 0,
  cause text, events jsonb default '[]',
  created_at timestamptz not null default now()
);

-- Active session (cloud save)
create table if not exists sessions (
  user_id uuid references auth.users(id) on delete cascade,
  mode text not null, state jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, mode)
);

-- Leaderboard: one row per player, best score only
create table if not exists leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text, turns integer not null default 0,
  money integer not null default 0, reputation integer not null default 0,
  score integer not null default 0, cause text,
  updated_at timestamptz not null default now()
);

create or replace function update_leaderboard_if_better()
returns trigger as $$
begin
  if (TG_OP = 'UPDATE' and NEW.score <= OLD.score) then
    return OLD;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger leaderboard_score_guard
  before update on leaderboard
  for each row execute function update_leaderboard_if_better();

-- Policies
create policy "insert_own_run" on runs for insert to anon, authenticated with check (auth.uid() = user_id);
create policy "read_all_runs" on runs for select to anon, authenticated using (true);

create policy "select_own_session" on sessions for select to anon, authenticated using (auth.uid() = user_id);
create policy "insert_own_session" on sessions for insert to anon, authenticated with check (auth.uid() = user_id);
create policy "update_own_session" on sessions for update to anon, authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_session" on sessions for delete to anon, authenticated using (auth.uid() = user_id);

create policy "insert_own_leaderboard" on leaderboard for insert to anon, authenticated with check (auth.uid() = user_id);
create policy "update_own_leaderboard" on leaderboard for update to anon, authenticated using (auth.uid() = user_id);
create policy "read_all_leaderboard" on leaderboard for select to anon, authenticated using (true);

-- Grants
grant usage on schema public to anon, authenticated;
grant select, insert on table runs to anon, authenticated;
grant select, insert, update, delete on table sessions to anon, authenticated;
grant select, insert, update on table leaderboard to anon, authenticated;
```

The `waitlist` table (email, handle, source, interest, status) needs an insert-only policy for `anon` and matching grants.

---

## 08 // SECURITY NOTES

- **The leaderboard is currently unverified.** Game logic and the Gemini call run in the browser, so a technically skilled user can submit a fabricated score. This is acceptable for testing and is the reason server-side validation (Phase 2b) comes before any competitive or paid launch.
- The Supabase anon key is public by design; row-level security policies are the security boundary.
- The Gemini key is stored in localStorage. Do not use on shared devices.

---

## 09 // ROADMAP

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Free Roam + Survival | ✓ Operational |
| 2 | Supabase, anonymous identity, cloud save | ✓ Operational |
| 2 | Turn-based scoring + best-run leaderboard | ✓ Operational |
| 2 | Themes (9), intro slides, silent retry | ✓ Operational |
| 2 | Founding Operator waitlist | ✓ Operational |
| 2b | Server-side Gemini calls (Edge Function) | Planned |
| 2b | Verified run validation / session tokens | Planned |
| 2b | Content moderation for hosted version | Planned |
| 3 | Multiplayer ad-hoc sessions | Planned |
| 3 | Email / password accounts | Planned |
| PWA | Service worker, install prompt | Planned |

---

**SYSTEM_STATUS: OPERATIONAL**
**MODEL_CORE: GEMINI_2.5_FLASH**
**PERSISTENCE: SUPABASE // ANONYMOUS_AUTH_ACTIVE**
**LEADERBOARD: LIVE // UNVERIFIED**