// ===================================
// CHORES ROULETTE
// ===================================

const DEFAULT_CHORES = [
  "Sweep the floor",
  "Wash the dishes",
  "Take out the trash",
  "Make the bed",
  "Fold the clothes"
];

const COLORS = [
  "#8b5cf6",
  "#20b978",
  "#ffcf4a",
  "#ff626c",
  "#3995ff",
  "#ff8b42",
  "#ed68c5",
  "#22c5c5"
];

const STORAGE_KEY = "simpleChoresRoulette";

let chores = loadChores();
let wheelRotation = 0;
let spinning = false;
let audioContext = null;

// ===================================
// HTML ELEMENTS
// ===================================

const wheel = document.getElementById("wheel");
const ctx = wheel.getContext("2d");

const spinBtn = document.getElementById("spinBtn");
const result = document.getElementById("result");
const choreList = document.getElementById("choreList");
const choreCount = document.getElementById("choreCount");
const choreForm = document.getElementById("choreForm");
const choreInput = document.getElementById("choreInput");

const resetBtn = document.getElementById("resetBtn");
const clearBtn = document.getElementById("clearBtn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");

const darkModeToggle = document.getElementById("darkModeToggle");
const soundToggle = document.getElementById("soundToggle");

const settingsPage = document.getElementById("settingsPage");
const aboutPage = document.getElementById("aboutPage");
const aboutBtn = document.getElementById("aboutBtn");
const backToSettings = document.getElementById("backToSettings");

// Winner Popup elements
const winnerModal = document.getElementById("winnerModal");
const winnerChore = document.getElementById("winnerChore");
const winnerOkBtn = document.getElementById("winnerOkBtn");

// ===================================
// SAVE AND LOAD CHORES
// ===================================

function loadChores() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          item => typeof item === "string" && item.trim()
        );
      }
    }
  } catch (error) {
    console.warn("Could not load saved chores.", error);
  }

  return [...DEFAULT_CHORES];
}

function saveChores() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chores)
    );
  } catch (error) {
    console.warn("Could not save chores.", error);
  }
}

// ===================================
// DRAW THE WHEEL
// ===================================

function drawWheel() {
  const size = wheel.width;
  const center = size / 2;
  const radius = center - 8;

  ctx.clearRect(0, 0, size, size);

  if (chores.length === 0) {
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#e8e0fa";
    ctx.fill();

    ctx.fillStyle = "#5b3cc4";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Add some chores!", center, center);

    drawWheelCenter(center);
    return;
  }

  const slice = (Math.PI * 2) / chores.length;

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(wheelRotation);

  chores.forEach((chore, index) => {
    const start = index * slice;
    const end = start + slice;

    // Draw wheel slice
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();

    ctx.fillStyle = COLORS[index % COLORS.length];
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw chore label
    ctx.save();
    ctx.rotate(start + slice / 2);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    ctx.font = `bold ${Math.max(
      11,
      Math.min(17, 200 / chores.length)
    )}px Arial`;

    let label = chore;
    const maxLength = chores.length > 8 ? 13 : 19;

    if (label.length > maxLength) {
      label = label.slice(0, maxLength - 3) + "...";
    }

    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 2;

    ctx.fillText(label, radius - 22, 0);

    ctx.restore();
  });

  ctx.restore();

  drawWheelCenter(center);
}

// ===================================
// WHEEL CENTER
// ===================================

function drawWheelCenter(center) {
  ctx.beginPath();
  ctx.arc(center, center, 25, 0, Math.PI * 2);

  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = "#5b3cc4";
  ctx.stroke();
}

// ===================================
// DISPLAY CHORE LIST
// ===================================

