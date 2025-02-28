const GEM_TYPES = ['ruby', 'sapphire', 'emerald', 'topaz', 'diamond'];
const BOARD_SIZE = 9;
const BASE_SCORE = 1;
const INITIAL_TIME = 180; // 3 minutes in seconds

let board = [];
let selectedGem = null;
let score = 0;
let timeLeft = INITIAL_TIME;
let timerInterval;
let gemLevels = {};
let totalLevels = 0;
let globalMultiplier = 1;

function initializeGame() {
    // Initialize gem levels
    GEM_TYPES.forEach(type => {
        gemLevels[type] = {
            level: 1,
            xp: 0,
            xpNeeded: 3
        };
    });

    createBoard();
    updateXPDisplay();
    startTimer();
}

function createBoard() {
    const boardElement = document.querySelector('.game-board');
    boardElement.innerHTML = '';
    board = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const gem = createGem(row, col);
            cell.appendChild(gem);
            boardElement.appendChild(cell);
            board[row][col] = gem;
            
            // Add touch events
            gem.addEventListener('touchstart', handleTouchStart);
            gem.addEventListener('touchmove', handleTouchMove);
            gem.addEventListener('touchend', handleTouchEnd);
            gem.addEventListener('mousedown', handleMouseDown);
        }
    }
}

function createGem(row, col) {
    const gem = document.createElement('div');
    gem.className = `gem ${GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)]}`;
    gem.dataset.row = row;
    gem.dataset.col = col;
    return gem;
}

function handleTouchStart(e) {
    selectedGem = e.target;
    e.preventDefault();
}

function handleTouchMove(e) {
    e.preventDefault();
}

function handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    const endElement = document.elementFromPoint(touch.clientX, touch.clientY);
    handleSwap(endElement);
}

function handleMouseDown(e) {
    selectedGem = e.target;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e) {
    e.preventDefault();
}

function handleMouseUp(e) {
    const endElement = e.target;
    handleSwap(endElement);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
}

function handleSwap(endElement) {
    if (!selectedGem || !endElement.classList.contains('gem')) return;

    const startRow = parseInt(selectedGem.dataset.row);
    const startCol = parseInt(selectedGem.dataset.col);
    const endRow = parseInt(endElement.dataset.row);
    const endCol = parseInt(endElement.dataset.col);

    if (isAdjacent(startRow, startCol, endRow, endCol)) {
        swapGems(startRow, startCol, endRow, endCol, true);
    }

    selectedGem = null;
}

function isAdjacent(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function swapGems(r1, c1, r2, c2, checkMatches) {
    // Swap positions in board array
    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
    
    // Animate the swap
    animateSwap(board[r1][c1], r1, c1);
    animateSwap(board[r2][c2], r2, c2);

    if (checkMatches) {
        setTimeout(() => {
            const matches = findAllMatches();
            if (matches.length === 0) {
                // Swap back if no matches
                swapGems(r1, c1, r2, c2, false);
            } else {
                processMatches(matches);
            }
        }, 300);
    }
}

function animateSwap(gem, newRow, newCol) {
    gem.style.transition = 'transform 0.3s';
    gem.style.transform = `translate(${(newCol - gem.dataset.col) * 100}%, ${(newRow - gem.dataset.row) * 100}%)`;
    
    setTimeout(() => {
        gem.style.transition = '';
        gem.style.transform = '';
        gem.dataset.row = newRow;
        gem.dataset.col = newCol;
    }, 300);
}

function findAllMatches() {
    let matches = new Set();

    // Check horizontal and vertical matches
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const currentType = board[row][col].className.split(' ')[1];
            
            // Horizontal check
            if (col <= BOARD_SIZE - 3) {
                if (currentType === board[row][col+1].className.split(' ')[1] &&
                    currentType === board[row][col+2].className.split(' ')[1]) {
                    matches.add(`${row},${col}`);
                    matches.add(`${row},${col+1}`);
                    matches.add(`${row},${col+2}`);
                }
            }

            // Vertical check
            if (row <= BOARD_SIZE - 3) {
                if (currentType === board[row+1][col].className.split(' ')[1] &&
                    currentType === board[row+2][col].className.split(' ')[1]) {
                    matches.add(`${row},${col}`);
                    matches.add(`${row+1},${col}`);
                    matches.add(`${row+2},${col}`);
                }
            }
        }
    }

    // Check L-shaped matches
    for (let row = 0; row < BOARD_SIZE - 1; row++) {
        for (let col = 0; col < BOARD_SIZE - 1; col++) {
            const currentType = board[row][col].className.split(' ')[1];
            if (currentType === board[row][col+1].className.split(' ')[1] &&
                currentType === board[row+1][col].className.split(' ')[1] &&
                currentType === board[row+1][col+1].className.split(' ')[1]) {
                matches.add(`${row},${col}`);
                matches.add(`${row},${col+1}`);
                matches.add(`${row+1},${col}`);
                matches.add(`${row+1},${col+1}`);
            }
        }
    }

    return Array.from(matches).map(m => m.split(',').map(Number));
}

