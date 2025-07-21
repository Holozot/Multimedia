const previewVideo = document.getElementById('previewVideo');
const playbackVideo = document.getElementById('playbackVideo');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const downloadButton = document.getElementById('downloadButton');
const toggleTimestampButton = document.getElementById('toggleTimestampButton');
const toggleMusicButton = document.getElementById('toggleMusicButton');
const recordingIndicator = document.getElementById('recordingIndicator');
const messageBox = document.getElementById('messageBox');
const timestampCanvas = document.getElementById('timestampCanvas');
const audioContext = timestampCanvas.getContext('2d');
const backgroundMusic = document.getElementById('backgroundMusic');

// Custom playback controls
const customControlsOverlay = document.querySelector('.custom-controls-overlay');
const playPauseButton = document.getElementById('playPauseButton');
const rewindButton = document.getElementById('rewindButton');
const forwardButton = document.getElementById('forwardButton');
const progressBar = document.getElementById('progressBar');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan = document.getElementById('duration');
const volumeButton = document.getElementById('volumeButton');
const volumeSlider = document.getElementById('volumeSlider');
const volumeHighIcon = document.getElementById('volumeHighIcon');
const volumeMuteIcon = document.getElementById('volumeMuteIcon');
const fullscreenButton = document.getElementById('fullscreenButton');

// New elements for music upload
const uploadMusicButton = document.getElementById('uploadMusicButton');
const musicFileInput = document.getElementById('musicFileInput');

let stream; // Stores the MediaStream from webcam/mic
let mediaRecorder; // Instance of MediaRecorder
let recordedChunks = []; // Stores Blob chunks of recorded data
let timestampInterval; // Interval for updating timestamp
let isTimestampVisible = false;
let lastVolume = 1; // To store volume before muting
let currentMusicUrl = null; // To store the URL of the uploaded music

// Function to display messages to the user
function showMessage(message, type = 'warning') {
    console.log(`[showMessage] Displaying message: ${message} (Type: ${type})`); // Console log for debugging
    messageBox.textContent = message;
    messageBox.className = `message-box active bg-${type === 'error' ? 'red' : type === 'success' ? 'green' : 'yellow'}-100 text-${type === 'error' ? 'red' : type === 'success' ? 'green' : 'yellow'}-800 border-${type === 'error' ? 'red' : type === 'success' ? 'green' : 'yellow'}-200`;
    setTimeout(() => {
        messageBox.classList.remove('active');
    }, 5000); // Message disappears after 5 seconds
}

// Function to adjust background music volume based on video volume
function adjustBackgroundMusicVolume() {
    // Set background music volume to 50% of the video's current volume
    backgroundMusic.volume = playbackVideo.volume * 0.5;
    console.log(`[adjustBackgroundMusicVolume] Video volume: ${playbackVideo.volume}, Music volume set to: ${backgroundMusic.volume}`);
}

// Format time for display (MM:SS)
function formatTime(seconds) {
    // Ensure seconds is a valid, finite number
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
        return '00:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Request access to webcam and microphone and start recording
startButton.addEventListener('click', async () => {
    console.log('[startButton] Clicked - Starting recording process...');
    recordedChunks = []; // Clear previous recording
    playbackVideo.src = ''; // Clear playback video
    playbackVideo.load(); // Ensure video element is reset
    progressBar.value = 0; // Reset progress bar
    currentTimeSpan.textContent = '00:00';
    durationSpan.textContent = '00:00';
    // Hide custom controls overlay initially
    customControlsOverlay.classList.remove('active');

    try {
        // Request both video and audio
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        previewVideo.srcObject = stream; // Display live preview
        console.log('[startButton] Media stream obtained.');

        mediaRecorder = new MediaRecorder(stream);

        // Event listener for when data is available
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
                console.log(`[mediaRecorder.ondataavailable] Data chunk received. Size: ${event.data.size}`);
            }
        };

        // Event listener for when recording stops
        mediaRecorder.onstop = () => {
            console.log('[mediaRecorder.onstop] Recording stopped.');
            const blob = new Blob(recordedChunks, { type: 'video/webm' }); // Create a Blob from chunks
            const videoURL = URL.createObjectURL(blob); // Create a URL for the Blob
            playbackVideo.src = videoURL; // Set playback video source
            playbackVideo.load(); // Load the video
            console.log('[mediaRecorder.onstop] Playback video source set.');

            // Enable custom playback controls and download button
            playPauseButton.disabled = false;
            rewindButton.disabled = false;
            forwardButton.disabled = false;
            progressBar.disabled = false;
            volumeButton.disabled = false;
            volumeSlider.disabled = false;
            fullscreenButton.disabled = false;
            downloadButton.disabled = false;
            toggleTimestampButton.disabled = false;
            // toggleMusicButton.disabled state is handled by music upload now

            // Show custom controls overlay
            customControlsOverlay.classList.add('active');

            showMessage('Recording stopped and ready for playback!', 'success');
        };

        mediaRecorder.start(); // Start recording
        recordingIndicator.classList.add('active'); // Show recording indicator
        console.log('[startButton] MediaRecorder started.');

        // Disable start, enable stop
        startButton.disabled = true;
        stopButton.disabled = false;
        // Disable custom playback controls during recording
        playPauseButton.disabled = true;
        rewindButton.disabled = true;
        forwardButton.disabled = true;
        progressBar.disabled = true;
        volumeButton.disabled = true;
        volumeSlider.disabled = true;
        fullscreenButton.disabled = true;
        downloadButton.disabled = true;
        toggleTimestampButton.disabled = true;
        toggleMusicButton.disabled = true; // Disable until music is uploaded

        showMessage('Recording started...', 'success');

    } catch (err) {
        console.error('Error accessing media devices:', err);
        showMessage('Error: Could not access webcam or microphone. Please check permissions.', 'error');
        // Reset button states on error
        startButton.disabled = false;
        stopButton.disabled = true;
        playPauseButton.disabled = true;
        rewindButton.disabled = true;
        forwardButton.disabled = true;
        progressBar.disabled = true;
        volumeButton.disabled = true;
        volumeSlider.disabled = true;
        fullscreenButton.disabled = true;
        downloadButton.disabled = true;
        toggleTimestampButton.disabled = true;
        toggleMusicButton.disabled = true;
    }
});

