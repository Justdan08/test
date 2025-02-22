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
const gridSize = 15;
const timeAttackDuration = 150; // 2:30 in seconds

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

  flickerLetters(2000);
}

function flickerLetters(duration) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const cells = document.querySelectorAll(".cell");
  const flicker = setInterval(() => {
    cells.forEach(cell => {
      cell.textContent = letters[Math.floor(Math.random() * letters.length)];
    });
  }, 100);

  setTimeout(() => {
    clearInterval(flicker);
    placeWordsAndFillRandomLetters();
  }, duration);
}

function placeWordsAndFillRandomLetters() {
  currentWords.forEach(word => placeWord(word));
  fillRandomLetters();
  addTouchSupport();
}

// ========================
// Game Logic
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
      alert(isTimeAttack ? "Good Job Big Dog! (Time Attack Complete!)" : "Good Job Big Dog!");
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

// ... (keep all your existing drag selection logic unchanged)
// [Include all your original dragOver(), isAdjacent(), isValidDirection(), etc. functions here]