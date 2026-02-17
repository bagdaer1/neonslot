/**
 * Neon Slots Logic - 5 Reels, 20 Paylines
 */

const SYMBOLS = [
    { name: 'cherry', value: 2, bgPos: '0% 0%' },           // Row 0, Col 0
    { name: 'lemon', value: 3, bgPos: '50% 0%' },           // Row 0, Col 1
    { name: 'bell', value: 5, bgPos: '100% 0%' },           // Row 0, Col 2
    { name: 'seven', value: 50, bgPos: '0% 50%' },          // Row 1, Col 0
    { name: 'star', value: 10, bgPos: '50% 50%' },          // Row 1, Col 1
    { name: 'diamond', value: 20, bgPos: '100% 50%' },      // Row 1, Col 2
    { name: 'crown', value: 30, bgPos: '0% 100%' },         // Row 2, Col 0
    { name: 'bonus', value: 0, bgPos: '50% 100%' },         // Row 2, Col 1 (bonus scatter)
    { name: 'horseshoe', value: 15, bgPos: '100% 100%' }    // Row 2, Col 2
];

// REEL COUNT
const REEL_COUNT = 5;
const ROW_COUNT = 3; // We only check middle row? Or all rows? 
// Standard 20 lines usually involves grid 5x3.
// We need to know the symbol at each position in the 5x3 grid.
// Currently our HTML structure shows "reel-strip".
// We need to know which symbols are visible.
// Our current logic: `cleanupReels` sets the stopping symbol at the "center".
// But for 20 lines, we need to know Top, Middle, Bottom symbols for each reel.
// Let's assume we control the "Middle" symbol index, and thus Top is index-1, Bottom is index+1.

// 20 Paylines Definition (0=Top, 1=Middle, 2=Bottom)
// Coordinates: [Reel0_Row, Reel1_Row, Reel2_Row, Reel3_Row, Reel4_Row]
const PAYLINES = [
    [1, 1, 1, 1, 1], // 1. Middle
    [0, 0, 0, 0, 0], // 2. Top
    [2, 2, 2, 2, 2], // 3. Bottom
    [0, 1, 2, 1, 0], // 4. V
    [2, 1, 0, 1, 2], // 5. Inverted V
    [0, 0, 1, 2, 2], // 6. Step down
    [2, 2, 1, 0, 0], // 7. Step up
    [1, 0, 1, 2, 1], // 8. W
    [1, 2, 1, 0, 1], // 9. M
    [0, 1, 0, 1, 0], // 10. ZigZag Top
    [2, 1, 2, 1, 2], // 11. ZigZag Bottom
    [0, 1, 0, 0, 0], // 12
    [2, 1, 2, 2, 2], // 13
    [0, 0, 1, 0, 0], // 14
    [2, 2, 1, 2, 2], // 15
    [1, 1, 0, 1, 1], // 16
    [1, 1, 2, 1, 1], // 17
    [0, 2, 0, 2, 0], // 18 
    [2, 0, 2, 0, 2], // 19
    [0, 2, 2, 2, 0]  // 20
];

let credits = 100000;
let bet = 100;
let isSpinning = false;
let autoSpin = false;
let freeSpins = 0;
let freeSpinsTotalWin = 0; // Accumulate free spins wins

// Money tracking
let moneyIn = 0;
let moneyOut = 0;
let targetRTP = 99; // Default 99%

// Progressive loss protection
let startingBalance = 100000;
let spinCount = 0;
let sessionProfit = 0; // Track profit/loss from starting balance

// Level progression system
let lifetimeWinnings = 0; // Total cumulative winnings
let currentLevel = 1;
const LEVELS = [
    { level: 1, requiredWinnings: 0, maxBet: 2000, freeSpins: 10, icon: '⭐' },
    { level: 2, requiredWinnings: 50000, maxBet: 5000, freeSpins: 15, icon: '💎' },
    { level: 3, requiredWinnings: 100000, maxBet: 10000, freeSpins: 20, icon: '👑' }
];

