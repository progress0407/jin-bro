// Game state
let gameState = 'ready'; // ready, playing, result
let currentSize = 50;
let maxSize = 50;
let timeLeft = 10;
let volume = 0;

// Audio context references
let audioContext = null;
let analyser = null;
let microphone = null;
let animationFrame = null;
let timerInterval = null;

function showScreen(screen) {
    document.getElementById('readyScreen').classList.remove('active');
    document.getElementById('playingScreen').classList.remove('active');
    document.getElementById('resultScreen').classList.remove('active');
    document.getElementById(screen + 'Screen').classList.add('active');
}

async function startGame() {
    try {
        // Clean up existing context
        if (audioContext) {
            await audioContext.close();
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.3;
        microphone.connect(analyser);

        gameState = 'playing';
        timeLeft = 10;
        currentSize = 50;
        maxSize = 50;

        showScreen('playing');
        updateTimer();

        // Start timer
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            if (timeLeft <= 0) {
                stopGame();
            }
        }, 1000);

        // Start volume detection with slight delay
        setTimeout(() => {
            detectVolume();
        }, 100);
    } catch (error) {
        console.error('Microphone error:', error);
        alert('마이크 권한이 필요합니다! 브라우저 설정에서 마이크 권한을 허용해주세요.');
    }
}

function detectVolume() {
    if (!analyser || gameState !== 'playing') return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function checkVolume() {
        if (gameState !== 'playing') return;

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedVolume = Math.min(average / 100, 1);

        volume = normalizedVolume;
        updateVolume();

        // Size: 50px ~ 400px
        const size = 50 + (normalizedVolume * 350);
        currentSize = size;
        maxSize = Math.max(maxSize, size);
        updateOrangeSize();

        animationFrame = requestAnimationFrame(checkVolume);
    }

    checkVolume();
}

function stopGame() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (microphone) {
        const stream = microphone.mediaStream;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        microphone.disconnect();
        microphone = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    gameState = 'result';
    showResultScreen();
}

function resetGame() {
    gameState = 'ready';
    currentSize = 50;
    maxSize = 50;
    timeLeft = 10;
    volume = 0;
    showScreen('ready');
}

function updateTimer() {
    document.getElementById('timerDisplay').textContent = timeLeft;
}

function updateVolume() {
    const percent = Math.round(volume * 100);
    document.getElementById('volumePercent').textContent = percent + '%';
    document.getElementById('volumeBar').style.width = percent + '%';
}

function updateOrangeSize() {
    const orangeEl = document.getElementById('playingOrange');
    orangeEl.style.width = currentSize + 'px';
    orangeEl.style.height = currentSize + 'px';
}

function getSizeLabel(size) {
    const percentage = ((size - 50) / 350 * 100);
    if (percentage < 20) return '조용한 오렌지';
    if (percentage < 40) return '작은 오렌지';
    if (percentage < 60) return '보통 오렌지';
    if (percentage < 80) return '큰 오렌지';
    if (percentage < 95) return '거대한 오렌지';
    return '메가 오렌지';
}

function showResultScreen() {
    showScreen('result');

    const score = Math.round((maxSize - 50) / 350 * 100);
    const displaySize = Math.min(maxSize, 300);

    document.getElementById('finalScore').textContent = score;
    document.getElementById('sizeLabel').textContent = getSizeLabel(maxSize);

    const resultOrange = document.getElementById('resultOrange');
    resultOrange.style.width = displaySize + 'px';
    resultOrange.style.height = displaySize + 'px';
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    if (microphone) {
        const stream = microphone.mediaStream;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
    }
});
