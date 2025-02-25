// Game state
let selectedCells = [];
let foundWords = [];
let isDragging = false;
let startCell = null;
let direction = null;
let currentWords = []; // Stores the 15 randomly selected words
let secondsElapsed = 0; // Total seconds elapsed
let score = 0; // Added score tracking
let comboMultiplier = 1; // Combo multiplier
let comboTimeLeft = 0; // Time left for current combo
let comboInterval = null; // Combo timer interval

// Initialize the game
document.addEventListener("DOMContentLoaded", initializeGame);

// Reset button
document.getElementById("reset-button").addEventListener("click", resetGame);
// script.js

// Ensure settings apply on load
document.addEventListener('DOMContentLoaded', () => {
    initializeGame(); // Ensure this function exists
    updateSolvedWordStyle();

    // Apply saved dark mode setting
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    // Create options menu
    createOptionsMenu();
});

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
        </div>
    `;
    document.body.appendChild(container);

    // Add event listeners after menu is added to DOM
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);
    document.getElementById('style-original').addEventListener('click', () => changeSolvedWordStyle('original'));
    document.getElementById('style-bold').addEventListener('click', () => changeSolvedWordStyle('bold'));
    document.getElementById('style-highlighted').addEventListener('click', () => changeSolvedWordStyle('highlighted'));
    document.getElementById('options-button').addEventListener('click', toggleOptionsMenu);
}

// Function to toggle dark mode
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
}

// Function to set solved word display mode
function changeSolvedWordStyle(style) {
    localStorage.setItem('solvedWordStyle', style);
    updateSolvedWordStyle();
}

// Apply styles to found words
function updateSolvedWordStyle() {
    const words = document.querySelectorAll('.found');
    const style = localStorage.getItem('solvedWordStyle') || 'original';
    
    words.forEach(word => {
        word.classList.remove('bold-style', 'highlight-style', 'original-style');
        if (style === 'bold') {
            word.classList.add('bold-style');
        } else if (style === 'highlighted') {
            word.classList.add('highlight-style');
        } else {
            word.classList.add('original-style');
        }
    });
}

// Function to toggle options menu visibility
function toggleOptionsMenu() {
    document.getElementById('options-menu').classList.toggle('hidden');
}


// ========================
// Timer Functions
// ========================

function startTimer() {
  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000); // Update every second
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateTimerDisplay() {
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  document.getElementById("timer").textContent = timerDisplay;
}

// ========================
// Combo Functions
// ========================

function startComboTimer() {
  comboTimeLeft = 10; // Reset combo timer to 10 seconds
  updateComboBar();

  if (comboInterval) clearInterval(comboInterval); // Clear existing interval

  comboInterval = setInterval(() => {
    comboTimeLeft--;
    updateComboBar();

    if (comboTimeLeft <= 0) {
      clearInterval(comboInterval);
      comboMultiplier = 1; // Reset combo multiplier
      updateComboBar();
    }
  }, 1000); // Update every second
}

function updateComboBar() {
  const comboBar = document.getElementById("combo-bar");
  const comboText = document.getElementById("combo-text");

  // Update bar width
  comboBar.style.width = `${(comboTimeLeft / 10) * 100}%`;

  // Update combo text
  comboText.textContent = `Combo: ${comboMultiplier}x`;
}

// ========================
// Score Functions
// ========================

function updateScoreDisplay() {
  document.getElementById("score").textContent = `Score: ${score}`;
}

function calculatePoints(wordLength) {
  const timeChunk = Math.floor(secondsElapsed / 15); // Calculate 15-second chunks
  const pointsPerLetter = Math.max(50 - (timeChunk * 5), 0); // Base 50, decrease by 5 every 15 seconds
  return wordLength * pointsPerLetter * comboMultiplier; // Apply combo multiplier
}

// ========================
// Core Game Functions
// ========================

function initializeGame() {
  // Reset game state
  score = 0;
  secondsElapsed = 0;
  comboMultiplier = 1;
  comboTimeLeft = 0;
  updateScoreDisplay();
  updateTimerDisplay();
  updateComboBar();
  startTimer();

  // Get the word pool from the HTML
  const wordPoolElement = document.getElementById("word-pool");
  const wordPool = JSON.parse(wordPoolElement.dataset.words);

  // Randomly select 15 words from the pool
  currentWords = getRandomWords(wordPool, 15);

  const wordsearch = document.getElementById("wordsearch");
  const wordsContainer = document.getElementById("words");

  // Clear the grid and word list
  wordsearch.innerHTML = "";
  wordsContainer.innerHTML = ""; // Clear the word list completely

  // Create the "Words to find" box
  const wordsBox = document.createElement("div");
  wordsBox.style.border = "1px solid black"; // Thin black border
  wordsBox.style.padding = "10px"; // Restore original padding
  wordsBox.style.display = "grid";
  wordsBox.style.gap = "5px"; // Space between words
  wordsBox.style.marginTop = "20px"; // Add some space above the box
  wordsBox.style.overflow = "visible"; // Allow overflow
  wordsBox.style.width = "90%"; // Increase box width to almost full screen
  wordsBox.style.marginLeft = "auto"; // Center the box horizontally
  wordsBox.style.marginRight = "auto"; // Center the box horizontally

  // Set grid template columns
  wordsBox.style.gridTemplateColumns = "repeat(3, 1fr)"; // 3 equal-width columns

  // Add "Words to find:" title
  const wordsTitle = document.createElement("div");
  wordsTitle.textContent = "Words to find:";
  wordsTitle.style.gridColumn = "1 / -1"; // Span all columns
  wordsTitle.style.fontWeight = "bold"; // Make the title bold
  wordsTitle.style.marginBottom = "10px"; // Add space below the title
  wordsBox.appendChild(wordsTitle);

  // Add words in 3 columns and 5 rows
  currentWords.forEach((word, index) => {
    const wordElement = document.createElement("div");
    wordElement.textContent = word;
    wordElement.style.whiteSpace = "nowrap"; // Prevent text wrapping
    wordElement.style.overflow = "visible"; // Allow overflow
    wordElement.style.fontSize = "0.75em"; // Decrease font size by 25%
    wordsBox.appendChild(wordElement);
  });

  // Append the words box to the words container
  wordsContainer.appendChild(wordsBox);

  // Create the grid
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cell = createCell(i, j);
      wordsearch.appendChild(cell);
    }
  }

  // Place words and fill random letters
  currentWords.forEach(word => placeWord(word));
  fillRandomLetters();

  // Add touch support
  addTouchSupport();
}

// Function to randomly select N words from the pool
function getRandomWords(pool, count) {
  const shuffled = [...pool].sort(() => 0.5 - Math.random()); // Shuffle the pool
  return shuffled.slice(0, count); // Select the first N words
}

function createCell(row, col) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.row = row;
  cell.dataset.col = col;
  cell.textContent = "";
  cell.addEventListener("mousedown", () => startDrag(cell));
  cell.addEventListener("mouseenter", () => dragOver(cell));
  cell.addEventListener("mouseup", endDrag);
  return cell;
}

function placeWord(word) {
  const directions = ["horizontal", "vertical", "diagonal"];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  let row, col;

  if (direction === "horizontal") {
    row = Math.floor(Math.random() * gridSize);
    col = Math.floor(Math.random() * (gridSize - word.length));
  } else if (direction === "vertical") {
    col = Math.floor(Math.random() * gridSize);
    row = Math.floor(Math.random() * (gridSize - word.length));
  } else {
    row = Math.floor(Math.random() * (gridSize - word.length));
    col = Math.floor(Math.random() * (gridSize - word.length));
  }

  if (canPlaceWord(word, row, col, direction)) {
    for (let i = 0; i < word.length; i++) {
      let cell;
      if (direction === "horizontal") {
        cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
      } else if (direction === "vertical") {
        cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
      } else {
        cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);
      }
      cell.textContent = word[i];
    }
  } else {
    placeWord(word); // Retry placement
  }
}

function canPlaceWord(word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    const cell = direction === "horizontal"
      ? document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`)
      : direction === "vertical"
      ? document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`)
      : document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);

    if (!cell || (cell.textContent !== "" && cell.textContent !== word[i])) {
      return false;
    }
  }
  return true;
}

function fillRandomLetters() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  document.querySelectorAll(".cell").forEach(cell => {
    if (cell.textContent === "") {
      cell.textContent = letters[Math.floor(Math.random() * letters.length)];
    }
  });
}

// ========================
// User Interaction (Updated Drag Logic)
// ========================

function startDrag(cell) {
  if (!cell) return;
  isDragging = true;
  startCell = cell;
  selectedCells = [cell];
  direction = null; // Reset direction on new drag

  // Ensure the starting cell is visually selected
  cell.classList.add("selected");
}


function dragOver(cell) {
  if (!isDragging || !startCell) return;

  // Ensure startCell remains in selection
  if (!selectedCells.includes(startCell)) {
    selectedCells = [startCell];
    startCell.classList.add("selected");
  }

  // Get row/col positions
  const startRow = parseInt(startCell.dataset.row);
  const startCol = parseInt(startCell.dataset.col);
  const currentRow = parseInt(cell.dataset.row);
  const currentCol = parseInt(cell.dataset.col);

  // Calculate direction deltas
  const rowDiff = currentRow - startRow;
  const colDiff = currentCol - startCol;

  // Determine movement direction
  let newDirection = null;
  if (rowDiff === 0) newDirection = "horizontal";
  else if (colDiff === 0) newDirection = "vertical";
  else if (Math.abs(rowDiff) === Math.abs(colDiff)) newDirection = "diagonal";
  else return; // Ignore invalid movements

  // Allow changing direction dynamically
  if (!direction || newDirection !== direction) {
    direction = newDirection;
  }

  // Calculate step values
  const rowStep = Math.sign(rowDiff);
  const colStep = Math.sign(colDiff);

  // Build new selection path
  let row = startRow;
  let col = startCol;
  let newSelection = [startCell]; // Start cell remains selected

  while (row !== currentRow || col !== currentCol) {
    row += rowStep;
    col += colStep;
    const nextCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!nextCell) break;
    newSelection.push(nextCell);
  }

  // Ensure the last cell is the current cell to keep valid paths
  if (newSelection[newSelection.length - 1] !== cell) return;

  // Apply new selection
  selectedCells.forEach(c => c.classList.remove("selected"));
  newSelection.forEach(c => c.classList.add("selected"));
  selectedCells = newSelection;
}

function endDrag() {
  isDragging = false;
  direction = null;
  checkForWord();
}

function checkForWord() {
  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  if (currentWords.includes(selectedWord) && !foundWords.includes(selectedWord)) {
    // Calculate and add score
    const wordScore = calculatePoints(selectedWord.length);
    score += wordScore;
    updateScoreDisplay();

    // Update combo
    if (comboTimeLeft > 0) {
      comboMultiplier += 0.25; // Increase combo multiplier
    }
    startComboTimer(); // Restart combo timer

    foundWords.push(selectedWord);
    selectedCells.forEach(cell => {
      if (!cell.classList.contains("found")) {
        cell.classList.add("found");
      }
      cell.classList.remove("selected");
    });

    document.querySelectorAll("#words div").forEach(el => {
      if (el.textContent === selectedWord) el.classList.add("found");
    });

    if (foundWords.length === currentWords.length) {
      stopTimer();
      alert(`Good Job Big Dog!\nFinal Score: ${score}`);
    }
  } else {
    selectedCells.forEach(cell => {
      cell.classList.remove("selected");
    });
  }
  selectedCells = [];
}

// ========================
// Mobile Support (Updated Touch Logic)
// ========================

function addTouchSupport() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach(cell => {
    cell.addEventListener("touchstart", handleTouchStart);
    cell.addEventListener("touchmove", handleTouchMove);
    cell.addEventListener("touchend", handleTouchEnd);
  });
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  
  if (target?.classList.contains("cell")) {
    startDrag(target);
  }
}


function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target?.classList.contains("cell")) {
    // Only process if moving to new cell
    if (target !== selectedCells[selectedCells.length - 1]) {
      dragOver(target);
    }
  }
}

function handleTouchEnd() {
  endDrag();
}

// ========================
// Reset Functionality
// ========================

function resetGame() {
  document.getElementById("wordsearch").innerHTML = "";
  selectedCells = [];
  foundWords = [];
  score = 0;
  comboMultiplier = 1;
  comboTimeLeft = 0;
  updateScoreDisplay();
  updateComboBar();
  stopTimer();
  initializeGame();
}