// DOM Elements
const elCredits = document.getElementById('credits');
const elBet = document.getElementById('bet');
const elWin = document.getElementById('win');
const elMessage = document.getElementById('message-area');
const elMoneyIn = document.getElementById('money-in');
const elMoneyOut = document.getElementById('money-out');
const elActualRTP = document.getElementById('actual-rtp');
const elTargetRTPValue = document.getElementById('target-rtp-value');
const sliderRTP = document.getElementById('rtp-slider');
const elFreeSpinsTotal = document.getElementById('free-spins-total');
const elFreeSpinsAmount = document.getElementById('free-spins-amount');
const elLevelProgress = document.getElementById('level-progress');
const btnSpin = document.getElementById('btn-spin');
const btnIncrease = document.getElementById('btn-increase');
const btnDecrease = document.getElementById('btn-decrease');
const btnMax = document.getElementById('btn-max');
const reels = [
    document.getElementById('reel-1').querySelector('.reel-strip'),
    document.getElementById('reel-2').querySelector('.reel-strip'),
    document.getElementById('reel-3').querySelector('.reel-strip'),
    document.getElementById('reel-4').querySelector('.reel-strip'),
    document.getElementById('reel-5').querySelector('.reel-strip')
];
const layerPaylines = document.querySelector('.paylines-layer');

// Initialize
function init() {
    updateUI();
    updateLevelProgress(); // Initialize level bar display
    // Create initial strips
    reels.forEach(strip => {
        strip.innerHTML = '';
        generateStrip(strip, 30); // Generate 30 random symbols
    });
}

function generateStrip(element, count) {
    for (let i = 0; i < count; i++) {
        const symbolIdx = Math.floor(Math.random() * SYMBOLS.length);
        const symbol = createSymbolElement(symbolIdx);
        element.appendChild(symbol);
    }
}

function createSymbolElement(symbolIndex) {
    const div = document.createElement('div');
    div.classList.add('symbol');
    div.classList.add(`symbol-${symbolIndex}`); // Use CSS class instead of inline style
    div.dataset.index = symbolIndex;
    return div;
}

function updateUI() {
    elCredits.innerText = credits.toLocaleString();
    elBet.innerText = bet;
    elMoneyIn.innerText = moneyIn.toLocaleString();
    elMoneyOut.innerText = moneyOut.toLocaleString();

    const actualRTP = moneyIn > 0 ? ((moneyOut / moneyIn) * 100).toFixed(1) : 0;
    elActualRTP.innerText = actualRTP + '%';
    elActualRTP.style.color = actualRTP >= targetRTP - 5 ? '#0f0' : actualRTP >= targetRTP - 15 ? '#ff0' : '#f00';

    // Update message with spin count and limits when idle
    if (spinCount > 0 && !isSpinning && elMessage.innerText.includes('GOOD LUCK')) {
        const currentLoss = startingBalance - credits;
        const maxLoss = getMaxLossAllowed();
        const lossPercent = ((currentLoss / startingBalance) * 100).toFixed(1);
        const maxLossPercent = ((maxLoss / startingBalance) * 100).toFixed(0);
        elMessage.innerText = `Spin ${spinCount} | Loss: ${lossPercent}% / ${maxLossPercent}%`;
    }

    if (freeSpins > 0) {
        btnSpin.innerText = `FREE (${freeSpins})`;
        btnSpin.disabled = true;
        elMessage.innerText = `FREE SPINS: ${freeSpins}`;
        elMessage.style.color = '#ff00ff';
    } else {
        btnSpin.innerText = 'SPIN';
        btnSpin.disabled = isSpinning;
        elMessage.style.color = 'var(--accent-neon)';
    }

    btnIncrease.disabled = isSpinning || freeSpins > 0;
    btnDecrease.disabled = isSpinning || freeSpins > 0;
    btnMax.disabled = isSpinning || freeSpins > 0;
}

// RTP Slider Event
sliderRTP.addEventListener('input', (e) => {
    targetRTP = parseInt(e.target.value);
    elTargetRTPValue.innerText = targetRTP;
    recalculateWeights();
});

