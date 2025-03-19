const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Serve front-end files

// Initialize story with a premise
let story = [{ player: 'Host', text: 'The forest whispered secrets as night fell.' }]; 
let players = ['Player 1', 'Player 2', 'Grok']; // Preset players
let currentTurn = 0;

io.on('connection', (socket) => {
  console.log('User connected');
  
  // Assign a temporary player name based on socket ID
  const playerName = `Guest-${socket.id.substring(0, 5)}`;
  
  // Send initial state to the new connection
  socket.emit('init', { story, players, currentTurn });

  // Handle when a player submits a new sentence
  socket.on('addSentence', (sentence) => {
    if (sentence.trim() && 
        sentence.length <= 100 && 
        story.length < 16 && // Limit to 15 turns + premise
        !/offensive|inappropriate/i.test(sentence)) {
      
      story.push({ player: players[currentTurn], text: sentence });
      currentTurn = (currentTurn + 1) % players.length; // Move to next player's turn
      
      // Broadcast update to all connected clients
      io.emit('update', { story, currentTurn });
      
      // Enable video generation after story is complete
      if (story.length >= 16) {
        io.emit('storyComplete', true);
      }
    } else {
      socket.emit('error', 'Invalid sentence: too long, offensive, or inappropriate');
    }
  });

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
