const symbols = ["🤖", "🧠", "💡", "⚡️", "🔥", "💯"];
const spinButton = document.getElementById("spin-button");
const tokenCount = document.getElementById("token-count");
const reels = document.querySelectorAll(".reel");
const message = document.getElementById("message");

spinButton.addEventListener("click", () => {
    let tokens = parseInt(tokenCount.textContent);
    if (tokens > 0) {
        tokens--;
        tokenCount.textContent = tokens;
        message.textContent = "";
        spin();
    } else {
        message.textContent = "Game Over! No more tokens.";
    }
});

function spin() {
    spinButton.disabled = true;
    let spinCount = 0;
    const spinInterval = setInterval(() => {
        spinCount++;
        reels.forEach(reel => {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            reel.textContent = randomSymbol;
        });
        if (spinCount > 10) {
            clearInterval(spinInterval);
            const results = [];
            reels.forEach(reel => {
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.textContent = randomSymbol;
                results.push(randomSymbol);
            });
            checkWin(results);
            spinButton.disabled = false;
        }
    }, 100);
}

function checkWin(results) {
    let win = false;
    let winAmount = 0;

    if (results[0] === results[1] && results[1] === results[2]) {
        win = true;
        if (results[0] === "💯") {
            winAmount = 100;
        } else {
            winAmount = 50;
        }
    } else if (results[0] === results[1] || results[1] === results[2]) {
        win = true;
        winAmount = 5;
    }

    if (win) {
        let tokens = parseInt(tokenCount.textContent);
        tokens += winAmount;
        tokenCount.textContent = tokens;
        message.textContent = `You win ${winAmount} tokens!`;
    }
}