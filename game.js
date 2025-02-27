// Match 3 Game Script
(() => {
  const gemTypes = ["ruby", "sapphire", "emerald", "topaz", "diamond"];
  const ROWS = 9, COLS = 9;
  let board = [];               // 2D array of gem type indices
  let gemElements = [];         // 2D array of corresponding gem DOM elements
  let gemData = [];             // Level data for each gem type (level, xp, xpNext)
  let score = 0;
  let timeLeft = 600;           // 10 minutes in seconds
  let timerInterval = null;
  let isBusy = false;           // Lock input during animations/cascades
  let gameOverFlag = false;
  let gameOverPending = false;
  let currentDragGem = null;
  let dragStartX, dragStartY, dragStartRow, dragStartCol;
  let swapTriggered = false;
  
  // DOM element references
  const boardElem      = document.getElementById('board');
  const scoreElem      = document.getElementById('score');
  const timerElem      = document.getElementById('timer');
  const finalScoreElem = document.getElementById('final-score');
  const highScoresList = document.getElementById('high-scores-list');
  const restartBtn     = document.getElementById('restart');
  const multValueElem  = document.getElementById('mult-value');
  
  // Initialize gem leveling data
  function initGemData() {
    gemData = gemTypes.map(() => ({ level: 0, xp: 0, xpNext: 3 }));
    updateLevelUI();
    updateMultiplierUI();
  }
  
  // Update all gem level displays (level text and XP bar)
  function updateLevelUI() {
    gemTypes.forEach((type, idx) => {
      document.getElementById('lvl-' + type).innerText = gemData[idx].level;
      const fillElem = document.getElementById('xp-' + type);
      const gd = gemData[idx];
      const percent = (gd.xp / gd.xpNext) * 100;
      fillElem.style.width = percent + '%';
    });
  }
  
  // Update combined level "Multiplier" bar
  function updateMultiplierUI() {
    const totalLevel = gemData.reduce((sum, gd) => sum + gd.level, 0);
    const multFill = document.getElementById('mult-fill');
    if (totalLevel >= 20) {
      multFill.style.width = '100%';
      multValueElem.innerText = '20/20 (x2!)';
      document.querySelector('.multiplier-track').classList.add('active');
    } else {
      multFill.style.width = (totalLevel / 20 * 100) + '%';
      multValueElem.innerText = totalLevel + '/20';
    }
  }
  
  // Initialize or restart the game
  function initGame() {
    // Reset state
    score = 0;
    timeLeft = 600;
    isBusy = false;
    gameOverFlag = false;
    gameOverPending = false;
    if (timerInterval) clearInterval(timerInterval);
    scoreElem.innerText = '0';
    timerElem.innerText = '10:00';
    initGemData();
    // Clear board DOM and data
    boardElem.innerHTML = '';
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
    gemElements = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    // Draw grid lines (vertical and horizontal)
    for (let i = 1; i < COLS; i++) {
      const vLine = document.createElement('div');
      vLine.className = 'line vert-line';
      vLine.style.left = (100 / 9 * i) + '%';
      boardElem.appendChild(vLine);
    }
    for (let j = 1; j < ROWS; j++) {
      const hLine = document.createElement('div');
      hLine.className = 'line horiz-line';
      hLine.style.top = (100 / 9 * j) + '%';
      boardElem.appendChild(hLine);
    }
    // Populate board with random gems
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const typeIndex = Math.floor(Math.random() * gemTypes.length);
        board[r][c] = typeIndex;
        createGem(r, c, typeIndex);
      }
    }
    // Clear any initial matches from random fill
    resolveMatches();
    // Start 10-minute timer
    timerInterval = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timeLeft = 0;
        timerElem.innerText = '00:00';
        // Trigger game over (after any ongoing cascade finishes)
        if (isBusy) {
          gameOverPending = true;
        } else {
          gameOver();
        }
      } else {
        timeLeft--;
        updateTimerDisplay();
      }
    }, 1000);
  }
  
  // Create a gem element at (row, col) of given type
  function createGem(row, col, typeIndex) {
    const gemDiv = document.createElement('div');
    gemDiv.className = 'gem ' + gemTypes[typeIndex];
    gemDiv.dataset.row = row;
    gemDiv.dataset.col = col;
    // Position within the board grid
    gemDiv.style.top = (row * (100 / 9)) + '%';
    gemDiv.style.left = (col * (100 / 9)) + '%';
    // Inner shape element for the gem
    const shapeDiv = document.createElement('div');
    shapeDiv.className = 'shape';
    gemDiv.appendChild(shapeDiv);
    // Attach pointer (touch/mouse) event handlers for drag
    gemDiv.addEventListener('pointerdown', onPointerDown);
    gemDiv.addEventListener('pointermove', onPointerMove);
    gemDiv.addEventListener('pointerup', onPointerUp);
    gemDiv.addEventListener('pointercancel', onPointerUp);
    // Add to DOM and track element reference
    boardElem.appendChild(gemDiv);
    gemElements[row][col] = gemDiv;
  }
  
  // Pointer down: start drag
  function onPointerDown(e) {
    if (isBusy || gameOverFlag || timeLeft <= 0) return;
    currentDragGem = e.currentTarget;
    dragStartRow = parseInt(currentDragGem.dataset.row);
    dragStartCol = parseInt(currentDragGem.dataset.col);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    swapTriggered = false;
    currentDragGem.setPointerCapture(e.pointerId);
  }
  
  // Pointer move: determine swipe direction if beyond threshold
  function onPointerMove(e) {
    if (!currentDragGem || swapTriggered || isBusy || gameOverFlag) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = boardElem.clientWidth / (COLS * 2);  // half a cell width
    let targetRow = dragStartRow, targetCol = dragStartCol;
    if (absDx > absDy && absDx > threshold) {
      // Horizontal drag
      swapTriggered = true;
      targetCol = dragStartCol + (dx > 0 ? 1 : -1);
    } else if (absDy > absDx && absDy > threshold) {
      // Vertical drag
      swapTriggered = true;
      targetRow = dragStartRow + (dy > 0 ? 1 : -1);
    }
    if (swapTriggered) {
      currentDragGem.releasePointerCapture(e.pointerId);
      attemptSwap(dragStartRow, dragStartCol, targetRow, targetCol);
    }
  }
  
  // Pointer up: clear drag state
  function onPointerUp(e) {
    currentDragGem = null;
  }
  
  // Attempt to swap gem at (r1,c1) with gem at (r2,c2)
  function attemptSwap(r1, c1, r2, c2) {
    // Ensure target is adjacent and in bounds
    if (r2 < 0 || r2 >= ROWS || c2 < 0 || c2 >= COLS) {
      swapTriggered = false;
      return;
    }
    isBusy = true;  // lock input during swap animation
    const gemA = gemElements[r1][c1];
    const gemB = gemElements[r2][c2];
    // Swap types in board data
    const tempType = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = tempType;
    // Check for matches resulting from this swap
    const clusters = getMatches();
    if (clusters.length > 0) {
      // **Valid swap** – animate gems to each other's positions
      gemElements[r1][c1] = gemB;
      gemElements[r2][c2] = gemA;
      // Update dataset positions
      gemA.dataset.row = r2; gemA.dataset.col = c2;
      gemB.dataset.row = r1; gemB.dataset.col = c1;
      // Animate swap
      gemA.style.top = (r2 * (100 / 9)) + '%';
      gemA.style.left = (c2 * (100 / 9)) + '%';
      gemB.style.top = (r1 * (100 / 9)) + '%';
      gemB.style.left = (c1 * (100 / 9)) + '%';
      // After swap animation, resolve matches (remove and cascade)
      setTimeout(() => {
        resolveMatches();
      }, 300);
    } else {
      // **Invalid swap** – swap back
      // Revert board data
      board[r1][c1] = board[r2][c2];
      board[r2][c2] = tempType;
      // Animate out and back
      gemA.style.top = (r2 * (100 / 9)) + '%';
      gemA.style.left = (c2 * (100 / 9)) + '%';
      gemB.style.top = (r1 * (100 / 9)) + '%';
      gemB.style.left = (c1 * (100 / 9)) + '%';
      // Animate swap back to original
      setTimeout(() => {
        gemA.style.top = (r1 * (100 / 9)) + '%';
        gemA.style.left = (c1 * (100 / 9)) + '%';
        gemB.style.top = (r2 * (100 / 9)) + '%';
        gemB.style.left = (c2 * (100 / 9)) + '%';
      }, 200);
      // After swap-back animation, unlock input
      setTimeout(() => {
        isBusy = false;
      }, 400);
    }
  }
  
  // Find all clusters of 3+ matching gems (returns array of {type, cells})
  function getMatches() {
    const clusters = [];
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const directions = [[1,0], [-1,0], [0,1], [0,-1]];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] === -1 || visited[r][c]) continue;
        const type = board[r][c];
        // BFS/DFS to find all connected gems of this type
        const stack = [{ r, c }];
        const clusterCells = [{ r, c }];
        visited[r][c] = true;
        while (stack.length) {
          const { r: cr, c: cc } = stack.pop();
          for (const [dr, dc] of directions) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc] && board[nr][nc] === type) {
              visited[nr][nc] = true;
              stack.push({ r: nr, c: nc });
              clusterCells.push({ r: nr, c: nc });
            }
          }
        }
        if (clusterCells.length >= 3) {
          clusters.push({ type: board[r][c], cells: clusterCells });
        }
      }
    }
    return clusters;
  }
  
  // Remove matches and cascade gems downward (recursive until no matches)
  function resolveMatches() {
    const clusters = getMatches();
    if (clusters.length === 0) {
      // No more matches – end cascade
      isBusy = false;
      if (gameOverPending && !gameOverFlag) {
        gameOver();
      }
      return;
    }
    // Calculate score and XP for all clusters
    let totalPoints = 0;
    const xpGain = Array(gemTypes.length).fill(0);
    // Check if global multiplier is active (combined level >=20)
    const totalLevelBefore = gemData.reduce((sum, gd) => sum + gd.level, 0);
    const globalMult = (totalLevelBefore >= 20 ? 2 : 1);
    for (const cluster of clusters) {
      const size = cluster.cells.length;
      // Determine cluster score multiplier by size
      let matchMult = 1;
      if (size === 4) matchMult = 1.5;
      if (size >= 5) matchMult = 2;
      // Sum base points for all gems in cluster
      let clusterPoints = 0;
      for (const { r, c } of cluster.cells) {
        const type = cluster.type;
        clusterPoints += (1 + gemData[type].level);   // base 1 + level bonus
        xpGain[type] += 1;
      }
      clusterPoints = Math.round(clusterPoints * matchMult * globalMult);
      totalPoints += clusterPoints;
    }
    // Apply global multiplier to XP gain as well (if active)
    if (globalMult === 2) {
      for (let t = 0; t < xpGain.length; t++) {
        xpGain[t] *= 2;
      }
    }
    // Update score
    score += totalPoints;
    scoreElem.innerText = score;
    // Add XP and handle leveling for each gem type
    for (let t = 0; t < gemTypes.length; t++) {
      if (xpGain[t] > 0) {
        gemData[t].xp += xpGain[t];
        while (gemData[t].xp >= gemData[t].xpNext) {
          // Level up this gem type
          gemData[t].xp -= gemData[t].xpNext;
          gemData[t].level += 1;
          // Next level XP requirement increases (e.g., 3, 6, 9, ...)
          gemData[t].xpNext = 3 * (gemData[t].level + 1);
        }
      }
    }
    updateLevelUI();
    updateMultiplierUI();
    // Mark matched gems for removal
    clusters.forEach(cluster => {
      cluster.cells.forEach(({ r, c }) => {
        const gemElem = gemElements[r][c];
        if (gemElem) gemElem.classList.add('remove');
        board[r][c] = -1;            // mark board cell empty
        gemElements[r][c] = null;
      });
    });
    // After short fade-out animation, remove matched gems and drop remaining
    setTimeout(() => {
      document.querySelectorAll('.gem.remove').forEach(elem => boardElem.removeChild(elem));
      dropGems();
    }, 250);
  }
  
  // Let gems fall into empty spaces and spawn new gems from top
  function dropGems() {
    const newGems = [];  // to collect newly spawned gem elements for animation
    for (let col = 0; col < COLS; col++) {
      // Move existing gems down in this column
      let writeRow = ROWS - 1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] !== -1) {
          // Move gem at (row) to (writeRow)
          if (row !== writeRow) {
            board[writeRow][col] = board[row][col];
            board[row][col] = -1;
            const movingGem = gemElements[row][col];
            gemElements[writeRow][col] = movingGem;
            gemElements[row][col] = null;
            if (movingGem) {
              movingGem.dataset.row = writeRow;
              movingGem.style.top = (writeRow * (100 / 9)) + '%';  // animate drop
            }
          }
          writeRow--;
        }
      }
      // writeRow is now index of last empty cell above moved gems (or -1 if none empty)
      for (let newRow = writeRow; newRow >= 0; newRow--) {
        // Create a new gem for each remaining empty cell in column
        const newType = Math.floor(Math.random() * gemTypes.length);
        board[newRow][col] = newType;
        const gemDiv = document.createElement('div');
        gemDiv.className = 'gem ' + gemTypes[newType];
        gemDiv.dataset.row = newRow;
        gemDiv.dataset.col = col;
        // Start gem above the board (stacked so they fall in)
        const emptyCount = writeRow + 1;  // number of empties to fill in this col
        gemDiv.style.top = ((newRow - emptyCount) * (100 / 9)) + '%';
        gemDiv.style.left = (col * (100 / 9)) + '%';
        const shapeDiv = document.createElement('div');
        shapeDiv.className = 'shape';
        gemDiv.appendChild(shapeDiv);
        // Pointer events for new gem
        gemDiv.addEventListener('pointerdown', onPointerDown);
        gemDiv.addEventListener('pointermove', onPointerMove);
        gemDiv.addEventListener('pointerup', onPointerUp);
        gemDiv.addEventListener('pointercancel', onPointerUp);
        boardElem.appendChild(gemDiv);
        gemElements[newRow][col] = gemDiv;
        newGems.push(gemDiv);
      }
    }
    // Animate newly spawned gems falling to their positions
    requestAnimationFrame(() => {
      newGems.forEach(gem => {
        const r = parseInt(gem.dataset.row);
        gem.style.top = (r * (100 / 9)) + '%';
      });
    });
    // After gems have fallen, check for new matches (cascade)
    setTimeout(() => {
      resolveMatches();
    }, 400);
  }
  
  // Update the timer display (mm:ss format)
  function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElem.innerText = 
      String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  }
  
  // End the game and show final score + leaderboard
  function gameOver() {
    gameOverFlag = true;
    isBusy = false;
    finalScoreElem.innerText = score;
    // Update high scores in localStorage
    let scores = JSON.parse(localStorage.getItem('match3HighScores') || '[]');
    scores.push(score);
    scores.sort((a, b) => b - a);
    if (scores.length > 5) scores = scores.slice(0, 5);
    localStorage.setItem('match3HighScores', JSON.stringify(scores));
    // Populate high scores list
    highScoresList.innerHTML = '';
    scores.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      highScoresList.appendChild(li);
    });
    // Show game-over overlay
    document.getElementById('game-over').style.display = 'flex';
  }
  
  // Restart button click handler
  restartBtn.addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    initGame();
  });
  
  // Start the game on page load
  initGame();
})();
