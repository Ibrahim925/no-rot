import os
from typing import List, Dict
from langchain.llms import OpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_community.llms import OpenAI
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
CORS(app)

# Your API keys (consider moving these to environment variables)
openaiapi_key = os.getenv("OPENAI_API_KEY")
embeddings_key = os.getenv("EMBEDDINGS_API_KEY")

llm = OpenAI(model_name="gpt-3.5-turbo-instruct", openai_api_key=openaiapi_key)
embeddings = OpenAIEmbeddings(openai_api_key=embeddings_key)

# Original brainrot words list
BRAINROT_WORDS = [
    "Skibidi", "Gyatt", "Rizz", "Only in Ohio", "Duke Dennis", "Did You Pray Today",
    "Livvy Dunne", "Rizzing Up", "Baby Gronk", "Sussy Imposter", "Pibby Glitch",
    "In Real Life", "Sigma Male", "Alpha Male", "Omega Male", "Grindset", "Andrew Tate",
    "Goon Cave", "Freddy Fazbear", "Colleen Ballinger", "Smurf Cat", "Strawberry Elephant",
    "Blud", "Dawg", "Shmlawg", "IShowSpeed", "A Whole Bunch of Turbulence", "Ambatukam",
    "Bro Really Thinks He's Carti", "Literally Hitting the Griddy", "The Ocky Way",
    "Kai Cenat", "Fanum Tax", "Garten of Banban", "No Edging in Class",
    "Not the Mosquito Again", "Bussing", "Axel in Harlem", "Whopper Whopper Whopper Whopper",
    "Buckle My Shoe", "Goofy Ahh", "Aiden Ross", "Sin City", "Monday Left Me Broken",
    "Quirked Up White Boy", "Busting It Down Style", "Goated with the Sauce", "John Pork",
    "Grimace Shake", "Kiki Do You Love Me", "Huggy Wuggy", "Nathaniel B", "Lightskin Stare",
    "Biggest Bird", "Omar the Referee", "Amogus", "Uncanny", "Wholesome", "Reddit",
    "Chungus", "Keanu Reeves", "Pizza Tower", "Zesty", "Poggers", "Kumalala Savesta",
    "Quandale Dingle", "Glizzy", "Rose Toy", "Ankha Zone", "Thug Shaker", "Morbin Time",
    "DJ Khaled", "Sisyphus", "Oceangate", "Shadow Wizard Money Gang", "Ayo the Pizza Here",
    "Pluh", "Nair Butthole Waxing", "T-Pose", "Ugandan Knuckles",
    "Family Guy Funny Moments Compilation with Subway Surfers Gameplay at the Bottom",
    "NickEh30", "Ratio", "Uwu", "Delulu", "Opium", "Bird", "CG5", "Mewing",
    "Fortnite Battle Pass", "All My Fellas", "GTA 6", "Backrooms", "Gigachad", "Based",
    "Cringe", "Kino", "Redpilled", "No Nut November", "Pokénut November", "Foot Fetish",
    "F in the Chat", "I Love Lean", "Looksmaxxing", "Gassy", "Social Credit", "Bing Chilling",
    "Xbox Live", "MrBeast", "Kid Named Finger", "Better Caul Saul", "I Am a Surgeon",
    "Hit or Miss I Guess They Never Miss Huh", "I Like Ya Cut G", "Ice Spice", "Gooning",
    "Fr", "We Go Gym", "Kevin James", "Josh Hutcherson", "Coffin of Andy and Leyley",
    "Metal Pipe Falling", "360 No Scope", "69", "Adin Ross", "Alabama", "Alkahawl",
    "Anita Max Wynn", "Aura", "Before GTA 6", "Beta", "Big Chungus", "Bop", "Brainrot",
    "Brainrotmaxxing", "Bubblegum Pink", "Buggin", "Caseoh", "Coffin Dance", "Cooked",
    "Cotton Eye Joe", "Da Biggest Bird", "DaBaby Car", "Deez Nuts", "Discord",
    "Discord Moderator", "DK Khaled", "Don Pollo", "Drake", "Dream", "Duolingo", "Edge",
    "Edgemaxxing", "Edging Streak", "Ermm What the Sigma", "Fella", "Flight", "Flip", "FNAF",
    "Fuhulatoogan", "Gail Lewis", "Galvanised Square Steel", "Get Sturdy", "Glazing",
    "Goat", "Goonmaxxing", "Gorlock the Destroyer", "Green FN", "Grimace", "Grind",
    "Gyat", "Imposter", "James Charles", "Jeffrey Epstein", "Jelqing", "Jelqmaxxing",
    "Jinxzi", "Jittleyang", "Kevin G", "Lacy", "LeBron James", "Ligma", "Lil Bro", "Lock In",
    "Low Taper Fade", "Mogging", "Mouth Breather", "Munch", "Napoleon",
    "Never Back Down Never What", "No Cap", "NPC", "Nuh Uh", "Ohio", "Oi Oi Oi", "Oil Up",
    "Opp", "Peter Griffin", "Pokimane", "Pookie", "Rizz App", "Rizzler", "Rizzly Bear",
    "Rizzmaxxing", "Root Beer", "Shartmaxxing", "Sheesh", "Sky Bri", "Slay", "Speed",
    "Subway Surfers", "Super Idol", "Sus", "The Hood", "TikTok Rizz Party", "Tnickelss",
    "Tripping", "Twitch", "Unc", "UNO Reverse", "Who's in Paris", "Yappachino", "Yapping",
    "Zesty"
]

