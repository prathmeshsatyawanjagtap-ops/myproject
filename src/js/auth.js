// auth.js - Authentication & Onboarding View Logic Controller

import { AppStore } from './storage.js';
import { closeAllModals, openModal } from './app.js';

let generatedResetToken = null;
let onboardingAvatar = "coder";
let onboardingCustomAvatarBase64 = null;
let inactivityTimer = null;
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function initAuth() {
  setupAuthListeners();
  setupOnboardingListeners();
  setupInactivityTracker();
}

// Global route guard verification
export function checkAuthGuard(targetView) {
  const activeSession = localStorage.getItem("disciplinex_active_user") || sessionStorage.getItem("disciplinex_active_user");
  const isGuestActive = localStorage.getItem("disciplinex_guest_active") === "true";

  // Auth pages
  const isAuthPage = ["signin", "signup", "forgot", "onboarding"].includes(targetView);

  if (targetView === "landing") {
    return true; // Landing is public
  }

  if (!activeSession && !isGuestActive) {
    // If not authenticated and not in guest session
    if (!isAuthPage) {
      navigateToAuthView("signin");
      return false; // block navigation
    }
  } else if (activeSession) {
    // Authenticated user trying to access login page -> send to dashboard
    if (isAuthPage && targetView !== "onboarding") {
      navigateToAppView("dashboard");
      return false;
    }
  }
  return true;
}

export function navigateToAuthView(viewName) {
  // Hide main app & landing page
  document.getElementById("view-landing").style.display = "none";
  document.getElementById("view-app").style.display = "none";
  
  // Hide all auth sections, show target
  ["signin", "signup", "forgot", "onboarding"].forEach(v => {
    document.getElementById(`view-${v}`).style.display = "none";
  });
  
  document.getElementById(`view-${viewName}`).style.display = "flex";
  
  // Set window URL hash
  window.location.hash = `auth-${viewName}`;
  if (window.lucide) window.lucide.createIcons();
}

function navigateToAppView(viewName) {
  document.getElementById("view-landing").style.display = "none";
  ["signin", "signup", "forgot", "onboarding"].forEach(v => {
    document.getElementById(`view-${v}`).style.display = "none";
  });
  
  document.getElementById("view-app").style.display = "flex";
  
  // Dispatch custom nav switch event in app.js
  const navItem = document.querySelector(`.nav-links li[data-target='${viewName}']`);
  if (navItem) navItem.click();
}

