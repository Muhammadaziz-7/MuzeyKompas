import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Bank, Check, GraduationCap, Trash } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { fadeUpVariants, staggerContainerVariants } from '../motion.js';
import LoadingState from '../components/ui/LoadingState.jsx';
import { getStudentCount } from '../services/userService.js';
import './TeacherDashboard.css';

function TeacherDashboard() {
  const { userName, userRole, userData, isAuthReady, isAdmin } = useAuth();
  const { curatorExhibits: exhibits, updateCuratorExhibit, deleteCuratorExhibit } = useData();
  const [studentsCount, setStudentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isAuthReady || userRole !== 'teacher') {
      return;
    }

    let active = true;
    getStudentCount()
      .then((count) => {
        if (active) {
          setStudentsCount(count);
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? `Statistikani Firestore’dan yuklab bo‘lmadi: ${loadError.message}`
              : 'Talabalar sonini Firestore’dan o‘qib bo‘lmadi.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthReady, userRole]);

  async function updateExhibit(exhibitId, action) {
    try {
      const selectedExhibit = exhibits.find((exhibit) => String(exhibit.id) === String(exhibitId));
      if (!selectedExhibit) {
        throw new Error('Eksponat topilmadi. Sahifani yangilang.');
      }

      if (action === 'approve') {
        await updateCuratorExhibit(exhibitId, { status: 'approved' });
      } else {
        await deleteCuratorExhibit(exhibitId);
      }
      setError('');
      setNotice(
        action === 'approve'
          ? 'Eksponat tasdiqlandi va asosiy muzeyga qo‘shildi.'
          : 'Eksponat rad etildi va o‘chirildi.',
      );
    } catch (actionError) {
      setNotice('');
      setError(
        actionError instanceof Error
          ? `Amalni bajarib bo‘lmadi: ${actionError.message}`
          : 'Eksponat holatini yangilab bo‘lmadi.',
      );
    }
  }

  if (!isAuthReady) {
    return <LoadingState label="Hisob tekshirilmoqda..." />;
  }

  if (!userName || userRole !== 'teacher') {
    return <Navigate to="/" replace />;
  }

  const statistics = [
    { label: 'Jami talabalar', value: studentsCount, icon: GraduationCap, tone: 'blue' },
    { label: 'Yaratilgan eksponatlar soni', value: exhibits.length, icon: Bank, tone: 'gold' },
    {
      label: 'Yechilgan testlar soni',
      value: userData.settings?.quizCompletions ?? userData.quizResults?.length ?? 0,
      icon: Check,
      tone: 'green',
    },
  ];

  return (
    <section className="teacher-dashboard" aria-labelledby="teacher-dashboard-heading">
      <header className="teacher-dashboard__header">
        <p className="teacher-dashboard__eyebrow">O‘qituvchi uchun</p>
        <h1 className="page-heading" id="teacher-dashboard-heading">O‘qituvchi paneli</h1>
        <p className="teacher-dashboard__intro">
          Xush kelibsiz, {userName}. Talabalar faolligi va yuborgan eksponatlarini boshqaring.
        </p>
      </header>

      {error && <p className="teacher-dashboard__message teacher-dashboard__message--error" role="alert">{error}</p>}
      {notice && <p className="teacher-dashboard__message teacher-dashboard__message--success" role="status">{notice}</p>}

      <motion.section
        className="teacher-stats"
        aria-label="Umumiy statistika"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {statistics.map(({ label, value, icon: Icon, tone }) => (
          <motion.article
            className="teacher-stat-card"
            key={label}
            variants={fadeUpVariants}
          >
            <span className={`teacher-stat-card__icon teacher-stat-card__icon--${tone}`}>
              <Icon size={21} weight="regular" aria-hidden="true" />
            </span>
            <span className="teacher-stat-card__label">{label}</span>
            <strong className="teacher-stat-card__value">{isLoading ? '—' : value}</strong>
          </motion.article>
        ))}
      </motion.section>

      <section className="teacher-review" aria-labelledby="teacher-review-heading">
        <div className="teacher-review__heading">
          <div>
            <p className="teacher-dashboard__eyebrow">Moderatsiya</p>
            <h2 id="teacher-review-heading">Talabalar eksponatlari</h2>
          </div>
          <span className="teacher-review__count">{exhibits.length} ta</span>
        </div>

        {isLoading ? (
          <LoadingState label="Ma’lumotlar yuklanmoqda..." inline />
        ) : exhibits.length === 0 ? (
          <p className="teacher-dashboard__status">Ko‘rib chiqish uchun eksponatlar hozircha yo‘q.</p>
        ) : (
          <div className="teacher-table-wrap">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th scope="col">Eksponat</th>
                  <th scope="col">Tavsif</th>
                  <th scope="col">Tarixiy kontekst</th>
                  <th scope="col">Holati</th>
                  <th scope="col">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {exhibits.map((exhibit) => (
                  <tr key={exhibit.id}>
                    <td>
                      <div className="teacher-table__exhibit">
                        <img src={exhibit.image} alt="" loading="lazy" />
                        <strong>{exhibit.title}</strong>
                      </div>
                    </td>
                    <td>{exhibit.description}</td>
                    <td>{exhibit.historicalContext}</td>
                    <td>
                      <span className={`teacher-status teacher-status--${exhibit.status}`}>
                        {exhibit.status === 'approved' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                      </span>
                    </td>
                    <td>
                      <div className="teacher-table__actions">
                        {isAdmin && exhibit.status !== 'approved' && (
                          <button
                            className="teacher-table__approve"
                            type="button"
                            onClick={() => updateExhibit(exhibit.id, 'approve')}
                          >
                            <Check size={15} weight="regular" aria-hidden="true" />
                            Tasdiqlash
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="teacher-table__reject"
                            type="button"
                            onClick={() => updateExhibit(exhibit.id, 'reject')}
                          >
                            <Trash size={15} weight="regular" aria-hidden="true" />
                            O‘chirish
                          </button>
                        )}
                        {!isAdmin && <span>Faqat administrator boshqaradi</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="teacher-review__note">
          Talabalar eksponat takliflarini yuboradi; tasdiqlash va o‘chirish faqat admin huquqiga ega hisoblarda ochiq.
        </p>
      </section>
    </section>
  );
}

export default TeacherDashboard;
