// Function to generate a story premise using AI
async function generateStoryPremise() {
  try {
    // Select a random prompt source for inspiration
    const randomSource = promptSources[Math.floor(Math.random() * promptSources.length)];
    
    // If you're using OpenAI's API
    const apiKey = process.env.OPENAI_API_KEY || 'your-api-key';
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a creative storyteller. Create an intriguing first sentence (max 100 characters) to start a collaborative story. It should be evocative, specific, and open-ended."
          },
          {
            role: "user",
            content: `Generate a captivating story opening sentence inspired by ${randomSource}. It should be intriguing and under 100 characters.`
          }
        ],
        max_tokens: 50,
        temperature: 0.9
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    let premise = response.data.choices[0].message.content.trim();
    
    // Ensure it's under 100 characters
    if (premise.length > 100) {
      premise = premise.substring(0, 97) + '...';
    }
    
    // Remove quotes if the AI added them
    premise = premise.replace(/^["'](.*)["']$/, '$1');
    
    return premise;
  } catch (error) {
    console.error('Error generating premise:', error);
    // Fallback premises in case the API fails
    const fallbackPremises = [
      "The forest whispered secrets as night fell.",
      "A strange door appeared in the middle of the sidewalk.",
      "The old lighthouse keeper saw something impossible on the horizon.",
      "Time stopped for everyone except the three of us."
    ];
    return fallbackPremises[Math.floor(Math.random() * fallbackPremises.length)];
  }
}const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
require('dotenv').config(); // For environment variables

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Serve front-end files

// Initialize story
let story = []; 
let players = ['Player 1', 'Player 2', 'Grok']; // Preset players
let currentTurn = 0;

// Array of prompt inspiration sources - used to direct the AI
const promptSources = [
  "trending news",
  "popular tweet",
  "viral social media post",
  "recent meme",
  "interesting fact",
  "historical event",
  "science discovery",
  "creative fiction",
  "philosophical question",
  "curious observation"
];

io.on('connection', (socket) => {
  console.log('User connected');
  
  // Assign a temporary player name based on socket ID
  const playerName = `Guest-${socket.id.substring(0, 5)}`;
  
  // If story is empty, generate an AI premise
  if (story.length === 0) {
    // First send a temporary message to all clients
    io.emit('premiseGenerating', true);
    
    // Generate the premise
    generateStoryPremise().then(premise => {
      story = [{ player: 'Host', text: premise }];
      
      // Send the initial state with the generated premise
      io.emit('init', { story, players, currentTurn });
      io.emit('premiseGenerating', false);
    });
  } else {
    // Send existing story state to new connection
    socket.emit('init', { story, players, currentTurn });
  }

  // Handle when a player submits a new sentence
  socket.on('addSentence', async (sentence) => {
    if (sentence.trim() && 
        sentence.length <= 100 && 
        story.length < 16 && // Limit to 15 turns + premise
        !/offensive|inappropriate/i.test(sentence)) {
      
      story.push({ player: players[currentTurn], text: sentence });
      currentTurn = (currentTurn + 1) % players.length; // Move to next player's turn
      
      // Broadcast update to all connected clients
      io.emit('update', { story, currentTurn });
      
      // If it's Grok's turn, generate an AI response
      if (players[currentTurn] === 'Grok' && story.length < 16) {
        // Let clients know Grok is thinking
        io.emit('grokThinking', true);
        
        try {
          // Get previous sentences to use as context
          const previousSentences = story.map(s => s.text).join(' ');
          
          // Generate a response using an AI API
          // This is a simplified example - in a real implementation, you would call an actual AI API
          const grokResponse = await generateAIResponse(previousSentences);
          
          // Add Grok's response to the story
          story.push({ player: 'Grok', text: grokResponse });
          currentTurn = (currentTurn + 1) % players.length; // Move to next player's turn
          
          // Broadcast the update with Grok's contribution
          io.emit('update', { story, currentTurn });
          io.emit('grokThinking', false);
        } catch (error) {
          console.error('AI response generation failed:', error);
          io.emit('grokThinking', false);
        }
      }
      
      // Enable video generation after story is complete
      if (story.length >= 16) {
        io.emit('storyComplete', true);
      }
    } else {
      socket.emit('error', 'Invalid sentence: too long, offensive, or inappropriate');
    }
  });

  // Function to generate AI response
async function generateAIResponse(context) {
  try {
    // If you're using OpenAI's API
    const apiKey = process.env.OPENAI_API_KEY || 'your-api-key';
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
            content: `Here's the story so far: "${context}". Continue with a single sentence.`
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
    console.error('Error generating AI response:', error);
    return "The wind rustled through the leaves, carrying whispers of ancient secrets.";
  }
}

// Handle video generation request
  socket.on('generateVideo', async () => {
    const storyText = story.map(s => s.text).join(' ');
    
    try {
      // This is a placeholder for the actual API call to Runway Gen-2 or similar
      // In a real implementation, you would replace this with your actual API key and endpoint
      const response = await axios.post('https://api.runwayml.com/v1/generate', {
        text: storyText,
        style: 'animation'
      }, {
        headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
      });
      
      // Assuming the API returns a video URL
      const videoUrl = response.data.videoUrl;
      io.emit('videoReady', videoUrl);
    } catch (error) {
      console.error('Video generation failed:', error);
      // Send a placeholder or error message back to the client
      io.emit('videoReady', 'https://example.com/placeholder-video.mp4');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Use environment port or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