function renderChores() {
  choreList.innerHTML = "";

  chores.forEach((chore, index) => {
    const li = document.createElement("li");

    const name = document.createElement("span");
    name.className = "chore-name";
    name.textContent = chore;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("aria-label", "Remove " + chore);

    removeBtn.addEventListener("click", () => {
      if (spinning) return;

      chores.splice(index, 1);

      saveChores();
      renderAll();

      result.textContent = "Chore removed.";
    });

    li.appendChild(name);
    li.appendChild(removeBtn);

    choreList.appendChild(li);
  });

  choreCount.textContent =
    chores.length +
    (chores.length === 1 ? " chore" : " chores");

  drawWheel();
}

function renderAll() {
  renderChores();
}

// ===================================
// ADD CHORE
// ===================================

choreForm.addEventListener("submit", event => {
  event.preventDefault();

  if (spinning) return;

  const chore = choreInput.value.trim();

  if (!chore) {
    choreInput.focus();
    return;
  }

  const alreadyExists = chores.some(
    item => item.toLowerCase() === chore.toLowerCase()
  );

  if (alreadyExists) {
    result.textContent =
      "That chore is already on the list!";

    choreInput.focus();
    return;
  }

  chores.push(chore);

  saveChores();
  renderAll();

  choreInput.value = "";
  choreInput.focus();

  result.textContent = "Chore added! Ready to spin?";
});

// ===================================
// RESET CHORES
// ===================================

resetBtn.addEventListener("click", () => {
  if (spinning) return;

  if (!confirm("Reset the list to the default chores?")) {
    return;
  }

  closeWinnerPopup();

  chores = [...DEFAULT_CHORES];
  wheelRotation = 0;

  saveChores();
  renderAll();

  result.textContent = "Default chores restored!";
});

// ===================================
// CLEAR ALL CHORES
// ===================================

clearBtn.addEventListener("click", () => {
  if (spinning) return;

  if (chores.length === 0) {
    result.textContent = "The chore list is already empty.";
    return;
  }

  if (!confirm("Are you sure you want to clear all chores?")) {
    return;
  }

  closeWinnerPopup();

  chores = [];
  wheelRotation = 0;

  saveChores();
  renderAll();

  result.textContent =
    "All chores cleared. Add new chores to play!";
});

// ===================================
// SOUND EFFECTS
// ===================================

function playTone(
  frequency,
  duration,
  type = "sine",
  volume = 0.08
) {
  if (!soundToggle.checked) return;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.stop(
      audioContext.currentTime + duration
    );
  } catch (error) {
    console.warn("Sound is unavailable.", error);
  }
}

// ===================================
// WINNER SOUND
// ===================================

function playWinSound() {
  playTone(523, 0.18, "sine");

  setTimeout(() => {
    playTone(659, 0.18, "sine");
  }, 160);

  setTimeout(() => {
    playTone(784, 0.3, "sine");
  }, 320);
}

// ===================================
// WINNER POPUP
// ===================================

function showWinnerPopup(chore) {
  winnerChore.textContent = chore;

  winnerModal.classList.add("open");
  winnerModal.setAttribute("aria-hidden", "false");

  winnerOkBtn.focus();
}

function closeWinnerPopup() {
  winnerModal.classList.remove("open");
  winnerModal.setAttribute("aria-hidden", "true");
}

winnerOkBtn.addEventListener("click", () => {
  closeWinnerPopup();
  spinBtn.focus();
});

winnerModal.addEventListener("click", event => {
  if (event.target === winnerModal) {
    closeWinnerPopup();
    spinBtn.focus();
  }
});

// ===================================
// SPIN THE WHEEL
// ===================================

