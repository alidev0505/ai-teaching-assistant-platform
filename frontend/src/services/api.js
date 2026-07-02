import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true' // <--- ADD THIS VIP PASS
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Auth ---
export const login = (data) => api.post('/auth/login', data);
export const signup = (data) => api.post('/auth/signup', data);
export const getCurrentUser = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/update', data);
export const getProfileStats = () => api.get('/auth/profile-stats');
export const changePassword = (data) => api.post('/auth/change-password', data);

// --- Teacher/Student Courses ---
export const createCourse = (data) => api.post('/content/course', data);
export const getCourses = () => api.get('/dashboard/courses'); 
export const getAllCourses = () => api.get('/dashboard/courses/all');
export const enrollCourse = (courseId) => api.post(`/dashboard/enroll/${courseId}`);
// Note: enrollInCourse is an alias often used in components, mapping to the same logic
export const enrollInCourse = (code) => api.post(`/dashboard/enroll/${code}`); 
export const getCourseDetails = (id) => api.get(`/content/course/${id}`);

// --- ✅ SEMESTER FEATURES ---
export const getActiveSemesters = () => api.get('/content/semesters/active');
export const getTeacherSemesterCourses = (semId) => api.get(`/content/teacher/courses/${semId}`);
export const getStudentSemesterCourses = (semId) => api.get(`/content/student/courses/${semId}`);
export const getAllSemesterCourses = (semId) => api.get(`/content/semester/${semId}/available`);

// --- Generated Content ---
export const getCourseGeneratedContent = (courseId) => api.get(`/content/generated/course/${courseId}`);
export const deleteGeneratedContent = (contentId) => api.delete(`/content/generated/${contentId}`);

