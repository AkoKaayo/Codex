import os
import yaml
import logging

logging.basicConfig(level=logging.DEBUG)

DATA_DIR = './data'

def load_yaml_files(directory):
    yaml_data = {}
    for filename in os.listdir(directory):
        if filename.endswith(('.yml', '.yaml')):
            file_path = os.path.join(directory, filename)
            with open(file_path, 'r', encoding='utf-8') as file:
                try:
                    contents = list(yaml.safe_load_all(file))
                    yaml_data[filename] = contents[0] if len(contents) == 1 else contents
                except yaml.YAMLError as e:
                    logging.error(f"Error loading {filename}: {e}")
    return yaml_data

def structure_data(loaded_data):
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
    loaded_data = load_yaml_files(directory)
    integrated_data = structure_data(loaded_data)
    
    cards = []
    
    # Process Major Arcana (part1 and part2)
    major = integrated_data.get('major_arcana', {})
    for part in ['part1', 'part2']:
        part_data = major.get(part, [])
        if isinstance(part_data, list):
            for item in part_data:
                # Unwrap nested lists
                if isinstance(item, list):
                    item = item[0] if item else {}
                if isinstance(item, dict) and 'name' in item:
                    cards.append(item)
                else:
                    logging.warning(f"Invalid Major Arcana entry in {part}: {item}")
        elif isinstance(part_data, dict):
            for key, value in part_data.items():
                if isinstance(value, dict) and 'name' in value:
                    cards.append(value)
                else:
                    logging.warning(f"Invalid Major Arcana entry in {part}: {key}")
    
    # Process Minor Arcana
    for suit in ['swords', 'cups', 'wands', 'pentacles']:
        suit_data = integrated_data['minor_arcana'].get(suit, {}).get('cards', [])
        for card in suit_data:
            if isinstance(card, dict) and 'name' in card:
                cards.append(card)
            else:
                logging.warning(f"Invalid Minor Arcana entry in {suit}: {card}")
    
    # Process Court Cards
    court_cards = integrated_data['court_cards'].get('suits', [])
    for suit in court_cards:
        for card in suit.get('cards', []):
            if isinstance(card, dict) and 'name' in card:
                cards.append(card)
            else:
                logging.warning(f"Invalid Court Card entry in {suit.get('suit', 'Unknown')}: {card}")
    
    reading_instructions = integrated_data.get('reading', {})
    return cards, reading_instructions

if __name__ == "__main__":
    cards, _ = load_all_cards(DATA_DIR)
    logging.info("Loaded Cards:")
    for idx, card in enumerate(cards[:10]):  # Print first 10 for verification
        logging.info(f"{idx + 1}: {card.get('name', 'NO NAME')}")
