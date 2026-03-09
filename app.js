// ========================================
// FIREBASE INITIALIZATION
// ========================================
// Config loaded from firebase-config.js (separate file)

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========================================
// HELPER: Get today's date string
// ========================================

function getTodayString() {
  return new Date().toISOString().split('T')[0]; // "2026-02-27"
}

// ========================================
// STATE MANAGEMENT
// ========================================

let appState = {
  currentPhase: 0,
  level: 'A2',
  startDate: null,
  lastVisit: null,
  theme: 'dark',
  pimsleurProgress: 16, // Next lesson to do
  currentPodcastSource: 0,
  
  // DATE-BASED TRACKING
  dailyHistory: {
    // "2026-02-26": {
    //   date: "2026-02-26",
    //   coreCompleted: ["pimsleur", "anki-review"],
    //   pimsleurLesson: 16,
    //   weeklyCompleted: {},
    //   bonusCompleted: [],
    //   completedAt: "2026-02-26T18:30:00Z"
    // }
  },
  
  syncStatus: 'pending'
};

let tasksConfig = null;

// ========================================
// INITIALIZATION
// ========================================

async function init() {
  showLoading(true);
  
  initTheme();
  await loadTasksConfig();
  await loadState();
  
  updatePhase();
  renderAll();
  setupEventListeners();
  
  showLoading(false);
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
    overlay.classList.remove('hidden');
  } else {
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }
}

// ========================================
// THEME SYSTEM
// ========================================

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    appState.theme = savedTheme;
  } else if (systemPrefersDark) {
    appState.theme = 'dark';
  } else {
    appState.theme = 'light';
  }
  
  applyTheme();
}

function applyTheme() {
  const html = document.documentElement;
  const themeIcon = document.querySelector('.theme-icon');
  
  if (appState.theme === 'light') {
    html.setAttribute('data-theme', 'light');
    if (themeIcon) themeIcon.textContent = '☀️';
  } else {
    html.removeAttribute('data-theme');
    if (themeIcon) themeIcon.textContent = '🌙';
  }
  
  localStorage.setItem('theme', appState.theme);
}

function toggleTheme() {
  appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
}

// ========================================
// LOAD TASKS CONFIGURATION
// ========================================

async function loadTasksConfig() {
  try {
    const response = await fetch('tasks.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    tasksConfig = await response.json();
    console.log('✅ Loaded tasks configuration');
  } catch (error) {
    console.error('❌ Failed to load tasks.json:', error);
    alert('Failed to load tasks.json. Make sure the file is in the same directory as index.html');
    throw error;
  }
}

// ========================================
// DATE-BASED TRACKING HELPERS
// ========================================

function getTodayData() {
  const today = getTodayString();
  if (!appState.dailyHistory[today]) {
    appState.dailyHistory[today] = {
      date: today,
      coreCompleted: [],
      pimsleurLesson: null,
      weeklyCompleted: {},
      bonusCompleted: [],
      completedAt: null
    };
  }
  return appState.dailyHistory[today];
}

function wasTaskCompletedToday(taskId) {
  const todayData = getTodayData();
  return todayData.coreCompleted.includes(taskId);
}

function getPimsleurLessonForToday() {
  const todayData = getTodayData();
  return todayData.pimsleurLesson || appState.pimsleurProgress;
}

// ========================================
// LEVEL & PHASE MANAGEMENT
// ========================================

function getCurrentLevel() {
  const now = new Date();
  const start = appState.startDate ? new Date(appState.startDate) : now;
  const monthsElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30));
  
  if (monthsElapsed < 4) return 'A2';
  if (monthsElapsed < 8) return 'B1';
  return 'B2';
}

