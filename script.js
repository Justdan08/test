let isDragging = false;
let startCell = null;
let selectedCells = [];
let direction = null;
let lastDraggedCell = null;

// ========================
// User Interaction
// ========================

function startDrag(cell) {
  isDragging = true;
  startCell = cell;
  selectedCells = [cell];
  direction = null;
  lastDraggedCell = cell;
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging || selectedCells.includes(cell)) return;

  const rowDiff = cell.dataset.row - startCell.dataset.row;
  const colDiff = cell.dataset.col - startCell.dataset.col;

  if (!direction) {
    if (rowDiff === 0) direction = "horizontal";
    else if (colDiff === 0) direction = "vertical";
    else if (Math.abs(rowDiff) === Math.abs(colDiff)) direction = "diagonal";
    else return; // Invalid move
  }

  // Handle backward movement
  if (isMovingBackward(cell)) {
    deselectLastCell();
    return;
  }

  // Handle progress and realignment
  if (isValidDirection(cell)) {
    // Populating cells in between the start and current cell if realigned
    const missingCells = getMissingCells(startCell, cell);
    missingCells.forEach(missingCell => {
      if (!selectedCells.includes(missingCell)) {
        selectedCells.push(missingCell);
        missingCell.classList.add("selected");
      }
    });

    selectedCells.push(cell);
    cell.classList.add("selected");
    lastDraggedCell = cell; // Update the last dragged cell
  }
}

// Calculate all cells between startCell and cell
function getMissingCells(start, end) {
  let cells = [];
  const rowStep = end.dataset.row > start.dataset.row ? 1 : (end.dataset.row < start.dataset.row ? -1 : 0);
  const colStep = end.dataset.col > start.dataset.col ? 1 : (end.dataset.col < start.dataset.col ? -1 : 0);

  let currentRow = parseInt(start.dataset.row);
  let currentCol = parseInt(start.dataset.col);

  while (currentRow !== parseInt(end.dataset.row) || currentCol !== parseInt(end.dataset.col)) {
    currentRow += rowStep;
    currentCol += colStep;
    const cell = getCellByCoordinates(currentRow, currentCol);
    if (cell && !cells.includes(cell)) cells.push(cell);
  }

  return cells;
}

// Helper function to get the cell by row and column index
function getCellByCoordinates(row, col) {
  return document.querySelector(`[data-row='${row}'][data-col='${col}']`);
}

// Check if the user is moving backward
function isMovingBackward(cell) {
  if (selectedCells.length < 2) return false;
  return selectedCells[selectedCells.length - 2] === cell;
}

function deselectLastCell() {
  if (selectedCells.length > 1) {
    const lastCell = selectedCells.pop();
    lastCell.classList.remove("selected");
  }
}

function isValidDirection(cell) {
  const lastCell = selectedCells[selectedCells.length - 1];
  return (
    (direction === "horizontal" && cell.dataset.row == startCell.dataset.row) ||
    (direction === "vertical" && cell.dataset.col == startCell.dataset.col) ||
    (direction === "diagonal" &&
      Math.abs(cell.dataset.row - startCell.dataset.row) ===
      Math.abs(cell.dataset.col - startCell.dataset.col))
  );
}

function endDrag() {
  isDragging = false;
  direction = null;
  checkForWord();
}

function checkForWord() {
  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  if (wordsPool.includes(selectedWord) && !foundWords.includes(selectedWord)) {
    foundWords.push(selectedWord);
    selectedCells.forEach(cell => cell.classList.add("found"));
    selectedCells = [];

    document.querySelectorAll("#words div").forEach(el => {
      if (el.textContent === selectedWord) el.classList.add("found");
    });

    if (foundWords.length === wordsPool.length) alert("Good Job Big Dog!");
  } else {
    selectedCells.forEach(cell => cell.classList.remove("selected"));
    selectedCells = [];
  }
}

// ========================
// Setup Grid
// ========================

function createGrid() {
  const grid = document.getElementById('wordsearch');
  const gridFragment = document.createDocumentFragment();

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(cell);
      });
      cell.addEventListener('mouseover', (e) => {
        e.preventDefault();
        dragOver(cell);
      });
      cell.addEventListener('mouseup', endDrag);
      gridFragment.appendChild(cell);
    }
  }
  grid.appendChild(gridFragment);
}

function addTouchSupport() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.addEventListener("touchstart", handleTouchStart);
    cell.addEventListener("touchmove", handleTouchMove);
    cell.addEventListener("touchend", handleTouchEnd);
  });
}

function handleTouchStart(e) {
  e.preventDefault();
  startDrag(e.target);
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target?.classList.contains("cell")) dragOver(target);
}

function handleTouchEnd() {
  endDrag();
}

// ========================
// Initialize Game
// ========================

document.addEventListener("DOMContentLoaded", () => {
  createGrid();
  addTouchSupport();
});