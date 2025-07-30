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
import { doc, setDoc, getDoc } from 'firebase/firestore'
import GPTPlannerWidget from './GPTPlannerWidget'; // or '../components/GPTPlannerWidget' depending on the file structure


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

//clean text data 
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

// parse full outline to calendar events
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

function toDate(input) {
  if (input instanceof Date) return input;
  if (input?.seconds) return new Date(input.seconds * 1000); // Firestore Timestamp
  if (typeof input === "string" || typeof input === "number") return new Date(input); // ISO or raw
  return null; // fallback
}

/* capitalize for the ui */
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function CalendarView(props) {
  // use parent value if given, otherwise use default
  const { events: propEvents, setEvents: propSetEvents } = props;
  const [internalEvents, setInternalEvents] = useState([]);
  const events = propEvents !== undefined ? propEvents : internalEvents;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); 
  const updateEvents =
    typeof propSetEvents === 'function' ? propSetEvents : setInternalEvents;

   useEffect(() => {
  const loadEvents = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.calendarEvents)) {
          const parsedEvents = data.calendarEvents.map(event => ({
            ...event,
            start: new Date(event.start?.seconds ? event.start.seconds * 1000 : event.start),
            end: new Date(event.end?.seconds ? event.end.seconds * 1000 : event.end),
          }));
          updateEvents(parsedEvents);
        }
      }
    } catch (err) {
      console.error("Error loading saved events:", err);
    }
  };

  loadEvents();
}, []);


  // warn if there is no update function
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

  // select options
  const [years, setYears] = useState(['2023', '2024', '2025']);
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

  /* when the CalendarView loads get available academic years */
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

  /* when year changes, get terms */
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

  /* when term changes, get departments */
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

  /* when department changes, get courses */
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

  /* when course changes, get sections */
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

  /* handles changes for all the drop downs */
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

  /* get selected courses from SFU and its schedule to calendar*/
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

  /* manually add event */
const handleSelectSlot = ({ start }) => {
  const title = window.prompt('New Event Title:');
  if (!title) return;

  const timeStr = window.prompt('Start time? (HH:MM 24‑hr)', '23:59');
  if (!timeStr) return;

  const [hour, minute] = timeStr.split(':').map(Number);
  const startTime = new Date(start);
  startTime.setHours(hour, minute, 0);

  const endTimeStr = window.prompt(
    'End time? (optional, HH:MM 24‑hr — press Enter to skip):'
  );

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




  /* delete events */
  const handleSelectEvent = (eventObj /*, e */) => {
    // delete all option for course
    if (eventObj.eventType === 'course' && eventObj.courseKey) {
      const delAll = window.confirm(
        `Delete ALL meetings for:\n${eventObj.title}\n\nOK = delete all for this course\nCancel = delete just this one meeting`
      );
      if (delAll) {
        updateEvents(prev => prev.filter(ev => ev.courseKey !== eventObj.courseKey));
        return;
      }
    }
    const delOne = window.confirm(
      `Delete "${eventObj.title}" on ${eventObj.start.toLocaleString()}?`
    );
    if (delOne) {
      updateEvents(prev => prev.filter(ev => ev.id !== eventObj.id));
    }
  };

  const calEvents = useMemo(() => events, [events]);
  const saveEvents = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to save events.");
    return;
  }

  try {
    const userDoc = doc(db, "users", user.uid);
    await setDoc(userDoc, { calendarEvents: events }, { merge: true });
    alert("Events saved successfully.");
  } catch (err) {
    console.error("Error saving events:", err);
    alert("Failed to save events.");
  }
};
const loadEvents = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to load events.");
    return;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Array.isArray(data.calendarEvents)) {
        const parsedEvents = data.calendarEvents.map(ev => ({
          ...ev,
          start: toDate(ev.start),
          end: toDate(ev.end),
        }));
        updateEvents(parsedEvents); // ✅ Use parsed version
        alert("Events loaded successfully.");
      } else {
        alert("No calendar events found.");
      }
    } else {
      alert("User document does not exist.");
    }
  } catch (err) {
    console.error("Error loading events:", err);
    alert("Failed to load events.");
  }
};



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

       <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={fetchCourse} disabled={!formData.section}>Add Course</button>
        <button onClick={saveEvents}>Save Calendar</button>
        <button onClick={loadEvents} style={{ marginLeft: '10px' }}>Load Saved Events</button>
       </div>

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

      <div>
         <GPTPlannerWidget events={calEvents} addEvents={updateEvents} />
      </div>

    </div>

  );
}
function CustomEvent({ event, view }) {
  const startStr = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endStr =
    event.end &&
    event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isSameMinute = !endStr || Math.abs(event.end - event.start) <= 60_000;
  const showTime = isSameMinute ? startStr : `${startStr} – ${endStr}`;

  /* remove section numbers from calendar */
  const cleanTitle = event.title.split('–')[0].trim();

  const campus = event.title.match(/\((.*?)\)/)?.[1] || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8em' }}>
      <strong>{cleanTitle}</strong>
      <span>{showTime}</span>
      {campus && (
        <span style={{ fontStyle: 'italic', color: '#d1d5db' }}>
          {campus}&nbsp;Campus
        </span>
      )}
    </div>
  );
}



export default CalendarView;