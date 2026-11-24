import { useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import DataLoadingState from './components/ui/DataLoadingState.jsx';
import { useData } from './context/DataContext.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MuseumPage from './pages/MuseumPage.jsx';
import CuratorPage from './pages/CuratorPage.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import QuizGame from './features/assignments/QuizGame.jsx';
import KahootPage from './pages/KahootPage.jsx';
import MuseumQuest from './features/museum/MuseumQuest.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import CertificatePage from './pages/CertificatePage.jsx';
import StudentStoriesPage from './pages/StudentStoriesPage.jsx';
import LecturesPage from './pages/LecturesPage.jsx';
import PresentationsPage from './pages/PresentationsPage.jsx';
import VideosPage from './pages/VideosPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import TestFirebase from './pages/TestFirebase.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import './App.css';
import './hig.css';

function Layout() {
  const location = useLocation();
  const { isLoading, dataError } = useData();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={`app-shell${isAdminRoute ? ' app-shell--admin' : ''}`}>
      <Navbar
        showMenu={!isAdminRoute}
        isMobileMenuOpen={isMobileMenuOpen}
        onMenuToggle={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
      />
      <div className="app-shell__body">
        {!isAdminRoute && (
          <Sidebar
            isMobileMenuOpen={isMobileMenuOpen}
            onMobileMenuClose={() => setIsMobileMenuOpen(false)}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            className={`app-shell__content${isAdminRoute ? ' app-shell__content--admin' : ''}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.div
                  key="loading"
                  className="app-shell__async-content"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <DataLoadingState label="Firebase ma’lumotlari yuklanmoqda..." />
                </motion.div>
              ) : (
                <motion.div
                  key="loaded"
                  className="app-shell__async-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  {dataError && (
                    <p className="app-data-error" role="alert">
                      {dataError}
                    </p>
                  )}
                  <Outlet />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/museum" element={<MuseumPage />} />
            <Route path="/curator" element={<CuratorPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/quiz" element={<QuizGame />} />
            <Route path="/quiz/:quizId" element={<QuizGame />} />
            <Route path="/kahoot" element={<KahootPage />} />
            <Route path="/games" element={<MuseumQuest />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/certificate" element={<CertificatePage />} />
            <Route path="/stories" element={<StudentStoriesPage />} />
            <Route path="/lectures" element={<LecturesPage />} />
            <Route path="/presentations" element={<PresentationsPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/test" element={<TestFirebase />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
