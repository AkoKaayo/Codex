Codex Project

Codex is a Proof of Concept (POC) project designed to build an AI-powered Marseilles Tarot card reader assistant,
 leveraging LangChain, LanceDB, and other modern tools. The project aims to process and interpret data using advanced natural language processing techniques.

Project Structure
text
codex/
├── app/
│   ├── backend/        # Backend code (FastAPI)
│   ├── frontend/       # Frontend code (Streamlit)
│   ├── data/           # Data files (e.g., PDFs, vectorstores)
│   ├── models/         # Model-related files
├── codex-env/          # Python virtual environment
├── docker-compose.yml  # Docker Compose configuration
├── requirements.txt    # Python dependencies
└── README.md           # Project documentation

Setup Instructions
1. Prerequisites
Python 3.8+ (Python 3.13 recommended)
Docker Desktop
Git

2. Installation
Clone the repository:
bash
git clone <repository-url>
cd codex
Set up the Python virtual environment:
bash
python3 -m venv codex-env
source codex-env/bin/activate
Install dependencies:
bash
pip install -r requirements.txt

3. Run Docker Services
Start the Docker services using:
bash
docker-compose up

Development Plan
This project follows a structured 7-day development plan:
Day 1: Environment setup and core framework.
Day 2: PDF processing and vectorization.
Day 3: Backend API setup.
Day 4: RAG pipeline integration.
Day 5: Frontend development.
Day 6: System integration.
Day 7+: Testing and optimization.

Contributing
Feel free to contribute by submitting pull requests or reporting issues.