// storage.js - Central State Management & Sandboxed Multi-User LocalStorage Handler

const DEFAULT_STATE = {
  profile: {
    name: "Alex Mercer",
    avatar: "coder",
    motto: "Discipline is the bridge between goals and accomplishment."
  },
  settings: {
    theme: "dark",
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    waterGoal: 2500, // ml
    layout: {
      showWater: true,
      showMood: true,
      showTimer: true,
      showJournal: true,
      showCalendar: true
    }
  },
  todayFocus: {
    text: "Finish the dashboard UI and review weekly coding targets",
    completed: false
  },
  habits: [
    {
      id: "h1",
      name: "Morning Coding Practice",
      category: "Coding",
      color: "#3b82f6", // Blue
      createdAt: "2026-05-10",
      history: {
        "2026-05-15": true, "2026-05-16": true, "2026-05-17": true,
        "2026-05-19": true, "2026-05-20": true, "2026-05-21": true,
        "2026-05-22": true, "2026-05-24": true, "2026-05-25": true,
        "2026-05-26": true, "2026-05-27": true
      },
      reflection: {
        "2026-05": {
          achievement: "Maintained a 4-day streak and solved 15 algorithmic challenges.",
          improvement: "Need to start earlier in the morning to avoid meetings overlap.",
          notes: "Focus is getting sharper. Morning routine is working well."
        }
      }
    },
    {
      id: "h2",
      name: "Read Technical Articles",
      category: "Study",
      color: "#a855f7", // Purple
      createdAt: "2026-05-12",
      history: {
        "2026-05-15": true, "2026-05-16": false, "2026-05-17": true,
        "2026-05-18": true, "2026-05-20": true, "2026-05-21": true,
        "2026-05-22": false, "2026-05-23": true, "2026-05-24": true,
        "2026-05-25": false, "2026-05-26": true, "2026-05-27": true
      },
      reflection: {
        "2026-05": {
          achievement: "Explored 8 system design posts and React concurrency docs.",
          improvement: "Avoid scrolling feeds instead of reading bookmark backlog.",
          notes: "Reading feels like expanding horizons."
        }
      }
    },
    {
      id: "h3",
      name: "Cardio Exercise (30m)",
      category: "Personal",
      color: "#10b981", // Emerald
      createdAt: "2026-05-14",
      history: {
        "2026-05-15": true, "2026-05-17": true, "2026-05-18": true,
        "2026-05-20": false, "2026-05-21": true, "2026-05-22": true,
        "2026-05-23": true, "2026-05-24": false, "2026-05-25": true,
        "2026-05-26": true, "2026-05-27": false
      },
      reflection: {
        "2026-05": {
          achievement: "Kept moving regularly; energy level feels notably higher.",
          improvement: "Try to jog outside rather than using stationary treadmill.",
          notes: "Physical wellness definitely aids mental productivity."
        }
      }
    }
  ],
  tasks: [
    { id: "t1", text: "Create layout files for habit app", category: "Coding", priority: "high", dueDate: "2026-05-28", completed: true, order: 0 },
    { id: "t2", text: "Design SVGs for circular progress indicators", category: "Coding", priority: "medium", dueDate: "2026-05-28", completed: false, order: 1 },
    { id: "t3", text: "Prepare notes on system requirements draft", category: "Study", priority: "low", dueDate: "2026-05-29", completed: false, order: 2 },
    { id: "t4", text: "Submit final iteration draft review", category: "Personal", priority: "high", dueDate: "2026-05-30", completed: false, order: 3 },
    { id: "t5", text: "Replenish work setup utilities", category: "Personal", priority: "medium", dueDate: "2026-05-31", completed: true, order: 4 }
  ],
  goals: [
    {
      id: "g1",
      text: "Launch Personal Portfolio Platform",
      period: "monthly",
      deadline: "2026-05-31",
      completed: false,
      notes: "Showcase creative and engineering achievements.",
      milestones: [
        { id: "m1_1", text: "Finish core codebase structures", completed: true },
        { id: "m1_2", text: "Draft comprehensive copy and summaries", completed: true },
        { id: "m1_3", text: "Configure hosting and server certificates", completed: false }
      ]
    },
    {
      id: "g2",
      text: "Read 2 Books on Deep Focus & Habits",
      period: "monthly",
      deadline: "2026-05-31",
      completed: true,
      notes: "Atomic Habits by James Clear & Deep Work by Cal Newport",
      milestones: [
        { id: "m2_1", text: "Complete Atomic Habits and compile highlights", completed: true },
        { id: "m2_2", text: "Complete Deep Work and design schedules", completed: true }
      ]
    },
    {
      id: "g3",
      text: "AWS Practitioner Cloud Certificate",
      period: "yearly",
      deadline: "2026-12-15",
      completed: false,
      notes: "Build up AWS server scaling knowledge.",
      milestones: [
        { id: "m3_1", text: "Complete video training course", completed: false },
        { id: "m3_2", text: "Take 3 simulator practice papers", completed: false },
        { id: "m3_3", text: "Register and book exam slot", completed: false }
      ]
    }
  ],
  waterLog: {
    "2026-05-24": 2000,
    "2026-05-25": 2500,
    "2026-05-26": 2750,
    "2026-05-27": 1500
  },
  moodLog: {
    "2026-05-24": "good",
    "2026-05-25": "excellent",
    "2026-05-26": "neutral",
    "2026-05-27": "excellent"
  },
  journalLog: {
    "2026-05-24": {
      title: "Productive Sunday",
      content: "Felt very relaxed today. Finished planning the app modules and did a 5km run. Prepared clean workspace for the week ahead."
    },
    "2026-05-25": {
      title: "Strong Week Opening",
      content: "Excellent focus today. Morning coding block went without any interruptions. Handled all administrative tasks swiftly."
    },
    "2026-05-26": {
      title: "Middle Week Slack",
      content: "A bit tired in the afternoon. Slept late last night. Drinking water and stepping out for a walk helped restore alertness."
    },
    "2026-05-27": {
      title: "High Energy Flow",
      content: "Back to full steam! Highly excited about building the gamified parts of the system. Let's crush this sprint."
    }
  },
  badges: {
    "first-habit": true,
    "hydration-hero": true,
    "streak-5": true,
    "focus-pioneer": false,
    "goal-crusher": true,
    "journal-scribe": true
  }
};

