//dropdown menu stuff 
document.addEventListener("DOMContentLoaded", () => {
    const imgButton = document.getElementById("iconButton");
    const dropdown = document.getElementById("dropdownMenu");

    if (imgButton && dropdown) {
        imgButton.addEventListener("click", (e) => {
            e.stopPropagation(); 
            dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        });

        document.addEventListener("click", (event) => {
            if (!imgButton.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = "none";
            }
        });
    }
});


const categoryColors = ["#fade6d", "#9fc25a", "#b1c5ed", "#bc7fc5"];
let usedColors = [];
let words = initialWords;
const grid = document.getElementById('wordGrid');
const categoriesDiv = document.getElementById('categories');
const checkButton = document.getElementById('checkButton');
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
            selectedWords.length === 0;


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
const shuffleButton = document.getElementById("shuffleButton");
shuffleButton.addEventListener("click", shuffleGrid);


function shuffleGrid() {
    const boxes = Array.from(grid.children);    
    const selectedWordsSet = new Set(selectedWords);
    for (let i = boxes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [boxes[i], boxes[j]] = [boxes[j], boxes[i]];
    }

    grid.innerHTML = "";
    boxes.forEach(box => {
        if (selectedWordsSet.has(box.dataset.word)) {
            box.classList.add("selected");
        }
        grid.appendChild(box);
    });
}

const deselectAllButton = document.getElementById("deselectAllButton");
deselectAllButton.addEventListener("click", () => {
    selectedBoxes.forEach(box => box.classList.remove("selected"));

    selectedWords = [];
    selectedBoxes = [];

    checkButton.disabled = true;
    checkButton.textContent = "Select 4 words";

});
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;

    const winModal = document.getElementById('winModal');
    const playAgainBtn = document.getElementById('closeWinModal');

    if (winModal && winModal.style.display === 'flex') {
        playAgainBtn.click();
        return;
    }

    if (!checkButton.disabled && selectedWords.length === 4) {
        checkButton.click();
    }
});


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
            const winModal = document.getElementById('winModal');
            
            confetti({
                particleCount: 200,
                spread: 70,
                origin: { y: 0.6 }
            });

            winModal.style.display = 'flex';

            winModal.addEventListener('click', (event) => {
                if (event.target === winModal) {
                    winModal.style.display = 'none';
                    showEndButtons(); 
                }
            });
        
            document.getElementById('closeWinModal').onclick = async () => {
                winModal.style.display = 'none';
                const response = await fetch('/generate_words');
                words = await response.json();
                usedColors = [];
                selectedWords = [];
                selectedBoxes = [];
                categoriesDiv.innerHTML = '';
                checkButton.style.display = 'block';
                renderGrid();
            };
            
        }
        
    } catch (error) {
        resultDiv.textContent = 'Error finding connection. Try again!';
        resultDiv.style.backgroundColor = 'ede8e8';
        resultDiv.style.color = 'ffffff'; 
        checkButton.disabled = false;
        checkButton.textContent = 'Check Connection';
    }
});
// === NEW BUTTONS ===
const playAgainButton = document.getElementById("playAgainButton");
const shareButton = document.getElementById("shareButton");

// Appears when user clicks outside the modal
function showEndButtons() {
    playAgainButton.style.display = "inline-block";
    shareButton.style.display = "inline-block"; 
    deselectAllButton.style.display = "none";
    shuffleButton.style.display = "none";

}

// When clicking outside the modal
document.getElementById('winModal').addEventListener("click", (event) => {
    const modal = document.getElementById('winModal');

    if (event.target === modal) {
        modal.style.display = "none";
        showEndButtons(); 
    }
});

// PLAY AGAIN button (does NOT auto-show modal)
playAgainButton.addEventListener("click", async () => {
    const response = await fetch('/generate_words');
    words = await response.json();
    usedColors = [];
    selectedWords = [];
    selectedBoxes = [];
    categoriesDiv.innerHTML = '';
    checkButton.style.display = 'block';

    playAgainButton.style.display = "none";
    shareButton.style.display = "none";
    deselectAllButton.style.display = "inline-block";
    shuffleButton.style.display = "inline-block";

    renderGrid();
});

// SHARE button
shareButton.addEventListener("click", async () => {
    const target = document.querySelector(".categories");

    await new Promise(res => setTimeout(res, 50)); // wait for layout

    html2canvas(target, {
        scale: window.devicePixelRatio,
        useCORS: true,
        backgroundColor: null, 

    }).then(canvas => {
        canvas.toBlob(blob => {
            const file = new File([blob], "cognections.png", { type: "image/png" });

            if (navigator.share) {
                navigator.share({
                    files: [file],
                    title: "My Cognections result!"
                }).catch(() => {});
            } else {
                // fallback: download
                const link = document.createElement("a");
                link.href = canvas.toDataURL();
                link.download = "cognections.png";
                link.click();
            }
        });
    });
});




