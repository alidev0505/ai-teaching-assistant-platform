import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext'; 
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LiveClasses from './pages/LiveClasses';
import Attendance from './pages/Attendance';
import CreateQuiz from "./pages/CreateQuiz";
import TakeQuiz from './pages/TakeQuiz';
import QuizDetails from './pages/QuizDetails';
import TeacherAnalytics from './pages/TeacherAnalytics';
import StudentAttendance from './pages/StudentAttendance';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CourseDetail from './pages/CourseDetail';
import GenerateContent from './pages/GenerateContent';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminReports from './pages/admin/AdminReports';
import AdminDepartments from './pages/admin/AdminDepartments';
import ManageSemesters from './pages/admin/ManageSemesters';
import AdminClass from './pages/admin/AdminClass';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';

import './App.css';

const AppContent = () => {
  const location = useLocation();
  const { loading, user } = useContext(AuthContext); 

  if (loading) {
    return (
      <div className="pr-loading-fullscreen-wrapper">
        <div className="pr-loading-spinner-box">
          <div className="ac-spinner" />
          <h2 className="app-init-heading">Initializing SmartTutor Engine...</h2>
        </div>
      </div>
    );
  }

  const isLandingPage = location.pathname === '/';

  const getDashboardRedirect = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  };

  return (
    <>
      {!isLandingPage && <Navbar />}

      {/* 🟢 WRAP ALL ROUTES IN THIS CONTAINER */}
      <div className={!isLandingPage ? "main-app-content-container" : ""}>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? getDashboardRedirect() : <Login />} />
        <Route path="/signup" element={user ? getDashboardRedirect() : <Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* --- Protected Routes --- */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/course/:courseId/create-quiz" element={<ProtectedRoute role="teacher"><CreateQuiz /></ProtectedRoute>} />
        <Route path="/quiz/:quizId/take" element={<ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>} />
        <Route path="/take-quiz/:quizId" element={<ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>} />
        <Route path="/quiz/:quizId/view" element={<ProtectedRoute role="teacher"><QuizDetails /></ProtectedRoute>} />
        <Route path="/course/:courseId/analytics" element={<ProtectedRoute role="teacher"><TeacherAnalytics /></ProtectedRoute>} />
        <Route path="/attendance/:courseId" element={<ProtectedRoute role="teacher"><Attendance /></ProtectedRoute>} />
        <Route path="/live-classes" element={<ProtectedRoute><LiveClasses /></ProtectedRoute>} />
        <Route path="/generate/:materialId" element={<ProtectedRoute role="teacher"><GenerateContent /></ProtectedRoute>} />

        <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/attendance" element={<ProtectedRoute role="student"><StudentAttendance /></ProtectedRoute>} />
        <Route path="/course/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />

        {/* --- Admin Routes --- */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute role="admin"><AdminCourses /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/semesters" element={<ProtectedRoute role="admin"><ManageSemesters /></ProtectedRoute>} />
        <Route path="/admin/departments" element={<ProtectedRoute role="admin"><AdminDepartments /></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute role="admin"><AdminAnnouncements /></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute role="admin"><AdminClass /></ProtectedRoute>} />
        <Route path="/admin/calendar" element={<ProtectedRoute role="admin"><AdminCalendar /></ProtectedRoute>} />

        <Route path="*" element={getDashboardRedirect()} />
      </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;