// Stop recording
stopButton.addEventListener('click', () => {
    console.log('[stopButton] Clicked - Stopping recording...');
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop(); // Stop the media recorder
        console.log('[stopButton] MediaRecorder stop called.');
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop()); // Stop all tracks (video, audio)
        console.log('[stopButton] Media stream tracks stopped.');
    }
    previewVideo.srcObject = null; // Clear preview
    recordingIndicator.classList.remove('active'); // Hide recording indicator

    // Enable start, disable stop
    startButton.disabled = false;
    stopButton.disabled = true;
});

// Play/Pause logic for the bottom button
function togglePlayPause() {
    console.log('[togglePlayPause] Button clicked.');
    if (playbackVideo.paused || playbackVideo.ended) {
        playbackVideo.play();
        console.log('[togglePlayPause] Video playing.');
    } else {
        playbackVideo.pause();
        console.log('[togglePlayPause] Video paused.');
    }
}

playPauseButton.addEventListener('click', togglePlayPause);

// Update play/pause button icons based on video state
playbackVideo.addEventListener('play', () => {
    console.log('[playbackVideo] Event: play');
    playPauseButton.classList.remove('paused');
    playPauseButton.classList.add('playing');
});

playbackVideo.addEventListener('pause', () => {
    console.log('[playbackVideo] Event: pause');
    playPauseButton.classList.remove('playing');
    playPauseButton.classList.add('paused');
});

playbackVideo.addEventListener('ended', () => {
    console.log('[playbackVideo] Event: ended');
    playPauseButton.classList.remove('playing');
    playPauseButton.classList.add('paused');
    progressBar.value = 0; // Reset progress bar
    currentTimeSpan.textContent = '00:00';
});


// Rewind playback by 5 seconds
rewindButton.addEventListener('click', () => {
    playbackVideo.currentTime = Math.max(0, playbackVideo.currentTime - 5);
    showMessage('Rewound 5 seconds', 'info');
    console.log('[rewindButton] Rewound 5 seconds.');
});

// Forward playback by 5 seconds
forwardButton.addEventListener('click', () => {
    playbackVideo.currentTime = Math.min(playbackVideo.duration, playbackVideo.currentTime + 5);
    showMessage('Forwarded 5 seconds', 'info');
    console.log('[forwardButton] Forwarded 5 seconds.');
});

// Update progress bar and time display as video plays
playbackVideo.addEventListener('timeupdate', () => {
    const percentage = (playbackVideo.currentTime / playbackVideo.duration) * 100;
    progressBar.value = percentage;
    currentTimeSpan.textContent = formatTime(playbackVideo.currentTime);
});

// Set duration when video metadata is loaded
playbackVideo.addEventListener('loadedmetadata', () => {
    console.log('[playbackVideo] Event: loadedmetadata. Duration:', playbackVideo.duration);
    // Ensure duration is a finite number before formatting
    if (isFinite(playbackVideo.duration)) {
        durationSpan.textContent = formatTime(playbackVideo.duration);
    } else {
        // Fallback for invalid duration, and attempt to re-check if it becomes available
        durationSpan.textContent = '00:00';
        const checkDuration = setInterval(() => {
            if (isFinite(playbackVideo.duration) && playbackVideo.duration > 0) {
                durationSpan.textContent = formatTime(playbackVideo.duration);
                clearInterval(checkDuration);
            }
        }, 200);
    }
    progressBar.max = 100; // Ensure max is 100 for percentage
    progressBar.value = 0; // Reset to 0 when new video loads
});

