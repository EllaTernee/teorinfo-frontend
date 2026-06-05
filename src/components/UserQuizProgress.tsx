// src/components/UserQuizProgress.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/UserQuizProgress.css'; 

interface QuizProgress {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserQuizProgressProps {
  userId: number;
  courseId?: string; // добавим опционально
}

const UserQuizProgress: React.FC<UserQuizProgressProps> = ({ userId, courseId }) => {
  const [quizProgress, setQuizProgress] = useState<QuizProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizProgress = async () => {
      try {
        const response = await axios.get<QuizProgress[]>(`https://teorinfo-backend.onrender.com/api/user/${userId}/quiz/progress`);
        console.log('Прогресс викторин:', response.data);
        setQuizProgress(response.data || []);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setQuizProgress([]);
        } else {
          console.error('Ошибка загрузки прогресса:', err);
          setError('Ошибка загрузки прогресса викторин');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizProgress();
  }, [userId]);

  const calculatePercentage = (score: number, totalQuestions: number = 10) => {
    return ((score / totalQuestions) * 100).toFixed(2);
  };

  const isPassed = (score: number, totalQuestions: number = 10): boolean => {
    return (score / totalQuestions) >= 0.7;
  };

  const handleRetakeQuiz = (quizId: number) => {
    // Перенаправляем на страницу викторины с этим курсом
    navigate(`/quiz/${courseId}`);
  };

  if (loading) {
    return <div className="user-quiz-progress">Загрузка прогресса викторин...</div>;
  }

  if (error) {
    return <div className="user-quiz-progress">{error}</div>;
  }

  if (quizProgress.length === 0) {
    return (
      <div className="user-quiz-progress">
        <h3>Ваш прогресс по викторинам</h3>
        <div className="no-progress">Вы ещё не проходили викторины</div>
      </div>
    );
  }

  return (
    <div className="user-quiz-progress">
      <h3>Ваш прогресс по викторинам</h3>
      <div className="progress-list">
        {quizProgress.map((progress) => {
          const percentage = calculatePercentage(progress.score);
          const passed = isPassed(progress.score);
          
          return (
            <div key={progress.id} className="progress-item">
              <div className="progress-header">
                <span className="quiz-name">📝 Итоговый тест</span>
                <span className={`quiz-status ${passed ? 'passed' : 'failed'}`}>
                  {passed ? '✅ Пройден' : '❌ Не пройден'}
                </span>
              </div>
              <div className="progress-stats">
                <div className="stat">
                  <span className="stat-label">Результат:</span>
                  <span className="stat-value">{progress.score}/10</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Процент:</span>
                  <span className="stat-value">{percentage}%</span>
                </div>
              </div>
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar-fill ${passed ? 'passed' : 'failed'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {!passed && (
                <button 
                  className="retake-test-btn"
                  onClick={() => handleRetakeQuiz(progress.quiz_id)}
                >
                  🔄 Пройти тест заново
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserQuizProgress;