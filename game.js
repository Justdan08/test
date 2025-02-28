"use strict";

// --------------------------
// Configuration & Constants
// --------------------------
const rows = 8;
const cols = 8;
const gemTypes = ["ruby", "sapphire", "emerald", "amber", "amethyst", "diamond"];
const BASE_POINT = 10;
const LEVEL_UP_XP = 100;
const MULTI_THRESHOLD = 20;   // total gem level-ups to increase multiplier
const GAME_TIME = 180;        // 3 minutes in seconds

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
let gemStats = {};      // e.g., gemStats["ruby"] = { level: 0, xp: 0 }
let upgradeLevels = {}; // e.g., upgradeLevels["ruby"] = 0
let timeRemaining = GAME_TIME;
let timerInterval = null;
let touchStartCell = null;
let animating = false;  // whether a swap animation/cascade is in progress

// --------------------------
// DOM Element References
// --------------------------
let scoreElem, cashElem, multiElem, multiFillElem, timerElem;
let shopModal, gameOverModal;
let shopItemsElems = {};
let gemBarElems = {};
let finalScoreElem, earnedCashElem;

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
// Animation Functions (NEW)
// --------------------------
async function animateRemoval(cell) {
  return new Promise(resolve => {
    cell.style.transition = "all 0.3s ease-in-out";
    cell.style.opacity = "0";
    cell.style.transform = "scale(0)";
    setTimeout(() => {
      cell.style.transition = "";
      resolve();
    }, 300);
  });
}
async function animateFall(oldPos, newPos) {
  return new Promise(resolve => {
    const cell = cellElements[newPos.r][newPos.c];
    const oldCell = cellElements[oldPos.r][oldPos.c];
    
    // Clone for animation
    const clone = oldCell.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.left = `${oldCell.offsetLeft}px`;
    clone.style.top = `${oldCell.offsetTop}px`;
    document.getElementById("gameBoard").appendChild(clone);

    // Animate to new position
    setTimeout(() => {
      clone.style.transition = "all 0.4s ease-in-out";
      clone.style.left = `${cell.offsetLeft}px`;
      clone.style.top = `${cell.offsetTop}px`;
    }, 10);

    setTimeout(() => {
      clone.remove();
      resolve();
    }, 410);
  });
}
  await animateSwap(cell1, cell2);
  renderBoard();
  await processMatches();
  animating = false;
  return true;
}

async function processMatches() {
  while (true) {
    let toRemove = findMatches();
    if (toRemove.length === 0) break;

    // Animate removal
    animating = true;
    const removalPromises = [];
    const removedCells = new Set();
    
    // Mark matched gems
    toRemove.forEach(pos => {
      removedCells.add(`${pos.r}-${pos.c}`);
      removalPromises.push(animateRemoval(cellElements[pos.r][pos.c]));
    });

    await Promise.all(removalPromises);
    
    // Clear matched gems
    toRemove.forEach(pos => {
      board[pos.r][pos.c] = null;
    });
    // Drop gems with animation
    const fallAnimations = [];
    dropGems();
    
    // Track falling gems
    for (let j = 0; j < cols; j++) {
      let writeRow = rows - 1;
      for (let i = rows - 1; i >= 0; i--) {
        if (board[i][j] !== null) {
          if (i !== writeRow) {
            fallAnimations.push(animateFall(
              { r: i, c: j },
              { r: writeRow, c: j }
            ));
          }
          writeRow--;
        }
      }
    }

    fillEmptySpaces();
    await Promise.all(fallAnimations);
    renderBoard();
// --------------------------
// Modified Shop Handling
// --------------------------
function endGame() {
  clearInterval(timerInterval);
  const earned = Math.floor(score * 0.02);
  cash += earned;
  
  finalScoreElem.textContent = score;
  earnedCashElem.textContent = earned;
  cashElem.textContent = cash;
  
  // Show game over with shop access
  gameOverModal.classList.remove("hidden");
  savePersistentData();
  
  // Remove shop button from header
  document.getElementById("shopBtn").style.display = "none";
}

function startNewGame() {
  // Reset UI elements
  document.getElementById("shopBtn").style.display = "inline-block";
  // ... (rest of existing startNewGame logic) ...
}
// --------------------------
// Game Functions
// --------------------------

// Reset temporary gem stats (XP and level) at start of a new game
function resetGemStats() {
  gemStats = {};
  for (let type of gemTypes) {
    gemStats[type] = { level: 0, xp: 0 };
    if (gemBarElems[type]) {
      // Displayed level starts at 1
      gemBarElems[type].levelText.textContent = "1";
      gemBarElems[type].fill.style.width = "0%";
    }
  }
}

// Generate a new random board (as 2D array of gem indices), avoiding initial matches
function generateBoard() {
  let newBoard = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let available = [];
      for (let k = 0; k < gemTypes.length; k++) {
        available.push(k);
      }
      // Avoid horizontal match of 3
      if (j >= 2 && newBoard[i][j-1] === newBoard[i][j-2]) {
        const avoid = newBoard[i][j-1];
        available = available.filter(x => x !== avoid);
      }
      // Avoid vertical match of 3
      if (i >= 2 && newBoard[i-1][j] === newBoard[i-2][j]) {
        const avoid = newBoard[i-1][j];
        available = available.filter(x => x !== avoid);
      }
      const randIndex = Math.floor(Math.random() * available.length);
      newBoard[i][j] = available[randIndex];
    }
  }
  return newBoard;
}

