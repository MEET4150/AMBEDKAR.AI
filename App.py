import os
import traceback
import PyPDF2
import docx2txt
from flask import Flask, request, jsonify
from flask_cors import CORS
from googletrans import Translator
from google.generativeai import configure, GenerativeModel
from bs4 import BeautifulSoup
import requests

# === Flask Setup ===
app = Flask(__name__)
CORS(app)

# === Gemini Setup ===
configure(api_key="AIzaSyBqk4WXN7k4UhjaBCzgSmuWn_bEor5aSyw")  # Replace with your Gemini key
model = GenerativeModel("gemini-2.0-flash")

# === Constants ===
TEMPERATURE = 0.4
system_instruction = (
    "You are Ambedkar AI, a legal assistant exclusively trained on the Indian legal system.\n"
    "Your task is to interpret laws, judgments, and legal documents strictly according to Indian law.\n"
    "Never provide advice based on international laws. Always cite IPC, CrPC, or applicable Indian acts.\n"
)

# === User Token Plans ===
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

# === Google Translate ===
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

# === API Endpoint ===
@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Accept both JSON and form-data
        if request.is_json:
            user_input = request.json.get('message')
            user_id = request.json.get('user_id', '555')
            file = None
        else:
            user_input = request.form.get('message') or request.form.get('user_input')
            user_id = request.form.get('user_id', '555')
            file = request.files.get('file')

        # If neither message nor file is provided
        if not user_input and not file:
            return jsonify({"error": "Please provide a message or upload a file."}), 400

        document_text = ""
        if file:
            ext = file.filename.split('.')[-1]
            file_path = f"temp.{ext}"
            file.save(file_path)
            document_text = extract_text(file_path)
            os.remove(file_path)

        prompt = f"{system_instruction}\n"

        if document_text:
            prompt += f"Document:\n{document_text}\n\n"

        if user_input:
            prompt += f"User Question:\n{user_input}\n"
        else:
            prompt += "User Question: Please analyze the uploaded document.\n"

        response = model.generate_content(prompt, generation_config={"temperature": TEMPERATURE})

        tokens_used = len(prompt.split()) + len(response.text.split())
        status, msg = check_token_limit(user_id, tokens_used)
        if not status:
            return jsonify({"response": msg}), 403

        return jsonify({
            "response": response.text.strip(),
            "tokens_used": tokens_used,
            "token_status": msg
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# === Run the Flask App ===
if __name__ == "__main__":
    app.run(debug=True, port=5000)
