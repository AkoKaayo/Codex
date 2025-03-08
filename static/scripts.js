/* DOM References */
const welcomeMessageDiv = document.getElementById("welcome-message");
const userPromptWrapper = document.getElementById("user-prompt-wrapper");
const readingTextContainer = document.getElementById("reading-text-container");

const cardImagesContainer = document.getElementById("card-images-container");
const codexBrand = document.getElementById("codex-brand");

const intentionInput = document.getElementById("intention-input");
const inlineSendButton = document.getElementById("inline-send-button");

const btnRandomCard = document.getElementById("btn-random-card");
const btnThreeCard = document.getElementById("btn-three-card");
const btnFiveCard = document.getElementById("btn-five-card");
const btnJustSingle = document.getElementById("btn-just-single");
const btnJustThree = document.getElementById("btn-just-three");
const btnJustFive = document.getElementById("btn-just-five");

const shuffleButton = document.getElementById("shuffle-button");

const modal = document.getElementById("card-modal");
const modalImage = document.getElementById("modal-image");
const closeModal = document.querySelector("#card-modal .close");

let currentSpreadType = "";

/* Input Handling */
function enableInput() {
  intentionInput.disabled = false;
  intentionInput.placeholder = "What question or situation should the tarot address?";
  inlineSendButton.disabled = true;
  inlineSendButton.classList.remove("send-enabled");
}

function disableInput() {
  intentionInput.disabled = true;
  inlineSendButton.disabled = true;
  intentionInput.placeholder = "Select the type of reading you seek for clarity on.";
  inlineSendButton.classList.remove("send-enabled");
}

function handleSendButtonState() {
  if (intentionInput.value.trim().length > 0) {
    inlineSendButton.disabled = false;
    inlineSendButton.classList.add("send-enabled");
  } else {
    inlineSendButton.disabled = true;
    inlineSendButton.classList.remove("send-enabled");
  }
}

/* On page load, disable input until user picks a spread. */
disableInput();

/* Speed dial spread buttons (API-based) enable the text area. */
[btnRandomCard, btnThreeCard, btnFiveCard].forEach(button => {
  button.addEventListener("click", enableInput);
});

/* ========== UI RENDERING ========== */

/** 
 * Adds the user prompt (title, question, spinner) to #user-prompt-wrapper.
 */
function addUserPrompt(promptText) {
  const promptDiv = document.createElement("div");
  promptDiv.classList.add("user-prompt");

  const titleDiv = document.createElement("div");
  titleDiv.classList.add("user-prompt-title");
  titleDiv.textContent = `${currentSpreadType} Cards Reading`;

  const subtitleDiv = document.createElement("div");
  subtitleDiv.classList.add("user-prompt-subtitle");
  subtitleDiv.textContent = promptText;

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

  userPromptWrapper.appendChild(promptDiv);

  // Simple spinner animation
  const spinnerFrames = ["|", "/", "-", "\\"];
  let index = 0;
  const spinnerId = setInterval(() => {
    spinnerSpan.innerText = " " + spinnerFrames[index];
    index = (index + 1) % spinnerFrames.length;
  }, 200);

  return { promptDiv, spinnerSpan, spinnerId };
}

/**
 * Adds the final reading text to #reading-text-container.
 */
function addReadingText(content) {
  const readingDiv = document.createElement("div");
  readingDiv.innerHTML = content;
  readingTextContainer.appendChild(readingDiv);
}

/**
 * Clears all dynamic UI elements (prompt, reading text, etc.).
 */
function clearUI() {
  userPromptWrapper.innerHTML = "";
  readingTextContainer.innerHTML = "";
  welcomeMessageDiv.innerText = "";
}

/* ========== FETCH LOGIC ========== */

/**
 * Sends the query to /query, shows spinner prompt, waits for response,
 * then displays the reading text in #reading-text-container.
 */
