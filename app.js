/**
 * nth Life Engine — app.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Requires: storage.js loaded before this script
 * Requires: const MODE declared before this script ("survival" | "free-roam")
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── STATE ────────────────────────────────────────────────────────────────────

let life = Storage.getLife(MODE) || {
  summary: "",
  events: [],
  health: 100, money: 50, reputation: 0, danger: 0,
  startTime: Date.now(),
  current: MODE === "survival"
    ? "SIMULATION_START: You awaken in a hostile world. Define your existence."
    : "SIMULATION_START: Unrestricted reality. Define your existence."
};

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
  const mins = getSurvivalTime();

  const hpClass   = hp   < 25 ? "danger" : hp   < 50 ? "warn" : "";
  const riskClass = risk > 75 ? "danger" : risk > 40 ? "warn" : "";

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
      <span class="stat-label">TIME</span>
      <span class="stat-value">${mins}M</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">BEST</span>
      <span class="stat-value" style="opacity:0.45">${best}M</span>
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

// ─── ARCHIVE / DEATH RECORDING ────────────────────────────────────────────────

function recordDeath(cause) {
  const duration = getSurvivalTime();
  Storage.addArchiveEntry({
    date:     new Date().toLocaleDateString(),
    duration,
    cause,
    rep:      life.reputation,
    money:    life.money
  });
  Storage.setBest(duration);
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

// ─── DEATH SCREEN ─────────────────────────────────────────────────────────────

function showDeathScreen(cause) {
  const ds = document.getElementById("death-screen");
  if (!ds) return;
  ds.classList.remove("hidden");
  ds.innerHTML = `
    <h1>LIFE_TERMINATED</h1>
    <div class="death-stats">
      <p>SURVIVED: ${getSurvivalTime()} MINUTES</p>
      <p>FINAL_REP: ${life.reputation > 0 ? '+' : ''}${life.reputation}</p>
      <p>FINAL_FUNDS: $${life.money}</p>
    </div>
    <p class="death-cause">CAUSE: ${cause.toUpperCase()}</p>
    <p style="opacity:0.4; font-size:0.65rem">TIMELINE_ARCHIVED</p>
    <button id="death-dismiss">[ REBOOT_TIMELINE ]</button>
  `;
  document.getElementById("death-dismiss").onclick = () => {
    Storage.clearLife(MODE);
    location.reload();
  };
}

// ─── RESET ────────────────────────────────────────────────────────────────────

function resetLife() {
  if (confirm("TERMINATE TIMELINE? THIS CANNOT BE UNDONE.")) {
    Storage.clearLife(MODE);
    location.reload();
  }
}

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────

function openSettings() {
  // Toggle: if already open, close it
  const existing = document.getElementById("settings-panel");
  if (existing) { existing.remove(); return; }

  const panel = document.createElement("div");
  panel.id = "settings-panel";
  panel.className = "settings-panel";

  const key = Storage.getApiKey();
  const maskedKey = key
    ? key.slice(0, 6) + "••••••••••••" + key.slice(-4)
    : null;

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

    <div class="settings-warning">
      ⚠ KEY STORED IN LOCALSTORAGE — VISIBLE TO ANY SCRIPT ON THIS PAGE.
      DO NOT USE ON SHARED OR PUBLIC DEVICES.
      SERVER-SIDE KEY HANDLING ARRIVES IN PHASE 2.
    </div>

    <div class="settings-actions">
      <button onclick="document.getElementById('settings-panel').remove()">CLOSE</button>
      <button class="btn-danger" onclick="clearKeyFromPanel()">CLEAR KEY</button>
    </div>
  `;

  // Anchor inside .container so it slides down from the header
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
  const panel = document.getElementById("settings-panel");
  if (panel) panel.remove();
  openSettings(); // reopen to show updated masked key
}

function clearKeyFromPanel() {
  if (confirm("CLEAR API KEY FROM STORAGE?")) {
    Storage.clearApiKey();
    const panel = document.getElementById("settings-panel");
    if (panel) panel.remove();
    openSettings();
  }
}

// ─── SEND MESSAGE / GEMINI CALL ───────────────────────────────────────────────

async function sendMessage() {
  const input   = document.getElementById("userInput");
  const userText = input.value.trim();
  const API_KEY  = Storage.getApiKey();

  if (!userText) return;

  if (!API_KEY) {
    openSettings();
    return;
  }

  input.value = "";

  const old = document.querySelector(".choice-container");
  if (old) old.remove();

  renderMessage("user", userText);
  window.scrollTo(0, document.body.scrollHeight);
  document.getElementById("loading").classList.remove("hidden");

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

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await resp.json();
    document.getElementById("loading").classList.add("hidden");

    if (!resp.ok) {
      const errMsg = data?.error?.message || `API_ERROR_${resp.status}`;
      renderMessage("ai", `ERROR: ${errMsg}`);
      return;
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip accidental markdown fences before parsing
    const cleaned = raw.replace(/```json|```/gi, "").trim();

    let parsed = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: extract first JSON object from within the string
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* still null */ }
      }
    }

    if (!parsed) {
      renderMessage("ai", "ERROR: RESPONSE_MALFORMED // ENGINE_PARSE_FAILURE");
      return;
    }

    // Apply stat deltas (survival only)
    if (MODE === "survival" && parsed.stats) {
      const s = parsed.stats;
      if (typeof s.hp         === "number") life.health     += s.hp;
      if (typeof s.money      === "number") life.money      += s.money;
      if (typeof s.reputation === "number") life.reputation += s.reputation;
      if (typeof s.danger     === "number") life.danger     += s.danger;
    }

    clampStats();
    life.current = parsed.scene || life.current;
    if (parsed.event) life.events.push(parsed.event);
    Storage.saveLife(MODE, life);

    renderStats();
    renderHistory();

    renderMessage("ai", parsed.scene || "...", () => {
      if (parsed.status === "DEAD" && MODE === "survival") {
        recordDeath(parsed.event || "Unknown cause");
        showDeathScreen(parsed.event || "Unknown cause");
      } else if (parsed.choices && parsed.choices.length > 0) {
        renderChoices(parsed.choices);
      }
    });

  } catch (err) {
    document.getElementById("loading").classList.add("hidden");
    renderMessage("ai", "ERROR: ENGINE_OFFLINE // CHECK_CONNECTION");
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

window.onload = () => {
  if (!Storage.getApiKey()) openSettings();
  renderStats();
  renderHistory();
  renderMessage("ai", life.current);
};