// Find all gem matches (3 or more in a row) on the board
// Returns an array of positions to remove, each as { r: i, c: j }
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
    // Check run at end of row
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
    // Check run at end of column
    if (runLength >= 3) {
      for (let k = 0; k < runLength; k++) {
        toRemove[rows-1-k][j] = true;
      }
    }
  }
  // Collect all positions to remove
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

// Apply gravity to drop gems downward into empty spaces
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

// Fill any empty spaces in the board with new random gems
function fillEmptySpaces() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (board[i][j] === null) {
        board[i][j] = Math.floor(Math.random() * gemTypes.length);
      }
    }
  }
}

// Check if any valid moves remain on the board (for shuffle logic)
function hasMoves() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (j < cols - 1) {
        // swap right
        [board[i][j], board[i][j+1]] = [board[i][j+1], board[i][j]];
        if (findMatches().length > 0) {
          // swap back and return true
          [board[i][j], board[i][j+1]] = [board[i][j+1], board[i][j]];
          return true;
        }
        // swap back
        [board[i][j], board[i][j+1]] = [board[i][j+1], board[i][j]];
      }
      if (i < rows - 1) {
        // swap down
        [board[i][j], board[i+1][j]] = [board[i+1][j], board[i][j]];
        if (findMatches().length > 0) {
          // swap back and return true
          [board[i][j], board[i+1][j]] = [board[i+1][j], board[i][j]];
          return true;
        }
        // swap back
        [board[i][j], board[i+1][j]] = [board[i+1][j], board[i][j]];
      }
    }
  }
  return false;
}

// Shuffle the board randomly (called if no moves remain)
function shuffleBoard() {
  let gems = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      gems.push(board[i][j]);
    }
  }
  // Shuffle array
  for (let k = gems.length - 1; k > 0; k--) {
    const rand = Math.floor(Math.random() * (k + 1));
    [gems[k], gems[rand]] = [gems[rand], gems[k]];
  }
  // Put back into board
  let idx = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      board[i][j] = gems[idx++];
    }
  }
  renderBoard();
}

// Render the board state to the DOM
function renderBoard() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const typeIndex = board[i][j];
      const typeName = gemTypes[typeIndex];
      cellElements[i][j].className = "gem " + typeName;
    }
  }
}

// Smooth swap animation between two adjacent gems
function animateSwap(cell1, cell2) {
  return new Promise(resolve => {
    cell1.style.transition = "transform 0.2s ease-in-out";
    cell2.style.transition = "transform 0.2s ease-in-out";
    const rect1 = cell1.getBoundingClientRect();
    const rect2 = cell2.getBoundingClientRect();
    // Translate each cell to the other's position
    cell1.style.transform = `translate(${rect2.left - rect1.left}px, ${rect2.top - rect1.top}px)`;
    cell2.style.transform = `translate(${rect1.left - rect2.left}px, ${rect1.top - rect2.top}px)`;
    // After animation, reset transitions and transforms
    setTimeout(() => {
      cell1.style.transition = "";
      cell2.style.transition = "";
      cell1.style.transform = "";
      cell2.style.transform = "";
      resolve();
    }, 200);
  });
}

// Attempt to swap two gems (returns true if swap executed)
function attemptSwap(r1, c1, r2, c2) {
  if (animating) return false;
  // Only allow swapping adjacent cells
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) {
    return false;
  }
  // Perform a tentative swap in data
  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
  let initialMatches = findMatches();
  if (initialMatches.length === 0) {
    // No match, swap back
    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
    return false;
  }
  // Valid swap (will produce matches)
  animating = true;
  const cell1 = cellElements[r1][c1];
  const cell2 = cellElements[r2][c2];
  // Animate the swap, then process matches and cascades
  animateSwap(cell1, cell2).then(() => {
    // After animation, update the DOM to reflect swapped gems
    renderBoard();
    // Process all matches and falling cascades
    processMatches();
    animating = false;
  });
  return true;
}

