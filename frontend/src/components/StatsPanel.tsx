import React from 'react';
import { CheckSquare, Sparkles, Timer, Target } from 'lucide-react';

interface StatsPanelProps {
  activeHabitsCount: number;
  todayCompletedCount: number;
  totalCompletedCount: number;
  successRate: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  activeHabitsCount,
  todayCompletedCount,
  totalCompletedCount,
  successRate,
}) => {
  return (
    <section className="stats-section grid grid-cols-2 gap-4">
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
  );
};
