"use strict";
const BOARD_SIZE = 8;
const baseScore = 10;
const baseXP = 10;
const baseCash = 1;
const upgradeFactor = 0.2; // each upgrade level adds +20% effect
let scoreMultiplier = 1, xpMultiplier = 1, cashMultiplier = 1;
let score = 0, level = 1, xp = 0, totalCash = 0;
let timeRemaining = 300;
let isProcessing = false, timeUp = false;
let gameInterval = null;
let board = []; // 2D array of {type, element, row, col}

const boardElem = document.getElementById('board');
const scoreElem = document.getElementById('score');
const cashElem = document.getElementById('cash');
const timerElem = document.getElementById('timer');
const levelElem = document.getElementById('level');
const xpProgressElem = document.querySelector('.xp-progress');
const gameoverModal = document.getElementById('gameover-modal');
const finalScoreElem = document.getElementById('final-score');
const finalLevelElem = document.getElementById('final-level');
const cashEarnedElem = document.getElementById('cash-earned');
const achievementsEarnedElem = document.getElementById('achievements-earned');
const shopModal = document.getElementById('shop-modal');
const upgradeListElem = document.getElementById('upgrade-list');
const achievementsModal = document.getElementById('achievements-modal');
const achievementsListElem = document.getElementById('achievements-list');

// Upgrades data (permanent upgrades)
let upgrades = {
  score: { level: 0, cost: 100, name: "Score Multiplier" },
  cash:  { level: 0, cost: 100, name: "Cash Bonus" },
  xp:    { level: 0, cost: 100, name: "XP Booster" }
};

// Achievements data
let achievements = [
  { id: 'firstMatch', name: 'First Steps', description: 'Make your first match', unlocked: false },
  { id: 'match4',    name: 'Four of a Kind', description: 'Match 4 gems in one line', unlocked: false },
  { id: 'match5',    name: 'Five in a Row', description: 'Match 5 gems in one line', unlocked: false },
  { id: 'score1000', name: 'Scored 1,000', description: 'Score at least 1000 in a game', unlocked: false },
  { id: 'score5000', name: 'Scored 5,000', description: 'Score at least 5000 in a game', unlocked: false },
  { id: 'level5',    name: 'Level 5 Achieved', description: 'Reach level 5 in one game', unlocked: false },
  { id: 'combo',     name: 'Combo Move', description: 'Clear multiple matches in one swap', unlocked: false }
];
let newAchvThisGame = [];

// Load persistent data (cash, upgrades, achievements) from localStorage
function loadPersistentData() {
  const savedUpgrades = localStorage.getItem('upgrades');
  if (savedUpgrades) {
    const parsed = JSON.parse(savedUpgrades);
    for (let key in upgrades) {
      if (parsed[key] !== undefined) {
        upgrades[key].level = parsed[key].level || 0;
        upgrades[key].cost = parsed[key].cost || upgrades[key].cost;
      }
    }
  }
  const savedCash = localStorage.getItem('cash');
  totalCash = savedCash ? Number(savedCash) : 0;
  const savedAch = localStorage.getItem('achievements');
  if (savedAch) {
    const parsedAch = JSON.parse(savedAch);
    achievements.forEach(ach => {
      if (parsedAch[ach.id]) ach.unlocked = true;
    });
  }
}

// Save persistent data to localStorage
function savePersistentData() {
  const saveObj = {};
  for (let key in upgrades) {
    saveObj[key] = { level: upgrades[key].level, cost: upgrades[key].cost };
  }
  localStorage.setItem('upgrades', JSON.stringify(saveObj));
  localStorage.setItem('cash', String(totalCash));
  const achObj = {};
  achievements.forEach(ach => achObj[ach.id] = ach.unlocked);
  localStorage.setItem('achievements', JSON.stringify(achObj));
}

// Update multipliers based on upgrade levels
function updateMultipliers() {
  scoreMultiplier = 1 + upgrades.score.level * upgradeFactor;
  xpMultiplier    = 1 + upgrades.xp.level * upgradeFactor;
  cashMultiplier  = 1 + upgrades.cash.level * upgradeFactor;
}

