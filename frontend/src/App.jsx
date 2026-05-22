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
import Profile from './pages/Profile'; // ✅ ADDED: Profile Page Import

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
import AdminBatchUpload from './pages/admin/AdminBatchUpload';
import AdminFeedback from './pages/admin/AdminFeedback';

import './App.css';

const AppContent = () => {
  const location = useLocation();
  const { loading, user } = useContext(AuthContext); 

  // 🔥 UI & UX FIX: Hardened, Elegant loading state layout using CSS animations
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        fontFamily: "'Segoe UI', Roboto, sans-serif"
      }}>
        <div className="ai-spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTop: '4px solid #38bdf8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2 style={{ fontWeight: '400', letterSpacing: '1px', fontSize: '1.25rem' }}>
          Initializing SmartTutor Engine...
        </h2>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const isLandingPage = location.pathname === '/';

  // Helper logic to route a user cleanly back to their designated workspace home directory
  const getDashboardRedirect = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  };

  return (
    <>
      {!isLandingPage && <Navbar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? getDashboardRedirect() : <Login />} />
        <Route path="/signup" element={user ? getDashboardRedirect() : <Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* --- General Protected Routes --- */}
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute> 
        } />

        {/* --- Teacher Routes --- */}
        <Route path="/teacher" element={
          <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
        } />
        <Route path="/course/:courseId/create-quiz" element={
          <ProtectedRoute role="teacher"><CreateQuiz /></ProtectedRoute>
        } />
        <Route path="/quiz/:quizId/take" element={
          <ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>
        } />
        <Route path="/take-quiz/:quizId" element={
          <ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>
        } />
        <Route path="/quiz/:quizId/view" element={
          <ProtectedRoute role="teacher"><QuizDetails /></ProtectedRoute>
        } />
        <Route path="/course/:courseId/analytics" element={
          <ProtectedRoute role="teacher"><TeacherAnalytics /></ProtectedRoute>
        } />
        <Route path="/attendance/:courseId" element={
          <ProtectedRoute role="teacher"><Attendance /></ProtectedRoute>
        } />
        <Route path="/live-classes" element={
          <ProtectedRoute><LiveClasses /></ProtectedRoute>
        } />
        <Route path="/generate/:materialId" element={
          <ProtectedRoute role="teacher"><GenerateContent /></ProtectedRoute>
        } />

        {/* --- Student Routes --- */}
        <Route path="/student" element={
          <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/student/attendance" element={
          <ProtectedRoute role="student"><StudentAttendance /></ProtectedRoute>
        } />
        
        {/* Shared Course Detail (Teacher & Student) */}
        <Route path="/course/:id" element={
          <ProtectedRoute><CourseDetail /></ProtectedRoute>
        } />

        {/* --- Admin Routes --- */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>
        } />
        <Route path="/admin/courses" element={
          <ProtectedRoute role="admin"><AdminCourses /></ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>
        } />
        <Route path="/admin/semesters" element={
          <ProtectedRoute role="admin"><ManageSemesters /></ProtectedRoute>
        } />
        <Route path="/admin/departments" element={
          <ProtectedRoute role="admin"><AdminDepartments /></ProtectedRoute>
        } />
        <Route path="/admin/feedback" element={
            <ProtectedRoute role="admin"><AdminFeedback /></ProtectedRoute>
        } />
        <Route path="/admin/announcements" element={
          <ProtectedRoute role="admin"><AdminAnnouncements /></ProtectedRoute>
        } />
        <Route path="/admin/classes" element={
            <ProtectedRoute role="admin"><AdminClass /></ProtectedRoute>
        } />
        <Route path="/admin/upload" element={
            <ProtectedRoute role="admin"><AdminBatchUpload /></ProtectedRoute>
        } />
        <Route path="/admin/calendar" element={
            <ProtectedRoute role="admin"><AdminCalendar /></ProtectedRoute>
        } />

        {/* 🔥 SECURITY FIX: Intelligent Route Fallback Matrix */}
        <Route path="*" element={getDashboardRedirect()} />

      </Routes>
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