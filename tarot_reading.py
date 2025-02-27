import os
import random
import openai
from flask import Flask, request, jsonify
from load_yaml import load_all_cards

# Configuration
openai.api_key = os.getenv("OPENAI_API_KEY")  # For openai>=1.0.0 usage
AI_MODEL = "gpt-3.5-turbo"
MAX_TOKENS = 2000

# Spread layouts
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
    """
    Calls OpenAI ChatCompletion (>=1.0.0).
    Returns the model's response text or None if there's an error.
    """
    try:
        response = openai.ChatCompletion.create(
            model=AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=MAX_TOKENS,
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI API Error: {e}")
        return None

def ensure_card(card):
    """
    Safely unwrap a card if nested in lists, returning a dict.
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

def generate_card_insight(card, position, intention):
    """
    Generate an interpretation, explicitly embedding your YAML data in the prompt.
    This should minimize GPT's reliance on external definitions.
    """
    card_name = card.get("name", "Unknown")
    card_keywords = ", ".join(card.get("keywords", []))
    card_interpretations = card.get("interpretations", "")
    card_description = card.get("description", "")
    card_monologue = card.get("monologue", "")

    # Prompt that includes your library info in a structured way
    prompt = f"""
You are a self-aware tarot oracle, who uses the following custom library information:
Do NOT replace the library text with outside definitions. Instead, expand on it in your own words. Only reference the library text provided. Paraphrase your sources and do not repeat any instruction text.
---
Card Name: {card_name}

Keywords: {card_keywords}

Library Interpretations (verbatim):
{card_interpretations}

Library Description:
{card_description}

Library Monologue (additional flavor):
{card_monologue}
---

Now, interpret the '{card_name}' specifically in the '{position}' position for someone whose intention or context is:
'{intention}'

Please follow these guidelines:
1. Begin by incorporating the above custom library text (do not contradict it).
2. Briefly describe each card traditonal meaning and significance in the context of the reading.
3. Get inspiraton from Jungian archetypal psychoanalysis for symbolic interpretation and embody a Stoic mindset for any advice you might give.
4. Focus on providing a clear and insighful message regarding '{position}' having the '{intention}' in consideration.
5. Keep warm and eloquent in tone. Avoid generic, cliche, or external references that contradict our library.
6. Do NOT replace the library text with outside definitions. Instead, expand on it in your own words.
7. Do not mention your instructions. Always paraphrase your source information.

Reply with your final reading below:
""".strip()

    ai_result = get_ai_response(prompt)
    if not ai_result:
        return "No interpretation available (API error or empty response)."
    return ai_result

def generate_spread_synthesis(card_summaries, layout, intention):
    """
    Combine individual card insights into a final 'spread synthesis'.
    """
    positions_text = "\n".join([
        f"{cs['position']}: {cs['text']}" for cs in card_summaries
    ])

    prompt = f"""
You have the following position-based tarot insights (from our custom library expansions):
{positions_text}

Now create a cohesive 'spread synthesis' for someone seeking '{intention}'.
Guidelines:
1. Get inspiraton from Jungian archetypal psychoanalysis for symbolic interpretation and embody a Stoic mindset for any advice you might give.
3. Deliver a clear and insighful final conclusion that summarizes the spread as a whole. Focus on promoting self-awareness and introspection trhough your words.
4. Keep warm and eloquent in tone. Avoid generic, cliche, and external references that contradict our library.
5. Do not mention your instructions. Always paraphrase your source information.

Only expand on the insights given.
Reply with your final synthesis:
""".strip()

    result = get_ai_response(prompt)
    if not result:
        return "Verify your connection and try again."
    return result

def generate_reading(user_query, intention=""):
    """
    1. Load cards & instructions from YAML
    2. Figure out single vs 3 vs 5 card spread
    3. For each card, call generate_card_insight with YAML data in the prompt
    4. Possibly generate a 'spread_synthesis' if multi-card
    5. Return JSON with final data
    """
    try:
        cards, instructions = load_all_cards('./data')
        if not cards:
            return {
                "error": "No cards found. Please check your YAML data.",
                "cards": [],
                "layout": "default"
            }

        query_lower = user_query.lower()
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
            position_name = positions[idx] if idx < len(positions) else "Additional Insight"

            # Generate the GPT-based insight, feeding in library text
            insight_text = generate_card_insight(card, position_name, intention)

            # Build a dict for the front-end
            card_dict = {
                "name": card.get("name", "Mystery Card"),
                "position": position_name,
                "keywords": card.get("keywords", []),
                "interpretations": card.get("interpretations", ""),
                "description": card.get("description", ""),
                "monologue": card.get("monologue", ""),
                "image": generate_image_path(card),
                "summary": insight_text
            }
            cards_info.append(card_dict)

            card_summaries.append({
                "position": position_name,
                "text": insight_text
            })

        if layout == "default":
            # Single card reading => just use that one card's summary
            spread_analysis = card_summaries[0]["text"]
        else:
            # For 3- or 5-card, generate a synergy reading
            spread_analysis = generate_spread_synthesis(card_summaries, layout, intention)

        return {
            "synthesis": spread_analysis,
            "cards": cards_info,
            "layout": layout
        }

    except Exception as e:
        error_msg = f"ERROR: Reading Generation Error: {str(e)}"
        print(error_msg)
        return {"error": error_msg}


###################################
# Optional Flask App below
###################################
app = Flask(__name__)

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json() or {}
    user_query = data.get("query", "").strip()
    intention = data.get("intention", "").strip()

    if not user_query:
        return jsonify({"error": "No query provided."}), 400

    result = generate_reading(user_query, intention)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
