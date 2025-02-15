import re
import os
import random
from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
if not os.getenv("OPENAI_API_KEY"):
    print("WARNING: OpenAI API key is not set. Set the OPENAI_API_KEY environment variable or assign it directly in the code.")

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS, cross_origin
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from sentence_transformers import util
from transformers import AutoTokenizer  # Import the tokenizer

# Paths and configuration
VECTOR_STORE_PATH = "data/vectorstore"
MODEL_NAME = "sentence-transformers/all-MiniLM-L12-v2"

# Global canonical cards list
CANONICAL_CARDS = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "The Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgment", "The World",
    "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands",
    "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
    "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
    "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups",
    "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups",
    "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
    "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords",
    "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
    "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
    "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles",
    "Five of Pentacles", "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles",
    "Nine of Pentacles", "Ten of Pentacles",
    "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
]

# Initialize Flask app and enable CORS for all routes
app = Flask(__name__, static_folder="static")
CORS(app, resources={r"/*": {"origins": "*"}})

print(f"Loading embedding model: {MODEL_NAME}")
embeddings = HuggingFaceEmbeddings(model_name=MODEL_NAME)
print(f"Loading vector database from: {VECTOR_STORE_PATH}")
vector_db = Chroma(persist_directory=VECTOR_STORE_PATH, embedding_function=embeddings)

# Initialize the tokenizer (using the same MODEL_NAME for consistency)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# Define alternative card names mapping
ALTERNATIVE_CARD_NAMES = {
    "9 of wands": "Nine of Wands",
    "le mat": "The Fool",
    "le batleur": "The Magician",
    "the pope": "The Hierophant",
    "the priest": "The Hierophant",
    # Add more alternative names as needed
}

def truncate_by_tokens(text, max_tokens=250):
    tokens = tokenizer.tokenize(text)
    print("Retrieved chunks token count:", len(tokens))
    if len(tokens) > max_tokens:
        truncated_tokens = tokens[:max_tokens]
        truncated_text = tokenizer.convert_tokens_to_string(truncated_tokens)
        print(f"Retrieved chunks truncated to {max_tokens} tokens.")
        return truncated_text
    return text

