import { useState } from 'react';
import { Bank, ImageSquare, Trash } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { fadeUpVariants, staggerContainerVariants } from '../motion.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import './CuratorPage.css';

const EMPTY_FORM = {
  title: '',
  image: '',
  description: '',
  historicalContext: '',
  category: 'Tarix',
};

const EXHIBIT_CATEGORIES = ['Tarix', 'San’at', 'Arxeologiya'];

function CuratorPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { userName } = useAuth();
  const { curatorExhibits: exhibits, addCuratorExhibit, deleteCuratorExhibit } = useData();

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setError('');
    setNotice('');
  }

  async function handleSave(event) {
    event.preventDefault();
    const exhibit = {
      ...form,
      authorName: userName.trim(),
      status: 'pending',
    };

    try {
      await addCuratorExhibit(exhibit);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Eksponatni saqlab bo‘lmadi: ${saveError.message}`
          : 'Eksponatni Firebase’da saqlab bo‘lmadi.',
      );
      setNotice('');
      return;
    }

    setForm(EMPTY_FORM);
    setError('');
    setNotice('Eksponat muvaffaqiyatli saqlandi.');
  }

  async function handleDelete(id) {
    try {
      await deleteCuratorExhibit(id);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? `Eksponatni o‘chirib bo‘lmadi: ${deleteError.message}`
          : 'Eksponatni Firebase’dan o‘chirib bo‘lmadi.',
      );
      setNotice('');
      return;
    }

    setError('');
    setNotice('Eksponat o‘chirildi.');
  }

  return (
    <section className="curator-page" aria-labelledby="curator-heading">
      <header className="curator-page__header">
        <p className="curator-page__eyebrow">Ijodiy to‘plam</p>
        <h1 className="page-heading" id="curator-heading">Mening Muzeyim</h1>
        <p className="curator-page__intro">
          O‘zingizning virtual eksponatingizni yarating va shaxsiy muzeyingizga qo‘shing.
        </p>
      </header>

      <form className="curator-form" onSubmit={handleSave}>
        <div className="curator-form__heading">
          <span className="curator-form__icon"><ImageSquare size={20} weight="regular" aria-hidden="true" /></span>
          <div>
            <h2>Yangi eksponat</h2>
            <p>Barcha maydonlarni to‘ldiring.</p>
          </div>
        </div>

        <div className="curator-form__grid">
          <label className="curator-field">
            <span>Eksponat nomi</span>
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Masalan, qadimiy sopol ko‘za"
              required
              maxLength={120}
            />
          </label>

          <label className="curator-field">
            <span>Kategoriya</span>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              {EXHIBIT_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="curator-field">
            <span>Rasm URL manzili</span>
            <input
              name="image"
              type="url"
              value={form.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              required
            />
          </label>

          <label className="curator-field curator-field--full">
            <span>Qisqacha tavsif</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Eksponat haqida qisqacha yozing"
              rows={3}
              required
              maxLength={500}
            />
          </label>

          <label className="curator-field curator-field--full">
            <span>Tarixiy kontekst</span>
            <textarea
              name="historicalContext"
              value={form.historicalContext}
              onChange={handleChange}
              placeholder="Eksponatning kelib chiqishi va tarixiy ahamiyati"
              rows={4}
              required
              maxLength={1500}
            />
          </label>
        </div>

        {error && <p className="curator-message curator-message--error" role="alert">{error}</p>}
        {notice && <p className="curator-message curator-message--success" role="status">{notice}</p>}

        <div className="curator-form__actions">
          <button className="curator-save" type="submit">
            <Bank size={17} weight="regular" aria-hidden="true" />
            Saqlash
          </button>
        </div>
      </form>

      <section className="curator-collection" aria-labelledby="collection-heading">
        <div className="curator-collection__heading">
          <div>
            <p className="curator-page__eyebrow">Shaxsiy to‘plam</p>
            <h2 id="collection-heading">Yaratgan eksponatlarim</h2>
          </div>
          <span className="curator-collection__count">{exhibits.length} ta</span>
        </div>

        {exhibits.length === 0 ? (
          <div className="curator-empty">
            <ImageSquare size={28} weight="regular" aria-hidden="true" />
            <p>Hozircha eksponat yo‘q. Birinchi eksponatingizni yarating.</p>
          </div>
        ) : (
          <motion.div
            className="curator-exhibit-grid"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {exhibits.map((exhibit) => (
              <motion.article
                className="curator-exhibit-card"
                key={exhibit.id}
                variants={fadeUpVariants}
              >
                <img
                  className="curator-exhibit-card__image"
                  src={exhibit.image}
                  alt={exhibit.title}
                  loading="lazy"
                />
                <div className="curator-exhibit-card__body">
                  <h3>{exhibit.title}</h3>
                  <span
                    className={`curator-exhibit-card__status curator-exhibit-card__status--${exhibit.status}`}
                  >
                    {exhibit.status === 'approved' ? 'Tasdiqlangan' : 'Ko‘rib chiqilmoqda'}
                  </span>
                  <p>{exhibit.description}</p>
                  <details className="curator-exhibit-card__context">
                    <summary>Tarixiy kontekst</summary>
                    <p>{exhibit.historicalContext}</p>
                  </details>
                  <button
                    className="curator-exhibit-card__delete"
                    type="button"
                    onClick={() => handleDelete(exhibit.id)}
                    aria-label={`${exhibit.title} eksponatini o‘chirish`}
                  >
                    <Trash size={16} weight="regular" aria-hidden="true" />
                    O‘chirish
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </section>
    </section>
  );
}

export default CuratorPage;
