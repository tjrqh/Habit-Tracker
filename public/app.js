// ==========================================================================
// FocusHabit - Application Logic (Vanilla JS)
// ==========================================================================

const API_BASE = '/api';

// Application State
let currentUser = null;
let habits = [];
let activeHabitId = null;
let activeSession = null;
let timerInterval = null;
let timerSecondsRemaining = 0;
let timerTotalSeconds = 1500; // 25 minutes default

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  // Check localStorage for saved user session
  const savedUser = localStorage.getItem('focus_habit_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showDashboardView();
  } else {
    // If no user, fetch existing users list for dropdown selection
    fetchExistingUsers();
  }

  // Save auto-repeat checkbox value dynamically
  const repeatCheckbox = document.getElementById('auto-repeat-checkbox');
  if (repeatCheckbox) {
    repeatCheckbox.addEventListener('change', (e) => {
      if (activeHabitId) {
        const config = JSON.parse(localStorage.getItem(`habit_config_${activeHabitId}`)) || { duration: 1500, autoRepeat: false };
        config.autoRepeat = e.target.checked;
        localStorage.setItem(`habit_config_${activeHabitId}`, JSON.stringify(config));
      }
    });
  }

  // Initialize Lucide icons
  lucide.createIcons();
});

// ==========================================================================
// API helper function
// ==========================================================================
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Fetch error on ${endpoint}:`, error);
    throw error;
  }
}

// ==========================================================================
// Auth & User Management
// ==========================================================================
async function fetchExistingUsers() {
  const selectElement = document.getElementById('user-select');
  try {
    const res = await apiCall('/users');
    // Expected structure: { success: true, data: [ { id, email, ... } ] }
    const users = res.data || [];
    
    selectElement.innerHTML = '';
    
    if (users.length === 0) {
      const option = document.createElement('option');
      option.value = "";
      option.disabled = true;
      option.selected = true;
      option.textContent = "가입된 사용자가 없습니다. 신규 등록해 주세요.";
      selectElement.appendChild(option);
      return;
    }

    users.forEach(user => {
      const option = document.createElement('option');
      option.value = JSON.stringify({ id: user.id, email: user.email });
      option.textContent = user.email;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    selectElement.innerHTML = '<option value="" disabled>사용자 목록 로드 실패</option>';
  }
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById('tab-login-btn');
  const registerTab = document.getElementById('tab-register-btn');
  const loginSection = document.getElementById('auth-login-section');
  const registerSection = document.getElementById('auth-register-section');
  const errorDiv = document.getElementById('auth-error');

  errorDiv.classList.add('hidden');

  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginSection.classList.add('active');
    registerSection.classList.remove('active');
    fetchExistingUsers();
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerSection.classList.add('active');
    loginSection.classList.remove('active');
  }
}

async function handleRegisterUser() {
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const errorDiv = document.getElementById('auth-error');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  errorDiv.classList.add('hidden');

  if (!email || !password) {
    showAuthError('이메일과 비밀번호를 입력해주세요.');
    return;
  }

  try {
    const res = await apiCall('/users/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Auto-login registered user
    if (res.data) {
      currentUser = { id: res.data.id, email: res.data.email };
      localStorage.setItem('focus_habit_user', JSON.stringify(currentUser));
      showDashboardView();
      
      // Clear inputs
      emailInput.value = '';
      passwordInput.value = '';
    }
  } catch (err) {
    showAuthError(err.message || '가입 도중 요류가 발생했습니다.');
  }
}

function handleSelectUser() {
  const selectElement = document.getElementById('user-select');
  const errorDiv = document.getElementById('auth-error');

  errorDiv.classList.add('hidden');

  if (!selectElement.value) {
    showAuthError('로그인할 사용자를 선택해주세요.');
    return;
  }

  currentUser = JSON.parse(selectElement.value);
  localStorage.setItem('focus_habit_user', JSON.stringify(currentUser));
  showDashboardView();
}

function showAuthError(msg) {
  const errorDiv = document.getElementById('auth-error');
  errorDiv.textContent = msg;
  errorDiv.classList.remove('hidden');
}

function showDashboardView() {
  // Hide Auth Modal overlay
  document.getElementById('auth-overlay').classList.remove('active');
  
  // Set navbar user badge
  document.getElementById('current-user-email').textContent = currentUser.email;

  // Load backend content
  loadDashboardData();
}

function handleLogout() {
  // Clear states
  localStorage.removeItem('focus_habit_user');
  currentUser = null;
  habits = [];
  activeSession = null;
  if (timerInterval) clearInterval(timerInterval);
  
  // Show auth screen again
  document.getElementById('auth-overlay').classList.add('active');
  switchAuthTab('login');
}

// ==========================================================================
// Dashboard Logic (Habits & Stats & History)
// ==========================================================================
async function loadDashboardData() {
  if (!currentUser) return;
  
  try {
    // 1. Fetch Habits
    const habitsRes = await apiCall(`/habits/user/${currentUser.id}`);
    habits = habitsRes.data || [];
    
    // 2. Fetch Sessions
    const sessionsRes = await apiCall(`/sessions/user/${currentUser.id}`);
    const sessions = sessionsRes.data || [];

    // 3. Compute Stats
    updateStats(habits, sessions);

    // 4. Render Habits
    renderHabitsList(sessions);

    // 5. Render History Timeline
    renderHistoryTimeline(sessions);

    // 6. Check for running sessions on server to recover UI state
    checkRunningSession();

  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

function updateStats(habitsList, sessionsList) {
  // Active habits count
  const activeHabitsCount = habitsList.filter(h => h.isActive).length;
  document.getElementById('stats-habits').innerHTML = `${activeHabitsCount} <span class="unit">개</span>`;

  // Filter completed sessions created today
  const today = new Date().toDateString();
  const todayCompletedSessions = sessionsList.filter(s => {
    return s.status === 'COMPLETED' && new Date(s.createdAt).toDateString() === today;
  });

  // Display daily completed tomatoes count
  document.getElementById('stats-tomatoes').innerHTML = `${todayCompletedSessions.length} <span class="unit">개</span>`;

  // Compute total duration of completed sessions in minutes
  const totalDurationSeconds = sessionsList
    .filter(s => s.status === 'COMPLETED')
    .reduce((acc, curr) => acc + curr.duration, 0);
  
  const totalMinutes = Math.round(totalDurationSeconds / 60);
  document.getElementById('stats-minutes').innerHTML = `${totalMinutes} <span class="unit">분</span>`;
}

function renderHabitsList(sessionsList) {
  const container = document.getElementById('habits-container');
  container.innerHTML = '';

  if (habits.length === 0) {
    container.innerHTML = `
      <div class="glass-card loading-card">
        <p>등록된 습관이 없습니다. 상단 폼을 이용해 습관을 만들어보세요!</p>
      </div>
    `;
    return;
  }

  // Pre-calculate completed tomatoes per habit
  const habitTomatoesMap = {};
  sessionsList.forEach(s => {
    if (s.status === 'COMPLETED') {
      habitTomatoesMap[s.habitId] = (habitTomatoesMap[s.habitId] || 0) + 1;
    }
  });

  habits.forEach(habit => {
    const completedTomatoes = habitTomatoesMap[habit.id] || 0;
    const target = habit.targetTomato || 1;
    const percentage = Math.min(Math.round((completedTomatoes / target) * 100), 100);

    const card = document.createElement('div');
    card.className = 'glass-card habit-card';
    card.id = `habit-card-${habit.id}`;

    // Create tomato icons string
    let tomatoesHTML = '';
    for (let i = 1; i <= target; i++) {
      if (i <= completedTomatoes) {
        tomatoesHTML += `<span class="tomato-indicator-item active" title="완료됨">🍅</span>`;
      } else {
        tomatoesHTML += `<span class="tomato-indicator-item" title="미완료">⚪</span>`;
      }
    }

    card.innerHTML = `
      <div>
        <div class="habit-top">
          <div class="habit-title-container">
            <h4 class="habit-card-title">${escapeHtml(habit.title)}</h4>
            <p class="habit-card-desc">${escapeHtml(habit.description || '설명 없음')}</p>
          </div>
          <button class="delete-habit-btn" onclick="handleDeleteHabit('${habit.id}')" title="습관 삭제">
            <i data-lucide="trash-2"></i>
          </button>
        </div>

        <div class="progress-section">
          <div class="progress-header-info">
            <span>목표 진행률</span>
            <span class="progress-pct">${percentage}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="tomato-indicators">
            ${tomatoesHTML}
          </div>
        </div>
      </div>

      <div class="habit-actions">
        <button class="btn btn-primary w-full" onclick="openTimerModal('${habit.id}')">
          <i data-lucide="play-circle"></i>
          <span>포모도로 타이머 시작</span>
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // Re-run Lucide icons render for dynamically generated cards
  lucide.createIcons();
}

