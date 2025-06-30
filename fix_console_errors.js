// Fix for missing loadSavedStories function
function loadSavedStories() {
  console.log('[WanderLog] Loading saved stories...');
  const API_ENDPOINT = 'http://localhost:8080';
  
  fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ action: 'get_stories' })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('[WanderLog] Loaded stories:', data);
    if (data.stories && Array.isArray(data.stories)) {
      console.log(`[WanderLog] Found ${data.stories.length} stories`);
      // TODO: If you have a displayStories function, call it here:
      // displayStories(data.stories);
    } else {
      console.log('[WanderLog] No stories found or invalid data format');
    }
  })
  .catch(err => {
    console.error('[WanderLog] Failed to load stories:', err);
    // Don't show error to user - just log it
  });
}

// Also fix any potential null reference errors
function safeSetTextContent(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  } else {
    console.warn(`[WanderLog] Element with id '${elementId}' not found`);
  }
}

// Export for use in HTML
window.loadSavedStories = loadSavedStories;
window.safeSetTextContent = safeSetTextContent; 