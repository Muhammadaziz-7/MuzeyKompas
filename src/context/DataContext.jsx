import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  collection,
  onSnapshot,
} from 'firebase/firestore';
import lecturesData from '../data/lectures.json';
import presentationsData from '../data/presentations.json';
import quizzesData from '../data/quizzes.json';
import exhibitsData from '../data/exhibits.json';
import videosData from '../data/videos.json';
import { firestore } from '../firebase.js';
import {
  addCollectionItem,
  deleteCollectionItem,
  updateCollectionItem,
} from '../services/firestoreContentService.js';
import { useAuth } from './AuthContext.jsx';

const INITIAL_COLLECTIONS = {
  lectures: lecturesData,
  presentations: presentationsData,
  assignments: [],
  quizzes: quizzesData,
  exhibits: exhibitsData,
  curatorExhibits: [],
  videos: videosData,
};
const COLLECTION_NAMES = Object.keys(INITIAL_COLLECTIONS);
const DataContext = createContext(null);

function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

function mergeSnapshotWithDefaults(name, documents) {
  if (name === 'curatorExhibits') {
    return documents
      .filter(({ deleted }) => !deleted)
      .map(({ deleted: _deleted, ...item }) => ({
        ...item,
        category: item.category ?? 'Tarix',
        status: item.status ?? 'pending',
      }));
  }

  const items = new Map(INITIAL_COLLECTIONS[name].map((item) => [String(item.id), item]));
  for (const document of documents) {
    const id = String(document.id);
    if (document.deleted) {
      items.delete(id);
    } else {
      const { deleted: _deleted, ...item } = document;
      items.set(id, { ...items.get(id), ...item, id });
    }
  }
  return [...items.values()];
}

function validateItem(item, name) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new TypeError(`${name} uchun ma’lumot obyekt bo‘lishi kerak.`);
  }
}

