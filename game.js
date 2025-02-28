// Match 3 Game Script

// Game configuration
const rows = 8;
const cols = 8;
const gemTypes = ["ruby", "sapphire", "emerald", "amber", "amethyst", "diamond"];
const BASE_POINT = 10;
const LEVEL_UP_XP = 100; // XP needed for each gem level-up (constant per level)
let MULTI_THRESHOLD = gemTypes.length; // total gem level-ups required to increase global multiplier by 1

// Game state variables
let board = [];            // 2D array of gem types (string identifiers)
let cellElements = [];     // 2D array of DOM elements for each board cell
let score = 0;
let multiplier = 1;
let multiProgress = 0;     // progress (count of level-ups) toward next multiplier increase
let cash = 0;
let selectedCell = null;   // currently selected cell {row, col} or null
// Gem mid-game stats: per gem type XP and level (resets each game)
let gemStats = {};         // e.g. gemStats["ruby"] = { level: 0, xp: 0 }
let upgradeLevels = {};    // permanent upgrade level for each gem type (persists via localStorage)
let achievements = {};     // achievement unlock status (persisted via localStorage)

// DOM element references
let scoreElem, cashElem, multiElem, multiFillElem;
let gemBarElems = {};      // references for each gem type's XP bar elements (level text and fill)
let shopModal, shopItemsElems = {};

// Reset gemStats and update UI bars (for a new game)
function resetGemStats() {
  gemStats = {};
  for (let type of gemTypes) {
    gemStats[type] = { level: 0, xp: 0 };
    // Reset each gem's XP bar UI
    const bar = gemBarElems[type];
    bar.levelText.textContent = 1;       // display level (base level 1)
    bar.fill.style.width = "0%";        // empty XP bar
  }
}

// Generate a new board with random gems, avoiding initial 3-in-a-row matches
function generateBoard() {
  const newBoard = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Choose a random gem type that doesn't form an immediate match
      let available = gemTypes.slice();
      // Check left two gems for a horizontal run
      if (j >= 2 && newBoard[i][j-1] === newBoard[i][j-2]) {
        const avoidType = newBoard[i][j-1];
        available = available.filter(type => type !== avoidType);
      }
      // Check above two gems for a vertical run
      if (i >= 2 && newBoard[i-1][j] === newBoard[i-2][j]) {
        const avoidType = newBoard[i-1][j];
        available = available.filter(type => type !== avoidType);
      }
      // Randomly pick from remaining available types
      const randIndex = Math.floor(Math.random() * available.length);
      newBoard[i][j] = available[randIndex];
    }
  }
  return newBoard;
}

