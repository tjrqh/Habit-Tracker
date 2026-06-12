import React from 'react';

interface AuthCardProps {
  authTab: 'login' | 'register';
  setAuthTab: (tab: 'login' | 'register') => void;
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  loginPassword: string;
  setLoginPassword: (pwd: string) => void;
  regEmail: string;
  setRegEmail: (email: string) => void;
  regPassword: string;
  setRegPassword: (pwd: string) => void;
  authError: string | null;
  handleLoginUser: () => void;
  handleRegisterUser: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  authTab,
  setAuthTab,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  regEmail,
  setRegEmail,
  regPassword,
  setRegPassword,
  authError,
  handleLoginUser,
  handleRegisterUser,
}) => {
  return (
    <div className="auth-container">
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="logo-emoji" style={{ fontSize: '48px', marginBottom: '16px' }}>🍅</div>
          <h2 className="logo-text">FocusHabit</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>포모도로 기법과 습관 관리를 하나로</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${authTab === 'login' ? 'active' : ''}`}
            onClick={() => setAuthTab('login')}
          >
            로그인
          </button>
          <button
            className={`auth-tab ${authTab === 'register' ? 'active' : ''}`}
            onClick={() => setAuthTab('register')}
          >
            신규 등록
          </button>
        </div>

        <div className="auth-form">
          {authTab === 'login' ? (
            <>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>이메일 주소</label>
                <input
                  type="email"
                  className="glass-input"
                  placeholder="example@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>비밀번호</label>
                <input
                  type="password"
                  className="glass-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <button className="glass-btn primary" style={{ width: '100%', marginTop: '8px' }} onClick={handleLoginUser}>
                <span>로그인 및 시작</span>
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>이메일 주소</label>
                <input
                  type="email"
                  className="glass-input"
                  placeholder="example@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>비밀번호</label>
                <input
                  type="password"
                  className="glass-input"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
              <button className="glass-btn primary" style={{ width: '100%', marginTop: '8px' }} onClick={handleRegisterUser}>
                <span>회원가입 및 시작</span>
              </button>
            </>
          )}

          {authError && <div style={{ color: 'var(--rose)', textAlign: 'center', marginTop: '16px', fontSize: '14px', fontWeight: 600 }}>{authError}</div>}
        </div>
      </div>
    </div>
  );
};
