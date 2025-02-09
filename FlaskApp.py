from flask import Flask, request, jsonify, render_template
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

# Paths
VECTOR_STORE_PATH = "data/vectorstore"
MODEL_NAME = "sentence-transformers/all-MiniLM-L12-v2"  # Using updated model

# Initialize Flask app
app = Flask(__name__)

# Load the embedding model and vector database
print(f"Loading embedding model: {MODEL_NAME}")
embeddings = HuggingFaceEmbeddings(model_name=MODEL_NAME)

print(f"Loading vector database from: {VECTOR_STORE_PATH}")
vector_db = Chroma(persist_directory=VECTOR_STORE_PATH, embedding_function=embeddings)

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")  # Simple frontend page

@app.route("/query", methods=["POST"])
def query_vector_db():
    user_query = request.json.get("query", "")
    
    if not user_query:
        return jsonify({"error": "Query is missing"}), 400

    # Perform similarity search
    results = vector_db.similarity_search(user_query, k=3)

    # Format response
    response = [{"content": result.page_content} for result in results]
    
    return jsonify({"query": user_query, "results": response})

if __name__ == "__main__":
    app.run(debug=True)
