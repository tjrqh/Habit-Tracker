import React from 'react';
import { Clock } from 'lucide-react';
import type { Session, Habit } from '../types';

interface TimelineLogsProps {
  sessions: Session[];
  habits: Habit[];
}

export const TimelineLogs: React.FC<TimelineLogsProps> = ({ sessions, habits }) => {
  return (
    <div className="glass-card logs-card mt-6">
      <div className="card-header border-none">
        <Clock size={16} />
        <h3>최근 집중 타임라인</h3>
      </div>
      <div className="card-body">
        <div className="logs-list timeline-logs-container">
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

            const statusClass = session.status.toLowerCase();
            return (
              <div key={session.id} className={`log-item ${statusClass}`}>
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
  );
};
