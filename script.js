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

// Color picker and opacity slider
const colorPicker = document.getElementById("trace-color");
const opacitySlider = document.getElementById("trace-opacity");
const resetColorsBtn = document.getElementById("reset-colors");

let traceColor = colorPicker.value;
let traceOpacity = opacitySlider.value;

colorPicker.addEventListener("input", () => {
  traceColor = colorPicker.value;
  updateTraceColor();
});

opacitySlider.addEventListener("input", () => {
  traceOpacity = opacitySlider.value;
  updateTraceOpacity();
});

resetColorsBtn.addEventListener("click", resetGridColors);

// ========================
// Core Game Functions
// ========================

function initializeGame() {
  const wordsearch = document.getElementById("wordsearch");
  const wordsContainer = document.getElementById("words");

  // Clear the grid (but not the words list, as we want to keep "Words to find:" and the previous word list)
  wordsearch.innerHTML = "";

  // Add "Words to find:" label if it doesn't exist
  if (!wordsContainer.querySelector(".label")) {
    const label = document.createElement("div");
    label.textContent = "Words to find:";
    label.classList.add("label");
    wordsContainer.appendChild(label);
  }

  // Clear the previous words (if any), before appending new ones
  wordsContainer.querySelectorAll(".word-item").forEach(item => item.remove());

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
    wordElement.classList.add("word-item");
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
      let targetCell;
      if (direction === "horizontal") targetCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
      if (direction === "vertical") targetCell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
      if (direction === "diagonal") targetCell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);

      if (targetCell) targetCell.textContent = word[i];
    }
  } else {
    placeWord(word);
  }
}

function canPlaceWord(word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    let cell;
    if (direction === "horizontal") cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
    if (direction === "vertical") cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
    if (direction === "diagonal") cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);

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
  applyTraceColor(cell);
}

function dragOver(cell) {
  if (isDragging && !selectedCells.includes(cell)) {
    selectedCells.push(cell);
    applyTraceColor(cell);
  }
}

function endDrag() {
  isDragging = false;
  checkForWord();
}

function checkForWord() {
  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  const reversedWord = selectedCells.reverse().map(cell => cell.textContent).join("");

  if ((words.includes(selectedWord) || words.includes(reversedWord)) && !foundWords.includes(selectedWord)) {
    foundWords.push(selectedWord);
    selectedCells.forEach(cell => cell.classList.add("found"));
    selectedCells = [];

    document.querySelectorAll("#words div").forEach(el => {
      if (el.textContent === selectedWord || el.textContent === reversedWord) el.classList.add("found");
    });

    if (foundWords.length === words.length) alert("Good Job Big Dog!");
  } else {
    selectedCells.forEach(cell => cell.classList.remove("selected"));
    selectedCells = [];
  }
}

// ========================
// Touch Support
// ========================

let startRow = -1;
let startCol = -1;
let currentDirection = null;

function handleTouchStart(e) {
  e.preventDefault();
  const cell = e.target;
  if (!cell.classList.contains("cell")) return;

  selectedCells.forEach(c => c.classList.remove("selected"));
  selectedCells = [];
  currentDirection = null;

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

  if (!currentDirection) {
    const dRow = currentRow - startRow;
    const dCol = currentCol - startCol;

    if (dRow === 0 && dCol !== 0) currentDirection = "horizontal";
    else if (dCol === 0 && dRow !== 0) currentDirection = "vertical";
    else if (Math.abs(dRow) === Math.abs(dCol)) currentDirection = "diagonal";
    else return;
  }

  const pathCells = getStraightPath(startRow, startCol, currentRow, currentCol, currentDirection);
  if (!pathCells) return;

  selectedCells.forEach(c => c.style.backgroundColor = "");
  selectedCells = pathCells;
  selectedCells.forEach(c => applyTraceColor(c));
}

function handleTouchEnd() {
  endDrag();
  startRow = -1;
  startCol = -1;
  currentDirection = null;
}

// ========================
// Utility Functions
// ========================

function hexToRGBA(hex, opacity) {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function applyTraceColor(cell) {
  const rgbaColor = hexToRGBA(traceColor, traceOpacity);
  cell.style.backgroundColor = rgbaColor;
}

function resetGridColors() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.style.backgroundColor = "";
  });
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