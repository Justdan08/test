"use strict";

// --------------------------
// Configuration & Constants
// --------------------------
const rows = 8;
const cols = 8;
const gemTypes = ["ruby", "sapphire", "emerald", "amber", "amethyst", "diamond"];
const BASE_POINT = 10;      // Base point value for each gem
const LEVEL_UP_XP = 100;    // XP needed for a gem type to level up (per game)
const MULTI_THRESHOLD = gemTypes.length; // Global multiplier increases after this many gem level-ups

// --------------------------
// Game State Variables
// --------------------------
let board = [];            // 2D array of gem type names (e.g. "ruby")
let cellElements = [];     // 2D array of DOM elements for each board cell
let score = 0;
let multiplier = 1;
let multiProgress = 0;     // Count of gem level-ups toward next multiplier increase
let cash = 0;
let selectedCell = null;   // { row, col }
let gemStats = {};         // Temporary per-game XP and level for each gem type, e.g. gemStats["ruby"] = { level: 0, xp: 0 }
let upgradeLevels = {};    // Permanent upgrades for each gem type (persisted)
let achievements = {};     // Achievement unlock status (persisted)

// --------------------------
// DOM Element References
// --------------------------
let scoreElem, cashElem, multiElem, multiFillElem;
let shopModal;
let shopItemsElems = {};   // For each gem type in shop
let gemBarElems = {};      // For each gem type's XP bar (from header)

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
// Game Functions
// --------------------------

// Reset temporary gem stats (XP and level) at the start of a new game
function resetGemStats() {
  gemStats = {};
  for (let type of gemTypes) {
    gemStats[type] = { level: 0, xp: 0 };
    if (gemBarElems[type]) {
      gemBarElems[type].levelText.textContent = "1"; // Displayed level starts at 1
      gemBarElems[type].fill.style.width = "0%";
    }
  }
}

// Generate a new board with random gems (stored as type names), avoiding initial matches
function generateBoard() {
  let newBoard = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let available = gemTypes.slice();
      // Avoid horizontal triple
      if (j >= 2 && newBoard[i][j-1] === newBoard[i][j-2]) {
        const avoid = newBoard[i][j-1];
        available = available.filter(type => type !== avoid);
      }
      // Avoid vertical triple
      if (i >= 2 && newBoard[i-1][j] === newBoard[i-2][j]) {
        const avoid = newBoard[i-1][j];
        available = available.filter(type => type !== avoid);
      }
      const randIndex = Math.floor(Math.random() * available.length);
      newBoard[i][j] = available[randIndex];
    }
  }
  return newBoard;
}

