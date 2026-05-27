// goals.js - Goal manager view logic controller

import { AppStore } from './storage.js';
import { openModal, closeAllModals } from './app.js';

let currentGoalPeriodFilter = "all";
let tempMilestonesList = []; // temporary list for the creation modal

export function initGoals() {
  setupGoalListeners();
}

export function renderGoals(state) {
  renderGoalsGrid(state);
}

function setupGoalListeners() {
  const addGoalBtn = document.getElementById("add-goal-btn");
  const modalForm = document.getElementById("modal-goal-form");
  const addMilestoneBtn = document.getElementById("modal-milestone-add-btn");
  const milestoneInput = document.getElementById("modal-milestone-input");
  const periodTabs = document.querySelectorAll("#goal-period-tabs .period-tab");

  if (addGoalBtn) {
    addGoalBtn.addEventListener("click", () => {
      // Clear previous states
      tempMilestonesList = [];
      renderTempMilestones();
      openModal("modal-add-goal");
    });
  }

  // Adding sub-milestone checklist items in creation modal
  if (addMilestoneBtn) {
    addMilestoneBtn.addEventListener("click", () => {
      const text = milestoneInput.value.trim();
      if (text) {
        tempMilestonesList.push(text);
        milestoneInput.value = "";
        renderTempMilestones();
      }
    });
  }

  // Create Goal Form Submit
  if (modalForm) {
    modalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = document.getElementById("modal-goal-text").value.trim();
      const period = document.getElementById("modal-goal-period").value;
      const deadline = document.getElementById("modal-goal-due").value;
      const notes = document.getElementById("modal-goal-notes").value.trim();

      if (text) {
        AppStore.addGoal(text, period, deadline, notes, tempMilestonesList);
        
        // Reset and close
        document.getElementById("modal-goal-text").value = "";
        document.getElementById("modal-goal-notes").value = "";
        document.getElementById("modal-goal-due").value = "";
        tempMilestonesList = [];
        closeAllModals();
      }
    });
  }

  // Period Tabs filtering clicks
  periodTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      periodTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentGoalPeriodFilter = tab.getAttribute("data-period");
      renderGoalsGrid(AppStore.state);
    });
  });
}

