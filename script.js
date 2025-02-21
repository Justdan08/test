/// Game state
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
  wordsContainer.innerHTML = "<div>Words to find:</div>";

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
// User Interaction
// ========================

function startDrag(cell) {
  if (cell.classList.contains("found")) return; // Ignore found cells
  isDragging = true;
  startCell = cell;
  selectedCells = [cell];
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging || selectedCells.includes(cell) || cell.classList.contains("found")) return;

  const lastCell = selectedCells[selectedCells.length - 1];
  const rowDiff = cell.dataset.row - startCell.dataset.row;
  const colDiff = cell.dataset.col - startCell.dataset.col;

  if (!direction) {
    if (rowDiff === 0) direction = "horizontal";
    else if (colDiff === 0) direction = "vertical";
    else if (Math.abs(rowDiff) === Math.abs(colDiff)) direction = "diagonal";
    else return; // Invalid move
  }

  // Check if moving backward
  if (isMovingBackward(cell)) {
    deselectLastCell();
    return;
  }

  if (
    (direction === "horizontal" && cell.dataset.row == startCell.dataset.row) ||
    (direction === "vertical" && cell.dataset.col == startCell.dataset.col) ||
    (direction === "diagonal" && Math.abs(rowDiff) === Math.abs(colDiff))
  ) {
    const missingCells = getMissingCells(lastCell, cell);
    missingCells.forEach(missingCell => {
      if (!selectedCells.includes(missingCell) && !missingCell.classList.contains("found")) {
        selectedCells.push(missingCell);
        missingCell.classList.add("selected");
      }
    });

    selectedCells.push(cell);
    cell.classList.add("selected");
  }
}

function isMovingBackward(cell) {
  if (selectedCells.length < 2) return false;

  const lastCell = selectedCells[selectedCells.length - 1];
  const secondLastCell = selectedCells[selectedCells.length - 2];

  const lastRow = parseInt(lastCell.dataset.row);
  const lastCol = parseInt(lastCell.dataset.col);
  const secondLastRow = parseInt(secondLastCell.dataset.row);
  const secondLastCol = parseInt(secondLastCell.dataset.col);
  const currentRow = parseInt(cell.dataset.row);
  const currentCol = parseInt(cell.dataset.col);

  const rowStep = lastRow - secondLastRow;
  const colStep = lastCol - secondLastCol;

  const expectedRow = lastRow + rowStep;
  const expectedCol = lastCol + colStep;

  return currentRow !== expectedRow || currentCol !== expectedCol;
}

function deselectLastCell() {
  if (selectedCells.length > 1) {
    const lastCell = selectedCells.pop();
    lastCell.classList.remove("selected");
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
      if (!cell.classList.contains("found")) {
        cell.classList.remove("selected");
      }
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
