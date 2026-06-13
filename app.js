/**
 * nth Life Engine — app.js // Phase 2
 * ─────────────────────────────────────────────────────────────────────────────
 * Requires (in this load order):
 *   1. CDN: supabase-js
 *   2. supabase-client.js
 *   3. storage.js
 *   4. const MODE declared per page
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── STATE ────────────────────────────────────────────────────────────────────

let life = Storage.getLife(MODE) || {
  summary: "",
  events: [],
  health: 100, money: 50, reputation: 0, danger: 0,
  turns: 0,
  startTime: Date.now(),
  lastSaved: Date.now(),
  current: MODE === "survival"
    ? "SIMULATION_START: You awaken in a hostile world. Define your existence."
    : "SIMULATION_START: Unrestricted reality. Define your existence."
};

// Ensure turns exists on saves from Phase 1 that predate this field
if (typeof life.turns !== 'number') life.turns = 0;

// ─── TIME ─────────────────────────────────────────────────────────────────────

function getSurvivalTime() {
  return Math.floor((Date.now() - life.startTime) / 60000);
}

// ─── STATS ────────────────────────────────────────────────────────────────────

function clampStats() {
  life.health     = Math.max(0,    Math.min(100, life.health));
  life.money      = Math.max(0,    life.money);
  life.reputation = Math.max(-100, Math.min(100, life.reputation));
  life.danger     = Math.max(0,    Math.min(100, life.danger));
}

function renderStats() {
  if (MODE !== "survival") return;
  const el = document.getElementById("stats");
  if (!el) return;

  const hp   = life.health;
  const risk = life.danger;
  const best = Storage.getBest();
  const turns = life.turns;

  const hpClass   = hp   < 25 ? "danger" : hp   < 50 ? "warn" : "";
  const riskClass = risk > 75 ? "danger" : risk > 40 ? "warn" : "";

  // Live score preview
  const liveScore = Storage.calculateScore({
    turns,
    money:      life.money,
    reputation: life.reputation,
    danger:     life.danger
  });

  el.innerHTML = `
    <div class="stat-item">
      <span class="stat-label">HP</span>
      <span class="stat-value" style="color:${hp < 25 ? 'var(--death-red)' : 'inherit'}">${hp}</span>
      <div class="stat-bar"><div class="stat-bar-fill ${hpClass}" style="width:${hp}%"></div></div>
    </div>
    <div class="stat-item">
      <span class="stat-label">$FUNDS</span>
      <span class="stat-value">${life.money}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">REP</span>
      <span class="stat-value">${life.reputation > 0 ? '+' : ''}${life.reputation}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">RISK</span>
      <span class="stat-value" style="color:${risk > 75 ? 'var(--death-red)' : 'inherit'}">${risk}</span>
      <div class="stat-bar"><div class="stat-bar-fill ${riskClass}" style="width:${risk}%"></div></div>
    </div>
    <div class="stat-item">
      <span class="stat-label">TURNS</span>
      <span class="stat-value">${turns}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">SCORE</span>
      <span class="stat-value" style="color:var(--matrix-green)">${liveScore.toLocaleString()}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">BEST</span>
      <span class="stat-value" style="opacity:0.45">${best}</span>
    </div>
  `;
}

// ─── HISTORY ──────────────────────────────────────────────────────────────────

function toggleHistory() {
  const log = document.getElementById("history-content");
  if (log) log.classList.toggle("hidden");
}

function renderHistory() {
  const container = document.getElementById("history-content");
  if (!container) return;
  if (life.events.length === 0) {
    container.innerHTML = '<div class="log-entry" style="opacity:0.4">NO_EVENTS_RECORDED</div>';
    return;
  }
  container.innerHTML = life.events
    .map((e, i) => `<div class="log-entry">[${String(i + 1).padStart(2, '0')}] ${e}</div>`)
    .join("");
  container.scrollTop = container.scrollHeight;
}

// ─── DEATH / RUN SUBMISSION ───────────────────────────────────────────────────

async function handleDeath(cause) {
  // Submit run to Supabase and get final score back
  // saveRun also handles local archive and personal best
  const finalScore = await Storage.saveRun(life, cause, life.turns);

  // Clear cloud session — run is over
  await Storage.clearCloudSession(MODE);

  showDeathScreen(cause, finalScore);
}

function showDeathScreen(cause, finalScore) {
  const ds = document.getElementById("death-screen");
  if (!ds) return;
  ds.classList.remove("hidden");
  ds.innerHTML = `
    <h1>LIFE_TERMINATED</h1>
    <div class="death-stats">
      <p>TURNS_SURVIVED: ${life.turns}</p>
      <p>FINAL_SCORE: ${finalScore ? finalScore.toLocaleString() : '—'}</p>
      <p>FINAL_REP: ${life.reputation > 0 ? '+' : ''}${life.reputation}</p>
      <p>FINAL_FUNDS: $${life.money}</p>
    </div>
    <p class="death-cause">CAUSE: ${cause.toUpperCase()}</p>
    <p style="opacity:0.4; font-size:0.65rem">TIMELINE_ARCHIVED // LEADERBOARD_UPDATED</p>
    <button id="death-dismiss">[ REBOOT_TIMELINE ]</button>
  `;
  document.getElementById("death-dismiss").onclick = () => {
    Storage.clearLife(MODE);
    location.reload();
  };
}

// ─── RESET ────────────────────────────────────────────────────────────────────

async function resetLife() {
  if (confirm("TERMINATE TIMELINE? THIS CANNOT BE UNDONE.")) {
    Storage.clearLife(MODE);
    await Storage.clearCloudSession(MODE);
    location.reload();
  }
}

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────

function openSettings() {
  const existing = document.getElementById("settings-panel");
  if (existing) { existing.remove(); return; }

  const panel = document.createElement("div");
  panel.id = "settings-panel";
  panel.className = "settings-panel";

  const key = Storage.getApiKey();
  const maskedKey = key
    ? key.slice(0, 6) + "••••••••••••" + key.slice(-4)
    : null;

  const handle = Storage.getHandle();

  panel.innerHTML = `
    <h2>// SYSTEM_SETTINGS</h2>

    <div class="settings-row">
      <span class="settings-label">KEY STATUS</span>
      <span class="settings-key-status" style="color:${key ? 'var(--matrix-green)' : 'var(--death-red)'}">
        ${key ? '● ACTIVE: ' + maskedKey : '● NO KEY LOADED'}
      </span>
    </div>

    <div class="settings-row">
      <span class="settings-label">SET / UPDATE GEMINI API KEY</span>
      <div class="settings-input-row">
        <input type="password" id="key-input" placeholder="PASTE_KEY_HERE..." autocomplete="off" />
        <button onclick="saveKeyFromPanel()">SAVE</button>
      </div>
    </div>

    <div class="settings-row">
      <span class="settings-label">OPERATOR HANDLE <span style="opacity:0.4; font-size:0.6rem">// SHOWN ON LEADERBOARD</span></span>
      <div class="settings-input-row">
        <input type="text" id="handle-input" placeholder="${handle || 'SET_YOUR_CALLSIGN...'}"
               maxlength="32" autocorrect="off" autocapitalize="off" value="${handle || ''}" />
        <button onclick="saveHandleFromPanel()">SAVE</button>
      </div>
    </div>

    <div class="settings-warning">
      ⚠ GEMINI KEY STORED IN LOCALSTORAGE — DO NOT USE ON SHARED DEVICES.
      SERVER-SIDE KEY HANDLING ARRIVES IN PHASE 2B.
    </div>

    <div class="settings-actions">
      <button onclick="document.getElementById('settings-panel').remove()">CLOSE</button>
      <button class="btn-danger" onclick="clearKeyFromPanel()">CLEAR KEY</button>
    </div>
  `;

  const container = document.querySelector(".container");
  if (container) {
    container.insertBefore(panel, container.firstChild.nextSibling);
  } else {
    document.body.appendChild(panel);
  }
}

function saveKeyFromPanel() {
  const input = document.getElementById("key-input");
  if (!input || !input.value.trim()) return;
  Storage.setApiKey(input.value.trim());
  document.getElementById("settings-panel").remove();
  openSettings();
}

function saveHandleFromPanel() {
  const input = document.getElementById("handle-input");
  if (!input || !input.value.trim()) return;
  Storage.setHandle(input.value.trim());
  document.getElementById("settings-panel").remove();
  openSettings();
}

function clearKeyFromPanel() {
  if (confirm("CLEAR API KEY FROM STORAGE?")) {
    Storage.clearApiKey();
    document.getElementById("settings-panel").remove();
    openSettings();
  }
}

// ─── RENDER MESSAGE ───────────────────────────────────────────────────────────

function renderMessage(role, text, callback) {
  const chat = document.getElementById("chat");
  if (!chat) return;

  const div = document.createElement("div");
  div.className = `message ${role === "ai" ? "ai-message" : "user-message"}`;
  chat.appendChild(div);

  if (role === "ai") {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        div.textContent += text[i++];
        chat.scrollTop = chat.scrollHeight;
        window.scrollTo(0, document.body.scrollHeight);
      } else {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 15);
  } else {
    div.textContent = text;
    chat.scrollTop = chat.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  }
}

// ─── RENDER CHOICES ───────────────────────────────────────────────────────────

function renderChoices(actions) {
  const old = document.querySelector(".choice-container");
  if (old) old.remove();
  if (!actions || actions.length === 0) return;

  const container = document.createElement("div");
  container.className = "choice-container";

  actions.slice(0, 4).forEach(act => {
    if (!act || !act.trim()) return;
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = `> ${act.trim()}`;
    btn.onclick = () => {
      document.getElementById("userInput").value = act.trim();
      sendMessage();
    };
    container.appendChild(btn);
  });

  document.getElementById("chat").appendChild(container);
}

// ─── RETRY CONFIG ─────────────────────────────────────────────────────────────

const MAX_RETRIES   = 3;
const RETRY_DELAY   = 2000; // ms between silent retries
const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── LOADING TEXT CYCLE (keeps user engaged during retries) ───────────────────

const LOADING_STATES = [
  "ANALYZING_PROBABILITY_VECTORS...",
  "RECALCULATING_TIMELINE...",
  "SYNCHRONIZING_NEURAL_LINK...",
  "PROCESSING_QUANTUM_STATE..."
];
let _loadingInterval = null;

function startLoadingAnimation() {
  const el = document.getElementById("loading");
  if (!el) return;
  el.classList.remove("hidden");
  let i = 0;
  el.textContent = LOADING_STATES[0];
  _loadingInterval = setInterval(() => {
    i = (i + 1) % LOADING_STATES.length;
    el.textContent = LOADING_STATES[i];
  }, 2000);
}

function stopLoadingAnimation() {
  const el = document.getElementById("loading");
  if (el) el.classList.add("hidden");
  if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
}

// ─── GEMINI API CALL (single attempt) ─────────────────────────────────────────

async function callGemini(prompt, apiKey) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );

  // Non-retryable auth errors — throw immediately
  if (resp.status === 400 || resp.status === 401 || resp.status === 403) {
    const data = await resp.json();
    throw { retryable: false, message: data?.error?.message || `API_ERROR_${resp.status}` };
  }

  // Retryable server errors
  if (RETRYABLE_CODES.has(resp.status)) {
    throw { retryable: true, message: `HTTP_${resp.status}` };
  }

  if (!resp.ok) {
    const data = await resp.json();
    throw { retryable: false, message: data?.error?.message || `API_ERROR_${resp.status}` };
  }

  const data = await resp.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!raw) throw { retryable: true, message: "EMPTY_RESPONSE" };

  const cleaned = raw.replace(/```json|```/gi, "").trim();

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch { /* still null */ }
    }
  }

  // Malformed JSON is retryable — model occasionally wraps unexpectedly
  if (!parsed) throw { retryable: true, message: "RESPONSE_MALFORMED" };

  return parsed;
}

