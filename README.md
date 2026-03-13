# THE nᵗʰ LIFE // SIMULATION ENGINE

**The nᵗʰ Life** is a brutalist, AI-driven life simulator designed for 2026 tactical realism. It runs entirely in the browser using the Gemini 2.0 Flash API to generate logical, non-sugarcoated consequences for every player action.

## 01 // ARCHITECTURE
- **Multi-Page Architecture:** Divided into specialized branches (`Free Roam`, `Survival`, `Archives`) to prevent state-bleeding.
- **Client-Side Persistence:** Uses `localStorage` to track stats, event logs, and survival history across sessions.
- **Zero-Budget Backend:** Powered by the user's own Gemini API Key, ensuring the simulation is free to host and private to the player.

## 02 // MODES
### FREE ROAM
Unrestricted sandbox. No physics, no permadeath. Ideal for testing character lore (like Absu) or high-concept sci-fi scenarios.
### 2nd LIFE SURVIVAL
Hardcore Roguelike mode. 
- **Stats:** Tracks Health (HP), Money ($), Reputation (REP), and Risk (DANGER).
- **Permadeath:** If the AI determines an action is lethal (STATUS: DEAD), the timeline is terminated.
- **Historical Log:** Automatically records survival time and cause of death in a permanent ledger.

## 03 // TECHNICAL MECHANICS
- **Typewriter Engine:** Streams AI responses character-by-character for CRT-terminal immersion.
- **Context Management:** Feeds a rolling summary of the last 5 major events back to the AI to ensure narrative consistency.
- **Stat Parsing:** A robust regex-based parser interprets AI stat adjustments (e.g., `hp -10`) and applies them to the local state.

## 04 // INSTALLATION
1. Clone the repository to your machine.
2. Upload all files to a **GitHub Pages** repository.
3. Launch the site and enter your **Gemini API Key** when prompted.

---
*SYSTEM_STATUS: OPERATIONAL*
