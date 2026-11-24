import {
  arrayUnion,
  collection,
  doc,
  getCountFromServer,
  getDocs,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';

const LEGACY_KEYS = {
  userName: 'muzey-kompas:user-name',
  userRole: 'muzey-kompas:user-role',
  theme: 'muzey-kompas:theme',
  notifications: 'muzey-kompas:notifications',
  quizCompletions: 'muzey-kompas:quiz-completions',
  stories: 'muzey-kompas:student-stories',
  students: 'muzey-kompas:students',
};

function getUserReference(uid) {
  if (!db) {
    throw new Error('Firebase Firestore sozlanmagan. .env faylini tekshiring.');
  }
  if (typeof uid !== 'string' || !uid.trim()) {
    throw new Error('Foydalanuvchining Firebase UID si ko‘rsatilmagan.');
  }
  return doc(db, 'users', uid);
}

function readLegacyJson(key, fallback) {
  const saved = localStorage.getItem(key);
  if (saved === null) {
    return fallback;
  }
  try {
    return JSON.parse(saved);
  } catch (error) {
    throw new Error(`${key} ma’lumoti noto‘g‘ri JSON formatida.`, { cause: error });
  }
}

function getLegacyStudentId(uid, name) {
  let first = 2166136261;
  let second = 2246822519;
  for (const character of name.trim().toLocaleLowerCase()) {
    const code = character.codePointAt(0);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second ^ code, 3266489917);
  }
  return `${uid}_legacy_${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
}

function readLegacyUserData(userName, userRole) {
  const normalizedName = userName.trim().toLocaleLowerCase();
  const userKey = encodeURIComponent(normalizedName || 'guest');
  const quizResults = readLegacyJson(`muzey-kompas:quiz-results:${userKey}`, []);
  const exhibitAnalyses = readLegacyJson(
    `muzey-kompas:critical-analysis:${userKey}`,
    {},
  );
  const timeTravelAnswers = readLegacyJson(
    `muzey-kompas:time-travel:${userKey}`,
    {},
  );
  const stories = readLegacyJson(LEGACY_KEYS.stories, []);
  const students = readLegacyJson(LEGACY_KEYS.students, []);
  const notifications = readLegacyJson(LEGACY_KEYS.notifications, null);
  const quizCompletions = localStorage.getItem(LEGACY_KEYS.quizCompletions);

  if (
    !Array.isArray(quizResults)
    || !Array.isArray(stories)
    || !Array.isArray(students)
    || !students.every((name) => typeof name === 'string')
  ) {
    throw new Error('Saqlangan shaxsiy ma’lumotlar ro‘yxati noto‘g‘ri formatda.');
  }
  if (
    !exhibitAnalyses
    || typeof exhibitAnalyses !== 'object'
    || Array.isArray(exhibitAnalyses)
    || !timeTravelAnswers
    || typeof timeTravelAnswers !== 'object'
    || Array.isArray(timeTravelAnswers)
  ) {
    throw new Error('Saqlangan shaxsiy javoblar noto‘g‘ri formatda.');
  }

  const userStories = stories.filter((story) => (
    story
    && typeof story.authorName === 'string'
    && story.authorName.trim().toLocaleLowerCase() === normalizedName
  ));
  const settings = {};
  const savedTheme = localStorage.getItem(LEGACY_KEYS.theme);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    settings.theme = savedTheme;
  }
  if (notifications !== null) {
    settings.notifications = notifications;
  }
  if (quizCompletions !== null) {
    const count = Number(quizCompletions);
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('Testlar soni noto‘g‘ri formatda.');
    }
    settings.quizCompletions = count;
  }

  return {
    profile: userName
      ? { displayName: userName, role: userRole || 'student' }
      : {},
    settings,
    quizResults,
    exhibitAnalyses,
    timeTravelAnswers,
    stories: userStories,
    students: [...new Set(students.map((name) => name.trim()).filter(Boolean))],
  };
}

export async function getUserData(uid) {
  const snapshot = await getDoc(getUserReference(uid));
  return snapshot.exists() ? snapshot.data() : {};
}

export async function saveUserData(uid, updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw new TypeError('Foydalanuvchi ma’lumotlari obyekt bo‘lishi kerak.');
  }
  await setDoc(getUserReference(uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return getUserData(uid);
}

export async function saveUserProfile(uid, profile) {
  return saveUserData(uid, { profile });
}

export async function saveUserSettings(uid, settings) {
  return saveUserData(uid, { settings });
}

export async function addQuizResult(uid, result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new TypeError('Test natijasi noto‘g‘ri formatda.');
  }
  const reference = getUserReference(uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists() ? snapshot.data() : {};
    const quizCompletions = Number.isSafeInteger(current.settings?.quizCompletions)
      ? current.settings.quizCompletions
      : (current.quizResults?.length ?? 0);
    transaction.set(reference, {
      quizResults: arrayUnion(result),
      settings: {
        ...current.settings,
        quizCompletions: quizCompletions + 1,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  return getUserData(uid);
}

export async function saveUserActivity(uid, field, key, value) {
  if (!['exhibitAnalyses', 'timeTravelAnswers'].includes(field)) {
    throw new Error(`Shaxsiy faoliyat turi ruxsat etilmagan: ${field}`);
  }
  if (typeof key !== 'string' || !key) {
    throw new Error('Faoliyat ma’lumotining kaliti ko‘rsatilmagan.');
  }
  const currentUser = await getUserData(uid);
  return saveUserData(uid, {
    [field]: {
      ...(currentUser[field] ?? {}),
      [key]: value,
    },
  });
}

export async function saveUserStory(uid, story) {
  if (!story || typeof story !== 'object' || Array.isArray(story)) {
    throw new TypeError('Hikoya noto‘g‘ri formatda.');
  }
  const currentUser = await getUserData(uid);
  const savedStory = { ...story, authorUid: uid };
  const stories = Array.isArray(currentUser.stories) ? currentUser.stories : [];
  const existingIndex = stories.findIndex((item) => (
    String(item.exhibitId) === String(story.exhibitId)
  ));
  const updatedStories = existingIndex < 0
    ? [savedStory, ...stories]
    : stories.map((item, index) => (index === existingIndex ? savedStory : item));
  const updatedUser = await saveUserData(uid, { stories: updatedStories });
  const publicStoryId = `${uid}_${encodeURIComponent(String(story.exhibitId))}`;
  await setDoc(doc(db, 'stories', publicStoryId), savedStory);
  return updatedUser;
}

export async function getPublicStories() {
  if (!db) {
    throw new Error('Firebase Firestore sozlanmagan. .env faylini tekshiring.');
  }
  const snapshot = await getDocs(collection(db, 'stories'));
  return snapshot.docs
    .map((item) => ({ ...item.data(), id: item.id }))
    .filter((story) => !story.deleted);
}

export async function registerStudent(uid, displayName) {
  if (!db) {
    throw new Error('Firebase Firestore sozlanmagan. .env faylini tekshiring.');
  }
  if (typeof displayName !== 'string' || !displayName.trim()) {
    throw new Error('Talaba ismi ko‘rsatilmagan.');
  }
  await setDoc(doc(db, 'students', uid), {
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getStudentCount() {
  if (!db) {
    throw new Error('Firebase Firestore sozlanmagan. .env faylini tekshiring.');
  }
  const snapshot = await getCountFromServer(collection(db, 'students'));
  return snapshot.data().count;
}

export async function migrateLegacyUserData(uid, userName, userRole) {
  const reference = getUserReference(uid);
  const legacyData = readLegacyUserData(userName, userRole);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists() ? snapshot.data() : {};
    const updates = {};

    if (!current.profile?.displayName && legacyData.profile.displayName) {
      updates.profile = { ...current.profile, ...legacyData.profile };
    }
    if (current.settings?.theme === undefined && legacyData.settings.theme) {
      updates.settings = { ...current.settings, theme: legacyData.settings.theme };
    }
    for (const key of ['notifications', 'quizCompletions']) {
      if (current.settings?.[key] === undefined && legacyData.settings[key] !== undefined) {
        updates.settings = { ...current.settings, ...updates.settings, [key]: legacyData.settings[key] };
      }
    }
    for (const field of ['quizResults', 'stories']) {
      if ((!Array.isArray(current[field]) || current[field].length === 0) && legacyData[field].length > 0) {
        updates[field] = legacyData[field];
      }
    }
    for (const field of ['exhibitAnalyses', 'timeTravelAnswers']) {
      if (
        (!current[field] || Object.keys(current[field]).length === 0)
        && Object.keys(legacyData[field]).length > 0
      ) {
        updates[field] = legacyData[field];
      }
    }
    const migrateStudents = !current.settings?.legacyStudentsMigrated
      && legacyData.students.length > 0;
    if (migrateStudents) {
      updates.settings = {
        ...current.settings,
        ...updates.settings,
        legacyStudentsMigrated: true,
      };
      for (const name of legacyData.students) {
        transaction.set(
          doc(db, 'students', getLegacyStudentId(uid, name)),
          { legacy: true, updatedAt: serverTimestamp() },
          { merge: true },
        );
      }
    }
    if (Object.keys(updates).length > 0) {
      transaction.set(reference, {
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  });
  await Promise.all(legacyData.stories.map((story) => setDoc(
    doc(db, 'stories', `${uid}_${encodeURIComponent(String(story.exhibitId))}`),
    { ...story, authorUid: uid },
    { merge: true },
  )));
  if (typeof window !== 'undefined') {
    const normalizedName = userName.trim().toLocaleLowerCase();
    const userKey = encodeURIComponent(normalizedName || 'guest');
    for (const key of [
      LEGACY_KEYS.userName,
      LEGACY_KEYS.userRole,
      LEGACY_KEYS.theme,
      LEGACY_KEYS.notifications,
      LEGACY_KEYS.quizCompletions,
      LEGACY_KEYS.students,
      `muzey-kompas:quiz-results:${userKey}`,
      `muzey-kompas:critical-analysis:${userKey}`,
      `muzey-kompas:time-travel:${userKey}`,
    ]) {
      localStorage.removeItem(key);
    }
  }

  return getUserData(uid);
}