function renderHistoryTimeline(sessionsList) {
  const timeline = document.getElementById('history-timeline');
  timeline.innerHTML = '';

  if (sessionsList.length === 0) {
    timeline.innerHTML = '<div class="loading-text">기록된 포모도로 집중 내역이 없습니다.</div>';
    return;
  }

  // Sort sessions: newest first
  const sortedSessions = [...sessionsList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const timelineContainer = document.createElement('div');
  timelineContainer.className = 'timeline';

  // Find habit details easily
  const habitMap = {};
  habits.forEach(h => { habitMap[h.id] = h.title; });

  sortedSessions.forEach(session => {
    const item = document.createElement('div');
    const statusLower = session.status.toLowerCase();
    item.className = `timeline-item ${statusLower}`;

    const date = new Date(session.createdAt);
    const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

    let statusText = '진행 중';
    let badgeClass = 'status-running';
    if (session.status === 'COMPLETED') {
      statusText = '완료';
      badgeClass = 'status-completed';
    } else if (session.status === 'FAILED') {
      statusText = '중단';
      badgeClass = 'status-failed';
    }

    const habitName = habitMap[session.habitId] || '삭제된 습관';
    const minutesStr = Math.round(session.duration / 60);

    item.innerHTML = `
      <div class="timeline-content">
        <h5>${escapeHtml(habitName)}</h5>
        <div class="timeline-meta mt-1">
          <span>${dateStr} ${timeStr} • ${minutesStr}분</span>
          <span class="status-badge ${badgeClass}">${statusText}</span>
        </div>
      </div>
    `;
    
    timelineContainer.appendChild(item);
  });

  timeline.appendChild(timelineContainer);
}

// Collapsible Add Habit Form Toggle
function toggleHabitForm() {
  const card = document.querySelector('.habit-form-card');
  card.classList.toggle('open');
}

function updateSliderValue(val) {
  document.getElementById('slider-val').textContent = `${val}개`;
}

function updateNewHabitDurationValue(val) {
  document.getElementById('new-habit-duration-val').textContent = `${val}분`;
}

async function handleCreateHabit() {
  const titleInput = document.getElementById('habit-title');
  const targetInput = document.getElementById('habit-target');
  const descInput = document.getElementById('habit-desc');
  const durationInput = document.getElementById('new-habit-duration');
  const repeatInput = document.getElementById('new-habit-repeat');

  const title = titleInput.value.trim();
  const targetTomato = parseInt(targetInput.value);
  const description = descInput.value.trim();
  
  const durationVal = parseInt(durationInput.value); // in minutes
  const autoRepeatChecked = repeatInput.checked;

  if (!title) {
    alert('습관 이름을 입력해주세요.');
    return;
  }

  try {
    const res = await apiCall('/habits', {
      method: 'POST',
      body: JSON.stringify({
        userId: currentUser.id,
        title,
        targetTomato,
        description
      })
    });

    const newHabit = res.data;
    if (newHabit && newHabit.id) {
      // Save duration & repeat configuration locally mapped by habit ID
      const config = {
        duration: durationVal * 60, // save in seconds
        autoRepeat: autoRepeatChecked
      };
      localStorage.setItem(`habit_config_${newHabit.id}`, JSON.stringify(config));
    }

    // Reset inputs
    titleInput.value = '';
    targetInput.value = '4';
    updateSliderValue('4');
    descInput.value = '';
    
    // Reset duration slider
    durationInput.value = 25;
    updateNewHabitDurationValue(25);
    repeatInput.checked = false;

    // Collapse form
    document.querySelector('.habit-form-card').classList.remove('open');

    // Refresh Dashboard (await to ensure habits array is populated)
    await loadDashboardData();

    // Immediately open the timer modal for the newly created habit
    if (newHabit && newHabit.id) {
      openTimerModal(newHabit.id);
    }
  } catch (error) {
    alert(`습관 추가 실패: ${error.message}`);
  }
}

async function handleDeleteHabit(id) {
  if (!confirm('정말로 이 습관을 삭제하시겠습니까? 관련 포모도로 세션도 모두 함께 삭제됩니다.')) {
    return;
  }

  try {
    await apiCall(`/habits/${id}`, {
      method: 'DELETE'
    });
    loadDashboardData();
  } catch (error) {
    alert(`습관 삭제 실패: ${error.message}`);
  }
}

// Check for running session on server load
async function checkRunningSession() {
  try {
    const res = await apiCall(`/sessions/user/${currentUser.id}/running`);
    const runningSessions = res.data || [];
    
    if (runningSessions.length > 0) {
      activeSession = runningSessions[0];
      
      // Find habit
      const targetHabit = habits.find(h => h.id === activeSession.habitId);
      if (targetHabit) {
        openTimerModal(targetHabit.id, true);
      }
    }
  } catch (error) {
    console.error("Error checking running sessions:", error);
  }
}

// ==========================================================================
// Pomodoro Timer Logic
// ==========================================================================
function openTimerModal(habitId, isResuming = false) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;

  activeHabitId = habitId;

  // Set header values
  document.getElementById('timer-habit-title').textContent = habit.title;
  document.getElementById('timer-habit-desc').textContent = habit.description || '설명 없음';

  // Toggle overlay visibility
  const modal = document.getElementById('timer-modal');
  modal.classList.add('active');

  const actionBtn = document.getElementById('timer-action-btn');
  const failBtn = document.getElementById('timer-fail-btn');
  const closeBtn = document.getElementById('timer-close-btn');
  const statusText = document.getElementById('timer-status-text');
  
  const settingsContainer = document.getElementById('timer-settings-container');
  const editBtn = document.getElementById('timer-edit-btn');

  if (isResuming && activeSession) {
    // Hide settings panel and edit button during resumed focus
    settingsContainer.classList.add('hidden');
    if (editBtn) editBtn.classList.add('hidden');

    statusText.textContent = '집중 진행 중';
    
    // Calculate elapsed time from activeSession.startTime
    const startMs = new Date(activeSession.startTime).getTime();
    const nowMs = Date.now();
    const elapsedSeconds = Math.floor((nowMs - startMs) / 1000);
    const duration = activeSession.duration || 1500;
    
    timerTotalSeconds = duration;
    
    if (elapsedSeconds >= duration) {
      // It completed while the user was away, let's complete it immediately
      timerSecondsRemaining = 0;
      updateTimerVisuals();
      handleTimerComplete();
    } else {
      timerSecondsRemaining = duration - elapsedSeconds;
      updateTimerVisuals();
      
      // Hide close & show fail
      closeBtn.classList.add('hidden');
      failBtn.classList.remove('hidden');
      
      // Update action button
      actionBtn.innerHTML = `<i data-lucide="pause"></i><span>일시정지</span>`;
      actionBtn.classList.add('btn-secondary');
      actionBtn.classList.remove('btn-primary');
      lucide.createIcons();

      startTimerInterval();
    }
  } else {
    // Hide settings panel by default in the timer modal
    settingsContainer.classList.add('hidden');
    if (editBtn) editBtn.classList.remove('hidden');
    
    // Load config from localStorage for the habit
    const config = JSON.parse(localStorage.getItem(`habit_config_${habitId}`)) || { duration: 1500, autoRepeat: false };
    
    // Set settings input sliders
    const durationInput = document.getElementById('timer-duration-input');
    const durationMins = config.duration / 60;
    durationInput.value = durationMins;
    document.getElementById('timer-duration-val').textContent = `${durationMins}분`;
    document.getElementById('auto-repeat-checkbox').checked = config.autoRepeat;

    // Reset controls visibility
    actionBtn.classList.remove('hidden');
    closeBtn.textContent = '나가기';
    closeBtn.className = 'btn btn-secondary btn-lg';

    // New fresh timer setup
    activeSession = null;
    timerTotalSeconds = config.duration;
    timerSecondsRemaining = timerTotalSeconds;
    
    statusText.textContent = '집중 대기 중';
    updateTimerVisuals();

    // Show close & hide fail
    closeBtn.classList.remove('hidden');
    failBtn.classList.add('hidden');

    // Action button to play
    actionBtn.innerHTML = `<i data-lucide="play"></i><span>집중 시작</span>`;
    actionBtn.classList.remove('btn-secondary');
    actionBtn.classList.add('btn-primary');
    lucide.createIcons();
  }
}

