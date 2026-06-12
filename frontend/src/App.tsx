import { useState, useEffect, useRef } from 'react';
import {
  Hourglass,
  Clock,
  Trash2,
  Sparkles,
  User as UserIcon,
  LogOut,
  Target,
  PlusCircle,
  CheckSquare,
  Timer,
  Pause,
  Play
} from 'lucide-react';
import type { User, Habit, Session, HabitConfig } from './types';
import { AuthCard } from './components/AuthCard';
import { TimerModal } from './components/TimerModal';
import { playSynthBeep, playSuccessSound, playFailSound } from './utils/audio';
import { burstParticles } from './utils/particles';

export default function App() {
  // --- Authentication State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // --- Habit List State ---
  const [habits, setHabits] = useState<Habit[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // --- New Habit Form State ---
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newHabitTitle, setNewHabitTitle] = useState<string>('');
  const [newHabitDesc, setNewHabitDesc] = useState<string>('');
  const [newHabitTarget, setNewHabitTarget] = useState<number>(4);
  const [newHabitDuration, setNewHabitDuration] = useState<number>(25); // in minutes
  const [newHabitRepeat, setNewHabitRepeat] = useState<boolean>(false);

  // --- Timer State ---
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number>(1500);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState<number>(1500);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [speedMode, setSpeedMode] = useState<boolean>(false);
  const [showSettingsInModal, setShowSettingsInModal] = useState<boolean>(false);
  const [timerStatusText, setTimerStatusText] = useState<string>('준비 완료');

  // Refs for timers
  const timerIntervalRef = useRef<number | null>(null);

  // Load saved user session
  useEffect(() => {
    const savedUser = localStorage.getItem('focus_habit_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as User;
      setCurrentUser(parsedUser);
    } else {
      fetchExistingUsers();
    }
  }, []);

  // Fetch data when user changes
  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  // Check for running session on dashboard load to restore UI state
  useEffect(() => {
    if (currentUser && habits.length > 0) {
      checkRunningSession();
    }
  }, [currentUser, habits]);

  // Monitor ticking timer
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSecondsRemaining((prev) => {
          const next = speedMode ? Math.max(0, prev - 60) : Math.max(0, prev - 1);
          if (next <= 0) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
            handleTimerComplete();
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, speedMode, activeSession, timerTotalSeconds, activeHabitId]);

  // Escape key close handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTimerModal) {
        if (isTimerRunning) {
          if (confirm('집중이 진행 중입니다. 정말로 타이머 창을 닫으시겠습니까? (세션이 실패/완료 처리되지 않고 백엔드에 작동 상태로 유지됩니다)')) {
            closeTimerModal();
          }
        } else {
          closeTimerModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTimerModal, isTimerRunning]);

  // --- API Handlers ---
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const response = await fetch(endpoint, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    return data;
  };

  const fetchExistingUsers = async () => {
    try {
      const res = await apiCall('/api/users');
      setExistingUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const loadDashboardData = async () => {
    if (!currentUser) return;
    try {
      const habitsRes = await apiCall(`/api/habits/user/${currentUser.id}`);
      setHabits(habitsRes.data || []);

      const sessionsRes = await apiCall(`/api/sessions/user/${currentUser.id}`);
      setSessions(sessionsRes.data || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  const checkRunningSession = async () => {
    if (!currentUser) return;
    try {
      const res = await apiCall(`/api/sessions/user/${currentUser.id}/running`);
      const runningSessions = res.data || [];
      if (runningSessions.length > 0) {
        const session = runningSessions[0];
        setActiveSession(session);
        setActiveHabitId(session.habitId);
        
        // Recover time
        const startMs = new Date(session.startTime).getTime();
        const nowMs = Date.now();
        const elapsed = Math.floor((nowMs - startMs) / 1000);
        const duration = session.duration || 1500;
        
        setTimerTotalSeconds(duration);
        
        if (elapsed >= duration) {
          setTimerSecondsRemaining(0);
          // Complete immediately
          triggerSessionCompletion(session);
        } else {
          setTimerSecondsRemaining(duration - elapsed);
          setIsTimerRunning(true);
          setShowTimerModal(true);
          setTimerStatusText('집중 진행 중');
          setShowSettingsInModal(false);
        }
      }
    } catch (err) {
      console.error('Error recovering session:', err);
    }
  };

  // --- Auth Actions ---
  const handleSelectUser = () => {
    if (!selectedUserId) {
      setAuthError('사용자 프로필을 선택해주세요.');
      return;
    }
    const user = existingUsers.find((u) => u.id === selectedUserId);
    if (user) {
      localStorage.setItem('focus_habit_user', JSON.stringify(user));
      setCurrentUser(user);
      setAuthError(null);
    }
  };

  const handleRegisterUser = async () => {
    if (!regEmail || !regPassword) {
      setAuthError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    try {
      const res = await apiCall('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });
      if (res.data) {
        localStorage.setItem('focus_habit_user', JSON.stringify(res.data));
        setCurrentUser(res.data);
        setAuthError(null);
      }
    } catch (err: any) {
      setAuthError(err.message || '회원가입 실패');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('focus_habit_user');
    setCurrentUser(null);
    setHabits([]);
    setSessions([]);
    setActiveSession(null);
    setIsTimerRunning(false);
  };

  // --- Habit Actions ---
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newHabitTitle.trim()) return;

    try {
      const res = await apiCall('/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser.id,
          title: newHabitTitle,
          description: newHabitDesc,
          targetTomato: newHabitTarget,
        }),
      });

      const newHabit = res.data;

      // Save initial config to localStorage
      if (newHabit) {
        localStorage.setItem(
          `habit_config_${newHabit.id}`,
          JSON.stringify({
            duration: newHabitDuration * 60,
            autoRepeat: newHabitRepeat,
          })
        );
      }

      // Reset form states
      setNewHabitTitle('');
      setNewHabitDesc('');
      setNewHabitTarget(4);
      setNewHabitDuration(25);
      setNewHabitRepeat(false);
      setShowCreateForm(false);

      // Reload
      await loadDashboardData();

      // Open timer immediately
      if (newHabit) {
        triggerTimerModal(newHabit.id, [...habits, newHabit]);
      }
    } catch (err: any) {
      alert(`습관 등록 실패: ${err.message}`);
    }
  };

  const handleToggleHabitStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiCall(`/api/habits/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      loadDashboardData();
    } catch (err: any) {
      alert(`습관 상태 변경 실패: ${err.message}`);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm('정말로 이 습관을 삭제하시겠습니까? 관련 포모도로 세션도 모두 함께 삭제됩니다.')) {
      return;
    }
    try {
      await apiCall(`/api/habits/${id}`, { method: 'DELETE' });
      loadDashboardData();
    } catch (err: any) {
      alert(`습관 삭제 실패: ${err.message}`);
    }
  };

  // --- Timer Control Actions ---
  const triggerTimerModal = (habitId: string, currentHabitsList = habits) => {
    const habit = currentHabitsList.find((h) => h.id === habitId);
    if (!habit) return;

    setActiveHabitId(habitId);
    setActiveSession(null);
    setShowTimerModal(true);
    setShowSettingsInModal(false);
    setTimerStatusText('집중 대기 중');

    // Load config from localStorage
    const savedConfig = localStorage.getItem(`habit_config_${habitId}`);
    if (savedConfig) {
      const config = JSON.parse(savedConfig) as HabitConfig;
      setTimerTotalSeconds(config.duration);
      setTimerSecondsRemaining(config.duration);
    } else {
      setTimerTotalSeconds(1500); // 25m
      setTimerSecondsRemaining(1500);
    }
  };

  const closeTimerModal = () => {
    setIsTimerRunning(false);
    setShowTimerModal(false);
    setActiveSession(null);
    loadDashboardData();
  };

  const handleTimerAction = async () => {
    if (!currentUser || !activeHabitId) return;

    if (!isTimerRunning) {
      try {
        let session = activeSession;
        if (!session) {
          // Step 1: Create session
          const createRes = await apiCall('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({
              userId: currentUser.id,
              habitId: activeHabitId,
              duration: timerTotalSeconds,
            }),
          });
          session = createRes.data;
        }

        if (session) {
          // Step 2: Start session only if it's IDLE
          if (session.status === 'IDLE') {
            const startRes = await apiCall(`/api/sessions/${session.id}/start`, {
              method: 'PATCH',
            });
            session = startRes.data;
          }
          setActiveSession(session);
          setTimerStatusText('집중 진행 중');
          setShowSettingsInModal(false);
          playSynthBeep(440, 0.05);
          setIsTimerRunning(true);
        }
      } catch (err: any) {
        alert(`세션 시작 실패: ${err.message}`);
      }
    } else {
      // Pause
      setIsTimerRunning(false);
      setTimerStatusText('일시 정지됨');
    }
  };

  const triggerSessionCompletion = async (sessionToComplete: Session) => {
    try {
      await apiCall(`/api/sessions/${sessionToComplete.id}/complete`, { method: 'PATCH' });
      // Refresh background stats immediately
      if (currentUser) {
        const res = await apiCall(`/api/sessions/user/${currentUser.id}`);
        setSessions(res.data || []);
      }
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const handleTimerComplete = async () => {
    setTimerStatusText('집중 완료!');
    playSuccessSound();
    burstParticles();

    let session = activeSession;
    if (session) {
      await triggerSessionCompletion(session);
    }

    // Auto-repeat logic: decoupled from target tomato limits (continues repeating indefinitely until paused/cancelled)
    const savedConfig = localStorage.getItem(`habit_config_${activeHabitId}`);
    const config = savedConfig ? (JSON.parse(savedConfig) as HabitConfig) : null;
    const isAutoRepeat = config ? config.autoRepeat : false;

    if (isAutoRepeat && activeHabitId && currentUser) {
      setTimerStatusText('집중 완료! 2초 후 자동 반복 시작...');
      
      setTimeout(async () => {
        // Check if modal was closed during timeout
        if (!document.getElementById('timer-modal-element')) return;
        
        try {
          // Create new database session
          const createRes = await apiCall('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({
              userId: currentUser.id,
              habitId: activeHabitId,
              duration: timerTotalSeconds,
            }),
          });
          const newSession = createRes.data;

          if (newSession) {
            // Start immediately
            const startRes = await apiCall(`/api/sessions/${newSession.id}/start`, {
              method: 'PATCH',
            });
            setActiveSession(startRes.data);
            setTimerSecondsRemaining(timerTotalSeconds);
            setTimerStatusText('집중 진행 중');
            playSynthBeep(440, 0.05);
            setIsTimerRunning(true);
          }
        } catch (error) {
          console.error("Auto-repeat session start failed:", error);
        }
      }, 2000);
    } else {
      // Manual confirm button visible
      setIsTimerRunning(false);
      setActiveSession(null);
    }
  };

  const handleTimerFail = async () => {
    if (!confirm('정말 집중을 중단하고 실패 처리하시겠습니까? 포기한 세션도 데이터베이스에 실패 기록이 남습니다.')) {
      return;
    }
    setIsTimerRunning(false);
    setTimerStatusText('집중 실패');
    
    try {
      playFailSound();
    } catch (soundErr) {
      console.warn('Failed to play fail sound:', soundErr);
    }

    if (activeSession) {
      try {
        await apiCall(`/api/sessions/${activeSession.id}/fail`, { method: 'PATCH' });
        setActiveSession(null);
        await loadDashboardData();
      } catch (err) {
        console.error('Failed to fail session:', err);
      }
    }
  };

  const handleTimerRestart = async () => {
    if (!currentUser || !activeHabitId) return;

    setIsTimerRunning(false);
    setActiveSession(null);
    setTimerStatusText('집중 대기 중');
    setTimerSecondsRemaining(timerTotalSeconds);

    try {
      // Step 1: Create session
      const createRes = await apiCall('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser.id,
          habitId: activeHabitId,
          duration: timerTotalSeconds,
        }),
      });
      const session = createRes.data;

      if (session) {
        // Step 2: Start session
        const startRes = await apiCall(`/api/sessions/${session.id}/start`, {
          method: 'PATCH',
        });
        setActiveSession(startRes.data);
        setTimerStatusText('집중 진행 중');
        setShowSettingsInModal(false);
        try {
          playSynthBeep(440, 0.05);
        } catch (soundErr) {
          console.warn('Failed to play sound:', soundErr);
        }
        setIsTimerRunning(true);
      }
    } catch (err: any) {
      alert(`세션 재시작 실패: ${err.message}`);
    }
  };

  const handleEditTimeChange = (minutes: number) => {
    setTimerTotalSeconds(minutes * 60);
    setTimerSecondsRemaining(minutes * 60);

    // Save to localStorage dynamically
    if (activeHabitId) {
      const savedConfig = localStorage.getItem(`habit_config_${activeHabitId}`);
      const config = savedConfig ? (JSON.parse(savedConfig) as HabitConfig) : { duration: 1500, autoRepeat: false };
      config.duration = minutes * 60;
      localStorage.setItem(`habit_config_${activeHabitId}`, JSON.stringify(config));
    }
  };

  const handleEditRepeatChange = (repeat: boolean) => {
    if (activeHabitId) {
      const savedConfig = localStorage.getItem(`habit_config_${activeHabitId}`);
      const config = savedConfig ? (JSON.parse(savedConfig) as HabitConfig) : { duration: 1500, autoRepeat: false };
      config.autoRepeat = repeat;
      localStorage.setItem(`habit_config_${activeHabitId}`, JSON.stringify(config));
    }
  };

  // --- Statistics computations ---
  const activeHabitsCount = habits.filter((h) => h.isActive).length;
  const today = new Date().toDateString();
  const todayCompletedCount = sessions.filter(
    (s) => s.status === 'COMPLETED' && new Date(s.createdAt).toDateString() === today
  ).length;

  // Complete stats
  const totalCompletedCount = sessions.filter((s) => s.status === 'COMPLETED').length;
  const totalFailedCount = sessions.filter((s) => s.status === 'FAILED').length;
  const successRate =
    totalCompletedCount + totalFailedCount > 0
      ? Math.round((totalCompletedCount / (totalCompletedCount + totalFailedCount)) * 100)
      : 0;

  // Mapped habit completed tomatoes count
  const habitTomatoesMap: Record<string, number> = {};
  sessions.forEach((s) => {
    if (s.status === 'COMPLETED') {
      habitTomatoesMap[s.habitId] = (habitTomatoesMap[s.habitId] || 0) + 1;
    }
  });

  const activeHabit = habits.find((h) => h.id === activeHabitId);

  // --- Render Welcome Auth Selection ---
  if (!currentUser) {
    return (
      <AuthCard
        authTab={authTab}
        setAuthTab={setAuthTab}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        existingUsers={existingUsers}
        regEmail={regEmail}
        setRegEmail={setRegEmail}
        regPassword={regPassword}
        setRegPassword={setRegPassword}
        authError={authError}
        handleSelectUser={handleSelectUser}
        handleRegisterUser={handleRegisterUser}
        fetchExistingUsers={fetchExistingUsers}
      />
    );
  }

  // --- Render Dashboard App View ---
  return (
    <div className="app-container">
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      {/* Main Header */}
      <header className="main-header glass-header">
        <div className="logo">
          <span className="logo-emoji">🍅</span>
          <span className="logo-text">FocusHabit</span>
        </div>
        <div className="header-right">
          <div className="user-profile">
            <UserIcon size={16} />
            <span id="current-user-email">{currentUser.email}</span>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={handleLogout} title="로그아웃">
            <LogOut size={16} />
            <span>로그아웃</span>
          </button>
        </div>
      </header>

      {/* Dashboard Main Content */}
      <main className="main-content">
        {/* Statistics Cards */}
        <section className="stats-section grid grid-cols-4 gap-4">
          <div className="glass-card stat-card">
            <div className="stat-icon purple-glow">
              <CheckSquare size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">활성 습관</span>
              <span className="stat-value" id="active-habits-count">{activeHabitsCount}개</span>
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-icon green-glow">
              <Sparkles size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">오늘 완료한 포모도로</span>
              <span className="stat-value" id="today-completed-count">{todayCompletedCount}개</span>
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-icon orange-glow">
              <Timer size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">누적 완료한 포모도로</span>
              <span className="stat-value" id="total-completed-count">{totalCompletedCount}개</span>
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-icon red-glow">
              <Target size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">집중 성공률</span>
              <span className="stat-value" id="success-rate-pct">{successRate}%</span>
            </div>
          </div>
        </section>

        {/* Dashboard Habit Grid */}
        <section className="habits-section mt-6 grid grid-cols-3 gap-6 align-start">
          {/* Habits List Container */}
          <div className="habits-list-card glass-card col-span-2">
            <div className="card-header">
              <div className="header-left">
                <Hourglass size={18} />
                <h3>나의 습관 목록</h3>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(true)}>
                <PlusCircle size={16} />
                <span>새 습관 추가</span>
              </button>
            </div>

            <div className="habits-list mt-4" id="habits-list-container">
              {habits.length === 0 ? (
                <div className="empty-state">
                  <p>등록된 습관이 없습니다. 새 습관을 추가하여 집중을 시작해보세요!</p>
                </div>
              ) : (
                habits.map((habit) => {
                  const completed = habitTomatoesMap[habit.id] || 0;
                  const target = habit.targetTomato;
                  const isFinished = completed >= target;

                  return (
                    <div key={habit.id} className={`habit-item glass-card ${habit.isActive ? '' : 'inactive'}`}>
                      <div className="habit-info">
                        <div className="habit-title-row">
                          <h4 className="habit-title">{habit.title}</h4>
                          {!habit.isActive && <span className="status-badge inactive-badge">일시 정지</span>}
                        </div>
                        {habit.description && <p className="habit-desc subtitle">{habit.description}</p>}
                        
                        <div className="progress-container mt-3">
                          <div className="progress-labels">
                            <span className="progress-label">오늘 달성도</span>
                            <span className="progress-value">
                              {completed} / {target} 🍅
                              {isFinished && <span className="text-green ml-2">목표 달성! ✨</span>}
                            </span>
                          </div>
                          
                          {/* Tomato completion icons visual grid */}
                          <div className="tomato-grid mt-2">
                            {(() => {
                              const list = [];
                              for (let i = 1; i <= target; i++) {
                                list.push(
                                  <span
                                    key={i}
                                    className={`tomato-dot ${i <= completed ? 'filled' : ''}`}
                                    title={`${i}번째 뽀모도로`}
                                  >
                                    🍅
                                  </span>
                                );
                              }
                              return list;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="habit-actions">
                        {habit.isActive ? (
                          <button
                            className="btn btn-primary btn-sm flex-1"
                            onClick={() => triggerTimerModal(habit.id)}
                          >
                            <Timer size={14} />
                            <span>타이머 시작</span>
                          </button>
                        ) : (
                          <button className="btn btn-secondary btn-sm flex-1" disabled>
                            일시정지됨
                          </button>
                        )}

                        <button
                          className={`btn ${habit.isActive ? 'btn-secondary' : 'btn-primary'} btn-icon-only`}
                          onClick={() => handleToggleHabitStatus(habit.id, habit.isActive)}
                          title={habit.isActive ? '습관 일시정지' : '습관 활성화'}
                        >
                          {habit.isActive ? <Pause size={14} /> : <Play size={14} />}
                        </button>

                        <button
                          className="btn btn-danger btn-icon-only"
                          onClick={() => handleDeleteHabit(habit.id)}
                          title="습관 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right side helper column for creations */}
          <div className="right-panel">
            {showCreateForm && (
              <div className="glass-card new-habit-card animate-fade-in" id="new-habit-form-container">
                <div className="card-header border-none">
                  <h3>새로운 습관 생성</h3>
                </div>
                <form id="new-habit-form" className="mt-3" onSubmit={handleCreateHabit}>
                  <div className="form-group">
                    <label className="form-label">습관 명칭</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="예: 아침 독서하기, 알고리즘 풀이"
                      required
                      value={newHabitTitle}
                      onChange={(e) => setNewHabitTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group mt-3">
                    <label className="form-label">습관 상세 정보 (설명)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="습관에 대한 간략한 정보를 기록해보세요"
                      value={newHabitDesc}
                      onChange={(e) => setNewHabitDesc(e.target.value)}
                    />
                  </div>

                  <div className="form-group mt-3">
                    <label className="form-label">하루 목표 뽀모도로 개수</label>
                    <div className="select-wrapper">
                      <select
                        className="form-input"
                        value={newHabitTarget}
                        onChange={(e) => setNewHabitTarget(parseInt(e.target.value))}
                      >
                        <option value="1">1개 (25분)</option>
                        <option value="2">2개 (50분)</option>
                        <option value="3">3개 (75분)</option>
                        <option value="4">4개 (100분)</option>
                        <option value="6">6개 (150분)</option>
                        <option value="8">8개 (200분)</option>
                      </select>
                    </div>
                  </div>

                  {/* Standard Duration Setting */}
                  <div className="form-group mt-3">
                    <label className="form-label">기본 집중 시간 설정</label>
                    <div className="select-wrapper">
                      <select
                        className="form-input"
                        value={newHabitDuration}
                        onChange={(e) => setNewHabitDuration(parseInt(e.target.value))}
                      >
                        <option value="5">5분</option>
                        <option value="15">15분</option>
                        <option value="25">25분</option>
                        <option value="30">30분</option>
                        <option value="45">45분</option>
                        <option value="60">60분</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto Repeat Toggle Option */}
                  <div className="form-group mt-3 flex justify-between items-center">
                    <label className="form-label">완료 시 자동 반복 (무한 루프)</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={newHabitRepeat}
                        onChange={(e) => setNewHabitRepeat(e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="form-actions mt-4 flex gap-2">
                    <button type="submit" className="btn btn-primary flex-1">
                      <span>생성하기</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCreateForm(false)}
                    >
                      <span>취소</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* History logs block */}
            <div className="glass-card logs-card mt-6">
              <div className="card-header border-none">
                <Clock size={16} />
                <h3>최근 집중 타임라인</h3>
              </div>
              <div className="logs-list mt-3" id="timeline-logs-container">
                {sessions.length === 0 ? (
                  <div className="empty-state py-4">
                    <p className="subtitle">아직 측정된 기록이 없습니다.</p>
                  </div>
                ) : (
                  sessions.slice(0, 5).map((session) => {
                    const habit = habits.find((h) => h.id === session.habitId);
                    const formattedDate = new Date(session.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const durationMins = Math.round(session.duration / 60);

                    let badgeClass = 'status-idle';
                    let statusLabel = '대기';
                    if (session.status === 'RUNNING') {
                      badgeClass = 'status-running';
                      statusLabel = '진행 중';
                    } else if (session.status === 'COMPLETED') {
                      badgeClass = 'status-completed';
                      statusLabel = '완료';
                    } else if (session.status === 'FAILED') {
                      badgeClass = 'status-failed';
                      statusLabel = '포기';
                    }

                    return (
                      <div key={session.id} className="log-item">
                        <div className="log-meta">
                          <span className="log-time">{formattedDate}</span>
                          <span className={`log-badge ${badgeClass}`}>{statusLabel}</span>
                        </div>
                        <div className="log-title">
                          <strong>{habit?.title || '삭제된 습관'}</strong>
                        </div>
                        <div className="log-desc subtitle">
                          {durationMins}분 집중 세션 {statusLabel === '완료' ? '성공 ✨' : statusLabel === '포기' ? '실패 ✕' : '진행'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Renders separated Pomodoro Modal */}
      <TimerModal
        showTimerModal={showTimerModal}
        activeHabit={activeHabit}
        timerSecondsRemaining={timerSecondsRemaining}
        timerTotalSeconds={timerTotalSeconds}
        isTimerRunning={isTimerRunning}
        speedMode={speedMode}
        setSpeedMode={setSpeedMode}
        showSettingsInModal={showSettingsInModal}
        setShowSettingsInModal={setShowSettingsInModal}
        timerStatusText={timerStatusText}
        activeSession={activeSession}
        handleTimerAction={handleTimerAction}
        handleTimerFail={handleTimerFail}
        handleTimerRestart={handleTimerRestart}
        closeTimerModal={closeTimerModal}
        handleEditTimeChange={handleEditTimeChange}
        handleEditRepeatChange={handleEditRepeatChange}
      />
    </div>
  );
}
