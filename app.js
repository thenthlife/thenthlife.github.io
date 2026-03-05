// 1. API Key Setup
let API_KEY = localStorage.getItem("my_gemini_key");

if (!API_KEY || API_KEY === "null") {
    API_KEY = prompt("Please enter your Gemini API Key:");
    if (API_KEY) {
        localStorage.setItem("my_gemini_key", API_KEY);
    }
}

// 2. Life Data Initialization
let life = JSON.parse(localStorage.getItem("life")) || {
  summary: "",
  events: [],
  current: "Your nth life is about to begin. What kind of life do you want to live?"
};

// Start the game with the typewriter effect for the intro
window.onload = () => {
    renderMessage("ai", life.current);
};

// 3. Typewriter Core Logic
function typeText(element, text, speed = 20, callback) {
  let i = 0;
  element.innerHTML = ""; 
  const timer = setInterval(() => {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      const chat = document.getElementById("chat");
      chat.scrollTop = chat.scrollHeight; 
    } else {
      clearInterval(timer);
      if (callback) callback(); // Trigger buttons/next steps here
    }
  }, speed);
}

// 4. Enhanced Message Renderer
function renderMessage(role, text, callback) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  // Ensure class names match your CSS (ai-message / user-message)
  div.className = `message ${role === 'ai' ? 'ai-message' : 'user-message'}`;
  chat.appendChild(div);

  if (role === "ai") {
    typeText(div, text, 20, callback);
  } else {
    div.innerText = text;
    if (callback) callback();
    chat.scrollTop = chat.scrollHeight;
  }
}

// 5. Reset Life
function resetLife() {
  if (confirm("Are you sure you want to end this life and start over?")) {
    localStorage.removeItem("life");
    location.reload();
  }
}

// 6. Send Message Logic
async function sendMessage(manualText) {
  const input = document.getElementById("userInput");
  const loading = document.getElementById("loading");
  const userText = manualText || input.value.trim();
  
  if (!userText) return;

  if (!manualText) input.value = "";
  
  // Remove any existing choice buttons when a new message is sent
  const oldChoices = document.querySelector(".choices-container");
  if (oldChoices) oldChoices.remove();

  renderMessage("user", userText);
  loading.classList.remove("hidden");

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

    if (data.error) {
        renderMessage("ai", "API Error: " + data.error.message);
        return;
    }

    const text = data.candidates[0].content.parts[0].text;
    
    // Parsing
    const scene = text.split("EVENT:")[0].replace("SCENE:", "").trim();
    const eventPart = text.split("EVENT:")[1]?.split("CHOICES:")[0].trim();
    const choicesPart = text.split("CHOICES:")[1]?.trim();

    // Update Storage
    if (eventPart && eventPart.toLowerCase() !== "none") life.events.push(eventPart);
    life.current = scene;
    localStorage.setItem("life", JSON.stringify(life));

    // Render Scene then render Choices
    renderMessage("ai", scene, () => {
      if (choicesPart) {
        renderChoices(choicesPart.split("|"));
      }
    });

  } catch (err) {
    loading.classList.add("hidden");
    renderMessage("ai", "Connection error. Check your key or internet.");
    console.error(err);
  }
}

// 7. Choice Button Logic
function renderChoices(choices) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = "choices-container";
  
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.innerText = choice.trim();
    btn.onclick = () => {
      div.remove(); 
      sendMessage(btn.innerText);
    };
    div.appendChild(btn);
  });
  
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
