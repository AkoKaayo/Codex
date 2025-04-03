/* DOM References (Global) */
let isCustomReadingPage = window.location.pathname.includes("/custom");
let currentSpreadType = "";
let selectedCards = [];
let vantaEffect = null;
let isBinding = false; // Prevent concurrent binding calls

// Spread positions for Custom Spread page
const spreadPositions = {
    single: ["MAIN ACTOR"],
    three: ["PAST / GENESIS", "PRESENT / ACTUALITY", "FUTURE / REACTION"],
    five: [
        "OBSTACLE OR BLOCKAGE",
        "MEANS OF RESOLUTION",
        "ACTION TO UNDERTAKE",
        "TRANSFORMATIVE PATHWAY",
        "PURPOSE OR DESTINATION"
    ]
};

// Button text states for spread buttons
const buttonTextStates = {
    random: { full: "SINGLE CARD READ", short: "SINGLE" },
    three: { full: "THREE CARDS READ", short: "3 CARDS" },
    five: { full: "FIVE CARDS READ", short: "5 CARDS" }
};

// --- Loader and Spinner Functions ---
function showLoader() {
    const loader = document.getElementById('global-loader');
    const spinner = document.getElementById('global-spinner');
    spinner.style.fontSize = '8rem';
    loader.style.opacity = '1';
    loader.classList.remove('hidden');
    startSpinner();
}

function hideLoader() {
    const loader = document.getElementById('global-loader');
    loader.style.transition = 'opacity 1s ease';
    loader.style.opacity = '0';
    stopSpinner();
    setTimeout(() => {
        loader.classList.add('hidden');
        document.getElementById('global-spinner').style.fontSize = '4rem';
    }, 1000);
}

let spinnerInterval = null;
function startSpinner() {
    const spinnerElement = document.getElementById("global-spinner");
    const spinnerFrames = ["|", "/", "-", "\\"];
    let index = 0;
    spinnerInterval = setInterval(() => {
        spinnerElement.innerText = spinnerFrames[index];
        index = (index + 1) % spinnerFrames.length;
    }, 400); // Slowed down the spinner as requested
}

function stopSpinner() {
    if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
    }
}

// --- Content Swap Function ---
function swapContent(target) {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) {
        console.error('DOM not ready: #app-container not found');
        return;
    }

    showLoader();
    appContainer.style.transition = 'filter 1s ease';
    appContainer.classList.add('blurred');
    resetToDefault();

    setTimeout(() => {
        if (target === 'spread') {
            if (window.spreadContent) {
                appContainer.innerHTML = window.spreadContent;
                isCustomReadingPage = false;
                setTimeout(() => {
                    appContainer.classList.remove('blurred');
                    hideLoader();
                    bindEventListeners();
                }, 1000);
            } else {
                fetch('/')
                    .then(response => response.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const spreadContainer = doc.getElementById('app-container');
                        if (spreadContainer) {
                            appContainer.innerHTML = spreadContainer.innerHTML;
                            window.spreadContent = spreadContainer.innerHTML;
                            isCustomReadingPage = false;
                        } else {
                            appContainer.innerHTML = '<p>Error: Spread content not available. Please refresh the page.</p>';
                        }
                        setTimeout(() => {
                            appContainer.classList.remove('blurred');
                            hideLoader();
                            bindEventListeners();
                        }, 1000);
                    })
                    .catch(err => {
                        appContainer.innerHTML = '<p>Error loading spread reading page. Please try again.</p>';
                        setTimeout(() => {
                            appContainer.classList.remove('blurred');
                            hideLoader();
                            bindEventListeners();
                        }, 1000);
                    });
            }
        } else if (target === 'custom') {
            fetch('/custom')
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    appContainer.innerHTML = doc.getElementById('app-container').innerHTML;
                    isCustomReadingPage = true;
                    setTimeout(() => {
                        appContainer.classList.remove('blurred');
                        hideLoader();
                        bindEventListeners();
                    }, 1000);
                })
                .catch(err => {
                    appContainer.innerHTML = '<p>Error loading custom reading page. Please try again.</p>';
                    setTimeout(() => {
                        appContainer.classList.remove('blurred');
                        hideLoader();
                        bindEventListeners();
                    }, 1000);
                });
        }
    }, 1000);
}

