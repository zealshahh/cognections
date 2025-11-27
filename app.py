from flask import Flask, jsonify, render_template
from google import genai
from google.genai import types
import os
import json
import random
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DEV_MODE = False  

client = genai.Client(api_key=GEMINI_API_KEY)
app = Flask(__name__)

def generate_words():
    if DEV_MODE: 
        return [ "word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10", "word11", "word12", "word13", "word14", "word15", "word16" ]
    prompt = (
        "Generate exactly 16 unique, random words. "
        "The words must be from the standard English dictionary, "
        "not difficult to understand, but also not too basic. "
        "They should be a combination of nouns, verbs, adjectives, and adverbs. "
        "Crucially, do not repeat any word. AND THERE SHOULD BE NO EXTRA CHARACTERS OR ASTERISKS "
        "Return the 16 unique words as a JSON array of strings, and nothing else."
    )

    config = types.GenerateContentConfig(
        temperature=1.2,
        frequency_penalty=1.5,
        presence_penalty=1.0,
        response_mime_type="application/json",
        response_schema=types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING)
        ),
    )

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=config
    )
    
    try:
        words = response.candidates[0].content.parts[0].text
        words_list = json.loads(words)
    except Exception:
        words_list = [
            w.strip().strip('"').strip("'")
            for w in response.text.replace("```json", "")
                                   .replace("```", "")
                                   .replace("[", "")
                                   .replace("]", "")
                                   .replace("\n", " ")
                                   .split(",")
            if w.strip()
        ]

    unique_words = list(set(words_list))
    
    random.shuffle(unique_words)
    
    return unique_words[:16]

@app.route("/")
def index():
    words = generate_words()
    return render_template("index.html", words=words, gemini_api_key=GEMINI_API_KEY)

@app.route("/generate_words")
def get_new_words():
    return jsonify(generate_words())

@app.route("/instructions")
def instructions():
    return render_template("instructions.html")  
@app.route("/about_me")
def about():
    return render_template("about.html")
if __name__ == "__main__":
    app.run(debug=True)