// game.js
document.addEventListener('DOMContentLoaded', () => {
    const GRID_SIZE = 9;
    const GEM_TYPES = ['ruby', 'sapphire', 'emerald', 'topaz', 'diamond'];
    const LEVELS = [3, 6, 9, 12, 15];
    const INITIAL_GEM_VALUE = 1;
    
    let score = 0;
    let timeLeft = 600; // 10 minutes in seconds
    let multiplier = 1;
    let isDragging = false;
    let dragStartCell = null;
    let touchStartPos = null;
    
    const gameState = {
        gems: {},
        levels: {
            ruby: { xp: 0, level: 1 },
            sapphire: { xp: 0, level: 1 },
            emerald: { xp: 0, level: 1 },
            topaz: { xp: 0, level: 1 },
            diamond: { xp: 0, level: 1 }
        },
        multiplierActive: false
    };

    const board = document.querySelector('.board');
    const scoreDisplay = document.querySelector('.score');
    const timerDisplay = document.querySelector('.timer');
    const levelBarsContainer = document.querySelector('.level-bars');
    const multiplierBar = document.querySelector('.multiplier-bar');

    // Initialize game
    function init() {
        createLevelBars();
        createBoard();
        updateMultiplier();
        startGameLoop();
        processMatches(true);
    }

    function createLevelBars() {
        GEM_TYPES.forEach(type => {
            const bar = document.createElement('div');
            bar.className = 'level-bar';
            bar.innerHTML = `
                <div class="level-progress ${type}" style="width: 0%"></div>
            `;
            levelBarsContainer.appendChild(bar);
        });
    }

    function createBoard() {
        board.innerHTML = '';
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('touchstart', handleTouchStart);
                cell.addEventListener('touchmove', handleTouchMove);
                cell.addEventListener('touchend', handleTouchEnd);
                board.appendChild(cell);
                addGemToCell(cell);
            }
        }
    }

    function addGemToCell(cell, isNew = false) {
        const gem = document.createElement('div');
        gem.className = `gem ${getRandomGemType()}`;
        gem.dataset.type = gem.className.split(' ')[1];
        cell.appendChild(gem);
        if (isNew) gem.style.transform = 'translateY(-100%)';
        return gem;
    }

    function getRandomGemType() {
        return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
    }

    function handleTouchStart(e) {
        touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        dragStartCell = e.target.closest('.cell');
        isDragging = true;
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault();
    }

    function handleTouchEnd(e) {
        if (!isDragging || !dragStartCell) return;
        
        const touchEndPos = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        };
        
        const delta = {
            x: touchEndPos.x - touchStartPos.x,
            y: touchEndPos.y - touchStartPos.y
        };

        if (Math.abs(delta.x) < 30 && Math.abs(delta.y) < 30) return;

        const direction = Math.abs(delta.x) > Math.abs(delta.y) 
            ? (delta.x > 0 ? 'right' : 'left')
            : (delta.y > 0 ? 'down' : 'up');

        attemptSwap(dragStartCell, direction);
        isDragging = false;
    }

    function attemptSwap(startCell, direction) {
        const row = parseInt(startCell.dataset.row);
        const col = parseInt(startCell.dataset.col);
        let targetCell;

        switch(direction) {
            case 'up': targetCell = document.querySelector(`[data-row="${row-1}"][data-col="${col}"]`); break;
            case 'down': targetCell = document.querySelector(`[data-row="${row+1}"][data-col="${col}"]`); break;
            case 'left': targetCell = document.querySelector(`[data-row="${row}"][data-col="${col-1}"]`); break;
            case 'right': targetCell = document.querySelector(`[data-row="${row}"][data-col="${col+1}"]`); break;
        }

        if (!targetCell) return;

        const startGem = startCell.querySelector('.gem');
        const targetGem = targetCell.querySelector('.gem');
        swapGems(startCell, targetCell);

        if (!checkMatches()) {
            // No matches found, swap back
            setTimeout(() => swapGems(startCell, targetCell), 300);
        }
    }

    function swapGems(cell1, cell2) {
        const gem1 = cell1.querySelector('.gem');
        const gem2 = cell2.querySelector('.gem');
        cell1.appendChild(gem2);
        cell2.appendChild(gem1);
    }

    function checkMatches(initialCheck = false) {
        // Match checking logic here (omitted for brevity)
        // Should return true if matches were found
        return false;
    }

    function processMatches(initialCheck = false) {
        // Match processing logic here (omitted for brevity)
    }

    function updateScore(points, gemType) {
        // Score calculation logic here
    }

    function updateLevels(gemType, xpGained) {
        // Level progression logic here
    }

    function updateMultiplier() {
        // Multiplier calculation logic here
    }

    function startGameLoop() {
        const timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endGame();
            }
        }, 1000);
    }

    function endGame() {
        const playAgain = confirm(`Game Over! Final Score: ${score}\nPlay again?`);
        if (playAgain) location.reload();
    }

    init();
});