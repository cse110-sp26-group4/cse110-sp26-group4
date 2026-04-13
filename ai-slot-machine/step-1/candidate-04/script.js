document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tokenBalanceElement = document.getElementById('token-balance');
    const reels = Array.from(document.querySelectorAll('.reel'));
    const spinButton = document.getElementById('spin-button');
    const messageBox = document.getElementById('message-box');

    // Game Constants
    const SYMBOLS = ['🧠', '🤖', '🪙', '✍️', '🤔', '💡', '🔥'];
    const SPIN_COST = 10;
    const WINNINGS = {
        '🧠': 500, '🤖': 250, '🔥': 150, '🪙': 100,
        '💡': 75,  '✍️': 50,  '🤔': 25,
    };
    const ANIMATION_DURATION = 1000; // ms
    const REEL_DELAY = 300; // ms, delay between reels stopping

    // Game State
    let tokenBalance = 1000;
    let isSpinning = false;

    // Initialize
    function init() {
        tokenBalanceElement.textContent = tokenBalance;
        reels.forEach(reel => {
            reel.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        });
        messageBox.textContent = 'Press SPIN to start!';
    }

    // Animate a single reel
    function animateReel(reel, duration) {
        return new Promise(resolve => {
            const animation = reel.animate([
                { transform: 'translateY(-15%)', filter: 'blur(3px)' },
                { transform: 'translateY(15%)', filter: 'blur(3px)' },
                { transform: 'translateY(0)', filter: 'blur(0)' }
            ], {
                duration: 100,
                iterations: duration / 100
            });

            // Flickering symbols during spin
            const flickerInterval = setInterval(() => {
                reel.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            }, 80);

            setTimeout(() => {
                animation.cancel();
                clearInterval(flickerInterval);
                resolve();
            }, duration);
        });
    }

    // Calculate winnings based on results
    function calculateWinnings(results) {
        if (results.every(symbol => symbol === results[0])) {
            return WINNINGS[results[0]];
        }
        return 0;
    }

    // Process the results of the spin
    function processResults(results) {
        const winnings = calculateWinnings(results);
        if (winnings > 0) {
            tokenBalance += winnings;
            tokenBalanceElement.textContent = tokenBalance;
            messageBox.textContent = `Jackpot! You won ${winnings} tokens!`;
            messageBox.classList.add('win');
            reels.forEach(reel => reel.classList.add('win-animation'));
        } else {
            messageBox.textContent = 'Try again!';
        }

        isSpinning = false;
        spinButton.disabled = false;
    }

    // Main spin function
    async function spin() {
        if (isSpinning) return;
        if (tokenBalance < SPIN_COST) {
            messageBox.textContent = "Not enough tokens!";
            return;
        }

        isSpinning = true;
        spinButton.disabled = true;
        messageBox.textContent = 'Spinning...';
        messageBox.classList.remove('win');
        reels.forEach(reel => reel.classList.remove('win-animation'));

        tokenBalance -= SPIN_COST;
        tokenBalanceElement.textContent = tokenBalance;

        const results = reels.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        const animationPromises = reels.map((reel, i) => {
            const duration = ANIMATION_DURATION + i * REEL_DELAY;
            return animateReel(reel, duration);
        });

        // Animate all reels simultaneously but with different durations
        await Promise.all(animationPromises);

        // Set final symbols after animation
        reels.forEach((reel, i) => {
            reel.textContent = results[i];
        });

        processResults(results);
    }

    // Event Listeners
    spinButton.addEventListener('click', spin);

    // Initial setup
    init();
});
