// study.js - Handles Study the Tarot section functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the study section
    initStudySection();
});

function initStudySection() {
    // Setup navigation between study sections
    setupStudyNavigation();
    
    // Initialize each section
    initVisualGuide();
    initLessonsSection();
    initQuizSection();
    initEncyclopediaSection();
    
    // Update navigation handlers
    updateNavigationHandlers();
}

function setupStudyNavigation() {
    const navButtons = document.querySelectorAll('.study-nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.dataset.section;
            navigateToSection(section);
        });
    });
}

function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.study-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show the selected section
    const targetSection = document.getElementById(`study-section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation button states
    document.querySelectorAll('.study-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.study-nav-btn[data-section="${sectionId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Visual Guide Section
function initVisualGuide() {
    // Setup card filters
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active filter button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Apply filter (to be implemented with actual card data)
            const filter = this.dataset.filter;
            console.log(`Filter selected: ${filter}`);
        });
    });
    
    // Setup search functionality
    const searchInput = document.getElementById('card-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            console.log(`Search term: ${searchTerm}`);
        });
    }
    
    // Setup symbol type filter
    const symbolFilter = document.getElementById('symbol-type-filter');
    if (symbolFilter) {
        symbolFilter.addEventListener('change', function() {
            const symbolType = this.value;
            console.log(`Symbol type selected: ${symbolType}`);
        });
    }
    
    // Load sample cards (to be replaced with actual data loading)
    loadSampleCards();
}

function loadSampleCards() {
    const cardsGrid = document.querySelector('.cards-grid');
    if (!cardsGrid) return;
    
    // Clear loading placeholder
    cardsGrid.innerHTML = '';
    
    // Add sample cards (to be replaced with dynamic loading)
    const sampleCards = [
        { name: 'The Fool', image: '/static/cards/the_fool.png' },
        { name: 'The Magician', image: '/static/cards/the_magician.png' },
        { name: 'The High Priestess', image: '/static/cards/the_high_priestess.png' },
        { name: 'The Empress', image: '/static/cards/the_empress.png' },
        { name: 'The Emperor', image: '/static/cards/the_emperor.png' },
        { name: 'The Pope', image: '/static/cards/the_pope.png' }
    ];
    
    sampleCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        cardElement.innerHTML = `
            <img src="${card.image}" alt="${card.name}">
            <div class="card-name">${card.name}</div>
        `;
        
        // Add click handler to view card details
        cardElement.addEventListener('click', () => {
            console.log(`Card clicked: ${card.name}`);
        });
        
        cardsGrid.appendChild(cardElement);
    });
}

// Lessons Section
function initLessonsSection() {
    const moduleButtons = document.querySelectorAll('.start-module-btn');
    
    moduleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const moduleId = this.closest('.module-card').dataset.module;
            console.log(`Module selected: ${moduleId}`);
        });
    });
}

// Quiz Section
function initQuizSection() {
    const difficultyButtons = document.querySelectorAll('.quiz-difficulty-btn');
    const startQuizButton = document.getElementById('start-quiz-btn');
    const quizDescriptionText = document.getElementById('quiz-description-text');
    
    let selectedDifficulty = null;
    
    difficultyButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Store selected difficulty
            selectedDifficulty = this.dataset.difficulty;
            
            // Enable start button
            if (startQuizButton) {
                startQuizButton.disabled = false;
            }
            
            // Update description based on difficulty
            if (quizDescriptionText) {
                switch(selectedDifficulty) {
                    case 'beginner':
                        quizDescriptionText.textContent = 'The beginner quiz focuses on basic card identification and meanings.';
                        break;
                    case 'intermediate':
                        quizDescriptionText.textContent = 'The intermediate quiz tests your knowledge of symbols and card relationships.';
                        break;
                    case 'advanced':
                        quizDescriptionText.textContent = 'The advanced quiz challenges you with historical context and subtle interpretations.';
                        break;
                }
            }
        });
    });
    
    if (startQuizButton) {
        startQuizButton.addEventListener('click', function() {
            if (!selectedDifficulty) return;
            
            console.log(`Starting ${selectedDifficulty} quiz`);
        });
    }
}

// Encyclopedia Section
function initEncyclopediaSection() {
    const encyclopediaTabs = document.querySelectorAll('.encyclopedia-tab');
    
    encyclopediaTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Update active tab
            encyclopediaTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabContent = document.getElementById(`encyclopedia-tab-${tabId}`);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            console.log(`Encyclopedia tab selected: ${tabId}`);
        });
    });
    
    // Load initial cards for encyclopedia
    loadEncyclopediaCards();
}

function loadEncyclopediaCards() {
    const cardsGrid = document.querySelector('.encyclopedia-cards-grid');
    if (!cardsGrid) return;
    
    // Clear loading placeholder
    cardsGrid.innerHTML = '';
    
    // Add sample cards (to be replaced with dynamic loading)
    const sampleCards = [
        { name: 'The Fool', image: '/static/cards/the_fool.png' },
        { name: 'The Magician', image: '/static/cards/the_magician.png' },
        { name: 'The High Priestess', image: '/static/cards/the_high_priestess.png' },
        { name: 'The Empress', image: '/static/cards/the_empress.png' },
        { name: 'The Emperor', image: '/static/cards/the_emperor.png' },
        { name: 'The Pope', image: '/static/cards/the_pope.png' }
    ];
    
    sampleCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        cardElement.innerHTML = `
            <img src="${card.image}" alt="${card.name}">
            <div class="card-name">${card.name}</div>
        `;
        
        cardsGrid.appendChild(cardElement);
    });
}

// Update navigation handlers for main.js interaction
function updateNavigationHandlers() {
    // Find the Study button in the navigation
    const studyButton = document.getElementById('nav-study-tarot-btn');
    if (studyButton) {
        studyButton.addEventListener('click', function() {
            // Navigate to study page if not already there
            if (window.location.pathname !== '/study') {
                window.location.href = '/study';
            }
        });
    }
}