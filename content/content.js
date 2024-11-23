// Add console logs for debugging
console.log('NoRot content script loaded');

async function checkText(text) {
    console.log('Checking text:', text);

    // Remove any existing popups if text is empty or too short
    if (!text || text.length < 3) {
        removeSuggestionPopup();
        return { needsUpdate: false, suggestedText: '' };
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/check_brainrot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', data);

        return {
            needsUpdate: data.brainrot,
            suggestedText: data.alternative.replace("\"", "").replace("\"", "") || '',
            analysis: data.analysis,
            foundTerms: data.found_terms
        };
    } catch (error) {
        console.error('Error calling brainrot API:', error);
        // Return false in case of error to avoid showing suggestions
        return {
            needsUpdate: false,
            suggestedText: '',
            analysis: '',
            foundTerms: []
        };
    }
}

// Create and manage suggestion popup
function createSuggestionPopup(suggestedText, inputElement, onAccept, onDecline, analysis = '', foundTerms = []) {
    console.log('Creating suggestion popup for text:', suggestedText);

    if (!document.body) {
        console.error('Document body not ready');
        return;
    }

    removeSuggestionPopup();

    const popup = document.createElement('div');
    popup.id = 'norot-suggestion-box';
    popup.style.position = 'absolute';
    popup.style.zIndex = '2147483647';

    popup.innerHTML = `
        <div class="norot-suggestion-content">
            <div class="norot-header">
                <img src="${chrome.runtime.getURL('images/icon.png')}" class="norot-icon" alt="NoRot">
                <p>Suggestion Available</p>
            </div>
            ${foundTerms.length > 0 ? `
                <div class="norot-terms-found">
                    <p>Found terms: ${foundTerms.join(', ')}</p>
                </div>
            ` : ''}
            <div class="norot-suggestion-text">
                <p class="suggestion-text-content">${suggestedText}</p>
                <button class="norot-expand" style="display: none;">Show More</button>
            </div>
            <div class="norot-buttons">
                <button class="norot-decline">Dismiss</button>
                <button class="norot-accept">Accept</button>
            </div>
        </div>
    `;

    // Add to document
    document.body.appendChild(popup);

    // Check for text overflow after adding to document
    const textContainer = popup.querySelector('.norot-suggestion-text');
    const textContent = popup.querySelector('.suggestion-text-content');
    const expandButton = popup.querySelector('.norot-expand');

    // Use setTimeout to ensure content is rendered
    setTimeout(() => {
        console.log('Checking overflow:', textContent.scrollHeight, textContent.clientHeight);
        if (textContent.scrollHeight > textContent.clientHeight) {
            console.log('Text overflows, showing expand button');
            expandButton.style.display = 'block';
            textContainer.style.marginBottom = '8px';

            // Add click handler for expand button with explicit function
            expandButton.onclick = (e) => {
                e.stopPropagation(); // Prevent drag handling
                console.log('Expand button clicked');
                showExpandedDialog(suggestedText, onAccept, onDecline);
                removeSuggestionPopup(); // Remove the small popup when showing dialog
            };
        }
    }, 100); // Increased timeout to ensure rendering

    // Position popup near the caret
    const caretPosition = getCaretPosition(inputElement);
    const popupRect = popup.getBoundingClientRect();

    // Adjust position to ensure popup stays within viewport
    let top = caretPosition.top + window.scrollY + 20;
    let left = caretPosition.left + window.scrollX;

    // Check right edge
    if (left + popupRect.width > window.innerWidth) {
        left = window.innerWidth - popupRect.width - 10;
    }

    // Check bottom edge
    if (top + popupRect.height > window.innerHeight) {
        top = caretPosition.top + window.scrollY - popupRect.height - 10;
    }

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;

    // Make popup draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    popup.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.closest('.norot-buttons')) return; // Don't drag when clicking buttons

        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === popup || e.target.parentNode === popup) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, popup);
        }
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }

    // Add button listeners
    popup.querySelector('.norot-accept').addEventListener('click', () => {
        onAccept();
        removeSuggestionPopup();
    });

    popup.querySelector('.norot-decline').addEventListener('click', () => {
        onDecline();
        removeSuggestionPopup();
    });
}