function updateTimerDuration(minutes) {
  // Update badge display
  document.getElementById('timer-duration-val').textContent = `${minutes}분`;
  
  // Update state variables
  timerTotalSeconds = parseInt(minutes) * 60;
  timerSecondsRemaining = timerTotalSeconds;
  
  // Render new time on digital clock face
  updateTimerVisuals();

  // Save changes to localStorage dynamically
  if (activeHabitId) {
    const config = JSON.parse(localStorage.getItem(`habit_config_${activeHabitId}`)) || { duration: 1500, autoRepeat: false };
    config.duration = timerTotalSeconds;
    localStorage.setItem(`habit_config_${activeHabitId}`, JSON.stringify(config));
  }
}

function toggleTimerSettings() {
  const settingsContainer = document.getElementById('timer-settings-container');
  if (settingsContainer) {
    settingsContainer.classList.toggle('hidden');
  }
}

function closeTimerModal() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  const modal = document.getElementById('timer-modal');
  modal.classList.remove('active');
  
  // Refresh dashboard status
  loadDashboardData();
}

async function handleTimerAction() {
  const actionBtn = document.getElementById('timer-action-btn');
  const failBtn = document.getElementById('timer-fail-btn');
  const closeBtn = document.getElementById('timer-close-btn');
  const statusText = document.getElementById('timer-status-text');

  // If timer is not running locally (idle or paused)
  if (!timerInterval) {
    
    try {
      if (!activeSession) {
        // Hide settings panel once we start focusing
        const settingsContainer = document.getElementById('timer-settings-container');
        if (settingsContainer) settingsContainer.classList.add('hidden');

        // Step 1: Create session on database (status IDLE)
        const targetHabit = habits.find(h => h.id === activeHabitId);
        const res = await apiCall('/sessions', {
          method: 'POST',
          body: JSON.stringify({
            userId: currentUser.id,
            habitId: targetHabit.id,
            duration: timerTotalSeconds
          })
        });
        activeSession = res.data;
      }

      // Step 2: Start session (status RUNNING)
      const startRes = await apiCall(`/sessions/${activeSession.id}/start`, {
        method: 'PATCH'
      });
      activeSession = startRes.data;

      // Update timer labels and buttons
      statusText.textContent = '집중 진행 중';
      closeBtn.classList.add('hidden');
      failBtn.classList.remove('hidden');
      const editBtn = document.getElementById('timer-edit-btn');
      if (editBtn) editBtn.classList.add('hidden');

      actionBtn.innerHTML = `<i data-lucide="pause"></i><span>일시정지</span>`;
      actionBtn.classList.add('btn-secondary');
      actionBtn.classList.remove('btn-primary');
      lucide.createIcons();

      // Audio tick (optional micro interaction)
      playSynthBeep(440, 0.05);

      // Start countdown ticker
      startTimerInterval();
    } catch (err) {
      alert(`세션 시작 실패: ${err.message}`);
    }
    
  } else {
    // Pause state (Local pause only, database stays running for simplicity, or we just stop the ticker)
    clearInterval(timerInterval);
    timerInterval = null;
    statusText.textContent = '일시 정지됨';

    actionBtn.innerHTML = `<i data-lucide="play"></i><span>집중 재개</span>`;
    actionBtn.classList.remove('btn-secondary');
    actionBtn.classList.add('btn-primary');
    lucide.createIcons();
  }
}

