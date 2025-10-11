from flask import Flask, jsonify, render_template_string
from google import genai
import os, json
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)
app = Flask(__name__)

# Function to get 16 random words from Gemini
def generate_words():
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Generate exactly 16 random words from the standard Oxford Dictionary that most people would understand. "
                 "and return them as a JSON array of strings."
    )
    try:
        words = json.loads(response.text)
    except:
        words = [
            w.strip().strip('"').strip("'")
            for w in response.text.replace("```json", "").replace("```", "")
                                   .replace("[", "").replace("]", "")
                                   .replace("\n", " ")
                                   .split(",")
            if w.strip()
        ]
    return words

# Home page
@app.route("/")
def index():
    words = generate_words()
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <title>Word Connection Game</title>
    <style>
        /* ===== Preserve original notebook fonts & styling ===== */
        body {{
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            background-color: #fff;
            color: black;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
        }}
        .categories {{
            margin-bottom: 20px;
        }}
        .category-group {{
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 10px;
            text-align: center;
            animation: slideDown 0.3s ease;
        }}
        @keyframes slideDown {{
            from {{ opacity: 0; transform: translateY(-20px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        .category-title {{
            color: black;
            font-size: 18px;
            font-weight: bolder;
            text-transform: uppercase;
            margin-bottom: 8px;
        }}
        .category-words {{
            color: black;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }}
        .word-box {{
            background-color: #efefe6;
            border: none;
            border-radius: 8px;
            padding: 30px 20px;
            text-align: center;
            font-size: 16px;
            font-weight: 700;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .word-box:hover {{
            background-color: #5a594e;
            color: white;
            transform: translateY(-2px);
        }}
        .word-box.selected {{
            background-color: #5a594e;
            color: white;
        }}
        .word-box.hidden {{
            display: none;
        }}
        #checkButton, #playAgainButton {{
            display: block;
            margin: 20px auto;
            padding: 15px 30px;
            font-size: 16px;
            font-weight: 700;
            background-color: #5a594e;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.15s ease;
        }}
        #checkButton:hover, #playAgainButton:hover {{
            background-color: #3a3930;
        }}
        #checkButton:disabled {{
            background-color: #ccc;
            cursor: not-allowed;
        }}
        #playAgainButton {{
            display: none;
        }}
        #result {{
            margin: 20px auto;
            padding: 15px;
            text-align: center;
            font-size: 14px;
            border-radius: 8px;
        }}
    </style>
    </head>
    <body>
    <div class="container">
        <div id="categories" class="categories"></div>
        <div class="grid" id="wordGrid"></div>
        <button id="checkButton" disabled>Select 4 words</button>
        <button id="playAgainButton">Play Again</button>
        <div id="result"></div>
    </div>

    <script>
        const categoryColors = ["#fade6d", "#9fc25a", "#b1c5ed", "#bc7fc5"];
        let usedColors = [];
        let words = {words};
        const grid = document.getElementById('wordGrid');
        const categoriesDiv = document.getElementById('categories');
        const checkButton = document.getElementById('checkButton');
        const playAgainButton = document.getElementById('playAgainButton');
        const resultDiv = document.getElementById('result');
        let selectedWords = [];
        let selectedBoxes = [];

        function renderGrid() {{
            grid.innerHTML = '';
            const shuffled = [...words].sort(() => Math.random() - 0.5);
            shuffled.forEach(word => {{
                const box = document.createElement('div');
                box.className = 'word-box';
                box.textContent = word;
                box.dataset.word = word;

                box.addEventListener('click', () => {{
                    if(box.classList.contains('selected')) {{
                        box.classList.remove('selected');
                        selectedWords = selectedWords.filter(w => w!==word);
                        selectedBoxes = selectedBoxes.filter(b=>b!==box);
                    }} else {{
                        if(selectedWords.length<4) {{
                            box.classList.add('selected');
                            selectedWords.push(word);
                            selectedBoxes.push(box);
                        }}
                    }}
                    if(selectedWords.length===4) {{
                        checkButton.disabled=false;
                        checkButton.textContent='Check Connection';
                    }} else {{
                        checkButton.disabled=true;
                        checkButton.textContent=`Select 4 words (${{selectedWords.length}}/4)`;
                    }}
                }});
                grid.appendChild(box);
            }});
        }}

        renderGrid();

        checkButton.addEventListener('click', async () => {{
            checkButton.disabled=true;
            checkButton.textContent='Checking...';
            resultDiv.textContent='Finding connection...';
            resultDiv.style.backgroundColor='#f0f0f0';

            try {{
                const response = await fetch(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}',
                    {{
                        method:'POST',
                        headers:{{ 'Content-Type':'application/json' }},
                        body: JSON.stringify({{ contents:[{{ parts:[{{ text:`Find a creative and clever connection that describes these 4 words: ${{selectedWords.join(', ')}}. Explain in 3-6 words, no extra words. I don't want to see ANY asterisks or extra punctuation of any sort.  EVERY single word should fit within the connection and it should be a simple connection that DESCRIBES each of the four words. The connection should NOT include any of the four words.  ` }}] }}] }})
                    }}
                );
                const data = await response.json();
                const connection = data.candidates[0].content.parts[0].text.trim();

                const categoryGroup = document.createElement('div');
                categoryGroup.className='category-group';
                const availableColors = categoryColors.filter(c=>!usedColors.includes(c));
                const randomColor = availableColors[Math.floor(Math.random()*availableColors.length)];
                usedColors.push(randomColor);
                categoryGroup.style.backgroundColor=randomColor;
                categoryGroup.innerHTML=`<div class="category-title">${{connection}}</div>
                                         <div class="category-words">${{selectedWords.join(', ')}}</div>`;
                categoriesDiv.appendChild(categoryGroup);

                selectedBoxes.forEach(box=>box.classList.add('hidden'));
                selectedWords=[]; selectedBoxes=[];
                checkButton.disabled=true;
                checkButton.textContent='Select 4 words';
                resultDiv.textContent='';
                resultDiv.style.backgroundColor='';

                if(usedColors.length===4){{
                    checkButton.style.display='none';
                    playAgainButton.style.display='block';
                }}
            }} catch(error) {{
                resultDiv.textContent='Error finding connection. Try again!';
                resultDiv.style.backgroundColor='#f8d7da';
                checkButton.disabled=false;
                checkButton.textContent='Check Connection';
            }}
        }});

        // Fetch new 16 words from backend
        playAgainButton.addEventListener('click', async () => {{
            const response = await fetch('/generate_words');
            words = await response.json();
            usedColors = [];
            selectedWords = [];
            selectedBoxes = [];
            categoriesDiv.innerHTML = '';  // <-- clear previous categories
            checkButton.style.display = 'block';
            playAgainButton.style.display = 'none';
            renderGrid();
        }});
    </script>
    </body>
    </html>
    """
    return render_template_string(html_content)

# Route for new words
@app.route("/generate_words")
def get_new_words():
    words = generate_words()
    return jsonify(words)

if __name__ == "__main__":
    app.run(debug=True)
