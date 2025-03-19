// Add this file to your project root
// Run with: node auto-debug.js

const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

console.log('=== StoryWeave Automatic Debugging ===');

// 1. Check if .env file exists and has the required keys
console.log('\n🔍 Checking environment variables...');
try {
  if (fs.existsSync('.env')) {
    console.log('✅ .env file found');
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('OPENAI_API_KEY')) {
      console.log('✅ OPENAI_API_KEY found in .env file');
    } else {
      console.log('❌ OPENAI_API_KEY not found in .env file');
    }
  } else {
    console.log('❌ .env file not found');
  }
} catch (err) {
  console.error('Error checking .env file:', err);
}

// 2. Validate OpenAI API key
console.log('\n🔍 Validating OpenAI API key...');
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.log('❌ OPENAI_API_KEY not found in environment variables');
} else {
  console.log('✅ OPENAI_API_KEY found in environment variables');
  
  // Test the API key with a simple request
  axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Say 'API key is working!' if you receive this message."
        }
      ],
      max_tokens: 10
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  ).then(response => {
    console.log('✅ OpenAI API key is valid and working');
    console.log('   Response:', response.data.choices[0].message.content);
  }).catch(error => {
    console.log('❌ OpenAI API key validation failed');
    if (error.response) {
      console.log('   Error:', error.response.status, error.response.data);
    } else {
      console.log('   Error:', error.message);
    }
  });
}

// 3. Check server.js for premise generation function
console.log('\n🔍 Checking server code...');
try {
  if (fs.existsSync('server.js')) {
    console.log('✅ server.js file found');
    const serverContent = fs.readFileSync('server.js', 'utf8');
    
    // Check if key functions exist
    if (serverContent.includes('generateStoryPremise')) {
      console.log('✅ generateStoryPremise function found');
    } else {
      console.log('❌ generateStoryPremise function not found in server.js');
    }
    
    if (serverContent.includes('premiseGenerating')) {
      console.log('✅ premiseGenerating event emission found');
    } else {
      console.log('❌ premiseGenerating event emission not found in server.js');
    }
    
    if (serverContent.includes('story.length === 0')) {
      console.log('✅ Empty story check logic found');
    } else {
      console.log('❌ Empty story check logic not found in server.js');
    }
  } else {
    console.log('❌ server.js file not found');
  }
} catch (err) {
  console.error('Error checking server.js file:', err);
}

// 4. Check client-side code
console.log('\n🔍 Checking client code...');
try {
  if (fs.existsSync('public/script.js')) {
    console.log('✅ script.js file found');
    const scriptContent = fs.readFileSync('public/script.js', 'utf8');
    
    // Check if event listeners exist
    if (scriptContent.includes('socket.on(\'premiseGenerating\'')) {
      console.log('✅ premiseGenerating event listener found');
    } else {
      console.log('❌ premiseGenerating event listener not found in script.js');
    }
    
    if (scriptContent.includes('socket.on(\'init\'')) {
      console.log('✅ init event listener found');
    } else {
      console.log('❌ init event listener not found in script.js');
    }
  } else {
    console.log('❌ script.js file not found');
  }
} catch (err) {
  console.error('Error checking script.js file:', err);
}

// 5. Add instrumentation to server.js
console.log('\n🔧 Adding debug instrumentation to server.js...');
try {
  if (fs.existsSync('server.js')) {
    let serverContent = fs.readFileSync('server.js', 'utf8');
    
    // Add debug log at the beginning of the connection handler
    if (serverContent.includes('io.on(\'connection\'')) {
      if (!serverContent.includes('console.log(\'DEBUG:')) {
        serverContent = serverContent.replace(
          'io.on(\'connection\', (socket) => {',
          'io.on(\'connection\', (socket) => {\n  console.log(\'DEBUG: Socket connected, story length:\', story.length);'
        );
        
        // Add debug log before premise generation
        serverContent = serverContent.replace(
          'if (story.length === 0) {',
          'if (story.length === 0) {\n    console.log(\'DEBUG: Story empty, generating premise\');'
        );
        
        // Add debug log in generateStoryPremise function
        serverContent = serverContent.replace(
          'async function generateStoryPremise() {',
          'async function generateStoryPremise() {\n  console.log(\'DEBUG: generateStoryPremise function called\');'
        );
        
        // Add fallback timeout for premise generation
        if (serverContent.includes('generateStoryPremise().then(premise =>')) {
          serverContent = serverContent.replace(
            'generateStoryPremise().then(premise =>',
            'let premiseTimeout = setTimeout(() => {\n' +
            '      console.log(\'DEBUG: Premise generation timeout, using fallback\');\n' +
            '      const fallbackPremise = "The adventure began with an unexpected discovery.";\n' +
            '      story = [{ player: \'Host\', text: fallbackPremise }];\n' +
            '      io.emit(\'init\', { story, players, currentTurn });\n' +
            '      io.emit(\'premiseGenerating\', false);\n' +
            '    }, 10000);\n\n' +
            '    generateStoryPremise().then(premise =>'
          );
          
          // Add timeout clear
          serverContent = serverContent.replace(
            'io.emit(\'premiseGenerating\', false);',
            'io.emit(\'premiseGenerating\', false);\n      clearTimeout(premiseTimeout);'
          );
        }
        
        fs.writeFileSync('server.js.debug', serverContent);
        console.log('✅ Debug instrumentation added to server.js.debug');
        console.log('   To use: rename server.js.debug to server.js and restart the server');
      } else {
        console.log('ℹ️ Debug instrumentation already present in server.js');
      }
    } else {
      console.log('❌ Could not locate connection handler in server.js');
    }
  }
} catch (err) {
  console.error('Error adding instrumentation:', err);
}

console.log('\n=== Debugging Complete ===');
console.log('\nNext steps:');
console.log('1. Check if any issues were identified above');
console.log('2. Rename server.js.debug to server.js to apply debugging instrumentation');
console.log('3. Restart your server and check the logs for DEBUG: entries');
console.log('4. If using Heroku, set environment variables with: heroku config:set OPENAI_API_KEY=your-key');
