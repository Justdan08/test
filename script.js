// Game state
let selectedCells = [];
let foundWords = [];
let isDragging = false;
let startCell = null;
let direction = null;
let currentWords = []; // Stores the 15 randomly selected words

// Initialize the game
document.addEventListener("DOMContentLoaded", initializeGame);

// Reset button
document.getElementById("reset-button").addEventListener("click", resetGame);

// ========================
// Core Game Functions
// ========================

function initializeGame() {
  // Get the word pool from the HTML
  const wordPoolElement = document.getElementById("word-pool");
  const wordPool = JSON.parse(wordPoolElement.dataset.words);

  // Randomly select 15 words from the pool
  currentWords = getRandomWords(wordPool, 15);

  const wordsearch = document.getElementById("wordsearch");
  const wordsContainer = document.getElementById("words");

  // Clear the grid and word list
  wordsearch.innerHTML = "";

  // Only add "Words to find:" if it doesn't already exist
  if (!wordsContainer.querySelector("div:first-child")) {
    wordsContainer.innerHTML = "<div>Words to find:</div>";
  } else {
    wordsContainer.innerHTML = ""; // Clear the word list but keep the "Words to find:" text
  }

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

  // Display words to find
  currentWords.forEach(word => {
    const wordElement = document.createElement("div");
    wordElement.textContent = word;
    wordsContainer.appendChild(wordElement);
  });

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
// User Interaction (Updated)
// ========================

function startDrag(cell) {
  if (cell.classList.contains("found")) return;
  isDragging = true;
  startCell = cell;
  selectedCells = [cell];
  direction = null; // Reset direction on new drag
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging || cell.classList.contains("found")) return;

  // Check if we're backtracking to an existing cell
  const existingIndex = selectedCells.indexOf(cell);
  if (existingIndex > -1) {
    const removedCells = selectedCells.splice(existingIndex + 1);
    removedCells.forEach(c => c.classList.remove("selected"));
    return;
  }

  // Don't process if moving to a non-adjacent cell
  if (!isAdjacent(cell)) return;

  // Determine direction if not set
  if (!direction) {
    const startRow = parseInt(startCell.dataset.row);
    const startCol = parseInt(startCell.dataset.col);
    const currentRow = parseInt(cell.dataset.row);
    const currentCol = parseInt(cell.dataset.col);
    
    const rowDiff = currentRow - startRow;
    const colDiff = currentCol - startCol;
    
    if (rowDiff === 0) direction = "horizontal";
    else if (colDiff === 0) direction = "vertical";
    else if (Math.abs(rowDiff) === Math.abs(colDiff)) direction = "diagonal";
    else return; // Invalid initial direction
  }

  // Validate movement direction
  if (!isValidDirection(cell)) return;

  // Add missing cells between last and current
  const lastCell = selectedCells[selectedCells.length - 1];
  const missing = getMissingCells(lastCell, cell);
  
  missing.forEach(missingCell => {
    if (!selectedCells.includes(missingCell)) {
      missingCell.classList.add("selected");
      selectedCells.push(missingCell);
    }
  });

  cell.classList.add("selected");
  selectedCells.push(cell);
}

// Helper: Check if cell is adjacent in any direction
function isAdjacent(cell) {
  const last = selectedCells[selectedCells.length - 1];
  const rowDiff = Math.abs(parseInt(cell.dataset.row) - parseInt(last.dataset.row));
  const colDiff = Math.abs(parseInt(cell.dataset.col) - parseInt(last.dataset.col));
  
  return (rowDiff <= 1 && colDiff <= 1);
}

// Helper: Validate movement continues in set direction
function isValidDirection(cell) {
  const last = selectedCells[selectedCells.length - 1];
  const lastRow = parseInt(last.dataset.row);
  const lastCol = parseInt(last.dataset.col);
  const currentRow = parseInt(cell.dataset.row);
  const currentCol = parseInt(cell.dataset.col);

  switch(direction) {
    case "horizontal":
      return currentRow === lastRow;
    case "vertical":
      return currentCol === lastCol;
    case "diagonal":
      return Math.abs(currentRow - lastRow) === Math.abs(currentCol - lastCol);
    default:
      return false;
  }
}

function getMissingCells(lastCell, currentCell) {
  let missingCells = [];
  const lastRow = parseInt(lastCell.dataset.row);
  const lastCol = parseInt(lastCell.dataset.col);
  const currentRow = parseInt(currentCell.dataset.row);
  const currentCol = parseInt(currentCell.dataset.col);

  const rowStep = currentRow > lastRow ? 1 : currentRow < lastRow ? -1 : 0;
  const colStep = currentCol > lastCol ? 1 : currentCol < lastCol ? -1 : 0;

  let row = lastRow + rowStep;
  let col = lastCol + colStep;

  while (row !== currentRow || col !== currentCol) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) missingCells.push(cell);
    row += rowStep;
    col += colStep;
  }

  return missingCells;
}

function endDrag() {
  isDragging = false;
  direction = null;
  checkForWord();
}

function checkForWord() {
  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  if (currentWords.includes(selectedWord) && !foundWords.includes(selectedWord)) {
    foundWords.push(selectedWord);
    selectedCells.forEach(cell => {
      cell.classList.add("found"); // Mark cell as found
      cell.classList.remove("selected"); // Remove selection styling
    });
    selectedCells = [];

    // Mark word as found in the word list
    document.querySelectorAll("#words div").forEach(el => {
      if (el.textContent === selectedWord) el.classList.add("found");
    });

    if (foundWords.length === currentWords.length) alert("Good Job Big Dog!");
  } else {
    selectedCells.forEach(cell => {
      cell.classList.remove("selected");
    });
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
  if (target?.classList.contains("cell")) dragOver(target);
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
  initializeGame(); // Regenerate puzzle with new random words
}