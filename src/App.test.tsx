import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Мокаем useAuth, так как App использует AuthContext
jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    userId: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Мокаем ThemeContext
jest.mock('./context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

test('renders login page by default when not authenticated', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  
  // Проверяем, что отображается страница входа
  const loginHeading = screen.getByText(/вход в систему/i);
  expect(loginHeading).toBeInTheDocument();
});

test('renders home page when authenticated', () => {
  // Переопределяем мок для этого теста
  jest.mock('./context/AuthContext', () => ({
    useAuth: () => ({
      isAuthenticated: true,
      userId: 1,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }));

  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  
  // Проверяем, что отображается главная страница
  const welcomeHeading = screen.getByText(/добро пожаловать на нашу образовательную онлайн-платформу/i);
  expect(welcomeHeading).toBeInTheDocument();
});