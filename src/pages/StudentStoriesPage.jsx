import { useEffect, useState } from 'react';
import { BookOpen, Feather, Sparkle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { getStories } from '../services/storyService.js';
import { fadeUpVariants, staggerContainerVariants } from '../motion.js';
import LoadingState from '../components/ui/LoadingState.jsx';
import './StudentStoriesPage.css';

function StudentStoriesPage() {
  const [storyState, setStoryState] = useState({
    stories: [],
    loading: true,
    error: '',
  });

  useEffect(() => {
    let active = true;
    getStories()
      .then((stories) => {
        if (active) {
          setStoryState({ stories, loading: false, error: '' });
        }
      })
      .catch((loadError) => {
        if (active) {
          setStoryState({
            stories: [],
            loading: false,
            error: loadError instanceof Error
              ? `Hikoyalarni yuklab bo‘lmadi: ${loadError.message}`
              : 'Hikoyalarni Firestore’dan yuklab bo‘lmadi.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const { stories, error, loading } = storyState;

  return (
    <section className="student-stories" aria-labelledby="student-stories-heading">
      <header className="student-stories__header">
        <div className="student-stories__header-icon" aria-hidden="true">
          <BookOpen size={23} weight="light" />
        </div>
        <p className="student-stories__eyebrow">Ijodiy to‘plam</p>
        <h1 className="page-heading" id="student-stories-heading">Talabalar ijodi</h1>
        <p className="student-stories__intro">
          Eksponatlar tilidan hikoya qilingan xotiralar va tasavvurlar bilan tanishing.
        </p>
      </header>

      {loading && <LoadingState label="Hikoyalar yuklanmoqda..." />}
      {error && <p className="student-stories__error" role="alert">{error}</p>}
      {!loading && !error && stories.length === 0 && (
        <div className="student-stories__empty">
          <Sparkle size={28} weight="regular" aria-hidden="true" />
          <h2>Hikoyalar hali yo‘q</h2>
          <p>Muzeydagi eksponatni tanlab, uning nomidan birinchi hikoyani yozing.</p>
        </div>
      )}
      {!loading && !error && stories.length > 0 && (
        <motion.div
          className="student-stories__grid"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {stories.map((story) => (
            <motion.article
              className="student-story-card"
              key={story.id}
              variants={fadeUpVariants}
            >
              <div className="student-story-card__image-wrap">
                <img
                  className="student-story-card__image"
                  src={story.exhibitImage}
                  alt={story.exhibitTitle}
                  loading="lazy"
                />
                <span className="student-story-card__category">
                  {story.category || 'Tarix'}
                </span>
              </div>
              <div className="student-story-card__body">
                <div className="student-story-card__label">
                  <Feather size={16} weight="regular" aria-hidden="true" />
                  <span>Eksponat hikoyasi</span>
                </div>
                <h2>{story.exhibitTitle}</h2>
                <blockquote>{story.story}</blockquote>
                <footer className="student-story-card__footer">
                  <span>{story.authorName}</span>
                  <time dateTime={story.createdAt}>
                    {new Date(story.createdAt).toLocaleDateString('uz-UZ')}
                  </time>
                </footer>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
    </section>
  );
}

export default StudentStoriesPage;
