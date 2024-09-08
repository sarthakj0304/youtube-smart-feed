document.addEventListener('DOMContentLoaded', function() {
  const EXTENSION_ENABLED_KEY = 'settings:extension_enabled';
  const toggle = document.getElementById('extension-toggle');

  if (toggle) {
    // Retrieve the saved state from chrome.storage.sync
    chrome.storage.sync.get([EXTENSION_ENABLED_KEY], function(result) {
      toggle.checked = result[EXTENSION_ENABLED_KEY] || false; // Default to false if not set
    });

    // Save the state when checkbox is changed
    toggle.addEventListener('change', function() {
      chrome.storage.sync.set({ [EXTENSION_ENABLED_KEY]: toggle.checked }, function() {
        console.log('Extension state is ' + (toggle.checked ? 'enabled' : 'disabled'));

        // Reload the current active tab to apply the changes
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          chrome.tabs.reload(tabs[0].id);
        });
      });
    });
  } else {
    console.error('Toggle checkbox element not found!');
  }
});
