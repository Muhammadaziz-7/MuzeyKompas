import { ArrowLeft } from '@phosphor-icons/react';
import Modal from '../ui/Modal.jsx';
import './ExhibitModal.css';

function ExhibitModal({ exhibit, isOpen, onClose }) {
  if (!exhibit) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="exhibit-modal">
        <div className="exhibit-modal__header">
          <button
            type="button"
            className="exhibit-modal__back"
            onClick={onClose}
            aria-label="Orqaga qaytish"
          >
            <ArrowLeft size={18} weight="bold" />
            Orqaga
          </button>
          <h2 className="exhibit-modal__title">{exhibit.title}</h2>
        </div>

        <div className="exhibit-modal__content">
          <div className="exhibit-modal__image-wrapper">
            <img
              src={exhibit.image}
              alt={exhibit.title}
              className="exhibit-modal__image"
            />
          </div>

          <div className="exhibit-modal__meta">
            {exhibit.category && (
              <span className="exhibit-modal__tag">{exhibit.category}</span>
            )}
            {exhibit.period && (
              <span className="exhibit-modal__tag exhibit-modal__tag--period">{exhibit.period}</span>
            )}
          </div>

          <div className="exhibit-modal__section">
            <h3 className="exhibit-modal__section-title">Tavsif</h3>
            <p className="exhibit-modal__section-text">{exhibit.description}</p>
          </div>

          {exhibit.historical_context && (
            <div className="exhibit-modal__section">
              <h3 className="exhibit-modal__section-title">Tarixiy ma'lumot</h3>
              <p className="exhibit-modal__section-text">{exhibit.historical_context}</p>
            </div>
          )}

          {exhibit.pedagogical_task && (
            <div className="exhibit-modal__section">
              <h3 className="exhibit-modal__section-title">Pedagogik topshiriq</h3>
              <p className="exhibit-modal__section-text">{exhibit.pedagogical_task}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ExhibitModal;
