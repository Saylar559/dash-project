import React, { useState } from 'react';
import { LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import '../styles/Header.css';

interface Props {
  username?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  onNavigateDashboards: () => void;
  onLogout: () => void;
}

export const Header: React.FC<Props> = ({
  username,
  email,
  role,
  avatarUrl,
  onNavigateDashboards,
  onLogout
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getInitials = () => {
    if (!username) return '?';
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="header">
      <div className="header__container">
        {/* Left: Title */}
        <div className="header__left">
          <h1 className="header__title">
            <span className="header__icon">⚙️</span>
            Developer Studio
          </h1>
        </div>

        {/* Center: Breadcrumb / Info */}
        <div className="header__center">
          {role && (
            <span className="header__role-badge">{role.toUpperCase()}</span>
          )}
        </div>

        {/* Right: User Menu */}
        <div className="header__right">
          <button
            className="header__nav-btn"
            onClick={onNavigateDashboards}
            title="Мои отчёты"
          >
            <LayoutDashboard size={18} />
            <span>Отчёты</span>
          </button>

          <div className="header__divider"></div>

          {/* User Dropdown */}
          <div className="header__user-menu">
            <button
              className="header__user-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="header__avatar" />
              ) : (
                <div className="header__avatar header__avatar--placeholder">
                  {getInitials()}
                </div>
              )}
              <div className="header__user-info">
                <span className="header__user-name">{username}</span>
                <span className="header__user-email">{email}</span>
              </div>
              <ChevronDown size={16} className={`header__chevron ${dropdownOpen ? 'header__chevron--open' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="header__dropdown">
                <button
                  className="header__dropdown-item header__dropdown-item--logout"
                  onClick={() => {
                    onLogout();
                    setDropdownOpen(false);
                  }}
                >
                  <LogOut size={16} />
                  <span>Выйти из аккаунта</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