export function DataProvider({ children }) {
  const { firebaseUser, isAuthReady, storageError, userName } = useAuth();
  const [collections, setCollections] = useState(INITIAL_COLLECTIONS);
  const [dataErrors, setDataErrors] = useState({});
  const [readyCollections, setReadyCollections] = useState(() => new Set());
  const collectionsRef = useRef(collections);
  const isLoading = !isAuthReady
    || Boolean(firestore && firebaseUser && readyCollections.size < COLLECTION_NAMES.length);

  useEffect(() => {
    collectionsRef.current = collections;
  }, [collections]);

  useEffect(() => {
    if (!isAuthReady) {
      return undefined;
    }

    if (!firestore || !firebaseUser) {
      return undefined;
    }

    let active = true;
    const pendingCollections = new Set(COLLECTION_NAMES);

    function finishInitialLoad(name) {
      pendingCollections.delete(name);
      if (active) {
        setReadyCollections((current) => {
          if (current.has(name)) {
            return current;
          }
          return new Set([...current, name]);
        });
      }
    }

    const unsubscribers = COLLECTION_NAMES.map((name) => onSnapshot(
      collection(firestore, name),
      (snapshot) => {
        try {
          const documents = snapshot.docs.map((snapshotDocument) => ({
            ...snapshotDocument.data(),
            id: snapshotDocument.id,
          }));
          const nextItems = mergeSnapshotWithDefaults(name, documents);
          if (active) {
            setCollections((current) => ({ ...current, [name]: nextItems }));
            setDataErrors((current) => ({ ...current, [name]: '' }));
          }
        } catch (error) {
          if (active) {
            setDataErrors((current) => ({
              ...current,
              [name]: `${name} ma’lumotlarini o‘qib bo‘lmadi: ${getErrorMessage(error, 'noto‘g‘ri format.')}`,
            }));
          }
        } finally {
          finishInitialLoad(name);
        }
      },
      (error) => {
        if (active) {
          setDataErrors((current) => ({
            ...current,
            [name]: `${name} Firestore’dan yuklanmadi: ${getErrorMessage(error, 'ruxsat yoki tarmoq xatosi.')}`,
          }));
          finishInitialLoad(name);
        }
      },
    ));

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [firebaseUser, isAuthReady]);

  const create = useCallback(async (name, item) => {
    validateItem(item, name);
    if (!firestore || !firebaseUser) {
      throw new Error('Firebase sessiyasi mavjud emas. Internet ulanishi va sozlamalarni tekshiring.');
    }

    const createdItem = { ...item };
    if (name === 'curatorExhibits') {
      createdItem.authorUid = firebaseUser.uid;
      createdItem.authorName = item.authorName || userName || 'Talaba';
      createdItem.status = 'pending';
    }

    try {
      const savedItem = await addCollectionItem(name, createdItem);
      setDataErrors((current) => ({ ...current, [name]: '' }));
      return savedItem;
    } catch (error) {
      const message = `${name} ma’lumotini Firebase’da saqlab bo‘lmadi: ${getErrorMessage(error, 'noma’lum xato.')}`;
      setDataErrors((current) => ({ ...current, [name]: message }));
      throw new Error(message, { cause: error });
    }
  }, [firebaseUser, userName]);

  const update = useCallback(async (name, id, changes) => {
    validateItem(changes, name);
    if (!firestore || !firebaseUser) {
      throw new Error('Firebase sessiyasi mavjud emas. Internet ulanishi va sozlamalarni tekshiring.');
    }
    if (changes.id !== undefined && String(changes.id) !== String(id)) {
      throw new Error(`${name} ID sini o‘zgartirib bo‘lmaydi.`);
    }

    const currentItem = (collectionsRef.current[name] ?? []).find(
      (item) => String(item.id) === String(id),
    );
    if (!currentItem) {
      throw new Error(`${name} topilmadi: ${id}`);
    }
    const updatedItem = { ...currentItem, ...changes, id };

    try {
      await updateCollectionItem(name, id, updatedItem);
      setDataErrors((current) => ({ ...current, [name]: '' }));
      return updatedItem;
    } catch (error) {
      const message = `${name} ma’lumotini Firebase’da yangilab bo‘lmadi: ${getErrorMessage(error, 'noma’lum xato.')}`;
      setDataErrors((current) => ({ ...current, [name]: message }));
      throw new Error(message, { cause: error });
    }
  }, [firebaseUser]);

  const remove = useCallback(async (name, id) => {
    if (!firestore || !firebaseUser) {
      throw new Error('Firebase sessiyasi mavjud emas. Internet ulanishi va sozlamalarni tekshiring.');
    }

    const existingItem = (collectionsRef.current[name] ?? []).find(
      (item) => String(item.id) === String(id),
    );
    if (!existingItem) {
      throw new Error(`${name} topilmadi: ${id}`);
    }

    try {
      await deleteCollectionItem(name, id, { soft: name !== 'curatorExhibits' });
      setDataErrors((current) => ({ ...current, [name]: '' }));
      return existingItem;
    } catch (error) {
      const message = `${name} ma’lumotini Firebase’dan o‘chirib bo‘lmadi: ${getErrorMessage(error, 'noma’lum xato.')}`;
      setDataErrors((current) => ({ ...current, [name]: message }));
      throw new Error(message, { cause: error });
    }
  }, [firebaseUser]);

  const dataError = [storageError, ...Object.values(dataErrors)].filter(Boolean).join(' ');
  const value = useMemo(() => ({
    isLoading,
    dataError,
    lectures: collections.lectures,
    addLecture: (item) => create('lectures', item),
    updateLecture: (id, changes) => update('lectures', id, changes),
    deleteLecture: (id) => remove('lectures', id),
    presentations: collections.presentations,
    addPresentation: (item) => create('presentations', item),
    updatePresentation: (id, changes) => update('presentations', id, changes),
    deletePresentation: (id) => remove('presentations', id),
    assignments: collections.assignments,
    addAssignment: (item) => create('assignments', item),
    updateAssignment: (id, changes) => update('assignments', id, changes),
    deleteAssignment: (id) => remove('assignments', id),
    quizzes: collections.quizzes,
    addQuiz: (item) => create('quizzes', item),
    updateQuiz: (id, changes) => update('quizzes', id, changes),
    deleteQuiz: (id) => remove('quizzes', id),
    exhibits: collections.exhibits,
    addExhibit: (item) => create('exhibits', item),
    updateExhibit: (id, changes) => update('exhibits', id, changes),
    deleteExhibit: (id) => remove('exhibits', id),
    curatorExhibits: collections.curatorExhibits,
    addCuratorExhibit: (item) => create('curatorExhibits', item),
    updateCuratorExhibit: (id, changes) => update('curatorExhibits', id, changes),
    deleteCuratorExhibit: (id) => remove('curatorExhibits', id),
    videos: collections.videos,
    addVideo: (item) => create('videos', item),
    updateVideo: (id, changes) => update('videos', id, changes),
    deleteVideo: (id) => remove('videos', id),
  }), [collections, create, dataError, isLoading, remove, update]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === null) {
    throw new Error('useData() DataProvider ichida ishlatilishi kerak.');
  }
  return context;
}
