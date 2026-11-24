import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Bank,
  ChartBar,
  CheckCircle,
  ClipboardText,
  GearSix,
  Plus,
  Presentation,
  Question,
  Trash,
  PencilSimple,
  X,
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import Modal from '../components/ui/Modal.jsx';
import UploadedFileLink from '../components/ui/UploadedFileLink.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import DataLoadingState from '../components/ui/DataLoadingState.jsx';
import './AdminPage.css';

const SECTIONS = [
  { id: 'overview', label: 'Umumiy statistika', icon: ChartBar },
  { id: 'lectures', label: 'Ma’ruzalar', icon: BookOpen },
  { id: 'presentations', label: 'Taqdimotlar', icon: Presentation },
  { id: 'assignments', label: 'Topshiriqlar', icon: ClipboardText },
  { id: 'quizzes', label: 'Kahoot testlari', icon: Question },
  { id: 'exhibits', label: 'Muzey eksponatlari', icon: Bank },
];

const COLLECTIONS = {
  lectures: {
    title: 'Ma’ruzalar',
    singular: 'ma’ruza',
    dataKey: 'lectures',
    add: 'addLecture',
    update: 'updateLecture',
    remove: 'deleteLecture',
    fields: [
      { key: 'title', label: 'Ma’ruza nomi', required: true },
      { key: 'author', label: 'Muallif', required: true },
      { key: 'fileUrl', label: 'Fayl havolasi (URL)', type: 'url', required: true },
    ],
  },
  presentations: {
    title: 'Taqdimotlar',
    singular: 'taqdimot',
    dataKey: 'presentations',
    add: 'addPresentation',
    update: 'updatePresentation',
    remove: 'deletePresentation',
    fields: [
      { key: 'title', label: 'Taqdimot nomi', required: true },
      { key: 'author', label: 'Muallif', required: true },
      { key: 'fileUrl', label: 'Fayl havolasi (URL)', type: 'url', required: true },
    ],
  },
  assignments: {
    title: 'Topshiriqlar',
    singular: 'topshiriq',
    dataKey: 'assignments',
    add: 'addAssignment',
    update: 'updateAssignment',
    remove: 'deleteAssignment',
    fields: [
      { key: 'title', label: 'Sarlavha', required: true },
      { key: 'description', label: 'Tavsif', type: 'textarea', required: true },
      { key: 'dueDate', label: 'Topshirish muddati', type: 'date', required: true },
      { key: 'fileUrl', label: 'Fayl havolasi (URL)', type: 'url' },
      { key: 'fileName', label: 'Ilova fayl nomi (ixtiyoriy)' },
    ],
  },
  quizzes: {
    title: 'Kahoot testlari',
    singular: 'test',
    dataKey: 'quizzes',
    add: 'addQuiz',
    update: 'updateQuiz',
    remove: 'deleteQuiz',
    fields: [
      { key: 'title', label: 'Test nomi', required: true },
      { key: 'description', label: 'Qisqacha tavsif (ixtiyoriy)' },
    ],
  },
  exhibits: {
    title: 'Muzey eksponatlari',
    singular: 'eksponat',
    dataKey: 'exhibits',
    add: 'addExhibit',
    update: 'updateExhibit',
    remove: 'deleteExhibit',
    fields: [
      { key: 'title', label: 'Eksponat nomi', required: true },
      { key: 'image', label: 'Rasm URL manzili', type: 'url', required: true },
      { key: 'description', label: 'Tavsif', type: 'textarea', required: true },
      { key: 'category', label: 'Kategoriya', required: true },
    ],
  },
};

function getInitialDraft(fields, item) {
  return Object.fromEntries(fields.map(({ key, type }) => {
    const value = key === 'fileUrl'
      ? item?.fileUrl ?? item?.downloadUrl
      : item?.[key];
    if (type === 'json') {
      return [key, JSON.stringify(value ?? [], null, 2)];
    }
    return [key, value === undefined || value === null ? '' : String(value)];
  }));
}