function startTimerInterval() {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    const isSpeedMode = document.getElementById('speed-mode-checkbox').checked;
    
    if (isSpeedMode) {
      // In Speed Test Mode, decrease remaining timer by 60 seconds (1 minute) per real second tick
      timerSecondsRemaining = Math.max(0, timerSecondsRemaining - 60);
    } else {
      timerSecondsRemaining = Math.max(0, timerSecondsRemaining - 1);
    }

    updateTimerVisuals();

    if (timerSecondsRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      handleTimerComplete();
    }
  }, 1000);
}

function updateTimerVisuals() {
  // Update Digital clock text
  const mins = Math.floor(timerSecondsRemaining / 60);
  const secs = timerSecondsRemaining % 60;
  document.getElementById('timer-display').textContent = 
    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Update circular SVG bar
  const circle = document.getElementById('timer-progress-bar');
  const circumference = 2 * Math.PI * 120; // r = 120, circumference is 753.98
  circle.style.strokeDasharray = `${circumference} ${circumference}`;

  const pct = timerSecondsRemaining / timerTotalSeconds;
  circle.style.strokeDashoffset = circumference - (pct * circumference);
}

async function handleTimerComplete() {
  const statusText = document.getElementById('timer-status-text');
  const actionBtn = document.getElementById('timer-action-btn');
  const failBtn = document.getElementById('timer-fail-btn');
  const closeBtn = document.getElementById('timer-close-btn');

  statusText.textContent = '집중 완료!';
  playSuccessSound();

  // Highlight SVG Ring with complete color glow
  const circle = document.getElementById('timer-progress-bar');
  circle.style.stroke = '#10b981'; // Completed emerald green color

  try {
    if (activeSession) {
      await apiCall(`/sessions/${activeSession.id}/complete`, {
        method: 'PATCH'
      });
      // Refresh background stats immediately
      loadDashboardData();
    }
  } catch (error) {
    console.error("Failed to mark session complete on database:", error);
  }

  // Spark confetti/particles (Pure JS/CSS based light particle burst)
  burstParticles();

  // Check if auto-repeat is enabled
  const isAutoRepeat = document.getElementById('auto-repeat-checkbox').checked;
  if (isAutoRepeat) {
    statusText.textContent = '집중 완료! 2초 후 자동 반복 시작...';
    
    // Disable action buttons during auto transition
    actionBtn.classList.add('hidden');
    failBtn.classList.add('hidden');
    closeBtn.classList.add('hidden');
    
    setTimeout(() => {
      // If modal was closed in the meantime, do not restart
      const modal = document.getElementById('timer-modal');
      if (!modal.classList.contains('active')) return;

      // Reset state for new session
      activeSession = null;
      timerSecondsRemaining = timerTotalSeconds;
      
      // Reset circle color back to gradient
      circle.style.stroke = 'url(#gradient-tomato)';
      
      // Trigger new session start
      handleTimerAction();
    }, 2000);
  } else {
    // Adjust button visuals
    actionBtn.classList.add('hidden');
    failBtn.classList.add('hidden');
    
    const editBtn = document.getElementById('timer-edit-btn');
    if (editBtn) editBtn.classList.add('hidden');

    closeBtn.classList.remove('hidden');
    closeBtn.textContent = '완료 확인';
    closeBtn.className = 'btn btn-primary btn-lg flex-1';
  }
}

