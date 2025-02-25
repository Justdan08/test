// ========================
// Game State
// ========================
let selectedCells = [];
let foundWords = [];
let isDragging = false;
let startCell = null;
let direction = null;
let currentWords = [];
let secondsElapsed = 0;
let score = 0;
let comboMultiplier = 1;
let comboTimeLeft = 0;
let comboInterval = null;
let timerInterval = null;
const gridSize = 15;

// ========================
// Initialization
// ========================
document.addEventListener("DOMContentLoaded", initializeGame);
document.getElementById("reset-button").addEventListener("click", resetGame);

// ========================
// Timer Functions
// ========================
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerDisplay() {
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  document.getElementById("timer").textContent = timerDisplay;
}

// ========================
// Combo Functions
// ========================
function startComboTimer() {
  comboTimeLeft = 10;
  updateComboBar();

  if (comboInterval) clearInterval(comboInterval);

  comboInterval = setInterval(() => {
    comboTimeLeft--;
    updateComboBar();

    if (comboTimeLeft <= 0) {
      clearInterval(comboInterval);
      comboMultiplier = 1;
      updateComboBar();
    }
  }, 1000);
}

function updateComboBar() {
  const comboBar = document.getElementById("combo-bar");
  const comboText = document.getElementById("combo-text");
  comboBar.style.width = `${(comboTimeLeft / 10) * 100}%`;
  comboText.textContent = `Combo: ${comboMultiplier}x`;
}

// ========================
// Score Functions
// ========================
function updateScoreDisplay() {
  document.getElementById("score").textContent = `Score: ${score}`;
}

function calculatePoints(wordLength) {
  const timeChunk = Math.floor(secondsElapsed / 15);
  const pointsPerLetter = Math.max(50 - (timeChunk * 5), 0);
  return wordLength * pointsPerLetter * comboMultiplier;
}

// ========================
// Core Game Functions
// ========================
function initializeGame() {
  stopTimer();
  clearInterval(comboInterval);

  selectedCells = [];
  foundWords = [];
  score = 0;
  secondsElapsed = 0;
  comboMultiplier = 1;
  comboTimeLeft = 0;

  updateScoreDisplay();
  updateTimerDisplay();
  updateComboBar();
  startTimer();

  const wordPoolElement = document.getElementById("word-pool");
  const wordPool = JSON.parse(wordPoolElement.dataset.words);
  currentWords = getRandomWords(wordPool, 15);

  const wordsearch = document.getElementById("wordsearch");
  const wordsContainer = document.getElementById("words");

  wordsearch.innerHTML = "";
  wordsContainer.innerHTML = "";

  const wordsBox = document.createElement("div");
  wordsBox.style.border = "1px solid black";
  wordsBox.style.padding = "10px";
  wordsBox.style.display = "grid";
  wordsBox.style.gap = "5px";
  wordsBox.style.marginTop = "20px";
  wordsBox.style.overflow = "visible";
  wordsBox.style.width = "90%";
  wordsBox.style.marginLeft = "auto";
  wordsBox.style.marginRight = "auto";
  wordsBox.style.gridTemplateColumns = "repeat(3, 1fr)";

  const wordsTitle = document.createElement("div");
  wordsTitle.textContent = "Words to find:";
  wordsTitle.style.gridColumn = "1 / -1";
  wordsTitle.style.fontWeight = "bold";
  wordsTitle.style.marginBottom = "10px";
  wordsBox.appendChild(wordsTitle);

  currentWords.forEach((word, index) => {
    const wordElement = document.createElement("div");
    wordElement.textContent = word;
    wordElement.style.whiteSpace = "nowrap";
    wordElement.style.overflow = "visible";
    wordElement.style.fontSize = "0.75em";
    wordsBox.appendChild(wordElement);
  });

  wordsContainer.appendChild(wordsBox);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cell = createCell(i, j);
      wordsearch.appendChild(cell);
    }
  }

  currentWords.forEach(word => placeWord(word));
  fillRandomLetters();
  addTouchSupport();
}

function getRandomWords(pool, count) {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function createCell(row, col) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.row = row;
  cell.dataset.col = col;
  cell.textContent = "";
  cell.addEventListener("mousedown", () => startDrag(cell));
  cell.addEventListener("mouseenter", () => dragOver(cell));
  cell.addEventListener("mouseup", endDrag);
  return cell;
}