// Find all matches of 3+ identical gems in a row or column. Returns a list of positions to remove.
function findMatches() {
  const toRemove = Array.from({ length: rows }, () => Array(cols).fill(false));
  // Horizontal matches
  for (let i = 0; i < rows; i++) {
    let runLength = 1;
    for (let j = 1; j < cols; j++) {
      if (board[i][j] && board[i][j] === board[i][j-1]) {
        runLength++;
      } else {
        if (runLength >= 3) {
          // Mark this run for removal
          for (let k = 1; k <= runLength; k++) {
            toRemove[i][j-k] = true;
          }
          // Achievements: match of 4+ in a row
          if (runLength >= 4) {
            if (!achievements.match4 && runLength >= 4) {
              achievements.match4 = true;
              localStorage.setItem("achievements", JSON.stringify(achievements));
              alert("Achievement Unlocked: Matched 4 in a row!");
            }
            if (!achievements.match5 && runLength >= 5) {
              achievements.match5 = true;
              localStorage.setItem("achievements", JSON.stringify(achievements));
              alert("Achievement Unlocked: Matched 5 in a row!");
            }
          }
        }
        runLength = 1;
      }
    }
    // Check end of row
    if (runLength >= 3) {
      for (let k = 0; k < runLength; k++) {
        toRemove[i][cols-1-k] = true;
      }
      if (runLength >= 4) {
        if (!achievements.match4 && runLength >= 4) {
          achievements.match4 = true;
          localStorage.setItem("achievements", JSON.stringify(achievements));
          alert("Achievement Unlocked: Matched 4 in a row!");
        }
        if (!achievements.match5 && runLength >= 5) {
          achievements.match5 = true;
          localStorage.setItem("achievements", JSON.stringify(achievements));
          alert("Achievement Unlocked: Matched 5 in a row!");
        }
      }
    }
  }
  // Vertical matches
  for (let j = 0; j < cols; j++) {
    let runLength = 1;
    for (let i = 1; i < rows; i++) {
      if (board[i][j] && board[i][j] === board[i-1][j]) {
        runLength++;
      } else {
        if (runLength >= 3) {
          for (let k = 1; k <= runLength; k++) {
            toRemove[i-k][j] = true;
          }
          if (runLength >= 4) {
            if (!achievements.match4 && runLength >= 4) {
              achievements.match4 = true;
              localStorage.setItem("achievements", JSON.stringify(achievements));
              alert("Achievement Unlocked: Matched 4 in a column!");
            }
            if (!achievements.match5 && runLength >= 5) {
              achievements.match5 = true;
              localStorage.setItem("achievements", JSON.stringify(achievements));
              alert("Achievement Unlocked: Matched 5 in a column!");
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
        if (!achievements.match4 && runLength >= 4) {
          achievements.match4 = true;
          localStorage.setItem("achievements", JSON.stringify(achievements));
          alert("Achievement Unlocked: Matched 4 in a column!");
        }
        if (!achievements.match5 && runLength >= 5) {
          achievements.match5 = true;
          localStorage.setItem("achievements", JSON.stringify(achievements));
          alert("Achievement Unlocked: Matched 5 in a column!");
        }
      }
    }
  }
  // Compile list of positions to remove
  const removals = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (toRemove[i][j]) {
        removals.push({ r: i, c: j });
      }
    }
  }
  return removals;
}

// Apply gravity to drop gems down into empty spaces after removals
function dropGems() {
  for (let j = 0; j < cols; j++) {
    let writeIndex = rows - 1;
    for (let i = rows - 1; i >= 0; i--) {
      if (board[i][j] !== null) {
        board[writeIndex][j] = board[i][j];
        writeIndex--;
      }
    }
    // Set any remaining cells above to null (will be filled later)
    for (let i = writeIndex; i >= 0; i--) {
      board[i][j] = null;
    }
  }
}

// Fill empty cells (null) with new random gems (avoiding immediate matches on placement)
function fillEmptySpaces() {
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows && board[i][j] === null; i++) {
      let available = gemTypes.slice();
      // Avoid creating vertical match with two gems below (since we're filling top-down after gravity)
      if (i <= rows - 3 && board[i+1][j] === board[i+2][j]) {
        const avoidType = board[i+1][j];
        available = available.filter(type => type !== avoidType);
      }
      // Avoid creating horizontal match with two left neighbors
      if (j >= 2 && board[i][j-1] === board[i][j-2]) {
        const avoidType = board[i][j-1];
        available = available.filter(type => type !== avoidType);
      }
      const randIndex = Math.floor(Math.random() * available.length);
      board[i][j] = available[randIndex];
    }
  }
}

// Check if any valid moves remain (any adjacent swap leads to a match)
function hasMoves() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (j < cols - 1) {
        // Swap right neighbor
        [board[i][j], board[i][j+1]] = [board[i][j+1], board[i][j]];
        if (findMatches().length > 0) {
          [board[i][j], board[i][j+1]] = [board[i][j+1], board[i][j]];
          return true;
        }
        // Swap back
        [board[i][j], board[i][j+1]] = [board[i][j+1], board[i][j]];
      }
      if (i < rows - 1) {
        // Swap down neighbor
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

// Shuffle the board when no moves remain (randomly rearrange all gems, avoiding immediate matches)
function shuffleBoard() {
  // Gather all gems in a list
  const gems = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      gems.push(board[i][j]);
    }
  }
  // Fisher-Yates shuffle
  for (let k = gems.length - 1; k > 0; k--) {
    const rand = Math.floor(Math.random() * (k + 1));
    [gems[k], gems[rand]] = [gems[rand], gems[k]];
  }
  // Place shuffled gems back into board and ensure no immediate matches
  for (let attempt = 0; attempt < 50; attempt++) {
    let idx = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        board[i][j] = gems[idx++];
      }
    }
    if (findMatches().length === 0) break;
    // If a match is found, shuffle again and retry
    for (let k = gems.length - 1; k > 0; k--) {
      const rand = Math.floor(Math.random() * (k + 1));
      [gems[k], gems[rand]] = [gems[rand], gems[k]];
    }
  }
  renderBoard();
}

// Update the DOM to reflect the current board state
function renderBoard() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = cellElements[i][j];
      cell.className = "gem " + board[i][j];
    }
  }
}

