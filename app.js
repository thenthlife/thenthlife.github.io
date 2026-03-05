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

async function sendMessage(manualText) {
  const input = document.getElementById("userInput");
  const loading = document.getElementById("loading");
  const userText = manualText || input.value.trim();
  
  if (!userText) return;

  if (!manualText) input.value = "";
  renderMessage("user", userText);
  loading.classList.remove("hidden");

  // Improved Prompt for better story flow and 4 choices
  const prompt = `
    You are a life simulator. 
    Current Life Info: ${life.summary}
    Past Events: ${life.events.join(", ")}
    Current Situation: ${life.current}

    The user does: ${userText}

    Respond in this EXACT format:
    SCENE: [Describe the immediate result of the action and the new situation in detail. Include dialogue and action.]
    EVENT: [A 1-sentence summary of what happened for the memory logs.]
    CHOICES: [Choice 1] | [Choice 2] | [Choice 3] | [Choice 4]
  `;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await response.json();
    loading.classList.add("hidden");

    const text = data.candidates[0].content.parts[0].text;
    
    // Parsing the new format
    const scene = text.split("EVENT:")[0].replace("SCENE:", "").trim();
    const eventPart = text.split("EVENT:")[1]?.split("CHOICES:")[0].trim();
    const choicesPart = text.split("CHOICES:")[1]?.trim();

    // Update Life Data
    if (eventPart && eventPart.toLowerCase() !== "none") life.events.push(eventPart);
    life.current = scene;
    localStorage.setItem("life", JSON.stringify(life));

    // Show the full scene in chat
    renderMessage("ai", scene);

    // Show choices as buttons
    if (choicesPart) {
      renderChoices(choicesPart.split("|"));
    }

  } catch (err) {
    loading.classList.add("hidden");
    renderMessage("ai", "Connection error. Try again.");
  }
}

function renderChoices(choices) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = "choices-container";
  
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.innerText = choice.trim();
    btn.onclick = () => {
      div.remove(); // Remove choices after clicking
      sendMessage(btn.innerText);
    };
    div.appendChild(btn);
  });
  
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
