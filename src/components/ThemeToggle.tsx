// src/components/ThemeToggle.tsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className={`theme-toggle ${theme}`} 
      onClick={toggleTheme}
      aria-label="Переключить тему"
    >
      <div className="toggle-track">
        <div className="toggle-thumb">
          {theme === 'light' ? (
            <span className="icon">☀️</span>
          ) : (
            <span className="icon">🌙</span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;