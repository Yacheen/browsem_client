let audio = null;
let volume = null;
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== 'offscreen') return;
  if (msg.action === 'play') {
    if (audio) {
      audio.pause();
      audio.currentTime = 0; // Reset for quick consecutive sounds
    }
    if (volume) {
        const fetchedUrl = chrome.runtime.getURL(msg.path);
        audio = new Audio(fetchedUrl);
        audio.volume = volume / 100;
        audio.play();
    }
    else {
        const fetchedUrl = chrome.runtime.getURL(msg.path);
        audio = new Audio(fetchedUrl);
        audio.volume = 0.5;
        audio.play();
    }
  }
    else if (msg.action === 'change-volume') {
        volume = msg.newVolume;
    }
});
