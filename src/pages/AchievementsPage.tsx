// src/pages/AchievementsPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Notification from '../components/Notification';
import '../styles/AchievementsPage.css';

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

interface UserAchievement {
  id: number;
  userId: number;
  achievementId: string;
  earnedAt: string;
}

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const { userId, isAuthenticated } = useAuth();

  const fetchData = async () => {
    try {
      const [achievementsRes, userAchievementsRes] = await Promise.all([
        axios.get<Achievement[]>('http://localhost:5001/api/achievements'),
        isAuthenticated && userId 
          ? axios.get<UserAchievement[]>(`http://localhost:5001/api/user/${userId}/achievements`)
          : Promise.resolve({ data: [] })
      ]);
      setAchievements(achievementsRes.data);
      
      const newUserAchievements = userAchievementsRes.data || [];
      setUserAchievements(newUserAchievements);
      
      // Проверяем, есть ли новые достижения (сохраняем в localStorage)
      const prevIds = JSON.parse(localStorage.getItem('achievementsSeen') || '[]');
      const newIds = newUserAchievements.map(ua => ua.achievementId);
      const justUnlocked = newIds.filter(id => !prevIds.includes(id));
      
      if (justUnlocked.length > 0) {
        const unlockedAchievement = achievementsRes.data.find(a => a.id === justUnlocked[0]);
        if (unlockedAchievement) {
          setNewAchievement(unlockedAchievement);
          localStorage.setItem('achievementsSeen', JSON.stringify(newIds));
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки достижений:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, isAuthenticated]);

  // Периодически проверяем новые достижения (каждые 5 секунд)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (loading) {
    return <div className="achievements-page">Загрузка достижений...</div>;
  }

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievementId === achievementId);
  };

  // ============================================
  // ОСНОВНЫЕ ДОСТИЖЕНИЯ (за уроки)
  // ============================================
  const mainAchievements = achievements.filter(a => 
    ['first-step', 'diligent-student', 'expert', 'professor'].includes(a.id)
  );
  
  // ============================================
  // ТЕСТИРОВАНИЕ (за вопросы и тесты)
  // ============================================
  const testingAchievements = achievements.filter(a => 
    ['curious', 'erudite', 'perfect-quiz'].includes(a.id)
  );
  
  // ============================================
  // КУРС 1: ТЕОРИЯ ИНФОРМАЦИИ
  // ============================================
  const infoTheoryAchievements = achievements.filter(a => 
    ['theory-master', 'course-finisher'].includes(a.id)
  );
  
  // ============================================
  // КУРС 2: ТЕОРИЯ КОДИРОВАНИЯ
  // ============================================
  const codingAchievements = achievements.filter(a => 
    ['coding-first-lesson', 'coding-compression-master', 
     'coding-crypto-master', 'coding-error-correction-master', 
     'coding-master', 'coding-perfect-quiz'].includes(a.id)
  );
  
  // ============================================
  // КУРС 3: ТЕОРИЯ АЛГОРИТМОВ И АВТОМАТОВ
  // ============================================
  const algoAchievements = achievements.filter(a => 
    ['algo-first', 'algo-turing-master', 'algo-automata-master', 
     'algo-halting', 'algo-master', 'algo-perfect-quiz'].includes(a.id)
  );
  
  // ============================================
  // КУРС 4: ТЕОРИЯ ФОРМАЛЬНЫХ ЯЗЫКОВ
  // ============================================
  const formalAchievements = achievements.filter(a => 
    ['formal-first', 'formal-grammar-master', 'formal-regex-master', 
     'formal-parsing-master', 'formal-master'].includes(a.id)
  );
  
  // ============================================
  // ВСЕ КУРСЫ ВМЕСТЕ
  // ============================================
  const allCourseAchievements = [
    ...infoTheoryAchievements,
    ...codingAchievements,
    ...algoAchievements,
    ...formalAchievements
  ];
  
  // Скрытые достижения
  const hiddenAchievements = achievements.filter(a => a.isHidden);

  return (
    <div className="achievements-page">
      {newAchievement && (
        <Notification
          icon={newAchievement.icon}
          title="🏆 Новое достижение!"
          message={`${newAchievement.title} — ${newAchievement.description}`}
          onClose={() => setNewAchievement(null)}
        />
      )}

      <div className="achievements-header">
        <h1>🏆 Достижения</h1>
        <p>Зарабатывайте достижения, проходя курсы и викторины</p>
      </div>

      {/* ============================================
          ОСНОВНЫЕ ДОСТИЖЕНИЯ
      ============================================ */}
      {mainAchievements.length > 0 && (
        <div className="achievements-section">
          <h2>📚 ОСНОВНЫЕ</h2>
          <div className="achievements-grid">
            {mainAchievements.map(achievement => {
              const unlocked = isUnlocked(achievement.id);
              return (
                <div key={achievement.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                    <div className="achievement-points">+{achievement.points} очков</div>
                  </div>
                  <div className="achievement-status">
                    {unlocked ? '✅' : '🔒'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================
          ТЕСТИРОВАНИЕ
      ============================================ */}
      {testingAchievements.length > 0 && (
        <div className="achievements-section">
          <h2>📝 ТЕСТИРОВАНИЕ</h2>
          <div className="achievements-grid">
            {testingAchievements.map(achievement => {
              const unlocked = isUnlocked(achievement.id);
              return (
                <div key={achievement.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                    <div className="achievement-points">+{achievement.points} очков</div>
                  </div>
                  <div className="achievement-status">
                    {unlocked ? '✅' : '🔒'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================
          ТЕОРИЯ ИНФОРМАЦИИ
      ============================================ */}
      {infoTheoryAchievements.length > 0 && (
        <div className="achievements-section">
          <h2>📊 ТЕОРИЯ ИНФОРМАЦИИ</h2>
          <div className="achievements-grid">
            {infoTheoryAchievements.map(achievement => {
              const unlocked = isUnlocked(achievement.id);
              return (
                <div key={achievement.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                    <div className="achievement-points">+{achievement.points} очков</div>
                  </div>
                  <div className="achievement-status">
                    {unlocked ? '✅' : '🔒'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================
          ТЕОРИЯ КОДИРОВАНИЯ
      ============================================ */}
      {codingAchievements.length > 0 && (
        <div className="achievements-section">
          <h2>🔐 ТЕОРИЯ КОДИРОВАНИЯ</h2>
          <div className="achievements-grid">
            {codingAchievements.map(achievement => {
              const unlocked = isUnlocked(achievement.id);
              return (
                <div key={achievement.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                    <div className="achievement-points">+{achievement.points} очков</div>
                  </div>
                  <div className="achievement-status">
                    {unlocked ? '✅' : '🔒'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================
          ТЕОРИЯ АЛГОРИТМОВ И АВТОМАТОВ
      ============================================ */}
      {algoAchievements.length > 0 && (
        <div className="achievements-section">
          <h2>⚙️ ТЕОРИЯ АЛГОРИТМОВ И АВТОМАТОВ</h2>
          <div className="achievements-grid">
            {algoAchievements.map(achievement => {
              const unlocked = isUnlocked(achievement.id);
              return (
                <div key={achievement.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                    <div className="achievement-points">+{achievement.points} очков</div>
                  </div>
                  <div className="achievement-status">
                    {unlocked ? '✅' : '🔒'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================
          ТЕОРИЯ ФОРМАЛЬНЫХ ЯЗЫКОВ
      ============================================ */}
      {formalAchievements.length > 0 && (
        <div className="achievements-section">
          <h2>📖 ТЕОРИЯ ФОРМАЛЬНЫХ ЯЗЫКОВ</h2>
          <div className="achievements-grid">
            {formalAchievements.map(achievement => {
              const unlocked = isUnlocked(achievement.id);
              return (
                <div key={achievement.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                    <div className="achievement-points">+{achievement.points} очков</div>
                  </div>
                  <div className="achievement-status">
                    {unlocked ? '✅' : '🔒'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================
          СКРЫТЫЕ ДОСТИЖЕНИЯ
      ============================================ */}
      {hiddenAchievements.length > 0 && (
        <div className="achievements-section">
          <h2>❓ СКРЫТЫЕ</h2>
          <div className="achievements-grid">
            {hiddenAchievements.map(achievement => {
              const unlocked = isUnlocked(achievement.id);
              return (
                <div key={achievement.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked hidden'}`}>
                  <div className="achievement-icon">{unlocked ? achievement.icon : '❓'}</div>
                  <div className="achievement-info">
                    <h3>{unlocked ? achievement.title : '???'}</h3>
                    <p>{unlocked ? achievement.description : 'Секретное достижение. Как его получить — загадка.'}</p>
                    {unlocked && <div className="achievement-points">+{achievement.points} очков</div>}
                  </div>
                  <div className="achievement-status">
                    {unlocked ? '✅' : '❓'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;