// ========================
// User Interaction (Updated)
// ========================

function startDrag(cell) {
  if (cell.classList.contains("found")) return; // Ignore found cells
  isDragging = true;
  startCell = cell;
  selectedCells = [cell];
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging || selectedCells.includes(cell) || cell.classList.contains("found")) return;

  const lastCell = selectedCells[selectedCells.length - 1];
  const rowDiff = cell.dataset.row - startCell.dataset.row;
  const colDiff = cell.dataset.col - startCell.dataset.col;

  if (!direction) {
    if (rowDiff === 0) direction = "horizontal";
    else if (colDiff === 0) direction = "vertical";
    else if (Math.abs(rowDiff) === Math.abs(colDiff)) direction = "diagonal";
    else return; // Invalid move
  }

  // Check if moving backward
  if (isMovingBackward(cell)) {
    deselectLastCell();
    return;
  }

  if (
    (direction === "horizontal" && cell.dataset.row == startCell.dataset.row) ||
    (direction === "vertical" && cell.dataset.col == startCell.dataset.col) ||
    (direction === "diagonal" && Math.abs(rowDiff) === Math.abs(colDiff))
  ) {
    const missingCells = getMissingCells(lastCell, cell);
    missingCells.forEach(missingCell => {
      if (!selectedCells.includes(missingCell) && !missingCell.classList.contains("found")) {
        selectedCells.push(missingCell);
        missingCell.classList.add("selected");
      }
    });

    selectedCells.push(cell);
    cell.classList.add("selected");
  }
}

function endDrag() {
  isDragging = false;
  direction = null;
  checkForWord();
}

function checkForWord() {
  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  if (words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
    foundWords.push(selectedWord);
    selectedCells.forEach(cell => {
      cell.classList.add("found");
      cell.classList.remove("selected"); // Remove selection styling
    });
    selectedCells = [];

    // Mark word as found
    document.querySelectorAll("#words div").forEach(el => {
      if (el.textContent === selectedWord) el.classList.add("found");
    });

    if (foundWords.length === words.length) alert("Good Job Big Dog!");
  } else {
    selectedCells.forEach(cell => {
      if (!cell.classList.contains("found")) {
        cell.classList.remove("selected");
      }
    });
    selectedCells = [];
  }
}