class Store {
  constructor() {
    this.key_db = "disciplinex_user_database";
    this.key_session = "disciplinex_active_user";
    this.key_guest = "disciplinex_guest_state";
    
    this.users = this.loadUsersDb();
    
    // Seed initial mock profiles with credentials
    this.seedMockUsers();
    
    this.activeUserEmail = null; // string email or null (guest)
    this.state = null;           // active sandboxed profile state
    this.listeners = [];

    this.initializeSession();
  }

  // Load accounts db
  loadUsersDb() {
    try {
      const data = localStorage.getItem(this.key_db);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to load user database", e);
    }
    return {};
  }

  saveUsersDb() {
    try {
      localStorage.setItem(this.key_db, JSON.stringify(this.users));
    } catch (e) {
      console.error("Failed to save user database", e);
    }
  }

  seedMockUsers() {
    const mockEmail1 = "alex.mercer@gmail.com";
    const mockEmail2 = "prath.dev@gmail.com";

    // Seed mock account 1
    if (!this.users[mockEmail1]) {
      this.users[mockEmail1] = {
        password: btoa("alex123"), // Encoded mock password
        // Loaded with initial DEFAULT_STATE data
        ...JSON.parse(JSON.stringify(DEFAULT_STATE))
      };
    }

    // Seed mock account 2
    if (!this.users[mockEmail2]) {
      const prathState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      prathState.profile = {
        name: "Prath Dev",
        avatar: "student",
        motto: "Discipline Builds Destiny. Coding daily."
      };
      // Give different starting counts
      prathState.tasks = [
        { id: "pt1", text: "Solve binary search challenge", category: "Coding", priority: "high", dueDate: "2026-05-28", completed: false, order: 0 },
        { id: "pt2", text: "AWS certification test chapter 2", category: "Study", priority: "medium", dueDate: "2026-05-29", completed: true, order: 1 }
      ];
      this.users[mockEmail2] = {
        password: btoa("prath123"),
        ...prathState
      };
    }
    this.saveUsersDb();
  }

