"use strict";

// --------------------------
// Configuration & Constants
// --------------------------
const rows = 8;
const cols = 8;
const gemTypes = ["ruby", "sapphire", "emerald", "amber", "amethyst", "diamond"];
const BASE_POINT = 10;
const LEVEL_UP_XP = 100;
const MULTI_THRESHOLD = gemTypes.length;
const GAME_TIME = 180; // 3 minutes (180 seconds)

// --------------------------
// Game State Variables
// --------------------------
let board = [];
let cellElements = [];
let score = 0;
let multiplier = 1;
let multiProgress = 0;
let cash = 0;
let selectedCell = null;
let gemStats = {};
let upgradeLevels = {};
let achievements = {};
let timeRemaining = GAME_TIME;
let timerInterval = null;

// Track touch movement for mobile drag-to-swap
let touchStartCell = null;

// --------------------------
// DOM Element References
// --------------------------
let scoreElem, cashElem, multiElem, multiFillElem, timerElem;
let shopModal;
let shopItemsElems = {};
let gemBarElems = {};

// --------------------------
// Persistence Utilities
// --------------------------
function savePersistentData() {
  localStorage.setItem("cash", cash);
  for (let type of gemTypes) {
    localStorage.setItem("upgrade_" + type, upgradeLevels[type]);
  }
  localStorage.setItem("achievements", JSON.stringify(achievements));
}

function loadPersistentData() {
  cash = parseInt(localStorage.getItem("cash")) || 0;
  for (let type of gemTypes) {
    upgradeLevels[type] = parseInt(localStorage.getItem("upgrade_" + type)) || 0;
  }
  let savedAch = localStorage.getItem("achievements");
  achievements = savedAch ? JSON.parse(savedAch) : { score1000: false, match4: false, match5: false, multi5: false };
}

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
  let newBoard = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let available = gemTypes.slice();
      if (j >= 2 && newBoard[i][j-1] === newBoard[i][j-2]) {
        available = available.filter(type => type !== newBoard[i][j-1]);
      }
      if (i >= 2 && newBoard[i-1][j] === newBoard[i-2][j]) {
        available = available.filter(type => type !== newBoard[i-1][j]);
      }
      newBoard[i][j] = available[Math.floor(Math.random() * available.length)];
    }
  }
  return newBoard;
}

function renderBoard() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      cellElements[i][j].className = "gem " + board[i][j];
      if (!cellElements[i][j].querySelector(".shape")) {
        const shape = document.createElement("div");
        shape.className = "shape";
        cellElements[i][j].appendChild(shape);
      }
    }
  }
}

function attemptSwap(r1, c1, r2, c2) {
  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
  let matches = findMatches();
  if (matches.length === 0) {
    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
    return false;
  }
  renderBoard();
  return true;
}

// --------------------------
// Touch Drag Handling for Mobile
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

  if (
    Math.abs(touchStartCell.row - row) + Math.abs(touchStartCell.col - col) === 1
  ) {
    attemptSwap(touchStartCell.row, touchStartCell.col, row, col);
    touchStartCell = null; // Reset after swap
  }
}

function handleTouchEnd() {
  touchStartCell = null;
}

// --------------------------
// Game Initialization
// --------------------------
function initGame() {
  loadPersistentData();
  scoreElem = document.getElementById("score");
  cashElem = document.getElementById("cash");
  multiElem = document.getElementById("multiplier");
  multiFillElem = document.getElementById("multiplierFill");
  timerElem = document.getElementById("timer");
  const boardDiv = document.getElementById("gameBoard");

  boardDiv.innerHTML = "";
  board = generateBoard();
  cellElements = Array.from({ length: rows }, () => Array(cols));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div");
      cell.className = "gem " + board[i][j];
      cell.dataset.row = i;
      cell.dataset.col = j;
      const shape = document.createElement("div");
      shape.className = "shape";
      cell.appendChild(shape);

      cell.addEventListener("click", () => handleCellSelect(i, j));
      boardDiv.appendChild(cell);
      cellElements[i][j] = cell;
    }
  }

  boardDiv.addEventListener("touchstart", handleTouchStart);
  boardDiv.addEventListener("touchmove", handleTouchMove);
  boardDiv.addEventListener("touchend", handleTouchEnd);

  startTimer();
  renderBoard();
}

// --------------------------
// Ending the Game
// --------------------------
function endGame() {
  alert(`Game Over! Final Score: ${score}`);
  startNewGame();
}

// --------------------------
// Starting the Game
// --------------------------
function startNewGame() {
  score = 0;
  scoreElem.textContent = score;
  multiplier = 1;
  multiElem.textContent = multiplier;
  multiFillElem.style.width = "0%";
  startTimer();
  initGame();
}

// --------------------------
// Initialize on Page Load
// --------------------------
window.addEventListener("load", initGame);