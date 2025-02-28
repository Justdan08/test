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
            if (currentType === board[row][col+1].className.split(' ')[1]
