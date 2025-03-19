# storyweaver
# StoryWeave - Collaborative Storytelling Game

StoryWeave is a real-time collaborative storytelling game where players take turns adding sentences to create a story together. Once complete, the story can be turned into a video using AI.

## Features

- Real-time storytelling with multiple players
- No login required - just join and start contributing
- Turn-based gameplay with automatic progression
- Sentence moderation and length limits
- AI-powered video generation from completed stories
- Responsive design for both desktop and mobile

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.IO
- **Video Generation**: Runway Gen-2 API (or similar)
- **Deployment**: Heroku/Vercel + Custom Domain

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (included with Node.js)
- A code editor (like VS Code)
- Git (optional, for version control)

### Local Development

1. Clone this repository or download the files
2. Navigate to the project directory in your terminal
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser and visit `http://localhost:3000`

### API Key Setup

For video generation to work, you need to:

1. Sign up for an API key from [Runway Gen-2](https://runwayml.com) or similar text-to-video service
2. Replace `YOUR_API_KEY` in `server.js` with your actual API key

## Deployment

### Heroku Deployment

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Log in to Heroku and create a new app:
   ```
   heroku login
   heroku create storyweave-app
   ```
3. Deploy your app:
   ```
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```
4. Open your app:
   ```
   heroku open
   ```

### Custom Domain Setup

1. Register a domain (free options available at [Freenom](https://freenom.com))
2. Configure DNS settings to point to your Heroku app
3. Add the domain to your Heroku app:
   ```
   heroku domains:add yourdomain.com
   ```

## Project Structure

- `server.js` - Node.js server using Express and Socket.IO
- `public/` - Frontend files
  - `index.html` - Main HTML structure
  - `styles.css` - CSS styling
  - `script.js` - Frontend JavaScript logic

## Customization Options

- Change the story premise in `server.js`
- Adjust player names or add more in `server.js`
- Modify the background image in `styles.css`
- Customize colors and styling in `styles.css`
- Change sentence character limits in `server.js`

## License

MIT

## Acknowledgements

- [Socket.IO](https://socket.io) for real-time communication
- [Express](https://expressjs.com) for the backend server
- [RunwayML](https://runwayml.com) for video generation API
