// src/components/CompletedQuizzes.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/CompletedQuizzes.css';

interface QuizProgress {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

const CompletedQuizzes: React.FC = () => {
  const [quizProgress, setQuizProgress] = useState<QuizProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, userId } = useAuth();

  useEffect(() => {
    const fetchQuizProgress = async () => {
      if (!isAuthenticated || !userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get<QuizProgress[]>(`http://localhost:5001/api/user/${userId}/quiz/progress`);
        // Фильтруем только завершённые викторины
        const completedQuizzes = (response.data || []).filter(progress => progress.completed);
        setQuizProgress(completedQuizzes);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка загрузки прогресса викторин:', error);
        setQuizProgress([]);
        setLoading(false);
      }
    };

    fetchQuizProgress();
  }, [isAuthenticated, userId]);

  const calculatePercentage = (score: number, totalQuestions: number = 10) => {
    return ((score / totalQuestions) * 100).toFixed(2);
  };

  const getCourseTitle = (quizId: number): string => {
    // Маппинг quiz_id к курсам (по 14 вопросов на курс)
    if (quizId >= 1 && quizId <= 14) return 'Дискретная математика';
    if (quizId >= 15 && quizId <= 28) return 'Теория алгоритмов';
    if (quizId >= 29 && quizId <= 41) return 'Теория графов';
    if (quizId >= 42 && quizId <= 54) return 'Представление данных';
    return 'Неизвестный курс';
  };

  if (loading) {
    return (
      <div className="completed-quizzes">
        <h2>Пройденные викторины</h2>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="completed-quizzes">
      <h2>Пройденные викторины</h2>
      {quizProgress.length > 0 ? (
        quizProgress.map((progress) => (
          <div key={progress.id} className="completed-quiz">
            <h3>{getCourseTitle(progress.quiz_id)}</h3>
            <p>ID викторины: {progress.quiz_id}</p>
            <p>Результат: {progress.score}/10</p>
            <p>Процент: {calculatePercentage(progress.score)}%</p>
            <p>Статус: <span className="completed">Пройдено</span></p>
            <p>Дата: {new Date(progress.updatedAt).toLocaleDateString('ru-RU')}</p>
          </div>
        ))
      ) : (
        <p>Пройденных викторин не найдено.</p>
      )}
    </div>
  );
};

export default CompletedQuizzes;