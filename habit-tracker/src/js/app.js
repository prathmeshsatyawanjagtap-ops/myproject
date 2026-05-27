// app.js - Main Application Orchestrator

import { AppStore } from './storage.js';
import { initAuth, checkAuthGuard, navigateToAuthView } from './auth.js';
import { initDashboard, renderDashboard } from './dashboard.js';
import { initHabits, renderHabits } from './habits.js';
import { initTasks, renderTasks } from './tasks.js';
import { initGoals, renderGoals } from './goals.js';
import { initAnalytics, renderAnalytics } from './analytics.js';
import { initProductivity, renderProductivity } from './productivity.js';
import { initSettings, renderSettings } from './settings.js';

// Active View State
let currentView = "dashboard";

document.addEventListener("DOMContentLoaded", () => {
  setupRouting();
  setupThemeSystem();
  setupModals();
  setupQuickAdd();
  setupAchievementToastListener();
  setupMobileSidebarToggle();
  
  // Initialize Auth & Views
  initAuth();
  initDashboard();
  initHabits();
  initTasks();
  initGoals();
  initAnalytics();
  initProductivity();
  initSettings();

  // Load Initial State
  syncGlobalElements(AppStore.state);
  
  // Check active session routing
  const activeSession = localStorage.getItem("disciplinex_active_user") || sessionStorage.getItem("disciplinex_active_user");
  const isGuestActive = localStorage.getItem("disciplinex_guest_active") === "true";
  const isFreshUser = localStorage.getItem("disciplinex_landing_seen") !== "true";

  if (isFreshUser && !activeSession && !isGuestActive) {
    showLandingPage();
  } else if (!activeSession && !isGuestActive) {
    navigateToAuthView("signin");
  } else {
    showAppDashboard();
  }

  // Subscribe to store updates for reactive elements
  AppStore.subscribe((state) => {
    syncGlobalElements(state);
    refreshActiveView();
  });

  // Landing Page Buttons
  document.getElementById("btn-enter-app-nav").addEventListener("click", () => {
    localStorage.setItem("disciplinex_landing_seen", "true");
    const active = localStorage.getItem("disciplinex_active_user") || sessionStorage.getItem("disciplinex_active_user");
    const guest = localStorage.getItem("disciplinex_guest_active") === "true";
    if (active || guest) {
      showAppDashboard();
    } else {
      navigateToAuthView("signin");
    }
  });
  
  document.getElementById("btn-hero-start").addEventListener("click", () => {
    localStorage.setItem("disciplinex_landing_seen", "true");
    const active = localStorage.getItem("disciplinex_active_user") || sessionStorage.getItem("disciplinex_active_user");
    const guest = localStorage.getItem("disciplinex_guest_active") === "true";
    if (active || guest) {
      showAppDashboard();
    } else {
      navigateToAuthView("signin");
    }
  });

  // Update date header
  updateDateHeader();
  setInterval(updateDateHeader, 60000); // refresh every minute
});

function showLandingPage() {
  document.getElementById("view-landing").style.display = "block";
  document.getElementById("view-app").style.display = "none";
  
  // Hide auth screens
  ["signin", "signup", "forgot", "onboarding"].forEach(v => {
    document.getElementById(`view-${v}`).style.display = "none";
  });
}

function showAppDashboard() {
  document.getElementById("view-landing").style.display = "none";
  
  // Hide auth screens
  ["signin", "signup", "forgot", "onboarding"].forEach(v => {
    document.getElementById(`view-${v}`).style.display = "none";
  });
  
  document.getElementById("view-app").style.display = "flex";
  
  // Initial draw
  refreshActiveView();
}

function updateDateHeader() {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const today = new Date();
  document.getElementById("top-nav-date").textContent = today.toLocaleDateString('en-US', options);
}

