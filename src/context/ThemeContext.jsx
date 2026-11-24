import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeContext } from './themeContext.js';
import { useAuth } from './AuthContext.jsx';

const STORAGE_KEY = 'muzey-kompas:theme';

function readInitialTheme() {
  try {
    return {
      theme: localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light',
      storageError: '',
    };
  } catch (error) {
    return {
      theme: 'light',
      storageError: error instanceof Error
        ? `Mavzu sozlamasini o‘qib bo‘lmadi: ${error.message}`
        : 'Mavzu sozlamasini localStorage’dan o‘qib bo‘lmadi.',
    };
  }
}

export function ThemeProvider({ children }) {
  const [themeState, setThemeState] = useState(readInitialTheme);
  const { theme, storageError } = themeState;
  const { isAuthReady, updateUserSettings, userData } = useAuth();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }
    const savedTheme = userData.settings?.theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeState({ theme: savedTheme, storageError: '' });
    }
  }, [isAuthReady, userData.settings?.theme]);

  const setTheme = useCallback((nextTheme) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') {
      throw new Error('Mavzu faqat "light" yoki "dark" bo‘lishi mumkin.');
    }

    setThemeState({ theme: nextTheme, storageError: '' });
    updateUserSettings({ theme: nextTheme }).catch((error) => {
      setThemeState({
        theme: nextTheme,
        storageError: error instanceof Error
          ? error.message
          : 'Mavzu sozlamasini Firestore’da saqlab bo‘lmadi.',
      });
    });
  }, [updateUserSettings]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, storageError }),
    [theme, setTheme, toggleTheme, storageError],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
