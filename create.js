// Get references to key elements
const fileTitleInput = document.getElementById('fileTitle');
const titleInput = document.getElementById('titleInput');
const h1Input = document.getElementById('h1Input');
const link1Option = document.getElementById('link1Option');
const link1HrefInput = document.getElementById('link1Href');
const link2Option = document.getElementById('link2Option');
const link2HrefInput = document.getElementById('link2Href');
const newWordInput = document.getElementById('newWord');
const addWordBtn = document.getElementById('addWordBtn');
const wordPoolDisplay = document.getElementById('wordPoolDisplay');
const finishBtn = document.getElementById('finishBtn');
const outputModal = document.getElementById('outputModal');
const finalCodeTextarea = document.getElementById('finalCode');
const downloadBtn = document.getElementById('downloadBtn');
const closeModalBtn = document.getElementById('closeModal');

// Array to hold words for the pool
let wordsArray = [];

// Update the word pool display (formatted as "WORD", "WORD", "WORD", …)
function updateWordPoolDisplay() {
  const formatted = wordsArray.map(word => `"${word}"`).join(", ");
  wordPoolDisplay.textContent = formatted;
}

// Add word button event: add word to the array and update display
addWordBtn.addEventListener('click', () => {
  const word = newWordInput.value.trim();
  if (word !== "") {
    wordsArray.push(word.toUpperCase());
    updateWordPoolDisplay();
    newWordInput.value = "";
    newWordInput.focus();
  }
});

// Finish button event: generate the final HTML code with full structure
finishBtn.addEventListener('click', () => {
  const pageTitle = titleInput.value.trim() || 'Marvel Word Search';
  const h1Text = h1Input.value.trim() || 'Marvel';
  
  // For Link 1: use default href if input is empty
  const link1DefaultHref = link1Option.selectedOptions[0].getAttribute('data-default-href');
  const link1Text = link1Option.selectedOptions[0].textContent;
  const link1Href = link1HrefInput.value.trim() || link1DefaultHref;
  
  // For Link 2: use default href if input is empty
  const link2DefaultHref = link2Option.selectedOptions[0].getAttribute('data-default-href');
  const link2Text = link2Option.selectedOptions[0].textContent;
  const link2Href = link2HrefInput.value.trim() || link2DefaultHref;
  
  // Convert the words array to JSON string for the data-words attribute
  const wordsJSON = JSON.stringify(wordsArray);
  
  // Construct the final HTML string (using your full template)
  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>${h1Text}</h1>
  <div id="options-container"></div>
  <div id="score">Score: 0</div>
  <div id="timer">0:00</div>
  <div id="combo-container">
    <div id="combo-bar"></div>
    <div id="combo-text">Combo: 1x</div>
  </div>
  <div id="wordsearch"></div>
  <div id="word-list">
    <div id="words"></div>
    <button id="reset-button">Reset Game</button>
    <div class="nav-links">
      <a href="${link1Href}">${link1Text}</a>
      <a href="${link2Href}">${link2Text}</a>
    </div>
  </div>

  <!-- Marvel word pool -->
  <div id="word-pool" data-words='${wordsJSON}'></div>

  <script src="script.js"></script>

</body>
</html>`;
  
  // Display the generated HTML in the modal textarea
  finalCodeTextarea.value = htmlContent;
  outputModal.style.display = 'flex';
});

// Download the generated HTML file using the File Title field (or default filename)
downloadBtn.addEventListener('click', () => {
  const content = finalCodeTextarea.value;
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fileTitle = fileTitleInput.value.trim() || "word-search-puzzle.html";
  a.href = url;
  a.download = fileTitle;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Close the modal popup
closeModalBtn.addEventListener('click', () => {
  outputModal.style.display = 'none';
});
