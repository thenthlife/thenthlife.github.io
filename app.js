// 1. Try to get the key from your browser's memory
let API_KEY = localStorage.getItem("my_gemini_key");

// 2. If the key isn't there, ask for it
if (!API_KEY || API_KEY === "null") {
    API_KEY = prompt("Please enter your Gemini API Key:");
    
    // 3. If you entered a key, save it so you don't have to enter it again
    if (API_KEY) {
        localStorage.setItem("my_gemini_key", API_KEY);
    }
}

let life = JSON.parse(localStorage.getItem("life")) || {
  summary: "",
  events: [],
  current: "Your nth life is about to begin. What kind of life do you want to live?"
};

renderMessage("ai", life.current);

function renderMessage(role, text) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = role;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function resetLife() {
  if (confirm("Are you sure you want to end this life and start over?")) {
    localStorage.removeItem("life");
    location.reload();
  }
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const loading = document.getElementById("loading");
  const userText = input.value.trim();

  if (!userText) return;

  input.value = "";
  renderMessage("user", userText);
  loading.classList.remove("hidden"); // Show loading

  const prompt = `You are a persistent life simulator.
    Summary: ${life.summary}
    Events: ${life.events.join("\n")}
    Current: ${life.current}
    User: ${userText}
    Respond with SCENE: and EVENT: sections.`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await response.json();
    loading.classList.add("hidden"); // Hide loading

    if (data.error) {
      renderMessage("ai", "Error: " + data.error.message);
      return;
    }

    const text = data.candidates[0].content.parts[0].text;
    const scene = text.split("EVENT:")[0].replace("SCENE:", "").trim();
    const event = text.split("EVENT:")[1]?.trim();

    if (event && event.toLowerCase() !== "none") life.events.push(event);
    life.current = scene;
    localStorage.setItem("life", JSON.stringify(life));
    renderMessage("ai", scene);

  } catch (err) {
    loading.classList.add("hidden");
    renderMessage("ai", "Connection lost. Try again.");
  }
}
