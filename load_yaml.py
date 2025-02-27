import os
import yaml
import logging

logging.basicConfig(level=logging.DEBUG)

DATA_DIR = './data'

def load_yaml_files(directory):
    """
    Scans the given directory for .yml/.yaml files,
    parses them, and returns a dictionary keyed by filename.
    """
    yaml_data = {}
    for filename in os.listdir(directory):
        if filename.endswith(('.yml', '.yaml')):
            file_path = os.path.join(directory, filename)
            with open(file_path, 'r', encoding='utf-8') as file:
                try:
                    contents = list(yaml.safe_load_all(file))
                    # In some cases, a YAML file might have multiple documents. We handle that here.
                    if len(contents) == 1:
                        yaml_data[filename] = contents[0]
                    else:
                        yaml_data[filename] = contents
                except yaml.YAMLError as e:
                    logging.error(f"Error loading {filename}: {e}")
    return yaml_data

def structure_data(loaded_data):
    """
    Organizes loaded YAML data into a structure for major/minor arcana, suits, etc.
    Adjust as needed if you have different file naming or logic.
    """
    tarot_data = {
        'court_cards': loaded_data.get('court_cards.yml', {}),
        'major_arcana': {
            'part1': loaded_data.get('major_arcana_1.yml', []),
            'part2': loaded_data.get('major_arcana_2.yml', [])
        },
        'minor_arcana': {
            'swords': loaded_data.get('minor_arcana_swords.yml', {}),
            'cups': loaded_data.get('minor_arcana_cups.yml', {}),
            'wands': loaded_data.get('minor_arcana_wands.yml', {}),
            'pentacles': loaded_data.get('minor_arcana_pentacles.yml', {})
        },
        'reading': loaded_data.get('reading.yml', {}),
        'degrees': loaded_data.get('degrees.yml', {}),
        'structure': loaded_data.get('structure.yml', {}),
        'suits': loaded_data.get('suits.yml', {})
    }
    return tarot_data

def load_all_cards(directory):
    """
    Loads and integrates card data from the structured YAML.
    Returns (cards, reading_instructions).
    `cards` is a list of dictionary objects, each representing a card.
    `reading_instructions` can be any extra info from reading.yml, if desired.
    """
    loaded_data = load_yaml_files(directory)
    integrated_data = structure_data(loaded_data)
    
    cards = []
    
    # Process Major Arcana
    major = integrated_data.get('major_arcana', {})
    for part in ['part1', 'part2']:
        part_data = major.get(part, [])
        if isinstance(part_data, list):
            for item in part_data:
                # If item is a list of dict(s), unwrap
                if isinstance(item, list):
                    item = item[0] if item else {}
                if isinstance(item, dict) and 'name' in item:
                    cards.append(item)
        elif isinstance(part_data, dict):
            for _, value in part_data.items():
                if isinstance(value, dict) and 'name' in value:
                    cards.append(value)
    
    # Process Minor Arcana suits
    for suit in ['swords', 'cups', 'wands', 'pentacles']:
        suit_data = integrated_data['minor_arcana'].get(suit, {}).get('cards', [])
        for card in suit_data:
            if isinstance(card, dict) and 'name' in card:
                cards.append(card)
    
    # Process Court Cards
    court_cards = integrated_data['court_cards'].get('suits', [])
    for suit_block in court_cards:
        for card in suit_block.get('cards', []):
            if isinstance(card, dict) and 'name' in card:
                cards.append(card)
    
    # Additional instructions from reading.yml
    reading_instructions = integrated_data.get('reading', {})
    
    return cards, reading_instructions

if __name__ == "__main__":
    # Quick test
    all_cards, instructions = load_all_cards(DATA_DIR)
    print(f"Loaded {len(all_cards)} cards.")
    print("Sample card:", all_cards[0] if all_cards else "None found")
