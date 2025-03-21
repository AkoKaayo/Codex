/* DOM References */
const isCustomReadingPage = window.location.pathname.includes("/custom");
const cardArea = document.getElementById("card-area");
const navToggle = document.getElementById('nav-toggle');
const navbar = document.getElementById('top-navbar');
const navClose = document.getElementById('nav-close');
const appContainer = document.getElementById("app-container");
const cardImagesContainer = document.getElementById("card-images-container");
const codexBrand = document.getElementById("codex-brand");
const intentionInput = document.getElementById("intention-input");
const inlineSendButton = document.getElementById("inline-send-button");
const btnRandomCard = document.getElementById("btn-random-card");
const btnThreeCard = document.getElementById("btn-three-card");
const btnFiveCard = document.getElementById("btn-five-card");
const shuffleButton = document.getElementById("shuffle-button");
const readingPanel = document.getElementById("reading-panel");
const closePanel = document.getElementById("close-panel");
const userPromptWrapper = document.getElementById("user-prompt-wrapper");
const readingTextContainer = document.getElementById("reading-text-container");
const bottomToolbar = document.getElementById("bottom-toolbar");
const inlineContextContainer = document.getElementById("inline-context-container");
const modal = document.getElementById("card-modal");
const modalImage = document.getElementById("modal-image");
const closeModal = document.querySelector("#card-modal .close");
const infoToggle = document.getElementById('info-toggle');
const infoModal = document.getElementById('info-modal');
const closeInfoModal = document.querySelector('#info-modal .close');
// DOM References (add these to the existing list)
const cardSelectorContainer = document.getElementById("card-selector-container");
const cardSelectors = document.getElementById("card-selectors");
const confirmSelectionButton = document.getElementById("confirm-selection-button");
const cancelSelectionButton = document.getElementById("cancel-selection-button");

// Track selected cards for Custom Reading
let selectedCards = [];
const spreadPositions = {
  single: ["MAIN ACTOR"],
  three: ["PAST & GENESIS", "PRESENT & ACTUALITY", "FUTURE & CONSEQUENCE"],
  five: [
    "WHAT PREVENTS YOU FROM BEING YOURSELF?",
    "WITH WHAT MEANS CAN YOU FREE YOURSELF?",
    "WHAT ACTION SHOULD YOU UNDERTAKE?",
    "INTO WHAT TRANSFORMATION ARE YOU BEING LED?",
    "WHAT IS YOUR ULTIMATE PURPOSE OR DESTINY?"
  ]
};

// Format selected cards into a list of card names
function formatSelectedCards(cards) {
  return cards.map((card) => {
    if (card.type === "random") {
      return "random"; // Backend will handle random selection
    } else if (card.type === "major") {
      return card.name; // e.g., "The Fool"
    } else if (card.type === "minor") {
      return `${card.number} of ${card.suit}`; // e.g., "Ace of Wands"
    } else if (card.type === "court") {
      return `${card.character} of ${card.suit}`; // e.g., "Queen of Swords"
    }
    return "random"; // Fallback
  });
}

/* Toggling the sidebar nav on button click */
navToggle.addEventListener("click", () => {
  navbar.classList.toggle("active");
  const container = document.getElementById("app-container");
  if (navbar.classList.contains("active")) {
    container.classList.add("blurred");
  } else {
    container.classList.remove("blurred");
  }
});

navClose.addEventListener("click", () => {
  navbar.classList.remove("active");
  const container = document.getElementById("app-container");
  container.classList.remove("blurred");
});

/* NEW: Top nav references */
const topNavbar = document.getElementById("top-navbar");
const navSpreadReadingBtn = document.getElementById("nav-spread-reading-btn");
const navCustomReadingBtn = document.getElementById("nav-custom-reading-btn");
const navApprenticeBtn = document.getElementById("nav-apprentice-btn");
const apprenticeModeContainer = document.getElementById("apprentice-mode-container");

let currentSpreadType = "";

// Card Selector
const cardSelectorTemplate = (position) => `
  <div class="card-selector" data-position="${position}">
    <h3>${position}</h3>
    <div class="selector-step" data-step="type">
      <h4>Select the Card Type</h4>
      <button class="selector-button" data-type="major">Major</button>
      <button class="selector-button" data-type="minor">Minor</button>
      <button class="selector-button" data-type="court">Court</button>
      <button class="selector-button" data-type="random">Random</button>
    </div>
    <div class="selector-step" data-step="major" style="display: none;">
      <h4>Select a Card</h4>
      <div class="selector-options">
        <button class="selector-button" data-value="The Fool">The Fool</button>
        <button class="selector-button" data-value="The Magician">The Magician</button>
        <button class="selector-button" data-value="The High Priestess">The High Priestess</button>
        <button class="selector-button" data-value="The Empress">The Empress</button>
        <button class="selector-button" data-value="The Emperor">The Emperor</button>
        <button class="selector-button" data-value="The Pope">The Pope</button>
        <button class="selector-button" data-value="The Lover">The Lover</button>
        <button class="selector-button" data-value="The Chariot">The Chariot</button>
        <button class="selector-button" data-value="Strength">Strength</button>
        <button class="selector-button" data-value="The Hermit">The Hermit</button>
        <button class="selector-button" data-value="The Wheel of Fortune">The Wheel of Fortune</button>
        <button class="selector-button" data-value="Justice">Justice</button>
        <button class="selector-button" data-value="The Hanged Man">The Hanged Man</button>
        <button class="selector-button" data-value="The Nameless Arcanum">The Nameless Arcanum</button>
        <button class="selector-button" data-value="Temperance">Temperance</button>
        <button class="selector-button" data-value="The Devil">The Devil</button>
        <button class="selector-button" data-value="The Tower">The Tower</button>
        <button class="selector-button" data-value="The Star">The Star</button>
        <button class="selector-button" data-value="The Moon">The Moon</button>
        <button class="selector-button" data-value="The Sun">The Sun</button>
        <button class="selector-button" data-value="Judgment">Judgment</button>
        <button class="selector-button" data-value="The World">The World</button>
      </div>
    </div>
    <div class="selector-step" data-step="minor-suit" style="display: none;">
      <h4>Select the Suit</h4>
      <button class="selector-button" data-value="Swords">Swords</button>
      <button class="selector-button" data-value="Pentacles">Pentacles</button>
      <button class="selector-button" data-value="Cups">Cups</button>
      <button class="selector-button" data-value="Wands">Wands</button>
    </div>
    <div class="selector-step" data-step="minor-number" style="display: none;">
      <h4>Select the Card Number</h4>
      <button class="selector-button" data-value="Ace">Ace</button>
      <button class="selector-button" data-value="Two">Two</button>
      <button class="selector-button" data-value="Three">Three</button>
      <button class="selector-button" data-value="Four">Four</button>
      <button class="selector-button" data-value="Five">Five</button>
      <button class="selector-button" data-value="Six">Six</button>
      <button class="selector-button" data-value="Seven">Seven</button>
      <button class="selector-button" data-value="Eight">Eight</button>
      <button class="selector-button" data-value="Nine">Nine</button>
      <button class="selector-button" data-value="Ten">Ten</button>
    </div>
    <div class="selector-step" data-step="court-suit" style="display: none;">
      <h4>Select the Suit</h4>
      <button class="selector-button" data-value="Swords">Swords</button>
      <button class="selector-button" data-value="Pentacles">Pentacles</button>
      <button class="selector-button" data-value="Cups">Cups</button>
      <button class="selector-button" data-value="Wands">Wands</button>
    </div>
    <div class="selector-step" data-step="court-character" style="display: none;">
      <h4>Select the Character</h4>
      <button class="selector-button" data-value="Page">Page</button>
      <button class="selector-button" data-value="Queen">Queen</button>
      <button class="selector-button" data-value="King">King</button>
      <button class="selector-button" data-value="Knight">Knight</button>
    </div>
    <button class="add-card-button" disabled>Add Selected Card</button>
  </div>
`;

// Button text states
const buttonTextStates = {
  random: { full: "SINGLE CARD READ", short: "SINGLE" },
  three: { full: "THREE CARDS READ", short: "3 CARDS" },
  five: { full: "FIVE CARDS READ", short: "5 CARDS" }
};

// --- Starry Particle Logic ---
const PARTICLE_COUNT = 77;
const MIN_SIZE = 0.1;
const MAX_SIZE = 0.4;
const MIN_SPEED = -0.2;
const MAX_SPEED = 0.1;
const TWINKLE_SPEED = 0.02;
const COLLISION_DISTANCE = 5;
const COLLISION_BRIGHTNESS = 3;
const COLLISION_DURATION = 500;
const FADE_DURATION = 5000;

// Canvas setup
const canvas = document.getElementById("starry-canvas");
const ctx = canvas.getContext("2d");
let particles = [];
let showParticles = true;
let canvasOpacity = 1;

// Vanta.js fog setup
const vantaBackground = document.getElementById("vanta-background");
let vantaEffect = null;
let vantaOpacity = 1;

// Track branding text opacity
let brandOpacity = 1;

// Particle class
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE;
    this.dx = Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
    this.dy = Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
    this.opacity = 0.5 + Math.random() * 0.5; // range 0.5 to 1
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.brightness = 1;
    this.brightnessTimeout = null;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.brightness, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.fill();
    ctx.closePath();
  }

  update() {
    // Movement
    this.x += this.dx;
    this.y += this.dy;

    // Wrap around edges
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;

    // Twinkle
    this.twinklePhase += TWINKLE_SPEED;
    this.opacity = 0.5 + Math.sin(this.twinklePhase) * 0.25;

    // Reset brightness
    if (this.brightness > 1) {
      clearTimeout(this.brightnessTimeout);
      this.brightnessTimeout = setTimeout(() => {
        this.brightness = 1;
      }, COLLISION_DURATION);
    }
  }
}

// Initialize particles
function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
}

// Check collisions
function checkCollisions() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < COLLISION_DISTANCE) {
        particles[i].brightness = COLLISION_BRIGHTNESS;
        particles[j].brightness = COLLISION_BRIGHTNESS;
      }
    }
  }
}

// Fade out particles, fog, and brand text
function fadeOutEffects() {
  if (!showParticles) return;
  showParticles = false;

  const fadeSteps = 100;
  const fadeInterval = FADE_DURATION / fadeSteps;
  let step = 0;

  const fadeTimer = setInterval(() => {
    step++;
    canvasOpacity = 1 - (step / fadeSteps);
    vantaOpacity = 1 - (step / fadeSteps);
    brandOpacity = 1 - (step / fadeSteps);

    canvas.style.opacity = canvasOpacity;
    vantaBackground.style.opacity = vantaOpacity;
    codexBrand.style.opacity = brandOpacity;

    if (step >= fadeSteps) {
      clearInterval(fadeTimer);
      // Remove starry canvas & vanta background & codex brand
      canvas.remove();
      vantaBackground.remove();
      codexBrand.remove();
      if (vantaEffect) {
        vantaEffect.destroy();
        vantaEffect = null;
      }
    }
  }, fadeInterval);
}

// Animation loop
function animateParticles() {
  if (!showParticles) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle) => {
    particle.update();
    particle.draw();
  });

  checkCollisions();
  requestAnimationFrame(animateParticles);
}

// Resize
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles();
}

// Debounce
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Button text logic (existing)
function updateButtonText() {
  const breakpoint = 768;
  if (window.innerWidth <= breakpoint) {
    btnRandomCard.textContent = buttonTextStates.random.short;
    btnThreeCard.textContent = buttonTextStates.three.short;
    btnFiveCard.textContent = buttonTextStates.five.short;
  } else {
    btnRandomCard.textContent = buttonTextStates.random.full;
    btnThreeCard.textContent = buttonTextStates.three.full;
    btnFiveCard.textContent = buttonTextStates.five.full;
  }
}
const debouncedUpdateButtonText = debounce(updateButtonText, 200);

/* Input Handling */
function enableInput() {
  intentionInput.disabled = false;
  intentionInput.placeholder = "What question or situation needs clarity?";
  inlineSendButton.disabled = true;
  inlineSendButton.classList.remove("send-enabled");
}

function disableInput() {
  intentionInput.disabled = true;
  inlineSendButton.disabled = true;
  intentionInput.placeholder = "Take a breath... What brings you here today?";
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

/* UI Rendering */
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

  // Animate spinner
  const spinnerFrames = ["|", "/", "-", "\\"];
  let index = 0;
  const spinnerId = setInterval(() => {
    spinnerSpan.innerText = " " + spinnerFrames[index];
    index = (index + 1) % spinnerFrames.length;
  }, 200);

  return { promptDiv, spinnerSpan, spinnerId };
}

function addReadingText(content) {
  // 1) Remove the .visible class so we fade out any old content
  readingTextContainer.classList.remove("visible");

  // 2) Clear existing children (optional if you want a fresh start each time)
  readingTextContainer.innerHTML = "";

  // 3) Insert new content
  const readingDiv = document.createElement("div");
  readingDiv.innerHTML = content;
  readingTextContainer.appendChild(readingDiv);

  // 4) Force a browser reflow (this ensures transitions will apply)
  void readingTextContainer.offsetHeight;

  // 5) Add the .visible class to trigger the fade-in + expansion
  readingTextContainer.classList.add("visible");
}

function clearUI() {
  userPromptWrapper.innerHTML = "";
  readingTextContainer.innerHTML = "";
}

/* Scale cards dynamically */
function scaleCards() {
  const cardImages = cardImagesContainer.getElementsByClassName("card-image");

  if (cardImages.length > 0) {
    const containerWidth = cardImagesContainer.offsetWidth;
    const numCards = cardImages.length;
    let maxCardWidth;

    if (window.innerWidth <= 900) {
      const totalMarginPerCard = 20;
      maxCardWidth = Math.min((containerWidth - (numCards * totalMarginPerCard)) / numCards, 200);
    } else {
      const totalMarginPerCard = 20;
      maxCardWidth = Math.min((containerWidth - (numCards * totalMarginPerCard)) / numCards, 300);
      maxCardWidth = Math.max(maxCardWidth, 200);
    }

    Array.from(cardImages).forEach((card) => {
      card.style.maxWidth = `${maxCardWidth}px`;
      card.style.height = "auto";
    });
  }
}

/* Fetch Logic */
function sendQuery(queryString, intention) {
  clearUI();
  // Hide the bottom toolbar and card selector container
  bottomToolbar.style.display = "none";
  if (isCustomReadingPage) {
    cardSelectorContainer.style.display = "none";
  }

  // Add "loading" user prompt
  const userPromptObj = addUserPrompt(intention);

  // Show reading panel
  showReadingPanel();

  // Clear old card images
  clearCardImages();

  // Hide & disable shuffle until load finishes
  shuffleButton.style.display = "none";
  shuffleButton.disabled = true;

  // Timeout
  const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), 130000);
  });

  const spreadType = currentSpreadType.toLowerCase();
  const cardCount = spreadType === "single" ? 1 : spreadType === "three" ? 3 : 5;
  const finalQuery = `${cardCount} card spread about ${intention}`;
  console.log("Sending query:", finalQuery); // Debug

  // Format selected cards for Custom Reading
  const cardsToSend = isCustomReadingPage ? formatSelectedCards(selectedCards) : [];

  Promise.race([
      fetch("/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: finalQuery, intention, selectedCards: cardsToSend })
      }),
      timeoutPromise
  ])
      .then((response) => {
          if (!response.ok) {
              return response.json().then((data) => {
                  throw new Error(data.error || "An error occurred while fetching the tarot reading.");
              });
          }
          return response.json();
      })
      .then((data) => {
          // Stop spinner
          clearInterval(userPromptObj.spinnerId);
          userPromptObj.spinnerSpan.remove();

          // Show returned cards
          if (data.cards && data.cards.length > 0) {
              addCardImages(data.cards, spreadType);
              scaleCards();
          } else {
              console.warn("No cards in response:", data);
          }

          // Build synergyContent
          let synergyContent = "";
          if (data.introduction) synergyContent += `<p class="assistant-message">${data.introduction}</p>`;
          if (data.synthesis) synergyContent += data.synthesis;
          else if (data.error) synergyContent += `<p class="assistant-message">${data.error}</p>`;
          else synergyContent += `<p class="assistant-message">No results found. Try rephrasing your question.</p>`;
          if (data.oracle_message) synergyContent += `<p class="tarot-message">${data.oracle_message}</p>`;

          addReadingText(synergyContent);

          // Enable & show shuffle
          shuffleButton.disabled = false;
          shuffleButton.style.display = "block";
      })
      .catch((error) => {
          clearInterval(userPromptObj.spinnerId);
          userPromptObj.spinnerSpan.remove();
          console.error("Error:", error.message);

          let errorMsg = "<p class='assistant-message'>An error occurred while fetching the tarot reading. Give it one more try.</p>";
          if (error.message === "Request timed out") {
              errorMsg = "<p class='assistant-message'>Request timed out. Please try again.</p>";
          } else {
              errorMsg = `<p class='assistant-message'>${error.message}</p>`;
          }

          addReadingText(errorMsg);

          shuffleButton.disabled = false;
          shuffleButton.style.display = "block";
      })
      .finally(() => {
          // Remove panel-open class (cleanup)
          appContainer.classList.remove("panel-open");
      });
}

/* Card Display */
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

  if (layout === "five") {
    cardImagesContainer.classList.add("plus-layout");
  } else if (layout === "three") {
    cardImagesContainer.classList.add("three-card-layout");
  }

  cards.forEach((card, index) => {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card-image");
    // Initially, do not add the .show class

    const img = document.createElement("img");
    img.src = card.image;
    img.alt = card.name;
    cardDiv.appendChild(img);
    cardImagesContainer.appendChild(cardDiv);

    // Use a slight delay for the animation to trigger:
    setTimeout(() => {
      cardDiv.classList.add("show");
    }, 888 * index); // Stagger each card's animation by 50ms (adjust as needed)
  });
}

/* UI Handlers */
function showInlineContext(spreadType) {
  currentSpreadType = spreadType;
  if (isCustomReadingPage) {
    // Show card selectors for Custom Reading
    showCardSelectors(spreadType);
  } else {
    // Existing behavior for Spread Reading
    intentionInput.value = "";
    enableInput();
    intentionInput.focus();
  }
}

function showCardSelectors(spreadType) {
  // Hide the bottom toolbar
  bottomToolbar.style.display = "none";
  
  // Clear any previous selectors
  cardSelectors.innerHTML = "";
  selectedCards = [];
  
  // Determine the number of selectors based on spread type
  const positions = spreadPositions[spreadType.toLowerCase()] || ["MAIN ACTOR"];
  
  // Generate a selector for each position
  positions.forEach((position) => {
    const selectorHtml = cardSelectorTemplate(position);
    cardSelectors.insertAdjacentHTML("beforeend", selectorHtml);
  });
  
  // Show the card selector container
  cardSelectorContainer.style.display = "flex";
  cardSelectorContainer.classList.add("active");
  
  // Add event listeners for selector buttons
  document.querySelectorAll(".selector-button").forEach((button) => {
    button.addEventListener("click", handleSelectorButtonClick);
  });
  
  document.querySelectorAll(".add-card-button").forEach((button) => {
    button.addEventListener("click", handleAddCard);
  });
}

function handleSelectorButtonClick(event) {
  const button = event.target;
  const selector = button.closest(".card-selector");
  const type = button.dataset.type;
  const value = button.dataset.value;
  
  // Highlight the selected button
  const stepContainer = button.closest(".selector-step");
  stepContainer.querySelectorAll(".selector-button").forEach((btn) => {
    btn.classList.remove("selected");
  });
  button.classList.add("selected");
  
  // Hide all steps in this selector
  selector.querySelectorAll(".selector-step").forEach((step) => {
    step.style.display = "none";
  });
  
  // Show the next step based on the selection
  if (type === "major") {
    selector.querySelector('.selector-step[data-step="major"]').style.display = "block";
  } else if (type === "minor") {
    selector.querySelector('.selector-step[data-step="minor-suit"]').style.display = "block";
  } else if (type === "court") {
    selector.querySelector('.selector-step[data-step="court-suit"]').style.display = "block";
  } else if (type === "random") {
    // Mark as random and enable the Add button
    selector.dataset.selection = JSON.stringify({ type: "random" });
    selector.querySelector(".add-card-button").disabled = false;
    selector.querySelector(".add-card-button").classList.add("enabled");
  }
  
  // Handle sub-selections
  if (stepContainer.dataset.step === "major") {
    selector.dataset.selection = JSON.stringify({ type: "major", name: value });
    selector.querySelector(".add-card-button").disabled = false;
    selector.querySelector(".add-card-button").classList.add("enabled");
  } else if (stepContainer.dataset.step === "minor-suit") {
    selector.dataset.minorSuit = value;
    selector.querySelector('.selector-step[data-step="minor-number"]').style.display = "block";
  } else if (stepContainer.dataset.step === "minor-number") {
    selector.dataset.selection = JSON.stringify({
      type: "minor",
      suit: selector.dataset.minorSuit,
      number: value
    });
    selector.querySelector(".add-card-button").disabled = false;
    selector.querySelector(".add-card-button").classList.add("enabled");
  } else if (stepContainer.dataset.step === "court-suit") {
    selector.dataset.courtSuit = value;
    selector.querySelector('.selector-step[data-step="court-character"]').style.display = "block";
  } else if (stepContainer.dataset.step === "court-character") {
    selector.dataset.selection = JSON.stringify({
      type: "court",
      suit: selector.dataset.courtSuit,
      character: value
    });
    selector.querySelector(".add-card-button").disabled = false;
    selector.querySelector(".add-card-button").classList.add("enabled");
  }
}

function handleAddCard(event) {
  const selector = event.target.closest(".card-selector");
  const position = selector.dataset.position;
  const selection = JSON.parse(selector.dataset.selection || "{}");
  
  // Store the selection
  selectedCards = selectedCards.filter((card) => card.position !== position);
  selectedCards.push({ position, ...selection });
  
  // Disable the selector to indicate it's done
  selector.querySelectorAll(".selector-button").forEach((btn) => {
    btn.disabled = true;
  });
  event.target.disabled = true;
  event.target.textContent = "Card Selected";
  
  // Check if all positions have a selection
  const positions = spreadPositions[currentSpreadType.toLowerCase()] || ["MAIN ACTOR"];
  if (selectedCards.length === positions.length) {
    confirmSelectionButton.disabled = false;
  }
}

function handleInputChange() {
  handleSendButtonState();
}

function capitalizeFirstLetter() {
  const input = intentionInput.value;
  if (input.length > 0) {
    intentionInput.value = input.charAt(0).toUpperCase() + input.slice(1);
  }
}

function handleContextSubmission() {
  const intentionText = intentionInput.value.trim();
  if (!intentionText) return;

  // Fade out starry & fog
  fadeOutEffects();

  // Hide the info toggle button
  infoToggle.classList.add("hidden");

  sendQuery(`${currentSpreadType.toLowerCase()} card spread about ${intentionText}`, intentionText);
}

/* Panel Control */
function showReadingPanel() {
  readingPanel.classList.add("active");
  cardArea.classList.add("panel-open");
  bottomToolbar.classList.add("hidden");
  shuffleButton.style.display = "none";
  shuffleButton.disabled = true;
}

function hideReadingPanel() {
  readingPanel.classList.remove("active");
  cardArea.classList.remove("panel-open");
  appContainer.classList.remove("panel-open");
  bottomToolbar.style.display = "flex";
  shuffleButton.style.display = "none";
  shuffleButton.disabled = true;
}

/* Reset to default UI state */
function resetToDefault() {
  clearUI();
  clearCardImages();
  hideReadingPanel();
  
  disableInput();
  intentionInput.value = "";
  currentSpreadType = "";
  [btnRandomCard, btnThreeCard, btnFiveCard].forEach((b) => b.classList.remove("active-button"));
  
  // Reset card selectors
  if (isCustomReadingPage) {
    cardSelectorContainer.style.display = "none";
    cardSelectors.innerHTML = "";
    selectedCards = [];
    confirmSelectionButton.disabled = true;
  }
  
  // Bring the toolbar and info toggle back into view
  bottomToolbar.classList.remove("hidden");
  bottomToolbar.style.display = "flex";
  infoToggle.classList.remove("hidden");
}

// CARDS
function fadeOutCards() {
  // Fade out card images
  const cards = cardImagesContainer.querySelectorAll('.card-image');
  cards.forEach(card => {
    card.classList.remove("show");  // remove the show state
    card.classList.add("fade-out");   // add fade-out to trigger transition
  });

  // After cards have faded (400ms), slide the reading panel out
  setTimeout(() => {
    readingPanel.classList.remove("active");
    
    // After the panel has finished sliding out (600ms), reset the UI
    setTimeout(() => {
      resetToDefault();
    }, 600);
  }, 400);
}

