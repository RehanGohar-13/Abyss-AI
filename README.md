# Abyss Agent 🤖

**Abyss Agent** is a premium, beautifully designed AI chatbot interface built with **React (Vite)**, **Tailwind CSS (v4)**, and a **Python Flask** backend.

It features a modern, "glassmorphism" UI, conversation history, streaming responses, and a polished, responsive design.

## ✨ Features

- **Stunning UI**: Deep blue/indigo "glassmorphic" design with smooth gradients and frosted glass effects.
- **Conversation History**: All chats are saved locally (in `localStorage`) with automatic titling.
- **Real-time Typing**: The assistant "thinks" while the response is being generated.
- **Responsive Design**: Built for both desktop and mobile with a slide-out sidebar.
- **Markdown Support**: Rich text formatting for AI responses.
- **File Upload**:
  - Drag-and-drop + click-to-upload.
  - Automatic preview (PDF, Images, Office Docs).
  - Server-side OCR using `PyMuPDF` and `Unstructured`.
- **Modern Tooling**: Built with Vite (Fast build tool) and Tailwind v4 (CSS-first utility framework).

## 🚀 Quick Start

### Option 1: Using `npx` (Easiest - No Setup)

If you have Node.js installed, you can run the app instantly:

```bash
npx@abyss-chat
```

### Option 2: Local Development

If you want to modify the code:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start the Backend Server**:
    Navigate to the `abyss-server` directory and run the Python server.
    ```bash
    cd abyss-server
    # Create a virtual environment (recommended)
    python -m venv venv
    # Activate it
    # Windows: venv\Scripts\activate
    # macOS/Linux: source venv/bin/activate
    
    pip install -r requirements.txt
    python server.py
    ```
    The server will start on `http://localhost:5000`.

3.  **Start the Frontend**:
    Open a **new terminal**, navigate to the `abyss-chat` directory, and run:
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

## 📁 Project Structure

```
abyss-agent/
├── abyss-chat/        # React Frontend (UI)
│   ├── src/
│   │   ├── components/  # Reusable UI (Bubbles, Sidebar)
│   │   ├── App.jsx      # Main App Logic
│   │   └── index.css    # Global Styles & Tailwind
│   └── package.json     # React Dependencies
│
├── abyss-server/      # Python Backend (AI Logic)
│   ├── server.py      # Flask Server
│   ├── prompts.py     # System Prompts
│   ├── tools.py       # Tool definitions (File Upload, Database)
│   └── requirements.txt # Python Dependencies
│
└── README.md          # This file
```

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 (Utility-first, No CSS needed!)
- **State Management**: React `useState` + `useEffect`
- **Icons**: Lucide React
- **Utilities**: `date-fns` (for time formatting)

### Backend
- **Framework**: Python Flask
- **AI Integration**: OpenAI API (gpt-4o-mini)
- **Tools/Orchestration**: LangChain (RouterChain, LLMMathChain, Retriever)
- **File Processing**: PyMuPDF (PDF), Unstructured (DOCX, PPTX, TXT), Google Gemini Vision API (Images)
- **Database**: SQLite (for chat history)
- **Development**: Python 3.11+

## 🌐 Connecting Backend and Frontend

The frontend communicates with the backend via a simple REST API:
- `POST /chat` - Sends a message and receives a response.
- `POST /upload` - Sends a file for processing and retrieval.
- `GET /conversations` - Fetches chat history.
- `GET /conversations/<id>` - Fetches a specific conversation.

## 📦 File Upload Details

1.  **Upload**: The frontend sends the file to `POST /upload`.
2.  **Extract**: The backend uses `Unstructured` to extract text from docs/pdfs or `PyMuPDF` for text/images.
3.  **Analyze**: Gemini Vision API analyzes images to extract text and context.
4.  **Store**: Extracted text is added to the conversation history (DB).
5.  **Retrieve**: Future queries use this history to provide context-aware answers.

## 📖 How to Use

1.  Start both the backend (`python server.py`) and frontend (`npm run dev`).
2.  Click "New Chat" to start a conversation.
3.  Type your message and hit Enter.
4.  Use the "Paperclip" icon to upload files (PDFs, Images, Word docs).
5.  The AI will answer and remember previous messages in the chat.