
// Game state
let selectedCells = [];
let foundWords = [];
let isDragging = false;
let startCell = null;
let direction = null;
let currentWords = []; // Stores the 15 randomly selected words
let timerInterval = null; // Timer interval
let secondsElapsed = 0; // Total seconds elapsed
let score = 0; // Added score tracking
let comboTimeLeft = 0; // Time left for current combo
let comboInterval = null; // Combo timer interval

// Initialize the game
document.addEventListener("DOMContentLoaded", () => {
    initializeGame();
    updateSolvedWordStyle();
    updateHighlightColor();
    positionElementsAbovePuzzle();
    createOptionsMenu();
});

// Reset button
document.getElementById("reset-button").addEventListener("click", resetGame);

// Create and add options menu
function createOptionsMenu() {
    const container = document.createElement('div');
    container.id = 'options-container';
    container.innerHTML = `
        <button id="options-button">☰</button>
        <div id="options-menu" class="hidden">
            <button id="dark-mode-toggle">Toggle Dark Mode</button>
            <h3>Word Found Display:</h3>
            <button id="style-original">Original</button>
            <button id="style-bold">Bold</button>
            <button id="style-highlighted">Highlighted</button>
            <h3>Highlight Color:</h3>
            <input type="color" id="highlight-color-picker" value="#4984B8">
        </div>
    `;
    document.body.appendChild(container);

    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);
    document.getElementById('style-original').addEventListener('click', () => changeSolvedWordStyle('original'));
    document.getElementById('style-bold').addEventListener('click', () => changeSolvedWordStyle('bold'));
    document.getElementById('style-highlighted').addEventListener('click', () => changeSolvedWordStyle('highlighted'));
    document.getElementById('options-button').addEventListener('click', toggleOptionsMenu);
    document.getElementById('highlight-color-picker').addEventListener('input', changeHighlightColor);
}

// Function to toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Function to change highlight color
function changeHighlightColor(event) {
    const color = event.target.value;
    localStorage.setItem('highlightColor', color);
    updateHighlightColor();
}

// Apply stored highlight color to selection style
function updateHighlightColor() {
    const color = localStorage.getItem('highlightColor') || '#4984B8';
    document.documentElement.style.setProperty('--highlight-color', color);
}

// Function to ensure timer and combo meter are positioned correctly
function positionElementsAbovePuzzle() {
    const puzzle = document.getElementById('wordsearch');
    const timer = document.getElementById('timer');
    const combo = document.getElementById('combo-container');

    if (puzzle && timer && combo) {
        const puzzleRect = puzzle.getBoundingClientRect();
        timer.style.top = `${puzzleRect.top - 50}px`;
        timer.style.left = `${puzzleRect.left}px`;
        combo.style.top = `${puzzleRect.top + 50}px`;
        combo.style.right = "10px";
    }
}

// Restore and update combo meter functionality
let comboMultiplier = 1;
let comboTimer;
let comboActive = false;

function startCombo() {
    if (comboActive) {
        comboMultiplier++;
    } else {
        comboMultiplier = 1;
        comboActive = true;
    }
    document.getElementById("combo-text").textContent = `Combo: ${comboMultiplier}x`;

    clearTimeout(comboTimer);
    let comboBar = document.getElementById("combo-bar");
    comboBar.style.width = "100%";

    let duration = 5000;
    let startTime = Date.now();

    function decreaseBar() {
        let elapsedTime = Date.now() - startTime;
        let progress = elapsedTime / duration;
        comboBar.style.width = `${100 - progress * 100}%`;
        if (progress < 1) {
            requestAnimationFrame(decreaseBar);
        } else {
            endCombo();
        }
    }
    requestAnimationFrame(decreaseBar);
    comboTimer = setTimeout(endCombo, duration);
}

function endCombo() {
    comboActive = false;
    comboMultiplier = 1;
    document.getElementById("combo-text").textContent = "Combo: 1x";
    document.getElementById("combo-bar").style.width = "0%";
}
