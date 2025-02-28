"use strict";

// --------------------------
// Configuration & Constants
// --------------------------
const rows = 8;
const cols = 8;
const gemTypes = ["ruby", "sapphire", "emerald", "amber", "amethyst", "diamond"];
const BASE_POINT = 10;
const GAME_TIME = 180; // 3 minutes (180 seconds)

// --------------------------
// Game State Variables
// --------------------------
let board = [];
let cellElements = [];
let score = 0;
let selectedCell = null;
let timeRemaining = GAME_TIME;
let timerInterval = null;

// Touch dragging for mobile
let touchStartCell = null;

// --------------------------
// DOM Element References
// --------------------------
let scoreElem, timerElem;
let gameBoardElem;

// --------------------------
// Timer Functions
// --------------------------
function startTimer() {
  clearInterval(timerInterval);
  timeRemaining = GAME_TIME;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerElem.textContent = `Time Left: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, "0")}`;
}

// --------------------------
// Game Functions
// --------------------------
function generateBoard() {
  board = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let available = gemTypes.slice();
      board[i][j] = available[Math.floor(Math.random() * available.length)];
    }
  }
}

function renderBoard() {
  gameBoardElem.innerHTML = "";
  cellElements = Array.from({ length: rows }, () => Array(cols));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div");
      cell.className = `gem ${board[i][j]}`;
      cell.dataset.row = i;
      cell.dataset.col = j;

      const shape = document.createElement("div");
      shape.className = "shape";
      cell.appendChild(shape);

      cell.addEventListener("click", () => handleCellSelect(i, j));
      gameBoardElem.appendChild(cell);
      cellElements[i][j] = cell;
    }
  }
}

// --------------------------
// Swap Animation
// --------------------------
function animateSwap(cell1, cell2) {
  return new Promise(resolve => {
    cell1.style.transition = "transform 0.2s ease-in-out";
    cell2.style.transition = "transform 0.2s ease-in-out";

    const rect1 = cell1.getBoundingClientRect();
    const rect2 = cell2.getBoundingClientRect();

    cell1.style.transform = `translate(${rect2.left - rect1.left}px, ${rect2.top - rect1.top}px)`;
    cell2.style.transform = `translate(${rect1.left - rect2.left}px, ${rect1.top - rect2.top}px)`;

    setTimeout(() => {
      cell1.style.transition = "";
      cell2.style.transition = "";
      cell1.style.transform = "";
      cell2.style.transform = "";
      resolve();
    }, 200);
  });
}

// --------------------------
// Swap Handling
// --------------------------
async function attemptSwap(r1, c1, r2, c2) {
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return false;

  let cell1 = cellElements[r1][c1];
  let cell2 = cellElements[r2][c2];

  await animateSwap(cell1, cell2);

  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
  renderBoard();
  return true;
}

// --------------------------
// Click-to-Swap for PC
// --------------------------
function handleCellSelect(row, col) {
  if (selectedCell === null) {
    selectedCell = { row, col };
    cellElements[row][col].classList.add("selected");
  } else {
    const prev = selectedCell;
    if (prev.row === row && prev.col === col) {
      cellElements[prev.row][prev.col].classList.remove("selected");
      selectedCell = null;
      return;
    }
    if (attemptSwap(prev.row, prev.col, row, col)) {
      cellElements[prev.row][prev.col].classList.remove("selected");
      selectedCell = null;
    } else {
      cellElements[prev.row][prev.col].classList.remove("selected");
      selectedCell = { row, col };
      cellElements[row][col].classList.add("selected");
    }
  }
}

// --------------------------
// Drag-to-Swap for Mobile
// --------------------------
function handleTouchStart(e) {
  const cell = e.target.closest(".gem");
  if (!cell) return;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  touchStartCell = { row, col };
}

function handleTouchMove(e) {
  if (!touchStartCell) return;
  const touch = e.touches[0];
  const targetCell = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!targetCell || !targetCell.classList.contains("gem")) return;

  const row = parseInt(targetCell.dataset.row);
  const col = parseInt(targetCell.dataset.col);

  if (attemptSwap(touchStartCell.row, touchStartCell.col, row, col)) {
    touchStartCell = null;
  }
}

function handleTouchEnd() {
  touchStartCell = null;
}

// --------------------------
// Game Initialization
// --------------------------
function initGame() {
  scoreElem = document.getElementById("score");
  timerElem = document.getElementById("timer");
  gameBoardElem = document.getElementById("gameBoard");

  generateBoard();
  renderBoard();
  startTimer();

  gameBoardElem.addEventListener("touchstart", handleTouchStart, { passive: false });
  gameBoardElem.addEventListener("touchmove", handleTouchMove, { passive: false });
  gameBoardElem.addEventListener("touchend", handleTouchEnd);
}

// --------------------------
// End Game
// --------------------------
function endGame() {
  alert(`Game Over! Final Score: ${score}`);
  startNewGame();
}

// --------------------------
// Start New Game
// --------------------------
function startNewGame() {
  score = 0;
  scoreElem.textContent = score;
  startTimer();
  initGame();
}

// --------------------------
// Initialize on Page Load
// --------------------------
window.addEventListener("load", initGame);
