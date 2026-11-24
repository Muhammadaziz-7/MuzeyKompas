import { useMemo } from 'react';
import {
  ArrowRight,
  ClipboardText,
  GraduationCap,
  Bank,
  Medal,
  Notebook,
  Trophy,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { getPortfolioData } from '../services/portfolioService.js';
import { fadeUpVariants, staggerContainerVariants } from '../motion.js';
import './DashboardPage.css';

const statistics = [
  {
    label: 'Jami eksponatlar',
    value: '03',
    detail: 'Muzey to‘plamida',
    icon: Bank,
    tone: 'indigo',
  },
  {
    label: 'Faol topshiriqlar',
    value: '01',
    detail: 'Bilimingizni sinab ko‘ring',
    icon: ClipboardText,
    tone: 'amber',
  },
  {
    label: 'Talabalar bilimi',
    value: '86%',
    detail: 'O‘rtacha o‘zlashtirish',
    icon: GraduationCap,
    tone: 'green',
  },
];

function DashboardPage() {
  const { userName, userData, logout } = useAuth();
  const { curatorExhibits } = useData();
  const portfolio = useMemo(
    () => getPortfolioData(userName, curatorExhibits, userData),
    [curatorExhibits, userData, userName],
  );

  function handleLogout() {
    logout();
  }

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-heading">
      <header className="dashboard-welcome">
        <div className="dashboard-welcome__content">
          <p className="dashboard-welcome__eyebrow">Muzey Kompas</p>
          <h1 className="dashboard-welcome__title" id="dashboard-heading">
            {userName ? `Salom, ${userName}!` : 'Xush kelibsiz!'}
          </h1>
          <p className="dashboard-welcome__description">
            {userName
              ? 'Bugungi vazifalaringiz: tarixiy eksponatlarni o‘rganing va bilimlaringizni sinang.'
              : 'Tarixiy eksponatlarni o‘rganing va bilimlaringizni qiziqarli testlar orqali sinang.'}
          </p>
          {userName && (
            <button
              className="dashboard-logout"
              type="button"
              onClick={handleLogout}
            >
              Tizimdan chiqish
            </button>
          )}
          <div className="dashboard-welcome__actions">
            <Link className="dashboard-action dashboard-action--primary" to="/museum">
              Muzeyga o‘tish
              <ArrowRight size={17} weight="regular" aria-hidden="true" />
            </Link>
            <Link className="dashboard-action dashboard-action--secondary" to="/quiz">
              Testni boshlash
              <ArrowRight size={17} weight="regular" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="dashboard-welcome__decoration" aria-hidden="true">
          <Bank size={94} weight="light" />
        </div>
      </header>

      <section className="dashboard-statistics" aria-labelledby="statistics-heading">
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-section-heading__eyebrow">Umumiy ko‘rinish</p>
            <h2 id="statistics-heading">Sizning statistikangiz</h2>
          </div>
        </div>
        <motion.div
          className="dashboard-statistics__grid"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {statistics.map(({ label, value, detail, icon: Icon, tone }) => (
            <motion.article
              className="statistics-card"
              key={label}
              variants={fadeUpVariants}
            >
              <div className={`statistics-card__icon statistics-card__icon--${tone}`}>
                <Icon size={21} weight="regular" aria-hidden="true" />
              </div>
              <p className="statistics-card__label">{label}</p>
              <p className="statistics-card__value">{value}</p>
              <p className="statistics-card__detail">{detail}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="portfolio-section" aria-labelledby="portfolio-heading">
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-section-heading__eyebrow">Shaxsiy yutuqlar</p>
            <h2 id="portfolio-heading">Mening Natijalarim</h2>
          </div>
          {portfolio?.isCertificateEligible && (
            <Link className="portfolio-certificate-link" to="/certificate">
              <Medal size={18} weight="regular" aria-hidden="true" />
              Sertifikat olish
            </Link>
          )}
        </div>

        {portfolio && (
          <>
            <motion.div
              className="portfolio-summary"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.article className="portfolio-stat" variants={fadeUpVariants}>
                <Trophy size={20} weight="regular" aria-hidden="true" />
                <span>Testlarda to‘plangan ball</span>
                <strong>
                  {portfolio.totalScore} / {portfolio.totalPossibleScore}
                </strong>
              </motion.article>
              <motion.article className="portfolio-stat" variants={fadeUpVariants}>
                <Notebook size={20} weight="regular" aria-hidden="true" />
                <span>Tahlil qilingan eksponatlar</span>
                <strong>{portfolio.analyzedExhibitCount} ta</strong>
              </motion.article>
              <motion.article className="portfolio-stat" variants={fadeUpVariants}>
                <Bank size={20} weight="regular" aria-hidden="true" />
                <span>Yaratilgan eksponatlar</span>
                <strong>{portfolio.createdExhibitCount} ta</strong>
              </motion.article>
            </motion.div>

            <div className="portfolio-results">
              <div className="portfolio-results__heading">
                <h3>Testlar natijasi</h3>
                {portfolio.quizResults.length > 0 && (
                  <span>O‘rtacha: {portfolio.averagePercentage}%</span>
                )}
              </div>
              {portfolio.quizResults.length === 0 ? (
                <p className="portfolio-empty">
                  Testni yakunlaganingizdan so‘ng ballaringiz shu yerda ko‘rinadi.
                </p>
              ) : (
                <ul className="portfolio-results__list">
                  {portfolio.quizResults.map((result) => {
                    const percentage = Math.round((result.score / result.total) * 100);
                    return (
                      <li className="portfolio-result" key={result.id}>
                        <span className="portfolio-result__icon">
                          <ClipboardText size={18} weight="regular" aria-hidden="true" />
                        </span>
                        <span className="portfolio-result__name">
                          <strong>{result.quizTitle}</strong>
                          <small>
                            {new Date(result.completedAt).toLocaleDateString('uz-UZ')}
                          </small>
                        </span>
                        <span className="portfolio-result__score">
                          {result.score} / {result.total}
                          <small>{percentage}%</small>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {portfolio.quizResults.length > 0 && !portfolio.isCertificateEligible && (
                <p className="portfolio-certificate-hint">
                  Sertifikat uchun o‘rtacha natijangiz kamida 80% bo‘lishi kerak.
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </section>
  );
}

export default DashboardPage;
