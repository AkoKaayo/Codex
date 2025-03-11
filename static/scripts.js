/* DOM References */
const cardArea = document.getElementById("card-area");
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

let currentSpreadType = "";

// Button text states
const buttonTextStates = {
  random: { full: "Single Card Read", short: "Single" },
  three: { full: "Three Cards Read", short: "3 Cards" },
  five: { full: "Five Cards Read", short: "5 Cards" }
};

// --- NEW: Starry Particle Logic ---
// Configurable parameters (edit these to fine-tune)
const PARTICLE_COUNT = 75;          // Number of particles (50–100 recommended)
const MIN_SIZE = 0.5;               // Minimum particle radius (pixels) - very small
const MAX_SIZE = 1;                 // Maximum particle radius (pixels) - very small
const MIN_SPEED = -0.2;             // Minimum velocity (pixels per frame) - slow
const MAX_SPEED = 0.1;              // Maximum velocity (pixels per frame) - slow
const TWINKLE_SPEED = 0.02;         // Speed of opacity oscillation (higher = faster)
const COLLISION_DISTANCE = 5;       // Distance for collision detection (pixels)
const COLLISION_BRIGHTNESS = 3;     // Brightness increase on collision (multiplier)
const COLLISION_DURATION = 500;     // Duration of brightness in ms
const FADE_DURATION = 5000;         // Fade-out duration in ms (5 seconds)

// Canvas setup
const canvas = document.getElementById("starry-canvas");
const ctx = canvas.getContext("2d");
let particles = [];
let showParticles = true; // Control particle visibility
let canvasOpacity = 1;    // Track canvas opacity for fade-out

