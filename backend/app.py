import os
import io
import base64
import json
import re
import html
import urllib.parse
import requests
from datetime import datetime
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
FAST_MODEL = "llama-3.1-8b-instant"

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

def generate_search_query(history, user_msg):
    """Uses the fast model to rewrite a follow-up question into a standalone search query."""
    # Keep history brief to save tokens
    brief_history = history[-4:] if len(history) > 4 else history
    
    prompt = f"""Based on this conversation history:
{json.dumps(brief_history)}

The user just asked: "{user_msg}"

Rewrite this into a concise, standalone web search query (3-6 words) that will find the answer. 
If the user's message is already a good search query, just return it as is.
Do not include quotes or punctuation. Just output the search query."""

    try:
        r = requests.post(API_URL, headers={"Authorization": f"Bearer {API_KEY}"}, 
                          json={"model": FAST_MODEL, "messages": [{"role":"user","content":prompt}], "temperature": 0.2})
        r.raise_for_status()
        query = r.json()["choices"][0]["message"]["content"].strip().replace('"', '')
        return query
    except Exception as e:
        print(f"Query gen failed: {e}")
        return user_msg # Fallback to raw user message

def get_web_context(query):
    """Scrapes DuckDuckGo HTML for real-time search results and URLs, filtering junk."""
    try:
        url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        r = requests.get(url, headers=headers, timeout=5)
        
        raw_urls = re.findall(r'uddg=(.*?)&', r.text)
        decoded_urls = [urllib.parse.unquote(u) for u in raw_urls]
        
        titles = re.findall(r'class="result__a"[^>]*>(.*?)</a>', r.text, re.DOTALL)
        snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</a>', r.text, re.DOTALL)
        
        blacklist = ['youtube.com', 'youtu.be', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'tiktok.com', 'pinterest.com']
        seen_domains = set()
        results = []
        
        for i in range(min(len(titles), len(snippets), len(decoded_urls), 10)):
            url_str = decoded_urls[i]
            domain = re.sub(r'^www\.', '', urllib.parse.urlparse(url_str).netloc)
            
            if any(b in domain for b in blacklist) or domain in seen_domains:
                continue
                
            seen_domains.add(domain)
            # Use html.unescape to fix &amp; &quot; etc.
            clean_title = html.unescape(re.sub(r'<[^>]+>', '', titles[i]).strip())
            clean_snippet = html.unescape(re.sub(r'<[^>]+>', '', snippets[i]).strip())
            results.append({
                "title": clean_title,
                "url": url_str,
                "snippet": clean_snippet
            })
            
            if len(results) >= 5:
                break
            
        return results if results else None
    except Exception as e:
        print(f"Web search failed: {e}")
        return None

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
            r.raise_for_status()
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
    use_web_search = d.get("use_web_search", False)
    
    cat = route(user_msg)
    messages = history + [{"role": "user", "content": user_msg}]
    
    system_prompt = SYSTEM_PROMPTS[cat]
    web_ctx = None
    
    # INJECT REAL-WORLD TIME so AI knows what year it is
    current_date = datetime.now().strftime("%B %d, %Y")
    system_prompt += f"\nToday's real-world date is {current_date}."
    
    if global_context:
        context_str = "\n".join([f"- Chat '{c['title']}': User asked '{c['last_msg']}'" for c in global_context if c.get('last_msg')])
        system_prompt += f"\n\nThe user has other active conversations. You can reference these if asked about past topics:\n{context_str}"

    if use_web_search:
        # Step 1: Rewrite query using history
        search_query = generate_search_query(history, user_msg)
        print(f"Generated Search Query: {search_query}") # For terminal logging
        
        # Step 2: Search with the new query
        web_ctx = get_web_context(search_query)
        if web_ctx:
            context_str = "\n".join([f"[{i+1}] {c['title']}: {c['snippet']}" for i, c in enumerate(web_ctx)])
            system_prompt += f"""
---
REAL-TIME WEB SEARCH RESULTS:
{context_str}
---
CRITICAL INSTRUCTION: The user has enabled Web Search. You MUST base your answer EXCLUSIVELY on the provided search results above. 
Treat the search results as absolute truth, overriding any knowledge from your training data.
If the search results contradict your internal sense of time or facts, you MUST trust the search results.
Use the conversation history to understand the user's context, but use the SEARCH RESULTS to answer their question.
Do NOT mention "based on my training data". Do NOT include a sources section, links, or citations at the end of your response. The UI handles sources automatically."""
        else:
            system_prompt += "\n\nYou attempted a web search but found no usable results. Inform the user that the real-time web search failed to find recent information, and answer with your best general knowledge while noting it may be outdated."
    
    def combined_stream():
        yield from stream_llama(messages, system_prompt, model_name)
        if web_ctx:
            yield f"\n\n[SOURCES_JSON]{json.dumps(web_ctx)}[/SOURCES_JSON]"
    
    return Response(combined_stream(), mimetype='text/event-stream')

@app.route("/generate-title", methods=["POST"])
def generate_title():
    d = request.json
    user_msg = d.get("message", "")
    
    prompt = f"Create a very short, 2-4 word title for a conversation that starts with this user message. Do not use quotes or punctuation. Message: '{user_msg}'"
    
    try:
        r = requests.post(API_URL, headers={"Authorization": f"Bearer {API_KEY}"}, 
                          json={"model": FAST_MODEL, "messages": [{"role":"user","content":prompt}], "temperature": 0.5})
        r.raise_for_status()
        title = r.json()["choices"][0]["message"]["content"].strip().replace('"', '')
        return jsonify({"title": title})
    except Exception as e:
        return jsonify({"title": user_msg[:30]}), 200

@app.route("/upload", methods=["POST"])
def upload():
    d = request.json
    try:
        if d["type"] == "pdf":
            base64_str = d["content"].split(",")[1] if "," in d["content"] else d["content"]
            pdf_bytes = base64.b64decode(base64_str)
            text = "\n".join(p.extract_text() for p in PyPDF2.PdfReader(io.BytesIO(pdf_bytes)).pages)
        else:
            text = d["content"]
            
        text = text[:15000]
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