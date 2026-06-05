// src/pages/TrainerPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
}

interface CourseStats {
  courseId: string;
  title: string;
  icon: string;
  totalQuestions: number;
}

const TrainerPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [, setSelectedCourseId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ isCorrect: boolean; selected: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inGame, setInGame] = useState(false);
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get<Course[]>('https://teorinfo-backend.onrender.com/api/courses');
        setCourses(response.data);
        
        const stats: CourseStats[] = [];
        for (const course of response.data) {
          try {
            const questionsRes = await axios.get(`https://teorinfo-backend.onrender.com/api/quizzes/${course.id}`);
            stats.push({
              courseId: course.id,
              title: course.title,
              icon: getCourseIcon(course.title),
              totalQuestions: questionsRes.data.length
            });
          } catch (error) {
            console.error(`Ошибка загрузки вопросов для ${course.id}:`, error);
          }
        }
        setCourseStats(stats);
      } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);

  const getCourseIcon = (title: string): string => {
    if (title.includes('Информация')) return '📊';
    if (title.includes('Системы')) return '🔢';
    if (title.includes('Алгоритмизация')) return '💻';
    if (title.includes('Компьютерные')) return '🌐';
    return '📚';
  };

  const startRandomRound = async () => {
    setSelectedCourseId(null);
    await loadRandomQuestions();
  };

  const startCourseRound = async (courseId: string) => {
    setSelectedCourseId(courseId);
    await loadQuestionsForCourse(courseId);
  };

  const loadRandomQuestions = async () => {
    setLoading(true);
    try {
      let allQuestions: Question[] = [];
      for (const course of courses) {
        try {
          const response = await axios.get(`https://teorinfo-backend.onrender.com/api/quizzes/${course.id}`);
          allQuestions = [...allQuestions, ...response.data];
        } catch (error) {
          console.error('Ошибка:', error);
        }
      }
      
      const shuffled = shuffleArray(allQuestions);
      const randomQuestions = shuffled.slice(0, 5);
      setQuestions(randomQuestions);
      startGame(randomQuestions);
    } catch (error) {
      console.error('Ошибка загрузки вопросов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsForCourse = async (courseId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://teorinfo-backend.onrender.com/api/quizzes/${courseId}`);
      const shuffled = shuffleArray(response.data);
      const randomQuestions = shuffled.slice(0, 5);
      setQuestions(randomQuestions);
      startGame(randomQuestions);
    } catch (error) {
      console.error('Ошибка загрузки вопросов:', error);
    } finally {
      setLoading(false);
    }
  };

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const startGame = (gameQuestions: Question[]) => {
    setQuestions(gameQuestions);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswers([]);
    setShowResults(false);
    setInGame(true);
  };

  const handleAnswer = (selectedOption: string) => {
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedOption === currentQuestion.answer;
    
    setUserAnswers([...userAnswers, { isCorrect, selected: selectedOption }]);
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    if (currentIndex + 1 >= questions.length) {
      setShowResults(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const restartGame = () => {
    setInGame(false);
    setSelectedCourseId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswers([]);
    setShowResults(false);
  };

  if (loading) {
    return <div className="trainer-page">Загрузка...</div>;
  }

  if (inGame && questions.length > 0 && !showResults) {
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    
    return (
      <div className="trainer-page">
        <div className="trainer-game">
          <div className="game-header">
            <button className="exit-button" onClick={restartGame}>✕ Выйти</button>
            <div className="game-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <span>Вопрос {currentIndex + 1} из {questions.length}</span>
            </div>
          </div>
          
          <div className="game-question">
            <h2>{currentQuestion.question}</h2>
            <div className="game-options">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  className="game-option"
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const percentage = (score / questions.length) * 100;
    const isPassed = percentage >= 70;
    
    return (
      <div className="trainer-page">
        <div className="trainer-results">
          <h2>ТРЕНАЖЁР ЗАВЕРШЁН</h2>
          
          <div className={`result-circle ${isPassed ? 'passed' : 'failed'}`}>
            <span className="result-percent">{Math.round(percentage)}%</span>
          </div>
          
          <p className="result-message">
            {isPassed ? 'Отлично! Вы хорошо усвоили материал!' : 'нужно повторить материал'}
          </p>
          <p className="result-score-detail">
            {score} из {questions.length} правильных ответов
          </p>
          
          <h3>РЕЗУЛЬТАТЫ ПО ВОПРОСАМ</h3>
          
          <div className="results-grid">
            {userAnswers.map((answer, idx) => (
              <div 
                key={idx} 
                className={`result-square ${answer.isCorrect ? 'correct' : 'wrong'}`}
                title={`Вопрос: ${questions[idx].question}\nВаш ответ: ${answer.selected}\nПравильный ответ: ${questions[idx].answer}`}
              >
                {answer.isCorrect ? '✓' : '✗'}
              </div>
            ))}
          </div>
          
          <p className="results-hint">
            наведите на квадратик, чтобы увидеть пояснение
          </p>
          
          <button className="restart-button" onClick={restartGame}>
            ← В МЕНЮ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trainer-page">
      <div className="trainer-container">
        <div className="trainer-hero">
          <div className="trainer-icon">🎯</div>
          <h1>РЕЖИМ ТРЕНАЖЁРА</h1>
          <p>Случайные вопросы из тестов помогают повторить материал и закрепить знания.</p>
          <p className="trainer-badge">Каждый раунд — 5 вопросов</p>
        </div>

        <div className="random-section">
          <div className="random-card">
            <div className="random-icon">🎲</div>
            <div className="random-info">
              <h3>Частный раунд • 5 вопросов</h3>
              <p>Случайные вопросы из всех программ</p>
              <p className="random-hint">Не знаете с чего начать? Запустите быстрый раунд и проверьте свои знания по разным темам сразу</p>
            </div>
            <button className="start-random-button" onClick={startRandomRound}>
              Начать тренажёр →
            </button>
          </div>
        </div>

        <div className="courses-section">
          <h3>ИЛИ ВЫБЕРИТЕ ПРОГРАММУ</h3>
          <div className="courses-grid-trainer">
            {courseStats.map((course) => (
              <div key={course.courseId} className="course-trainer-card">
                <div className="course-trainer-icon">{course.icon}</div>
                <div className="course-trainer-title">{course.title}</div>
                <div className="course-trainer-stats">
                  {course.totalQuestions} вопросов • 5 случайных
                </div>
                <button 
                  className="select-course-button"
                  onClick={() => startCourseRound(course.courseId)}
                >
                  Выбрать →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerPage;