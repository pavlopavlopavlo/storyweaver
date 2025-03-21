// Video Archiver for StoryWeave

class StoryArchive {
  constructor() {
    this.archiveContainer = null;
    this.archiveButton = null;
    this.resetButton = null;
    this.archiveList = null;
    this.archives = [];

    // Load archives from local storage
    this.loadArchives();
    
    // Initialize after the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', () => this.initialize());
  }

  initialize() {
    // Create and add archive UI elements
    this.createArchiveUI();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  createArchiveUI() {
    // Create archive container
    this.archiveContainer = document.createElement('div');
    this.archiveContainer.id = 'archive-container';
    this.archiveContainer.className = 'archive-container hidden';
    
    // Create archive header
    const archiveHeader = document.createElement('div');
    archiveHeader.className = 'archive-header';
    
    const archiveTitle = document.createElement('h2');
    archiveTitle.textContent = 'Story Archive';
    archiveHeader.appendChild(archiveTitle);
    
    // Create back button
    const backButton = document.createElement('button');
    backButton.id = 'back-to-story-btn';
    backButton.textContent = 'Back to Story';
    backButton.addEventListener('click', () => this.toggleArchiveView());
    archiveHeader.appendChild(backButton);
    
    this.archiveContainer.appendChild(archiveHeader);
    
    // Create archive list
    this.archiveList = document.createElement('div');
    this.archiveList.className = 'archive-list';
    this.archiveContainer.appendChild(this.archiveList);
    
    // Add archive container to the document
    document.querySelector('.container').appendChild(this.archiveContainer);
    
    // Create archive button in the header
    this.archiveButton = document.createElement('button');
    this.archiveButton.id = 'view-archive-btn';
    this.archiveButton.textContent = 'View Archive';
    this.archiveButton.addEventListener('click', () => this.toggleArchiveView());
    
    // Add archive button to the header
    const header = document.querySelector('header');
    header.appendChild(this.archiveButton);
    
    // Create reset button for after video generation
    this.resetButton = document.createElement('button');
    this.resetButton.id = 'new-story-btn';
    this.resetButton.textContent = 'Start New Story';
    this.resetButton.className = 'hidden';
    this.resetButton.addEventListener('click', () => this.resetStory());
    
    // Add reset button after the video button
    const videoArea = document.getElementById('video-area');
    videoArea.appendChild(this.resetButton);
  }

  setupEventListeners() {
    // Listen for video ready event
    socket.on('videoReady', (videoUrl, svgAnimation) => {
      // Show reset button
      this.resetButton.classList.remove('hidden');
      
      // Auto-archive the story
      this.archiveCurrentStory(videoUrl, svgAnimation);
    });
    
    // Listen for archive updates from server
    socket.on('archiveUpdated', (serverArchive) => {
      // Merge server archive with local archive
      this.mergeArchives(serverArchive);
    });
  }

  toggleArchiveView() {
    const mainContent = document.querySelector('main');
    
    if (this.archiveContainer.classList.contains('hidden')) {
      // Show archive
      mainContent.classList.add('hidden');
      this.archiveContainer.classList.remove('hidden');
      this.renderArchiveList();
    } else {
      // Hide archive
      mainContent.classList.remove('hidden');
      this.archiveContainer.classList.add('hidden');
    }
  }

  archiveCurrentStory(videoUrl, svgAnimation) {
    // Get the current story from the feed
    const storyFeed = document.getElementById('story-feed');
    const sentences = storyFeed.querySelectorAll('.sentence');
    const premise = storyFeed.querySelector('.premise');
    
    let storyText = '';
    let storyArray = [];
    
    // Add premise
    if (premise) {
      storyText += premise.textContent + ' ';
      storyArray.push({ player: 'Host', text: premise.textContent });
    }
    
    // Add sentences
    sentences.forEach(sentence => {
      const playerSpan = sentence.querySelector('.player-name');
      const playerName = playerSpan ? playerSpan.textContent.replace(':', '') : 'Unknown';
      
      // Get just the text without the player name
      let sentenceText = sentence.textContent;
      if (playerSpan) {
        sentenceText = sentenceText.substring(playerSpan.textContent.length).trim();
      }
      
      storyText += sentenceText + ' ';
      storyArray.push({ player: playerName, text: sentenceText });
    });
    
    // Generate a title based on the story
    const title = this.generateTitle(storyText);
    
    // Create archive entry
    const archiveEntry = {
      id: 'story-' + Date.now(),
      date: new Date().toISOString(),
      title: title,
      story: storyArray,
      storyText: storyText.trim(),
      videoUrl: videoUrl,
      svgAnimation: svgAnimation
    };
    
    // Add to archives
    this.archives.unshift(archiveEntry);
    
    // Save to local storage
    this.saveArchives();
    
    // Show notification
    this.showNotification('Story archived successfully!');
  }

  generateTitle(storyText) {
    // Extract keywords from the story
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

  resetStory() {
    // Request a new story from the server
    socket.emit('startNewStory');
    
    // Hide reset button
    this.resetButton.classList.add('hidden');
    
    // Clear video output
    const videoOutput = document.getElementById('video-output');
    videoOutput.innerHTML = '';
    
    // Show notification
    this.showNotification('Starting a new story!');
  }

  renderArchiveList() {
    // Clear existing content
    this.archiveList.innerHTML = '';
    
    if (this.archives.length === 0) {
      // Show message if no archives
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-archive-message';
      emptyMessage.textContent = 'No stories have been archived yet. Complete a story to see it here!';
      this.archiveList.appendChild(emptyMessage);
      return;
    }
    
    // Add each archive entry
    this.archives.forEach(entry => {
      const archiveCard = document.createElement('div');
      archiveCard.className = 'archive-card';
      
      // Add title
      const title = document.createElement('h3');
      title.textContent = entry.title;
      archiveCard.appendChild(title);
      
      // Add date
      const date = document.createElement('div');
      date.className = 'archive-date';
      date.textContent = new Date(entry.date).toLocaleString();
      archiveCard.appendChild(date);
      
      // Add preview
      const preview = document.createElement('div');
      preview.className = 'archive-preview';
      
      // If we have a video URL, show video, otherwise show SVG
      if (entry.videoUrl) {
        const video = document.createElement('video');
        video.controls = true;
        video.src = entry.videoUrl;
        preview.appendChild(video);
      } else if (entry.svgAnimation) {
        preview.innerHTML = entry.svgAnimation;
      } else {
        preview.textContent = 'No preview available';
      }
      
      archiveCard.appendChild(preview);
      
      // Add story excerpt
      const excerpt = document.createElement('div');
      excerpt.className = 'archive-excerpt';
      excerpt.textContent = entry.storyText.substring(0, 100) + (entry.storyText.length > 100 ? '...' : '');
      archiveCard.appendChild(excerpt);
      
      // Add view button
      const viewButton = document.createElement('button');
      viewButton.className = 'view-story-btn';
      viewButton.textContent = 'View Full Story';
      viewButton.addEventListener('click', () => this.viewFullStory(entry));
      archiveCard.appendChild(viewButton);
      
      this.archiveList.appendChild(archiveCard);
    });
  }

  viewFullStory(entry) {
    // Create modal for viewing the full story
    const modal = document.createElement('div');
    modal.className = 'story-modal';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add close button
    const closeButton = document.createElement('span');
    closeButton.className = 'close-modal';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => modal.remove());
    modalContent.appendChild(closeButton);
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = entry.title;
    modalContent.appendChild(title);
    
    // Add date
    const date = document.createElement('div');
    date.className = 'modal-date';
    date.textContent = new Date(entry.date).toLocaleString();
    modalContent.appendChild(date);
    
    // Add video/animation
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'modal-media';
    
    if (entry.videoUrl) {
      const video = document.createElement('video');
      video.controls = true;
      video.src = entry.videoUrl;
      mediaContainer.appendChild(video);
    } else if (entry.svgAnimation) {
      mediaContainer.innerHTML = entry.svgAnimation;
    }
    
    modalContent.appendChild(mediaContainer);
    
    // Add story content
    const storyContainer = document.createElement('div');
    storyContainer.className = 'modal-story';
    
    // Add each sentence with player attribution
    entry.story.forEach((sentence, index) => {
      const sentenceElement = document.createElement('div');
      
      if (index === 0) {
        // Format premise differently
        sentenceElement.className = 'modal-premise';
        sentenceElement.textContent = sentence.text;
      } else {
        sentenceElement.className = 'modal-sentence';
        
        const playerName = document.createElement('span');
        playerName.className = 'modal-player-name';
        playerName.textContent = sentence.player + ': ';
        
        sentenceElement.appendChild(playerName);
        sentenceElement.appendChild(document.createTextNode(sentence.text));
      }
      
      storyContainer.appendChild(sentenceElement);
    });
    
    modalContent.appendChild(storyContainer);
    
    // Add modal to page
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', event => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  }

  loadArchives() {
    try {
      const savedArchives = localStorage.getItem('storyweave-archives');
      if (savedArchives) {
        this.archives = JSON.parse(savedArchives);
      }
    } catch (error) {
      console.error('Error loading archives:', error);
      this.archives = [];
    }
  }

  saveArchives() {
    try {
      // Limit to 20 most recent stories
      const archivesToSave = this.archives.slice(0, 20);
      localStorage.setItem('storyweave-archives', JSON.stringify(archivesToSave));
    } catch (error) {
      console.error('Error saving archives:', error);
    }
  }

  mergeArchives(serverArchives) {
    if (!serverArchives || !Array.isArray(serverArchives)) return;
    
    // Create a map of existing archive IDs
    const existingIds = new Set(this.archives.map(entry => entry.id));
    
    // Add new entries from server
    serverArchives.forEach(serverEntry => {
      if (!existingIds.has(serverEntry.id)) {
        this.archives.push(serverEntry);
      }
    });
    
    // Sort by date (newest first)
    this.archives.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Save updated archives
    this.saveArchives();
    
    // Update the display if archive is visible
    if (!this.archiveContainer.classList.contains('hidden')) {
      this.renderArchiveList();
    }
  }

  showNotification(message, type = 'success') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      document.body.appendChild(notification);
    }
    
    // Set message and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.classList.add('show');
    
    // Hide after delay
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// Initialize the archive system
const storyArchive = new StoryArchive();