// Attempt to swap the gem at (r1,c1) with the gem at (r2,c2). Returns true if a valid match resulted.
function attemptSwap(r1, c1, r2, c2) {
  // Swap positions in the board data
  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
  const matches = findMatches();
  if (matches.length === 0) {
    // Invalid swap (no match) – swap back
    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
    return false;
  }
  // Valid swap – remove matches and cascade
  while (true) {
    const toRemove = findMatches();
    if (toRemove.length === 0) break;
    // Mark all matched gems for removal and count removals by type
    const removedByType = {};
    for (const pos of toRemove) {
      const gemType = board[pos.r][pos.c];
      if (gemType) {
        removedByType[gemType] = (removedByType[gemType] || 0) + 1;
      }
      board[pos.r][pos.c] = null;
    }
    // Process score, cash, and XP for each removed gem type
    const currentMultiplier = multiplier;
    for (const [type, count] of Object.entries(removedByType)) {
      // Points: (base points + 5*level) * count * current multiplier
      const gemLevel = gemStats[type].level;
      const gemPointValue = BASE_POINT + 5 * gemLevel;
      score += gemPointValue * count * currentMultiplier;
      // Cash: +1 per gem removed (not affected by multiplier)
      cash += count;
      // XP: 10 XP per gem * count * (1 + upgradeLevel)
      const xpGain = 10 * count * (1 + (upgradeLevels[type] || 0));
      gemStats[type].xp += xpGain;
      // Level-up gems as needed
      while (gemStats[type].xp >= LEVEL_UP_XP) {
        gemStats[type].xp -= LEVEL_UP_XP;
        gemStats[type].level += 1;
        // Update gem level display
        const bar = gemBarElems[type];
        bar.levelText.textContent = gemStats[type].level + 1; // display level (internal level+1)
        bar.fill.style.width = "0%"; // reset bar (will update with remainder below)
        // Increment global multiplier progress and update multiplier if threshold reached
        multiProgress += 1;
        if (multiProgress >= MULTI_THRESHOLD) {
          multiProgress -= MULTI_THRESHOLD;
          multiplier += 1;
          multiElem.textContent = multiplier;
          if (!achievements.multi5 && multiplier >= 5) {
            achievements.multi5 = true;
            localStorage.setItem("achievements", JSON.stringify(achievements));
            alert("Achievement Unlocked: Multiplier x5 reached!");
          }
        }
        // Update multiplier progress bar fill
        const percent = Math.floor((multiProgress / MULTI_THRESHOLD) * 100);
        multiFillElem.style.width = percent + "%";
      }
      // Update this gem type's XP bar fill (remaining progress toward next level)
      const percent = Math.floor((gemStats[type].xp / LEVEL_UP_XP) * 100);
      gemBarElems[type].fill.style.width = percent + "%";
    }
    // Update score and cash display
    scoreElem.textContent = score;
    cashElem.textContent = cash;
    // Save cash after each scoring cascade (persistent currency)
    localStorage.setItem("cash", cash);
    // Drop gems down and fill new ones, then continue checking for new matches
    dropGems();
    fillEmptySpaces();
  }
  // Refresh the board UI after cascade
  renderBoard();
  // Check score-based achievement
  if (!achievements.score1000 && score >= 1000) {
    achievements.score1000 = true;
    localStorage.setItem("achievements", JSON.stringify(achievements));
    alert("Achievement Unlocked: Scored 1000 points!");
  }
  // If no moves remain, shuffle the board
  if (!hasMoves()) {
    shuffleBoard();
  }
  return true;
}

// Handle selection (click/tap) on a gem cell at (row, col)
function handleCellSelect(row, col) {
  if (selectedCell === null) {
    // No gem currently selected – select this gem
    selectedCell = { row, col };
    cellElements[row][col].classList.add("selected");
  } else {
    const prev = selectedCell;
    // Deselect if the same cell was tapped again
    if (prev.row === row && prev.col === col) {
      cellElements[prev.row][prev.col].classList.remove("selected");
      selectedCell = null;
      return;
    }
    const adjacent = Math.abs(prev.row - row) + Math.abs(prev.col - col) === 1;
    if (adjacent) {
      // Adjacent gem selected – attempt swap
      cellElements[prev.row][prev.col].classList.remove("selected");
      selectedCell = null;
      attemptSwap(prev.row, prev.col, row, col);
    } else {
      // Not adjacent – change the selection to this gem
      cellElements[prev.row][prev.col].classList.remove("selected");
      selectedCell = { row, col };
      cellElements[row][col].classList.add("selected");
    }
  }
}

