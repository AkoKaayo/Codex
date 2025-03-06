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
 * Enable / Disable input
 ***************************************************************/
function enableInput() {
  // Enable the textarea for typing and update its placeholder
  intentionInput.disabled = false;
  intentionInput.placeholder = "What question or situation should the tarot address?";
  
  // Keep the send button disabled until there's text
  inlineSendButton.disabled = true;
  // Reset send button color (default matching input field style)
  inlineSendButton.style.color = "#787878";
  inlineSendButton.classList.remove("send-enabled");
  
  // Add event listener for input changes
  intentionInput.addEventListener("input", handleSendButtonState);
}

function handleSendButtonState() {
  // Enable the send button only if there's non-whitespace text
  if (intentionInput.value.trim().length > 0) {
    inlineSendButton.disabled = false;
    inlineSendButton.classList.add("send-enabled");
  } else {
    inlineSendButton.disabled = true;
    inlineSendButton.classList.remove("send-enabled");
  }
}

function disableInput() {
  // Disable both the textarea and send button
  intentionInput.disabled = true;
  inlineSendButton.disabled = true;
  
  // Reset the placeholder to the default message when no reading is selected
  intentionInput.placeholder = "Select the type of reading you seek for clarity on.";
  
  // Remove the input event listener to avoid duplicates
  intentionInput.removeEventListener("input", handleSendButtonState);
  // Reset the send button state
  inlineSendButton.classList.remove("send-enabled");
}

// Initially disable the input fields
disableInput();

// When a spread button is clicked, enable the input
cardReadButtons.forEach(button => {
  button.addEventListener("click", enableInput);
});

/***************************************************************
 * Basic chat output (no typewriter)
 ***************************************************************/
function addAssistantMessage(content) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "assistant-message");
  messageDiv.innerHTML = content;
  chatContainer.appendChild(messageDiv);
}

function addUserPrompt(promptText) {
  const promptDiv = document.createElement("div");
  promptDiv.classList.add("user-prompt");

  const titleDiv = document.createElement("div");
  titleDiv.classList.add("user-prompt-title");
  titleDiv.textContent = `${currentSpreadType} Cards Reading`;

  const subtitleDiv = document.createElement("div");
  subtitleDiv.classList.add("user-prompt-subtitle");
  subtitleDiv.textContent = `${promptText}`;

  const flexContainer = document.createElement("div");
  flexContainer.style.display = "flex";
  flexContainer.style.flexDirection = "column";
  flexContainer.style.alignItems = "baseline";
  flexContainer.appendChild(titleDiv);
  flexContainer.appendChild(subtitleDiv);

  const spinnerSpan = document.createElement("span");
  spinnerSpan.classList.add("spinner");
  spinnerSpan.innerText = " ";
  flexContainer.appendChild(spinnerSpan);

  promptDiv.appendChild(flexContainer);

  chatContainer.appendChild(promptDiv);

  const spinnerFrames = ["|", "/", "-", "\\"];
  let index = 0;
  const spinnerId = setInterval(() => {
    spinnerSpan.innerText = " " + spinnerFrames[index];
    index = (index + 1) % spinnerFrames.length;
  }, 200);

  return { promptDiv, spinnerSpan, spinnerId };
}

function clearChat() {
  chatContainer.innerHTML = "";
  welcomeMessageDiv.innerText = "";
}

/***************************************************************
 * Fetch / Send logic
 ***************************************************************/
function sendQuery(queryString, intention) {
  clearChat();
  hideUIForReading(); 

  const userPromptObj = addUserPrompt(intention);
  clearCardImages();

  // Disable shuffle button during loading
  shuffleButton.disabled = true;

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

      let synergyContent = "";
      if (data.introduction && data.introduction.trim() !== "") {
        synergyContent += `<p class="assistant-message" style="margin-bottom: 10px;">${data.introduction}</p>`;
      }
      if (data.synthesis && data.synthesis.trim() !== "") {
        synergyContent += data.synthesis;
      } else if (data.error) {
        synergyContent += `<p class="assistant-message">${data.error}</p>`;
      } else {
        synergyContent += `<p class="assistant-message">No results found. Try rephrasing your question.</p>`;
      }
      if (data.oracle_message && data.oracle_message.trim() !== "") {
        synergyContent += `<p class="tarot-message">${data.oracle_message}</p>`;
      }
      
      addAssistantMessage(synergyContent);

      // Re-enable shuffle button after loading
      shuffleButton.disabled = false;
    })
    .catch(error => {
      clearInterval(userPromptObj.spinnerId);
      userPromptObj.spinnerSpan.remove();
      console.error("Error:", error);
      addAssistantMessage("An error occurred while fetching the tarot reading.");

      // Re-enable shuffle button on error
      shuffleButton.disabled = false;
    });
}

/***************************************************************
 * Card display
 ***************************************************************/
function clearCardImages() {
  cardImagesContainer.innerHTML = "";
  cardImagesContainer.classList.remove("plus-layout", "three-card-layout");
  setTimeout(() => {
    if (cardImagesContainer.children.length === 0) {
      codexBrand.style.display = "block";
    }
  }, 100);
}

function addCardImages(cards, layout) {
  clearCardImages();
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
 * Additional UI / Event handlers
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

function capitalizeFirstLetter() {
  const input = intentionInput.value;
  if (input.length > 0) {
    intentionInput.value = input.charAt(0).toUpperCase() + input.slice(1);
  }
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
intentionInput.addEventListener("input", capitalizeFirstLetter);

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

// "Just Cards"
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

const shuffleButton = document.createElement("button");
shuffleButton.id = "shuffle-button";
shuffleButton.textContent = "Shuffle and Start Again";
shuffleButton.style.display = "none";
shuffleButton.addEventListener("click", resetToDefault);

document.getElementById("chat-bottom-container").appendChild(shuffleButton);

function hideUIForReading() {
  document.getElementById("speed-dial-container").style.display = "none";
  document.getElementById("just-cards-speed-dial").style.display = "none";
  document.getElementById("inline-context-container").style.display = "none";
  shuffleButton.style.display = "block";
}

function resetToDefault() {
  document.getElementById("chat-container").innerHTML = "";
  clearCardImages();
  document.getElementById("speed-dial-container").style.display = "flex";
  document.getElementById("just-cards-speed-dial").style.display = "flex";
  document.getElementById("inline-context-container").style.display = "flex";
  shuffleButton.style.display = "none";

  // Clear input field and disable it
  intentionInput.value = "";
  disableInput();

  // Deselect all buttons
  btnRandomCard.classList.remove("active-button");
  btnThreeCard.classList.remove("active-button");
  btnFiveCard.classList.remove("active-button");
  btnJustSingle.classList.remove("active-button");
  btnJustThree.classList.remove("active-button");
  btnJustFive.classList.remove("active-button");
}

/***************************************************************
 * "Just Cards" logic
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
 * Modal: Card Zoom
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
 * On DOMContentLoaded
 ***************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  welcomeMessageDiv.innerText = "Welcome to Codex Tarot";
});