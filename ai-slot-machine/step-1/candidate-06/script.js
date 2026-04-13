const symbols = ['🤖', '🧠', '💡', '💻'];
const spinButton = document.getElementById('spin-button');
const tokenBalance = document.getElementById('token-balance');
const reels = document.querySelectorAll('.reel');
const message = document.getElementById('message');

let tokens = 100;
const spinCost = 5;

spinButton.addEventListener('click', () => {
    if (tokens >= spinCost) {
        tokens -= spinCost;
        tokenBalance.textContent = tokens;
        message.textContent = '';
        reels.forEach(reel => reel.classList.remove('winner'));
        spin();
    } else {
        message.textContent = "Not enough tokens!";
    }
});

function spin() {
    spinButton.disabled = true;
    reels.forEach(reel => reel.classList.add('spinning'));

    const results = [];
    let completedReels = 0;

    reels.forEach((reel, index) => {
        const duration = 1000 + index * 500; // Stagger the spinning
        const interval = 100;
        let elapsed = 0;

        const timer = setInterval(() => {
            elapsed += interval;
            const randomIndex = Math.floor(Math.random() * symbols.length);
            reel.textContent = symbols[randomIndex];

            if (elapsed >= duration) {
                clearInterval(timer);
                reel.classList.remove('spinning');
                const finalSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.textContent = finalSymbol;
                results[index] = finalSymbol;
                completedReels++;

                if (completedReels === reels.length) {
                    calculateWinnings(results);
                    spinButton.disabled = false;
                    if (tokens < spinCost) {
                        message.textContent = "Out of tokens! Game over.";
                        spinButton.disabled = true;
                    }
                }
            }
        }, interval);
    });
}

function calculateWinnings(results) {
    let winnings = 0;
    const counts = {};
    results.forEach(symbol => {
        counts[symbol] = (counts[symbol] || 0) + 1;
    });

    let winningSymbol = null;

    // Check for three of a kind
    for (const symbol in counts) {
        if (counts[symbol] === 3) {
            winningSymbol = symbol;
            if (symbol === '🤖') winnings = 50;
            else if (symbol === '🧠') winnings = 40;
            else if (symbol === '💡') winnings = 30;
            else if (symbol === '💻') winnings = 20;
            break;
        }
    }

    // Check for two of a kind if no three of a kind
    if (!winningSymbol) {
        for (const symbol in counts) {
            if (counts[symbol] === 2) {
                winningSymbol = symbol;
                if (symbol === '🤖') winnings = 10;
                else if (symbol === '🧠') winnings = 8;
                else if (symbol === '💡') winnings = 6;
                else if (symbol === '💻') winnings = 4;
                break; // Award for the first pair found
            }
        }
    }

    if (winnings > 0) {
        tokens += winnings;
        tokenBalance.textContent = tokens;
        message.textContent = `You won ${winnings} tokens!`;

        reels.forEach((reel, index) => {
            if (results[index] === winningSymbol) {
                reel.classList.add('winner');
            }
        });
    } else {
        message.textContent = "Try again!";
    }
}