function updatePhase() {
  const level = getCurrentLevel();
  appState.level = level;
  
  if (level === 'A2') appState.currentPhase = 0;
  else if (level === 'B1') appState.currentPhase = 1;
  else appState.currentPhase = 2;
  
  const phase = tasksConfig.phases[appState.currentPhase];
  const banner = document.getElementById('phaseBanner');
  
  banner.innerHTML = `
    <div class="phase-header">
      <span class="phase-badge">${phase.level}</span>
      <span class="phase-title">${phase.name}</span>
    </div>
    <div class="phase-description">${phase.description}</div>
  `;
  
  document.getElementById('stat-level').textContent = phase.level;
}

// ========================================
// RENDER ALL SECTIONS
// ========================================

function renderAll() {
  renderDailyCore();
  renderWeeklyRotation();
  renderBonusTasks();
  updateStats();
  updateSyncStatus();
}

function renderDailyCore() {
  const level = appState.level;
  const coreTasks = tasksConfig.dailyCore[level];
  const todayData = getTodayData();
  
  const container = document.getElementById('tasksContainer');
  container.innerHTML = '';
  
  const coreSection = document.createElement('div');
  coreSection.className = 'priority-band';
  coreSection.innerHTML = `
    <div class="band-header">
      <div class="band-indicator must"></div>
      <div class="band-title">DAILY CORE (35 min)</div>
      <div class="band-subtitle">Complete all 4 = streak day</div>
    </div>
    <div class="band-tasks" id="coreTasks"></div>
  `;
  container.appendChild(coreSection);
  
  const coreTasksContainer = document.getElementById('coreTasks');
  
  coreTasks.forEach((task) => {
    const taskDiv = document.createElement('div');
    const completed = todayData.coreCompleted.includes(task.id);
    
    let taskName = task.name;
    let taskDescription = task.description;
    
    // Special handling for Pimsleur
    if (task.id === 'pimsleur' && task.autoProgress) {
      const lessonNum = appState.pimsleurProgress;
      const unitNum = Math.ceil(lessonNum / 30);
      const lessonInUnit = ((lessonNum - 1) % 30) + 1;
      taskName = `Pimsleur Unit ${unitNum}, Lesson ${lessonInUnit}`;
      
      if (completed) {
        taskDescription = `✅ Completed today! Next lesson: ${lessonNum + 1}`;
      }
    }
    
    // Special handling for podcast
    if (task.id === 'podcast-chunk' && task.sources) {
      const sourceIndex = appState.currentPodcastSource || 0;
      const currentSource = task.sources[sourceIndex];
      taskDescription = `🎧 Listening to: ${currentSource.name}`;
    }
    
    taskDiv.className = `task ${completed ? 'completed' : ''}`;
    taskDiv.dataset.taskId = task.id;
    
    const urlHTML = task.url ? `<a href="${task.url}" target="_blank" class="task-link" onclick="event.stopPropagation()">🔗 Open</a>` : '';
    
    // Add podcast source link if available
    let podcastHTML = '';
    if (task.id === 'podcast-chunk' && task.sources) {
      const sourceIndex = appState.currentPodcastSource || 0;
      const currentSource = task.sources[sourceIndex];
      podcastHTML = `
        <a href="${currentSource.url}" target="_blank" class="task-link" onclick="event.stopPropagation()">🔗 ${currentSource.name}</a>
        <button class="task-link" onclick="event.stopPropagation(); refreshPodcastSource()" style="margin-left: 0.5rem; border: 1px solid var(--accent);">
          🔄 New Podcast
        </button>
      `;
    }
    
    taskDiv.innerHTML = `
      <div class="task-checkbox"></div>
      <div class="task-content">
        <div class="task-title">${taskName}</div>
        <div class="task-description">${taskDescription}</div>
        ${task.instruction && !completed ? `<div class="task-description" style="font-style: italic; margin-top: 0.3rem;">💡 ${task.instruction}</div>` : ''}
        ${urlHTML}
        ${podcastHTML}
        <div class="task-meta">
          <span class="task-tag tag-${task.type}">${task.type}</span>
          <span class="task-time">${task.time}</span>
        </div>
      </div>
    `;
    
    taskDiv.addEventListener('click', () => toggleCoreTask(task.id));
    coreTasksContainer.appendChild(taskDiv);
  });
}

