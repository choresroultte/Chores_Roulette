(() => {
    "use strict";

    // =========================
    // CHORES ROULETTE
    // =========================

    const DEFAULT_CHORES = [
        "Wash Dishes",
        "Sweep Floor",
        "Take Out Trash",
        "Clean Bedroom",
        "Fold Laundry"
    ];

    const COLORS = [
        "#8b5cf6",
        "#22c55e",
        "#facc15",
        "#ef4444",
        "#3b82f6",
        "#ec4899",
        "#14b8a6",
        "#f97316",
        "#a855f7",
        "#84cc16"
    ];

    const wheel = document.getElementById("wheel");
    const ctx = wheel ? wheel.getContext("2d") : null;

    const spinBtn = document.getElementById("spinBtn");
    const choreForm = document.getElementById("choreForm");
    const choreInput = document.getElementById("choreInput");
    const choreList = document.getElementById("choreList");
    const result = document.getElementById("result");

    const resetBtn = document.getElementById("resetBtn");
    const clearBtn = document.getElementById("clearBtn");

    const settingsBtn = document.getElementById("settingsBtn");
    const settingsPanel = document.getElementById("settingsPanel");
    const closeSettingsBtn =
        document.getElementById("closeSettingsBtn");

    const darkModeToggle =
        document.getElementById("darkModeToggle");
    const soundToggle =
        document.getElementById("soundToggle");

    if (
        !wheel ||
        !ctx ||
        !spinBtn ||
        !choreForm ||
        !choreInput ||
        !choreList ||
        !result
    ) {
        console.error(
            "Chores Roulette: May nawawalang HTML element. " +
            "Check ang index.html."
        );
        return;
    }

    // =========================
    // STORAGE
    // =========================

    function loadStorage(key, fallback) {
        try {
            const value = localStorage.getItem(key);

            return value === null
                ? fallback
                : JSON.parse(value);
        } catch (error) {
            console.warn("Storage unavailable:", error);
            return fallback;
        }
    }

    function saveStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn("Could not save settings:", error);
        }
    }

    const savedChores = loadStorage(
        "choresRouletteChores",
        DEFAULT_CHORES
    );

    let chores = Array.isArray(savedChores)
        ? savedChores.filter(
            chore =>
                typeof chore === "string" &&
                chore.trim() !== ""
        )
        : [...DEFAULT_CHORES];

    let isSpinning = false;
    let currentRotation = 0;
    let spinTimeout = null;
    let audioContext = null;

    // =========================
    // SAVE CHORES
    // =========================

    function saveChores() {
        saveStorage("choresRouletteChores", chores);
    }

    // =========================
    // DRAW ROULETTE WHEEL
    // =========================

    function drawWheel() {
        const size = wheel.width;
        const center = size / 2;
        const radius = center - 8;

        ctx.clearRect(0, 0, size, size);

        if (chores.length === 0) {
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.fillStyle = "#e5e7eb";
            ctx.fill();

            ctx.fillStyle = "#374151";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Add Chores!", center, center);

            return;
        }

        const sliceAngle = (Math.PI * 2) / chores.length;

        chores.forEach((chore, index) => {
            const startAngle =
                -Math.PI / 2 + index * sliceAngle;

            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(
                center,
                center,
                radius,
                startAngle,
                endAngle
            );
            ctx.closePath();

            ctx.fillStyle = COLORS[index % COLORS.length];
            ctx.fill();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Chore label
            ctx.save();

            ctx.translate(center, center);
            ctx.rotate(startAngle + sliceAngle / 2);

            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 15px Arial";

            let label = chore;

            if (label.length > 19) {
                label = label.slice(0, 16) + "...";
            }

            ctx.shadowColor = "rgba(0,0,0,0.3)";
            ctx.shadowBlur = 2;

            ctx.fillText(
                label,
                radius - 18,
                0,
                radius * 0.65
            );

            ctx.restore();
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(center, center, 15, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.strokeStyle = "#374151";
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // =========================
    // DISPLAY CHORE LIST
    // =========================

    function renderChores() {
        choreList.innerHTML = "";

        chores.forEach((chore, index) => {
            const item = document.createElement("li");

            const name = document.createElement("span");
            name.textContent = chore;

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.textContent = "✖";
            removeBtn.setAttribute(
                "aria-label",
                "Remove " + chore
            );

            removeBtn.disabled = isSpinning;

            removeBtn.addEventListener("click", () => {
                if (isSpinning) return;

                chores.splice(index, 1);

                saveChores();
                renderAll();

                result.textContent = chores.length
                    ? "Chore removed! Spin the wheel!"
                    : "Your list is empty. Add some chores!";
            });

            item.appendChild(name);
            item.appendChild(removeBtn);

            choreList.appendChild(item);
        });
    }

    // =========================
    // UPDATE SCREEN
    // =========================

    function renderAll() {
        renderChores();
        drawWheel();

        spinBtn.disabled =
            isSpinning || chores.length === 0;

        if (resetBtn) {
            resetBtn.disabled = isSpinning;
        }

        if (clearBtn) {
            clearBtn.disabled = isSpinning;
        }

        if (choreInput) {
            choreInput.disabled = isSpinning;
        }

        const addButton = choreForm.querySelector(
            'button[type="submit"]'
        );

        if (addButton) {
            addButton.disabled = isSpinning;
        }
    }

    // =========================
    // ADD CHORE
    // =========================

    choreForm.addEventListener("submit", event => {
        event.preventDefault();

        if (isSpinning) return;

        const newChore = choreInput.value.trim();

        if (!newChore) {
            result.textContent = "Please enter a chore!";
            choreInput.focus();
            return;
        }

        const alreadyExists = chores.some(
            chore =>
                chore.toLowerCase() ===
                newChore.toLowerCase()
        );

        if (alreadyExists) {
            result.textContent =
                "That chore is already on your list!";
            choreInput.focus();
            return;
        }

        chores.push(newChore);

        saveChores();
        renderAll();

        choreInput.value = "";
        choreInput.focus();

        result.textContent =
            "Chore added! Ready to spin? 🎯";
    });

    // =========================
    // REMOVE CHORE
    // =========================

    // Each remove button is created in renderChores().

    // =========================
    // SOUND EFFECTS
    // =========================

    function playSound(frequency = 600, duration = 0.12) {
        if (!soundToggle || !soundToggle.checked) {
            return;
        }

        try {
            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContextClass) return;

            if (!audioContext) {
                audioContext = new AudioContextClass();
            }

            if (audioContext.state === "suspended") {
                audioContext.resume();
            }

            const oscillator =
                audioContext.createOscillator();

            const gain = audioContext.createGain();

            oscillator.type = "sine";
            oscillator.frequency.value = frequency;

            gain.gain.setValueAtTime(
                0.12,
                audioContext.currentTime
            );

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                audioContext.currentTime + duration
            );

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(
                audioContext.currentTime + duration
            );
        } catch (error) {
            console.warn("Sound unavailable:", error);
        }
    }

    // =========================
    // CONFETTI EFFECT
    // =========================

    function showConfetti() {
        const canvas = document.createElement("canvas");

        canvas.className = "confetti-canvas";

        canvas.style.position = "fixed";
        canvas.style.inset = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "9999";

        document.body.appendChild(canvas);

        const confettiCtx = canvas.getContext("2d");

        if (!confettiCtx) {
            canvas.remove();
            return;
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;

        confettiCtx.scale(pixelRatio, pixelRatio);

        const pieces = [];

        for (let i = 0; i < 100; i++) {
            pieces.push({
                x: Math.random() * width,
                y: -Math.random() * height,
                size: 4 + Math.random() * 7,
                speedY: 2 + Math.random() * 4,
                speedX: -2 + Math.random() * 4,
                rotation: Math.random() * 360,
                spin: -5 + Math.random() * 10,
                color: COLORS[
                    Math.floor(Math.random() * COLORS.length)
                ]
            });
        }

        let frame = 0;
        const maxFrames = 150;

        function animateConfetti() {
            confettiCtx.clearRect(0, 0, width, height);

            pieces.forEach(piece => {
                piece.x += piece.speedX;
                piece.y += piece.speedY;
                piece.rotation += piece.spin;

                confettiCtx.save();

                confettiCtx.translate(piece.x, piece.y);
                confettiCtx.rotate(
                    piece.rotation * Math.PI / 180
                );

                confettiCtx.fillStyle = piece.color;

                confettiCtx.fillRect(
                    -piece.size / 2,
                    -piece.size / 2,
                    piece.size,
                    piece.size * 0.65
                );

                confettiCtx.restore();
            });

            frame++;

            if (frame < maxFrames) {
                requestAnimationFrame(animateConfetti);
            } else {
                canvas.remove();
            }
        }

        animateConfetti();
    }

    // =========================
    // SPIN THE WHEEL
    // =========================

    function spinWheel() {
        if (isSpinning) return;

        if (chores.length === 0) {
            result.textContent =
                "Add at least one chore before spinning!";
            return;
        }

        isSpinning = true;
        renderAll();

        result.textContent = "Spinning... Good luck! 🎡";

        playSound(450, 0.15);

        const winnerIndex = Math.floor(
            Math.random() * chores.length
        );

        const sliceDegrees = 360 / chores.length;

        // Align the selected slice with the top pointer.
        const targetAngle =
            (
                360 -
                ((winnerIndex + 0.5) * sliceDegrees % 360)
            ) % 360;

        const currentNormalized =
            ((currentRotation % 360) + 360) % 360;

        const extraDegrees =
            (targetAngle - currentNormalized + 360) % 360;

        const extraTurns =
            (5 + Math.floor(Math.random() * 3)) * 360;

        const finalRotation =
            currentRotation + extraTurns + extraDegrees;

        let finished = false;

        function finishSpin() {
            if (finished) return;

            finished = true;

            clearTimeout(spinTimeout);

            wheel.removeEventListener(
                "transitionend",
                onTransitionEnd
            );

            currentRotation = finalRotation;

            isSpinning = false;

            const winner = chores[winnerIndex];

            result.textContent =
                "🎉 Your chore is: " + winner + "!";

            playSound(850, 0.3);
            showConfetti();

            renderAll();
        }

        function onTransitionEnd(event) {
            if (
                event.target === wheel &&
                event.propertyName === "transform"
            ) {
                finishSpin();
            }
        }

        wheel.removeEventListener(
            "transitionend",
            onTransitionEnd
        );

        wheel.style.transition = "none";
        wheel.style.transform =
            "rotate(" + currentRotation + "deg)";

        // Force the browser to apply the reset before spinning.
        void wheel.offsetWidth;

        wheel.addEventListener(
            "transitionend",
            onTransitionEnd
        );

        wheel.style.transition =
            "transform 4s cubic-bezier(0.12, 0.75, 0.15, 1)";

        wheel.style.transform =
            "rotate(" + finalRotation + "deg)";

        spinTimeout = setTimeout(finishSpin, 4600);
    }

    spinBtn.addEventListener("click", spinWheel);

    // =========================
    // RESET CHORES
    // =========================

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (isSpinning) return;

            chores = [...DEFAULT_CHORES];

            currentRotation = 0;

            wheel.style.transition = "none";
            wheel.style.transform = "rotate(0deg)";

            saveChores();
            renderAll();

            result.textContent =
                "Chores reset! Ready for a new spin? 🔄";
        });
    }

    // =========================
    // CLEAR ALL CHORES
    // =========================

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (isSpinning) return;

            if (chores.length === 0) {
                result.textContent =
                    "Your chore list is already empty!";
                return;
            }

            const confirmed = window.confirm(
                "Are you sure you want to clear all chores?"
            );

            if (!confirmed) return;

            chores = [];
            currentRotation = 0;

            wheel.style.transition = "none";
            wheel.style.transform = "rotate(0deg)";

            saveChores();
            renderAll();

            result.textContent =
                "All chores cleared. Add a new chore! 📝";
        });
    }

    // =========================
    // SETTINGS PANEL
    // =========================

    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener("click", () => {
            settingsPanel.classList.toggle("hidden");
        });
    }

    if (closeSettingsBtn && settingsPanel) {
        closeSettingsBtn.addEventListener("click", () => {
            settingsPanel.classList.add("hidden");
        });
    }

    // =========================
    // DARK MODE
    // =========================

    function applyDarkMode(enabled) {
        document.body.classList.toggle(
            "dark-mode",
            Boolean(enabled)
        );

        if (darkModeToggle) {
            darkModeToggle.checked = Boolean(enabled);
        }

        saveStorage("choresRouletteDarkMode", Boolean(enabled));
    }

    const savedDarkMode = loadStorage(
        "choresRouletteDarkMode",
        false
    );

    applyDarkMode(savedDarkMode);

    if (darkModeToggle) {
        darkModeToggle.addEventListener("change", () => {
            applyDarkMode(darkModeToggle.checked);
        });
    }

    // =========================
    // SOUND SETTING
    // =========================

    const savedSound = loadStorage(
        "choresRouletteSound",
        true
    );

    if (soundToggle) {
        soundToggle.checked = Boolean(savedSound);

        soundToggle.addEventListener("change", () => {
            saveStorage(
                "choresRouletteSound",
                soundToggle.checked
            );

            if (soundToggle.checked) {
                playSound(600, 0.1);
            }
        });
    }

    // =========================
    // START APP
    // =========================

    renderAll();

    result.textContent = chores.length
        ? "Your chore will appear here!"
        : "Add some chores to get started!";

    console.log("Chores Roulette loaded successfully!");
})();