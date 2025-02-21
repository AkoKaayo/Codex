import os
import random
from openai import OpenAI
from load_yaml import load_all_cards
from flask import Flask, request, jsonify

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AI_MODEL = "gpt-3.5-turbo"
MAX_TOKENS = 2000

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

SPREAD_LAYOUTS = {
    "default": ["Central Theme"],
    "three": ["Past", "Present", "Future"],
    "plus": [
        "What prevents you from being yourself",
        "With what means can you free yourself",
        "What action should you undertake",
        "Into what transformation you are being led",
        "What is your ultimate purpose or destiny"
    ]
}

def get_ai_response(prompt):
    """Modern OpenAI API call (v1.0+)"""
    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=MAX_TOKENS,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI API Error: {e}")
        return None

def generate_card_insight(card, position, query, intention=""):
    """
    Generate a concise, position-aware interpretation for a given card,
    now incorporating the user's stated intention.
    """
    card_name = card.get("name", "Unknown")
    keywords = card.get("keywords", [])
    interpretations = card.get("interpretations", "")[:150]
    prompt = (
        f"You are a wise oracle, blending Jungian psychology and mindfulness. "
        f"Interpret the '{card_name}' in the '{position}' position for someone who shared: "
        f"'{intention}'\n\n"
        f"Guidelines:\n"
        f"- Acknowledge their emotional state without judgment\n"
        f"- Highlight subconscious patterns or hidden strengths\n"
        f"- Relate to the theme of '{position}' (e.g., 'Past' = root causes, 'Future' = potential growth)\n"
        f"- End with one reflective question (e.g., 'What would shift if you embraced...?')\n"
        f"Use metaphors, avoid clichés, and prioritize agency over fate."
    )
    result = get_ai_response(prompt)
    if result is None or result.startswith("ERROR"):
        return "No interpretation available."
    return result

def generate_spread_synthesis(card_summaries, query, layout, instructions, intention=""):
    """
    Synthesize individual card insights into an overall, therapeutic analysis,
    emphasizing self-awareness and actionable growth.
    """
    positions_text = "\n".join([f"{s['position']}: {s['text']}" for s in card_summaries])
    prompt = (
        f"Integrate these cards for someone seeking '{intention}':\n{positions_text}\n\n"
        f"Guidelines:\n"
        f"- Identify recurring emotional themes\n"
        f"- Connect cards to inner conflicts and hidden strengths (avoid focusing solely on external events)\n"
        f"- Suggest one small actionable step aligned with their intention\n"
        f"- Use somatic language (e.g., 'notice where this lands in your body')\n"
        f"Tone: Warm mentor, not distant oracle. Focus on self-compassion and empowerment."
    )
    result = get_ai_response(prompt)
    if result is None or result.startswith("ERROR"):
        return "Unable to generate synthesis."
    return result

def ensure_card(card):
    """
    Unwrap a card if nested in a list until a dictionary is reached.
    """
    while isinstance(card, list) and card:
        card = card[0]
    return card if isinstance(card, dict) else {}

def generate_image_path(card):
    """
    Construct an image path from the card's English name (portion before any slash).
    """
    name = card.get("name", "unknown")
    english_name = (
        name.split("/")[0]
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("'", "")
        .replace("-", "_")
    )
    return f"/static/cards/{english_name}.png"

def generate_reading(query, intention=""):
    try:
        cards, instructions = load_all_cards('./data')
        instructions = instructions if isinstance(instructions, dict) else {}
        query_lower = query.lower()

        if "3 card" in query_lower:
            selected_cards = random.sample(cards, 3)
            layout = "three"
        elif "5 card" in query_lower:
            selected_cards = random.sample(cards, 5)
            layout = "plus"
        else:
            selected_cards = [random.choice(cards)]
            layout = "default"

        positions = SPREAD_LAYOUTS.get(layout, ["Central Theme"])
        card_summaries = []
        cards_info = []
        for idx, raw_card in enumerate(selected_cards):
            card = ensure_card(raw_card)
            position = positions[idx] if idx < len(positions) else "Additional Insight"
            summary = generate_card_insight(card, position, query, intention)
            cards_info.append({
                "name": card.get("name", "Mystery Card"),
                "position": position,
                "summary": summary,
                "image": generate_image_path(card)
            })
            card_summaries.append({
                "position": position,
                "text": summary
            })

        if layout == "default":
            # For a single card reading, use the card's insight directly.
            spread_analysis = card_summaries[0]["text"]
        else:
            spread_analysis = generate_spread_synthesis(card_summaries, query, layout, instructions, intention)
        return {
            "synthesis": spread_analysis,
            "cards": cards_info,
            "layout": layout
        }
    except Exception as e:
        error_msg = f"ERROR: Reading Generation Error: {e}"
        print(error_msg)
        return {"error": error_msg}

# Flask app setup
app = Flask(__name__)

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json()
    user_query = data.get("query", "").strip()
    intention = data.get("intention", "").strip()
    if not user_query:
        return jsonify({"error": "No query provided."}), 400

    app.logger.debug("Received query: %s", user_query)
    app.logger.debug("Received intention: %s", intention)

    result = generate_reading(user_query, intention)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
