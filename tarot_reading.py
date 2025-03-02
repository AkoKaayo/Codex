import os
import random
import openai
import yaml
from flask import Flask, request, jsonify
from load_yaml import load_all_cards, load_yaml_files, structure_data

# Configuration
openai.api_key = os.getenv("OPENAI_API_KEY")
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
    while isinstance(card, list) and card:
        card = card[0]
    return card if isinstance(card, dict) else {}

def generate_image_path(card):
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

# --- New Functions per Revised Plan with Enhanced Verbosity ---

def generate_unpacked_intention(intention):
    prompt = f"""
Rephrase the user’s intention (‘{intention}’) as an open-ended inquiry. Use ONLY their words and metaphors drawn from the Tarot’s symbolic grammar (e.g., ‘paths’, ‘journey’, ‘unfold’). Do NOT mention cards, suits, or degrees. Please provide a detailed, multi-paragraph explanation that explores the metaphorical landscape.
""".strip()
    result = get_ai_response(prompt)
    return result if result else intention

def get_suit_details(suit, suits_lookup):
    suit_info = suits_lookup.get(suit.lower(), {})
    element = suit_info.get("element", "Unknown Element")
    final_stage = suit_info.get("final_stage", "")
    commentary = suit_info.get("commentary", "")
    return element, final_stage, commentary

def generate_card_intro(card, suits_lookup):
    card_name = card.get("name", "Unknown")
    suit = card.get("suit", "Mystery")
    element, _, _ = get_suit_details(suit, suits_lookup)
    # Extract role if it is a Court Card
    role = ""
    for r in ["Page", "Knight", "Queen", "King"]:
        if r in card_name:
            role = r
            break
    card_description = card.get("description", "No description available.")
    keywords = card.get("keywords", [])
    positive = keywords[0] if keywords else "mystery"
    negative = keywords[-1] if keywords else "uncertainty"
    prompt = f"""
Introduce the {card_name} in 3 detailed lines, expanding with rich symbolism:
1. Suit/Element: Describe the card as '{suit} ({element})' and note its role {f'(Role: {role})' if role else ''}.
2. Symbolism: Provide a detailed, multi-paragraph exploration of one key visual detail drawn from its description: '{card_description}'.
3. Ambivalence: Elaborate on the duality by merging one positive keyword ('{positive}') and one negative keyword ('{negative}'), discussing how they interplay.
Ensure your response is vivid and layered.
""".strip()
    result = get_ai_response(prompt)
    return result if result else f"{card_name} remains enigmatic."

def lookup_degree(card, degrees_lookup):
    number = card.get("number", "")
    mapping = {"Ace": "1", "Two": "2", "Three": "3", "Four": "4", "Five": "5", 
               "Six": "6", "Seven": "7", "Eight": "8", "Nine": "9", "Ten": "10"}
    degree_key = mapping.get(number, str(number)).lower() if number else ""
    return degrees_lookup.get(degree_key, {})

def generate_card_position(card, position, degrees_lookup):
    card_name = card.get("name", "Unknown")
    degree_info = lookup_degree(card, degrees_lookup)
    degree_meaning = degree_info.get("meaning", "a mysterious phase")
    degree_shadow = degree_info.get("shadow", "an unseen warning")
    card_description = card.get("description", "No visual details provided.")
    prompt = f"""
Analyze the {card_name} in the ‘{position}’ position. Provide a multi-paragraph, detailed analysis that explores:
1. Role: How does the position (e.g., ‘{position}’ as a foundational or guiding stage) interact with and transform the card’s inherent energy?
2. Elemental Dialogue: Consider the imagery '{card_description}' and discuss in depth how this visual detail mirrors its role in this position.
3. Degree Guidance: Reflect on the card’s stage as ‘{degree_meaning}’ and heed the caution of ‘{degree_shadow}’—please expand on all symbolic nuances without mentioning specific numbers.
""".strip()
    result = get_ai_response(prompt)
    return result if result else f"The role of {card_name} in the {position} remains a riddle."

