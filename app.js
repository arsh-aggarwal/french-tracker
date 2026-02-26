// ========================================
// FIREBASE CONFIGURATION
// ========================================

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========================================
// STATE MANAGEMENT
// ========================================

let appState = {
  currentPhase: 0,
  level: 'A2',
  coreCompleted: [],
  weeklyCompleted: {},
  bonusCompleted: [],
  totalCompleted: 0,
  streak: 0,
  startDate: null,
  lastVisit: null,
  theme: 'dark',
  pimsleurProgress: 16
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
    themeIcon.textContent = '☀️';
  } else {
    html.removeAttribute('data-theme');
    themeIcon.textContent = '🌙';
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
    console.log('Loaded tasks configuration successfully');
  } catch (error) {
    console.error('Failed to load tasks configuration:', error);
    alert('Failed to load tasks.json. Make sure the file is in the same directory as index.html');
    throw error;
  }
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
}

function renderDailyCore() {
  const level = appState.level;
  const coreTasks = tasksConfig.dailyCore[level];
  
  const container = document.getElementById('tasksContainer');
  container.innerHTML = '';
  
  // Daily Core Section
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
  
  coreTasks.forEach((task, index) => {
    const taskDiv = document.createElement('div');
    const completed = appState.coreCompleted.includes(task.id);
    
    // Special handling for Pimsleur
    let taskName = task.name;
    if (task.id === 'pimsleur' && task.autoProgress) {
      const lessonNum = appState.pimsleurProgress;
      const unitNum = Math.ceil(lessonNum / 30);
      const lessonInUnit = ((lessonNum - 1) % 30) + 1;
      taskName = `Pimsleur Unit ${unitNum}, Lesson ${lessonInUnit}`;
    }
    
    taskDiv.className = `task ${completed ? 'completed' : ''}`;
    taskDiv.dataset.taskId = task.id;
    taskDiv.dataset.taskType = 'core';
    
    const urlHTML = task.url ? `<a href="${task.url}" target="_blank" class="task-link" onclick="event.stopPropagation()">🔗 Open</a>` : '';
    
    taskDiv.innerHTML = `
      <div class="task-checkbox"></div>
      <div class="task-content">
        <div class="task-title">${taskName}</div>
        <div class="task-description">${task.description}</div>
        ${task.instruction ? `<div class="task-description" style="font-style: italic; margin-top: 0.3rem;">💡 ${task.instruction}</div>` : ''}
        ${urlHTML}
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
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  
  const weeklyTask = tasksConfig.weeklyRotation.schedule[today];
  const completed = appState.weeklyCompleted[today] || false;
  
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
      <div class="task ${completed ? 'completed' : ''}" data-task-id="weekly-${today}" data-task-type="weekly">
        <div class="task-checkbox"></div>
        <div class="task-content">
          <div class="task-title">${weeklyTask.task}</div>
          <div class="task-description">${weeklyTask.instruction || ''}</div>
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
  
  const bonusSection = document.createElement('div');
  bonusSection.className = 'priority-band';
  bonusSection.style.marginTop = '1.5rem';
  
  const bonusList = Object.values(tasksConfig.bonusTasks.available);
  
  const tasksHTML = bonusList.map(task => {
    const completed = appState.bonusCompleted.includes(task.name);
    return `
      <div class="task ${completed ? 'completed' : ''}" data-task-id="${task.name}" data-task-type="bonus">
        <div class="task-checkbox"></div>
        <div class="task-content">
          <div class="task-title">${task.name}</div>
          <div class="task-description">${task.instruction || ''}</div>
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
// TASK INTERACTION
// ========================================

function toggleCoreTask(taskId) {
  const index = appState.coreCompleted.indexOf(taskId);
  
  if (index > -1) {
    appState.coreCompleted.splice(index, 1);
  } else {
    appState.coreCompleted.push(taskId);
    appState.totalCompleted++;
    
    // Auto-increment Pimsleur
    if (taskId === 'pimsleur') {
      appState.pimsleurProgress++;
    }
    
    // Check if all core tasks done
    const level = appState.level;
    const coreTasks = tasksConfig.dailyCore[level];
    if (appState.coreCompleted.length === coreTasks.length) {
      showCelebration();
    }
  }
  
  saveState();
  renderAll();
}

function toggleWeeklyTask(day) {
  appState.weeklyCompleted[day] = !appState.weeklyCompleted[day];
  if (appState.weeklyCompleted[day]) {
    appState.totalCompleted++;
  }
  saveState();
  renderAll();
}

function toggleBonusTask(taskId) {
  const index = appState.bonusCompleted.indexOf(taskId);
  
  if (index > -1) {
    appState.bonusCompleted.splice(index, 1);
  } else {
    appState.bonusCompleted.push(taskId);
    appState.totalCompleted++;
  }
  
  saveState();
  renderAll();
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
  // Update streak
  const today = new Date().toDateString();
  const lastVisit = appState.lastVisit ? new Date(appState.lastVisit).toDateString() : null;
  
  if (lastVisit !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if all core tasks were completed yesterday
    const level = appState.level;
    const coreTasks = tasksConfig.dailyCore[level];
    const allCoreCompleted = appState.coreCompleted.length === coreTasks.length;
    
    if (lastVisit === yesterday.toDateString() && allCoreCompleted) {
      // Consecutive day with all core tasks done
      appState.streak++;
    } else if (lastVisit && !allCoreCompleted) {
      // Broke streak
      appState.streak = 0;
    } else if (!lastVisit) {
      // First day
      appState.streak = 0;
    }
    
    // Reset daily tasks for new day
    appState.coreCompleted = [];
    appState.bonusCompleted = [];
    
    appState.lastVisit = new Date().toISOString();
    saveState();
  }
  
  // Calculate today's progress
  const level = appState.level;
  const coreTasks = tasksConfig.dailyCore[level];
  const coreTotal = coreTasks.length;
  const coreCompleted = appState.coreCompleted.length;
  const todayPercent = coreTotal > 0 ? Math.round((coreCompleted / coreTotal) * 100) : 0;
  
  document.getElementById('stat-streak').textContent = appState.streak;
  document.getElementById('stat-total').textContent = appState.totalCompleted;
  document.getElementById('stat-today').textContent = todayPercent + '%';
}

// ========================================
// STATE PERSISTENCE
// ========================================

async function saveState() {
  try {
    await db.collection('users').doc('me').set(appState);
  } catch (error) {
    console.log('Firestore save failed, using localStorage:', error);
  }
  
  localStorage.setItem('french_tracker_state', JSON.stringify(appState));
}

async function loadState() {
  try {
    const doc = await db.collection('users').doc('me').get();
    if (doc.exists) {
      appState = { ...appState, ...doc.data() };
      console.log('Loaded state from Firestore');
    } else {
      const local = localStorage.getItem('french_tracker_state');
      if (local) {
        appState = { ...appState, ...JSON.parse(local) };
        console.log('Loaded state from localStorage');
      }
    }
  } catch (error) {
    console.log('Firestore load failed, using localStorage:', error);
    const local = localStorage.getItem('french_tracker_state');
    if (local) {
      appState = { ...appState, ...JSON.parse(local) };
    }
  }
  
  if (!appState.startDate) {
    appState.startDate = new Date().toISOString();
    saveState();
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  document.getElementById('refreshBtn').addEventListener('click', () => {
    // Reset today's tasks
    appState.coreCompleted = [];
    appState.bonusCompleted = [];
    saveState();
    renderAll();
  });
  
  document.getElementById('resetBtn').addEventListener('click', resetProgress);
  document.getElementById('exportBtn').addEventListener('click', exportData);
}

function resetProgress() {
  if (!confirm('Reset all progress? This cannot be undone.')) return;
  
  appState = {
    currentPhase: 0,
    level: 'A2',
    coreCompleted: [],
    weeklyCompleted: {},
    bonusCompleted: [],
    totalCompleted: 0,
    streak: 0,
    startDate: new Date().toISOString(),
    lastVisit: null,
    theme: appState.theme,
    pimsleurProgress: 16
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
  link.download = `french-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

// ========================================
// START APP
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
