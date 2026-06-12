import React, { useState, useEffect } from 'react';
import { Play, Pause, XCircle, RotateCw, Clock, Repeat, Zap, Settings } from 'lucide-react';
import type { Habit, Session } from '../types';

interface TimerModalProps {
  showTimerModal: boolean;
  activeHabit: Habit | undefined;
  timerSecondsRemaining: number;
  timerTotalSeconds: number;
  isTimerRunning: boolean;
  speedMode: boolean;
  setSpeedMode: (speed: boolean) => void;
  showSettingsInModal: boolean;
  setShowSettingsInModal: (show: boolean) => void;
  timerStatusText: string;
  activeSession: Session | null;
  handleTimerAction: () => void;
  handleTimerFail: () => void;
  handleTimerRestart: () => void;
  closeTimerModal: () => void;
  handleEditTimeChange: (minutes: number) => void;
  handleEditRepeatChange: (repeat: boolean) => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({
  showTimerModal,
  activeHabit,
  timerSecondsRemaining,
  timerTotalSeconds,
  isTimerRunning,
  speedMode,
  setSpeedMode,
  showSettingsInModal,
  setShowSettingsInModal,
  timerStatusText,
  /* activeSession is passed but not read inside TimerModal anymore */
  handleTimerAction,
  handleTimerFail,
  handleTimerRestart,
  closeTimerModal,
  handleEditTimeChange,
  handleEditRepeatChange,
}) => {
  if (!showTimerModal) return null;

  // Circular progress dimensions
  const circleRadius = 120;
  const circumference = 2 * Math.PI * circleRadius;
  const pct = timerSecondsRemaining / timerTotalSeconds;
  const strokeDashoffset = circumference - pct * circumference;

  // Format clock digital face
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentHabitConfig = activeHabit
    ? (JSON.parse(localStorage.getItem(`habit_config_${activeHabit.id}`) || '{}'))
    : null;
  const activeAutoRepeat = currentHabitConfig?.autoRepeat ?? false;
  const activeDurationMins = currentHabitConfig?.duration ? currentHabitConfig.duration / 60 : 25;

  // Local state for drag performance optimization
  const [localAutoRepeat, setLocalAutoRepeat] = useState<boolean>(activeAutoRepeat);
  const [localDurationMins, setLocalDurationMins] = useState<number>(activeDurationMins);

  // Sync state when active habit or modal display status changes
  useEffect(() => {
    if (showTimerModal) {
      setLocalAutoRepeat(activeAutoRepeat);
      setLocalDurationMins(activeDurationMins);
    }
  }, [activeHabit, showTimerModal]);

  // Handle Drag / Slider interaction complete
  const handleSliderRelease = () => {
    handleEditTimeChange(localDurationMins);
  };

  return (
    <div className="timer-modal-overlay">
      <div className="timer-modal-content">
        <button 
          className="close-modal-btn" 
          onClick={() => {
            if (isTimerRunning) {
              if (confirm('집중이 진행 중입니다. 정말로 타이머 창을 닫으시겠습니까?')) {
                closeTimerModal();
              }
            } else {
              closeTimerModal();
            }
          }}
          title="나가기"
        >
          <XCircle size={24} />
        </button>

        <h2 className="timer-habit-title">{activeHabit?.title || '습관명'}</h2>

        <div className={`timer-circle-container ${isTimerRunning ? 'timer-running' : ''} ${timerStatusText === '집중 실패' ? 'timer-failed' : ''}`}>
          <div className="neon-ring"></div>
          <svg className="progress-ring" width="280" height="280" style={{ position: 'absolute', zIndex: 1 }}>
            <circle
              className="progress-ring-bg"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="6"
              fill="transparent"
              r={circleRadius}
              cx="140"
              cy="140"
            />
            <circle
              className="progress-ring-circle"
              stroke={timerStatusText === '집중 완료!' ? 'var(--emerald)' : timerStatusText === '집중 실패' ? 'var(--rose)' : 'var(--primary)'}
              strokeWidth="8"
              strokeLinecap="round"
              fill="transparent"
              r={circleRadius}
              cx="140"
              cy="140"
              style={{
                strokeDasharray: `${circumference} ${circumference}`,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 1s linear, stroke 0.3s'
              }}
            />
          </svg>

          <span className="time-display">{formatTime(timerSecondsRemaining)}</span>
          <span className="timer-status">{timerStatusText}</span>
        </div>

        <div className="timer-controls">
          {timerStatusText !== '집중 완료!' && timerStatusText !== '집중 실패' ? (
            <button
              className={`btn-floating ${isTimerRunning ? 'stop' : 'play'}`}
              onClick={handleTimerAction}
              title={isTimerRunning ? '일시정지' : '집중 시작'}
            >
              {isTimerRunning ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: '4px' }} />}
            </button>
          ) : (
            <button
              className="btn-floating play"
              onClick={handleTimerRestart}
              title="다시 시작"
            >
              <RotateCw size={28} />
            </button>
          )}

          {isTimerRunning && (
            <button className="btn-floating stop" onClick={handleTimerFail} title="포기">
              <XCircle size={28} />
            </button>
          )}
          
          {!isTimerRunning && timerStatusText !== '집중 완료!' && timerStatusText !== '집중 실패' && (
            <button
              className="btn-floating"
              onClick={() => setShowSettingsInModal(!showSettingsInModal)}
              title="설정"
            >
              <Settings size={24} />
            </button>
          )}
        </div>

        {/* Sliding Settings Drawer */}
        <div className="settings-drawer" style={{ display: showSettingsInModal && !isTimerRunning ? 'block' : 'none', marginTop: '30px', textAlign: 'left', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: 'var(--border-glass)' }}>
          <div className="setting-group" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Clock size={16} color="var(--primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>집중 시간 수정</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input
                type="range"
                min="1"
                max="120"
                value={localDurationMins}
                onChange={(e) => setLocalDurationMins(parseInt(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                style={{ flex: 1 }}
              />
              <span style={{ fontWeight: 700, fontSize: '16px' }}>{localDurationMins}분</span>
            </div>
          </div>

          <div className="setting-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Repeat size={16} color="var(--primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>자동 반복 모드</span>
            </div>
            <input
              type="checkbox"
              checked={localAutoRepeat}
              onChange={(e) => {
                const repeat = e.target.checked;
                setLocalAutoRepeat(repeat);
                handleEditRepeatChange(repeat);
              }}
            />
          </div>

          <div className="setting-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="var(--amber)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>테스트 모드 (1초=1분)</span>
            </div>
            <input
              type="checkbox"
              checked={speedMode}
              onChange={(e) => setSpeedMode(e.target.checked)}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
