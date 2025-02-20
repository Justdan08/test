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
      const cell = document.querySelector(
        `.cell[data-row="${row + (direction === "vertical" ? i : 0)}"][data-col="${col + (direction === "horizontal" ? i : 0)}"]`
      );
      cell.textContent = word[i];
    }
  } else {
    placeWord(word); // Retry placement
  }
}

function canPlaceWord(word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    const cell = document.querySelector(
      `.cell[data-row="${row + (direction === "vertical" ? i : 0)}"][data-col="${col + (direction === "horizontal" ? i : 0)}"]`
    );
    if (cell.textContent !== "" && cell.textContent !== word[i]) return false;
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
  direction = null;
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging || selectedCells.includes(cell)) return;

  const lastCell = selectedCells[selectedCells.length - 1];
  const rowDiff = cell.dataset.row - startCell.dataset.row;
  const colDiff = cell.dataset.col - startCell.dataset.col;

  if (!direction) {
    // Determine direction on first move
    if (rowDiff === 0) direction = "horizontal";
    else if (colDiff === 0) direction = "vertical";
    else if (Math.abs(rowDiff) === Math.abs(colDiff)) direction = "diagonal";
    else return; // Ignore invalid moves
  }

  if (
    (direction === "horizontal" && cell.dataset.row === startCell.dataset.row) ||
    (direction === "vertical" && cell.dataset.col === startCell.dataset.col) ||
    (direction === "diagonal" && Math.abs(rowDiff) === Math.abs(colDiff))
  ) {
    if (selectedCells.includes(cell)) {
      // Handle backward movement
      while (selectedCells.length > 1 && selectedCells[selectedCells.length - 2] !== cell) {
        selectedCells.pop().classList.remove("selected");
      }
    } else {
      // Forward movement
      selectedCells.push(cell);
      cell.classList.add("selected");
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
// Mobile Support
// ========================

function addTouchSupport() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach(cell => {
    cell.removeEventListener("touchstart", handleTouchStart);
    cell.removeEventListener("touchmove", handleTouchMove);
    cell.removeEventListener("touchend", handleTouchEnd);

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
  const wordsearch = document.getElementById("wordsearch");
  wordsearch.innerHTML = ""; // Only clear the grid
  selectedCells = [];
  foundWords = [];
  initializeGame(); // Let initializeGame handle the word list
}