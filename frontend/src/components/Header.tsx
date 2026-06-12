import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  email: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ email, onLogout }) => {
  return (
    <header className="main-header glass-header">
      <div className="logo">
        <span className="logo-emoji">🍅</span>
        <span className="logo-text">FocusHabit</span>
      </div>
      <div className="header-right">
        <div className="user-profile">
          <UserIcon size={16} />
          <span id="current-user-email">{email}</span>
        </div>
        <button className="btn btn-secondary btn-icon" onClick={onLogout} title="로그아웃">
          <LogOut size={16} />
          <span>로그아웃</span>
        </button>
      </div>
    </header>
  );
};
