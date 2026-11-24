import { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarBlank,
  ArrowSquareOut,
  FileDoc,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import UploadedFileLink from '../components/ui/UploadedFileLink.jsx';
import { fadeUpVariants, staggerContainerVariants } from '../motion.js';
import './LecturesPage.css';

function formatFileSize(sizeBytes) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} bayt`;
  }
  return `${(sizeBytes / 1024).toFixed(1)} KB`;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateString}T00:00:00`));
}

function LecturesPage() {
  const { lectures } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const filteredLectures = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) {
      return lectures;
    }

    return lectures.filter(({ title, fileName, fileUrl }) =>
      `${title} ${fileName ?? ''} ${fileUrl ?? ''}`.toLocaleLowerCase().includes(query),
    );
  }, [lectures, searchQuery]);

  return (
    <section className="lectures-page" aria-labelledby="lectures-heading">
      <header className="lectures-page__header">
        <div className="lectures-page__heading">
          <span className="lectures-page__icon" aria-hidden="true">
            <BookOpen size={23} weight="regular" />
          </span>
          <div>
            <p className="lectures-page__eyebrow">O‘quv materiallari</p>
            <h1 className="page-heading" id="lectures-heading">Ma’ruzalar</h1>
          </div>
        </div>
        <p className="lectures-page__intro">
          Ma’ruza darslari uchun Word hujjatlarini qidiring va yuklab oling.
        </p>
        <label className="lectures-search" htmlFor="lecture-search">
          <MagnifyingGlass size={20} weight="regular" aria-hidden="true" />
          <input
            id="lecture-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Ma’ruza yoki fayl nomini qidiring"
          />
        </label>
      </header>

      <div className="lectures-page__results" aria-live="polite">
        {filteredLectures.length > 0 ? (
          <motion.div
            className="lecture-grid"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredLectures.map((lecture) => (
              <motion.article
                className="lecture-card"
                key={lecture.id}
                variants={fadeUpVariants}
              >
                <div className="lecture-card__top">
                  <span className="lecture-card__file-icon" aria-hidden="true">
                    <FileDoc size={28} weight="regular" />
                  </span>
                  <span className="lecture-card__format">WORD HUJJATI</span>
                </div>
                <h2 className="lecture-card__title">{lecture.title}</h2>
                <p className="lecture-card__filename">{lecture.fileName || lecture.title}</p>
                <div className="lecture-card__metadata">
                  {lecture.sizeBytes > 0 && <span>{formatFileSize(lecture.sizeBytes)}</span>}
                  {lecture.uploadedAt && (
                    <span className="lecture-card__date">
                      <CalendarBlank size={15} weight="regular" aria-hidden="true" />
                      {formatDate(lecture.uploadedAt)}
                    </span>
                  )}
                </div>
                <UploadedFileLink
                  className="lecture-card__download"
                  fileId={lecture.uploadedFileId}
                  fallbackUrl={lecture.fileUrl || lecture.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowSquareOut size={18} weight="regular" aria-hidden="true" />
                  Havolani ochish
                </UploadedFileLink>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <div className="lectures-empty">
            <MagnifyingGlass size={28} weight="light" aria-hidden="true" />
            <h2>Ma’ruza topilmadi</h2>
            <p>Boshqa nom bilan qidirib ko‘ring.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default LecturesPage;