// Betting
btnIncrease.addEventListener('click', () => {
    const maxBet = getMaxBetForCurrentLevel();
    if (bet < maxBet) bet += 20;
    updateUI();
});
btnDecrease.addEventListener('click', () => { if (bet > 20) bet -= 20; updateUI(); });
btnMax.addEventListener('click', () => {
    bet = getMaxBetForCurrentLevel();
    updateUI();
});

// Dynamic weight recalculation based on RTP
function recalculateWeights() {
    // Rough approximation: higher RTP = more balanced weights (all symbols more common)
    // Lower RTP = more skewed weights (high-value symbols rare)
    const rtpFactor = (targetRTP - 70) / 29; // Scale 0-1 from 70%-99%

    // Base weights at 70% RTP (very skewed)
    const baseWeights70 = [20, 20, 15, 10, 5, 3, 1, 0.5, 8];
    // Target weights at 99% RTP (more balanced)
    const baseWeights99 = [15, 15, 12, 12, 10, 8, 5, 2, 10];

    // Interpolate between the two
    for (let i = 0; i < SYMBOLS.length; i++) {
        weights[i] = Math.round(baseWeights70[i] + (baseWeights99[i] - baseWeights70[i]) * rtpFactor);
    }

    // Recalculate total
    const newTotal = weights.reduce((a, b) => a + b, 0);
    console.log(`RTP ${targetRTP}% - Weights:`, weights, `Total: ${newTotal}`);
}

// Spin Logic
btnSpin.addEventListener('click', () => {
    if (freeSpins > 0) startSpin(true);
    else if (credits >= bet) startSpin(false);
    else elMessage.innerText = "NOT ENOUGH CREDITS!";
});

// Weighted Logic for ~99% RTP (5 Reels)
// Hitting 5 of a kind is rare.
// Previous weights were for 3 reels. 
// We need new weights.
// Let's use a simple balanced weight for now, tuning RTP exactly for 5-reel 20-line is complex math.
// Roughly: Low value symbols frequent, High value rare.
const weights = [15, 15, 12, 12, 10, 8, 5, 2, 10]; // Total approx 89, horseshoe medium frequency
const totalWeight = weights.reduce((a, b) => a + b, 0);

const getWeightedSymbolIndex = () => {
    let rand = Math.random() * totalWeight;
    for (let k = 0; k < weights.length; k++) {
        if (rand < weights[k]) return k;
        rand -= weights[k];
    }
    return weights.length - 1;
};

// Level progression functions
function updateLevelProgress() {
    // Determine current level based on lifetime winnings
    let newLevel = 1;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (lifetimeWinnings >= LEVELS[i].requiredWinnings) {
            newLevel = LEVELS[i].level;
            break;
        }
    }

    // Check for level up
    if (newLevel > currentLevel) {
        currentLevel = newLevel;
        showLevelUpMessage(currentLevel);
    }

    // Update visual progress bar
    const currentLevelData = LEVELS[currentLevel - 1];
    const nextLevelData = LEVELS[currentLevel]; // undefined if max level

    let progressPercent = 0;
    if (nextLevelData) {
        const progressInCurrentLevel = lifetimeWinnings - currentLevelData.requiredWinnings;
        const totalNeededForNextLevel = nextLevelData.requiredWinnings - currentLevelData.requiredWinnings;
        progressPercent = (progressInCurrentLevel / totalNeededForNextLevel) * 100;
        progressPercent = Math.min(100, progressPercent);
    } else {
        progressPercent = 100; // Max level reached
    }

    // Update progress bar height (each level takes 33.33% of the bar)
    const baseHeight = ((currentLevel - 1) / LEVELS.length) * 100;
    const levelProgress = progressPercent * (100 / LEVELS.length) / 100;
    const totalHeight = baseHeight + levelProgress;

    elLevelProgress.style.height = totalHeight + '%';
    elLevelProgress.style.width = totalHeight + '%'; // For horizontal mobile layout

    // Update level item states
    document.querySelectorAll('.level-item').forEach((item) => {
        const level = parseInt(item.dataset.level);
        item.classList.remove('unlocked', 'active');

        if (level < currentLevel) {
            item.classList.add('unlocked');
        } else if (level === currentLevel) {
            item.classList.add('unlocked', 'active');
        }
    });
}

