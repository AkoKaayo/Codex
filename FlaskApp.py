from flask import Flask, request, jsonify, render_template, url_for
import logging
import random  # Add this import
import tarot_reading  # Our new tarot_reading module
import os

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/custom")
def custom():
    return render_template("custom.html")

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json() or {}
    user_query = data.get("query", "").strip()
    intention = data.get("intention", "").strip()
    selected_cards = data.get("selectedCards", [])  # Extract selected cards from request

    # Log the lengths for debugging
    app.logger.debug(f"Length of user_query: {len(user_query)}")
    app.logger.debug(f"Length of intention: {len(intention)}")
    app.logger.debug(f"Selected cards: {selected_cards}")

    # Check if user_query is empty
    if not user_query:
        return jsonify({"error": "No query provided."}), 400

    # Validate length of user_query and intention
    if len(user_query) > 500:
        return jsonify({"error": "Query too long. Maximum 500 characters allowed."}), 400
    if len(intention) > 500:
        return jsonify({"error": "Intention too long. Maximum 500 characters allowed."}), 400

    # Check for potentially harmful characters in user_query and intention
    harmful_chars = "<>{}"
    if any(char in user_query for char in harmful_chars):
        return jsonify({"error": "Invalid characters in query. Avoid using <, >, {, or }."}), 400
    if any(char in intention for char in harmful_chars):
        return jsonify({"error": "Invalid characters in intention. Avoid using <, >, {, or }."}), 400

    # Validate selected cards (basic check)
    if not isinstance(selected_cards, list):
        return jsonify({"error": "Selected cards must be a list."}), 400

    app.logger.debug(f"User Query: {user_query}")
    app.logger.debug(f"Intention: {intention}")

    try:
        reading_result = tarot_reading.generate_reading(user_query, intention, selected_cards)
        app.logger.debug(f"Reading Result: {reading_result}")
    except Exception as e:
        app.logger.error(f"Error generating reading: {e}")
        return jsonify({"error": "An error occurred while generating the tarot reading."}), 500

    return jsonify(reading_result)

@app.route("/get_card_image", methods=["POST"])
def get_card_image():
    data = request.get_json() or {}
    card_name = data.get("card_name", "").strip()
    
    # Validate input
    if not card_name:
        app.logger.error("No card name provided in request")
        return jsonify({"error": "Card name is required"}), 400

    # Check for harmful characters
    harmful_chars = "<>{}"
    if any(char in card_name for char in harmful_chars):
        app.logger.error(f"Invalid characters in card name: {card_name}")
        return jsonify({"error": "Invalid characters in card name. Avoid using <, >, {, or }."}), 400

    try:
        # Look up the card by name (case-insensitive)
        card_name_lower = card_name.lower()
        card = tarot_reading.card_lookup.get(card_name_lower)
        if not card:
            # Handle "random" case by selecting a random card
            if card_name_lower == "random":
                card = random.choice(tarot_reading.cards)
            else:
                app.logger.error(f"Card not found: {card_name}")
                return jsonify({"error": "Card not found"}), 404

        # Construct the image URL using tarot_reading's generate_image_path
        image_url = tarot_reading.generate_image_path(card)
        app.logger.debug(f"Returning image URL for {card_name}: {image_url}")
        return jsonify({"image": image_url, "name": card["name"]})
    except Exception as e:
        app.logger.error(f"Error fetching card image for {card_name}: {e}")
        return jsonify({"error": "An error occurred while fetching the card image."}), 500

if __name__ == "__main__":
    if os.environ.get("FLASK_ENV") != "production":
        app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)