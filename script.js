// Initialize the game
initializeGame();

function initializeGame() {
  // Generate grid based on gridSize
  const wordsearch = document.getElementById("wordsearch");
  wordsearch.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  // Create cells
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cell = createCell(i, j);
      wordsearch.appendChild(cell);
    }
  }

  // Place words and fill grid
  words.forEach(word => placeWord(word));
  fillRandomLetters();

  // Display words to find
  const wordsContainer = document.getElementById("words");
  words.forEach(word => {
    const wordElement = document.createElement("div");
    wordElement.textContent = word;
    wordsContainer.appendChild(wordElement);
  });

  // Add touch support
  addTouchSupport();
}

// Keep the rest of your existing code (placeWord, canPlaceWord, etc.) unchanged.