# Codex Tarot

**Version: 0.1 Beta**  
**Last Updated: March 17, 2025**  
**Created by: AkoKaayo**  
**© 2025**

## Overview
Tarot Academia is an interactive web application that provides personalized tarot card readings using AI-powered interpretations. Users can request single-card, three-card, or five-card spreads to gain insights into their past, present, and future, guided by a sophisticated algorithm and OpenAI's GPT-4 model. This project combines mysticism with modern technology, offering a unique and engaging experience for tarot enthusiasts.

## Features
- **Single Card Reading**: A focused reading for quick insights.
- **Three Card Spread**: Explores past, present, and future perspectives.
- **Five Card Spread**: Offers a deeper analysis with a plus-shaped layout.
- **AI-Generated Interpretations**: Uses GPT-4 to provide warm, insightful readings in British English.
- **Dynamic UI**: Features a visually appealing interface with animated backgrounds.

## Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/tarot-academia.git
   cd tarot-academia
(Replace your-username and tarot-academia with your actual GitHub repo details.)

Set Up a Virtual Environment:
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

Install Dependencies: Install the required Python packages from requirements.txt:
pip install -r requirements.txt

Configure OpenAI API Key:
Obtain an API key from OpenAI.

Set it as an environment variable:
export OPENAI_API_KEY="your-api-key-here"

Alternatively, create a .env file in the project root with:
OPENAI_API_KEY=your-api-key-here
And ensure python-dotenv is installed (included in requirements.txt).

Run the Application:
Open your browser and visit http://localhost:5000 to start using the app.

Usage
Select a reading type (Single, Three, or Five Cards) from the bottom toolbar.
Enter your intention or question in the text area (e.g., "What does my future hold?").
Submit to receive a tarot reading with card images, analyses, and a synthesized message.
Use the "Shuffle & Start Again" button to reset and try a new reading.

Dependencies
Flask==3.1.0: Web framework.
Flask-Cors==5.0.0: Cross-origin resource sharing support.
PyYAML==6.0.2: YAML file parsing.
openai==1.51.0: OpenAI API integration.
requests==2.32.3: HTTP requests.
httpx==0.24.1: HTTP client (pinned for compatibility).
python-dotenv==1.0.1 (optional): Environment variable management.
Project Structure

tarot-academia/
├── FlaskApp.py         # Main Flask application
├── tarot_reading.py    # Tarot reading logic
├── load_yaml.py        # YAML data loading
├── requirements.txt    # Python dependencies
├── static/             # Static files (CSS, JS, images)
│   ├── styles.css      # Stylesheet
│   ├── scripts.js      # JavaScript
│   └── cards/          # Tarot card images
├── templates/          # HTML templates
│   └── index.html      # Main HTML
├── data/               # YAML data files
└── README.md           # This file

Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub. For major changes, please discuss them first via issues.

License
[Add your license here, e.g., MIT, GPL, or proprietary notice. Default is © 2025 AkoKaayo.]

Acknowledgements
Powered by OpenAI's GPT-4 model.
Built with Flask and enhanced with Vanta.js for visual effects.