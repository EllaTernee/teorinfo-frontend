import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Quiz from '../components/Quiz';
import { useAuth } from '../context/AuthContext';
import '../styles/QuizPage.css';

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  sequence: number;
  total_questions: number;
}

interface LessonProgress {
  id: number;
  userId: number;
  lessonId: string;
  completed: boolean;
  courseId: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  numeric_id?: number;
}

interface QuizProgress {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  correctAnswers: number;
  completed: boolean;
}

interface UserAnswer {
  questionId: number;
  selectedOption: string | null;
  isCorrect: boolean;
  explanation: string;
}

const QuizPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [, setFinalScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [, setAllLessonsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setTotalLessonsCount] = useState(0);
  const [, setCompletedLessonsCount] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [courseNumericId, setCourseNumericId] = useState<number | null>(null);
  const [existingProgress, setExistingProgress] = useState<QuizProgress | null>(null);
  const { courseId } = useParams<{ courseId: string }>();
  const { userId, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await axios.get<Course>(`https://teorinfo-backend.onrender.com/api/courses/${courseId}`);
        setCourseTitle(response.data.title);
        setCourseNumericId(response.data.numeric_id || null);
      } catch (error) {
        console.error('Ошибка загрузки данных курса:', error);
        setCourseTitle('Теория информации');
        setCourseNumericId(5);
      }
    };
    if (courseId) fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    const fetchExistingProgress = async () => {
      if (!isAuthenticated || !userId || !courseNumericId) return;
      
      try {
        const response = await axios.get<QuizProgress[]>(`https://teorinfo-backend.onrender.com/api/user/${userId}/quiz/progress`);
        const progress = response.data.find(p => p.quiz_id === courseNumericId);
        if (progress && progress.completed) {
          setExistingProgress(progress);
          setFinalScore(progress.correctAnswers);
          setCompleted(true);
          
          const savedAnswers = localStorage.getItem(`quiz_answers_${courseId}`);
          if (savedAnswers) {
            setUserAnswers(JSON.parse(savedAnswers));
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки сохранённого прогресса:', error);
      }
    };
    
    if (courseNumericId) {
      fetchExistingProgress();
    }
  }, [courseNumericId, userId, isAuthenticated, courseId]);

  useEffect(() => {
    const checkLessonsProgress = async () => {
      if (!isAuthenticated || !userId) {
        setAllLessonsCompleted(true);
        setLoading(false);
        return;
      }

      try {
        const lessonsRes = await axios.get(`https://teorinfo-backend.onrender.com/api/courses/${courseId}/lessons`);
        const totalLessons = lessonsRes.data.length;
        setTotalLessonsCount(totalLessons);
        
        const progressRes = await axios.get<LessonProgress[]>(`https://teorinfo-backend.onrender.com/api/user/${userId}/lessons/progress`);
        const courseLessons = progressRes.data.filter(p => p.courseId === courseId);
        const completedLessons = courseLessons.filter(p => p.completed === true).length;
        setCompletedLessonsCount(completedLessons);
        
        setAllLessonsCompleted(completedLessons >= totalLessons);
      } catch (error) {
        console.error('Ошибка проверки прогресса уроков:', error);
        setAllLessonsCompleted(true);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      checkLessonsProgress();
    }
  }, [courseId, userId, isAuthenticated]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get<Question[]>(`https://teorinfo-backend.onrender.com/api/quizzes/${courseId}`);
        setQuestions(response.data);
      } catch (error) {
        console.error('Ошибка загрузки вопросов:', error);
      }
    };

    if (!completed) {
      fetchQuestions();
    }
  }, [courseId, completed]);

  const handleAnswerQuestion = (selectedOption: string | null, isCorrect: boolean) => {
    const currentQuestion = questions[currentQuestionIndex];
    const explanation = currentQuestion?.explanation || 'Пояснение не добавлено.';
    
    const updatedUserAnswers = [...userAnswers, { 
      questionId: currentQuestion.id, 
      selectedOption, 
      isCorrect,
      explanation 
    }];

    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }
    setUserAnswers(updatedUserAnswers);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prevIndex => prevIndex + 1);
  };

  const handleFinishQuiz = async () => {
    if (!courseNumericId) {
      console.error('Нет числового ID курса');
      return;
    }

    const finalScoreValue = score;

    try {
      const response = await axios.post(
        'https://teorinfo-backend.onrender.com/api/user/quiz/progress',
        {
          userId: userId,
          quizId: courseNumericId,
          score: finalScoreValue,
          completed: true,
        }
      );
      setFinalScore(finalScoreValue);
      setCompleted(true);
      setExistingProgress({
        id: response.data.id,
        user_id: userId!,
        quiz_id: courseNumericId,
        score: response.data.score,
        correctAnswers: finalScoreValue,
        completed: true
      });
      
      localStorage.setItem(`quiz_answers_${courseId}`, JSON.stringify(userAnswers));
    } catch (error) {
      console.error('Ошибка сохранения результата:', error);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setFinalScore(null);
    setCompleted(false);
    setUserAnswers([]);
    setExistingProgress(null);
    localStorage.removeItem(`quiz_answers_${courseId}`);
    const fetchQuestions = async () => {
      try {
        const response = await axios.get<Question[]>(`https://teorinfo-backend.onrender.com/api/quizzes/${courseId}`);
        setQuestions(response.data);
      } catch (error) {
        console.error('Ошибка загрузки вопросов:', error);
      }
    };
    fetchQuestions();
  };

  if (loading && questions.length === 0) {
    return <div className="quiz-page">Загрузка...</div>;
  }

  if (completed && existingProgress && questions.length > 0) {
    const isPassed = (existingProgress.correctAnswers / questions.length) >= 0.7;
    const isPerfect = existingProgress.correctAnswers === questions.length;

    return (
      <div className="quiz-page">
        <div className="quiz-results-container">
          <div className="quiz-results-card">
            <h2>Тест по курсу «{courseTitle}»</h2>
            {isPassed ? (
              <div className="quiz-success">
                🎉 Поздравляем! Вы успешно сдали тест! 🎉
              </div>
            ) : (
              <div className="quiz-failed">
                📚 К сожалению, вы не набрали проходной балл (нужно 70%). Попробуйте ещё раз!
              </div>
            )}
            
            <div className="quiz-score">
              <span className="score-value">{existingProgress.correctAnswers}</span>
              <span className="score-total">/{questions.length}</span>
              <span className="score-xp">+{existingProgress.score} XP</span>
            </div>

            {/* ПОЯСНЕНИЕ О НАЧИСЛЕНИИ БАЛЛОВ */}
            <div className="score-rules">
              📌 <strong>Как начисляются баллы:</strong><br />
              • +10 XP за каждый правильный ответ<br />
              {isPerfect && (
                <span className="bonus-text">🎉 +50 XP бонус за идеальное прохождение всего теста! 🎉</span>
              )}
              {!isPerfect && (
                <span className="bonus-hint">💡 Пройдите весь тест без ошибок и получите +50 XP бонуса!</span>
              )}
            </div>

            <h3>📋 Разбор ответов</h3>
            <div className="answers-list">
              {userAnswers.map((answer, index) => {
                const question = questions.find(q => q.id === answer.questionId);
                return (
                  <div key={index} className={`answer-item ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="answer-question">
                      <span className="question-number">Вопрос {index + 1}</span>
                      {question?.question}
                    </div>
                    <div className="answer-user">
                      <span className="answer-label">Ваш ответ:</span> {answer.selectedOption || 'Не выбран'}
                    </div>
                    <div className="answer-status">
                      {answer.isCorrect ? '✓ Верно! +10 XP' : '✗ Неверно! 0 XP'}
                    </div>
                    {answer.isCorrect && answer.explanation && (
                      <div className="answer-explanation">
                        <strong>💡 Пояснение:</strong> {answer.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button className="retake-quiz-button" onClick={handleRetakeQuiz}>
              🔄 Пройти тест заново
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="quiz-page">Загрузка вопросов...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const percentageProgress = ((currentQuestionIndex) / questions.length) * 100;

  return (
    <div className="quiz-page">
      <div className="quiz-content">
        <h2>Тест по курсу «{courseTitle}»</h2>
        <p className="quiz-description">Проверьте свои знания! Для прохождения необходимо набрать 70%.</p>
        
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-title">Ваш прогресс</span>
            <span className="progress-score">{currentQuestionIndex} / {questions.length}</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${percentageProgress}%` }}></div>
          </div>
          <div className="progress-percent">{Math.round(percentageProgress)}%</div>
        </div>

        <Quiz
          question={currentQuestion}
          pageNumber={currentQuestionIndex + 1}
          totalPages={questions.length}
          onAnswer={handleAnswerQuestion}
          onNext={handleNextQuestion}
          onFinish={handleFinishQuiz}
          isLastQuestion={isLastQuestion}
        />
      </div>
    </div>
  );
};

export default QuizPage;