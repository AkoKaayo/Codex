import random
from load_yaml import load_all_cards

DEFAULT_INSTRUCTIONS = {
    "single": "Reflect on this card's meaning in your current context.",
    "three": "Consider how the combination of these cards might speak to your situation.",
    "five": "Reflect on the story these cards are telling and what lessons they offer."
}

def ensure_dict(obj):
    """
    Recursively unwrap lists to return a dictionary.
    If obj is a dict, return it.
    If obj is a list, iterate over its items and return the first dictionary found.
    Otherwise, return an empty dict.
    """
    if isinstance(obj, dict):
        return obj
    elif isinstance(obj, list):
        for item in obj:
            result = ensure_dict(item)
            if result:
                return result
        return {}
    return {}

def ensure_card(card):
    """
    Recursively unwrap a card if it is nested in a list until it is a dictionary.
    """
    if isinstance(card, dict):
        return card
    elif isinstance(card, list) and card:
        return ensure_card(card[0])
    return {}

def get_instruction(reading_instructions, key):
    """
    Return the instruction text for a given key from reading_instructions,
    or a default fallback if not present.
    """
    return reading_instructions.get(key, DEFAULT_INSTRUCTIONS.get(key, ""))

def generate_reading_text(spread_type, selected_cards, reading_instructions):
    """
    Build the textual reading (synthesis) that lists each card's name and its basic meaning.
    """
    instructions = ensure_dict(reading_instructions)
    if spread_type == 'three':
        instruction_text = get_instruction(instructions, "three")
        prefix = "Your three cards are:\n"
    elif spread_type == 'five':
        instruction_text = get_instruction(instructions, "five")
        prefix = "Your five cards are:\n"
    else:
        instruction_text = get_instruction(instructions, "single")
        prefix = "Your card is:\n"

    lines = [prefix]
    for idx, card in enumerate(selected_cards, 1):
        card_name = card.get("name", "Unknown")
        # Use 'meaning' if provided; otherwise, it remains blank
        card_meaning = card.get("meaning", "")
        line = f"Card {idx}: {card_name}"
        if card_meaning:
            line += f". Meaning: {card_meaning}"
        lines.append(line)
    synthesis = "\n".join(lines) + "\n" + instruction_text
    return synthesis.strip()

def generate_reading(query):
    """
    Generates a tarot reading based on the query.
    1. Loads cards and reading instructions from /data.
    2. Determines the spread type (single / 3-card / 5-card) from the query.
    3. Randomly selects the needed cards.
    4. Builds a synthesis text that references each card.
    5. Returns a dict with synthesis, full card details, and layout.
    """
    DATA_DIR = './data'
    cards, reading_instructions = load_all_cards(DATA_DIR)
    if not cards:
        return {
            "synthesis": "No cards found. Please check your YAML data.",
            "cards": [],
            "layout": "default"
        }
    query_lower = query.lower()
    if "3 card" in query_lower:
        spread_type = 'three'
        selected_cards = random.sample(cards, 3)
        layout = "three"
    elif "5 card" in query_lower:
        spread_type = 'five'
        selected_cards = random.sample(cards, 5)
        layout = "plus"
    else:
        spread_type = 'single'
        selected_cards = [random.choice(cards)]
        layout = "default"

    synthesis = generate_reading_text(spread_type, selected_cards, reading_instructions)

    # Build the array of card details to pass to the frontend.
    cards_info = []
    for card in selected_cards:
        card = ensure_card(card)
        full_name = card.get("name", "Unknown")
        english_name = full_name.split("/")[0].strip().lower().replace(" ", "_")
        card_details = {
            "name": full_name,
            "keywords": card.get("keywords", []),
            "interpretations": card.get("interpretations", ""),
            "description": card.get("description", ""),
            "reading": card.get("reading", ""),
            "monologue": card.get("monologue", ""),
            "image": f"/static/cards/{english_name}.png"
        }
        cards_info.append(card_details)
    return {
        "synthesis": synthesis,
        "cards": cards_info,
        "layout": layout
    }

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = "random card"
    result = generate_reading(query)
    print(result)
