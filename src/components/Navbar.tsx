// src/components/Navbar.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import '../styles/Navbar.css';

interface NavbarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { role } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Обработка клика по защищённым ссылкам
  const handleProtectedClick = (e: React.MouseEvent, path: string) => {
    if (!isLoggedIn) {
      e.preventDefault();
      navigate('/login');
    }
  };

  return (
    <>
      <nav className={`navbar ${theme}`}>
        <div className="nav-container">
          {/* Логотип - слева */}
          <div className="nav-logo">
            <Link to="/">📘 ТеорИнфо</Link>
          </div>

          {/* Меню - по центру */}
          <ul className="nav-menu">
            <li><Link to="/">Главная</Link></li>
            <li><Link to="/courses">Курсы</Link></li>
            <li>
              <Link 
                to="/trainer" 
                onClick={(e) => handleProtectedClick(e, '/trainer')}
                className={!isLoggedIn ? 'disabled-link' : ''}
              >
                Тренажёр
              </Link>
            </li>
            <li><Link to="/glossary">Словарь</Link></li>
            <li>
              <Link 
                to="/achievements" 
                onClick={(e) => handleProtectedClick(e, '/achievements')}
                className={!isLoggedIn ? 'disabled-link' : ''}
              >
                Достижения
              </Link>
            </li>
            
            {/* Выпадающее меню профиля/входа */}
            <li className="dropdown">
              <button className="dropdown-trigger">
                {isLoggedIn ? '👤 Профиль' : '🔐 Вход'}
              </button>
              <div className="dropdown-menu">
                {isLoggedIn ? (
                  <>
                    <Link to="/profile">📋 Мой профиль</Link>
                    <Link to="/settings">⚙️ Настройки</Link>
                    {role === 'admin' && (
                      <Link to="/admin/courses">🛠️ Конструктор</Link>
                    )}
                    <button onClick={handleLogoutClick} className="dropdown-logout">
                      🚪 Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login">🔐 Вход</Link>
                    <Link to="/register">📝 Регистрация</Link>
                  </>
                )}
              </div>
            </li>
          </ul>

          {/* Правая группа - кнопка темы */}
          <div className="nav-right">
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </nav>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Подтверждение выхода"
        message="Вы уверены, что хотите выйти из аккаунта?"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
};

export default Navbar;