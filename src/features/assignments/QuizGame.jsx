import { useState } from 'react';
import {
  ArrowCounterClockwise,
  ArrowRight,
  Check,
  Sparkle,
  Trophy,
  X,
} from '@phosphor-icons/react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { getRelatedMaterialsForQuiz } from '../../services/relatedMaterialsService.js';
import './QuizGame.css';

function createQuizResult(quiz, score, total) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    quizId: quiz.id,
    quizTitle: quiz.title,
    score,
    total,
    completedAt: new Date().toISOString(),
  };
}

function QuizGame() {
  const { quizId } = useParams();
  const { quizzes } = useData();
  const quiz = quizId
    ? quizzes.find((item) => String(item.id) === quizId)
    : quizzes.find((item) => item.id === 'museum-history');
  const questions = quiz?.questions ?? [];
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(
    () => Array(questions.length).fill(null),
  );
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [completionSaveError, setCompletionSaveError] = useState('');
  const { saveQuizResult } = useAuth();

  if (!quiz) {
    return (
      <section className="quiz-game quiz-game--result" aria-live="polite">
        <p className="quiz-game__eyebrow">Test topilmadi</p>
        <h1 className="quiz-result__title">Bu test mavjud emas</h1>
        <Link className="quiz-game__restart" to="/kahoot">Testlar katalogiga qaytish</Link>
      </section>
    );
  }

  if (quiz.kahootUrl) {
    return (
      <section className="quiz-game quiz-game--result">
        <p className="quiz-game__eyebrow">Kahoot testi</p>
        <h1 className="quiz-result__title">{quiz.title}</h1>
        <p className="quiz-result__score">{quiz.description}</p>
        <a className="quiz-game__restart" href={quiz.kahootUrl} target="_blank" rel="noreferrer">
          Kahoot’da ochish
        </a>
        <Link className="quiz-game__restart" to="/kahoot">Testlar katalogiga qaytish</Link>
      </section>
    );
  }

  const question = questions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];
  const progress = isFinished ? 100 : (currentQuestion / questions.length) * 100;

  function handleAnswer(optionIndex) {
    if (selectedAnswer !== null) {
      return;
    }

    setSelectedAnswers((answers) =>
      answers.map((answer, index) => (
        index === currentQuestion ? optionIndex : answer
      )),
    );

    if (optionIndex === question.answer) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  async function handleContinue() {
    if (currentQuestion === questions.length - 1) {
      try {
        await saveQuizResult(createQuizResult(quiz, score, questions.length));
        setCompletionSaveError('');
      } catch (error) {
        setCompletionSaveError(
          error instanceof Error
            ? error.message
            : 'Test yakunlandi, ammo natijani saqlashda xatolik yuz berdi.',
        );
      }
      setIsFinished(true);
      return;
    }

    setCurrentQuestion((index) => index + 1);
  }

  function handleRestart() {
    setCurrentQuestion(0);
    setSelectedAnswers(Array(questions.length).fill(null));
    setScore(0);
    setIsFinished(false);
    setCompletionSaveError('');
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <section className="quiz-game quiz-game--result" aria-live="polite">
        <div className="quiz-result__icon">
          <Trophy size={34} weight="regular" aria-hidden="true" />
        </div>
        <p className="quiz-game__eyebrow">Test yakunlandi</p>
        <h2 className="quiz-result__title">
          {score === questions.length ? 'Ajoyib natija!' : 'Yaxshi harakat!'}
        </h2>
        <p className="quiz-result__score">
          {questions.length} ta savoldan <strong>{score} tasi</strong> to‘g‘ri
        </p>
        <div
          className="quiz-result__progress"
          role="progressbar"
          aria-label="Test natijasi"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${percentage}%` }} />
        </div>
        <p className="quiz-result__percentage">{percentage}%</p>
        {completionSaveError && (
          <p className="quiz-result__percentage" role="alert">{completionSaveError}</p>
        )}
        <section className="quiz-result__recommendations" aria-labelledby="quiz-recommendations-heading">
          <h3 id="quiz-recommendations-heading">Keyingi qadam</h3>
          <p>Mavzuni ma’ruza va taqdimot orqali yanada chuqurroq o‘rganing.</p>
          <div className="quiz-result__recommendation-links">
            {getRelatedMaterialsForQuiz(quiz.id)
              .filter((material) => material.id !== 'quiz')
              .map((material) => (
                <Link
                  className="quiz-result__recommendation"
                  key={material.id}
                  to={material.to}
                >
                  <span>{material.title}</span>
                  <strong>{material.itemTitle}</strong>
                  <span>{material.label}</span>
                </Link>
              ))}
          </div>
        </section>
        <button className="quiz-game__restart" type="button" onClick={handleRestart}>
          <ArrowCounterClockwise size={17} weight="regular" aria-hidden="true" />
          Qaytadan boshlash
        </button>
      </section>
    );
  }

  return (
    <section className="quiz-game" aria-labelledby="quiz-title">
      <header className="quiz-game__header">
        <div className="quiz-game__brand">
          <span className="quiz-game__brand-icon">
            <Sparkle size={18} weight="regular" aria-hidden="true" />
          </span>
          <span>{quiz.title}</span>
        </div>
        <span className="quiz-game__counter">
          Savol <strong>{currentQuestion + 1}</strong> / {questions.length}
        </span>
      </header>

      <div
        className="quiz-game__progress"
        role="progressbar"
        aria-label="Test jarayoni"
        aria-valuenow={currentQuestion}
        aria-valuemin={0}
        aria-valuemax={questions.length}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-game__content">
        <p className="quiz-game__eyebrow">{quiz.title}</p>
        <h2 className="quiz-game__question" id="quiz-title">{question.question}</h2>

        <div className="quiz-game__options">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = question.answer === index;
            let stateClass = '';

            if (selectedAnswer !== null && isCorrect) {
              stateClass = ' quiz-game__option--correct';
            } else if (isSelected && !isCorrect) {
              stateClass = ' quiz-game__option--incorrect';
            }

            return (
              <button
                className={`quiz-game__option${stateClass}`}
                key={option}
                type="button"
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                aria-pressed={isSelected}
              >
                <span className="quiz-game__option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
                {selectedAnswer !== null && isCorrect && (
                  <Check className="quiz-game__option-result" size={19} weight="regular" aria-label="To‘g‘ri" />
                )}
                {isSelected && !isCorrect && (
                  <X className="quiz-game__option-result" size={19} weight="regular" aria-label="Noto‘g‘ri" />
                )}
              </button>
            );
          })}
        </div>

        {selectedAnswer !== null && (
          <div
            className={`quiz-game__feedback ${
              selectedAnswer === question.answer
                ? 'quiz-game__feedback--correct'
                : 'quiz-game__feedback--incorrect'
            }`}
            role="status"
          >
            {selectedAnswer === question.answer
              ? 'To‘g‘ri javob! Barakalla.'
              : `Bu safar noto‘g‘ri. To‘g‘ri javob: ${question.options[question.answer]}`}
          </div>
        )}

        <footer className="quiz-game__footer">
          <span className="quiz-game__score">Natija: {score} / {questions.length}</span>
          {selectedAnswer !== null && (
            <button className="quiz-game__continue" type="button" onClick={handleContinue}>
              {currentQuestion === questions.length - 1 ? 'Natijani ko‘rish' : 'Keyingi savol'}
              <ArrowRight size={17} weight="regular" aria-hidden="true" />
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}

export default QuizGame;
