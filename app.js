let API_KEY = localStorage.getItem("my_gemini_key");
const STORAGE_KEY = `life_${MODE}`;

let life = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    summary: "",
    events: [],
    health: 100,
    money: 50,
    reputation: 0,
    danger: 0,
    startTime: Date.now(),
    current: MODE === "survival" 
        ? "SIMULATION_START: You awaken in a hostile world. Survival is the priority." 
        : "SIMULATION_START: Define your existence."
};

function clampStats() {
    life.health = Math.max(0, Math.min(100, life.health));
    life.money = Math.max(0, life.money);
    life.reputation = Math.max(-100, Math.min(100, life.reputation));
    life.danger = Math.max(0, Math.min(100, life.danger));
}

function resetLife() {
    if (confirm("TERMINATE TIMELINE?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

function renderStats() {
    if (MODE !== "survival") return;
    const stats = document.getElementById("stats");
    const best = localStorage.getItem("best_survival") || "0";
    stats.innerHTML = `HP:${life.health} | $:${life.money} | REP:${life.reputation} | RISK:${life.danger} | BEST:${best}m`;
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
                if (callback) callback(); // Trigger death or choices after typing
            }
        }, 15);
    } else {
        div.innerText = text;
        chat.scrollTop = chat.scrollHeight;
    }
}

function renderChoices(actionsString) {
    const oldChoices = document.querySelector(".choice-container");
    if (oldChoices) oldChoices.remove();

    const choiceContainer = document.createElement("div");
    choiceContainer.className = "choice-container";

    // Split the AI's provided choices (expecting comma separated)
    const actions = actionsString.split(",").map(a => a.trim()).slice(0, 4);
    
    actions.forEach(act => {
        if (!act) return;
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = `> ${act}`;
        btn.onclick = () => {
            document.getElementById("userInput").value = act;
            sendMessage();
        };
        choiceContainer.appendChild(btn);
    });

    document.getElementById("chat").appendChild(choiceContainer);
}

async function sendMessage() {
    const input = document.getElementById("userInput");
    const userText = input.value.trim();
    if (!userText || !API_KEY) return;
    input.value = "";
    
    // Clear choices immediately on input
    const oldChoices = document.querySelector(".choice-container");
    if (oldChoices) oldChoices.remove();

    renderMessage("user", userText);
    document.getElementById("loading").classList.remove("hidden");

    const prompt = `
        SYSTEM: nth life engine | MODE: ${MODE}
        RULES: Be brutal. Logical consequences.
        PLAYER_HISTORY: ${life.summary}
        CURRENT_SCENE: ${life.current}
        PLAYER_ACTION: ${userText}

        Respond ONLY in this format:
        SCENE: [Narrative description]
        EVENT: [Short log entry]
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

        const scene = raw.split("EVENT:")[0].replace("SCENE:", "").trim();
        const event = raw.split("EVENT:")[1]?.split("STATS:")[0]?.split("CHOICES:")[0]?.trim();
        const stats = raw.split("STATS:")[1]?.split("CHOICES:")[0]?.trim();
        const choices = raw.split("CHOICES:")[1]?.split("STATUS:")[0]?.trim();
        const status = raw.split("STATUS:")[1]?.trim();

        if (MODE === "survival" && stats) {
            stats.split(",").forEach(s => {
                const parts = s.trim().toLowerCase().split(" ");
                if (parts.length >= 2) {
                    const key = parts[0]; const val = parseInt(parts[1]);
                    if (key.includes("hp")) life.health += val;
                    if (key.includes("money") || key.includes("$")) life.money += val;
                    if (key.includes("rep")) life.reputation += val;
                    if (key.includes("danger")) life.danger += val;
                }
            });
        }

        clampStats();
        life.current = scene;
        if (event) life.events.push(event);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(life));
        renderStats();

        renderMessage("ai", scene, () => {
            if (status === "DEAD" && MODE === "survival") {
                recordDeath(event);
                const ds = document.getElementById("death-screen");
                ds.classList.remove("hidden");
                ds.innerHTML = `<h1>LIFE TERMINATED</h1><p>CAUSE: ${event}</p><p>REBOOTING...</p>`;
                setTimeout(resetLife, 5000);
            } else if (choices) {
                renderChoices(choices);
            }
        });

    } catch (e) {
        document.getElementById("loading").classList.add("hidden");
        renderMessage("ai", "CONNECTION_ERROR");
    }
}

// ... rest of recordDeath, loadNotableLives, renderHistory from previous build ...
