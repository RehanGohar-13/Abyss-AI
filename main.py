import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError("GROQ_API_KEY not found. Set it in .env file.")

API_URL = "https://api.groq.com/openai/v1/chat/completions"

system_prompt = """You are Abyss, a powerful and versatile AI agent."""

print("=" * 50)
print("  ABYSS AI AGENT — Ready")
print("=" * 50)

messages = [{"role": "system", "content": system_prompt}]

while True:
    user_input = input("\n🧑 You: ")
    
    if user_input.lower() == "exit":
        print("\n🌊 Abyss: Going dark.")
        break
    
    messages.append({"role": "user", "content": user_input})
    
    try:
        response = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages
            }
        )
        
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        print(f"\n🌊 Abyss: {reply}")
        messages.append({"role": "assistant", "content": reply})
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Raw:", response.text)