// --- Event Listener Binding ---
function bindEventListeners(attempts = 5, delay = 200) {
    // Prevent concurrent binding calls
    if (isBinding) return;
    isBinding = true;

    const tryBind = () => {
        // Re-query all DOM elements
        let navToggle = document.getElementById('nav-toggle');
        const navbar = document.getElementById('top-navbar');
        const navClose = document.getElementById('nav-close');
        const navSpreadReadingBtn = document.getElementById("nav-spread-reading-btn");
        const navCustomReadingBtn = document.getElementById("nav-custom-reading-btn");
        const navApprenticeBtn = document.getElementById("nav-apprentice-btn");
        const appContainer = document.getElementById("app-container");
        const apprenticeModeContainer = document.getElementById("apprentice-mode-container");
        const cardArea = document.getElementById("card-area");
        const bottomToolbar = document.getElementById("bottom-toolbar");
        const readingPanel = document.getElementById("reading-panel");
        const intentionInput = document.getElementById("intention-input");
        const inlineSendButton = document.getElementById("inline-send-button");
        const btnRandomCard = document.getElementById("btn-random-card");
        const btnThreeCard = document.getElementById("btn-three-card");
        const btnFiveCard = document.getElementById("btn-five-card");
        const shuffleButton = document.getElementById("shuffle-button");
        const modal = document.getElementById("card-modal");
        const modalImage = document.getElementById("modal-image");
        const closeModal = document.querySelector("#card-modal .close");
        const infoToggle = document.getElementById('info-toggle');
        const infoModal = document.getElementById('info-modal');
        const closeInfoModal = document.querySelector('#info-modal .close');
        const cardSelectorContainer = document.getElementById("card-selector-container");
        const cardSelectors = document.getElementById("card-selectors");
        const inlineContextContainer = document.getElementById("inline-context-container");
        const codexBrand = document.getElementById("codex-brand");
        const cardImagesContainer = document.getElementById("card-images-container");
        const userPromptWrapper = document.getElementById("user-prompt-wrapper");
        const readingTextContainer = document.getElementById("reading-text-container");

        // Check if required navbar elements are found
        if (navToggle && navbar && navClose && navSpreadReadingBtn && navCustomReadingBtn && navApprenticeBtn) {
            // Clone navToggle to remove existing listeners
            const newNavToggle = navToggle.cloneNode(true);
            navToggle.parentNode.replaceChild(newNavToggle, navToggle);
            navToggle = newNavToggle;

            // --- Navbar Event Listeners ---
            const handleNavToggle = (event) => {
                event.stopPropagation();
                navbar.classList.toggle("active");
                if (navbar.classList.contains("active")) {
                    appContainer.classList.add("blurred");
                } else {
                    appContainer.classList.remove("blurred");
                }
            };

            const handleNavClose = () => {
                navbar.classList.remove("active");
                appContainer.classList.remove("blurred");
            };

            const handleNavSpreadReading = () => {
                if (isCustomReadingPage) {
                    swapContent('spread');
                }
                navbar.classList.remove("active");
                appContainer.classList.remove("blurred");
            };

            const handleNavCustomReading = () => {
                if (!isCustomReadingPage) {
                    swapContent('custom');
                }
                navbar.classList.remove("active");
                appContainer.classList.remove("blurred");
            };

            const handleNavApprentice = () => {
                navbar.classList.remove("active");
                appContainer.classList.remove("blurred");
                readingPanel.classList.remove("active");
                cardArea.style.display = "none";
                bottomToolbar.style.display = "none";
                apprenticeModeContainer.style.display = "block";
                requestAnimationFrame(() => {
                    apprenticeModeContainer.classList.add("active");
                });
            };

            const handleClickOutside = (event) => {
                if (navbar.classList.contains('active')) {
                    const clickedInsideNav = navbar.contains(event.target);
                    const clickedNavToggle = (event.target === navToggle);
                    if (!clickedInsideNav && !clickedNavToggle) {
                        navbar.classList.remove('active');
                        appContainer.classList.remove("blurred");
                    }
                }
            };

            const handleNavLinkClick = () => {
                navbar.classList.remove("active");
                appContainer.classList.remove("blurred");
            };

            // Remove existing navbar listeners
            navClose.removeEventListener("click", handleNavClose);
            navSpreadReadingBtn.removeEventListener("click", handleNavSpreadReading);
            navCustomReadingBtn.removeEventListener("click", handleNavCustomReading);
            navApprenticeBtn.removeEventListener("click", handleNavApprentice);
            document.removeEventListener("click", handleClickOutside);
            document.querySelectorAll('#nav-links button').forEach(button => {
                button.removeEventListener("click", handleNavLinkClick);
            });

            // Add navbar listeners
            navToggle.addEventListener("click", handleNavToggle);
            navClose.addEventListener("click", handleNavClose);
            navSpreadReadingBtn.addEventListener("click", handleNavSpreadReading);
            navCustomReadingBtn.addEventListener("click", handleNavCustomReading);
            navApprenticeBtn.addEventListener("click", handleNavApprentice);
            document.addEventListener("click", handleClickOutside);
            document.querySelectorAll('#nav-links button').forEach(button => {
                button.addEventListener("click", handleNavLinkClick);
            });

            // --- Spread Reading Buttons (Quick Read Page) ---
            const handleBtnRandomCard = () => {
                setActiveButton(btnRandomCard);
                showInlineContext("Single");
            };

            const handleBtnThreeCard = () => {
                setActiveButton(btnThreeCard);
                showInlineContext("Three");
            };

            const handleBtnFiveCard = () => {
                setActiveButton(btnFiveCard);
                showInlineContext("Five");
            };

            if (btnRandomCard) {
                btnRandomCard.removeEventListener("click", handleBtnRandomCard);
                btnRandomCard.addEventListener("click", handleBtnRandomCard);
            }

            if (btnThreeCard) {
                btnThreeCard.removeEventListener("click", handleBtnThreeCard);
                btnThreeCard.addEventListener("click", handleBtnThreeCard);
            }

            if (btnFiveCard) {
                btnFiveCard.removeEventListener("click", handleBtnFiveCard);
                btnFiveCard.addEventListener("click", handleBtnFiveCard);
            }

            // Speed dial buttons enable the text area (only for Quick Read)
            const handleEnableInput = () => {
                if (!isCustomReadingPage) {
                    enableInput();
                }
            };
            [btnRandomCard, btnThreeCard, btnFiveCard].forEach((button) => {
                if (button) {
                    button.removeEventListener("click", handleEnableInput);
                    button.addEventListener("click", handleEnableInput);
                }
            });

            // --- Intention Input and Submission ---
            if (intentionInput) {
                const handleInput = () => handleSendButtonState();
                const handleInputChangeEvent = () => handleInputChange();
                const handleCapitalize = () => capitalizeFirstLetter();
                const handleEnterKey = (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        handleContextSubmission();
                    }
                };

                // Remove existing listeners
                intentionInput.removeEventListener("input", handleInput);
                intentionInput.removeEventListener("input", handleInputChangeEvent);
                intentionInput.removeEventListener("input", handleCapitalize);
                intentionInput.removeEventListener("keydown", handleEnterKey);

                // Add listeners
                intentionInput.addEventListener("input", handleInput);
                intentionInput.addEventListener("input", handleInputChangeEvent);
                intentionInput.addEventListener("input", handleCapitalize);
                intentionInput.addEventListener("keydown", handleEnterKey);
            }

            if (inlineSendButton) {
                inlineSendButton.removeEventListener("click", handleContextSubmission);
                inlineSendButton.addEventListener("click", handleContextSubmission);
            }

            // --- Shuffle Button ---
            if (shuffleButton) {
                shuffleButton.removeEventListener("click", fadeOutCards);
                shuffleButton.addEventListener("click", fadeOutCards);
            }

            // --- Card Modal Events ---
            if (closeModal) {
                const handleCloseModal = () => {
                    modal.classList.remove("active");
                    setTimeout(() => {
                        modal.style.display = "none";
                    }, 800);
                };
                closeModal.removeEventListener("click", handleCloseModal);
                closeModal.addEventListener("click", handleCloseModal);
            }

            if (modalImage) {
                const handleModalImageClick = () => {
                    modal.classList.remove("active");
                    setTimeout(() => {
                        modal.style.display = "none";
                    }, 800);
                };
                modalImage.removeEventListener("click", handleModalImageClick);
                modalImage.addEventListener("click", handleModalImageClick);
            }

            const handleCardImageClick = (event) => {
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
            };
            document.removeEventListener("click", handleCardImageClick);
            document.addEventListener("click", handleCardImageClick);

            // --- Info Modal Events ---
            if (infoToggle) {
                const handleInfoToggle = () => {
                    infoModal.style.display = 'block';
                    requestAnimationFrame(() => {
                        infoModal.classList.add('active');
                    });
                };
                infoToggle.removeEventListener('click', handleInfoToggle);
                infoToggle.addEventListener('click', handleInfoToggle);
            }

            if (closeInfoModal) {
                const handleCloseInfoModal = () => {
                    infoModal.classList.remove('active');
                    setTimeout(() => {
                        infoModal.style.display = 'none';
                    }, 600);
                };
                closeInfoModal.removeEventListener('click', handleCloseInfoModal);
                closeInfoModal.addEventListener('click', handleCloseInfoModal);
            }

            const handleInfoModalClickOutside = (event) => {
                if (event.target === infoModal && infoModal.classList.contains('active')) {
                    infoModal.classList.remove('active');
                    setTimeout(() => {
                        infoModal.style.display = 'none';
                    }, 600);
                }
            };
            document.removeEventListener('click', handleInfoModalClickOutside);
            document.addEventListener('click', handleInfoModalClickOutside);

            // --- Card Selectors (Custom Spread Page) ---
            if (isCustomReadingPage && cardSelectorContainer && cardSelectors) {
                const handleCardSelectorClick = (selector) => {
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

                    const handleSelectorClick = (e) => {
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
                                navigationHistory.push(
                                    type === 'major' ? 'major'
                                    : type === 'minor' ? 'minorSuit'
                                    : type === 'court' ? 'courtSuit'
                                    : 'type'
                                );
                                showStep(
                                    type === 'major' ? 'major'
                                    : type === 'minor' ? 'minorSuit'
                                    : type === 'court' ? 'courtSuit'
                                    : 'type'
                                );
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
                    };

                    const handleAddButtonClick = () => {
                      const position = selector.dataset.position;
                      let selection = JSON.parse(selector.dataset.selection || "{}");
                  
                      // If it wasn't random, add to selectedCards immediately
                      if (selection.type !== "random") {
                          selectedCards = selectedCards.filter((card) => card.position !== position);
                          selectedCards.push({ position, ...selection });
                      }
                  
                      // Figure out the "friendly" name to display
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
                  
                      // UI updates
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
                      }, 400);
                  
                      // Fetch the card image
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
                  
                          // If this was a random selection, update selectedCards with the real card
                          if (selection.type === "random") {
                              selectedCards = selectedCards.filter((card) => card.position !== position);
                              selectedCards.push({ position, type: "major", name: data.name });
                              namePara.textContent = data.name; // Update the displayed name
                          }
                  
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
                    };

                    selector.removeEventListener('click', handleSelectorClick);
                    addButton.removeEventListener('click', handleAddButtonClick);

                    selector.addEventListener('click', handleSelectorClick);
                    addButton.addEventListener('click', handleAddButtonClick);
                };

                document.querySelectorAll(".card-selector").forEach(selector => {
                    handleCardSelectorClick(selector);
                });
            }
        } else {
            if (attempts > 0) {
                setTimeout(() => bindEventListeners(attempts - 1, delay), delay);
            } else {
                console.error('Max attempts reached: Could not bind event listeners. Elements missing:');
                console.error('navToggle:', navToggle);
                console.error('navbar:', navbar);
                console.error('navClose:', navClose);
                console.error('navSpreadReadingBtn:', navSpreadReadingBtn);
                console.error('navCustomReadingBtn:', navCustomReadingBtn);
                console.error('navApprenticeBtn:', navApprenticeBtn);
            }
        }
    };

    tryBind();
    isBinding = false;
}

