from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
import re

# Load the PDF
def load_pdf(file_path):
    print(f"Loading PDF: {file_path}")
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    return documents

# Original function to split text (if needed)
def split_text(documents, chunk_size=1500, chunk_overlap=200):
    print(f"Splitting text into chunks of size {chunk_size} with overlap {chunk_overlap}")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    chunks = text_splitter.split_documents(documents)
    return chunks

def extract_card_names(text):
    """
    Extracts canonical card names from the text by matching phrases such as
    "2 of spades" or "ace of hearts", using alternative mappings for suits and digits.
    """
    lower_text = text.lower()
    canonical_cards = [
        "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
        "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
        "The Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
        "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgment", "The World",
        "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands",
        "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
        "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
        "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups",
        "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups",
        "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
        "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords",
        "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
        "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
        "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles",
        "Five of Pentacles", "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles",
        "Nine of Pentacles", "Ten of Pentacles",
        "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
    ]
    found_cards = []
    # Alternative mappings for suit names and digits
    suit_alternatives = {
        "spades": "swords",
        "hearts": "cups",
        "clubs": "wands",
        "diamonds": "pentacles"
    }
    digit_to_word = {
        "2": "Two", "3": "Three", "4": "Four", "5": "Five",
        "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine", "10": "Ten"
    }
    
    # Regex pattern for phrases like "2 of spades" or "ace of hearts"
    pattern = r'\b([0-9]+|[a-z]+)\s+of\s+([a-z]+)\b'
    for m in re.finditer(pattern, lower_text):
        value, suit = m.group(1), m.group(2)
        if value.isdigit():
            value_word = digit_to_word.get(value, value)
        else:
            value_word = value.capitalize()
        canonical_suit = suit_alternatives.get(suit, suit)
        candidate = f"{value_word} of {canonical_suit.capitalize()}"
        for card in canonical_cards:
            if card.lower() == candidate.lower() and card not in found_cards:
                found_cards.append(card)
                
    # Also add any full canonical card names directly mentioned
    for card in canonical_cards:
        if card.lower() in lower_text and card not in found_cards:
            found_cards.append(card)
    
    return found_cards

def tag_chunk(text):
    """
    Tags a chunk of text by extracting card names (using both canonical and alternative references)
    and by detecting interpretation and spread-related keywords.
    Returns a list of tags.
    """
    tags = []
    lower_text = text.lower()
    found_cards = extract_card_names(text)
    tags.extend(found_cards)
    
   # Interpretation-related keywords
    interpretation_keywords = [
        "opening", "meaning", "numerology", "symbolism", "stages", "guide", "insight", "overview", "reading","position", "mandala", "journey"
    ]
    for keyword in interpretation_keywords:
        if keyword in lower_text:
            tags.append("interpretation")
            break  # Only need to add once

    # Spread-related keywords
    spread_keywords = [
        "reading","spread", "position", "mandala", "journey", "progression", "Reading Three Cards"
        ]
    for keyword in spread_keywords:
        if keyword in lower_text:
            tags.append("spread")
            break
    
    return list(set(tags))

def split_text_with_tags(documents, chunk_size=1500, chunk_overlap=200):
    """
    Splits the documents into chunks and attaches tags to each chunk.
    Returns a list of dictionaries with keys: 'page_content' and 'tags'.
    """
    print(f"Splitting text into chunks of size {chunk_size} with overlap {chunk_overlap}")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    chunks = text_splitter.split_documents(documents)
    
    tagged_chunks = []
    for chunk in chunks:
        text = chunk.page_content
        tags = tag_chunk(text)
        new_chunk = {"page_content": text, "tags": tags}
        tagged_chunks.append(new_chunk)
    return tagged_chunks

if __name__ == "__main__":
    # Specify the path to your PDF file
    pdf_path = "data/book.pdf"
    
    # Load the PDF
    docs = load_pdf(pdf_path)
    
    # Split the text into chunks with tagging using defined values:
    # Chunk size = 1000, Overlap = 100
    tagged_chunks = split_text_with_tags(docs, chunk_size=1500, chunk_overlap=200)
    
    # Debug: Print the first few chunks with their tags
    print(f"Generated {len(tagged_chunks)} tagged chunks:")
    for i, chunk in enumerate(tagged_chunks[:5]):
        print(f"Chunk {i + 1}:")
        print(chunk["page_content"][:200])  # Preview first 200 characters
        print("Tags:", chunk["tags"])
        print("-" * 80)