// tasks.js - Task manager view logic controller

import { AppStore } from './storage.js';
import { closeAllModals } from './app.js';

let currentCategoryFilter = "all";
let currentSearchQuery = "";
let currentSort = "custom"; // custom (manual), date, priority

export function initTasks() {
  setupTaskListeners();
}

export function renderTasks(state) {
  renderTasksList(state);
}

function setupTaskListeners() {
  const quickAddForm = document.getElementById("task-quick-add-form");
  const modalForm = document.getElementById("modal-task-form");
  const searchInput = document.getElementById("task-search-input");
  const sortSelect = document.getElementById("task-sort-select");
  const filterTabs = document.querySelectorAll("#task-filter-tabs .filter-tab");

  // Inline Quick Add Form Submit
  if (quickAddForm) {
    quickAddForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = document.getElementById("new-task-text").value.trim();
      const category = document.getElementById("new-task-category").value;
      const priority = document.getElementById("new-task-priority").value;
      const dueDate = document.getElementById("new-task-due").value;

      if (text) {
        AppStore.addTask(text, category, priority, dueDate);
        
        // Reset fields
        document.getElementById("new-task-text").value = "";
        document.getElementById("new-task-due").value = "";
      }
    });
  }

  // Floating Quick Add Modal Submit
  if (modalForm) {
    modalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = document.getElementById("modal-task-text").value.trim();
      const category = document.getElementById("modal-task-category").value;
      const priority = document.getElementById("modal-task-priority").value;
      const dueDate = document.getElementById("modal-task-due").value;

      if (text) {
        AppStore.addTask(text, category, priority, dueDate);
        
        // Reset fields & close
        document.getElementById("modal-task-text").value = "";
        document.getElementById("modal-task-due").value = "";
        closeAllModals();
      }
    });
  }

  // Search input change
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      renderTasksList(AppStore.state);
    });
  }

  // Sorting selection
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderTasksList(AppStore.state);
    });
  }

  // Filtering Tabs selection
  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentCategoryFilter = tab.getAttribute("data-filter");
      renderTasksList(AppStore.state);
    });
  });
}

function renderTasksList(state) {
  const container = document.getElementById("tasks-list-container");
  if (!container) return;

  container.innerHTML = "";

  // 1. Filter Tasks
  let filteredTasks = state.tasks.filter(task => {
    // Category check
    const matchesCategory = currentCategoryFilter === "all" || task.category === currentCategoryFilter;
    
    // Search check
    const matchesSearch = task.text.toLowerCase().includes(currentSearchQuery);

    return matchesCategory && matchesSearch;
  });

  // 2. Sort Tasks
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  
  if (currentSort === "priority") {
    filteredTasks.sort((a, b) => {
      // Sort complete status first (uncompleted on top)
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  } else if (currentSort === "date") {
    filteredTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else {
    // Custom sort: Use manual array order
    filteredTasks.sort((a, b) => a.order - b.order);
  }

  if (filteredTasks.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted); font-size:0.9rem;">No tasks match your selection. Build a new target!</div>`;
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  filteredTasks.forEach((task, index) => {
    const item = document.createElement("div");
    item.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    // Check if task is overdue
    const isOverdue = !task.completed && task.dueDate && task.dueDate < todayStr;

    // Draw up/down order arrows if manual mode active
    const showOrderControls = currentSort === "custom";
    
    let priorityClass = "badge-low";
    if (task.priority === "high") priorityClass = "badge-high";
    if (task.priority === "medium") priorityClass = "badge-medium";

    item.innerHTML = `
      <div class="task-item-left">
        <div class="task-item-checkbox task-check-btn" data-task-id="${task.id}">
          <i data-lucide="check"></i>
        </div>
        <span class="task-item-text" title="${task.text}">${task.text}</span>
        
        <div class="task-item-meta">
          <span class="badge ${priorityClass}">${task.priority}</span>
          <span class="task-item-category">${task.category}</span>
          ${task.dueDate ? `
            <span class="task-item-date ${isOverdue ? 'overdue' : ''}">
              <i data-lucide="calendar" style="width:12px; height:12px;"></i>
              ${isOverdue ? 'Overdue: ' : ''}${formatDate(task.dueDate)}
            </span>
          ` : ''}
        </div>
      </div>

      <div class="task-item-right">
        ${showOrderControls ? `
          <div class="order-btn-group">
            <button class="order-btn order-up-btn" data-task-id="${task.id}" ${index === 0 ? 'disabled style="opacity:0.25; cursor:default;"' : ''} title="Move Up"><i data-lucide="chevron-up"></i></button>
            <button class="order-btn order-down-btn" data-task-id="${task.id}" ${index === filteredTasks.length - 1 ? 'disabled style="opacity:0.25; cursor:default;"' : ''} title="Move Down"><i data-lucide="chevron-down"></i></button>
          </div>
        ` : ''}
        <button class="habit-actions-trigger delete-task-btn" data-task-id="${task.id}" title="Delete Task">
          <i data-lucide="trash-2" style="width:14px; height:14px; color:var(--text-muted);"></i>
        </button>
      </div>
    `;

    container.appendChild(item);
  });

  // Bind checkbox clicks
  container.querySelectorAll(".task-check-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const taskId = btn.getAttribute("data-task-id");
      AppStore.toggleTask(taskId);
    });
  });

  // Bind delete button clicks
  container.querySelectorAll(".delete-task-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const taskId = btn.getAttribute("data-task-id");
      AppStore.deleteTask(taskId);
    });
  });

  // Bind Order buttons (Up & Down shifts)
  if (showOrderControls) {
    container.querySelectorAll(".order-up-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-task-id");
        shiftTaskOrder(state, taskId, -1);
      });
    });

    container.querySelectorAll(".order-down-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-task-id");
        shiftTaskOrder(state, taskId, 1);
      });
    });
  }

  // Draw Icons
  if (window.lucide) window.lucide.createIcons();
}

function shiftTaskOrder(state, taskId, offset) {
  // Sort state tasks array first to ensure indices align
  state.tasks.sort((a, b) => a.order - b.order);
  
  const curIndex = state.tasks.findIndex(t => t.id === taskId);
  if (curIndex === -1) return;

  const targetIndex = curIndex + offset;
  if (targetIndex < 0 || targetIndex >= state.tasks.length) return;

  // Swap orders
  const temp = state.tasks[curIndex].order;
  state.tasks[curIndex].order = state.tasks[targetIndex].order;
  state.tasks[targetIndex].order = temp;

  // Re-sort state list & notify save
  const orderedIds = state.tasks.map(t => t.id);
  AppStore.reorderTasks(orderedIds);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
