import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../firebase.js';
import {
  addQuizResult as addQuizResultToFirestore,
  getUserData,
  migrateLegacyUserData,
  saveUserProfile,
  saveUserSettings,
  saveUserActivity as saveUserActivityToFirestore,
  saveUserStory as saveUserStoryToFirestore,
  registerStudent,
} from '../services/userService.js';

const STORAGE_KEY = 'muzey-kompas:user-name';
const ROLE_STORAGE_KEY = 'muzey-kompas:user-role';
const LOGGED_OUT_KEY = 'muzey-kompas:logged-out';
const TEACHER_ACCESS_CODE = 'gt5773';
const AuthContext = createContext(null);

function getErrorMessage(error, fallback) {
  if (
    error?.code === 'auth/configuration-not-found'
    || error?.code === 'auth/operation-not-allowed'
  ) {
    return 'Firebase Console → Authentication bo‘limida Anonymous kirishni yoqing.';
  }
  return error instanceof Error ? error.message : fallback;
}

export function AuthProvider({ children }) {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [claims, setClaims] = useState({});
  const [userData, setUserData] = useState({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      const savedName = localStorage.getItem(STORAGE_KEY) ?? '';
      const savedRole = localStorage.getItem(ROLE_STORAGE_KEY) === 'teacher'
        ? 'teacher'
        : savedName
          ? 'student'
          : '';
      setUserName(savedName);
      setUserRole(savedRole);
    } catch (error) {
      setStorageError(`Kirish ma’lumotini o‘qib bo‘lmadi: ${getErrorMessage(error, 'localStorage xatosi.')}`);
    }

    if (!isFirebaseConfigured || !firebaseAuth) {
      setStorageError('Firebase sozlamalari topilmadi. .env.local faylini tekshiring.');
      setIsAuthReady(true);
      return undefined;
    }

    let active = true;
    let isStartingAnonymousSession = false;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!active) {
        return;
      }

      if (!user) {
        if (isStartingAnonymousSession) {
          return;
        }
        isStartingAnonymousSession = true;
        try {
          await signInAnonymously(firebaseAuth);
        } catch (error) {
          if (active) {
            setStorageError(`Firebase’ga anonim kirib bo‘lmadi: ${getErrorMessage(error, 'noma’lum xato.')}`);
            setIsAuthReady(true);
          }
        } finally {
          isStartingAnonymousSession = false;
        }
        return;
      }

      try {
        const token = await user.getIdTokenResult(true);
        const savedName = user.isAnonymous ? localStorage.getItem(STORAGE_KEY) ?? '' : '';
        const savedRole = user.isAnonymous ? localStorage.getItem(ROLE_STORAGE_KEY) ?? '' : '';
        const userProfile = user.isAnonymous
          ? await migrateLegacyUserData(user.uid, savedName, savedRole)
          : await getUserData(user.uid);
        if (
          user.isAnonymous
          && userProfile.profile?.role === 'student'
          && userProfile.profile.displayName
        ) {
          await registerStudent(user.uid, userProfile.profile.displayName);
        }
        const isLoggedOut = localStorage.getItem(LOGGED_OUT_KEY) === 'true';
        if (active) {
          setFirebaseUser(user);
          setClaims(token.claims);
          setUserData(userProfile);
          setUserName(isLoggedOut ? '' : userProfile.profile?.displayName ?? savedName);
          setUserRole(isLoggedOut
            ? ''
            : token.claims.admin === true
              ? 'admin'
              : userProfile.profile?.role ?? savedRole);
          setStorageError('');
          setIsAuthReady(true);
        }
      } catch (error) {
        if (active) {
          setFirebaseUser(user);
          setUserData({});
          setStorageError(`Firebase ruxsatlarini tekshirib bo‘lmadi: ${getErrorMessage(error, 'noma’lum xato.')}`);
          setIsAuthReady(true);
        }
      }
    }, (error) => {
      if (active) {
        setStorageError(`Firebase autentifikatsiya xatosi: ${getErrorMessage(error, 'noma’lum xato.')}`);
        setIsAuthReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (
    name,
    role = 'student',
    teacherCode = '',
    password = '',
  ) => {
    if (role === 'admin') {
      if (!name.trim() || !password) {
        setStorageError('Admin email va parolni kiriting.');
        return false;
      }
      if (!firebaseAuth) {
        setStorageError('Firebase Authentication sozlanmagan.');
        return false;
      }
      try {
        const credential = await signInWithEmailAndPassword(
          firebaseAuth,
          name.trim(),
          password,
        );
        const token = await credential.user.getIdTokenResult(true);
        if (token.claims.admin !== true) {
          await signOut(firebaseAuth);
          setStorageError('Bu hisobga admin huquqi berilmagan.');
          return false;
        }
        const profile = await getUserData(credential.user.uid);
        localStorage.removeItem(LOGGED_OUT_KEY);
        setFirebaseUser(credential.user);
        setClaims(token.claims);
        setUserData(profile);
        setUserName(profile.profile?.displayName ?? credential.user.email ?? name.trim());
        setUserRole('admin');
        setStorageError('');
        return true;
      } catch (error) {
        setStorageError(`Admin sifatida kirib bo‘lmadi: ${getErrorMessage(error, 'email yoki parol xatosi.')}`);
        return false;
      }
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      setStorageError('Iltimos, ismingizni kiriting.');
      return false;
    }

    if (role !== 'student' && role !== 'teacher') {
      setStorageError('Tanlangan foydalanuvchi turi noto‘g‘ri.');
      return false;
    }

    if (role === 'teacher' && teacherCode !== TEACHER_ACCESS_CODE) {
      setStorageError('O‘qituvchi kodi noto‘g‘ri.');
      return false;
    }

    if (!firebaseUser) {
      setStorageError('Firebase sessiyasi hali tayyor emas. Birozdan so‘ng qayta urinib ko‘ring.');
      return false;
    }

    try {
      if (role === 'student') {
        await registerStudent(firebaseUser.uid, normalizedName);
      }
      const profile = { ...(userData.profile ?? {}), displayName: normalizedName, role };
      const updatedData = await saveUserProfile(firebaseUser.uid, profile);
      localStorage.removeItem(LOGGED_OUT_KEY);
      setUserData(updatedData);
      setUserName(normalizedName);
      setUserRole(role);
      setStorageError('');
      return true;
    } catch (error) {
      setStorageError(`Profilni Firestore’da saqlab bo‘lmadi: ${getErrorMessage(error, 'noma’lum xato.')}`);
      return false;
    }
  }, [firebaseUser, userData.profile]);

  const updateUserSettings = useCallback(async (settings) => {
    if (!firebaseUser) {
      throw new Error('Firebase sessiyasi mavjud emas.');
    }
    const updatedSettings = { ...(userData.settings ?? {}), ...settings };
    try {
      const updatedData = await saveUserSettings(firebaseUser.uid, updatedSettings);
      setUserData(updatedData);
      setStorageError('');
      return updatedData.settings;
    } catch (error) {
      const message = `Foydalanuvchi sozlamalarini Firestore’da saqlab bo‘lmadi: ${getErrorMessage(error, 'noma’lum xato.')}`;
      setStorageError(message);
      throw new Error(message, { cause: error });
    }
  }, [firebaseUser, userData.settings]);

  const saveQuizResult = useCallback(async (result) => {
    if (!firebaseUser) {
      throw new Error('Firebase sessiyasi mavjud emas.');
    }
    try {
      const updatedData = await addQuizResultToFirestore(firebaseUser.uid, result);
      setUserData(updatedData);
      setStorageError('');
    } catch (error) {
      const message = `Test natijasini Firestore’da saqlab bo‘lmadi: ${getErrorMessage(error, 'noma’lum xato.')}`;
      setStorageError(message);
      throw new Error(message, { cause: error });
    }
  }, [firebaseUser]);

  const saveUserActivity = useCallback(async (field, key, value) => {
    if (!firebaseUser) {
      throw new Error('Firebase sessiyasi mavjud emas.');
    }
    try {
      const updatedData = await saveUserActivityToFirestore(
        firebaseUser.uid,
        field,
        key,
        value,
      );
      setUserData(updatedData);
      setStorageError('');
    } catch (error) {
      const message = `Shaxsiy ma’lumotni Firestore’da saqlab bo‘lmadi: ${getErrorMessage(error, 'noma’lum xato.')}`;
      setStorageError(message);
      throw new Error(message, { cause: error });
    }
  }, [firebaseUser]);

  const saveUserStory = useCallback(async (story) => {
    if (!firebaseUser) {
      throw new Error('Firebase sessiyasi mavjud emas.');
    }
    try {
      const updatedData = await saveUserStoryToFirestore(firebaseUser.uid, story);
      setUserData(updatedData);
      setStorageError('');
    } catch (error) {
      const message = `Hikoyani Firestore’da saqlab bo‘lmadi: ${getErrorMessage(error, 'noma’lum xato.')}`;
      setStorageError(message);
      throw new Error(message, { cause: error });
    }
  }, [firebaseUser]);

  const logout = useCallback(async () => {
    try {
      localStorage.setItem(LOGGED_OUT_KEY, 'true');
      if (firebaseUser && !firebaseUser.isAnonymous && firebaseAuth) {
        await signOut(firebaseAuth);
      }
    } catch (error) {
      setStorageError(`Tizimdan chiqib bo‘lmadi: ${getErrorMessage(error, 'localStorage xatosi.')}`);
      return;
    }

    setUserName('');
    setUserRole('');
    setStorageError('');
    return true;
  }, [firebaseUser]);

  const value = useMemo(
    () => ({
      userName,
      userRole,
      firebaseUser,
      userData,
      isAdmin: claims.admin === true,
      isModerator: claims.admin === true || claims.teacher === true,
      isAuthReady,
      login,
      logout,
      updateUserSettings,
      saveQuizResult,
      saveUserActivity,
      saveUserStory,
      storageError,
    }),
    [
      userName,
      userRole,
      firebaseUser,
      userData,
      claims,
      isAuthReady,
      login,
      logout,
      updateUserSettings,
      saveQuizResult,
      saveUserActivity,
      saveUserStory,
      storageError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth faqat AuthProvider ichida ishlatilishi mumkin.');
  }
  return context;
}
