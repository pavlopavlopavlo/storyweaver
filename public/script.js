// Listen for premise generation status
socket.on('premiseGenerating', (isGenerating) => {
  if (isGenerating) {
    feed.innerHTML = '<div class="generating-message">AI is crafting an intriguing story premise...</div>';
    progressCount.textContent = '0';
    turnIndicator.textContent = 'Waiting for premise...';
    input.disabled = true;
    submitBtn.disabled = true;
  }
});// Connect to the Socket.IO server
const socket = io();

// Get DOM elements
const feed = document.getElementById('story-feed');
const turnIndicator = document.getElementById('turn-indicator');
const progressCount = document.getElementById('progress-count');
const input = document.getElementById('sentence-input');
const submitBtn = document.getElementById('submit-btn');
const videoBtn = document.getElementById('video-btn');
const videoOutput = document.getElementById('video-output');
const loadingIndicator = document.getElementById('loading-indicator');

// Store game state
let players = [];
let currentTurn = 0;
let storyLength = 0;

// Listen for initial game state
socket.on('init', ({ story, players: playersList, currentTurn: turnIndex }) => {
  players = playersList;
  currentTurn = turnIndex;
  
  // Update UI with the initial story state
  updateStory(story);
  updateTurn(players[currentTurn]);
  
  // Set progress counter
  progressCount.textContent = story.length;
  
  // Check if story is already complete
  if (story.length >= 16) {
    videoBtn.disabled = false;
    submitBtn.disabled = true;
    input.disabled = true;
  }
});

// Listen for story updates
socket.on('update', ({ story, currentTurn: turnIndex }) => {
  currentTurn = turnIndex;
  
  // Update UI
  updateStory(story);
  updateTurn(players[currentTurn]);
  progressCount.textContent = story.length;
  
  // Clear input field after successful update
  input.value = '';
  
  // Enable/disable input based on whose turn it is
  if (players[currentTurn] === 'Grok') {
    input.disabled = true;
    submitBtn.disabled = true;
    turnIndicator.innerHTML = `Next: <span class="ai-turn">Grok (AI is thinking...)</span>`;
  } else {
    input.disabled = false;
    submitBtn.disabled = false;
  }
});

// Listen for Grok thinking status
socket.on('grokThinking', (isThinking) => {
  if (isThinking) {
    turnIndicator.innerHTML = `<span class="ai-turn">Grok is thinking...</span>`;
  }
});

// Listen for story completion
socket.on('storyComplete', (isComplete) => {
  if (isComplete) {
    videoBtn.disabled = false;
    submitBtn.disabled = true;
    input.disabled = true;
    turnIndicator.textContent = 'Story complete!';
  }
});

// Listen for video generation result
socket.on('videoReady', (url) => {
  loadingIndicator.classList.add('hidden');
  videoOutput.innerHTML = `<video src="${url}" controls autoplay></video>`;
});

// Listen for error messages
socket.on('error', (message) => {
  alert(message);
});

// Update the story feed display
function updateStory(story) {
  feed.innerHTML = story.map(s => 
    `<div class="sentence">
      <span class="player-name">${s.player}:</span> ${s.text}
    </div>`
  ).join('');
  
  // Auto-scroll to the latest sentence
  feed.scrollTop = feed.scrollHeight;
}

// Update the turn indicator
function updateTurn(player) {
  turnIndicator.textContent = `Next: ${player}`;
}

// Submit a new sentence to the story
function submitSentence() {
  const sentence = input.value.trim();
  
  if (sentence) {
    socket.emit('addSentence', sentence);
  } else {
    alert('Please enter a sentence');
  }
}

// Generate a video from the completed story
function generateVideo() {
  // Show loading indicator
  loadingIndicator.classList.remove('hidden');
  videoOutput.innerHTML = '';
  
  // Request video generation
  socket.emit('generateVideo');
}

// Listen for Enter key press in the input field
input.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    submitSentence();
  }
});
