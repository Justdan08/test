// Validate puzzle settings
if (typeof gridSize === "undefined" || typeof words === "undefined") {
  console.error("Error: gridSize or words are not defined in the HTML!");
}

// Game state
let selectedCells = [];
let foundWords = [];
let isDragging = false;
let startCell = null;
let direction = null;

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
// User Interaction
// ========================

function startDrag(cell) {
  isDragging = true;
  startCell = cell;
  selectedCells = [cell];
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging || selectedCells.includes(cell)) return;

  const lastCell = selectedCells[selectedCells.length - 1];
  const rowDiff = cell.dataset.row - startCell.dataset.row;
  const colDiff = cell.dataset.col - startCell.dataset.col;

  if (!direction) {
    if (rowDiff === 0) direction = "horizontal";
    else if (colDiff === 0) direction = "vertical";
    else if (Math.abs(rowDiff) === Math.abs(colDiff)) direction = "diagonal";
    else return; // Invalid move
  }

  if (
    (direction === "horizontal" && cell.dataset.row == startCell.dataset.row) ||
    (direction === "vertical" && cell.dataset.col == startCell.dataset.col) ||
    (direction === "diagonal" && Math.abs(rowDiff) === Math.abs(colDiff))
  ) {
    const missingCells = getMissingCells(lastCell, cell);
    missingCells.forEach(missingCell => {
      if (!selectedCells.includes(missingCell)) {
        selectedCells.push(missingCell);
        missingCell.classList.add("selected");
      }
    });

    selectedCells.push(cell);
    cell.classList.add("selected");
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
  initializeGame();
}