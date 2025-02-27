/***************************************************************
 * scripts.js
 * Handles user input, chat layout, card drawing (if needed),
 * plus the typewriter animation for assistant messages.
 **************************************************************/

/** DOM element references **/
const chatContainer = document.getElementById("chat-container");
const welcomeMessageDiv = document.getElementById("welcome-message");
const cardImagesContainer = document.getElementById("card-images-container");

const intentionInput = document.getElementById("intention-input");
const inlineSendButton = document.getElementById("inline-send-button");

// API call buttons
const btnRandomCard = document.getElementById("btn-random-card");
const btnThreeCard = document.getElementById("btn-three-card");
const btnFiveCard = document.getElementById("btn-five-card");

// Just Cards buttons
const btnJustSingle = document.getElementById("btn-just-single");
const btnJustThree = document.getElementById("btn-just-three");
const btnJustFive = document.getElementById("btn-just-five");

// Modal elements for card zoom
const modal = document.getElementById("card-modal");
const modalImage = document.getElementById("modal-image");
const closeModal = document.querySelector("#card-modal .close");

let currentSpreadType = "";
let currentUserPrompt = "";


/***************************************************************
 * 1. HELPER: Typewriter Effect Function
 ***************************************************************/
function typewriterEffect(element, text, speed = 40) {
  let i = 0;
  const intervalId = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      // Auto-scroll so the user sees the newly added text
      chatContainer.scrollTop = chatContainer.scrollHeight;
    } else {
      clearInterval(intervalId);
    }
  }, speed);
}


/***************************************************************
 * 2. Chat Functions
 ***************************************************************/

/**
 * Creates the "user prompt" line with a spinner.
 * This is where you show the question/spread info
 * and an ASCII spinner while waiting for a response.
 */
function addUserPrompt(promptText) {
  const promptDiv = document.createElement("div");
  promptDiv.classList.add("user-prompt");

  // Combine spread type + user prompt in one line
  const displayText = `${currentSpreadType} spread about "${promptText}"`;
  promptDiv.innerText = displayText;

  // Create a span for the ASCII spinner
  const spinnerSpan = document.createElement("span");
  spinnerSpan.classList.add("spinner");
  spinnerSpan.innerText = " "; // placeholder
  promptDiv.appendChild(spinnerSpan);

  chatContainer.appendChild(promptDiv);
  chatContainer.scrollTop = 0;

  // Start ASCII spinner animation
  const spinnerFrames = ["|", "/", "-", "\\"];
  let index = 0;
  const spinnerId = setInterval(() => {
    spinnerSpan.innerText = " " + spinnerFrames[index];
    index = (index + 1) % spinnerFrames.length;
  }, 200);

  return { promptDiv, spinnerSpan, spinnerId };
}


/**
 * Adds an assistant message to the chat with a typewriter effect.
 */
function addAssistantMessage(content) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "assistant-message");

  // Start with empty text; the typewriter will fill it in
  messageDiv.textContent = "";
  chatContainer.appendChild(messageDiv);

  // Use our typewriter function
  typewriterEffect(messageDiv, content, 30); // 30 ms between chars (adjust speed as you like)
}


/**
 * Clears the chat area (if needed).
 */
function clearChat() {
  chatContainer.innerHTML = "";
  welcomeMessageDiv.innerText = "";
}


/**
 * The main function that fetches results from the server.
 * This includes the user prompt line with a spinner, and
 * eventually an assistant message with typewriter text.
 */
function sendQuery(queryString, intention) {
  clearChat();

  // Show user prompt + spinner
  currentUserPrompt = intention;
  const userPromptObj = addUserPrompt(intention);

  // Clear the card area, in case there's old content
  clearCardImages();

  // Example fetch call to your Flask "/query" route
  fetch("/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: queryString, intention: intention })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      // Stop the ASCII spinner
      clearInterval(userPromptObj.spinnerId);
      userPromptObj.spinnerSpan.remove();

      // If the server returns a list of cards, display them
      if (data.cards && data.cards.length > 0) {
        addCardImages(data.cards, data.layout);
      }

      // If there's no synthesis text, show an error or fallback
      if (!data.synthesis || data.synthesis.trim() === "") {
        if (data.error) {
          addAssistantMessage(data.error);
        } else {
          addAssistantMessage("No results found. Try rephrasing your question.");
        }
      } else {
        addAssistantMessage(data.synthesis);
      }
    })
    .catch(error => {
      clearInterval(userPromptObj.spinnerId);
      userPromptObj.spinnerSpan.remove();
      console.error("Error:", error);
      addAssistantMessage("An error occurred while fetching the tarot reading.");
    });
}


/***************************************************************
 * 3. Card Display Functions
 ***************************************************************/
function clearCardImages() {
  cardImagesContainer.innerHTML = "";
  cardImagesContainer.classList.remove("plus-layout", "three-card-layout");
}

function addCardImages(cards, layout) {
  clearCardImages();
  if (layout === "plus") {
    cardImagesContainer.classList.add("plus-layout");
  } else if (layout === "three") {
    cardImagesContainer.classList.add("three-card-layout");
  }
  cards.forEach(card => {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card-image");
    const img = document.createElement("img");
    img.src = card.image;
    img.alt = card.name;
    cardDiv.appendChild(img);
    cardImagesContainer.appendChild(cardDiv);
  });
}


