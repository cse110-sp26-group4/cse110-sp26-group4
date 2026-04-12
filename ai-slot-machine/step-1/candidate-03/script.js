document.addEventListener('DOMContentLoaded', () => {
    const tokenCountElement = document.getElementById('token-count');
    const reels = document.querySelectorAll('.reel');
    const spinButton = document.getElementById('spin-button');
    const messageElement = document.getElementById('message');

    const symbols = ['🤖', '🧠', '⚡️', '💰', '🚀', '📉', '🧐'];
    const spinCost = 5;
    const payouts = {
        '🤖': 50,
        '🧠': 40,
        '⚡️': 30,
        '💰': 100,
        '🚀': 75,
        '📉': 2, // Low payout for a "bad" symbol
        '🧐': 60
    };

    let tokens = 100;

    function updateTokenCount(amount) {
        tokens = amount;
        tokenCountElement.textContent = tokens;
    }

    function getRandomSymbol() {
        return symbols[Math.floor(Math.random() * symbols.length)];
    }

    function spin() {
        if (tokens < spinCost) {
            messageElement.textContent = "Not enough tokens to spin!";
            return;
        }

        updateTokenCount(tokens - spinCost);
        messageElement.textContent = "Spinning...";
        spinButton.disabled = true;

        const results = [];
        let completedReels = 0;

        reels.forEach((reel, index) => {
            reel.classList.add('spinning');
            const interval = setInterval(() => {
                reel.textContent = getRandomSymbol();
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                reel.classList.remove('spinning');
                const finalSymbol = getRandomSymbol();
                reel.textContent = finalSymbol;
                results[index] = finalSymbol;
                completedReels++;

                if (completedReels === reels.length) {
                    checkWin(results);
                    spinButton.disabled = false;
                }
            }, 1000 + (index * 500)); // Stagger the stop time
        });
    }

    function checkWin(results) {
        // For this version, we'll just check if all three are the same
        const allSame = results.every(symbol => symbol === results[0]);

        if (allSame) {
            const symbol = results[0];
            const winnings = payouts[symbol];
            updateTokenCount(tokens + winnings);
            messageElement.textContent = `You won ${winnings} tokens!`;
        } else {
            messageElement.textContent = "Try again!";
        }

        if (tokens < spinCost) {
            spinButton.disabled = true;
            messageElement.textContent = "Game Over! You've run out of tokens.";
        }
    }

    // Initial setup
    reels.forEach(reel => {
        reel.textContent = getRandomSymbol();
    });

    spinButton.addEventListener('click', spin);
});