// Initialize the game on page load
function initGame() {
  // Get references to UI elements
  scoreElem = document.getElementById("score");
  cashElem = document.getElementById("cash");
  multiElem = document.getElementById("multiplier");
  multiFillElem = document.getElementById("multiplierFill");
  shopModal = document.getElementById("shopModal");
  // Gem XP bar elements
  document.querySelectorAll(".gem-bar").forEach(barElem => {
    const type = barElem.classList[1];  // second class is gem type
    gemBarElems[type] = {
      levelText: barElem.querySelector(".gem-level"),
      fill: barElem.querySelector(".xp-fill")
    };
  });
  // Shop items and event handlers
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
  // Load persistent data (cash, upgrades, achievements) from localStorage
  const savedCash = localStorage.getItem("cash");
  cash = savedCash ? parseInt(savedCash, 10) : 0;
  cashElem.textContent = cash;
  for (let type of gemTypes) {
    const savedUp = localStorage.getItem("upgrade_" + type);
    upgradeLevels[type] = savedUp ? parseInt(savedUp, 10) : 0;
  }
  const savedAch = localStorage.getItem("achievements");
  achievements = savedAch ? JSON.parse(savedAch) : { score1000: false, match4: false, match5: false, multi5: false };
  // Generate initial board and ensure at least one move is available
  board = generateBoard();
  if (!hasMoves()) {
    let attempts = 0;
    while (!hasMoves() && attempts < 50) {
      board = generateBoard();
      attempts++;
    }
  }
  // Create board cells and attach event listeners
  const boardDiv = document.getElementById("gameBoard");
  boardDiv.innerHTML = "";
  cellElements = Array.from({ length: rows }, () => Array(cols));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div");
      cell.className = "gem " + board[i][j];
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.addEventListener("click", () => handleCellSelect(i, j));
      cell.addEventListener("touchstart", e => {
        e.preventDefault();
        handleCellSelect(i, j);
      }, { passive: false });
      cellElements[i][j] = cell;
      boardDiv.appendChild(cell);
    }
  }
  // Initialize score, multiplier, and gem stats UI
  score = 0;
  scoreElem.textContent = score;
  multiplier = 1;
  multiElem.textContent = multiplier;
  multiProgress = 0;
  multiFillElem.style.width = "0%";
  resetGemStats();
}

// Start a new game (preserve persistent data but reset board and temporary stats)
function startNewGame() {
  selectedCell = null;
  // Remove any selection highlight
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      cellElements[i][j].classList.remove("selected");
    }
  }
  // Generate a new board and ensure a valid move exists
  board = generateBoard();
  if (!hasMoves()) {
    let attempts = 0;
    while (!hasMoves() && attempts < 50) {
      board = generateBoard();
      attempts++;
    }
  }
  renderBoard();
  // Reset score and multiplier
  score = 0;
  scoreElem.textContent = score;
  multiplier = 1;
  multiElem.textContent = multiplier;
  multiProgress = 0;
  multiFillElem.style.width = "0%";
  // Reset gem XP/levels
  resetGemStats();
}

// Open the shop modal and update upgrade info
function openShop() {
  for (let type of gemTypes) {
    shopItemsElems[type].levelSpan.textContent = upgradeLevels[type];
    const cost = 150 * Math.pow(2, upgradeLevels[type]);
    shopItemsElems[type].costSpan.textContent = cost;
  }
  shopModal.classList.remove("hidden");
}

// Purchase an upgrade for a gem type if affordable
function purchaseUpgrade(type) {
  const level = upgradeLevels[type];
  const cost = 150 * Math.pow(2, level);
  if (cash < cost) {
    alert("Not enough cash to purchase this upgrade!");
    return;
  }
  // Deduct cash and increase upgrade level
  cash -= cost;
  upgradeLevels[type] += 1;
  // Update display values
  cashElem.textContent = cash;
  shopItemsElems[type].levelSpan.textContent = upgradeLevels[type];
  shopItemsElems[type].costSpan.textContent = 150 * Math.pow(2, upgradeLevels[type]);
  // Save updated data
  localStorage.setItem("cash", cash);
  localStorage.setItem("upgrade_" + type, upgradeLevels[type]);
}

// Start the game on initial page load
initGame();
