"use strict";

// --------------------------
// Configuration & Constants
// --------------------------
const rows = 8;
const cols = 8;
const gemTypes = ["ruby", "sapphire", "emerald", "amber", "amethyst", "diamond"];
const BASE_POINT = 10;
const LEVEL_UP_XP = 100;
const MULTI_THRESHOLD = 20; // Increase global multiplier every 20 gem level-ups
const GAME_TIME = 180;      // 3 minutes in seconds

// --------------------------
// Game State Variables
// --------------------------
let board = [];            // 2D array holding gem type strings (e.g., "ruby")
let cellElements = [];     // 2D array of DOM elements for each cell
let score = 0;
let multiplier = 1;
let multiProgress = 0;     // Count toward next multiplier increase
let cash = 0;
let selectedCell = null;   // For click-to-swap { row, col }
let gemStats = {};         // Per-game gem XP and level, e.g., gemStats["ruby"] = { level: 0, xp: 0 }
let upgradeLevels = {};    // Permanent upgrades for each gem type (persisted)
let timeRemaining = GAME_TIME;
let timerInterval = null;
let animating = false;     // Prevent overlapping animations

// For mobile drag
let touchStartCell = null;

// --------------------------
// DOM Element References
// --------------------------
let scoreElem, cashElem, multiElem, multiFillElem, timerElem;
let gameBoardElem;
let shopModal, gameOverModal;
let finalScoreElem, earnedCashElem;
let gemBarElems = {};      // For each gem type's XP bar in the header
let shopItemsElems = {};   // For shop upgrade items

// --------------------------
// Persistence Utilities
// --------------------------
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
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerElem.textContent = `Time Left: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// --------------------------
// Board Generation & Rendering
// --------------------------
function generateBoard() {
  board = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let available = gemTypes.slice();
      if (j >= 2 && board[i][j-1] === board[i][j-2]) {
        available = available.filter(type => type !== board[i][j-1]);
      }
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
      const typeName = board[i][j]; // board stores string values
      cellElements[i][j].className = "gem " + typeName;
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
async function processMatches() {
  while (true) {
    let matches = findMatches();
    if (matches.length === 0) break;
    let oldPositions = {};
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        oldPositions[`${i},${j}`] = cellElements[i][j].offsetTop;
      }
    }
    let removalPromises = matches.map(pos => animateRemoval(cellElements[pos.r][pos.c]));
    await Promise.all(removalPromises);
    matches.forEach(pos => {
      board[pos.r][pos.c] = null;
    });
    score += matches.length * BASE_POINT;
    scoreElem.textContent = score;
    dropGems();
    fillEmptySpaces();
    renderBoard();
    await animateFalling(oldPositions);
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
  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
  if (findMatches().length === 0) {
    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
    return false;
  }
  animating = true;
  const cell1 = cellElements[r1][c1];
  const cell2 = cellElements[r2][c2];
  await animateSwap(cell1, cell2);
  renderBoard();
  await processMatches();
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
  const cellElem = e.target.closest(".gem");
  if (!cellElem) return;
  const r = parseInt(cellElem.dataset.row);
  const c = parseInt(cellElem.dataset.col);
  touchStartCell = { row: r, col: c };
}
function handleTouchMove(e) {
  if (!touchStartCell) return;
  e.preventDefault();
  const touch = e.touches[0];
  const targetElem = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!targetElem) return;
  const cellElem = targetElem.closest(".gem");
  if (!cellElem) return;
  const r = parseInt(cellElem.dataset.row);
  const c = parseInt(cellElem.dataset.col);
  if (r === touchStartCell.row && c === touchStartCell.col) return;
  if (attemptSwap(touchStartCell.row, touchStartCell.col, r, c)) {
    touchStartCell = null;
  } else {
    if (Math.abs(touchStartCell.row - r) + Math.abs(touchStartCell.col - c) === 1) {
      touchStartCell = null;
    }
  }
}
function handleTouchEnd() {
  touchStartCell = null;
}

// --------------------------
// Timer & End Game Functions
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
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerElem.textContent = `Time Left: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}
function endGame() {
  clearInterval(timerInterval);
  const earned = Math.floor(score * 0.02);
  if (earned > 0) {
    cash += earned;
  }
  finalScoreElem.textContent = score;
  earnedCashElem.textContent = earned;
  cashElem.textContent = cash;
  gameOverModal.classList.remove("hidden");
  savePersistentData();
}

