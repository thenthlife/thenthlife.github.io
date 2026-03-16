/**
 * STORAGE LAYER — nth Life Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * All persistence is routed through this module.
 * Phase 2: swap the localStorage calls here for Supabase/Firebase.
 * Nothing in app.js or the HTML pages needs to change when that happens.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Storage = (() => {

  // ── API KEY ────────────────────────────────────────────────────────────────
  function getApiKey()      { return localStorage.getItem("my_gemini_key") || null; }
  function setApiKey(key)   { localStorage.setItem("my_gemini_key", key.trim()); }
  function clearApiKey()    { localStorage.removeItem("my_gemini_key"); }

  // ── GAME STATE ─────────────────────────────────────────────────────────────
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

  // ── PERSONAL BEST ──────────────────────────────────────────────────────────
  function getBest() {
    return parseInt(localStorage.getItem("best_survival") || "0", 10);
  }
  function setBest(minutes) {
    if (minutes > getBest()) localStorage.setItem("best_survival", String(minutes));
  }

  // ── NOTABLE LIVES ARCHIVE ──────────────────────────────────────────────────
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

  return {
    getApiKey, setApiKey, clearApiKey,
    getLife, saveLife, clearLife,
    getBest, setBest,
    getArchives, addArchiveEntry, clearArchives
  };

})();