async function handleTimerFail() {
  if (!confirm('정말 집중을 중단하고 실패 처리하시겠습니까? 포기한 세션도 데이터베이스에 실패 기록이 남습니다.')) {
    return;
  }

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const statusText = document.getElementById('timer-status-text');
  const actionBtn = document.getElementById('timer-action-btn');
  const failBtn = document.getElementById('timer-fail-btn');
  const closeBtn = document.getElementById('timer-close-btn');

  statusText.textContent = '집중 실패';
  playFailSound();

  // Reset circle color
  const circle = document.getElementById('timer-progress-bar');
  circle.style.stroke = '#f43f5e'; // Failed red-rose color

  try {
    if (activeSession) {
      await apiCall(`/sessions/${activeSession.id}/fail`, {
        method: 'PATCH'
      });
    }
  } catch (error) {
    console.error("Failed to mark session as failed on database:", error);
  }

  // Set buttons
  actionBtn.classList.add('hidden');
  failBtn.classList.add('hidden');
  
  const editBtn = document.getElementById('timer-edit-btn');
  if (editBtn) editBtn.classList.add('hidden');

  closeBtn.classList.remove('hidden');
  closeBtn.textContent = '닫기';
  closeBtn.className = 'btn btn-secondary btn-lg flex-1';
}

