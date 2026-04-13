document.addEventListener('DOMContentLoaded', () => {
    const symbols = [
        { symbol: "🤖", payout: 50, message: "AGI Achieved!" },
        { symbol: "🧠", payout: 40, message: "Neural Network Synergy!" },
        { symbol: "⚡️", payout: 30, message: "Hyper-parameter Optimized!" },
        { symbol: "💻", payout: 20, message: "Quantum Leap!" },
        { symbol: "✨", payout: 15, message: "Model Converged!" },
        { symbol: "🔥", payout: 10, message: "It's just a fancy autocomplete." }
    ];

    const losingMessages = [
        "Hallucination!",
        "Your prompt was ambiguous.",
        "404: Alignment not found.",
        "Task failed successfully.",
        "It worked on my machine.",
        "Ethical dilemma detected."
    ];

    const reels = document.querySelectorAll('.reel');
    const spinButton = document.getElementById('spin-button');
    const tokenSpan = document.querySelector('#token-balance span');
    const message = document.getElementById('message');

    let tokens = 100;
    const spinCost = 10;
    let isSpinning = false;

    spinButton.addEventListener('click', handleSpin);

    async function handleSpin() {
        if (tokens < spinCost) {
            message.textContent = "Not enough tokens!";
            return;
        }

        isSpinning = true;
        spinButton.disabled = true;
        tokens -= spinCost;
        updateTokens();
        message.textContent = "Reticulating splines...";

        const results = [];
        const reelSpins = Array.from(reels).map((reel, i) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    reel.classList.add('spinning');
                    const spinInterval = setInterval(() => {
                        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                        reel.textContent = randomSymbol.symbol;
                    }, 100);

                    setTimeout(() => {
                        clearInterval(spinInterval);
                        reel.classList.remove('spinning');
                        const finalSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                        reel.textContent = finalSymbol.symbol;
                        results[i] = finalSymbol;
                        resolve();
                    }, 1000 + i * 500); // Stagger the stop time
                }, i * 200); // Stagger the start time
            });
        });

        await Promise.all(reelSpins);

        checkWin(results);
        isSpinning = false;
        spinButton.disabled = false;
    }

    function checkWin(results) {
        const firstSymbol = results[0].symbol;
        if (results.every(r => r.symbol === firstSymbol)) {
            const winData = symbols.find(s => s.symbol === firstSymbol);
            const winAmount = winData.payout;
            tokens += winAmount;
            message.textContent = `${winData.message} You win ${winAmount} tokens!`;
            updateTokens();
        } else {
            message.textContent = losingMessages[Math.floor(Math.random() * losingMessages.length)];
        }
    }

    function updateTokens() {
        tokenSpan.textContent = tokens;
    }

    // Initial setup
    reels.forEach(reel => {
        reel.textContent = symbols[0].symbol;
    });
    updateTokens();
});
