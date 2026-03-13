# THE nᵗʰ LIFE // SIMULATION ENGINE

The nᵗʰ Life is a brutalist, AI-driven life simulator designed for 2026 tactical realism. It runs entirely in the browser using the Gemini 2.5 Flash API to generate logical, non-sugarcoated consequences for every player action.

---

## 01 // ARCHITECTURE
- **Multi-Page Architecture:** Divided into specialized branches (`Free Roam`, `Survival`, `Archives`) to prevent state-bleeding and session corruption.
- **Client-Side Persistence:** Uses `localStorage` to track stats, event logs, and survival history locally. Your data never leaves your browser.
- **Zero-Budget Backend:** Powered by the user's Gemini API Key. No servers, no tracking, total privacy.

## 02 // MODES
### FREE ROAM
Unrestricted sandbox. No physics, no permadeath. The AI acts as an omnipotent narrator. Ideal for testing character lore (like **Absu**) or high-concept sci-fi scenarios.
### 2nd LIFE SURVIVAL
Hardcore Roguelike mode. 
- **Stats:** Tracks Health (HP), Money ($), Reputation (REP), and Risk (DANGER).
- **Lethality:** Actions have consequences. If the AI determines an event is fatal, the session ends.
- **Historical Log:** Automatically archives notable runs in the "Notable Lives" ledger.

## 03 // PLAYER GUIDE (HOW TO PLAY)
1. **INITIALIZE:** Upon entry, you must "Define Your Existence." Type your starting location, identity, or current situation (e.g., "I am a scavenger in the ruins of Neo-Tokyo").
2. **THE TYPEWRITER:** Wait for the AI to finish "typing" its response. Tactical choices will not appear until the data stream is complete.
3. **DYNAMIC CHOICES:** After your first turn, the AI will generate 4 context-aware actions. Click a button to execute or type a custom command in the input field.
4. **SURVIVAL:** In 2nd Life, monitor your stats at the top of the screen. If HP hits 0 or the AI triggers a `DEAD` status, your local save for that timeline is wiped.

## 04 // TECHNICAL MECHANICS
- **Context Management:** Feeds a rolling summary of events to the AI to ensure narrative continuity.
- **Typewriter Engine:** Streams responses character-by-character for CRT-terminal immersion.
- **Stat Parser:** Interprets natural language AI adjustments (e.g., "hp -10") and applies them to the game state in real-time.

## 05 // INSTALLATION
1. Clone the repository.
2. Deploy to **GitHub Pages**.
3. Enter your **Gemini API Key** when prompted. 

---
**SYSTEM_STATUS: OPERATIONAL**
**MODEL_CORE: GEMINI_2.5_FLASH**
