// productivity.js - Productivity widgets (Timer, Water, Mood, Journal) logic controller

import { AppStore } from './storage.js';

// Timer State
let timerInterval = null;
let isRunning = false;
let currentMode = "work"; // work, short, long
let timeLeft = 25 * 60; // seconds

export function initProductivity() {
  setupTimerListeners();
  setupWaterListeners();
  setupMoodListeners();
  setupJournalListeners();
  syncTimerWithMode();
}

export function renderProductivity(state) {
  // Sync views with active states
  renderWaterTracker(state);
  renderMoodTracker(state);
  renderJournalHistory(state);
}

// ================= POMODORO TIMER =================
function setupTimerListeners() {
  const playBtn = document.getElementById("timer-play-btn");
  const resetBtn = document.getElementById("timer-reset-btn");
  const skipBtn = document.getElementById("timer-skip-btn");
  const modeButtons = document.querySelectorAll("#focus-timer-modes .timer-mode-btn");

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetTimer();
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      skipSession();
    });
  }

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = btn.getAttribute("data-mode");
      resetTimer();
    });
  });
}

function syncTimerWithMode() {
  const settings = AppStore.state.settings;
  if (currentMode === "work") {
    timeLeft = settings.focusDuration * 60;
  } else if (currentMode === "short") {
    timeLeft = settings.shortBreakDuration * 60;
  } else if (currentMode === "long") {
    timeLeft = settings.longBreakDuration * 60;
  }
  updateTimerDisplay();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;

  const playIcon = document.getElementById("timer-play-icon");
  if (playIcon) {
    playIcon.setAttribute("data-lucide", "pause");
    if (window.lucide) window.lucide.createIcons();
  }

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      playAlarmSound();
      handleSessionCompletion();
    }
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  const playIcon = document.getElementById("timer-play-icon");
  if (playIcon) {
    playIcon.setAttribute("data-lucide", "play");
    if (window.lucide) window.lucide.createIcons();
  }
}

function resetTimer() {
  pauseTimer();
  syncTimerWithMode();
}

function skipSession() {
  pauseTimer();
  // Auto toggle modes: Work -> Short -> Work -> Long -> Work
  const modeBtns = document.querySelectorAll("#focus-timer-modes .timer-mode-btn");
  modeBtns.forEach(b => b.classList.remove("active"));

  if (currentMode === "work") {
    currentMode = "short";
    document.querySelector("[data-mode='short']").classList.add("active");
  } else if (currentMode === "short") {
    currentMode = "work";
    document.querySelector("[data-mode='work']").classList.add("active");
  } else if (currentMode === "long") {
    currentMode = "work";
    document.querySelector("[data-mode='work']").classList.add("active");
  }
  resetTimer();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const clockText = document.getElementById("timer-clock-text");
  
  if (clockText) {
    clockText.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // Ring progress fill calculation (r=95, circumference = 597)
  const ring = document.getElementById("timer-ring-fill");
  if (ring) {
    let totalDuration = 25 * 60;
    const settings = AppStore.state.settings;
    if (currentMode === "work") totalDuration = settings.focusDuration * 60;
    else if (currentMode === "short") totalDuration = settings.shortBreakDuration * 60;
    else if (currentMode === "long") totalDuration = settings.longBreakDuration * 60;

    const fraction = timeLeft / totalDuration;
    const offset = 597 * (1 - fraction);
    ring.style.strokeDashoffset = offset;
  }
}

function handleSessionCompletion() {
  const playIcon = document.getElementById("timer-play-icon");
  if (playIcon) {
    playIcon.setAttribute("data-lucide", "play");
    if (window.lucide) window.lucide.createIcons();
  }

  if (currentMode === "work") {
    alert("Focus session complete! Take a well-earned break.");
    AppStore.unlockBadge("focus-pioneer");
  } else {
    alert("Break session finished. Ready to focus again?");
  }
  
  skipSession();
}

function playAlarmSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Synthesize double beep alarm
    const playBeep = (time, freq) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.0, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      
      osc.start(time);
      osc.stop(time + 0.4);
    };

    const now = audioCtx.currentTime;
    playBeep(now, 880);      // A5
    playBeep(now + 0.5, 880); // A5
    playBeep(now + 1.0, 1046.5); // C6
  } catch (e) {
    console.warn("Alarm audio context playback not supported.", e);
  }
}

