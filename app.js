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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========================================
// STATE MANAGEMENT
// ========================================

let appState = {
  currentPhase: 0,
  level: 'A2',
  weeklyHistory: {}, // { 'YYYY-WW': { days: {...}, stats: {...} } }
  coreCompleted: [],
  weeklyCompleted: {},
  bonusCompleted: [],
  totalCompleted: 0,
  streak: 0,
  startDate: null,
  lastVisit: null,
  theme: 'dark',
  pimsleurProgress: 16,
  currentView: 'today'
};

let tasksConfig = null;

// ========================================
// UTILITY FUNCTIONS
// ========================================

function getWeekKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const week = getWeekNumber(d);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

function getWeekDates(weekKey) {
  const [year, week] = weekKey.split('-W').map(Number);
  const jan4 = new Date(year, 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (week - 1) * 7);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function getDayKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// ========================================
// INITIALIZATION
// ========================================

async function init() {
  showLoading(true);
  
  initTheme();
  await loadTasksConfig();
  await loadState();
  
  updatePhase();
  
  if (appState.currentView === 'today') {
    renderAll();
  } else {
    renderWeeklyView();
  }
  
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
  
  appState.theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    tasksConfig = await response.json();
    console.log('Loaded tasks configuration');
  } catch (error) {
    console.error('Failed to load tasks:', error);
    alert('Failed to load tasks.json');
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
// VIEW SWITCHING
// ========================================

function switchView(view) {
  appState.currentView = view;
  
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  if (view === 'today') {
    document.getElementById('todayView').classList.remove('hidden');
    document.getElementById('weeklyOverview').classList.add('hidden');
    renderAll();
  } else {
    document.getElementById('todayView').classList.add('hidden');
    document.getElementById('weeklyOverview').classList.remove('hidden');
    renderWeeklyView();
  }
  
  saveState();
}

// ========================================
// TODAY VIEW RENDERING
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
    const completed = appState.coreCompleted.includes(task.id);
    
    let taskName = task.name;
    if (task.id === 'pimsleur' && task.autoProgress) {
      const lessonNum = appState.pimsleurProgress;
      const unitNum = Math.ceil(lessonNum / 30);
      const lessonInUnit = ((lessonNum - 1) % 30) + 1;
      taskName = `Pimsleur Unit ${unitNum}, Lesson ${lessonInUnit}`;
    }
    
    taskDiv.className = `task ${completed ? 'completed' : ''}`;
    taskDiv.dataset.taskId = task.id;
    
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
      <div class="task ${completed ? 'completed' : ''}" data-task-id="weekly-${today}">
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
      <div class="task ${completed ? 'completed' : ''}" data-task-id="${task.name}">
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
// WEEKLY VIEW RENDERING
// ========================================

function renderWeeklyView() {
  renderWeeklyCalendar();
  renderWeeklyStats();
  renderWeeklyDelta();
}

function renderWeeklyCalendar() {
  const container = document.getElementById('weeklyCalendar');
  const weekKey = getWeekKey();
  const weekDates = getWeekDates(weekKey);
  const weekHistory = appState.weeklyHistory[weekKey] || { days: {} };
  
  const today = getDayKey();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const daysHTML = weekDates.map((date, index) => {
    const dayKey = getDayKey(date);
    const dayData = weekHistory.days[dayKey] || { coreCompleted: 0, coreTotal: 4 };
    
    const isToday = dayKey === today;
    const completed = dayData.coreCompleted === dayData.coreTotal;
    const partial = dayData.coreCompleted > 0 && dayData.coreCompleted < dayData.coreTotal;
    const missed = dayData.coreCompleted === 0 && new Date(dayKey) < new Date(today);
    
    let className = 'day-card';
    if (isToday) className += ' today';
    else if (completed) className += ' completed';
    else if (partial) className += ' partial';
    else if (missed) className += ' missed';
    
    const checkmarks = Array(4).fill(0).map((_, i) => 
      `<div class="day-check ${i < dayData.coreCompleted ? 'done' : ''}"></div>`
    ).join('');
    
    return `
      <div class="${className}">
        <div class="day-name">${dayNames[index]}</div>
        <div class="day-date">${date.getDate()}</div>
        <div class="day-progress">${dayData.coreCompleted}/${dayData.coreTotal}</div>
        <div class="day-checkmarks">${checkmarks}</div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `
    <h3>📅 This Week</h3>
    <div class="week-grid">${daysHTML}</div>
  `;
}

function renderWeeklyStats() {
  const container = document.getElementById('weeklyStats');
  const weekKey = getWeekKey();
  const weekHistory = appState.weeklyHistory[weekKey] || { days: {} };
  
  let totalCore = 0;
  let completedCore = 0;
  let totalWeekly = 0;
  let completedWeekly = 0;
  let bonusCount = 0;
  
  Object.values(weekHistory.days).forEach(day => {
    totalCore += day.coreTotal || 4;
    completedCore += day.coreCompleted || 0;
    totalWeekly += day.weeklyTotal || 1;
    completedWeekly += day.weeklyCompleted || 0;
    bonusCount += day.bonusCompleted || 0;
  });
  
  const corePercent = totalCore > 0 ? Math.round((completedCore / totalCore) * 100) : 0;
  const weeklyPercent = totalWeekly > 0 ? Math.round((completedWeekly / totalWeekly) * 100) : 0;
  
  container.innerHTML = `
    <h3>📊 Week Stats</h3>
    <div class="stats-grid-weekly">
      <div class="stat-item">
        <div class="stat-item-label">Core Tasks</div>
        <div class="stat-item-value">${corePercent}%</div>
        <div class="stat-item-detail">${completedCore}/${totalCore} completed</div>
      </div>
      <div class="stat-item">
        <div class="stat-item-label">Weekly Tasks</div>
        <div class="stat-item-value">${weeklyPercent}%</div>
        <div class="stat-item-detail">${completedWeekly}/${totalWeekly} completed</div>
      </div>
      <div class="stat-item">
        <div class="stat-item-label">Bonus Tasks</div>
        <div class="stat-item-value">${bonusCount}</div>
        <div class="stat-item-detail">Extra effort!</div>
      </div>
      <div class="stat-item">
        <div class="stat-item-label">Pimsleur Progress</div>
        <div class="stat-item-value">${appState.pimsleurProgress}</div>
        <div class="stat-item-detail">of 150 lessons</div>
      </div>
    </div>
  `;
}

function renderWeeklyDelta() {
  const container = document.getElementById('weeklyDelta');
  const weekKey = getWeekKey();
  const weekHistory = appState.weeklyHistory[weekKey] || { days: {} };
  
  // Calculate stats
  const dayKeys = Object.keys(weekHistory.days);
  const totalDays = dayKeys.length;
  
  let fullCompletions = 0;
  let partialDays = 0;
  let missedDays = 0;
  const dayPattern = {};
  
  dayKeys.forEach(dayKey => {
    const day = weekHistory.days[dayKey];
    const dayOfWeek = new Date(dayKey).getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    
    if (!dayPattern[dayName]) dayPattern[dayName] = { completed: 0, total: 0 };
    dayPattern[dayName].total++;
    
    if (day.coreCompleted === day.coreTotal) {
      fullCompletions++;
      dayPattern[dayName].completed++;
    } else if (day.coreCompleted > 0) {
      partialDays++;
    } else {
      missedDays++;
    }
  });
  
  // Find weak day
  let weakDay = null;
  let weakPercent = 100;
  Object.entries(dayPattern).forEach(([day, stats]) => {
    const percent = (stats.completed / stats.total) * 100;
    if (percent < weakPercent && stats.total > 0) {
      weakDay = day;
      weakPercent = percent;
    }
  });
  
  // Generate insights
  const totalCoreExpected = totalDays * 4;
  let totalCoreCompleted = 0;
  Object.values(weekHistory.days).forEach(day => {
    totalCoreCompleted += day.coreCompleted || 0;
  });
  
  const completionRate = totalCoreExpected > 0 ? Math.round((totalCoreCompleted / totalCoreExpected) * 100) : 0;
  
  // Smart recovery plan
  const recoveryItems = [];
  
  if (partialDays > 0) {
    recoveryItems.push(`You have ${partialDays} partial day(s). Pick one task from those days and do it this weekend.`);
  }
  
  if (missedDays > 1) {
    recoveryItems.push(`${missedDays} full misses. Don't catch up — just restart with Monday. Focus on consistency.`);
  }
  
  if (weakDay && weakPercent < 70) {
    recoveryItems.push(`${weakDay}s are your weak day (${Math.round(weakPercent)}% completion). Consider swapping ${weakDay}'s weekly task to Sunday.`);
  }
  
  if (fullCompletions >= 5) {
    recoveryItems.push(`5+ full days! You're crushing it. Keep the momentum.`);
  }
  
  const insightHTML = completionRate >= 80 
    ? `<div class="insight-box"><strong>💪 You're thriving!</strong> ${completionRate}% is excellent consistency. This is what B2 progress looks like.</div>`
    : completionRate >= 60
    ? `<div class="insight-box"><strong>🎯 You're on track</strong> ${completionRate}% completion. You're building the habit. Keep showing up.</div>`
    : `<div class="insight-box"><strong>🧠 Pattern detected</strong> ${completionRate}% this week. Life happened. That's normal. See recovery plan below.</div>`;
  
  const recoveryHTML = recoveryItems.length > 0
    ? `<div class="recovery-plan">
        <strong>📋 Recovery Plan</strong>
        <ul class="delta-list">
          ${recoveryItems.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>`
    : '';
  
  container.innerHTML = `
    <h3>🧭 Weekly Delta & Recovery</h3>
    <div class="delta-section">
      <div class="delta-title">What You Did</div>
      <div class="delta-content">
        ✅ <strong>${totalCoreCompleted}/${totalCoreExpected} tasks</strong> (${completionRate}%)<br>
        💪 ${fullCompletions} full completion days<br>
        ⚡ ${partialDays} partial days<br>
        ${missedDays > 0 ? `🔄 ${missedDays} missed days` : ''}
      </div>
      ${insightHTML}
    </div>
    ${recoveryHTML}
  `;
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
    
    if (taskId === 'pimsleur') {
      appState.pimsleurProgress++;
    }
    
    const level = appState.level;
    const coreTasks = tasksConfig.dailyCore[level];
    if (appState.coreCompleted.length === coreTasks.length) {
      showCelebration();
    }
  }
  
  updateDailyHistory();
  saveState();
  renderAll();
}

function toggleWeeklyTask(day) {
  appState.weeklyCompleted[day] = !appState.weeklyCompleted[day];
  if (appState.weeklyCompleted[day]) {
    appState.totalCompleted++;
  }
  updateDailyHistory();
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
  
  updateDailyHistory();
  saveState();
  renderAll();
}

function showCelebration() {
  const cel = document.getElementById('celebration');
  cel.classList.add('show');
  setTimeout(() => cel.classList.remove('show'), 2500);
}

// ========================================
// HISTORY TRACKING
// ========================================

function updateDailyHistory() {
  const weekKey = getWeekKey();
  const dayKey = getDayKey();
  
  if (!appState.weeklyHistory[weekKey]) {
    appState.weeklyHistory[weekKey] = { days: {} };
  }
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  
  appState.weeklyHistory[weekKey].days[dayKey] = {
    coreCompleted: appState.coreCompleted.length,
    coreTotal: 4,
    weeklyCompleted: appState.weeklyCompleted[today] ? 1 : 0,
    weeklyTotal: 1,
    bonusCompleted: appState.bonusCompleted.length
  };
}

// ========================================
// STATISTICS
// ========================================

function updateStats() {
  const today = new Date().toDateString();
  const lastVisit = appState.lastVisit ? new Date(appState.lastVisit).toDateString() : null;
  
  if (lastVisit !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const level = appState.level;
    const coreTasks = tasksConfig.dailyCore[level];
    const allCoreCompleted = appState.coreCompleted.length === coreTasks.length;
    
    if (lastVisit === yesterday.toDateString() && allCoreCompleted) {
      appState.streak++;
    } else if (lastVisit && !allCoreCompleted) {
      appState.streak = 0;
    } else if (!lastVisit) {
      appState.streak = 0;
    }
    
    // Update history before resetting
    updateDailyHistory();
    
    // Reset daily tasks
    appState.coreCompleted = [];
    appState.bonusCompleted = [];
    
    appState.lastVisit = new Date().toISOString();
    saveState();
  }
  
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
  
  // Initialize weekly history if missing
  if (!appState.weeklyHistory) {
    appState.weeklyHistory = {};
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  
  document.getElementById('refreshBtn').addEventListener('click', () => {
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
    weeklyHistory: {},
    coreCompleted: [],
    weeklyCompleted: {},
    bonusCompleted: [],
    totalCompleted: 0,
    streak: 0,
    startDate: new Date().toISOString(),
    lastVisit: null,
    theme: appState.theme,
    pimsleurProgress: 16,
    currentView: 'today'
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
