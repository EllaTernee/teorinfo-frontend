// src/pages/LessonPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/LessonPage.css';

interface Lesson {
  id: string;
  title: string;
  content: string;
  order: number;
  courseId: string;
}

interface LessonProgress {
  id: number;
  userId: number;
  lessonId: string;
  completed: boolean;
  courseId: string;
}

const LessonPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [xpEarned, setXpEarned] = useState(0); // ✅ состояние для XP
  const { userId, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  console.log('LessonPage params:', { courseId, lessonId });

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !lessonId) {
        console.error('courseId или lessonId отсутствуют');
        setLoading(false);
        return;
      }

      try {
        // Получаем текущий урок
        const lessonRes = await axios.get(`http://localhost:5001/api/lessons/${lessonId}`);
        setLesson(lessonRes.data);

        // Получаем все уроки курса для навигации
        const lessonsRes = await axios.get(`http://localhost:5001/api/courses/${courseId}/lessons`);
        const lessons = lessonsRes.data;
        setAllLessons(lessons);

        // Находим следующий урок
        const currentIndex = lessons.findIndex((l: Lesson) => l.id === lessonId);
        if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
          setNextLesson(lessons[currentIndex + 1]);
        }

        // Получаем прогресс пользователя (если авторизован)
        if (isAuthenticated && userId) {
          try {
            const progressRes = await axios.get(`http://localhost:5001/api/user/${userId}/lessons/progress`);
            console.log('Прогресс пользователя:', progressRes.data);
            const lessonProgress = progressRes.data.find((p: LessonProgress) => p.lessonId === lessonId);
            setCompleted(lessonProgress?.completed || false);
          } catch (error) {
            console.log('Нет данных о прогрессе');
            setCompleted(false);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки урока:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, lessonId, userId, isAuthenticated]);

  const handleMarkCompleted = async () => {
    if (!isAuthenticated || !userId) {
      navigate('/login');
      return;
    }

    if (!courseId || !lessonId) {
      console.error('courseId или lessonId отсутствуют');
      return;
    }

    try {
      console.log('Отправка прогресса:', { 
        userId, 
        courseId, 
        lessonId, 
        completed: true 
      });
      
      const response = await axios.post('http://localhost:5001/api/user/lessons/progress', {
        userId: userId,
        courseId: courseId,
        lessonId: lessonId,
        completed: true
      });
      
      console.log('Ответ сервера:', response.data);
      
      // ✅ Получаем количество начисленных XP из ответа
      const earnedXp = response.data.xpEarned || 20;
      setXpEarned(earnedXp);
      setCompleted(true);

      // ❌ УДАЛЯЕМ showXpMessage и таймер - сообщение будет всегда
      // setShowXpMessage(true);
      // setTimeout(() => setShowXpMessage(false), 3000);

      // Обновляем прогресс для синхронизации с CourseDetailPage
      if (nextLesson) {
        setTimeout(() => {
          const goToNext = window.confirm('✅ Урок пройден! Перейти к следующему уроку?');
          if (goToNext) {
            navigate(`/lesson/${courseId}/${nextLesson.id}`);
          } else {
            navigate(`/courses/${courseId}`, { replace: true });
          }
        }, 100);
      } else {
        // Если это последний урок, возвращаемся на страницу курса
        setTimeout(() => {
          navigate(`/courses/${courseId}`, { replace: true });
        }, 500);
      }
    } catch (error) {
      console.error('Ошибка сохранения прогресса:', error);
      alert('Не удалось сохранить прогресс. Попробуйте ещё раз.');
    }
  };

  const handlePreviousLesson = () => {
    const currentIndex = allLessons.findIndex((l: Lesson) => l.id === lessonId);
    if (currentIndex > 0) {
      navigate(`/lesson/${courseId}/${allLessons[currentIndex - 1].id}`);
    }
  };

  if (loading) {
    return (
      <div className="lesson-page">
        <div className="lesson-container">
          <div className="loading-spinner">Загрузка урока...</div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="lesson-page">
        <div className="lesson-container">
          <div className="error-message">Урок не найден</div>
          <button className="back-button" onClick={() => navigate(`/courses/${courseId}`)}>
            ← Вернуться к курсу
          </button>
        </div>
      </div>
    );
  }

  // Разбиваем контент на параграфы для лучшего отображения
  const formattedContent = lesson.content.split('\n\n').map((paragraph, index) => {
    if (paragraph.startsWith('##')) {
      return <h2 key={index}>{paragraph.replace('##', '').trim()}</h2>;
    }
    if (paragraph.startsWith('###')) {
      return <h3 key={index}>{paragraph.replace('###', '').trim()}</h3>;
    }
    if (paragraph.startsWith('- ')) {
      const items = paragraph.split('\n').filter(line => line.startsWith('- '));
      return (
        <ul key={index}>
          {items.map((item, i) => (
            <li key={i}>{item.replace('- ', '')}</li>
          ))}
        </ul>
      );
    }
    if (paragraph.match(/^\d+\./)) {
      const items = paragraph.split('\n').filter(line => line.match(/^\d+\./));
      return (
        <ol key={index}>
          {items.map((item, i) => (
            <li key={i}>{item.replace(/^\d+\./, '').trim()}</li>
          ))}
        </ol>
      );
    }
    return <p key={index}>{paragraph}</p>;
  });

  // Находим номер текущего урока
  const currentIndex = allLessons.findIndex((l: Lesson) => l.id === lessonId);
  const lessonNumber = currentIndex !== -1 ? currentIndex + 1 : 1;
  const totalLessons = allLessons.length;

  return (
    <div className="lesson-page">
      <div className="lesson-container">
        {/* Навигация */}
        <div className="lesson-navigation">
          <button className="nav-button back" onClick={() => navigate(`/courses/${courseId}`)}>
            ← Назад к курсу
          </button>
          <div className="lesson-counter">
            Урок {lessonNumber} из {totalLessons}
          </div>
          {currentIndex > 0 && (
            <button className="nav-button prev" onClick={handlePreviousLesson}>
              ← Предыдущий
            </button>
          )}
        </div>

        {/* Заголовок урока */}
        <h1>{lesson.title}</h1>

        {/* Содержание урока */}
        <div className="lesson-content">
          {formattedContent}
        </div>

        {/* ✅ Сообщение о получении XP - показывается ВСЕГДА, если урок пройден */}
        {completed && (
          <div className="xp-earned">
            ⭐ Получено +{xpEarned} XP за урок!
          </div>
        )}

        {/* Кнопка "Отметить пройденным" */}
        {!completed && isAuthenticated && (
          <button className="mark-completed-button" onClick={handleMarkCompleted}>
            ✅ Отметить пройденным
          </button>
        )}

        {/* Бейдж пройденного урока */}
        {completed && (
          <div className="completed-badge">
            <span className="checkmark">✅</span>
            <span>Урок пройден!</span>
          </div>
        )}

        {/* Следующий урок */}
        {nextLesson && completed && (
          <div className="next-lesson">
            <p>Следующий урок: <strong>{nextLesson.title}</strong></p>
            <button 
              className="next-lesson-button"
              onClick={() => navigate(`/lesson/${courseId}/${nextLesson.id}`)}
            >
              Перейти к следующему уроку →
            </button>
          </div>
        )}

        {/* Кнопка возврата к курсу */}
        <button className="back-to-course" onClick={() => navigate(`/courses/${courseId}`)}>
          📚 Вернуться к программе курса
        </button>
      </div>
    </div>
  );
};

export default LessonPage;