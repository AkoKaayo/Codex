import re
import os
import random
from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
if not os.getenv("OPENAI_API_KEY"):
    print("WARNING: OpenAI API key is not set. "
          "Set the OPENAI_API_KEY environment variable or assign it directly in the code.")

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS, cross_origin
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from sentence_transformers import util
from transformers import AutoTokenizer

# ------------- BASIC CONFIG ---------------

# Paths and configuration
VECTOR_STORE_PATH = "data/vectorstore"
MODEL_NAME = "sentence-transformers/all-MiniLM-L12-v2"

app = Flask(__name__, static_folder="static")
CORS(app, resources={r"/*": {"origins": "*"}})

print(f"Loading embedding model: {MODEL_NAME}")
embeddings = HuggingFaceEmbeddings(model_name=MODEL_NAME)
print(f"Loading vector database from: {VECTOR_STORE_PATH}")
vector_db = Chroma(persist_directory=VECTOR_STORE_PATH, embedding_function=embeddings)

# Initialize the tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# Our canonical deck
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

# ------------- UTILITIES ---------------

def truncate_by_tokens(text, max_tokens=1000):
    """Truncates retrieved chunks so we don’t exceed the prompt limit."""
    tokens = tokenizer.tokenize(text)
    print("Retrieved chunks token count:", len(tokens))
    if len(tokens) > max_tokens:
        truncated_tokens = tokens[:max_tokens]
        truncated_text = tokenizer.convert_tokens_to_string(truncated_tokens)
        print(f"Retrieved chunks truncated to {max_tokens} tokens.")
        return truncated_text
    return text

def get_card_image(card_name):
    """Given a card name (e.g. 'The Fool'), produce the PNG filename under /static/cards."""
    filename = card_name.lower().replace(" ", "_") + ".png"
    return f"/static/cards/{filename}"

# ------------- PREPROCESSING ---------------

def parse_user_query(user_query: str):
    """
    Minimal logic:
      - Detect whether user wants single, 3, or 5-card spread (based on string).
      - Disallow explicit mention of card names in the user context.
      - Return dict with: { 'spread_type', 'context_text', 'error'(optional) }
    """
    lc_query = user_query.lower().strip()

    # 1) Check for presence of "random card", "3 card spread", "5 card spread"
    if "5 card spread" in lc_query:
        spread_type = "5-card"
    elif "3 card spread" in lc_query:
        spread_type = "3-card"
    elif "random card" in lc_query:
        spread_type = "single"
    else:
        # If it doesn't have any recognized spread specifier, we can default to single
        spread_type = "single"

    # 2) Extract context after "about" if present
    context_text = ""
    if "about" in lc_query:
        idx = lc_query.find("about")
        context_text = user_query[idx + len("about"):].strip()

    # 3) Check if user typed any known card names in context_text
    #    If they did, we return an error.
    for card in CANONICAL_CARDS:
        if card.lower() in context_text.lower():
            return {
                "spread_type": spread_type,
                "context_text": context_text,
                "error": (
                    "Please avoid specifying exact card names. "
                    "Just describe your situation or question."
                ),
            }

    return {
        "spread_type": spread_type,
        "context_text": context_text,
    }

# ------------- CARD SELECTION & LAYOUT ---------------

def draw_cards_for_spread(spread_type: str):
    """Draw random cards (unique) for single, 3, or 5 spreads with correct layout."""
    if spread_type == "5-card":
        chosen_five = random.sample(CANONICAL_CARDS, 5)
        # positions: 0 => south, 1 => west, 2 => centre, 3 => east, 4 => north
        ordered_cards = [chosen_five[0], chosen_five[1], chosen_five[2], chosen_five[3], chosen_five[4]]
        layout = "plus"
        return ordered_cards, layout
    elif spread_type == "3-card":
        chosen_three = random.sample(CANONICAL_CARDS, 3)
        layout = "three"
        return chosen_three, layout
    else:
        # single
        single_card = [random.choice(CANONICAL_CARDS)]
        layout = "default"
        return single_card, layout

# ------------- GPT SYNTHESIS ---------------

