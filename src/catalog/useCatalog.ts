import { useEffect, useMemo, useState } from 'react';
import type { Course, Section, Subject, Term } from './types';
import { providers } from './index';

export function useCatalog(school: string) {
  const provider = useMemo(() => providers[school], [school]);

  const [years, setYears] = useState<string[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [year, setYear] = useState('');
  const [termId, setTermId] = useState('');
  const [subject, setSubject] = useState('');
  const [courseCode, setCourseCode] = useState('');

  // Load years when school changes
  useEffect(() => {
    if (!provider) { setYears([]); return; }
    provider.listYears().then(setYears).catch(() => setYears([]));
    // reset chain
    setYear(''); setTermId(''); setSubject(''); setCourseCode('');
    setTerms([]); setSubjects([]); setCourses([]); setSections([]);
  }, [provider]);

  // Load terms when year selected
  useEffect(() => {
    if (!provider || !year) { setTerms([]); setTermId(''); return; }
    provider.listTerms(year).then(setTerms).catch(() => setTerms([]));
    setTermId(''); setSubject(''); setCourseCode(''); setSubjects([]); setCourses([]); setSections([]);
  }, [provider, year]);

  // Load subjects on term
  useEffect(() => {
    if (!provider || !termId) { setSubjects([]); setSubject(''); return; }
    provider.listSubjects(termId).then(setSubjects).catch(() => setSubjects([]));
    setSubject(''); setCourseCode(''); setCourses([]); setSections([]);
  }, [provider, termId]);

  // Load courses on subject
  useEffect(() => {
    if (!provider || !termId || !subject) { setCourses([]); setCourseCode(''); return; }
    provider.listCourses(termId, subject).then(setCourses).catch(() => setCourses([]));
    setCourseCode(''); setSections([]);
  }, [provider, termId, subject]);

  async function loadSections(course: string) {
    if (!provider || !termId || !subject || !course) return setSections([]);
    try { setSections(await provider.listSections(termId, subject, course)); } catch { setSections([]); }
  }

  return {
    years, terms, subjects, courses, sections,
    year, setYear, termId, setTermId, subject, setSubject, courseCode, setCourseCode,
    loadSections
  } as const;
}
