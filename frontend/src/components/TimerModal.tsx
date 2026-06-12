import React from 'react';
import { Play, Pause, XCircle, RotateCw } from 'lucide-react';
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
  activeSession,
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

  return (
    <div id="timer-modal" className="overlay active">
      <div id="timer-modal-element" className="glass-card timer-card">
        {/* Timer Header */}
        <div className="timer-header">
          <span className="active-badge">FOCUSING NOW</span>
          <h2>{activeHabit?.title || '습관명'}</h2>
          <p className="subtitle">{activeHabit?.description || '설명 없음'}</p>
        </div>

        {/* Circular Timer Display */}
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

        {/* Config Panel */}
        {showSettingsInModal && (
          <div id="timer-settings-container" className="w-full mt-3">
            <div className="setting-card">
              <div className="setting-header">
                <span className="setting-title">집중 시간 설정</span>
              </div>
              <div className="slider-container mt-2">
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={activeDurationMins}
                  className="slider"
                  onChange={(e) => handleEditTimeChange(parseInt(e.target.value))}
                />
                <span className="slider-val">{activeDurationMins}분</span>
              </div>
            </div>

            <div className="setting-card mt-2">
              <div className="setting-header">
                <span className="setting-title">자동 반복 모드 (무한 반복)</span>
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

        {/* Developer Speed Test Mode */}
        <div className="speed-toggle-card mt-3">
          <div className="speed-toggle-label">
            <div>
              <span className="title">개발자 테스트 모드 (1초 = 1분)</span>
              <span className="desc">빠른 타이머 완료 테스트를 원할 때 켜세요.</span>
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={speedMode}
              onChange={(e) => setSpeedMode(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>

        {/* Timer Control Buttons */}
        <div className="timer-controls mt-4">
          {timerStatusText !== '집중 완료!' && timerStatusText !== '집중 실패' && (
            <>
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
            <>
              {(timerStatusText === '집중 완료!' || timerStatusText === '집중 실패') && (
                <button
                  className="btn btn-primary btn-lg flex-1"
                  onClick={handleTimerRestart}
                >
                  <RotateCw size={16} />
                  <span>다시 시작</span>
                </button>
              )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