function placeWord(word) {
  const directions = ["horizontal", "vertical", "diagonal"];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  let row, col;

  if (direction === "horizontal") {
    row = Math.floor(Math.random() * gridSize);
    col = Math.floor(Math.random() * (gridSize - word.length));
  } else if (direction === "vertical") {
    col = Math.floor(Math.random() * gridSize);
    row = Math.floor(Math.random() * (gridSize - word.length));
  } else {
    row = Math.floor(Math.random() * (gridSize - word.length));
    col = Math.floor(Math.random() * (gridSize - word.length));
  }

  if (canPlaceWord(word, row, col, direction)) {
    for (let i = 0; i < word.length; i++) {
      let cell;
      if (direction === "horizontal") {
        cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
      } else if (direction === "vertical") {
        cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`);
      } else {
        cell = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);
      }
      cell.textContent = word[i];
    }
  } else {
    placeWord(word);
  }
}

function canPlaceWord(word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    const cell = direction === "horizontal"
      ? document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`)
      : direction === "vertical"
      ? document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`)
      : document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`);

    if (!cell || (cell.textContent !== "" && cell.textContent !== word[i])) {
      return false;
    }
  }
  return true;
}

function fillRandomLetters() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  document.querySelectorAll(".cell").forEach(cell => {
    if (cell.textContent === "") {
      cell.textContent = letters[Math.floor(Math.random() * letters.length)];
    }
  });
}

// ========================
// User Interaction
// ========================
function startDrag(cell) {
  if (!cell) return;
  isDragging = true;
  startCell = cell;
  selectedCells = [cell];
  direction = null;
  cell.classList.add("selected");
}

function dragOver(cell) {
  if (!isDragging || !startCell) return;

  if (!selectedCells.includes(startCell)) {
    selectedCells = [startCell];
    startCell.classList.add("selected");
  }

  const startRow = parseInt(startCell.dataset.row);
  const startCol = parseInt(startCell.dataset.col);
  const currentRow = parseInt(cell.dataset.row);
  const currentCol = parseInt(cell.dataset.col);

  const rowDiff = currentRow - startRow;
  const colDiff = currentCol - startCol;

  let newDirection = null;
  if (rowDiff === 0) newDirection = "horizontal";
  else if (colDiff === 0) newDirection = "vertical";
  else if (Math.abs(rowDiff) === Math.abs(colDiff)) newDirection = "diagonal";
  else return;

  if (!direction || newDirection !== direction) {
    direction = newDirection;
  }

  const rowStep = Math.sign(rowDiff);
  const colStep = Math.sign(colDiff);

  let row = startRow;
  let col = startCol;
  let newSelection = [startCell];

  while (row !== currentRow || col !== currentCol) {
    row += rowStep;
    col += colStep;
    const nextCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!nextCell) break;
    newSelection.push(nextCell);
  }

  if (newSelection[newSelection.length - 1] !== cell) return;

  selectedCells.forEach(c => c.classList.remove("selected"));
  newSelection.forEach(c => c.classList.add("selected"));
  selectedCells = newSelection;
}

function endDrag() {
  isDragging = false;
  direction = null;
  if (selectedCells.length > 0) {
    checkForWord();
  }
}

function checkForWord() {
  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  if (currentWords.includes(selectedWord) && !foundWords.includes(selectedWord)) {
    const wordScore = calculatePoints(selectedWord.length);
    score += wordScore;
    updateScoreDisplay();

    if (comboTimeLeft > 0) {
      comboMultiplier += 0.25;
    }
    startComboTimer();

    foundWords.push(selectedWord);
    selectedCells.forEach(cell => {
      if (!cell.classList.contains("found")) {
        cell.classList.add("found");
      }
      cell.classList.remove("selected");
    });

    document.querySelectorAll("#words div").forEach(el => {
      if (el.textContent === selectedWord) el.classList.add("found");
    });

    if (foundWords.length === currentWords.length) {
      stopTimer();
      alert(`Good Job Big Dog!\nFinal Score: ${score}`);
    }
  } else {
    selectedCells.forEach(cell => {
      cell.classList.remove("selected");
    });
  }
  selectedCells = [];
}

// ========================
// Mobile Support
// ========================
function addTouchSupport() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach(cell => {
    cell.addEventListener("touchstart", handleTouchStart);
    cell.addEventListener("touchmove", handleTouchMove);
    cell.addEventListener("touchend", handleTouchEnd);
  });
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target?.classList.contains("cell")) {
    startDrag(target);
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  if (touch.clientX < 0 || touch.clientY < 0 || touch.clientX > window.innerWidth || touch.clientY > window.innerHeight) return;
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target?.classList.contains("cell")) {
    if (target !== selectedCells[selectedCells.length - 1]) {
      dragOver(target);
    }
  }
}

function handleTouchEnd() {
  endDrag();
}

// ========================
// Reset Functionality
// ========================
function resetGame() {
  document.getElementById("wordsearch").innerHTML = "";
  selectedCells = [];
  foundWords = [];
  score = 0;
  comboMultiplier = 1;
  comboTimeLeft = 0;
  updateScoreDisplay();
  updateComboBar();
  stopTimer();
  initializeGame();
}