import { useState, useEffect, useRef } from 'react';
import type { User, Habit, Session, HabitConfig } from './types';
import { AuthCard } from './components/AuthCard';
import { TimerModal } from './components/TimerModal';
import { Header } from './components/Header';
import { StatsPanel } from './components/StatsPanel';
import { HabitList } from './components/HabitList';
import { CreateHabitForm } from './components/CreateHabitForm';
import { TimelineLogs } from './components/TimelineLogs';
import { playSynthBeep, playSuccessSound, playFailSound } from './utils/audio';
import { burstParticles } from './utils/particles';

export default function App() {
  // --- Authentication State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
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
  const handleLoginUser = async () => {
    if (!loginEmail || !loginPassword) {
      setAuthError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    try {
      const res = await apiCall('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (res.data) {
        localStorage.setItem('focus_habit_user', JSON.stringify(res.data));
        setCurrentUser(res.data);
        setAuthError(null);
      }
    } catch (err: any) {
      setAuthError(err.message || '로그인 실패');
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
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        regEmail={regEmail}
        setRegEmail={setRegEmail}
        regPassword={regPassword}
        setRegPassword={setRegPassword}
        authError={authError}
        handleLoginUser={handleLoginUser}
        handleRegisterUser={handleRegisterUser}
      />
    );
  }

  // --- Render Dashboard App View ---
  return (
    <div className="app-container">
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      {/* Main Header */}
      <Header email={currentUser.email} onLogout={handleLogout} />

      {/* Dashboard Main Content */}
      <main className="dashboard-layout">
        {/* Left Sidebar: Stats & Timeline */}
        <aside className="sidebar-panel">
          <StatsPanel
            activeHabitsCount={activeHabitsCount}
            todayCompletedCount={todayCompletedCount}
            totalCompletedCount={totalCompletedCount}
            successRate={successRate}
          />
          <TimelineLogs sessions={sessions} habits={habits} />
        </aside>

        {/* Main Panel: Habits & Creation */}
        <section className="main-panel">
          {showCreateForm && (
            <CreateHabitForm
              newHabitTitle={newHabitTitle}
              setNewHabitTitle={setNewHabitTitle}
              newHabitDesc={newHabitDesc}
              setNewHabitDesc={setNewHabitDesc}
              newHabitTarget={newHabitTarget}
              setNewHabitTarget={setNewHabitTarget}
              newHabitDuration={newHabitDuration}
              setNewHabitDuration={setNewHabitDuration}
              newHabitRepeat={newHabitRepeat}
              setNewHabitRepeat={setNewHabitRepeat}
              onSubmit={handleCreateHabit}
              onCancel={() => setShowCreateForm(false)}
            />
          )}
          <HabitList
            habits={habits}
            habitTomatoesMap={habitTomatoesMap}
            onStartTimer={triggerTimerModal}
            onToggleStatus={handleToggleHabitStatus}
            onDelete={handleDeleteHabit}
            onShowCreateForm={() => setShowCreateForm(true)}
          />
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
