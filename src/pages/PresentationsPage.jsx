import { useState } from 'react';
import { ArrowSquareOut, Presentation } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext.jsx';
import { fadeUpVariants, staggerContainerVariants } from '../motion.js';
import Modal from '../components/ui/Modal.jsx';
import UploadedFileLink from '../components/ui/UploadedFileLink.jsx';
import './PresentationsPage.css';

function PresentationsPage() {
  const { presentations } = useData();
  const [selectedPresentation, setSelectedPresentation] = useState(null);

  return (
    <section className="presentations-page" aria-labelledby="presentations-heading">
      <header className="presentations-page__header">
        <p className="presentations-page__eyebrow">O‘quv materiallari</p>
        <h1 className="page-heading" id="presentations-heading">Taqdimotlar</h1>
        <p className="presentations-page__intro">
          Muzey va tarix mavzularidagi taqdimotlarni ko‘ring yoki yuklab oling.
        </p>
      </header>

      <motion.div
        className="presentations-grid"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {presentations.map((presentation) => (
          <motion.article
            className="presentation-card"
            key={presentation.id}
            variants={fadeUpVariants}
          >
            <button
              className="presentation-card__preview"
              type="button"
              onClick={() => setSelectedPresentation(presentation)}
              aria-label={`${presentation.title} taqdimotini ko‘rish`}
            >
              <span className="presentation-card__brand" aria-hidden="true">
                <span className="presentation-card__brand-mark">
                  <Presentation size={24} weight="light" />
                </span>
                <span>MuzeyKompas</span>
              </span>
            </button>
            <div className="presentation-card__body">
              <div className="presentation-card__title-row">
                <span className="presentation-card__icon" aria-hidden="true">
                  <Presentation size={20} weight="regular" />
                </span>
                <div>
                  <h2 className="presentation-card__title">{presentation.title}</h2>
                  <p className="presentation-card__author">{presentation.author}</p>
                </div>
              </div>
              <div className="presentation-card__actions">
                <button
                  className="presentation-card__view"
                  type="button"
                  onClick={() => setSelectedPresentation(presentation)}
                >
                  Ko‘rish
                </button>
                <UploadedFileLink
                  className="presentation-card__download"
                  fileId={presentation.uploadedFileId}
                  fallbackUrl={presentation.fileUrl || presentation.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${presentation.title} fayl havolasini ochish`}
                >
                  <ArrowSquareOut size={19} weight="regular" aria-hidden="true" />
                  Havolani ochish
                </UploadedFileLink>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>

      <Modal
        isOpen={selectedPresentation !== null}
        onClose={() => setSelectedPresentation(null)}
        title={selectedPresentation?.title ?? 'Taqdimot'}
      >
        {selectedPresentation && (
          <div className="presentation-preview">
            <p className="presentation-preview__author">
              Muallif: {selectedPresentation.author}
            </p>
            <p className="presentation-preview__description">
              {selectedPresentation.description}
            </p>
            <UploadedFileLink
              className="presentation-card__download presentation-preview__download"
              fileId={selectedPresentation.uploadedFileId}
              fallbackUrl={selectedPresentation.fileUrl || selectedPresentation.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ArrowSquareOut size={19} weight="regular" aria-hidden="true" />
              Havolani ochish
            </UploadedFileLink>
          </div>
        )}
      </Modal>
    </section>
  );
}

export default PresentationsPage;