function removeSuggestionPopup() {
    const existingPopup = document.getElementById('norot-suggestion-box');
    if (existingPopup) {
        existingPopup.remove();
    }
}

function getCaretPosition(element) {
    // Ensure body exists
    if (!document.body) {
        console.error('Document body not ready');
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left
        };
    }

    // For input/textarea elements
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        const rect = element.getBoundingClientRect();
        let caretPos = 0;

        try {
            caretPos = element.selectionStart;
        } catch (e) {
            console.error('Error getting caret position:', e);
            return {
                top: rect.top,
                left: rect.left
            };
        }

        // Create a temporary span to measure text width
        const temp = document.createElement('span');
        temp.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: pre;
            font-family: ${getComputedStyle(element).fontFamily};
            font-size: ${getComputedStyle(element).fontSize};
        `;

        const textBeforeCaret = element.value.substring(0, caretPos);
        temp.textContent = textBeforeCaret;
        document.body.appendChild(temp);

        const textWidth = temp.getBoundingClientRect().width;
        document.body.removeChild(temp);

        return {
            top: rect.top,
            left: rect.left + textWidth
        };
    }

    // For contenteditable elements
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX
        };
    }

    // Fallback to element position
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX
    };
}

// Debounce function to prevent too frequent checks
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to handle text input
async function handleTextInput(e) {
    console.log('Input event detected');
    const inputElement = e.target;
    let text;

    if (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement) {
        text = inputElement.value.trim(); // Add trim() to handle whitespace
    } else if (inputElement.isContentEditable) {
        text = inputElement.textContent.trim(); // Add trim() to handle whitespace
    } else {
        return; // Exit if not a valid text input
    }

    // Remove popup if text is empty
    if (!text) {
        removeSuggestionPopup();
        return;
    }

    console.log('Input text:', text);

    const result = await checkText(text);
    console.log('Check result:', result);

    if (result.needsUpdate) {
        console.log('Creating popup with suggestion');
        createSuggestionPopup(
            result.suggestedText,
            inputElement,
            () => {
                console.log('Suggestion accepted');
                if (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement) {
                    inputElement.value = result.suggestedText;
                } else {
                    inputElement.textContent = result.suggestedText;
                }
                chrome.storage.local.get(['suggestionsCount', 'acceptedCount', 'totalTextCount'], (result) => {
                    chrome.storage.local.set({
                        suggestionsCount: (result.suggestionsCount || 0) + 1,
                        acceptedCount: (result.acceptedCount || 0) + 1,
                        totalTextCount: (result.totalTextCount || 0) + 1
                    });
                });
            },
            () => {
                console.log('Suggestion declined');
                chrome.storage.local.get(['suggestionsCount', 'totalTextCount'], (result) => {
                    chrome.storage.local.set({
                        suggestionsCount: (result.suggestionsCount || 0) + 1,
                        totalTextCount: (result.totalTextCount || 0) + 1
                    });
                });
            },
            result.analysis,
            result.foundTerms
        );
    }
}

// Create debounced version of handler
const debouncedHandler = debounce(handleTextInput, 1000); // Will trigger 1 second after user stops typing

// Add listeners to the page
function addInputListeners() {
    console.log('Adding input listeners');
    // For regular input fields and textareas
    document.addEventListener('input', (e) => {
        const isTextInput = e.target.matches('input[type="text"], textarea, [contenteditable="true"]');
        console.log('Input event on element:', e.target, 'Is text input:', isTextInput);
        if (isTextInput) {
            debouncedHandler(e);
        }
    }, true);
}

// Move style injection into init function
const injectStyles = () => {
    if (!document.head) return;
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        #norot-suggestion-box {
            z-index: 2147483647;
            cursor: move;
            user-select: none;
            max-width: 300px;
        }

        .norot-suggestion-content {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 16px;
        }

        .norot-suggestion-text {
            position: relative;
            margin: 12px 0;
        }

        .suggestion-text-content {
            max-height: 100px;
            overflow: hidden;
            margin: 0;
            padding: 0;
            font-size: 14px;
            line-height: 1.5;
            color: #374151;
        }

        /* Gradient fade effect for overflow */
        .norot-suggestion-text::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: linear-gradient(transparent, white);
            pointer-events: none;
        }

        .norot-expand {
            display: none; /* Hidden by default, shown when needed */
            width: 100%;
            padding: 6px;
            margin-top: 8px;
            background: #EEF2FF;
            border: none;
            border-radius: 4px;
            color: #4F46E5;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background-color 0.2s ease;
        }

        .norot-expand:hover {
            background: #E0E7FF;
        }

        .norot-buttons button {
            cursor: pointer;
        }

        .norot-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2147483648;
        }

        .norot-dialog {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .norot-dialog-content {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .norot-dialog-header {
            display: flex;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #E5E7EB;
        }

        .norot-dialog-header h2 {
            margin: 0 0 0 12px;
            flex-grow: 1;
            font-size: 18px;
            color: #374151;
        }

        .norot-dialog-close {
            background: none;
            border: none;
            font-size: 24px;
            color: #6B7280;
            cursor: pointer;
            padding: 4px 8px;
        }

        .norot-dialog-body {
            padding: 16px;
            overflow-y: auto;
            max-height: 60vh;
        }

        .norot-dialog-body p {
            margin: 0;
            line-height: 1.5;
            color: #374151;
        }

        .norot-dialog-footer {
            padding: 16px;
            border-top: 1px solid #E5E7EB;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }

        .norot-dialog-footer button {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
        }

        .norot-dialog-accept {
            background: #4F46E5;
            color: white;
        }

        .norot-dialog-accept:hover {
            background: #4338CA;
        }

        .norot-dialog-decline {
            background: #F3F4F6;
            color: #374151;
        }

        .norot-dialog-decline:hover {
            background: #E5E7EB;
        }
    `;
    document.head.appendChild(styleSheet);
};

