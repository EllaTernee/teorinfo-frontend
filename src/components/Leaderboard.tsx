// src/components/Leaderboard.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Leaderboard.css';

interface LeaderboardProps {
  courseId: string;
}

interface LeaderboardEntry {
  id: number;
  userId: number;
  username: string;
  score: number;
  rank: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ courseId }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Пробуем получить данные с бэкенда
        const response = await axios.get<LeaderboardEntry[]>(`http://localhost:5001/api/leaderboard/${courseId}`);
        console.log('Leaderboard data:', response.data);
        setLeaderboard(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки таблицы лидеров:', err);
        setError('Ошибка загрузки таблицы лидеров');
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [courseId]);

  if (loading) {
    return <div className="leaderboard-loading">Загрузка таблицы лидеров...</div>;
  }

  if (error) {
    return <div className="leaderboard-error">{error}</div>;
  }

  if (leaderboard.length === 0) {
    return (
      <div className="leaderboard-empty">
        <h3>Таблица лидеров</h3>
        <p>Нет данных для отображения. Пройдите викторины, чтобы попасть в таблицу лидеров!</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h3>Таблица лидеров</h3>
      <div className="leaderboard-table">
        <div className="leaderboard-header">
          <div className="rank-col">Место</div>
          <div className="user-col">Пользователь</div>
          <div className="score-col">Очки</div>
        </div>
        {leaderboard.map((entry) => (
          <div key={entry.id} className="leaderboard-row">
            <div className="rank-col">{entry.rank}</div>
            <div className="user-col">{entry.username}</div>
            <div className="score-col">{entry.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;