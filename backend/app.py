import os
import io
import base64
import json
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
import PyPDF2

load_dotenv()
app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("GROQ_API_KEY")
API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"

# Upgraded prompts to be less generic and more capable
SYSTEM_PROMPTS = {
    "coding": (
        "You are Abyss, an elite software engineer. Provide concise, readable, and efficient code. "
        "Always use markdown code blocks with the correct language syntax. "
        "Briefly explain complex logic, but skip obvious basics. Prioritize production-ready solutions."
    ),
    "general": (
        "You are Abyss, a highly capable and direct AI assistant. Provide clear, structured, and accurate answers. "
        "Use markdown for formatting when it improves readability. Get to the point quickly without unnecessary fluff."
    ),
    "reasoning": (
        "You are Abyss, an analytical AI designed for deep reasoning. Break down complex problems step-by-step. "
        "State your assumptions clearly, evaluate trade-offs, and arrive at a logical conclusion. "
        "Use markdown lists and bold text to structure your reasoning."
    )
}

CODE_KW = ["code", "python", "javascript", "function", "bug", "api", "html", "css", "react", "script", "typescript", "node"]
REASON_KW = ["why", "solve", "math", "logic", "puzzle", "prove", "analyze", "algorithm", "complexity"]

def route(msg):
    m = msg.lower()
    if any(k in m for k in CODE_KW): return "coding"
    if any(k in m for k in REASON_KW): return "reasoning"
    return "general"

def stream_llama(messages, system, model_name):
    """Generator that yields text chunks from Groq API."""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model_name if model_name else DEFAULT_MODEL,
        "messages": [{"role": "system", "content": system}] + messages,
        "stream": True,
        "temperature": 0.7
    }
    
    try:
        with requests.post(API_URL, headers=headers, json=payload, stream=True) as r:
            r.raise_for_status() # Raise an exception for bad status codes
            for line in r.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        data_str = line_str[6:]
                        if data_str == '[DONE]':
                            break
                        try:
                            data = json.loads(data_str)
                            content = data['choices'][0]['delta'].get('content', '')
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
    except requests.exceptions.RequestException as e:
        yield f"\n\n[Error connecting to AI API: {e}]"

@app.route("/chat", methods=["POST"])
def chat():
    d = request.json
    user_msg = d.get("message", "")
    history = d.get("history", [])
    model_name = d.get("model", DEFAULT_MODEL)
    global_context = d.get("global_context", [])
    
    cat = route(user_msg)
    messages = history + [{"role": "user", "content": user_msg}]
    
    system_prompt = SYSTEM_PROMPTS[cat]
    
    # Inject cross-chat context so AI knows what was asked in other chats
    if global_context:
        context_str = "\n".join([f"- Chat '{c['title']}': User asked '{c['last_msg']}'" for c in global_context if c.get('last_msg')])
        system_prompt += f"\n\nThe user has other active conversations. You can reference these if asked about past topics:\n{context_str}"
    
    # Return a streaming response
    return Response(
        stream_llama(messages, system_prompt, model_name), 
        mimetype='text/event-stream'
    )

@app.route("/upload", methods=["POST"])
def upload():
    d = request.json
    try:
        if d["type"] == "pdf":
            # Safely decode base64
            base64_str = d["content"].split(",")[1] if "," in d["content"] else d["content"]
            pdf_bytes = base64.b64decode(base64_str)
            text = "\n".join(p.extract_text() for p in PyPDF2.PdfReader(io.BytesIO(pdf_bytes)).pages)
        else:
            text = d["content"]
            
        text = text[:15000] # Truncate to fit context window
        question = d.get('question', 'Analyze this file and provide a summary of its key points.')
        
        reply = ask_llama(
            [{"role":"user","content":f"File: {d['filename']}\n\n{text}\n\nQuestion: {question}"}], 
            SYSTEM_PROMPTS["general"]
        )
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def ask_llama(messages, system):
    """Non-streaming helper for file uploads"""
    r = requests.post(API_URL, headers={"Authorization": f"Bearer {API_KEY}"}, 
                      json={"model": DEFAULT_MODEL, "messages": [{"role":"system","content":system}] + messages})
    if r.status_code != 200:
        return f"Error processing file: {r.text}"
    return r.json()["choices"][0]["message"]["content"]

if __name__ == "__main__":
    app.run(port=5000, debug=True)