def generate_spread_synthesis(card_summaries, layout, intention, suits_lookup):
    positions_text = "\n".join([f"{cs['position']}: {cs['text']}" for cs in card_summaries])
    prompt = f"""
Synthesize this spread into a cohesive, multi-paragraph narrative that weaves together every symbolic element:
1. Elemental Balance: Identify the dominant elements among the cards and discuss their broader implications.
2. Pivot Card: Highlight the card whose transformation or degree commentary best resolves the spread’s tension.
3. Suit Transformations: Incorporate insights from final-stage details found in the suits data.
Context: The reading is for '{intention}'.
Individual card insights:
{positions_text}
Expand on every layer of nuance and symbolism.
""".strip()
    result = get_ai_response(prompt)
    return result if result else "The synthesis remains elusive."

def generate_oracle_message(card):
    card_monologue = card.get("monologue", "Silence holds secrets.")
    card_description = card.get("description", "")
    prompt = f"""
Craft an oracle’s message using the following guidelines:
- Include a direct quote from the card’s monologue: ‘{card_monologue}’.
- Pose a reflective, multi-paragraph question that probes the central tension of the spread.
- Draw upon a metaphor from the card’s description (for example, references such as ‘chalice’, ‘blade’, or ‘torch’) and elaborate on it.
Ensure the message is warm, introspective, and richly detailed.
""".strip()
    result = get_ai_response(prompt)
    return result if result else f"The oracle speaks silently about {card.get('name', 'this card')}."

# --- Main Reading Generation Function ---

def generate_reading(user_query, intention=""):
    try:
        # Load cards and reading instructions from YAML
        cards, reading_instructions = load_all_cards('./data')
        if not cards:
            return {"error": "No cards found. Please check your YAML data.", "cards": [], "layout": "default"}

        # Load full integrated YAML data to get degrees and suits
        loaded_data = load_yaml_files('./data')
        integrated_data = structure_data(loaded_data)
        degrees_data = integrated_data.get('degrees', [])
        suits_data = integrated_data.get('suits', [])

        # Build degrees lookup: map degree key (as lowercase string) to its dict.
        degrees_lookup = {}
        if isinstance(degrees_data, list):
            for deg in degrees_data:
                key = str(deg.get("degree", "")).lower()
                if key:
                    degrees_lookup[key] = deg

        # Build suits lookup: map suit name (lowercase) to its dict.
        suits_lookup = {}
        if isinstance(suits_data, list):
            for s in suits_data:
                key = s.get("suit", "").lower()
                if key:
                    suits_lookup[key] = s

        # Determine spread type based on user_query
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

        # Process each selected card
        for idx, raw_card in enumerate(selected_cards):
            card = ensure_card(raw_card)
            position_name = positions[idx] if idx < len(positions) else "Additional Insight"

            # Generate card introduction (factual + poetic)
            intro_text = generate_card_intro(card, suits_lookup)
            # Generate position analysis
            position_text = generate_card_position(card, position_name, degrees_lookup)

            # Build card info for the front-end
            card_dict = {
                "name": card.get("name", "Mystery Card"),
                "position": position_name,
                "image": generate_image_path(card),
                "intro": intro_text,
                "position_analysis": position_text
            }
            cards_info.append(card_dict)
            card_summaries.append({
                "position": position_name,
                "text": position_text
            })

        # Generate spread synthesis for multi-card spreads
        if layout == "default":
            spread_analysis = card_summaries[0]["text"]
        else:
            spread_analysis = generate_spread_synthesis(card_summaries, layout, intention, suits_lookup)

        # Generate oracle message using the first card as pivot
        oracle_message = generate_oracle_message(selected_cards[0])

        # Unpack user intention neutrally
        unpacked_intention = generate_unpacked_intention(intention)

        # Compose final output
        return {
            "unpacked_intention": unpacked_intention,
            "cards": cards_info,
            "synthesis": spread_analysis,
            "oracle_message": oracle_message,
            "layout": layout
        }

    except Exception as e:
        error_msg = f"ERROR: Reading Generation Error: {str(e)}"
        print(error_msg)
        return {"error": error_msg}

###################################
# Flask App (Optional)
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
