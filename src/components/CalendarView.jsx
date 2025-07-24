import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';


const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const BASE = 'https://www.sfu.ca/bin/wcm/course-outlines';


async function fetchJSON(pathSegments) {
  const qs = pathSegments.filter(Boolean).join('/');
  const url = `${BASE}?${qs}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${txt || 'no body'} (${url})`);
  }
  try {
    return await res.json();
  } catch (err) {
    throw new Error(`Invalid JSON from API (${url}): ${err.message}`);
  }
}

//normalize and clean text data 
const normText = (v) => (v ?? '').trim().toLowerCase();
const normNum = (v) => (v ?? '').trim();

// map SFU "days" strings to JS weekday numbers
const dayTokens = {
  su: 0, sun: 0, sunday: 0,
  m: 1, mo: 1, mon: 1, monday: 1,
  t: 2, tu: 2, tue: 2, tues: 2, tuesday: 2,
  w: 3, we: 3, wed: 3, weds: 3, wednesday: 3,
  th: 4, thu: 4, thur: 4, thurs: 4, thursday: 4,
  f: 5, fr: 5, fri: 5, friday: 5,
  sa: 6, sat: 6, saturday: 6,
};

function parseDays(daysStr) {
  if (!daysStr) return [];
  const out = new Set();
  const cleaned = daysStr.replace(/[,/]+/g, ' ').trim();

  if (!/\s/.test(cleaned) && /[A-Za-z]{2,}/.test(cleaned)) {
    cleaned.match(/[A-Za-z][a-z]?/g)?.forEach(tok => {
      const wk = dayTokens[tok.toLowerCase()];
      if (wk !== undefined) out.add(wk);
    });
  } else {
    cleaned.split(/\s+/).forEach(tok => {
      const wk = dayTokens[tok.toLowerCase()];
      if (wk !== undefined) out.add(wk);
    });
  }
  return [...out].sort();
}

// build a Date from a date string + time string
function combineDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(+d)) return null;
  const isoDate = d.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = (timeStr ?? '00:00').padStart(5, '0');
  return new Date(`${isoDate}T${time}`);
}

// expand one schedule item into repeating meetings
function expandScheduleItem(item, titlePrefix, courseKey) {
  const {
    startDate,
    endDate,
    startTime,
    endTime,
    days,
    sectionCode,
    isExam,
    campus,
  } = item;

  if (isExam) return []; // ignore exam slots for now

  const rangeStart = combineDateTime(startDate, startTime);
  const rangeEnd = combineDateTime(endDate, endTime);
  if (!(rangeStart && rangeEnd)) return [];

  const durationMs =
    (combineDateTime(startDate, endTime) ?? rangeStart) - rangeStart;
  const wdays = parseDays(days);
  if (!wdays.length) return [];

  const events = [];
  for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
    if (wdays.includes(d.getDay())) {
      const evStart = new Date(d);
      const evEnd = new Date(d.getTime() + durationMs);
      events.push({
        id: `${courseKey}-${sectionCode || ''}-${evStart.toISOString()}`,
        title: titlePrefix + (campus ? ` (${campus})` : ''),
        start: evStart,
        end: evEnd,
        allDay: false,
        eventType: 'course',
        courseKey,
      });
    }
  }
  return events;
}

// parse full outline payload to calendar events
function outlineToEvents(data, courseKey) {
  const title = data?.info?.title || data?.title || 'Course';
  const sectionLabel = data?.info?.section || data?.section || '';
  const prefix = sectionLabel ? `${title} – ${sectionLabel}` : title;

  const scheduleItems = Array.isArray(data?.courseSchedule)
    ? data.courseSchedule
    : Array.isArray(data?.schedule)
      ? data.schedule
      : Array.isArray(data?.courseSchedule?.sections)
        ? data.courseSchedule.sections
        : [];

  if (!scheduleItems.length) return [];
  const evs = [];
  scheduleItems.forEach(item => {
    evs.push(...expandScheduleItem(item, prefix, courseKey));
  });
  return evs;
}

/* small util so we can capitalize "summer" -> "Summer" for UI */
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/* ---------- component ---------- */

