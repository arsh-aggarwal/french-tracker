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
const storage = firebase.storage();

// ========================================
// STATE MANAGEMENT
// ========================================

let appState = {
  currentPhase: 0,
  level: 'A2',
  tasksToday: [],
  completed: [],
  totalCompleted: 0,
  streak: 0,
  startDate: null,
  lastVisit: null,
  theme: 'dark'
};

let tasksConfig = null;

// ========================================
// INITIALIZATION
// ========================================

async function init() {
  showLoading(true);
  
  // Load theme
  initTheme();
  
  // Load tasks configuration
  await loadTasksConfig();
  
  // Load user state
  await loadState();
  
  // Update UI
  updatePhase();
  
  // Generate or render tasks
  if (appState.tasksToday.length === 0) {
    generateTodaysTasks();
  } else {
    renderTasks();
  }
  
  // Setup event listeners
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
  // Check saved preference or system preference
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
    // Try to load from Firebase Storage first
    const storageRef = storage.ref('tasks.json');
    const url = await storageRef.getDownloadURL();
    const response = await fetch(url);
    tasksConfig = await response.json();
    console.log('Loaded tasks from Firebase Storage');
  } catch (error) {
    // Fallback to local tasks.json
    try {
      const response = await fetch('tasks.json');
      tasksConfig = await response.json();
      console.log('Loaded tasks from local file');
    } catch (localError) {
      console.error('Failed to load tasks configuration:', localError);
      alert('Failed to load tasks configuration. Please check your setup.');
    }
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
  
  // Determine phase index
  if (level === 'A2') appState.currentPhase = 0;
  else if (level === 'B1') appState.currentPhase = 1;
  else appState.currentPhase = 2;
  
  // Update phase banner
  const phase = tasksConfig.phases[appState.currentPhase];
  const banner = document.getElementById('phaseBanner');
  
  banner.innerHTML = `
    <div class="phase-header">
      <span class="phase-badge">${phase.level}</span>
      <span class="phase-title">${phase.name}</span>
    </div>
    <div class="phase-description">${phase.description}</div>
  `;
  
  // Update level stat
  document.getElementById('stat-level').textContent = phase.level;
}

// ========================================
// TASK GENERATION
// ========================================

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateTodaysTasks() {
  const level = appState.level;
  const tasks = [];
  
  // Generate tasks for each priority band
  Object.entries(tasksConfig.taskTemplates).forEach(([priority, taskTypes]) => {
    taskTypes.forEach(taskType => {
      const resourcePool = tasksConfig.resources[taskType][level];
      if (resourcePool && resourcePool.length > 0) {
        const resource = pickRandom(resourcePool);
        tasks.push({
          id: Date.now() + Math.random(),
          priority: priority,
          level: level,
          ...resource
        });
      }
    });
  });
  
  appState.tasksToday = tasks;
  appState.completed = [];
  
  renderTasks();
  saveState();
}

// ========================================
// TASK RENDERING
// ========================================

function renderTasks() {
  const container = document.getElementById('tasksContainer');
  container.innerHTML = '';
  
  // Group tasks by priority
  const tasksByPriority = {
    MUST: [],
    SHOULD: [],
    BONUS: []
  };
  
  appState.tasksToday.forEach(task => {
    tasksByPriority[task.priority].push(task);
  });
  
  // Define priority bands
  const priorityBands = [
    {
      priority: 'MUST',
      title: 'Bare Minimum',
      subtitle: 'Do these even on terrible days',
      class: 'must'
    },
    {
      priority: 'SHOULD',
      title: 'Normal Day',
      subtitle: 'Your default routine',
      class: 'should'
    },
    {
      priority: 'BONUS',
      title: 'Extra Credit',
      subtitle: 'When you have energy',
      class: 'bonus'
    }
  ];
  
  // Render each priority band
  priorityBands.forEach(band => {
    const bandTasks = tasksByPriority[band.priority];
    if (bandTasks.length === 0) return;
    
    const bandDiv = document.createElement('div');
    bandDiv.className = 'priority-band';
    
    const tasksHTML = bandTasks.map(task => renderTask(task)).join('');
    
    bandDiv.innerHTML = `
      <div class="band-header">
        <div class="band-indicator ${band.class}"></div>
        <div class="band-title">${band.title}</div>
        <div class="band-subtitle">${band.subtitle}</div>
      </div>
      <div class="band-tasks">
        ${tasksHTML}
      </div>
    `;
    
    container.appendChild(bandDiv);
  });
  
  // Add click handlers to tasks
  document.querySelectorAll('.task').forEach(taskEl => {
    const taskId = taskEl.dataset.taskId;
    taskEl.addEventListener('click', (e) => {
      // Don't toggle if clicking on link
      if (e.target.tagName === 'A') return;
      toggleTask(taskId);
    });
  });
  
  updateStats();
}