// --- Card Selector Template ---
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

const canvas = document.getElementById("starry-canvas");
const ctx = canvas.getContext("2d");
let particles = [];
let showParticles = true;
let canvasOpacity = 1;

const vantaBackground = document.getElementById("vanta-background");
let vantaOpacity = 1;
let brandOpacity = 1;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE;
        this.dx = Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
        this.dy = Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
        this.opacity = 0.5 + Math.random() * 0.5;
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
        this.x += this.dx;
        this.y += this.dy;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        this.twinklePhase += TWINKLE_SPEED;
        this.opacity = 0.5 + Math.sin(this.twinklePhase) * 0.25;

        if (this.brightness > 1) {
            clearTimeout(this.brightnessTimeout);
            this.brightnessTimeout = setTimeout(() => {
                this.brightness = 1;
            }, COLLISION_DURATION);
        }
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }
}

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
        const codexBrand = document.getElementById("codex-brand");
        if (codexBrand) codexBrand.style.opacity = brandOpacity;

        if (isCustomReadingPage) {
            const cardSelectors = document.querySelectorAll(".card-selector .card-image");
            cardSelectors.forEach(card => {
                card.style.opacity = 1 - (step / fadeSteps);
            });
        }

        if (step >= fadeSteps) {
            clearInterval(fadeTimer);
            canvas.remove();
            vantaBackground.remove();
            if (codexBrand) codexBrand.remove();
            if (vantaEffect) {
                vantaEffect.destroy();
                vantaEffect = null;
            }
            if (isCustomReadingPage) {
                const cardSelectors = document.getElementById("card-selectors");
                if (cardSelectors) cardSelectors.innerHTML = "";
            }
        }
    }, fadeInterval);
}

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

