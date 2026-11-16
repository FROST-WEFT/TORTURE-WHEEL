
const SELECTIONS = [
    {
        name: "Elements",
        options: ["Cryo", "Pyro", "Hydro", "Electro", "Anemo", "Geo", "Dendro"],
        colors: {
            Cryo: "#91DCEB",
            Pyro: "#F28C70",
            Hydro: "#83B9F5",
            Electro: "#B69AEF",
            Anemo: "#8ED8BD",
            Geo: "#F6D47E",
            Dendro: "#8BCB79"
        },
        requiredSpins: 2
    },
    {
        name: "Weapon",
        options: ["Sword", "Claymore", "Polearm", "Bow", "Catalyst"],
        colors: {},
        requiredSpins: 1
    },
    {
        name: "Enemy",
        options: ["Mondstadt | Anemo Hypostasis", "Mondstadt | Electro Hypostasis", "Mondstadt | Cryo Regisvine", "Mondstadt | Cryo Hypostasis", "Mondstadt | Watcher - Fallen Vigil", "Liyue | Geo Hypostasis", "Liyue | Pyro Regisvine", "Liyue | Oceanid", "Liyue | Primo Geovishap", "Liyue | Ruin Serpent", "Liyue | Solitary Suanni", "Inazuma | Bathysmal Vishap Herd", "Inazuma | Golden Wolflord", "Inazuma | Hydro Hypostasis", "Inazuma | Maguu Kenki", "Inazuma | Perpetual Mechanical Array", "Inazuma | Pyro Hypostasis", "Inazuma | Thunder Manifestation", "Sumeru | Jadeplume Terrorshroom", "Sumeru | Electro Regisvine", "Sumeru | Aeonblight Drake", "Sumeru | Algorithm of Semi-Intransient Matrix of Overseer Network", "Sumeru | Dendro Hypostasis", "Sumeru | Setekh Wenut", "Sumeru | Iniquitous Baptist", "Fontaine | Icewind Suite", "Fontaine | Emperor of Fire and Iron", "Fontaine | Experimental Field Generator", "Fontaine | Millennial Pearl Seahorse", "Fontaine | Hydro Tulpa", "Fontaine | Legatus Golem", "Natlan | Goldflame Qucusaur Tyrant", "Natlan | Gluttonous Yumkasaur Mountain King", "Natlan | Secret Source Automaton - Configuration Device", "Natlan | Tenebrous Papilla", "Natlan | Wayward Hermetic Spiritspeaker", "Natlan | Lava Dragon Statue", "Natlan | Secret Source Automaton: Overseer Device", "Nod-Krai | Radiant Moonfly", "Nod-Krai | Knuckle Duckle", "Nod-Krai | Frostnight Herra", "Nod-Krai | Super-Heavy Landrover: Mechanized Fortress", "Nod-Krai | Lord of the Hidden Depths - Whisperer of Nightmares", "Nod-Krai | Radiant Moongecko", "Snezhnaya | Chimeric Winged Lion", "Snezhnaya | Immortal Construct"],
        colors: {},
        requiredSpins: 1
    },
    {
        name: "Additional Restriction",
        options: ["No Sprint", "No Shield", "No Elemental Burst", "Only Elemental Skill", "Only Normal Attacks"],
        colors: {},
        requiredSpins: 1
    }
];

const DEFAULT_COLOR = "#FFFFFF";
const WIN_COLOR = "#B69AEF";
const STROKE_COLOR = "#8962b6";

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const main = document.getElementById("main");
const selectionTitle = document.getElementById("selectionTitle");
const result = document.getElementById("result");
const spinButton = document.getElementById("spinButton");
const refreshButton = document.getElementById("refreshButton");
const hideButton = document.getElementById("hideButton");
const showButton = document.getElementById("showButton");

const CENTER = 500;
const RADIUS = 435;

let rotation = 0;
let spinning = false;
let selectionIndex = 0;
let spinsInSelection = 0;
let winners = [];
let winningIndices = [];
let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) audioContext = new AudioClass();
    }

    if (audioContext?.state === "suspended") {
        audioContext.resume();
    }

    return audioContext;
}

function tone(frequency, endFrequency, duration, type = "sine", volume = 0.08, delay = 0) {
    const audio = getAudioContext();
    if (!audio) return;

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + delay;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, endFrequency),
        start + duration
    );

    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start(start);
    oscillator.stop(start + duration);
}

function noise(duration, volume = 0.035, frequency = 1800) {
    const audio = getAudioContext();
    if (!audio) return;

    const bufferSize = Math.floor(audio.sampleRate * duration);
    const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();

    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);

    source.start();
}

function playSpinStart() {
    tone(100, 380, 0.35, "sawtooth", 0.045);
    noise(0.22, 0.025, 1200);
}

