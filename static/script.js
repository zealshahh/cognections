const categoryColors = ["#fade6d", "#9fc25a", "#b1c5ed", "#bc7fc5"];
let usedColors = [];
let words = initialWords;
const grid = document.getElementById('wordGrid');
const categoriesDiv = document.getElementById('categories');
const checkButton = document.getElementById('checkButton');
const playAgainButton = document.getElementById('playAgainButton');
const resultDiv = document.getElementById('result');
let selectedWords = [];
let selectedBoxes = [];

function renderGrid() {
    grid.innerHTML = '';
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    shuffled.forEach(word => {
        const box = document.createElement('div');
        box.className = 'word-box';
        box.textContent = word;
        box.dataset.word = word;

        box.addEventListener('click', () => {
            if (box.classList.contains('selected')) {
                box.classList.remove('selected');
                selectedWords = selectedWords.filter(w => w !== word);
                selectedBoxes = selectedBoxes.filter(b => b !== box);
            } else {
                if (selectedWords.length < 4) {
                    box.classList.add('selected');
                    selectedWords.push(word);
                    selectedBoxes.push(box);
                }
            }

            if (selectedWords.length === 4) {
                checkButton.disabled = false;
                checkButton.textContent = 'Check Connection';
            } else {
                checkButton.disabled = true;
                checkButton.textContent = `Select 4 words (${selectedWords.length}/4)`;
            }
        });

        grid.appendChild(box);
    });
}

renderGrid();

checkButton.addEventListener('click', async () => {
    checkButton.disabled = true;
    checkButton.textContent = 'Checking...';
    resultDiv.textContent = 'Finding connection...';
    resultDiv.style.backgroundColor = '#f0f0f0';

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Find a creative and clever connection between these 4 words: ${selectedWords.join(', ')}. The connection should be a phrase of 3-6 words that DESCRIBES all of the words. Include NO additional words, no explanation. JUST the connection. NO ASTERISKS OR PERIODS. It shouldn't be something like "words with 4 letters," try to focus on the meaning of the words. `
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        const connection = data.candidates[0].content.parts[0].text.trim();

        const categoryGroup = document.createElement('div');
        categoryGroup.className = 'category-group';
        const availableColors = categoryColors.filter(c => !usedColors.includes(c));
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        usedColors.push(randomColor);
        categoryGroup.style.backgroundColor = randomColor;
        categoryGroup.innerHTML = `
            <div class="category-title">${connection}</div>
            <div class="category-words">${selectedWords.join(', ')}</div>
        `;
        categoriesDiv.appendChild(categoryGroup);

        selectedBoxes.forEach(box => box.classList.add('hidden'));
        selectedWords = [];
        selectedBoxes = [];
        checkButton.disabled = true;
        checkButton.textContent = 'Select 4 words';
        resultDiv.textContent = '';
        resultDiv.style.backgroundColor = '';

        if (usedColors.length === 4) {
            checkButton.style.display = 'none';
            // Show "You Win" modal
            const winModal = document.getElementById('winModal');
            winModal.style.display = 'flex';
        
            // When user clicks "Play Again" in modal
            document.getElementById('closeWinModal').onclick = async () => {
                winModal.style.display = 'none';
                const response = await fetch('/generate_words');
                words = await response.json();
                usedColors = [];
                selectedWords = [];
                selectedBoxes = [];
                categoriesDiv.innerHTML = '';
                checkButton.style.display = 'block';
                playAgainButton.style.display = 'none';
                renderGrid();
            };
        }
        
    } catch (error) {
        resultDiv.textContent = 'Error finding connection. Try again!';
        resultDiv.style.backgroundColor = '#f8d7da';
        checkButton.disabled = false;
        checkButton.textContent = 'Check Connection';
    }
});

playAgainButton.addEventListener('click', async () => {
    const response = await fetch('/generate_words');
    words = await response.json();
    usedColors = [];
    selectedWords = [];
    selectedBoxes = [];
    categoriesDiv.innerHTML = '';
    checkButton.style.display = 'block';
    playAgainButton.style.display = 'none';
    renderGrid();
});
