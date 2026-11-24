import { useState } from 'react';
import {
  ArrowCounterClockwise,
  CalendarBlank,
  ArrowSquareOut,
  Check,
  FileText,
  Paperclip,
  Trophy,
  X,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { fadeUpVariants, staggerContainerVariants } from '../motion.js';
import { useData } from '../context/DataContext.jsx';
import './AssignmentsPage.css';

const sampleAssignments = [
  {
    title: 'Muzey pedagogikasi keysi - 1-topshiriq',
    description: 'Eksponat asosida o‘quvchilar uchun qisqa interaktiv mashg‘ulot loyihasi.',
  },
  {
    title: 'Eksponat tahlili - 2-topshiriq',
    description: 'Tarixiy buyumning vazifasi, davri va ta’limiy imkoniyatlarini tahlil qiling.',
  },
  {
    title: 'Muzey bo‘ylab ta’limiy yo‘nalish - 3-topshiriq',
    description: 'Bir-biri bilan bog‘liq eksponatlar uchun qisqa o‘quv yo‘nalishini tuzing.',
  },
];

function AssignmentsPage() {
  const { assignments, quizzes } = useData();
  const questions = quizzes
    .filter((quiz) => !quiz.kahootUrl)
    .flatMap((quiz) => (quiz.questions ?? []).map((question) => ({
      ...question,
      topic: quiz.title,
    })))
    .filter((question) => (
      typeof question.question === 'string'
      && Array.isArray(question.options)
      && Number.isInteger(question.answer)
      && question.answer >= 0
      && question.answer < question.options.length
    ))
    .slice(0, 10);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);

  function handleQuizSubmit(event) {
    event.preventDefault();
    setScore(questions.reduce(
      (correctAnswers, question, index) => (
        correctAnswers + Number(answers[index] === question.answer)
      ),
      0,
    ));
  }

  function handleQuizReset() {
    setAnswers([]);
    setScore(null);
  }

  return (
    <section className="assignments-page" aria-labelledby="assignments-heading">
      <header className="assignments-page__header">
        <p className="assignments-page__eyebrow">O‘quv jarayoni</p>
        <h1 className="page-heading" id="assignments-heading">Topshiriqlar</h1>
        <p className="assignments-page__intro">
          Savollarga javob bering yoki o‘qituvchi bergan topshiriq havolasini oching. Fayl yuklash shart emas.
        </p>
      </header>

      <section className="assignment-quiz" aria-labelledby="assignment-quiz-heading">
        <div className="assignment-quiz__heading">
          <div>
            <p className="assignments-page__eyebrow">Bilimingizni tekshiring</p>
            <h2 id="assignment-quiz-heading">10 savolli test</h2>
            <p>Barcha savollarga javob berib, natijangizni ko‘ring.</p>
          </div>
          <span className="assignment-quiz__count">{questions.length} ta savol</span>
        </div>

        {questions.length === 10 ? (
          <form className="assignment-quiz__form" onSubmit={handleQuizSubmit}>
            <ol className="assignment-quiz__questions">
              {questions.map((question, questionIndex) => (
                <li className="assignment-quiz__question" key={`${question.topic}-${questionIndex}`}>
                  <fieldset>
                    <legend>
                      <span className="assignment-quiz__topic">{question.topic}</span>
                      <span>{question.question}</span>
                    </legend>
                    <div className="assignment-quiz__options">
                      {question.options.map((option, optionIndex) => {
                        const isCorrect = score !== null && optionIndex === question.answer;
                        const isIncorrect = score !== null
                          && answers[questionIndex] === optionIndex
                          && optionIndex !== question.answer;
                        const stateClass = isCorrect
                          ? ' assignment-quiz__option--correct'
                          : isIncorrect
                            ? ' assignment-quiz__option--incorrect'
                            : '';

                        return (
                          <label
                            className={`assignment-quiz__option${stateClass}`}
                            key={option}
                          >
                            <input
                              type="radio"
                              name={`assignment-question-${questionIndex}`}
                              value={optionIndex}
                              checked={answers[questionIndex] === optionIndex}
                              onChange={() => setAnswers((current) => {
                                const next = [...current];
                                next[questionIndex] = optionIndex;
                                return next;
                              })}
                              disabled={score !== null}
                              required
                            />
                            <span>{option}</span>
                            {isCorrect && <Check size={18} weight="bold" aria-label="To‘g‘ri javob" />}
                            {isIncorrect && <X size={18} weight="bold" aria-label="Noto‘g‘ri javob" />}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </li>
              ))}
            </ol>

            {score !== null && (
              <p className="assignment-quiz__result" role="status" aria-live="polite">
                <Trophy size={20} weight="regular" aria-hidden="true" />
                Natijangiz: <strong>{score} / {questions.length}</strong>
              </p>
            )}

            <div className="assignment-quiz__actions">
              {score === null ? (
                <button className="assignment-quiz__submit" type="submit">
                  Natijani ko‘rish
                </button>
              ) : (
                <button className="assignment-quiz__submit" type="button" onClick={handleQuizReset}>
                  <ArrowCounterClockwise size={17} weight="regular" aria-hidden="true" />
                  Qaytadan ishlash
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="assignment-quiz__empty" role="status">
            Test uchun hozircha 10 ta savol mavjud emas.
          </p>
        )}
      </section>

      {assignments.length > 0 && (
        <section className="sample-assignments" aria-labelledby="teacher-assignments-heading">
          <div className="assignment-section-heading sample-assignments__heading">
            <div>
              <p className="assignments-page__eyebrow">O‘qituvchi tomonidan</p>
              <h2 id="teacher-assignments-heading">Yangi topshiriqlar</h2>
            </div>
          </div>
          <motion.div
            className="sample-assignments__list"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {assignments.map((assignment) => (
              <motion.article
                className="sample-assignment"
                key={assignment.id}
                variants={fadeUpVariants}
              >
                <span className="sample-assignment__icon" aria-hidden="true">
                  <FileText size={20} weight="regular" />
                </span>
                <div className="sample-assignment__details">
                  <h3>{assignment.title}</h3>
                  <p>{assignment.description}</p>
                  <div className="teacher-assignment__metadata">
                    {assignment.dueDate && (
                      <span>
                        <CalendarBlank size={15} weight="regular" aria-hidden="true" />
                        Muddat: {new Intl.DateTimeFormat('uz-UZ', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }).format(new Date(`${assignment.dueDate}T00:00:00`))}
                      </span>
                    )}
                    {assignment.fileName && (
                      <span>
                        <Paperclip size={15} weight="regular" aria-hidden="true" />
                        {assignment.fileName}
                      </span>
                    )}
                  </div>
                </div>
                {assignment.fileUrl && (
                  <a
                    className="sample-assignment__download"
                    href={assignment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowSquareOut size={17} weight="regular" aria-hidden="true" />
                    <span>Havolani ochish</span>
                  </a>
                )}
              </motion.article>
            ))}
          </motion.div>
        </section>
      )}

      <section className="sample-assignments" aria-labelledby="sample-assignments-heading">
        <div className="assignment-section-heading sample-assignments__heading">
          <div>
            <p className="assignments-page__eyebrow">O‘qituvchi materiallari</p>
            <h2 id="sample-assignments-heading">Namunaviy topshiriqlar</h2>
          </div>
        </div>

        <motion.div
          className="sample-assignments__list"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {sampleAssignments.map((assignment) => (
            <motion.article
              className="sample-assignment"
              key={assignment.title}
              variants={fadeUpVariants}
            >
              <span className="sample-assignment__icon"><FileText size={20} weight="regular" aria-hidden="true" /></span>
              <div className="sample-assignment__details">
                <h3>{assignment.title}</h3>
                <p>{assignment.description}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>
    </section>
  );
}

export default AssignmentsPage;
