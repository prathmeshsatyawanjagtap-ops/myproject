// settings.js - Settings configuration view controller

import { AppStore } from './storage.js';

let activeAvatar = "coder";
let customAvatarBase64 = null;

export function initSettings() {
  setupSettingsListeners();
}

export function renderSettings(state) {
  // Sync profile details
  const nameInput = document.getElementById("settings-name-input");
  const mottoInput = document.getElementById("settings-motto-input");
  
  if (nameInput) {
    nameInput.value = state.profile.name || "";
    mottoInput.value = state.profile.motto || "";
    
    // Sync Avatar Selectors
    activeAvatar = state.profile.avatar || "coder";
    
    // If active avatar is a custom Base64 string, unselect all pre-defined grid items
    const avatarItems = document.querySelectorAll("#settings-avatar-grid .avatar-select-item");
    avatarItems.forEach(item => {
      if (!activeAvatar.startsWith("data:image/") && item.getAttribute("data-avatar") === activeAvatar) {
        item.classList.add("selected");
      } else {
        item.classList.remove("selected");
      }
    });
  }

  // Sync Layout Switchers
  const toggleWater = document.getElementById("layout-toggle-water");
  const toggleMood = document.getElementById("layout-toggle-mood");
  const toggleTimer = document.getElementById("layout-toggle-timer");
  const toggleJournal = document.getElementById("layout-toggle-journal");

  if (toggleWater) {
    toggleWater.checked = state.settings.layout.showWater !== false;
    toggleMood.checked = state.settings.layout.showMood !== false;
    toggleTimer.checked = state.settings.layout.showTimer !== false;
    toggleJournal.checked = state.settings.layout.showJournal !== false;
  }

  // Apply layout settings in real time to widgets
  applyLayoutVisibility(state);

  // Render Account-specific details (Merge guest vs updating email/pass)
  renderAccountDetails(state);
}