function renderWeeklyRotation() {
  const container = document.getElementById('tasksContainer');
  const todayData = getTodayData();
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  
  const weeklyTask = tasksConfig.weeklyRotation.schedule[today];
  const completed = todayData.weeklyCompleted[today] || false;
  
  const weeklySection = document.createElement('div');
  weeklySection.className = 'priority-band';
  weeklySection.style.marginTop = '1.5rem';
  
  weeklySection.innerHTML = `
    <div class="band-header">
      <div class="band-indicator should"></div>
      <div class="band-title">TODAY'S WEEKLY TASK (${today})</div>
      <div class="band-subtitle">Optional - doesn't affect streak</div>
    </div>
    <div class="band-tasks">
      <div class="task ${completed ? 'completed' : ''}" data-task-id="weekly-${today}">
        <div class="task-checkbox"></div>
        <div class="task-content">
          <div class="task-title">${weeklyTask.task}</div>
          ${weeklyTask.instruction ? `<div class="task-description">${weeklyTask.instruction}</div>` : ''}
          ${weeklyTask.note ? `<div class="task-description" style="font-style: italic; margin-top: 0.3rem;">📌 ${weeklyTask.note}</div>` : ''}
          ${weeklyTask.url ? `<a href="${weeklyTask.url}" target="_blank" class="task-link" onclick="event.stopPropagation()">🔗 Open</a>` : ''}
          <div class="task-meta">
            <span class="task-tag tag-${weeklyTask.type}">${weeklyTask.type}</span>
            <span class="task-time">${weeklyTask.time}</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(weeklySection);
  
  weeklySection.querySelector('.task').addEventListener('click', () => toggleWeeklyTask(today));
}

function renderBonusTasks() {
  const container = document.getElementById('tasksContainer');
  const todayData = getTodayData();
  
  const bonusSection = document.createElement('div');
  bonusSection.className = 'priority-band';
  bonusSection.style.marginTop = '1.5rem';
  
  const bonusList = Object.values(tasksConfig.bonusTasks.available);
  
  const tasksHTML = bonusList.map(task => {
    const completed = todayData.bonusCompleted.includes(task.name);
    return `
      <div class="task ${completed ? 'completed' : ''}" data-task-id="${task.name}">
        <div class="task-checkbox"></div>
        <div class="task-content">
          <div class="task-title">${task.name}</div>
          ${task.instruction ? `<div class="task-description">${task.instruction}</div>` : ''}
          ${task.url ? `<a href="${task.url}" target="_blank" class="task-link" onclick="event.stopPropagation()">🔗 Open</a>` : ''}
          <div class="task-meta">
            <span class="task-tag tag-${task.type}">${task.type}</span>
            <span class="task-time">${task.time}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  bonusSection.innerHTML = `
    <div class="band-header">
      <div class="band-indicator bonus"></div>
      <div class="band-title">BONUS TASKS (High Energy Only)</div>
      <div class="band-subtitle">No guilt if skipped</div>
    </div>
    <div class="band-tasks">
      ${tasksHTML}
    </div>
  `;
  
  container.appendChild(bonusSection);
  
  bonusSection.querySelectorAll('.task').forEach(taskEl => {
    const taskId = taskEl.dataset.taskId;
    taskEl.addEventListener('click', () => toggleBonusTask(taskId));
  });
}

// ========================================
// TASK INTERACTION (DATE-BASED)
// ========================================

