// Add these functions to your script.js file to implement client-side fallback

// Set a fallback timeout for premise generation
let premiseGenerationTimeout;

// Array of fallback premises if server fails to generate one
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

// Modify the existing socket event listeners
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
      implementFallbackPremise();
    }, 15000); // 15 second timeout
  } else {
    clearTimeout(premiseGenerationTimeout);
  }
});

// Add a new function to handle premise fallback
function implementFallbackPremise() {
  console.log('Implementing fallback premise');
  
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
  
  // Log the fallback
  console.log('Client-side fallback premise implemented:', fallbackPremise);
}

// Additional debug logs to add to existing functions
// Add to the beginning of the updateStory function
function updateStory(story) {
  console.log('updateStory called with:', story);
  
  // Existing updateStory code...
}

// Add to the socket.on('init'... event
socket.on('init', ({ story, players: playersList, currentTurn: turnIndex }) => {
  console.log('init event received with story:', story);
  
  // Existing init event handler code...
  
  // Clear any pending fallback timeout
  clearTimeout(premiseGenerationTimeout);
});
