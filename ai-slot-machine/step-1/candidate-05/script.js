document.addEventListener('DOMContentLoaded', () => {
    const tokenBalanceElement = document.getElementById('token-balance');
    const spinButton = document.getElementById('spin-button');
    const resultMessageElement = document.getElementById('result-message');
    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];

    const symbols = ['🤖', '🧠', '⚡️', '📈', '📉', '🔥', '🤔'];
    const payouts = {
        '🤖🤖🤖': 50,
        '🧠🧠🧠': 40,
        '⚡️⚡️⚡️': 30,
        '📈📈📈': 25,
        '🔥🔥🔥': 20,
        '🤔🤔🤔': 15,
    };
    const spinCost = 5;
    let tokenBalance = 100;
    let isSpinning = false;

    function updateTokenBalance(amount) {
        tokenBalance = amount;
        tokenBalanceElement.textContent = tokenBalance;
    }

    function spin() {
        if (isSpinning || tokenBalance < spinCost) {
            return;
        }

        isSpinning = true;
        spinButton.disabled = true;
        resultMessageElement.textContent = '';
        updateTokenBalance(tokenBalance - spinCost);

        let spinResults = [];
        let completedReels = 0;

        reels.forEach((reel, index) => {
            const animationInterval = 100;
            const spinDuration = 1000 + (index * 500); // Stagger the stop
            let intervalId = setInterval(() => {
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.textContent = randomSymbol;
            }, animationInterval);

            setTimeout(() => {
                clearInterval(intervalId);
                const finalSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.textContent = finalSymbol;
                spinResults[index] = finalSymbol;
                completedReels++;

                if (completedReels === reels.length) {
                    checkWin(spinResults);
                }
            }, spinDuration);
        });
    }

    function checkWin(results) {
        const resultString = results.join('');
        let winAmount = 0;
        let winMessage = 'Try again!';

        if (payouts[resultString]) {
            winAmount = payouts[resultString];
            winMessage = `You won ${winAmount} tokens!`;
        } else if (results[0] === results[1] || results[1] === results[2]) {
            winAmount = 5; // Small win for two in a row
            winMessage = `You won ${winAmount} tokens!`;
        }

        if (winAmount > 0) {
            updateTokenBalance(tokenBalance + winAmount);
        }

        resultMessageElement.textContent = winMessage;

        isSpinning = false;
        if (tokenBalance >= spinCost) {
            spinButton.disabled = false;
        } else {
            resultMessageElement.textContent = "You're out of tokens!";
        }
    }

    spinButton.addEventListener('click', spin);
    reels.forEach(reel => reel.textContent = '🎰');
});