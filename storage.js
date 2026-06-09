/**
 * STORAGE LAYER — nth Life Engine // Phase 2
 * ─────────────────────────────────────────────────────────────────────────────
 * All localStorage functions from Phase 1 remain intact.
 * Supabase functions are added on top — cloud save, run submission, leaderboard.
 *
 * Requires: supabase-client.js loaded before this script.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Storage = (() => {

  // ── API KEY ────────────────────────────────────────────────────────────────
  function getApiKey()    { return localStorage.getItem("my_gemini_key") || null; }
  function setApiKey(key) { localStorage.setItem("my_gemini_key", key.trim()); }
  function clearApiKey()  { localStorage.removeItem("my_gemini_key"); }

  // ── GAME STATE (localStorage) ──────────────────────────────────────────────
  function getLife(mode) {
    const raw = localStorage.getItem(`life_${mode}`);
    return raw ? JSON.parse(raw) : null;
  }
  function saveLife(mode, lifeObj) {
    localStorage.setItem(`life_${mode}`, JSON.stringify(lifeObj));
  }
  function clearLife(mode) {
    localStorage.removeItem(`life_${mode}`);
  }

  // ── PERSONAL BEST (localStorage) ──────────────────────────────────────────
  function getBest() {
    return parseInt(localStorage.getItem("best_survival") || "0", 10);
  }
  function setBest(turns) {
    if (turns > getBest()) localStorage.setItem("best_survival", String(turns));
  }

  // ── LOCAL ARCHIVE (localStorage — Phase 1 fallback) ───────────────────────
  function getArchives() {
    const raw = localStorage.getItem("notable_lives");
    return raw ? JSON.parse(raw) : [];
  }
  function addArchiveEntry(entry) {
    const archives = getArchives();
    archives.push(entry);
    localStorage.setItem("notable_lives", JSON.stringify(archives));
  }
  function clearArchives() {
    localStorage.removeItem("notable_lives");
    localStorage.removeItem("best_survival");
  }

  // ── SCORE FORMULA ──────────────────────────────────────────────────────────
  // Weights defined here. To rebalance: change the multipliers.
  // To add a new stat: add a new weighted term and pass it in scoreParams.
  const SCORE_WEIGHTS = {
    turns:      100,   // primary driver — longevity
    money:        2,   // secondary — wealth
    reputation:  50,   // tertiary — social standing
    danger:      -5,   // penalty — risk at time of death
    // Future params: intelligence: 30, influence: 40, etc.
  };

  function calculateScore(params) {
    const {
      turns      = 0,
      money      = 0,
      reputation = 0,
      danger     = 0,
      // future params destructured here with default 0
    } = params;

    const raw =
      (turns      * SCORE_WEIGHTS.turns)      +
      (money      * SCORE_WEIGHTS.money)       +
      (reputation * SCORE_WEIGHTS.reputation)  +
      (danger     * SCORE_WEIGHTS.danger);

    return Math.max(0, Math.round(raw));
  }
function calculateDisplayScore(params) {
  const { turns = 0, money = 0, reputation = 0 } = params;
  return Math.max(0, Math.round(
    (turns      * SCORE_WEIGHTS.turns) +
    (money      * SCORE_WEIGHTS.money) +
    (reputation * SCORE_WEIGHTS.reputation)
  ));
}
  // ── CLOUD: SUBMIT COMPLETED RUN ────────────────────────────────────────────
  // Called on death. Posts to Supabase `runs` table.
  // Falls back silently if Supabase is unavailable.
  async function saveRun(lifeObj, cause, turns) {
    const score = calculateScore({
      turns,
      money:      lifeObj.money,
      reputation: lifeObj.reputation,
      danger:     lifeObj.danger
    });

    // Always save locally first
    const localEntry = {
      date:     new Date().toLocaleDateString(),
      duration: turns,
      cause,
      rep:      lifeObj.reputation,
      money:    lifeObj.money,
      score
    };
    addArchiveEntry(localEntry);
    setBest(turns);

    // Attempt cloud save
    try {
      const userId = await getCurrentUserId();
      if (!userId) return score; // no session — local only

      const { error } = await supabaseClient
        .from('runs')
        .insert({
          user_id:    userId,
          handle:     localStorage.getItem('nth_handle') || null,
          turns,
          money:      lifeObj.money,
          reputation: lifeObj.reputation,
          danger:     lifeObj.danger,
          score,
          cause,
          events:     lifeObj.events || []
        });

      if (error) console.warn('Cloud run save failed:', error.message);

    } catch (err) {
      console.warn('Cloud run save error:', err.message);
    }

    return score;
  }

  // ── CLOUD: SYNC ACTIVE SESSION ─────────────────────────────────────────────
  // Called after each turn. Upserts active game state to Supabase `sessions`.
  // Falls back silently — game continues locally if this fails.
  async function syncSession(mode, lifeObj) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      await supabaseClient
        .from('sessions')
        .upsert({
          user_id:    userId,
          mode,
          state:      lifeObj,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,mode' });

    } catch (err) {
      console.warn('Session sync error:', err.message);
    }
  }

  // ── CLOUD: LOAD ACTIVE SESSION ─────────────────────────────────────────────
  // Called on game load. Returns cloud state if newer than local, else null.
  async function loadCloudSession(mode) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabaseClient
        .from('sessions')
        .select('state, updated_at')
        .eq('user_id', userId)
        .eq('mode', mode)
        .maybeSingle();

      if (error || !data) return null;

      const localLife = getLife(mode);
      if (!localLife) return data.state;

      // Return whichever was updated more recently
      const cloudTime = new Date(data.updated_at).getTime();
      const localTime = localLife.lastSaved || 0;
      return cloudTime > localTime ? data.state : null;

    } catch (err) {
      console.warn('Cloud session load error:', err.message);
      return null;
    }
  }

  // ── CLOUD: CLEAR ACTIVE SESSION ────────────────────────────────────────────
  async function clearCloudSession(mode) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      await supabaseClient
        .from('sessions')
        .delete()
        .eq('user_id', userId)
        .eq('mode', mode);

    } catch (err) {
      console.warn('Cloud session clear error:', err.message);
    }
  }

  // ── CLOUD: LEADERBOARD ─────────────────────────────────────────────────────
  // Fetches top N runs globally, ordered by score descending.
  async function getLeaderboard(limit = 50) {
    try {
      const { data, error } = await supabaseClient
        .from('runs')
        .select('handle, turns, money, reputation, score, cause, created_at')
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (err) {
      console.warn('Leaderboard fetch error:', err.message);
      return [];
    }
  }

  // ── CLOUD: PERSONAL RUNS ───────────────────────────────────────────────────
  // Fetches all runs for the current anonymous user.
  async function getPersonalRuns() {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null; // null = fall back to localStorage

      const { data, error } = await supabaseClient
        .from('runs')
        .select('handle, turns, money, reputation, score, cause, created_at')
        .eq('user_id', userId)
        .order('score', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (err) {
      console.warn('Personal runs fetch error:', err.message);
      return null;
    }
  }

  // ── HANDLE (optional player name for leaderboard) ──────────────────────────
  function getHandle()        { return localStorage.getItem('nth_handle') || null; }
  function setHandle(handle)  { localStorage.setItem('nth_handle', handle.trim()); }

  return {
    // Phase 1 — localStorage
    getApiKey, setApiKey, clearApiKey,
    getLife, saveLife, clearLife,
    getBest, setBest,
    getArchives, addArchiveEntry, clearArchives,
    // Phase 2 — scoring
    calculateScore,
    calculateDisplayScore,
    SCORE_WEIGHTS,
    // Phase 2 — Supabase
    saveRun,
    syncSession, loadCloudSession, clearCloudSession,
    getLeaderboard,
    getPersonalRuns,
    getHandle, setHandle
  };

})();
