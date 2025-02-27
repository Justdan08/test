// Match 3 Game Script
(() => {
  const gemTypes = ["ruby", "sapphire", "emerald", "topaz", "diamond"];
  const ROWS = 9, COLS = 9;
  let board = [];
  let gemElements = [];
  let gemData = [];
  let score = 0;
  let timeLeft = 600;
  let timerInterval = null;
  let isBusy = false;
  let gameOverFlag = false;
  let gameOverPending = false;
  let currentDragGem = null;
  let dragStartX, dragStartY, dragStartRow, dragStartCol;
  let swapTriggered = false;

  const boardElem = document.getElementById('board');
  const scoreElem = document.getElementById('score');
  const timerElem = document.getElementById('timer');
  const finalScoreElem = document.getElementById('final-score');
  const highScoresList = document.getElementById('high-scores-list');
  const restartBtn = document.getElementById('restart');
  const multValueElem = document.getElementById('mult-value');
  const multFill = document.getElementById('mult-fill');

  function initGemData() {
    gemData = gemTypes.map(() => ({ level: 0, xp: 0, xpNext: 3 }));
    updateLevelUI();
    updateMultiplierUI();
  }

  function updateLevelUI() {
    gemTypes.forEach((type, idx) => {
      document.getElementById('lvl-' + type).innerText = gemData[idx].level;
      const fillElem = document.getElementById('xp-' + type);
      const gd = gemData[idx];
      fillElem.style.width = (gd.xp / gd.xpNext) * 100 + '%';
    });
  }

  function updateMultiplierUI() {
    const totalLevel = gemData.reduce((sum, gd) => sum + gd.level, 0);
    let multFactor = Math.floor(totalLevel / 20) + 1;
    multFill.style.width = (totalLevel / 20 * 100) + '%';
    multValueElem.innerText = `${totalLevel}/20 (x${multFactor})`;
    document.querySelector('.multiplier-track').classList.toggle('active', multFactor > 1);
  }

  function initGame() {
    score = 0;
    timeLeft = 600;
    isBusy = false;
    gameOverFlag = false;
    gameOverPending = false;
    if (timerInterval) clearInterval(timerInterval);
    scoreElem.innerText = '0';
    timerElem.innerText = '10:00';
    initGemData();
    boardElem.innerHTML = '';
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
    gemElements = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        let typeIndex;
        do {
          typeIndex = Math.floor(Math.random() * gemTypes.length);
          board[r][c] = typeIndex;
        } while (hasImmediateMatch(r, c));
        createGem(r, c, typeIndex);
      }
    }
    
    setTimeout(() => resolveMatches(), 500);
    
    timerInterval = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerElem.innerText = '00:00';
        if (isBusy) gameOverPending = true;
        else gameOver();
      } else {
        timeLeft--;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function hasImmediateMatch(row, col) {
    const type = board[row][col];
    return (
      (row >= 2 && board[row - 1][col] === type && board[row - 2][col] === type) ||
      (col >= 2 && board[row][col - 1] === type && board[row][col - 2] === type)
    );
  }

  function createGem(row, col, typeIndex) {
    const gemDiv = document.createElement('div');
    gemDiv.className = 'gem ' + gemTypes[typeIndex];
    gemDiv.dataset.row = row;
    gemDiv.dataset.col = col;
    gemDiv.style.top = (row * (100 / 9)) + '%';
    gemDiv.style.left = (col * (100 / 9)) + '%';
    const shapeDiv = document.createElement('div');
    shapeDiv.className = 'shape';
    gemDiv.appendChild(shapeDiv);
    gemDiv.addEventListener('pointerdown', onPointerDown);
    gemDiv.addEventListener('pointermove', onPointerMove);
    gemDiv.addEventListener('pointerup', onPointerUp);
    boardElem.appendChild(gemDiv);
    gemElements[row][col] = gemDiv;
  }

  function dropGems() {
    const newGems = [];
    for (let col = 0; col < COLS; col++) {
      let writeRow = ROWS - 1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] !== -1) {
          if (row !== writeRow) {
            board[writeRow][col] = board[row][col];
            gemElements[writeRow][col] = gemElements[row][col];
            gemElements[row][col] = null;
            gemElements[writeRow][col].dataset.row = writeRow;
            gemElements[writeRow][col].style.top = (writeRow * (100 / 9)) + '%';
          }
          writeRow--;
        }
      }
      for (let newRow = writeRow; newRow >= 0; newRow--) {
        const newType = Math.floor(Math.random() * gemTypes.length);
        board[newRow][col] = newType;
        createGem(newRow, col, newType);
        newGems.push(gemElements[newRow][col]);
      }
    }
    
    requestAnimationFrame(() => {
      newGems.forEach(gem => {
        const r = parseInt(gem.dataset.row);
        gem.style.top = (r * (100 / 9)) + '%';
      });
    });

    setTimeout(() => {
      const autoMatchChance = Math.random();
      if (autoMatchChance < 1/50) {
        console.log("Critical Success! Chain reaction starts.");
        resolveMatches();
      } else if (autoMatchChance < 1/7) {
        console.log("Auto-match triggered from falling gems.");
        resolveMatches();
      } else {
        isBusy = false;
      }
    }, 400);
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElem.innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function gameOver() {
    gameOverFlag = true;
    isBusy = false;
    finalScoreElem.innerText = score;
    let scores = JSON.parse(localStorage.getItem('match3HighScores') || '[]');
    scores.push(score);
    scores.sort((a, b) => b - a);
    if (scores.length > 5) scores = scores.slice(0, 5);
    localStorage.setItem('match3HighScores', JSON.stringify(scores));
    highScoresList.innerHTML = scores.map(s => `<li>${s}</li>`).join('');
    document.getElementById('game-over').style.display = 'flex';
  }

  restartBtn.addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    initGame();
  });

  initGame();
})();
