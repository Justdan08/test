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
    return (Math.abs(row1 - row2) === 1 && col1 === col2 || 
           Math.abs(col1 - col2) === 1 && row1 === row2;
}

function swapGems(cell1, cell2) {
    isAnimating = true;
    const gem1 = cell1.firstChild;
    const gem2 = cell2.firstChild;
    const rect1 = cell1.getBoundingClientRect();
    const rect2 = cell2.getBoundingClientRect();

    gem1.style.transition = gem2.style.transition = 'transform 0.3s ease';
    gem1.style.transform = `translate(${rect2.left - rect1.left}px, ${rect2.top - rect1.top}px)`;
    gem2.style.transform = `translate(${rect1.left - rect2.left}px, ${rect1.top - rect2.top}px)`;
    
    setTimeout(() => {
        cell1.appendChild(gem2);
        cell2.appendChild(gem1);
        gem1.style.transform = gem2.style.transform = '';
        
        if(!checkMatches()) {
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
    let matches = new Set();
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

function processMatches(matches) {
    matches.forEach(({row, col}) => {
        const gem = board[row][col];
        gem.classList.add('matched');
        setTimeout(() => gem.remove(), 500);
    });
    
    setTimeout(() => {
        const gemType = board[matches[0].row][matches[0].col].dataset.type;
        const totalScore = matches.length * gemLevels[gemType] * multiplier;
        score += totalScore;
        document.getElementById('score-display').textContent = `Score: ${score}`;
        updateXP(gemType, matches.length);
        makeGemsFall();
        checkAutoMatches();
    }, 500);
}

function makeGemsFall() {
    for(let col = 0; col < BOARD_SIZE; col++) {
        let emptySpaces = 0;
        for(let row = BOARD_SIZE - 1; row >= 0; row--) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if(!cell.firstChild) {
                emptySpaces++;
            } else if(emptySpaces > 0) {
                const gem = cell.firstChild;
                const newRow = row + emptySpaces;
                const newCell = document.querySelector(`[data-row="${newRow}"][data-col="${col}"]`);
                gem.style.transform = `translateY(${emptySpaces * CELL_SIZE}px)`;
                setTimeout(() => newCell.appendChild(gem), 300);
            }
        }
        fillEmptySpaces(col, emptySpaces);
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
            document.getElementById('multiplier-progress').style.width = `${(totalLevels % 20) * 5}%`;
        }
    }
    document.querySelector(`#${gemType}-xp .xp-fill`).style.width = 
        `${(gemXP[gemType] / (BASE_XP * gemLevels[gemType])) * 100}%`;
}

function startGame() {
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
    
    GEM_TYPES.forEach(type => {
        const fill = document.createElement('div');
        fill.className = 'xp-fill';
        fill.style.background = getComputedStyle(document.querySelector(`.${type}`)).backgroundColor;
        document.querySelector(`#${type}-xp`).appendChild(fill);
    });
    
    createBoard();
    gameInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = 
            `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:` +
            `${(timeLeft % 60).toString().padStart(2, '0')}`;
        if(timeLeft <= 0) {
            clearInterval(gameInterval);
            document.getElementById('final-score').textContent = score;
            document.getElementById('money-earned').textContent = Math.floor(score * 0.02);
            document.getElementById('game-over-modal').style.display = 'block';
        }
    }, 1000);
}

window.addEventListener('DOMContentLoaded', startGame);