function playTick() {
    tone(1150, 680, 0.035, "square", 0.025);
}

function playWinner() {
    tone(520, 520, 0.2, "sine", 0.09);
    tone(690, 690, 0.25, "sine", 0.09, 0.12);
    tone(920, 920, 0.4, "sine", 0.1, 0.25);
    tone(1250, 1250, 0.5, "sine", 0.045, 0.38);
}

function playTransition() {
    tone(850, 110, 0.55, "sawtooth", 0.045);
    tone(180, 700, 0.65, "sine", 0.065, 0.35);
    noise(0.55, 0.045, 2600);
}

function playRefresh() {
    tone(1200, 90, 0.5, "sawtooth", 0.045);
    tone(300, 1500, 0.45, "sine", 0.07, 0.12);
    tone(1000, 180, 0.55, "triangle", 0.045, 0.3);
    noise(0.5, 0.055, 3200);
}

function playHide() {
    tone(650, 70, 0.75, "triangle", 0.065);
    tone(420, 55, 0.65, "sine", 0.045, 0.08);
    noise(0.65, 0.04, 900);
}

function playShow() {
    tone(70, 650, 0.75, "triangle", 0.065);
    tone(55, 420, 0.65, "sine", 0.045, 0.08);
    noise(0.65, 0.04, 900);
}