  initializeSession() {
    // Check local storage (persistent remember-me)
    let email = localStorage.getItem(this.key_session);
    
    // Check session storage (temporary tab session)
    if (!email) {
      email = sessionStorage.getItem(this.key_session);
    }

    if (email && this.users[email]) {
      // User logged in
      this.activeUserEmail = email;
      this.state = this.users[email];
    } else {
      // Load guest session
      this.activeUserEmail = null;
      this.state = this.loadGuestState();
    }
  }

  loadGuestState() {
    try {
      const guestData = localStorage.getItem(this.key_guest);
      if (guestData) {
        return { ...JSON.parse(JSON.stringify(DEFAULT_STATE)), ...JSON.parse(guestData) };
      }
    } catch (e) {
      console.error("Failed to load guest state", e);
    }
    // Load fresh cloned mock state for guest
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  // Authentication operations
  login(email, password, rememberMe) {
    const formattedEmail = email.toLowerCase().trim();
    if (this.users[formattedEmail]) {
      const decodedPassword = atob(this.users[formattedEmail].password);
      if (decodedPassword === password) {
        this.activeUserEmail = formattedEmail;
        this.state = this.users[formattedEmail];
        
        // Save session
        if (rememberMe) {
          localStorage.setItem(this.key_session, formattedEmail);
        } else {
          sessionStorage.setItem(this.key_session, formattedEmail);
        }

        // Save active state and notify router
        this.save();
        return true;
      }
    }
    return false;
  }

  signup(email, password) {
    const formattedEmail = email.toLowerCase().trim();
    if (this.users[formattedEmail]) {
      return false; // Email already exists
    }

    // Initialize clean copy of state
    const newState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    // Clear initial arrays for custom onboarding start
    newState.habits = [];
    newState.tasks = [];
    newState.goals = [];
    newState.waterLog = {};
    newState.moodLog = {};
    newState.journalLog = {};
    newState.badges = {
      "first-habit": false,
      "hydration-hero": false,
      "streak-5": false,
      "focus-pioneer": false,
      "goal-crusher": false,
      "journal-scribe": false
    };
    newState.profile = {
      name: "",
      avatar: "coder",
      motto: ""
    };

    // Store in users db with encoded password
    this.users[formattedEmail] = {
      password: btoa(password),
      ...newState
    };

    this.saveUsersDb();
    
    // Automatically log user in (temp session for onboarding step)
    this.activeUserEmail = formattedEmail;
    this.state = this.users[formattedEmail];
    sessionStorage.setItem(this.key_session, formattedEmail);
    
    this.save();
    return true;
  }

  logout() {
    this.save(); // Save final updates to user slice

    // Clear active session flags
    localStorage.removeItem(this.key_session);
    sessionStorage.removeItem(this.key_session);

    this.activeUserEmail = null;
    this.state = this.loadGuestState();
    
    this.notify();
  }

  resetPassword(email, newPassword) {
    const formattedEmail = email.toLowerCase().trim();
    if (this.users[formattedEmail]) {
      this.users[formattedEmail].password = btoa(newPassword);
      this.saveUsersDb();
      return true;
    }
    return false;
  }

  mergeGuestData() {
    if (!this.activeUserEmail) return false; // Guest cannot merge into guest

    const guestState = this.loadGuestState();
    const userState = this.state;

    // Merge Habits
    guestState.habits.forEach(guestHabit => {
      const match = userState.habits.find(h => h.name.toLowerCase() === guestHabit.name.toLowerCase());
      if (match) {
        // Merge histories
        match.history = { ...match.history, ...guestHabit.history };
        match.reflection = { ...match.reflection, ...guestHabit.reflection };
      } else {
        // Add new habit
        userState.habits.push(guestHabit);
      }
    });

    // Merge Tasks
    guestState.tasks.forEach(guestTask => {
      // Prevent duplicating ids
      guestTask.id = "t_merged_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      userState.tasks.push(guestTask);
    });

    // Merge Goals
    guestState.goals.forEach(guestGoal => {
      guestGoal.id = "g_merged_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      userState.goals.push(guestGoal);
    });

    // Merge Logs
    userState.waterLog = { ...guestState.waterLog, ...userState.waterLog };
    userState.moodLog = { ...guestState.moodLog, ...userState.moodLog };
    userState.journalLog = { ...guestState.journalLog, ...userState.journalLog };

    // Merge Badges (if guest unlocked, unlock for user too)
    Object.keys(userState.badges).forEach(key => {
      if (guestState.badges[key] === true) {
        userState.badges[key] = true;
      }
    });

    // Save and clear guest state in LocalStorage
    localStorage.removeItem(this.key_guest);
    this.save();
    return true;
  }

  deleteAccount() {
    if (this.activeUserEmail) {
      delete this.users[this.activeUserEmail];
      this.saveUsersDb();
      this.logout();
      return true;
    }
    return false;
  }

  save() {
    if (this.activeUserEmail) {
      // Save current state slice inside the database
      this.users[this.activeUserEmail] = {
        ...this.users[this.activeUserEmail],
        ...this.state
      };
      this.saveUsersDb();
    } else {
      // Save guest state
      try {
        localStorage.setItem(this.key_guest, JSON.stringify(this.state));
      } catch (e) {
        console.error("Failed to save guest local storage state", e);
      }
    }
    this.notify();
  }

  // Reactive subscription
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Profile operations
  updateProfile(profileData) {
    this.state.profile = { ...this.state.profile, ...profileData };
    this.save();
  }

  // Settings operations
  updateSettings(settingsData) {
    this.state.settings = { ...this.state.settings, ...settingsData };
    this.save();
  }

  // Today Focus
  updateTodayFocus(text, completed = false) {
    this.state.todayFocus = { text, completed };
    this.save();
  }

  // Habit operations
  addHabit(name, category, color) {
    const newHabit = {
      id: "h_" + Date.now(),
      name,
      category,
      color,
      createdAt: new Date().toISOString().split("T")[0],
      history: {},
      reflection: {}
    };
    this.state.habits.push(newHabit);
    this.unlockBadge("first-habit");
    this.save();
    return newHabit;
  }

  toggleHabitDay(habitId, dateStr) {
    const habit = this.state.habits.find(h => h.id === habitId);
    if (habit) {
      habit.history[dateStr] = !habit.history[dateStr];
      this.evaluateStreakBadges();
      this.save();
    }
  }

  updateHabitReflection(habitId, yearMonthStr, reflectionData) {
    const habit = this.state.habits.find(h => h.id === habitId);
    if (habit) {
      habit.reflection[yearMonthStr] = {
        ...habit.reflection[yearMonthStr],
        ...reflectionData
      };
      this.save();
    }
  }

  deleteHabit(habitId) {
    this.state.habits = this.state.habits.filter(h => h.id !== habitId);
    this.save();
  }

  // Task operations
  addTask(text, category, priority, dueDate) {
    const newTask = {
      id: "t_" + Date.now(),
      text,
      category,
      priority,
      dueDate,
      completed: false,
      order: this.state.tasks.length
    };
    this.state.tasks.push(newTask);
    this.save();
    return newTask;
  }

  toggleTask(taskId) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.save();
    }
  }

  deleteTask(taskId) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
    this.save();
  }

  updateTask(taskId, updatedFields) {
    const taskIndex = this.state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.state.tasks[taskIndex] = {
        ...this.state.tasks[taskIndex],
        ...updatedFields
      };
      this.save();
    }
  }

  reorderTasks(orderedIds) {
    orderedIds.forEach((id, index) => {
      const task = this.state.tasks.find(t => t.id === id);
      if (task) {
        task.order = index;
      }
    });
    this.state.tasks.sort((a, b) => a.order - b.order);
    this.save();
  }

  // Goal operations
  addGoal(text, period, deadline, notes, milestones = []) {
    const newGoal = {
      id: "g_" + Date.now(),
      text,
      period,
      deadline,
      notes,
      completed: false,
      milestones: milestones.map((m, i) => ({
        id: `m_${Date.now()}_${i}`,
        text: m,
        completed: false
      }))
    };
    this.state.goals.push(newGoal);
    this.save();
    return newGoal;
  }

  toggleMilestone(goalId, milestoneId) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      const milestone = goal.milestones.find(m => m.id === milestoneId);
      if (milestone) {
        milestone.completed = !milestone.completed;
        const allCompleted = goal.milestones.length > 0 && goal.milestones.every(m => m.completed);
        goal.completed = allCompleted;

        if (goal.completed) {
          this.unlockBadge("goal-crusher");
        }
        this.save();
      }
    }
  }

  toggleGoalCompleted(goalId) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      goal.completed = !goal.completed;
      goal.milestones.forEach(m => m.completed = goal.completed);
      if (goal.completed) {
        this.unlockBadge("goal-crusher");
      }
      this.save();
    }
  }

  deleteGoal(goalId) {
    this.state.goals = this.state.goals.filter(g => g.id !== goalId);
    this.save();
  }

  // Water log
  addWater(amountMl, dateStr) {
    const currentAmount = this.state.waterLog[dateStr] || 0;
    this.state.waterLog[dateStr] = currentAmount + amountMl;
    
    if (this.state.waterLog[dateStr] >= this.state.settings.waterGoal) {
      this.unlockBadge("hydration-hero");
    }
    this.save();
  }

  resetWater(dateStr) {
    this.state.waterLog[dateStr] = 0;
    this.save();
  }

  // Mood log
  setMood(mood, dateStr) {
    this.state.moodLog[dateStr] = mood;
    this.save();
  }

  // Journal log
  saveJournalEntry(title, content, dateStr) {
    this.state.journalLog[dateStr] = { title, content };
    const entryCount = Object.keys(this.state.journalLog).length;
    if (entryCount >= 3) {
      this.unlockBadge("journal-scribe");
    }
    this.save();
  }

  // Badges
  unlockBadge(badgeId) {
    if (this.state.badges[badgeId] === false) {
      this.state.badges[badgeId] = true;
      this.save();
      const event = new CustomEvent("badge-unlocked", { detail: { badgeId } });
      window.dispatchEvent(event);
    }
  }

  evaluateStreakBadges() {
    let maxStreak = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    
    this.state.habits.forEach(habit => {
      const dates = Object.keys(habit.history).filter(d => habit.history[d]).sort();
      if (dates.length === 0) return;
      
      let currentStreak = 0;
      let tempStreak = 0;
      let prevDate = null;

      dates.forEach(dateStr => {
        if (!prevDate) {
          tempStreak = 1;
        } else {
          const prev = new Date(prevDate);
          const curr = new Date(dateStr);
          const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            if (tempStreak > currentStreak) currentStreak = tempStreak;
            tempStreak = 1;
          }
        }
        prevDate = dateStr;
      });
      
      if (tempStreak > currentStreak) currentStreak = tempStreak;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    });

    if (maxStreak >= 5) {
      this.unlockBadge("streak-5");
    }
  }
}

export const AppStore = new Store();
