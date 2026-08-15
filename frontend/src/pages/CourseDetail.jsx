import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import FeedbackModal from '../components/FeedbackModal';
import CreateSessionModal from '../components/CreateSessionModal';
import StudentAssignmentView from './StudentAssignmentView';
import GradingModal from '../components/GradingModal';

// Split Tab Components
import MaterialsTab from '../components/CourseDetailTabs/MaterialsTab';
import AssignmentsTab from '../components/CourseDetailTabs/AssignmentsTab';
import AIResourcesTab from '../components/CourseDetailTabs/AIResourcesTab';
import LiveClassesTab from '../components/CourseDetailTabs/LiveClassesTab';
import GradesTab from '../components/CourseDetailTabs/GradesTab';
import StudentsTab from '../components/CourseDetailTabs/StudentsTab';

import { AuthContext } from '../context/AuthContext';

import api, {
  getMaterials, uploadMaterial, createAssignment, getAssignments,
  getEnrolledStudents, removeStudent,
  deleteAssignment, getCourseGeneratedContent, deleteGeneratedContent,
  deleteMaterial, dropCourse, deleteLiveSession, getLiveSessions,
  getStudentGrades, getAttendanceReport, getSubmissions
} from '../services/api';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // --- Core States Matrix ---
  const [courseInfo, setCourseInfo] = useState({ name: '', count: 0, code: '' });
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [generatedResources, setGeneratedResources] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState(null);

  // --- Navigation & Modal UI Flags ---
  const [activeTab, setActiveTab] = useState('materials');
  const [uploading, setUploading] = useState(false);
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemAlert, setSystemAlert] = useState({ type: '', text: '' });

  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);

  const [newAssign, setNewAssign] = useState({ title: '', description: '', deadline: '', teacher_solution: '' });
  const [assignFile, setAssignFile] = useState(null);
  const [solutionFile, setSolutionFile] = useState(null);

  useEffect(() => {
    fetchData();
    fetchQuizzes();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'ai_resources') fetchGeneratedResources();
    if (activeTab === 'live') fetchLiveSessions();
  }, [activeTab, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setSystemAlert({ type: '', text: '' });
      const matRes = await getMaterials(id);
      setMaterials(matRes?.data?.materials || []);
      setCourseInfo({
        name: matRes?.data?.course_name || 'Classroom Channel',
        count: matRes?.data?.student_count || 0,
        code: matRes?.data?.course_code || ''
      });

      const assRes = await getAssignments(id);
      setAssignments(assRes?.data?.assignments || []);

      if (user?.role === 'student') {
        try {
          const gradeRes = await getStudentGrades(id);
          setGrades(gradeRes?.data?.grades || []);
          // ❌ Removed the attendance call from the student check
        } catch (e) {
          console.error("Error matching student analytics report cards:", e);
        }
      } else if (user?.role === 'teacher') {
        // ✅ Moved it here so ONLY teachers request the master report
        try {
          const attRes = await getAttendanceReport(id);
          setAttendance(attRes?.data || null);
        } catch (e) {
          console.error("Error fetching teacher attendance report:", e);
        }
      }
    } catch (err) {
      console.error(err);
      setSystemAlert({ type: 'error', text: 'Synchronization Error: Awaiting background ledger check.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await getEnrolledStudents(id);
      setStudents(res?.data?.students || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGeneratedResources = async () => {
    try {
      const res = await getCourseGeneratedContent(id);
      setGeneratedResources(res?.data?.generated_content || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLiveSessions = async () => {
    try {
      const res = await getLiveSessions(id);
      setLiveSessions(res?.data?.sessions || []); 
    } catch (err) { 
      console.error("Error fetching sessions:", err); 
      setLiveSessions([]); 
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      const res = await getSubmissions(assignmentId);
      setSubmissions(res?.data?.submissions || []);
      setViewingSubmissionsFor(assignmentId);
    } catch (err) {
      setSystemAlert({ type: 'error', text: 'Failed to synchronize submission rosters from repository.' });
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await api.get(`/quiz/course/${id}`);
      setQuizzes(res?.data?.quizzes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishQuiz = async (quizId) => {
    if (!window.confirm("Publish this quiz and assign it to all students?")) return;
    setSystemAlert({ type: '', text: '' });
    try {
      const res = await api.post(`/quiz/${quizId}/assign`, { is_published: true });
      if (res?.status === 200 || res?.data) {
        setSystemAlert({ type: 'success', text: '🚀 Quiz successfully assigned and broadcast to student feeds!' });
        fetchQuizzes();
      }
    } catch (err) {
      console.error(err);
      setSystemAlert({ type: 'error', text: 'Failed to execute assignment publication routine.' });
    }
  };

  const handleExport = async () => {
    try {
      // 1. Instantly fetch the latest student list from the backend
      const res = await getEnrolledStudents(id);
      const studentList = res?.data?.students || [];

      // 2. Check if the course actually has students
      if (studentList.length === 0) {
        return setSystemAlert({ type: 'error', text: 'Export Error: No student metrics recorded to write.' });
      }

      // 3. Build and download the CSV
      const headers = ['Student ID', 'Username', 'Email', 'University ID'];
      const rows = studentList.map(s => [s.id, s.username, s.email, s.university_id || 'N/A']);
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${courseInfo.name}_Student_List.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSystemAlert({ type: 'success', text: 'CSV Ledger exported successfully!' });
    } catch (err) {
      console.error(err);
      setSystemAlert({ type: 'error', text: 'Export Error: Failed to fetch student data.' });
    }
  };

  const handleMaterialUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setSystemAlert({ type: '', text: '' });
    const formData = new FormData();
    formData.append('title', e.target.title.value);
    formData.append('course_id', id);
    formData.append('file', e.target.file.files[0]);

    try {
      await uploadMaterial(formData);
      e.target.reset();
      setSystemAlert({ type: 'success', text: 'Lecture reference material parsed and cached inside vector spaces.' });
      fetchData();
    } catch (err) {
      setSystemAlert({ type: 'error', text: 'Upload Disruption: Failed to map binary document stream.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm("Are you sure you want to delete this lecture material?")) return;
    try {
      await deleteMaterial(materialId);
      fetchData();
    } catch (err) {
      setSystemAlert({ type: 'error', text: 'Purge Aborted: Failed to clear document indices.' });
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setSystemAlert({ type: '', text: '' });
    if (!newAssign.title.trim()) return setSystemAlert({ type: 'error', text: 'Validation Error: Title parameters required.' });
    if (!newAssign.teacher_solution.trim() && !solutionFile) {
      return setSystemAlert({ type: 'error', text: 'A text template or document Solution Key must be provided for automated AI grading.' });
    }

    const formData = new FormData();
    formData.append('course_id', id);
    formData.append('title', newAssign.title.trim());
    formData.append('description', newAssign.description.trim());
    formData.append('deadline', newAssign.deadline);
    formData.append('teacher_solution', newAssign.teacher_solution.trim());

    if (assignFile) formData.append('file', assignFile);
    if (solutionFile) formData.append('solution_file', solutionFile);

    try {
      await createAssignment(formData);
      setSystemAlert({ type: 'success', text: 'Syllabus assignment created and RAG evaluative baseline configured!' });
      setNewAssign({ title: '', description: '', deadline: '', teacher_solution: '' });
      setAssignFile(null);
      setSolutionFile(null);
      fetchData();
    } catch (err) {
      setSystemAlert({ type: 'error', text: err.response?.data?.error || 'Failed to initialize assignment unit.' });
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this assignment and all submissions permanently?")) return;
    try {
      await deleteAssignment(assignmentId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteResource = async (contentId) => {
    if (!window.confirm("Are you sure you want to delete this generated resource?")) return;
    try {
      await deleteGeneratedContent(contentId);
      fetchGeneratedResources();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Cancel this live session?")) return;
    try {
      await deleteLiveSession(sessionId);
      fetchLiveSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("DANGER CYCLE: Completely wipe course channels and immutable database logs from server grids?")) return;
    try {
      await api.delete(`/content/courses/${id}`);
      navigate('/teacher');
    } catch (err) {
      setSystemAlert({ type: 'error', text: 'De-indexing failed: Critical administrative access disruption.' });
    }
  };

  const handleDownload = async (path, filename) => {
    try {
      // 👇 Fixed the URL to match the backend route 👇
      const res = await api.get(`/content/download-file?path=${encodeURIComponent(path)}`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      let finalName = filename;
      const extension = path.split('.').pop();
      if (extension && !filename.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
        finalName = `${filename}.${extension}`;
      }
      link.setAttribute('download', finalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSystemAlert({ type: 'error', text: 'Buffer Link Crash: Stalled reading static file data tokens.' });
    }
  };
  
  if (loading) return (
    <div className="cd-loading-page-wrapper">
      <div className="cd-spinner-box-container">
        <div className="ac-spinner" />
        <p className="cd-loading-prompt-string">Synchronizing Classroom Engine...</p>
      </div>
      <style>{`
        .cd-loading-page-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: 'Inter', sans-serif; }
        .cd-spinner-box-container { display: flex; flex-direction: column; align-items: center; }
        .ac-spinner { width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: cd-spin 1s linear infinite; margin-bottom: 15px; }
        .cd-loading-prompt-string { color: #64748b; font-weight: 600; }
        @keyframes cd-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  if (activeAssignmentId && user?.role === 'student') {
    return (
      <div className="cd-assignment-fullscreen-viewport-wrapper">
        <div className="cd-fullscreen-inner-bounds-container">
          <button onClick={() => setActiveAssignmentId(null)} className="cd-btn-back-to-classroom-channel">
            ← Return to Classroom Channel
          </button>
          <StudentAssignmentView assignmentId={activeAssignmentId} />
        </div>
        <style>{`
          .cd-assignment-fullscreen-viewport-wrapper { min-height: 100vh; background: #f8fafc; padding: 40px 24px; box-sizing: border-box; font-family: 'Inter', sans-serif; }
          .cd-fullscreen-inner-bounds-container { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
          .cd-btn-back-to-classroom-channel { background: #ffffff; border: 1px solid #e2e8f0; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; color: #475569; cursor: pointer; width: fit-content; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: background 0.2s; }
          .cd-btn-back-to-classroom-channel:hover { background: #f8fafc; color: #0f172a; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cd-page-wrapper">
      
      {/* ── CENTRAL COURSE HERO CONTROL HEADER PANEL ── */}
      <div className="cd-hero-banner">
        <div className="cd-grid-mesh" />
        <div className="cd-hero-container">
          <button onClick={() => navigate(user?.role === 'teacher' ? '/teacher' : '/student')} className="cd-btn-back-dashboard">
            ← Return to Dashboard Space
          </button>

          <div className="cd-hero-main-flex-row">
            <div className="cd-course-title-meta-block">
              <h1 className="cd-course-main-heading-title">{courseInfo.name}</h1>
              <div className="cd-course-meta-pills-row-strip">
                <span className="cd-meta-badge-pill">👥 {courseInfo.count} Rostered Students</span>
                {courseInfo.code && <span className="cd-meta-badge-pill cd-badge-variant-code-signature">Syllabus Index ID: {courseInfo.code}</span>}
                {user?.role === 'teacher' && (
                  <Link to={`/course/${id}/analytics`} className="cd-link-analytics-telemetry">📊 Performance Analytics →</Link>
                )}
              </div>
            </div>

            <div className="cd-course-actions-button-deck-stack">
              {user?.role === 'student' && (
                <button onClick={() => setShowFeedback(true)} className="cd-btn-action-rate-feedback">⭐ Rate Channel</button>
              )}
              
              {user?.role === 'teacher' ? (
                <>
                  <button onClick={handleExport} className="cd-btn-action-outline-export">Students CSV </button>
                  <Link to={`/attendance/${id}`} className="cd-link-action-primary blue">Attendance Sheet</Link>
                  <Link to={`/course/${id}/create-quiz`} className="cd-link-action-primary purple">Create Quiz Form</Link>
                  <button onClick={handleDeleteCourse} className="cd-btn-action-danger-purge">Purge Channel</button>
                </>
              ) : (
                <button onClick={async () => { if (window.confirm("Drop selected course syllabus channel from profile registry?")) { await dropCourse(id); navigate('/student'); } }} className="cd-btn-action-danger-purge">Drop Course Unit</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CORE OPERATIONS WORKSPACE CONTENT DECKS ── */}
      <div className="cd-main-content-workspace">
        
        {systemAlert.text && (
          <div className={`auth-alert ${systemAlert.type === 'error' ? 'error' : 'success'} cd-spaced-alert-banner-margin`}>
            {systemAlert.text}
          </div>
        )}

        {/* HORIZONTALLY ADAPTIVE TAB TRIGGER NAVIGATION STRIP */}
        <div className="cd-tabs-scrollable-wrapper-bar">
          <div className="cd-tabs-flex-row-strip">
            {['materials', 'assignments', 'grades', 'ai_resources', 'live', 'students'].map(tab => {
              if ((tab === 'students' || tab === 'ai_resources') && user?.role !== 'teacher') return null;
              if (tab === 'grades' && user?.role === 'teacher') return null;
              
              const label = tab === 'materials' ? (user?.role === 'student' ? 'Lectures Portfolio' : 'Syllabus Materials')
                : tab === 'assignments' ? 'Assignments Feed'
                : tab === 'grades' ? 'Marks Report'
                : tab === 'ai_resources' ? 'AI Generated Resources'
                : tab === 'live' ? 'Virtual Streams'
                : 'Class Roster';

              return (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`cd-tab-trigger-item-btn ${activeTab === tab ? 'active-tab-indicator-state' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DYNAMIC MOUNT ROUTER PANELS TREE ── */}
        <div className="cd-tab-content-renderer-panel">
          {activeTab === 'materials' && (
            <MaterialsTab 
              user={user} materials={materials} uploading={uploading}
              handleMaterialUpload={handleMaterialUpload} handleDeleteMaterial={handleDeleteMaterial} handleDownload={handleDownload}
            />
          )}
          {activeTab === 'assignments' && (
            <AssignmentsTab 
              user={user} assignments={assignments} quizzes={quizzes} newAssign={newAssign} setNewAssign={setNewAssign}
              handleCreateAssignment={handleCreateAssignment} handlePublishQuiz={handlePublishQuiz} handleDeleteAssignment={handleDeleteAssignment}
              handleDownload={handleDownload} setAssignFile={setAssignFile} setSolutionFile={setSolutionFile} fetchSubmissions={fetchSubmissions}
              viewingSubmissionsFor={viewingSubmissionsFor} submissions={submissions} setGradingSubmission={setGradingSubmission} setActiveAssignmentId={setActiveAssignmentId}
            />
          )}
          {activeTab === 'ai_resources' && <AIResourcesTab generatedResources={generatedResources} handleDeleteResource={handleDeleteResource} />}
          {activeTab === 'live' && (
            <LiveClassesTab 
              liveSessions={liveSessions} 
              setShowSessionModal={setShowSessionModal} 
              handleDeleteSession={handleDeleteSession}
              user={user} 
            />
          )}
          {activeTab === 'grades' && <GradesTab grades={grades} />}
          {activeTab === 'students' && <StudentsTab students={students} id={id} removeStudent={removeStudent} fetchStudents={fetchStudents} />}
        </div>
      </div>

      {/* SYSTEM OVERLAY ROUTER CONSOLES WINDOWS BINDINGS */}
      {showFeedback && <FeedbackModal courseId={id} onClose={() => setShowFeedback(false)} />}
      {showSessionModal && <CreateSessionModal courseId={id} onClose={() => setShowSessionModal(false)} onSuccess={fetchLiveSessions} />}
      {gradingSubmission && (
        <GradingModal
          submission={gradingSubmission.sub} assignmentTitle={gradingSubmission.title}
          onClose={() => setGradingSubmission(null)} onSuccess={() => fetchSubmissions(gradingSubmission.assignmentId)}
        />
      )}

      {/* COMPONENT EMBEDDED SCOPED DESIGN SYSTEM */}
      <style>{`
        .cd-page-wrapper { background: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        .cd-hero-banner { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 100px; position: relative; overflow: hidden; }
        .cd-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .cd-hero-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; }
        .cd-btn-back-dashboard { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-bottom: 25px; font-size: 0.85rem; }
        .cd-hero-main-flex-row { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 30px; }
        .cd-course-main-heading-title { color: white; font-size: clamp(1.8rem, 5vw, 2.6rem); font-weight: 900; margin: 0; letter-spacing: -1px; }
        .cd-course-meta-pills-row-strip { display: flex; align-items: center; gap: 12px; margin-top: 15px; flex-wrap: wrap; }
        .cd-meta-badge-pill { background: rgba(255,255,255,0.15); padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; color: white; font-weight: 600; }
        .cd-meta-badge-pill.cd-badge-variant-code-signature { background: rgba(255,255,255,0.1); }
        .cd-link-analytics-telemetry { color: #93c5fd; text-decoration: none; font-weight: 700; font-size: 0.9rem; }
        .cd-course-actions-button-deck-stack { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        
        .cd-link-action-primary { text-decoration: none; padding: 12px 20px; border-radius: 10px; color: white !important; font-weight: 700; font-size: 0.875rem; display: inline-block; }
        .cd-link-action-primary.blue { background: #3b82f6; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2); }
        .cd-link-action-primary.purple { background: #8b5cf6; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.2); }
        
        .cd-btn-action-outline-export { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 12px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
        .cd-btn-action-danger-purge { background: #ef4444; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.875rem; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.15); }
        .cd-btn-action-rate-feedback { background: #fbbf24; color: #78350f; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.875rem; box-shadow: 0 4px 10px rgba(251, 191, 36, 0.2); }
        
        .cd-main-content-workspace { max-width: 1280px; margin: -40px auto 0; padding: 0 24px; position: relative; z-index: 10; }
        .cd-spaced-alert-banner-margin { margin-bottom: 24px; }
        .cd-tabs-scrollable-wrapper-bar { overflow-x: auto; background: white; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; margin-bottom: 30px; scrollbar-width: none; }
        .cd-tabs-scrollable-wrapper-bar::-webkit-scrollbar { display: none; }
        .cd-tabs-flex-row-strip { display: flex; min-width: max-content; width: 100%; }
        .cd-tab-trigger-item-btn { flex: 1; padding: 18px 25px; border: none; background: transparent; color: #64748b; font-weight: 600; font-size: 0.9rem; cursor: pointer; border-bottom: 3px solid transparent; transition: 0.2s; white-space: nowrap; font-family: inherit; }
        .cd-tab-trigger-item-btn.active-tab-indicator-state { background: #eff6ff; color: #1d4ed8; border-bottom-color: #1d4ed8; font-weight: 800; }
        
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

        @media (max-width: 768px) {
          .cd-hero-main-flex-row { flex-direction: column; align-items: center; text-align: center; gap: 24px; }
          .cd-course-meta-pills-row-strip { justify-content: center; }
          .cd-course-actions-button-deck-stack { justify-content: center; width: 100%; gap: 12px; }
          .cd-course-actions-button-deck-stack > * { flex: 1; min-width: 140px; text-align: center; }
          .cd-hero-banner { padding-bottom: 80px; }
          .cd-main-content-workspace { margin-top: -30px; }
        }
      `}</style>
    </div>
  );
};

export default CourseDetail;