// Particle class
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE;
    this.dx = Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
    this.dy = Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
    this.opacity = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.brightness = 1; // Multiplier for collision effect
    this.brightnessTimeout = null;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.brightness, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`; // White stars
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

    // Twinkle effect
    this.twinklePhase += TWINKLE_SPEED;
    this.opacity = 0.5 + Math.sin(this.twinklePhase) * 0.25; // 0.25 to 0.75

    // Reset brightness after collision duration
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

// Fade out particles over 5 seconds
function fadeOutParticles() {
  if (!showParticles) return; // Already fading or hidden
  showParticles = false;

  const fadeSteps = 100; // Number of steps for smooth fade
  const fadeInterval = FADE_DURATION / fadeSteps; // Time per step (50ms per step)
  let step = 0;

  const fadeTimer = setInterval(() => {
    step++;
    canvasOpacity = 1 - (step / fadeSteps); // Linear fade from 1 to 0
    canvas.style.opacity = canvasOpacity;

    if (step >= fadeSteps) {
      clearInterval(fadeTimer);
      canvas.remove(); // NEW: Remove canvas from DOM
    }
  }, fadeInterval);
}

// Animation loop
function animateParticles() {
  if (!showParticles) return; // Stop animating if hidden

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(particle => {
    particle.update();
    particle.draw();
  });
  checkCollisions();
  requestAnimationFrame(animateParticles);
}

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles(); // Reinitialize particles to fit new size
}

// Debounce function (reused from button text)
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// --- Existing Button Text Logic ---
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

/* On page load, disable input and hide reading panel */
disableInput();
hideReadingPanel(); // Ensure panel is hidden on load

/* Speed dial buttons enable the text area. */
[btnRandomCard, btnThreeCard, btnFiveCard].forEach(button => {
  button.addEventListener("click", enableInput);
});

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
  const readingDiv = document.createElement("div");
  readingDiv.innerHTML = content;
  readingTextContainer.appendChild(readingDiv);
}

function clearUI() {
  userPromptWrapper.innerHTML = "";
  readingTextContainer.innerHTML = "";
}

/* Add a function to scale cards dynamically */
function scaleCards() {
  const cardImagesContainer = document.getElementById("card-images-container");
  const cardImages = cardImagesContainer.getElementsByClassName("card-image");

  if (cardImages.length > 0) {
    const containerWidth = cardImagesContainer.offsetWidth;
    const numCards = cardImages.length;
    let maxCardWidth;

    if (window.innerWidth <= 900) { // Mobile
      const totalMarginPerCard = 20; // 10px left + 10px right
      maxCardWidth = Math.min((containerWidth - (numCards * totalMarginPerCard)) / numCards, 200);
    } else { // Desktop and intermediate resolutions
      const totalMarginPerCard = 20;
      maxCardWidth = Math.min((containerWidth - (numCards * totalMarginPerCard)) / numCards, 300);
      maxCardWidth = Math.max(maxCardWidth, 200); // Ensure minimum width for visibility
    }

    Array.from(cardImages).forEach(card => {
      card.style.maxWidth = `${maxCardWidth}px`;
      card.style.height = "auto"; // Maintain aspect ratio
    });
  }
}

/* Fetch Logic */
function sendQuery(queryString, intention) {
  clearUI();

  // Hide the bottom toolbar immediately
  bottomToolbar.style.display = "none";

  // Add a "loading" user prompt
  const userPromptObj = addUserPrompt(intention);

  // Show the reading panel
  showReadingPanel();

  // Clear old card images
  clearCardImages();

  // Hide & disable shuffle until loading finishes
  shuffleButton.style.display = "none";
  shuffleButton.disabled = true;

  // Timeout in case server is unresponsive
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), 20000);
  });

  const spreadType = currentSpreadType.toLowerCase();
  const cardCount = spreadType === "single" ? 1 : spreadType === "three" ? 3 : 5;
  const finalQuery = `${cardCount} card spread about ${intention}`;
  console.log("Sending query:", finalQuery); // Debug log

  Promise.race([
    fetch("/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: finalQuery, intention })
    }),
    timeoutPromise
  ])
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(data => {
      // Stop the spinner
      clearInterval(userPromptObj.spinnerId);
      userPromptObj.spinnerSpan.remove();

      // Show any returned card images
      if (data.cards && data.cards.length > 0) {
        addCardImages(data.cards, spreadType);
        scaleCards(); // Scale after images are added
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

      // Enable & show shuffle now that reading is complete
      shuffleButton.disabled = false;
      shuffleButton.style.display = "block";
    })
    .catch(error => {
      clearInterval(userPromptObj.spinnerId);
      userPromptObj.spinnerSpan.remove();
      console.error("Error:", error);

      const errorMsg = error.message === "Request timed out"
        ? "<p class='assistant-message'>Request timed out. Please try again.</p>"
        : "<p class='assistant-message'>An error occurred while fetching the tarot reading.</p>";

      addReadingText(errorMsg);

      // Show shuffle button to allow reset
      shuffleButton.disabled = false;
      shuffleButton.style.display = "block";
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

/* UI Handlers */
function showInlineContext(spreadType) {
  currentSpreadType = spreadType;
  intentionInput.value = "";
  intentionInput.focus();
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

  // Fade out particles when submitting a query
  fadeOutParticles();

  sendQuery(`${currentSpreadType.toLowerCase()} card spread about ${intentionText}`, intentionText);
}

/* Panel Control */
function showReadingPanel() {
  readingPanel.classList.add("active");
  cardArea.classList.add("panel-open");
  readingPanel.style.display = "flex"; // Ensure panel is shown

  // Initially hide shuffle button each time we open the panel
  shuffleButton.style.display = "none";
  shuffleButton.disabled = true;
}

function hideReadingPanel() {
  readingPanel.classList.remove("active");
  cardArea.classList.remove("panel-open");
  readingPanel.style.display = "none"; // Hide panel
  bottomToolbar.style.display = "flex"; // Restore toolbar

  // Hide shuffle button
  shuffleButton.style.display = "none";
  shuffleButton.disabled = true;
}

/* Reset to default UI state */
function resetToDefault() {
  clearUI();
  clearCardImages();
  hideReadingPanel();
  
  // Disable the input
  disableInput();
  
  // Make sure to clear out the text area and spread type
  intentionInput.value = "";
  currentSpreadType = "";      
  [btnRandomCard, btnThreeCard, btnFiveCard].forEach(b => b.classList.remove("active-button"));
  // Note: Do NOT re-enable particles here
}

/* Event Listeners */
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

function setActiveButton(clickedBtn) {
  [btnRandomCard, btnThreeCard, btnFiveCard].forEach(b => b.classList.remove("active-button"));
  clickedBtn.classList.add("active-button");
}

shuffleButton.addEventListener("click", resetToDefault);

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

document.addEventListener("DOMContentLoaded", () => {
  // Double-check we keep the send button disabled if no text
  intentionInput.addEventListener("input", handleSendButtonState);
  hideReadingPanel(); // Ensure panel is hidden on page load
  updateButtonText();
  resizeCanvas();
  animateParticles();
});

window.addEventListener("resize", debouncedUpdateButtonText);
window.addEventListener("resize", resizeCanvas);