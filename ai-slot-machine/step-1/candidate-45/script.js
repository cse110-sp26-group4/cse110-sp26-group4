document.addEventListener('DOMContentLoaded', () => {
    const spinButton = document.getElementById('spin-button');
    const balanceDisplay = document.getElementById('balance');
    const messageDisplay = document.getElementById('message');
    const reels = document.querySelectorAll('.reel');

    let balance = 100;

    const symbols = ['🤖', '🧠', '⚡️', '🔥', '💻', '💡'];

    const muteButton = document.getElementById('mute-button');
    let isMuted = false;

    const toggleMute = () => {
        isMuted = !isMuted;
        muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
    };

    muteButton.addEventListener('click', toggleMute);

    const speak = (text) => {
        if (isMuted) {
            return;
        }
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    };

    const spin = () => {
        if (balance <= 0) {
            const message = "You're out of compute credits!";
            messageDisplay.textContent = message;
            speak(message);
            return;
        }

        balance -= 10;
        balanceDisplay.textContent = balance;
        messageDisplay.textContent = '';
        speak("Spinning the reels!");

        let spinResults = [];

        reels.forEach((reel, index) => {
            const interval = setInterval(() => {
                reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                const finalSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.textContent = finalSymbol;
                spinResults[index] = finalSymbol;

                if (index === reels.length - 1) {
                    checkWin(spinResults);
                }
            }, 1000 + index * 500);
        });
    };

    const checkWin = (results) => {
        let winAmount = 0;
        let winMessage = '';

        // Check for win on the middle payline
        if (results[0] === results[1] && results[1] === results[2]) {
            const symbol = results[0];
            const payouts = {
                '🤖': 100,
                '🧠': 75,
                '⚡️': 50,
                '🔥': 40,
                '💻': 30,
                '💡': 20
            };
            winAmount += payouts[symbol];
            winMessage += `You won on the middle payline with ${symbol}! +${payouts[symbol]} credits! `;
        }

        // Check for win on the top payline
        if (results[0] === results[1]) {
            const symbol = results[0];
            const payouts = {
                '🤖': 20,
                '🧠': 15,
                '⚡️': 10,
                '🔥': 8,
                '💻': 6,
                '💡': 4
            };
            winAmount += payouts[symbol];
            winMessage += `You won on the top payline with ${symbol}! +${payouts[symbol]} credits! `;
        }

        // Check for win on the bottom payline
        if (results[1] === results[2]) {
            const symbol = results[1];
            const payouts = {
                '🤖': 20,
                '🧠': 15,
                '⚡️': 10,
                '🔥': 8,
                '💻': 6,
                '💡': 4
            };
            winAmount += payouts[symbol];
            winMessage += `You won on the bottom payline with ${symbol}! +${payouts[symbol]} credits! `;
        }

        if (winAmount > 0) {
            balance += winAmount;
            balanceDisplay.textContent = balance;
            messageDisplay.textContent = winMessage;
            speak(winMessage);
        } else {
            const message = 'Try again!';
            messageDisplay.textContent = message;
            speak(message);
        }
    };

    const resetButton = document.getElementById('reset-button');

    const resetGame = () => {
        balance = 100;
        balanceDisplay.textContent = balance;
        messageDisplay.textContent = '';
    };

    const helpButton = document.getElementById('help-button');
    const helpModal = document.getElementById('help-modal');
    const closeButton = document.querySelector('.close-button');

    const openModal = () => {
        helpModal.style.display = 'block';
    };

    const closeModal = () => {
        helpModal.style.display = 'none';
    };

    const darkModeButton = document.getElementById('dark-mode-button');

    const toggleDarkMode = () => {
        document.body.classList.toggle('dark-mode');
    };

    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const themeColorInput = document.getElementById('theme-color');
    const spinSpeedInput = document.getElementById('spin-speed');
    const volumeInput = document.getElementById('volume');

    const openSettingsModal = () => {
        settingsModal.style.display = 'block';
    };

    const closeSettingsModal = () => {
        settingsModal.style.display = 'none';
    };

    settingsButton.addEventListener('click', openSettingsModal);
    settingsModal.querySelector('.close-button').addEventListener('click', closeSettingsModal);

    themeColorInput.addEventListener('input', (event) => {
        const newColor = event.target.value;
        document.documentElement.style.setProperty('--theme-color', newColor);
    });

    spinSpeedInput.addEventListener('input', (event) => {
        // This is a placeholder for the spin speed functionality
        console.log('Spin speed:', event.target.value);
    });

    volumeInput.addEventListener('input', (event) => {
        // This is a placeholder for the volume functionality
        console.log('Volume:', event.target.value);
    });

    darkModeButton.addEventListener('click', toggleDarkMode);

    helpButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == helpModal) {
            closeModal();
        }
        if (event.target == settingsModal) {
            closeSettingsModal();
        }
    });

    resetButton.addEventListener('click', resetGame);
    spinButton.addEventListener('click', spin);
});