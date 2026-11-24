import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';

const CONTENT_COLLECTIONS = [
  'lectures',
  'presentations',
  'assignments',
  'quizzes',
  'exhibits',
  'curatorExhibits',
];

function getCollectionReference(name) {
  if (!db) {
    throw new Error('Firebase Firestore sozlanmagan. .env faylini tekshiring.');
  }
  if (!CONTENT_COLLECTIONS.includes(name)) {
    throw new Error(`Firestore kolleksiyasi ruxsat etilmagan: ${name}`);
  }
  return collection(db, name);
}

export async function getCollectionItems(name) {
  const snapshot = await getDocs(getCollectionReference(name));
  return snapshot.docs
    .map((item) => ({ ...item.data(), id: item.id }))
    .filter((item) => !item.deleted)
    .map(({ deleted: _deleted, ...item }) => item);
}

export async function addCollectionItem(name, item) {
  const document = await addDoc(getCollectionReference(name), item);
  return { ...item, id: document.id };
}

export async function updateCollectionItem(name, id, changes) {
  if (!id) {
    throw new Error('Firestore hujjati ID si ko‘rsatilmagan.');
  }
  const reference = doc(getCollectionReference(name), String(id));
  await setDoc(reference, { ...changes, id: String(id) }, { merge: true });
  return { ...changes, id: String(id) };
}

export async function deleteCollectionItem(name, id, { soft = false } = {}) {
  if (!id) {
    throw new Error('O‘chiriladigan Firestore hujjati ID si ko‘rsatilmagan.');
  }
  const reference = doc(getCollectionReference(name), String(id));
  if (soft) {
    await setDoc(reference, {
      id: String(id),
      deleted: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return;
  }
  await deleteDoc(reference);
}

export const getLectures = () => getCollectionItems('lectures');
export const addLecture = (item) => addCollectionItem('lectures', item);
export const deleteLecture = (id) => deleteCollectionItem('lectures', id, { soft: true });
export const getPresentations = () => getCollectionItems('presentations');
export const addPresentation = (item) => addCollectionItem('presentations', item);
export const deletePresentation = (id) => deleteCollectionItem('presentations', id, { soft: true });
export const getAssignments = () => getCollectionItems('assignments');
export const addAssignment = (item) => addCollectionItem('assignments', item);
export const deleteAssignment = (id) => deleteCollectionItem('assignments', id, { soft: true });
export const getQuizzes = () => getCollectionItems('quizzes');
export const addQuiz = (item) => addCollectionItem('quizzes', item);
export const deleteQuiz = (id) => deleteCollectionItem('quizzes', id, { soft: true });
export const getMuseumExhibits = () => getCollectionItems('exhibits');
export const addMuseumExhibit = (item) => addCollectionItem('exhibits', item);
export const deleteMuseumExhibit = (id) => deleteCollectionItem('exhibits', id, { soft: true });
