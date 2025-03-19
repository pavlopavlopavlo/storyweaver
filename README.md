# StoryWeave - AI-Enhanced Collaborative Storytelling

StoryWeave is a real-time collaborative storytelling platform where players take turns adding sentences to create a story together. The experience is enhanced with AI-generated story premises and an intelligent AI storyteller named Grok who actively participates in the narrative.

![StoryWeave Banner](https://via.placeholder.com/800x200?text=StoryWeave)

## ✨ Features

- **AI-Generated Story Premises**: Every story begins with a unique, AI-crafted opening inspired by trending topics or creative fiction
- **Real-time Collaboration**: Multiple players contribute to the story with no login required
- **AI Storyteller**: Grok, an AI participant, adds creative sentences to the story during its turn
- **Turn-based Gameplay**: Automatic turn management ensures everyone gets a chance to contribute
- **Immersive Design**: Three.js powered interactive background and modern UI
- **Video Generation**: Convert completed stories into AI-generated videos
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (included with Node.js)
- OpenAI API key for AI features
- Optional: Runway Gen-2 API key for video generation

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/storyweave.git
   cd storyweave
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the project root
   - Add your API keys:
     ```
     OPENAI_API_KEY=your-openai-api-key
     VIDEO_GEN_API_KEY=your-video-api-key
     ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and visit `http://localhost:3000`

## 🤖 AI Features

### AI-Generated Story Premises

When a new story begins, StoryWeave automatically:

1. **Selects a random inspiration source** from categories like:
   - Trending news
   - Popular tweets
   - Viral social media
   - Science discoveries
   - Creative fiction
   - Philosophical questions

2. **Generates a unique premise** using OpenAI's API:
   - The AI crafts an intriguing first sentence (limited to 100 characters)
   - Each premise is fresh, relevant, and designed to spark creativity
   - The premise is visually highlighted in the story as a special starting point

3. **Provides real-time feedback**:
   - Users see an "AI is crafting an intriguing story premise..." message while waiting
   - The interface shows a pulsing animation during generation

### Grok - The AI Storyteller

Grok is an AI participant that takes its turn like any other player:

1. When it's Grok's turn, the server automatically:
   - Sends the current story to OpenAI's API
   - Requests a contextually appropriate continuation
   - Adds Grok's response to the story
   - Advances to the next player's turn

2. **Visual indicators**:
   - "Grok is thinking..." appears during AI generation
   - Pulsing animation indicates AI processing
   - Input is disabled during Grok's turn

### Customizing AI Behavior

You can modify Grok's personality by editing the system prompt in the `generateAIResponse` function in `server.js`:

```javascript
{
  role: "system",
  content: "You are Grok, a creative storyteller. Continue this collaborative story with a single sentence (max 100 characters) that builds on what came before. Be imaginative but appropriate."
}
```

## 🎬 Video Generation

After a story is complete (16 contributions including the premise), players can generate a video representation:

1. Click the "Generate Video" button
2. The server sends the story to the Runway Gen-2 API (or similar)
3. The resulting video is displayed in the player

This feature requires a valid video generation API key.

## 🎨 Visual Design

### Three.js Background

StoryWeave features an immersive animated background created with Three.js:

- Dynamic starfield with glowing particles
- Ethereal flowing lines
- Subtle color pulsing and movement
- Responsive design that adapts to screen size

### UI Design

The interface uses modern design principles:

- Glass-morphism effects with backdrop blur
- Dynamic shadows and subtle animations
- Color scheme inspired by cosmic themes
- Responsive layout for all screen sizes

## 🚢 Deployment

### Heroku Deployment

1. Create a [Heroku account](https://signup.heroku.com/)
2. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. From your project directory:
   ```
   heroku login
   heroku create storyweave-app
   git push heroku main
   ```

4. Set environment variables:
   ```
   heroku config:set OPENAI_API_KEY=your-api-key
   heroku config:set VIDEO_GEN_API_KEY=your-video-api-key
   ```

### Custom Domain Setup

1. Get a domain from a provider like Namecheap, GoDaddy, or Freenom
2. Add your domain to Heroku:
   ```
   heroku domains:add www.yourdomain.com
   heroku domains:add yourdomain.com
   ```
3. Configure DNS according to Heroku's instructions

## 📁 Project Structure

- `server.js` - Node.js server using Express and Socket.IO
- `public/` - Frontend files
  - `index.html` - Main HTML structure
  - `styles.css` - CSS styling
  - `script.js` - Frontend JavaScript logic
  - `background.js` - Three.js animation

## 🔧 Troubleshooting

### Common Issues

1. **"Cannot find module" error**:
   - Ensure you've run `npm install`
   - Check for typos in import statements

2. **Socket.IO connection issues**:
   - Check for CORS configuration
   - Verify client and server are using compatible versions

3. **AI generation not working**:
   - Verify your OpenAI API key
   - Check server logs for API errors
   - Ensure your API account has available credits

4. **Three.js background not showing**:
   - Check browser console for errors
   - Verify WebGL is enabled in your browser

### API Rate Limiting

Both OpenAI and video generation APIs have rate limits:

- Consider implementing usage tracking
- Add delays between requests if needed
- Monitor your API dashboard for usage metrics

## 🛠️ Customization Options

1. **Add more inspiration sources**:
   - Expand the `promptSources` array in `server.js`

2. **Change the visual theme**:
   - Modify colors in `styles.css`
   - Update the Three.js animation in `background.js`

3. **Adjust story constraints**:
   - Change the character limit (currently 100) in `server.js`
   - Modify the total number of turns (currently 15 plus premise)

4. **Add more players**:
   - Expand the `players` array in `server.js`

## 📝 License

MIT

## 🙏 Acknowledgements

- [Socket.IO](https://socket.io) for real-time communication
- [Express](https://expressjs.com) for the backend server
- [Three.js](https://threejs.org) for 3D animations
- [OpenAI](https://openai.com) for AI generation
- [Runway ML](https://runwayml.com) for video generation API
