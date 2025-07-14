# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
import google.generativeai as genai
import PyPDF2
import docx
import os
import traceback
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# API Key for Gemini
genai.configure(api_key="AIzaSyCo6ZbkhGjcHaf3CD9TnH6SiDdCCRWGzI4")

TOKEN_LIMIT = 4080
TEMPERATURE = 0.44

# Initialize Gemini model
model = genai.GenerativeModel("gemini-2.0-flash")
chat_session = model.start_chat(history=[])

# Read uploaded file
def read_file(file_path):
    text = ""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        with open(file_path, "rb") as f:
            pdf_reader = PyPDF2.PdfReader(f)
            for page in pdf_reader.pages:
                text += page.extract_text()
    elif ext == ".docx":
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    elif ext == ".txt":
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
    else:
        raise ValueError("Unsupported file format.")
    return text[:120000]

# Chat endpoint
@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    return jsonify({"response": user_input}), 200
    try:
        # user_input = request.form.get('user_input')
        file = request.files.get('file')

        document_text = None
        if file:
            file_path = f"temp.{file.filename.split('.')[-1]}"
            file.save(file_path)
            document_text = read_file(file_path)
            os.remove(file_path)

        prompt = (
            f"You are Ambedkar, an AI legal assistant trained exclusively on Indian Law.\n\n"
            f"{'Document:\n' + document_text if document_text else 'No document provided.'}\n\n"
            f"User Question:\n{user_input}"
        )

        response = chat_session.send_message(prompt, generation_config={"temperature": TEMPERATURE})
        return jsonify({"response": response.text.strip()}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# Run Flask
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