// Seek video when progress bar is dragged
progressBar.addEventListener('input', () => {
    const seekTime = (progressBar.value / 100) * playbackVideo.duration;
    playbackVideo.currentTime = seekTime;
    console.log('[progressBar] Seeked to:', playbackVideo.currentTime);
});

// Volume control
volumeSlider.addEventListener('input', () => {
    playbackVideo.volume = volumeSlider.value / 100;
    lastVolume = playbackVideo.volume; // Update last volume
    console.log('[volumeSlider] Video volume set to:', playbackVideo.volume);
    adjustBackgroundMusicVolume(); // Adjust background music volume immediately
    if (playbackVideo.volume === 0) {
        volumeHighIcon.classList.add('hidden');
        volumeMuteIcon.classList.remove('hidden');
    } else {
        volumeHighIcon.classList.remove('hidden');
        volumeMuteIcon.classList.add('hidden');
    }
});

// Mute/Unmute button
volumeButton.addEventListener('click', () => {
    console.log('[volumeButton] Clicked.');
    if (playbackVideo.volume === 0) {
        playbackVideo.volume = lastVolume > 0 ? lastVolume : 0.5; // Restore last volume or set to 0.5
        volumeSlider.value = playbackVideo.volume * 100;
        volumeHighIcon.classList.remove('hidden');
        volumeMuteIcon.classList.add('hidden');
        console.log('[volumeButton] Unmuted. Video volume:', playbackVideo.volume);
    } else {
        lastVolume = playbackVideo.volume; // Save current video volume
        playbackVideo.volume = 0;
        volumeSlider.value = 0;
        volumeHighIcon.classList.add('hidden');
        volumeMuteIcon.classList.remove('hidden');
        console.log('[volumeButton] Muted. Video volume:', playbackVideo.volume);
    }
    adjustBackgroundMusicVolume(); // Adjust background music volume immediately
});

// Fullscreen toggle
fullscreenButton.addEventListener('click', () => {
    console.log('[fullscreenButton] Clicked.');
    if (playbackVideo.requestFullscreen) {
        playbackVideo.requestFullscreen();
    } else if (playbackVideo.webkitRequestFullscreen) { /* Safari */
        playbackVideo.webkitRequestFullscreen();
    } else if (playbackVideo.msRequestFullscreen) { /* IE11 */
        playbackVideo.msRequestFullscreen();
    }
});


// Download the recorded video
downloadButton.addEventListener('click', () => {
    console.log('[downloadButton] Clicked.');
    if (recordedChunks.length === 0) {
        showMessage('No recording available to download.', 'error');
        return;
    }
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webcam-recording-${new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up the URL
    showMessage('Recording downloaded!', 'success');
});

// Setup timestamp canvas
function setupTimestampCanvas() {
    // Ensure canvas matches video size for proper overlay
    timestampCanvas.width = playbackVideo.offsetWidth;
    timestampCanvas.height = playbackVideo.offsetHeight;
    audioContext.font = '24px Inter';
    audioContext.fillStyle = 'white';
    audioContext.shadowColor = 'black';
    audioContext.shadowBlur = 5;
    audioContext.textAlign = 'right';
    audioContext.textBaseline = 'top';
    console.log('[timestampCanvas] Canvas setup complete.');
}

// Draw timestamp on canvas
function drawTimestamp() {
    if (!isTimestampVisible || playbackVideo.paused || playbackVideo.ended) {
        audioContext.clearRect(0, 0, timestampCanvas.width, timestampCanvas.height); // Clear if not visible or video paused/ended
        return;
    }

    audioContext.clearRect(0, 0, timestampCanvas.width, timestampCanvas.height);
    const currentTime = playbackVideo.currentTime;
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime - Math.floor(currentTime)) * 100); // Get two digits for milliseconds
    const timestampText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    audioContext.fillText(timestampText, timestampCanvas.width - 20, 20); // Position at top-right
}

// Toggle timestamp overlay
toggleTimestampButton.addEventListener('click', () => {
    isTimestampVisible = !isTimestampVisible;
    console.log('[toggleTimestampButton] Clicked. isTimestampVisible:', isTimestampVisible);
    if (isTimestampVisible) {
        timestampCanvas.classList.remove('hidden');
        setupTimestampCanvas(); // Re-setup canvas in case video size changed
        timestampInterval = setInterval(drawTimestamp, 100); // Update every 100ms
        toggleTimestampButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 9.586V6z" clip-rule="evenodd" />
        </svg> Hide Timestamp`;
        showMessage('Timestamp overlay enabled.', 'info');
    } else {
        clearInterval(timestampInterval);
        audioContext.clearRect(0, 0, timestampCanvas.width, timestampCanvas.height);
        timestampCanvas.classList.add('hidden');
        toggleTimestampButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 9.586V6z" clip-rule="evenodd" />
        </svg> Toggle Timestamp`;
        showMessage('Timestamp overlay disabled.', 'info');
    }
});

