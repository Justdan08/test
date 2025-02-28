
// Complete JavaScript implementation
const GEM_TYPES = ['Ruby', 'Sapphire', 'Emerald', 'Topaz', 'Diamond'];
const BOARD_SIZE = 9;
const BASE_XP = 3;
let board = [];
let selectedGem = null;
let score = 0;
let timeLeft = 180;
let gameInterval;
let isAnimating = false;
let gemLevels = { Ruby: 1, Sapphire: 1, Emerald: 1, Topaz: 1, Diamond: 1 };
let gemXP = { Ruby: 0, Sapphire: 0, Emerald: 0, Topaz: 0, Diamond: 0 };
let totalLevels = 0;
let multiplier = 1;

function createBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    for(let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for(let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            const gem = createGem();
            cell.appendChild(gem);
            cell.addEventListener('mousedown', handleStart);
            cell.addEventListener('touchstart', handleStart);
            
            boardElement.appendChild(cell);
            board[i][j] = gem;
        }
    }
    checkAutoMatches();
}

function createGem() {
    const gem = document.createElement('div');
    const type = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
    gem.className = `gem ${type}`;
    gem.dataset.type = type;
    return gem;
}

function handleStart(e) {
    if(isAnimating) return;
    e.preventDefault();
    selectedGem = e.target.closest('.cell');
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
}

function handleMove(e) {
    if(!selectedGem || isAnimating) return;
    
    const touch = e.touches ? e.touches[0] : e;
    const targetCell = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.cell');
    
    if(targetCell && isNeighbor(selectedGem, targetCell)) {
        handleEnd();
        swapGems(selectedGem, targetCell);
    }
}

function handleEnd() {
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', handleEnd);
}

function isNeighbor(cell1, cell2) {
    const row1 = parseInt(cell1.dataset.row);
    const col1 = parseInt(cell1.dataset.col);
    const row2 = parseInt(cell2.dataset.row);
    const col2 = parseInt(cell2.dataset.col);
    
    return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
           (Math.abs(col1 - col2) === 1 && row1 === row2);
}

function swapGems(cell1, cell2) {
    isAnimating = true;
    const gem1 = cell1.firstChild;
    const gem2 = cell2.firstChild;
    
    // Swap positions with animation
    gem1.style.transition = gem2.style.transition = 'transform 0.3s ease';
    const rect1 = cell1.getBoundingClientRect();
    const rect2 = cell2.getBoundingClientRect();
    
    gem1.style.transform = `translate(${rect2.left - rect1.left}px, ${rect2.top - rect1.top}px)`;
    gem2.style.transform = `translate(${rect1.left - rect2.left}px, ${rect1.top - rect2.top}px)`;
    
    setTimeout(() => {
        cell1.appendChild(gem2);
        cell2.appendChild(gem1);
        gem1.style.transform = gem2.style.transform = '';
        
        const hadMatches = checkMatches();
        if(!hadMatches) {
            // Swap back if no matches
            setTimeout(() => {
                gem1.style.transition = gem2.style.transition = 'transform 0.3s ease';
                gem1.style.transform = `translate(${rect1.left - rect2.left}px, ${rect1.top - rect2.top}px)`;
                gem2.style.transform = `translate(${rect2.left - rect1.left}px, ${rect2.top - rect1.top}px)`;
                
                setTimeout(() => {
                    cell1.appendChild(gem1);
                    cell2.appendChild(gem2);
                    gem1.style.transform = gem2.style.transform = '';
                    isAnimating = false;
                }, 300);
            }, 100);
        } else {
            isAnimating = false;
        }
    }, 300);
}

function checkMatches() {
    let matches = [];
    
    // Check horizontal matches
    for(let row = 0; row < BOARD_SIZE; row++) {
        for(let col = 0; col < BOARD_SIZE - 2; col++) {
            const gem = board[row][col];
            if(gem.dataset.type === board[row][col+1].dataset.type && 
               gem.dataset.type === board[row][col+2].dataset.type) {
                let match = [{row, col}];
                while(col+3 < BOARD_SIZE && gem.dataset.type === board[row][col+3].dataset.type) {
                    match.push({row, col: col+3});
                    col++;
                }
                matches.push(...match);
            }
        }
    }
    
    // Check vertical matches
    for(let col = 0; col < BOARD_SIZE; col++) {
        for(let row = 0; row < BOARD_SIZE - 2; row++) {
            const gem = board[row][col];
            if(gem.dataset.type === board[row+1][col].dataset.type && 
               gem.dataset.type === board[row+2][col].dataset.type) {
                let match = [{row, col}];
                while(row+3 < BOARD_SIZE && gem.dataset.type === board[row+3][col].dataset.type) {
                    match.push({row: row+3, col});
                    row++;
                }
                matches.push(...match);
            }
        }
    }
    
    // Check L-shaped matches (5 gems)
    for(let row = 0; row < BOARD_SIZE - 1; row++) {
        for(let col = 0; col < BOARD_SIZE - 1; col++) {
            const gem = board[row][col];
            if(
                (checkDirection(row, col, 0, 1, 4) && checkDirection(row, col, 1, 0, 1)) || 
                (checkDirection(row, col, 1, 0, 4) && checkDirection(row, col, 0, 1, 1))
            ) {
                matches.push(...Array(5).fill().map((_, i) => ({
                    row: row + (i < 4 ? 0 : 1),
                    col: col + (i < 4 ? i : 0)
                })));
            }
        }
    }
    
    // Remove duplicates
    matches = [...new Set(matches.map(m => `${m.row},${m.col}`))].map(m => {
        const [row, col] = m.split(',');
        return {row: parseInt(row), col: parseInt(col)};
    });
    
    if(matches.length > 0) {
        processMatches(matches);
        return true;
    }
    return false;
}

