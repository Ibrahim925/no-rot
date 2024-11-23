# NoRot Browser Extension

NoRot is a Chrome extension that helps users communicate more meaningfully by detecting and suggesting alternatives to internet slang, memes, and "brainrot" content.

## Features

- Real-time text analysis for "brainrot" content
- Smart suggestions for more meaningful alternatives
- Draggable suggestion popup with expandable view
- Statistics tracking for suggestions and acceptance rate
- Support for text inputs, textareas, and contenteditable elements

## Installation

### Prerequisites
- Python 3.7+
- Node.js (for development)
- Chrome browser

### Backend Setup
1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your OpenAI API keys:
   ```
   OPENAI_API_KEY=your-key-here
   OPENAI_EMBEDDINGS_KEY=your-embeddings-key-here
   ```
5. Start the backend server:
   ```bash
   python main.py
   ```

### Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension directory
4. The NoRot icon should appear in your Chrome toolbar

## Usage

1. Type in any text input field on any website
2. After a brief pause in typing, NoRot will analyze your text
3. If "brainrot" content is detected, a suggestion popup will appear
4. You can:
   - Accept the suggestion to replace your text
   - Dismiss the suggestion
   - Click "Show More" to see the full analysis
   - Drag the popup to a different position

## Development

### Project Structure
