# NoRot Browser Extension

NoRot is a Chrome extension designed to help young internet users break free from the cycle of repetitive internet slang and "brainrot" content. Our mission is to empower the next generation to communicate more meaningfully online, one message at a time.

## Why NoRot?

Today's youth are increasingly trapped in a cycle of:
- Mindless repetition of TikTok phrases
- Copy-paste meme responses
- "NPC-like" communication patterns
- Viral content references instead of original thoughts
- Shallow, trending internet slang

This "brainrot" content particularly affects young people by:
- Limiting their ability to develop unique communication styles
- Reducing their capacity for original thought and expression
- Creating social pressure to conform to internet speech patterns
- Making it harder to transition between casual and formal communication
- Affecting their ability to connect meaningfully with others

NoRot helps young users by:
1. Gently identifying when they're falling into repetitive patterns
2. Teaching them more expressive alternatives
3. Maintaining their voice while improving their communication
4. Building better habits for both online and offline interaction
5. Helping them develop their own authentic communication style

## Features

- Real-time text analysis for "brainrot" content
- Smart suggestions that maintain youthful tone while improving expression
- Friendly, non-judgmental popup interface
- Progress tracking to encourage improvement
- Support for all common text input methods
- Privacy-focused design for user safety
- Educational feedback on why certain phrases could be improved

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

## How It Works

NoRot uses a combination of:
1. A curated list of known "brainrot" terms and phrases
2. Advanced language models for context analysis
3. Smart suggestion generation that maintains your intent
4. Real-time text monitoring with privacy in mind

The extension helps you:
- Identify problematic communication patterns
- Learn better alternatives
- Track your improvement over time
- Maintain more meaningful online conversations

## Development

### Project Structure
```
norot/
├── background.js          # Extension background script
├── content/
│   ├── content.js        # Content script for text analysis
│   └── styles.css        # Styles for popups and UI
├── popup/
│   ├── popup.html        # Extension popup UI
│   └── popup.js          # Popup functionality
├── main.py               # Backend server
├── manifest.json         # Extension manifest
└── images/
    └── icon.png          # Extension icon
```

### Backend API
The backend runs on `http://localhost:8000` and provides:
- POST `/check_brainrot`: Analyzes text for brainrot content
  - Request: `{ "text": "string" }`
  - Response: `{ "brainrot": boolean, "alternative": string, "analysis": string, "found_terms": string[] }`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for GPT API
- LangChain for AI integration
- All contributors and testers
