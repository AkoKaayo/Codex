import re
import os
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
    "i, le batteur, the magician": "The Magician",
    "i, le batleur, the magician": "The Magician"
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
    # Full list of tarot cards (Major and Minor Arcana) in canonical form
    tarot_cards = [
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
    mentioned_cards = []
    lower_query = query.lower()

    # Check for canonical card names
    for card in tarot_cards:
        if card.lower() in lower_query and card not in mentioned_cards:
            mentioned_cards.append(card)

    # Check for alternative names and map them to canonical names
    for alt, canonical in ALTERNATIVE_CARD_NAMES.items():
        if alt in lower_query and canonical not in mentioned_cards:
            mentioned_cards.append(canonical)

    positions = {}
    if "past" in lower_query:
        positions["past"] = True
    if "present" in lower_query:
        positions["present"] = True
    if "future" in lower_query:
        positions["future"] = True
    if "left" in lower_query:
        positions["left"] = True
    if "right" in lower_query:
        positions["right"] = True
    if "center" in lower_query:
        positions["center"] = True

    if len(mentioned_cards) > 1:
        query_type = "multi-card"
    elif len(mentioned_cards) == 1:
        query_type = "single-card"
    else:
        query_type = "general"
    return {"cards": mentioned_cards, "type": query_type, "positions": positions}

def get_card_image(card_name):
    # Construct image filename from card name; e.g., "The Fool" -> "the_fool.jpg"
    filename = card_name.lower().replace(" ", "_") + ".jpg"
    return f"/static/cards/{filename}"

def generate_synthesis(cards, context, retrieved_chunks):
    retrieved_chunks = truncate_by_tokens(retrieved_chunks, max_tokens=350)
    card_list = ', '.join(cards) if cards else 'none'
    # Updated prompt to handle three-card spread with individual analyses and a combined reflective summary
    if len(cards) == 3:
        system_prompt = f"""
You are an insightful tarot interpreter renowned for clarity, depth, and originality.
For this three-card spread, please provide an individual analysis for each card mentioned ({card_list}).
For each card, detail its unique symbolism, positional meaning (if any), and contextual relevance.
After analyzing each card individually, provide a concluding summary that synthesizes these interpretations and offers reflective insights for the user's personal journey.
Avoid generic mystical openings or clichés.
Focus directly on analyzing the unique qualities and interactions of the cards and deliver practical, original insights in a refined, understated tone.
Context: {context}
Retrieved information: {retrieved_chunks}
Now, produce an original interpretation without echoing these instructions.
        """
    else:
        system_prompt = f"""
You are an insightful tarot interpreter renowned for clarity, depth, and originality.
Provide a focused, comprehensive reading based solely on the specific cards mentioned ({card_list}).
Avoid generic mystical openings or clichés.
Focus directly on analyzing the unique qualities and interactions of the cards and deliver practical, original insights in a refined, understated tone.
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
    cards = query_info["cards"]
    query_type = query_info["type"]
    positions = query_info["positions"]

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

    results = vector_db.similarity_search(user_query, k=5)
    query_embedding = embeddings.embed_query(user_query)
    ranked_results = sorted(
        results,
        key=lambda doc: util.cos_sim(query_embedding, embeddings.embed_query(doc.page_content)),
        reverse=True
    )
    top_results = ranked_results[:3]
    retrieved_chunks = " ".join([result.page_content for result in top_results])
    print("Retrieved Chunks:", retrieved_chunks)
    synthesis = generate_synthesis(cards, context_message, retrieved_chunks)
    
    # Prepare card image info for the frontend
    cards_with_images = [{"name": card, "image": get_card_image(card)} for card in cards]

    response = {
        "query": user_query,
        "context": context_message,
        "synthesis": synthesis,
        "cards": cards_with_images
    }
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)
