// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/HomePage.css';

interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface LessonProgress {
  lessonId: string;
  completed: boolean;
  courseId: string;
}

interface Stats {
  courses: number;
  lessons: number;
  achievements: number;
  questions: number;
}

const getCourseIcon = (title: string): string => {
  if (title.toLowerCase().includes('информация')) return '📊';
  if (title.toLowerCase().includes('системы счисления')) return '🔢';
  if (title.toLowerCase().includes('алгоритмизация')) return '💻';
  if (title.toLowerCase().includes('компьютерные сети')) return '🌐';
  return '🎓';
};

const calculateCourseProgress = (progress: LessonProgress[], courseId: string): number => {
  if (!progress || progress.length === 0) return 0;
  
  const courseProgress = progress.filter(p => p.courseId === courseId);
  
  if (courseProgress.length === 0) return 0;
  
  const completedCount = courseProgress.filter(p => p.completed === true).length;
  const totalCount = courseProgress.length;
  
  if (totalCount === 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
};

const truncateDescription = (description: string, maxLength: number = 100): string => {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + '...';
};

const HomePage: React.FC = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Stats>({ courses: 0, lessons: 0, achievements: 0, questions: 0 });
  const [loading, setLoading] = useState(true);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const { isAuthenticated, userId, role } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get<Course[]>('http://localhost:5001/api/courses');
        const sortedCourses = response.data.sort((a, b) => a.title.localeCompare(b.title));
        setFeaturedCourses(sortedCourses);
      } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await axios.get<Stats>('http://localhost:5001/api/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      }
    };

    Promise.all([fetchCourses(), fetchStats()]).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!isAuthenticated || !userId) return;
      
      try {
        const response = await axios.get(`http://localhost:5001/api/user/${userId}/lessons/progress`);
        setLessonProgress(response.data || []);
      } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
        setLessonProgress([]);
      }
    };

    fetchProgress();
  }, [isAuthenticated, userId]);

  if (loading) {
    return (
      <div className="homepage">
        <div className="hero hero-loading">
          <div className="hero-content">
            <div className="hero-icon loading-pulse">📘</div>
            <h1 className="hero-title">ТеорИнфо</h1>
            <p className="hero-subtitle">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* ========== HERO БАННЕР С ВОЛНОЙ ========== */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">🎓 Образовательная платформа</div>
          <h1 className="hero-title">
            <span className="gradient-text">ТеорИнфо</span>
          </h1>
          <p className="hero-subtitle">
            Электронное учебное пособие по теоретическим основам информатики
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{stats.courses}</span>
              <span className="stat-label">Курсов</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{stats.lessons}</span>
              <span className="stat-label">Уроков</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{stats.questions}</span>
              <span className="stat-label">Вопросов</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{stats.achievements}</span>
              <span className="stat-label">Достижений</span>
            </div>
          </div>
          <Link to="/courses" className="hero-btn">
            Начать обучение
            <span className="btn-arrow">→</span>
          </Link>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,166.21,87.07,321.39,56.44Z" />
          </svg>
        </div>
      </section>

      {/* ========== СЕКЦИЯ "ЧТО ВАС ЖДЁТ?" ========== */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Что вас ждёт?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Курсы</h3>
              <p>Структурированные материалы по ключевым темам информатики</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <h3>Тренажёр</h3>
              <p>Проверьте знания в игровом режиме со случайными вопросами</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Достижения</h3>
              <p>Зарабатывайте очки и открывайте ачивки за прогресс</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📖</div>
              <h3>Словарь</h3>
              <p>Словарь терминов для быстрой справки</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== РЕКОМЕНДУЕМЫЕ КУРСЫ ========== */}
      <section className="recommended">
        <div className="container">
          <h2 className="section-title">Рекомендуемые курсы</h2>
          {featuredCourses.length > 0 ? (
            <div className="courses-grid">
              {featuredCourses.map((course) => {
                const progress = isAuthenticated ? calculateCourseProgress(lessonProgress, course.id) : 0;
                
                return (
                  <div key={course.id} className="course-card">
                    <div className="course-icon">
                      {getCourseIcon(course.title)}
                    </div>
                    <div className="course-info">
                      <Link to={`/courses/${course.id}`} className="course-title">
                        {course.title}
                      </Link>
                      <p className="course-description" style={{ textAlign: 'left' }}>
                        {truncateDescription(course.description, 100)}
                      </p>
                      
                      {isAuthenticated && (
                        <div className="course-progress">
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar-fill" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="progress-text">
                            {progress}% завершено
                          </div>
                        </div>
                      )}
                      
                      <Link to={`/courses/${course.id}`} className="course-link">
                        Подробнее →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Курсы не найдены</h3>
              <p>
                {role === 'admin' 
                  ? 'Войдите в конструктор и создайте первый курс' 
                  : 'Курсы появятся здесь после добавления администратором'}
              </p>
              {role === 'admin' && (
                <Link to="/admin/courses" className="empty-btn">
                  ✨ Создать курс
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========== CTA СЕКЦИЯ - ТОЛЬКО ДЛЯ НЕАВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ ========== */}
      {!isAuthenticated && (
        <section className="cta">
          <div className="cta-wave-top">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V95.8C59.71,118.11,166.21,87.07,321.39,56.44Z" />
            </svg>
          </div>
          
          <div className="container">
            <h2>Готовы начать обучение?</h2>
            <p>Зарегистрируйтесь и получите доступ ко всем материалам</p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-btn primary">Создать аккаунт</Link>
              <Link to="/login" className="cta-btn secondary">Войти</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;