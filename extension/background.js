chrome.action.onClicked.addListener((tab) => {
  // Take screenshot of the visible chart
  chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 90 }, (dataUrl) => {

    // Try sending message first (works if script is already loaded)
    chrome.tabs.sendMessage(tab.id, {
      type: 'ANALYZE_CHART',
      image: dataUrl
    }).catch((err) => {
      // If "Receiving end does not exist", dynamically inject the content scripts and try again
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css']
      });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        // Send again after injection
        chrome.tabs.sendMessage(tab.id, {
          type: 'ANALYZE_CHART',
          image: dataUrl
        });
      });
    });

  });
});
