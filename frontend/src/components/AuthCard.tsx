import React from 'react';
import type { User } from '../types';

interface AuthCardProps {
  authTab: 'login' | 'register';
  setAuthTab: (tab: 'login' | 'register') => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  existingUsers: User[];
  regEmail: string;
  setRegEmail: (email: string) => void;
  regPassword: string;
  setRegPassword: (pwd: string) => void;
  authError: string | null;
  handleSelectUser: () => void;
  handleRegisterUser: () => void;
  fetchExistingUsers: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  authTab,
  setAuthTab,
  selectedUserId,
  setSelectedUserId,
  existingUsers,
  regEmail,
  setRegEmail,
  regPassword,
  setRegPassword,
  authError,
  handleSelectUser,
  handleRegisterUser,
  fetchExistingUsers,
}) => {
  return (
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
  );
};