function resizeCanvas() {
    const newHeight = document.body.scrollHeight;
    canvas.width = window.innerWidth;
    canvas.height = newHeight;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = newHeight + "px";
    initParticles();
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function updateButtonText() {
    const btnRandomCard = document.getElementById("btn-random-card");
    const btnThreeCard = document.getElementById("btn-three-card");
    const btnFiveCard = document.getElementById("btn-five-card");

    if (btnRandomCard && btnThreeCard && btnFiveCard) {
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
}
const debouncedUpdateButtonText = debounce(updateButtonText, 200);

// --- Input Handling ---
function enableInput() {
    const intentionInput = document.getElementById("intention-input");
    const inlineSendButton = document.getElementById("inline-send-button");
    if (intentionInput && inlineSendButton) {
        intentionInput.disabled = false;
        intentionInput.placeholder = "What question or situation needs clarity?";
        inlineSendButton.disabled = true;
        inlineSendButton.classList.remove("send-enabled");
    }
}

function disableInput() {
    const intentionInput = document.getElementById("intention-input");
    const inlineSendButton = document.getElementById("inline-send-button");
    if (intentionInput && inlineSendButton) {
        intentionInput.disabled = true;
        inlineSendButton.disabled = true;
        intentionInput.placeholder = "Take a breath... What brings you here today?";
        inlineSendButton.classList.remove("send-enabled");
    }
}

function handleSendButtonState() {
    const intentionInput = document.getElementById("intention-input");
    const inlineSendButton = document.getElementById("inline-send-button");
    if (intentionInput && inlineSendButton) {
        if (intentionInput.value.trim().length > 0) {
            inlineSendButton.disabled = false;
            inlineSendButton.classList.add("send-enabled");
        } else {
            inlineSendButton.disabled = true;
            inlineSendButton.classList.remove("send-enabled");
        }
    }
}

// --- UI Rendering ---
function addUserPrompt(promptText) {
    const userPromptWrapper = document.getElementById("user-prompt-wrapper");
    if (!userPromptWrapper) return { promptDiv: null, spinnerSpan: null, spinnerId: null };

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

    const spinnerFrames = ["|", "/", "-", "\\"];
    let index = 0;
    const spinnerId = setInterval(() => {
        spinnerSpan.innerText = " " + spinnerFrames[index];
        index = (index + 1) % spinnerFrames.length;
    }, 400);

    return { promptDiv, spinnerSpan, spinnerId };
}

function addReadingText(content) {
    const readingTextContainer = document.getElementById("reading-text-container");
    if (!readingTextContainer) return;

    readingTextContainer.classList.remove("visible");
    readingTextContainer.innerHTML = "";

    const readingDiv = document.createElement("div");
    readingDiv.innerHTML = content;
    readingTextContainer.appendChild(readingDiv);

    void readingTextContainer.offsetHeight;
    readingTextContainer.classList.add("visible");
}

function clearUI() {
    const userPromptWrapper = document.getElementById("user-prompt-wrapper");
    const readingTextContainer = document.getElementById("reading-text-container");
    if (userPromptWrapper) userPromptWrapper.innerHTML = "";
    if (readingTextContainer) readingTextContainer.innerHTML = "";
}

// --- Scale Cards Dynamically ---
function scaleCards() {
    const cardImagesContainer = document.getElementById("card-images-container");
    if (!cardImagesContainer) return;

    const cardImages = cardImagesContainer.getElementsByClassName("card-image");
    if (cardImages.length > 0) {
        const containerWidth = cardImagesContainer.offsetWidth;
        const numCards = cardImages.length;
        let maxCardWidth;

        if (window.innerWidth <= 900) {
            maxCardWidth = 200;
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

// --- Fetch Logic ---
function formatSelectedCards(cards) {
    return cards.map((card) => {
        if (card.type === "random") return "random";
        if (card.type === "major") return card.name;
        if (card.type === "minor") return `${card.number} of ${card.suit}`;
        if (card.type === "court") return `${card.character} of ${card.suit}`;
        return "random";
    });
}

function sendQuery(queryString, intention) {
  const cardSelectorContainer = document.getElementById("card-selector-container");
  const bottomToolbar = document.getElementById("bottom-toolbar");
  const readingPanel = document.getElementById("reading-panel");
  const cardImagesContainer = document.getElementById("card-images-container");
  const shuffleButton = document.getElementById("shuffle-button");
  const appContainer = document.getElementById("app-container");

  console.log('sendQuery called with intention:', intention);
  console.log('isCustomReadingPage:', isCustomReadingPage);
  console.log('selectedCards before sending:', selectedCards);

  clearUI();
  if (bottomToolbar) bottomToolbar.classList.add("hidden");
  if (isCustomReadingPage && cardSelectorContainer) {
      cardSelectorContainer.style.display = "none";
  }

  const userPromptObj = addUserPrompt(intention);
  if (readingPanel) showReadingPanel();

  if (cardImagesContainer) clearCardImages();
  if (shuffleButton) {
      shuffleButton.style.display = "none";
      shuffleButton.disabled = true;
  }

  const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), 130000);
  });

  const spreadType = currentSpreadType.toLowerCase();
  const cardCount = spreadType === "single" ? 1 : spreadType === "three" ? 3 : 5;
  const finalQuery = `${cardCount} card spread about ${intention}`;

  // Sort selectedCards by position order
  let cardsToSend = [];
  if (isCustomReadingPage) {
      const positionOrder = spreadPositions[spreadType] || ["MAIN ACTOR"];
      const sortedCards = [...selectedCards].sort((a, b) => {
          return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
      });
      cardsToSend = formatSelectedCards(sortedCards);
  } else {
      cardsToSend = [];
  }

  console.log('cardsToSend:', cardsToSend);

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
      if (userPromptObj.spinnerSpan) userPromptObj.spinnerSpan.remove();

      if (data.cards && data.cards.length > 0) {
          addCardImages(data.cards, spreadType);
          scaleCards();
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

      if (shuffleButton) {
          shuffleButton.disabled = false;
          shuffleButton.style.display = "block";
      }
  })
  .catch((error) => {
      clearInterval(userPromptObj.spinnerId);
      if (userPromptObj.spinnerSpan) userPromptObj.spinnerSpan.remove();

      let errorMsg = "<p class='assistant-message'>An error occurred while fetching the tarot reading. Give it one more try.</p>";
      if (error.message === "Request timed out") {
          errorMsg = "<p class='assistant-message'>Request timed out. Please try again.</p>";
      } else {
          errorMsg = `<p class='assistant-message'>${error.message}</p>`;
      }

      addReadingText(errorMsg);

      if (shuffleButton) {
          shuffleButton.disabled = false;
          shuffleButton.style.display = "block";
      }
  })
  .finally(() => {
      if (appContainer) appContainer.classList.remove("panel-open");
  });
}

