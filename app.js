let API_KEY = localStorage.getItem("my_gemini_key");
const STORAGE_KEY = `life_${MODE}`;

let life = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    summary: "",
    events: [],
    health: 100, money: 50, reputation: 0, danger: 0,
    startTime: Date.now(),
    current: MODE === "survival" 
        ? "SIMULATION_START: You awaken in a hostile world. Define your existence." 
        : "SIMULATION_START: Unrestricted reality. Define your existence."
};

// --- FIX: EXPLICIT REBOOT ---
function resetLife() {
    if (confirm("TERMINATE TIMELINE?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

function clampStats() {
    life.health = Math.max(0, Math.min(100, life.health));
    life.money = Math.max(0, life.money);
    life.reputation = Math.max(-100, Math.min(100, life.reputation));
    life.danger = Math.max(0, Math.min(100, life.danger));
}

function renderStats() {
    if (MODE !== "survival") return;
    const stats = document.getElementById("stats");
    const best = localStorage.getItem("best_survival") || "0";
    stats.innerHTML = `HP:${life.health} | $:${life.money} | REP:${life.reputation} | RISK:${life.danger} | BEST:${best}M`;
}

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
                div.innerHTML += text[i++];
                chat.scrollTop = chat.scrollHeight;
            } else {
                clearInterval(interval);
                if (callback) callback();
            }
        }, 15);
    } else {
        div.innerText = text;
        chat.scrollTop = chat.scrollHeight;
    }
}

// --- FIX: CLEAN CHOICE PARSING ---
function renderChoices(actionsString) {
    const oldChoices = document.querySelector(".choice-container");
    if (oldChoices) oldChoices.remove();
    const choiceContainer = document.createElement("div");
    choiceContainer.className = "choice-container";
    
    // Split and scrub brackets [] and numbers 1. from AI output
    const actions = actionsString.split(",")
        .map(a => a.trim().replace(/[\[\]]/g, "").replace(/^\d+\.\s*/, ""))
        .slice(0, 4);

    actions.forEach(act => {
        if (!act) return;
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = `> ${act}`;
        btn.onclick = () => { document.getElementById("userInput").value = act; sendMessage(); };
        choiceContainer.appendChild(btn);
    });
    document.getElementById("chat").appendChild(choiceContainer);
}

async function sendMessage() {
    const input = document.getElementById("userInput");
    const userText = input.value.trim();
    if (!userText || !API_KEY) return;
    input.value = "";
    const oldChoices = document.querySelector(".choice-container");
    if (oldChoices) oldChoices.remove();
    renderMessage("user", userText);
    document.getElementById("loading").classList.remove("hidden");

    const modeRules = MODE === "survival" 
        ? "RULES: Brutal survival. Lethal consequences. Track stats. Output choices."
        : "RULES: Sandbox. No constraints. Ignore stats. Output choices.";

    const prompt = `
        SYSTEM: nth life engine | MODE: ${MODE}
        ${modeRules}
        PLAYER_HISTORY: ${life.summary}
        CURRENT_SCENE: ${life.current}
        PLAYER_ACTION: ${userText}

        FORMAT:
        SCENE: [Narrative]
        EVENT: [Log]
        ${MODE === "survival" ? "STATS: hp +/-x, money +/-x, reputation +/-x, danger +/-x" : ""}
        CHOICES: [Action 1, Action 2, Action 3, Action 4]
        STATUS: [ALIVE or DEAD]
    `;

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await resp.json();
        document.getElementById("loading").classList.add("hidden");
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "ERROR";

        // --- FIX: ROBUST PARSING FALLBACKS ---
        const scene = raw.split("EVENT:")[0].replace("SCENE:", "").trim();
        const eventPart = raw.split("EVENT:")[1] || "";
        const event = eventPart.split("STATS:")[0].split("CHOICES:")[0].trim();
        const statsPart = raw.split("STATS:")[1] || "";
        const stats = statsPart.split("CHOICES:")[0].trim();
        const choicesPart = raw.split("CHOICES:")[1] || "";
        const choices = choicesPart.split("STATUS:")[0].trim();
        const statusPart = raw.split("STATUS:")[1] || "ALIVE";
        const status = statusPart.trim();

        if (MODE === "survival" && stats) {
            stats.split(",").forEach(s => {
                const p = s.trim().toLowerCase().split(" ");
                if (p.length >= 2) {
                    const val = parseInt(p[1]);
                    if (!isNaN(val)) {
                        if (p[0].includes("hp")) life.health += val;
                        if (p[0].includes("money") || p[0].includes("$")) life.money += val;
                        if (p[0].includes("rep")) life.reputation += val;
                        if (p[0].includes("danger")) life.danger += val;
                    }
                }
            });
        }
        clampStats();
        life.current = scene;
        if (event) life.events.push(event);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(life));
        renderStats();

        renderMessage("ai", scene, () => {
            if (status.includes("DEAD") && MODE === "survival") {
                const ds = document.getElementById("death-screen");
                ds.classList.remove("hidden");
                ds.innerHTML = `<h1>LIFE TERMINATED</h1><p>CAUSE: ${event}</p>`;
                setTimeout(() => { localStorage.removeItem(STORAGE_KEY); location.reload(); }, 5000);
            } else if (choices && choices.length > 5) { 
                renderChoices(choices); 
            }
        });
    } catch (e) { 
        document.getElementById("loading").classList.add("hidden"); 
        renderMessage("ai", "ERROR: ENGINE_FAILURE"); 
    }
}

window.onload = () => { renderStats(); renderMessage("ai", life.current); };
