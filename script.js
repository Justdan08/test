// Check if gridSize and words are defined (they should be in your HTML)
if (typeof gridSize === "undefined" || typeof words === "undefined") {
  console.error("Error: gridSize or words are not defined. Define them in your HTML!");
}

// Game state
let selectedCells = [];
let foundWords = [];
let isDragging = false;

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", initializeGame);

// Reset button functionality
document.getElementById("reset-button").addEventListener("click", resetGame);

// ========================
// Core Functions
// ========================

function initializeGame() {
  // Clear existing grid and word list
  const wordsearch = document.getElementById("wordsearch");
  const wordsContainer = document.getElementById("words");
  wordsearch.innerHTML = "";
  wordsContainer.innerHTML = "<div>Words to find:</div>";

  // Create the grid
  wordsearch.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cell = createCell(i, j);
      wordsearch.appendChild(cell);
    }
  }

  // Place words and fill random letters
  words.forEach(word => placeWord(word));
  fillRandomLetters();

  // Display words to find
  words.forEach(word => {
    const wordElement = document.createElement("div");
    wordElement.textContent = word;
    wordsContainer.appendChild(wordElement);
  });

  // Add touch support
  addTouchSupport();
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
  const direction = Math.random() < 0.5 ? "horizontal" : "vertical";
  let row, col;

  if (direction === "horizontal") {
    row = Math.floor(Math.random() * gridSize);
    col = Math.floor(Math.random() * (gridSize - word.length));
    if (canPlaceWord(word, row, col, direction)) {
      for (let i = 0; i < word.length; i++) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
        cell.textContent = word[i];
      }
    } else {
      placeWord(word); // Retry placing the word
    }
  } else {
    col = Math.floor(Math.random() * gridSize);
    row = Math.floor(Math.random() * (gridSize - word.length));
    if (canPlaceWord(word, row, col, direction)) {
      for (let i = 0; i < word.length; i++) {
        const cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
        cell.textContent = word[i];
      }
    } else {
      placeWord(word); // Retry placing the word
    }
  }
}

function canPlaceWord(word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    const cell = direction === "horizontal"
      ? document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`)
      : document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
    if (cell.textContent !== "" && cell.textContent !== word[i]) {
      return false; // Conflict detected
    }
  }
  return true; // No conflicts
}

function fillRandomLetters() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const cells = document.querySelectorAll(".cell");
  cells.forEach(cell => {
    if (cell.textContent === "") {
      cell.textContent = letters[Math.floor(Math.random() * letters.length)];
    }
  });
}

// ========================
// User Interaction
// ========================

function startDrag(cell) {
  isDragging = true;
  selectedCells = [cell];
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (isDragging && !selectedCells.includes(cell)) {
    selectedCells.push(cell);
    cell.classList.add("selected");
  }
}

function endDrag() {
  isDragging = false;
  checkForWord();
}

function checkForWord() {
  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  if (words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
    foundWords.push(selectedWord);
    selectedCells.forEach(cell => cell.classList.add("found"));
    selectedCells = [];

    // Mark the word as found
    const wordElements = document.querySelectorAll("#words div");
    wordElements.forEach(el => {
      if (el.textContent === selectedWord) {
        el.classList.add("found");
      }
    });

    if (foundWords.length === words.length) {
      alert("Good Job Big Dog!");
    }
  } else {
    selectedCells.forEach(cell => cell.classList.remove("selected"));
    selectedCells = [];
  }
}

// ========================
// Mobile Support
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
  startDrag(e.target);
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target?.classList.contains("cell")) {
    dragOver(target);
  }
}

function handleTouchEnd() {
  endDrag();
}

// ========================
// Reset Functionality
// ========================

function resetGame() {
  const wordsearch = document.getElementById("wordsearch");
  const wordsContainer = document.getElementById("words");
  wordsearch.innerHTML = "";
  wordsContainer.innerHTML = "<div>Words to find:</div>";
  selectedCells = [];
  foundWords = [];
  initializeGame();
}