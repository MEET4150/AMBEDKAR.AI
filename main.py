# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
import google.generativeai as genai
import PyPDF2
import docx
import os

# Initialize the Flask app
app = Flask(__name__)

# API Key for Google Generative AI
genai.configure(api_key="AIzaSyBUfKJ9ec__LaY7A23FHoQfZuQNgbD7fp4")

TOKEN_LIMIT = 4080
TEMPERATURE = 0.44

# === INIT MODEL ===
model = genai.GenerativeModel("gemini-2.0-flash")
chat_session = model.start_chat(history=[])

# === FILE READING FUNCTION ===
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
    return text[:120000]  # Safe limit for Gemini context

# === API Route for Chat ===
@app.route('/chat', methods=['POST'])
def chat_with_ai():
    try:
        # Get user input and uploaded file (if any) from the request
        user_input = request.json.get('user_input')
        file = request.files.get('file')

        document_text = None
        if file:
            # Save the uploaded file temporarily
            file_path = f"temp.{file.filename.split('.')[-1]}"
            file.save(file_path)

            # Read file content
            document_text = read_file(file_path)
            os.remove(file_path)  # Clean up the file after reading

        # Build the AI prompt
        if document_text:
            prompt = f"""
You are Ambedkar, an AI legal assistant trained exclusively on Indian Law (IPC, CrPC, Civil, Corporate).

Here is the uploaded document content:
\"\"\" 
{document_text}
\"\"\"

Now based on this document and Indian Judiciary system, answer the following:
\"\"\"
{user_input}
\"\"\"
Keep your answers strict to Indian laws, professional, and actionable.
"""
        else:
            prompt = f"""
You are Ambedkar, an AI legal assistant trained exclusively on Indian Law (IPC, CrPC, Civil, Corporate).

No document has been uploaded yet.

Answer the following user query strictly under Indian law:
\"\"\"
{user_input}
\"\"\"
Keep your answers strict to Indian laws, professional, and actionable.
"""

        # Send the prompt to the AI model and get the response
        response = chat_session.send_message(prompt, generation_config={"temperature": TEMPERATURE})
        return jsonify({"response": response.text.strip()}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === Run the Flask API server ===
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
