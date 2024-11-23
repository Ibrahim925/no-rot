document.addEventListener('DOMContentLoaded', () => {
    // Get stored stats or initialize them
    updateStats();

    // Add reset button listener
    document.getElementById('reset-stats').addEventListener('click', () => {
        chrome.storage.local.clear(() => {
            console.log('Storage cleared');
            updateStats(); // Refresh the display
        });
    });
});

function updateStats() {
    chrome.storage.local.get(['suggestionsCount', 'acceptedCount', 'totalTextCount'], (result) => {
        const suggestionsCount = result.suggestionsCount || 0;
        const acceptedCount = result.acceptedCount || 0;
        const totalTextCount = result.totalTextCount || 0;

        // Calculate percentages
        const improvementRate = totalTextCount > 0
            ? Math.round((suggestionsCount / totalTextCount) * 100)
            : 0;
        const acceptanceRate = suggestionsCount > 0
            ? Math.round((acceptedCount / suggestionsCount) * 100)
            : 0;

        // Update the stats display
        document.getElementById('suggestions-count').textContent = suggestionsCount;
        document.getElementById('accepted-count').textContent = acceptedCount;
        document.getElementById('improvement-rate').textContent = `${improvementRate}%`;
        document.getElementById('acceptance-rate').textContent = `${acceptanceRate}%`;
    });
}