function showLevelUpMessage(level) {
    const levelData = LEVELS[level - 1];
    elMessage.innerText = `LEVEL UP! ${levelData.icon} LVL ${level} - MAX BET ${levelData.maxBet} | ${levelData.freeSpins} FREE SPINS!`;
    elMessage.style.color = '#ffdd00';

    // Flash effect
    document.body.style.backgroundColor = '#332200';
    setTimeout(() => document.body.style.backgroundColor = 'var(--dark-bg)', 800);

    if (typeof slotSounds !== 'undefined') {
        slotSounds.playBigWinSound();
    }
}

function getMaxBetForCurrentLevel() {
    return LEVELS[currentLevel - 1].maxBet;
}

function getFreeSpinsForCurrentLevel() {
    return LEVELS[currentLevel - 1].freeSpins;
}

// Progressive loss protection logic
function getMaxLossAllowed() {
    if (spinCount <= 30) return startingBalance * 0.10; // 10% max loss
    if (spinCount <= 60) return startingBalance * 0.20; // 20% max loss
    return startingBalance * 0.30; // 30% max loss
}

function getMaxWinAllowed() {
    if (spinCount <= 100) return startingBalance * 0.20; // 20% max win
    if (spinCount <= 200) return startingBalance * 0.10; // 10% max win
    return Infinity; // No limit after 200 spins
}

function shouldForceWin() {
    const currentLoss = startingBalance - credits;
    const maxLossAllowed = getMaxLossAllowed();

    // Force win if approaching loss limit (within 80%)
    if (currentLoss >= maxLossAllowed * 0.8) {
        return true;
    }
    return false;
}

function shouldReduceWin() {
    const currentProfit = credits - startingBalance;
    const maxWinAllowed = getMaxWinAllowed();

    // Reduce win if exceeding limit
    if (currentProfit >= maxWinAllowed) {
        return true;
    }
    return false;
}

