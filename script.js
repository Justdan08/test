// Check if gridSize and words are defined
if (typeof gridSize === "undefined" || typeof words === "undefined") {
  console.error("Missing gridSize or words. Define them in the HTML!");
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", initializeGame);
// Initialize the game
initializeGame();

function initializeGame() {
  // Clear existing grid and word list
  const wordsearch = document.getElementById("wordsearch");
  const wordsContainer = document.getElementById("words");
  wordsearch.innerHTML = "";
  wordsContainer.innerHTML = "<div>Words to find:</div>";

  // Create the grid cells
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.textContent = ""; // Start empty
      wordsearch.appendChild(cell);
    }
  }

  // Place words and fill random letters
  words.forEach(word => placeWord(word));
  fillRandomLetters();

  // Display words to find
  words.forEach(word => {
    const wordElement = document.createElement("div");
    wordElement.textContent = word;
    wordsContainer.appendChild(wordElement);
  });

  // Add event listeners for touch/mouse
  addTouchSupport();
}