function setupAuthListeners() {
  const signinForm = document.getElementById("signin-form");
  const signupForm = document.getElementById("signup-form");
  
  const linkGotoSignup = document.getElementById("link-goto-signup");
  const linkGotoSignin = document.getElementById("link-goto-signin");
  const linkForgot = document.getElementById("link-forgot-password");
  const linkForgotGotoSignin = document.getElementById("link-forgot-goto-signin");
  const btnSigninGuest = document.getElementById("btn-signin-guest");
  
  const btnGoogleSignin = document.getElementById("btn-google-signin");

  // Sign In Form Submission
  if (signinForm) {
    signinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("signin-email").value.trim();
      const password = document.getElementById("signin-password").value;
      const rememberMe = document.getElementById("signin-remember").checked;
      const loader = document.getElementById("signin-loader");
      const errorAlert = document.getElementById("signin-error-alert");

      errorAlert.classList.remove("active");
      loader.classList.add("active");

      // Simulated network latency
      setTimeout(() => {
        const success = AppStore.login(email, password, rememberMe);
        loader.classList.remove("active");

        if (success) {
          localStorage.removeItem("disciplinex_guest_active"); // wipe guest session flag
          navigateToAppView("dashboard");
        } else {
          errorAlert.classList.add("active");
          document.getElementById("signin-error-text").textContent = "Invalid email address or password.";
        }
      }, 1000);
    });
  }

  // Sign Up Form Submission
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;
      const passwordConfirm = document.getElementById("signup-password-confirm").value;
      const loader = document.getElementById("signup-loader");
      const errorAlert = document.getElementById("signup-error-alert");

      errorAlert.classList.remove("active");

      if (password.length < 6) {
        errorAlert.classList.add("active");
        document.getElementById("signup-error-text").textContent = "Password must be at least 6 characters long.";
        return;
      }

      if (password !== passwordConfirm) {
        errorAlert.classList.add("active");
        document.getElementById("signup-error-text").textContent = "Passwords do not match.";
        return;
      }

      loader.classList.add("active");

      setTimeout(() => {
        const success = AppStore.signup(email, password);
        loader.classList.remove("active");

        if (success) {
          // Success onboarding transition
          localStorage.removeItem("disciplinex_guest_active");
          navigateToAuthView("onboarding");
        } else {
          errorAlert.classList.add("active");
          document.getElementById("signup-error-text").textContent = "Email is already registered.";
        }
      }, 1200);
    });
  }

  // Password Recovery Flow
  const forgotEmailForm = document.getElementById("forgot-email-form");
  const forgotResetForm = document.getElementById("forgot-reset-form");

  if (forgotEmailForm) {
    forgotEmailForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("forgot-email").value.trim().toLowerCase();
      const errorAlert = document.getElementById("forgot-error-alert");
      const loader = document.getElementById("forgot-loader-1");

      errorAlert.classList.remove("active");
      loader.classList.add("active");

      setTimeout(() => {
        loader.classList.remove("active");
        if (AppStore.users[email]) {
          // Generate token DX-XXXX
          generatedResetToken = "DX-" + Math.floor(1000 + Math.random() * 9000);
          
          // Render token hint
          document.getElementById("simulated-token-hint").textContent = `SIMULATED EMAIL INBOX: Your password reset token is: ${generatedResetToken}`;
          
          // Switch fields
          forgotEmailForm.style.display = "none";
          forgotResetForm.style.display = "flex";
        } else {
          errorAlert.classList.add("active");
          document.getElementById("forgot-error-text").textContent = "Email not found in database.";
        }
      }, 1000);
    });
  }

  if (forgotResetForm) {
    forgotResetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const enteredToken = document.getElementById("forgot-token-val").value.trim();
      const newPassword = document.getElementById("forgot-new-password").value;
      const errorAlert = document.getElementById("forgot-error-alert");
      const loader = document.getElementById("forgot-loader-2");

      errorAlert.classList.remove("active");

      if (enteredToken !== generatedResetToken) {
        errorAlert.classList.add("active");
        document.getElementById("forgot-error-text").textContent = "Invalid reset token.";
        return;
      }

      if (newPassword.length < 6) {
        errorAlert.classList.add("active");
        document.getElementById("forgot-error-text").textContent = "Password must be at least 6 characters.";
        return;
      }

      loader.classList.add("active");

      setTimeout(() => {
        loader.classList.remove("active");
        const email = document.getElementById("forgot-email").value.trim().toLowerCase();
        
        AppStore.resetPassword(email, newPassword);
        
        alert("Password reset successfully! Please sign in with your new credentials.");
        
        // Reset forms back
        forgotEmailForm.style.display = "flex";
        forgotResetForm.style.display = "none";
        document.getElementById("forgot-email").value = "";
        document.getElementById("forgot-token-val").value = "";
        document.getElementById("forgot-new-password").value = "";
        
        navigateToAuthView("signin");
      }, 1000);
    });
  }

  // Google Simulated Sign In Modal Triggers
  if (btnGoogleSignin) {
    btnGoogleSignin.addEventListener("click", () => {
      openModal("modal-google-chooser");
    });
  }

  // Set click actions inside choices modal
  document.querySelectorAll(".google-mock-account").forEach(card => {
    card.addEventListener("click", () => {
      const email = card.getAttribute("data-email");
      const name = card.getAttribute("data-name");
      
      closeAllModals();
      
      // Simulate google landing popup loader
      const signinLoader = document.getElementById("signin-loader");
      if (signinLoader) signinLoader.classList.add("active");

      setTimeout(() => {
        if (signinLoader) signinLoader.classList.remove("active");
        
        // Auto register if account doesn't exist
        const formattedEmail = email.toLowerCase().trim();
        if (!AppStore.users[formattedEmail]) {
          // Signup first
          AppStore.signup(formattedEmail, "googleMockPass123");
          // Preload profile details
          AppStore.updateProfile({
            name: name,
            motto: "Continue building destiny via Google Login.",
            avatar: "coder"
          });
          localStorage.removeItem("disciplinex_guest_active");
          navigateToAuthView("onboarding");
        } else {
          // Direct login
          AppStore.login(formattedEmail, "googleMockPass123", true);
          localStorage.removeItem("disciplinex_guest_active");
          navigateToAppView("dashboard");
        }
      }, 1200);
    });
  });

  // Navigate links
  if (linkGotoSignup) linkGotoSignup.addEventListener("click", () => navigateToAuthView("signup"));
  if (linkGotoSignin) linkGotoSignin.addEventListener("click", () => navigateToAuthView("signin"));
  if (linkForgot) linkForgot.addEventListener("click", () => navigateToAuthView("forgot"));
  if (linkForgotGotoSignin) linkForgotGotoSignin.addEventListener("click", () => navigateToAuthView("signin"));
  
  // Guest login bypass
  if (btnSigninGuest) {
    btnSigninGuest.addEventListener("click", () => {
      localStorage.setItem("disciplinex_guest_active", "true");
      AppStore.logout(); // Swaps active state to guest, clears token sessions
      navigateToAppView("dashboard");
    });
  }
}

