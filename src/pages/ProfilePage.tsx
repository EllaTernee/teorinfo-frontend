// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfilePage.css';

interface UserStats {
  username: string;
  email: string;
  registeredAt: string;
  totalLessonsCompleted: number;
  totalQuizzesCompleted: number;
  totalScore: number;
  lessonsScore: number;
  quizzesScore: number;
  averageScore: number;
  completedCourses: number;
  level: number;
  nextLevelXp: number;
  levelProgress: number;
  avatar: string;
}

interface QuizProgress {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  correctAnswers: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LessonProgress {
  id: number;
  userId: number;
  lessonId: string;
  completed: boolean;
  courseId: string;
  pointsAwarded?: number;
  updatedAt: string;
  completedAt?: string | null;
}

interface Lesson {
  id: string;
  title: string;
  courseId: string;
  xpReward?: number;
}

interface Course {
  id: string;
  title: string;
}

interface UserXpResponse {
  totalXp: number;
  lessonsXp: number;
  quizzesXp: number;
}

interface UserAchievement {
  id: number;
  userId: number;
  achievementId: string;
  earnedAt: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: string;
  requirementValue: number;
  isHidden: boolean;
  points: number;
}

// Список доступных аватаров
const avatars = [
  { id: 1, emoji: '👤', name: 'Стандартный' },
  { id: 2, emoji: '🎓', name: 'Выпускник' },
  { id: 3, emoji: '💻', name: 'Программист' },
  { id: 4, emoji: '🤖', name: 'Робот' },
  { id: 5, emoji: '🧙', name: 'Маг' },
  { id: 6, emoji: '🦸', name: 'Герой' },
  { id: 7, emoji: '🐍', name: 'Python' },
  { id: 8, emoji: '📘', name: 'Книга' },
  { id: 9, emoji: '🏆', name: 'Чемпион' },
  { id: 10, emoji: '⭐', name: 'Звезда' },
];

// Функция расчёта уровня
const calculateLevel = (xp: number): { level: number; nextLevelXp: number; progress: number } => {
  const level = Math.floor(xp / 100) + 1;
  const nextLevelXp = level * 100;
  const currentLevelXp = (level - 1) * 100;
  const progress = ((xp - currentLevelXp) / 100) * 100;
  return { level, nextLevelXp, progress };
};

const ProfilePage: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentQuizzes, setRecentQuizzes] = useState<(QuizProgress & { courseTitle?: string })[]>([]);
  const [recentLessons, setRecentLessons] = useState<LessonProgress[]>([]);
  const [lessonTitles, setLessonTitles] = useState<Map<string, string>>(new Map());
  const [, setCourseTitles] = useState<Map<number, string>>(new Map());
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const { userId, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState(() => {
    const savedAvatar = localStorage.getItem(`avatar_${userId}`);
    return savedAvatar || '👤';
  });

  const handleAvatarChange = (newAvatar: string) => {
    setAvatar(newAvatar);
    localStorage.setItem(`avatar_${userId}`, newAvatar);
    setShowAvatarModal(false);
    if (stats) {
      setStats({ ...stats, avatar: newAvatar });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const userRes = await axios.get(`https://teorinfo-backend.onrender.com/api/users/${userId}`);
        
        let lessonsXp = 0;
        let quizzesXp = 0;
        let totalXp = 0;
        
        try {
          const xpRes = await axios.get<UserXpResponse>(`https://teorinfo-backend.onrender.com/api/user/${userId}/xp`);
          lessonsXp = xpRes.data.lessonsXp || 0;
          quizzesXp = xpRes.data.quizzesXp || 0;
          totalXp = xpRes.data.totalXp || 0;
        } catch (error) {
          console.warn('XP data not available, calculating from progress');
        }
        
        const coursesRes = await axios.get<Course[]>('https://teorinfo-backend.onrender.com/api/courses');
        const courseMap = new Map<number, string>();
        const numericIdMap: { [key: string]: number } = {
          'information-coding': 1,
          'number-systems': 2,
          'algorithms': 3,
          'networks': 4,
          'information-theory': 5,
        };
        coursesRes.data.forEach(course => {
          const numericId = numericIdMap[course.id];
          if (numericId) {
            courseMap.set(numericId, course.title);
          }
        });
        setCourseTitles(courseMap);
        
        let allLessons: Lesson[] = [];
        for (const course of coursesRes.data) {
          const lessonsRes = await axios.get(`https://teorinfo-backend.onrender.com/api/courses/${course.id}/lessons`);
          allLessons = [...allLessons, ...lessonsRes.data];
        }
        const lessonMap = new Map<string, string>();
        allLessons.forEach(lesson => {
          lessonMap.set(lesson.id, lesson.title);
        });
        setLessonTitles(lessonMap);
        
        const lessonsRes = await axios.get<LessonProgress[]>(`https://teorinfo-backend.onrender.com/api/user/${userId}/lessons/progress`);
        const completedLessons = lessonsRes.data.filter(l => l.completed === true);
        
        if (totalXp === 0 && completedLessons.length > 0) {
          lessonsXp = completedLessons.reduce((sum, lesson) => {
            return sum + (lesson.pointsAwarded || 20);
          }, 0);
        }
        
        const quizzesRes = await axios.get<QuizProgress[]>(`https://teorinfo-backend.onrender.com/api/user/${userId}/quiz/progress`);
        const completedQuizzes = quizzesRes.data.filter(q => q.completed === true);
        
        let quizzesTotalScore = 0;
        if (totalXp === 0) {
          quizzesTotalScore = quizzesRes.data.reduce((sum, q) => sum + (q.score || 0), 0);
        } else {
          quizzesTotalScore = quizzesXp;
        }
        
        const finalTotalScore = totalXp > 0 ? totalXp : lessonsXp + quizzesTotalScore;
        
        const avgScore = completedQuizzes.length > 0 
          ? Math.round((quizzesTotalScore / completedQuizzes.length) * 10) / 10
          : 0;
        
        const uniqueCourses = new Set(completedLessons.map(l => l.courseId));
        const { level, nextLevelXp, progress } = calculateLevel(finalTotalScore);
        
        const recentQuizzesData = [...quizzesRes.data]
          .filter(q => q.completed)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map(quiz => ({
            ...quiz,
            courseTitle: courseMap.get(quiz.quiz_id) || `Тест №${quiz.quiz_id}`
          }));
        
        const recentLessonsData = [...lessonsRes.data]
          .filter(l => l.completed)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);
        
        setStats({
          username: userRes.data.username,
          email: userRes.data.email,
          registeredAt: userRes.data.createdAt,
          totalLessonsCompleted: completedLessons.length,
          totalQuizzesCompleted: completedQuizzes.length,
          totalScore: finalTotalScore,
          lessonsScore: lessonsXp,
          quizzesScore: quizzesTotalScore,
          averageScore: avgScore,
          completedCourses: uniqueCourses.size,
          level: level,
          nextLevelXp: nextLevelXp,
          levelProgress: progress,
          avatar: avatar,
        });
        
        setRecentQuizzes(recentQuizzesData);
        setRecentLessons(recentLessonsData);
        
        // Загружаем достижения пользователя
        try {
          const [achievementsRes, userAchievementsRes] = await Promise.all([
            axios.get<Achievement[]>('https://teorinfo-backend.onrender.com/api/achievements', {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }),
            axios.get<UserAchievement[]>(`https://teorinfo-backend.onrender.com/api/user/${userId}/achievements`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
          ]);
          setAllAchievements(achievementsRes.data);
          setUserAchievements(userAchievementsRes.data);
          
          // ✅ ОТЛАДОЧНЫЕ ЛОГИ
          console.log('🔍 Все достижения в системе:', achievementsRes.data.map(a => a.id));
          console.log('🔍 Полученные ID пользователя:', userAchievementsRes.data.map(ua => ua.achievementId));
        } catch (error) {
          console.error('Ошибка загрузки достижений:', error);
        }
        
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, isAuthenticated, navigate, avatar]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Неизвестно';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Неизвестно';
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ✅ ФИЛЬТРУЕМ ТОЛЬКО ПОЛУЧЕННЫЕ ДОСТИЖЕНИЯ
  const earnedAchievements = allAchievements.filter(ach => 
    userAchievements.some(ua => ua.achievementId === ach.id)
  );

  if (loading) {
    return <div className="profile-page">Загрузка профиля...</div>;
  }

  if (!stats) {
    return <div className="profile-page">Не удалось загрузить профиль</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Шапка профиля */}
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">{avatar}</div>
            <button 
              className="change-avatar-btn"
              onClick={() => setShowAvatarModal(true)}
              title="Сменить аватар"
            >
              ✏️
            </button>
          </div>
          <div className="profile-info">
            <h1>{stats.username}</h1>
            <p className="profile-email">{stats.email}</p>
            <p className="profile-registered">На сайте с {formatDate(stats.registeredAt)}</p>
          </div>
        </div>

        {/* Модальное окно выбора аватара */}
        {showAvatarModal && (
          <div className="avatar-modal-overlay" onClick={() => setShowAvatarModal(false)}>
            <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
              <div className="avatar-modal-header">
                <h3>Выберите аватар</h3>
                <button className="avatar-modal-close" onClick={() => setShowAvatarModal(false)}>×</button>
              </div>
              <div className="avatar-grid">
                {avatars.map(a => (
                  <div
                    key={a.id}
                    className={`avatar-option ${avatar === a.emoji ? 'selected' : ''}`}
                    onClick={() => handleAvatarChange(a.emoji)}
                  >
                    <div className="avatar-option-emoji">{a.emoji}</div>
                    <div className="avatar-option-name">{a.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Карточка уровня */}
        <div className="level-card">
          <div className="level-header">
            <span className="level-icon">🏆</span>
            <span className="level-title">Уровень {stats.level}</span>
            <span className="level-xp">{stats.totalScore} / {stats.nextLevelXp} XP</span>
          </div>
          <div className="level-progress-bar">
            <div className="level-progress-fill" style={{ width: `${stats.levelProgress}%` }}></div>
          </div>
          <div className="level-next">До следующего уровня: {stats.nextLevelXp - stats.totalScore} XP</div>
        </div>

        {/* ✅ БЛОК ДОСТИЖЕНИЙ - ТОЛЬКО РЕАЛЬНО ПОЛУЧЕННЫЕ */}
        <div className="achievements-section-profile">
          <h2>🏆 Мои достижения</h2>
          {earnedAchievements.length === 0 ? (
            <div className="no-achievements">
              <p>🎯 Пока нет полученных достижений</p>
              <p className="no-achievements-hint">Проходите уроки и тесты, чтобы зарабатывать достижения!</p>
            </div>
          ) : (
            <div className="profile-achievements-grid">
              {earnedAchievements.map(achievement => (
                <div key={achievement.id} className="profile-achievement-card">
                  <div className="profile-achievement-icon">{achievement.icon}</div>
                  <div className="profile-achievement-info">
                    <div className="profile-achievement-title">{achievement.title}</div>
                    <div className="profile-achievement-desc">{achievement.description}</div>
                    <div className="profile-achievement-points">+{achievement.points} очков</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.totalLessonsCompleted}</div>
            <div className="stat-label">Уроков пройдено</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalQuizzesCompleted}</div>
            <div className="stat-label">Тестов пройдено</div>
          </div>
          
          <div className="stat-card stat-card-lessons">
            <div className="stat-value">{stats.lessonsScore}</div>
            <div className="stat-label">Баллов за уроки</div>
          </div>
          
          <div className="stat-card stat-card-quizzes">
            <div className="stat-value">{stats.quizzesScore}</div>
            <div className="stat-label">Баллов за тесты</div>
          </div>
          
          <div className="stat-card stat-card-total">
            <div className="stat-value">{stats.totalScore}</div>
            <div className="stat-label">Всего очков</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.averageScore}</div>
            <div className="stat-label">Средний балл за тесты</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completedCourses}</div>
            <div className="stat-label">Курсов пройдено</div>
          </div>
        </div>

        {/* Недавняя активность */}
        <div className="profile-activity">
          <div className="activity-section">
            <h2>📚 Последние пройденные уроки</h2>
            {recentLessons.length > 0 ? (
              <ul className="activity-list">
                {recentLessons.map((lesson, index) => (
                  <li key={index} className="activity-item">
                    <span className="activity-icon">✅</span>
                    <span className="activity-name">
                      {lessonTitles.get(lesson.lessonId) || lesson.lessonId}
                    </span>
                    <span className="activity-xp">+{lesson.pointsAwarded || 20} XP</span>
                    <span className="activity-date">
                      {formatDate(lesson.completedAt || lesson.updatedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-activity">Пока нет пройденных уроков</p>
            )}
          </div>

          <div className="activity-section">
            <h2>📝 Последние пройденные тесты</h2>
            {recentQuizzes.length > 0 ? (
              <ul className="activity-list">
                {recentQuizzes.map((quiz, index) => (
                  <li key={index} className="activity-item">
                    <span className="activity-icon">🎯</span>
                    <span className="activity-name">
                      {quiz.courseTitle || `Тест по курсу`}
                    </span>
                    <span className="activity-score">
                      Результат: {quiz.correctAnswers || quiz.score / 10}/10
                    </span>
                    <span className="activity-xp">+{quiz.score} XP</span>
                    <span className="activity-date">
                      {formatDate(quiz.updatedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-activity">Пока нет пройденных викторин</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;