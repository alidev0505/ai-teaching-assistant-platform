import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getAllCoursesAdmin } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const localizer = momentLocalizer(moment);

// ─── MINIMAL ELEMENT EVENT CHIP BADGE ───────────────────────────────────────
const CustomEvent = ({ event }) => {
  return (
    <div className="cal-event-chip-wrapper">
      <div className="cal-event-code-label">
        {event.code}
      </div>
      <div className="cal-event-room-badge">
        📍 {event.resource}
      </div>
    </div>
  );
};

// ─── MAIN MASTER CALENDAR COMPONENT ──────────────────────────────────────────
const AdminCalendar = () => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]); 
  const [filteredEvents, setFilteredEvents] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Filter States
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [deptFilter, roomFilter, allEvents]);

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
      
      let startStr = c.time, endStr = "";
      if (c.time.includes('-')) {
          [startStr, endStr] = c.time.split(' - ');
      } else {
          startStr = c.time;
          endStr = moment(c.time, "HH:mm").add(1.5, 'hours').format("HH:mm");
      }

      // ✅ PARSING PROTECTION: Safe formatting fallback values safeguard timeline assignments
      const startHour = parseInt(startStr?.split(':')[0]) || 8;
      const startMin = parseInt(startStr?.split(':')[1]) || 0;
      const endHour = parseInt(endStr?.split(':')[0]) || 9;
      const endMin = parseInt(endStr?.split(':')[1]) || 30;

      const startDate = currentDay.clone().set({ hour: startHour, minute: startMin, second: 0 }).toDate();
      const endDate = currentDay.clone().set({ hour: endHour, minute: endMin, second: 0 }).toDate();

      const deptCode = c.class_code ? c.class_code.split('-')[0].toUpperCase() : 'OTH';

      events.push({
        id: c.id,
        code: c.class_code, 
        title: c.name,      
        start: startDate,
        end: endDate,
        resource: c.room || 'TBD',
        teacher: c.teacher_name || 'Unassigned',
        dept: deptCode 
      });
    });
    return events;
  };

  const applyFilters = () => {
    let result = allEvents;

    if (deptFilter !== 'ALL') {
      result = result.filter(ev => ev.dept.includes(deptFilter));
    }

    if (roomFilter !== 'ALL') {
      result = result.filter(ev => ev.resource === roomFilter);
    }

    setFilteredEvents(result);
  };

  const uniqueRooms = [...new Set(allEvents.map(e => e.resource))].sort();

  // Color Mapping Variations
  const eventStyleGetter = (event) => {
    let colorClass = 'cal-theme-default'; 
    if (event.dept.includes('CS') || event.dept.includes('IT')) colorClass = 'cal-theme-cs';
    else if (event.dept.includes('ENG')) colorClass = 'cal-theme-eng';
    else if (event.dept.includes('MTH')) colorClass = 'cal-theme-mth';
    else if (event.dept.includes('BBA')) colorClass = 'cal-theme-bba';

    return {
      className: `cal-custom-event-node ${colorClass}`
    };
  };

  return (
    <div className="cal-page-wrapper">
      
      {/* ── HEADER NAVIGATION & SELECTION TRIMS ── */}
      <div className="cal-control-hero-header">
        <div className="cal-header-container-flex">
          <div className="cal-header-brand-block">
            <button onClick={() => navigate(-1)} className="cal-btn-back-trans">←</button>
            <div className="cal-brand-text-stack">
              <h1 className="cal-main-title">Weekly Institutional Schedule</h1>
              <span className="cal-subtitle-counter">Showing {filteredEvents.length} Active Sessions Matrix</span>
            </div>
          </div>
            
          {/* ── FILTER TRIMS SELECTION MATRIX ── */}
          <div className="cal-filters-flex-row-strip">
            <select 
              value={deptFilter} 
              onChange={e => setDeptFilter(e.target.value)}
              className="cal-select-filter-dropdown"
            >
              <option value="ALL">All Faculty Departments</option>
              <option value="CS">Computer Science (CS / IT)</option>
              <option value="ENG">Engineering Department (ENG)</option>
              <option value="MTH">Mathematics Workgroup (MTH)</option>
              <option value="BBA">Business Administration (BBA)</option>
            </select>

            <select 
              value={roomFilter} 
              onChange={e => setRoomFilter(e.target.value)}
              className="cal-select-filter-dropdown max-width-room-box"
            >
              <option value="ALL">All Lecture Rooms</option>
              {uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── MAIN CALENDAR INTERACTIVE DISPLAY MATRIX ── */}
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
    </div>
  );
};

export default AdminCalendar;