// --------------------------
// Start New Game Function
// --------------------------
function startNewGame() {
  clearInterval(timerInterval);
  shopModal.classList.add("hidden");
  gameOverModal.classList.add("hidden");
  if (selectedCell) {
    cellElements[selectedCell.row][selectedCell.col].classList.remove("selected");
    selectedCell = null;
  }
  score = 0;
  multiplier = 1;
  multiProgress = 0;
  scoreElem.textContent = "0";
  multiElem.textContent = "1";
  multiFillElem.style.width = "0%";
  resetGemStats();
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
  cellElements = Array.from({ length: rows }, () => Array(cols));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div");
      const typeName = board[i][j]; // board stores string values now
      cell.className = "gem " + typeName;
      cell.dataset.row = i;
      cell.dataset.col = j;
      const shape = document.createElement("div");
      shape.className = "shape";
      cell.appendChild(shape);
      cell.addEventListener("click", () => handleCellSelect(i, j));
      cellElements[i][j] = cell;
      boardDiv.appendChild(cell);
    }
  }
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
  }
  shopModal.classList.remove("hidden");
}
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
// Reset Gem Stats
// --------------------------
function resetGemStats() {
  gemStats = {};
  for (let type of gemTypes) {
    gemStats[type] = { level: 0, xp: 0 };
    if (gemBarElems[type]) {
      gemBarElems[type].levelText.textContent = "1";
      gemBarElems[type].fill.style.width = "0%";
    }
  }
}

// --------------------------
// Initialization on Page Load
// --------------------------
window.addEventListener("load", () => {
  loadPersistentData();
  
  // Get references to UI elements
  scoreElem = document.getElementById("score");
  cashElem = document.getElementById("cash");
  timerElem = document.getElementById("timer");
  multiElem = document.getElementById("multiplier");
  multiFillElem = document.getElementById("multiplierFill");
  shopModal = document.getElementById("shopModal");
  gameOverModal = document.getElementById("gameOverModal");
  finalScoreElem = document.getElementById("finalScore");
  earnedCashElem = document.getElementById("earnedCash");
  
  document.querySelectorAll(".gem-bar").forEach(bar => {
    const type = bar.classList[1];
    gemBarElems[type] = {
      levelText: bar.querySelector(".gem-level"),
      fill: bar.querySelector(".xp-fill")
    };
  });
  
  document.querySelectorAll(".shop-item").forEach(item => {
    const type = item.dataset.type;
    shopItemsElems[type] = {
      levelSpan: item.querySelector(".up-level"),
      costSpan: item.querySelector(".up-cost")
    };
    item.addEventListener("click", () => purchaseUpgrade(type));
  });
  
  const shopBtn = document.getElementById("shopBtn");
  if (shopBtn) {
    shopBtn.addEventListener("click", openShop);
  }
  
  document.getElementById("newGameBtn").addEventListener("click", startNewGame);
  document.getElementById("restartBtn").addEventListener("click", startNewGame);
  
  const gameOverContent = document.getElementById("gameOverContent");
  if (gameOverContent && !document.getElementById("shopBtnModal")) {
    const shopButton = document.createElement("button");
    shopButton.id = "shopBtnModal";
    shopButton.textContent = "Shop";
    shopButton.addEventListener("click", () => {
      gameOverModal.classList.add("hidden");
      openShop();
    });
    gameOverContent.insertBefore(shopButton, document.getElementById("restartBtn"));
  }
  
  startNewGame();
  
  const boardDiv = document.getElementById("gameBoard");
  boardDiv.addEventListener("touchstart", handleTouchStart, { passive: false });
  boardDiv.addEventListener("touchmove", handleTouchMove, { passive: false });
  boardDiv.addEventListener("touchend", handleTouchEnd);
});
