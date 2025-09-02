import { useState } from 'react';
import { useCatalog } from '../catalog/useCatalog';

export default function CatalogImport({ onAddSection }: { onAddSection?: (s: any) => void }) {
  const [school, setSchool] = useState<'sfu' | 'ubc'>('sfu');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const cat = useCatalog(school);

  // reset selected section whenever course changes or sections list refreshes
  function handleCourseChange(val: string) {
    cat.setCourseCode(val);
    setSelectedSectionId('');
    if (val) cat.loadSections(val);
  }

  const selectedSection = cat.sections.find(s => s.id === selectedSectionId);

  return (
    <div className="catalog-import space-y-2">
      {/* School */}
      <label>School</label>
      <select
        value={school}
        onChange={(e) => { setSchool(e.target.value as any); setSelectedSectionId(''); }}
      >
        <option value="sfu">SFU</option>
        <option value="ubc">UBC (Unofficial)</option>
        {/* <option value="langara">Langara</option>
        <option value="douglas">Douglas College</option>
        <option value="kpu">KPU</option> */}
      </select>

      {/* Year */}
      <label>Year</label>
      <select
        value={cat.year}
        onChange={(e) => { cat.setYear(e.target.value); setSelectedSectionId(''); }}
        disabled={!school}
      >
        <option value="">Select Year</option>
        {cat.years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      {/* Term */}
      <label>Term</label>
      <select
        value={cat.termId}
        onChange={(e) => { cat.setTermId(e.target.value); setSelectedSectionId(''); }}
        disabled={!cat.year}
      >
        <option value="">Select Term</option>
        {cat.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {/* Department */}
      <label>Department</label>
      <select
        value={cat.subject}
        onChange={(e) => { cat.setSubject(e.target.value); setSelectedSectionId(''); }}
        disabled={!cat.termId}
      >
        <option value="">Select Department</option>
        {cat.subjects.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
      </select>

      {/* Course */}
      <label>Course</label>
      <select
        value={cat.courseCode}
        onChange={(e) => handleCourseChange(e.target.value)}
        disabled={!cat.subject}
      >
        <option value="">Select Course</option>
        {cat.courses.map(c => (
          <option key={`${c.subject}-${c.code}`} value={c.code}>
            {c.subject} {c.code} — {c.title}
          </option>
        ))}
      </select>

      {/* Section */}
      <label>Section</label>
      <select
        value={selectedSectionId}
        onChange={(e) => setSelectedSectionId(e.target.value)}
        disabled={!cat.courseCode || !cat.sections.length}
      >
        <option value="">Select Section</option>
        {cat.sections.map(s => (
          <option key={s.id} value={s.id}>
            {s.id}{s.instructor ? ` — ${s.instructor}` : ''}
          </option>
        ))}
      </select>

      <button
        disabled={!selectedSection}
        onClick={() => selectedSection && onAddSection?.(selectedSection)}
      >
        Add Course to Calendar
      </button>

      {school === 'ubc' && (
        <p className="text-xs opacity-70 mt-2">
          Data source: UBCCourses (unofficial). Availability may vary.
        </p>
      )}
    </div>
  );
}
