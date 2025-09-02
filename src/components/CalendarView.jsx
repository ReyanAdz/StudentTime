import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { auth } from '../firebase/firebase-config';
import { db } from '../firebase/firestore-config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import GPTPlannerWidget from './GPTPlannerWidget';

// provider-powered catalog hook (SFU + UBC)
import { useCatalog } from '../catalog/useCatalog';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function toDate(input) {
  if (input instanceof Date) return input;
  if (input?.seconds) return new Date(input.seconds * 1000);
  if (typeof input === 'string' || typeof input === 'number') return new Date(input);
  return null;
}

// day tokens for provider meetings -> JS weekday (0=Sun..6=Sat)
const dayMap = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };

// Expand normalized provider meetings into repeated events across a date range
function expandMeetingsBetween(startDateISO, endDateISO, meetings, title, courseKey) {
  const rangeStart = new Date(startDateISO);
  const rangeEnd = new Date(endDateISO);
  const out = [];

  for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
    for (const m of meetings || []) {
      if (d.getDay() !== dayMap[m.day]) continue;

      const [sh, sm] = (m.start || '00:00').split(':').map(Number);
      const [eh, em] = (m.end || '00:00').split(':').map(Number);
      const st = new Date(d);
      st.setHours(sh ?? 0, sm ?? 0, 0, 0);
      const en = new Date(d);
      en.setHours(eh ?? 0, em ?? 0, 0, 0);

      out.push({
        id: `${courseKey}-${m.day}-${st.toISOString()}`,
        title: title + (m.campus ? ` (${m.campus})` : ''),
        start: st,
        end: en,
        allDay: false,
        eventType: 'course',
        courseKey,
      });
    }
  }
  return out;
}