function toggleCoreTask(taskId) {
  const today = getTodayString();
  const todayData = getTodayData();
  const index = todayData.coreCompleted.indexOf(taskId);
  
  if (index > -1) {
    // Uncompleting task
    todayData.coreCompleted.splice(index, 1);
    
    // If uncompleting Pimsleur, decrement global counter
    if (taskId === 'pimsleur' && todayData.pimsleurLesson === appState.pimsleurProgress - 1) {
      appState.pimsleurProgress--;
      todayData.pimsleurLesson = null;
      console.log('⬅️ Pimsleur decremented to', appState.pimsleurProgress);
    }
  } else {
    // Completing task
    todayData.coreCompleted.push(taskId);
    todayData.completedAt = new Date().toISOString();
    
    // If completing Pimsleur, increment ONCE
    if (taskId === 'pimsleur') {
      if (todayData.pimsleurLesson === null) {
        todayData.pimsleurLesson = appState.pimsleurProgress;
        appState.pimsleurProgress++;
        console.log('➡️ Pimsleur incremented to', appState.pimsleurProgress);
      } else {
        console.log('⏸️ Pimsleur already completed today (Lesson ' + todayData.pimsleurLesson + ')');
      }
    }
    
    // Check if all core tasks done
    const level = appState.level;
    const coreTasks = tasksConfig.dailyCore[level];
    if (todayData.coreCompleted.length === coreTasks.length) {
      showCelebration();
    }
  }
  
  saveState();
  renderAll();
}

function toggleWeeklyTask(day) {
  const todayData = getTodayData();
  todayData.weeklyCompleted[day] = !todayData.weeklyCompleted[day];
  saveState();
  renderAll();
}

function toggleBonusTask(taskId) {
  const todayData = getTodayData();
  const index = todayData.bonusCompleted.indexOf(taskId);
  
  if (index > -1) {
    todayData.bonusCompleted.splice(index, 1);
  } else {
    todayData.bonusCompleted.push(taskId);
  }
  
  saveState();
  renderAll();
}

function refreshPodcastSource() {
  const level = appState.level;
  const task = tasksConfig.dailyCore[level].find(t => t.id === 'podcast-chunk');
  
  if (task && task.sources) {
    const currentIndex = appState.currentPodcastSource || 0;
    const nextIndex = (currentIndex + 1) % task.sources.length;
    appState.currentPodcastSource = nextIndex;
    
    const newSource = task.sources[nextIndex];
    console.log(`🔄 Podcast changed to: ${newSource.name}`);
    
    saveState();
    renderAll();
  }
}

function showCelebration() {
  const cel = document.getElementById('celebration');
  cel.classList.add('show');
  setTimeout(() => {
    cel.classList.remove('show');
  }, 2500);
}

// ========================================
// STATISTICS
// ========================================

function updateStats() {
  // Calculate streak
  let streak = 0;
  const dates = Object.keys(appState.dailyHistory).sort().reverse();
  const level = appState.level;
  const coreTasks = tasksConfig.dailyCore[level];
  const coreTaskCount = coreTasks.length;
  
  for (const date of dates) {
    const dayData = appState.dailyHistory[date];
    if (dayData.coreCompleted.length === coreTaskCount) {
      streak++;
    } else {
      break; // Streak broken
    }
  }
  
  appState.streak = streak;
  
  // Calculate total tasks
  let totalCompleted = 0;
  Object.values(appState.dailyHistory).forEach(day => {
    totalCompleted += day.coreCompleted.length;
    totalCompleted += Object.keys(day.weeklyCompleted).filter(k => day.weeklyCompleted[k]).length;
    totalCompleted += day.bonusCompleted.length;
  });
  
  // Calculate today's progress
  const todayData = getTodayData();
  const todayCompleted = todayData.coreCompleted.length;
  const todayPercent = coreTaskCount > 0 ? Math.round((todayCompleted / coreTaskCount) * 100) : 0;
  
  document.getElementById('stat-streak').textContent = streak;
  document.getElementById('stat-total').textContent = totalCompleted;
  document.getElementById('stat-today').textContent = todayPercent + '%';
}

