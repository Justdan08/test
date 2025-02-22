// Function to flicker letters for a specified duration
function flickerLetters(duration) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const cells = document.querySelectorAll(".cell");
  const flickerInterval = 100; // Change letters every 100ms

  const flicker = setInterval(() => {
    cells.forEach(cell => {
      if (cell.textContent !== "") {
        cell.textContent = letters[Math.floor(Math.random() * letters.length)];
      }
    });
  }, flickerInterval);

  // Stop flickering after the specified duration
  setTimeout(() => {
    clearInterval(flicker);
    placeWordsAndFillRandomLetters(); // Place words and fill random letters after flickering
  }, duration);
}

// Function to place words and fill random letters
function placeWordsAndFillRandomLetters() {
  currentWords.forEach(word => placeWord(word));
  fillRandomLetters();
}

// Modify the initializeGame function
function initializeGame() {
  // Reset timer
  secondsElapsed = 0;
  updateTimerDisplay();
  startTimer();

  // Get the word pool from the HTML
  const wordPoolElement = document.getElementById("word-pool");
  const wordPool = JSON.parse(wordPoolElement.dataset.words);

  // Randomly select 15 words from the pool
  currentWords = getRandomWords(wordPool, 15);

  const wordsearch = document.getElementById("wordsearch");
  const wordsContainer = document.getElementById("words");

  // Clear the grid and word list
  wordsearch.innerHTML = "";
  wordsContainer.innerHTML = ""; // Clear the word list completely

  // Create the "Words to find" box
  const wordsBox = document.createElement("div");
  wordsBox.style.border = "1px solid black"; // Thin black border
  wordsBox.style.padding = "10px"; // Restore original padding
  wordsBox.style.display = "grid";
  wordsBox.style.gap = "5px"; // Space between words
  wordsBox.style.marginTop = "20px"; // Add some space above the box
  wordsBox.style.overflow = "visible"; // Allow overflow
  wordsBox.style.width = "90%"; // Increase box width to almost full screen
  wordsBox.style.marginLeft = "auto"; // Center the box horizontally
  wordsBox.style.marginRight = "auto"; // Center the box horizontally

  // Set grid template columns
  wordsBox.style.gridTemplateColumns = "repeat(3, 1fr)"; // 3 equal-width columns

  // Add "Words to find:" title
  const wordsTitle = document.createElement("div");
  wordsTitle.textContent = "Words to find:";
  wordsTitle.style.gridColumn = "1 / -1"; // Span all columns
  wordsTitle.style.fontWeight = "bold"; // Make the title bold
  wordsTitle.style.marginBottom = "10px"; // Add space below the title
  wordsBox.appendChild(wordsTitle);

  // Add words in 3 columns and 5 rows
  currentWords.forEach((word, index) => {
    const wordElement = document.createElement("div");
    wordElement.textContent = word;
    wordElement.style.whiteSpace = "nowrap"; // Prevent text wrapping
    wordElement.style.overflow = "visible"; // Allow overflow
    wordElement.style.fontSize = "0.75em"; // Decrease font size by 25%
    wordsBox.appendChild(wordElement);
  });

  // Append the words box to the words container
  wordsContainer.appendChild(wordsBox);

  // Create the grid
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cell = createCell(i, j);
      wordsearch.appendChild(cell);
    }
  }

  // Start flickering letters for 2 seconds before placing words and filling random letters
  flickerLetters(2000);
}

// Rest of your code remains unchanged...