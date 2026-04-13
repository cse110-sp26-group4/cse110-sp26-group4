document.addEventListener('DOMContentLoaded', () => {
    const symbols = ['🤖', '🧠', '🧐', '🚀', '⚡️', '🔥', '☁️'];
    const reels = document.querySelectorAll('.reel');
    const spinButton = document.getElementById('spin-button');
    const tokenBalanceDisplay = document.getElementById('token-balance');
    const messageDisplay = document.getElementById('message-display');

    let tokenBalance = 1000;
    const spinCost = 10;
    let spinning = false;

    function spin() {
        if (spinning || tokenBalance < spinCost) {
            return;
        }

        spinning = true;
        spinButton.disabled = true;
        messageDisplay.textContent = 'Burning tokens...';

        tokenBalance -= spinCost;
        updateTokenBalance();

        let spins = 0;
        const maxSpins = 30;

        const spinInterval = setInterval(() => {
            spins++;
            reels.forEach(reel => {
                reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            });

            if (spins >= maxSpins) {
                clearInterval(spinInterval);
                endSpin();
            }
        }, 100);
    }

    function endSpin() {
        const result = [];
        reels.forEach(reel => {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            reel.textContent = symbol;
            result.push(symbol);
        });

        checkWin(result);
        spinning = false;
        spinButton.disabled = false;
    }

    function checkWin(result) {
        // Simple win condition: 3 of the same symbol
        if (result[0] === result[1] && result[1] === result[2]) {
            const winAmount = 100;
            tokenBalance += winAmount;
            messageDisplay.textContent = `Jackpot! You won ${winAmount} tokens!`;
        } else if (result[0] === result[1] || result[1] === result[2]) {
            const winAmount = 20;
            tokenBalance += winAmount;
            messageDisplay.textContent = `You won ${winAmount} tokens!`;
        } else {
            messageDisplay.textContent = 'Try again!';
        }
        updateTokenBalance();

        if (tokenBalance < spinCost) {
            messageDisplay.textContent = 'Not enough tokens to spin!';
            spinButton.disabled = true;
        }
    }

    function updateTokenBalance() {
        tokenBalanceDisplay.textContent = tokenBalance;
    }

    spinButton.addEventListener('click', spin);
});