spinBtn.addEventListener("click", () => {
  if (spinning) return;

  if (chores.length === 0) {
    result.textContent =
      "Please add at least one chore first!";

    return;
  }

  closeWinnerPopup();

  spinning = true;
  spinBtn.disabled = true;

  result.textContent = "🎡 The wheel is spinning...";

  const selectedIndex = Math.floor(
    Math.random() * chores.length
  );

  const slice = (Math.PI * 2) / chores.length;

  // Selected slice stops beneath the pointer
  const targetAngle =
    Math.PI * 1.5 - (selectedIndex + 0.5) * slice;

  const current =
    ((wheelRotation % (Math.PI * 2)) + Math.PI * 2) %
    (Math.PI * 2);

  const normalizedTarget =
    ((targetAngle % (Math.PI * 2)) + Math.PI * 2) %
    (Math.PI * 2);

  const extraTurns =
    5 + Math.floor(Math.random() * 3);

  const delta =
    extraTurns * Math.PI * 2 +
    (
      (normalizedTarget - current + Math.PI * 2) %
      (Math.PI * 2)
    );

  const startRotation = wheelRotation;
  const endRotation = startRotation + delta;

  const duration = 4500;
  const startTime = performance.now();

  let lastTick = 0;

  function animate(now) {
    const progress = Math.min(
      (now - startTime) / duration,
      1
    );

    // Smooth ease-out animation
    const eased = 1 - Math.pow(1 - progress, 4);

    wheelRotation = startRotation + delta * eased;

    drawWheel();

    // Ticking sound
    if (now - lastTick > 140 && progress < 0.9) {
      playTone(260, 0.035, "square", 0.018);
      lastTick = now;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      wheelRotation = endRotation;
      drawWheel();

      const selectedChore = chores[selectedIndex];

      result.textContent =
        "🎉 Your chore is: " + selectedChore + "!";

      playWinSound();

      // Display the selected chore in a popup
      showWinnerPopup(selectedChore);

      spinning = false;
      spinBtn.disabled = false;
    }
  }

  requestAnimationFrame(animate);
});

// ===================================
// SETTINGS POPUP
// ===================================

function openSettings() {
  settingsModal.classList.add("open");
  settingsModal.setAttribute("aria-hidden", "false");

  showSettingsPage();
}

function closeSettingsPopup() {
  settingsModal.classList.remove("open");
  settingsModal.setAttribute("aria-hidden", "true");
}

function showSettingsPage() {
  settingsPage.hidden = false;
  aboutPage.hidden = true;
}

function showAboutPage() {
  settingsPage.hidden = true;
  aboutPage.hidden = false;
}

settingsBtn.addEventListener("click", openSettings);
closeSettings.addEventListener("click", closeSettingsPopup);

settingsModal.addEventListener("click", event => {
  if (event.target === settingsModal) {
    closeSettingsPopup();
  }
});

aboutBtn.addEventListener("click", showAboutPage);
backToSettings.addEventListener("click", showSettingsPage);

// Close popups with Escape
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeSettingsPopup();
    closeWinnerPopup();
  }
});

// ===================================
// DARK MODE
// ===================================

darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle(
    "dark",
    darkModeToggle.checked
  );

  try {
    localStorage.setItem(
      "choresRouletteDarkMode",
      darkModeToggle.checked ? "on" : "off"
    );
  } catch (error) {
    // Dark mode still works for the current page.
  }
});

// ===================================
// SOUND SETTING
// ===================================

soundToggle.addEventListener("change", () => {
  try {
    localStorage.setItem(
      "choresRouletteSound",
      soundToggle.checked ? "on" : "off"
    );
  } catch (error) {
    // Sound setting still works for the current page.
  }

  if (soundToggle.checked) {
    playTone(660, 0.12);
  }
});

// ===================================
// LOAD SAVED SETTINGS
// ===================================

function loadSettings() {
  try {
    const savedDarkMode =
      localStorage.getItem("choresRouletteDarkMode");

    const savedSound =
      localStorage.getItem("choresRouletteSound");

    darkModeToggle.checked = savedDarkMode === "on";
    soundToggle.checked = savedSound !== "off";

    document.body.classList.toggle(
      "dark",
      darkModeToggle.checked
    );
  } catch (error) {
    soundToggle.checked = true;
  }
}

// ===================================
// START APP
// ===================================

loadSettings();
renderAll();
