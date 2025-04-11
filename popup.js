document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    chrome.storage.sync.get(['notifications'], function(data) {
      document.getElementById('notifications').checked = data.notifications !== false;
    });
  
    // Save settings when changed
    document.getElementById('notifications').addEventListener('change', function() {
      chrome.storage.sync.set({ notifications: this.checked });
    });
  });