def preprocess_query(query):
    lower_query = query.lower()
    
    # Use the global canonical cards list
    canonical_cards = CANONICAL_CARDS
    
    # Build a dictionary for minor arcana lookups:
    minor_arcana = {}
    for card in canonical_cards:
        parts = card.split(" of ")
        if len(parts) == 2:
            value, suit = parts
            minor_arcana[(value.lower(), suit.lower())] = card
    
    matches = []  # List of tuples (start_index, card)
    
    # Regex pattern for phrases like "2 of spades" or "ace of hearts"
    pattern = r'\b([0-9]+|[a-z]+)\s+of\s+([a-z]+)\b'
    digit_to_word = {
        "2": "Two", "3": "Three", "4": "Four", "5": "Five",
        "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine", "10": "Ten"
    }
    suit_alternatives = {
        "spades": "swords",
        "hearts": "cups",
        "clubs": "wands",
        "diamonds": "pentacles"
    }
    
    for m in re.finditer(pattern, lower_query):
        value, suit = m.group(1), m.group(2)
        start = m.start()
        if value.isdigit():
            value_word = digit_to_word.get(value, value)
        else:
            value_word = value.capitalize()
        canonical_suit = suit_alternatives.get(suit, suit)
        key = (value_word.lower(), canonical_suit.lower())
        if key in minor_arcana:
            matches.append((start, minor_arcana[key]))
    
    # Alias mapping: e.g., "the pope" maps to "The Hierophant"
    alias_map = {
        "the pope": "The Hierophant"
    }
    for alias, card in alias_map.items():
        for m in re.finditer(r'\b' + re.escape(alias) + r'\b', lower_query):
            start = m.start()
            matches.append((start, card))
    if "the pope" in lower_query and not any(card == "The Hierophant" for _, card in matches):
        matches.append((lower_query.find("the pope"), "The Hierophant"))
    
    # Also add any full canonical card names directly mentioned in the query,
    # but only if not already captured, along with their position.
    for card in canonical_cards:
        pos = lower_query.find(card.lower())
        if pos != -1 and not any(existing_card == card for _, existing_card in matches):
            matches.append((pos, card))
    
    matches.sort(key=lambda x: x[0])
    found_cards = [card for _, card in matches]
    
    # Remove duplicates while preserving order
    seen = set()
    ordered_cards = []
    for card in found_cards:
        if card not in seen:
            seen.add(card)
            ordered_cards.append(card)
    
    # Detect positional cues
    positions = {}
    for pos in ["past", "present", "future", "left", "right", "center"]:
        if pos in lower_query:
            positions[pos] = True

    if len(ordered_cards) > 1:
        query_type = "multi-card"
    elif len(ordered_cards) == 1:
        query_type = "single-card"
    else:
        query_type = "general"
    
    # Override for speed dial commands or ambiguous queries:
    if lower_query.strip() == "3 card spread":
        ordered_cards = random.sample(canonical_cards, 3)
        query_type = "multi-card"
        positions = {"genesis": True, "actuality": True, "consequence": True}
        result = {"cards": ordered_cards, "type": query_type, "positions": positions}
    elif lower_query.strip() == "5 card spread":
        # For plus layout, explicitly assign positions:
        # South (bottom), West (left), Centre (center), East (right), North (top)
        south = random.choice(canonical_cards)
        remaining = [card for card in canonical_cards if card != south]
        # Pick four distinct cards for the remaining positions.
        west, centre, east, north = random.sample(remaining, 4)
        ordered_cards = [south, west, centre, east, north]
        query_type = "multi-card"
        result = {"cards": ordered_cards, "type": query_type, "positions": positions, "layout": "plus"}
    elif lower_query.strip() == "random card":
        ordered_cards = [random.choice(canonical_cards)]
        query_type = "single-card"
        result = {"cards": ordered_cards, "type": query_type, "positions": positions}
    elif len(ordered_cards) == 0:
        if ("?" in lower_query) or any(word in lower_query for word in ["what", "tell me", "how", "why"]):
            ordered_cards = [random.choice(canonical_cards)]
            query_type = "single-card"
            result = {"cards": ordered_cards, "type": query_type, "positions": positions}
        else:
            result = {"error": "Your query did not contain any valid card references. Please include at least one card name or use the speed dial options.", "cards": [], "type": query_type, "positions": positions}
    else:
        result = {"cards": ordered_cards, "type": query_type, "positions": positions}
    
    print("Preprocess Query Output:", result)
    return result

def get_card_image(card_name):
    filename = card_name.lower().replace(" ", "_") + ".png"
    return f"/static/cards/{filename}"

