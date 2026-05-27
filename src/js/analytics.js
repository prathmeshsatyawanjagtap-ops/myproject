// analytics.js - Analytics & progress charts rendering controller

import { AppStore } from './storage.js';

let consistencyChartInstance = null;
let categoryChartInstance = null;

export function initAnalytics() {
  // Initialization actions if needed
}

export function renderAnalytics(state) {
  renderTrendStats(state);
  renderProductivityHeatmap(state);
  renderCharts(state);
}

// Trend Metrics calculations
function renderTrendStats(state) {
  // 1. Habit Efficiency % (Current Month)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const currentMonthDays = today.getDate(); // count up to today

  let totalPossibleChecks = state.habits.length * currentMonthDays;
  let actualChecks = 0;

  state.habits.forEach(h => {
    for (let d = 1; d <= currentMonthDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (h.history[dateStr] === true) actualChecks++;
    }
  });

  const habitEfficiency = totalPossibleChecks > 0 
    ? Math.round((actualChecks / totalPossibleChecks) * 100) 
    : 0;
  
  document.getElementById("trend-habit-efficiency").textContent = `${habitEfficiency}%`;

  // 2. Max Streak
  let maxStreak = 0;
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  state.habits.forEach(h => {
    const dates = Object.keys(h.history).filter(d => h.history[d]).sort();
    if (dates.length === 0) return;

    let streak = 0;
    // Walk back from yesterday or today
    const activeStart = h.history[todayStr] ? todayStr : (h.history[yesterdayStr] ? yesterdayStr : null);
    if (activeStart) {
      let check = new Date(activeStart);
      while (true) {
        const checkStr = check.toISOString().split("T")[0];
        if (h.history[checkStr] === true) {
          streak++;
          check.setDate(check.getDate() - 1);
        } else {
          break;
        }
      }
    }
    if (streak > maxStreak) maxStreak = streak;
  });

  document.getElementById("trend-max-streak").textContent = `${maxStreak} Days`;

  // 3. Goal Completion ratio
  const completedGoals = state.goals.filter(g => g.completed).length;
  const totalGoals = state.goals.length;
  document.getElementById("trend-goal-ratio").textContent = `${completedGoals}/${totalGoals}`;

  // 4. Water Average
  const waterLogKeys = Object.keys(state.waterLog);
  let totalWater = 0;
  waterLogKeys.forEach(k => totalWater += state.waterLog[k]);
  
  const waterAvg = waterLogKeys.length > 0 
    ? (totalWater / waterLogKeys.length / 1000).toFixed(1) 
    : "0.0";
  
  document.getElementById("trend-water-avg").textContent = `${waterAvg}L`;
}

// GitHub-Style Heatmap Grid builder
function renderProductivityHeatmap(state) {
  const grid = document.getElementById("analytics-heatmap-grid");
  if (!grid) return;

  grid.innerHTML = "";

  // Draw previous 150 days (approx. 21 weeks) to align nicely
  const today = new Date();
  const totalDaysToDraw = 168; // 24 weeks * 7 days
  const startDate = new Date();
  startDate.setDate(today.getDate() - totalDaysToDraw + 1);

  // We align start date to start on Sunday (so rows are Sun-Sat)
  const offsetSun = startDate.getDay();
  startDate.setDate(startDate.getDate() - offsetSun);

  const totalCells = totalDaysToDraw + offsetSun;

  for (let i = 0; i < totalCells; i++) {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + i);

    const cellDateStr = cellDate.toISOString().split("T")[0];
    
    // Count completed actions on this date
    let completionsCount = 0;

    // 1. Habit completions
    state.habits.forEach(h => {
      if (h.history[cellDateStr] === true) completionsCount++;
    });

    // 2. Task completions
    state.tasks.forEach(t => {
      if (t.completed && t.dueDate === cellDateStr) completionsCount++;
    });

    // Intensity level
    let level = 0;
    if (completionsCount === 1) level = 1;
    else if (completionsCount === 2) level = 2;
    else if (completionsCount === 3) level = 3;
    else if (completionsCount >= 4) level = 4;

    const cell = document.createElement("div");
    cell.className = `heatmap-cell level-${level}`;

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateReadable = cellDate.toLocaleDateString('en-US', options);
    cell.setAttribute("data-tooltip", `${dateReadable}: ${completionsCount} completions`);

    // Hide cells in the padding area that exceed today's date
    if (cellDate > today) {
      cell.style.opacity = "0";
      cell.style.pointerEvents = "none";
    }

    grid.appendChild(cell);
  }
}

// ChartJS instances painter
function renderCharts(state) {
  const isLight = document.documentElement.classList.contains("theme-light");
  
  // Custom theme colors configuration
  const textColor = isLight ? "#475569" : "#94a3b8";
  const gridColor = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";

  // 1. Line Chart: Weekly Consistency Trend (Last 7 Days)
  const lineCanvas = document.getElementById("chart-consistency-line");
  if (lineCanvas) {
    const last7Days = [];
    const habitCompletionCounts = [];
    const taskCompletionCounts = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      last7Days.push(dayNames[d.getDay()]);

      // Calculate totals
      let hCount = 0;
      state.habits.forEach(h => {
        if (h.history[dateStr] === true) hCount++;
      });
      habitCompletionCounts.push(hCount);

      let tCount = 0;
      state.tasks.forEach(t => {
        if (t.completed && t.dueDate === dateStr) tCount++;
      });
      taskCompletionCounts.push(tCount);
    }

    if (consistencyChartInstance) consistencyChartInstance.destroy();

    consistencyChartInstance = new Chart(lineCanvas, {
      type: 'line',
      data: {
        labels: last7Days,
        datasets: [
          {
            label: 'Habits Completed',
            data: habitCompletionCounts,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 3,
            tension: 0.35,
            fill: true
          },
          {
            label: 'Tasks Ticked',
            data: taskCompletionCounts,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            borderWidth: 3,
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: textColor, font: { family: 'Inter', weight: '500' } }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Inter' } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Inter' }, stepSize: 1 }
          }
        }
      }
    });
  }

  // 2. Pie Chart: Category Distribution (Coding, Study, Personal, Daily, Weekly)
  const pieCanvas = document.getElementById("chart-category-pie");
  if (pieCanvas) {
    const categories = ["Coding", "Study", "Personal", "Daily", "Weekly"];
    const categoryCounts = [0, 0, 0, 0, 0];

    // Count categories in habits
    state.habits.forEach(h => {
      const idx = categories.indexOf(h.category);
      if (idx !== -1) categoryCounts[idx]++;
    });

    // Count categories in tasks
    state.tasks.forEach(t => {
      const idx = categories.indexOf(t.category);
      if (idx !== -1) categoryCounts[idx]++;
    });

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(pieCanvas, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: categoryCounts,
          backgroundColor: [
            '#06b6d4', // Cyan (Coding)
            '#8b5cf6', // Violet (Study)
            '#10b981', // Emerald (Personal)
            '#f59e0b', // Amber (Daily)
            '#f43f5e'  // Rose (Weekly)
          ],
          borderWidth: 2,
          borderColor: isLight ? '#ffffff' : '#0f172a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: textColor, font: { family: 'Inter', weight: '500' } }
          }
        },
        cutout: '65%'
      }
    });
  }
}