async function startSpin(isFree) {
    if (isSpinning) return;
    isSpinning = true;

    spinCount++; // Increment spin count

    if (!isFree) {
        credits -= bet;
        moneyIn += bet; // Track money in
    }
    elWin.innerText = "0";
    elMessage.innerText = isFree ? "FREE SPINNING..." : "SPINNING...";
    updateUI();
    layerPaylines.innerHTML = ''; // Clear lines

    // Play spin sound
    if (typeof slotSounds !== 'undefined') {
        slotSounds.playSpinSound();
    }

    // Determine if we should force a win
    const forceWin = shouldForceWin();
    const reduceWin = shouldReduceWin();

    // Generate result grid
    const centerIndices = [];
    for (let i = 0; i < REEL_COUNT; i++) {
        if (forceWin && i < 3) {
            // Force matching symbols on first 3 reels for guaranteed win
            if (i === 0) {
                centerIndices.push(getWeightedSymbolIndex());
            } else {
                centerIndices.push(centerIndices[0]); // Match first symbol
            }
        } else {
            centerIndices.push(getWeightedSymbolIndex());
        }
    }

    // Animate
    const spinPromises = reels.map((strip, i) => {
        return new Promise(resolve => {
            const extraSymbols = 10 + i * 5;

            // Append randoms
            for (let k = 0; k < extraSymbols; k++) {
                strip.appendChild(createSymbolElement(Math.floor(Math.random() * SYMBOLS.length)));
            }

            // We need to place our specific 3 symbols for the stopping position.
            // Center is `centerIndices[i]`.
            // Top: Random (or weighted?)
            // Bottom: Random
            // Actually to make the "Wheel" feel, we should have a fixed sequence or neighbor symbols.
            // But fully random per slot is standard for digital RNG.

            const topIdx = Math.floor(Math.random() * SYMBOLS.length);
            const bottomIdx = Math.floor(Math.random() * SYMBOLS.length);

            // Append Sequence: Top -> Center -> Bottom (Visual order in DOM depends on CSS flow)
            // If DOM is Top to Bottom:
            // We are scrolling UP (transform translateY negative).
            // So last elements in DOM are at the bottom.
            // We want the resulting view to show [Top, Center, Bottom].
            // So we append them in that order.

            strip.appendChild(createSymbolElement(topIdx));
            strip.appendChild(createSymbolElement(centerIndices[i]));
            strip.appendChild(createSymbolElement(bottomIdx));

            // Append buffer
            strip.appendChild(createSymbolElement(Math.floor(Math.random() * SYMBOLS.length)));

            // Calculate offset to center the `Center` symbol.
            // Symbol height has changed to 60px (mobile) or 100px?
            // Let's get it dynamically.
            const symbolHeight = strip.children[0].getBoundingClientRect().height || 60;
            const containerHeight = strip.parentElement.clientHeight || 180;

            // Target is 3rd from last (since we added Top, Center, Bottom, Buffer).
            // Index:
            // Buffer: len-1
            // Bottom: len-2
            // Center: len-3
            // Top:    len-4

            const targetIndex = strip.children.length - 3;
            const finalY = Math.round(- (targetIndex * symbolHeight) + (containerHeight / 2 - symbolHeight / 2));

            // 3x faster during free spins
            const spinDuration = isFree ? 0.5 : 1.5;
            const reelDelay = isFree ? 0.1 : 0.3;

            strip.style.transition = `transform ${spinDuration + i * reelDelay}s cubic-bezier(0.25, 1, 0.5, 1)`;
            strip.style.transform = `translateY(${finalY}px)`;

            setTimeout(() => {
                // Store the visible symbols for this reel for win checking
                // Grid coordinates: [Col][Rows]
                // Col i, Row 0 (Top) = topIdx
                // Col i, Row 1 (Center) = centerIndices[i]
                // Col i, Row 2 (Bottom) = bottomIdx
                strip.dataset.top = topIdx;
                strip.dataset.center = centerIndices[i];
                strip.dataset.bottom = bottomIdx;

                // Play reel stop sound
                if (typeof slotSounds !== 'undefined') {
                    slotSounds.playReelStopSound();
                }

                resolve();
            }, (spinDuration * 1000) + i * (reelDelay * 1000));
        });
    });

    await Promise.all(spinPromises);

    requestAnimationFrame(() => {
        cleanupReels(centerIndices);
        checkWin_5Reel();
        isSpinning = false;
        updateUI();

        if (freeSpins > 0) {
            freeSpins--;
            updateUI();
            if (freeSpins > 0) {
                setTimeout(() => startSpin(true), 1000);
            } else {
                // Free spins completed - pay out total winnings
                if (freeSpinsTotalWin > 0) {
                    credits += freeSpinsTotalWin;
                    moneyOut += freeSpinsTotalWin;
                    lifetimeWinnings += freeSpinsTotalWin; // Track lifetime winnings for level progression
                    elMessage.innerText = `FREE SPINS COMPLETED! TOTAL WIN: ${freeSpinsTotalWin}!`;
                    elWin.innerText = freeSpinsTotalWin;

                    // Update level progress after free spins payout
                    updateLevelProgress();

                    // Play big win sound for total
                    if (typeof slotSounds !== 'undefined') {
                        slotSounds.playBigWinSound();
                    }
                } else {
                    elMessage.innerText = "FREE SPINS COMPLETED!";
                }

                // Hide panel and reset after completion
                setTimeout(() => {
                    elFreeSpinsTotal.style.display = 'none';
                }, 3000);

                freeSpinsTotalWin = 0; // Reset accumulator
                elFreeSpinsAmount.innerText = '0';
                updateUI();
            }
        }
    });
}

