from flask import Flask, request, jsonify, render_template
import logging
import tarot_reading  # Our new tarot_reading module

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json() or {}
    user_query = data.get("query", "").strip()
    intention = data.get("intention", "").strip()

    # Log the lengths for debugging
    app.logger.debug(f"Length of user_query: {len(user_query)}")
    app.logger.debug(f"Length of intention: {len(intention)}")

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

    app.logger.debug(f"User Query: {user_query}")
    app.logger.debug(f"Intention: {intention}")

    try:
        reading_result = tarot_reading.generate_reading(user_query, intention)
        app.logger.debug(f"Reading Result: {reading_result}")
    except Exception as e:
        app.logger.error(f"Error generating reading: {e}")
        return jsonify({"error": "An error occurred while generating the tarot reading."}), 500

    return jsonify(reading_result)

if __name__ == "__main__":
    # Run the Flask server in debug mode
    app.run()
