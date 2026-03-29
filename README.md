# DASHADIKKU — Personal AI Assistant
## Complete Project Prompt & Blueprint

---

## Project Vision

Build a personal AI assistant called **DASHADIKKU** that runs on a Windows PC and connects to an Android phone. It listens to voice commands, understands natural language, controls the PC, helps with coding in VS Code, generates images, remembers past work sessions, and bridges the Windows PC and Android phone — all working together like a real DASHADIKKU from Iron Man.

---

## Core Principles

- **Always online** — No offline mode. Always connected to the internet and using cloud AI APIs.
- **Voice first** — Every feature must be triggerable by voice command.
- **Memory always on** — DASHADIKKU remembers what the user was working on, what files were open, recent commands, and conversation history.
- **One brain, multiple AIs** — Gemini handles general tasks and voice. Claude handles all coding tasks. Gemini Imagen handles image generation.
- **Two devices, one assistant** — Windows PC and Android phone are always linked. Commands given on the phone work on the PC and vice versa.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.11+ |
| Voice input (STT) | Google Gemini Speech-to-Text API |
| Voice output (TTS) | Google Gemini Text-to-Speech API |
| General AI brain | Google Gemini 1.5 Flash API |
| Coding AI brain | Anthropic Claude API (claude-sonnet) |
| Image generation | Google Gemini Imagen API |
| Memory (structured) | SQLite (local database) |
| Memory (semantic search) | ChromaDB (local vector database) |
| File watching | watchdog (Python library) |
| Device control | pyautogui, subprocess, ctypes (Windows) |
| Phone bridge | WebSocket server (Python websockets library) |
| Android app | MIT App Inventor (beginner-friendly) |
| UI (optional) | Tkinter or simple web UI with Flask |

---

## System Architecture

```
[ Android Phone ]
       |
   WebSocket (LAN)
       |
[ Windows PC — DASHADIKKU Core ]
       |
   ┌───────────────────────────────────────┐
   │           VOICE LAYER                 │
   │   Gemini STT  ←→  Gemini TTS         │
   └───────────────┬───────────────────────┘
                   │
   ┌───────────────▼───────────────────────┐
   │         INTENT ROUTER                 │
   │  (classifies every command by type)   │
   └──┬────────┬────────┬─────────┬────────┘
      │        │        │         │
   [General] [Code]  [Device]  [Image]
   Gemini   Claude  pyautogui  Imagen
      │        │        │         │
   ┌──▼────────▼────────▼─────────▼────────┐
   │           MEMORY LAYER                │
   │   SQLite (history, tasks, files)      │
   │   ChromaDB (semantic file search)     │
   └───────────────────────────────────────┘
```

---

## Feature List — Complete

### 1. Voice Input & Output
- Wake word: **"DASHADIKKU"**
- Listens continuously, activates on wake word
- Uses Gemini STT to convert speech to text
- Uses Gemini TTS to speak responses back
- Responses are short, spoken-friendly (no markdown, no bullet points)

### 2. AI Brain — Intent Router
The intent router reads every command and decides which AI handles it:

| Command type | Routed to | Examples |
|---|---|---|
| General question | Gemini | "What's the weather?", "Set a reminder", "What time is it in Tokyo?" |
| Code task | Claude API | "Write a Python function", "Debug this error", "Explain this code", "Edit this file" |
| Device command | System tools | "Open Chrome", "Take a screenshot", "Volume up", "Lock the screen" |
| Image request | Gemini Imagen | "Generate an image of a sunset", "Create a logo for my app" |
| File task | File agent | "Find the auth file", "Search for login function", "List my recent files" |
| Phone command | WebSocket bridge | "Send this to my phone", "Read my notifications", "Share clipboard" |

### 3. Memory System
Two-layer memory that persists across all sessions:

**Layer 1 — SQLite (structured memory):**
- Full conversation history (timestamp, command, response)
- File edit history (which file, what change, when)
- Task list (things DASHADIKKU was asked to do or remember)
- VS Code session log (which files were open, what was being worked on)
- Reminders and notes