// Router routing
function setupRouting() {
  const navItems = document.querySelectorAll(".nav-links .nav-item");
  const mobileNavItems = document.querySelectorAll(".mobile-nav a");
  const logoutItem = document.getElementById("nav-item-logout");

  function switchView(targetView) {
    // Check route guard before loading main app view
    if (!checkAuthGuard(targetView)) return;

    currentView = targetView;
    
    // Update active class on nav elements
    document.querySelectorAll(".nav-links .nav-item, .mobile-nav a").forEach(el => {
      if (el.getAttribute("data-target") === targetView) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });

    // Update title
    const formattedTitle = targetView.charAt(0).toUpperCase() + targetView.slice(1);
    document.getElementById("top-nav-title").textContent = formattedTitle;

    // Show targeted section
    document.querySelectorAll(".content-section").forEach(sec => {
      if (sec.id === `section-${targetView}`) {
        sec.classList.add("active");
      } else {
        sec.classList.remove("active");
      }
    });

    // Close mobile sidebar if open
    document.getElementById("app-sidebar").classList.remove("open");

    // Render targeted view contents
    refreshActiveView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Sidebar link clicks
  navItems.forEach(item => {
    // Ignore logout button click which is special action
    if (item.id === "nav-item-logout") return;
    
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const target = item.getAttribute("data-target");
      switchView(target);
    });
  });

  // Mobile navigation link clicks
  mobileNavItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const target = item.getAttribute("data-target");
      switchView(target);
    });
  });

  // Quick action from profile banner
  document.getElementById("sidebar-profile-btn").addEventListener("click", () => {
    switchView("settings");
  });

  // Sidebar Logout action click
  if (logoutItem) {
    logoutItem.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Are you sure you want to log out?")) {
        AppStore.logout();
        navigateToAuthView("signin");
      }
    });
  }
}

function refreshActiveView() {
  switch (currentView) {
    case "dashboard":
      renderDashboard(AppStore.state);
      break;
    case "habits":
      renderHabits(AppStore.state);
      break;
    case "tasks":
      renderTasks(AppStore.state);
      break;
    case "goals":
      renderGoals(AppStore.state);
      break;
    case "analytics":
      renderAnalytics(AppStore.state);
      break;
    case "productivity":
      renderProductivity(AppStore.state);
      break;
    case "settings":
      renderSettings(AppStore.state);
      break;
  }
}

