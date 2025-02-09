from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader

# Load the PDF
def load_pdf(file_path):
    print(f"Loading PDF: {file_path}")
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    return documents

# Split the text into smaller chunks
def split_text(documents, chunk_size=1000, chunk_overlap=100):
    print(f"Splitting text into chunks of size {chunk_size} with overlap {chunk_overlap}")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    chunks = text_splitter.split_documents(documents)
    return chunks

if __name__ == "__main__":
    # Specify the path to your PDF file
    pdf_path = "data/book.pdf"

    # Load the PDF
    docs = load_pdf(pdf_path)

    # Split the text into smaller chunks
    chunks = split_text(docs)

    # Debug: Print the first few chunks
    print(f"Generated {len(chunks)} chunks:")
    for i, chunk in enumerate(chunks[:5]):
        print(f"Chunk {i + 1}:")
        print(chunk.page_content)
        print("-" * 80)
