import os
import random
from openai import OpenAI
import yaml
from flask import Flask, request, jsonify
from load_yaml import load_all_cards, load_yaml_files, structure_data

# Initialize the OpenAI client with your API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
AI_MODEL = "gpt-3.5-turbo"
MAX_TOKENS = 2000

# Layout definitions
SPREAD_LAYOUTS = {
    "default": ["MAIN ACTOR"],
    "three": ["PAST", "PRESENT", "FUTURE"],
    "plus": [
        "WHAT PREVENTS YOU FORM BEING YOURSELF?",
        "WITH WHAT MEANS CAN YOU FREE YOURSELF?",
        "WHAT ACTION SHOULD YOU UNDERTAKE?",
        "INTO WHAT TRANSFORMATION ARE YOU BEING LED?",
        "WHAT IS YOUR ULTIMATE PURPOSE OR DESTINY?"
    ]
}

###################################################
# Minimal OpenAI Caller
###################################################
def get_ai_response(prompt):
    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=MAX_TOKENS,
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI API Error: {e}")
        return None

###################################################
# Basic Utility
###################################################
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

###################################################
# Paraphrasing the user intention
###################################################
def generate_paraphrased_intention(intention):
    """
    Produce an interesting opening line that transforms the user intention into an open sentence.
    Expand, elaborate, avoiding verbatim repetition and contradicting the initial query.
    """
    if not intention or len(intention) < 10:
        return "Let us explore the Tarot’s guidance on your situation."
    
    prompt = f"""
Paraphrase this user query into a short, interesting opening for a Tarot reading, in British English:
\"{intention}\"

Examples:
- We will now enquire the Tarot about your work environment
- Let’s see what the cards say about how tomorrow will unfold
- Oh, a broad question about life
- You came seeking advice about your trip
- Love with its depth, mystery and grip

Keep it direct, warm, and avoid repeating the user question verbatim. 
"""
    result = get_ai_response(prompt)
    if not result:
        # fallback
        return "Let us explore the Tarot’s guidance on your question."
    return result

def generate_introduction(intention):
    """
    A single-line introduction that paraphrases the user's query.
    """
    return generate_paraphrased_intention(intention)

###################################################
# Degrees + Suits
###################################################
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

###################################################
# detect_suit_synergy - skip "no pattern" lines
###################################################
def detect_suit_synergy(card_summaries, layout):
    from collections import Counter
    suits = [c["suit"] for c in card_summaries if c["suit"]]
    if not suits:
        return ""
    count = Counter(suits)
    
    # Decide how many is "dominant" depending on layout
    # E.g., if 'three' => 2 or more repeated, if 'plus' => 3 or more repeated, else single no synergy
    if layout == "three":
        needed = 2
    elif layout == "plus":
        needed = 3
    else:
        needed = 999  # single card can't have synergy
    
    repeated_suits = []
    for s, cnt in count.items():
        if cnt >= needed:
            repeated_suits.append(f"{s.capitalize()} x{cnt}")
    if repeated_suits:
        return "Repeated suits: " + ", ".join(repeated_suits)
    return ""  # if no synergy, return empty => skip line

###################################################
# Combine multiple monologues -> final oracle
###################################################
def generate_spread_monologue(monologues_list, intention):
    """
    Combine individual card monologues into a unified final oracle message.
    
    Parameters:
      - monologues_list: A list of strings (each card's 'monologue' from YAML).
      - intention: The user's intention or query (used for context).
    
    Returns:
      A monologue from the spread (if it could speak) that weaves together and paraphrases the card monologues, reflecting on the user's intention. 
    """
    if not monologues_list:
        return "Embrace the wisdom of the cards as they silently guide you."

    # Concatenate all monologues into one string
    combined_monologues = " ".join(monologues_list)
    
    # Create a prompt that asks the AI to fuse these monologues with the user's intention.
    prompt = f"""
We have the following card monologues: {combined_monologues}
The user's intention is: "{intention}"
Create a concise 2–3 line oracle message that unifies the essence of these monologues 
into a final reflective message for the reading. Write in British English, be warm and introspective, 
and do not include extraneous text.
"""
    response = get_ai_response(prompt)
    return response if response else "Embrace the wisdom of the cards as they guide you on your path."

