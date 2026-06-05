// src/components/Notification.tsx
import React, { useEffect, useState } from 'react';
import '../styles/Notification.css';

interface NotificationProps {
  message: string;
  title?: string;
  icon?: string;
  duration?: number;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ 
  message, 
  title = '🏆 Достижение!', 
  icon = '🏆',
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="notification">
      <div className="notification-icon">{icon}</div>
      <div className="notification-content">
        <div className="notification-title">{title}</div>
        <div className="notification-message">{message}</div>
      </div>
      <button className="notification-close" onClick={() => setIsVisible(false)}>×</button>
    </div>
  );
};

export default Notification;