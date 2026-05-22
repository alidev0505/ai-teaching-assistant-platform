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
          const attRes = await getAttendanceReport(id);
          setAttendance(attRes?.data || null);
        } catch (e) {
          console.error("Error matching student analytics report cards:", e);
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
      // ✅ REFACTOR: Routed via unified API handler layout controls safely
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

  const handleExport = () => {
    if (!students || students.length === 0) return setSystemAlert({ type: 'error', text: 'Export Error: No student metrics recorded to write.' });
    const headers = ['Student ID', 'Username', 'Email', 'University ID'];
    const rows = students.map(s => [s.id, s.username, s.email, s.university_id || 'N/A']);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${courseInfo.name}_Student_List.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      const res = await api.get(`/content/download?path=${encodeURIComponent(path)}`, { responseType: 'blob' });
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
                  <button onClick={handleExport} className="cd-btn-action-outline-export">Export CSV Ledger</button>
                  <Link to={`/attendance/${id}`} className="action-btn-primary blue cd-btn-link-action-node">Attendance Sheet</Link>
                  <Link to={`/course/${id}/create-quiz`} className="action-btn-primary purple cd-btn-link-action-node">Compile Evaluation</Link>
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
    </div>
  );
};

export default CourseDetail;