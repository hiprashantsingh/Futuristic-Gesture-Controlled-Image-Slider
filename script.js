// script.js Futuristic Gesture-Controlled Image Slider
document.addEventListener('DOMContentLoaded', async function() {
    // Configuration
    const config = {
        slides: [
            {
                id: 'travel',
                title: 'Exotic Destinations',
                description: 'Explore breathtaking locations around the world with our curated travel experiences.',
                image: 'beach.jpg',
                color: '#00a8ff'
            },
            {
                id: 'cars',
                title: 'Luxury Automobiles',
                description: 'Discover the latest in automotive innovation and design from leading manufacturers.',
                image: 'https://images.unsplash.com/photo-1488134684157-fea2d81a5ec4?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                color: '#e84118'
            },
            {
                id: 'gadgets',
                title: 'Cutting-Edge Tech',
                description: 'Stay ahead with the newest gadgets and technology that will transform your daily life.',
                image: 'technology.jpg',
                color: '#9c88ff'
            },
            {
                id: 'food',
                title: 'Gourmet Experiences',
                description: 'Indulge in culinary masterpieces from world-renowned chefs and restaurants.',
                image: 'food.jpg',
                color: '#fbc531'
            },
            {
                id: 'fashion',
                title: 'Haute Couture',
                description: 'Be inspired by the latest trends from the world of high fashion and design.',
                image: 'fitness.jpg',
                color: '#e84393'
            }
        ],
        slideInterval: 90000, // Auto-slide interval in ms
        gestureSensitivity: {
            swipe: 30, // Pixels of movement to detect swipe
            pinch: 0.2, // Ratio of distance change to detect pinch
            palmDuration: 1000 // ms of open palm to detect
        },
        debugMode: false // Set to true to log gesture data
    };

    // DOM Elements
    const slider = document.getElementById('gestureSlider');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const indicatorsContainer = document.querySelector('.slide-indicators');
    const permissionPrompt = document.getElementById('permissionPrompt');
    const enableCameraBtn = document.getElementById('enableCamera');
    const useTouchBtn = document.getElementById('useTouch');
    const gestureFeedback = document.getElementById('gestureFeedback');
    const handIndicator = document.querySelector('.hand-indicator');
    const gestureHint = document.querySelector('.gesture-hint');
    const gestureHelp = document.getElementById('gestureHelp');
    const closeHelpBtn = document.querySelector('.close-help');
    const cameraFeed = document.getElementById('cameraFeed');
    const gestureCanvas = document.getElementById('gestureCanvas');
    const gestureCtx = gestureCanvas.getContext('2d');

    // State variables
    let currentSlideIndex = 0;
    let slideTimer;
    let isPaused = false;
    let gestureControlEnabled = false;
    let hands;
    let lastHandPosition = null;
    let lastPinchDistance = null;
    let palmOpenTime = 0;
    let palmDetected = false;
    let zoomLevel = 1;

    // Initialize the slider
    function initSlider() {
        // Create slides
        config.slides.forEach((slide, index) => {
            // Create slide element
            const slideElement = document.createElement('div');
            slideElement.className = 'slide';
            slideElement.id = `slide-${slide.id}`;
            slideElement.style.backgroundImage = `url(${slide.image})`;
            slideElement.style.setProperty('--theme-color', slide.color);

            // Add slide content
            slideElement.innerHTML = `
                <div class="slide-content">
                    <h2>${slide.title}</h2>
                    <p>${slide.description}</p>
                </div>
            `;

            slider.appendChild(slideElement);

            // Create indicator
            const indicator = document.createElement('div');
            indicator.className = 'indicator';
            indicator.dataset.slideIndex = index;
            indicator.addEventListener('click', () => goToSlide(index));
            indicatorsContainer.appendChild(indicator);
        });

        // Show first slide
        showSlide(0);

        // Set up event listeners
        setupEventListeners();

        // Show permission prompt
        showPermissionPrompt();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Navigation buttons
        prevBtn.addEventListener('click', () => navigate(-1));
        nextBtn.addEventListener('click', () => navigate(1));

        // Permission buttons
        enableCameraBtn.addEventListener('click', async () => {
            permissionPrompt.style.display = 'none';
            await setupGestureControl();
        });

        useTouchBtn.addEventListener('click', () => {
            permissionPrompt.style.display = 'none';
            startSlider();
        });

        // Close help button
        closeHelpBtn.addEventListener('click', () => {
            gestureHelp.classList.remove('visible');
        });

        // Show help when clicking hand indicator
        handIndicator.addEventListener('click', () => {
            gestureHelp.classList.add('visible');
        });

        // Touch events for mobile fallback
        let touchStartX = 0;
        let touchEndX = 0;

        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        slider.addEventListener('touchend', (e) => {
            if (!gestureControlEnabled) {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipeGesture(touchStartX - touchEndX);
            }
        }, {passive: true});
    }

    // Show a slide by index
    function showSlide(index) {
        // Validate index
        if (index < 0) index = config.slides.length - 1;
        if (index >= config.slides.length) index = 0;

        // Update current slide
        const slides = document.querySelectorAll('.slide');
        const indicators = document.querySelectorAll('.indicator');

        // Hide all slides
        slides.forEach(slide => slide.classList.remove('active', 'prev', 'next'));

        // Show current slide
        slides[index].classList.add('active');

        // Set adjacent slides for animation
        const prevIndex = index - 1 >= 0 ? index - 1 : config.slides.length - 1;
        const nextIndex = index + 1 < config.slides.length ? index + 1 : 0;
        
        slides[prevIndex].classList.add('prev');
        slides[nextIndex].classList.add('next');

        // Update indicators
        indicators.forEach(indicator => indicator.classList.remove('active'));
        indicators[index].classList.add('active');

        currentSlideIndex = index;
    }

    // Navigate between slides
    function navigate(direction) {
        clearTimeout(slideTimer);
        showSlide(currentSlideIndex + direction);
        if (!isPaused) {
            startTimer();
        }
    }

    // Go to specific slide
    function goToSlide(index) {
        clearTimeout(slideTimer);
        showSlide(index);
        if (!isPaused) {
            startTimer();
        }
    }

    // Start the slider timer
    function startTimer() {
        clearTimeout(slideTimer);
        slideTimer = setTimeout(() => {
            navigate(1);
        }, config.slideInterval);
    }

    // Start the slider
    function startSlider() {
        isPaused = false;
        startTimer();
    }

    // Pause the slider
    function pauseSlider() {
        isPaused = true;
        clearTimeout(slideTimer);
        showFeedback('⏸️ Slider Paused', config.slides[currentSlideIndex].color);
    }

    // Resume the slider
    function resumeSlider() {
        isPaused = false;
        startTimer();
        showFeedback('▶️ Slider Resumed', config.slides[currentSlideIndex].color);
    }

    // Toggle zoom on current slide
    function toggleZoom() {
        const activeSlide = document.querySelector('.slide.active');
        if (zoomLevel === 1) {
            zoomLevel = 1.5;
            activeSlide.classList.add('zoomed');
            showFeedback('🔍 Zoomed In', config.slides[currentSlideIndex].color);
        } else {
            zoomLevel = 1;
            activeSlide.classList.remove('zoomed');
            showFeedback('🔍 Zoomed Out', config.slides[currentSlideIndex].color);
        }
    }

    // Show permission prompt
    function showPermissionPrompt() {
        permissionPrompt.style.display = 'flex';
    }

    // Set up gesture control
    async function setupGestureControl() {
        try {
            // Initialize MediaPipe Hands
            hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            hands.onResults(onHandResults);

            // Start camera
            const camera = new Camera(cameraFeed, {
                onFrame: async () => {
                    await hands.send({image: cameraFeed});
                },
                width: 160,
                height: 120
            });

            await camera.start();
            gestureControlEnabled = true;
            gestureFeedback.classList.add('visible');
            showFeedback('✋ Hand Detection Active', '#00a8ff');
            startSlider();

            // Show help after a delay
            setTimeout(() => {
                gestureHelp.classList.add('visible');
            }, 3000);
        } catch (error) {
            console.error('Gesture control setup failed:', error);
            gestureControlEnabled = false;
            showFeedback('⚠️ Gesture Control Failed', '#e84118');
            startSlider();
        }
    }

    // Process hand results
    function onHandResults(results) {
        // Clear canvas
        gestureCtx.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);

        // Draw hand landmarks if detected
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Draw landmarks
            gestureCtx.save();
            gestureCtx.lineWidth = 2;
            gestureCtx.strokeStyle = '#00a8ff';
            
            for (const landmarks of results.multiHandLandmarks) {
                // Draw connections
                for (const connection of HAND_CONNECTIONS) {
                    const [startIdx, endIdx] = connection;
                    const start = landmarks[startIdx];
                    const end = landmarks[endIdx];
                    
                    gestureCtx.beginPath();
                    gestureCtx.moveTo(start.x * gestureCanvas.width, start.y * gestureCanvas.height);
                    gestureCtx.lineTo(end.x * gestureCanvas.width, end.y * gestureCanvas.height);
                    gestureCtx.stroke();
                }
                
                // Detect gestures
                detectGestures(landmarks);
            }
            
            gestureCtx.restore();
        } else {
            // No hands detected
            lastHandPosition = null;
            lastPinchDistance = null;
            palmOpenTime = 0;
        }
    }

    // Detect specific gestures from hand landmarks
    function detectGestures(landmarks) {
        // Get palm base (wrist) and tip of middle finger
        const wrist = landmarks[0];
        const middleTip = landmarks[12];
        
        // Calculate current hand position
        const currentPosition = {
            x: wrist.x * gestureCanvas.width,
            y: wrist.y * gestureCanvas.height
        };
        
        // Detect swipe gestures
        if (lastHandPosition) {
            const deltaX = currentPosition.x - lastHandPosition.x;
            const deltaY = currentPosition.y - lastHandPosition.y;
            
            // Horizontal swipe takes precedence over vertical
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > config.gestureSensitivity.swipe) {
                    handleSwipeGesture(deltaX);
                    lastHandPosition = null; // Prevent multiple detections
                    return;
                }
            }
        }
        
        // Detect pinch gesture (distance between thumb and index finger)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const currentPinchDistance = Math.hypot(
            thumbTip.x - indexTip.x,
            thumbTip.y - indexTip.y
        );
        
        if (lastPinchDistance !== null) {
            const pinchDelta = (currentPinchDistance - lastPinchDistance) / lastPinchDistance;
            
            if (Math.abs(pinchDelta) > config.gestureSensitivity.pinch) {
                if (pinchDelta < 0) {
                    // Pinch in
                    showFeedback('🤏 Pinch Detected', config.slides[currentSlideIndex].color);
                    setTimeout(toggleZoom, 300); // Small delay for better UX
                }
                lastPinchDistance = null; // Prevent multiple detections
                return;
            }
        }
        
        // Detect open palm (all fingers extended)
        const fingerTips = [4, 8, 12, 16, 20]; // Thumb to pinky
        const fingerBases = [2, 6, 10, 14, 18];
        let extendedFingers = 0;
        
        for (let i = 0; i < fingerTips.length; i++) {
            const tip = landmarks[fingerTips[i]];
            const base = landmarks[fingerBases[i]];
            
            // For thumb, we check different axis
            if (i === 0) { // Thumb
                if (tip.x < base.x) extendedFingers++;
            } else { // Other fingers
                if (tip.y < base.y) extendedFingers++;
            }
        }
        
        if (extendedFingers >= 4) { // Most fingers extended
            if (!palmDetected) {
                palmOpenTime += 100; // Approximate time between frames
                
                if (palmOpenTime >= config.gestureSensitivity.palmDuration) {
                    palmDetected = true;
                    if (isPaused) {
                        resumeSlider();
                    } else {
                        pauseSlider();
                    }
                }
            }
        } else {
            palmDetected = false;
            palmOpenTime = 0;
        }
        
        // Update last positions for next detection
        lastHandPosition = currentPosition;
        lastPinchDistance = currentPinchDistance;
    }

    // Handle swipe gesture
    function handleSwipeGesture(deltaX) {
        if (deltaX > 0) {
            // Swipe left
            navigate(-1);
            showFeedback('👈 Swipe Left', config.slides[currentSlideIndex].color);
        } else {
            // Swipe right
            navigate(1);
            showFeedback('👉 Swipe Right', config.slides[currentSlideIndex].color);
        }
    }

    // Show feedback to user
    function showFeedback(message, color) {
        gestureHint.textContent = message;
        gestureHint.style.color = color;
        gestureHint.classList.add('visible');
        
        // Pulse the hand indicator
        handIndicator.style.boxShadow = `0 0 20px ${color}`;
        
        // Hide after delay
        setTimeout(() => {
            gestureHint.classList.remove('visible');
            handIndicator.style.boxShadow = 'none';
        }, 2000);
    }

    // Initialize the slider
    initSlider();

    // Define hand connections (from MediaPipe documentation)
    const HAND_CONNECTIONS = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17] // Across palm
    ];
});