// Process matches, cascading, scoring, and experience after a swap
function processMatches() {
  while (true) {
    let toRemove = findMatches();
    if (toRemove.length === 0) break;
    let removedByType = {};
    for (let pos of toRemove) {
      let gemIndex = board[pos.r][pos.c];
      if (gemIndex === null) continue;
      let typeName = gemTypes[gemIndex];
      removedByType[typeName] = (removedByType[typeName] || 0) + 1;
      board[pos.r][pos.c] = null;
    }
    // Award points and XP for removed gems
    for (let type in removedByType) {
      const count = removedByType[type];
      const currentLevel = gemStats[type].level;
      const gemValue = BASE_POINT + 5 * currentLevel;
      score += gemValue * count * multiplier;
      // XP gain (increased by upgrades for this gem type)
      const xpGain = 10 * count * (1 + (upgradeLevels[type] || 0));
      gemStats[type].xp += xpGain;
      // Handle level-ups for this gem type
      while (gemStats[type].xp >= LEVEL_UP_XP) {
        gemStats[type].xp -= LEVEL_UP_XP;
        gemStats[type].level += 1;
        // Update gem level display (level + 1, since base level 0 means Level 1)
        gemBarElems[type].levelText.textContent = gemStats[type].level + 1;
        // Increment global multiplier progress
        multiProgress += 1;
        if (multiProgress >= MULTI_THRESHOLD) {
          multiProgress -= MULTI_THRESHOLD;
          multiplier += 1;
          multiElem.textContent = multiplier;
        }
      }
      // Update this gem type's XP bar fill percentage
      const percentXP = Math.floor((gemStats[type].xp / LEVEL_UP_XP) * 100);
      gemBarElems[type].fill.style.width = percentXP + "%";
    }
    // Update score display (cash display updated on game over)
    scoreElem.textContent = score;
    // Update global multiplier progress bar
    const percentMulti = Math.floor((multiProgress / MULTI_THRESHOLD) * 100);
    multiFillElem.style.width = percentMulti + "%";
    // Remove matched gems and let others fall
    dropGems();
    fillEmptySpaces();
    renderBoard();
  }
  // If no moves remain, shuffle the board
  if (!hasMoves()) {
    shuffleBoard();
  }
}

// Handle gem selection and swapping for mouse clicks/taps (PC)
function handleCellSelect(row, col) {
  if (animating) return;
  if (selectedCell === null) {
    // First gem selected
    selectedCell = { row, col };
    cellElements[row][col].classList.add("selected");
  } else {
    const prev = selectedCell;
    if (prev.row === row && prev.col === col) {
      // Same cell selected twice: deselect
      cellElements[prev.row][prev.col].classList.remove("selected");
      selectedCell = null;
    } else {
      // Second cell selected
      if (Math.abs(prev.row - row) + Math.abs(prev.col - col) === 1) {
        // Adjacent cell: try swap
        cellElements[prev.row][prev.col].classList.remove("selected");
        selectedCell = null;
        attemptSwap(prev.row, prev.col, row, col);
      } else {
        // Not adjacent: switch selection
        cellElements[prev.row][prev.col].classList.remove("selected");
        selectedCell = { row, col };
        cellElements[row][col].classList.add("selected");
      }
    }
  }
}

// Handle touch start (mobile drag start)
function handleTouchStart(e) {
  if (animating) return;
  e.preventDefault();
  const cellElem = e.target.closest(".gem");
  if (!cellElem) return;
  const r = parseInt(cellElem.dataset.row);
  const c = parseInt(cellElem.dataset.col);
  touchStartCell = { row: r, col: c };
}

// Handle touch move (mobile drag to swap)
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
  if (r === touchStartCell.row && c === touchStartCell.col) {
    return; // still on the original gem
  }
  // Attempt swap with the gem under the touch
  if (attemptSwap(touchStartCell.row, touchStartCell.col, r, c)) {
    touchStartCell = null;
  } else {
    // If attempted an adjacent swap that failed, end this drag
    if (Math.abs(touchStartCell.row - r) + Math.abs(touchStartCell.col - c) === 1) {
      touchStartCell = null;
    }
  }
}

// Handle touch end (lift finger)
function handleTouchEnd() {
  touchStartCell = null;
}

// Start the game timer
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