function checkDirection(startRow, startCol, rowDir, colDir, length) {
    const type = board[startRow][startCol].dataset.type;
    for(let i = 1; i <= length; i++) {
        const row = startRow + rowDir * i;
        const col = startCol + colDir * i;
        if(row >= BOARD_SIZE || col >= BOARD_SIZE || board[row][col].dataset.type !== type) {
            return false;
        }
    }
    return true;
}

function processMatches(matches) {
    // Calculate score
    const matchCount = matches.length;
    let multiplier = 1;
    if(matchCount >= 5) multiplier = 2;
    else if(matchCount >= 4) multiplier = 1.5;
    
    // Animate matched gems
    matches.forEach(({row, col}) => {
        const gem = board[row][col];
        gem.classList.add('matched');
        setTimeout(() => gem.remove(), 500);
    });
    
    // Update score and XP after animation
    setTimeout(() => {
        const baseScore = matches.length;
        const gemType = board[matches[0].row][matches[0].col].dataset.type;
        const levelBonus = gemLevels[gemType] - 1;
        const totalScore = (baseScore + levelBonus) * multiplier * multiplier;
        
        score += totalScore;
        document.getElementById('score-display').textContent = `Score: ${score}`;
        updateXP(gemType, matches.length);
        
        // Make gems fall
        makeGemsFall();
        checkAutoMatches();
    }, 500);
}

function makeGemsFall() {
    for(let col = 0; col < BOARD_SIZE; col++) {
        let emptyRow = BOARD_SIZE - 1;
        for(let row = BOARD_SIZE - 1; row >= 0; row--) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if(cell.children.length === 0) {
                for(let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
                    const aboveCell = document.querySelector(
                        `[data-row="${aboveRow}"][data-col="${col}"]`);
                    if(aboveCell.children.length > 0) {
                        const gem = aboveCell.firstChild;
                        gem.style.transition = 'transform 0.3s ease';
                        gem.style.transform = `translateY(${(row - aboveRow) * 62}px)`;
                        setTimeout(() => {
                            cell.appendChild(gem);
                            gem.style.transform = '';
                        }, 300);
                        break;
                    }
                }
            }
        }
        
        // Fill empty spots at top
        for(let row = 0; row < BOARD_SIZE; row++) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if(cell.children.length === 0) {
                const gem = createGem();
                gem.style.transform = `translateY(-${(row + 1) * 62}px)`;
                cell.appendChild(gem);
                setTimeout(() => {
                    gem.style.transition = 'transform 0.3s ease';
                    gem.style.transform = '';
                }, 10);
            }
        }
    }
}

function updateXP(gemType, amount) {
    gemXP[gemType] += amount * multiplier;
    const requiredXP = BASE_XP * gemLevels[gemType];
    
    if(gemXP[gemType] >= requiredXP) {
        gemXP[gemType] -= requiredXP;
        gemLevels[gemType]++;
        totalLevels++;
        
        if(totalLevels % 20 === 0) {
            multiplier = Math.floor(totalLevels / 20) + 1;
            document.getElementById('multiplier-progress').style.width = 
                `${(totalLevels % 20) * 5}%`;
        }
    }
    
    // Update XP bars
    const xpBar = document.querySelector(`#${gemType}-xp .xp-fill`);
    xpBar.style.width = `${(gemXP[gemType] / (BASE_XP * gemLevels[gemType])) * 100}%`;
}

function checkAutoMatches() {
    setTimeout(() => {
        if(checkMatches()) {
            checkAutoMatches();
        }
    }, 500);
}

function startGame() {
    // Reset game state
    score = 0;
    timeLeft = 180;
    gemLevels = { Ruby: 1, Sapphire: 1, Emerald: 1, Topaz: 1, Diamond: 1 };
    gemXP = { Ruby: 0, Sapphire: 0, Emerald: 0, Topaz: 0, Diamond: 0 };
    totalLevels = 0;
    multiplier = 1;
    
    // Clear existing board
    document.getElementById('board').innerHTML = '';
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('score-display').textContent = 'Score: 0';
    
    // Create XP bars
    const xpBars = document.getElementById('xp-bars');
    xpBars.innerHTML = '';
    GEM_TYPES.forEach(type => {
        const container = document.createElement('div');
        container.className = 'xp-bar';
        container.id = `${type}-xp`;
        const fill = document.createElement('div');
        fill.className = 'xp-fill';
        fill.style.background = getComputedStyle(
            document.querySelector(`.${type}`)).backgroundColor;
        container.appendChild(fill);
        xpBars.appendChild(container);
    });
    
    // Start game
    createBoard();
    
    // Start timer
    clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = 
            `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:` +
            `${(timeLeft % 60).toString().padStart(2, '0')}`;
        
        if(timeLeft <= 0) {
            clearInterval(gameInterval);
            const money = Math.floor(score * 0.02);
            document.getElementById('final-score').textContent = score;
            document.getElementById('money-earned').textContent = money;
            document.getElementById('game-over-modal').style.display = 'block';
        }
    }, 1000);
}

// Start the game when loaded
window.onload = startGame;