# Enhanced brainrot detection prompt that incorporates the word list
BRAINROT_PROMPT = """You are an expert at detecting internet slang, memes, and "brainrot" content.
Analyze the following text for signs of internet meme culture, overused phrases, or low-effort communication.

Here is a list of known brainrot terms and phrases to check for:
{brainrot_words}

Consider these aspects:
1. Presence of any words/phrases from the above list
2. Use of trending internet slang or memes
3. References to viral content or internet personalities
4. Low-effort or repetitive phrases
5. Overused TikTok/social media phrases

Text to analyze: "{text}"

First, identify any specific brainrot elements present:
{format_instructions}

Then, determine if this text needs improvement (respond with YES or NO):"""

ALTERNATIVE_PROMPT = """Given the following text that contains internet slang or "brainrot" elements,
rewrite it to maintain the same core message but in a more meaningful, original way.

Original text: "{text}"

Guidelines for improvement:
1. Keep the same intent and emotion
2. Replace any brainrot terms with more thoughtful language
3. Make it more personal and genuine
4. Maintain appropriate tone for the context
5. Ensure it's completely free of internet slang and memes

Improved version:"""

class BrainrotAnalyzer:
    def __init__(self):
        self.brainrot_words = BRAINROT_WORDS
        self.detect_prompt = PromptTemplate(
            input_variables=["text", "format_instructions", "brainrot_words"],
            template=BRAINROT_PROMPT
        )
        self.improve_prompt = PromptTemplate(
            input_variables=["text"],
            template=ALTERNATIVE_PROMPT
        )
        self.llm_chain = LLMChain(llm=llm, prompt=self.detect_prompt)
        self.improve_chain = LLMChain(llm=llm, prompt=self.improve_prompt)

    def analyze_text(self, text: str) -> Dict:
        # Format instructions for structured output
        format_instructions = """
        Elements found (list specific examples):
        - Matched brainrot terms:
        - Other internet slang:
        - Meme references:
        - Overused phrases:
        """

        # Get detailed analysis
        analysis = self.llm_chain.run(
            text=text,
            format_instructions=format_instructions,
            brainrot_words=", ".join(self.brainrot_words)
        )

        # Check if text contains brainrot
        contains_brainrot = "YES" in analysis.split("\n")[-1].upper()

        # Quick check for exact matches from the word list
        found_terms = [word for word in self.brainrot_words if word.lower() in text.lower()]
        if found_terms and not contains_brainrot:
            contains_brainrot = True

        # Get improvement if needed
        alternative = None
        if contains_brainrot:
            alternative = self.improve_chain.run(text=text)

        return {
            "brainrot": contains_brainrot,
            "analysis": analysis,
            "found_terms": found_terms,
            "alternative": alternative.strip() if alternative else None
        }

# Initialize analyzer
analyzer = BrainrotAnalyzer()

@app.route('/check_brainrot', methods=['POST'])
def check_brainrot():
    print("Received request")
    try:
        if not request.is_json:
            print("Request is not JSON")
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.get_json()
        print("Request data:", data)

        if not data or 'text' not in data:
            print("No text provided")
            return jsonify({'error': 'No text provided'}), 400

        input_text = data['text']
        print("Input text:", input_text)

        # Analyze text for brainrot
        result = analyzer.analyze_text(input_text)
        print("Analysis result:", result)

        response = make_response(jsonify({
            'brainrot': result['brainrot'],
            'alternative': result['alternative'],
            'analysis': result['analysis'],
            'found_terms': result['found_terms']
        }))

        # Add CORS headers
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    except Exception as e:
        print("Error:", str(e))
        error_response = jsonify({'error': str(e)})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

@app.route('/check_brainrot', methods=['OPTIONS'])
def handle_options():
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST')
    return response

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
