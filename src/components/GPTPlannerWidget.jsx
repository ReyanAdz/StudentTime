import React, { useState, useMemo } from 'react';
import { generateGPTResponse } from '../utils/gpt';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    ''
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
        + ` ${ev.title}`;
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

Read the user's request and produce events ONLY for what they asked.

Rules:
- If the user specifies specific dates or a date range (e.g., "Aug 13–17"),
  enumerate EVERY date in that range (inclusive). Do NOT add dates outside it.
- If the user names an activity (e.g., "work"), use that exact title for EVERY item.
  Do NOT invent other activities (no study/gym/etc. unless asked).
- The Markdown you output must be a human-readable mirror of the JSON below.
  Do NOT include anything in Markdown that is not also in the JSON.
- Existing calendar events are fixed commitments. Use them as anchors when scheduling new ones.
- If the user requests a break "between" two activities (e.g. between X and Y), and one or both already exist on the calendar, infer the correct placement for the other based on their timing and the requested break.
- For example: if one event is from 09:00–10:00 and the user asks for a 1-hour break between it and another 2-hour activity, then place the second activity starting at 11:00.
- Never duplicate events that already exist in the calendar. Only schedule new ones that were explicitly requested.
- If the user specifies a break duration, use it exactly. Otherwise, you may use a small buffer to avoid collisions.
Do NOT duplicate events that already exist.


- If the user did NOT provide dates, assume they want a plan for the next seven days starting from the current day.

Output format:
1) A concise Markdown schedule showing exactly the same events as the JSON.
2) THEN a fenced \`json\` block that is a valid array of:
   { "title":"…", "date":"YYYY-MM-DD", "start":"HH:MM", "end":"HH:MM", "timezone":"${tz}" }

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

  /* ─── robust JSON extractor (unchanged behavior) ─── */
  function extractJsonArrayFromResponse(respText) {
    const m = respText.match(/```json\s*([\s\S]*?)\s*```/i) ||
              respText.match(/```json\s*([\s\S]*)$/i);
    if (!m) return null;
    let block = m[1]
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*(?=[}\]])/g, '');
    const trimmed = block.trim();
    if (!trimmed.startsWith('[')) return null;
    try { return JSON.parse(trimmed); }
    catch (e) {
      console.error('JSON.parse failed:', e, '\nBlock was:\n', trimmed);
      return null;
    }
  }

  function makeLocalDate(isoDate, h=0, m=0) {
    const [Y, M, D] = isoDate.split('-').map(Number);
    return new Date(Y, M - 1, D, h, m, 0, 0);
  }

  function jsonToEvents(arr, weekStartDate) {
    const idx = { sun:0,sunday:0, mon:1,monday:1, tue:2,tuesday:2, wed:3,wednesday:3, thu:4,thursday:4, fri:5,friday:5, sat:6,saturday:6 };
    return arr.flatMap(o => {
      const [sH, sM] = (o.start || '00:00').split(':').map(Number);
      const [eH, eM] = (o.end   || '00:00').split(':').map(Number);
      if (o.date) {
        const start = makeLocalDate(o.date, sH, sM);
        const end   = makeLocalDate(o.date, eH, eM);
        return [{ id:`${start.toISOString()}-${Math.random().toString(36).slice(2)}`, title:o.title, start, end, allDay:false }];
      }
      if (o.weekday) {
        const w = idx[o.weekday.toLowerCase()];
        if (w === undefined) return [];
        const start = new Date(weekStartDate);
        start.setDate(start.getDate() + w);
        start.setHours(sH, sM, 0, 0);
        const end = new Date(start);
        end.setHours(eH, eM, 0, 0);
        return [{ id:`${start.toISOString()}-${Math.random().toString(36).slice(2)}`, title:o.title, start, end, allDay:false }];
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
          placeholder="e.g. create a balanced weekly study + gym plan (3h study, 1h gym)."
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

      {/* output — render ONLY the markdown schedule nicely */}
      {response && (
        <>
          <div className="gpt-output" style={{ color:'#0f172a', marginTop:8 }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: (props) => <table className="gpt-table" {...props} />,
                th: (props) => <th style={{textAlign:'left', padding:'6px 8px', borderBottom:'1px solid #e5e7eb'}} {...props} />,
                td: (props) => <td style={{padding:'6px 8px', borderBottom:'1px solid #f1f5f9'}} {...props} />,
                code: ({inline, ...props}) =>
                  inline
                    ? <code style={{background:'#f1f5f9', padding:'2px 4px', borderRadius:4}} {...props} />
                    : <code {...props} />
              }}
            >
              {response.replace(/```json[\s\S]*?```/i, '').trim()}
            </ReactMarkdown>
          </div>

          {/* keep your existing Add-to-calendar behavior */}
          {addEvents && (
            <button
              onClick={() => {
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
                if (evs.length) {
                    addEvents(prev => {
                        const isDuplicate = (a, b) =>
                        a.title === b.title &&
                        a.start.getTime() === b.start.getTime() &&
                        a.end.getTime() === b.end.getTime();

                        const newEvents = evs.filter(
                        newEv => !prev.some(existingEv => isDuplicate(newEv, existingEv))
                        );

                        return [...prev, ...newEvents];
                    });
}
                else alert('Parsed zero events.');
              }}
              style={{ marginTop:8, background:'#16a34a', color:'white',
                       border:'none', borderRadius:4, padding:'6px 12px',
                       cursor:'pointer' }}
            >
              ➕ Add plan to calendar
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default GPTPlannerWidget;
