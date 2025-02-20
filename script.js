// Validate puzzle settings
if (typeof gridSize === "undefined" || typeof words === "undefined") {
  console.error("Error: gridSize or words are not defined in the HTML!");
}

// Game state
let selectedCells = [];
let foundWords = [];
let isDragging = false;
let dragDirection = null; // Stores the locked-in direction

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
    let cell;
    if (direction === "horizontal") {
      cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
    } else if (direction === "vertical") {
      cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
    } else {
      cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);
    }
    if (!cell || (cell.textContent !== "" && cell.textContent !== word[i])) return false;
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
// User Interaction
// ========================

function startDrag(cell) {
  isDragging = true;
  selectedCells = [cell];
  cell.classList.add("selected");
  dragDirection = null; // Reset direction at start
}

function dragOver(cell) {
  if (isDragging && !selectedCells.includes(cell)) {
    const lastCell = selectedCells[selectedCells.length - 1];
    const rowDiff = cell.dataset.row - lastCell.dataset.row;
    const colDiff = cell.dataset.col - lastCell.dataset.col;

    if (!dragDirection) {
      // Lock direction on second cell
      if (rowDiff === 0) dragDirection = "horizontal";
      else if (colDiff === 0) dragDirection = "vertical";
      else if (Math.abs(rowDiff) === Math.abs(colDiff)) dragDirection = "diagonal";
    }

    // Enforce straight-line selection
    if (
      (dragDirection === "horizontal" && rowDiff === 0) ||
      (dragDirection === "vertical" && colDiff === 0) ||
      (dragDirection === "diagonal" && Math.abs(rowDiff) === Math.abs(colDiff))
    ) {
      selectedCells.push(cell);
      cell.classList.add("selected");

      // Fill in missing cells if realigned
      fillMissedCells(lastCell, cell);
    }
  }
}

function fillMissedCells(startCell, endCell) {
  let startRow = parseInt(startCell.dataset.row);
  let startCol = parseInt(startCell.dataset.col);
  let endRow = parseInt(endCell.dataset.row);
  let endCol = parseInt(endCell.dataset.col);

  let rowStep = startRow === endRow ? 0 : startRow < endRow ? 1 : -1;
  let colStep = startCol === endCol ? 0 : startCol < endCol ? 1 : -1;

  let currentRow = startRow;
  let currentCol = startCol;

  while (currentRow !== endRow || currentCol !== endCol) {
    currentRow += rowStep;
    currentCol += colStep;
    const missingCell = document.querySelector(`.cell[data-row="${currentRow}"][data-col="${currentCol}"]`);
    if (missingCell && !selectedCells.includes(missingCell)) {
      selectedCells.push(missingCell);
      missingCell.classList.add("selected");
    }
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

    // Mark word as found
    document.querySelectorAll("#words div").forEach(el => {
      if (el.textContent === selectedWord) el.classList.add("found");
    });

    if (foundWords.length === words.length) alert("Good Job Big Dog!");
  } else {
    selectedCells.forEach(cell => cell.classList.remove("selected"));
    selectedCells = [];
  }
}

// ========================
// Reset Functionality
// ========================

function resetGame() {
  document.getElementById("wordsearch").innerHTML = "";
  selectedCells = [];
  foundWords = [];
  initializeGame();
}