function setupSettingsListeners() {
  const profileForm = document.getElementById("settings-profile-form");
  const avatarItems = document.querySelectorAll("#settings-avatar-grid .avatar-select-item");
  const avatarUpload = document.getElementById("settings-avatar-upload");
  const toggleWater = document.getElementById("layout-toggle-water");
  const toggleMood = document.getElementById("layout-toggle-mood");
  const toggleTimer = document.getElementById("layout-toggle-timer");
  const toggleJournal = document.getElementById("layout-toggle-journal");

  const exportBtn = document.getElementById("backup-export-btn");
  const importInput = document.getElementById("backup-import-file");
  const resetBtn = document.getElementById("backup-reset-btn");

  const accountForm = document.getElementById("settings-account-form");
  const mergeBtn = document.getElementById("settings-merge-guest-btn");

  // Profile update submit
  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("settings-name-input").value.trim();
      const motto = document.getElementById("settings-motto-input").value.trim();

      if (name) {
        const finalAvatar = customAvatarBase64 ? customAvatarBase64 : activeAvatar;
        AppStore.updateProfile({
          name: name,
          motto: motto,
          avatar: finalAvatar
        });
        
        customAvatarBase64 = null; // Clear temp upload buffer
        alert("Profile details updated successfully!");
      }
    });
  }

  // Avatar Select item clicks
  avatarItems.forEach(item => {
    item.addEventListener("click", () => {
      avatarItems.forEach(i => i.classList.remove("selected"));
      item.classList.add("selected");
      activeAvatar = item.getAttribute("data-avatar");
      customAvatarBase64 = null; // Clear file input selections
    });
  });

  // Custom avatar picture upload listener
  if (avatarUpload) {
    avatarUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        customAvatarBase64 = event.target.result;
        // Unselect pre-defined grid options
        avatarItems.forEach(i => i.classList.remove("selected"));
        alert(`Custom image "${file.name}" uploaded successfully! Click "Update Profile" to save changes.`);
      };
      reader.readAsDataURL(file);
    });
  }

  // Layout check switch clicks
  const updateLayout = () => {
    AppStore.updateSettings({
      layout: {
        showWater: toggleWater.checked,
        showMood: toggleMood.checked,
        showTimer: toggleTimer.checked,
        showJournal: toggleJournal.checked
      }
    });
  };

  [toggleWater, toggleMood, toggleTimer, toggleJournal].forEach(toggle => {
    if (toggle) {
      toggle.addEventListener("change", updateLayout);
    }
  });

  // Account form credentials edit submission
  if (accountForm) {
    accountForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const newEmail = document.getElementById("settings-email-input").value.trim();
      const newPass = document.getElementById("settings-pass-input").value;

      if (!AppStore.activeUserEmail) return;

      // Update Email
      if (newEmail && newEmail.toLowerCase() !== AppStore.activeUserEmail) {
        const target = newEmail.toLowerCase();
        if (AppStore.users[target]) {
          alert("Email address already in use by another account.");
          return;
        }

        // Copy slot data to new key, delete old key
        AppStore.users[target] = AppStore.users[AppStore.activeUserEmail];
        delete AppStore.users[AppStore.activeUserEmail];
        
        // Update session key
        AppStore.activeUserEmail = target;
        if (localStorage.getItem("disciplinex_active_user")) {
          localStorage.setItem("disciplinex_active_user", target);
        } else {
          sessionStorage.setItem("disciplinex_active_user", target);
        }
      }

      // Update Password
      if (newPass) {
        if (newPass.length < 6) {
          alert("New password must be at least 6 characters.");
          return;
        }
        AppStore.users[AppStore.activeUserEmail].password = btoa(newPass);
      }

      AppStore.saveUsersDb();
      AppStore.save();
      
      document.getElementById("settings-pass-input").value = "";
      alert("Account credentials updated successfully!");
    });
  }

  // Merge Guest Data trigger
  if (mergeBtn) {
    mergeBtn.addEventListener("click", () => {
      const merged = AppStore.mergeGuestData();
      if (merged) {
        alert("Success! Guest routine completions and tasks have been merged into your account.");
        window.location.reload();
      } else {
        alert("No guest logs found to merge, or you are not logged in.");
      }
    });
  }

  // Export JSON backups file
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataStr = AppStore.exportData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const namePrefix = AppStore.activeUserEmail ? AppStore.activeUserEmail.split("@")[0] : "guest";
      const exportFileDefaultName = `disciplinex_backup_${namePrefix}_${new Date().toISOString().split("T")[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    });
  }

  // Upload/Restore backup JSON files
  if (importInput) {
    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const success = AppStore.importData(text);
        
        if (success) {
          alert("Backup data restored successfully! Reloading configuration.");
          window.location.reload();
        } else {
          alert("Failed to parse JSON backup. Please check file format.");
        }
      };
      reader.readAsText(file);
    });
  }

  // Wipe/Reset all LocalStorage state
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const isUser = AppStore.activeUserEmail !== null;
      const confirmMsg = isUser 
        ? "Wiping account will permanently delete your database slot on this machine. Proceed?" 
        : "WARNING: Wipe all data? This will clear all local records. Action is permanent.";

      if (confirm(confirmMsg)) {
        if (isUser) {
          AppStore.deleteAccount();
          alert("Account deleted. Relogging as guest.");
        } else {
          AppStore.clearAllData();
          alert("Local memory wiped.");
        }
        window.location.reload();
      }
    });
  }
}

// Shows or hides widgets according to settings checkboxes
function applyLayoutVisibility(state) {
  const layout = state.settings.layout;

  const waterCard = document.querySelector(".water-card");
  if (waterCard) {
    waterCard.style.display = layout.showWater ? "flex" : "none";
  }

  const moodCard = document.querySelector(".mood-btn")?.closest(".glass-card");
  if (moodCard) {
    moodCard.style.display = layout.showMood ? "flex" : "none";
  }

  const timerCard = document.querySelector(".timer-card");
  if (timerCard) {
    timerCard.style.display = layout.showTimer ? "block" : "none";
  }

  const journalCard = document.querySelector(".journal-log-section");
  if (journalCard) {
    journalCard.style.display = layout.showJournal ? "flex" : "none";
  }
}

function renderAccountDetails(state) {
  const statusText = document.getElementById("account-status-text");
  const emailGroup = document.getElementById("settings-email-group");
  const passGroup = document.getElementById("settings-pass-group");
  const updateBtn = document.getElementById("settings-account-update-btn");
  const mergeBtn = document.getElementById("settings-merge-guest-btn");

  const deleteBtn = document.getElementById("backup-reset-btn");

  if (!statusText) return;

  if (AppStore.activeUserEmail) {
    // Registered User Session
    statusText.textContent = `Logged in as: ${AppStore.activeUserEmail}`;
    statusText.style.color = "var(--accent-emerald)";
    
    emailGroup.style.display = "block";
    passGroup.style.display = "block";
    updateBtn.style.display = "block";
    
    // Fill active email
    document.getElementById("settings-email-input").value = AppStore.activeUserEmail;
    
    // Hide guest conversions
    mergeBtn.style.display = "none";
    
    // Customize Danger zone delete button text
    if (deleteBtn) deleteBtn.innerHTML = `<i data-lucide="trash-2"></i> Delete Account permanently`;
  } else {
    // Guest Session
    statusText.textContent = "Currently running in Guest Session";
    statusText.style.color = "var(--accent-cyan)";
    
    emailGroup.style.display = "none";
    passGroup.style.display = "none";
    updateBtn.style.display = "none";
    
    // Check if guest state has logs to merge
    const guestState = AppStore.loadGuestState();
    const hasGuestLogs = guestState.habits.length > 0 || guestState.tasks.length > 0 || guestState.goals.length > 0;
    
    mergeBtn.style.display = "block";
    mergeBtn.disabled = !hasGuestLogs;
    mergeBtn.style.opacity = hasGuestLogs ? "1" : "0.5";
    
    if (deleteBtn) deleteBtn.innerHTML = `<i data-lucide="trash-2"></i> Wipe local Guest records`;
  }
  
  if (window.lucide) window.lucide.createIcons();
}
