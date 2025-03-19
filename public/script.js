// Connect to the Socket.IO server
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
let players = ['Player 1', 'Player 2', 'Grok']; // Default players
let currentTurn = 0;

// Listen for initial game state
socket.on('init', ({ story, players: playersList, currentTurn: turnIndex }) => {
  console.log('Received init event with story:', story);
  
  // Update state
  if (playersList && playersList.length > 0) {
    players = playersList;
  }
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
  } else {
    // Enable/disable input based on whose turn it is
    if (players[currentTurn] === 'Grok') {
      input.disabled = true;
      submitBtn.disabled = true;
      turnIndicator.innerHTML = `Next: <span class="ai-turn">Grok (AI is thinking...)</span>`;
    } else {
      input.disabled = false;
      submitBtn.disabled = false;
    }
  }
});

// Listen for story updates
socket.on('update', ({ story, currentTurn: turnIndex }) => {
  console.log('Received update event with story length:', story.length);
  
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
  console.log('Grok thinking status:', isThinking);
  
  if (isThinking) {
    turnIndicator.innerHTML = `<span class="ai-turn">Grok is thinking...</span>`;
    input.disabled = true;
    submitBtn.disabled = true;
  }
});

// Listen for story completion
socket.on('storyComplete', (isComplete) => {
  console.log('Story complete event:', isComplete);
  
  if (isComplete) {
    videoBtn.disabled = false;
    submitBtn.disabled = true;
    input.disabled = true;
    turnIndicator.textContent = 'Story complete!';
  }
});

// Listen for video generation status
socket.on('videoGenerating', (isGenerating) => {
  if (isGenerating) {
    loadingIndicator.classList.remove('hidden');
    videoBtn.disabled = true;
  } else {
    loadingIndicator.classList.add('hidden');
    videoBtn.disabled = false;
  }
});

// Listen for video generation result
socket.on('videoReady', (url) => {
  console.log('Video ready:', url);
  loadingIndicator.classList.add('hidden');
  videoOutput.innerHTML = `<p>Video would appear here (currently using placeholder)</p>`;
});

// Listen for error messages
socket.on('error', (message) => {
  console.error('Error from server:', message);
  alert(message);
});

// Update the story feed display
function updateStory(story) {
  console.log('Updating story display with story of length:', story.length);
  
  if (!story || story.length === 0) {
    feed.innerHTML = '<div class="generating-message">Waiting for story to begin...</div>';
    return;
  }
  
  let html = '';
  
  // Add special styling to the premise (first entry)
  html += `<div class="premise">${story[0].text}</div>`;
  
  // Add the rest of the story
  for (let i = 1; i < story.length; i++) {
    html += `<div class="sentence">
      <span class="player-name">${story[i].player}:</span> ${story[i].text}
    </div>`;
  }
  
  feed.innerHTML = html;
  
  // Auto-scroll to the latest sentence
  feed.scrollTop = feed.scrollHeight;
}

// Update the turn indicator
function updateTurn(player) {
  console.log('Updating turn to:', player);
  
  if (player === 'Grok') {
    turnIndicator.innerHTML = `Next: <span class="player-name">Grok</span>`;
  } else {
    turnIndicator.textContent = `Next: ${player}`;
  }
}

// Submit a new sentence to the story
function submitSentence() {
  const sentence = input.value.trim();
  console.log('Submitting sentence:', sentence);
  
  if (sentence) {
    // Temporarily disable input until server responds
    input.disabled = true;
    submitBtn.disabled = true;
    
    // Send the sentence to the server
    socket.emit('addSentence', sentence);
  } else {
    alert('Please enter a sentence');
  }
}

// Generate a video from the completed story
function generateVideo() {
  console.log('Requesting video generation');
  
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

// Add emergency fallback if socket connection fails
setTimeout(() => {
  if (feed.innerHTML === '' || feed.innerHTML.includes('Waiting for story to begin')) {
    console.log('Emergency fallback: Connection may have failed');
    
    // Create a fallback story
    const fallbackStory = [
      { player: 'Host', text: 'The adventure began with an unexpected discovery.' }
    ];
    
    // Update UI
    updateStory(fallbackStory);
    updateTurn('Player 1');
    progressCount.textContent = '1';
    
    // Enable input
    input.disabled = false;
    submitBtn.disabled = false;
    
    // Show connection error
    alert('There seems to be an issue connecting to the server. Some features may not work properly.');
  }
}, 5000);

// Log that the script has loaded
console.log('StoryWeave client script loaded');
