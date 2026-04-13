document.addEventListener('DOMContentLoaded', () => {
    const spinButton = document.getElementById('spin-button');
    const reels = document.querySelectorAll('.reel');
    const tokensSpan = document.getElementById('tokens');
    const winningsSpan = document.getElementById('winnings');
    const message = document.getElementById('message');

    let tokens = 100;
    let winnings = 0;

    const symbols = {
        '🤖': { value: 50, message: 'Jackpot! The AI overlords are pleased!' },
        '🧠': { value: 40, message: 'Big Brain Time! You won 40 tokens!' },
        '⚡️': { value: 30, message: 'Electrifying! 30 tokens for you!' },
        '🔥': { value: 20, message: 'You\'re on fire! 20 tokens!' },
        '💻': { value: 10, message: 'Nice! You won 10 tokens!' },
        '💡': { value: 5, message: 'An idea! Here are 5 tokens!' },
        '📈': { value: 2, message: 'Stonks! You won 2 tokens.' },
        '🚀': { value: 1, message: 'To the moon! 1 token.' }
    };

    const symbolKeys = Object.keys(symbols);

    spinButton.addEventListener('click', () => {
        if (tokens > 0) {
            tokens--;
            tokensSpan.textContent = tokens;
            message.textContent = '';
            spin();
        } else {
            message.textContent = 'You are out of tokens!';
        }
    });

    function spin() {
        spinButton.disabled = true;
        let completedReels = 0;
        reels.forEach((reel, i) => {
            const delay = i * 500;
            const spinDuration = 2000 + delay;
            const interval = setInterval(() => {
                reel.textContent = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                reel.textContent = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
                completedReels++;
                if (completedReels === reels.length) {
                    checkWin();
                    spinButton.disabled = false;
                }
            }, spinDuration);
        });
    }

    function checkWin() {
        const reelSymbols = Array.from(reels).map(reel => reel.textContent);
        let winAmount = 0;
        let winMessage = 'No luck this time!';

        // Check for 3 of a kind
        if (reelSymbols[0] === reelSymbols[1] && reelSymbols[1] === reelSymbols[2]) {
            winAmount = symbols[reelSymbols[0]].value;
            winMessage = symbols[reelSymbols[0]].message;
        }
        // Check for 2 of a kind
        else if (reelSymbols[0] === reelSymbols[1] || reelSymbols[1] === reelSymbols[2]) {
            winAmount = Math.floor(symbols[reelSymbols[1]].value / 5);
            winMessage = `Two of a kind! You won ${winAmount} tokens.`;
        }

        if (winAmount > 0) {
            winnings += winAmount;
            tokens += winAmount;
            winningsSpan.textContent = winnings;
            tokensSpan.textContent = tokens;
        }
        message.textContent = winMessage;
    }
});