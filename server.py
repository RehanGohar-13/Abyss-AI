import os
import io
import base64
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import PyPDF2

load_dotenv()

app = Flask(__name__)
CORS(app)

# ─── Config ───────────────────────────────────────────────────────────────────
API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    raise ValueError("GROQ_API_KEY not found. Set it in .env file.")

API_URL = "https://api.groq.com/openai/v1/chat/completions"

MODELS = {
    "coding": "llama-3.3-70b-versatile",
    "general": "llama-3.3-70b-versatile",
    "reasoning": "llama-3.3-70b-versatile",
}

SYSTEM_PROMPTS = {
    "coding": "You are Abyss, an expert coding assistant. Give clear, working code with brief explanations. Use markdown for code blocks with language tags like ```python, ```javascript, etc.",
    "general": "You are Abyss, a helpful and friendly AI assistant. Be direct and clear.",
    "reasoning": "You are Abyss, a deep-thinking AI. Solve problems step by step, showing your reasoning clearly.",
}

CODE_KEYWORDS = [
    "code", "python", "javascript", "js", "java ", "c++", "rust", "go ", "ruby",
    "function", "method", "class", "variable", "array", "list", "dict",
    "bug", "error", "fix", "debug", "compile", "syntax", "runtime",
    "api", "endpoint", "route", "database", "sql", "query",
    "html", "css", "react", "vue", "angular", "node", "express",
    "flask", "django", "fastapi", "git", "docker", "kubernetes",
    "algorithm", "data structure", "recursion", "loop", "iterate",
    "script", "program", "implement", "refactor", "optimize",
    "type", "interface", "object", "inherit", "polymorphism",
    "stack", "queue", "tree", "graph", "hash",
    "frontend", "backend", "fullstack", "dev", "developer"
]

REASONING_KEYWORDS = [
    "why", "how does", "explain why", "prove", "derive", "calculate",
    "solve", "math", "logic", "puzzle", "riddle",
    "step by step", "reasoning", "analyze", "analyse", "evaluate",
    "philosophy", "theory", "principle", "theorem", "equation"
]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def route_message(user_message):
    """Smart keyword-based routing."""
    msg = user_message.lower()
    for kw in CODE_KEYWORDS:
        if kw in msg:
            print(f"[ROUTER] Matched CODE keyword: '{kw}'")
            return "coding"
    for kw in REASONING_KEYWORDS:
        if kw in msg:
            print(f"[ROUTER] Matched REASONING keyword: '{kw}'")
            return "reasoning"
    print(f"[ROUTER] Defaulted to GENERAL")
    return "general"


def call_groq(messages, model):
    """Call Groq API and return the response text."""
    response = requests.post(
        API_URL,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={"model": model, "messages": messages, "temperature": 0.7}
    )
    data = response.json()
    if "choices" not in data:
        error_msg = data.get("error", {}).get("message", "Unknown API error")
        raise Exception(f"Groq API error: {error_msg}")
    return data["choices"][0]["message"]["content"]


def extract_pdf_text(base64_content):
    """Decode base64 PDF and extract text."""
    pdf_bytes = base64.b64decode(base64_content)
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    return "\n".join([page.extract_text() for page in reader.pages])


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_message = data.get("message", "")
        history = data.get("history", [])

        category = route_message(user_message)
        model = MODELS[category]
        system = SYSTEM_PROMPTS[category]

        messages = [{"role": "system", "content": system}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        reply = call_groq(messages, model)

        return jsonify({"reply": reply, "category": category, "model": model})
    except Exception as e:
        print(f"[ERROR /chat] {e}")
        return jsonify({"reply": f"Error: {str(e)}", "category": "error", "model": "none"}), 500


@app.route("/upload", methods=["POST"])
def upload():
    try:
        data = request.json
        content = data.get("content", "")
        filename = data.get("filename", "file")
        file_type = data.get("type", "text")
        question = data.get("question", "Analyze this file")

        # Extract text based on file type
        if file_type == "pdf":
            text = extract_pdf_text(content)
        else:
            text = content

        # Truncate to fit context window
        max_chars = 15000
        truncated = len(text) > max_chars
        if truncated:
            text = text[:max_chars] + "\n\n... (truncated)"

        system_prompt = f"""You are Abyss, an expert file analyzer. The user uploaded '{filename}'.
Analyze it thoroughly and answer their question. If no specific question, give a summary, 
key points, and anything notable."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"File content:\n\n{text}\n\nQuestion: {question}"}
        ]

        reply = call_groq(messages, MODELS["coding"])

        return jsonify({
            "reply": reply,
            "filename": filename,
            "chars_analyzed": len(text),
            "truncated": truncated
        })
    except Exception as e:
        print(f"[ERROR /upload] {e}")
        return jsonify({"reply": f"Error processing file: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "abyss-ai"})


if __name__ == "__main__":
    app.run(port=5000, debug=True)