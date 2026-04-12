document.addEventListener('DOMContentLoaded', () => {
    const reels = document.querySelectorAll('.reel');
    const balanceElement = document.getElementById('balance');
    const betAmountElement = document.getElementById('bet-amount');
    const spinButton = document.getElementById('spin-button');
    const gambleButton = document.getElementById('gamble-button');
    const messageElement = document.getElementById('message');

    const symbols = ['🤖', '🧠', '🚀', '💻', '🪙'];
    let balance = 1000;
    let lastWinnings = 0;

    const spin = () => {
        const betAmount = parseInt(betAmountElement.value);
        if (balance < betAmount) {
            messageElement.textContent = "Not enough tokens to spin!";
            return;
        }

        balance -= betAmount;
        updateBalance();
        messageElement.textContent = "";
        lastWinnings = 0;
        gambleButton.disabled = true;

        let spinCount = 0;
        const spinInterval = setInterval(() => {
            spinCount++;
            reels.forEach(reel => {
                reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                reel.classList.add('spinning');
            });

            if (spinCount > 20) {
                clearInterval(spinInterval);
                const finalSymbols = Array.from(reels).map(() => symbols[Math.floor(Math.random() * symbols.length)]);
                reels.forEach((reel, index) => {
                    reel.textContent = finalSymbols[index];
                    reel.classList.remove('spinning');
                });
                checkWin(finalSymbols, betAmount);
            }
        }, 100);
    };

    const checkWin = (finalSymbols, betAmount) => {
        const [s1, s2, s3] = finalSymbols;
        let winMultiplier = 0;

        if (s1 === s2 && s2 === s3) {
            if (s1 === '🤖') winMultiplier = 50;
            else if (s1 === '🧠') winMultiplier = 20;
            else if (s1 === '🚀') winMultiplier = 15;
            else if (s1 === '💻') winMultiplier = 10;
            else if (s1 === '🪙') winMultiplier = 5;
        } else if ((s1 === s2 || s1 === s3 || s2 === s3)) {
            const twoOfAKindSymbol = [s1, s2, s3].sort()[1];
            if (twoOfAKindSymbol === '🤖') winMultiplier = 3;
            else if (twoOfAKindSymbol === '🧠') winMultiplier = 2;
        }


        if (winMultiplier > 0) {
            lastWinnings = betAmount * winMultiplier;
            balance += lastWinnings;
            messageElement.textContent = `You won ${lastWinnings} tokens!`;
            gambleButton.disabled = false;
        } else {
            messageElement.textContent = "You lost! Try again.";
        }
        updateBalance();
    };

    const gamble = () => {
        if (lastWinnings === 0) return;

        const isWin = Math.random() > 0.5;
        if (isWin) {
            balance += lastWinnings;
            messageElement.textContent = `Gamble won! You doubled your winnings to ${lastWinnings * 2} tokens!`;
            lastWinnings *= 2; // Update lastWinnings for consecutive gambles
        } else {
            lastWinnings = 0;
            messageElement.textContent = "Gamble lost! You lost your winnings.";
        }
        updateBalance();
        gambleButton.disabled = true; // Disable after one gamble attempt per win
    };


    const updateBalance = () => {
        balanceElement.textContent = balance;
    };

    spinButton.addEventListener('click', spin);
    gambleButton.addEventListener('click', gamble);
});