function renderTask(task) {
  const completed = appState.completed.includes(task.id);
  const linkHTML = task.url ? `<a href="${task.url}" target="_blank" class="task-link" onclick="event.stopPropagation()">🔗 Open resource</a>` : '';
  
  return `
    <div class="task ${completed ? 'completed' : ''}" data-task-id="${task.id}">
      <div class="task-checkbox"></div>
      <div class="task-content">
        <div class="task-title">${task.name}</div>
        <div class="task-description">${task.description}</div>
        ${linkHTML}
        <div class="task-meta">
          <span class="task-tag tag-${task.type}">${task.type}</span>
          <span class="task-time">${task.time}</span>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// TASK INTERACTION
// ========================================

function toggleTask(taskId) {
  const task = appState.tasksToday.find(t => t.id === taskId);
  if (!task) return;
  
  const index = appState.completed.indexOf(taskId);
  
  if (index > -1) {
    // Uncomplete task
    appState.completed.splice(index, 1);
  } else {
    // Complete task
    appState.completed.push(taskId);
    appState.totalCompleted++;
    showCelebration();
  }
  
  saveState();
  renderTasks();
}

function showCelebration() {
  const cel = document.getElementById('celebration');
  cel.classList.add('show');
  setTimeout(() => {
    cel.classList.remove('show');
  }, 2000);
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
    
    if (lastVisit === yesterday.toDateString()) {
      // Consecutive day
      appState.streak++;
    } else if (lastVisit) {
      // Broke streak
      appState.streak = 1;
    } else {
      // First day
      appState.streak = 1;
    }
    
    appState.lastVisit = new Date().toISOString();
    saveState();
  }
  
  // Calculate today's progress
  const totalTasks = appState.tasksToday.length;
  const completedTasks = appState.completed.length;
  const todayPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Update stat displays
  document.getElementById('stat-streak').textContent = appState.streak;
  document.getElementById('stat-total').textContent = appState.totalCompleted;
  document.getElementById('stat-today').textContent = todayPercent + '%';
}

// ========================================
// STATE PERSISTENCE
// ========================================

async function saveState() {
  // Save to Firestore
  try {
    await db.collection('users').doc('me').set(appState);
  } catch (error) {
    console.log('Firestore save failed, using localStorage:', error);
  }
  
  // Always save to localStorage as backup
  localStorage.setItem('french_tracker_state', JSON.stringify(appState));
}

async function loadState() {
  try {
    // Try Firestore first
    const doc = await db.collection('users').doc('me').get();
    if (doc.exists) {
      appState = { ...appState, ...doc.data() };
      console.log('Loaded state from Firestore');
    } else {
      // Fallback to localStorage
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
  
  // Initialize start date if not set
  if (!appState.startDate) {
    appState.startDate = new Date().toISOString();
    saveState();
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Refresh tasks
  document.getElementById('refreshBtn').addEventListener('click', generateTodaysTasks);
  
  // Reset progress
  document.getElementById('resetBtn').addEventListener('click', resetProgress);
  
  // Export data
  document.getElementById('exportBtn').addEventListener('click', exportData);
}

function resetProgress() {
  if (!confirm('Reset all progress? This cannot be undone.')) return;
  
  appState = {
    currentPhase: 0,
    level: 'A2',
    tasksToday: [],
    completed: [],
    totalCompleted: 0,
    streak: 0,
    startDate: new Date().toISOString(),
    lastVisit: null,
    theme: appState.theme
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

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