// Create an initialization function
function initNoRot() {
    console.log('Initializing NoRot');

    // Inject styles
    injectStyles();

    // Add input listeners
    addInputListeners();
}

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNoRot);
} else {
    initNoRot();
}

// Add new function to show expanded dialog
function showExpandedDialog(suggestedText, onAccept, onDecline) {
    const overlay = document.createElement('div');
    overlay.className = 'norot-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'norot-dialog';

    dialog.innerHTML = `
        <div class="norot-dialog-content">
            <div class="norot-dialog-header">
                <img src="${chrome.runtime.getURL('images/icon.png')}" class="norot-icon" alt="NoRot">
                <h2>Suggested Text</h2>
                <button class="norot-dialog-close">&times;</button>
            </div>
            <div class="norot-dialog-body">
                <p>${suggestedText}</p>
            </div>
            <div class="norot-dialog-footer">
                <button class="norot-dialog-decline">Dismiss</button>
                <button class="norot-dialog-accept">Accept</button>
            </div>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Add event listeners
    const closeBtn = dialog.querySelector('.norot-dialog-close');
    const acceptBtn = dialog.querySelector('.norot-dialog-accept');
    const declineBtn = dialog.querySelector('.norot-dialog-decline');

    closeBtn.addEventListener('click', () => {
        overlay.remove();
    });

    acceptBtn.addEventListener('click', () => {
        onAccept();
        overlay.remove();
    });

    declineBtn.addEventListener('click', () => {
        onDecline();
        overlay.remove();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}
