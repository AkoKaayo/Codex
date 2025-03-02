/***************************************************************
 * DOM element references
 ***************************************************************/
const chatContainer       = document.getElementById("chat-container");
const welcomeMessageDiv   = document.getElementById("welcome-message");
const cardImagesContainer = document.getElementById("card-images-container");
const codexBrand          = document.getElementById("codex-brand");

const intentionInput      = document.getElementById("intention-input");
const cardReadButtons     = document.querySelectorAll("#btn-random-card, #btn-three-card, #btn-five-card");
const inlineSendButton    = document.getElementById("inline-send-button");

// API call buttons
const btnRandomCard       = document.getElementById("btn-random-card");
const btnThreeCard        = document.getElementById("btn-three-card");
const btnFiveCard         = document.getElementById("btn-five-card");

// "Just Cards" buttons
const btnJustSingle       = document.getElementById("btn-just-single");
const btnJustThree        = document.getElementById("btn-just-three");
const btnJustFive         = document.getElementById("btn-just-five");

// Modal elements for card zoom
const modal               = document.getElementById("card-modal");
const modalImage          = document.getElementById("modal-image");
const closeModal          = document.querySelector("#card-modal .close");

let currentSpreadType     = "";
let currentUserPrompt     = "";

/***************************************************************
 * Functions to enable and disable the input field
 ***************************************************************/
function enableInput() {
  intentionInput.classList.add("enabled");
  intentionInput.placeholder = "Take a breath and reflect... \nWhat brings you here today?"; // Change placeholder text
}

function disableInput() {
  intentionInput.classList.remove("enabled");
  intentionInput.placeholder = "Select a spread type above to begin"; // Default disabled text
}

// Initialize the correct placeholder text on page load
disableInput();

// Add event listeners to enable input when a button is clicked
cardReadButtons.forEach(button => {
  button.addEventListener("click", enableInput);
});

/***************************************************************
 * Typewriter effect for assistant messages
 ***************************************************************/
function typewriterEffect(element, text, speed = 40) {
  let i = 0;
  const intervalId = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    } else {
      clearInterval(intervalId);
    }
  }, speed);
}

/***************************************************************
 * 1. Chat & Spinner Functions
 ***************************************************************/
function addUserPrompt(promptText) {
  const promptDiv = document.createElement("div");
  promptDiv.classList.add("user-prompt");
  const displayText = `${currentSpreadType} spread about "${promptText}"`;
  promptDiv.innerText = displayText;

  // Create a spinner
  const spinnerSpan = document.createElement("span");
  spinnerSpan.classList.add("spinner");
  spinnerSpan.innerText = " "; 
  promptDiv.appendChild(spinnerSpan);

  chatContainer.appendChild(promptDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const spinnerFrames = ["|", "/", "-", "\\"];
  let index = 0;
  const spinnerId = setInterval(() => {
    spinnerSpan.innerText = " " + spinnerFrames[index];
    index = (index + 1) % spinnerFrames.length;
  }, 200);

  return { promptDiv, spinnerSpan, spinnerId };
}

function addAssistantMessage(content) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "assistant-message");
  messageDiv.textContent = "";
  chatContainer.appendChild(messageDiv);
  typewriterEffect(messageDiv, content, 30);
}

function clearChat() {
  chatContainer.innerHTML = "";
  welcomeMessageDiv.innerText = "";
}