// Create a gem element at (row, col) of a given type (0-5) and add to board
function createGem(type, row, col, initialTopOffset = 0) {
  const gem = document.createElement('div');
  gem.classList.add('gem');
  // Assign shape and symbol based on type
  let shapeClass, symbol;
  switch (type) {
    case 0: shapeClass = 'heart';    symbol = '♥'; break;
    case 1: shapeClass = 'diamond';  symbol = '♦'; break;
    case 2: shapeClass = 'star';     symbol = '★'; break;
    case 3: shapeClass = 'circle';   symbol = '●'; break;
    case 4: shapeClass = 'square';   symbol = '■'; break;
    case 5: shapeClass = 'triangle'; symbol = '▲'; break;
    default: shapeClass = 'circle';  symbol = '●';
  }
  gem.classList.add(shapeClass);
  gem.textContent = symbol;
  const gemSize = boardElem.clientWidth / BOARD_SIZE;
  gem.style.width = gemSize + 'px';
  gem.style.height = gemSize + 'px';
  gem.style.left = (col * gemSize) + 'px';
  gem.style.top = (initialTopOffset !== 0) ? (-initialTopOffset * gemSize) + 'px' : (row * gemSize) + 'px';
  gem.dataset.row = row;
  gem.dataset.col = col;
  // Attach pointer events for drag/swipe on this gem
  gem.addEventListener('pointerdown', onPointerDown);
  gem.addEventListener('pointermove', onPointerMove);
  gem.addEventListener('pointerup', onPointerUp);
  boardElem.appendChild(gem);
  return gem;
}

// Initialize the board with random gems (no initial matches)
function initBoard() {
  board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    board[r] = new Array(BOARD_SIZE).fill(null);
  }
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      let type;
      do {
        type = Math.floor(Math.random() * 6);
      } while (
        (c >= 2 && board[r][c-1] && board[r][c-2] &&
          board[r][c-1].type === type && board[r][c-2].type === type) ||
        (r >= 2 && board[r-1][c] && board[r-2][c] &&
          board[r-1][c].type === type && board[r-2][c].type === type)
      );
      const gemElem = createGem(type, r, c);
      board[r][c] = { type: type, element: gemElem, row: r, col: c };
    }
  }
}

// Find all match-3 (or more) sets on the board, return list of positions to remove
function findMatches() {
  let toRemove = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
  // Check rows
  for (let r = 0; r < BOARD_SIZE; r++) {
    let streakType = null, streakCount = 0;
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] && board[r][c].type === streakType) {
        streakCount++;
      } else {
        if (streakCount >= 3) {
          for (let k = 1; k <= streakCount; k++) toRemove[r][c-k] = true;
        }
        streakType = board[r][c] ? board[r][c].type : null;
        streakCount = board[r][c] ? 1 : 0;
      }
    }
    if (streakCount >= 3) {
      for (let k = 1; k <= streakCount; k++) {
        toRemove[r][BOARD_SIZE - k] = true;
      }
    }
  }
  // Check columns
  for (let c = 0; c < BOARD_SIZE; c++) {
    let streakType = null, streakCount = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (board[r][c] && board[r][c].type === streakType) {
        streakCount++;
      } else {
        if (streakCount >= 3) {
          for (let k = 1; k <= streakCount; k++) toRemove[r-k][c] = true;
        }
        streakType = board[r][c] ? board[r][c].type : null;
        streakCount = board[r][c] ? 1 : 0;
      }
    }
    if (streakCount >= 3) {
      for (let k = 1; k <= streakCount; k++) {
        toRemove[BOARD_SIZE - k][c] = true;
      }
    }
  }
  // Collect all marked cells
  let removeList = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (toRemove[r][c] && board[r][c] !== null) {
        removeList.push({ r, c });
      }
    }
  }
  return removeList;
}