// --- Materials ---
export const uploadMaterial = (formData) => 
  api.post('/content/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMaterials = (courseId) => api.get(`/content/materials/${courseId}`);
export const deleteMaterial = (materialId) => api.delete(`/content/materials/${materialId}`);

// --- Content Generation ---
export const generateContent = (data) => api.post('/content/generate', data);

// ✅ UPDATED: Accepts format ('docx'/'pdf') AND includeSolutions (boolean)
export const downloadContent = (contentId, format, includeSolutions) => 
  api.get(`/content/download/${contentId}`, { 
    params: { 
        format: format, 
        solutions: includeSolutions // Sends ?solutions=true/false to backend
    },
    responseType: 'blob' 
  });

// --- Assignments ---
export const getAssignments = (courseId) => api.get(`/content/assignments/${courseId}`);
export const createAssignment = (formData) => 
    api.post('/content/assignment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
export const getAssignmentDetail = (assignmentId) => api.get(`/content/assignment/${assignmentId}`);
export const deleteAssignment = (assignmentId) => api.delete(`/content/assignment/${assignmentId}`);
export const getCourseAssignments = (courseId) => api.get(`/content/assignments/${courseId}`);
export const submitAssignment = (formData) => api.post('/content/submit', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const removeSubmission = (assignmentId) => api.delete(`/content/submission/delete/${assignmentId}`);
export const getSubmissions = (assignmentId) => api.get(`/content/submissions/${assignmentId}`);

// ✅ NEW: Submit & Grade with AI
export const submitAndGradeAssignment = (data) => api.post('/content/assignment/submit-and-grade', data);
// ✅ ADD THIS FUNCTION:
export const publishGrade = (data) => api.post('/content/submission/publish', data);

export const downloadFile = (path) => 
    api.get(`/content/download-file?path=${encodeURIComponent(path)}`, { responseType: 'blob' });

export const exportStudentList = (courseId) => 
    api.get(`/dashboard/export-students/${courseId}`, { responseType: 'blob' });

// --- Analytics ---
export const getCourseAnalytics = (courseId) => api.get(`/content/analytics/${courseId}`);
export const getStudentAnalytics = () => api.get('/content/analytics/student/me');
export const getQuizStats = (quizId) => api.get(`/quiz/${quizId}/stats`);
export const getStudentGrades = (courseId) => api.get(`/content/grades/${courseId}/me`);

// --- Student Management ---
export const getEnrolledStudents = (courseId) => api.get(`/dashboard/course/${courseId}/students`);
export const removeStudent = (courseId, studentId) => api.delete(`/dashboard/course/${courseId}/student/${studentId}`);

export const searchCourseByCode = (code) => api.get(`/dashboard/search-course/${code}`);

export const dropCourse = (courseId) => api.delete(`/dashboard/enrollment/${courseId}`);

// --- Attendance ---
export const markAttendance = (data) => api.post('/content/attendance/mark', data);
export const getAttendance = (courseId) => api.get(`/content/attendance/${courseId}`);
export const lockAttendance = (data) => api.post('/content/attendance/lock', data);
export const getAttendanceReport = (courseId) => api.get(`/content/attendance/report/${courseId}`);

// --- Live Class ---
export const createLiveSession = (data) => api.post('/content/live/schedule', data);
export const getLiveSessions = (courseId) => api.get(`/content/live/course/${courseId}`);
export const getAllLiveSessions = () => api.get('/content/live/all_sessions');
export const deleteLiveSession = (id) => api.delete(`/content/live-sessions/${id}`);

// --- Feedback ---
export const submitFeedback = (courseId, data) => api.post(`/student/course/${courseId}/feedback`, data);

// ==========================================
// 🚀 ADMIN API
// ==========================================

export const createSemester = (data) => api.post('/admin/semester', data);
export const getSemesters = () => api.get('/admin/semesters');
export const toggleSemester = (id) => api.put(`/admin/semester/${id}/toggle`);
export const getAdminOverview = () => api.get('/admin/overview');
export const getInstitutions = () => api.get('/admin/institutions'); 
export const createInstitution = (data) => api.post('/admin/institution/create', data); 
export const deleteInstitution = (id) => api.delete(`/admin/institution/${id}`); 
export const getUsers = () => api.get('/admin/users');
export const updateUserRole = (id, data) => api.put(`/admin/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const getAdminCourses = () => api.get('/admin/courses');
export const getAllCoursesAdmin = () => api.get('/admin/courses');
export const deleteCourse = (id) => api.delete(`/admin/course/${id}`); 
export const getReports = () => api.get('/admin/reports'); 
export const adminUnlockAttendance = (courseId) => api.put(`/admin/course/${courseId}/unlock`);
export const getAllFeedback = () => api.get('/admin/feedback-stats');

// --- Quiz Management ---
export const getCourseQuizzes = (courseId) => api.get(`/quiz/course/${courseId}`);
export const getQuizDetail = (quizId) => api.get(`/quiz/${quizId}`);
export const publishQuiz = (quizId, data) => api.post(`/quiz/${quizId}/assign`, data);
export const submitQuizAnswers = (data) => api.post('/quiz/submit', data);

// --- Announcements ---
export const getAnnouncements = () => api.get('/admin/announcements');
export const postAnnouncement = (data) => api.post('/admin/announcement', data);
export const deleteAnnouncement = (id) => api.delete(`/admin/announcement/${id}`);

// --- Schedule Management ---
export const uploadSchedule = async (formData) => {
    const token = localStorage.getItem('token'); 
    
    const response = await fetch(`${API_BASE_URL}/admin/upload-schedule`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Bypass-Tunnel-Reminder': 'true' // <--- ADD THIS HERE TOO
        },
        body: formData
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return { data }; 
};

export const updateCourseSchedule = (courseId, data) => api.put(`/admin/course/${courseId}/schedule`, data);

export const downloadAttendanceFile = async (courseId) => {
    try {
        const response = await api.get(`/admin/course/${courseId}/export_attendance`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Attendance_Report_${courseId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error("Download failed", error);
        alert("Failed to download file");
    }
};

export const downloadScheduleCsv = async () => {
    try {
        const response = await api.get('/admin/export-schedule', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Final_Schedule_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        return true;
    } catch (error) {
        console.error("Export failed", error);
        alert("Failed to download schedule");
        return false;
    }
};

export default api;