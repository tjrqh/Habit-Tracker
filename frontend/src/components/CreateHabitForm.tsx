import React from 'react';

interface CreateHabitFormProps {
  newHabitTitle: string;
  setNewHabitTitle: (val: string) => void;
  newHabitDesc: string;
  setNewHabitDesc: (val: string) => void;
  newHabitTarget: number;
  setNewHabitTarget: (val: number) => void;
  newHabitDuration: number;
  setNewHabitDuration: (val: number) => void;
  newHabitRepeat: boolean;
  setNewHabitRepeat: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const CreateHabitForm: React.FC<CreateHabitFormProps> = ({
  newHabitTitle,
  setNewHabitTitle,
  newHabitDesc,
  setNewHabitDesc,
  newHabitTarget,
  setNewHabitTarget,
  newHabitDuration,
  setNewHabitDuration,
  newHabitRepeat,
  setNewHabitRepeat,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className="glass-card habit-form-card mb-4 animate-fade-in" id="new-habit-form-container">
      <div className="card-header">
        <h3>새로운 습관 생성</h3>
      </div>
      <div className="card-body">
        <form id="new-habit-form" onSubmit={onSubmit} className="form-grid">
          <div className="form-group full">
            <label className="form-label">습관 명칭</label>
            <input
              type="text"
              className="glass-input"
              placeholder="예: 아침 독서하기, 알고리즘 풀이"
              required
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
            />
          </div>

          <div className="form-group full">
            <label className="form-label">습관 상세 정보 (설명)</label>
            <input
              type="text"
              className="glass-input"
              placeholder="습관에 대한 간략한 정보를 기록해보세요"
              value={newHabitDesc}
              onChange={(e) => setNewHabitDesc(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">하루 목표 달성 횟수</label>
            <select
              className="glass-input"
              value={newHabitTarget}
              onChange={(e) => setNewHabitTarget(parseInt(e.target.value))}
            >
              <option value="1">1번</option>
              <option value="2">2번</option>
              <option value="3">3번</option>
              <option value="4">4번</option>
              <option value="6">6번</option>
              <option value="8">8번</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">기본 집중 시간 설정</label>
            <select
              className="glass-input"
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

          <div className="form-group full">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newHabitRepeat}
                onChange={(e) => setNewHabitRepeat(e.target.checked)}
              />
              완료 시 자동 반복 (무한 루프)
            </label>
          </div>

          <div className="form-group full mt-3" style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="glass-btn primary" style={{ flex: 1 }}>
              <span>생성하기</span>
            </button>
            <button
              type="button"
              className="glass-btn secondary"
              onClick={onCancel}
            >
              <span>취소</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
