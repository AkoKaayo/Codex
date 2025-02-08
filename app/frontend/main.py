import streamlit as st

# Title of the app
st.title("Codex Frontend")

# Add a simple greeting message
st.write("Welcome to the Codex Frontend!")

# Add a button to check health status
if st.button('Check Backend Health'):
    response = st.experimental_get_query_params()
    st.write(response)