**Layer 2 — ChromaDB (semantic memory):**
- Indexed content of all files in watched workspace folders
- Enables "find the file where I handle user login" — searches by meaning, not filename
- Updated automatically by watchdog when files change

### 4. File & VS Code Agent
- `watchdog` monitors the user's workspace folders in real time
- Automatically indexes new and changed files into ChromaDB
- Responds to voice commands:
  - "Find the file that handles authentication"
  - "Search for the function called process_order"
  - "Edit line 42 in main.py — change timeout to 30"
  - "Show me all files I edited today"
  - "Open the settings file in VS Code"
- Uses Claude API for any command that involves reading, writing, or explaining code
- Can directly read and write files using Python `pathlib`
- VS Code integration via the VS Code CLI (`code --goto file:line`) or the Language Server Protocol

### 5. Windows Device Control
Voice-controlled system commands:

| Command | Method |
|---|---|
| "Open [app name]" | `subprocess.Popen` |
| "Take a screenshot" | `pyautogui.screenshot()` |
| "Volume up / down / mute" | `ctypes` Windows audio API |
| "Lock the screen" | `ctypes.windll.user32.LockWorkStation()` |
| "Copy / paste" | `pyautogui.hotkey('ctrl', 'c')` |
| "Scroll down" | `pyautogui.scroll(-3)` |
| "Click [position]" | `pyautogui.click(x, y)` |
| "Type [text]" | `pyautogui.typewrite(text)` |
| "Search [query] on Google" | `webbrowser.open(url)` |
| "Shut down / restart" | `os.system('shutdown /s')` |

### 6. Image Generation
- Triggered by phrases like "generate an image of...", "create a picture of...", "draw me..."
- Sends prompt to Gemini Imagen API
- Displays result in a simple Tkinter window or saves to a folder
- Saves all generated images with their prompts in SQLite for memory

### 7. Android Phone Bridge
- A Python `websockets` server runs on the Windows PC at startup
- The Android app (built in MIT App Inventor) connects to it over the home Wi-Fi
- Features:
  - Send a voice command from the phone → runs on the PC
  - PC notifications mirrored to phone
  - Clipboard sync (copy on PC → paste on phone, and vice versa)
  - File transfer (say "send this file to my phone" → file appears on Android)
  - Battery and connection status visible from PC
- Phone and PC discover each other using mDNS (zeroconf Python library) — no manual IP needed

---

## Project File Structure

```
DASHADIKKU/
├── DASHADIKKU.py               ← Main entry point, wake word loop
├── config.py               ← API keys, settings, watched folders
├── router.py               ← Intent classification and routing
├── voice/
│   ├── stt.py              ← Gemini Speech-to-Text
│   └── tts.py              ← Gemini Text-to-Speech
├── brain/
│   ├── gemini_brain.py     ← General AI responses via Gemini
│   └── claude_brain.py     ← Code tasks via Claude API
├── memory/
│   ├── sqlite_memory.py    ← Structured history, tasks, file log
│   └── vector_memory.py    ← ChromaDB semantic file search
├── agents/
│   ├── file_agent.py       ← File search, read, edit operations
│   ├── device_agent.py     ← Windows system control
│   └── image_agent.py      ← Gemini Imagen generation
├── bridge/
│   ├── server.py           ← WebSocket server for Android
│   └── discovery.py        ← mDNS auto-discovery (zeroconf)
├── DASHADIKKU_memory.db        ← SQLite database (auto-created)
├── chroma_db/              ← ChromaDB vector store (auto-created)
└── requirements.txt        ← All Python dependencies
```

---

## API Keys Required

| Service | Where to get it | Cost |
|---|---|---|
| Google Gemini API | aistudio.google.com | Free tier available |
| Anthropic Claude API | console.anthropic.com | Pay-per-use (very cheap for code tasks) |

---

## Build Order (Phases)

### Phase 1 — Voice + Gemini (Start here)
Get voice input → Gemini response → voice output working on Windows.
Libraries: `SpeechRecognition`, `google-generativeai`, `pyttsx3`

### Phase 2 — Memory + Claude routing
Add SQLite memory. Add intent router. Route code questions to Claude API.
Libraries: `sqlite3` (built-in), `anthropic`

### Phase 3 — File agent + VS Code
Add watchdog file watcher. Index files into ChromaDB. Voice file search and editing.
Libraries: `watchdog`, `chromadb`, `pathlib`

### Phase 4 — Windows device control
Add system commands — open apps, screenshots, volume, lock screen.
Libraries: `pyautogui`, `ctypes`, `subprocess`, `webbrowser`

### Phase 5 — Image generation
Add Gemini Imagen API. Display and save generated images.
Libraries: `Pillow`, Gemini Imagen API

### Phase 6 — Android phone bridge
Build WebSocket server. Build Android app in MIT App Inventor. Connect over Wi-Fi.
Libraries: `websockets`, `zeroconf`

---

## Example Voice Commands (Full Feature Set)

```
General:
"DASHADIKKU, what's the weather in Mysuru today?"
"DASHADIKKU, set a reminder to review the PR at 5pm"
"DASHADIKKU, what did I ask you yesterday about the database?"

Coding:
"DASHADIKKU, write a Python function to validate an email address"
"DASHADIKKU, explain what the process_payment function does"
"DASHADIKKU, debug the error in main.py"
"DASHADIKKU, find the file where I handle user login"
"DASHADIKKU, edit auth.py line 55, change timeout from 10 to 30"

Device:
"DASHADIKKU, open Chrome"
"DASHADIKKU, take a screenshot"
"DASHADIKKU, lock the screen"
"DASHADIKKU, turn the volume up"
"DASHADIKKU, search Python list comprehension on Google"

Image:
"DASHADIKKU, generate an image of a futuristic city at night"
"DASHADIKKU, create a logo for an app called NightOwl"

Phone bridge:
"DASHADIKKU, send the screenshot to my phone"
"DASHADIKKU, read my latest notifications"
"DASHADIKKU, sync my clipboard to my phone"

Memory:
"DASHADIKKU, what was I working on yesterday?"
"DASHADIKKU, remember that the API deadline is Friday"
"DASHADIKKU, show me all files I edited this week"
```

---

## System Prompt (used inside every AI call)

Every request to Gemini and Claude must include this system context:

```
You are DASHADIKKU, a personal AI assistant running on a Windows PC.
Your owner's name is [USER NAME].
You are always online and connected to the internet.
You help with coding, file management, device control, and general questions.
You have access to the user's file workspace and conversation history.
Keep all responses short and spoken-friendly — no markdown, no bullet points, no headers.
Write responses as if you are speaking out loud to your owner.
When helping with code, always use Python unless told otherwise.
When asked about files, always search memory before saying you don't know.
Today's date is {current_date}. Current time is {current_time}.
Recent conversation history:
{memory_context}
```

---

## Requirements File

```
google-generativeai
anthropic
SpeechRecognition
pyaudio
pyttsx3
pyautogui
watchdog
chromadb
websockets
zeroconf
Pillow
flask
```

Install all with:
```bash
pip install google-generativeai anthropic SpeechRecognition pyaudio pyttsx3 pyautogui watchdog chromadb websockets zeroconf Pillow flask
```

---

## Important Notes for Development

1. **Always test one phase completely before starting the next.** Do not try to build everything at once.
2. **Keep API keys in a `config.py` file** and never upload that file to GitHub. Add it to `.gitignore`.
3. **The intent router is the most important component.** A good router means the right AI handles every command. Spend extra time making it accurate.
4. **ChromaDB runs 100% locally.** No data leaves the machine. All file content is private.
5. **The Android app does not need to be complex.** MIT App Inventor is enough — it just needs a text input, a voice button, and a WebSocket connection to the PC.
6. **pyaudio can be tricky to install on Windows.** If `pip install pyaudio` fails, download the pre-built `.whl` file from the Christoph Gohlke repository and install it manually.
7. **Run DASHADIKKU as administrator** on Windows if device control commands (lock screen, volume) don't work.
