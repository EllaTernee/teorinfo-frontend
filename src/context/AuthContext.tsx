// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
  role: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Настройка axios для автоматической подстановки токена
const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Базовый URL бэкенда
const API_BASE_URL = 'https://teorinfo-backend.onrender.com';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Проверяем сохранённый токен при загрузке приложения
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('username');
    const savedRole = localStorage.getItem('role');

    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(parseInt(savedUserId));
      setUsername(savedUsername);
      setRole(savedRole || 'user');
      setIsAuthenticated(true);
      setAuthToken(savedToken);
      console.log('Токен восстановлен, пользователь авторизован');
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<{ 
        message: string; 
        userId: number; 
        token: string; 
        role: string; 
        user: { id: number; username: string; email: string; role: string } 
      }>(
        `${API_BASE_URL}/api/login`,
        { email, password }
      );
      
      console.log('Ответ на вход:', response.data);
      
      if (response.data && response.data.token) {
        const { token, userId, role, user } = response.data;
        
        setToken(token);
        setUserId(userId);
        setUsername(user.username);
        setRole(role || 'user');
        setIsAuthenticated(true);
        setAuthToken(token);
        
        // Сохраняем в localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userId', String(userId));
        localStorage.setItem('username', user.username);
        localStorage.setItem('role', role || 'user');
        
        console.log('Пользователь аутентифицирован, роль:', role);
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      setIsAuthenticated(false);
      setUserId(null);
      setUsername(null);
      setRole(null);
      setToken(null);
      setAuthToken(null);
      throw new Error('Ошибка входа');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post<{ 
        message: string; 
        userId: number; 
        token: string; 
        role: string; 
        user: { id: number; username: string; email: string; role: string } 
      }>(
        `${API_BASE_URL}/auth/register`,
        { username, email, password }
      );
      
      if (response.data && response.data.token) {
        const { token, userId, role, user } = response.data;
        
        setToken(token);
        setUserId(userId);
        setUsername(user.username);
        setRole(role || 'user');
        setIsAuthenticated(true);
        setAuthToken(token);
        
        // Сохраняем в localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userId', String(userId));
        localStorage.setItem('username', user.username);
        localStorage.setItem('role', role || 'user');
        
        console.log('Регистрация успешна, пользователь авторизован');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      setIsAuthenticated(false);
      setUserId(null);
      setUsername(null);
      setRole(null);
      setToken(null);
      setAuthToken(null);
      throw new Error('Ошибка регистрации');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    setUsername(null);
    setRole(null);
    setToken(null);
    setAuthToken(null);
    
    // Очищаем localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    
    console.log('Пользователь вышел из системы');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, username, role, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};