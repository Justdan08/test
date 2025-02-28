"use strict";

// --------------------------
// Configuration & Constants
// --------------------------
const rows = 8;
const cols = 8;
const gemTypes = ["ruby", "sapphire", "emerald", "amber", "amethyst", "diamond"];
const BASE_POINT = 10;
<<<<<<< HEAD
const LEVEL_UP_XP = 100;
const MULTI_THRESHOLD = 20; // e.g., every 20 gem level-ups increases global multiplier
const GAME_TIME = 180;      // 3 minutes in seconds
=======
const GAME_TIME = 180; // 3 minutes (180 seconds)
>>>>>>> parent of b900e9a (Update game.js)

// --------------------------
// Game State Variables
// --------------------------
let board = [];            // 2D array holding gem type names (e.g., "ruby")
let cellElements = [];     // 2D array of DOM elements for each board cell
let score = 0;
<<<<<<< HEAD
let multiplier = 1;
let multiProgress = 0;     // Count toward next multiplier increase
let cash = 0;
let selectedCell = null;   // For click-to-swap { row, col }
let gemStats = {};         // Per-game XP and level for each gem type, e.g., gemStats["ruby"] = { level: 0, xp: 0 }
let upgradeLevels = {};    // Permanent upgrades for each gem type (persisted)
let timeRemaining = GAME_TIME;
let timerInterval = null;
let animating = false;     // Flag to prevent overlapping animations

// For mobile drag
=======
let selectedCell = null;
let timeRemaining = GAME_TIME;
let timerInterval = null;

// Touch dragging for mobile
>>>>>>> parent of b900e9a (Update game.js)
let touchStartCell = null;

// --------------------------
// DOM Element References
// --------------------------
<<<<<<< HEAD
let scoreElem, timerElem, cashElem, multiElem, multiFillElem;
let gameBoardElem;
let shopModal, gameOverModal;
let finalScoreElem, earnedCashElem;
let gemBarElems = {};      // For each gem type's XP bar (from header)
let shopItemsElems = {};   // For shop upgrade items
=======
let scoreElem, timerElem, gameBoardElem;
>>>>>>> parent of b900e9a (Update game.js)

// --------------------------
// Timer Functions
// --------------------------
<<<<<<< HEAD
function savePersistentData() {
  localStorage.setItem("cash", cash);
  for (let type of gemTypes) {
    localStorage.setItem("upgrade_" + type, upgradeLevels[type]);
  }
}

function loadPersistentData() {
  cash = parseInt(localStorage.getItem("cash")) || 0;
  for (let type of gemTypes) {
    upgradeLevels[type] = parseInt(localStorage.getItem("upgrade_" + type)) || 0;
  }
}