// ================= ONBOARDING MANAGER =================
function setupOnboardingListeners() {
  const btnNext = document.getElementById("btn-onboarding-next");
  const btnPrev = document.getElementById("btn-onboarding-prev");
  const btnFinish = document.getElementById("btn-onboarding-finish");
  
  const panel1 = document.getElementById("ob-panel-1");
  const panel2 = document.getElementById("ob-panel-2");
  
  const dot1 = document.getElementById("ob-dot-1");
  const dot2 = document.getElementById("ob-dot-2");

  const avatarGridItems = document.querySelectorAll("#onboarding-avatar-grid .avatar-select-item");
  const avatarFileInput = document.getElementById("onboarding-avatar-file");
  const fileStatus = document.getElementById("onboarding-file-status");

  const welcomeCloseBtn = document.getElementById("btn-welcome-screen-close");

  btnNext.addEventListener("click", () => {
    const nameVal = document.getElementById("onboarding-name").value.trim();
    if (!nameVal) {
      alert("Please enter your name to continue profile setup.");
      return;
    }
    // Switch view
    panel1.classList.remove("active");
    panel2.classList.add("active");
    dot1.classList.remove("active");
    dot2.classList.add("active");
  });

  btnPrev.addEventListener("click", () => {
    panel2.classList.remove("active");
    panel1.classList.add("active");
    dot2.classList.remove("active");
    dot1.classList.add("active");
  });

  // Pre-defined avatar item clicks
  avatarGridItems.forEach(item => {
    item.addEventListener("click", () => {
      avatarGridItems.forEach(i => i.classList.remove("selected"));
      item.classList.add("selected");
      onboardingAvatar = item.getAttribute("data-avatar");
      onboardingCustomAvatarBase64 = null; // Clear custom upload if grid item clicked
      fileStatus.textContent = "Pre-defined icon selected";
    });
  });

  // Custom Profile Picture upload reader (FileReader -> Base64 string conversion)
  if (avatarFileInput) {
    avatarFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        onboardingCustomAvatarBase64 = event.target.result;
        avatarGridItems.forEach(i => i.classList.remove("selected"));
        fileStatus.textContent = `Custom Image Uploaded (${file.name})`;
      };
      reader.readAsDataURL(file);
    });
  }

  // Complete onboarding click
  btnFinish.addEventListener("click", () => {
    const name = document.getElementById("onboarding-name").value.trim();
    const motto = document.getElementById("onboarding-motto").value.trim();

    const finalAvatar = onboardingCustomAvatarBase64 ? onboardingCustomAvatarBase64 : onboardingAvatar;

    AppStore.updateProfile({
      name: name,
      motto: motto || "Discipline Builds Destiny.",
      avatar: finalAvatar
    });

    // Reset onboarding form fields
    document.getElementById("onboarding-name").value = "";
    document.getElementById("onboarding-motto").value = "";
    avatarGridItems.forEach(i => i.classList.remove("selected"));
    avatarGridItems[0].classList.add("selected");
    avatarFileInput.value = "";
    fileStatus.textContent = "No custom file chosen";
    
    panel2.classList.remove("active");
    panel1.classList.add("active");
    dot2.classList.remove("active");
    dot1.classList.add("active");

    // Display Achievement Welcome popups
    const welcomeScreen = document.getElementById("view-welcome-screen");
    welcomeScreen.classList.add("active");
    playOnboardingRewardSound();
  });

  welcomeCloseBtn.addEventListener("click", () => {
    const welcomeScreen = document.getElementById("view-welcome-screen");
    welcomeScreen.classList.remove("active");
    navigateToAppView("dashboard");
  });
}

function playOnboardingRewardSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    const playTone = (time, freq, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.start(time);
      osc.stop(time + duration);
    };

    // Arpeggio sound
    playTone(now, 261.63, 0.4); // C4
    playTone(now + 0.15, 329.63, 0.4); // E4
    playTone(now + 0.3, 392.00, 0.4); // G4
    playTone(now + 0.45, 523.25, 0.8); // C5
  } catch (e) {
    console.warn("Web audio playback blocked.", e);
  }
}

// ================= INACTIVITY TIMER =================
function setupInactivityTracker() {
  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logoutOnTimeout, INACTIVITY_TIMEOUT);
  };

  // Bind key user interactions
  window.addEventListener("mousemove", resetTimer);
  window.addEventListener("mousedown", resetTimer);
  window.addEventListener("keypress", resetTimer);
  window.addEventListener("touchstart", resetTimer);
  window.addEventListener("scroll", resetTimer);

  resetTimer();
}

function logoutOnTimeout() {
  // Timeout session only if user is logged in AND "Remember Me" is not active
  const activeSession = localStorage.getItem("disciplinex_active_user") || sessionStorage.getItem("disciplinex_active_user");
  const isRemembered = localStorage.getItem("disciplinex_active_user") !== null;

  if (activeSession && !isRemembered) {
    alert("Session expired due to 15 minutes of inactivity. Please log back in.");
    AppStore.logout();
    navigateToAuthView("signin");
  }
}
