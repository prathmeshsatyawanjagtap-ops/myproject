// dashboard.js - Dashboard view logic controller

import { AppStore } from './storage.js';

// Random Quotes Repository
const MOTIVATIONAL_QUOTES = [
  "Atomic adjustments compound over time into massive breakthroughs.",
  "Discipline is choosing between what you want now and what you want most.",
  "Never skip twice. Missing once is an accident, missing twice is the start of a bad habit.",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "It is easier to prevent bad habits than to break them later.",
  "Your focus determines your reality. Concentrate on the core goals.",
  "Energy flows where attention goes. Keep your vision clear."
];

// Badge details map
const BADGE_INFO = {
  "first-habit": { icon: "✨", title: "Pioneer", desc: "Created your first habit tracker" },
  "hydration-hero": { icon: "💧", title: "Hydrator", desc: "Met water goal (2.5L+)" },
  "streak-5": { icon: "🔥", title: "Consistent", desc: "Maintained a 5-day habit streak" },
  "focus-pioneer": { icon: "⏱️", title: "Focus Master", desc: "Completed a Pomodoro session" },
  "goal-crusher": { icon: "🎯", title: "Crusher", desc: "Completed an overarching goal" },
  "journal-scribe": { icon: "📝", title: "Scribe", desc: "Logged 3 daily journal entries" }
};

export function initDashboard() {
  setupFocusWidgetListeners();
}

export function renderDashboard(state) {
  // Update name in banner & compute Productivity level
  renderWelcomeBannerWithRank(state);

  // Refresh dynamic quote
  renderRandomQuote();

  // Render core focus widget
  renderFocusWidget(state);

  // Render active streaks list
  renderStreaksList(state);

  // Render calendar widget
  renderCalendarOverview(state);

  // Render productivity gauge
  renderProductivityGauge(state);

  // Render badges list
  renderBadges(state);
}

// Quote display
function renderRandomQuote() {
  const quoteEl = document.getElementById("dash-quote");
  if (quoteEl) {
    const seed = new Date().getDate(); // same quote all day
    const index = seed % MOTIVATIONAL_QUOTES.length;
    quoteEl.textContent = `"${MOTIVATIONAL_QUOTES[index]}"`;
  }
}

// Level and Rank system logic
function renderWelcomeBannerWithRank(state) {
  const bannerName = document.getElementById("dash-username");
  if (!bannerName) return;

  const name = state.profile.name || (AppStore.activeUserEmail ? AppStore.activeUserEmail.split("@")[0] : "Guest");
  
  // Calculate N = total completions
  let completions = 0;
  
  // 1. Habit completions count
  state.habits.forEach(h => {
    Object.keys(h.history).forEach(date => {
      if (h.history[date] === true) completions++;
    });
  });

  // 2. Task completions count
  state.tasks.forEach(t => {
    if (t.completed) completions++;
  });

  // Level formula: quadratic curve: Required = Lvl^2 * 3
  let lvl = 1;
  while (completions >= lvl * lvl * 3) {
    lvl++;
  }

  const prevLvlReq = (lvl - 1) * (lvl - 1) * 3;
  const nextLvlReq = lvl * lvl * 3;
  const progressXp = completions - prevLvlReq;
  const neededXp = nextLvlReq - prevLvlReq;
  const progressPercent = Math.min(Math.round((progressXp / neededXp) * 100), 100);

  // Rank Names
  let rank = "Disciplined Novice 🛡️";
  if (lvl >= 3 && lvl < 5) rank = "Consistency Builder ⚡";
  else if (lvl >= 5 && lvl < 7) rank = "Routine Engineer 🛠️";
  else if (lvl >= 7 && lvl < 10) rank = "Habit Master 🥋";
  else if (lvl >= 10) rank = "Master of Destiny 🌌";

  // Re-draw Welcome Banner header with rank details
  bannerName.innerHTML = `
    ${name.split(" ")[0]}
    <span style="font-size:0.75rem; vertical-align:middle; background:linear-gradient(135deg, var(--accent-violet), var(--accent-cyan)); padding:0.25rem 0.65rem; border-radius:99px; color:#fff; font-family:var(--font-display); font-weight:700; margin-left:0.5rem; letter-spacing:0.02em; box-shadow: var(--shadow-glow);">Lvl ${lvl}</span>
  `;

  // Check if rank sub-text already added, if not append it to banner content
  const bannerContent = document.querySelector(".banner-content");
  let rankElement = document.getElementById("dash-rank-info");
  
  if (!rankElement) {
    rankElement = document.createElement("div");
    rankElement.id = "dash-rank-info";
    rankElement.style.marginTop = "0.75rem";
    rankElement.style.maxWidth = "280px";
    bannerContent.appendChild(rankElement);
  }

  rankElement.innerHTML = `
    <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.25rem;">
      <span>Rank: ${rank}</span>
      <span>${completions}/${nextLvlReq} XP</span>
    </div>
    <div style="height:6px; background-color:rgba(255,255,255,0.06); border:1px solid var(--border-color); border-radius:4px; overflow:hidden;">
      <div style="height:100%; width:${progressPercent}%; background:linear-gradient(90deg, var(--accent-violet), var(--accent-cyan)); border-radius:4px; box-shadow:0 0 6px var(--accent-violet);"></div>
    </div>
  `;
}

