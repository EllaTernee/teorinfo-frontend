// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../styles/SettingsPage.css';

const SettingsPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { userId, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/users/${userId}`);
        setUsername(response.data.username);
        setEmail(response.data.email);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    fetchUserData();
  }, [userId, isAuthenticated, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage(null);

    try {
      await axios.put(`http://localhost:5001/api/users/${userId}`, {
        username,
        email
      });
      setProfileMessage({ type: 'success', text: '✅ Профиль успешно обновлён!' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.response?.data?.error || 'Ошибка обновления профиля' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '❌ Новые пароли не совпадают' });
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: '❌ Пароль должен быть не менее 6 символов' });
      return;
    }

    setLoading(true);
    setPasswordMessage(null);

    try {
      await axios.post(`http://localhost:5001/api/users/${userId}/change-password`, {
        currentPassword,
        newPassword
      });
      setPasswordMessage({ type: 'success', text: '✅ Пароль успешно изменён!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.response?.data?.error || '❌ Ошибка смены пароля' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.');
    if (!confirm) return;

    setLoading(true);
    try {
      await axios.delete(`http://localhost:5001/api/users/${userId}`);
      logout();
      navigate('/register');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка удаления аккаунта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>⚙️ Настройки</h1>

        {/* Личная информация */}
        <div className="settings-section">
          <h2>Личная информация</h2>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Имя пользователя</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {profileMessage && (
              <div className={`form-message ${profileMessage.type}`}>
                {profileMessage.text}
              </div>
            )}
            <button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
        </div>

        {/* Внешний вид */}
        <div className="settings-section">
          <h2>🎨 Внешний вид</h2>
          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Тёмная тема</span>
              <span className="settings-desc">Использовать тёмную тему оформления</span>
            </div>
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'light' ? '🌙 Включить тёмную' : '☀️ Включить светлую'}
            </button>
          </div>
        </div>

        {/* Смена пароля */}
        <div className="settings-section">
          <h2>🔐 Смена пароля</h2>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Текущий пароль</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Подтверждение нового пароля</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {passwordMessage && (
              <div className={`form-message ${passwordMessage.type}`}>
                {passwordMessage.text}
              </div>
            )}
            <button type="submit" disabled={loading}>
              {loading ? 'Смена...' : 'Сменить пароль'}
            </button>
          </form>
        </div>

        {/* Опасная зона */}
        <div className="settings-section danger">
          <h2>⚠️ Опасная зона</h2>
          <p>Удаление аккаунта приведёт к безвозвратной потере всех данных.</p>
          <button className="danger-button" onClick={handleDeleteAccount} disabled={loading}>
            🗑️ Удалить аккаунт
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;