// Sync global shell displays
function syncGlobalElements(state) {
  // Sync profile displays
  const name = state.profile.name || (AppStore.activeUserEmail ? AppStore.activeUserEmail.split("@")[0] : "Guest Builder");
  const motto = state.profile.motto || "Discipline Builds Destiny.";
  
  document.getElementById("sidebar-name").textContent = name;
  document.getElementById("sidebar-motto").textContent = motto;
  
  // Render Avatar circle
  const avatarWrapper = document.getElementById("sidebar-avatar");
  if (avatarWrapper) {
    const avatarData = state.profile.avatar || "coder";
    
    if (avatarData.startsWith("data:image/")) {
      // Base64 custom uploaded picture
      avatarWrapper.innerHTML = `<img src="${avatarData}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    } else {
      // Pre-defined graphic emojis
      const emojis = { coder: "💻", runner: "🏃", student: "📚", artist: "🎨" };
      avatarWrapper.textContent = emojis[avatarData] || "👤";
    }
  }

  // Header quick details
  const dashName = document.getElementById("dash-username");
  if (dashName) {
    dashName.textContent = name.split(" ")[0];
  }

  // Sync theme selection
  if (state.settings.theme === "light") {
    document.documentElement.classList.add("theme-light");
    document.getElementById("theme-sun-icon").style.display = "block";
    document.getElementById("theme-moon-icon").style.display = "none";
  } else {
    document.documentElement.classList.remove("theme-light");
    document.getElementById("theme-sun-icon").style.display = "none";
    document.getElementById("theme-moon-icon").style.display = "block";
  }

  // Sync general counts (Dashboard top banner stat boxes)
  const statsHabits = document.getElementById("dash-stat-habits");
  const statsTasks = document.getElementById("dash-stat-tasks");
  
  if (statsHabits && statsTasks) {
    const todayStr = new Date().toISOString().split("T")[0];
    const totalHabits = state.habits.length;
    const completedHabits = state.habits.filter(h => h.history[todayStr]).length;

    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(t => t.completed).length;

    statsHabits.textContent = `${completedHabits}/${totalHabits}`;
    statsTasks.textContent = `${completedTasks}/${totalTasks}`;
  }

  // Draw trophy alerts dot if there are locked badges (gamification loop helper)
  const alertDot = document.getElementById("badge-alert-dot");
  if (alertDot) {
    const hasUnlocks = Object.values(state.badges).includes(true);
    alertDot.style.display = hasUnlocks ? "block" : "none";
  }
}

// Theme Config Wrapper
function setupThemeSystem() {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  toggleBtn.addEventListener("click", () => {
    const isLight = document.documentElement.classList.contains("theme-light");
    const nextTheme = isLight ? "dark" : "light";
    AppStore.updateSettings({ theme: nextTheme });
  });
}

// Dialog Modal setups
function setupModals() {
  const closeButtons = document.querySelectorAll("[data-close]");
  
  closeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      closeAllModals();
    });
  });

  // Close modals if background overlay clicked
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });
}

export function openModal(modalId) {
  closeAllModals();
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    // Auto-focus first input field in modal
    const firstInput = modal.querySelector("input, select, textarea");
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }
}

export function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.classList.remove("active");
  });
  // Close floating menus if open
  document.getElementById("quick-add-menu").classList.remove("active");
}

// Floating Quick Add trigger control
function setupQuickAdd() {
  const mainBtn = document.getElementById("floating-add-btn");
  const menu = document.getElementById("quick-add-menu");

  mainBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("active");
  });

  document.body.addEventListener("click", () => {
    menu.classList.remove("active");
  });

  // Set action click triggers on quick-add menu circles
  document.getElementById("quick-add-habit-btn").addEventListener("click", () => openModal("modal-add-habit"));
  document.getElementById("quick-add-task-btn").addEventListener("click", () => openModal("modal-add-task"));
  document.getElementById("quick-add-goal-btn").addEventListener("click", () => openModal("modal-add-goal"));
  document.getElementById("quick-add-journal-btn").addEventListener("click", () => {
    // Redirect to productivity view, scroll down to journal and focus
    const tabProductivity = document.querySelector(".nav-links li[data-target='productivity']");
    if (tabProductivity) {
      tabProductivity.click();
      setTimeout(() => {
        const jField = document.getElementById("journal-title-field");
        if (jField) {
          jField.scrollIntoView({ behavior: 'smooth' });
          jField.focus();
        }
      }, 400);
    }
  });
}

// Mobile sidebar panel switches
function setupMobileSidebarToggle() {
  const toggleBtn = document.getElementById("menu-toggle-btn");
  const sidebar = document.getElementById("app-sidebar");

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
      sidebar.classList.remove("open");
    }
  });
}

// Achievement popups listener & Web Audio feedback
function setupAchievementToastListener() {
  window.addEventListener("badge-unlocked", (e) => {
    const { badgeId } = e.detail;
    
    // Get badge configuration details
    const badgeDetails = {
      "first-habit": { title: "Consistent Creator", desc: "Added your first habit!" },
      "hydration-hero": { title: "Hydration Hero", desc: "Hit your daily water intake target!" },
      "streak-5": { title: "Iron Discipline", desc: "Completed habits 5 days in a row!" },
      "focus-pioneer": { title: "Deep Focus Pioneer", desc: "Completed your first Pomodoro sprint!" },
      "goal-crusher": { title: "Milestone Crusher", desc: "Fully achieved a workflow goal!" },
      "journal-scribe": { title: "Mindful Scribe", desc: "Logged 3 self-reflection journals!" }
    };

    const info = badgeDetails[badgeId];
    if (info) {
      triggerToastNotification(info.title, info.desc);
      playSuccessSound();
    }
  });
}

function triggerToastNotification(title, desc) {
  const toast = document.getElementById("achievement-toast");
  document.getElementById("toast-title").textContent = title;
  document.getElementById("toast-desc").textContent = desc;

  // Reset display styles
  toast.style.opacity = "1";
  toast.style.pointerEvents = "auto";
  toast.style.transform = "translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.pointerEvents = "none";
    toast.style.transform = "translateY(100px)";
  }, 4500);
}

// Plays a retro notification sound using pure Web Audio oscillator!
function playSuccessSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Sound part 1: High frequency tick
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
    osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5
    osc1.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.36); // C6
    
    gain1.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.warn("Web audio playback not permitted or supported yet.", e);
  }
}
