import { Play, Question } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { fadeUpVariants, staggerContainerVariants } from '../motion.js';
import './KahootPage.css';

function KahootPage() {
  const { quizzes } = useData();

  return (
    <section className="kahoot-page" aria-labelledby="kahoot-heading">
      <header className="kahoot-page__header">
        <p className="kahoot-page__eyebrow">Bilimingizni sinab ko‘ring</p>
        <h1 className="page-heading" id="kahoot-heading">Kahoot testlari</h1>
        <p className="kahoot-page__intro">Mavzuni tanlab, testni oching.</p>
      </header>

      <motion.div
        className="kahoot-grid"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {quizzes.map((quiz) => (
          <motion.article
            className="kahoot-card"
            key={quiz.id}
            variants={fadeUpVariants}
          >
            <div className="kahoot-card__icon" aria-hidden="true">
              <Question size={25} weight="regular" />
            </div>
            <p className="kahoot-card__eyebrow">Interaktiv test</p>
            <h2 className="kahoot-card__title">{quiz.title}</h2>
            <p className="kahoot-card__description">{quiz.description}</p>
            <div className="kahoot-card__footer">
              {quiz.kahootUrl ? (
                <>
                  <span className="kahoot-card__count">Kahoot sayti</span>
                  <a
                    className="kahoot-card__start"
                    href={quiz.kahootUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Play size={17} weight="fill" aria-hidden="true" />
                    Kahoot’da ochish
                  </a>
                </>
              ) : (
                <>
                  <span className="kahoot-card__count">
                    {quiz.questions?.length ?? 0} ta savol
                  </span>
                  <Link className="kahoot-card__start" to={`/quiz/${quiz.id}`}>
                    <Play size={17} weight="fill" aria-hidden="true" />
                    Testni boshlash
                  </Link>
                </>
              )}
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

export default KahootPage;