###################################################
# Card Analysis (no 'As your Past...')
###################################################
def generate_card_analysis(card, position, suits_lookup, degrees_lookup):
    """
    2-paragraph reading merging description, interpretations, reading.
    Remove 'As your {position}' from the text to avoid duplication 
    in synergy bullet headings. 
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

    # Degree
    deg_info = lookup_degree_data(card, degrees_lookup)
    deg_meaning = deg_info.get("meaning", "").strip()
    deg_shadow = deg_info.get("shadow", "").strip()

    # Basic pos/neg
    pos_kw = keywords[0] if keywords else ""
    neg_kw = keywords[-1] if len(keywords) > 1 else ""

    # We'll no longer say "As your {position}" in the prompt, just mention it neutrally
    # The synergy bullets handle the explicit labeling of position.
    prompt = f"""
Combine these details into a concise 2-paragraph reading for the card '{card_name}', ignoring the phrase 'As your {position}':

Details:
- Suit (if minor): '{suit}'
- Description: "{description}"
- Interpretations: "{interpretations_text}"
- Official reading: "{reading_text}"
- Positive keyword: "{pos_kw}"
- Negative keyword: "{neg_kw}"
- If minor arcana Ace–Ten => meaning: "{deg_meaning}" and shadow: "{deg_shadow}"
- If Ten => final_stage: "{final_stage_text}"
(No disclaimers beyond this info, write in British English, direct, balanced.)
"""
    result = get_ai_response(prompt)
    if not result:
        result = (f"{card_name}: {description[:100]}... {reading_text[:80]}")
    return result

###################################################
# synergy for multiple cards
###################################################
def generate_spread_synthesis(card_summaries, layout, intention, synergy_text=""):
    entries = []
    for cs in card_summaries:
        pos_label = cs.get("position", "Unknown")
        analysis = cs.get("analysis", "")
        # Each entry is now an HTML snippet with a header for the position and a paragraph for the analysis.
        entry = f"<h3 class='card-position'>{pos_label}</h3><p class='card-analysis'>{analysis}</p>"
        entries.append(entry)
    bullet_body = "\n".join(entries)
    
    # Start with the bullet entries and append any additional synergy text if provided.
    synergy_result = bullet_body
    if synergy_text:
        synergy_result += f"\n\n{synergy_text}"
    
    # Add a titled final synergy paragraph.
    synergy_paragraph = generate_spread_summary_paragraph(card_summaries, layout, intention)
    synergy_result += f"\n\n<h3 class='tarot-message-title'>THE TAROT'S MESSAGE</h3>\n<p class='tarot-message'>{synergy_paragraph}</p>"
    
    return synergy_result

def build_noAI_synergy_paragraph(card_summaries, intention):
    """
    Construct a short synergy block by concatenating each card's 
    official reading in a single paragraph. We reference the position,
    card name, and the official reading text from the YAML, 
    guaranteeing no external knowledge is introduced.
    
    Return HTML snippet that:
      - starts with a heading <h2>THE TAROT'S MESSAGE</h2>
      - includes a short synergy paragraph
    """
    synergy_lines = []
    synergy_lines.append("<h2 class='tarot-message-title'>THE TAROT'S MESSAGE</h2>")

    # We'll gather each official reading plus position in a single short paragraph.
    # E.g. "Past (Ten of Wands): Official reading text..."
    content = ""
    for c in card_summaries:
        pos = c.get("position", "Unknown")
        name = c.get("name", "Unnamed Card")
        offic = c.get("official_reading", "").strip()

        # If no official reading is found, we can do a fallback
        if not offic:
            offic = "(No official reading provided)"

        # Append a short line
        content += f"{pos} ({name}): {offic}\n"
    
    # Optionally add user intention at the end:
    # "Reflect on how these official readings align with your intention: [intention]"
    synergy_lines.append(
        f"<p class='tarot-message'>{content.strip()}<br/><br/>"
        f"Reflect on how these readings align with your intention: {intention}</p>"
    )

    return "\n".join(synergy_lines)

def generate_spread_summary_paragraph(card_summaries, layout, intention):
    """
    Creates a short synergy paragraph referencing each card's position,
    name, and its official reading text from the YAML, while weaving in the user's intention.
    The result is a 3-4 sentence summary that unifies the spread's insights.
    """
    synergy_data = []
    for c in card_summaries:
        pos_name = c.get("position", "Unknown")
        card_name = c.get("name", "Unnamed Card")
        official_reading = c.get("official_reading", "").strip()
        if not official_reading:
            official_reading = "No official reading provided."
        synergy_data.append(f"{pos_name}: {card_name} - {official_reading}")
    
    joined_cards = "; ".join(synergy_data)
    
    prompt = f"""
