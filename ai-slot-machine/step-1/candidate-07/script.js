document.addEventListener('DOMContentLoaded', () => {
    const symbols = ['💻', '📝', '🤖', '🧠', '🌟'];
    const reelElements = document.querySelectorAll('.reel');
    const spinButton = document.getElementById('spin-button');
    const resetButton = document.getElementById('reset-button');
    const tokenBalanceElement = document.getElementById('token-balance');
    const messageElement = document.getElementById('message');

    let tokenBalance = 100;

    function spin() {
        if (tokenBalance < 10) {
            messageElement.textContent = "You don't have enough tokens!";
            spinButton.disabled = true;
            return;
        }

        tokenBalance -= 10;
        updateTokenBalance();
        messageElement.textContent = '';
        spinButton.disabled = true;

        let spins = 0;
        const maxSpins = 10;

        const spinInterval = setInterval(() => {
            reelElements.forEach(reel => {
                reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            });
            spins++;
            if (spins >= maxSpins) {
                clearInterval(spinInterval);
                endSpin();
            }
        }, 100);
    }

    function endSpin() {
        const results = [];
        reelElements.forEach(reel => {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            reel.textContent = symbol;
            results.push(symbol);
        });

        calculateWinnings(results);
        if (tokenBalance >= 10) {
            spinButton.disabled = false;
        } else {
            messageElement.textContent = "Game Over! You're out of tokens.";
            spinButton.disabled = true;
        }
    }

    function calculateWinnings(results) {
        if (results[0] === '🌟' && results[1] === '🌟' && results[2] === '🌟') {
            tokenBalance += 500;
            messageElement.textContent = 'Jackpot! You hit AGI! +500 tokens';
        } else if (results[0] === results[1] && results[1] === results[2]) {
            tokenBalance += 100;
            messageElement.textContent = 'Three of a kind! +100 tokens';
        } else if ((results[0] === '🌟' && results[1] === '🌟') || (results[1] === '🌟' && results[2] === '🌟')) {
            tokenBalance += 50;
            messageElement.textContent = 'Two AGI symbols! +50 tokens';
        }
        updateTokenBalance();
    }

    function updateTokenBalance() {
        tokenBalanceElement.textContent = tokenBalance;
    }

    function resetGame() {
        tokenBalance = 100;
        updateTokenBalance();
        messageElement.textContent = '';
        spinButton.disabled = false;
        reelElements.forEach(reel => reel.textContent = '');
    }

    spinButton.addEventListener('click', spin);
    resetButton.addEventListener('click', resetGame);

    // Set initial state
    reelElements.forEach(reel => reel.textContent = '');
});
