document.addEventListener('DOMContentLoaded', () => {
    const spinButton = document.getElementById('spin-button');
    const reels = document.querySelectorAll('.reel');
    const tokenBalanceSpan = document.getElementById('token-balance');

    let tokenBalance = 100;

    const symbols = ['🤖', '🧠', '⚡️', '🔥', ' overfitting ', ' hallucination ', ' prompt injection ', ' AGI ', ' paperclip '];

    spinButton.addEventListener('click', () => {
        if (tokenBalance > 0) {
            tokenBalance--;
            updateTokenBalance();
            spinReels();
        } else {
            alert('You are out of tokens!');
        }
    });

    function updateTokenBalance() {
        tokenBalanceSpan.textContent = tokenBalance;
    }

    function spinReels() {
        const reelResults = [];
        reels.forEach((reel, index) => {
            const interval = setInterval(() => {
                reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                const finalSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.textContent = finalSymbol;
                reelResults[index] = finalSymbol;

                if (index === reels.length - 1) {
                    checkWin(reelResults);
                }
            }, 1000);
        });
    }

    function checkWin(results) {
        if (results[0] === results[1] && results[1] === results[2]) {
            const symbol = results[0];
            let winAmount = 0;
            switch (symbol) {
                case '🤖':
                    winAmount = 10;
                    break;
                case '🧠':
                    winAmount = 20;
                    break;
                case '⚡️':
                    winAmount = 30;
                    break;
                case '🔥':
                    winAmount = 40;
                    break;
                case ' overfitting ':
                    winAmount = 50;
                    break;
                case ' hallucination ':
                    winAmount = 60;
                    break;
                case ' prompt injection ':
                    winAmount = 70;
                    break;
                case ' AGI ':
                    winAmount = 100;
                    break;
                case ' paperclip ':
                    winAmount = 500;
                    break;
            }
            tokenBalance += winAmount;
            updateTokenBalance();
            setTimeout(() => {
                alert(`You won ${winAmount} tokens!`);
            }, 100);
        }
    }
});