function updateSyncStatus() {
  // Optional: Add sync indicator
}

// ========================================
// STATE PERSISTENCE
// ========================================

async function saveState() {
  appState.syncStatus = 'syncing';
  
  // Save to localStorage first (instant)
  try {
    localStorage.setItem('french_tracker_state', JSON.stringify(appState));
    console.log('💾 Saved to localStorage');
  } catch (error) {
    console.error('❌ localStorage save failed:', error);
  }
  
  // Then try Firestore
  try {
    await db.collection('users').doc('me').set(appState);
    appState.syncStatus = 'synced';
    console.log('☁️ Synced to Firestore');
  } catch (error) {
    appState.syncStatus = 'offline';
    console.log('⚠️ Firestore sync failed (offline mode):', error.message);
  }
}

async function loadState() {
  console.log('📂 Loading state...');
  
  // Try Firestore first
  try {
    const doc = await db.collection('users').doc('me').get();
    if (doc.exists) {
      const cloudData = doc.data();
      appState = { ...appState, ...cloudData };
      console.log('☁️ Loaded from Firestore');
      appState.syncStatus = 'synced';
      
      localStorage.setItem('french_tracker_state', JSON.stringify(appState));
      return;
    }
  } catch (error) {
    console.log('⚠️ Firestore load failed, trying localStorage:', error.message);
  }
  
  // Fallback to localStorage
  try {
    const local = localStorage.getItem('french_tracker_state');
    if (local) {
      appState = { ...appState, ...JSON.parse(local) };
      console.log('💾 Loaded from localStorage');
      appState.syncStatus = 'offline';
    }
  } catch (error) {
    console.error('❌ localStorage load failed:', error);
  }
  
  // Initialize defaults
  if (!appState.startDate) {
    appState.startDate = new Date().toISOString();
    appState.lastVisit = new Date().toISOString();
    saveState();
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  document.getElementById('refreshBtn').addEventListener('click', () => {
    if (confirm('Refresh today\'s tasks? This will NOT reset your progress.')) {
      renderAll();
    }
  });
  
  document.getElementById('resetBtn').addEventListener('click', resetProgress);
  document.getElementById('exportBtn').addEventListener('click', exportData);
}

function resetProgress() {
  if (!confirm('Reset ALL progress? This will delete everything and cannot be undone.')) return;
  
  appState = {
    currentPhase: 0,
    level: 'A2',
    startDate: new Date().toISOString(),
    lastVisit: null,
    theme: appState.theme,
    pimsleurProgress: 16,
    currentPodcastSource: 0,
    dailyHistory: {},
    syncStatus: 'pending'
  };
  
  saveState();
  location.reload();
}

function exportData() {
  const dataStr = JSON.stringify(appState, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `french-tracker-backup-${getTodayString()}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  alert('Backup downloaded! Keep this file safe.');
}

// ========================================
// MANUAL PROGRESS ENTRY
// ========================================

window.addPastProgress = function(date, lessonNumber, tasksCompleted = []) {
  // Add progress for a specific past date
  // Example: addPastProgress("2026-02-26", 16, ["pimsleur", "anki-review"])
  
  if (!appState.dailyHistory[date]) {
    appState.dailyHistory[date] = {
      date: date,
      coreCompleted: tasksCompleted,
      pimsleurLesson: lessonNumber,
      weeklyCompleted: {},
      bonusCompleted: [],
      completedAt: new Date(date).toISOString()
    };
    
    // Update global Pimsleur progress if needed
    if (lessonNumber >= appState.pimsleurProgress) {
      appState.pimsleurProgress = lessonNumber + 1;
    }
    
    console.log(`✅ Added progress for ${date}: Lesson ${lessonNumber}`);
    saveState();
    renderAll();
  } else {
    console.log(`⚠️ Progress already exists for ${date}`);
  }
};

// ========================================
// START APP
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