// Find matches: returns list of positions ({r, c}) to remove
function findMatches() {
  let toRemove = Array.from({ length: rows }, () => Array(cols).fill(false));
  // Horizontal matches
  for (let i = 0; i < rows; i++) {
    let runLength = 1;
    for (let j = 1; j < cols; j++) {
      if (board[i][j] === board[i][j-1]) {
        runLength++;
      } else {
        if (runLength >= 3) {
          for (let k = 0; k < runLength; k++) {
            toRemove[i][j-1-k] = true;
          }
          if (runLength >= 4) {
            if (!achievements.match4) {
              achievements.match4 = true;
              alert("Achievement Unlocked: Matched 4 in a row!");
            }
            if (runLength >= 5 && !achievements.match5) {
              achievements.match5 = true;
              alert("Achievement Unlocked: Matched 5 in a row!");
            }
          }
        }
        runLength = 1;
      }
    }
    if (runLength >= 3) {
      for (let k = 0; k < runLength; k++) {
        toRemove[i][cols-1-k] = true;
      }
      if (runLength >= 4) {
        if (!achievements.match4) {
          achievements.match4 = true;
          alert("Achievement Unlocked: Matched 4 in a row!");
        }
        if (runLength >= 5 && !achievements.match5) {
          achievements.match5 = true;
          alert("Achievement Unlocked: Matched 5 in a row!");
        }
      }
    }
  }
  // Vertical matches
  for (let j = 0; j < cols; j++) {
    let runLength = 1;
    for (let i = 1; i < rows; i++) {
      if (board[i][j] === board[i-1][j]) {
        runLength++;
      } else {
        if (runLength >= 3) {
          for (let k = 0; k < runLength; k++) {
            toRemove[i-1-k][j] = true;
          }
          if (runLength >= 4) {
            if (!achievements.match4) {
              achievements.match4 = true;
              alert("Achievement Unlocked: Matched 4 vertically!");
            }
            if (runLength >= 5 && !achievements.match5) {
              achievements.match5 = true;
              alert("Achievement Unlocked: Matched 5 vertically!");
            }
          }
        }
        runLength = 1;
      }
    }
    if (runLength >= 3) {
      for (let k = 0; k < runLength; k++) {
        toRemove[rows-1-k][j] = true;
      }
      if (runLength >= 4) {
        if (!achievements.match4) {
          achievements.match4 = true;
          alert("Achievement Unlocked: Matched 4 vertically!");
        }
        if (runLength >= 5 && !achievements.match5) {
          achievements.match5 = true;
          alert("Achievement Unlocked: Matched 5 vertically!");
        }
      }
    }
  }
  let removals = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (toRemove[i][j]) {
        removals.push({ r: i, c: j });
      }
    }
  }
  return removals;
}

// Apply gravity: drop gems to fill empty spaces
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

// Fill empty spaces with new random gems
function fillEmptySpaces() {
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      if (board[i][j] === null) {
        board[i][j] = gemTypes[Math.floor(Math.random() * gemTypes.length)];
      }
    }
  }
}

// Check if any valid moves remain
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

// Shuffle the board if no moves remain
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

// Render the board to the DOM
function renderBoard() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Set the outer cell class to "gem" plus the gem type (e.g., "ruby")
      cellElements[i][j].className = "gem " + board[i][j];
      // Ensure a child element with class "shape" exists
      if (!cellElements[i][j].querySelector(".shape")) {
        const shape = document.createElement("div");
        shape.className = "shape";
        cellElements[i][j].appendChild(shape);
      }
    }
  }
}

// Attempt to swap two gems and process matches/cascades
function attemptSwap(r1, c1, r2, c2) {
  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
  let matches = findMatches();
  if (matches.length === 0) {
    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
    return false;
  }
  while (true) {
    let toRemove = findMatches();
    if (toRemove.length === 0) break;
    let removedByType = {};
    for (let pos of toRemove) {
      let type = board[pos.r][pos.c];
      removedByType[type] = (removedByType[type] || 0) + 1;
      board[pos.r][pos.c] = null;
    }
    for (let type in removedByType) {
      const count = removedByType[type];
      const currentLevel = gemStats[type].level;
      const gemValue = BASE_POINT + 5 * currentLevel;
      score += gemValue * count * multiplier;
      cash += count;
      const xpGain = 10 * count * (1 + (upgradeLevels[type] || 0));
      gemStats[type].xp += xpGain;
      while (gemStats[type].xp >= LEVEL_UP_XP) {
        gemStats[type].xp -= LEVEL_UP_XP;
        gemStats[type].level += 1;
        gemBarElems[type].levelText.textContent = gemStats[type].level + 1;
        multiProgress++;
        if (multiProgress >= MULTI_THRESHOLD) {
          multiProgress -= MULTI_THRESHOLD;
          multiplier++;
          multiElem.textContent = multiplier;
          if (!achievements.multi5 && multiplier >= 5) {
            achievements.multi5 = true;
            alert("Achievement Unlocked: Multiplier x5 reached!");
          }
        }
        const percentMulti = Math.floor((multiProgress / MULTI_THRESHOLD) * 100);
        multiFillElem.style.width = percentMulti + "%";
      }
      const percentXP = Math.floor((gemStats[type].xp / LEVEL_UP_XP) * 100);
      gemBarElems[type].fill.style.width = percentXP + "%";
    }
    scoreElem.textContent = score;
    cashElem.textContent = cash;
    savePersistentData();
    dropGems();
    fillEmptySpaces();
    renderBoard();
  }
  if (!hasMoves()) {
    shuffleBoard();
  }
  return true;
}

