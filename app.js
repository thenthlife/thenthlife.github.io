const API_KEY = "AIzaSyAXdfH99xK2HWyLm-LJDIkLb07lXtHKlGs";

let life = JSON.parse(localStorage.getItem("life"));

if (!life) {
  life = {
    summary: "",
    events: [],
    current: "You are beginning a new life. Ask the user what life they want to live."
  };
}

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
  const userText = input.value;
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

  const response = await fetch(
    ""https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;

  const scene = text.split("EVENT:")[0].replace("SCENE:", "").trim();
  const event = text.split("EVENT:")[1]?.trim();

  if (event) {
    life.events.push(event);
  }

  life.current = scene;

  localStorage.setItem("life", JSON.stringify(life));

  renderMessage("ai", scene);
}
