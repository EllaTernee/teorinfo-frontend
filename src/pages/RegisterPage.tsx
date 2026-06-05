// src/components/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await register(username, email, password);
      navigate('/');
    } catch (error: any) {
      if (error.response && error.response.data) {
        setError(error.response.data.message as string);
      } else {
        setError('Произошла непредвиденная ошибка');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📘</div>
          <h2>ТеорИнфо</h2>
          <p>создайте аккаунт за минуту</p>
        </div>
        
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.ru"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль (от 6 символов)</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              minLength={6}
              required
            />
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;