// Ensure canvas resizes with video
window.addEventListener('resize', () => {
    if (isTimestampVisible) {
        setupTimestampCanvas();
    }
});

// Handle music file upload
uploadMusicButton.addEventListener('click', () => {
    console.log('[uploadMusicButton] Clicked. Triggering file input...');
    musicFileInput.click(); // Trigger the hidden file input
});

musicFileInput.addEventListener('change', (event) => {
    console.log('[musicFileInput] Change event detected.');
    const file = event.target.files[0];
    if (file) {
        console.log(`[musicFileInput] File selected: ${file.name}, Type: ${file.type}`);
        // Add a check for audio file type
        if (!file.type.startsWith('audio/')) {
            console.error('[musicFileInput] Invalid file type detected.');
            showMessage('Please upload a valid audio file (e.g., MP3, WAV).', 'error');
            toggleMusicButton.disabled = true; // Keep music button disabled if invalid file
            return; // Stop execution if not an audio file
        }

        if (currentMusicUrl) {
            URL.revokeObjectURL(currentMusicUrl); // Clean up previous URL if exists
            console.log('[musicFileInput] Previous music URL revoked.');
        }
        currentMusicUrl = URL.createObjectURL(file);
        backgroundMusic.src = currentMusicUrl;
        backgroundMusic.load(); // Load the new audio source
        toggleMusicButton.disabled = false; // Enable play/pause music button
        console.log(`[musicFileInput] Music file "${file.name}" loaded successfully.`);
        showMessage(`Music file "${file.name}" loaded!`, 'success');

        // Reset play/pause button state to 'Play Music'
        backgroundMusic.pause();
        toggleMusicButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.447-.894L11 6V3a1 1 0 00-2 0v10.586l-3.293-3.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0l5-5A1 1 0 0018 10V3z" />
        </svg> Play Music`;

        adjustBackgroundMusicVolume(); // Adjust music volume immediately after loading
    } else {
        console.log('[musicFileInput] No file selected.');
        showMessage('No music file selected.', 'warning');
        toggleMusicButton.disabled = true; // Keep disabled if no file
    }
});

//Toggle background music
toggleMusicButton.addEventListener('click', () => {
    console.log('[toggleMusicButton] Clicked.');
    if (!backgroundMusic.src) {
        console.log('[toggleMusicButton] No music source found.');
        showMessage('Please upload a music file first!', 'warning');
        return;
    }

    if (backgroundMusic.paused) {
        console.log('[toggleMusicButton] Attempting to play music.');
        backgroundMusic.play().then(() => {
            console.log('[toggleMusicButton] Music started playing.');
            toggleMusicButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.447-.894L11 6V3a1 1 0 00-2 0v10.586l-3.293-3.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0l5-5A1 1 0 0018 10V3z" />
        </svg> Stop Music`;
            showMessage('Background music playing.', 'info');
        }).catch(e => {
            console.error('Error playing music:', e);
            showMessage('Could not play music. Make sure the uploaded audio file is valid and not corrupted.', 'error');
        });
    } else {
        console.log('[toggleMusicButton] Attempting to pause music.');
        backgroundMusic.pause();
        console.log('[toggleMusicButton] Music paused.');
        toggleMusicButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.447-.894L11 6V3a1 1 0 00-2 0v10.586l-3.293-3.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0l5-5A1 1 0 0018 10V3z" />
        </svg> Play Music`;
        showMessage('Background music stopped.', 'info');
    }
});

// Initial state of buttons
startButton.disabled = false;
stopButton.disabled = true;
downloadButton.disabled = true;
toggleTimestampButton.disabled = true;
toggleMusicButton.disabled = true; // Initially disabled, enabled after music upload

// Set initial state for custom playback controls to be disabled and play icon
playPauseButton.disabled = true;
playPauseButton.classList.add('paused'); // Ensure play icon is shown initially
rewindButton.disabled = true;
forwardButton.disabled = true;
progressBar.disabled = true;
volumeButton.disabled = true;
volumeSlider.disabled = true;
fullscreenButton.disabled = true;

// Set initial volume for video and then adjust music
playbackVideo.volume = volumeSlider.value / 100;
adjustBackgroundMusicVolume(); // Initial adjustment for background music
console.log('Script initialized.'); // Confirm script starts running
