import { useMemo, useState } from 'react';
import {
  MagnifyingGlass,
  Play,
  CheckCircle,
  ArrowSquareOut,
  Plus,
  X,
  VideoCamera,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import Modal from '../components/ui/Modal.jsx';
import { fadeUpVariants, staggerContainerVariants } from '../motion.js';
import './VideosPage.css';

function VideosPage() {
  const { userData, saveUserActivity } = useAuth();
  const { videos } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeVideo, setActiveVideo] = useState(null);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [addVideoError, setAddVideoError] = useState('');

  const watchedVideos = useMemo(
    () => new Set(userData.activity?.watchedVideos || []),
    [userData.activity?.watchedVideos],
  );

  const categories = useMemo(() => {
    const cats = new Set(videos.map((v) => v.category));
    return ['all', ...Array.from(cats)];
  }, [videos]);

  const filteredVideos = useMemo(() => {
    let filtered = videos;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((v) => v.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.description.toLowerCase().includes(query) ||
          v.category.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [videos, selectedCategory, searchQuery]);

  function extractYouTubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /youtube\.com\/shorts\/([^&\s?]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  async function handleMarkWatched(videoId) {
    try {
      await saveUserActivity('watchedVideos', videoId, true);
    } catch (error) {
      console.error('Videoni belgilashda xatolik:', error);
    }
  }

  function handleAddVideo(event) {
    event.preventDefault();
    setAddVideoError('');

    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      setAddVideoError("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    const youtubeId = extractYouTubeId(newVideoUrl);
    const embedUrl = youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}`
      : newVideoUrl;

    const customVideos = JSON.parse(localStorage.getItem('custom-videos') || '[]');
    const newVideo = {
      id: `custom-${Date.now()}`,
      title: newVideoTitle.trim(),
      description: "Foydalanuvchi tomonidan qo'shilgan video",
      url: newVideoUrl.trim(),
      embedUrl,
      type: "video",
      duration: "Noma'lum",
      category: "Foydalanuvchi videolari",
    };

    customVideos.push(newVideo);
    localStorage.setItem('custom-videos', JSON.stringify(customVideos));

    setNewVideoTitle('');
    setNewVideoUrl('');
    setIsAddVideoOpen(false);
    window.location.reload();
  }

  return (
    <section className="videos-page" aria-labelledby="videos-heading">
      <header className="videos-header">
        <div className="videos-header__content">
          <p className="videos-header__eyebrow">Muzey pedagogikasi</p>
          <h1 className="videos-header__title" id="videos-heading">
            Video darslar va virtual media
          </h1>
          <p className="videos-header__description">
            Muzeylarga virtual sayohatlar, tarixiy joylar haqida videolavhalar va
            muzey pedagogikasi bo'yicha o'quv materiallari.
          </p>
        </div>
        <div className="videos-header__decoration" aria-hidden="true">
          <VideoCamera size={84} weight="light" />
        </div>
      </header>

      <div className="videos-controls">
        <div className="videos-search">
          <MagnifyingGlass size={18} weight="regular" aria-hidden="true" />
          <input
            type="search"
            placeholder="Video qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="videos-search__input"
          />
        </div>

        <div className="videos-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`videos-filter${selectedCategory === cat ? ' videos-filter--active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'Barchasi' : cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="videos-add-button"
          onClick={() => setIsAddVideoOpen(true)}
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
          Video qo'shish
        </button>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="videos-empty">
          <p>Hech qanday video topilmadi.</p>
        </div>
      ) : (
        <motion.div
          className="videos-grid"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredVideos.map((video, index) => {
            const isWatched = watchedVideos.has(video.id);
            return (
              <motion.article
                key={video.id}
                className="video-card"
                variants={fadeUpVariants}
              >
                <div className="video-card__number">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  className="video-card__thumbnail"
                  onClick={() => setActiveVideo(video)}
                  aria-label={`${video.title} videosini ko'rish`}
                >
                  <div className="video-card__play">
                    <Play size={32} weight="fill" aria-hidden="true" />
                  </div>
                  <span className="video-card__duration">{video.duration}</span>
                </button>
                <div className="video-card__content">
                  <h3 className="video-card__title">{video.title}</h3>
                  <p className="video-card__description">{video.description}</p>
                  <div className="video-card__meta">
                    <span className="video-card__category">{video.category}</span>
                  </div>
                  <div className="video-card__actions">
                    <button
                      type="button"
                      className={`video-card__watched${isWatched ? ' video-card__watched--active' : ''}`}
                      onClick={() => handleMarkWatched(video.id)}
                      aria-pressed={isWatched}
                    >
                      <CheckCircle size={16} weight={isWatched ? "fill" : "regular"} aria-hidden="true" />
                      {isWatched ? "Ko'rildi" : "Ko'rildi deb belgilash"}
                    </button>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="video-card__external"
                    >
                      <ArrowSquareOut size={16} weight="regular" aria-hidden="true" />
                      Asl havolani ochish
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      <Modal
        isOpen={activeVideo !== null}
        onClose={() => setActiveVideo(null)}
        title={activeVideo?.title || ""}
        dialogClassName="modal-dialog--video"
      >
        {activeVideo && (
          <div className="video-player">
            {activeVideo.type === 'video' || activeVideo.type === 'playlist' ? (
              <iframe
                src={activeVideo.embedUrl}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="video-player__iframe"
              />
            ) : (
              <div className="video-player__external">
                <p>Bu manba tashqi havola. Ochish uchun quyidagi tugmani bosing:</p>
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="video-player__link"
                >
                  <ArrowSquareOut size={18} weight="regular" aria-hidden="true" />
                  Havolani ochish
                </a>
              </div>
            )}
            <div className="video-player__info">
              <p>{activeVideo.description}</p>
              <div className="video-player__meta">
                <span className="video-player__category">{activeVideo.category}</span>
                <span className="video-player__duration">{activeVideo.duration}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isAddVideoOpen}
        onClose={() => {
          setIsAddVideoOpen(false);
          setAddVideoError("");
          setNewVideoTitle("");
          setNewVideoUrl("");
        }}
        title="Yangi video qo'shish"
      >
        <form className="add-video-form" onSubmit={handleAddVideo}>
          <label className="add-video-form__label" htmlFor="video-title">
            Video nomi
          </label>
          <input
            id="video-title"
            type="text"
            className="add-video-form__input"
            placeholder="Masalan: Muzeyga ekskursiya"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            maxLength={100}
            required
          />

          <label className="add-video-form__label" htmlFor="video-url">
            Video havolasi (URL)
          </label>
          <input
            id="video-url"
            type="url"
            className="add-video-form__input"
            placeholder="https://youtube.com/watch?v=..."
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            required
          />

          {addVideoError && (
            <p className="add-video-form__error" role="alert">
              {addVideoError}
            </p>
          )}

          <div className="add-video-form__actions">
            <button type="submit" className="add-video-form__submit">
              Qo'shish
            </button>
            <button
              type="button"
              className="add-video-form__cancel"
              onClick={() => {
                setIsAddVideoOpen(false);
                setAddVideoError("");
                setNewVideoTitle("");
                setNewVideoUrl("");
              }}
            >
              Bekor qilish
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default VideosPage;