// Remove matched gems with animation and update score, XP, cash
function removeMatches(matches) {
  if (matches.length === 0) return;
  // Unlock achievements for first match, big matches, combos
  if (matches.length > 0) unlockAchievement('firstMatch');
  if (matches.length >= 4) unlockAchievement(matches.length >= 5 ? 'match5' : 'match4');
  if (matches.length > 3) unlockAchievement('combo');
  // Animate gems to remove
  matches.forEach(({ r, c }) => {
    const gemObj = board[r][c];
    if (gemObj) gemObj.element.classList.add('remove');
  });
  // After animation, remove gems and update game state
  setTimeout(() => {
    matches.forEach(({ r, c }) => {
      const gemObj = board[r][c];
      if (gemObj) {
        boardElem.removeChild(gemObj.element);
        board[r][c] = null;
        // Add score, XP, and cash for each gem removed
        score += Math.floor(baseScore * scoreMultiplier);
        xp   += Math.floor(baseXP * xpMultiplier);
        totalCash += baseCash * cashMultiplier;
      }
    });
    // Update UI for score, cash, and XP bar
    scoreElem.textContent = score;
    cashElem.textContent = Math.floor(totalCash);
    handleXPandLevel();
    // Let remaining gems fall into empty spaces
    dropGems();
  }, 300);
}

// Drop gems down to fill empty cells after removal
function dropGems() {
  const gemSize = boardElem.clientWidth / BOARD_SIZE;
  // Store original row for each gem to calculate drop distance
  board.forEach(row => row.forEach(gem => {
    if (gem) gem.oldRow = gem.row;
  }));
  // Collapse each column from bottom
  for (let c = 0; c < BOARD_SIZE; c++) {
    let writeRow = BOARD_SIZE - 1;
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      if (board[r][c] !== null) {
        if (writeRow !== r) { 
          board[writeRow][c] = board[r][c];
          board[writeRow][c].row = writeRow;
          board[r][c] = null;
        }
        writeRow--;
      }
    }
    // Mark any remaining cells at top as empty
    for (let r = writeRow; r >= 0; r--) {
      board[r][c] = null;
    }
  }
  // Animate gems to their new positions
  board.forEach(row => row.forEach(gem => {
    if (gem) {
      const distance = gem.row - gem.oldRow;
      if (distance !== 0) {
        gem.element.style.transitionDuration = (0.1 * Math.abs(distance)) + "s";
      }
      gem.element.style.top = (gem.row * gemSize) + 'px';
      gem.element.dataset.row = gem.row;
      gem.element.dataset.col = gem.col;
    }
  }));
  // Determine longest drop duration
  let maxDistance = 0;
  board.forEach(row => row.forEach(gem => {
    if (gem) {
      const dist = Math.abs(gem.row - (gem.oldRow || gem.row));
      if (dist > maxDistance) maxDistance = dist;
    }
  }));
  const dropDuration = maxDistance * 100; // in ms (0.1s per cell)
  setTimeout(() => {
    // Fill new gems in blanks at top
    fillBoard();
  }, dropDuration + 50);
}

// Fill empty top cells with new random gems (dropping in from above)
function fillBoard() {
  const gemSize = boardElem.clientWidth / BOARD_SIZE;
  for (let c = 0; c < BOARD_SIZE; c++) {
    // Count empty cells at top of this column
    let emptyCount = 0;
    for (let r = 0; r < BOARD_SIZE && board[r][c] === null; r++) {
      emptyCount++;
    }
    // Create new gems for these empty positions
    for (let i = 0; i < emptyCount; i++) {
      const r = i;
      const type = Math.floor(Math.random() * 6);
      const gemElem = createGem(type, r, c, 1); // spawn just above the board
      board[r][c] = { type: type, element: gemElem, row: r, col: c };
      // Animate gem falling into place
      gemElem.style.transition = 'top 0.1s';
      requestAnimationFrame(() => {
        gemElem.style.top = (r * gemSize) + 'px';
      });
    }
  }
  // After new gems have settled, check for new matches (cascade)
  setTimeout(() => {
    const newMatches = findMatches();
    if (newMatches.length > 0) {
      removeMatches(newMatches);
    } else {
      // No more cascades; allow player input again or end game if time is up
      isProcessing = false;
      if (timeUp) endGame();
    }
  }, 150);
}

// Handle XP progress and level-ups during a game
function handleXPandLevel() {
  let levelUpOccurred = false;
  while (xp >= level * 100) {
    xp -= level * 100;
    level++;
    levelUpOccurred = true;
  }
  if (levelUpOccurred && level >= 5) {
    unlockAchievement('level5');
  }
  levelElem.textContent = level;
  const progressPercent = (xp / (level * 100)) * 100;
  xpProgressElem.style.width = Math.min(progressPercent, 100) + '%';
}

