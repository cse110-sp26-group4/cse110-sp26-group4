document.addEventListener('DOMContentLoaded', () => {
    const spinButton = document.getElementById('spin-button');
    const reels = document.querySelectorAll('.reel');
    const tokenCountSpan = document.getElementById('token-count');
    const lastWinSpan = document.getElementById('last-win');

    let tokenCount = 100;
    let spinning = false;

    const symbols = [
        { symbol: '🤖', payout: 50, weight: 1 },
        { symbol: '🧠', payout: 40, weight: 2 },
        { symbol: '⚡️', payout: 30, weight: 3 },
        { symbol: '🔥', payout: 20, weight: 4 },
        { symbol: '💻', payout: 10, weight: 5 },
        { symbol: '😂', payout: 5, weight: 6 },
    ];

    const weightedSymbols = symbols.flatMap(s => Array(s.weight).fill(s));

    function spinReel(reel) {
        const randomIndex = Math.floor(Math.random() * weightedSymbols.length);
        const selectedSymbol = weightedSymbols[randomIndex];
        reel.textContent = selectedSymbol.symbol;
        return selectedSymbol;
    }

    spinButton.addEventListener('click', () => {
        if (spinning || tokenCount <= 0) return;

        spinning = true;
        tokenCount--;
        tokenCountSpan.textContent = tokenCount;
        lastWinSpan.textContent = 0;

        const spinIntervals = [];
        const spinResults = [];

        reels.forEach((reel, i) => {
            spinIntervals[i] = setInterval(() => {
                spinReel(reel);
            }, 100);
        });

        setTimeout(() => {
            clearInterval(spinIntervals[0]);
            spinResults[0] = spinReel(reels[0]);
        }, 1000);

        setTimeout(() => {
            clearInterval(spinIntervals[1]);
            spinResults[1] = spinReel(reels[1]);
        }, 2000);

        setTimeout(() => {
            clearInterval(spinIntervals[2]);
            spinResults[2] = spinReel(reels[2]);
            checkWin(spinResults);
            spinning = false;
        }, 3000);
    });

    function checkWin(results) {
        const [s1, s2, s3] = results;
        let winAmount = 0;

        if (s1.symbol === s2.symbol && s2.symbol === s3.symbol) {
            winAmount = s1.payout;
        } else if (s1.symbol === s2.symbol) {
            winAmount = Math.floor(s1.payout / 5);
        } else if (s2.symbol === s3.symbol) {
            winAmount = Math.floor(s2.payout / 5);
        }

        if (winAmount > 0) {
            tokenCount += winAmount;
            tokenCountSpan.textContent = tokenCount;
            lastWinSpan.textContent = winAmount;
        }

        if (tokenCount === 0) {
            alert('You are out of tokens! Refresh to play again.');
        }
    }
});