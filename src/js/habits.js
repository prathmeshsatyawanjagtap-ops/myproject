// habits.js - Habit tracker view logic controller

import { AppStore } from './storage.js';
import { openModal, closeAllModals } from './app.js';

let selectedColor = "#3b82f6"; // default blue

export function initHabits() {
  setupHabitListeners();
}

export function renderHabits(state) {
  renderHabitHeaders(state);
  renderHabitsTable(state);
  loadReflections(state);
}

function setupHabitListeners() {
  const addHabitBtn = document.getElementById("add-habit-btn");
  const modalForm = document.getElementById("modal-habit-form");
  const colorOptions = document.querySelectorAll("#modal-habit-colors .color-option");
  const saveReflectionsBtn = document.getElementById("save-reflections-btn");

  if (addHabitBtn) {
    addHabitBtn.addEventListener("click", () => {
      openModal("modal-add-habit");
    });
  }

  // Color Swatch Selection
  colorOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      colorOptions.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      selectedColor = opt.getAttribute("data-color");
    });
  });

  // Create Habit Form Submit
  if (modalForm) {
    modalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("modal-habit-name").value.trim();
      const category = document.getElementById("modal-habit-category").value;
      
      if (name) {
        AppStore.addHabit(name, category, selectedColor);
        // Clear modal input
        document.getElementById("modal-habit-name").value = "";
        closeAllModals();
      }
    });
  }

  // Save Reflections Button
  if (saveReflectionsBtn) {
    saveReflectionsBtn.addEventListener("click", () => {
      saveReflections();
    });
  }
}

function renderHabitHeaders(state) {
  const headersRow = document.getElementById("habit-table-headers");
  if (!headersRow) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `<th class="habit-table-header-sticky">Habits</th>`;

  // Columns for 1 to 31 days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate();
    html += `<th class="habit-day-header ${isToday ? 'today' : ''}">${d}</th>`;
  }

  html += `<th class="habit-table-header-sticky" style="left:auto; right:110px; border-left:2px solid var(--border-color); text-align:center; width:70px;">Streak</th>`;
  html += `<th class="habit-table-header-sticky" style="left:auto; right:50px; text-align:center; width:60px;">%</th>`;
  html += `<th class="habit-table-header-sticky" style="left:auto; right:0; text-align:center; width:50px;">Actions</th>`;

  headersRow.innerHTML = html;
}

