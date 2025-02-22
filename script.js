// Game state
let selectedCells = [];
let foundWords = [];
let isDragging = false;
let startCell = null;
let direction = null;
let currentWords = [];
let timerInterval = null;
let secondsElapsed = 0;
let isTimeAttack = false;
const timeAttackDuration = 150; // 2 minutes 30 seconds in seconds

// Initialize game
document.addEventListener("DOMContentLoaded", initializeGame);
document.getElementById("reset-button").addEventListener("click", resetGame);
document.getElementById("time-attack-button").addEventListener("click", startTimeAttack);

// ========================
// Core Functions
// ========================

function initializeGame() {
  secondsElapsed = isTimeAttack ? timeAttackDuration : 0;
  updateTimerDisplay();
  startTimer();

  const wordPool = JSON.parse(document.getElementById("word-pool").dataset.words);
  currentWords = getRandomWords(wordPool, 15);

  const wordsearch = document.getElementById("wordsearch");
  wordsearch.innerHTML = "";
  document.getElementById("words").innerHTML = "";

  // Create words list
  const wordsBox = document.createElement("div");
  wordsBox.style.display = "grid";
  wordsBox.style.gridTemplateColumns = "repeat(3, 1fr)";
  wordsBox.style.gap = "5px";

  const wordsTitle = document.createElement("div");
  wordsTitle.textContent = "Words to find:";
  wordsTitle.style.gridColumn = "1 / -1";
  wordsTitle.style.fontWeight = "bold";
  wordsBox.appendChild(wordsTitle);

  currentWords.forEach(word => {
    const wordElement = document.createElement("div");
    wordElement.textContent = word;
    wordsBox.appendChild(wordElement);
  });
  document.getElementById("words").appendChild(wordsBox);

  // Create grid
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      wordsearch.appendChild(createCell(i, j));
    }
  }

  // Place words and fill random letters
  currentWords.forEach(word => placeWord(word));
  fillRandomLetters();
  addTouchSupport();
}

// ========================
// Time Attack Functions
// ========================

function startTimeAttack() {
  isTimeAttack = true;
  resetGame();
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (isTimeAttack) {
      secondsElapsed--;
      if (secondsElapsed <= 0) {
        secondsElapsed = 0;
        stopTimer();
        if (foundWords.length < currentWords.length) {
          alert("Oooo… Gotta be quicker than that!");
          isTimeAttack = false;
        }
      }
    } else {
      secondsElapsed++;
    }
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  document.getElementById("timer").textContent = 
    `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function resetGame() {
  document.getElementById("wordsearch").innerHTML = "";
  selectedCells = [];
  foundWords = [];
  stopTimer();
  if (!isTimeAttack) secondsElapsed = 0;
  initializeGame();
}

// ========================
// Word Placement & Validation
// ========================

function placeWord(word) {
  const directions = ["horizontal", "vertical", "diagonal"];
  let direction, row, col;

  do {
    direction = directions[Math.floor(Math.random() * 3)];
    [row, col] = getStartPosition(word.length, direction);
  } while (!canPlaceWord(word, row, col, direction));

  for (let i = 0; i < word.length; i++) {
    const cell = document.querySelector(getCellSelector(row, col, direction, i));
    cell.textContent = word[i];
  }
}

function checkForWord() {
  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  if (currentWords.includes(selectedWord) && !foundWords.includes(selectedWord)) {
    foundWords.push(selectedWord);
    selectedCells.forEach(cell => cell.classList.add("found"));
    document.querySelectorAll("#words div").forEach(el => {
      if (el.textContent === selectedWord) el.classList.add("found"));
    });

    if (foundWords.length === currentWords.length) {
      stopTimer();
      alert(isTimeAttack ? "Good Job Big Dog! (Time Attack)" : "Good Job Big Dog!");
      isTimeAttack = false;
    }
  }
  selectedCells.forEach(cell => cell.classList.remove("selected"));
  selectedCells = [];
}

// ========================
// Helper Functions
// ========================

function getRandomWords(pool, count) {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

function createCell(row, col) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.dataset.row = row;
  cell.dataset.col = col;
  cell.addEventListener("mousedown", () => startDrag(cell));
  cell.addEventListener("mouseenter", () => dragOver(cell));
  cell.addEventListener("mouseup", endDrag);
  return cell;
}

// ========================
// Drag Selection Logic
// ========================

function startDrag(cell) {
  isDragging = true;
  startCell = cell;
  selectedCells = [cell];
  direction = null;
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging) return;

  const existingIndex = selectedCells.indexOf(cell);
  if (existingIndex > -1) {
    const removedCells = selectedCells.splice(existingIndex + 1);
    removedCells.forEach(c => c.classList.remove("selected"));
    return;
  }

  if (!isAdjacent(cell)) return;

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
    else return;
  }

  if (!isValidDirection(cell)) return;

  const lastCell = selectedCells[selectedCells.length - 1];
  const missing = getMissingCells(lastCell, cell);
  
  missing.forEach(missingCell => {
    if (!selectedCells.includes(missingCell)) {
      missingCell.classList.add("selected"));
      selectedCells.push(missingCell);
    }
  });

  cell.classList.add("selected"));
  selectedCells.push(cell);
}

function isAdjacent(cell) {
  const last = selectedCells[selectedCells.length - 1];
  const rowDiff = Math.abs(parseInt(cell.dataset.row) - parseInt(last.dataset.row));
  const colDiff = Math.abs(parseInt(cell.dataset.col) - parseInt(last.dataset.col));
  return (rowDiff <= 1 && colDiff <= 1);
}

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

// ========================
// Touch Support
// ========================

function addTouchSupport() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.addEventListener("touchstart", e => {
      e.preventDefault();
      startDrag(e.target);
    });
    cell.addEventListener("touchmove", e => {
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target?.classList.contains("cell")) dragOver(target);
    });
    cell.addEventListener("touchend", endDrag);
  });
}