// Unlock a specific achievement by id (if not already unlocked)
function unlockAchievement(id) {
  const ach = achievements.find(a => a.id === id);
  if (ach && !ach.unlocked) {
    ach.unlocked = true;
    newAchvThisGame.push(ach.name);
    // Persist achievement unlock
    const savedAch = localStorage.getItem('achievements');
    let achObj = savedAch ? JSON.parse(savedAch) : {};
    achObj[id] = true;
    localStorage.setItem('achievements', JSON.stringify(achObj));
  }
}

// Swap two adjacent gems (in data and visually)
function swapGems(r1, c1, r2, c2) {
  const gem1 = board[r1][c1];
  const gem2 = board[r2][c2];
  if (!gem1 || !gem2) return;
  board[r1][c1] = gem2;
  board[r2][c2] = gem1;
  [gem1.row, gem2.row] = [gem2.row, gem1.row];
  [gem1.col, gem2.col] = [gem2.col, gem1.col];
  const gemSize = boardElem.clientWidth / BOARD_SIZE;
  // Animate their positions swapping
  gem1.element.style.top = (gem1.row * gemSize) + 'px';
  gem1.element.style.left = (gem1.col * gemSize) + 'px';
  gem2.element.style.top = (gem2.row * gemSize) + 'px';
  gem2.element.style.left = (gem2.col * gemSize) + 'px';
  gem1.element.dataset.row = gem1.row;
  gem1.element.dataset.col = gem1.col;
  gem2.element.dataset.row = gem2.row;
  gem2.element.dataset.col = gem2.col;
}

// Attempt to swap gem at (r,c) in a given direction, then check and handle matches
function trySwap(r, c, direction) {
  if (isProcessing) return;
  let dr = 0, dc = 0;
  if (direction === 'left')  dc = -1;
  if (direction === 'right') dc = 1;
  if (direction === 'up')    dr = -1;
  if (direction === 'down')  dr = 1;
  const r2 = r + dr, c2 = c + dc;
  if (r2 < 0 || r2 >= BOARD_SIZE || c2 < 0 || c2 >= BOARD_SIZE) return;
  isProcessing = true;
  swapGems(r, c, r2, c2);
  // After swap animation, check for a match
  setTimeout(() => {
    const matches = findMatches();
    if (matches.length === 0) {
      // No match - swap back
      swapGems(r2, c2, r, c);
      setTimeout(() => { isProcessing = false; }, 300);
    } else {
      // Match found - remove them (cascade will handle setting isProcessing false)
      removeMatches(matches);
    }
  }, 300);
}

// Start a new game round (reset dynamic values and timer)
function startGame() {
  score = 0;
  level = 1;
  xp = 0;
  timeRemaining = 300;
  timeUp = false;
  isProcessing = false;
  newAchvThisGame = [];
  // Reset UI displays
  scoreElem.textContent = score;
  levelElem.textContent = level;
  xpProgressElem.style.width = '0%';
  boardElem.innerHTML = '';
  // Build new board and apply multipliers from upgrades
  initBoard();
  updateMultipliers();
  cashElem.textContent = Math.floor(totalCash);
  // Start countdown timer
  timerElem.textContent = formatTime(timeRemaining);
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(() => {
    timeRemaining--;
    if (timeRemaining < 0) timeRemaining = 0;
    timerElem.textContent = formatTime(timeRemaining);
    if (timeRemaining <= 0) {
      clearInterval(gameInterval);
      timeUp = true;
      if (!isProcessing) {
        endGame();
      }
    }
  }, 1000);
}

// Format seconds as M:SS (e.g., 4:05)
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + (s < 10 ? '0' + s : s);
}

