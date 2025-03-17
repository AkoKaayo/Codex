/* DOM References */
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
const navApprenticeBtn = document.getElementById("nav-apprentice-btn");
const apprenticeModeContainer = document.getElementById("apprentice-mode-container");

let currentSpreadType = "";

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

// Vanta.js initialization
document.addEventListener("DOMContentLoaded", () => {
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
});

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
[btnRandomCard, btnThreeCard, btnFiveCard].forEach((button) => {
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
  // Hide the bottom toolbar
  bottomToolbar.style.display = "none";

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
    setTimeout(() => reject(new Error("Request timed out")), 20000);
  });

  const spreadType = currentSpreadType.toLowerCase();
  const cardCount = spreadType === "single" ? 1 : spreadType === "three" ? 3 : 5;
  const finalQuery = `${cardCount} card spread about ${intention}`;
  console.log("Sending query:", finalQuery); // Debug

  Promise.race([
    fetch("/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: finalQuery, intention })
    }),
    timeoutPromise
  ])
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
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
      console.error("Error:", error);

      const errorMsg = (error.message === "Request timed out")
        ? "<p class='assistant-message'>Request timed out. Please try again.</p>"
        : "<p class='assistant-message'>An error occurred while fetching the tarot reading.</p>";

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

  // Fade out starry & fog
  fadeOutEffects();

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
  
  // Bring the toolbar back into view
  bottomToolbar.classList.remove("hidden");
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

/* Event Listeners */
intentionInput.addEventListener("keydown", (e) => {
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
  [btnRandomCard, btnThreeCard, btnFiveCard].forEach((b) => b.classList.remove("active-button"));
  clickedBtn.classList.add("active-button");
}

shuffleButton.addEventListener("click", fadeOutCards);

closeModal.addEventListener("click", () => {
  modal.classList.remove("active");
  // Wait for the transition to complete before setting display to none
  setTimeout(() => {
    modal.style.display = "none";
  }, 800); // Match this timeout with the CSS transition duration (0.4s)
});


document.addEventListener("click", (event) => {
  if (
    event.target.tagName === "IMG" &&
    event.target.parentElement.classList.contains("card-image")
  ) {
    modal.style.display = "block"; // Make sure it's rendered
    // Use a tiny delay or requestAnimationFrame to allow CSS transition to kick in
    requestAnimationFrame(() => {
      modal.classList.add("active");
    });
    modalImage.src = event.target.src;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  intentionInput.addEventListener("input", handleSendButtonState);
  hideReadingPanel();
  updateButtonText();
});

window.addEventListener("resize", debouncedUpdateButtonText);
window.addEventListener("resize", resizeCanvas);

/* NAV SWITCH: Spread Reading vs. Apprentice Mode */
navSpreadReadingBtn.addEventListener("click", () => {
  navbar.classList.remove("active");
  apprenticeModeContainer.classList.remove("active");
  setTimeout(() => {
    apprenticeModeContainer.style.display = "none";
    cardArea.style.display = "block";
    bottomToolbar.style.display = "flex";
    hideReadingPanel();
  }, 800);
});

navApprenticeBtn.addEventListener("click", () => {
  navbar.classList.remove("active");
  readingPanel.classList.remove("active");
  cardArea.style.display = "none";
  bottomToolbar.style.display = "none";
  
  // Show apprentice mode container with transition
  apprenticeModeContainer.style.display = "block";
  requestAnimationFrame(() => {
    apprenticeModeContainer.classList.add("active");
  });
});

document.addEventListener("click", (event) => {
  // Only proceed if navbar is currently active
  if (navbar.classList.contains('active')) {
    const clickedInsideNav = navbar.contains(event.target);
    const clickedNavToggle = (event.target === navToggle);

    // If click is outside nav & not on the toggle, close the nav
    if (!clickedInsideNav && !clickedNavToggle) {
      navbar.classList.remove('active');
    }
  }
});

// Start the global loader spinner when DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
  const spinnerElement = document.getElementById("global-spinner");
  const spinnerFrames = ["|", "/", "-", "\\"];
  let index = 0;
  const spinnerInterval = setInterval(() => {
    spinnerElement.innerText = spinnerFrames[index];
    index = (index + 1) % spinnerFrames.length;
  }, 200);

  // Clear spinner interval on window load so it stops animating
  window.addEventListener("load", () => {
    clearInterval(spinnerInterval);

    // Fade out the global loader
    const loader = document.getElementById("global-loader");
    loader.classList.add("hidden");

    // Remove the loader from the DOM after the fade-out transition
    setTimeout(() => {
      loader.remove();
    }, 500); // 500ms matches the CSS transition duration
  });
});
