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
const timeAttackDuration = 150; // 2 minutes 30 seconds
const gridSize = 15;

// Initialize game
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("time-attack-button").addEventListener("click", startTimeAttack);
  document.getElementById("reset-button").addEventListener("click", resetGame);
  initializeGame();
});

// ========================
// Core Functions
// ========================

function initializeGame() {
  selectedCells = [];
  foundWords = [];
  isDragging = false;
  startCell = null;
  direction = null;

  secondsElapsed = isTimeAttack ? timeAttackDuration : 0;
  updateTimerDisplay();
  stopTimer();
  startTimer();

  const wordPool = JSON.parse(document.getElementById("word-pool").dataset.words);
  currentWords = getRandomWords(wordPool, 15);

  const wordsearch = document.getElementById("wordsearch");
  wordsearch.innerHTML = "";
  const wordsContainer = document.getElementById("words");
  wordsContainer.innerHTML = "";

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
  wordsContainer.appendChild(wordsBox);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      wordsearch.appendChild(createCell(i, j));
    }
  }

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
  stopTimer();
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

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  document.getElementById("timer").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function resetGame() {
  isTimeAttack = false;
  document.getElementById("wordsearch").innerHTML = "";
  selectedCells = [];
  foundWords = [];
  stopTimer();
  secondsElapsed = 0;
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
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) cell.textContent = word[i];

    if (direction === "horizontal") col++;
    else if (direction === "vertical") row++;
    else { row++; col++; }
  }
}

function canPlaceWord(word, row, col, direction) {
  if (direction === "horizontal" && col + word.length > gridSize) return false;
  if (direction === "vertical" && row + word.length > gridSize) return false;
  if (direction === "diagonal" && (row + word.length > gridSize || col + word.length > gridSize)) return false;
  return true;
}

function getStartPosition(wordLength, direction) {
  if (direction === "horizontal") return [Math.floor(Math.random() * gridSize), Math.floor(Math.random() * (gridSize - wordLength + 1))];
  if (direction === "vertical") return [Math.floor(Math.random() * (gridSize - wordLength + 1)), Math.floor(Math.random() * gridSize)];
  return [Math.floor(Math.random() * (gridSize - wordLength + 1)), Math.floor(Math.random() * (gridSize - wordLength + 1))];
}

function checkForWord() {
  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  if (currentWords.includes(selectedWord) && !foundWords.includes(selectedWord)) {
    foundWords.push(selectedWord);
    selectedCells.forEach(cell => cell.classList.add("found"));
    document.querySelectorAll("#words div").forEach(el => {
      if (el.textContent === selectedWord) el.classList.add("found");
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
  if (!isDragging || selectedCells.includes(cell)) return;
  if (!isAdjacent(cell)) return;

  cell.classList.add("selected");
  selectedCells.push(cell);
}

function isAdjacent(cell) {
  const last = selectedCells[selectedCells.length - 1];
  const rowDiff = Math.abs(parseInt(cell.dataset.row) - parseInt(last.dataset.row));
  const colDiff = Math.abs(parseInt(cell.dataset.col) - parseInt(last.dataset.col));
  return (rowDiff <= 1 && colDiff <= 1);
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