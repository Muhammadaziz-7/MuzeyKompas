import { useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import ExhibitModal from './ExhibitModal.jsx';
import './VirtualTour.css';

const VIEWS = {
  LEFT: 'left',
  MAIN: 'main',
  RIGHT: 'right',
};

const VIEW_IMAGES = {
  [VIEWS.LEFT]: '/museum/left-view.jpg',
  [VIEWS.MAIN]: '/museum/main-view.jpg',
  [VIEWS.RIGHT]: '/museum/right-view.jpg',
};

const VIEW_LABELS = {
  [VIEWS.LEFT]: 'Chap tomonga qarash',
  [VIEWS.MAIN]: 'Asosiy ko\'rinish',
  [VIEWS.RIGHT]: 'O\'ng tomonga qarash',
};

function VirtualTour({ exhibits }) {
  const [currentView, setCurrentView] = useState(VIEWS.MAIN);
  const [selectedExhibit, setSelectedExhibit] = useState(null);

  const exhibitsForCurrentView = exhibits.filter(
    (exhibit) => exhibit.viewPosition === currentView
  );

  function handleExhibitClick(exhibit) {
    setSelectedExhibit(exhibit);
  }

  function handleCloseModal() {
    setSelectedExhibit(null);
  }

  return (
    <div className="virtual-tour">
      <div className="virtual-tour__controls">
        <button
          type="button"
          className={`virtual-tour__nav-button ${currentView === VIEWS.LEFT ? 'virtual-tour__nav-button--active' : ''}`}
          onClick={() => setCurrentView(VIEWS.LEFT)}
          aria-label={VIEW_LABELS[VIEWS.LEFT]}
        >
          <CaretLeft size={20} weight="bold" />
          Chapga
        </button>
        <button
          type="button"
          className={`virtual-tour__nav-button ${currentView === VIEWS.MAIN ? 'virtual-tour__nav-button--active' : ''}`}
          onClick={() => setCurrentView(VIEWS.MAIN)}
          aria-label={VIEW_LABELS[VIEWS.MAIN]}
        >
          Asosiy
        </button>
        <button
          type="button"
          className={`virtual-tour__nav-button ${currentView === VIEWS.RIGHT ? 'virtual-tour__nav-button--active' : ''}`}
          onClick={() => setCurrentView(VIEWS.RIGHT)}
          aria-label={VIEW_LABELS[VIEWS.RIGHT]}
        >
          O'ngga
          <CaretRight size={20} weight="bold" />
        </button>
      </div>

      <div className="virtual-tour__viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            className="virtual-tour__scene"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={VIEW_IMAGES[currentView]}
              alt={VIEW_LABELS[currentView]}
              className="virtual-tour__image"
            />

            <div className="virtual-tour__hotspots">
              {exhibitsForCurrentView.map((exhibit) => (
                <button
                  key={exhibit.id}
                  type="button"
                  className="virtual-tour__hotspot"
                  style={{
                    left: `${exhibit.coordinates?.x || 50}%`,
                    top: `${exhibit.coordinates?.y || 50}%`,
                  }}
                  onClick={() => handleExhibitClick(exhibit)}
                  aria-label={`${exhibit.title} haqida ma'lumot`}
                >
                  <span className="virtual-tour__hotspot-pulse" />
                  <span className="virtual-tour__hotspot-dot" />
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <ExhibitModal
        exhibit={selectedExhibit}
        isOpen={selectedExhibit !== null}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default VirtualTour;
