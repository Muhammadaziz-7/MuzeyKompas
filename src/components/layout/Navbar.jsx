import { useEffect, useMemo, useState } from 'react';
import {
  Bank,
  Bell,
  BellSimple,
  FileDoc,
  List,
  MagnifyingGlass,
  Moon,
  Presentation,
  Question,
  SignIn,
  SignOut,
  Sun,
  X,
} from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useTheme } from '../../context/useTheme.js';
import { searchContent } from '../../services/globalSearchService.js';
import Modal from '../ui/Modal.jsx';
import './Navbar.css';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'new-lecture',
    title: 'Yangi ma’ruza qo‘shildi',
    detail: 'Muzey pedagogikasi asoslari ma’ruzasi bilan tanishing.',
    Icon: FileDoc,
  },
  {
    id: 'quiz-results',
    title: 'Test natijangiz tayyor',
    detail: 'So‘nggi test natijalarini ko‘rish uchun profilingizga o‘ting.',
    Icon: Question,
  },
  {
    id: 'new-presentation',
    title: 'Yangi taqdimot mavjud',
    detail: 'O‘quv materiallari katalogida yangi prezentatsiya bor.',
    Icon: Presentation,
  },
];

function readNotifications() {
  return { notifications: DEFAULT_NOTIFICATIONS, error: '' };
}

function mapNotifications(parsedNotifications) {
    if (
      !Array.isArray(parsedNotifications)
      || !parsedNotifications.every((notification) =>
        notification
        && typeof notification.id === 'string'
        && typeof notification.title === 'string'
        && typeof notification.detail === 'string'
        && DEFAULT_NOTIFICATIONS.some((defaultNotification) =>
          defaultNotification.id === notification.id),
      )
    ) {
      throw new Error('Bildirishnomalar ro‘yxati noto‘g‘ri formatda.');
    }

    const notifications = parsedNotifications.map((notification) => ({
      ...notification,
      Icon: DEFAULT_NOTIFICATIONS.find((item) => item.id === notification.id).Icon,
    }));
    return notifications;
}

