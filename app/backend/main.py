from fastapi import FastAPI

# Create an instance of the FastAPI application
app = FastAPI()

# Define a simple route for the root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to Codex Backend!"}

# Define a health check endpoint to verify the backend is running
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Example endpoint that could be extended for more complex operations
@app.get("/data")
def get_data():
    return {"data": "Here is some example data"}