function cleanupReels(centerIndices) {
    reels.forEach((strip, i) => {
        strip.style.transition = 'none';

        const top = parseInt(strip.dataset.top);
        const center = parseInt(strip.dataset.center);
        const bottom = parseInt(strip.dataset.bottom);

        strip.innerHTML = '';

        // Add just what is needed to fill the view
        strip.appendChild(createSymbolElement(top));
        strip.appendChild(createSymbolElement(center));
        strip.appendChild(createSymbolElement(bottom));
        strip.appendChild(createSymbolElement(Math.floor(Math.random() * SYMBOLS.length))); // buffer

        // With 3 items, center is index 1.
        // We want Center to be at 60px (middle of 180px container).
        // Item 0 (Top) at 0px.
        // Item 1 (Center) at 60px.
        // Item 2 (Bottom) at 120px.
        // Item 3 (Buffer) at 180px.

        // If we set transform to 0, Item 0 is at 0px. Item 1 is at 60px.
        // This MATCHES the visual end state of the spin where Center (Target) was at 60px.
        strip.style.transform = 'translateY(0px)';
    });
}

function checkWin_5Reel() {
    let totalWin = 0;
    let winLines = []; // { lineIndex, symbol, count }

    // Build the Grid State [Col][Row]
    const grid = [];
    for (let i = 0; i < REEL_COUNT; i++) {
        const strip = reels[i];
        grid[i] = [
            parseInt(strip.dataset.top),
            parseInt(strip.dataset.center),
            parseInt(strip.dataset.bottom)
        ];
    }

    // Check Bonus (Scatter) - appearing anywhere
    let bonusCount = 0;
    for (let c = 0; c < 5; c++) {
        for (let r = 0; r < 3; r++) {
            if (SYMBOLS[grid[c][r]].name === 'bonus') bonusCount++;
        }
    }
    if (bonusCount >= 3) {
        triggerBonus();
    }

    // Check 20 Paylines
    const betPerLine = bet / 20;

    PAYLINES.forEach((pattern, lineIdx) => {
        // pattern is [r0, r1, r2, r3, r4] (row indices for each col)
        const firstSymbolIdx = grid[0][pattern[0]];
        const firstSymbol = SYMBOLS[firstSymbolIdx];

        if (firstSymbol.name === 'bonus') return; // Bonus is scatter usually

        let count = 1;
        for (let c = 1; c < 5; c++) {
            const symIdx = grid[c][pattern[c]];
            // Simple match, no Wilds yet
            if (symIdx === firstSymbolIdx) {
                count++;
            } else {
                break;
            }
        }

        if (count >= 3) {
            // WIN
            let multiplier = 0;
            if (count === 3) multiplier = firstSymbol.value * 0.5; // reduced for frequency
            if (count === 4) multiplier = firstSymbol.value * 2;
            if (count === 5) multiplier = firstSymbol.value * 10;

            // Heuristic adjustments because original values were for 3-reel match
            // Original: Cherry(2), 7(50).
            // Here: 5 Cherries = 2 * 10 = 20x line bet.

            let win = Math.max(1, Math.floor(betPerLine * multiplier));
            if (freeSpins > 0) win *= 2;

            totalWin += win;
            winLines.push({ lineIdx, count });
        }
    });

    // Clear previous highlights
    document.querySelectorAll('.symbol.win-highlight').forEach(el => el.classList.remove('win-highlight'));

    if (totalWin > 0) {
        // Apply win reduction if needed
        const currentProfit = credits - startingBalance;
        const maxWinAllowed = getMaxWinAllowed();

        if (currentProfit + totalWin > maxWinAllowed) {
            // Reduce win to stay within limit
            const excessWin = (currentProfit + totalWin) - maxWinAllowed;
            totalWin = Math.max(bet, totalWin - excessWin); // At least return bet
            elMessage.innerText = "WIN CAPPED TO LIMIT";
        }

        // During free spins, accumulate wins instead of adding immediately
        if (freeSpins > 0) {
            freeSpinsTotalWin += totalWin;
            elWin.innerText = totalWin;
            elFreeSpinsAmount.innerText = freeSpinsTotalWin.toLocaleString();
            elMessage.innerText = `FREE SPIN WIN ${totalWin}!`;
            animateWinLines(winLines);
        } else {
            // Normal spin - add win immediately
            credits += totalWin;
            moneyOut += totalWin; // Track money out
            lifetimeWinnings += totalWin; // Track lifetime winnings for level progression
            elWin.innerText = totalWin;
            elCredits.innerText = credits.toLocaleString();
            elMessage.innerText = `WIN ${totalWin}!`;
            animateWinLines(winLines);

            // Update level progress
            updateLevelProgress();
            console.log(`Win added! Total lifetime: ${lifetimeWinnings}, Current level: ${currentLevel}`);
        }

        // Play win sound
        if (typeof slotSounds !== 'undefined') {
            const betPerLine = bet / 20;
            if (totalWin > betPerLine * 50) {
                slotSounds.playBigWinSound(); // Big win
            } else {
                slotSounds.playWinSound(totalWin); // Regular win
            }
        }

        // Highlight winning symbols
        winLines.forEach(win => {
            const pattern = PAYLINES[win.lineIdx];
            for (let col = 0; col < win.count; col++) {
                const row = pattern[col];
                // visual row 0, 1, 2 correpsonds to child indices:
                // Grid State was built from:
                // Row 0 (Top) -> dataset.top
                // Row 1 (Center) -> dataset.center
                // Row 2 (Bottom) -> dataset.bottom

                // In cleanupReels, we appended:
                // Child 0: Top
                // Child 1: Center
                // Child 2: Bottom
                // Child 3: Buffer

                // So Row index maps directly to child index!
                const symbolEl = reels[col].children[row];
                if (symbolEl) symbolEl.classList.add('win-highlight');
            }
        });
    } else {
        if (freeSpins === 0) elMessage.innerText = "TRY AGAIN";
    }
}