// ==========================================================================
// Web Audio API Synthesizer Alerts (Clear pure musical tones, no network files)
// ==========================================================================
let audioCtx = null;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSynthBeep(frequency, duration, type = 'sine') {
  initAudioContext();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  // Linear ramp down volume for smooth release fade
  gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playSuccessSound() {
  initAudioContext();
  if (!audioCtx) return;
  
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Bright C Major arpeggio)
  
  notes.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    const start = now + idx * 0.12;
    const duration = 0.6;

    gainNode.gain.setValueAtTime(0.1, start);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(start);
    osc.stop(start + duration);
  });
}

function playFailSound() {
  initAudioContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(330, now); // E4
  osc.frequency.linearRampToValueAtTime(165, now + 0.5); // Slide down to E3

  gainNode.gain.setValueAtTime(0.15, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.6);
}

// ==========================================================================
// Visual Particles / Confetti Effect
// ==========================================================================
function burstParticles() {
  const container = document.getElementById('timer-modal');
  const modalRect = document.querySelector('.timer-card').getBoundingClientRect();
  
  const colors = ['#7c3aed', '#3b82f6', '#ff6b6b', '#10b981', '#fbbf24'];

  for (let i = 0; i < 40; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Spawn from the center of the card
    const x = modalRect.left + modalRect.width / 2;
    const y = modalRect.top + modalRect.height / 3;
    
    particle.style.position = 'fixed';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = `${Math.random() * 8 + 6}px`;
    particle.style.height = particle.style.width;
    particle.style.borderRadius = '50%';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '999';
    particle.style.boxShadow = `0 0 10px ${particle.style.backgroundColor}`;

    container.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 4;
    const velX = Math.cos(angle) * speed;
    const velY = Math.sin(angle) * speed - 2; // slight upward force

    let curX = x;
    let curY = y;
    let opacity = 1;
    let gravity = 0.25;

    const animate = () => {
      curX += velX;
      curY += velY + gravity;
      gravity += 0.05;
      opacity -= 0.02;

      particle.style.left = `${curX}px`;
      particle.style.top = `${curY}px`;
      particle.style.opacity = opacity;

      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
      }
    };

    requestAnimationFrame(animate);
  }
}

// ==========================================================================
// Helper Utilities
// ==========================================================================
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Close timer modal using Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('timer-modal');
    if (modal && modal.classList.contains('active')) {
      // If timer is running, ask for confirmation to prevent accidental loss of progress
      if (timerInterval) {
        if (confirm('집중이 진행 중입니다. 정말로 타이머 창을 닫으시겠습니까? (세션이 실패/완료 처리되지 않고 백엔드에 계속 작동 상태로 유지됩니다)')) {
          closeTimerModal();
        }
      } else {
        closeTimerModal();
      }
    }
  }
});
