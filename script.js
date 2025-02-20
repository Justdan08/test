// Validate puzzle settings
if (typeof gridSize === "undefined" || typeof words === "undefined") {
  console.error("Error: gridSize or words are not defined in the HTML!");
}

// Game state
let selectedCells = [];
let foundWords = [];
let isDragging = false;

// Initialize the game
document.addEventListener("DOMContentLoaded", initializeGame);

// Reset button
document.getElementById("reset-button").addEventListener("click", resetGame);

// ========================
// Core Game Functions
// ========================

function initializeGame() {
  const wordsearch = document.getElementById("wordsearch");
  const wordsContainer = document.getElementById("words");

  // Clear the grid and word list
  wordsearch.innerHTML = "";
  wordsContainer.innerHTML = "<div>Words to find:</div>"; // Reset word list ONCE

  // Create the grid
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
  const directions = ["horizontal", "vertical", "diagonal"];
  const direction = directions[Math.floor(Math.random() * directions.length)]; // Randomly choose a direction
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
      placeWord(word); // Retry placement
    }
  } else if (direction === "vertical") {
    col = Math.floor(Math.random() * gridSize);
    row = Math.floor(Math.random() * (gridSize - word.length));
    if (canPlaceWord(word, row, col, direction)) {
      for (let i = 0; i < word.length; i++) {
        const cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
        cell.textContent = word[i];
      }
    } else {
      placeWord(word); // Retry placement
    }
  } else if (direction === "diagonal") {
    row = Math.floor(Math.random() * (gridSize - word.length));
    col = Math.floor(Math.random() * (gridSize - word.length));
    if (canPlaceWord(word, row, col, direction)) {
      for (let i = 0; i < word.length; i++) {
        const cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);
        cell.textContent = word[i];
      }
    } else {
      placeWord(word); // Retry placement
    }
  }
}

function canPlaceWord(word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    let cell;
    if (direction === "horizontal") {
      cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
    } else if (direction === "vertical") {
      cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
    } else if (direction === "diagonal") {
      cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);
    }

    if (cell.textContent !== "" && cell.textContent !== word[i]) {
      return false; // Conflict detected
    }
  }
  return true; // No conflicts
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
  const reversedWord = selectedCells.reverse().map(cell => cell.textContent).join("");

  if (
    (words.includes(selectedWord) || words.includes(reversedWord)) &&
    !foundWords.includes(selectedWord) &&
    !foundWords.includes(reversedWord)
  ) {
    foundWords.push(selectedWord);
    selectedCells.forEach(cell => cell.classList.add("found"));
    selectedCells = [];

    // Mark word as found
    document.querySelectorAll("#words div").forEach(el => {
      if (el.textContent === selectedWord || el.textContent === reversedWord) {
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
// Touch Handling Variables
// ========================
let startRow = -1;
let startCol = -1;
let currentDirection = null;

// ========================
// Mobile Support (Updated)
// ========================
function handleTouchStart(e) {
  e.preventDefault();
  const cell = e.target;
  if (!cell.classList.contains("cell")) return;

  // Reset state
  selectedCells.forEach(c => c.classList.remove("selected"));
  selectedCells = [];
  currentDirection = null;

  // Record starting cell
  startRow = parseInt(cell.dataset.row);
  startCol = parseInt(cell.dataset.col);
  selectedCells.push(cell);
  cell.classList.add("selected");
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target?.classList.contains("cell")) return;

  const currentRow = parseInt(target.dataset.row);
  const currentCol = parseInt(target.dataset.col);

  // Calculate direction if not set
  if (!currentDirection) {
    const dRow = currentRow - startRow;
    const dCol = currentCol - startCol;

    if (dRow === 0 && dCol !== 0) currentDirection = "horizontal";
    else if (dCol === 0 && dRow !== 0) currentDirection = "vertical";
    else if (Math.abs(dRow) === Math.abs(dCol)) currentDirection = "diagonal";
    else return; // Invalid direction
  }

  // Get all cells in the straight path from start to current
  const pathCells = getStraightPath(startRow, startCol, currentRow, currentCol, currentDirection);
  if (!pathCells) return;

  // Update selected cells
  selectedCells.forEach(c => c.classList.remove("selected"));
  selectedCells = pathCells;
  selectedCells.forEach(c => c.classList.add("selected"));
}

function handleTouchEnd() {
  endDrag();
  startRow = -1;
  startCol = -1;
  currentDirection = null;
}

// ========================
// Bresenham's Line Algorithm
// ========================
function getStraightPath(startRow, startCol, endRow, endCol, direction) {
  const cells = [];
  const dRow = endRow - startRow;
  const dCol = endCol - startCol;

  let steps;
  switch (direction) {
    case "horizontal":
      steps = Math.abs(dCol);
      break;
    case "vertical":
      steps = Math.abs(dRow);
      break;
    case "diagonal":
      steps = Math.abs(dRow); // For diagonal, dRow === dCol
      break;
    default:
      return null;
  }

  for (let i = 0; i <= steps; i++) {
    let row, col;
    switch (direction) {
      case "horizontal":
        row = startRow;
        col = startCol + (dCol > 0 ? i : -i);
        break;
      case "vertical":
        row = startRow + (dRow > 0 ? i : -i);
        col = startCol;
        break;
      case "diagonal":
        row = startRow + (dRow > 0 ? i : -i);
        col = startCol + (dCol > 0 ? i : -i);
        break;
    }

    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return null; // Out of bounds
    cells.push(cell);
  }

  return cells;
}
// ========================
// Reset Functionality
// ========================

function resetGame() {
  const wordsearch = document.getElementById("wordsearch");
  wordsearch.innerHTML = ""; // Only clear the grid
  selectedCells = [];
  foundWords = [];
  initializeGame(); // Let initializeGame handle the word list
}