function triggerBonus() {
    // Don't stack free spins - only set if not already in free spins
    if (freeSpins === 0) {
        freeSpins = getFreeSpinsForCurrentLevel(); // Use level-based count
        freeSpinsTotalWin = 0;
        elFreeSpinsAmount.innerText = '0';
        elFreeSpinsTotal.style.display = 'block'; // Show panel
    }
    elMessage.innerText = `BONUS! ${freeSpins} FREE SPINS!`;
    elMessage.style.color = "#ff0000";
    document.body.style.backgroundColor = '#200';
    setTimeout(() => document.body.style.backgroundColor = 'var(--dark-bg)', 500);

    // Play bonus sound
    if (typeof slotSounds !== 'undefined') {
        slotSounds.playBonusSound();
    }
}

function animateWinLines(winLines) {
    // Draw lines
    winLines.forEach(win => {
        const pattern = PAYLINES[win.lineIdx];
        // pattern is array of row indices for cols 0..4
        // We can draw an SVG line or simple divs.
        // Let's use simple divs connecting centers.
        // Or simpler: Just highlight the symbols?
        // User asked for "lines in animation".
        // Let's create a polyline SVG or just divs.

        // Quick visual: Highlight the winning symbols
        /*
        pattern.forEach((row, col) => {
            if (col < win.count) {
                 // Highlight grid[col][row]
            }
        });
        */

        // Draw the line on overlay
        drawPolyline(pattern, win.count, win.lineIdx);
    });
}

function drawPolyline(pattern, count, lineIndex) {
    // We can use SVG for smooth lines.
    // Let's construct an SVG if not exists
    let svg = layerPaylines.querySelector('svg');
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.width = '100%';
        svg.style.height = '100%';
        layerPaylines.appendChild(svg);
    }

    // Calculate coordinates
    // Col width is ~20% of container. Row height is 33%.
    // Centers: Col i => (i * 20%) + 10%
    // Row r => (r * 33.3%) + 16.6%

    let points = "";
    for (let i = 0; i < count; i++) {
        const x = (i * 20 + 10) + '%';
        const y = (pattern[i] * (100 / 3) + (100 / 6)) + '%';
        points += `${x},${y} `;
    }

    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", points);
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", `hsl(${lineIndex * 18}, 100%, 50%)`);
    polyline.setAttribute("stroke-width", "4");
    polyline.setAttribute("stroke-linecap", "round");
    polyline.setAttribute("stroke-linejoin", "round");
    polyline.classList.add('win-line-anim');

    // Add glowing effect
    polyline.style.filter = "drop-shadow(0 0 5px white)";

    svg.appendChild(polyline);
}

init();
