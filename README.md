Below is an updated README.md file for your project. You can copy and paste this into your repository:

```markdown
# Codex Arcana: AI Tarot Oracle

Codex Arcana is an AI-powered tarot oracle that generates insightful tarot readings based solely on user queries and an indexed source text (a tarot book). It extracts tarot card names from user input, retrieves relevant passages from the book using vector search, and synthesizes detailed readings with individual card analyses and integrated summaries.

---

## Features

- **Query Preprocessing:**  
  Extracts tarot card names (including alternative names and positional cues) from user queries.  
  *Ambiguous queries* (those without clear card references) either default to a one-card reading (if phrased as a question) or prompt the user to be more specific.

- **Retrieval & Re-ranking (RAG):**  
  Uses a vector store (via Chroma) with HuggingFace embeddings to retrieve context from the source text, re-ranking the retrieved chunks based on cosine similarity.

- **Synthesis Prompt:**  
  Generates detailed tarot readings using GPT-3.5-turbo.  
  Supports specific spreads:
  - **3-Card Spread:** Cards are interpreted progressively (e.g., past, present, future).
  - **5-Card Spread (Plus Layout):** Cards are arranged in a plus configuration:
    - **Row 1:** 1 card (centered)
    - **Row 2:** 3 cards (left, center, right)
    - **Row 3:** 1 card (centered)
  - **Random Card:** Returns a single card reading.

- **User Interface:**  
  - Responsive chat area for displaying user prompts and generated readings.
  - Card preview area showing card images retrieved by the system.
  - **Speed Dial Buttons:** Quick-access buttons for "Random Card", "3-Card Spread", and "5-Card Spread".
  - **Modal Card Zoom:** Click on any card image to view it in a fullscreen modal (resized to fit within 80% of the viewport height).

- **Error Handling:**  
  Provides user-friendly error messages and suggestions if the query lacks clear card references.

---

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- [pip](https://pip.pypa.io/en/stable/)
- An OpenAI API key

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/codex-arcana.git
   cd codex-arcana
   ```

2. **Create and activate a virtual environment:**

   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

   *(Make sure your `requirements.txt` includes packages such as Flask, flask-cors, openai, langchain_community, sentence-transformers, transformers, etc.)*

4. **Set your OpenAI API Key:**

   Set the environment variable `OPENAI_API_KEY` in your terminal:

   ```bash
   export OPENAI_API_KEY="your_openai_api_key_here"
   ```

   *(On Windows, use `set OPENAI_API_KEY="your_openai_api_key_here"`)*

5. **Ensure your vector store and source text (e.g., tarot book PDF) are in the appropriate directories (e.g., `data/vectorstore`, `data/book.pdf`).**

---

## Running the Application

1. **Start the Flask Application:**

   ```bash
   python flaskapp.py
   ```

2. **Access the Interface:**

   Open your web browser and navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000).

---

## Usage

- **Manual Input:**  
  Type a tarot question in the input field (e.g., "What does The Fool mean?") and press Enter or click the "Send" button.

- **Speed Dial Options:**  
  Use the buttons on the right panel for quick queries:
  - **Random Card:** Returns a one-card reading.
  - **3-Card Spread:** Returns a three-card reading interpreted as past, present, and future.
  - **5-Card Spread:** Returns five cards arranged in a plus layout:
    - Top row: 1 card (centered)
    - Middle row: 3 cards (left, center, right)
    - Bottom row: 1 card (centered)

- **Card Zoom:**  
  Click on any card image to open a modal with a zoomed-in view.

- **Ambiguous Queries:**  
  If your query does not contain a clear card reference, the system will either default to a one-card reading (if the query appears as a question) or prompt you to include a card name or use the speed dial options.

---

## Configuration

- **Vector Store:**  
  Configured to load from `data/vectorstore` using the `langchain_community` package.
  
- **Embeddings Model:**  
  Uses `sentence-transformers/all-MiniLM-L12-v2` for query and document embeddings.
  
- **Token Limits:**  
  The system truncates retrieved context to 250-500 tokens (adjustable in `truncate_by_tokens()`).

- **Spread Overrides:**  
  - "3 card spread" returns 3 cards.
  - "5 card spread" returns 5 cards with a `"plus"` layout.
  - "Random card" returns 1 card.

Feel free to adjust these parameters in the code as needed.

---

## Integration Testing & QA

- **End-to-End Testing:**  
  Test with a variety of queries, including:
  - Specific card queries (e.g., "What does The Fool mean?")
  - Spread commands (e.g., "3 card spread", "5 card spread")
  - Ambiguous queries (e.g., "Tell me something")
  
- **UI/UX Checks:**  
  Verify that:
  - Chat messages and card previews update correctly.
  - Speed dial buttons trigger the expected readings.
  - The modal displays a zoomed-in view of card images.
  
- **Error Handling:**  
  Ensure that if a query is ambiguous, the system prompts you to include a valid card reference or use the speed dial options.

---

## Future Improvements

- Enhance error messages and fallback logic.
- Expand the range of alternative card names.
- Refine the UI for better responsiveness and accessibility.
- Deploy the application on a production server with appropriate monitoring.

---

## License

Codex Arcana © 2025 by Kaayo is licensed under Creative Commons Attribution-NonCommercial 4.0 International 

---

Happy reading and exploring your tarot insights with Codex Arcana!
```

Feel free to adjust any sections to match your project's specifics. Let me know if you need further modifications or additional sections!