function renderHabitsTable(state) {
  const tableBody = document.getElementById("habit-table-body");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (state.habits.length === 0) {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    tableBody.innerHTML = `
      <tr>
        <td colspan="${daysInMonth + 4}" style="text-align:center; padding:3rem; color:var(--text-muted); font-size:0.9rem;">
          No habits added yet. Press "Add New Habit" to get started!
        </td>
      </tr>
    `;
    return;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  state.habits.forEach(habit => {
    const row = document.createElement("tr");
    
    // Evaluate if habit skipped 2 days in a row within the past 7 days
    const consecutiveSkip = checkNeverSkipRule(habit);
    if (consecutiveSkip) {
      row.style.backgroundColor = "rgba(244, 63, 94, 0.02)"; // Highlight in subtle red
    }

    // Sticky Name cell
    let rowHtml = `
      <td class="habit-cell-sticky">
        <span class="habit-row-name" title="${habit.name}">${habit.name}</span>
        <div class="habit-row-meta">
          <span class="habit-row-category">${habit.category}</span>
          ${consecutiveSkip ? `<span style="font-size:0.65rem; color:var(--accent-rose); font-weight:700; display:flex; align-items:center; gap:1px;" title="Skipped 2 consecutive days recently!"><i data-lucide="alert-circle" style="width:10px; height:10px;"></i> Skip!</span>` : ''}
        </div>
      </td>
    `;

    // 1 to 31 Day checkbox dots
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isCompleted = habit.history[dateStr] === true;
      const isToday = d === today.getDate();

      rowHtml += `
        <td class="habit-day-cell ${isToday ? 'today' : ''}">
          <div class="habit-day-dot ${isCompleted ? 'completed' : ''}" 
               data-habit-id="${habit.id}" 
               data-date="${dateStr}"
               style="${isCompleted ? `background-color: ${habit.color || 'var(--accent-violet)'}; color: #fff; border-color:transparent;` : `color: ${habit.color || 'var(--accent-violet)'};`}"
               title="Day ${d}: ${isCompleted ? 'Completed' : 'Pending'}">
            <i data-lucide="check" style="width:12px; height:12px; display:${isCompleted ? 'block' : 'none'}"></i>
          </div>
        </td>
      `;
    }

    // Calc Streak & Consistency
    const streak = calculateStreak(habit, todayStr, yesterdayStr);
    const progress = calculateMonthlyConsistency(habit, daysInMonth, year, month);

    // Sticky Streak summary cells
    rowHtml += `
      <td class="habit-cell-sticky habit-stats-cell" style="left:auto; right:110px; border-left:2px solid var(--border-color); width:70px;">
        <span style="display:flex; align-items:center; justify-content:center; gap:2px; color: ${streak > 0 ? 'var(--accent-amber)' : 'var(--text-muted)'}">
          <i data-lucide="flame" style="width:14px; height:14px; fill:currentColor;"></i>
          ${streak}d
        </span>
      </td>
      <td class="habit-cell-sticky habit-stats-cell" style="left:auto; right:50px; width:60px;">
        ${progress}%
      </td>
      <td class="habit-cell-sticky habit-stats-cell" style="left:auto; right:0; width:50px;">
        <button class="habit-actions-trigger delete-habit-trigger-btn" data-habit-id="${habit.id}" title="Delete Habit">
          <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
        </button>
      </td>
    `;

    row.innerHTML = rowHtml;
    tableBody.appendChild(row);
  });

  // Bind click toggle events on all dots
  tableBody.querySelectorAll(".habit-day-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const habitId = dot.getAttribute("data-habit-id");
      const dateStr = dot.getAttribute("data-date");
      AppStore.toggleHabitDay(habitId, dateStr);
    });
  });

  // Bind delete events
  tableBody.querySelectorAll(".delete-habit-trigger-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const habitId = btn.getAttribute("data-habit-id");
      if (confirm("Are you sure you want to delete this habit? All history will be wiped.")) {
        AppStore.deleteHabit(habitId);
      }
    });
  });

  // Render Lucide Icons
  if (window.lucide) window.lucide.createIcons();
}

function calculateStreak(habit, todayStr, yesterdayStr) {
  const dates = Object.keys(habit.history).filter(d => habit.history[d]).sort();
  if (dates.length === 0) return 0;

  const completedToday = habit.history[todayStr] === true;
  const completedYesterday = habit.history[yesterdayStr] === true;

  if (!completedToday && !completedYesterday) return 0;

  let streak = 0;
  let checkDate = new Date(completedToday ? todayStr : yesterdayStr);

  while (true) {
    const checkStr = checkDate.toISOString().split("T")[0];
    if (habit.history[checkStr] === true) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function calculateMonthlyConsistency(habit, daysInMonth, year, month) {
  const today = new Date();
  const elapsedDays = (today.getMonth() === month && today.getFullYear() === year) 
    ? today.getDate() 
    : daysInMonth;

  let completed = 0;
  for (let d = 1; d <= elapsedDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (habit.history[dateStr] === true) {
      completed++;
    }
  }

  return elapsedDays > 0 ? Math.round((completed / elapsedDays) * 100) : 0;
}

// Scans last 7 days history. Returns true if two consecutive days were skipped.
function checkNeverSkipRule(habit) {
  const today = new Date();
  // We scan the last 7 days starting from yesterday (since today might still be pending)
  let skipCounter = 0;
  let prevSkipped = false;

  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(Date.now() - i * 86400000);
    const dateStr = checkDate.toISOString().split("T")[0];
    
    // Check if habit started before this date
    if (new Date(habit.createdAt) > checkDate) {
      break; 
    }

    const wasCompleted = habit.history[dateStr] === true;
    
    if (!wasCompleted) {
      if (prevSkipped) {
        return true; // Skipping 2 days in a row!
      }
      prevSkipped = true;
    } else {
      prevSkipped = false;
    }
  }
  return false;
}

// Load current month's reflections
function loadReflections(state) {
  const today = new Date();
  const yearMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const achieveField = document.getElementById("reflect-achievement-field");
  const improveField = document.getElementById("reflect-improvement-field");
  const notesField = document.getElementById("reflect-notes-field");

  if (!achieveField) return;

  // Let's grab reflections from the first habit or store it in a general container
  // We saved reflections on individual habits or we can save them collectively.
  // In storage.js we mock them under individual habits. Let's merge reflections of all habits 
  // or use the first habit's reflection space as the global sheet for now, to keep it clean.
  const habit = state.habits[0];
  if (habit && habit.reflection && habit.reflection[yearMonthStr]) {
    const ref = habit.reflection[yearMonthStr];
    achieveField.value = ref.achievement || "";
    improveField.value = ref.improvement || "";
    notesField.value = ref.notes || "";
  } else {
    achieveField.value = "";
    improveField.value = "";
    notesField.value = "";
  }
}

// Save monthly reflections
function saveReflections() {
  const today = new Date();
  const yearMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const achieveVal = document.getElementById("reflect-achievement-field").value.trim();
  const improveVal = document.getElementById("reflect-improvement-field").value.trim();
  const notesVal = document.getElementById("reflect-notes-field").value.trim();

  // Save to the first habit in store, or dispatch update
  const firstHabit = AppStore.state.habits[0];
  if (firstHabit) {
    AppStore.updateHabitReflection(firstHabit.id, yearMonthStr, {
      achievement: achieveVal,
      improvement: improveVal,
      notes: notesVal
    });
    alert("Monthly reflection saved successfully!");
  } else {
    alert("Please create at least one habit first to bind reflections data.");
  }
}