function sendQuery(queryString, intention) {
  clearChat();
  const userPromptObj = addUserPrompt(intention);
  clearCardImages();

  fetch("/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: queryString, intention: intention })
  })
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(data => {
      clearInterval(userPromptObj.spinnerId);
      userPromptObj.spinnerSpan.remove();

      // If cards are returned
      if (data.cards && data.cards.length > 0) {
        addCardImages(data.cards, data.layout);
        // Hide the brand text once we have cards
        codexBrand.style.display = "none";
      }

      // Synthesis or fallback
      if (!data.synthesis || data.synthesis.trim() === "") {
        if (data.error) addAssistantMessage(data.error);
        else addAssistantMessage("No results found. Try rephrasing your question.");
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
 * 2. Card Display Functions
 ***************************************************************/
function clearCardImages() {
  cardImagesContainer.innerHTML = "";
  cardImagesContainer.classList.remove("plus-layout", "three-card-layout");

  // Delay the check to ensure cards are fully removed
  setTimeout(() => {
    if (cardImagesContainer.children.length === 0) {
      codexBrand.style.display = "block"; // Show brand text when no cards are present
    }
  }, 100);
}

function addCardImages(cards, layout) {
  clearCardImages();
  
  // Hide the brand text when cards are added
  codexBrand.style.display = "none";  

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
 * 3. UI Interaction Functions
 ***************************************************************/
function showInlineContext(spreadType) {
  welcomeMessageDiv.innerText = "";
  currentSpreadType = spreadType;
  intentionInput.value = "";
  document.getElementById("inline-context-container").style.display = "flex";
  intentionInput.focus();
}

function handleInputChange() {
  inlineSendButton.disabled = (intentionInput.value.trim().length === 0);
}

function handleContextSubmission() {
  const intentionText = intentionInput.value.trim();
  if (intentionText.length === 0) return;
  document.getElementById("inline-context-container").style.display = "none";

  let finalQuery = "";
  if (currentSpreadType.toLowerCase() === "single") {
    finalQuery = "1 card spread about " + intentionText;
  } else if (currentSpreadType.toLowerCase() === "three") {
    finalQuery = "3 card spread about " + intentionText;
  } else if (currentSpreadType.toLowerCase() === "five") {
    finalQuery = "5 card spread about " + intentionText;
  } else {
    finalQuery = currentSpreadType + " spread about " + intentionText;
  }
  sendQuery(finalQuery, intentionText);
}

intentionInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleContextSubmission();
  }
});
intentionInput.addEventListener("input", handleInputChange);
inlineSendButton.addEventListener("click", handleContextSubmission);

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

// Fixing Event Listeners for Just Cards Buttons
btnJustSingle.addEventListener("click", () => {
  clearChat();
  document.getElementById("inline-context-container").style.display = "none";
  setUserPromptText("Single card spread");
  const result = drawCardsForSpreadClient("single");
  const cards = result.cards.map(card => ({
    name: card,
    image: getCardImage(card)
  }));
  addCardImages(cards, result.layout);
});

btnJustThree.addEventListener("click", () => {
  clearChat();
  document.getElementById("inline-context-container").style.display = "none";
  setUserPromptText("Three card spread");
  const result = drawCardsForSpreadClient("3-card");
  const cards = result.cards.map(card => ({
    name: card,
    image: getCardImage(card)
  }));
  addCardImages(cards, result.layout);
});

btnJustFive.addEventListener("click", () => {
  clearChat();
  document.getElementById("inline-context-container").style.display = "none";
  setUserPromptText("Five card spread");
  const result = drawCardsForSpreadClient("5-card");
  const cards = result.cards.map(card => ({
    name: card,
    image: getCardImage(card)
  }));
  addCardImages(cards, result.layout);
});

function setActiveButton(clickedBtn) {
  btnRandomCard.classList.remove("active-button");
  btnThreeCard.classList.remove("active-button");
  btnFiveCard.classList.remove("active-button");
  clickedBtn.classList.add("active-button");
}

function setUserPromptText(text) {
  const promptDiv = document.createElement("div");
  promptDiv.classList.add("user-prompt");
  promptDiv.innerText = text;
  chatContainer.appendChild(promptDiv);
}

// Create shuffle button
const shuffleButton = document.createElement("button");
shuffleButton.id = "shuffle-button";
shuffleButton.textContent = "Shuffle and Start Again";
shuffleButton.style.display = "none";
shuffleButton.addEventListener("click", resetToDefault);

// Append shuffle button to chat-bottom-container
document.getElementById("chat-bottom-container").appendChild(shuffleButton);

function hideUIForReading() {
  // Hide speed dial buttons
  document.getElementById("speed-dial-container").style.display = "none";
  document.getElementById("just-cards-speed-dial").style.display = "none";

  // Hide input field and send button
  document.getElementById("inline-context-container").style.display = "none";

  // Show shuffle button
  shuffleButton.style.display = "block";
}

function resetToDefault() {
  // Clear chat messages
  document.getElementById("chat-container").innerHTML = "";

  // Clear card images
  clearCardImages();

  // Show speed dial buttons
  document.getElementById("speed-dial-container").style.display = "flex";
  document.getElementById("just-cards-speed-dial").style.display = "flex";

  // Show input field and send button
  document.getElementById("inline-context-container").style.display = "flex";

  // Hide shuffle button
  shuffleButton.style.display = "none";
}

// Modify sendQuery to hide UI when sending query
function sendQuery(queryString, intention) {
  clearChat();
  hideUIForReading(); // Hide UI elements

  const userPromptObj = addUserPrompt(intention);
  clearCardImages();

  fetch("/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: queryString, intention: intention })
  })
    .then(response => response.json())
    .then(data => {
      clearInterval(userPromptObj.spinnerId);
      userPromptObj.spinnerSpan.remove();

      if (data.cards && data.cards.length > 0) {
        addCardImages(data.cards, data.layout);
        codexBrand.style.display = "none";
      }

      if (data.synthesis && data.synthesis.trim() !== "") {
        addAssistantMessage(data.synthesis);
      } else {
        addAssistantMessage("No results found. Try rephrasing your question.");
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
 * 4. "Just Cards" logic
 ***************************************************************/
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
    return { cards: [getRandomCard()], layout: "default" };
  }
}

function getCardImage(cardName) {
  return "/static/cards/" + cardName.toLowerCase().replace(/ /g, "_") + ".png";
}

/***************************************************************
 * 5. Modal: Card Zoom
 ***************************************************************/
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});
document.addEventListener("click", (event) => {
  if (
    event.target.tagName === "IMG" &&
    event.target.parentElement.classList.contains("card-image")
  ) {
    modal.style.display = "block";
    modalImage.src = event.target.src;
  }
});

/***************************************************************
 * 6. On DOM Load
 ***************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  welcomeMessageDiv.innerText = "Welcome to Codex Tarot";
});
