{\rtf1\ansi\ansicpg1252\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // Initialize the game\
initializeGame();\
\
function initializeGame() \{\
  // Generate grid based on gridSize\
  const wordsearch = document.getElementById("wordsearch");\
  wordsearch.style.gridTemplateColumns = `repeat($\{gridSize\}, 1fr)`;\
\
  // Create cells\
  for (let i = 0; i < gridSize; i++) \{\
    for (let j = 0; j < gridSize; j++) \{\
      const cell = createCell(i, j);\
      wordsearch.appendChild(cell);\
    \}\
  \}\
\
  // Place words and fill grid\
  words.forEach(word => placeWord(word));\
  fillRandomLetters();\
\
  // Display words to find\
  const wordsContainer = document.getElementById("words");\
  words.forEach(word => \{\
    const wordElement = document.createElement("div");\
    wordElement.textContent = word;\
    wordsContainer.appendChild(wordElement);\
  \});\
\
  // Add touch support\
  addTouchSupport();\
\}\
\
// Keep the rest of your existing code (placeWord, canPlaceWord, etc.) unchanged.}