// Handle end-of-game: show Game Over modal and persist data
function endGame() {
  if (gameInterval) clearInterval(gameInterval);
  // Compute cash earned this round
  let startCash = Number(localStorage.getItem('cash')) || 0;
  let cashEarned = totalCash - startCash;
  if (cashEarned < 0) cashEarned = 0;
  // Update persistent cash total
  localStorage.setItem('cash', String(totalCash));
  // Populate Game Over modal info
  finalScoreElem.textContent = `Final Score: ${score}`;
  finalLevelElem.textContent = `Level Reached: ${level}`;
  cashEarnedElem.textContent = `Cash Earned: ${Math.floor(cashEarned)}`;
  achievementsEarnedElem.textContent = newAchvThisGame.length > 0 
    ? `Achievements Unlocked: ${newAchvThisGame.join(', ')}` 
    : `Achievements Unlocked: None`;
  // Show Game Over modal
  gameoverModal.style.display = 'flex';
}

// Pointer event handling for drag/swipe moves
let activePointerId = null;
let dragStartX = 0, dragStartY = 0;
let originRow = 0, originCol = 0;
function onPointerDown(e) {
  if (isProcessing || activePointerId !== null) return;
  activePointerId = e.pointerId;
  e.target.setPointerCapture(e.pointerId);
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  originRow = Number(e.target.dataset.row);
  originCol = Number(e.target.dataset.col);
}
function onPointerMove(e) {
  if (e.pointerId !== activePointerId) return;
  if (isProcessing) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  const gemSize = boardElem.clientWidth / BOARD_SIZE;
  const threshold = gemSize * 0.3;
  let direction = null;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
    direction = dx > 0 ? 'right' : 'left';
  } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > threshold) {
    direction = dy > 0 ? 'down' : 'up';
  }
  if (direction) {
    trySwap(originRow, originCol, direction);
    isProcessing = true;
  }
}
function onPointerUp(e) {
  if (e.pointerId === activePointerId) {
    activePointerId = null;
  }
}

// Modal button event listeners
document.getElementById('open-shop').addEventListener('click', () => {
  gameoverModal.style.display = 'none';
  buildUpgradeList();
  shopModal.style.display = 'flex';
});
document.getElementById('close-shop').addEventListener('click', () => {
  shopModal.style.display = 'none';
  gameoverModal.style.display = 'flex';
  cashElem.textContent = Math.floor(totalCash);
});
document.getElementById('open-achievements').addEventListener('click', () => {
  gameoverModal.style.display = 'none';
  buildAchievementsList();
  achievementsModal.style.display = 'flex';
});
document.getElementById('close-achievements').addEventListener('click', () => {
  achievementsModal.style.display = 'none';
  gameoverModal.style.display = 'flex';
});
document.getElementById('play-again').addEventListener('click', () => {
  gameoverModal.style.display = 'none';
  startGame();
});

// Build the upgrade list in the shop
function buildUpgradeList() {
  upgradeListElem.innerHTML = '';
  for (let key in upgrades) {
    const upg = upgrades[key];
    const li = document.createElement('li');
    li.textContent = `${upg.name} (Level ${upg.level}) - Cost: ${upg.cost} `;
    const btn = document.createElement('button');
    btn.textContent = "Upgrade";
    btn.dataset.key = key;
    if (totalCash < upg.cost) btn.disabled = true;
    li.appendChild(btn);
    upgradeListElem.appendChild(li);
  }
}

// Build the achievements list in the achievements modal
function buildAchievementsList() {
  achievementsListElem.innerHTML = '';
  achievements.forEach(ach => {
    const li = document.createElement('li');
    li.textContent = `${ach.name} - ${ach.description}`;
    li.className = ach.unlocked ? 'unlocked' : 'locked';
    achievementsListElem.appendChild(li);
  });
}

// Handle purchase of an upgrade
upgradeListElem.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON' && e.target.dataset.key) {
    const key = e.target.dataset.key;
    const upg = upgrades[key];
    if (upg && totalCash >= upg.cost) {
      totalCash -= upg.cost;
      upg.level += 1;
      // Increase cost for next level (e.g., 1.5x)
      upg.cost = Math.floor(upg.cost * 1.5);
      // Persist new upgrade level and cash
      savePersistentData();
      // Refresh display
      buildUpgradeList();
      cashElem.textContent = Math.floor(totalCash);
    }
  }
});

// On page load: load data and start the first game automatically
loadPersistentData();
updateMultipliers();
startGame();