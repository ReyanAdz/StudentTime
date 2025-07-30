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

    const fullPrompt = `
Write a friendly Markdown schedule **first**.

THEN output a fenced \`json\` block that is VALID, COMPLETE, and closes with \`\`\`.  
Return **nothing after** that final fence.

The JSON must be an array of objects:  
[ { "title":"…", "weekday":"Mon", "start":"HH:MM", "end":"HH:MM" } ]

Existing calendar:

${calendarSummary}

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

  /* ─── helper: tolerant parser  ─── */
  function sloppyParse(block) {
    // convert curly quotes → straight quotes
    const txt = block
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");

    const rows = txt.split(/[\r\n]+/).map(l => l.trim());
    const out  = [];

    rows.forEach(line => {
      /* grab "key": "value" pairs */
      const kv = {};
      line.replace(/"(\w+)":\s*"([^"]+)"/g, (_, k, v) => {
        kv[k.toLowerCase()] = v;
        return '';
      });
      if (kv.title && kv.weekday && kv.start && kv.end) out.push(kv);
    });

    return out;
  }

  /* ─── JSON → Date events ─── */
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
      const w = idx[o.weekday.toLowerCase()];
      if (w === undefined) return [];
      const [sH,sM] = o.start.split(':').map(Number);
      const [eH,eM] = o.end.split(':').map(Number);

      const start = new Date(weekStartDate);
      start.setDate(start.getDate() + w);
      start.setHours(sH, sM, 0, 0);

      const end = new Date(start);
      end.setHours(eH, eM, 0, 0);

      return [{
        id   : `${start.toISOString()}-${Math.random().toString(36).slice(2)}`,
        title: o.title,
        start,
        end,
        allDay:false,
      }];
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
          {loading ? '…' : 'Ask GPT'}
        </button>
      </form>

      {/* output */}
      {response && (
        <>
          <pre
            style={{ marginTop:12, whiteSpace:'pre-wrap',
                     background:'#f3f4f6', padding:12, borderRadius:4, fontSize:'0.9rem' }}
          >
            {response.replace(/```json[\s\S]*?```/i, '').trim()}
          </pre>

          {addEvents && (
            <button
              onClick={() => {
                /* grab ```json … ``` (closed) or fallback to rest of text */
                const match =
                  response.match(/```json\s*([\s\S]*?)\s*```/i) ||
                  response.match(/```json\s*([\s\S]*)$/i);
                if (!match) return alert('No JSON found in GPT response.');

                console.log('📦 raw JSON block\n', match[1]);
                const payload = sloppyParse(match[1]);
                if (!payload.length) return alert('No usable events found.');

                /* anchor to current week’s Monday */
                const monday = new Date();
                monday.setHours(0,0,0,0);
                monday.setDate(monday.getDate() - ((monday.getDay()+6)%7));

                const evs = jsonToEvents(payload, monday);
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