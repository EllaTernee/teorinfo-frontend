// src/pages/LeaderboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Leaderboard.css';

interface LeaderboardEntry {
  id: number;
  userId: number;
  username: string;
  score: number;
  rank: number;
}

interface Course {
  id: string;
  title: string;
}

const LeaderboardPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const [leaderboardResponse, courseResponse] = await Promise.all([
          axios.get<LeaderboardEntry[]>(`https://teorinfo-backend.onrender.com/api/leaderboard/${courseId}`),
          axios.get<Course>(`https://teorinfo-backend.onrender.com/api/courses/${courseId}`)
        ]);
        setLeaderboard(leaderboardResponse.data);
        setCourse(courseResponse.data);
      } catch (err) {
        console.error('Ошибка:', err);
        setError('Не удалось загрузить таблицу лидеров');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [courseId]);

  if (loading) {
    return <div className="leaderboard-page">Загрузка...</div>;
  }

  if (error) {
    return <div className="leaderboard-page error">{error}</div>;
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <Link to="/courses" className="back-button">
          ← Назад к курсам
        </Link>
        <h1>Таблица лидеров</h1>
        <h2>{course?.title}</h2>
      </div>

      {/* Подиум для топ-3 */}
      <div className="podium">
        {/* 2 место */}
        {top3[1] && (
          <div className="podium-item second">
            <div className="podium-medal">🥈</div>
            <div className="podium-score">{top3[1].score} очков</div>
            <div className="podium-name">{top3[1].username}</div>
            <div className="podium-place">2 место</div>
            <div className="podium-height" style={{ height: '120px' }}></div>
          </div>
        )}

        {/* 1 место */}
        {top3[0] && (
          <div className="podium-item first">
            <div className="podium-crown">👑</div>
            <div className="podium-medal">🥇</div>
            <div className="podium-score">{top3[0].score} очков</div>
            <div className="podium-name">{top3[0].username}</div>
            <div className="podium-place">1 место</div>
            <div className="podium-height" style={{ height: '160px' }}></div>
          </div>
        )}

        {/* 3 место */}
        {top3[2] && (
          <div className="podium-item third">
            <div className="podium-medal">🥉</div>
            <div className="podium-score">{top3[2].score} очков</div>
            <div className="podium-name">{top3[2].username}</div>
            <div className="podium-place">3 место</div>
            <div className="podium-height" style={{ height: '80px' }}></div>
          </div>
        )}
      </div>

      {/* Таблица для остальных участников */}
      {rest.length > 0 && (
        <div className="leaderboard-table">
          <div className="table-header">
            <div className="col-rank">Место</div>
            <div className="col-user">Пользователь</div>
            <div className="col-score">Очки</div>
          </div>
          {rest.map((entry) => (
            <div key={entry.id} className="table-row">
              <div className="col-rank">{entry.rank}</div>
              <div className="col-user">{entry.username}</div>
              <div className="col-score">{entry.score}</div>
            </div>
          ))}
        </div>
      )}

      {leaderboard.length === 0 && (
        <div className="empty-leaderboard">
          <p>Пока нет результатов</p>
          <p>Пройдите викторины, чтобы попасть в таблицу лидеров!</p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;