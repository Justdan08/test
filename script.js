// Validate puzzle settings
if (typeof gridSize === "undefined" || typeof words === "undefined") {
  console.error("Error: gridSize or words are not defined in the HTML!");
}

// Game state
let selectedCells = [];
let foundWords = [];
let isDragging = false;
let dragDirection = null; // Direction of the drag (horizontal, vertical, diagonal)

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
  const direction = directions[Math.floor(Math.random() * 3)];
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
      let targetRow = row + (direction === "vertical" ? i : direction === "diagonal" ? i : 0);
      let targetCol = col + (direction === "horizontal" ? i : direction === "diagonal" ? i : 0);
      const cell = document.querySelector(`.cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
      cell.textContent = word[i];
    }
  } else {
    placeWord(word);
  }
}

function canPlaceWord(word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    let targetRow = row + (direction === "vertical" ? i : direction === "diagonal" ? i : 0);
    let targetCol = col + (direction === "horizontal" ? i : direction === "diagonal" ? i : 0);
    const cell = document.querySelector(`.cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
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
  dragDirection = null;
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging || selectedCells.includes(cell)) return;

  const lastCell = selectedCells[selectedCells.length - 1];
  const rowDiff = cell.dataset.row - lastCell.dataset.row;
  const colDiff = cell.dataset.col - lastCell.dataset.col;

  // Determine initial drag direction
  if (dragDirection === null) {
    if (rowDiff === 0) dragDirection = "horizontal";
    else if (colDiff === 0) dragDirection = "vertical";
    else if (Math.abs(rowDiff) === Math.abs(colDiff)) dragDirection = "diagonal";
  }

  // Enforce movement in one locked direction
  if (
    (dragDirection === "horizontal" && rowDiff === 0) ||
    (dragDirection === "vertical" && colDiff === 0) ||
    (dragDirection === "diagonal" && Math.abs(rowDiff) === Math.abs(colDiff))
  ) {
    // If the new cell is not already selected, add it
    if (!selectedCells.includes(cell)) {
      selectedCells.push(cell);
      cell.classList.add("selected");
    }
  }

  // Handle correction when dragging back
  correctSelection(cell);
}

function correctSelection(cell) {
  const cellIndex = selectedCells.indexOf(cell);
  if (cellIndex !== -1 && cellIndex < selectedCells.length - 1) {
    // Remove any extra cells beyond the corrected point
    for (let i = selectedCells.length - 1; i > cellIndex; i--) {
      selectedCells[i].classList.remove("selected");
      selectedCells.pop();
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
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove("selected", "found");
  });
  selectedCells = [];
  foundWords = [];
}