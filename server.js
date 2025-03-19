const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
require('dotenv').config(); // For environment variables

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public')); // Serve front-end files

// Default story with initial premise
let story = [{ player: 'Host', text: 'The adventure began with an unexpected discovery.' }];
let players = ['Player 1', 'Player 2', 'Grok']; // Preset players
let currentTurn = 0;

// Archive to store completed stories
let storyArchive = [];

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

// Function to get a random premise
function getRandomPremise() {
  const randomIndex = Math.floor(Math.random() * fallbackPremises.length);
  return fallbackPremises[randomIndex];
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected');
  
  // Send initial state to the new connection with the default story
  socket.emit('init', { story, players, currentTurn, archive: storyArchive });
  
  // Handle when a player submits a new sentence
  socket.on('addSentence', async (sentence) => {
    console.log('Received sentence:', sentence);
    
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
        
        try {
          // Get AI response from OpenAI
          const grokResponse = await getGrokResponse();
          
          // Add Grok's response
          story.push({ player: 'Grok', text: grokResponse });
          currentTurn = (currentTurn + 1) % players.length;
          
          // Update clients
          io.emit('update', { story, currentTurn });
          io.emit('grokThinking', false);
        } catch (error) {
          console.error('Grok response error:', error);
          
          // Use a fallback response if AI fails
          const fallbackResponse = "The plot thickened as our journey continued into the unknown.";
          story.push({ player: 'Grok', text: fallbackResponse });
          currentTurn = (currentTurn + 1) % players.length;
          
          io.emit('update', { story, currentTurn });
          io.emit('grokThinking', false);
        }
      }
      
      // Enable video generation after story is complete
      if (story.length >= 16) {
        io.emit('storyComplete', true);
      }
    } else {
      // Send specific error message
      let errorMessage = '';
      if (!sentence.trim()) {
        errorMessage = 'Please enter a sentence.';
      } else if (sentence.length > 100) {
        errorMessage = 'Your sentence is too long (maximum 100 characters).';
      } else if (/offensive|inappropriate/i.test(sentence)) {
        errorMessage = 'Please avoid inappropriate content.';
      } else {
        errorMessage = 'Invalid sentence. Please try again.';
      }
      
      socket.emit('inputError', errorMessage);
    }
  });

  // Handle video generation request
  socket.on('generateVideo', async () => {
    io.emit('videoGenerating', true);
    
    try {
      // Get the complete story text
      const storyText = story.map(s => s.text).join(' ');
      console.log('Generating video for story:', storyText.substring(0, 100) + '...');
      
      // Try to use RunwayML's API if configured
      const videoApiKey = process.env.VIDEO_GEN_API_KEY;
      let videoUrl = null;
      let svgAnimation = null;
      
      if (videoApiKey) {
        try {
          // Make actual API call to RunwayML
          const response = await axios.post('https://api.runwayml.com/v1/inference', {
            model: "text-to-video",
            input: {
              prompt: storyText.substring(0, 500),  // Runway might have a character limit
              num_frames: 24,
              fps: 12
            }
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${videoApiKey}`
            },
            timeout: 60000 // 60 second timeout
          });
          
          // Handle successful response
          if (response.data && response.data.output && response.data.output.video_url) {
            videoUrl = response.data.output.video_url;
          }
        } catch (apiError) {
          console.error('RunwayML API error:', apiError.message);
          // Will fall through to the fallback option
        }
      }
      
      // If no video URL, generate a simple animated SVG as a fallback
      if (!videoUrl) {
        svgAnimation = generateSVGAnimation(storyText);
      }
      
      // Send video/animation to clients
      io.emit('videoReady', videoUrl, svgAnimation);
      io.emit('videoGenerating', false);
      
      // Create an archive entry for this story
      const timestamp = new Date().toISOString();
      const archiveEntry = {
        id: `story-${timestamp}`,
        date: timestamp,
        story: [...story], // Create a copy of the story
        videoUrl: videoUrl,
        svgAnimation: svgAnimation,
        title: generateStoryTitle(storyText)
      };
      
      // Add to archive
      storyArchive.unshift(archiveEntry); // Add to beginning of array
      
      // Keep archive limited to last 10 stories
      if (storyArchive.length > 10) {
        storyArchive = storyArchive.slice(0, 10);
      }
      
      // Notify clients about the archive update
      io.emit('archiveUpdated', storyArchive);
      
    } catch (error) {
      console.error('Video generation error:', error);
      io.emit('videoGenerating', false);
      io.emit('error', 'Failed to generate video. Please try again.');
    }
  });
  
  // Handle request to start a new story
  socket.on('startNewStory', () => {
    console.log('Starting new story');
    
    // Generate a new premise
    const newPremise = getRandomPremise();
    
    // Reset story with new premise
    story = [{ player: 'Host', text: newPremise }];
    currentTurn = 0;
    
    // Broadcast the new story to all clients
    io.emit('newStory', { story, currentTurn });
  });
  
  // Handle a request to view the archive
  socket.on('requestArchive', () => {
    socket.emit('archiveData', storyArchive);
  });
});

// Function to generate a title for the archived story
function generateStoryTitle(storyText) {
  // Extract keywords
  const words = storyText.split(' ');
  const significantWords = words.filter(word => 
    word.length > 4 && 
    !/^(the|and|but|for|from|with|this|that|these|those|when|where)$/i.test(word)
  );
  
  // Select a few words for the title
  let titleWords = [];
  if (significantWords.length >= 3) {
    // Pick 2-3 significant words
    const indexes = [
      Math.floor(Math.random() * significantWords.length),
      Math.floor(Math.random() * significantWords.length)
    ];
    
    // Make sure indexes are different
    while (indexes[0] === indexes[1] && significantWords.length > 1) {
      indexes[1] = Math.floor(Math.random() * significantWords.length);
    }
    
    titleWords = indexes.map(i => significantWords[i]);
  } else if (significantWords.length > 0) {
    // Just use what we have
    titleWords = [significantWords[0]];
  }
  
  // Add a prefix
  const prefixes = ["The Tale of", "Journey to", "Chronicles of", "Whispers of", "Echoes from", "Shadows of", "Legends of"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  // Construct the title
  if (titleWords.length > 0) {
    const titleBase = titleWords.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    return `${prefix} ${titleBase}`;
  }
  
  // Fallback title if no good words found
  return `${prefix} the Unknown`;
}

// Function to get Grok's response from OpenAI
async function getGrokResponse() {
  // Get the story context for the AI
  const previousSentences = story.map(s => s.text).join(' ');
  
  try {
    // Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('No OpenAI API key found, using fallback');
      throw new Error('No API key');
    }
    
    console.log('Making request to OpenAI API');
    
    // Make request to OpenAI API
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
            content: `Here's the story so far: "${previousSentences}". Continue with a single sentence (max 100 characters).`
          }
        ],
        max_tokens: 50,
        temperature: 0.8
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 10000 // 10 second timeout
      }
    );

    // Process the AI response
    let aiResponse = response.data.choices[0].message.content.trim();
    console.log('Raw AI response:', aiResponse);
    
    // Ensure it's just one sentence and under 100 characters
    if (aiResponse.length > 100) {
      aiResponse = aiResponse.substring(0, 97) + '...';
    }
    
    // Remove quotes if the AI added them
    aiResponse = aiResponse.replace(/^["'](.*)["']$/, '$1');
    
    return aiResponse;
  } catch (error) {
    console.error('Error getting AI response:', error.message);
    
    // Generate a fallback response based on story context
    const fallbackResponses = [
      "The plot thickened as shadows danced across the ancient walls.",
      "A whisper of wind carried secrets through the narrow streets.",
      "The mysterious object glinted in the moonlight, revealing hidden symbols.",
      "Something stirred in the darkness, watching our every move.",
      "The clock struck midnight, and everything changed in an instant."
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

// Function to generate a simple SVG animation as fallback for video
function generateSVGAnimation(storyText) {
  // Generate a color based on the story content
  const hashCode = storyText.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);
  
  const hue = Math.abs(hashCode % 360);
  const mainColor = `hsl(${hue}, 80%, 60%)`;
  const secondaryColor = `hsl(${(hue + 180) % 360}, 80%, 60%)`;
  
  // Create a simple animated SVG based on the story
  const words = storyText.split(' ').filter(word => word.length > 3).slice(0, 10);
  
  // Create SVG elements for each significant word
  let wordElements = '';
  words.forEach((word, index) => {
    const x = 20 + (index % 3) * 160;
    const y = 50 + Math.floor(index / 3) * 80;
    const delay = index * 0.5;
    
    wordElements += `
      <text x="${x}" y="${y}" font-family="Arial" font-size="20" fill="${mainColor}"
        opacity="0" transform="scale(0.5)">
        <animate attributeName="opacity" from="0" to="1" dur="2s" begin="${delay}s" fill="freeze" />
        <animate attributeName="transform" from="scale(0.5)" to="scale(1)" dur="1.5s" begin="${delay}s" fill="freeze" />
        ${word}
      </text>
    `;
  });
  
  // Create some animated shapes
  let shapes = '';
  for (let i = 0; i < 5; i++) {
    const cx = 50 + i * 100;
    const cy = 200;
    const r = 20 + (i * 5);
    const delay = i * 0.7;
    
    shapes += `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${secondaryColor}" stroke-width="2"
        stroke-dasharray="126" stroke-dashoffset="126">
        <animate attributeName="stroke-dashoffset" from="126" to="0" dur="3s" begin="${delay}s" fill="freeze" />
        <animate attributeName="cy" from="${cy}" to="${cy - 50}" dur="4s" begin="${delay + 1}s" repeatCount="indefinite" />
      </circle>
    `;
  }
  
  // Create the final SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="500" height="300" style="background-color: #121212;">
      <rect width="500" height="300" fill="#121212" />
      
      ${wordElements}
      ${shapes}
      
      <text x="250" y="280" font-family="Arial" font-size="12" fill="#ffffff" text-anchor="middle">
        StoryWeave: A Collaborative Tale
      </text>
    </svg>
  `;
  
  return svg;
}

// Use environment port or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