function sendQuery(queryString, intention) {
  clearUI();
  hideUIForReading();

  // Show user prompt + spinner
  const userPromptObj = addUserPrompt(intention);

  clearCardImages();
  shuffleButton.disabled = true; // Keep shuffle button disabled while loading

  // 20-second fetch timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), 20000);
  });

  Promise.race([
    fetch("/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: queryString, intention })
    }),
    timeoutPromise
  ])
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(data => {
      // Stop spinner
      clearInterval(userPromptObj.spinnerId);
      userPromptObj.spinnerSpan.remove();

      // If the server returned cards, display them
      if (data.cards && data.cards.length > 0) {
        addCardImages(data.cards, data.layout);
        codexBrand.style.display = "none";
      }

      // Build reading text
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

      // Append reading text below the user prompt
      addReadingText(synergyContent);

      // Enable shuffle button once the reading arrives
      shuffleButton.disabled = false;
    })
    .catch(error => {
      // Stop spinner
      clearInterval(userPromptObj.spinnerId);
      userPromptObj.spinnerSpan.remove();
      console.error("Error:", error);

      addReadingText(
        error.message === "Request timed out"
          ? "<p class='assistant-message'>Request timed out. Please try again.</p>"
          : "<p class='assistant-message'>An error occurred while fetching the tarot reading.</p>"
      );

      shuffleButton.disabled = false;
      resetToDefault();
    });
}

/* ========== CARD DISPLAY ========== */

/**
 * Clears the card images from #card-images-container.
 */
function clearCardImages() {
  cardImagesContainer.innerHTML = "";
  cardImagesContainer.classList.remove("plus-layout", "three-card-layout");

  // Show brand if no cards remain
  setTimeout(() => {
    if (cardImagesContainer.children.length === 0) {
      codexBrand.style.display = "block";
    }
  }, 100);
}

/**
 * Adds card images to #card-images-container with the specified layout.
 */
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

/* ========== UI HANDLERS ========== */

/**
 * Called when user clicks a spread button (Single, Three, Five).
 */
function showInlineContext(spreadType) {
  welcomeMessageDiv.innerText = "";
  currentSpreadType = spreadType;
  intentionInput.value = "";

  // Show the inline context container so user can type their question
  document.getElementById("inline-context-container").style.display = "flex";
  intentionInput.focus();
}

function handleInputChange() {
  handleSendButtonState();
}

/** Capitalize the first letter automatically */
function capitalizeFirstLetter() {
  const input = intentionInput.value;
  if (input.length > 0) {
    intentionInput.value = input.charAt(0).toUpperCase() + input.slice(1);
  }
}

/**
 * Called when user submits the question (Enter or click).
 */
function handleContextSubmission() {
  const intentionText = intentionInput.value.trim();
  if (intentionText.length === 0) return;

  // Hide the text area after submission
  document.getElementById("inline-context-container").style.display = "none";

  let finalQuery = "";
  switch (currentSpreadType.toLowerCase()) {
    case "single":
      finalQuery = "1 card spread about " + intentionText;
      break;
    case "three":
      finalQuery = "3 card spread about " + intentionText;
      break;
    case "five":
      finalQuery = "5 card spread about " + intentionText;
      break;
    default:
      finalQuery = currentSpreadType + " spread about " + intentionText;
      break;
  }

  sendQuery(finalQuery, intentionText);
}

/* Text area events */
intentionInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleContextSubmission();
  }
});
intentionInput.addEventListener("input", handleInputChange);
intentionInput.addEventListener("input", capitalizeFirstLetter);

inlineSendButton.addEventListener("click", handleContextSubmission);

/* Speed dial (API) buttons */
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

/* "Just Cards" (client-only) buttons */
btnJustSingle.addEventListener("click", () => {
  clearUI();
  document.getElementById("inline-context-container").style.display = "none";
  setUserPromptText("Single card spread");
  const result = drawCardsForSpreadClient("single");
  addCardImages(result.cards, result.layout);
});

