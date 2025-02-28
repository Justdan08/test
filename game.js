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
let scoreElem, timerElem, gameBoardElem;

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
// Match Detection & Clearing
// --------------------------
function findMatches() {
  let matches = [];

  // Check horizontal matches
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols - 2; j++) {
      if (board[i][j] && board[i][j] === board[i][j + 1] && board[i][j] === board[i][j + 2]) {
        matches.push({ row: i, col: j });
        matches.push({ row: i, col: j + 1 });
        matches.push({ row: i, col: j + 2 });
      }
    }
  }

  // Check vertical matches
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows - 2; i++) {
      if (board[i][j] && board[i][j] === board[i + 1][j] && board[i][j] === board[i + 2][j]) {
        matches.push({ row: i, col: j });
        matches.push({ row: i + 1, col: j });
        matches.push({ row: i + 2, col: j });
      }
    }
  }

  return matches;
}

function clearMatches() {
  let matches = findMatches();
  if (matches.length === 0) return false;

  matches.forEach(({ row, col }) => {
    board[row][col] = null;
    cellElements[row][col].classList.add("disappearing");
  });

  score += matches.length * BASE_POINT;
  scoreElem.textContent = score;

  setTimeout(() => {
    applyGravity();
  }, 200);

  return true;
}

// --------------------------
// Applying Gravity
// --------------------------
function applyGravity() {
  for (let j = 0; j < cols; j++) {
    let emptySpots = 0;
    for (let i = rows - 1; i >= 0; i--) {
      if (board[i][j] === null) {
        emptySpots++;
      } else if (emptySpots > 0) {
        board[i + emptySpots][j] = board[i][j];
        board[i][j] = null;
      }
    }
  }
  fillEmptySpaces();
}

// --------------------------
// Spawning New Gems
// --------------------------
function fillEmptySpaces() {
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      if (board[i][j] === null) {
        board[i][j] = gemTypes[Math.floor(Math.random() * gemTypes.length)];
      }
    }
  }
  renderBoard();
  setTimeout(() => {
    if (clearMatches()) {
      setTimeout(applyGravity, 300);
    }
  }, 200);
}

// --------------------------
// Swap Handling
// --------------------------
async function attemptSwap(r1, c1, r2, c2) {
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return false;

  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
  renderBoard();

  setTimeout(() => {
    if (!clearMatches()) {
      [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
      renderBoard();
    }
  }, 300);

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
// Game Initialization
// --------------------------
function initGame() {
  scoreElem = document.getElementById("score");
  timerElem = document.getElementById("timer");
  gameBoardElem = document.getElementById("gameBoard");

  generateBoard();
  renderBoard();
  startTimer();
}

// --------------------------
// End Game
// --------------------------
function endGame() {
  alert(`Game Over! Final Score: ${score}`);
  startNewGame();
}

// --------------------------
// Initialize on Page Load
// --------------------------
window.addEventListener("load", initGame);