// Focus widgets listeners & renderers
function setupFocusWidgetListeners() {
  const checkbox = document.getElementById("focus-checkbox-box");
  const editBtn = document.getElementById("focus-edit-btn");
  const saveBtn = document.getElementById("focus-save-btn");
  const inputField = document.getElementById("focus-input-field");

  checkbox.addEventListener("click", () => {
    const focusState = AppStore.state.todayFocus;
    AppStore.updateTodayFocus(focusState.text, !focusState.completed);
  });

  editBtn.addEventListener("click", () => {
    document.getElementById("focus-view-state").style.display = "none";
    document.getElementById("focus-edit-state").style.display = "flex";
    inputField.value = AppStore.state.todayFocus.text;
    inputField.focus();
  });

  saveBtn.addEventListener("click", () => {
    saveNewFocus();
  });

  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveNewFocus();
  });
}

function saveNewFocus() {
  const text = document.getElementById("focus-input-field").value.trim();
  if (text) {
    AppStore.updateTodayFocus(text, false);
    document.getElementById("focus-view-state").style.display = "flex";
    document.getElementById("focus-edit-state").style.display = "none";
  }
}

function renderFocusWidget(state) {
  const focus = state.todayFocus || { text: "", completed: false };
  const viewState = document.getElementById("focus-view-state");
  const editState = document.getElementById("focus-edit-state");
  const textBox = document.getElementById("focus-text-val");
  const checkbox = document.getElementById("focus-checkbox-box");

  textBox.textContent = focus.text || "Click Edit to set today's primary focus task.";
  
  if (focus.completed) {
    viewState.classList.add("completed");
    checkbox.classList.add("checked");
  } else {
    viewState.classList.remove("completed");
    checkbox.classList.remove("checked");
  }

  if (editState.style.display !== "flex") {
    viewState.style.display = "flex";
  }
}

