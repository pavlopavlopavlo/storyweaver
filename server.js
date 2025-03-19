const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
require('dotenv').config(); // For environment variables

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Serve front-end files

// Default story with initial premise
let story = [{ player: 'Host', text: 'The adventure began with an unexpected discovery.' }];
let players = ['Player 1', 'Player 2', 'Grok']; // Preset players
let currentTurn = 0;

// Array of fallback premises
const fallbackPremises = [
  "The ancient map led us to a place that shouldn't exist.",
  "The letter arrived fifty years after it was sent.",
  "The city looked different after the fog rolled in.",
  "We found a key that unlocked more than just doors.",
  "No one believed her when she said she could see the future.",
  "The old mansion had secrets hidden within its walls.",
  "The storm brought more than just rain to our small town.",
  "When the lights flickered, we knew something had changed."
];

// Function to generate a random premise
function getRandomPremise() {
  const randomIndex = Math.floor(Math.random() * fallbackPremises.length);
  return fallbackPremises[randomIndex];
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected');
  
  // Send initial state to the new connection with the default story
  socket.emit('init', { story, players, currentTurn });
  
  // Handle when a player submits a new sentence
  socket.on('addSentence', async (sentence) => {
    if (sentence.trim() && 
        sentence.length <= 100 && 
        story.length < 16 && // Limit to 15 turns + premise
        !/offensive|inappropriate/i.test(sentence)) {
      
      // Add the player's sentence
      story.push({ player: players[currentTurn], text: sentence });
      currentTurn = (currentTurn + 1) % players.length; // Move to next player's turn
      
      // Broadcast update to all connected clients
      io.emit('update', { story, currentTurn });
      
      // If it's Grok's turn, generate a response
      if (players[currentTurn] === 'Grok' && story.length < 16) {
        // Tell clients Grok is thinking
        io.emit('grokThinking', true);
        
        // Wait 2 seconds to simulate thinking
        setTimeout(async () => {
          try {
            // Get a simple AI response or fallback
            const grokResponse = await getGrokResponse();
            
            // Add Grok's response
            story.push({ player: 'Grok', text: grokResponse });
            currentTurn = (currentTurn + 1) % players.length;
            
            // Update clients
            io.emit('update', { story, currentTurn });
            io.emit('grokThinking', false);
          } catch (error) {
            console.error('Grok response error:', error);
            io.emit('grokThinking', false);
          }
        }, 2000);
      }
      
      // Enable video generation after story is complete
      if (story.length >= 16) {
        io.emit('storyComplete', true);
      }
    } else {
      socket.emit('error', 'Invalid sentence: too long, offensive, or inappropriate');
    }
  });

  // Handle video generation request (simplified for now)
  socket.on('generateVideo', async () => {
    io.emit('videoGenerating', true);
    
    // Simulate video generation with a timeout
    setTimeout(() => {
      const placeholderUrl = 'https://example.com/placeholder-video.mp4';
      io.emit('videoReady', placeholderUrl);
      io.emit('videoGenerating', false);
    }, 3000);
  });
});

// Simple function to get Grok's response (either from OpenAI or fallback)
async function getGrokResponse() {
  const fallbackResponses = [
    "The plot thickened as shadows danced across the ancient walls.",
    "A whisper of wind carried secrets through the narrow streets.",
    "The mysterious object glinted in the moonlight, revealing hidden symbols.",
    "Something stirred in the darkness, watching our every move.",
    "The clock struck midnight, and everything changed in an instant.",
    "Footsteps echoed behind us, though no one was there.",
    "The door creaked open, revealing a passage that shouldn't exist.",
    "A chill ran down my spine as the truth became clear.",
    "The message contained a warning that couldn't be ignored.",
    "Through the mist, a silhouette appeared, beckoning us forward."
  ];
  
  // Try to use OpenAI if configured
  if (process.env.OPENAI_API_KEY) {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      const previousSentences = story.map(s => s.text).join(' ');
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are Grok, a creative storyteller. Continue this collaborative story with a single sentence (max 100 characters) that builds on what came before. Be imaginative but appropriate."
            },
            {
              role: "user",
              content: `Here's the story so far: "${previousSentences}". Continue with a single sentence.`
            }
          ],
          max_tokens: 50,
          temperature: 0.8
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      let aiResponse = response.data.choices[0].message.content.trim();
      
      // Ensure it's just one sentence and under 100 characters
      if (aiResponse.length > 100) {
        aiResponse = aiResponse.substring(0, 97) + '...';
      }
      
      // Remove quotes if the AI added them
      aiResponse = aiResponse.replace(/^["'](.*)["']$/, '$1');
      
      return aiResponse;
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fall through to fallback
    }
  }
  
  // Fallback to random response
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

// Use environment port or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
