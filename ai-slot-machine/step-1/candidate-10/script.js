document.addEventListener('DOMContentLoaded', () => {
    const symbols = ['🐛', '✨', '🤖', '🧠', '🪙', ' tenfold '];
    const reel1 = document.getElementById('reel1');
    const reel2 = document.getElementById('reel2');
    const reel3 = document.getElementById('reel3');
    const spinButton = document.getElementById('spin-button');
    const tokenBalance = document.getElementById('token-balance');

    let tokens = 100;

    function spin() {
        if (tokens <= 0) {
            alert("You're out of tokens! Refresh to play again.");
            return;
        }
        tokens--;
        updateBalance();

        spinButton.disabled = true;

        const results = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
        ];

        // Animate reels
        animateReel(reel1, results[0], 1000);
        animateReel(reel2, results[1], 1500);
        animateReel(reel3, results[2], 2000, () => {
            checkWin(results);
            spinButton.disabled = false;
        });
    }

    function animateReel(reel, finalSymbol, duration, callback) {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < duration) {
                reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            } else {
                reel.textContent = finalSymbol;
                clearInterval(interval);
                if (callback) callback();
            }
        }, 100);
    }

    function checkWin(results) {
        // For simplicity, we'll only check for three of a kind
        if (results[0] === results[1] && results[1] === results[2]) {
            const symbol = results[0];
            let winAmount = 0;
            switch (symbol) {
                case ' tenfold ':
                    winAmount = 50;
                    break;
                case '🧠':
                    winAmount = 20;
                    break;
                case '🤖':
                    winAmount = 15;
                    break;
                case '✨':
                    winAmount = 10;
                    break;
                case '🪙':
                    winAmount = 5;
                    break;
                case '🐛':
                    winAmount = -5; // A little penalty for bugs
                    break;
            }
            tokens += winAmount;
            if (winAmount > 0) {
                alert(`You won ${winAmount} tokens!`);
            } else {
                alert(`Oh no, a bug! You lose 5 tokens.`);
            }
            updateBalance();
        }
    }

    function updateBalance() {
        tokenBalance.textContent = tokens;
    }

    spinButton.addEventListener('click', spin);

    // Initial state
    reel1.textContent = symbols[0];
    reel2.textContent = symbols[1];
    reel3.textContent = symbols[2];
});