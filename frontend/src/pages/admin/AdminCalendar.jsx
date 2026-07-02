import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getAllCoursesAdmin } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const localizer = momentLocalizer(moment);

const CustomEvent = ({ event }) => (
  <div className="cal-event-chip-wrapper">
    <div className="cal-event-code-label">{event.code}</div>
    <div className="cal-event-room-badge">📍 {event.resource}</div>
  </div>
);

const AdminCalendar = () => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]); 
  const [filteredEvents, setFilteredEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFilters(); }, [deptFilter, roomFilter, allEvents]);

  const fetchData = async () => {
    try {
      const res = await getAllCoursesAdmin();
      const events = transformToEvents(res?.data?.courses || []);
      setAllEvents(events);
    } catch (err) {
      console.error("Critical timetable pipeline retrieval failure:", err);
    } finally {
      setLoading(false);
    }
  };

  const transformToEvents = (courses) => {
    const events = [];
    const dayMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
    courses.forEach(c => {
      if (!c.day || !c.time) return;
      const dayIndex = dayMap[c.day];
      if (!dayIndex) return;
      const currentDay = moment().isoWeekday(dayIndex);
      let [startStr, endStr] = c.time.includes('-') ? c.time.split(' - ') : [c.time, moment(c.time, "HH:mm").add(1.5, 'hours').format("HH:mm")];
      const startHour = parseInt(startStr?.split(':')[0]) || 8;
      const startMin = parseInt(startStr?.split(':')[1]) || 0;
      const endHour = parseInt(endStr?.split(':')[0]) || 9;
      const endMin = parseInt(endStr?.split(':')[1]) || 30;
      events.push({
        id: c.id, code: c.class_code, title: c.name,
        start: currentDay.clone().set({ hour: startHour, minute: startMin, second: 0 }).toDate(),
        end: currentDay.clone().set({ hour: endHour, minute: endMin, second: 0 }).toDate(),
        resource: c.room || 'TBD', teacher: c.teacher_name || 'Unassigned',
        dept: c.class_code ? c.class_code.split('-')[0].toUpperCase() : 'OTH'
      });
    });
    return events;
  };

  const applyFilters = () => {
    let result = allEvents;
    if (deptFilter !== 'ALL') result = result.filter(ev => ev.dept.includes(deptFilter));
    if (roomFilter !== 'ALL') result = result.filter(ev => ev.resource === roomFilter);
    setFilteredEvents(result);
  };

  const uniqueRooms = [...new Set(allEvents.map(e => e.resource))].sort();
  const eventStyleGetter = (event) => {
    let colorClass = 'cal-theme-default'; 
    if (event.dept.includes('CS') || event.dept.includes('IT')) colorClass = 'cal-theme-cs';
    else if (event.dept.includes('ENG')) colorClass = 'cal-theme-eng';
    else if (event.dept.includes('MTH')) colorClass = 'cal-theme-mth';
    else if (event.dept.includes('BBA')) colorClass = 'cal-theme-bba';
    return { className: `cal-custom-event-node ${colorClass}` };
  };

  return (
    <div className="cal-page-wrapper">
      <div className="cal-control-hero-header">
        <div className="cal-header-container-flex">
          <div className="cal-header-brand-block">
            <button onClick={() => navigate(-1)} className="cal-btn-back-trans">←</button>
            <div className="cal-brand-text-stack">
              <h1 className="cal-main-title">Weekly Institutional Schedule</h1>
              <span className="cal-subtitle-counter">Showing {filteredEvents.length} Active Sessions Matrix</span>
            </div>
          </div>
          <div className="cal-filters-flex-row-strip">
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="cal-select-filter-dropdown">
              <option value="ALL">All Faculty Departments</option>
              <option value="CS">Computer Science (CS / IT)</option>
              <option value="ENG">Engineering Department (ENG)</option>
              <option value="MTH">Mathematics Workgroup (MTH)</option>
              <option value="BBA">Business Administration (BBA)</option>
            </select>
            <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className="cal-select-filter-dropdown max-width-room-box">
              <option value="ALL">All Lecture Rooms</option>
              {uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="cal-workspace-body">
        {loading ? (
          <div className="cal-loader-splash-container">
            <div className="ac-spinner" />
            <p className="cd-loading-prompt-string">Assembling schedule matrix rails...</p>
          </div>
        ) : (
          <div className="cal-container-card">
            <Calendar
              localizer={localizer}
              events={filteredEvents} 
              startAccessor="start"
              endAccessor="end"
              defaultView="week"
              views={['week', 'day', 'agenda']} 
              step={60}
              timeslots={1}
              min={new Date(0, 0, 0, 8, 0, 0)}
              max={new Date(0, 0, 0, 20, 0, 0)}
              components={{ event: CustomEvent }}
              eventPropGetter={eventStyleGetter}
              tooltipAccessor={evt => `${evt.title} \nInstructor: ${evt.teacher} \nRoom Location: ${evt.resource}`}
            />
          </div>
        )}
      </div>

      <style>{`
        .cal-page-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 40px; }
        .cal-control-hero-header { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 24px 0; }
        .cal-header-container-flex { max-width: 1400px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
        .cal-header-brand-block { display: flex; align-items: center; gap: 16px; }
        .cal-btn-back-trans { background: #f1f5f9; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 800; cursor: pointer; }
        .cal-main-title { font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0; }
        .cal-subtitle-counter { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .cal-filters-flex-row-strip { display: flex; gap: 12px; }
        .cal-select-filter-dropdown { padding: 8px 16px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: 600; cursor: pointer; }

        .cal-workspace-body { max-width: 1400px; margin: 24px auto 0; padding: 0 24px; }
        .cal-container-card { background: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .cal-custom-event-node { border-radius: 6px; padding: 4px; font-size: 0.8rem; }
        
        .cal-event-chip-wrapper { display: flex; flex-direction: column; gap: 2px; }
        .cal-event-code-label { font-weight: 800; }
        .cal-event-room-badge { font-size: 0.7rem; font-weight: 600; }

        .cal-theme-cs { background: #eff6ff !important; border-left: 4px solid #2563eb; color: #1e40af; }
        .cal-theme-eng { background: #fdf2f2 !important; border-left: 4px solid #ef4444; color: #991b1b; }
        .cal-theme-mth { background: #f0fdf4 !important; border-left: 4px solid #10b981; color: #065f46; }
        .cal-theme-bba { background: #fffbeb !important; border-left: 4px solid #f59e0b; color: #92400e; }

        .cal-loader-splash-container { text-align: center; padding: 100px 0; color: #64748b; }
        .ac-spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminCalendar;