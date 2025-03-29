/* DOM References */
let isCustomReadingPage = false; // Always false since we run from index.html
let cardArea;
let navToggle;
let navbar;
let navClose;
let appContainer;
let cardImagesContainer;
let codexBrand;
let intentionInput;
let inlineSendButton;
let btnRandomCard;
let btnThreeCard;
let btnFiveCard;
let shuffleButton;
let readingPanel;
let closePanel;
let userPromptWrapper;
let readingTextContainer;
let bottomToolbar;
let inlineContextContainer;
let modal;
let modalImage;
let closeModal;
let infoToggle;
let infoModal;
let closeInfoModal;
let cardSelectorContainer;
let cardSelectors;
let contentArea;
let globalLoader;
let navSpreadReadingBtn;
let navCustomReadingBtn;
let navApprenticeBtn;

// Track selected cards for Custom Reading
let selectedCards = [];
const spreadPositions = {
  single: ["MAIN ACTOR"],
  three: ["PAST / GENESIS", "PRESENT / ACTUALITY", "FUTURE / REACTION"],
  five: [
    "OBSTACLE OR BLOCKAGE",
    "MEANS OF RESOLUTION",
    "ACTION TO UNDERTAKE",
    "TRANSFORMATIVE PATWHAY",
    "PURPOSE OR DESTINATION"
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

// Load content dynamically with loader
function loadContent(url, brandText) {
  if (!contentArea) {
    console.error("contentArea element not found in the DOM");
    return;
  }
  globalLoader.classList.remove("hidden"); // Show loader
  contentArea.style.opacity = "0"; // Fade out current content
  setTimeout(() => {
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("Failed to load content");
        return response.text();
      })
      .then(data => {
        contentArea.innerHTML = data;
        // Update DOM references for dynamic elements
        cardArea = document.getElementById("card-area");
        cardImagesContainer = document.getElementById("card-images-container");
        codexBrand = document.getElementById("codex-brand");
        cardSelectorContainer = document.getElementById("card-selector-container");
        cardSelectors = document.getElementById("card-selectors");
        if (codexBrand) {
          codexBrand.innerHTML = brandText; // Update brand text
          codexBrand.classList.remove("initial-load"); // Remove initial-load class
          codexBrand.classList.add("navigated"); // Add navigated class for top positioning
        }
        setTimeout(() => {
          globalLoader.classList.add("hidden"); // Hide loader
          contentArea.style.opacity = "1"; // Fade in new content
          resizeCanvas();
          updateVantaDimensions();
        }, 500); // Minimum loader time
      })
      .catch(error => {
        console.error("Error loading content:", error);
        globalLoader.classList.add("hidden");
        contentArea.style.opacity = "1";
      });
  }, 300); // Fade out duration
}

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
  const newHeight = document.body.scrollHeight;
  canvas.width = window.innerWidth;
  canvas.height = newHeight;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = newHeight + "px";
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

// Button text logic
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
  readingTextContainer.classList.remove("visible");
  readingTextContainer.innerHTML = "";
  const readingDiv = document.createElement("div");
  readingDiv.innerHTML = content;
  readingTextContainer.appendChild(readingDiv);
  void readingTextContainer.offsetHeight;
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
  bottomToolbar.classList.add("hidden");
  if (codexBrand.innerHTML === "CUSTOM<br>READING") {
    cardSelectorContainer.style.display = "none";
  }

  const userPromptObj = addUserPrompt(intention);
  showReadingPanel();
  clearCardImages();
  shuffleButton.style.display = "none";
  shuffleButton.disabled = true;

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), 130000);
  });

  const spreadType = currentSpreadType.toLowerCase();
  const cardCount = spreadType === "single" ? 1 : spreadType === "three" ? 3 : 5;
  const finalQuery = `${cardCount} card spread about ${intention}`;
  console.log("Sending query:", finalQuery);

  const cardsToSend = codexBrand.innerHTML === "CUSTOM<br>READING" ? formatSelectedCards(selectedCards) : [];

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
      clearInterval(userPromptObj.spinnerId);
      userPromptObj.spinnerSpan.remove();

      if (data.cards && data.cards.length > 0) {
        addCardImages(data.cards, spreadType);
        scaleCards();
      } else {
        console.warn("No cards in response:", data);
      }

      let synergyContent = "";
      if (data.introduction) {
        synergyContent += `<p class="assistant-message">${data.introduction}</p><hr>`;
      }
      if (spreadType === "single") {
        if (data.synthesis) {
          synergyContent += `<p class="card-analysis">${data.synthesis}</p>`;
        }
      } else {
        if (data.synthesis) {
          synergyContent += data.synthesis;
        }
      }
      if (data.oracle_message) {
        synergyContent += `<p class="tarot-message">${data.oracle_message}</p>`;
      } else if (data.error) {
        synergyContent += `<p class="assistant-message">${data.error}</p>`;
      } else {
        synergyContent += `<p class="assistant-message">No results found. Try rephrasing your question.</p>`;
      }

      addReadingText(synergyContent);
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
      appContainer.classList.remove("panel-open");
    });
}

/* Card Display */
function clearCardImages() {
  cardImagesContainer.innerHTML = "";
  cardImagesContainer.classList.remove("plus-layout", "three-card-layout");
  if (cardSelectorContainer && !cardSelectorContainer.classList.contains("active")) {
    codexBrand.style.display = "block";
  }
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
    cardDiv.setAttribute("data-position", card.position);
    cardDiv.setAttribute("data-name", card.name);

    const img = document.createElement("img");
    img.src = card.image;
    img.alt = card.name;
    cardDiv.appendChild(img);
    cardImagesContainer.appendChild(cardDiv);

    setTimeout(() => {
      cardDiv.classList.add("show");
    }, 888 * index);
  });
}

/* UI Handlers */
let currentSpreadType = "";

function showInlineContext(spreadType) {
  currentSpreadType = spreadType;
  intentionInput.value = "";
  enableInput();
  intentionInput.focus();
  inlineContextContainer.classList.add("show");
  if (codexBrand.innerHTML === "CUSTOM<br>READING") {
    bottomToolbar.classList.add("hidden");
    setTimeout(() => {
      showCardSelectors(spreadType);
    }, 1000);
  }
}

// Card Selector
const cardSelectorTemplate = (position) => `
  <div class="card-selector" data-position="${position}">
    <h3>${position}</h3>
    <div class="selector-step" data-step="type">
      <h4>Select the Card Type</h4>
      <div class="selector-options">
        <button class="selector-button" data-type="major">Major</button>
        <button class="selector-button" data-type="minor">Minor</button>
        <button class="selector-button" data-type="court">Court</button>
        <button class="selector-button" data-type="random">Random</button>
      </div>
    </div>
    <div class="selector-step" data-step="major" style="display: none;">
      <h4>Select a Card</h4>
      <div class="selector-options">
        <button class="selector-button" data-value="The Fool">The Fool</button>
        <button class="selector-button" data-value="The Magician">The Magician</button>
        <button class="selector-button long-name" data-value="The High Priestess">The High Priestess</button>
        <button class="selector-button" data-value="The Empress">The Empress</button>
        <button class="selector-button" data-value="The Emperor">The Emperor</button>
        <button class="selector-button" data-value="The Pope">The Pope</button>
        <button class="selector-button" data-value="The Lover">The Lover</button>
        <button class="selector-button" data-value="The Chariot">The Chariot</button>
        <button class="selector-button" data-value="Strength">Strength</button>
        <button class="selector-button" data-value="The Hermit">The Hermit</button>
        <button class="selector-button long-name" data-value="The Wheel of Fortune">The Wheel of Fortune</button>
        <button class="selector-button" data-value="Justice">Justice</button>
        <button class="selector-button" data-value="The Hanged Man">The Hanged Man</button>
        <button class="selector-button long-name" data-value="The Nameless Arcanum">The Nameless Arcanum</button>
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
      <div class="selector-options">
        <button class="selector-button" data-value="Swords">Swords</button>
        <button class="selector-button" data-value="Pentacles">Pentacles</button>
        <button class="selector-button" data-value="Cups">Cups</button>
        <button class="selector-button" data-value="Wands">Wands</button>
      </div>
    </div>
    <div class="selector-step" data-step="minor-number" style="display: none;">
      <h4>Select the Card Number</h4>
      <div class="selector-options">
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
    </div>
    <div class="selector-step" data-step="court-suit" style="display: none;">
      <h4>Select the Suit</h4>
      <div class="selector-options">
        <button class="selector-button" data-value="Swords">Swords</button>
        <button class="selector-button" data-value="Pentacles">Pentacles</button>
        <button class="selector-button" data-value="Cups">Cups</button>
        <button class="selector-button" data-value="Wands">Wands</button>
      </div>
    </div>
    <div class="selector-step" data-step="court-character" style="display: none;">
      <h4>Select the Character</h4>
      <div class="selector-options">
        <button class="selector-button" data-value="Page">Page</button>
        <button class="selector-button" data-value="Queen">Queen</button>
        <button class="selector-button" data-value="King">King</button>
        <button class="selector-button" data-value="Knight">Knight</button>
      </div>
    </div>
    <div class="selector-actions">
      <button class="back-button" disabled>Back</button>
      <button class="add-card-button" disabled>Add Selected Card</button>
    </div>
  </div>
`;

function showCardSelectors(spreadType) {
  try {
    // Update DOM references after content load
    cardArea = document.getElementById("card-area");
    cardImagesContainer = document.getElementById("card-images-container");
    cardSelectorContainer = document.getElementById("card-selector-container");
    cardSelectors = document.getElementById("card-selectors");
    codexBrand = document.getElementById("codex-brand");

    cardSelectors.innerHTML = "";
    selectedCards = [];
    codexBrand.style.display = "none";
    inlineContextContainer.classList.remove("show");

    const positions = spreadPositions[spreadType.toLowerCase()] || ["MAIN ACTOR"];
    positions.forEach((position) => {
      const selectorHtml = cardSelectorTemplate(position);
      cardSelectors.insertAdjacentHTML("beforeend", selectorHtml);
    });

    cardSelectorContainer.style.display = "flex";
    cardSelectorContainer.classList.add("active");

    document.querySelectorAll(".card-selector").forEach(selector => {
      const steps = {
        type: selector.querySelector('[data-step="type"]'),
        major: selector.querySelector('[data-step="major"]'),
        minorSuit: selector.querySelector('[data-step="minor-suit"]'),
        minorNumber: selector.querySelector('[data-step="minor-number"]'),
        courtSuit: selector.querySelector('[data-step="court-suit"]'),
        courtCharacter: selector.querySelector('[data-step="court-character"]')
      };
      const addButton = selector.querySelector('.add-card-button');
      const backButton = selector.querySelector('.selector-actions .back-button');
      const actionsContainer = selector.querySelector(".selector-actions");
      const navigationHistory = ['type'];

      const showStep = (stepName) => {
        Object.values(steps).forEach(step => step.style.display = 'none');
        steps[stepName].style.display = 'block';
      };

      selector.addEventListener('click', (e) => {
        if (e.target.classList.contains('selector-button')) {
          const step = e.target.closest('.selector-step').dataset.step;
          const type = e.target.dataset.type;
          const value = e.target.dataset.value;

          const stepContainer = e.target.closest(".selector-step");
          stepContainer.querySelectorAll(".selector-button").forEach((btn) => {
            btn.classList.remove("selected");
          });
          e.target.classList.add("selected");

          if (step === 'type') {
            navigationHistory.push(type === 'major' ? 'major' : type === 'minor' ? 'minorSuit' : type === 'court' ? 'courtSuit' : 'type');
            showStep(type === 'major' ? 'major' : type === 'minor' ? 'minorSuit' : type === 'court' ? 'courtSuit' : 'type');
            backButton.disabled = false;
            if (type === 'random') {
              selector.dataset.selection = JSON.stringify({ type: "random" });
              addButton.disabled = false;
              addButton.classList.add("enabled");
            }
          } else if (step === 'major') {
            selector.dataset.selection = JSON.stringify({ type: "major", name: value });
            addButton.disabled = false;
            addButton.classList.add("enabled");
          } else if (step === 'minor-suit') {
            navigationHistory.push('minorNumber');
            selector.dataset.minorSuit = value;
            showStep('minorNumber');
          } else if (step === 'minor-number') {
            selector.dataset.selection = JSON.stringify({
              type: "minor",
              suit: selector.dataset.minorSuit,
              number: value
            });
            addButton.disabled = false;
            addButton.classList.add("enabled");
          } else if (step === 'court-suit') {
            navigationHistory.push('courtCharacter');
            selector.dataset.courtSuit = value;
            showStep('courtCharacter');
          } else if (step === 'court-character') {
            selector.dataset.selection = JSON.stringify({
              type: "court",
              suit: selector.dataset.courtSuit,
              character: value
            });
            addButton.disabled = false;
            addButton.classList.add("enabled");
          }
        } else if (e.target.classList.contains('back-button') && !e.target.disabled) {
          navigationHistory.pop();
          const previousStep = navigationHistory[navigationHistory.length - 1];
          showStep(previousStep);
          addButton.disabled = true;
          addButton.classList.remove("enabled");
          if (previousStep === 'type') {
            backButton.disabled = true;
          }
          delete selector.dataset.selection;
          delete selector.dataset.minorSuit;
          delete selector.dataset.courtSuit;
          const previousStepContainer = selector.querySelector(`[data-step="${previousStep}"]`);
          previousStepContainer.querySelectorAll(".selector-button").forEach(btn => {
            btn.classList.remove("selected");
          });
        }
      });

      addButton.addEventListener('click', () => {
        const position = selector.dataset.position;
        const selection = JSON.parse(selector.dataset.selection || "{}");

        selectedCards = selectedCards.filter((card) => card.position !== position);
        selectedCards.push({ position, ...selection });

        let cardName = "";
        if (selection.type === "random") {
          cardName = "random";
        } else if (selection.type === "major") {
          cardName = selection.name;
        } else if (selection.type === "minor") {
          cardName = `${selection.number} of ${selection.suit}`;
        } else if (selection.type === "court") {
          cardName = `${selection.character} of ${selection.suit}`;
        }

        const oldHeading = selector.querySelector("h3");
        if (oldHeading) oldHeading.remove();

        const positionH3 = document.createElement("h3");
        positionH3.classList.add("card-position");
        positionH3.textContent = position;

        const namePara = document.createElement("p");
        namePara.classList.add("card-name");
        namePara.textContent = cardName === "random" ? "Random Card" : cardName;

        selector.prepend(namePara);
        selector.prepend(positionH3);

        selector.querySelectorAll(".selector-step").forEach(step => step.remove());
        addButton.remove();
        actionsContainer.querySelector(".back-button").remove();

        const loadingDiv = document.createElement("div");
        loadingDiv.classList.add("card-loading");
        const spinnerSpan = document.createElement("span");
        spinnerSpan.classList.add("spinner");
        spinnerSpan.innerText = " ";
        loadingDiv.appendChild(spinnerSpan);
        selector.appendChild(loadingDiv);

        const spinnerFrames = ["|", "/", "-", "\\"];
        let index = 0;
        const spinnerId = setInterval(() => {
          spinnerSpan.innerText = spinnerFrames[index];
          index = (index + 1) % spinnerFrames.length;
        }, 200);

        fetch("/get_card_image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card_name: cardName })
        })
          .then(response => {
            if (!response.ok) {
              throw new Error("Failed to fetch card image");
            }
            return response.json();
          })
          .then(data => {
            clearInterval(spinnerId);
            loadingDiv.remove();

            const cardImageDiv = document.createElement("div");
            cardImageDiv.classList.add("card-image");
            cardImageDiv.setAttribute("data-position", position);
            cardImageDiv.setAttribute("data-name", data.name);
            const img = document.createElement("img");
            img.src = data.image;
            img.alt = data.name;
            img.onerror = function() {
              console.error("Failed to load image for:", data.name);
              this.parentElement.style.maxWidth = "300px";
              this.parentElement.innerHTML = "Image failed to load";
            };
            img.onload = function() {
              this.parentElement.style.maxWidth = "";
            };
            cardImageDiv.appendChild(img);
            cardImageDiv.style.maxWidth = "";
            cardImageDiv.style.height = "";
            selector.appendChild(cardImageDiv);

            selector.appendChild(actionsContainer);

            const positions = spreadPositions[currentSpreadType.toLowerCase()] || ["MAIN ACTOR"];
            if (selectedCards.length === positions.length) {
              bottomToolbar.classList.remove("hidden");
              inlineContextContainer.classList.add("show");
              setTimeout(() => {
                enableInput();
                intentionInput.focus();
              }, 100);
            }
          })
          .catch(error => {
            console.error("Error fetching card image:", error);
            clearInterval(spinnerId);
            loadingDiv.remove();

            const errorDiv = document.createElement("div");
            errorDiv.classList.add("card-error");
            errorDiv.textContent = "Unable to load card image.";
            selector.appendChild(errorDiv);

            selector.appendChild(actionsContainer);

            const positions = spreadPositions[currentSpreadType.toLowerCase()] || ["MAIN ACTOR"];
            if (selectedCards.length === positions.length) {
              bottomToolbar.classList.remove("hidden");
              inlineContextContainer.classList.add("show");
              setTimeout(() => {
                enableInput();
                intentionInput.focus();
              }, 100);
            }
          });
      });
    });
  } catch (error) {
    console.error("Error in showCardSelectors:", error);
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

  fadeOutEffects();
  infoToggle.classList.add("hidden");
  sendQuery(`${currentSpreadType.toLowerCase()} card spread about ${intentionText}`, intentionText);
  showReadingPanel();
  resizeCanvas();
  updateVantaDimensions();
}

// Function to update Vanta.js dimensions
function updateVantaDimensions() {
  if (vantaEffect) {
    vantaEffect.resize();
  }
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
  resizeCanvas();
  updateVantaDimensions();
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

  loadContent("/static/default_spread.html", "CODEX<br>TAROT");
  selectedCards = [];

  bottomToolbar.classList.remove("hidden");
  bottomToolbar.style.display = "flex";
  infoToggle.classList.remove("hidden");
}

// CARDS
function fadeOutCards() {
  const cards = cardImagesContainer.querySelectorAll('.card-image');
  cards.forEach(card => {
    card.classList.remove("show");
    card.classList.add("fade-out");
  });

  setTimeout(() => {
    readingPanel.classList.remove("active");
    setTimeout(() => {
      resetToDefault();
    }, 600);
  }, 400);
}

/* Event Listeners */
document.addEventListener("DOMContentLoaded", () => {
  // Assign DOM references after DOM is loaded
  cardArea = document.getElementById("card-area");
  navToggle = document.getElementById('nav-toggle');
  navbar = document.getElementById('top-navbar');
  navClose = document.getElementById('nav-close');
  appContainer = document.getElementById("app-container");
  cardImagesContainer = document.getElementById("card-images-container");
  codexBrand = document.getElementById("codex-brand");
  intentionInput = document.getElementById("intention-input");
  inlineSendButton = document.getElementById("inline-send-button");
  btnRandomCard = document.getElementById("btn-random-card");
  btnThreeCard = document.getElementById("btn-three-card");
  btnFiveCard = document.getElementById("btn-five-card");
  shuffleButton = document.getElementById("shuffle-button");
  readingPanel = document.getElementById("reading-panel");
  closePanel = document.getElementById("close-panel");
  userPromptWrapper = document.getElementById("user-prompt-wrapper");
  readingTextContainer = document.getElementById("reading-text-container");
  bottomToolbar = document.getElementById("bottom-toolbar");
  inlineContextContainer = document.getElementById("inline-context-container");
  modal = document.getElementById("card-modal");
  modalImage = document.getElementById("modal-image");
  closeModal = document.querySelector("#card-modal .close");
  infoToggle = document.getElementById('info-toggle');
  infoModal = document.getElementById('info-modal');
  closeInfoModal = document.querySelector('#info-modal .close');
  cardSelectorContainer = document.getElementById("card-selector-container");
  cardSelectors = document.getElementById("card-selectors");
  contentArea = document.getElementById("content-area");
  globalLoader = document.getElementById("global-loader");
  navSpreadReadingBtn = document.getElementById("nav-spread-reading-btn");
  navCustomReadingBtn = document.getElementById("nav-custom-reading-btn");
  navApprenticeBtn = document.getElementById("nav-apprentice-btn");

  // Add initial-load class to codex-brand on page load
  if (codexBrand) {
    codexBrand.classList.add("initial-load");
  }

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

  // Toggling the sidebar nav on button click
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      navbar.classList.toggle("active");
      const container = document.getElementById("app-container");
      if (navbar.classList.contains("active")) {
        container.classList.add("blurred");
      } else {
        container.classList.remove("blurred");
      }
    });
  }

  if (navClose) {
    navClose.addEventListener("click", () => {
      navbar.classList.remove("active");
      const container = document.getElementById("app-container");
      container.classList.remove("blurred");
    });
  }

  // Input and UI initialization
  if (intentionInput) {
    intentionInput.addEventListener("input", handleSendButtonState);
    intentionInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleContextSubmission();
      }
    });
    intentionInput.addEventListener("input", handleInputChange);
    intentionInput.addEventListener("input", capitalizeFirstLetter);
  }

  hideReadingPanel();
  updateButtonText();
  disableInput();
  if (inlineContextContainer) {
    inlineContextContainer.classList.remove("show");
    inlineContextContainer.style.display = "";
  }

  [btnRandomCard, btnThreeCard, btnFiveCard].forEach((button) => {
    if (button) {
      button.addEventListener("click", () => {
        enableInput();
      });
    }
  });

  if (inlineSendButton) {
    inlineSendButton.addEventListener("click", handleContextSubmission);
  }

  if (btnRandomCard) {
    btnRandomCard.addEventListener("click", () => {
      setActiveButton(btnRandomCard);
      showInlineContext("Single");
    });
  }
  if (btnThreeCard) {
    btnThreeCard.addEventListener("click", () => {
      setActiveButton(btnThreeCard);
      showInlineContext("Three");
    });
  }
  if (btnFiveCard) {
    btnFiveCard.addEventListener("click", () => {
      setActiveButton(btnFiveCard);
      showInlineContext("Five");
    });
  }

  if (shuffleButton) {
    shuffleButton.addEventListener("click", fadeOutCards);
  }

  if (closeModal) {
    closeModal.addEventListener("click", () => {
      modal.classList.remove("active");
      setTimeout(() => {
        modal.style.display = "none";
      }, 800);
    });
  }

  if (modalImage) {
    modalImage.addEventListener("click", () => {
      modal.classList.remove("active");
      setTimeout(() => {
        modal.style.display = "none";
      }, 800);
    });
  }

  document.addEventListener("click", (event) => {
    if (
      event.target.tagName === "IMG" &&
      event.target.parentElement.classList.contains("card-image")
    ) {
      modal.style.display = "block";
      requestAnimationFrame(() => {
        modal.classList.add("active");
      });
      modalImage.src = event.target.src;
    }
  });

  if (infoToggle) {
    infoToggle.addEventListener('click', () => {
      infoModal.style.display = 'block';
      requestAnimationFrame(() => {
        infoModal.classList.add('active');
      });
    });
  }

  if (closeInfoModal) {
    closeInfoModal.addEventListener('click', () => {
      infoModal.classList.remove('active');
      setTimeout(() => {
        infoModal.style.display = 'none';
      }, 600);
    });
  }

  document.addEventListener('click', (event) => {
    if (event.target === infoModal && infoModal.classList.contains('active')) {
      infoModal.classList.remove('active');
      setTimeout(() => {
        infoModal.style.display = 'none';
      }, 600);
    }
  });

  // Navigation events
  if (navSpreadReadingBtn) {
    navSpreadReadingBtn.addEventListener("click", () => {
      navbar.classList.remove("active");
      appContainer.classList.remove("blurred");
      loadContent("/static/default_spread.html", "CODEX<br>TAROT");
    });
  }

  if (navCustomReadingBtn) {
    navCustomReadingBtn.addEventListener("click", () => {
      navbar.classList.remove("active");
      appContainer.classList.remove("blurred");
      loadContent("/custom_partial", "CUSTOM<br>READING");
    });
  }

  if (navApprenticeBtn) {
    navApprenticeBtn.addEventListener("click", () => {
      navbar.classList.remove("active");
      appContainer.classList.remove("blurred");
      loadContent("/apprentice_partial", "APPRENTICE<br>MODE");
    });
  }

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

  const spinnerElement = document.getElementById("global-spinner");
  const spinnerFrames = ["|", "/", "-", "\\"];
  let index = 0;
  const spinnerInterval = setInterval(() => {
    if (spinnerElement) {
      spinnerElement.innerText = spinnerFrames[index];
      index = (index + 1) % spinnerFrames.length;
    }
  }, 200);

  window.addEventListener("load", () => {
    clearInterval(spinnerInterval);
    const loader = document.getElementById("global-loader");
    if (loader) {
      loader.classList.add("hidden");
      setTimeout(() => {
        loader.remove();
      }, 500);
    }
  });

  // Fallback to hide loader if load event doesn't fire
  setTimeout(() => {
    const loader = document.getElementById("global-loader");
    if (loader && !loader.classList.contains("hidden")) {
      clearInterval(spinnerInterval);
      loader.classList.add("hidden");
      setTimeout(() => {
        loader.remove();
      }, 500);
    }
  }, 5000); // 5 seconds fallback

  window.addEventListener("resize", () => {
    resizeCanvas();
    updateVantaDimensions();
  });
  window.addEventListener("scroll", updateVantaDimensions);
});

window.addEventListener("resize", debouncedUpdateButtonText);
window.addEventListener("resize", resizeCanvas);

function setActiveButton(clickedBtn) {
  [btnRandomCard, btnThreeCard, btnFiveCard].forEach((b) => b.classList.remove("active-button"));
  clickedBtn.classList.add("active-button");
}