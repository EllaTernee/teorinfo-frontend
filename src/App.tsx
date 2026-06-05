// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/HomePage';
import Course from './pages/CoursePage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonPage from './pages/LessonPage';
import QuizPage from './pages/QuizPage';
import TrainerPage from './pages/TrainerPage';
import LeaderboardPage from './pages/LeaderboardPage';
import GlossaryPage from './pages/GlossaryPage';
import AchievementsPage from './pages/AchievementsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './styles/App.css';
import ForumList from './components/ForumList';
import ForumDetail from './components/ForumDetail';

// Компонент для защиты маршрутов
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

// Компонент для защиты админ-маршрутов
const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return role === 'admin' ? element : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      {/* Навбар показываем ВСЕГДА */}
      <Navbar isLoggedIn={isAuthenticated} onLogout={logout} />
      
      <Routes>
        {/* Публичные маршруты (доступны всем) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/courses" element={<Course />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/leaderboard/:courseId" element={<LeaderboardPage />} />
        
        {/* Защищённые маршруты (только для авторизованных) */}
        <Route path="/lesson/:courseId/:lessonId" element={<ProtectedRoute element={<LessonPage />} />} />
        <Route path="/quiz/:courseId" element={<ProtectedRoute element={<QuizPage />} />} />
        <Route path="/trainer" element={<ProtectedRoute element={<TrainerPage />} />} />
        <Route path="/achievements" element={<ProtectedRoute element={<AchievementsPage />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
        <Route path="/course/:courseId/forums" element={<ProtectedRoute element={<ForumList />} />} />
        <Route path="/course/:courseId/forum/:forumId" element={<ProtectedRoute element={<ForumDetail />} />} />
        
        {/* Админ-маршруты */}
        <Route path="/admin/courses" element={<AdminRoute element={<AdminCoursesPage />} />} />
        
        {/* Fallback - 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;