from flask import Flask, request, jsonify, render_template
import logging
import tarot_reading  # This module loads all YAML data and contains our reading functions

# Create the Flask app instance
app = Flask(__name__)

# Configure logging (optional, but useful for debugging)
logging.basicConfig(level=logging.DEBUG)

@app.route("/")
def index():
    # Render the index.html (ensure this file is in the "templates" directory)
    return render_template("index.html")

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json()
    user_query = data.get("query", "").strip()
    intention = data.get("intention", "").strip()  # Capture the user's stated intention
    if not user_query:
        return jsonify({"error": "No query provided."}), 400

    app.logger.debug("Received query: %s", user_query)
    app.logger.debug("Received intention: %s", intention)

    try:
        # Generate the tarot reading based on the query and intention.
        reading_result = tarot_reading.generate_reading(user_query, intention)
        app.logger.debug("Reading result: %s", reading_result)
    except Exception as e:
        app.logger.error("Error generating reading: %s", e)
        return jsonify({"error": "An error occurred while generating the tarot reading."}), 500

    return jsonify(reading_result)

if __name__ == "__main__":
    # Run the Flask app in debug mode for development purposes.
    app.run(debug=True)