// Update the timer display
function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerElem.textContent = `Time Left: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// End the game and show Game Over screen
function endGame() {
  clearInterval(timerInterval);
  // Calculate money earned as 2% of score
  const earned = Math.floor(score * 0.02);
  if (earned > 0) {
    cash += earned;
  }
  // Update final score and earned cash display
  finalScoreElem.textContent = score;
  earnedCashElem.textContent = earned;
  // Update cash display
  cashElem.textContent = cash;
  // Show Game Over modal
  gameOverModal.classList.remove("hidden");
  // Save persistent data (cash and upgrades)
  savePersistentData();
}

// Start a new game (reset board and stats)
function startNewGame() {
  // Stop any existing timer and hide modals
  clearInterval(timerInterval);
  shopModal.classList.add("hidden");
  gameOverModal.classList.add("hidden");
  // Clear any selected highlight
  if (selectedCell) {
    cellElements[selectedCell.row][selectedCell.col].classList.remove("selected");
    selectedCell = null;
  }
  // Reset score, multiplier, and progress
  score = 0;
  multiplier = 1;
  multiProgress = 0;
  scoreElem.textContent = 0;
  multiElem.textContent = 1;
  multiFillElem.style.width = "0%";
  // Reset per-game gem stats and UI
  resetGemStats();
  // Generate a new random board with at least one valid move
  board = generateBoard();
  if (!hasMoves()) {
    let attempts = 0;
    while (!hasMoves() && attempts < 50) {
      board = generateBoard();
      attempts++;
    }
  }
  // Create the game board UI
  const boardDiv = document.getElementById("gameBoard");
  boardDiv.innerHTML = "";
  cellElements = Array.from({ length: rows }, () => Array(cols));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div");
      const typeIndex = board[i][j];
      const typeName = gemTypes[typeIndex];
      cell.className = "gem " + typeName;
      cell.dataset.row = i;
      cell.dataset.col = j;
      // Create and append gem shape element
      const shape = document.createElement("div");
      shape.className = "shape";
      cell.appendChild(shape);
      // Click event for PC
      cell.addEventListener("click", () => handleCellSelect(i, j));
      cellElements[i][j] = cell;
      boardDiv.appendChild(cell);
    }
  }
  // Reset timer and start countdown
  startTimer();
  // Update cash display (in case cash changed from last game or purchases)
  cashElem.textContent = cash;
}

// Open the shop modal and display current upgrade levels and costs
function openShop() {
  for (let type of gemTypes) {
    const level = upgradeLevels[type] || 0;
    const cost = 150 * Math.pow(2, level);
    shopItemsElems[type].levelSpan.textContent = level;
    shopItemsElems[type].costSpan.textContent = cost;
  }
  shopModal.classList.remove("hidden");
}

// Purchase an upgrade for a gem type if affordable
function purchaseUpgrade(type) {
  const currentLevel = upgradeLevels[type] || 0;
  const cost = 150 * Math.pow(2, currentLevel);
  if (cash < cost) {
    alert("Not enough cash!");
    return;
  }
  cash -= cost;
  upgradeLevels[type] = currentLevel + 1;
  // Update shop display
  shopItemsElems[type].levelSpan.textContent = upgradeLevels[type];
  shopItemsElems[type].costSpan.textContent = 150 * Math.pow(2, upgradeLevels[type]);
  // Update cash in UI and save
  cashElem.textContent = cash;
  savePersistentData();
}

// Initialize game on page load
window.addEventListener("load", () => {
  loadPersistentData();
  // Get references to UI elements
  scoreElem = document.getElementById("score");
  cashElem = document.getElementById("cash");
  multiElem = document.getElementById("multiplier");
  multiFillElem = document.getElementById("multiplierFill");
  timerElem = document.getElementById("timer");
  shopModal = document.getElementById("shopModal");
  gameOverModal = document.getElementById("gameOverModal");
  finalScoreElem = document.getElementById("finalScore");
  earnedCashElem = document.getElementById("earnedCash");
  // Gem XP bars (level text and fill elements)
  document.querySelectorAll(".gem-bar").forEach(barElem => {
    const type = barElem.classList[1];
    gemBarElems[type] = {
      levelText: barElem.querySelector(".gem-level"),
      fill: barElem.querySelector(".xp-fill")
    };
  });
  // Shop items elements (level and cost spans)
  document.querySelectorAll(".shop-item").forEach(item => {
    const type = item.dataset.type;
    shopItemsElems[type] = {
      levelSpan: item.querySelector(".up-level"),
      costSpan: item.querySelector(".up-cost")
    };
     // Modified shop button handling
  document.getElementById("shopBtn").addEventListener("click", openShop);
  document.getElementById("shopBtn").style.display = "none"; // Hide by default

  // Add shop button to game over modal
  const gameOverContent = document.getElementById("gameOverContent");
  const shopButton = document.createElement("button");
  shopButton.textContent = "Shop";
  shopButton.addEventListener("click", () => {
    gameOverModal.classList.add("hidden");
    openShop();
  });
  gameOverContent.insertBefore(shopButton, document.getElementById("restartBtn"));
});
    item.addEventListener("click", () => purchaseUpgrade(type));
  });
  // Button event listeners
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
  // Set up touch event handlers for mobile drag-to-swap
  const boardDiv = document.getElementById("gameBoard");
  boardDiv.addEventListener("touchstart", handleTouchStart, { passive: false });
  boardDiv.addEventListener("touchmove", handleTouchMove, { passive: false });
  boardDiv.addEventListener("touchend", handleTouchEnd);
});