function Navbar({ showMenu, isMobileMenuOpen, onMenuToggle }) {
  const {
    userName,
    userData,
    login,
    logout,
    storageError,
    updateUserSettings,
  } = useAuth();
  const { lectures, presentations, quizzes, exhibits, dataError } = useData();
  const { theme, toggleTheme, storageError: themeStorageError } = useTheme();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationState, setNotificationState] = useState(readNotifications);
  const [notificationError, setNotificationError] = useState(notificationState.error);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginRole, setLoginRole] = useState('student');
  const [teacherCode, setTeacherCode] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const searchResults = useMemo(
    () => searchContent(searchQuery, {
      currentLectures: lectures,
      currentPresentations: presentations,
      currentQuizzes: quizzes,
      currentExhibits: exhibits,
    }),
    [exhibits, lectures, presentations, quizzes, searchQuery],
  );

  useEffect(() => {
    const savedNotifications = userData.settings?.notifications;
    if (savedNotifications !== undefined) {
      try {
        const notifications = mapNotifications(savedNotifications);
        setNotificationState({ notifications, error: '' });
        setNotificationError('');
      } catch (error) {
        setNotificationError(
          error instanceof Error
            ? `Bildirishnomalarni yuklab bo‘lmadi: ${error.message}`
            : 'Bildirishnomalar noto‘g‘ri formatda.',
        );
      }
    }
  }, [userData.settings?.notifications]);

  useEffect(() => {
    function handleSearchShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    }

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined;
    }

    function closeNotifications(event) {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    }

    window.addEventListener('keydown', closeNotifications);
    return () => window.removeEventListener('keydown', closeNotifications);
  }, [isNotificationsOpen]);

  async function markNotificationRead(notificationId) {
    const notifications = notificationState.notifications.filter(
      (notification) => notification.id !== notificationId,
    );

    try {
      await updateUserSettings({
        notifications: notifications.map(({ id, title, detail }) => ({ id, title, detail })),
      });
      setNotificationError('');
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? `Bildirishnomani Firestore’da saqlab bo‘lmadi: ${error.message}`
          : 'Bildirishnomani Firestore’da saqlab bo‘lmadi.',
      );
      return;
    }

    setNotificationState((current) => ({ ...current, notifications }));
  }

  function openSearchResult(result) {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(result.to);
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!loginName.trim() || (loginRole === 'admin' && !adminPassword)) {
      setLoginError(loginRole === 'admin'
        ? 'Admin email va parolni kiriting.'
        : 'Iltimos, ismingizni kiriting.');
      return;
    }

    if (await login(loginName, loginRole, teacherCode, adminPassword)) {
      setLoginName('');
      setTeacherCode('');
      setAdminPassword('');
      setLoginRole('student');
      setLoginError('');
      setIsLoginOpen(false);
    } else {
      setLoginError(storageError || 'Kirish amalga oshmadi. Ma’lumotlarni tekshiring.');
    }
  }

  function handleLogout() {
    logout();
  }

  return (
    <header className="app-navbar">
      {showMenu && (
        <button
          className="app-navbar__menu-button"
          type="button"
          onClick={onMenuToggle}
          aria-label={isMobileMenuOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="app-sidebar-menu"
        >
          {isMobileMenuOpen
            ? <X size={22} weight="regular" aria-hidden="true" />
            : <List size={22} weight="regular" aria-hidden="true" />}
        </button>
      )}
      <Link className="app-navbar__brand" to="/" aria-label="Muzey Kompas bosh sahifasi">
        <span className="app-navbar__logo" aria-hidden="true">
          <Bank size={22} weight="light" />
        </span>
        <span>Muzey Kompas</span>
      </Link>

      <div className="app-navbar__actions">
        <button
          className="app-navbar__search-button"
          type="button"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Global qidiruvni ochish"
        >
          <MagnifyingGlass size={19} weight="regular" aria-hidden="true" />
          <span>Qidirish</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button
          className="app-navbar__theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Yorug‘ rejimga o‘tkazish' : 'Qorong‘i rejimga o‘tkazish'}
          aria-pressed={theme === 'dark'}
          title={theme === 'dark' ? 'Yorug‘ rejim' : 'Qorong‘i rejim'}
        >
          {theme === 'dark'
            ? <Sun size={19} weight="regular" aria-hidden="true" />
            : <Moon size={19} weight="regular" aria-hidden="true" />}
        </button>
        {userName ? (
          <>
            <span className="app-navbar__user">{userName}</span>
            <button className="app-navbar__auth-button" type="button" onClick={handleLogout}>
              <SignOut size={17} weight="regular" aria-hidden="true" />
              <span>Chiqish</span>
            </button>
          </>
        ) : (
          <button
            className="app-navbar__auth-button"
            type="button"
            onClick={() => setIsLoginOpen(true)}
          >
            <SignIn size={17} weight="regular" aria-hidden="true" />
            <span>Kirish</span>
          </button>
        )}
        <div className="app-navbar__notification-wrap">
          <button
            className="app-navbar__notification"
            type="button"
            onClick={() => setIsNotificationsOpen((open) => !open)}
            aria-label={`Bildirishnomalar${notificationState.notifications.length ? `, ${notificationState.notifications.length} ta o‘qilmagan` : ''}`}
            aria-expanded={isNotificationsOpen}
            aria-controls="app-notifications"
          >
            <Bell size={20} weight="regular" aria-hidden="true" />
            {notificationState.notifications.length > 0 && (
              <span className="app-navbar__notification-count">
                {notificationState.notifications.length}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <section
              className="app-notifications"
              id="app-notifications"
              aria-label="Bildirishnomalar"
            >
              <div className="app-notifications__heading">
                <h2>Bildirishnomalar</h2>
                <button
                  type="button"
                  className="app-notifications__close"
                  onClick={() => setIsNotificationsOpen(false)}
                  aria-label="Bildirishnomalarni yopish"
                >
                  <X size={17} weight="regular" aria-hidden="true" />
                </button>
              </div>
              {notificationState.notifications.length > 0 ? (
                <ul className="app-notifications__list">
                  {notificationState.notifications.map(({ id, title, detail, Icon }) => (
                    <li key={id}>
                      <button
                        className="app-notifications__item"
                        type="button"
                        onClick={() => markNotificationRead(id)}
                        aria-label={`${title}. ${detail} O‘qilgan deb belgilash`}
                      >
                        <span className="app-notifications__icon" aria-hidden="true">
                          <Icon size={19} weight="regular" />
                        </span>
                        <span>
                          <strong>{title}</strong>
                          <span>{detail}</span>
                        </span>
                        <BellSimple className="app-notifications__unread" size={12} weight="fill" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="app-notifications__empty">Yangi bildirishnomalar yo‘q.</p>
              )}
              {notificationError && (
                <p className="app-notifications__error" role="alert">{notificationError}</p>
              )}
            </section>
          )}
        </div>
      </div>
      {(storageError || dataError || themeStorageError || notificationError) && (
        <span className="app-navbar__error" role="alert">
          {storageError || dataError || themeStorageError || notificationError}
        </span>
      )}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery('');
        }}
        title="Qidiruv"
        dialogClassName="modal-dialog--spotlight"
      >
        <div className="global-search">
          <label className="global-search__input-wrap" htmlFor="global-search-input">
            <MagnifyingGlass size={21} weight="regular" aria-hidden="true" />
            <input
              id="global-search-input"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Ma’ruza, eksponat yoki testni qidiring"
              autoComplete="off"
              autoFocus
            />
            <kbd>ESC</kbd>
          </label>
          <div className="global-search__results" aria-live="polite">
            {searchQuery.trim() ? (
              searchResults.length > 0 ? (
                <ul>
                  {searchResults.map(({ id, title, category, detail, Icon, ...result }) => (
                    <li key={id}>
                      <button
                        className="global-search__result"
                        type="button"
                        onClick={() => openSearchResult(result)}
                      >
                        <span className="global-search__result-icon" aria-hidden="true">
                          <Icon size={19} weight="regular" />
                        </span>
                        <span className="global-search__result-copy">
                          <strong>{title}</strong>
                          <span>{category} · {detail}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="global-search__empty">Mos natijalar topilmadi.</p>
              )
            ) : (
              <p className="global-search__hint">Ma’ruzalar, prezentatsiyalar, testlar va eksponatlarni qidiring.</p>
            )}
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false);
          setLoginError('');
        }}
        title="Tizimga kirish"
      >
        <form className="app-login-form" onSubmit={handleLogin}>
          <label className="app-login-form__label" htmlFor="login-name">
            {loginRole === 'admin' ? 'Admin email' : 'Ismingiz'}
          </label>
          <input
            className="app-login-form__input"
            id="login-name"
            type={loginRole === 'admin' ? 'email' : 'text'}
            value={loginName}
            onChange={(event) => {
              setLoginName(event.target.value);
              setLoginError('');
            }}
            placeholder={loginRole === 'admin' ? 'admin@example.com' : 'Ismingizni kiriting'}
            autoComplete={loginRole === 'admin' ? 'username' : 'given-name'}
            autoFocus
            maxLength={80}
            required
          />
          <label className="app-login-form__label" htmlFor="login-role">Foydalanuvchi turi</label>
          <select
            className="app-login-form__input"
            id="login-role"
            value={loginRole}
            onChange={(event) => {
              setLoginRole(event.target.value);
              setLoginError('');
            }}
          >
            <option value="student">Talaba</option>
            <option value="teacher">O‘qituvchi</option>
            <option value="admin">Administrator</option>
          </select>
          {loginRole === 'teacher' && (
            <>
              <label className="app-login-form__label" htmlFor="teacher-code">O‘qituvchi kodi</label>
              <input
                className="app-login-form__input"
                id="teacher-code"
                type="password"
                value={teacherCode}
                onChange={(event) => {
                  setTeacherCode(event.target.value);
                  setLoginError('');
                }}
                autoComplete="off"
                required
              />
            </>
          )}
          {loginRole === 'admin' && (
            <>
              <label className="app-login-form__label" htmlFor="admin-password">Admin paroli</label>
              <input
                className="app-login-form__input"
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(event) => {
                  setAdminPassword(event.target.value);
                  setLoginError('');
                }}
                autoComplete="current-password"
                required
              />
            </>
          )}
          {loginError && <p className="app-login-form__error" role="alert">{loginError}</p>}
          <button className="app-login-form__submit" type="submit">
            Kirish
          </button>
        </form>
      </Modal>
    </header>
  );
}

export default Navbar;