We have the following positions and cards with their official readings: {joined_cards}
The user's intention is: "{intention}"
Using ONLY the provided information, write a single short paragraph (3-4 sentences) summarising the entire spread into a cohesive reflection.
Be direct, warm, and write in British English.
"""
    response = get_ai_response(prompt)
    return response if response else "A broad synergy emerges, inviting reflection on all positions."

###################################################
# Updated generate_reading function
###################################################
def generate_reading(user_query, intention=""):
    from collections import defaultdict
    try:
        # Load cards and reading instructions from YAML
        cards, reading_instructions = load_all_cards('./data')
        if not cards:
            return {"error": "No cards found. Please check your YAML data.", "cards": [], "layout": "default"}

        loaded_data = load_yaml_files('./data')
        integrated_data = structure_data(loaded_data)
        degrees_data = integrated_data.get('degrees', [])
        suits_data = integrated_data.get('suits', [])

        # Build degrees lookup
        degrees_lookup = {}
        if isinstance(degrees_data, list):
            for deg in degrees_data:
                key = str(deg.get("degree", "")).lower()
                if key:
                    degrees_lookup[key] = deg

        # Build suits lookup
        suits_lookup = {}
        if isinstance(suits_data, list):
            for s in suits_data:
                skey = s.get("suit", "").lower()
                if skey:
                    suits_lookup[skey] = s

        # Determine spread type
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

        # Generate paraphrased introduction
        intro_text = generate_introduction(intention)

        card_summaries = []
        cards_info = []
        monologues_list = []  # For oracle message

        for idx, raw_card in enumerate(selected_cards):
            card = ensure_card(raw_card)
            pos_name = positions[idx] if idx < len(positions) else "Extra"
            analysis = generate_card_analysis(card, pos_name, suits_lookup, degrees_lookup)
            
            cdict = {
                "name": card.get("name", "Unknown"),
                "suit": card.get("suit", ""),
                "position": pos_name,
                "analysis": analysis,
                "image": generate_image_path(card),
                "official_reading": card.get("reading", "")
            }
            cards_info.append(cdict)
            card_summaries.append(cdict)
            
            if card.get("monologue", ""):
                monologues_list.append(card.get("monologue"))

        synergy_notes = detect_suit_synergy(card_summaries, layout)

        if layout == "default":
            single_analysis = card_summaries[0]["analysis"]
            card_monologue = monologues_list[0] if monologues_list else ""
            single_synthesis = single_analysis
            if card_monologue:
                single_synthesis += f"\n\nHere's a deeper reflection from this card's essence:\n{card_monologue}"
            single_synthesis += "\n\nThis single card reading explores your question in a focused manner."
            final_synthesis = single_synthesis
        else:
            final_synthesis = generate_spread_synthesis(card_summaries, layout, intention, synergy_notes)

        final_oracle = generate_spread_monologue(monologues_list, intention)

        return {
            "introduction": intro_text,
            "cards": cards_info,
            "synthesis": final_synthesis,
            "oracle_message": final_oracle,
            "layout": layout
        }

    except Exception as e:
        err_msg = f"ERROR: Reading Generation Error: {str(e)}"
        print(err_msg)
        return {"error": err_msg}