function CalendarView(props) {
  // External events or internal state
  const { events: propEvents, setEvents: propSetEvents } = props || {};
  const [internalEvents, setInternalEvents] = useState([]);
  const events = propEvents !== undefined ? propEvents : internalEvents;
  const updateEvents = typeof propSetEvents === 'function' ? propSetEvents : setInternalEvents;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  // unified provider flow
  const [school, setSchool] = useState('sfu'); // 'sfu' | 'ubc'
  const cat = useCatalog(school);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const selectedSection = cat.sections.find(s => s.id === selectedSectionId);

  useEffect(() => {
    if (typeof propSetEvents !== 'function') {
      console.warn(
        '[CalendarView] No setEvents prop passed in. Using internal event state. ' +
        'To share events with the rest of your app, do:\n' +
        '  const [events, setEvents] = useState([]);\n' +
        '  <CalendarView events={events} setEvents={setEvents} />'
      );
    }
  }, [propSetEvents]);

  // Load saved events on mount
  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.calendarEvents)) {
            const parsed = data.calendarEvents.map(ev => ({
              ...ev,
              start: toDate(ev.start),
              end: toDate(ev.end),
            }));
            updateEvents(parsed);
          }
        }
      } catch (err) {
        console.error('Error loading saved events:', err);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When school changes, reset downstream selections
  useEffect(() => {
    setSelectedSectionId('');
  }, [school]);

  // add section from provider to calendar (asks for date range)
  function addProviderSectionToCalendar(section) {
    const courseTitle =
      (section?.course?.title) ||
      `${section?.course?.subject ?? ''} ${section?.course?.code ?? ''}`.trim() ||
      'Course';
    const sectionLabel = section?.id ? ` – ${section.id}` : '';
    const title = `${courseTitle}${sectionLabel}`;

    const startDateISO = window.prompt('Term start date (YYYY-MM-DD):');
    const endDateISO = window.prompt('Term end date (YYYY-MM-DD):');
    if (!startDateISO || !endDateISO) {
      alert('Start and end dates are required to add the section.');
      return;
    }

    const courseKey = `${section?.course?.subject}-${section?.course?.code}-${section?.id || ''}`;
    const evs = expandMeetingsBetween(startDateISO, endDateISO, section.meetings || [], title, courseKey);
    if (!evs.length) {
      alert('No meetings found for this section in the selected date range.');
      return;
    }
    updateEvents(prev => [...prev, ...evs]);
  }

  // manual add event on calendar click
  const handleSelectSlot = ({ start }) => {
    const title = window.prompt('New Event Title:');
    if (!title) return;

    const timeStr = window.prompt('Start time? (HH:MM 24-hr)', '23:59');
    if (!timeStr) return;

    const [hour, minute] = timeStr.split(':').map(Number);
    const startTime = new Date(start);
    startTime.setHours(hour, minute, 0);

    const endTimeStr = window.prompt('End time? (optional, HH:MM 24-hr — press Enter to skip):');

    let endTime;
    if (endTimeStr) {
      const [endHour, endMinute] = endTimeStr.split(':').map(Number);
      endTime = new Date(start);
      endTime.setHours(endHour, endMinute, 0);
    } else {
      endTime = new Date(startTime.getTime() + 60_000);
    }

    updateEvents(prev => [
      ...prev,
      {
        id: `${startTime.toISOString()}-${Math.random().toString(36).slice(2)}`,
        title,
        start: startTime,
        end: endTime,
        allDay: false,
      },
    ]);
  };

  // delete event (or all meetings for a course)
  const handleSelectEvent = (eventObj) => {
    if (eventObj.eventType === 'course' && eventObj.courseKey) {
      const delAll = window.confirm(
        `Delete ALL meetings for:\n${eventObj.title}\n\nOK = delete all for this course\nCancel = delete just this one meeting`
      );
      if (delAll) {
        updateEvents(prev => prev.filter(ev => ev.courseKey !== eventObj.courseKey));
        return;
      }
    }
    const delOne = window.confirm(`Delete "${eventObj.title}" on ${eventObj.start.toLocaleString()}?`);
    if (delOne) {
      updateEvents(prev => prev.filter(ev => ev.id !== eventObj.id));
    }
  };

  const calEvents = useMemo(() => events, [events]);

  const saveEvents = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to save events.');
      return;
    }
    try {
      const userDoc = doc(db, 'users', user.uid);
      await setDoc(userDoc, { calendarEvents: events }, { merge: true });
      alert('Events saved successfully.');
    } catch (err) {
      console.error('Error saving events:', err);
      alert('Failed to save events.');
    }
  };

  const loadEvents = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to load events.');
      return;
    }
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.calendarEvents)) {
          const parsed = data.calendarEvents.map(ev => ({
            ...ev,
            start: toDate(ev.start),
            end: toDate(ev.end),
          }));
          updateEvents(parsed);
          alert('Events loaded successfully.');
        } else {
          alert('No calendar events found.');
        }
      } else {
        alert('User document does not exist.');
      }
    } catch (err) {
      console.error('Error loading events:', err);
      alert('Failed to load events.');
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 className="calendar-title">Create Your Schedule Here!</h2>
        <p className="calendar-subtitle">Import courses (SFU/UBC) or add custom events to organize your time</p>
      </div>

      {/* Course Import Section */}
      <div className="course-import-section">
        <h3 className="section-title">Import Courses</h3>

        {/* School */}
        <div className="selector-group" style={{ marginTop: 8 }}>
          <label className="selector-label">School</label>
          <select
            value={school}
            onChange={(e) => { setSchool(e.target.value); setSelectedSectionId(''); }}
            className="selector-input"
          >
            <option value="sfu">SFU</option>
            <option value="ubc">UBC (Unofficial)</option>
            {/* Later: Langara, Douglas, KPU */}
          </select>
        </div>

        <div className="course-selectors">
          {/* Year */}
          <div className="selector-group">
            <label className="selector-label">Year</label>
            <select
              value={cat.year}
              onChange={(e) => { cat.setYear(e.target.value); setSelectedSectionId(''); }}
              disabled={!school}
              className="selector-input"
            >
              <option value="">Select Year</option>
              {cat.years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Term */}
          <div className="selector-group">
            <label className="selector-label">Term</label>
            <select
              value={cat.termId}
              onChange={(e) => { cat.setTermId(e.target.value); setSelectedSectionId(''); }}
              disabled={!cat.year}
              className="selector-input"
            >
              <option value="">Select Term</option>
              {cat.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Department */}
          <div className="selector-group">
            <label className="selector-label">Department</label>
            <select
              value={cat.subject}
              onChange={(e) => { cat.setSubject(e.target.value); setSelectedSectionId(''); }}
              disabled={!cat.termId}
              className="selector-input"
            >
              <option value="">Select Department</option>
              {cat.subjects.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
            </select>
          </div>

          {/* Course */}
          <div className="selector-group">
            <label className="selector-label">Course</label>
            <select
              value={cat.courseCode}
              onChange={(e) => { const v = e.target.value; cat.setCourseCode(v); setSelectedSectionId(''); if (v) cat.loadSections(v); }}
              disabled={!cat.subject}
              className="selector-input"
            >
              <option value="">Select Course</option>
              {cat.courses.map(c => (
                <option key={`${c.subject}-${c.code}`} value={c.code}>
                  {c.subject} {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div className="selector-group">
            <label className="selector-label">Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={!cat.courseCode || !cat.sections.length}
              className="selector-input"
            >
              <option value="">Select Section</option>
              {cat.sections.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id}{s.instructor ? ` — ${s.instructor}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="course-actions">
          <button
            onClick={() => selectedSection && addProviderSectionToCalendar(selectedSection)}
            disabled={!selectedSection}
            className="btn btn-primary"
          >
            Add Course to Calendar
          </button>

          {school === 'ubc' && (
            <p className="text-xs opacity-70 mt-2">
              Data source: UBCCourses (unofficial). Availability may vary.
            </p>
          )}
        </div>
      </div>

      {/* Calendar Actions */}
      <div className="calendar-actions">
        <div className="action-buttons">
          <button onClick={saveEvents} className="btn btn-secondary">💾 Save Calendar</button>
          <button onClick={loadEvents} className="btn btn-secondary">📂 Load Saved Events</button>
        </div>
        <div className="calendar-info">
          <p>💡 Click on any date to add a custom event</p>
          <p>💡 Click on events to delete them</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={calEvents}
          components={{ event: CustomEvent }}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          view={view}
          onView={setView}
          views={['month', 'week', 'day', 'agenda']}
          date={currentDate}
          onNavigate={setCurrentDate}
          className="main-calendar"
        />
      </div>

      {/* GPT Planner Widget */}
      <div className="gpt-widget-section">
        <p>💡 Enter a prompt here and our chat bot can help optimize your schedule! </p>
        <GPTPlannerWidget events={calEvents} addEvents={updateEvents} />
      </div>
    </div>
  );
}

function CustomEvent({ event }) {
  const startStr = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endStr = event.end && event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isSameMinute = !endStr || Math.abs(event.end - event.start) <= 60_000;
  const showTime = isSameMinute ? startStr : `${startStr} – ${endStr}`;

  const cleanTitle = String(event.title || '').split('–')[0].trim();
  const campus = String(event.title || '').match(/\((.*?)\)/)?.[1] || '';

  return (
    <div className="custom-event">
      <div className="event-title">{cleanTitle}</div>
      <div className="event-time">{showTime}</div>
      {campus && <div className="event-campus">{campus} Campus</div>}
    </div>
  );
}

export default CalendarView;
