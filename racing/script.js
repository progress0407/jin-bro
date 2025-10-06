// Game state
let gameState = 'ready'; // ready, playing, result
let stepCount = 0;
let timeLeft = 10;
let shakeIntensity = 0;
let timerInterval = null;

// Shake detection variables
let lastX = 0;
let lastY = 0;
let lastZ = 0;
let lastTime = 0;
const SHAKE_THRESHOLD = 15; // Threshold for shake detection
const SHAKE_COOLDOWN = 100; // Cooldown between shake counts (ms)
let lastShakeTime = 0;

function showScreen(screen) {
    document.getElementById('readyScreen').classList.remove('active');
    document.getElementById('playingScreen').classList.remove('active');
    document.getElementById('resultScreen').classList.remove('active');
    document.getElementById(screen + 'Screen').classList.add('active');
}

async function startGame() {
    // Request device motion permission for iOS 13+
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission !== 'granted') {
                alert('기기 모션 권한이 필요합니다!');
                return;
            }
        } catch (error) {
            console.error('Permission error:', error);
            alert('기기 모션 권한을 얻을 수 없습니다.');
            return;
        }
    }

    gameState = 'playing';
    stepCount = 0;
    timeLeft = 10;
    shakeIntensity = 0;

    showScreen('playing');
    updateDisplay();

    // Start shake detection
    window.addEventListener('devicemotion', handleShake);

    // Start timer
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            stopGame();
        }
    }, 1000);
}

function handleShake(event) {
    if (gameState !== 'playing') return;

    const current = event.accelerationIncludingGravity;
    const currentTime = Date.now();

    if (lastTime === 0) {
        lastX = current.x;
        lastY = current.y;
        lastZ = current.z;
        lastTime = currentTime;
        return;
    }

    const deltaTime = currentTime - lastTime;

    if (deltaTime > 100) { // Check every 100ms
        const deltaX = Math.abs(current.x - lastX);
        const deltaY = Math.abs(current.y - lastY);
        const deltaZ = Math.abs(current.z - lastZ);

        const acceleration = deltaX + deltaY + deltaZ;

        // Calculate shake intensity for display (0-100)
        shakeIntensity = Math.min(Math.round((acceleration / SHAKE_THRESHOLD) * 20), 100);
        updateShakeIntensity();

        // Check if shake is strong enough and cooldown has passed
        if (acceleration > SHAKE_THRESHOLD && currentTime - lastShakeTime > SHAKE_COOLDOWN) {
            stepCount++;
            lastShakeTime = currentTime;
            updateStepCount();
            animateHorse();
        }

        lastX = current.x;
        lastY = current.y;
        lastZ = current.z;
        lastTime = currentTime;
    }
}

function animateHorse() {
    const horse = document.getElementById('runningHorse');

    // Add running animation
    horse.classList.add('running');

    // Update speed class based on shake intensity
    horse.className = 'horse-running running';
    if (shakeIntensity > 80) {
        horse.classList.add('speed-5');
    } else if (shakeIntensity > 60) {
        horse.classList.add('speed-4');
    } else if (shakeIntensity > 40) {
        horse.classList.add('speed-3');
    } else if (shakeIntensity > 20) {
        horse.classList.add('speed-2');
    } else {
        horse.classList.add('speed-1');
    }

    // Remove running class after animation
    setTimeout(() => {
        if (gameState === 'playing') {
            const currentIntensity = shakeIntensity;
            if (currentIntensity < 10) {
                horse.classList.remove('running');
            }
        }
    }, 500);
}

function stopGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Remove shake listener
    window.removeEventListener('devicemotion', handleShake);

    gameState = 'result';
    showResultScreen();
}

function resetGame() {
    gameState = 'ready';
    stepCount = 0;
    timeLeft = 10;
    shakeIntensity = 0;
    lastTime = 0;
    lastShakeTime = 0;
    showScreen('ready');
}

function updateTimer() {
    document.getElementById('timerDisplay').textContent = timeLeft;
}

function updateStepCount() {
    document.getElementById('stepCount').textContent = stepCount;
}

function updateShakeIntensity() {
    document.getElementById('shakeIntensity').textContent = shakeIntensity;
}

function updateDisplay() {
    updateTimer();
    updateStepCount();
    updateShakeIntensity();
}

function getRankLabel(steps) {
    if (steps >= 100) return '전설의 기수';
    if (steps >= 80) return '최고의 기수';
    if (steps >= 60) return '우수한 기수';
    if (steps >= 40) return '숙련된 기수';
    if (steps >= 20) return '초보 기수';
    return '연습이 필요해요';
}

function showResultScreen() {
    showScreen('result');

    document.getElementById('finalSteps').textContent = stepCount;
    document.getElementById('rankLabel').textContent = getRankLabel(stepCount);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    window.removeEventListener('devicemotion', handleShake);
});
