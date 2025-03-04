import os
import random
import openai
import yaml
from flask import Flask, request, jsonify
from load_yaml import load_all_cards, load_yaml_files, structure_data

# Config
openai.api_key = os.getenv("OPENAI_API_KEY")
AI_MODEL = "gpt-3.5-turbo"
MAX_TOKENS = 2000

# Spread Layouts
SPREAD_LAYOUTS = {
    "default": ["Protagonist"],
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

###################################
# Introductions + synergy
###################################

def generate_introduction(intention):
    """
    A single line paraphrasing the user's question or intention into an open sentence.
    """
    if not intention:
        return "Let us begin this reading."
    return f"You’ve asked about: {intention}. Let us see how the cards illuminate your situation."

def detect_suit_synergy(card_summaries):
    """
    Example synergy detection: repeated suits
    or major arcana overshadowing minors, etc.
    We'll keep it simple: count suits.
    """
    from collections import Counter
    suits = [c["suit"] for c in card_summaries if c["suit"]]
    suit_count = Counter(suits)
    repeated = [f"{s.capitalize()} x{cnt}" for s, cnt in suit_count.items() if cnt > 1]
    if repeated:
        return "Repeated suits: " + ", ".join(repeated)
    return "No special suit patterns"

###################################
# Degrees + Suit Lookups
###################################

def lookup_degree_data(card, degrees_lookup):
    num_map = {
        "Ace": "1", "Two": "2", "Three": "3", "Four": "4",
        "Five": "5", "Six": "6", "Seven": "7", "Eight": "8",
        "Nine": "9", "Ten": "10"
    }
    number = card.get("number", "")
    if number not in num_map:
        return {}
    deg_key = num_map[number].lower()
    info = degrees_lookup.get(deg_key, {})
    return {
        "meaning": info.get("meaning", ""),
        "shadow": info.get("shadow", "")
    }

###################################
# Card Analysis
###################################

def generate_card_analysis(card, position, suits_lookup, degrees_lookup):
    """
    Returns a 2-paragraph reading that merges:
      - description
      - interpretations
      - reading (the YAML official reading)
      - keywords, plus a positive & negative if possible
      - degree info if minor
      - final_stage if Ten
    """
    card_name = card.get("name", "Unknown Card")
    suit = card.get("suit", "")
    description = card.get("description", "")
    interpretations_text = card.get("interpretations", "")
    reading_text = card.get("reading", "")
    monologue = card.get("monologue", "")

    keywords = card.get("keywords", [])
    number = card.get("number", "")

    # Suit data
    suit_info = suits_lookup.get(suit.lower(), {}) if suit else {}
    final_stage_text = suit_info.get("final_stage", "")

    # Degrees
    deg_info = lookup_degree_data(card, degrees_lookup)
    deg_meaning = deg_info.get("meaning", "").strip()
    deg_shadow = deg_info.get("shadow", "").strip()

    # Basic pos/neg keywords
    pos_kw = keywords[0] if keywords else ""
    neg_kw = keywords[-1] if len(keywords) > 1 else ""

    # Build an AI prompt:
    prompt = f"""
Combine these details into a concise 2-paragraph reading for the card '{card_name}' at position '{position}':

Details to use:
- Suit (if minor): '{suit}'
- Description: "{description}"
- Interpretations: "{interpretations_text}"
- Official 'reading': "{reading_text}"
- Positive keyword: "{pos_kw}"
- Negative keyword: "{neg_kw}"
- If minor arcana Ace–Ten => meaning: "{deg_meaning}", shadow: "{deg_shadow}"
- If Ten => final_stage: "{final_stage_text}"
- Link to position: e.g. "As your {position}, ..."

Write in British English, direct, balanced, no disclaimers about missing data, no guesses beyond what's listed.
""".strip()

    result = get_ai_response(prompt)
    if not result:
        # fallback
        fallback = f"The {card_name} at {position} references: {description[:80]}...\nReading: {reading_text[:80]}"
        return fallback
    return result

###################################
# Spread Synthesis
###################################

def generate_spread_synthesis(card_summaries, layout, intention, synergy_text="No special suit patterns"):
    """
    Summarise the multi-card reading referencing each position explicitly.
    If the total text is big, shift to a short narrative. Otherwise, bullet-based.
    """
    bullet_entries = []
    total_word_count = 0

    for cs in card_summaries:
        pos = cs.get("position", "Unknown Position")
        nm = cs.get("name", "Unnamed Card")
        analysis = cs.get("analysis", "")
        wcount = len(analysis.split())
        total_word_count += wcount
        bullet_entries.append(f"• **{pos}** — *{nm}*\n{analysis}")

    bullet_body = "\n\n".join(bullet_entries)
    threshold = 120  # Adjust as needed

    if total_word_count > threshold:
        synergy_result = (
            f"In this reading, we address your query: \"{intention}\"\n\n"
            f"Below are the cards and their positions:\n\n{bullet_body}\n\n"
            f"Overall synergy notes: {synergy_text}\n\n"
            f"Together, these insights form a cohesive story—each position illuminates a unique facet "
            f"of your journey. Reflect on how they interrelate to guide your question."
        )
    else:
        synergy_result = (
            f"Here is how each card speaks to your query: \"{intention}\"\n\n"
            f"{bullet_body}\n\n"
            f"Synergy notes: {synergy_text}\n"
            f"Take these messages in unison to find a balanced path forward."
        )

    return synergy_result

###################################
# Oracle
###################################

def generate_oracle_message(card):
    nm = card.get("name", "Unknown Card")
    monologue = card.get("monologue", "")
    if not monologue:
        return f"No monologue for {nm}."
    prompt = f"""
Create a one-line 'oracle message' using the card '{nm}' monologue below:
\"{monologue}\"
Be warm, introspective, and direct.
""".strip()
    result = get_ai_response(prompt)
    if not result:
        return f"{nm}: [No oracle message generated]"
    return result

###################################
# Main Reading
###################################

app = Flask(__name__)

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json() or {}
    user_query = data.get("query", "").strip()
    intention = data.get("intention", "").strip()

    if not user_query:
        return jsonify({"error": "No query provided."}), 400

    outcome = generate_reading(user_query, intention)
    return jsonify(outcome)

def generate_reading(user_query, intention=""):
    try:
        # Load data
        cards, reading_instructions = load_all_cards('./data')
        if not cards:
            return {"error": "No cards found. Check YAML data.", "cards": [], "layout": "default"}

        loaded_data = load_yaml_files('./data')
        integrated_data = structure_data(loaded_data)
        degrees_data = integrated_data.get('degrees', [])
        suits_data = integrated_data.get('suits', [])

        # Build lookups
        degrees_lookup = {}
        if isinstance(degrees_data, list):
            for deg in degrees_data:
                key = str(deg.get("degree", "")).lower()
                if key:
                    degrees_lookup[key] = deg
        
        suits_lookup = {}
        if isinstance(suits_data, list):
            for s in suits_data:
                skey = s.get("suit", "").lower()
                if skey:
                    suits_lookup[skey] = s
        
        # Decide layout
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
        
        # Introduction
        intro_text = generate_introduction(intention)

        card_summaries = []
        cards_info = []

        for idx, raw_card in enumerate(selected_cards):
            card = ensure_card(raw_card)
            pos_name = positions[idx] if idx < len(positions) else "Additional Insight"
            analysis = generate_card_analysis(card, pos_name, suits_lookup, degrees_lookup)
            
            cdict = {
                "name": card.get("name", "Mystery Card"),
                "suit": card.get("suit", ""),
                "position": pos_name,
                "analysis": analysis,
                "image": generate_image_path(card)
            }
            cards_info.append(cdict)
            card_summaries.append(cdict)

        # Suit synergy detection
        synergy_notes = detect_suit_synergy(card_summaries)

        # Single vs multiple synergy
        if layout == "default":
            # single card => synergy is basically the card's analysis + mention of the user's query
            final_synthesis = card_summaries[0]["analysis"]
            final_synthesis += f"\n\nThis single card reading reflects your query: \"{intention}\"."
        else:
            final_synthesis = generate_spread_synthesis(card_summaries, layout, intention, synergy_notes)

        # Oracle from the first selected card
        oracle_msg = generate_oracle_message(selected_cards[0])

        return {
            "introduction": intro_text,
            "cards": cards_info,
            "synthesis": final_synthesis,
            "oracle_message": oracle_msg,
            "layout": layout
        }
    except Exception as e:
        err_msg = f"ERROR: Reading Generation Error: {str(e)}"
        print(err_msg)
        return {"error": err_msg}


if __name__ == "__main__":
    app.run(debug=True)
