import {
  Bank,
  BookOpen,
  ClipboardText,
  GearSix,
  GameController,
  House,
  Images,
  Notebook,
  Presentation,
  Question,
  ShieldCheck,
  VideoCamera,
  Link,
} from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Sidebar.css';

const navigationItems = [
  { label: 'Dashboard', to: '/', icon: House, end: true },
  { label: 'Muzey', to: '/museum', icon: Bank },
  { label: 'Talabalar ijodi', to: '/stories', icon: BookOpen },
  { label: 'Mening Muzeyim (Kurator)', to: '/curator', icon: Images },
];

function Sidebar({ isMobileMenuOpen, onMobileMenuClose }) {
  const { userRole, isAdmin } = useAuth();

  return (
    <aside
      className={`app-sidebar${isMobileMenuOpen ? ' app-sidebar--open' : ''}`}
      aria-label="Asosiy navigatsiya"
    >
      <button
        className="app-sidebar__backdrop"
        type="button"
        onClick={onMobileMenuClose}
        aria-label="Menyuni yopish"
      />
      <div
        className="app-sidebar__content"
        id="app-sidebar-menu"
        onClick={(event) => {
          if (event.target.closest('a')) {
            onMobileMenuClose();
          }
        }}
      >
      <p className="app-sidebar__section-label">Asosiy menyu</p>
      <nav className="app-sidebar__nav">
        {navigationItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
            }
          >
            <Icon size={19} weight="regular" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <p className="app-sidebar__section-label app-sidebar__section-label--learning">
        O‘quv jarayoni
      </p>
      <nav className="app-sidebar__nav" aria-label="O‘quv jarayoni">
        <NavLink
          to="/assignments"
          className={({ isActive }) =>
            `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
          }
        >
          <ClipboardText size={19} weight="regular" aria-hidden="true" />
          <span>Topshiriqlar</span>
        </NavLink>
        <NavLink
          to="/lectures"
          className={({ isActive }) =>
            `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
          }
        >
          <Notebook size={19} weight="regular" aria-hidden="true" />
          <span>Ma’ruzalar</span>
        </NavLink>
        <NavLink
          to="/presentations"
          className={({ isActive }) =>
            `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
          }
        >
          <Presentation size={19} weight="regular" aria-hidden="true" />
          <span>Taqdimotlar</span>
        </NavLink>
        <NavLink
          to="/videos"
          className={({ isActive }) =>
            `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
          }
        >
          <VideoCamera size={19} weight="regular" aria-hidden="true" />
          <span>Videolar</span>
        </NavLink>
        <NavLink
          to="/resources"
          className={({ isActive }) =>
            `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
          }
        >
          <Link size={19} weight="regular" aria-hidden="true" />
          <span>Foydali manbalar</span>
        </NavLink>
        <NavLink
          to="/kahoot"
          className={({ isActive }) =>
            `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
          }
        >
          <Question size={19} weight="regular" aria-hidden="true" />
          <span>Kahoot testlari</span>
        </NavLink>
        <NavLink
          to="/games"
          className={({ isActive }) =>
            `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
          }
        >
          <GameController size={19} weight="regular" aria-hidden="true" />
          <span>O‘yinlar</span>
        </NavLink>
      </nav>
      {userRole === 'teacher' && (
        <>
          <p className="app-sidebar__section-label app-sidebar__section-label--teacher">
            Boshqaruv
          </p>
          <nav className="app-sidebar__nav" aria-label="O‘qituvchi boshqaruvi">
            <NavLink
              to="/teacher"
              className={({ isActive }) =>
                `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
              }
            >
              <ShieldCheck size={19} weight="regular" aria-hidden="true" />
              <span>O‘qituvchi paneli</span>
            </NavLink>
          </nav>
        </>
      )}
      {isAdmin && (
        <>
          <p className="app-sidebar__section-label app-sidebar__section-label--teacher">
            Boshqaruv
          </p>
          <nav className="app-sidebar__nav" aria-label="Administrator boshqaruvi">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
              }
            >
              <GearSix size={19} weight="regular" aria-hidden="true" />
              <span>Admin Panel</span>
            </NavLink>
          </nav>
        </>
      )}
      </div>
    </aside>
  );
}

export default Sidebar;
