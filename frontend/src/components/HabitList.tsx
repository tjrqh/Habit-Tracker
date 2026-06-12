import React from 'react';
import { Hourglass, PlusCircle, Timer, Pause, Play, Trash2 } from 'lucide-react';
import type { Habit } from '../types';

interface HabitListProps {
  habits: Habit[];
  habitTomatoesMap: Record<string, number>;
  onStartTimer: (habitId: string) => void;
  onToggleStatus: (habitId: string, currentStatus: boolean) => void;
  onDelete: (habitId: string) => void;
  onShowCreateForm: () => void;
}

export const HabitList: React.FC<HabitListProps> = ({
  habits,
  habitTomatoesMap,
  onStartTimer,
  onToggleStatus,
  onDelete,
  onShowCreateForm,
}) => {
  return (
    <div style={{ padding: '10px' }}>
      <div className="main-header" style={{ padding: 0, height: 'auto', marginBottom: '16px' }}>
        <div className="header-brand">
          <Hourglass size={24} color="var(--primary)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800 }}>나의 습관</h2>
        </div>
        <button className="glass-btn primary" onClick={onShowCreateForm}>
          <PlusCircle size={18} />
          <span>새 습관 추가</span>
        </button>
      </div>

      <div className="habits-section">
        {habits.length === 0 ? (
          <div className="empty-state py-4">
            <p>등록된 습관이 없습니다. 새 습관을 추가하여 집중을 시작해보세요!</p>
          </div>
        ) : (
          habits.map((habit) => {
            const completed = habitTomatoesMap[habit.id] || 0;
            const target = habit.targetTomato;
            const isFinished = completed >= target;
            const progressPercent = Math.min((completed / target) * 100, 100);

            return (
              <div key={habit.id} className={`habit-item glass-card ${habit.isActive ? '' : 'inactive'}`}>
                <div className="habit-info">
                  <div className="habit-title-row">
                    <h4 className="habit-title">{habit.title}</h4>
                    {!habit.isActive && <span className="log-badge status-failed">일시 정지</span>}
                  </div>
                  {habit.description && <p className="habit-desc">{habit.description}</p>}
                  
                  <div className="habit-progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  
                  <div className="habit-meta">
                    <span>오늘 달성도</span>
                    <span>{completed} / {target} 🍅 {isFinished && '✨'}</span>
                  </div>
                </div>

                <div className="habit-actions">
                  {habit.isActive ? (
                    <button
                      className="glass-btn secondary"
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}
                      onClick={() => onStartTimer(habit.id)}
                    >
                      <Timer size={16} /> 타이머 시작
                    </button>
                  ) : (
                    <button className="glass-btn secondary" disabled>
                      일시정지됨
                    </button>
                  )}

                  <button
                    className="glass-btn secondary"
                    style={{ flex: '0 0 auto', padding: '14px' }}
                    onClick={() => onToggleStatus(habit.id, habit.isActive)}
                    title={habit.isActive ? '일시정지' : '활성화'}
                  >
                    {habit.isActive ? <Pause size={16} /> : <Play size={16} />}
                  </button>

                  <button
                    className="glass-btn danger"
                    style={{ flex: '0 0 auto', padding: '14px' }}
                    onClick={() => onDelete(habit.id)}
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