btnJustThree.addEventListener("click", () => {
  clearUI();
  document.getElementById("inline-context-container").style.display = "none";
  setUserPromptText("Three card spread");
  const result = drawCardsForSpreadClient("3-card");
  addCardImages(result.cards, result.layout);
});

btnJustFive.addEventListener("click", () => {
  clearUI();
  document.getElementById("inline-context-container").style.display = "none";
  setUserPromptText("Five card spread");
  const result = drawCardsForSpreadClient("5-card");
  addCardImages(result.cards, result.layout);
});

/**
 * Highlights the active spread button.
 */
function setActiveButton(clickedBtn) {
  [btnRandomCard, btnThreeCard, btnFiveCard].forEach(b => b.classList.remove("active-button"));
  clickedBtn.classList.add("active-button");
}

/**
 * Show a simple text label above the reading text (for Just Cards).
 */
function setUserPromptText(text) {
  userPromptWrapper.innerHTML = ""; // Clear any old prompt/spinner
  const promptDiv = document.createElement("div");
  promptDiv.classList.add("user-prompt");
  promptDiv.innerText = text;
  userPromptWrapper.appendChild(promptDiv);
}

/* ========== SHUFFLE BUTTON & RESET ========== */

/**
 * Hides speed dials, shows the shuffle button (disabled).
 */
function hideUIForReading() {
  document.getElementById("speed-dial-container").style.display = "none";
  document.getElementById("just-cards-speed-dial").style.display = "none";
  document.getElementById("inline-context-container").style.display = "none";

  // Show the shuffle button, but keep it disabled until reading arrives
  shuffleButton.style.display = "block";
  shuffleButton.disabled = true;
}

/**
 * Resets everything to the initial state (except the welcome message stays hidden 
 * because you asked to show only once).
 */
function resetToDefault() {
  clearUI();
  clearCardImages();

  document.getElementById("speed-dial-container").style.display = "flex";
  document.getElementById("just-cards-speed-dial").style.display = "flex";
  document.getElementById("inline-context-container").style.display = "flex";
  shuffleButton.style.display = "none";

  // Re-disable the text area
  intentionInput.value = "";
  disableInput();

  // Remove any "active-button" highlights
  [btnRandomCard, btnThreeCard, btnFiveCard, btnJustSingle, btnJustThree, btnJustFive].forEach(b => {
    b.classList.remove("active-button");
  });
}

/* Shuffle button resets to default. */
shuffleButton.addEventListener("click", resetToDefault);

/* ========== CLIENT-ONLY LOGIC FOR "JUST CARDS" ========== */
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
    const chosen = [];
    while (chosen.length < 5) {
      const card = getRandomCard();
      if (!chosen.includes(card)) chosen.push(card);
    }
    return { cards: chosen.map(name => ({ name, image: getCardImage(name) })), layout: "plus" };
  } else if (spreadType === "3-card") {
    const chosen = [];
    while (chosen.length < 3) {
      const card = getRandomCard();
      if (!chosen.includes(card)) chosen.push(card);
    }
    return { cards: chosen.map(name => ({ name, image: getCardImage(name) })), layout: "three" };
  } else {
    // Single
    const cardName = getRandomCard();
    return { cards: [{ name: cardName, image: getCardImage(cardName) }], layout: "default" };
  }
}

function getCardImage(cardName) {
  return "/static/cards/" + cardName.toLowerCase().replace(/ /g, "_") + ".png";
}

/* Card Zoom Modal */
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

document.addEventListener("click", event => {
  if (
    event.target.tagName === "IMG" &&
    event.target.parentElement.classList.contains("card-image")
  ) {
    modal.style.display = "block";
    modalImage.src = event.target.src;
  }
});

/* On DOM load, show welcome text once, then user can pick a spread. */
document.addEventListener("DOMContentLoaded", () => {
  welcomeMessageDiv.innerText = "Take a breath... \nWhat brings you here today?";
  intentionInput.addEventListener("input", handleSendButtonState);
});