/***************************************************************
 * 4. UI Interaction
 ***************************************************************/

/** Show the inline context input for the chosen spread type **/
function showInlineContext(spreadType) {
  welcomeMessageDiv.innerText = "";
  currentSpreadType = spreadType;
  intentionInput.value = "";
  document.getElementById("inline-context-container").style.display = "flex";
  intentionInput.focus();
}

/** Enable/disable the 'Seek Guidance' button based on user input **/
function handleInputChange() {
  const userText = intentionInput.value.trim();
  inlineSendButton.disabled = (userText.length === 0);
}

/** Trigger the query with the user’s typed intention **/
function handleContextSubmission() {
  const intentionText = intentionInput.value.trim();
  if (intentionText.length === 0) return;
  document.getElementById("inline-context-container").style.display = "none";
  sendQuery(currentSpreadType, intentionText);
}


/** Add event listeners for the text area **/
intentionInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleContextSubmission();
  }
});
intentionInput.addEventListener("input", handleInputChange);
inlineSendButton.addEventListener("click", handleContextSubmission);


/** Spread type buttons that call the backend for reading + interpretation **/
btnRandomCard.addEventListener("click", () => {
  setActiveButton(btnRandomCard);
  showInlineContext("Single");
});
btnThreeCard.addEventListener("click", () => {
  setActiveButton(btnThreeCard);
  showInlineContext("Three");
});
btnFiveCard.addEventListener("click", () => {
  setActiveButton(btnFiveCard);
  showInlineContext("Five");
});


/** Just Cards version (purely client-side) **/
btnJustSingle.addEventListener("click", () => {
  chatContainer.innerHTML = "";
  document.getElementById("inline-context-container").style.display = "none";
  welcomeMessageDiv.innerText = "Single card spread";
  const result = drawCardsForSpreadClient("single");
  const cards = result.cards.map(card => ({
    name: card,
    image: getCardImage(card)
  }));
  addCardImages(cards, result.layout);
});

btnJustThree.addEventListener("click", () => {
  chatContainer.innerHTML = "";
  document.getElementById("inline-context-container").style.display = "none";
  welcomeMessageDiv.innerText = "Three card spread";
  const result = drawCardsForSpreadClient("3-card");
  const cards = result.cards.map(card => ({
    name: card,
    image: getCardImage(card)
  }));
  addCardImages(cards, result.layout);
});

btnJustFive.addEventListener("click", () => {
  chatContainer.innerHTML = "";
  document.getElementById("inline-context-container").style.display = "none";
  welcomeMessageDiv.innerText = "Five card spread";
  const result = drawCardsForSpreadClient("5-card");
  const cards = result.cards.map(card => ({
    name: card,
    image: getCardImage(card)
  }));
  addCardImages(cards, result.layout);
});


/***************************************************************
 * 5. Misc Helpers
 ***************************************************************/

/** Highlight style for the active/selected button **/
function setActiveButton(clickedBtn) {
  btnRandomCard.classList.remove("active-button");
  btnThreeCard.classList.remove("active-button");
  btnFiveCard.classList.remove("active-button");
  clickedBtn.classList.add("active-button");
}


/** Card drawing logic for client-side “Just Cards” approach **/
const CANONICAL_CARDS = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "The Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgment", "The World",
  "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands",
  "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
  "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
  "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups",
  "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups",
  "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
  "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords",
  "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
  "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
  "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles",
  "Five of Pentacles", "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles",
  "Nine of Pentacles", "Ten of Pentacles",
  "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
];

function getRandomCard() {
  return CANONICAL_CARDS[Math.floor(Math.random() * CANONICAL_CARDS.length)];
}

/**
 * e.g., “3-card” => draws 3 random unique cards,
 * “single” => draws 1, “5-card” => draws 5, etc.
 */
function drawCardsForSpreadClient(spreadType) {
  if (spreadType === "5-card") {
    let chosen = [];
    while (chosen.length < 5) {
      let card = getRandomCard();
      if (!chosen.includes(card)) chosen.push(card);
    }
    return { cards: chosen, layout: "plus" };

  } else if (spreadType === "3-card") {
    let chosen = [];
    while (chosen.length < 3) {
      let card = getRandomCard();
      if (!chosen.includes(card)) chosen.push(card);
    }
    return { cards: chosen, layout: "three" };

  } else {
    // single card case
    return { cards: [getRandomCard()], layout: "default" };
  }
}

function getCardImage(cardName) {
  // Convert name to a valid file path
  return "/static/cards/" + cardName.toLowerCase().replace(/ /g, "_") + ".png";
}


/***************************************************************
 * 6. Modal: Card Zoom
 ***************************************************************/
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

document.addEventListener("click", (event) => {
  if (event.target.tagName === "IMG" &&
      event.target.parentElement.classList.contains("card-image")) {
    modal.style.display = "block";
    modalImage.src = event.target.src;
  }
});


/***************************************************************
 * 7. On DOM Load
 ***************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  welcomeMessageDiv.innerText = "Welcome to Codex Arcana! Click on one of the buttons below to get started. Use the Read options if you seek an interpretation. Or click Spread for a simple draw from the deck. As above, so below. Ask and you shall know.";
});
