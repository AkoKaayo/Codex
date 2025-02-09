from flask import Flask, jsonify, render_template
import json

app = Flask(__name__)

# Load tarot knowledge (placeholder for now)
with open("data/tarot_knowledge.json", "r", encoding="utf-8") as file:
    tarot_data = json.load(file)

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/card/<name>', methods=['GET'])
def get_card(name):
    card = tarot_data.get(name, {})
    return jsonify(card if card else {"error": "Card not found"})

if __name__ == '__main__':
    app.run(debug=True)