// Handle cell selection (click/tap)
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
    if (Math.abs(prev.row - row) + Math.abs(prev.col - col) === 1) {
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

// Initialize the game board and UI
function initGame() {
  loadPersistentData();
  scoreElem = document.getElementById("score");
  cashElem = document.getElementById("cash");
  multiElem = document.getElementById("multiplier");
  multiFillElem = document.getElementById("multiplierFill");
  shopModal = document.getElementById("shopModal");
  
  document.querySelectorAll(".gem-bar").forEach(barElem => {
    let type = barElem.classList[1]; // e.g., "ruby"
    gemBarElems[type] = {
      levelText: barElem.querySelector(".gem-level"),
      fill: barElem.querySelector(".xp-fill")
    };
  });
  
  document.querySelectorAll(".shop-item").forEach(item => {
    const type = item.dataset.type;
    shopItemsElems[type] = {
      levelSpan: item.querySelector(".up-level"),
      costSpan: item.querySelector(".up-cost"),
      element: item
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
  
  cashElem.textContent = cash;
  scoreElem.textContent = score;
  multiElem.textContent = multiplier;
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
      cell.className = "gem " + board[i][j];
      cell.dataset.row = i;
      cell.dataset.col = j;
      // Create inner shape element for custom styling
      const shape = document.createElement("div");
      shape.className = "shape";
      cell.appendChild(shape);
      cell.addEventListener("click", () => handleCellSelect(i, j));
      cell.addEventListener("touchstart", e => {
        e.preventDefault();
        handleCellSelect(i, j);
      }, { passive: false });
      cellElements[i][j] = cell;
      boardDiv.appendChild(cell);
    }
  }
  score = 0;
  scoreElem.textContent = score;
  multiplier = 1;
  multiElem.textContent = multiplier;
  multiProgress = 0;
  multiFillElem.style.width = "0%";
}

// Start a new game (reset board and temporary stats)
function startNewGame() {
  selectedCell = null;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      cellElements[i][j].classList.remove("selected");
    }
  }
  board = generateBoard();
  if (!hasMoves()) {
    let attempts = 0;
    while (!hasMoves() && attempts < 50) {
      board = generateBoard();
      attempts++;
    }
  }
  renderBoard();
  score = 0;
  scoreElem.textContent = score;
  multiplier = 1;
  multiElem.textContent = multiplier;
  multiProgress = 0;
  multiFillElem.style.width = "0%";
  resetGemStats();
}

// Open the shop modal and update upgrade info
function openShop() {
  for (let type of gemTypes) {
    shopItemsElems[type].levelSpan.textContent = upgradeLevels[type] || 0;
    const cost = 150 * Math.pow(2, upgradeLevels[type] || 0);
    shopItemsElems[type].costSpan.textContent = cost;
  }
  shopModal.classList.remove("hidden");
}

// Purchase an upgrade for a given gem type
function purchaseUpgrade(type) {
  const currentLevel = upgradeLevels[type] || 0;
  const cost = 150 * Math.pow(2, currentLevel);
  if (cash < cost) {
    alert("Not enough cash!");
    return;
  }
  cash -= cost;
  upgradeLevels[type] = currentLevel + 1;
  cashElem.textContent = cash;
  shopItemsElems[type].levelSpan.textContent = upgradeLevels[type];
  shopItemsElems[type].costSpan.textContent = 150 * Math.pow(2, upgradeLevels[type]);
  savePersistentData();
}

// --------------------------
// Initialization on Page Load
// --------------------------
window.addEventListener("load", initGame);
