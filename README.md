Here is the **full `README.md` file** for your project. This document provides a comprehensive overview of the **Codex Arcana** project, including setup instructions, usage, and future enhancements.  

---

### **Full `README.md`**
```md
# **Codex Arcana - AI-Powered Tarot Oracle** 🔮

## **Overview**
Codex Arcana is an AI-powered tarot oracle that interprets tarot card meanings using **LangChain**, **RAG (Retrieval-Augmented Generation)**, and **ChromaDB**. It extracts tarot knowledge from **Jodorowsky and Camoin's teachings** and enables users to **query the tarot wisdom dynamically**.

## **Project Features**
✅ Extracts tarot meanings from a structured book using **LangChain**  
✅ Stores extracted tarot data in a **vector database** for retrieval  
✅ Uses **Hugging Face embeddings** for semantic search  
✅ Provides a **Flask API and web interface** for user interaction  
✅ Allows easy **fine-tuning** and model swapping for improved accuracy  

---

## **Installation & Setup**
### **1️⃣ Install Dependencies**
Ensure you have Python **3.10+** installed, then install required libraries:
```bash
pip install langchain langchain-community chromadb flask sentence-transformers pdfplumber
```

---

### **2️⃣ Load & Process the Tarot Book**
Run the **PDF processing script** to extract tarot card data into structured text chunks:
```bash
python3 PyPDFSplitter.py
```

---

### **3️⃣ Create Embeddings & Vector Store**
Generate semantic embeddings for the extracted tarot data and store them in **ChromaDB**:
```bash
python3 EmbeddingCreator.py
```

---

### **4️⃣ Run the Flask Web App**
Launch the **Flask-powered user interface** to interact with the tarot knowledge base:
```bash
python3 FlaskApp.py
```
Once running, open [http://127.0.0.1:5000/](http://127.0.0.1:5000/) in your browser.

---

## **Usage**
1. **Ask Tarot Questions**  
   - Enter any tarot-related question in the UI, such as:
     ```
     What does The Fool represent?
     How does The Lovers card influence a reading?
     What is the connection between The Moon and The Sun?
     ```
2. **Retrieve Relevant Excerpts**  
   - The app will return tarot interpretations and relationships **from the book**.

---

## **Project Structure**
```
codex_arcana/
│── data/                     # Stores book, vector database, and extracted knowledge
│   ├── book.pdf              # The original tarot knowledge source
│   ├── vectorstore/          # ChromaDB storage for embeddings
│── templates/                 # HTML frontend for the Flask UI
│   ├── index.html             # Web interface for querying tarot knowledge
│── PyPDFSplitter.py           # Extracts tarot text from the PDF
│── EmbeddingCreator.py        # Creates embeddings & stores them in ChromaDB
│── FlaskApp.py                # Flask-based web application
│── README.md                  # Project documentation (this file)
│── requirements.txt           # Python dependencies list
│── venv/                      # Python virtual environment (optional)
```

---

## **Customization**
### **🔹 Swap the Embedding Model**
Want to test different Hugging Face models?  
Modify `EmbeddingCreator.py` and change:
```python
MODEL_NAME = "sentence-transformers/all-MiniLM-L12-v2"
```
Other good models:
- `sentence-transformers/all-mpnet-base-v2` (High accuracy)
- `sentence-transformers/paraphrase-MiniLM-L6-v2` (Good for rephrased queries)

---

## **Future Enhancements**
🚀 **Fine-tune embeddings** on tarot-specific text  
🚀 **Improve UI/UX** with tarot-themed aesthetics  
🚀 **Multi-agent retrieval** for **deep spread analysis**  
🚀 **Voice-enabled queries** using speech-to-text  

---

## **Contributing**
Want to enhance Codex Arcana?  
1. Fork the project  
2. Create a feature branch (`git checkout -b feature-xyz`)  
3. Submit a pull request  

---

## **License**
This project is licensed under the **MIT License**.

---
🔮 **Codex Arcana - The Marseilles AI Tarot Oracle** 🔮
```