// --------------------------
// Timer Functions
// --------------------------
=======
>>>>>>> parent of b900e9a (Update game.js)
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
<<<<<<< HEAD
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerElem.textContent = `Time Left: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// --------------------------
// Board Generation & Rendering
=======
  timerElem.textContent = `Time Left: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, "0")}`;
}

// --------------------------
// Game Functions
>>>>>>> parent of b900e9a (Update game.js)
// --------------------------
function generateBoard() {
  board = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let available = gemTypes.slice();
<<<<<<< HEAD
      // Avoid immediate horizontal triple
      if (j >= 2 && board[i][j-1] === board[i][j-2]) {
        available = available.filter(type => type !== board[i][j-1]);
      }
      // Avoid immediate vertical triple
      if (i >= 2 && board[i-1][j] === board[i-2][j]) {
        available = available.filter(type => type !== board[i-1][j]);
      }
      board[i][j] = available[Math.floor(Math.random() * available.length)];
    }
  }
}

function renderBoard() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const typeName = board[i][j];
      cellElements[i][j].className = "gem " + typeName;
      // Ensure the inner "shape" exists for custom styling
      if (!cellElements[i][j].querySelector(".shape")) {
        const shape = document.createElement("div");
        shape.className = "shape";
        cellElements[i][j].appendChild(shape);
      }
    }
  }
}

// --------------------------
// Falling Animation
// --------------------------
function animateFalling(oldPositions) {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = cellElements[i][j];
      const newTop = cell.offsetTop;
      const oldTop = oldPositions[`${i},${j}`] || newTop;
      const diff = oldTop - newTop;
      if (diff !== 0) {
        cell.style.transform = `translateY(${diff}px)`;
        cell.offsetHeight; // Force reflow
        cell.style.transition = "transform 0.3s ease-out";
        cell.style.transform = "";
      }
    }
  }
  setTimeout(() => {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        cellElements[i][j].style.transition = "";
      }
    }
  }, 300);
}

// --------------------------
// Match Detection & Clearing
// --------------------------
function findMatches() {
  let toRemove = Array.from({ length: rows }, () => Array(cols).fill(false));
  // Horizontal matches
  for (let i = 0; i < rows; i++) {
    let runLength = 1;
    for (let j = 1; j < cols; j++) {
      if (board[i][j] !== null && board[i][j] === board[i][j-1]) {
        runLength++;
      } else {
        if (runLength >= 3) {
          for (let k = 0; k < runLength; k++) {
            toRemove[i][j-1-k] = true;
          }
        }
        runLength = 1;
      }
    }
    if (runLength >= 3) {
      for (let k = 0; k < runLength; k++) {
        toRemove[i][cols-1-k] = true;
      }
    }
  }
  // Vertical matches
  for (let j = 0; j < cols; j++) {
    let runLength = 1;
    for (let i = 1; i < rows; i++) {
      if (board[i][j] !== null && board[i][j] === board[i-1][j]) {
        runLength++;
      } else {
        if (runLength >= 3) {
          for (let k = 0; k < runLength; k++) {
            toRemove[i-1-k][j] = true;
          }
        }
        runLength = 1;
      }
    }
    if (runLength >= 3) {
      for (let k = 0; k < runLength; k++) {
        toRemove[rows-1-k][j] = true;
      }
    }
  }
  let matches = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (toRemove[i][j]) {
        matches.push({ r: i, c: j });
      }
    }
  }
  return matches;
}

function processMatches() {
  while (true) {
    let matches = findMatches();
    if (matches.length === 0) break;
    // Record current positions for falling animation
    let oldPositions = {};
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        oldPositions[`${i},${j}`] = cellElements[i][j].offsetTop;
      }
    }
    matches.forEach(({ r, c }) => {
      board[r][c] = null;
      cellElements[r][c].classList.add("disappear");
    });
    score += matches.length * BASE_POINT;
    scoreElem.textContent = score;
    setTimeout(() => {
      dropGems();
      fillEmptySpaces();
      renderBoard();
      animateFalling(oldPositions);
    }, 200);
  }
  if (!hasMoves()) {
    shuffleBoard();
  }
}

function dropGems() {
  for (let j = 0; j < cols; j++) {
    let writeRow = rows - 1;
    for (let i = rows - 1; i >= 0; i--) {
      if (board[i][j] !== null) {
        board[writeRow][j] = board[i][j];
        writeRow--;
      }
    }
    for (let i = writeRow; i >= 0; i--) {
      board[i][j] = null;
    }
  }
}

function fillEmptySpaces() {
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      if (board[i][j] === null) {
        board[i][j] = gemTypes[Math.floor(Math.random() * gemTypes.length)];
      }
    }
  }
}

// Check if any valid moves remain; if not, shuffle the board.
function hasMoves() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (j < cols - 1) {
        [board[i][j], board[i][j+1]] = [board[i][j+1], board[i][j]];
        if (findMatches().length > 0) {
          [board[i][j], board[i][j+1]] = [board[i][j+1], board[i][j]];
          return true;
        }
        [board[i][j], board[i][j+1]] = [board[i][j+1], board[i][j]];
      }
      if (i < rows - 1) {
        [board[i][j], board[i+1][j]] = [board[i+1][j], board[i][j]];
        if (findMatches().length > 0) {
          [board[i][j], board[i+1][j]] = [board[i+1][j], board[i][j]];
          return true;
        }
        [board[i][j], board[i+1][j]] = [board[i+1][j], board[i][j]];
      }
    }
  }
  return false;
}

function shuffleBoard() {
  let gems = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      gems.push(board[i][j]);
    }
  }
  for (let k = gems.length - 1; k > 0; k--) {
    const rand = Math.floor(Math.random() * (k + 1));
    [gems[k], gems[rand]] = [gems[rand], gems[k]];
  }
  let idx = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      board[i][j] = gems[idx++];
    }
  }
  renderBoard();
}

// --------------------------
// Swap Animation & Handling
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

async function attemptSwap(r1, c1, r2, c2) {
  if (animating) return false;
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return false;
  // Tentative swap in board data
  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
  if (findMatches().length === 0) {
    // No match: swap back
    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
    return false;
  }
  animating = true;
  const cell1 = cellElements[r1][c1];
  const cell2 = cellElements[r2][c2];
  await animateSwap(cell1, cell2);
  renderBoard();
  processMatches();
  animating = false;
  return true;
}

// --------------------------
// Input Handling (Click & Touch)
// --------------------------
function handleCellSelect(row, col) {
  if (animating) return;
  if (selectedCell === null) {
    selectedCell = { row, col };
    cellElements[row][col].classList.add("selected");
  } else {
    const prev = selectedCell;
    if (prev.row === row && prev.col === col) {
      cellElements[prev.row][prev.col].classList.remove("selected");
      selectedCell = null;
    } else if (Math.abs(prev.row - row) + Math.abs(prev.col - col) === 1) {
      cellElements[prev.row][prev.col].classList.remove("selected");
      selectedCell = null;
      attemptSwap(prev.row, prev.col, row, col);
    } else {
      cellElements[prev.row][prev.col].classList.remove("selected");
      selectedCell = { row, col };
      cellElements[row][col].classList.add("selected");
    }
  }
}

function handleTouchStart(e) {
  if (animating) return;
  e.preventDefault();
  const cell = e.target.closest(".gem");
  if (!cell) return;
  const r = parseInt(cell.dataset.row);
  const c = parseInt(cell.dataset.col);
  touchStartCell = { row: r, col: c };
}

function handleTouchMove(e) {
  if (!touchStartCell) return;
  e.preventDefault();
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target) return;
  const cell = target.closest(".gem");
  if (!cell) return;
  const r = parseInt(cell.dataset.row);
  const c = parseInt(cell.dataset.col);
  if (r === touchStartCell.row && c === touchStartCell.col) return;
  if (attemptSwap(touchStartCell.row, touchStartCell.col, r, c)) {
    touchStartCell = null;
  }
}

function handleTouchEnd() {
  touchStartCell = null;
}

// --------------------------
// End Game & Restart
// --------------------------
function endGame() {
  clearInterval(timerInterval);
  const earned = Math.floor(score * 0.02);
  cash += earned;
  alert(`Game Over! Final Score: ${score}\nCash Earned: $${earned}`);
  savePersistentData();
  showGameOverModal();
}

function showGameOverModal() {
  finalScoreElem.textContent = score;
  earnedCashElem.textContent = cash;
  gameOverModal.classList.remove("hidden");
}

function startNewGame() {
  clearInterval(timerInterval);
  selectedCell = null;
  score = 0;
  multiplier = 1;
  multiProgress = 0;
  scoreElem.textContent = "0";
  // Reset board and gem stats
  board = generateBoard();
  if (!hasMoves()) {
    let attempts = 0;
    while (!hasMoves() && attempts < 50) {
      board = generateBoard();
      attempts++;
    }
  }
  const boardDiv = document.getElementById("gameBoard");
  boardDiv.innerHTML = "";
=======
      board[i][j] = available[Math.floor(Math.random() * available.length)];
    }
  }
}

function renderBoard() {
  gameBoardElem.innerHTML = "";
>>>>>>> parent of b900e9a (Update game.js)
  cellElements = Array.from({ length: rows }, () => Array(cols));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div");
      cell.className = `gem ${board[i][j]}`;
      cell.dataset.row = i;
      cell.dataset.col = j;
<<<<<<< HEAD
      const shape = document.createElement("div");
      shape.className = "shape";
      cell.appendChild(shape);
=======

      const shape = document.createElement("div");
      shape.className = "shape";
      cell.appendChild(shape);

>>>>>>> parent of b900e9a (Update game.js)
      cell.addEventListener("click", () => handleCellSelect(i, j));
      gameBoardElem.appendChild(cell);
      cellElements[i][j] = cell;
    }
  }
<<<<<<< HEAD
  startTimer();
  renderBoard();
}

// --------------------------
// Shop Functions
// --------------------------
function openShop() {
  for (let type of gemTypes) {
    const level = upgradeLevels[type] || 0;
    const cost = 150 * Math.pow(2, level);
    shopItemsElems[type].levelSpan.textContent = level;
    shopItemsElems[type].costSpan.textContent = cost;
=======
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
>>>>>>> parent of b900e9a (Update game.js)
  }

<<<<<<< HEAD
function purchaseUpgrade(type) {
  const currentLevel = upgradeLevels[type] || 0;
  const cost = 150 * Math.pow(2, currentLevel);
  if (cash < cost) {
    alert("Not enough cash!");
    return;
  }
  cash -= cost;
  upgradeLevels[type] = currentLevel + 1;
  shopItemsElems[type].levelSpan.textContent = upgradeLevels[type];
  shopItemsElems[type].costSpan.textContent = 150 * Math.pow(2, upgradeLevels[type]);
  cashElem.textContent = cash;
  savePersistentData();
}

// --------------------------
// Initialization on Page Load
// --------------------------
window.addEventListener("load", () => {
  loadPersistentData();
  // Get UI elements
  scoreElem = document.getElementById("score");
  cashElem = document.getElementById("cash");
  timerElem = document.getElementById("timer");
  multiElem = document.getElementById("multiplier");
  multiFillElem = document.getElementById("multiplierFill");
  shopModal = document.getElementById("shopModal");
  gameOverModal = document.getElementById("gameOverModal");
  finalScoreElem = document.getElementById("finalScore");
  earnedCashElem = document.getElementById("earnedCash");
  // Initialize gem XP bar elements from header
  document.querySelectorAll(".gem-bar").forEach(bar => {
    const type = bar.classList[1];
    gemBarElems[type] = {
      levelText: bar.querySelector(".gem-level"),
      fill: bar.querySelector(".xp-fill")
    };
  });
  // Initialize shop item event listeners
  document.querySelectorAll(".shop-item").forEach(item => {
    const type = item.dataset.type;
    shopItemsElems[type] = {
      levelSpan: item.querySelector(".up-level"),
      costSpan: item.querySelector(".up-cost")
    };
    item.addEventListener("click", () => purchaseUpgrade(type));
  });
  document.getElementById("closeShop").addEventListener("click", () => {
    shopModal.classList.add("hidden");
  });
  document.getElementById("shopBtn").addEventListener("click", () => {
    openShop();
  });
  document.getElementById("newGameBtn").addEventListener("click", () => {
    startNewGame();
  });
  document.getElementById("restartBtn").addEventListener("click", () => {
    startNewGame();
  });
  // Start the first game
  startNewGame();
  // Set up touch events for mobile drag-to-swap
  const boardDiv = document.getElementById("gameBoard");
  boardDiv.addEventListener("touchstart", handleTouchStart, { passive: false });
  boardDiv.addEventListener("touchmove", handleTouchMove, { passive: false });
  boardDiv.addEventListener("touchend", handleTouchEnd);
});
=======
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
>>>>>>> parent of b900e9a (Update game.js)
