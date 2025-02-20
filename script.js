// Validate puzzle settings
if (typeof gridSize === "undefined" || typeof words === "undefined") {
  console.error("Error: gridSize or words are not defined in the HTML!");
}

// Game state
let selectedCells = [];
let foundWords = [];
let isDragging = false;
let startRow, startCol;
let dragDirection = null; // Stores the committed direction (null until decided)

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

// ========================
// Word Placement
// ========================

function placeWord(word) {
  const directions = ["horizontal", "vertical", "diagonal"];
  const direction = directions[Math.floor(Math.random() * directions.length)]; // 1/3rd probability for each direction
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
      if (direction === "horizontal") cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
      else if (direction === "vertical") cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
      else cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);

      cell.textContent = word[i];
    }
  } else {
    placeWord(word); // Retry placement
  }
}

function canPlaceWord(word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    let cell;
    if (direction === "horizontal") cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
    else if (direction === "vertical") cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
    else cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);

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
  startRow = parseInt(cell.dataset.row);
  startCol = parseInt(cell.dataset.col);
  dragDirection = null; // Reset direction at the start of each drag
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging || selectedCells.includes(cell)) return;

  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  if (!dragDirection) {
    // Determine the direction based on the second cell selected
    if (row === startRow) dragDirection = "horizontal";
    else if (col === startCol) dragDirection = "vertical";
    else if (Math.abs(row - startRow) === Math.abs(col - startCol)) dragDirection = "diagonal";
    else return; // Ignore invalid moves
  }

  if (isValidDrag(row, col)) {
    fillMissingCells(row, col);
    selectedCells.push(cell);
    cell.classList.add("selected");
  }
}

function isValidDrag(row, col) {
  if (!dragDirection) return false;

  const lastCell = selectedCells[selectedCells.length - 1];
  const lastRow = parseInt(lastCell.dataset.row);
  const lastCol = parseInt(lastCell.dataset.col);

  switch (dragDirection) {
    case "horizontal":
      return row === startRow && Math.abs(col - lastCol) === 1;
    case "vertical":
      return col === startCol && Math.abs(row - lastRow) === 1;
    case "diagonal":
      return Math.abs(row - lastRow) === 1 && Math.abs(col - lastCol) === 1;
    default:
      return false;
  }
}

// Automatically selects missing cells when realigning with the line
function fillMissingCells(row, col) {
  const lastCell = selectedCells[selectedCells.length - 1];
  const lastRow = parseInt(lastCell.dataset.row);
  const lastCol = parseInt(lastCell.dataset.col);

  let stepRow = lastRow;
  let stepCol = lastCol;

  while (stepRow !== row || stepCol !== col) {
    if (dragDirection === "horizontal") {
      stepCol += stepCol < col ? 1 : -1;
    } else if (dragDirection === "vertical") {
      stepRow += stepRow < row ? 1 : -1;
    } else if (dragDirection === "diagonal") {
      stepRow += stepRow < row ? 1 : -1;
      stepCol += stepCol < col ? 1 : -1;
    }

    const cell = document.querySelector(`.cell[data-row="${stepRow}"][data-col="${stepCol}"]`);
    if (cell && !selectedCells.includes(cell)) {
      selectedCells.push(cell);
      cell.classList.add("selected");
    }
  }
}

function endDrag() {
  isDragging = false;
  checkForWord();
}

// ========================
// Reset Functionality
// ========================

function resetGame() {
  const wordsearch = document.getElementById("wordsearch");
  wordsearch.innerHTML = "";
  selectedCells = [];
  foundWords = [];
  initializeGame();
}