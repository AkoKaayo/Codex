from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from PyPDFSplitter import load_pdf, split_text

# Paths
PDF_PATH = "data/book.pdf"
VECTOR_STORE_PATH = "data/vectorstore"

# Initialize the embedding model
def create_embeddings(chunks, model_name="sentence-transformers/all-mpnet-base-v2"):
    print(f"Using embedding model: {model_name}")
    embeddings = HuggingFaceEmbeddings(model_name=model_name)
    
    # Create a vector database with the chunks
    vector_db = Chroma.from_documents(chunks, embeddings, persist_directory=VECTOR_STORE_PATH)
    vector_db.persist()
    print(f"Vector store created and saved at {VECTOR_STORE_PATH}")
    return vector_db

if __name__ == "__main__":
    # Load and split the PDF
    pdf_path = PDF_PATH
    documents = load_pdf(pdf_path)
    chunks = split_text(documents)

    # Create embeddings for the chunks
    vector_db = create_embeddings(chunks)
    
    # Debug: Test the vector database with a query
    query = "What is the meaning of Le Diable (The Devil)?"
    results = vector_db.similarity_search(query, k=3)
    print(f"Query results for '{query}':")
    for i, result in enumerate(results):
        print(f"Result {i + 1}:")
        print(result.page_content)
        print("-" * 80)
