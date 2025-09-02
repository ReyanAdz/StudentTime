// src/catalog/sfu.ts
import { SchoolProvider, Term, Subject, Course, Section, normalizeDay, cached } from './types';

const SFU_BASE = 'https://www.sfu.ca/bin/wcm/course-outlines';

// Build URL like: BASE ? 2025/summer/CMPT/225
function sfuFetch(segments: Array<string | number>) {
  const qs = segments.filter(Boolean).join('/');
  const url = qs ? `${SFU_BASE}?${qs}` : SFU_BASE;
  return fetch(url).then(async (r) => {
    if (!r.ok) throw new Error(`SFU ${r.status} ${r.statusText}`);
    return r.json();
  });
}

export const sfu: SchoolProvider = {
  schoolId: 'sfu',

  async listYears(): Promise<string[]> {
    return cached('sfu:years', async () => {
      const years = await sfuFetch([]);
      // Typically an array of numbers/strings
      return (years || []).map((y: any) => String(y.value ?? y.text ?? y));
    });
  },

  async listTerms(year: string): Promise<Term[]> {
    return cached(`sfu:terms:${year}`, async () => {
      const terms = await sfuFetch([year]);
      // e.g. ["spring","summer","fall"] or [{value:"spring"}...]
      return (terms || []).map((t: any) => {
        const term = String(t.value ?? t.text ?? t);
        return { id: `${year}-${term}`, name: `${year} ${term.toUpperCase()}` };
      });
    });
  },

  async listSubjects(termId: string): Promise<Subject[]> {
    const [year, term] = termId.split('-');
    return cached(`sfu:subjects:${year}:${term}`, async () => {
      const data = await sfuFetch([year, term]);
      // items like { value:"CMPT", text:"Computing Science" }
      return (data || []).map((d: any) => ({
        code: String(d.value ?? d.text ?? d),
        name: String(d.text ?? d.value ?? d),
      }));
    });
  },

  async listCourses(termId: string, subjectCode: string): Promise<Course[]> {
    const [year, term] = termId.split('-');
    return cached(`sfu:courses:${year}:${term}:${subjectCode}`, async () => {
      const data = await sfuFetch([year, term, subjectCode]);
      // items like { value:"225", text:"Data Structures and Programming" }
      return (data || []).map((c: any) => ({
        subject: subjectCode,
        code: String(c.value ?? c.text ?? c),
        title: String(c.text ?? c.value ?? c),
      }));
    });
  },

  async listSections(termId: string, subjectCode: string, courseCode: string): Promise<Section[]> {
    const [year, term] = termId.split('-');
    return cached(`sfu:sections:${year}:${term}:${subjectCode}:${courseCode}`, async () => {
      const data = await sfuFetch([year, term, subjectCode, courseCode]);
      // “data” is an array of section objects, each with schedule fields
      return (data || []).map((sec: any) => {
        const meetings: Section['meetings'] = (sec?.time || sec?.courseSchedule || sec?.schedule || []).map((m: any) => ({
          day: normalizeDay(m.day),
          start: m.startTime ?? m.start ?? '',
          end: m.endTime ?? m.end ?? '',
          room: m.room,
          campus: sec.campus,
        }));
        const instructor =
          Array.isArray(sec.instructor)
            ? sec.instructor.map((i: any) => i.name).join(', ')
            : (sec.instructor?.name ?? sec.instructor);

        const modality = (sec.deliveryMethod || '')
          .toLowerCase()
          .includes('online')
          ? 'Online'
          : (sec.deliveryMethod || '').toLowerCase().includes('blended')
          ? 'Hybrid'
          : 'InPerson';

        return {
          id: String(sec.section ?? sec.value ?? sec.text ?? ''),
          course: {
            subject: subjectCode,
            code: courseCode,
            title: sec.title || `${subjectCode} ${courseCode}`,
          },
          crn: sec.classNumber ?? sec.crn,
          meetings,
          instructor,
          capacity: sec.enrollmentCap ?? sec.capacity,
          enrolled: sec.enrollment ?? sec.enrolled,
          modality,
        } as Section;
      });
    });
  },
};