// ================= WATER TRACKER =================
function setupWaterListeners() {
  const add250 = document.getElementById("water-add-250");
  const add500 = document.getElementById("water-add-500");
  const resetBtn = document.getElementById("water-reset");

  const todayStr = new Date().toISOString().split("T")[0];

  if (add250) {
    add250.addEventListener("click", () => {
      AppStore.addWater(250, todayStr);
    });
  }
  if (add500) {
    add500.addEventListener("click", () => {
      AppStore.addWater(500, todayStr);
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset today's water logs?")) {
        AppStore.resetWater(todayStr);
      }
    });
  }
}

function renderWaterTracker(state) {
  const fill = document.getElementById("water-fluid-fill");
  const label = document.getElementById("water-stat-display");
  if (!fill) return;

  const todayStr = new Date().toISOString().split("T")[0];
  const logged = state.waterLog[todayStr] || 0;
  const target = state.settings.waterGoal || 2500;

  label.innerHTML = `${logged} <span>/ ${target} ml logged</span>`;

  // Calculate percentage height
  const percent = Math.min(Math.round((logged / target) * 100), 100);
  fill.style.height = `${percent}%`;
}

// ================= MOOD TRACKER =================
function setupMoodListeners() {
  const container = document.getElementById("mood-emojis-container");
  if (!container) return;

  const todayStr = new Date().toISOString().split("T")[0];

  container.querySelectorAll(".mood-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const moodVal = btn.getAttribute("data-mood");
      AppStore.setMood(moodVal, todayStr);
    });
  });
}

function renderMoodTracker(state) {
  const todayStr = new Date().toISOString().split("T")[0];
  const currentMood = state.moodLog[todayStr];
  const buttons = document.querySelectorAll("#mood-emojis-container .mood-btn");

  buttons.forEach(btn => {
    if (btn.getAttribute("data-mood") === currentMood) {
      btn.classList.add("selected");
    } else {
      btn.classList.remove("selected");
    }
  });
}

// ================= JOURNAL LOGS =================
function setupJournalListeners() {
  const form = document.getElementById("journal-editor-form");
  if (!form) return;

  const todayStr = new Date().toISOString().split("T")[0];

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("journal-title-field").value.trim();
    const content = document.getElementById("journal-content-field").value.trim();

    if (title && content) {
      AppStore.saveJournalEntry(title, content, todayStr);
      
      // Reset input fields
      document.getElementById("journal-title-field").value = "";
      document.getElementById("journal-content-field").value = "";
      
      alert("Journal entry saved successfully!");
    }
  });
}

function renderJournalHistory(state) {
  const container = document.getElementById("journal-history-container");
  if (!container) return;

  container.innerHTML = "";

  const entriesKeys = Object.keys(state.journalLog).sort().reverse(); // Show newest logs first

  if (entriesKeys.length === 0) {
    container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:1.5rem;">No previous journal logs. Add your first entry today!</div>`;
    return;
  }

  entriesKeys.forEach(dateStr => {
    const entry = state.journalLog[dateStr];
    const item = document.createElement("div");
    item.className = "journal-history-item";

    item.innerHTML = `
      <div class="journal-history-header">
        <span class="journal-history-date">${formatDate(dateStr)}</span>
      </div>
      <div class="journal-history-title">${entry.title}</div>
      <p class="journal-history-content">${entry.content}</p>
    `;

    container.appendChild(item);
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