// Streaks calculations
function renderStreaksList(state) {
  const container = document.getElementById("dashboard-streaks-list");
  if (!container) return;

  container.innerHTML = "";

  if (state.habits.length === 0) {
    container.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:1rem;">No habits found. Head to the Habits tab to create one!</div>`;
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  state.habits.forEach(habit => {
    const streak = calculateHabitStreak(habit, todayStr, yesterdayStr);
    const progress = calculateHabitMonthlyProgress(habit);

    const row = document.createElement("div");
    row.className = "glass-card";
    row.style.padding = "0.75rem 1rem";
    row.style.backgroundColor = "rgba(0,0,0,0.15)";
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.borderLeft = `3px solid ${habit.color || 'var(--accent-violet)'}`;

    row.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.2rem; overflow:hidden; max-width:70%;">
        <span style="font-weight:600; font-size:0.9rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; color:var(--text-primary);">${habit.name}</span>
        <span style="font-size:0.75rem; color:var(--text-secondary);">${progress}% completed this month</span>
      </div>
      <div class="habit-row-streak" style="font-size:0.9rem;">
        <i data-lucide="flame" style="fill: currentColor; width: 18px; height: 18px; color: ${streak > 0 ? 'var(--accent-amber)' : 'var(--text-muted)'}"></i>
        <span style="font-family:var(--font-display); font-weight:700; color: ${streak > 0 ? 'var(--text-primary)' : 'var(--text-muted)'}">${streak} d</span>
      </div>
    `;
    container.appendChild(row);
  });

  if (window.lucide) window.lucide.createIcons();
}

function calculateHabitStreak(habit, todayStr, yesterdayStr) {
  const dates = Object.keys(habit.history).filter(d => habit.history[d]).sort();
  if (dates.length === 0) return 0;

  const completedToday = habit.history[todayStr] === true;
  const completedYesterday = habit.history[yesterdayStr] === true;

  if (!completedToday && !completedYesterday) return 0;

  let currentStreak = 0;
  let checkDate = new Date(completedToday ? todayStr : yesterdayStr);

  while (true) {
    const checkStr = checkDate.toISOString().split("T")[0];
    if (habit.history[checkStr] === true) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}

function calculateHabitMonthlyProgress(habit) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  const totalDays = today.getDate();
  let completedDays = 0;

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (habit.history[dateStr] === true) {
      completedDays++;
    }
  }

  return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
}

// Productivity efficiency score calculator
function renderProductivityGauge(state) {
  const ring = document.getElementById("score-ring-fill");
  const valueLabel = document.getElementById("score-percentage-val");
  if (!ring) return;

  const todayStr = new Date().toISOString().split("T")[0];

  const totalHabits = state.habits.length;
  const completedHabits = state.habits.filter(h => h.history[todayStr]).length;

  const todayTasks = state.tasks.filter(t => t.dueDate === todayStr || !t.dueDate);
  const totalTasks = todayTasks.length;
  const completedTasks = todayTasks.filter(t => t.completed).length;

  const totalActions = totalHabits + totalTasks;
  const completedActions = completedHabits + completedTasks;

  const percentage = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  valueLabel.textContent = `${percentage}%`;
  
  const offset = 377 - (377 * percentage) / 100;
  ring.style.strokeDashoffset = offset;
}

// Calendar View builder
function renderCalendarOverview(state) {
  const titleEl = document.getElementById("calendar-month-year");
  const daysGrid = document.getElementById("calendar-days-grid");
  if (!daysGrid) return;

  daysGrid.innerHTML = "";

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  titleEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDay.getDay();

  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = lastDay.getDate();

  for (let i = 0; i < startDayOfWeek; i++) {
    const padCell = document.createElement("div");
    padCell.className = "calendar-day outside";
    daysGrid.appendChild(padCell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day";
    dayCell.textContent = day;

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
      dayCell.classList.add("today");
    }

    const dotsContainer = document.createElement("div");
    dotsContainer.className = "calendar-dots";

    state.habits.forEach(habit => {
      if (habit.history[dateStr] === true) {
        const dot = document.createElement("span");
        dot.className = "calendar-dot";
        dot.style.backgroundColor = habit.color || "var(--accent-violet)";
        dotsContainer.appendChild(dot);
      }
    });

    dayCell.appendChild(dotsContainer);
    daysGrid.appendChild(dayCell);
  }
}

// Badges builder
function renderBadges(state) {
  const container = document.getElementById("dashboard-badges-container");
  if (!container) return;

  container.innerHTML = "";

  Object.keys(BADGE_INFO).forEach(badgeId => {
    const isUnlocked = state.badges[badgeId] === true;
    const info = BADGE_INFO[badgeId];

    const badgeCell = document.createElement("div");
    badgeCell.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
    badgeCell.setAttribute("data-tooltip", `${info.title}: ${info.desc} (${isUnlocked ? 'Unlocked' : 'Locked'})`);

    badgeCell.innerHTML = `
      <div class="badge-icon-circle" style="font-size: 1.35rem;">
        ${isUnlocked ? info.icon : "🔒"}
      </div>
      <span class="badge-lbl">${info.title}</span>
    `;

    container.appendChild(badgeCell);
  });
}