// --- Card Display ---
function clearCardImages() {
    const cardImagesContainer = document.getElementById("card-images-container");
    const codexBrand = document.getElementById("codex-brand");
    const cardSelectorContainer = document.getElementById("card-selector-container");

    if (cardImagesContainer) {
        cardImagesContainer.innerHTML = "";
        cardImagesContainer.classList.remove("plus-layout", "three-card-layout");
    }
    if (codexBrand && cardSelectorContainer && !cardSelectorContainer.classList.contains("active")) {
        codexBrand.style.display = "block";
    }
}

function addCardImages(cards, layout) {
    const cardImagesContainer = document.getElementById("card-images-container");
    const codexBrand = document.getElementById("codex-brand");
    if (!cardImagesContainer) return;

    clearCardImages();
    if (codexBrand) codexBrand.style.display = "none";

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

// --- UI Handlers ---
function showInlineContext(spreadType) {
    const intentionInput = document.getElementById("intention-input");
    const inlineContextContainer = document.getElementById("inline-context-container");
    const bottomToolbar = document.getElementById("bottom-toolbar");

    currentSpreadType = spreadType;
    if (isCustomReadingPage) {
        if (bottomToolbar) bottomToolbar.classList.add("hidden");
        setTimeout(() => {
            showCardSelectors(spreadType);
        }, 1000);
    } else {
        if (intentionInput) {
            intentionInput.value = "";
            enableInput();
            intentionInput.focus();
        }
        if (inlineContextContainer) inlineContextContainer.classList.add("show");
    }
}

function showCardSelectors(spreadType) {
    const cardSelectors = document.getElementById("card-selectors");
    const cardSelectorContainer = document.getElementById("card-selector-container");
    const codexBrand = document.getElementById("codex-brand");
    const inlineContextContainer = document.getElementById("inline-context-container");

    if (!cardSelectors || !cardSelectorContainer) return;

    cardSelectors.innerHTML = "";
    selectedCards = [];

    if (codexBrand) codexBrand.style.display = "none";
    if (inlineContextContainer) inlineContextContainer.classList.remove("show");

    const positions = spreadPositions[spreadType.toLowerCase()] || ["MAIN ACTOR"];
    positions.forEach((position) => {
        const selectorHtml = cardSelectorTemplate(position);
        cardSelectors.insertAdjacentHTML("beforeend", selectorHtml);
    });

    cardSelectorContainer.style.display = "flex";
    cardSelectorContainer.classList.add("active");

    bindEventListeners(); // Rebind listeners to ensure new selectors have events
}

function handleInputChange() {
    handleSendButtonState();
}

function capitalizeFirstLetter() {
    const intentionInput = document.getElementById("intention-input");
    if (intentionInput) {
        const input = intentionInput.value;
        if (input.length > 0) {
            intentionInput.value = input.charAt(0).toUpperCase() + input.slice(1);
        }
    }
}

// --- Debounced handleContextSubmission ---
const debouncedHandleContextSubmission = debounce(() => {
    const intentionInput = document.getElementById("intention-input");
    const infoToggle = document.getElementById("info-toggle");
    if (!intentionInput) return;

    const intentionText = intentionInput.value.trim();
    if (!intentionText) return;

    fadeOutEffects();
    if (infoToggle) infoToggle.classList.add("hidden");

    sendQuery(`${currentSpreadType.toLowerCase()} card spread about ${intentionText}`, intentionText);
    showReadingPanel();
    resizeCanvas();
    updateVantaDimensions();
}, 1000);

function handleContextSubmission() {
    debouncedHandleContextSubmission();
}

function updateVantaDimensions() {
    if (vantaEffect) {
        vantaEffect.resize();
    }
}

function showReadingPanel() {
    const readingPanel = document.getElementById("reading-panel");
    const cardArea = document.getElementById("card-area");
    const bottomToolbar = document.getElementById("bottom-toolbar");
    const shuffleButton = document.getElementById("shuffle-button");

    if (readingPanel) readingPanel.classList.add("active");
    if (cardArea) cardArea.classList.add("panel-open");
    if (bottomToolbar) bottomToolbar.classList.add("hidden");
    if (shuffleButton) {
        shuffleButton.style.display = "none";
        shuffleButton.disabled = true;
    }
}

function hideReadingPanel() {
    const readingPanel = document.getElementById("reading-panel");
    const cardArea = document.getElementById("card-area");
    const appContainer = document.getElementById("app-container");
    const bottomToolbar = document.getElementById("bottom-toolbar");
    const shuffleButton = document.getElementById("shuffle-button");

    if (readingPanel) readingPanel.classList.remove("active");
    if (cardArea) cardArea.classList.remove("panel-open");
    if (appContainer) appContainer.classList.remove("panel-open");
    if (bottomToolbar) bottomToolbar.style.display = "flex";
    if (shuffleButton) {
        shuffleButton.style.display = "none";
        shuffleButton.disabled = true;
    }
    resizeCanvas();
    updateVantaDimensions();
}

function resetToDefault() {
    const intentionInput = document.getElementById("intention-input");
    const btnRandomCard = document.getElementById("btn-random-card");
    const btnThreeCard = document.getElementById("btn-three-card");
    const btnFiveCard = document.getElementById("btn-five-card");
    const cardSelectorContainer = document.getElementById("card-selector-container");
    const cardSelectors = document.getElementById("card-selectors");
    const codexBrand = document.getElementById("codex-brand");
    const inlineContextContainer = document.getElementById("inline-context-container");
    const bottomToolbar = document.getElementById("bottom-toolbar");
    const infoToggle = document.getElementById("info-toggle");

    clearUI();
    clearCardImages();
    hideReadingPanel();

    if (intentionInput) {
        disableInput();
        intentionInput.value = "";
    }
    currentSpreadType = "";
    if (btnRandomCard && btnThreeCard && btnFiveCard) {
        [btnRandomCard, btnThreeCard, btnFiveCard].forEach((b) => b.classList.remove("active-button"));
    }

    if (isCustomReadingPage) {
        if (cardSelectorContainer) {
            cardSelectorContainer.style.display = "none";
            cardSelectorContainer.classList.remove("active");
        }
        if (cardSelectors) {
            cardSelectors.innerHTML = "";
        }
        selectedCards = [];
        if (codexBrand) codexBrand.style.display = "block";
        if (inlineContextContainer) inlineContextContainer.classList.remove("show");
    }

    if (bottomToolbar) {
        bottomToolbar.classList.remove("hidden");
        bottomToolbar.style.display = "flex";
    }
    if (infoToggle) infoToggle.classList.remove("hidden");
}

function fadeOutCards() {
    const cardImagesContainer = document.getElementById("card-images-container");
    const readingPanel = document.getElementById("reading-panel");

    const cards = cardImagesContainer ? cardImagesContainer.querySelectorAll('.card-image') : [];
    cards.forEach(card => {
        card.classList.remove("show");
        card.classList.add("fade-out");
    });

    setTimeout(() => {
        if (readingPanel) readingPanel.classList.remove("active");
        setTimeout(() => {
            resetToDefault();
        }, 600);
    }, 400);
}

// --- Initialization ---
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

    const inlineContextContainer = document.getElementById("inline-context-container");
    if (inlineContextContainer) {
        inlineContextContainer.classList.remove("show");
        inlineContextContainer.style.display = "";
    }

    hideReadingPanel();
    updateButtonText();
    disableInput();
    bindEventListeners();

    window.addEventListener("load", () => {
        stopSpinner();
        const loader = document.getElementById("global-loader");
        if (loader) loader.classList.add("hidden");
    });

    window.addEventListener("resize", () => {
        resizeCanvas();
        updateVantaDimensions();
    });
    window.addEventListener("scroll", updateVantaDimensions);
});

window.addEventListener("resize", debouncedUpdateButtonText);
window.addEventListener("resize", resizeCanvas);

// --- Utility Functions ---
function setActiveButton(clickedBtn) {
    const btnRandomCard = document.getElementById("btn-random-card");
    const btnThreeCard = document.getElementById("btn-three-card");
    const btnFiveCard = document.getElementById("btn-five-card");

    if (btnRandomCard && btnThreeCard && btnFiveCard) {
        [btnRandomCard, btnThreeCard, btnFiveCard].forEach((b) => b.classList.remove("active-button"));
        clickedBtn.classList.add("active-button");
    }
}
