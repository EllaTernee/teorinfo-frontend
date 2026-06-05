// src/components/Quiz.tsx
import React, { useState } from 'react';
import '../styles/QuizPage.css'; 

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizProps {
  question: Question;
  pageNumber: number;
  totalPages: number;
  onAnswer: (selectedOption: string | null, isCorrect: boolean) => void;
  onNext: () => void;
  onFinish: () => void;
  isLastQuestion: boolean;
}

const Quiz: React.FC<QuizProps> = ({
  question,
  pageNumber,
  totalPages,
  onAnswer,
  onNext,
  onFinish,
  isLastQuestion,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleOptionChange = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    const correct = selectedOption === question.answer;
    setIsCorrect(correct);
    setIsAnswered(true);
    onAnswer(selectedOption, correct);
  };

  const handleNext = () => {
    setIsAnswered(false);
    setSelectedOption(null);
    if (isLastQuestion) {
      onFinish();
    } else {
      onNext();
    }
  };

  const showResult = isAnswered && selectedOption !== null;

  return (
    <div className="quiz">
      <div className="quiz-header">
        <div className="quiz-progress">
          Вопрос {pageNumber} из {totalPages}
        </div>
        <h3>{question.question}</h3>
      </div>

      <div className="options">
        {question.options.map((option, index) => {
          let optionClass = '';
          if (showResult) {
            if (option === question.answer) {
              optionClass = 'option-correct';
            } else if (option === selectedOption && option !== question.answer) {
              optionClass = 'option-wrong';
            }
          }
          
          return (
            <div key={index} className={`option ${optionClass}`}>
              <label>
                <input
                  type="radio"
                  name="option"
                  value={option}
                  checked={selectedOption === option}
                  onChange={() => handleOptionChange(option)}
                  disabled={isAnswered}
                />
                {option}
              </label>
            </div>
          );
        })}
      </div>

      {!isAnswered ? (
        <button className="quiz-button" onClick={handleSubmit} disabled={!selectedOption}>
          Ответить
        </button>
      ) : (
        <div className="quiz-result">
          <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '✅ Верно!' : '❌ Неверно!'}
          </div>
          {question.explanation && (
            <div className="result-explanation">
              <strong>📖 Пояснение:</strong> {question.explanation}
            </div>
          )}
          <button className="quiz-button next-button" onClick={handleNext}>
            {isLastQuestion ? 'Завершить тест' : 'Следующий вопрос →'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;