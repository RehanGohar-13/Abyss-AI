# Abyss AI v1

A multi-purpose AI chat assistant with a cosmic UI, built with React, Flask, and Groq.

![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Flask](https://img.shields.io/badge/Flask-000000?logo=flask&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?logo=groq&logoColor=white)

> _Abyss AI is a next-generation chat interface that leverages open-source Large Language Models (via Groq) to provide instant, code-aware, and web-search-enabled responses. It features a premium glassmorphism UI, a custom AI Router, and a fully responsive design._

---

## ✨ Features

### 🧠 Intelligence & Routing

- **AI Auto-Router:** Uses a lightweight LLM call to analyze your prompt and automatically route it to the best specialized model (Coding, Reasoning, Fast, General) for the job.
- **11+ Open Source Models:** Direct access to Llama 3.3 70B, Qwen 2.5 Coder 32B, Mixtral, and more.
- **Real-Time Web Search:** Integrates a custom DuckDuckGo scraper to pull live, up-to-the-minute information into the AI's context. Fights LLM hallucinations with real-time data.
- **Cross-Chat Memory:** Abyss remembers the context of your last 5 conversations, allowing it to reference past topics naturally.
- **PDF & Code File Upload:** Drop a PDF or source code file into the chat, and Abyss will read, analyze, and answer questions about it instantly.

### 🎨 UI / UX

- **Cosmic Glassmorphism:** A premium, deep-space UI built with Tailwind CSS, featuring a custom animated starfield canvas background.
- **Dynamic Galaxy Mode:** Toggle Web Search to watch the background smoothly crossfade from warp-speed stars into a dense, 3D-tilted spiral galaxy.
- **Markdown & Syntax Highlighting:** Beautifully formatted responses with one-click "Copy Code" buttons for every code block.
- **Chat History with LocalStorage:** All conversations are saved directly to the browser.
- **Right-Click Context Menu:** Right-click any message to instantly Edit, Regenerate, or Copy text.
- **Chat Management:** Hover over chats in the sidebar to reveal a menu to Rename, Export as Markdown, or Delete.

### 🛠️ Architecture

- **Streaming Responses:** True Server-Sent Events (SSE) streaming for word-by-word AI generation.
- **Cancel Mid-Stream:** Stop the AI generation at any time.
- **Export to Markdown:** Save any conversation as a `.md` file for documentation.
- **Auto-Titled Chats:** AI automatically generates a 2-3 word title for your conversations.

---

## 🛠️ Tech Stack

| Layer        | Technology                          | Why it was chosen                                     |
| ------------ | ----------------------------------- | ----------------------------------------------------- |
| **Frontend** | React 18, Vite, Tailwind CSS        | Fast, modern, industry-standard for a premium feel.   |
| **Backend**  | Python, Flask, Gunicorn             | Lightweight, perfect for AI API orchestration.        |
| **AI Core**  | Groq API (Llama 3.3, Qwen, Mixtral) | The fastest open-source LLM inference in the world.   |
| **State**    | React Hooks & LocalStorage          | Lightweight client-side persistence (no DB required). |

---

## 🚀 Getting Started

To run Abyss locally, you will need Node.js, Python 3.10+, and a free [Groq API Key](https://console.groq.com/keys).

### 1. Clone the repository

Frontend Setup :

```bash
git clone https://github.com/RehanGohar-13/Abyss-AI.git
cd Abyss-AI
```

### 2. Backend Setup :

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create a .env file in the backend folder and add your key:

```
    GROQ_API_KEY=gsk_your_actual_key_here
```

Start the server:

```
python app.py
# Server runs on http://localhost:5000
```

### 3. Frontend Setup

Open a new terminal :

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

Open http://localhost:5173 in your browser, and start talking to Abyss.

## 📁 Project Structure

```bash
abyss-v2/
├── backend/
│   ├── app.py              # Flask server & routing logic
│   ├── render.yaml         # Render deployment config
│   ├── requirements.txt    # Python dependencies
│   └── .env                # API keys (gitignored)
├── frontend/
│   ├── src/
│   │   ├── components/     # React UI components
│   │   ├── utils/          # API wrappers
│   │   ├── App.jsx
│   │   └── index.css       # Global cosmic theme
│   ├── package.json
│   ├── tailwind.config.js
│   └── vercel.json         # Vercel deployment config
├── README.md
└── LICENSE
```

## 📜 License

Distributed under the MIT License. This means you (or companies) can freely use, modify, and distribute this project, provided that attribution is given to the original author.

Copyright (c) 2026 Rehan Gohar
