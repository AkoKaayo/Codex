import re
import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS, cross_origin
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from sentence_transformers import util
from langchain_community.chat_models import ChatLlamaCpp  # Using local Llama CPP model

# Paths and configuration
VECTOR_STORE_PATH = "data/vectorstore"
MODEL_NAME = "sentence-transformers/all-MiniLM-L12-v2"
MODEL_PATH = "/Users/exotica/code/models/Mistral-7B-Instruct-v0.3-Q4_K_M.gguf"

# Initialize Flask app and configure CORS for all routes
app = Flask(__name__, static_folder="static")
CORS(app, resources={r"/*": {"origins": "*"}})

# Load the embedding model and vector database
print(f"Loading embedding model: {MODEL_NAME}")
embeddings = HuggingFaceEmbeddings(model_name=MODEL_NAME)
print(f"Loading vector database from: {VECTOR_STORE_PATH}")
vector_db = Chroma(persist_directory=VECTOR_STORE_PATH, embedding_function=embeddings)

# Initialize the local LLM using ChatLlamaCpp with the Mistral model
llm = ChatLlamaCpp(model_path=MODEL_PATH, temperature=0.7)

def preprocess_query(query):
    # Full list of tarot cards including court cards
    tarot_cards = [
        # Major Arcana
        "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
        "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
        "The Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
        "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgment", "The World",
        # Minor Arcana - Wands
        "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands",
        "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
        "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
        # Minor Arcana - Cups
        "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups",
        "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups",
        "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
        # Minor Arcana - Swords
        "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords",
        "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
        "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
        # Minor Arcana - Pentacles
        "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles",
        "Five of Pentacles", "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles",
        "Nine of Pentacles", "Ten of Pentacles",
        "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
    ]
    # Identify mentioned cards (case-insensitive)
    mentioned_cards = [card for card in tarot_cards if card.lower() in query.lower()]
    
    # Determine query type
    if len(mentioned_cards) > 1:
        query_type = "multi-card"
    elif len(mentioned_cards) == 1:
        query_type = "single-card"
    else:
        query_type = "general"
    
    return {"cards": mentioned_cards, "type": query_type}

def generate_synthesis(cards, context, retrieved_chunks):
    # Truncate retrieved_chunks to limit its length (rough approximation)
    words = retrieved_chunks.split()
    if len(words) > 350:
        retrieved_chunks = ' '.join(words[:350])
        print("Retrieved chunks truncated to first 200 words.")

    # Handle empty card list gracefully
    card_list = ', '.join(cards) if cards else 'none'
    
    system_prompt = f"""
    You are a tarot expert. Based on the cards mentioned ({card_list}), generate a detailed and eloquent interpretation.
    Context: {context}
    Retrieved information: {retrieved_chunks}
    """
    print("LLM Prompt:", system_prompt)  # Debug: Log the prompt

    try:
        synthesis = llm.invoke(system_prompt)
        # Convert to plain string if needed
        if hasattr(synthesis, "content"):
            synthesis = synthesis.content
        else:
            synthesis = str(synthesis)
    except Exception as e:
        print(f"LLM error: {e}")
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

    # Preprocess the query
    query_info = preprocess_query(user_query)
    cards = query_info["cards"]
    query_type = query_info["type"]

    # Define a context message based on query type
    if query_type == "multi-card":
        context_message = f"You mentioned multiple cards: {', '.join(cards)}. Here's an interpretation of their relationship:"
    elif query_type == "single-card":
        context_message = f"You mentioned a single card: {cards[0]}. Here's its interpretation:"
    else:
        context_message = "No specific card was identified. General guidance follows:"

    # Retrieve and rerank results from the vector database
    results = vector_db.similarity_search(user_query, k=5)
    query_embedding = embeddings.embed_query(user_query)
    ranked_results = sorted(
        results,
        key=lambda doc: util.cos_sim(query_embedding, embeddings.embed_query(doc.page_content)),
        reverse=True
    )
    top_results = ranked_results[:3]

    # Combine top results into one string for the LLM and log for debugging
    retrieved_chunks = " ".join([result.page_content for result in top_results])
    print("Retrieved Chunks:", retrieved_chunks)

    # Synthesize the final interpretation using the local LLM
    synthesis = generate_synthesis(cards, context_message, retrieved_chunks)

    # Return the JSON response with a "synthesis" key
    response = {
        "query": user_query,
        "context": context_message,
        "synthesis": synthesis
    }
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)
