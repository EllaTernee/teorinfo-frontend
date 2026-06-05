// src/pages/CourseDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/CourseDetailPage.css';

interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  order: number;
}

// ИСПРАВЛЕНО: API возвращает lessonId (с большой I)
interface LessonProgress {
  lessonId: string;
  completed: boolean;
  courseId: string;
}

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId, isAuthenticated } = useAuth();

  // Вынесли fetchData в отдельную функцию для возможности перезагрузки
  const fetchData = async () => {
    if (!courseId) return;
    
    try {
      // Получаем информацию о курсе
      const courseRes = await axios.get(`http://localhost:5001/api/courses/${courseId}`);
      setCourse(courseRes.data);

      // Получаем уроки курса
      const lessonsRes = await axios.get(`http://localhost:5001/api/courses/${courseId}/lessons`);
      setLessons(lessonsRes.data);

      // Получаем прогресс пользователя (если авторизован)
      if (isAuthenticated && userId) {
        try {
          const progressRes = await axios.get(`http://localhost:5001/api/user/${userId}/lessons/progress`);
          setProgress(progressRes.data || []);
        } catch (error) {
          console.log('Нет данных о прогрессе');
          setProgress([]);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId, userId, isAuthenticated, location.key]); // location.key обновляет при возврате

  // ИСПРАВЛЕНО: сравниваем lessonId (не lesson_id)
  const isLessonCompleted = (lessonId: string): boolean => {
    return progress.some(p => p.lessonId === lessonId && p.completed);
  };

  const getLessonDuration = (order: number): string => {
    const durations = ['8 мин', '10 мин', '12 мин', '15 мин'];
    return durations[(order - 1) % durations.length];
  };

  if (loading) {
    return (
      <div className="course-detail">
        <div className="loading">Загрузка курса...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail">
        <div className="error">Курс не найден</div>
        <Link to="/courses" className="back-link">← Вернуться к курсам</Link>
      </div>
    );
  }

  // Подсчитываем прогресс
  const completedCount = lessons.filter(l => isLessonCompleted(l.id)).length;
  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="course-detail">
      {/* Шапка курса */}
      <div className="course-header">
        <div className="course-icon-large">{course.icon}</div>
        <h1>{course.title}</h1>
        <p className="course-description">{course.description}</p>
        
        {/* Прогресс-бар курса (только для авторизованных) */}
        {isAuthenticated && totalCount > 0 && (
          <div className="course-progress-section">
            <div className="progress-label">
              <span>Прогресс курса</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="completed-count">Пройдено {completedCount} из {totalCount} модулей</div>
          </div>
        )}
      </div>

      {/* Список модулей */}
      <div className="lessons-list">
        <h2>Программа курса</h2>
        {lessons.length === 0 ? (
          <p className="no-lessons">Модули не найдены</p>
        ) : (
          lessons.map((lesson, index) => {
            const completed = isLessonCompleted(lesson.id);
            return (
              <Link 
                to={`/lesson/${courseId}/${lesson.id}`} 
                key={lesson.id} 
                className={`lesson-item ${completed ? 'completed' : ''}`}
              >
                <div className="lesson-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="lesson-info">
                  <div className="lesson-title">{lesson.title}</div>
                  <div className="lesson-duration">⏱ {getLessonDuration(lesson.order)}</div>
                </div>
                <div className="lesson-status">
                  {completed ? '✅' : '📖'}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Кнопка перехода к тесту (показывается только когда все модули пройдены) */}
      {isAuthenticated && completedCount === totalCount && totalCount > 0 && (
        <div className="quiz-button-container">
          <Link to={`/quiz/${courseId}`} className="take-quiz-button">
            🎯 Пройти итоговый тест
          </Link>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;