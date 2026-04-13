document.addEventListener('DOMContentLoaded', () => {
    const symbols = ['🤖', '🧠', '💡', '💰', '🔥', '📈', '📉'];
    
    const reel1 = document.getElementById('reel1');
    const reel2 = document.getElementById('reel2');
    const reel3 = document.getElementById('reel3');
    const reels = [reel1, reel2, reel3];
    const spinButton = document.getElementById('spin-button');
    const betAmountInput = document.getElementById('bet-amount');
    const tokenBalanceSpan = document.getElementById('token-balance');
    const resultMessage = document.getElementById('result-message');

    const spinSound = new Audio('assets/sounds/spin.mp3');
    const winSound = new Audio('assets/sounds/win.mp3');
    spinSound.onerror = () => console.error("Error loading spin.mp3. Make sure the file exists in assets/sounds/");
    winSound.onerror = () => console.error("Error loading win.mp3. Make sure the file exists in assets/sounds/");


    let tokenBalance = 1000;

    spinButton.addEventListener('click', () => {
        const betAmount = parseInt(betAmountInput.value, 10);

        if (isNaN(betAmount) || betAmount <= 0) {
            resultMessage.textContent = 'Please enter a valid bet amount.';
            return;
        }

        if (betAmount > tokenBalance) {
            resultMessage.textContent = "You don't have enough tokens!";
            return;
        }

        tokenBalance -= betAmount;
        updateTokenBalance();
        resultMessage.textContent = '';

        spin();
    });

    function spin() {
        spinButton.disabled = true;
        spinSound.play().catch(e => console.error("Spin sound playback failed:", e));

        let spinDuration = 1000; // 1 second of spinning
        let spinInterval = 100;  // Update symbol every 100ms

        reels.forEach(reel => {
            reel.classList.add('spinning');
            const interval = setInterval(() => {
                reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            }, spinInterval);

            setTimeout(() => {
                clearInterval(interval);
                reel.classList.remove('spinning');
            }, spinDuration);
        });
        
        const spinResult = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
        ];

        setTimeout(() => {
            reels.forEach((reel, index) => {
                reel.textContent = spinResult[index];
            });

            checkWin(spinResult, parseInt(betAmountInput.value, 10));
            spinButton.disabled = false;
        }, spinDuration);
    }

    function checkWin(result, betAmount) {
        const [r1, r2, r3] = result;
        let won = false;

        if (r1 === r2 && r2 === r3) {
            // All three match
            const winnings = betAmount * 10;
            tokenBalance += winnings;
            resultMessage.textContent = `Jackpot! You won ${winnings} tokens!`;
            won = true;
        } else if (r1 === r2 || r2 === r3 || r1 === r3) {
            // Two match
            const winnings = betAmount * 2;
            tokenBalance += winnings;
            resultMessage.textContent = `Nice! You won ${winnings} tokens.`;
            won = true;
        } else {
            resultMessage.textContent = 'Try again!';
        }

        if(won){
            winSound.play().catch(e => console.error("Win sound playback failed:", e));
        }

        updateTokenBalance();
    }

    function updateTokenBalance() {
        tokenBalanceSpan.textContent = tokenBalance;
    }
});
