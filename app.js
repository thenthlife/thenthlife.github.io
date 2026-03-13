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
        ? "SIMULATION_START: You awaken in a hostile world." 
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

function renderMessage(role, text) {
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
            } else clearInterval(interval);
        }, 15);
    } else {
        div.innerText = text;
        chat.scrollTop = chat.scrollHeight;
    }
}

function updateSummary() {
    life.summary = life.events.slice(-5).join(" | ");
}

function recordDeath(cause) {
    const duration = Math.floor((Date.now() - life.startTime) / 60000);
    const best = parseInt(localStorage.getItem("best_survival") || 0);
    if (duration > best) localStorage.setItem("best_survival", duration);

    const historyEntry = {
        date: new Date().toISOString().split("T")[0],
        duration: `${duration}m`,
        cause: cause || "REACTION_FAILURE"
    };

    const history = JSON.parse(localStorage.getItem("survival_history") || "[]");
    history.unshift(historyEntry);
    localStorage.setItem("survival_history", JSON.stringify(history));

    // PROMOTE TO NOTABLE LIVES (If survived > 2 mins)
    if (duration >= 2) {
        const archives = JSON.parse(localStorage.getItem("notableLives") || "[]");
        archives.unshift({
            date: historyEntry.date,
            mode: "SURVIVAL",
            events: [...life.events, `TERMINATED: ${cause}`]
        });
        localStorage.setItem("notableLives", JSON.stringify(archives.slice(0, 15)));
    }
}

function renderHistory() {
    const list = document.getElementById("history-list");
    if (!list) return;
    const history = JSON.parse(localStorage.getItem("survival_history") || "[]");
    list.innerHTML = history.length ? "" : "NO_RECORDS_FOUND";
    history.forEach(h => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `[${h.date}] SURVIVED:${h.duration} <span>CAUSE:${h.cause}</span>`;
        list.appendChild(div);
    });
}

function toggleHistory() {
    document.getElementById("history-list").classList.toggle("hidden");
}

async function sendMessage() {
    const input = document.getElementById("userInput");
    const userText = input.value.trim();
    if (!userText || !API_KEY) return;
    input.value = "";
    renderMessage("user", userText);
    document.getElementById("loading").classList.remove("hidden");

    const prompt = `
        SYSTEM: nth life engine | MODE: ${MODE}
        RULES: No sugarcoating. Logical consequences. Permadeath enabled.
        PLAYER_HISTORY: ${life.summary}
        CURRENT_SCENE: ${life.current}
        PLAYER_ACTION: ${userText}
        Respond format:
        SCENE: [Text]
        EVENT: [Short Log]
        ${MODE === "survival" ? "STATS: hp +/-x, money +/-x, reputation +/-x, danger +/-x" : ""}
        STATUS: [ALIVE or DEAD]
    `;

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await resp.json();
        document.getElementById("loading").classList.add("hidden");
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "ERROR";

        const scene = raw.split("EVENT:")[0].replace("SCENE:", "").trim();
        const event = raw.split("EVENT:")[1]?.split("STATS:")[0]?.trim();
        const stats = raw.split("STATS:")[1]?.split("STATUS:")[0];
        const status = raw.split("STATUS:")[1]?.trim();

        if (MODE === "survival" && stats) {
            stats.split(",").forEach(s => {
                const parts = s.trim().toLowerCase().split(" ");
                if (parts.length < 2) return;
                const key = parts[0]; const val = parseInt(parts[1]);
                if (isNaN(val)) return;
                if (key.includes("hp")) life.health += val;
                if (key.includes("money") || key.includes("$")) life.money += val;
                if (key.includes("rep")) life.reputation += val;
                if (key.includes("danger")) life.danger += val;
            });
        }

        clampStats();
        life.current = scene;
        if (event) life.events.push(event);
        updateSummary();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(life));
        renderStats();
        renderMessage("ai", scene);

        if (status === "DEAD" && MODE === "survival") {
            recordDeath(event);
            const ds = document.getElementById("death-screen");
            ds.classList.remove("hidden");
            ds.innerHTML = `<h1>LIFE TERMINATED</h1><p>CAUSE: ${event}</p><p>REBOOTING...</p>`;
            setTimeout(resetLife, 4000);
        }
    } catch (e) {
        document.getElementById("loading").classList.add("hidden");
        renderMessage("ai", "CONNECTION_ERROR");
    }
}

function loadNotableLives() {
    const chat = document.getElementById("chat");
    const archives = JSON.parse(localStorage.getItem("notableLives") || "[]");
    chat.innerHTML = archives.length ? "" : "<div class='message ai-message'>ARCHIVE_EMPTY</div>";
    archives.forEach(a => {
        const div = document.createElement("div");
        div.className = "message ai-message";
        div.innerHTML = `<strong>[${a.date}] MODE:${a.mode}</strong><br>${a.events.join("<br>")}`;
        chat.appendChild(div);
    });
}

window.onload = () => {
    renderStats();
    renderMessage("ai", life.current);
    if (MODE === "survival") renderHistory();
};
