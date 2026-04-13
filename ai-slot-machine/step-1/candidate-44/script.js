document.addEventListener('DOMContentLoaded', () => {
    const spinButton = document.getElementById('spin-button');
    const tokenCountElement = document.getElementById('token-count');
    const messageElement = document.getElementById('message');
    const reels = document.querySelectorAll('.reel');

    let tokenCount = 100;

    const symbols = ['🤖', '🧠', '💾', '⚡️', '🔥', '💻', '📈', '📉'];

    spinButton.addEventListener('click', () => {
        if (tokenCount > 0) {
            tokenCount--;
            tokenCountElement.textContent = tokenCount;
            messageElement.textContent = '';
            spinButton.disabled = true;

            reels.forEach(reel => {
                reel.classList.add('spinning');
            });

            setTimeout(() => {
                const result = [];
                reels.forEach(reel => {
                    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                    reel.textContent = randomSymbol;
                    result.push(randomSymbol);
                    reel.classList.remove('spinning');
                });

                checkWin(result);
                spinButton.disabled = false;
            }, 1000);

        } else {
            messageElement.textContent = "You're out of tokens! The AI wins!";
        }
    });

    function checkWin(result) {
        if (result[0] === result[1] && result[1] === result[2]) {
            let winAmount = 0;
            switch (result[0]) {
                case '🤖':
                    winAmount = 50;
                    break;
                case '🧠':
                    winAmount = 40;
                    break;
                case '💾':
                    winAmount = 30;
                    break;
                default:
                    winAmount = 20;
            }
            tokenCount += winAmount;
            tokenCountElement.textContent = tokenCount;
            messageElement.textContent = `You won ${winAmount} tokens! But the AI will probably take them back...`;
        } else if (result[0] === result[1] || result[1] === result[2]) {
            const winAmount = 5;
            tokenCount += winAmount;
            tokenCountElement.textContent = tokenCount;
            messageElement.textContent = `You won ${winAmount} tokens! A small victory against the AI.`;
        }
    }
});