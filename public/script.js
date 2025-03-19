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
let players = [];
let currentTurn = 0;
let storyLength = 0;

// Fallback premise system
let premiseGenerationTimeout;
const fallbackPremises = [
  "The adventure began with an unexpected discovery.",
  "No one believed her when she said she could see the future.",
  "The old mansion had secrets hidden within its walls.",
  "The storm brought more than just rain to our small town.",
  "When the lights flickered, we knew something had changed.",
  "The mysterious package arrived without a return address.",
  "What started as an ordinary day quickly turned extraordinary.",
  "The ancient book contained a warning that couldn't be ignored.",
  "Sometimes the most important journeys begin with a single mistake.",
  "The countdown began, and we had no idea what would happen at zero."
];

// Listen for initial game state
socket.on('init', ({ story, players: playersList, currentTurn: turnIndex }) => {
  // Clear any pending fallback timeout
  clearTimeout(premiseGenerationTimeout);
  
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

// Listen for premise generation status
socket.on('premiseGenerating', (isGenerating) => {
  if (isGenerating) {
    feed.innerHTML = '<div class="generating-message">AI is crafting an intriguing story premise...</div>';
    progressCount.textContent = '0';
    turnIndicator.textContent = 'Waiting for premise...';
    input.disabled = true;
    submitBtn.disabled = true;
    
    // Set a timeout for premise generation
    clearTimeout(premiseGenerationTimeout);
    premiseGenerationTimeout = setTimeout(() => {
      console.log('Client-side fallback: Premise generation timed out');
      
      // Select a random fallback premise
      const randomIndex = Math.floor(Math.random() * fallbackPremises.length);
      const fallbackPremise = fallbackPremises[randomIndex];
      
      // Create a fallback story with the premise
      const fallbackStory = [{ player: 'Host', text: fallbackPremise }];
      
      // Update UI with the fallback premise
      updateStory(fallbackStory);
      updateTurn(players[0]);
      progressCount.textContent = '1';
      
      // Enable input
      input.disabled = false;
      submitBtn.disabled = false;
    }, 8000); // 8 second timeout
  } else {
    clearTimeout(premiseGenerationTimeout);
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
  if (story.length === 0) {
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

// Add initial story fallback (in case server doesn't send an initial premise)
setTimeout(() => {
  // Check if there's already content in the story feed
  if (feed.innerHTML.includes('Waiting for story to begin') || feed.innerHTML === '') {
    console.log('Emergency fallback: No story received from server');
    
    // Create an emergency fallback premise
    const fallbackPremise = "In a world where stories write themselves, our tale begins.";
    const fallbackStory = [{ player: 'Host', text: fallbackPremise }];
    
    // Update UI with the fallback premise
    updateStory(fallbackStory);
    updateTurn('Player 1');
    progressCount.textContent = '1';
    
    // Enable input
    input.disabled = false;
    submitBtn.disabled = false;
  }
}, 15000); // 15 second ultimate fallback
