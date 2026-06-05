// src/components/Courses.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Courses.css';

interface Course {
  id: string;
  title: string;
  description: string;
}

interface QuizProgress {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  completed: boolean;
}

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizProgress, setQuizProgress] = useState<QuizProgress[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, userId } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get<Course[]>('http://localhost:5001/api/courses');
        const sortedCourses = response.data.sort((a, b) => a.title.localeCompare(b.title));
        setCourses(sortedCourses);
        setLoadingCourses(false);
      } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
        setLoadingCourses(false);
      }
    };

    const fetchQuizProgress = async () => {
      if (!isAuthenticated || !userId) return;

      try {
        const response = await axios.get<QuizProgress[]>(`http://localhost:5001/api/user/${userId}/quiz/progress`);
        setQuizProgress(response.data || []);
      } catch (error) {
        console.error('Ошибка загрузки прогресса викторин:', error);
        setQuizProgress([]);
      }
    };

    fetchCourses();
    fetchQuizProgress();
  }, [isAuthenticated, userId]);

  const viewQuizzes = (courseId: string) => {
    navigate(`/quiz/${courseId}`);
  };

  const getNotCompletedQuizzes = (courseId: string) => {
    const notCompleted = quizProgress.filter(p => !p.completed);
    return notCompleted.length;
  };

  // Проверяем, пройден ли тест по курсу
  const isCourseQuizCompleted = (courseId: string): boolean => {
    const courseProgress = quizProgress.find(p => p.completed === true);
    return !!courseProgress;
  };

  if (loadingCourses) {
    return <div className="courses-container">Загрузка курсов...</div>;
  }

  return (
    <div className="courses-container">
      <div className="courses-list">
        {courses.map((course) => {
          const notCompletedCount = isAuthenticated ? getNotCompletedQuizzes(course.id) : 0;
          const quizCompleted = isAuthenticated && isCourseQuizCompleted(course.id);
          
          return (
            <div key={course.id} className="course-card">
              <div className="course-card-content">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description" style={{ textAlign: 'left' }}>
                  {course.description}
                </p>
                
                <div className="course-actions">
                  {/* Объединённый блок "Пройти тест" + статус */}
                  <div className="test-status">
                    <button className="view-quizzes-button" onClick={() => viewQuizzes(course.id)}>
                      📝 Пройти тест
                    </button>
                    {isAuthenticated && (
                      <span className={`test-badge ${quizCompleted ? 'completed' : 'not-completed'}`}>
                        {quizCompleted ? '✅ Пройден' : '⏳ Не пройден'}
                      </span>
                    )}
                  </div>
                  <Link to={`/leaderboard/${course.id}`} className="leaderboard-link">
                    Таблица лидеров
                  </Link>
                  <Link to={`/course/${course.id}/forums`} className="forum-link">
                    Форум обсуждения
                  </Link>
                </div>
                
                <Link to={`/courses/${course.id}`} className="more-info-link">
                  Подробнее →
                </Link>
                
                {isAuthenticated && notCompletedCount > 0 && (
                  <div className="quiz-progress">
                    <p>📝 Незавершённых викторин: {notCompletedCount}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Courses;