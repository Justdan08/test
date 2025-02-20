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
document.getElementById("reset-button").addEventListener("click", resetGame);

// ========================
// Core Game Functions
// ========================

function initializeGame() {
  const wordsearch = document.getElementById("wordsearch");
  const wordsContainer = document.getElementById("words");

  // Clear grid and word list
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
  cell.addEventListener("mousedown", (e) => startDrag(e, cell));
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
      const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
      cell.textContent = word[i];
      if (direction === "horizontal") col++;
      else if (direction === "vertical") row++;
      else {
        row++;
        col++;
      }
    }
  } else {
    placeWord(word);
  }
}

function canPlaceWord(word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell || (cell.textContent !== "" && cell.textContent !== word[i])) return false;
    if (direction === "horizontal") col++;
    else if (direction === "vertical") row++;
    else {
      row++;
      col++;
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

function startDrag(event, cell) {
  isDragging = true;
  selectedCells = [cell];
  startCell = cell;
  direction = null;
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging || selectedCells.includes(cell)) return;

  const lastCell = selectedCells[selectedCells.length - 1];
  const dx = cell.dataset.col - startCell.dataset.col;
  const dy = cell.dataset.row - startCell.dataset.row;

  if (!direction) {
    if (dx === 0) direction = "vertical";
    else if (dy === 0) direction = "horizontal";
    else if (Math.abs(dx) === Math.abs(dy)) direction = "diagonal";
    else return;
  }

  if (
    (direction === "horizontal" && dy !== 0) ||
    (direction === "vertical" && dx !== 0) ||
    (direction === "diagonal" && Math.abs(dx) !== Math.abs(dy))
  ) {
    return;
  }

  const missingCells = getCellsBetween(lastCell, cell);
  missingCells.forEach(missingCell => {
    if (!selectedCells.includes(missingCell)) {
      selectedCells.push(missingCell);
      missingCell.classList.add("selected");
    }
  });

  selectedCells.push(cell);
  cell.classList.add("selected");
}

function endDrag() {
  isDragging = false;
  checkForWord();
}

function getCellsBetween(cell1, cell2) {
  const cells = [];
  let row1 = parseInt(cell1.dataset.row),
      col1 = parseInt(cell1.dataset.col),
      row2 = parseInt(cell2.dataset.row),
      col2 = parseInt(cell2.dataset.col);

  const dx = Math.sign(col2 - col1);
  const dy = Math.sign(row2 - row1);

  while (row1 !== row2 || col1 !== col2) {
    row1 += dy;
    col1 += dx;
    const cell = document.querySelector(`.cell[data-row="${row1}"][data-col="${col1}"]`);
    if (cell) cells.push(cell);
  }

  return cells;
}

function checkForWord() {
  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  
  if (words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
    foundWords.push(selectedWord);
    selectedCells.forEach(cell => cell.classList.add("found"));
    selectedCells = [];

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
  document.querySelectorAll(".cell").forEach(cell => {
    cell.addEventListener("touchstart", handleTouchStart);
    cell.addEventListener("touchmove", handleTouchMove);
    cell.addEventListener("touchend", handleTouchEnd);
  });
}

function handleTouchStart(e) {
  e.preventDefault();
  startDrag(e, e.target);
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
