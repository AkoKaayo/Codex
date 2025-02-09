from langchain.document_loaders import PyPDFLoader

# Load the PDF
loader = PyPDFLoader("data/book.pdf")
documents = loader.load()

# Print sample content for debugging
for doc in documents[:5]:
    print(doc.page_content)