def generate_synthesis(spread_type, cards, user_context, retrieved_chunks):
    """
    Provide an interpretation strictly from the retrieved text.
    We do NOT want external knowledge or references to other tarot systems.
    """
    truncated = truncate_by_tokens(retrieved_chunks, max_tokens=1000)
    card_list = ", ".join(cards) if cards else "none"

    if spread_type == "5-card":
        system_prompt = f"""
You are a tarot oracle that uses ONLY the text provided below as your knowledge base.
Strictly ignore and exclude ANY external or previous tarot knowledge beyond these retrieved contents.
You have drawn 5 random cards: {card_list}.
User context: {user_context}

The position meanings and their corresponding cards are:
- South ("What prevents me from being myself?"): {cards[0]}
- West ("With what means can I free myself?"): {cards[1]}
- Centre ("To undertake what action?"): {cards[2]}
- East ("To lead into what transformation?"): {cards[3]}
- North ("What is my purpose, my destiny to realize?"): {cards[4]}

Strictly ignore and exclude ANY external or previous tarot knowledge beyond these retrieved contents.
Refer ONLY to the retrieved text when interpreting each card
Refer directly to the retrieved text for the primary meaning of any of the cards. Then, carefully extend or hypothesize how it might apply to the user’s specific question or context, without contradicting or fabricating details that conflict with the text. If the text provides absolutely no relevant leads, you may briefly explain that it doesn’t address the question directly.
Provide a cohesive and insightful interpretation that weaves the 5 positional insights together at the end.

Retrieved text:
{truncated}
"""
    elif spread_type == "3-card":
        system_prompt = f"""
You are a tarot oracle that uses ONLY the text provided below as your knowledge base.
Strictly ignore and exclude ANY external or previous tarot knowledge beyond these retrieved contents.
You have drawn 3 random cards: {card_list}.
User context: {user_context}

Treat them in a 3-card spread (genesis, present situation, end result).
Refer ONLY to the retrieved text for each card meaning.
Refer directly to the retrieved text for the primary meaning of any of the cards. Then, carefully extend or hypothesize how it might apply to the user’s specific question or context, without contradicting or fabricating details that conflict with the text. If the text provides absolutely no relevant leads, you may briefly explain that it doesn’t address the question directly.
Then give an interpretation in a concise and insightful manner.
Provide a cohesive and insighful interpretation that weaves the 3 positional insights together at the end.

Retrieved text:
{truncated}
"""
    else:
        system_prompt = f"""
You are a tarot oracle that uses ONLY the text provided below as your knowledge base.
Strictly ignore and exclude ANY external or previous tarot knowledge beyond these retrieved contents.
You have drawn 1 card: {card_list}.
User context: {user_context}

Strictly ignore and exclude ANY external or previous tarot knowledge beyond these retrieved contents.
Refer directly to the retrieved text for the primary meaning of any of the cards. Then, carefully extend or hypothesize how it might apply to the user’s specific question or context, without contradicting or fabricating details that conflict with the text. If the text provides absolutely no relevant leads, you may briefly explain that it doesn’t address the question directly.
Then give an interpretation in an insightful manner.

Retrieved text:
{truncated}
"""

    print("OpenAI Prompt:", system_prompt)
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": system_prompt}],
            max_tokens=1000,
            temperature=0.7,
        )
        synthesis = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI API error: {e}")
        synthesis = "An error occurred while generating the interpretation."
    return synthesis

# ------------- FLASK ROUTES ---------------

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/query", methods=["POST"])
@cross_origin()
def query_vector_db():
    """
    1) Parse user request, detect spread type, separate context.
    2) Draw random cards.
    3) If user typed any card reference, error out.
    4) Retrieve from vector DB *by card name*, not by full user query.
    5) Combine retrieved text, build GPT prompt, respond.
    """
    try:
        user_query = request.json.get("query", "").strip()
    except Exception as e:
        print("Error reading JSON:", e)
        return jsonify({"error": "Invalid JSON input"}), 400

    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    info = parse_user_query(user_query)
    if "error" in info:
        return jsonify({"error": info["error"]})

    spread_type = info["spread_type"]  # "single", "3-card", or "5-card"
    user_context = info["context_text"]  # e.g. "finances", "relationship," etc.

    # 1) Draw the random cards
    drawn_cards, layout = draw_cards_for_spread(spread_type)

    # 2) Retrieve text for each drawn card separately
    retrieved_texts = []
    for card in drawn_cards:
        # We do a similarity search using the exact card name
        # (You can tweak k=4 or k=5 as needed)
        card_results = vector_db.similarity_search(card, k=4)
        # (Optional) Re-rank if you want to measure similarity
        # For now, let's just collect them in order
        for doc in card_results:
            retrieved_texts.append(doc.page_content)

    # Combine all retrieved chunks into one big text
    retrieved_chunks = " ".join(retrieved_texts)
    print("Retrieved Chunks:", retrieved_chunks)

    # 3) Generate the final GPT-based interpretation from local text
    synthesis = generate_synthesis(spread_type, drawn_cards, user_context, retrieved_chunks)

    # 4) Build the final response
    cards_with_images = [{"name": c, "image": get_card_image(c)} for c in drawn_cards]
    response = {
        "query": user_query,
        "context": user_context,
        "synthesis": synthesis,
        "cards": cards_with_images,
        "layout": layout
    }
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)