def generate_synthesis(cards, context, retrieved_chunks, layout=None):
    retrieved_chunks = truncate_by_tokens(retrieved_chunks, max_tokens=500)
    card_list = ', '.join(cards) if cards else 'none'
    # Branch for 5-card spread instructions
    if layout == "plus" or len(cards) == 5:
        system_prompt = f"""
You are a tarot oracle. Interpret the following 5-card spread with the positions as defined:
South: "What prevents me from being myself?" – This card reveals the restraint, obstacle, or blockage hindering your authentic self.
West: "With what means can I free myself?" – This card indicates the means of liberation available to you.
Centre: "To undertake what action?" – This card suggests the specific action you should take.
East: "To lead into what transformation?" – This card reveals the means through which transformation can occur.
North: "What is my purpose, my destiny to realize?" – This card unveils your ultimate purpose or destiny to be achieved.

For each card, include its traditional tarot symbolism and explain its significance in its position within this spread.
Then, provide an overall synthesis of the reading that integrates all five insights into a cohesive, articulated interpretation without repeating the prompt language.
Context: {context}
Retrieved information: {retrieved_chunks}
Now, produce an original interpretation without echoing these instructions.
        """
    elif len(cards) == 3:
        system_prompt = f"""
You are an insightful tarot interpreter renowned for clarity, depth, and originality.
For this three-card spread, please provide an individual analysis for each card mentioned ({card_list}).
Interpret the cards in a progressive manner and read it as a sentence: consider the first card as representing the beginning (or the genesis), the second as representing the current state (or the means of deployment), and the third as representing the result (or emerging outcomes).
For each card, detail its unique symbolism, positional meaning (if any), and contextual relevance.
After analyzing each card individually, integrate these interpretations into a cohesive, unified narrative that reflects the overall journey.
Base your analysis solely on the provided context and retrieved information below. Do not use any external or pre-existing knowledge.
Avoid generic mystical openings or clichés.
Focus directly on the unique qualities and interactions of the cards and deliver practical, original insights in a refined, understated tone.
Context: {context}
Retrieved information: {retrieved_chunks}
Now, produce an original interpretation without echoing these instructions.
        """
    else:
        system_prompt = f"""
You are an insightful tarot interpreter renowned for clarity, depth, and originality.
Provide a focused, comprehensive reading based solely on the specific cards mentioned ({card_list}).
Base your analysis solely on the provided context and retrieved information below. Do not use any external or pre-existing knowledge.
Avoid generic mystical openings or clichés.
Focus on analyzing the unique qualities and interactions of the cards and deliver practical, original insights in a refined, understated tone.
Please provide a detailed interpretation with extended analysis.
Context: {context}
Retrieved information: {retrieved_chunks}
Now, produce an original interpretation without echoing these instructions.
        """
    print("OpenAI Prompt:", system_prompt)
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": system_prompt}],
            max_tokens=500,
            temperature=0.7,
        )
        synthesis = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI API error: {e}")
        synthesis = "An error occurred while generating the interpretation."
    return synthesis

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

# New function: clear previous reading (chat messages and card previews)
def clearPreviousReading():
    # This function is implemented on the frontend in JavaScript.
    pass

@app.route("/query", methods=["POST"])
@cross_origin()
def query_vector_db():
    try:
        user_query = request.json.get("query", "").strip()
    except Exception as e:
        print("Error reading JSON:", e)
        return jsonify({"error": "Invalid JSON input"}), 400
    if not user_query:
        return jsonify({"error": "Query is missing"}), 400

    query_info = preprocess_query(user_query)
    if "error" in query_info:
        return jsonify(query_info)
    
    cards = query_info["cards"]
    query_type = query_info["type"]
    positions = query_info["positions"]
    layout = query_info.get("layout", "default")

    if query_type == "multi-card":
        if not positions and len(cards) == 3:
            positions = {"genesis": True, "actuality": True, "consequence": True}
            context_message = f"You mentioned three cards: {', '.join(cards)}. Consider them as reflecting a journey from a formative past to a dynamic present and an emerging future."
        else:
            if positions:
                positions_str = ", ".join([k for k, v in positions.items() if v])
                context_message = f"You mentioned multiple cards: {', '.join(cards)}. Positional cues detected: {positions_str}."
            else:
                context_message = f"You mentioned multiple cards: {', '.join(cards)}."
    elif query_type == "single-card":
        context_message = f"You mentioned a single card: {cards[0]}."
    else:
        context_message = "No specific card was identified."

    # RAG Retrieval and Re-ranking:
    results = vector_db.similarity_search(user_query, k=8)
    query_embedding = embeddings.embed_query(user_query)
    ranked_results = sorted(
        results,
        key=lambda doc: util.cos_sim(query_embedding, embeddings.embed_query(doc.page_content)),
        reverse=True
    )
    for idx, doc in enumerate(ranked_results):
        score = util.cos_sim(query_embedding, embeddings.embed_query(doc.page_content))
        print(f"Document {idx+1} similarity score: {score}")

    top_results = ranked_results[:3]
    retrieved_chunks = " ".join([result.page_content for result in top_results])
    print("Retrieved Chunks:", retrieved_chunks)
    synthesis = generate_synthesis(cards, context_message, retrieved_chunks, layout)
    
    # Prepare card image info for the frontend
    cards_with_images = [{"name": card, "image": get_card_image(card)} for card in cards]

    response = {
        "query": user_query,
        "context": context_message,
        "synthesis": synthesis,
        "cards": cards_with_images,
        "layout": layout
    }
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)
