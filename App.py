import os
import traceback
import PyPDF2
import docx2txt
from flask import Flask, request, session, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bs4 import BeautifulSoup
import requests
# from googletrans import Translator
from google.generativeai import configure, GenerativeModel
from routes.auth import auth_routes  # ✅ use here
from routes.admin import admin_routes  # ✅ use here


# chat_routes = Blueprint('chat_routes', __name__)  
# === Flask Setup ===
app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)
# app.register_blueprint(auth_routes)
# app.register_blueprint(chat_routes)
# app.config['SESSION_TYPE'] = 'filesystem'


# === MongoDB ===
client = MongoClient('mongodb://localhost:27017/')
db = client["chat_db"]

# === Gemini Setup ===
configure(api_key="AIzaSyDlMXusLUTa-WIpd59ml2xnlGCis122V9k")  # Replace with your Gemini key
model = GenerativeModel("gemini-2.0-flash")
TEMPERATURE = 0.4
system_instruction = (
    "You are Ambedkar AI, a legal assistant exclusively trained on the Indian legal system.\n"
    "Your task is to interpret laws, judgments, and legal documents strictly according to Indian law.\n"
    "Never provide advice based on international laws. Always cite IPC, CrPC, or applicable Indian acts.\n"
)

# === Token Management ===
USER_TOKENS = {
    "555": 10000,
    "1111": 200000,
}
token_usage = {}

def check_token_limit(user_id, tokens_used):
    allowed = USER_TOKENS.get(user_id)
    if allowed is None:
        return False, "❌ Invalid plan ID."
    used = token_usage.get(user_id, 0)
    if used + tokens_used > allowed:
        return False, f"❌ Token limit exceeded: {used + tokens_used}/{allowed}"
    token_usage[user_id] = used + tokens_used
    return True, f"✅ Token usage: {token_usage[user_id]}/{allowed}"

# === File Reader ===
def extract_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".pdf":
            text = ""
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text
        elif ext == ".docx":
            return docx2txt.process(file_path)
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        else:
            return None
    except Exception as e:
        return f"[ERROR] Failed to extract: {e}"

# === Translate ===
def translate_text(text, target_lang='en'):
    try:
        if not text:
            return "⚠️ No document content to translate."
        translator = Translator()
        translated = translator.translate(str(text), dest=target_lang)
        return translated.text
    except Exception as e:
        return f"[ERROR] Translation failed: {e}"

# === Legal News ===
def fetch_legal_news():
    try:
        url = "https://www.barandbench.com/news"
        r = requests.get(url)
        soup = BeautifulSoup(r.content, "html.parser")
        headlines = [h.get_text(strip=True) for h in soup.find_all("h3")[:5]]
        return "\n".join(headlines) if headlines else "No headlines found."
    except Exception as e:
        return f"Error fetching news: {e}"

# === Chat API ===
@app.route('/chat', methods=['POST'])
def chat():
    if 'email' not in session:
        return jsonify({"error": "Login required"}), 401

    try:
        # Handle incoming data
        if request.is_json:
            user_input = request.json.get('message')
            file = None
        else:
            user_input = request.form.get('message') or request.form.get('user_input')
            file = request.files.get('file')

        if not user_input and not file:
            return jsonify({"error": "Please provide a message or upload a file."}), 400

        # Extract file content if provided
        document_text = ""
        if file:
            ext = file.filename.split('.')[-1]
            file_path = f"temp.{ext}"
            file.save(file_path)
            document_text = extract_text(file_path)
            os.remove(file_path)

        # Build prompt
        prompt = f"{system_instruction}\n"
        if document_text:
            prompt += f"Document:\n{document_text}\n\n"
        if user_input:
            prompt += f"User Question:\n{user_input}\n"
        else:
            prompt += "User Question: Please analyze the uploaded document.\n"

        # Generate AI response
        response = model.generate_content(prompt, generation_config={"temperature": TEMPERATURE})
        ai_reply = response.text.strip()
 
        # === TOKEN COUNTING ===
        def count_tokens(text):
            return len(text.strip().split()) // 4  # 4 words = 1 token

        prompt_tokens = count_tokens(prompt)
        response_tokens = count_tokens(ai_reply)
        total_tokens = prompt_tokens + response_tokens

        # === GET USER TOKEN ===
        email = session.get('email')
        user_token_doc = db.tokens.find_one({"email": email})
        if not user_token_doc or user_token_doc.get("tokens", 0) <= 0:
            return jsonify({"error": "No tokens found for this user"}), 403

        remaining_tokens = user_token_doc["tokens"]

        if total_tokens > remaining_tokens:
            return jsonify({"error": "Insufficient tokens."}), 403

        # === REDUCE TOKENS ONLY ===
        db.tokens.update_one(
            {"email": email},
            {"$inc": {"tokens": -total_tokens}}
        )

        return jsonify({
            "success": True,
            "response": ai_reply,
            "tokens_used": total_tokens,
            "remaining_tokens": remaining_tokens - total_tokens
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# === Import Routes & Register ===
from routes.auth import auth_routes, init_db as init_auth
from routes.chat import chat_routes, init_db as init_chat
from routes.admin import admin_routes, init_db as init_admin

# Inject DB
init_auth(db)
init_chat(db)
init_admin(db)

# Register Routes
app.register_blueprint(auth_routes, url_prefix='/')
app.register_blueprint(chat_routes, url_prefix='/chat')
app.register_blueprint(admin_routes, url_prefix='/admin')
# app.register_blueprint(auth_routes)

# Run App
if __name__ == "__main__":
    app.run(debug=True, port=5000)
