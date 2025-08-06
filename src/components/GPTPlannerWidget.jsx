import React, { useState, useMemo } from 'react';
import { generateGPTResponse } from '../utils/gpt';

/**
 * GPTPlannerWidget
 *
 * Props
 *   events    – calendar events array
 *   addEvents – setter from CalendarView (optional)
 */
function GPTPlannerWidget({ events = [], addEvents }) {
  /* ───────────────────────── state ───────────────────────── */
  const [prompt,   setPrompt]   = useState(
    'Create a balanced weekly study + gym plan (3 h study, 1 h gym).'
  );
  const [response, setResponse] = useState('');
  const [loading,  setLoading]  = useState(false);

  /* ─── calendar summary sent to GPT ─── */
  const calendarSummary = useMemo(() => {
    if (!events.length) return 'The user has no events.';
    const wdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const byDay = {};
    events.forEach(ev => {
      const day = wdays[ev.start.getDay()];
      const slot =
        `${ev.start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`
        + `–${ev.end.toLocaleTimeString([],   {hour:'2-digit',minute:'2-digit'})}`
        + ` ${ev.title}`;
      (byDay[day] ||= []).push(slot);
    });
    return Object.entries(byDay)
      .map(([d,s]) => `**${d}:**\n`+s.map(x=>`• ${x}`).join('\n')).join('\n\n');
  }, [events]);

  /* ─── send prompt ─── */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return;

    const todayISO = new Date().toISOString().slice(0,10);
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

const fullPrompt = `
You are a planner. Today is ${todayISO} and the user's timezone is ${tz}.

1) Write a friendly Markdown schedule **first**.

2) THEN return ONLY a fenced \`json\` block with an ARRAY of items.
Each item MUST be:
{
  "title": "…",
  "start": "HH:MM",
  "end":   "HH:MM",
  "timezone": "${tz}",
  // WHEN THE USER GIVES SPECIFIC DATES OR A DATE RANGE:
  //   include "date": "YYYY-MM-DD" and enumerate EVERY date in that range (inclusive),
  //   one object per date (no weekday field in that case).
  // OTHERWISE (no explicit dates given):
  //   include "weekday": "Mon|Tue|Wed|Thu|Fri|Sat|Sun"
}

Avoid overlaps with the existing calendar:
${calendarSummary}

The JSON must be valid and close with \`\`\`. No text after the final fence.

Now: ${prompt.trim()}
`;

    setLoading(true);
    setResponse('');
    try {
      const text = await generateGPTResponse(fullPrompt);
      setResponse(text);
    } catch (err) {
      console.error(err);
      setResponse('⚠️ GPT failed. Check console.');
    } finally {
      setLoading(false);
    }
  }

  /* ─── robust JSON extractor ─── */
function extractJsonArrayFromResponse(respText) {
  const m = respText.match(/```json\s*([\s\S]*?)\s*```/i) ||
            respText.match(/```json\s*([\s\S]*)$/i);
  if (!m) return null;
  let block = m[1]
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*(?=[}\]])/g, ''); // strip trailing commas
  const trimmed = block.trim();
  if (!trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    console.error('JSON.parse failed:', e, '\nBlock was:\n', trimmed);
    return null;
  }
}

  function makeLocalDate(isoDate, h=0, m=0) {
  const [Y, M, D] = isoDate.split('-').map(Number);
  return new Date(Y, M - 1, D, h, m, 0, 0); // local time
}

function jsonToEvents(arr, weekStartDate) {
  const idx = {
    sun:0, sunday:0,
    mon:1, monday:1,
    tue:2, tuesday:2,
    wed:3, wednesday:3,
    thu:4, thursday:4,
    fri:5, friday:5,
    sat:6, saturday:6,
  };

  return arr.flatMap(o => {
    const [sH, sM] = (o.start || '00:00').split(':').map(Number);
    const [eH, eM] = (o.end   || '00:00').split(':').map(Number);

    // Prefer explicit date if present (Aug 13–17 type prompts)
    if (o.date) {
      const start = makeLocalDate(o.date, sH, sM);
      const end   = makeLocalDate(o.date, eH, eM);
      return [{
        id: `${start.toISOString()}-${Math.random().toString(36).slice(2)}`,
        title: o.title,
        start, end, allDay:false,
      }];
    }

    // Fallback: weekday anchored to provided weekStartDate
    if (o.weekday) {
      const w = idx[o.weekday.toLowerCase()];
      if (w === undefined) return [];
      const start = new Date(weekStartDate);
      start.setDate(start.getDate() + w);
      start.setHours(sH, sM, 0, 0);
      const end = new Date(start);
      end.setHours(eH, eM, 0, 0);
      return [{
        id: `${start.toISOString()}-${Math.random().toString(36).slice(2)}`,
        title: o.title,
        start, end, allDay:false,
      }];
    }

    return [];
  });
}


  /* ─── UI ─── */
  return (
    <div style={{ marginTop:'1.5rem' }}>
      {/* input bar */}
      <form onSubmit={handleSubmit} style={{ display:'flex', gap:8 }}>
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ask GPT…"
          style={{ flex:1, padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:4 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ background:'#4f46e5', color:'white', border:'none',
                   borderRadius:4, padding:'8px 14px', cursor:'pointer' }}
        >
          {loading ? '…' : 'Optimize My Time'}
        </button>
      </form>

      {/* output */}
      {response && (
        <>
          <div
            className="gpt-output"
            style={{ color: '#0f172a' }}
            dangerouslySetInnerHTML={{ __html: response.replace(/```json[\s\S]*?```/i, '').trim().replace(/\n/g, '<br/>') }}
          ></div>


          {addEvents && (
            <button
              onClick={() => {
                /* grab ```json … ``` (closed) or fallback to rest of text */
                const match =
                  response.match(/```json\s*([\s\S]*?)\s*```/i) ||
                  response.match(/```json\s*([\s\S]*)$/i);
                if (!match) return alert('No JSON found in GPT response.');

                console.log('📦 raw JSON block\n', match[1]);
                const arr = extractJsonArrayFromResponse(response);
if (!arr) return alert('No valid JSON array found in GPT response.');

                const monday = new Date();
monday.setHours(0,0,0,0);
monday.setDate(monday.getDate() - ((monday.getDay()+6)%7));

                const evs = jsonToEvents(arr, monday);
if (evs.length) addEvents(prev => [...prev, ...evs]);
else alert('Parsed zero events.');
              }}
              style={{ marginTop:8, background:'#16a34a', color:'white',
                       border:'none', borderRadius:4, padding:'6px 12px',
                       cursor:'pointer' }}
            >
              ➕ Add plan to calendar
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default GPTPlannerWidget;