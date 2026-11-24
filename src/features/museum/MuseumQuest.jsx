import { useMemo, useState } from 'react';
import {
  ArrowCounterClockwise,
  ArrowRight,
  Check,
  Sparkle,
  Trophy,
  X,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { combineMuseumExhibits } from '../../services/museumService.js';
import { useData } from '../../context/DataContext.jsx';
import './MuseumQuest.css';

const QUESTION_ORDER = [0, 1, 2, 0, 1];
const POINTS_PER_ANSWER = 10;

function MuseumQuest() {
  const { exhibits: museumExhibits, curatorExhibits } = useData();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedExhibitId, setSelectedExhibitId] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const exhibits = useMemo(
    () => combineMuseumExhibits(museumExhibits, curatorExhibits),
    [curatorExhibits, museumExhibits],
  );
  const error = exhibits.length < 3
    ? 'O‘yinni boshlash uchun kamida 3 ta eksponat kerak.'
    : '';

  const rounds = useMemo(
    () => QUESTION_ORDER.map((exhibitIndex) => ({
      exhibit: exhibits[exhibitIndex],
      options: exhibits.slice(0, 3),
    })),
    [exhibits],
  );
  const currentRound = rounds[questionIndex];
  const isCorrect = currentRound?.exhibit
    ? selectedExhibitId === currentRound.exhibit.id
    : false;

  function chooseExhibit(exhibitId) {
    if (selectedExhibitId !== null || !currentRound) {
      return;
    }

    setSelectedExhibitId(exhibitId);
    if (exhibitId === currentRound.exhibit.id) {
      setScore((currentScore) => currentScore + POINTS_PER_ANSWER);
    }
  }

  function continueGame() {
    if (questionIndex === QUESTION_ORDER.length - 1) {
      setIsFinished(true);
      return;
    }

    setQuestionIndex((index) => index + 1);
    setSelectedExhibitId(null);
  }

  function restartGame() {
    setQuestionIndex(0);
    setSelectedExhibitId(null);
    setScore(0);
    setIsFinished(false);
  }

  if (error) {
    return <p className="museum-quest__error" role="alert">{error}</p>;
  }

  if (isFinished) {
    return (
      <section className="museum-quest museum-quest--result" aria-live="polite">
        <div className="museum-quest__trophy">
          <Trophy size={36} weight="regular" aria-hidden="true" />
        </div>
        <p className="museum-quest__eyebrow">O‘yin yakunlandi</p>
        <h1 className="museum-quest__result-title">Ajoyib, izquvar!</h1>
        <p className="museum-quest__result-score">
          5 ta savoldan <strong>{score} / 50 ball</strong> to‘pladingiz
        </p>
        <div
          className="museum-quest__score-track"
          role="progressbar"
          aria-label="Yig‘ilgan ball"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={50}
        >
          <span style={{ width: `${(score / 50) * 100}%` }} />
        </div>
        <button className="museum-quest__restart" type="button" onClick={restartGame}>
          <ArrowCounterClockwise size={17} weight="regular" aria-hidden="true" />
          Qaytadan o‘ynash
        </button>
      </section>
    );
  }

  return (
    <section className="museum-quest" aria-labelledby="museum-quest-title">
      <header className="museum-quest__header">
        <div className="museum-quest__brand">
          <span className="museum-quest__brand-icon">
            <Sparkle size={18} weight="regular" aria-hidden="true" />
          </span>
          <span>Eksponat izquvari</span>
        </div>
        <span className="museum-quest__counter">
          Savol <strong>{questionIndex + 1}</strong> / {QUESTION_ORDER.length}
        </span>
      </header>

      <div
        className="museum-quest__progress"
        role="progressbar"
        aria-label="O‘yin jarayoni"
        aria-valuenow={questionIndex + (selectedExhibitId !== null ? 1 : 0)}
        aria-valuemin={0}
        aria-valuemax={QUESTION_ORDER.length}
      >
        <span
          style={{
            width: `${((questionIndex + (selectedExhibitId !== null ? 1 : 0)) / QUESTION_ORDER.length) * 100}%`,
          }}
        />
      </div>

      <motion.div
        className="museum-quest__content"
        key={questionIndex}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <p className="museum-quest__eyebrow">Rasmga qarang va eksponatni toping</p>
        <div className="museum-quest__clue">
          <img
            className={`museum-quest__image${isCorrect ? ' museum-quest__image--revealed' : ''}`}
            src={currentRound.exhibit.image}
            alt={isCorrect ? currentRound.exhibit.title : 'Yashirilgan muzey eksponati'}
          />
          <p className="museum-quest__description">{currentRound.exhibit.description}</p>
        </div>

        <h1 className="museum-quest__question" id="museum-quest-title">
          Bu qaysi eksponat?
        </h1>
        <div className="museum-quest__options">
          {currentRound.options.map((exhibit, index) => {
            const isSelected = selectedExhibitId === exhibit.id;
            const isAnswer = exhibit.id === currentRound.exhibit.id;
            let stateClass = '';
            if (selectedExhibitId !== null && isAnswer) {
              stateClass = ' museum-quest__option--correct';
            } else if (isSelected && !isAnswer) {
              stateClass = ' museum-quest__option--incorrect';
            }

            return (
              <button
                className={`museum-quest__option${stateClass}`}
                key={exhibit.id}
                type="button"
                onClick={() => chooseExhibit(exhibit.id)}
                disabled={selectedExhibitId !== null}
                aria-pressed={isSelected}
              >
                <span className="museum-quest__option-letter">{String.fromCharCode(65 + index)}</span>
                <span>{exhibit.title}</span>
                {selectedExhibitId !== null && isAnswer && (
                  <Check className="museum-quest__option-icon" size={18} weight="regular" aria-label="To‘g‘ri javob" />
                )}
                {isSelected && !isAnswer && (
                  <X className="museum-quest__option-icon" size={18} weight="regular" aria-label="Noto‘g‘ri javob" />
                )}
              </button>
            );
          })}
        </div>

        {selectedExhibitId !== null && (
          <div
            className={`museum-quest__feedback ${
              isCorrect
                ? 'museum-quest__feedback--correct'
                : 'museum-quest__feedback--incorrect'
            }`}
            role="status"
          >
            {isCorrect
              ? 'To‘g‘ri topdingiz! +10 ball'
              : 'Noto‘g‘ri tanlov. To‘g‘ri javob yashil rangda ko‘rsatildi.'}
          </div>
        )}

        <footer className="museum-quest__footer">
          <span className="museum-quest__score">Jami ball: {score}</span>
          {selectedExhibitId !== null && (
            <button className="museum-quest__next" type="button" onClick={continueGame}>
              {questionIndex === QUESTION_ORDER.length - 1 ? 'Natijani ko‘rish' : 'Keyingi savol'}
              <ArrowRight size={17} weight="regular" aria-hidden="true" />
            </button>
          )}
        </footer>
      </motion.div>
    </section>
  );
}

export default MuseumQuest;
