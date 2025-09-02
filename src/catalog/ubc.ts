import { SchoolProvider, Term, Subject, Course, Section, normalizeDay, cached } from './types';

// Use ONE of these in .env (Vite):
// VITE_UBC_BASE=https://api.ubccourses.com
// VITE_UBC_PROXY=https://<region>-<project>.cloudfunctions.net/ubcProxy?path=
const RAW = import.meta.env.VITE_UBC_BASE as string | undefined;
const PROXY = import.meta.env.VITE_UBC_PROXY as string | undefined; // ends with '?path='

async function j(path: string) {
  const url = RAW ? `${RAW}/${path}` : `${PROXY}${encodeURIComponent(path)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`UBC API ${r.status}`);
  return r.json();
}

export const ubc: SchoolProvider = {
  schoolId: 'ubc',

  async listYears(): Promise<string[]> {
    return cached('ubc:years', async () => {
      const terms = await j('terms') as any[];
      const years = Array.from(new Set((terms || []).map((t: any) => String(t.code).slice(0,4))));
      return years.sort();
    });
  },

  async listTerms(year: string): Promise<Term[]> {
    return cached(`ubc:terms:${year}`, async () => {
      const terms = await j('terms');
      return (terms || [])
        .filter((t: any) => String(t.code).startsWith(String(year)))
        .map((t: any) => ({ id: String(t.code), name: t.name || String(t.code) }));
    });
  },

  async listSubjects(termId: string): Promise<Subject[]> {
    return cached(`ubc:subjects:${termId}`, async () => {
      const data = await j(`terms/${termId}/subjects`);
      return (data || []).map((s: any) => ({ code: s.code, name: s.name ?? s.code }));
    });
  },
  
  async listCourses(termId: string, subjectCode: string): Promise<Course[]> {
    return cached(`ubc:courses:${termId}:${subjectCode}`, async () => {
      const data = await j(`terms/${termId}/subjects/${subjectCode}/courses`);
      return (data || []).map((c: any) => ({ subject: subjectCode, code: String(c.number), title: c.title, credits: c.credits ?? undefined }));
    });
  },

  async listSections(termId: string, subjectCode: string, courseCode: string): Promise<Section[]> {
    const key = `ubc:sections:${termId}:${subjectCode}:${courseCode}`;
    return cached(key, async () => {
      const data = await j(`terms/${termId}/subjects/${subjectCode}/courses/${courseCode}/sections`);
      return (data || []).map((s: any) => ({
        id: s.section ?? s.crn ?? `${subjectCode}-${courseCode}-${s.id ?? ''}`,
        course: { subject: subjectCode, code: courseCode, title: s.title ?? `${subjectCode} ${courseCode}` },
        crn: s.crn,
        meetings: (s.meetings ?? s.schedule ?? []).map((m: any) => ({
          day: normalizeDay(m.day), start: m.start, end: m.end, room: m.room, campus: m.campus
        })),
        instructor: s.instructor?.name ?? s.instructor ?? undefined,
        capacity: s.capacity, enrolled: s.enrolled,
        modality: s.modality ?? (String(s.location||'').toLowerCase().includes('online') ? 'Online' : undefined)
      }));
    });
  }
};

    