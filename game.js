// game.js
const GEM_TYPES = ['Ruby', 'Sapphire', 'Emerald', 'Topaz', 'Diamond'];
const BOARD_SIZE = 9;
const BASE_XP = 3;
const CELL_SIZE = 60;

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
    board = [];
    
    for(let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for(let j = 0; j < BOARD_SIZE; j++) {
            const cell = createCell(i, j);
            const gem = createGem();
            cell.appendChild(gem);
            boardElement.appendChild(cell);
            board[i][j] = gem;
        }
    }
    checkAutoMatches();
}

function createCell(row, col) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.addEventListener('mousedown', handleStart);
    cell.addEventListener('touchstart', handleStart);
    return cell;
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
    const touch = e.touches?.[0] || e;
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
    const rect1 = cell1.getBoundingClientRect();
    const rect2 = cell2.getBoundingClientRect();

    animateSwap(gem1, gem2, rect1, rect2, () => {
        cell1.appendChild(gem2);
        cell2.appendChild(gem1);
        
        if(!checkMatches()) {
            setTimeout(() => reverseSwap(gem1, gem2, rect1, rect2, cell1, cell2), 100);
        } else {
            isAnimating = false;
        }
    });
}

function animateSwap(gem1, gem2, startRect, endRect, callback) {
    gem1.style.transition = gem2.style.transition = 'transform 0.3s ease';
    gem1.style.transform = `translate(${endRect.left - startRect.left}px, ${endRect.top - startRect.top}px)`;
    gem2.style.transform = `translate(${startRect.left - endRect.left}px, ${startRect.top - endRect.top}px)`;
    
    setTimeout(() => {
        gem1.style.transform = gem2.style.transform = '';
        callback();
    }, 300);
}

function reverseSwap(gem1, gem2, rect1, rect2, cell1, cell2) {
    gem1.style.transition = gem2.style.transition = 'transform 0.3s ease';
    gem1.style.transform = `translate(${rect1.left - rect2.left}px, ${rect1.top - rect2.top}px)`;
    gem2.style.transform = `translate(${rect2.left - rect1.left}px, ${rect2.top - rect1.top}px)`;
    
    setTimeout(() => {
        cell1.appendChild(gem1);
        cell2.appendChild(gem2);
        gem1.style.transform = gem2.style.transform = '';
        isAnimating = false;
    }, 300);
}

function checkMatches() {
    let matches = new Set();
    
    // Check all possible matches
    checkHorizontalMatches(matches);
    checkVerticalMatches(matches);
    checkLShapedMatches(matches);
    
    if(matches.size > 0) {
        processMatches(Array.from(matches).map(m => ({
            row: parseInt(m.split(',')[0]),
            col: parseInt(m.split(',')[1])
        }));
        return true;
    }
    return false;
}

function checkHorizontalMatches(matches) {
    for(let row = 0; row < BOARD_SIZE; row++) {
        for(let col = 0; col < BOARD_SIZE - 2; ) {
            const currentType = board[row][col].dataset.type;
            let matchLength = 1;
            
            while(col + matchLength < BOARD_SIZE && 
                  board[row][col + matchLength].dataset.type === currentType) {
                matchLength++;
            }
            
            if(matchLength >= 3) {
                for(let i = 0; i < matchLength; i++) {
                    matches.add(`${row},${col + i}`);
                }
            }
            col += matchLength;
        }
    }
}

function checkVerticalMatches(matches) {
    for(let col = 0; col < BOARD_SIZE; col++) {
        for(let row = 0; row < BOARD_SIZE - 2; ) {
            const currentType = board[row][col].dataset.type;
            let matchLength = 1;
            
            while(row + matchLength < BOARD_SIZE && 
                  board[row + matchLength][col].dataset.type === currentType) {
                matchLength++;
            }
            
            if(matchLength >= 3) {
                for(let i = 0; i < matchLength; i++) {
                    matches.add(`${row + i},${col}`);
                }
            }
            row += matchLength;
        }
    }
}

function checkLShapedMatches(matches) {
    for(let row = 0; row < BOARD_SIZE - 1; row++) {
        for(let col = 0; col < BOARD_SIZE - 1; col++) {
            const baseType = board[row][col].dataset.type;
            
            // Check horizontal then vertical
            if(col < BOARD_SIZE - 3 && row < BOARD_SIZE - 1 &&
               board[row][col+1].dataset.type === baseType &&
               board[row][col+2].dataset.type === baseType &&
               board[row][col+3].dataset.type === baseType &&
               board[row+1][col+3].dataset.type === baseType) {
                for(let i = 0; i < 4; i++) matches.add(`${row},${col+i}`);
                matches.add(`${row+1},${col+3}`);
            }
            
            // Check vertical then horizontal
            if(row < BOARD_SIZE - 3 && col < BOARD_SIZE - 1 &&
               board[row+1][col].dataset.type === baseType &&
               board[row+2][col].dataset.type === baseType &&
               board[row+3][col].dataset.type === baseType &&
               board[row+3][col+1].dataset.type === baseType) {
                for(let i = 0; i < 4; i++) matches.add(`${row+i},${col}`);
                matches.add(`${row+3},${col+1}`);
            }
        }
    }
}

function processMatches(matches) {
    animateMatchedGems(matches);
    
    setTimeout(() => {
        removeMatchedGems(matches);
        updateScoreAndXP(matches);
        makeGemsFall();
        checkAutoMatches();
    }, 500);
}

function animateMatchedGems(matches) {
    matches.forEach(({row, col}) => {
        const gem = board[row][col];
        gem.classList.add('matched');
        setTimeout(() => gem.remove(), 500);
    });
}

function removeMatchedGems(matches) {
    matches.forEach(({row, col}) => {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if(cell.firstChild) cell.firstChild.remove();
    });
}

function updateScoreAndXP(matches) {
    const gemType = board[matches[0].row][matches[0].col].dataset.type;
    const basePoints = matches.length;
    const matchMultiplier = getMatchMultiplier(matches.length);
    const levelBonus = gemLevels[gemType] - 1;
    const totalScore = (basePoints + levelBonus) * matchMultiplier * multiplier;
    
    score += totalScore;
    document.getElementById('score-display').textContent = `Score: ${score}`;
    updateXP(gemType, matches.length);
}

function getMatchMultiplier(matchLength) {
    return matchLength >= 5 ? 2 : matchLength >= 4 ? 1.5 : 1;
}

function makeGemsFall() {
    for(let col = 0; col < BOARD_SIZE; col++) {
        let emptySpaces = 0;
        
        for(let row = BOARD_SIZE - 1; row >= 0; row--) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if(cell.children.length === 0) {
                emptySpaces++;
            } else if(emptySpaces > 0) {
                const gem = cell.firstChild;
                const newRow = row + emptySpaces;
                const newCell = document.querySelector(`[data-row="${newRow}"][data-col="${col}"]`);
                
                gem.style.transition = 'transform 0.3s ease';
                gem.style.transform = `translateY(${emptySpaces * CELL_SIZE}px)`;
                
                setTimeout(() => {
                    newCell.appendChild(gem);
                    gem.style.transform = '';
                }, 300);
            }
        }
        
        fillEmptySpaces(col, emptySpaces);
    }
}