/* Event Listeners (Combined into a single DOMContentLoaded block) */
document.addEventListener("DOMContentLoaded", () => {
  // Vanta.js initialization
  vantaEffect = VANTA.FOG({
    el: "#vanta-background",
    mouseControls: true,
    touchControls: true,
    gyroControls: true,
    minHeight: 200.00,
    minWidth: 200.00,
    highlightColor: 0x6e00b9,
    midtoneColor: 0x370069,
    lowlightColor: 0x240E37,
    baseColor: 0x0,
    blurFactor: 0.8,
    speed: -1,
    zoom: 0.4,
    backgroundAlpha: 0
  });

  resizeCanvas();
  animateParticles();

  // Input and UI initialization
  intentionInput.addEventListener("input", handleSendButtonState);
  hideReadingPanel();
  updateButtonText();
  disableInput();

  // Speed dial buttons enable the text area (only for Spread Reading)
  [btnRandomCard, btnThreeCard, btnFiveCard].forEach((button) => {
    button.addEventListener("click", () => {
      if (!isCustomReadingPage) {
        enableInput();
      }
    });
  });

  // Intention input events
  intentionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleContextSubmission();
    }
  });
  intentionInput.addEventListener("input", handleInputChange);
  intentionInput.addEventListener("input", capitalizeFirstLetter);
  inlineSendButton.addEventListener("click", handleContextSubmission);

  // Spread type buttons
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

  // Shuffle button
  shuffleButton.addEventListener("click", fadeOutCards);

  // Card modal events
  closeModal.addEventListener("click", () => {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 800); // Match this timeout with the CSS transition duration (0.8s)
  });

  modalImage.addEventListener("click", () => {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 800); // Match this timeout with the CSS transition duration (0.8s)
  });

  document.addEventListener("click", (event) => {
    if (
      event.target.tagName === "IMG" &&
      event.target.parentElement.classList.contains("card-image")
    ) {
      modal.style.display = "block"; // Make sure it's rendered
      requestAnimationFrame(() => {
        modal.classList.add("active");
      });
      modalImage.src = event.target.src;
    }
  });

  // Info modal events
  infoToggle.addEventListener('click', () => {
    console.log('Info toggle clicked. Current display:', infoModal.style.display, 'Has active class:', infoModal.classList.contains('active'));
    infoModal.style.display = 'block';
    requestAnimationFrame(() => {
      infoModal.classList.add('active');
      console.log('After adding active class. Display:', infoModal.style.display, 'Has active class:', infoModal.classList.contains('active'));
    });
  });

  closeInfoModal.addEventListener('click', () => {
    infoModal.classList.remove('active');
    setTimeout(() => {
      infoModal.style.display = 'none';
    }, 600); // Match CSS transition duration
  });

  document.addEventListener('click', (event) => {
    if (event.target === infoModal && infoModal.classList.contains('active')) {
      infoModal.classList.remove('active');
      setTimeout(() => {
        infoModal.style.display = 'none';
      }, 600); // Match CSS transition duration
    }
  });

  // Navigation events
  navSpreadReadingBtn.addEventListener("click", () => {
    if (isCustomReadingPage) {
      window.location.href = "/"; // Navigate to Spread Reading
    } else {
      navbar.classList.remove("active");
      apprenticeModeContainer.classList.remove("active");
      appContainer.classList.remove("blurred");
      setTimeout(() => {
        apprenticeModeContainer.style.display = "none";
        cardArea.style.display = "block";
        bottomToolbar.style.display = "flex";
        fadeOutCards();
      }, 800);
    }
  });

  navCustomReadingBtn.addEventListener("click", () => {
    if (!isCustomReadingPage) {
      window.location.href = "/custom"; // Navigate to Custom Reading
    } else {
      navbar.classList.remove("active");
      apprenticeModeContainer.classList.remove("active");
      appContainer.classList.remove("blurred");
      setTimeout(() => {
        apprenticeModeContainer.style.display = "none";
        cardArea.style.display = "block";
        bottomToolbar.style.display = "flex";
        fadeOutCards();
      }, 800);
    }
  });

  navApprenticeBtn.addEventListener("click", () => {
    navbar.classList.remove("active");
    appContainer.classList.remove("blurred");
    readingPanel.classList.remove("active");
    cardArea.style.display = "none";
    bottomToolbar.style.display = "none";
    apprenticeModeContainer.style.display = "block";
    requestAnimationFrame(() => {
      apprenticeModeContainer.classList.add("active");
    });
  });

  document.addEventListener("click", (event) => {
    if (navbar.classList.contains('active')) {
      const clickedInsideNav = navbar.contains(event.target);
      const clickedNavToggle = (event.target === navToggle);
      if (!clickedInsideNav && !clickedNavToggle) {
        navbar.classList.remove('active');
        appContainer.classList.remove("blurred");
      }
    }
  });

  document.querySelectorAll('#nav-links button').forEach(button => {
    button.addEventListener('click', () => {
      navbar.classList.remove("active");
      appContainer.classList.remove("blurred");
    });
  });

  // Custom Reading: Enable intention input after card selection
  if (isCustomReadingPage) {
    confirmSelectionButton.addEventListener("click", () => {
      if (!confirmSelectionButton.disabled) {
        // Hide the card selector container
        cardSelectorContainer.style.display = "none";
        // Show the bottom toolbar
        bottomToolbar.style.display = "flex";
        bottomToolbar.classList.remove("hidden");
        // Enable and focus the intention input
        enableInput();
        intentionInput.focus();
      }
    });
  
    cancelSelectionButton.addEventListener("click", () => {
      resetToDefault();
      cardSelectorContainer.style.display = "none";
      selectedCards = [];
    });
  }

  // Global loader spinner
  const spinnerElement = document.getElementById("global-spinner");
  const spinnerFrames = ["|", "/", "-", "\\"];
  let index = 0;
  const spinnerInterval = setInterval(() => {
    spinnerElement.innerText = spinnerFrames[index];
    index = (index + 1) % spinnerFrames.length;
  }, 200);

  window.addEventListener("load", () => {
    clearInterval(spinnerInterval);
    const loader = document.getElementById("global-loader");
    loader.classList.add("hidden");
    setTimeout(() => {
      loader.remove();
    }, 500); // 500ms matches the CSS transition duration
  });
});

window.addEventListener("resize", debouncedUpdateButtonText);
window.addEventListener("resize", resizeCanvas);

function setActiveButton(clickedBtn) {
  [btnRandomCard, btnThreeCard, btnFiveCard].forEach((b) => b.classList.remove("active-button"));
  clickedBtn.classList.add("active-button");
}