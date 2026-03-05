const API_KEY = "AIzaSyAXdfH99xK2HWyLm-LJDIkLb07lXtHKlGs";

// Initialize life state from localStorage or default
let life = JSON.parse(localStorage.getItem("life"));

if (!life) {
  life = {
    summary: "",
    events: [],
    current: "Your life is about to begin. What kind of life do you want to live?"
  };
}

// Initial render
renderMessage("ai", life.current);

function renderMessage(role, text) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = role;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const userText = input.value.trim();
  
  if (!userText) return; // Do nothing if input is empty

  input.value = "";
  renderMessage("user", userText);

  const prompt = `
You are a persistent life simulator.

Life summary:
${life.summary}

Important events:
${life.events.join("\n")}

Current situation:
${life.current}

The user now says:
${userText}

Respond with two sections:

SCENE:
Describe what happens next in the life.

EVENT:
If something important happened, summarize it in one sentence.
`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    // Check for API errors (like invalid key or quota)
    if (data.error) {
      renderMessage("ai", "API Error: " + data.error.message);
      return;
    }

    const text = data.candidates[0].content.parts[0].text;

    // Logic to split the response into Scene and Event
    const scene = text.split("EVENT:")[0].replace("SCENE:", "").trim();
    const event = text.split("EVENT:")[1]?.trim();

    if (event && event.toLowerCase() !== "none") {
      life.events.push(event);
    }

    life.current = scene;

    // Save progress
    localStorage.setItem("life", JSON.stringify(life));

    renderMessage("ai", scene);

  } catch (error) {
    console.error("Fetch error:", error);
    renderMessage("ai", "System Error: Could not connect to the AI.");
  }
}