function processMatches(matches) {
    // Calculate score
    const matchGroups = groupMatches(matches);
    matchGroups.forEach(group => {
        const multiplier = getMultiplier(group.length);
        const gemType = board[group[0][0]][group[0][1]].className.split(' ')[1];
        const base = BASE_SCORE + (gemLevels[gemType].level - 1);
        const points = Math.floor(base * multiplier * globalMultiplier);
        
        score += points;
        updateXP(gemType, group.length);
    });

    document.getElementById('score').textContent = score;

    // Remove matched gems
    matches.forEach(([row, col]) => {
        board[row][col].classList.add('matched');
    });

    setTimeout(() => {
        removeMatchedGems();
        dropGems();
        refillBoard();
        checkAutoMatches();
    }, 300);
}

function getMultiplier(matchLength) {
    if (matchLength >= 5) return 2;
    if (matchLength === 4) return 1.5;
    return 1;
}

function groupMatches(matches) {
    // Group adjacent matches
    const groups = [];
    const visited = new Set();
    
    matches.forEach(([row, col]) => {
        if (visited.has(`${row},${col}`)) return;
        
        const group = [];
        const type = board[row][col].className.split(' ')[1];
        const queue = [[row, col]];
        
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            if (visited.has(`${r},${c}`)) continue;
            
            visited.add(`${r},${c}`);
            group.push([r, c]);
            
            // Check neighbors
            [[r-1,c], [r+1,c], [r,c-1], [r,c+1]].forEach(([nr, nc]) => {
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE &&
                    !visited.has(`${nr},${nc}`) && 
                    board[nr][nc].className.split(' ')[1] === type) {
                    queue.push([nr, nc]);
                }
            });
        }
        
        groups.push(group);
    });
    
    return groups;
}

function updateXP(gemType, amount) {
    const gemData = gemLevels[gemType];
    gemData.xp += amount * globalMultiplier;
    
    while (gemData.xp >= gemData.xpNeeded) {
        gemData.xp -= gemData.xpNeeded;
        gemData.level++;
        gemData.xpNeeded += 3;
        totalLevels++;
        
        if (totalLevels % 20 === 0) {
            globalMultiplier *= 2;
            updateMultiplierBar();
        }
    }
    
    updateXPDisplay();
}

function updateXPDisplay() {
    const xpBars = document.querySelector('.xp-bars');
    xpBars.innerHTML = '';
    
    GEM_TYPES.forEach(type => {
        const gemData = gemLevels[type];
        const bar = document.createElement('div');
        bar.className = 'xp-bar';
        bar.innerHTML = `
            <div class="xp-fill" style="width: ${(gemData.xp / gemData.xpNeeded) * 100}%; background: ${getGemColor(type)}">
                <span class="level">${gemData.level}</span>
            </div>
        `;
        xpBars.appendChild(bar);
    });
}

function updateMultiplierBar() {
    const progress = (totalLevels % 20) / 20 * 100;
    document.querySelector('.multiplier-bar').style.width = `${progress}%`;
}

function getGemColor(type) {
    return {
        ruby: '#e74c3c',
        sapphire: '#3498db',
        emerald: '#2ecc71',
        topaz: '#f1c40f',
        diamond: '#9b59b6'
    }[type];
}

function removeMatchedGems() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col].classList.contains('matched')) {
                board[row][col].remove();
                board[row][col] = null;
            }
        }
    }
}

function dropGems() {
    for (let col = 0; col < BOARD_SIZE; col++) {
        let emptyRow = BOARD_SIZE - 1;
        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
            if (board[row][col]) {
                if (row !== emptyRow) {
                    board[emptyRow][col] = board[row][col];
                    board[row][col] = null;
                    animateFall(board[emptyRow][col], emptyRow, col);
                }
                emptyRow--;
            }
        }
    }
}

function animateFall(gem, newRow, newCol) {
    gem.style.transition = 'transform 0.3s';
    gem.style.transform = `translate(0, ${(newRow - gem.dataset.row) * 100}%)`;
    
    setTimeout(() => {
        gem.style.transition = '';
        gem.style.transform = '';
        gem.dataset.row = newRow;
        gem.dataset.col = newCol;
    }, 300);
}

function refillBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (!board[row][col]) {
                const gem = createGem(row, col);
                board[row][col] = gem;
                document.querySelector(`.cell:nth-child(${row * BOARD_SIZE + col + 1})`).appendChild(gem);
            }
        }
    }
}

function checkAutoMatches() {
    setTimeout(() => {
        const matches = findAllMatches();
        if (matches
