// Get references to key elements
const titleInput   = document.getElementById('titleInput');
const h1Input      = document.getElementById('h1Input');
const link1Text    = document.getElementById('link1Text');
const link1Href    = document.getElementById('link1Href');
const link2Text    = document.getElementById('link2Text');
const link2Href    = document.getElementById('link2Href');
const poolNameInput = document.getElementById('poolName');
const newWordInput  = document.getElementById('newWord');
const addWordBtn    = document.getElementById('addWordBtn');
const wordsListUl   = document.getElementById('wordsList');
const finishBtn     = document.getElementById('finishBtn');
const outputModal   = document.getElementById('outputModal');
const finalCodeTextarea = document.getElementById('finalCode');
const downloadBtn   = document.getElementById('downloadBtn');
const closeModalBtn = document.getElementById('closeModal');

// Function to add a new word to the list
addWordBtn.addEventListener('click', () => {
  const word = newWordInput.value.trim();
  if (word !== '') {
    // Create list item with the word and a remove button
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'word-text';
    span.textContent = word;
    // Remove button for this word
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-btn';
    // When remove is clicked, delete this word item
    removeBtn.addEventListener('click', () => {
      wordsListUl.removeChild(li);
    });
    // Assemble the list item and add to the list
    li.appendChild(span);
    li.appendChild(removeBtn);
    wordsListUl.appendChild(li);
    // Clear the input field for new words
    newWordInput.value = '';
    newWordInput.focus();
  }
});

// Function to finish and generate the HTML
finishBtn.addEventListener('click', () => {
  // Collect values from inputs (use defaults if empty)
  const pageTitle = titleInput.value.trim() || 'Word Search Puzzle';
  const mainHeading = h1Input.value.trim() || 'Word Search Puzzle';
  const nav1Text = link1Text.value.trim() || 'Previous Puzzle';
  const nav1Href = link1Href.value.trim() || '#';
  const nav2Text = link2Text.value.trim() || 'Next Puzzle';
  const nav2Href = link2Href.value.trim() || '#';
  const poolName = poolNameInput.value.trim() || 'Word Pool';

  // Get all words from the list
  const wordItems = wordsListUl.querySelectorAll('li .word-text');
  let wordsArray = [];
  wordItems.forEach(item => {
    wordsArray.push(item.textContent);
  });

  // Construct the HTML string for the puzzle page
  let htmlContent = "<!DOCTYPE html>\n<html>\n<head>\n";
  htmlContent += "  <meta charset=\"UTF-8\" />\n";
  htmlContent += "  <title>" + pageTitle + "</title>\n";
  htmlContent += "  <link rel=\"stylesheet\" href=\"style.css\" />\n";
  htmlContent += "</head>\n<body>\n\n";
  htmlContent += "  <h1>" + mainHeading + "</h1>\n";
  htmlContent += "  <div class=\"nav-links\">\n";
  htmlContent += "    <a href=\"" + nav1Href + "\">" + nav1Text + "</a>\n";
  htmlContent += "    <a href=\"" + nav2Href + "\">" + nav2Text + "</a>\n";
  htmlContent += "  </div>\n\n";
  htmlContent += "  <h2>" + poolName + "</h2>\n";
  htmlContent += "  <ul class=\"word-pool\">\n";
  // Add each word as a list item
  wordsArray.forEach(word => {
    htmlContent += "    <li>" + word + "</li>\n";
  });
  htmlContent += "  </ul>\n\n";
  htmlContent += "</body>\n</html>";

  // Show the generated HTML in the modal textarea
  finalCodeTextarea.value = htmlContent;
  // Display the popup modal
  outputModal.style.display = 'flex';
});

// Download the generated HTML as a file
downloadBtn.addEventListener('click', () => {
  const content = finalCodeTextarea.value;
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "word-search-puzzle.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Close the modal popup
closeModalBtn.addEventListener('click', () => {
  outputModal.style.display = 'none';
});
