chrome.runtime.onInstalled.addListener(() => {
    console.log('NoRot extension installed');
    // Initialize storage with default values
    chrome.storage.local.set({
        suggestionsCount: 0,
        acceptedCount: 0,
        totalTextCount: 0
    });
});

// Add message listener for debugging
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
});