function CalendarView(props) {
  // accept parent state if provided; else fallback to internal state
  const { events: propEvents, setEvents: propSetEvents } = props;
  const [internalEvents, setInternalEvents] = useState([]);
  const events = propEvents !== undefined ? propEvents : internalEvents;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); 
  const updateEvents =
    typeof propSetEvents === 'function' ? propSetEvents : setInternalEvents;

  // warn in dev if no setter passed
  useEffect(() => {
    if (typeof propSetEvents !== 'function') {
      console.warn(
        '[CalendarView] No setEvents prop passed in. Using internal event state. ' +
          'To share events with the rest of your app, do:\n' +
          '  const [events, setEvents] = useState([]);\n' +
          '  <CalendarView events={events} setEvents={setEvents} />'
      );
    }
  }, [propSetEvents]);

  // Cascading select options
  const [years, setYears] = useState(['2023', '2024', '2025']); // fallback
  const [terms, setTerms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);

  const [formData, setFormData] = useState({
    year: '',
    term: '',
    department: '',
    course: '',
    section: '',
  });

  /* ----- load years on mount ----- */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJSON([]);
        const ys = Array.isArray(data)
          ? data.map(y => y.value || y.text || String(y)).filter(Boolean)
          : [];
        if (ys.length) setYears(ys);
      } catch (err) {
        console.warn('Year load failed:', err);
      }
    })();
  }, []);

  /* ----- when year changes, fetch terms ----- */
  useEffect(() => {
    if (!formData.year) {
      setTerms([]);
      return;
    }
    (async () => {
      try {
        const data = await fetchJSON([normNum(formData.year)]);
        const ts = Array.isArray(data)
          ? data.map(t => t.value || t.text || String(t)).filter(Boolean)
          : [];
        setTerms(ts);
      } catch (err) {
        console.warn('Term load failed:', err);
        setTerms([]);
      }
    })();
  }, [formData.year]);

  /* ----- when term changes, fetch departments ----- */
  useEffect(() => {
    if (!(formData.year && formData.term)) {
      setDepartments([]);
      return;
    }
    (async () => {
      try {
        const data = await fetchJSON([
          normNum(formData.year),
          normText(formData.term),
        ]);
        const ds = Array.isArray(data)
          ? data.map(d => d.value || d.text || String(d)).filter(Boolean)
          : [];
        setDepartments(ds);
      } catch (err) {
        console.warn('Department load failed:', err);
        setDepartments([]);
      }
    })();
  }, [formData.year, formData.term]);

  /* ----- when department changes, fetch courses ----- */
  useEffect(() => {
    if (!(formData.year && formData.term && formData.department)) {
      setCourses([]);
      return;
    }
    (async () => {
      try {
        const data = await fetchJSON([
          normNum(formData.year),
          normText(formData.term),
          normText(formData.department),
        ]);
        const cs = Array.isArray(data)
          ? data.map(c => c.value || c.text || String(c)).filter(Boolean)
          : [];
        setCourses(cs);
      } catch (err) {
        console.warn('Course list load failed:', err);
        setCourses([]);
      }
    })();
  }, [formData.year, formData.term, formData.department]);

  /* ----- when course changes, fetch sections ----- */
  useEffect(() => {
    if (!(formData.year && formData.term && formData.department && formData.course)) {
      setSections([]);
      return;
    }
    (async () => {
      try {
        const data = await fetchJSON([
          normNum(formData.year),
          normText(formData.term),
          normText(formData.department),
          normNum(formData.course),
        ]);
        const ss = Array.isArray(data)
          ? data.map(s => s.value || s.text || String(s)).filter(Boolean)
          : [];
        setSections(ss);
      } catch (err) {
        console.warn('Section list load failed:', err);
        setSections([]);
      }
    })();
  }, [formData.year, formData.term, formData.department, formData.course]);

  /* ----- unified onChange for selects ----- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'year' ? { term: '', department: '', course: '', section: '' } : {}),
      ...(name === 'term' ? { department: '', course: '', section: '' } : {}),
      ...(name === 'department' ? { course: '', section: '' } : {}),
      ...(name === 'course' ? { section: '' } : {}),
    }));
  };

  /* ----- fetch + add selected course events ----- */
  const fetchCourse = async () => {
    const { year, term, department, course, section } = formData;
    if (!year || !term || !department || !course || !section) {
      alert('Please select year, term, department, course, and section.');
      return;
    }
    try {
      const courseKey = `${normNum(year)}-${normText(term)}-${normText(department)}-${normNum(course)}-${normText(section)}`;
      const data = await fetchJSON([
        normNum(year),
        normText(term),
        normText(department),
        normNum(course),
        normText(section),
      ]);
      console.log('[CalendarView] Outline payload:', data);

      const courseEvents = outlineToEvents(data, courseKey);
      if (!courseEvents.length) {
        alert(
          `No published schedule data for:\n${year} / ${term} / ${department} / ${course} / ${section}\n\n` +
          'The outline may not be published yet, or it may have no scheduled meeting times.'
        );
        return;
      }
      updateEvents(prev => [...prev, ...courseEvents]);
    } catch (err) {
      alert(
        `Could not load that section.\n\n${err.message}\n\n` +
        'Double-check that the section exists (e.g., D100 vs D200) and that the outline is published.'
      );
    }
  };

  /* ----- manual click-to-add event ----- */
  const handleSelectSlot = ({ start }) => {
  const title = window.prompt("New Event Title:");
  if (!title) return;

  const timeStr = window.prompt("Start time? (HH:MM 24hr)", "23:59");
  if (!timeStr) return;

  const [hour, minute] = timeStr.split(":").map(Number);
  const startTime = new Date(start);
  startTime.setHours(hour, minute, 0);

  const endTimeStr = window.prompt("End time? (optional, HH:MM 24hr — press Enter to skip):");

  let endTime;
  if (endTimeStr) {
    const [endHour, endMinute] = endTimeStr.split(":").map(Number);
    endTime = new Date(start);
    endTime.setHours(endHour, endMinute, 0);
  } else {
    endTime = new Date(startTime); // use same as start if left blank
  }

  const newEvent = {
    title,
    start: startTime,
    end: endTime,
    allDay: false,
  };

  updateEvents(prev => [...prev, newEvent]);
};


  /* ----- click existing event -> delete options ----- */
  const handleSelectEvent = (eventObj /*, e */) => {
    // If this is a course meeting, offer "delete all" option.
    if (eventObj.eventType === 'course' && eventObj.courseKey) {
      const delAll = window.confirm(
        `Delete ALL meetings for:\n${eventObj.title}\n\nOK = delete all for this course\nCancel = delete just this one meeting`
      );
      if (delAll) {
        updateEvents(prev => prev.filter(ev => ev.courseKey !== eventObj.courseKey));
        return;
      }
    }
    // else just confirm delete this one
    const delOne = window.confirm(
      `Delete "${eventObj.title}" on ${eventObj.start.toLocaleString()}?`
    );
    if (delOne) {
      updateEvents(prev => prev.filter(ev => ev.id !== eventObj.id));
    }
  };

  const calEvents = useMemo(() => events, [events]);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '10px' }}>📘 Add SFU Course to Calendar</h2>

      {/* Cascading selectors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        {/* Year */}
        <select name="year" value={formData.year} onChange={handleChange}>
          <option value="">Year</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Term */}
        <select
          name="term"
          value={formData.term}
          onChange={handleChange}
          disabled={!formData.year}
        >
          <option value="">Term</option>
          {terms.map(t => (
            <option key={t} value={t}>{capitalize(t)}</option>
          ))}
        </select>

        {/* Department */}
        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          disabled={!formData.term}
        >
          <option value="">Dept</option>
          {departments.map(d => (
            <option key={d} value={d}>{d.toUpperCase()}</option>
          ))}
        </select>

        {/* Course number */}
        <select
          name="course"
          value={formData.course}
          onChange={handleChange}
          disabled={!formData.department}
        >
          <option value="">Course #</option>
          {courses.map(c => (
            <option key={c} value={c}>{c.toUpperCase()}</option>
          ))}
        </select>

        {/* Section */}
        <select
          name="section"
          value={formData.section}
          onChange={handleChange}
          disabled={!formData.course}
        >
          <option value="">Section</option>
          {sections.map(s => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </select>

        <button onClick={fetchCourse} disabled={!formData.section}>
          Add Course
        </button>
      </div>

      {/* Calendar */}
      <div style={{ height: '80vh' }}>
        <Calendar
            localizer={localizer}
            events={calEvents}
            components={{ event: CustomEvent }}
            startAccessor="start"
            endAccessor="end"
            style={{ backgroundColor: 'white' }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            view={view}
            onView={setView}
            views={['month', 'week', 'day', 'agenda']}
            /*
            popup
            showMultiDayTimes
            dayLayoutAlgorithm="no-overlap"
            */
            date={currentDate}
            onNavigate={setCurrentDate}
        />
      </div>
    </div>
  );
}
function CustomEvent({ event }) {
  const start = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const end = event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const showTime = start === end ? start : `${start} – ${end}`;

  const campus = event?.title?.match(/\((.*?)\)/)?.[1] || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8em' }}>
      <strong>{event.title.replace(/\s*\(.*?\)\s*/, '')}</strong>
      <span>{showTime}</span>
      {campus && <span style={{ fontStyle: 'italic', color: '#d1d5db' }}>{campus} Campus</span>}
    </div>
  );
}



export default CalendarView;