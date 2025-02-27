// Match3 Game Script with specified features
(function(){
    const BOARD_SIZE = 9;
    const GEM_TYPES_COUNT = 6; // number of different gem types/colors
    const CELL_SIZE = 40; // px size of each gem cell (assuming square)
    const SWAP_ANIMATION_DURATION = 300; // ms for swap animation
    const FALL_ANIMATION_DURATION = 300; // ms for falling animation
    // Probability parameters
    const AUTO_MATCH_CHANCE = 1/7;   // chance to allow auto-match from falling gems
    const CRITICAL_CHANCE = 1/50;    // chance of critical success causing chain reaction
    // Game state variables
    let board = [];        // 2D array for gem types (null for empty)
    let gemElements = [];  // 2D array for gem DOM elements
    let gemStats = [];     // per gem type: {xp, level}
    let totalGemLevels = 0; 
    let score = 0;
    let multiplier = 1;
    let timeRemaining = 600; // 10 minutes in seconds
    let timerInterval = null;
    let gameActive = false;
    let moving = false; // true when animations/cascades in progress (to lock input)
    // DOM elements
    let boardElement, scoreElement, timerElement, multiplierElement, multiplierBarElement, gameOverElement;
    // Gem type appearance (colors for demo)
    const gemColors = ["#e74c3c", "#3498db", "#f1c40f", "#2ecc71", "#9b59b6", "#e67e22"];
    const gemNames  = ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"];
    // Initialize gemStats
    for(let i=0; i<GEM_TYPES_COUNT; i++){
        gemStats[i] = { xp: 0, level: 1 };
    }
    totalGemLevels = GEM_TYPES_COUNT * 1; // each gem type starts at level 1
    // XP required for next level (progressive: 3,6,9,...)
    function getXpForNextLevel(typeIndex) {
        let currentLevel = gemStats[typeIndex].level;
        return currentLevel * 3;
    }
    // Start game when window loads
    window.addEventListener('load', initGame);
    function initGame() {
        // Get or create necessary DOM elements
        boardElement = document.getElementById('board');
        if(!boardElement) {
            boardElement = document.createElement('div');
            boardElement.id = 'board';
            document.body.appendChild(boardElement);
        }
        // Style board container
        boardElement.style.position = 'relative';
        boardElement.style.width = (CELL_SIZE * BOARD_SIZE) + 'px';
        boardElement.style.height = (CELL_SIZE * BOARD_SIZE) + 'px';
        boardElement.style.border = '2px solid #333';
        boardElement.style.display = 'inline-block';
        boardElement.style.verticalAlign = 'top';
        // Score display
        scoreElement = document.getElementById('score');
        if(!scoreElement) {
            scoreElement = document.createElement('div');
            scoreElement.id = 'score';
            document.body.appendChild(scoreElement);
        }
        // Timer display
        timerElement = document.getElementById('timer');
        if(!timerElement) {
            timerElement = document.createElement('div');
            timerElement.id = 'timer';
            document.body.appendChild(timerElement);
        }
        // Multiplier display
        multiplierElement = document.getElementById('multiplier');
        if(!multiplierElement) {
            multiplierElement = document.createElement('div');
            multiplierElement.id = 'multiplier';
            document.body.appendChild(multiplierElement);
        }
        // Multiplier progress bar inside multiplier display
        multiplierBarElement = document.getElementById('multiplier-bar');
        if(!multiplierBarElement) {
            multiplierBarElement = document.createElement('div');
            multiplierBarElement.id = 'multiplier-bar';
            multiplierBarElement.style.height = '10px';
            multiplierBarElement.style.width = '0%';
            multiplierBarElement.style.backgroundColor = '#2ecc71';
            multiplierBarElement.style.marginTop = '5px';
            multiplierBarElement.style.transition = 'width 0.3s';
            multiplierElement.appendChild(multiplierBarElement);
        }
        // Game over overlay (for final score and restart)
        gameOverElement = document.getElementById('game-over');
        if(!gameOverElement) {
            gameOverElement = document.createElement('div');
            gameOverElement.id = 'game-over';
            document.body.appendChild(gameOverElement);
        }
        gameOverElement.style.display = 'none';
        // Reset game state
        score = 0;
        updateScore(0);
        gemStats.forEach(gs => { gs.xp = 0; gs.level = 1; });
        totalGemLevels = GEM_TYPES_COUNT; // back to base levels
        multiplier = 1;
        updateMultiplierDisplay();
        // Build initial board with no starting matches
        board = [];
        gemElements = [];
        boardElement.innerHTML = '';
        for(let r=0; r<BOARD_SIZE; r++) {
            board[r] = [];
            gemElements[r] = [];
            for(let c=0; c<BOARD_SIZE; c++) {
                let gemType;
                do {
                    gemType = Math.floor(Math.random() * GEM_TYPES_COUNT);
                } while(
                    (c >= 2 && board[r][c-1] === gemType && board[r][c-2] === gemType) ||  // avoid horizontal triple
                    (r >= 2 && board[r-1][c] === gemType && board[r-2][c] === gemType)     // avoid vertical triple
                );
                board[r][c] = gemType;
                // Create gem element
                const gem = document.createElement('div');
                gem.className = 'gem type-' + gemType;
                gem.style.backgroundColor = gemColors[gemType];
                gem.style.position = 'absolute';
                gem.style.width = CELL_SIZE + 'px';
                gem.style.height = CELL_SIZE + 'px';
                gem.style.left = (c * CELL_SIZE) + 'px';
                gem.style.top = (r * CELL_SIZE) + 'px';
                gem.style.transition = 'top 0.3s, left 0.3s';
                gem.dataset.row = r;
                gem.dataset.col = c;
                boardElement.appendChild(gem);
                gemElements[r][c] = gem;
                // Attach input handlers (mouse and touch) for dragging
                addDragHandlers(gem);
            }
        }
        // Begin game
        gameActive = true;
        // Start countdown timer
        timeRemaining = 600;
        updateTimerDisplay();
        if(timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(function(){
            timeRemaining--;
            updateTimerDisplay();
            if(timeRemaining <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                endGame();
            }
        }, 1000);
    }
    function updateScore(addPoints) {
        if(addPoints) score += addPoints;
        if(scoreElement) scoreElement.textContent = "Score: " + score;
    }
    function updateTimerDisplay() {
        if(!timerElement) return;
        let min = Math.floor(timeRemaining / 60);
        let sec = timeRemaining % 60;
        timerElement.textContent = "Time: " + String(min).padStart(2, '0') + ":" + String(sec).padStart(2, '0');
    }
    function updateMultiplierDisplay() {
        if(!multiplierElement) return;
        multiplierElement.textContent = "Multiplier: x" + multiplier;
        if(multiplierBarElement) {
            // progress towards next multiplier threshold (every 20 total levels)
            let baseLevels = (multiplier - 1) * 20;
            let progress = totalGemLevels - baseLevels;
            if(progress < 0) progress = 0;
            if(progress > 20) progress = 20;
            let percent = (progress / 20) * 100;
            multiplierBarElement.style.width = percent + '%';
        }
    }
    // Add mouse/touch events for a gem
    function addDragHandlers(gem) {
        gem.addEventListener('mousedown', onDragStart);
        gem.addEventListener('touchstart', onDragStart, {passive: false});
    }
    let dragStartGem = null;
    let dragStartX = 0, dragStartY = 0;
    function onDragStart(e) {
        if(!gameActive || moving) return;
        e.preventDefault();
        dragStartGem = e.currentTarget;
        dragStartX = (e.touches ? e.touches[0].clientX : e.clientX);
        dragStartY = (e.touches ? e.touches[0].clientY : e.clientY);
        document.addEventListener(e.type === 'mousedown' ? 'mousemove' : 'touchmove', onDragMove);
        document.addEventListener(e.type === 'mousedown' ? 'mouseup'   : 'touchend', onDragEnd);
    }
    function onDragMove(e) {
        if(!dragStartGem) return;
        e.preventDefault();
        let deltaX = (e.touches ? e.touches[0].clientX : e.clientX) - dragStartX;
        let deltaY = (e.touches ? e.touches[0].clientY : e.clientY) - dragStartY;
        const threshold = 20; // minimum drag distance to trigger swap
        let swapped = false;
        if(Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
            // horizontal swipe
            swapped = (deltaX > 0) ? trySwap(dragStartGem, 0, 1) : trySwap(dragStartGem, 0, -1);
        } else if(Math.abs(deltaY) > threshold) {
            // vertical swipe
            swapped = (deltaY > 0) ? trySwap(dragStartGem, 1, 0) : trySwap(dragStartGem, -1, 0);
        }
        if(swapped) {
            // stop tracking movement after a swap is initiated
            document.removeEventListener('mousemove', onDragMove);
            document.removeEventListener('mouseup', onDragEnd);
            document.removeEventListener('touchmove', onDragMove);
            document.removeEventListener('touchend', onDragEnd);
            dragStartGem = null;
        }
    }
    function onDragEnd(e) {
        // Clean up if drag ended without swap
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
        dragStartGem = null;
    }
    // Attempt to swap gem at (r,c) with neighbor (r+dr, c+dc)
    function trySwap(gem, dr, dc) {
        let r = parseInt(gem.dataset.row), c = parseInt(gem.dataset.col);
        let nr = r + dr, nc = c + dc;
        if(nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) return false;
        let targetGem = gemElements[nr][nc];
        if(!targetGem) return false;
        moving = true; // lock input
        // Swap in board data
        let tempType = board[r][c];
        board[r][c] = board[nr][nc];
        board[nr][nc] = tempType;
        // Swap elements in gemElements
        gemElements[r][c] = targetGem;
        gemElements[nr][nc] = gem;
        // Update their attributes and positions (will animate via CSS transition)
        gem.dataset.row = nr; gem.dataset.col = nc;
        targetGem.dataset.row = r; targetGem.dataset.col = c;
        gem.style.left = (nc * CELL_SIZE) + 'px';
        gem.style.top  = (nr * CELL_SIZE) + 'px';
        targetGem.style.left = (c * CELL_SIZE) + 'px';
        targetGem.style.top  = (r * CELL_SIZE) + 'px';
        // After swap animation, check for matches
        setTimeout(function(){
            let matches = findMatches();
            if(matches.length === 0) {
                // No match - swap back
                // Swap back data
                let tempType2 = board[r][c];
                board[r][c] = board[nr][nc];
                board[nr][nc] = tempType2;
                // Swap back elements
                gemElements[r][c] = gem;
                gemElements[nr][nc] = targetGem;
                // Update attributes
                gem.dataset.row = r; gem.dataset.col = c;
                targetGem.dataset.row = nr; targetGem.dataset.col = nc;
                // Animate swap back
                gem.style.left = (c * CELL_SIZE) + 'px';
                gem.style.top  = (r * CELL_SIZE) + 'px';
                targetGem.style.left = (nc * CELL_SIZE) + 'px';
                targetGem.style.top  = (nr * CELL_SIZE) + 'px';
                setTimeout(function(){ moving = false; }, SWAP_ANIMATION_DURATION);
            } else {
                // Valid swap - process matches and cascades
                resolveMatches(matches);
            }
        }, SWAP_ANIMATION_DURATION);
        return true;
    }
    // Find all match clusters (3 or more in a row; includes L/T shapes as one cluster)
    function findMatches() {
        let clusters = [];
        let matched = Array.from({length: BOARD_SIZE}, () => Array(BOARD_SIZE).fill(false));
        // Horizontal
        for(let r=0; r<BOARD_SIZE; r++) {
            let count = 1;
            for(let c=1; c<BOARD_SIZE; c++) {
                if(board[r][c] !== null && board[r][c] === board[r][c-1]) {
                    count++;
                } else {
                    if(count >= 3) {
                        for(let k = c-count; k < c; k++) {
                            matched[r][k] = true;
                        }
                    }
                    count = 1;
                }
            }
            if(count >= 3) {
                for(let k = BOARD_SIZE - count; k < BOARD_SIZE; k++) {
                    matched[r][k] = true;
                }
            }
        }
        // Vertical
        for(let c=0; c<BOARD_SIZE; c++) {
            let count = 1;
            for(let r=1; r<BOARD_SIZE; r++) {
                if(board[r][c] !== null && board[r][c] === board[r-1][c]) {
                    count++;
                } else {
                    if(count >= 3) {
                        for(let k = r-count; k < r; k++) {
                            matched[k][c] = true;
                        }
                    }
                    count = 1;
                }
            }
            if(count >= 3) {
                for(let k = BOARD_SIZE - count; k < BOARD_SIZE; k++) {
                    matched[k][c] = true;
                }
            }
        }
        // Group matched cells into clusters via DFS/BFS
        let visited = Array.from({length: BOARD_SIZE}, () => Array(BOARD_SIZE).fill(false));
        for(let r=0; r<BOARD_SIZE; r++) {
            for(let c=0; c<BOARD_SIZE; c++) {
                if(matched[r][c] && !visited[r][c]) {
                    let type = board[r][c];
                    let clusterCells = [];
                    let stack = [[r, c]];
                    visited[r][c] = true;
                    while(stack.length) {
                        let [cr, cc] = stack.pop();
                        clusterCells.push({r: cr, c: cc});
                        for(let [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                            let nr = cr + dr, nc = cc + dc;
                            if(nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE &&
                               !visited[nr][nc] && matched[nr][nc] && board[nr][nc] === type) {
                                visited[nr][nc] = true;
                                stack.push([nr, nc]);
                            }
                        }
                    }
                    clusters.push({ type: type, cells: clusterCells });
                }
            }
        }
        return clusters;
    }
    // Process matched clusters: update score/XP, remove gems, and handle falling + cascades
    function resolveMatches(clusters) {
        if(clusters.length === 0) {
            moving = false;
            return;
        }
        // Calculate score and XP gains
        let totalPoints = 0;
        let xpGain = {}; // accumulate XP per gem type
        clusters.forEach(cluster => {
            let clusterSize = cluster.cells.length;
            let basePoints = 0;
            cluster.cells.forEach(cell => {
                basePoints += gemStats[cluster.type].level; // each gem's base points = its level
                xpGain[cluster.type] = (xpGain[cluster.type] || 0) + 1;
            });
            // Apply match size bonus
            let clusterPoints = basePoints;
            if(clusterSize === 4) {
                clusterPoints = Math.floor(clusterPoints * 1.5);
            } else if(clusterSize >= 5) {
                clusterPoints = basePoints * 2;
            }
            // Apply global multiplier
            clusterPoints *= multiplier;
            totalPoints += clusterPoints;
        });
        // Remove matched gems from board and DOM
        clusters.forEach(cluster => {
            cluster.cells.forEach(cell => {
                let r = cell.r, c = cell.c;
                board[r][c] = null;
                if(gemElements[r][c]) {
                    boardElement.removeChild(gemElements[r][c]);
                    gemElements[r][c] = null;
                }
            });
        });
        // Update score and gem XP/levels
        updateScore(totalPoints);
        for(let typeStr in xpGain) {
            if(xpGain.hasOwnProperty(typeStr)) {
                let type = parseInt(typeStr);
                gemStats[type].xp += xpGain[type];
                // Level up as needed
                while(gemStats[type].xp >= getXpForNextLevel(type)) {
                    gemStats[type].xp -= getXpForNextLevel(type);
                    gemStats[type].level++;
                    totalGemLevels++;
                    // Update global multiplier if threshold crossed
                    let newMult = Math.floor(totalGemLevels / 20) + 1;
                    if(newMult > multiplier) {
                        multiplier = newMult;
                    }
                }
            }
        }
        updateMultiplierDisplay();
        // Collapse and refill the board after removal
        collapseAndFill();
    }
    // Let gems fall down into empty spaces and fill new gems at top, then check for cascades
    function collapseAndFill() {
        // Drop existing gems down into empties
        for(let c=0; c<BOARD_SIZE; c++) {
            let emptyCount = 0;
            for(let r = BOARD_SIZE - 1; r >= 0; r--) {
                if(board[r][c] === null) {
                    emptyCount++;
                } else if(emptyCount > 0) {
                    // Move gem at [r][c] down by emptyCount
                    board[r + emptyCount][c] = board[r][c];
                    board[r][c] = null;
                    gemElements[r + emptyCount][c] = gemElements[r][c];
                    gemElements[r][c] = null;
                    if(gemElements[r + emptyCount][c]) {
                        gemElements[r + emptyCount][c].dataset.row = r + emptyCount;
                        gemElements[r + emptyCount][c].dataset.col = c;
                        gemElements[r + emptyCount][c].style.top = ((r + emptyCount) * CELL_SIZE) + 'px';
                        gemElements[r + emptyCount][c].style.left = (c * CELL_SIZE) + 'px';
                    }
                }
            }
            // Fill new gems for empties at top of this column
            for(let r = 0; r < emptyCount; r++) {
                let newType;
                do {
                    newType = Math.floor(Math.random() * GEM_TYPES_COUNT);
                } while(
                    (r < BOARD_SIZE-2 && board[r+1][c] === newType && board[r+2][c] === newType) ||     // avoid vertical triple with two below
                    (c >= 2 && board[r][c-1] === newType && board[r][c-2] === newType) ||               // avoid horizontal triple with two to the left
                    (c <= BOARD_SIZE-3 && board[r][c+1] === newType && board[r][c+2] === newType) ||    // avoid horizontal triple with two to the right
                    ((c >= 1 && c <= BOARD_SIZE-2) && board[r][c-1] === newType && board[r][c+1] === newType)  // avoid horizontal triple with one on each side
                );
                board[r][c] = newType;
                const gem = document.createElement('div');
                gem.className = 'gem type-' + newType;
                gem.style.backgroundColor = gemColors[newType];
                gem.style.position = 'absolute';
                gem.style.width = CELL_SIZE + 'px';
                gem.style.height = CELL_SIZE + 'px';
                // Start new gem above the board for drop animation
                gem.style.left = (c * CELL_SIZE) + 'px';
                gem.style.top = (- (emptyCount - r) * CELL_SIZE) + 'px';
                gem.style.transition = 'top 0.3s, left 0.3s';
                gem.dataset.row = r;
                gem.dataset.col = c;
                boardElement.appendChild(gem);
                gemElements[r][c] = gem;
                addDragHandlers(gem);
                // Trigger reflow then set final position to animate drop
                requestAnimationFrame(() => {
                    gem.style.top = (r * CELL_SIZE) + 'px';
                });
            }
        }
        // After gems have fallen, check for new matches (cascades)
        setTimeout(() => {
            let newMatches = findMatches();
            if(newMatches.length > 0) {
                if(Math.random() < AUTO_MATCH_CHANCE) {
                    // Allow cascade to resolve normally
                    resolveMatches(newMatches);
                } else {
                    // Skip auto-cascade: break all matches by changing one gem in each cluster
                    let clusters = newMatches;
                    while(clusters.length > 0) {
                        clusters.forEach(cluster => {
                            if(cluster.cells.length > 0) {
                                let cell = cluster.cells[0];
                                let oldType = board[cell.r][cell.c];
                                let newType;
                                do {
                                    newType = Math.floor(Math.random() * GEM_TYPES_COUNT);
                                } while(newType === oldType);
                                board[cell.r][cell.c] = newType;
                                if(gemElements[cell.r][cell.c]) {
                                    gemElements[cell.r][cell.c].className = 'gem type-' + newType;
                                    gemElements[cell.r][cell.c].style.backgroundColor = gemColors[newType];
                                }
                            }
                        });
                        clusters = findMatches();
                    }
                    moving = false;
                }
            } else {
                // No new auto-matches; cascade ended
                if(Math.random() < CRITICAL_CHANCE) {
                    triggerCriticalChain();
                } else {
                    moving = false;
                }
            }
        }, FALL_ANIMATION_DURATION + 50);
    }
    // Critical success chain reaction: remove all gems of a random type
    function triggerCriticalChain() {
        // Pick a random gem type present on the board
        let typeToClear = Math.floor(Math.random() * GEM_TYPES_COUNT);
        let exists = false;
        for(let r=0; r<BOARD_SIZE; r++) {
            for(let c=0; c<BOARD_SIZE; c++) {
                if(board[r][c] === typeToClear) { exists = true; break; }
            }
            if(exists) break;
        }
        if(!exists) {
            moving = false;
            return;
        }
        // Create cluster of all gems of that type
        let clusterCells = [];
        for(let r=0; r<BOARD_SIZE; r++) {
            for(let c=0; c<BOARD_SIZE; c++) {
                if(board[r][c] === typeToClear) {
                    clusterCells.push({r: r, c: c});
                }
            }
        }
        if(clusterCells.length === 0) {
            moving = false;
            return;
        }
        // Treat it as a match cluster and resolve (this will also cascade further if any)
        resolveMatches([{ type: typeToClear, cells: clusterCells }]);
    }
    // End of game: show final score and high score leaderboard, allow restart
    function endGame() {
        gameActive = false;
        moving = true;
        // Record high score in localStorage
        let highs = JSON.parse(localStorage.getItem("match3HighScores") || "[]");
        highs.push(score);
        highs.sort((a,b) => b - a);
        if(highs.length > 5) highs = highs.slice(0, 5);
        localStorage.setItem("match3HighScores", JSON.stringify(highs));
        // Display Game Over and scores
        let html = `<h2>Game Over!</h2><p>Your Score: ${score}</p><h3>High Scores:</h3><ol>`;
        highs.forEach(s => { html += `<li>${s}</li>`; });
        html += `</ol><button id="restart-btn">Restart</button>`;
        gameOverElement.innerHTML = html;
        gameOverElement.style.display = 'block';
        // Simple styling for overlay
        gameOverElement.style.textAlign = 'center';
        gameOverElement.style.padding = '20px';
        gameOverElement.style.background = 'rgba(0,0,0,0.8)';
        gameOverElement.style.color = '#fff';
        gameOverElement.style.position = 'absolute';
        gameOverElement.style.top = '50%';
        gameOverElement.style.left = '50%';
        gameOverElement.style.transform = 'translate(-50%, -50%)';
        // Restart button handler
        let rb = document.getElementById('restart-btn');
        if(rb) {
            rb.addEventListener('click', function(){
                gameOverElement.style.display = 'none';
                initGame();
            });
        }
    }
})();