function fillEmptySpaces(col, emptySpaces) {
    for(let i = 0; i < emptySpaces; i++) {
        const cell = document.querySelector(`[data-row="${i}"][data-col="${col}"]`);
        const gem = createGem();
        gem.style.transform = `translateY(-${(emptySpaces - i) * CELL_SIZE}px)`;
        cell.appendChild(gem);
        
        setTimeout(() => {
            gem.style.transition = 'transform 0.3s ease';
            gem.style.transform = '';
        }, 10);
    }
}

function updateXP(gemType, amount) {
    gemXP[gemType] += amount * multiplier;
    const requiredXP = BASE_XP * gemLevels[gemType];
    
    if(gemXP[gemType] >= requiredXP) {
        gemXP[gemType] -= requiredXP;
        gemLevels[gemType]++;
        totalLevels++;
        updateMultiplier();
    }
    
    updateXpBar(gemType);
}

function updateXpBar(gemType) {
    const xpBar = document.querySelector(`#${gemType}-xp .xp-fill`);
    const requiredXP = BASE_XP * gemLevels[gemType];
    xpBar.style.width = `${(gemXP[gemType] / requiredXP) * 100}%`;
}

function updateMultiplier() {
    const multiplierLevel = Math.floor(totalLevels / 20);
    multiplier = 1 + multiplierLevel;
    document.getElementById('multiplier-progress').style.width = 
        `${(totalLevels % 20) * 5}%`;
}

function checkAutoMatches() {
    setTimeout(() => {
        if(checkMatches()) {
            checkAutoMatches();
        }
    }, 500);
}

function startGame() {
    resetGameState();
    initializeXpBars();
    createBoard();
    startTimer();
}

function resetGameState() {
    score = 0;
    timeLeft = 180;
    gemLevels = { Ruby: 1, Sapphire: 1, Emerald: 1, Topaz: 1, Diamond: 1 };
    gemXP = { Ruby: 0, Sapphire: 0, Emerald: 0, Topaz: 0, Diamond: 0 };
    totalLevels = 0;
    multiplier = 1;
    document.getElementById('board').innerHTML = '';
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('score-display').textContent = 'Score: 0';
    document.getElementById('multiplier-progress').style.width = '0%';
}

function initializeXpBars() {
    const xpBars = document.getElementById('xp-bars');
    xpBars.innerHTML = GEM_TYPES.map(type => `
        <div class="xp-bar" id="${type}-xp">
            <div class="xp-fill" style="background: ${getComputedStyle(document.querySelector(`.${type}`)).backgroundColor}"></div>
        </div>
    `).join('');
}

function startTimer() {
    clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = 
            `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:` +
            `${(timeLeft % 60).toString().padStart(2, '0')}`;
        
        if(timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(gameInterval);
    const money = Math.floor(score * 0.02);
    document.getElementById('final-score').textContent = score;
    document.getElementById('money-earned').textContent = money;
    document.getElementById('game-over-modal').style.display = 'block';
}

// Initialize game when window loads
window.addEventListener('DOMContentLoaded', startGame);
