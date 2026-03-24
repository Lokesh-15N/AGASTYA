chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'ANALYZE_CHART') {
    let overlay = document.getElementById('sheep-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sheep-overlay';
      overlay.innerHTML = `
        <button id="sheep-close">×</button>
        <h3>🐑 AI Chart Analysis</h3>
        <div id="sheep-results"><div class="spinner"></div> Scanning candlesticks...</div>
      `;
      document.body.appendChild(overlay);

      document.getElementById('sheep-close').addEventListener('click', () => {
        overlay.remove();
      });
    } else {
      document.getElementById('sheep-results').innerHTML = '<div class="spinner"></div> Scanning candlesticks...';
    }

    try {
      // Send base64 image to local FastAPI
      const res = await fetch('http://localhost:8000/analyze-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_data: request.image })
      });

      if (!res.ok) throw new Error('API Error: Is the SheepOrSleep backend running?');

      const data = await res.json();

      // Render markdown or plain text roughly
      document.getElementById('sheep-results').innerHTML = data.analysis.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>');
    } catch (e) {
      document.getElementById('sheep-results').innerHTML = `<span style="color:#f43f5e">🚨 Error: ${e.message}</span>`;
    }
  }
});
