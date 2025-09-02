export type Term = { id: string; name: string; start?: string; end?: string };
export type Subject = { code: string; name: string };
export type Course = { subject: string; code: string; title: string; credits?: number };
export type Meeting = {
  day: 'Mo'|'Tu'|'We'|'Th'|'Fr'|'Sa'|'Su';
  start: string; // HH:MM (24h)
  end: string;   // HH:MM (24h)
  room?: string;
  campus?: string;
};
export type Section = {
  id: string;
  course: Course;
  crn?: string;
  meetings: Meeting[];
  instructor?: string;
  capacity?: number;
  enrolled?: number;
  modality?: 'InPerson'|'Online'|'Hybrid';
};

export interface SchoolProvider {
  schoolId: 'sfu'|'ubc'|'langara'|'douglas'|'kpu';
  listYears(): Promise<string[]>;
  listTerms(year: string): Promise<Term[]>;
  listSubjects(termId: string): Promise<Subject[]>;
  listCourses(termId: string, subjectCode: string): Promise<Course[]>;
  listSections(termId: string, subjectCode: string, courseCode: string): Promise<Section[]>;
}

export function normalizeDay(s: string): Meeting['day'] {
  const map: Record<string, Meeting['day']> = {
    M: 'Mo', Mo: 'Mo', Mon: 'Mo', MON: 'Mo', Monday: 'Mo',
    T: 'Tu', Tu: 'Tu', Tue: 'Tu', TUE: 'Tu', Tuesday: 'Tu',
    W: 'We', Wed: 'We', WED: 'We', Wednesday: 'We',
    R: 'Th', Th: 'Th', Thu: 'Th', THU: 'Th', Thursday: 'Th',
    F: 'Fr', Fri: 'Fr', FRI: 'Fr', Friday: 'Fr',
    Sa: 'Sa', Sat: 'Sa', SAT: 'Sa', Saturday: 'Sa',
    Su: 'Su', Sun: 'Su', SUN: 'Su', Sunday: 'Su'
  } as const;
  return map[s] ?? (s as Meeting['day']);
}

// Tiny in-memory cache to reduce duplicate calls per session
const cache = new Map<string, any>();
export async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (cache.has(key)) return cache.get(key);
  const v = await fn();
  cache.set(key, v);
  return v;
}
