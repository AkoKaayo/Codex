from flask import Flask, request, jsonify, render_template
import logging
import tarot_reading  # Our new tarot_reading module

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

@app.route("/")
def index():
    # Make sure you have an 'index.html' file in the 'templates' folder:
    # your_project/
    # ├── FlaskApp.py (this file)
    # ├── templates/
    # │   └── index.html
    return render_template("index.html")

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json() or {}
    user_query = data.get("query", "").strip()
    intention = data.get("intention", "").strip()

    if not user_query:
        return jsonify({"error": "No query provided."}), 400

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
    app.run(debug=True)