function parseDraft(fields, draft) {
  return Object.fromEntries(fields.map(({ key, type, label }) => {
    const value = draft[key].trim();
    if (type === 'json') {
      let parsed;
      try {
        parsed = JSON.parse(value);
      } catch {
        throw new Error(`${label}: JSON formati noto‘g‘ri.`);
      }
      if (!Array.isArray(parsed)) {
        throw new Error(`${label} JSON massivi bo‘lishi kerak.`);
      }
      parsed.forEach((question, index) => {
        if (
          !question
          || typeof question.question !== 'string'
          || !Array.isArray(question.options)
          || !Number.isInteger(question.answer)
          || question.answer < 0
          || question.answer >= question.options.length
        ) {
          throw new Error(`${index + 1}-savol noto‘g‘ri formatda.`);
        }
      });
      return [key, parsed];
    }
    if (type === 'number') {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0) {
        throw new Error(`${label} musbat son bo‘lishi kerak.`);
      }
      return [key, number];
    }
    return [key, value];
  }));
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function AdminPage() {
  const { isAdmin, isAuthReady } = useAuth();
  const data = useData();
  const [activeSection, setActiveSection] = useState('overview');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [draft, setDraft] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (!isAuthReady) {
    return <LoadingState label="Hisob tekshirilmoqda..." />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (data.isLoading) {
    return <DataLoadingState label="Admin ma’lumotlari yuklanmoqda..." />;
  }

  function startCreate(section) {
    setActiveSection(section);
    setIsFormOpen(true);
    setEditingItem(null);
    setDraft(getInitialDraft(COLLECTIONS[section].fields));
    setError('');
    setNotice('');
  }

  function startEdit(section, item) {
    setActiveSection(section);
    setIsFormOpen(true);
    setEditingItem(item);
    setDraft(getInitialDraft(COLLECTIONS[section].fields, item));
    setError('');
    setNotice('');
  }

  function startCreateQuiz() {
    setActiveSection('quizzes');
    setIsFormOpen(true);
    setEditingItem(null);
    setDraft(getInitialDraft(COLLECTIONS.quizzes.fields));
    setQuizQuestions([{ question: '', options: ['', '', '', ''], answer: 0 }]);
    setError('');
    setNotice('');
  }

  function cancelEdit() {
    setIsFormOpen(false);
    setEditingItem(null);
    setDraft({});
    setQuizQuestions([]);
    setError('');
  }

  async function saveQuiz(event) {
    event.preventDefault();
    try {
      const item = parseDraft(COLLECTIONS.quizzes.fields, draft);
      if (quizQuestions.length === 0) {
        throw new Error('Testga kamida bitta savol qo‘shing.');
      }
      const questions = quizQuestions.map((question, index) => {
        const text = question.question.trim();
        const options = question.options.map((option) => option.trim());
        if (!text || options.some((option) => !option)) {
          throw new Error(`${index + 1}-savol va uning 4 ta variantini to‘ldiring.`);
        }
        return { question: text, options, answer: question.answer };
      });
      await data.addQuiz({
        ...item,
        questions,
      });
      setIsFormOpen(false);
      setDraft({});
      setQuizQuestions([]);
      setError('');
      setNotice('Test savollari katalogga qo‘shildi.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Testni saqlab bo‘lmadi.');
    }
  }

  async function saveItem(event, section) {
    event.preventDefault();
    const collection = COLLECTIONS[section];

    try {
      const item = parseDraft(collection.fields, draft);
      const isMaterialSection = section === 'lectures' || section === 'presentations';
      const urlFields = collection.fields.filter((field) => field.type === 'url');
      for (const field of urlFields) {
        const urlValue = item[field.key];
        if (!urlValue) {
          continue;
        }
        let parsedUrl;
        try {
          parsedUrl = new URL(urlValue);
        } catch {
          throw new Error(`${field.label} to‘g‘ri URL formatida bo‘lishi kerak.`);
        }
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error(`${field.label} https:// yoki http:// bilan boshlanishi kerak.`);
        }
      }
      if (isMaterialSection) {
        item.uploadedFileId = '';
        item.downloadUrl = '';
        item.fileName = editingItem?.fileName || item.title;
        item.sizeBytes = editingItem?.sizeBytes ?? 0;
        if (section === 'lectures') {
          item.uploadedAt = editingItem?.uploadedAt ?? getTodayDate();
        }
        if (section === 'presentations') {
          item.imageUrl = editingItem?.imageUrl ?? '';
          item.description = editingItem?.description ?? '';
        }
      }
      if (section === 'exhibits') {
        item.historical_context = 'Tarixiy ma’lumot hali kiritilmagan.';
        item.pedagogical_task = 'Eksponatni kuzating va uning tarixiy ahamiyati haqida fikr yuriting.';
      }
      if (editingItem) {
        await data[collection.update](editingItem.id, item);
        setNotice(`${collection.singular} ma’lumoti yangilandi.`);
      } else {
        await data[collection.add](item);
        setNotice(`Yangi ${collection.singular} qo‘shildi.`);
      }
      setIsFormOpen(false);
      setEditingItem(null);
      setDraft({});
      setError('');
    } catch (saveError) {
      setNotice('');
      setError(saveError instanceof Error ? saveError.message : 'Ma’lumotni saqlab bo‘lmadi.');
    }
  }

  async function deleteItem(section, item) {
    const collection = COLLECTIONS[section];
    try {
      await data[collection.remove](item.id);
      if (editingItem?.id === item.id) {
        cancelEdit();
      }
      setError('');
      setNotice(`${collection.singular} o‘chirildi.`);
    } catch (deleteError) {
      setNotice('');
      setError(deleteError instanceof Error ? deleteError.message : 'Ma’lumotni o‘chirib bo‘lmadi.');
    }
  }

  const activeCollection = COLLECTIONS[activeSection];
  const items = activeCollection ? data[activeCollection.dataKey] : [];
  const counts = [
    { key: 'lectures', label: 'Ma’ruzalar', value: data.lectures.length, icon: BookOpen },
    { key: 'presentations', label: 'Taqdimotlar', value: data.presentations.length, icon: Presentation },
    { key: 'assignments', label: 'Topshiriqlar', value: data.assignments.length, icon: ClipboardText },
    { key: 'quizzes', label: 'Kahoot testlari', value: data.quizzes.length, icon: Question },
    { key: 'exhibits', label: 'Muzey eksponatlari', value: data.exhibits.length, icon: Bank },
  ];
  const isMaterialSection = activeSection === 'lectures' || activeSection === 'presentations';

  function renderMaterialTable(section, collectionItems) {
    const isLecture = section === 'lectures';
    const collection = COLLECTIONS[section];

    return (
      <>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Nomi</th>
                <th scope="col">Muallif</th>
                <th scope="col">Fayl</th>
                <th scope="col">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {collectionItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    {!isLecture && item.description && <small>{item.description}</small>}
                  </td>
                  <td>
                    <span>{item.author || '—'}</span>
                  </td>
                  <td>
                    <UploadedFileLink
                      className="admin-file-link"
                      fileId={item.uploadedFileId}
                      fallbackUrl={item.fileUrl || item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.fileUrl || item.downloadUrl ? 'Havolani ochish' : 'Havola mavjud emas'}
                    </UploadedFileLink>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        className="admin-secondary-button"
                        type="button"
                        onClick={() => startEdit(section, item)}
                      >
                        <PencilSimple size={16} weight="regular" aria-hidden="true" />
                        Tahrirlash
                      </button>
                      <button
                        className="admin-danger-button"
                        type="button"
                        onClick={() => deleteItem(section, item)}
                      >
                        <Trash size={16} weight="regular" aria-hidden="true" />
                        O‘chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {collectionItems.length === 0 && (
          <p className="admin-empty">Bu bo‘limda hozircha ma’lumot yo‘q.</p>
        )}
        <Modal
          isOpen={isFormOpen}
          onClose={cancelEdit}
          title={editingItem ? `${collection.singular}ni tahrirlash` : `Yangi ${collection.singular} qo‘shish`}
          dialogClassName="admin-modal"
        >
          <form className="admin-form" onSubmit={(event) => saveItem(event, section)}>
            <div className="admin-form__grid">
              {collection.fields.map((field) => (
                <label
                  className={`admin-field${field.type === 'textarea' ? ' admin-field--full' : ''}`}
                  key={field.key}
                >
                  <span>{field.label}</span>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={draft[field.key] ?? ''}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))}
                      rows={3}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={field.type ?? 'text'}
                      value={draft[field.key] ?? ''}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))}
                      required={field.required}
                    />
                  )}
                </label>
              ))}
            </div>
            {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
            <div className="admin-form__actions">
              <button className="admin-primary-button" type="submit">Saqlash</button>
              <button className="admin-secondary-button" type="button" onClick={cancelEdit}>
                Bekor qilish
              </button>
            </div>
          </form>
        </Modal>
      </>
    );
  }

  function renderQuizBuilder() {
    return (
      <>
        <div className="admin-content__heading">
          <div>
            <p className="admin-page__eyebrow">Testlar katalogi</p>
            <h2 id="admin-collection-heading">{COLLECTIONS.quizzes.title}</h2>
          </div>
          <button
            className="admin-primary-button"
            type="button"
            onClick={startCreateQuiz}
          >
            <Plus size={18} weight="bold" aria-hidden="true" />
            Kahoot havolasini qo‘shish
          </button>
        </div>
        {notice && <p className="admin-message admin-message--success" role="status">{notice}</p>}
        {error && !isFormOpen && <p className="admin-message admin-message--error" role="alert">{error}</p>}
        {items.length > 0 ? (
          <div className="admin-record-list">
            {items.map((quiz) => (
              <article className="admin-record" key={quiz.id}>
                <div className="admin-record__copy">
                  <h3>{quiz.title}</h3>
                  <p>
                    {quiz.kahootUrl
                      ? quiz.description || quiz.kahootUrl
                      : `${quiz.questions?.length ?? 0} ta ichki savol · ${quiz.description}`}
                  </p>
                </div>
                <button
                  className="admin-danger-button"
                  type="button"
                  onClick={() => deleteItem('quizzes', quiz)}
                  aria-label={`${quiz.title} testini o‘chirish`}
                >
                  <Trash size={16} weight="regular" aria-hidden="true" />
                  O‘chirish
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty">Hozircha Kahoot testi mavjud emas.</p>
        )}
        <Modal
          isOpen={isFormOpen && activeSection === 'quizzes'}
          onClose={cancelEdit}
          title="Yangi test yaratish"
          dialogClassName="admin-modal admin-quiz-modal"
        >
          <form className="admin-quiz-form" onSubmit={saveQuiz}>
            {COLLECTIONS.quizzes.fields.map((field) => (
              <label className="admin-field admin-field--full" key={field.key}>
                <span>{field.label}</span>
                <input
                  type={field.type ?? 'text'}
                  value={draft[field.key] ?? ''}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))}
                  required={field.required}
                />
              </label>
            ))}
            <section className="admin-quiz-questions" aria-label="Test savollari">
              <div className="admin-quiz-questions__heading">
                <h3>Savollar <span>{quizQuestions.length} ta</span></h3>
                <button
                  className="admin-secondary-button"
                  type="button"
                  onClick={() => setQuizQuestions((current) => [
                    ...current,
                    { question: '', options: ['', '', '', ''], answer: 0 },
                  ])}
                >
                  <Plus size={16} weight="bold" aria-hidden="true" />
                  Savol qo‘shish
                </button>
              </div>
              {quizQuestions.map((question, questionIndex) => (
                <fieldset className="admin-question" key={`question-${questionIndex + 1}`}>
                  <legend>
                    <span>{questionIndex + 1}-savol</span>
                    {quizQuestions.length > 1 && (
                      <button
                        className="admin-question__remove"
                        type="button"
                        onClick={() => setQuizQuestions((current) => (
                          current.filter((_, index) => index !== questionIndex)
                        ))}
                      >
                        <Trash size={14} weight="regular" aria-hidden="true" />
                        O‘chirish
                      </button>
                    )}
                  </legend>
                  <label className="admin-field admin-field--full">
                    <span>Savol matni</span>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(event) => setQuizQuestions((current) => current.map(
                        (item, index) => index === questionIndex
                          ? { ...item, question: event.target.value }
                          : item,
                      ))}
                      required
                    />
                  </label>
                  <div className="admin-question__options">
                    {question.options.map((option, optionIndex) => (
                      <label className="admin-field" key={`option-${optionIndex + 1}`}>
                        <span>{String.fromCharCode(65 + optionIndex)} varianti</span>
                        <input
                          type="text"
                          value={option}
                          onChange={(event) => setQuizQuestions((current) => current.map(
                            (item, index) => index === questionIndex
                              ? {
                                ...item,
                                options: item.options.map((value, valueIndex) => (
                                  valueIndex === optionIndex ? event.target.value : value
                                )),
                              }
                              : item,
                          ))}
                          required
                        />
                      </label>
                    ))}
                  </div>
                  <fieldset className="admin-correct-answer">
                    <legend>To‘g‘ri javob</legend>
                    {question.options.map((_, optionIndex) => (
                      <label className="admin-correct-answer__option" key={`answer-${optionIndex + 1}`}>
                        <input
                          type="radio"
                          name={`quiz-answer-${questionIndex}`}
                          checked={question.answer === optionIndex}
                          onChange={() => setQuizQuestions((current) => current.map(
                            (item, index) => index === questionIndex
                              ? { ...item, answer: optionIndex }
                              : item,
                          ))}
                        />
                        {String.fromCharCode(65 + optionIndex)}
                      </label>
                    ))}
                  </fieldset>
                </fieldset>
              ))}
            </section>
            {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
            <div className="admin-form__actions">
              <button className="admin-primary-button" type="submit">Testni saqlash</button>
              <button className="admin-secondary-button" type="button" onClick={cancelEdit}>
                Bekor qilish
              </button>
            </div>
          </form>
        </Modal>
      </>
    );
  }

  function renderAssignmentManager() {
    const collection = COLLECTIONS.assignments;

    return (
      <>
        <div className="admin-content__heading">
          <div>
            <p className="admin-page__eyebrow">Talabalar uchun</p>
            <h2 id="admin-collection-heading">{collection.title}</h2>
          </div>
          <button
            className="admin-primary-button"
            type="button"
            onClick={() => startCreate('assignments')}
          >
            <Plus size={18} weight="bold" aria-hidden="true" />
            Yangi topshiriq
          </button>
        </div>
        {notice && <p className="admin-message admin-message--success" role="status">{notice}</p>}
        {error && !isFormOpen && <p className="admin-message admin-message--error" role="alert">{error}</p>}
        {items.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--assignments">
              <thead>
                <tr>
                  <th scope="col">Topshiriq</th>
                  <th scope="col">Muddati</th>
                  <th scope="col">Fayl havolasi</th>
                  <th scope="col">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>
                      <strong>{assignment.title}</strong>
                      <small>{assignment.description}</small>
                    </td>
                    <td>{assignment.dueDate || 'Belgilanmagan'}</td>
                    <td>
                      {assignment.fileUrl ? (
                        <a
                          className="admin-file-link"
                          href={assignment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {assignment.fileName || 'Havolani ochish'}
                        </a>
                      ) : assignment.fileName || '—'}
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          className="admin-secondary-button"
                          type="button"
                          onClick={() => startEdit('assignments', assignment)}
                        >
                          <PencilSimple size={16} weight="regular" aria-hidden="true" />
                          Tahrirlash
                        </button>
                        <button
                          className="admin-danger-button"
                          type="button"
                          onClick={() => deleteItem('assignments', assignment)}
                        >
                          <Trash size={16} weight="regular" aria-hidden="true" />
                          O‘chirish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Hozircha topshiriq mavjud emas.</p>
        )}
        <Modal
          isOpen={isFormOpen && activeSection === 'assignments'}
          onClose={cancelEdit}
          title={editingItem ? 'Topshiriqni tahrirlash' : 'Yangi topshiriq'}
          dialogClassName="admin-modal"
        >
          <form
            className="admin-form"
            onSubmit={(event) => saveItem(event, 'assignments')}
          >
            <div className="admin-form__grid">
              {collection.fields.map((field) => (
                <label
                  className={`admin-field${field.type === 'textarea' ? ' admin-field--full' : ''}`}
                  key={field.key}
                >
                  <span>{field.label}</span>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={draft[field.key] ?? ''}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))}
                      rows={4}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={field.type ?? 'text'}
                      value={draft[field.key] ?? ''}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))}
                      required={field.required}
                    />
                  )}
                </label>
              ))}
            </div>
            {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
            <div className="admin-form__actions">
              <button className="admin-primary-button" type="submit">Saqlash</button>
              <button className="admin-secondary-button" type="button" onClick={cancelEdit}>
                Bekor qilish
              </button>
            </div>
          </form>
        </Modal>
      </>
    );
  }

  async function manageCuratorExhibit(exhibit, action) {
    try {
      if (action === 'approve') {
        await data.updateCuratorExhibit(exhibit.id, { status: 'approved' });
        setNotice(`${exhibit.title} eksponati tasdiqlandi va muzeyga qo‘shildi.`);
      } else {
        await data.deleteCuratorExhibit(exhibit.id);
        setNotice(`${exhibit.title} eksponati o‘chirildi.`);
      }
      setError('');
    } catch (actionError) {
      setNotice('');
      setError(actionError instanceof Error ? actionError.message : 'Eksponat amalini bajarib bo‘lmadi.');
    }
  }

  function renderExhibitManager() {
    const collection = COLLECTIONS.exhibits;
    const pendingExhibits = data.curatorExhibits.filter(
      (exhibit) => exhibit.status !== 'approved',
    );

    return (
      <>
        <div className="admin-content__heading">
          <div>
            <p className="admin-page__eyebrow">Muzey to‘plami</p>
            <h2 id="admin-collection-heading">{collection.title}</h2>
          </div>
          <button
            className="admin-primary-button"
            type="button"
            onClick={() => startCreate('exhibits')}
          >
            <Plus size={18} weight="bold" aria-hidden="true" />
            Yangi eksponat
          </button>
        </div>
        {notice && <p className="admin-message admin-message--success" role="status">{notice}</p>}
        {error && !isFormOpen && <p className="admin-message admin-message--error" role="alert">{error}</p>}

        <section className="admin-exhibit-section" aria-labelledby="admin-exhibits-heading">
          <h3 id="admin-exhibits-heading">Asosiy muzey eksponatlari</h3>
          {data.exhibits.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Rasm</th>
                    <th scope="col">Nomi va tavsifi</th>
                    <th scope="col">Kategoriya</th>
                    <th scope="col">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.exhibits.map((exhibit) => (
                    <tr key={exhibit.id}>
                      <td>
                        <img className="admin-exhibit-thumbnail" src={exhibit.image} alt="" />
                      </td>
                      <td>
                        <strong>{exhibit.title}</strong>
                        <small>{exhibit.description}</small>
                      </td>
                      <td>{exhibit.category}</td>
                      <td>
                        <button
                          className="admin-danger-button"
                          type="button"
                          onClick={() => deleteItem('exhibits', exhibit)}
                        >
                          <Trash size={16} weight="regular" aria-hidden="true" />
                          O‘chirish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">Asosiy muzeyda eksponat yo‘q.</p>
          )}
        </section>

        <section className="admin-exhibit-section" aria-labelledby="curator-submissions-heading">
          <div className="admin-exhibit-section__heading">
            <div>
              <p className="admin-page__eyebrow">Ko‘rib chiqish</p>
              <h3 id="curator-submissions-heading">Talabalar taklif qilgan eksponatlar</h3>
            </div>
            <span className="admin-curator-count">{pendingExhibits.length} ta yangi</span>
          </div>
          {pendingExhibits.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Rasm</th>
                    <th scope="col">Nomi va tavsifi</th>
                    <th scope="col">Muallif / kategoriya</th>
                    <th scope="col">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingExhibits.map((exhibit) => (
                    <tr key={exhibit.id}>
                      <td>
                        <img className="admin-exhibit-thumbnail" src={exhibit.image} alt="" />
                      </td>
                      <td>
                        <strong>{exhibit.title}</strong>
                        <small>{exhibit.description}</small>
                      </td>
                      <td>
                        <span>{exhibit.authorName || 'Talaba'}</span>
                        <small>{exhibit.category}</small>
                      </td>
                      <td>
                        <div className="admin-table__actions">
                          <button
                            className="admin-approve-button"
                            type="button"
                            onClick={() => manageCuratorExhibit(exhibit, 'approve')}
                          >
                            <CheckCircle size={16} weight="regular" aria-hidden="true" />
                            Tasdiqlash
                          </button>
                          <button
                            className="admin-danger-button"
                            type="button"
                            onClick={() => manageCuratorExhibit(exhibit, 'delete')}
                          >
                            <Trash size={16} weight="regular" aria-hidden="true" />
                            O‘chirish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">Ko‘rib chiqish uchun yangi taklif yo‘q.</p>
          )}
        </section>

        <Modal
          isOpen={isFormOpen && activeSection === 'exhibits'}
          onClose={cancelEdit}
          title="Yangi muzey eksponati"
          dialogClassName="admin-modal"
        >
          <form className="admin-form" onSubmit={(event) => saveItem(event, 'exhibits')}>
            <div className="admin-form__grid">
              {collection.fields.map((field) => (
                <label
                  className={`admin-field${field.type === 'textarea' ? ' admin-field--full' : ''}`}
                  key={field.key}
                >
                  <span>{field.label}</span>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={draft[field.key] ?? ''}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))}
                      rows={4}
                      required
                    />
                  ) : (
                    <input
                      type={field.type ?? 'text'}
                      value={draft[field.key] ?? ''}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))}
                      required
                    />
                  )}
                </label>
              ))}
            </div>
            {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
            <div className="admin-form__actions">
              <button className="admin-primary-button" type="submit">Saqlash</button>
              <button className="admin-secondary-button" type="button" onClick={cancelEdit}>
                Bekor qilish
              </button>
            </div>
          </form>
        </Modal>
      </>
    );
  }

  return (
    <section className="admin-page" aria-labelledby="admin-heading">
      <header className="admin-page__header">
        <div className="admin-page__identity">
          <span className="admin-page__identity-icon">
            <GearSix size={23} weight="regular" aria-hidden="true" />
          </span>
          <div>
            <p className="admin-page__eyebrow">Muzey Kompas <span>/</span> boshqaruv</p>
            <h1 className="page-heading" id="admin-heading">Admin panel</h1>
            <p className="admin-page__intro">Kontent, topshiriqlar va talabalar takliflarini boshqaring.</p>
          </div>
        </div>
        <span className="admin-page__mode">
          <span aria-hidden="true" />
          Boshqaruv rejimi
        </span>
        <Link className="admin-exit-button" to="/">
          <ArrowLeft size={17} weight="regular" aria-hidden="true" />
          Paneldan chiqish
        </Link>
      </header>

      <div className="admin-layout">
        <nav className="admin-tabs" aria-label="Admin bo‘limlari">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              className={`admin-tabs__button${activeSection === id ? ' admin-tabs__button--active' : ''}`}
              key={id}
              type="button"
              onClick={() => {
                setActiveSection(id);
                cancelEdit();
                setNotice('');
              }}
              aria-current={activeSection === id ? 'page' : undefined}
            >
              <Icon size={19} weight="regular" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-content">
          {error && activeSection !== 'quizzes' && activeSection !== 'exhibits' && !isMaterialSection && (
            <p className="admin-message admin-message--error" role="alert">{error}</p>
          )}
          {notice && activeSection !== 'quizzes' && activeSection !== 'exhibits' && !isMaterialSection && (
            <p className="admin-message admin-message--success" role="status">{notice}</p>
          )}

          {activeSection === 'overview' ? (
            <section aria-labelledby="admin-overview-heading">
              <div className="admin-content__heading">
                <div>
                  <p className="admin-page__eyebrow">Umumiy ko‘rinish</p>
                  <h2 id="admin-overview-heading">Kontent statistikasi</h2>
                </div>
              </div>
              <div className="admin-stats">
                {counts.map(({ key, label, value, icon: Icon }) => (
                  <article className="admin-stat" key={key}>
                    <span className="admin-stat__icon"><Icon size={21} weight="regular" aria-hidden="true" /></span>
                    <span className="admin-stat__label">{label}</span>
                    <strong>{value}</strong>
                    <button
                      type="button"
                      className="admin-stat__action"
                      onClick={() => {
                        setActiveSection(key);
                        cancelEdit();
                        setNotice('');
                      }}
                    >
                      Boshqarish
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : activeSection === 'quizzes' ? (
            <section aria-labelledby="admin-collection-heading">
              {renderQuizBuilder()}
            </section>
          ) : activeSection === 'assignments' ? (
            <section aria-labelledby="admin-collection-heading">
              {renderAssignmentManager()}
            </section>
          ) : activeSection === 'exhibits' ? (
            <section aria-labelledby="admin-collection-heading">
              {renderExhibitManager()}
            </section>
          ) : isMaterialSection ? (
            <section aria-labelledby="admin-collection-heading">
              <div className="admin-content__heading">
                <div>
                  <p className="admin-page__eyebrow">Kontent boshqaruvi</p>
                  <h2 id="admin-collection-heading">{activeCollection.title}</h2>
                </div>
                <button
                  className="admin-primary-button"
                  type="button"
                  onClick={() => startCreate(activeSection)}
                >
                  <Plus size={18} weight="bold" aria-hidden="true" />
                  Yangi qo‘shish
                </button>
              </div>
              {notice && <p className="admin-message admin-message--success" role="status">{notice}</p>}
              {error && !isFormOpen && <p className="admin-message admin-message--error" role="alert">{error}</p>}
              {renderMaterialTable(activeSection, items)}
            </section>
          ) : (
            <section aria-labelledby="admin-collection-heading">
              <div className="admin-content__heading">
                <div>
                  <p className="admin-page__eyebrow">Kontent boshqaruvi</p>
                  <h2 id="admin-collection-heading">{activeCollection.title}</h2>
                </div>
                {!isFormOpen && (
                  <button
                    className="admin-primary-button"
                    type="button"
                    onClick={() => startCreate(activeSection)}
                  >
                    <Plus size={18} weight="bold" aria-hidden="true" />
                    Qo‘shish
                  </button>
                )}
              </div>

              {isFormOpen && (
                <form className="admin-form" onSubmit={(event) => saveItem(event, activeSection)}>
                  <div className="admin-form__heading">
                    <h3>{editingItem ? 'Ma’lumotni tahrirlash' : 'Yangi ma’lumot'}</h3>
                    <button
                      className="admin-icon-button"
                      type="button"
                      onClick={cancelEdit}
                      aria-label="Formani yopish"
                    >
                      <X size={18} weight="regular" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="admin-form__grid">
                    {activeCollection.fields.map((field) => (
                      <label
                        className={`admin-field${field.type === 'textarea' || field.type === 'json' ? ' admin-field--full' : ''}`}
                        key={field.key}
                      >
                        <span>{field.label}</span>
                        {field.type === 'textarea' || field.type === 'json' ? (
                          <textarea
                            value={draft[field.key] ?? ''}
                            onChange={(event) => setDraft((current) => ({
                              ...current,
                              [field.key]: event.target.value,
                            }))}
                            rows={field.type === 'json' ? 10 : 3}
                            required={field.required}
                          />
                        ) : (
                          <input
                            type={field.type ?? 'text'}
                            min={field.type === 'number' ? '0' : undefined}
                            value={draft[field.key] ?? ''}
                            onChange={(event) => setDraft((current) => ({
                              ...current,
                              [field.key]: event.target.value,
                            }))}
                            required={field.required}
                          />
                        )}
                        {field.hint && <small>{field.hint}</small>}
                      </label>
                    ))}
                  </div>
                  <div className="admin-form__actions">
                    <button className="admin-primary-button" type="submit">
                      {editingItem ? 'Saqlash' : 'Qo‘shish'}
                    </button>
                    <button className="admin-secondary-button" type="button" onClick={cancelEdit}>
                      Bekor qilish
                    </button>
                  </div>
                </form>
              )}

              {items.length > 0 ? (
                <div className="admin-record-list">
                  {items.map((item) => (
                    <article className="admin-record" key={item.id}>
                      <div className="admin-record__copy">
                        <h3>{item.title || item.fileName || `ID: ${item.id}`}</h3>
                        <p>
                          {activeSection === 'quizzes'
                            ? `${item.questions?.length ?? 0} ta savol`
                            : activeSection === 'lectures'
                              ? item.fileName
                              : activeSection === 'presentations'
                                ? item.author
                                : item.description}
                        </p>
                      </div>
                      <div className="admin-record__actions">
                        <button
                          className="admin-icon-button"
                          type="button"
                          onClick={() => startEdit(activeSection, item)}
                          aria-label={`${item.title ?? 'Ma’lumot'}ni tahrirlash`}
                        >
                          <PencilSimple size={18} weight="regular" aria-hidden="true" />
                        </button>
                        <button
                          className="admin-icon-button admin-icon-button--danger"
                          type="button"
                          onClick={() => deleteItem(activeSection, item)}
                          aria-label={`${item.title ?? 'Ma’lumot'}ni o‘chirish`}
                        >
                          <Trash size={18} weight="regular" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                !isFormOpen && (
                  <p className="admin-empty">Bu bo‘limda hozircha ma’lumot yo‘q.</p>
                )
              )}
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminPage;
