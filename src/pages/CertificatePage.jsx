import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Printer, Scroll, Sparkle } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { getPortfolioData } from '../services/portfolioService.js';
import './CertificatePage.css';

function CertificatePage() {
  const { userName, userData } = useAuth();
  const { curatorExhibits } = useData();
  const [issueDate] = useState(() => new Date().toLocaleDateString('uz-UZ'));
  const portfolio = useMemo(
    () => getPortfolioData(userName, curatorExhibits, userData),
    [curatorExhibits, userData, userName],
  );

  useEffect(() => {
    document.body.classList.add('certificate-print-mode');
    return () => document.body.classList.remove('certificate-print-mode');
  }, []);

  if (!portfolio) {
    return <p className="certificate-page__message" role="status">Sertifikat tayyorlanmoqda...</p>;
  }

  if (!portfolio.isCertificateEligible) {
    return (
      <section className="certificate-page">
        <p className="certificate-page__message">
          Sertifikat olish uchun testlar bo‘yicha o‘rtacha natija kamida 80% bo‘lishi kerak.
        </p>
        <Link className="certificate-page__back" to="/">
          <ArrowLeft size={17} weight="regular" aria-hidden="true" />
          Dashboardga qaytish
        </Link>
      </section>
    );
  }

  return (
    <section className="certificate-page" aria-labelledby="certificate-title">
      <div className="certificate-page__actions">
        <Link className="certificate-page__back" to="/">
          <ArrowLeft size={17} weight="regular" aria-hidden="true" />
          Dashboardga qaytish
        </Link>
        <button className="certificate-page__print" type="button" onClick={() => window.print()}>
          <Printer size={17} weight="regular" aria-hidden="true" />
          Chop etish
        </button>
      </div>

      <article className="certificate" aria-label="Muzey Pedagogikasi sertifikati">
        <div className="certificate__inner">
          <div className="certificate__mark" aria-hidden="true">
            <Scroll size={27} weight="light" />
          </div>
          <p className="certificate__eyebrow">Muzey Kompas ta’lim platformasi</p>
          <h1 className="certificate__title" id="certificate-title">Sertifikat</h1>
          <p className="certificate__subtitle">MUZEY PEDAGOGIKASI</p>
          <p className="certificate__intro">Ushbu sertifikat taqdim etiladi</p>
          <p className="certificate__name">{userName || 'Mehmon'}</p>
          <p className="certificate__description">
            muzey pedagogikasi bo‘yicha bilim va ko‘nikmalarni namoyon etib,
            quyidagi yutuqlarga erishgani uchun:
          </p>

          <div className="certificate__achievements">
            <div>
              <strong>{portfolio.totalScore} / {portfolio.totalPossibleScore}</strong>
              <span>test ballari</span>
            </div>
            <div>
              <strong>{portfolio.analyzedExhibitCount}</strong>
              <span>tahlil qilingan eksponat</span>
            </div>
            <div>
              <strong>{portfolio.createdExhibitCount}</strong>
              <span>yaratilgan eksponat</span>
            </div>
          </div>

          <p className="certificate__average">
            O‘rtacha natija: <strong>{portfolio.averagePercentage}%</strong>
          </p>
          <div className="certificate__footer">
            <span>{issueDate}</span>
            <span className="certificate__seal" aria-label="Muzey Kompas">
              <Sparkle size={18} weight="regular" aria-hidden="true" />
              MUZEY KOMPAS
            </span>
            <span className="certificate__signature">Muzey Kompas jamoasi</span>
          </div>
        </div>
      </article>
    </section>
  );
}

export default CertificatePage;
