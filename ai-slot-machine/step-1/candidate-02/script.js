document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const symbols = {
        '🤖': { prize: 50, message: "Blech Blorch! A jackpot from our benevolent AI overlord." },
        '🧠': { prize: 40, message: "Galaxy Brain! You've aligned the models." },
        '💡': { prize: 30, message: "A brilliant idea! You've earned some tokens." },
        '⚡️': { prize: 20, message: "Static electricity... or a breakthrough? You won!" },
        '🔥': { prize: 100, message: "This is fine. You won the GPU lottery!" },
        '💻': { prize: 10, message: "You booted up a classic. A small win for nostalgia." },
        '🎰': { prize: 5, message: "You hit the meta-jackpot! A slot within a slot." }
    };
    const spinCost = 1;
    const startingTokens = 100;
    const reelCount = 3;
    const spinAnimationTime = 1000; // in milliseconds

    // --- DOM ELEMENTS ---
    const reelsContainer = document.getElementById('reels');
    const spinButton = document.getElementById('spin-button');
    const tokenBalanceElement = document.getElementById('token-balance');
    const messageElement = document.getElementById('message');

    // --- STATE ---
    let tokenBalance = startingTokens;
    let isSpinning = false;
    const reelElements = [];
    const symbolKeys = Object.keys(symbols);

    // --- INITIALIZATION ---
    function init() {
        for (let i = 0; i < reelCount; i++) {
            const reel = document.createElement('div');
            reel.className = 'reel';
            reelsContainer.appendChild(reel);
            reelElements.push(reel);
        }
        updateTokenBalance();
        spinButton.addEventListener('click', handleSpin);
    }

    // --- GAME LOGIC ---
    function handleSpin() {
        if (isSpinning) return;
        if (tokenBalance < spinCost) {
            messageElement.textContent = "Out of tokens! The AI demands more compute.";
            return;
        }

        isSpinning = true;
        spinButton.disabled = true;
        reelElements.forEach(reel => reel.classList.add('spinning'));
        tokenBalance -= spinCost;
        updateTokenBalance();
        messageElement.textContent = "The model is 'thinking'...";

        let finalSymbols = [];
        reelElements.forEach((reel, index) => {
            const animationInterval = setInterval(() => {
                reel.textContent = getRandomSymbol();
            }, 100);

            setTimeout(() => {
                clearInterval(animationInterval);
                const finalSymbol = getRandomSymbol();
                reel.textContent = finalSymbol;
                finalSymbols[index] = finalSymbol;

                if (index === reelElements.length - 1) {
                    evaluateResult(finalSymbols);
                }
            }, spinAnimationTime + (index * 500)); // Stagger the stopping
        });
    }

    function evaluateResult(finalSymbols) {
        const firstSymbol = finalSymbols[0];
        const isWin = finalSymbols.every(symbol => symbol === firstSymbol);

        if (isWin) {
            const winInfo = symbols[firstSymbol];
            tokenBalance += winInfo.prize;
            messageElement.textContent = winInfo.message;
        } else {
            messageElement.textContent = "Incoherent hallucinations. No tokens for you.";
        }

        updateTokenBalance();
        isSpinning = false;
        spinButton.disabled = false;
        reelElements.forEach(reel => reel.classList.remove('spinning'));
    }

    // --- UTILITY FUNCTIONS ---
    function getRandomSymbol() {
        return symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
    }

    function updateTokenBalance() {
        tokenBalanceElement.textContent = tokenBalance;
    }

    // --- START ---
    init();
});
