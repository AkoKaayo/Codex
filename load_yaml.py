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
        'degrees': loaded_data.get('degrees.yml', []),
        'structure': loaded_data.get('structure.yml', {}),
        'suits': loaded_data.get('suits.yml', [])
    }
    return tarot_data

def load_all_cards(directory):
    """
    Loads and integrates card data from the structured YAML.
    Returns (cards, reading_instructions).
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
                if isinstance(item, list):
                    item = item[0] if item else {}
                if isinstance(item, dict) and 'name' in item:
                    item['name'] = item['name'].split(' / ')[0]  # Keep only English name
                    cards.append(item)
        elif isinstance(part_data, dict):
            for _, value in part_data.items():
                if isinstance(value, dict) and 'name' in value:
                    value['name'] = value['name'].split(' / ')[0]
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
                card['name'] = card['name'].split(' / ')[0]
                cards.append(card)
    
    reading_instructions = integrated_data.get('reading', {})
    
    return cards, reading_instructions

def load_card_data_for_selector(directory):
    """
    Loads card data specifically for the card selector modal.
    Returns a dictionary with categorized card data.
    """
    loaded_data = load_yaml_files(directory)
    integrated_data = structure_data(loaded_data)
    
    # Extract suits dynamically from suits.yml
    suits_data = integrated_data.get('suits', [])
    minor_suits = []
    for suit_entry in suits_data:
        suit_name = suit_entry.get('suit', '').lower()
        if suit_name:
            if suit_name.endswith('s'):
                suit_name = suit_name[:-1]
            suit_name = f"{suit_name}s"
            minor_suits.append(suit_name)
    
    # Extract court card characters dynamically from court_cards.yml
    court_cards = integrated_data['court_cards'].get('suits', [])
    characters_set = set()
    court_suits = []
    for suit_block in court_cards:
        suit_name = suit_block.get('suit', '').lower()
        if suit_name:
            if suit_name.endswith('s'):
                suit_name = suit_name[:-1]
            suit_name = f"{suit_name}s"
            court_suits.append(suit_name)
        
        for card in suit_block.get('cards', []):
            if isinstance(card, dict) and 'name' in card:
                card_name = card['name'].split(' / ')[0]  # Keep only English name
                character = card_name.split(' of ')[0]
                characters_set.add(character)
    
    characters_list = sorted(list(characters_set))
    
    card_data = {
        'major_arcana': [],
        'minor_arcana': {
            'suits': minor_suits,
            'numbers': []
        },
        'court_cards': {
            'suits': court_suits,
            'characters': characters_list
        }
    }
    
    # Process Major Arcana
    major = integrated_data.get('major_arcana', {})
    for part in ['part1', 'part2']:
        part_data = major.get(part, [])
        if isinstance(part_data, list):
            for item in part_data:
                if isinstance(item, list):
                    item = item[0] if item else {}
                if isinstance(item, dict) and 'name' in item:
                    card_name = item['name'].split(' / ')[0]  # Keep only English name
                    card_data['major_arcana'].append(card_name)
        elif isinstance(part_data, dict):
            for _, value in part_data.items():
                if isinstance(value, dict) and 'name' in value:
                    card_name = value['name'].split(' / ')[0]
                    card_data['major_arcana'].append(card_name)
    
    # Process Minor Arcana to extract numbers
    numbers_set = set()
    for suit in minor_suits:
        suit_data = integrated_data['minor_arcana'].get(suit, {}).get('cards', [])
        for card in suit_data:
            if isinstance(card, dict) and 'name' in card:
                name_parts = card['name'].split(' of ')
                if len(name_parts) == 2:
                    number = name_parts[0]
                    numbers_set.add(number)
    
    numbers_list = sorted(numbers_set, key=lambda x: 0 if x == 'Ace' else int(x) if x.isdigit() else float('inf'))
    card_data['minor_arcana']['numbers'] = numbers_list
    
    # Validate that all required fields are populated
    if not card_data['major_arcana']:
        logging.warning("No Major Arcana cards loaded.")
        card_data['major_arcana'] = []
    if not card_data['minor_arcana']['suits']:
        logging.warning("No Minor Arcana suits loaded.")
        card_data['minor_arcana']['suits'] = ['swords', 'cups', 'wands', 'pentacles']
    if not card_data['minor_arcana']['numbers']:
        logging.warning("No Minor Arcana numbers loaded.")
        card_data['minor_arcana']['numbers'] = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    if not card_data['court_cards']['suits']:
        logging.warning("No Court Card suits loaded.")
        card_data['court_cards']['suits'] = ['swords', 'cups', 'wands', 'pentacles']
    if not card_data['court_cards']['characters']:
        logging.warning("No Court Card characters loaded.")
        card_data['court_cards']['characters'] = ['Page', 'Queen', 'King', 'Knight']
    
    return card_data

if __name__ == "__main__":
    all_cards, instructions = load_all_cards(DATA_DIR)
    print(f"Loaded {len(all_cards)} cards.")
    print("Sample card:", all_cards[0] if all_cards else "None found")
    
    selector_data = load_card_data_for_selector(DATA_DIR)
    print("\nCard data for selector:")
    print("Major Arcana:", selector_data['major_arcana'][:5], "...")
    print("Minor Arcana Suits:", selector_data['minor_arcana']['suits'])
    print("Minor Arcana Numbers:", selector_data['minor_arcana']['numbers'])
    print("Court Card Suits:", selector_data['court_cards']['suits'])
    print("Court Card Characters:", selector_data['court_cards']['characters'])