// Renders list in modal builder block
function renderTempMilestones() {
  const container = document.getElementById("modal-milestone-list");
  if (!container) return;

  container.innerHTML = "";
  tempMilestonesList.forEach((mText, index) => {
    const item = document.createElement("div");
    item.className = "added-milestone-item";
    item.innerHTML = `
      <span>${mText}</span>
      <button type="button" class="remove-temp-milestone-btn" data-index="${index}"><i data-lucide="x" style="width:12px; height:12px;"></i></button>
    `;
    container.appendChild(item);
  });

  // Bind click removal
  container.querySelectorAll(".remove-temp-milestone-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"));
      tempMilestonesList.splice(idx, 1);
      renderTempMilestones();
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function renderGoalsGrid(state) {
  const container = document.getElementById("goals-grid-container");
  if (!container) return;

  container.innerHTML = "";

  // 1. Filter goals
  const filteredGoals = state.goals.filter(goal => {
    return currentGoalPeriodFilter === "all" || goal.period === currentGoalPeriodFilter;
  });

  if (filteredGoals.length === 0) {
    container.innerHTML = `<div style="grid-column: span 3; text-align:center; padding:3rem; color:var(--text-muted); font-size:0.9rem;">No goals listed. Outline a new objective to start!</div>`;
    return;
  }

  filteredGoals.forEach(goal => {
    const card = document.createElement("div");
    card.className = `glass-card goal-card ${goal.completed ? 'completed' : ''}`;

    // Calculate percentage completion
    const totalMilestones = goal.milestones.length;
    const completedMilestones = goal.milestones.filter(m => m.completed).length;

    let progressPercentage = 0;
    if (totalMilestones > 0) {
      progressPercentage = Math.round((completedMilestones / totalMilestones) * 100);
    } else {
      progressPercentage = goal.completed ? 100 : 0;
    }

    // Days remaining count
    const remainingText = getRemainingDaysText(goal.deadline, goal.completed);

    let listHtml = "";
    if (totalMilestones > 0) {
      listHtml = `
        <div class="milestones-title">Milestones</div>
        <ul class="milestones-list">
          ${goal.milestones.map(m => `
            <li class="milestone-item ${m.completed ? 'completed' : ''}">
              <div class="milestone-checkbox milestone-check-btn" data-goal-id="${goal.id}" data-milestone-id="${m.id}">
                <i data-lucide="check"></i>
              </div>
              <span>${m.text}</span>
            </li>
          `).join('')}
        </ul>
      `;
    }

    card.innerHTML = `
      <div class="goal-card-header">
        <div style="display:flex; flex-direction:column; gap:0.4rem; overflow:hidden; max-width:80%;">
          <span class="goal-badge ${goal.period}">${goal.period}</span>
          <h4 class="goal-card-title" title="${goal.text}">${goal.text}</h4>
        </div>
        <div class="task-item-checkbox goal-check-btn" data-goal-id="${goal.id}" style="width:22px; height:22px; border-radius:6px; border:2px solid var(--border-color); ${goal.completed ? 'background-color: var(--accent-emerald); border-color: var(--accent-emerald);' : ''}">
          <i data-lucide="check" style="color:#fff; display: ${goal.completed ? 'block' : 'none'}; font-size:0.8rem;"></i>
        </div>
      </div>

      ${goal.notes ? `<div class="goal-notes">${goal.notes}</div>` : ''}

      <!-- Progress Section -->
      <div class="goal-progress-section">
        <div class="goal-progress-meta">
          <span>Progress</span>
          <span>${progressPercentage}%</span>
        </div>
        <div class="goal-progress-bar-bg">
          <div class="goal-progress-bar-fill" style="width: ${progressPercentage}%;"></div>
        </div>
      </div>

      <!-- Milestone list checklist -->
      ${listHtml}

      <!-- Card Footer -->
      <div class="goal-card-footer">
        <span class="goal-deadline ${remainingText.isNear ? 'near-deadline' : ''}">
          <i data-lucide="calendar" style="width:12px; height:12px;"></i>
          ${remainingText.text}
        </span>
        <button class="goal-delete-btn delete-goal-btn" data-goal-id="${goal.id}" title="Delete Goal">
          <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // Bind milestone toggles
  container.querySelectorAll(".milestone-check-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const goalId = btn.getAttribute("data-goal-id");
      const milestoneId = btn.getAttribute("data-milestone-id");
      AppStore.toggleMilestone(goalId, milestoneId);
    });
  });

  // Bind full goal toggles
  container.querySelectorAll(".goal-check-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const goalId = btn.getAttribute("data-goal-id");
      AppStore.toggleGoalCompleted(goalId);
    });
  });

  // Bind deletes
  container.querySelectorAll(".delete-goal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const goalId = btn.getAttribute("data-goal-id");
      if (confirm("Are you sure you want to delete this goal?")) {
        AppStore.deleteGoal(goalId);
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function getRemainingDaysText(deadlineStr, completed) {
  if (completed) return { text: "Completed", isNear: false };
  if (!deadlineStr) return { text: "No deadline set", isNear: false };

  const today = new Date();
  today.setHours(0,0,0,0);
  
  const target = new Date(deadlineStr);
  target.setHours(0,0,0,0);

  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)}d`, isNear: true };
  } else if (diffDays === 0) {
    return { text: "Due today!", isNear: true };
  } else if (diffDays === 1) {
    return { text: "Due tomorrow", isNear: true };
  } else if (diffDays <= 3) {
    return { text: `${diffDays} days left`, isNear: true };
  } else {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return { text: `Due ${target.toLocaleDateString('en-US', options)}`, isNear: false };
  }
}
