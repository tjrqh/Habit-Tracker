import React, { useState, useEffect, useRef } from 'react';
import {
  Hourglass,
  Clock,
  Repeat,
  Zap,
  Play,
  Pause,
  Trash2,
  XCircle,
  Sparkles,
  User as UserIcon,
  LogOut,
  ChevronDown,
  RotateCw,
  Target,
  PlusCircle,
  CheckSquare,
  Timer
} from 'lucide-react';

interface User {
  id: string;
  email: string;
}

interface Habit {
  id: string;
  userId: string;
  title: string;
  targetTomato: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface Session {
  id: string;
  userId: string;
  habitId: string;
  status: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

interface HabitConfig {
  duration: number; // in seconds
  autoRepeat: boolean;
}

export default function App() {
  // --- Authentication State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // --- Dashboard State ---
  const [habits, setHabits] = useState<Habit[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState<boolean>(false);
  const [newHabitTitle, setNewHabitTitle] = useState<string>('');
  const [newHabitTarget, setNewHabitTarget] = useState<number>(4);
  const [newHabitDesc, setNewHabitDesc] = useState<string>('');
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
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsRemaining((prev) => {
          const next = speedMode ? Math.max(0, prev - 60) : Math.max(0, prev - 1);
          if (next <= 0) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            handleTimerComplete();
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, speedMode, activeSession, timerTotalSeconds, activeHabitId]);

  // Sync circular progress ring offset when time ticks
  const circleRadius = 120;
  const circumference = 2 * Math.PI * circleRadius;
  const pct = timerSecondsRemaining / timerTotalSeconds;
  const strokeDashoffset = circumference - pct * circumference;

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

  const handleRegisterUser = async () => {
    setAuthError('');
    if (!regEmail.trim() || !regPassword) {
      setAuthError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    try {
      const res = await apiCall('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({ email: regEmail.trim(), password: regPassword }),
      });
      if (res.data) {
        const user = { id: res.data.id, email: res.data.email };
        setCurrentUser(user);
        localStorage.setItem('focus_habit_user', JSON.stringify(user));
        setRegEmail('');
        setRegPassword('');
      }
    } catch (err: any) {
      setAuthError(err.message || '가입 도중 오류가 발생했습니다.');
    }
  };

  const handleSelectUser = () => {
    setAuthError('');
    if (!selectedUserId) {
      setAuthError('로그인할 사용자를 선택해주세요.');
      return;
    }
    const user = existingUsers.find((u) => u.id === selectedUserId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('focus_habit_user', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('focus_habit_user');
    setCurrentUser(null);
    setHabits([]);
    setSessions([]);
    setSelectedUserId('');
    setActiveSession(null);
    setIsTimerRunning(false);
    setShowTimerModal(false);
  };

  const handleCreateHabit = async () => {
    if (!newHabitTitle.trim() || !currentUser) {
      alert('습관 이름을 입력해주세요.');
      return;
    }
    try {
      const res = await apiCall('/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser.id,
          title: newHabitTitle.trim(),
          targetTomato: newHabitTarget,
          description: newHabitDesc.trim(),
        }),
      });

      const newHabit = res.data;
      if (newHabit && newHabit.id) {
        // Save duration and auto-repeat setting to localStorage under habit ID
        const config: HabitConfig = {
          duration: newHabitDuration * 60,
          autoRepeat: newHabitRepeat,
        };
        localStorage.setItem(`habit_config_${newHabit.id}`, JSON.stringify(config));
      }

      // Reset inputs
      setNewHabitTitle('');
      setNewHabitTarget(4);
      setNewHabitDesc('');
      setNewHabitDuration(25);
      setNewHabitRepeat(false);
      setIsHabitFormOpen(false);

      // Refresh data
      const habitsRes = await apiCall(`/api/habits/user/${currentUser.id}`);
      const updatedHabits = habitsRes.data || [];
      setHabits(updatedHabits);

      const sessionsRes = await apiCall(`/api/sessions/user/${currentUser.id}`);
      setSessions(sessionsRes.data || []);

      // Immediately open timer modal for the new habit
      if (newHabit && newHabit.id) {
        // We pass the updated habits array directly to locate it instantly
        const habitObj = updatedHabits.find((h: Habit) => h.id === newHabit.id);
        if (habitObj) {
          triggerTimerModal(newHabit.id, updatedHabits);
        }
      }
    } catch (err: any) {
      alert(`습관 추가 실패: ${err.message}`);
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

  // --- Timer Functionality ---
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
    loadDashboardData();
  };

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
          // Step 2: Start session
          const startRes = await apiCall(`/api/sessions/${session.id}/start`, {
            method: 'PATCH',
          });
          setActiveSession(startRes.data);
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
    }
  };

  const handleTimerFail = async () => {
    if (!confirm('정말 집중을 중단하고 실패 처리하시겠습니까? 포기한 세션도 데이터베이스에 실패 기록이 남습니다.')) {
      return;
    }
    setIsTimerRunning(false);
    setTimerStatusText('집중 실패');
    playFailSound();

    if (activeSession) {
      try {
        await apiCall(`/api/sessions/${activeSession.id}/fail`, { method: 'PATCH' });
      } catch (err) {
        console.error('Failed to fail session:', err);
      }
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

  // --- Audio Synthesis Alert Tones ---
  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSynthBeep = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playSuccessSound = () => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Bright C Major arpeggio)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + idx * 0.12;
      const duration = 0.6;
      gainNode.gain.setValueAtTime(0.1, start);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    });
  };

  const playFailSound = () => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.linearRampToValueAtTime(165, now + 0.5);
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  };

  // --- Confetti Particle Burst ---
  const burstParticles = () => {
    const modalEl = document.getElementById('timer-modal-element');
    if (!modalEl) return;
    const rect = modalEl.getBoundingClientRect();
    const colors = ['#7c3aed', '#3b82f6', '#ff6b6b', '#10b981', '#fbbf24'];

    for (let i = 0; i < 40; i++) {
      const particle = document.createElement('div');
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 3;

      particle.style.position = 'fixed';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.width = `${Math.random() * 8 + 6}px`;
      particle.style.height = particle.style.width;
      particle.style.borderRadius = '50%';
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.backgroundColor = color;
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';
      particle.style.boxShadow = `0 0 10px ${color}`;
      document.body.appendChild(particle);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      const velX = Math.cos(angle) * speed;
      const velY = Math.sin(angle) * speed - 2;

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
        particle.style.opacity = opacity.toString();

        if (opacity > 0) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
        }
      };
      requestAnimationFrame(animate);
    }
  };

  // --- Statistics computations ---
  const activeHabitsCount = habits.filter((h) => h.isActive).length;
  const today = new Date().toDateString();
  const todayCompletedCount = sessions.filter(
    (s) => s.status === 'COMPLETED' && new Date(s.createdAt).toDateString() === today
  ).length;
  const totalCompletedDurationSeconds = sessions
    .filter((s) => s.status === 'COMPLETED')
    .reduce((acc, curr) => acc + curr.duration, 0);
  const totalMinutes = Math.round(totalCompletedDurationSeconds / 60);

  // Mapped habit completed tomatoes count
  const habitTomatoesMap: Record<string, number> = {};
  sessions.forEach((s) => {
    if (s.status === 'COMPLETED') {
      habitTomatoesMap[s.habitId] = (habitTomatoesMap[s.habitId] || 0) + 1;
    }
  });

  const activeHabit = habits.find((h) => h.id === activeHabitId);
  const currentHabitConfig = activeHabitId
    ? (JSON.parse(localStorage.getItem(`habit_config_${activeHabitId}`) || '{}') as Partial<HabitConfig>)
    : null;
  const activeAutoRepeat = currentHabitConfig?.autoRepeat ?? false;
  const activeDurationMins = currentHabitConfig?.duration ? currentHabitConfig.duration / 60 : 25;

  // --- Format clock digital face ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Render welcome login view ---
  if (!currentUser) {
    return (
      <div className="app-container">
        <div className="bg-glow bg-glow-1"></div>
        <div className="bg-glow bg-glow-2"></div>
        <div id="auth-overlay" className="overlay active">
          <div className="glass-card auth-card">
            <div className="auth-header">
              <div className="logo-icon">🍅</div>
              <h2>FocusHabit 시작하기</h2>
              <p className="subtitle">포모도로 기법과 습관 관리를 하나로</p>
            </div>

            <div className="auth-tabs">
              <button
                className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthTab('login');
                  fetchExistingUsers();
                }}
              >
                사용자 선택
              </button>
              <button
                className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`}
                onClick={() => setAuthTab('register')}
              >
                신규 등록
              </button>
            </div>

            {authTab === 'login' ? (
              <div className="auth-section active">
                <label className="form-label">기존 사용자 프로필 선택</label>
                <div className="select-wrapper">
                  <select
                    className="form-input"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="" disabled>
                      사용자 프로필을 선택해주세요
                    </option>
                    {existingUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary w-full mt-4" onClick={handleSelectUser}>
                  <span>대시보드 진입</span>
                </button>
              </div>
            ) : (
              <div className="auth-section active">
                <div className="form-group">
                  <label className="form-label">이메일 주소</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="example@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
                <div className="form-group mt-3">
                  <label className="form-label">비밀번호</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary w-full mt-4" onClick={handleRegisterUser}>
                  <span>회원가입 및 시작</span>
                </button>
              </div>
            )}

            {authError && <div className="error-text mt-3 text-center">{authError}</div>}
          </div>
        </div>
      </div>
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
          <div className="user-badge">
            <UserIcon />
            <span>{currentUser.email}</span>
          </div>
          <button className="btn btn-icon btn-logout" onClick={handleLogout} title="로그아웃">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="main-content">
        {/* Left panel: stats, creation card and lists */}
        <section className="left-panel">
          {/* Stats summary row */}
          <div className="stats-grid">
            <div className="glass-card stat-card">
              <div className="stat-icon-wrapper tomato-bg">
                <Timer className="stat-icon text-tomato" />
              </div>
              <div className="stat-info">
                <span className="stat-label">오늘 모은 토마토</span>
                <h3 className="stat-value">
                  {todayCompletedCount} <span className="unit">개</span>
                </h3>
              </div>
            </div>

            <div className="glass-card stat-card">
              <div className="stat-icon-wrapper duration-bg">
                <Hourglass className="stat-icon text-duration" />
              </div>
              <div className="stat-info">
                <span className="stat-label">총 집중 시간</span>
                <h3 className="stat-value">
                  {totalMinutes} <span className="unit">분</span>
                </h3>
              </div>
            </div>

            <div className="glass-card stat-card">
              <div className="stat-icon-wrapper habit-bg">
                <CheckSquare className="stat-icon text-habit" />
              </div>
              <div className="stat-info">
                <span className="stat-label">활성 습관</span>
                <h3 className="stat-value">
                  {activeHabitsCount} <span className="unit">개</span>
                </h3>
              </div>
            </div>
          </div>

          {/* New Habit Creation Card */}
          <div className={`glass-card habit-form-card mt-4 ${isHabitFormOpen ? 'open' : ''}`}>
            <div className="card-header" onClick={() => setIsHabitFormOpen(!isHabitFormOpen)}>
              <div className="header-title">
                <PlusCircle className="text-primary" />
                <h3>새로운 습관 설정하기</h3>
              </div>
              <ChevronDown className="form-toggle-icon" />
            </div>

            <div className="card-body collapsible">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">습관 명칭</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 매일 알고리즘 풀기, 독서하기 등"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">일일 목표 포모도로 (뽀모개수)</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newHabitTarget}
                      onChange={(e) => setNewHabitTarget(parseInt(e.target.value))}
                    />
                    <span className="slider-badge">{newHabitTarget}개</span>
                  </div>
                </div>
              </div>

              <div className="form-group mt-3">
                <label className="form-label">상세 설명 (선택 사항)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="이 습관을 달성하기 위한 구체적인 방법이나 다짐을 기록해보세요."
                  value={newHabitDesc}
                  onChange={(e) => setNewHabitDesc(e.target.value)}
                />
              </div>

              {/* Added focus duration and repeat switches dynamically */}
              <div className="form-grid mt-3">
                <div className="form-group">
                  <label className="form-label">기본 집중 시간 설정</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="120"
                      value={newHabitDuration}
                      onChange={(e) => setNewHabitDuration(parseInt(e.target.value))}
                    />
                    <span className="slider-badge">{newHabitDuration}분</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">자동 반복 모드 설정</label>
                  <div
                    className="toggle-card"
                    style={{
                      padding: '10px 16px',
                      height: '45px',
                      marginTop: 0,
                      background: 'rgba(255,255,255,0.02)',
                      border: 'var(--border-glass)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
                      종료 시 자동 반복
                    </span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={newHabitRepeat}
                        onChange={(e) => setNewHabitRepeat(e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button className="btn btn-primary" onClick={handleCreateHabit}>
                  <Sparkles size={16} />
                  <span>습관 만들기</span>
                </button>
              </div>
            </div>
          </div>

          {/* Habits grid lists */}
          <div className="habits-section mt-4">
            <div className="section-title-wrapper">
              <Target className="text-primary" size={20} />
              <h2>나의 습관 목록</h2>
            </div>

            <div className="habits-grid mt-3">
              {habits.length === 0 ? (
                <div className="glass-card loading-card">
                  <p>등록된 습관이 없습니다. 상단 폼을 이용해 습관을 만들어보세요!</p>
                </div>
              ) : (
                habits.map((habit) => {
                  const completedCount = habitTomatoesMap[habit.id] || 0;
                  const target = habit.targetTomato || 1;
                  const percentage = Math.min(Math.round((completedCount / target) * 100), 100);

                  // Create tomato visual badges array
                  const tomatoesList = [];
                  for (let i = 1; i <= target; i++) {
                    tomatoesList.push(
                      <span
                        key={i}
                        className={`tomato-indicator-item ${i <= completedCount ? 'active' : ''}`}
                        title={i <= completedCount ? '완료됨' : '미완료'}
                      >
                        {i <= completedCount ? '🍅' : '⚪'}
                      </span>
                    );
                  }

                  return (
                    <div key={habit.id} className="glass-card habit-card" id={`habit-card-${habit.id}`}>
                      <div>
                        <div className="habit-top">
                          <div className="habit-title-container">
                            <h4 className="habit-card-title">{habit.title}</h4>
                            <p className="habit-card-desc">{habit.description || '설명 없음'}</p>
                          </div>
                          <button
                            className="delete-habit-btn"
                            onClick={() => handleDeleteHabit(habit.id)}
                            title="습관 삭제"
                          >
                            <Trash2 />
                          </button>
                        </div>

                        <div className="progress-section">
                          <div className="progress-header-info">
                            <span>목표 진행률</span>
                            <span className="progress-pct">{percentage}%</span>
                          </div>
                          <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <div className="tomato-indicators">{tomatoesList}</div>
                        </div>
                      </div>

                      <div className="habit-actions">
                        <button className="btn btn-primary w-full" onClick={() => triggerTimerModal(habit.id)}>
                          <Play size={14} />
                          <span>포모도로 타이머 시작</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Right side history log */}
        <section className="right-panel">
          <div className="glass-card history-card h-full">
            <div className="card-header border-b">
              <div className="header-title">
                <RotateCw className="text-secondary" />
                <h3>최근 집중 세션 기록</h3>
              </div>
              <button className="btn btn-icon btn-sm" onClick={loadDashboardData} title="기록 새로고침">
                <RotateCw size={14} />
              </button>
            </div>
            <div className="card-body scroll-y">
              {sessions.length === 0 ? (
                <div className="loading-text">기록된 포모도로 집중 내역이 없습니다.</div>
              ) : (
                <div className="timeline">
                  {[...sessions]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((session) => {
                      const date = new Date(session.createdAt);
                      const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                      const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                      const habitObj = habits.find((h) => h.id === session.habitId);
                      const habitTitle = habitObj ? habitObj.title : '삭제된 습관';
                      const minutesVal = Math.round(session.duration / 60);

                      let statusText = '진행 중';
                      let badgeClass = 'status-running';
                      if (session.status === 'COMPLETED') {
                        statusText = '완료';
                        badgeClass = 'status-completed';
                      } else if (session.status === 'FAILED') {
                        statusText = '중단';
                        badgeClass = 'status-failed';
                      }

                      return (
                        <div key={session.id} className={`timeline-item ${session.status.toLowerCase()}`}>
                          <div className="timeline-content">
                            <h5>{habitTitle}</h5>
                            <div className="timeline-meta mt-1">
                              <span>
                                {dateStr} {timeStr} • {minutesVal}분
                              </span>
                              <span className={`status-badge ${badgeClass}`}>{statusText}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Pomodoro Timer Modal Overlay */}
      {showTimerModal && (
        <div id="timer-modal" className="overlay active">
          <div className="glass-card timer-card" id="timer-modal-element">
            {/* Header */}
            <div className="timer-header">
              <span className="active-badge">FOCUSING NOW</span>
              <h2>{activeHabit?.title || '로딩 중...'}</h2>
              <p className="subtitle">{activeHabit?.description || '설명 없음'}</p>
            </div>

            {/* Circular Clock Face Progress */}
            <div className="timer-visual-wrapper">
              <svg className="progress-ring" width="280" height="280">
                <circle
                  className="progress-ring-bg"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="8"
                  fill="transparent"
                  r={circleRadius}
                  cx="140"
                  cy="140"
                />
                <circle
                  className="progress-ring-circle"
                  stroke="url(#gradient-tomato)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="transparent"
                  r={circleRadius}
                  cx="140"
                  cy="140"
                  style={{
                    strokeDasharray: `${circumference} ${circumference}`,
                    strokeDashoffset: strokeDashoffset,
                    stroke: timerStatusText === '집중 완료!' ? '#10b981' : timerStatusText === '집중 실패' ? '#f43f5e' : undefined,
                  }}
                />
                <defs>
                  <linearGradient id="gradient-tomato" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff6b6b" />
                    <stop offset="100%" stopColor="#ff9233" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="timer-clock">
                <span id="timer-display">{formatTime(timerSecondsRemaining)}</span>
                <span className="status-label">{timerStatusText}</span>
              </div>
            </div>

            {/* Config Panel (Visible only when toggle Settings is clicked, hidden by default) */}
            {showSettingsInModal && (
              <div id="timer-settings-container" className="w-full mt-3">
                {/* Duration select */}
                <div className="setting-card">
                  <div className="setting-header">
                    <Clock size={16} className="text-primary" />
                    <span className="setting-title">집중 시간 수정</span>
                  </div>
                  <div className="slider-container mt-2">
                    <input
                      type="range"
                      min="1"
                      max="120"
                      value={activeDurationMins}
                      onChange={(e) => handleEditTimeChange(parseInt(e.target.value))}
                    />
                    <span className="slider-badge">{activeDurationMins}분</span>
                  </div>
                </div>

                {/* Repeat toggle switch */}
                <div className="toggle-card mt-3">
                  <div className="toggle-label-wrapper">
                    <Repeat size={16} className="text-primary" />
                    <div className="toggle-text">
                      <span className="title">자동 반복 모드 (무한 반복)</span>
                      <span className="desc">집중 완료 시 정지할 때까지 계속 타이머를 반복합니다.</span>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={activeAutoRepeat}
                      onChange={(e) => handleEditRepeatChange(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            )}

            {/* Test speed mode option card */}
            <div className="speed-toggle-card mt-3">
              <div className="speed-toggle-label">
                <Zap className="text-yellow" size={16} />
                <div>
                  <span className="title">개발자 테스트 모드 (1초 = 1분)</span>
                  <span className="desc">빠른 타이머 완료 테스트를 원할 때 켜세요.</span>
                </div>
              </div>
              <label className="switch">
                <input type="checkbox" checked={speedMode} onChange={(e) => setSpeedMode(e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>

            {/* Controller Action buttons */}
            <div className="timer-controls mt-4">
              {timerStatusText !== '집중 완료!' && timerStatusText !== '집중 실패' && (
                <>
                  {/* Edit configuration visibility toggle */}
                  {!isTimerRunning && (
                    <button
                      className="btn btn-secondary btn-lg"
                      onClick={() => setShowSettingsInModal(!showSettingsInModal)}
                      title="설정 수정"
                    >
                      <span>수정</span>
                    </button>
                  )}

                  <button
                    className="btn btn-primary btn-lg flex-1"
                    onClick={handleTimerAction}
                  >
                    {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                    <span>{isTimerRunning ? '일시정지' : activeSession ? '집중 재개' : '집중 시작'}</span>
                  </button>
                </>
              )}

              {/* Cancel session */}
              {isTimerRunning && (
                <button className="btn btn-danger btn-lg" onClick={handleTimerFail}>
                  <XCircle size={16} />
                  <span>포기하기</span>
                </button>
              )}

              {/* Close/Exit modal */}
              {(!isTimerRunning || timerStatusText === '집중 완료!' || timerStatusText === '집중 실패') && (
                <button
                  className="btn btn-secondary btn-lg flex-1"
                  onClick={closeTimerModal}
                >
                  <span>
                    {timerStatusText === '집중 완료!'
                      ? '완료 확인'
                      : timerStatusText === '집중 실패'
                      ? '닫기'
                      : '나가기'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