// ─── SHOW MANUAL RETRY BUTTON ─────────────────────────────────────────────────

function showRetryButton(userText) {
  // Remove any existing retry prompt
  const existing = document.getElementById("retry-prompt");
  if (existing) existing.remove();

  const wrap = document.createElement("div");
  wrap.id = "retry-prompt";
  wrap.style.cssText = `
    display: flex; align-items: center; gap: 12px;
    padding: 10px; opacity: 0.8;
  `;

  const msg = document.createElement("span");
  msg.style.cssText = "font-size: 0.7rem; letter-spacing: 1px; opacity: 0.6;";
  msg.textContent = "ENGINE_OFFLINE // ALL RETRIES EXHAUSTED";

  const btn = document.createElement("button");
  btn.style.cssText = "font-size: 0.7rem; padding: 8px 16px; letter-spacing: 1px;";
  btn.textContent = "[ RETRY ]";
  btn.onclick = () => {
    wrap.remove();
    document.getElementById("userInput").value = userText;
    sendMessage();
  };

  wrap.appendChild(msg);
  wrap.appendChild(btn);
  document.getElementById("chat").appendChild(wrap);
  document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
}

// ─── SEND MESSAGE / GEMINI CALL WITH SILENT RETRY ─────────────────────────────

async function sendMessage() {
  const input    = document.getElementById("userInput");
  const userText = input.value.trim();
  const API_KEY  = Storage.getApiKey();

  if (!userText) return;
  if (!API_KEY) { openSettings(); return; }

  input.value = "";

  const old = document.querySelector(".choice-container");
  if (old) old.remove();

  // Remove any previous retry prompt
  const oldRetry = document.getElementById("retry-prompt");
  if (oldRetry) oldRetry.remove();

  renderMessage("user", userText);
  window.scrollTo(0, document.body.scrollHeight);
  startLoadingAnimation();

  const modeRules = MODE === "survival"
    ? "Brutal survival simulation. Apply realistic, lethal consequences for dangerous decisions. Track all stats carefully."
    : "Unrestricted sandbox. No constraints whatsoever. Set all stat deltas to 0.";

  const prompt = `You are the engine of a text-based life simulation game.
MODE: ${MODE}
RULES: ${modeRules}

PLAYER_HISTORY (last 5 events):
${life.events.slice(-5).map((e, i) => `${i + 1}. ${e}`).join("\n") || "None yet."}

CURRENT_SCENE: ${life.current}
PLAYER_ACTION: ${userText}

Respond ONLY with a single valid JSON object. No markdown fences, no preamble, no explanation outside the JSON.

The JSON must match this exact shape:
{
  "scene": "2-4 sentence narrative of what happens next",
  "event": "one short log entry summarising the key outcome",
  "stats": { "hp": 0, "money": 0, "reputation": 0, "danger": 0 },
  "choices": ["action one", "action two", "action three", "action four"],
  "status": "ALIVE"
}

Rules:
- stats values are INTEGER deltas (positive or negative). Zero means no change.
- choices: exactly 4 short strings. No commas inside any single choice string. No numbering.
- status: only "DEAD" if health reaches zero or a clearly fatal event occurs in survival mode. Otherwise "ALIVE".
- For free-roam mode all stat deltas must be 0.`;

  // ── RETRY LOOP ───────────────────────────────────────────────────────────────
  let parsed = null;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      parsed = await callGemini(prompt, API_KEY);
      break; // success — exit loop
    } catch (err) {
      lastError = err;
      if (!err.retryable || attempt === MAX_RETRIES) break; // non-retryable or out of attempts
      await sleep(RETRY_DELAY); // wait before next attempt, animation keeps running
    }
  }

  stopLoadingAnimation();

  // ── ALL RETRIES FAILED ────────────────────────────────────────────────────────
  if (!parsed) {
    showRetryButton(userText);
    return;
  }

  // ── SUCCESS — apply result ────────────────────────────────────────────────────

  // Apply stat deltas (survival only)
  if (MODE === "survival" && parsed.stats) {
    const s = parsed.stats;
    if (typeof s.hp         === "number") life.health     += s.hp;
    if (typeof s.money      === "number") life.money      += s.money;
    if (typeof s.reputation === "number") life.reputation += s.reputation;
    if (typeof s.danger     === "number") life.danger     += s.danger;
  }

  clampStats();

  // Increment turn counter (survival only, on success only)
  if (MODE === "survival") life.turns += 1;

  life.current   = parsed.scene || life.current;
  life.lastSaved = Date.now();
  if (parsed.event) life.events.push(parsed.event);

  Storage.saveLife(MODE, life);
  if (MODE === "survival") Storage.syncSession(MODE, life);

  renderStats();
  renderHistory();

  renderMessage("ai", parsed.scene || "...", async () => {
    if (parsed.status === "DEAD" && MODE === "survival") {
      await handleDeath(parsed.event || "Unknown cause");
    } else if (parsed.choices && parsed.choices.length > 0) {
      renderChoices(parsed.choices);
    }
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

window.onload = async () => {
  // Initialise anonymous Supabase session silently
  await ensureAnonymousSession();

  // Attempt to load cloud session if newer than local
  if (MODE === "survival") {
    const cloudLife = await Storage.loadCloudSession(MODE);
    if (cloudLife) {
      life = cloudLife;
      if (typeof life.turns !== 'number') life.turns = 0;
    }
  }

  if (!Storage.getApiKey()) openSettings();
  renderStats();
  renderHistory();
  renderMessage("ai", life.current);
};