function drawWheel() {
    const selection = SELECTIONS[selectionIndex];
    const options = selection.options;
    const segmentAngle = (Math.PI * 2) / options.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(rotation);

    for (let i = 0; i < options.length; i++) {
        const startAngle = i * segmentAngle - Math.PI / 2;
        const endAngle = startAngle + segmentAngle;
        const isWinner = winningIndices.includes(i);

        const fillColor = isWinner
            ? (selection.colors[options[i]] || WIN_COLOR)
            : DEFAULT_COLOR;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, RADIUS, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.strokeStyle = STROKE_COLOR;
        ctx.lineWidth = 8;
        ctx.stroke();

        const middleAngle = startAngle + segmentAngle / 2;

        ctx.save();
        ctx.rotate(middleAngle);
        ctx.translate(RADIUS * 0.66, 0);

        if (Math.cos(middleAngle) < 0) {
            ctx.rotate(Math.PI);
        }

        const fontSize = Math.max(23, Math.min(42, 280 / options.length));

        ctx.font = `bold ${fontSize}px Anthro, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(80, 60, 100, 0.55)";
        ctx.strokeText(options[i], 0, 0);
        ctx.fillStyle = "#49385F";
        ctx.fillText(options[i], 0, 0);

        ctx.restore();
    }

    ctx.restore();
}

function secureRandomIndex(length) {
    const array = new Uint32Array(1);
    const limit = Math.floor(4294967296 / length) * length;
    let value;

    do {
        crypto.getRandomValues(array);
        value = array[0];
    } while (value >= limit);

    return value % length;
}

function animateSpin(winnerIndex) {
    return new Promise(resolve => {
        const options = SELECTIONS[selectionIndex].options;
        const segmentAngle = (Math.PI * 2) / options.length;

        const desiredRotation =
            (Math.PI * 2 - (winnerIndex + 0.5) * segmentAngle) %
            (Math.PI * 2);

        const currentRotation =
            ((rotation % (Math.PI * 2)) + Math.PI * 2) %
            (Math.PI * 2);

        const adjustment =
            (desiredRotation - currentRotation + Math.PI * 2) %
            (Math.PI * 2);

        const totalRotation = 7 * Math.PI * 2 + adjustment;
        const startRotation = rotation;
        const startTime = performance.now();
        const duration = 6000;
        let lastTickStep = Math.floor(startRotation / segmentAngle);

        playSpinStart();

        function animate(time) {
            const progress = Math.min((time - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 5);

            rotation = startRotation + totalRotation * eased;

            const currentTickStep = Math.floor(rotation / segmentAngle);

            if (currentTickStep > lastTickStep) {
                playTick();
                lastTickStep = currentTickStep;
            }

            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                rotation = desiredRotation;
                drawWheel();
                playWinner();
                resolve(options[winnerIndex]);
            }
        }

        requestAnimationFrame(animate);
    });
}

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function updateSelectionTitle() {
    selectionTitle.textContent =
        "Now Selecting: " + SELECTIONS[selectionIndex].name;
}

async function transitionToNextSelection() {
    await wait(3000);

    playTransition();

    const animation = canvas.animate(
        [
            { transform: "rotate(0deg)", filter: "blur(0px)" },
            { transform: "rotate(-10000deg)", filter: "blur(70px)", offset: 0.8 },
            { transform: "rotate(-18000deg)", filter: "blur(0px)" }
        ],
        {
            duration: 650,
            easing: "linear",
            fill: "forwards"
        }
    );

    await animation.finished;
    animation.cancel();

    canvas.style.transform = "";
    canvas.style.filter = "";

    rotation = 0;
    selectionIndex++;
    spinsInSelection = 0;
    winningIndices = [];

    updateSelectionTitle();
    drawWheel();
}

function getFinalResults() {
    const elements = winners[0].values;
    const weapon = winners[1].values[0];
    const enemy = winners[2].values[0];
    const restriction = winners[3].values[0];

    const sameElement = elements[0] === elements[1];

    const elementText = sameElement
        ? `${elements[0]} Only`
        : `${elements[0]} & ${elements[1]}`;

    const challengeText = `${elementText} ${weapon} only | ${restriction}`;

    return `${challengeText}<br><br>Enemy: ${enemy}`;
}

async function runSelection() {
    const selection = SELECTIONS[selectionIndex];

    for (let i = 0; i < selection.requiredSpins; i++) {
        const winnerIndex = secureRandomIndex(selection.options.length);
        const winningOption = await animateSpin(winnerIndex);

        winningIndices.push(winnerIndex);
        spinsInSelection++;

        if (!winners[selectionIndex]) {
            winners[selectionIndex] = {
                name: selection.name,
                values: []
            };
        }

        winners[selectionIndex].values.push(winningOption);

        if (i === 0 && selection.requiredSpins === 2) {
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
    }

    drawWheel();
}


async function startChallenge() {
    if (spinning || main.classList.contains("hidden")) return;

    getAudioContext();

    spinning = true;
    spinButton.disabled = true;
    refreshButton.disabled = true;
    hideButton.disabled = true;
    result.textContent = "";

    try {
        for (let i = 0; i < SELECTIONS.length; i++) {
            selectionIndex = i;
            spinsInSelection = 0;
            winningIndices = [];

            updateSelectionTitle();
            drawWheel();

            await runSelection();

            if (i < SELECTIONS.length - 1) {
                await transitionToNextSelection();
            }
        }

        result.innerHTML = getFinalResults();
        selectionTitle.textContent = "Challenge Decided!";
        spinButton.textContent = "CHALLENGE DECIDED";
        playWinner();
    } finally {
        spinning = false;
        spinButton.disabled = true;
        refreshButton.disabled = false;
        hideButton.disabled = false;
    }
}



async function refreshWheel() {
    if (spinning || main.classList.contains("hidden")) return;

    getAudioContext();
    spinning = true;

    spinButton.disabled = true;
    refreshButton.disabled = true;
    hideButton.disabled = true;

    playRefresh();

    const animation = canvas.animate(
        [
            { transform: "rotate(0deg)", filter: "blur(0px)" },
            { transform: "rotate(-10000deg)", filter: "blur(70px)", offset: 0.8 },
            { transform: "rotate(-30000deg)", filter: "blur(0px)" }
        ],
        {
            duration: 500,
            easing: "linear",
            fill: "forwards"
        }
    );

    await animation.finished;
    animation.cancel();

    canvas.style.transform = "";
    canvas.style.filter = "";

    rotation = 0;
    selectionIndex = 0;
    spinsInSelection = 0;
    winners = [];
    winningIndices = [];

    updateSelectionTitle();
    result.textContent = "Ready?";
    spinButton.textContent = "SPIN";
    drawWheel();

    spinning = false;
    spinButton.disabled = false;
    refreshButton.disabled = false;
    hideButton.disabled = false;
}


async function hideWheel() {
    if (spinning || main.classList.contains("hidden")) return;

    getAudioContext();
    spinning = true;

    spinButton.disabled = true;
    refreshButton.disabled = true;
    hideButton.disabled = true;

    playHide();
    main.classList.add("hiding");

    const wheelAnimation = canvas.animate(
        [
            { transform: "rotate(0deg)", filter: "blur(0px)" },
            { transform: "rotate(-10000deg)", filter: "blur(5px)" }
        ],
        {
            duration: 500,
            easing: "linear",
            fill: "forwards"
        }
    );

    await Promise.all([
        wheelAnimation.finished,
        wait(1400)
    ]);

    wheelAnimation.cancel();
    canvas.style.transform = "";
    canvas.style.filter = "";

    main.classList.remove("hiding");
    main.classList.add("hidden");

    showButton.hidden = false;
    refreshButton.disabled = false;
    hideButton.disabled = false;
    spinning = false;
}

function showWheel() {
    getAudioContext();
    playShow();

    main.classList.remove("hidden");
    main.classList.add("showing");

    showButton.hidden = true;
    spinButton.disabled = spinning;

    setTimeout(() => {
        main.classList.remove("showing");
    }, 1450);
}

spinButton.addEventListener("click", startChallenge);
refreshButton.addEventListener("click", refreshWheel);
hideButton.addEventListener("click", hideWheel);
showButton.addEventListener("click", showWheel);

drawWheel();
