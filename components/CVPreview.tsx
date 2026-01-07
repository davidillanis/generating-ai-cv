
import React from 'react';
import { CVData, CVTemplateType } from '../types';

interface CVPreviewProps {
  data: CVData;
  scale?: number;
}

const CVPreview: React.FC<CVPreviewProps> = ({ data, scale = 1 }) => {
  const { personal, experience, education, skills, languages, certifications, projects, templateType } = data;

  const technicalSkills = skills.filter(s => s.type === 'Technical');
  const softSkills = skills.filter(s => s.type === 'Soft');

  const renderTemplate = () => {
    switch (templateType) {
      case CVTemplateType.HARVARD:
        return (
          <div className="p-4 font-serif text-[#1a1a1a] space-y-5" style={{ marginTop: '-1rem' }}>
            <header className="text-center">
              <h1 className="text-1xl font-bold uppercase tracking-tighter">{personal.firstName} {personal.lastName}</h1>
              <div className="text-[11px] mt-2 space-x-2">
                <span>{personal.city}, {personal.country}</span>
                <span>•</span>
                <span>{personal.phone}</span>
                <span>•</span>
                <span>{personal.email}</span>
                {personal.linkedin && <span>• <span className="underline">{personal.linkedin}</span></span>}
              </div>
            </header>

            <section>
              <h2 className="text-xs font-bold border-b border-black mb-2 text-center">Resumen Profesional</h2>
              <p className="text-[11px] text-justify leading-relaxed">{personal.profileSummary}</p>
            </section>
            <section>
              <h2 className="text-xs font-bold border-b border-black mb-3 text-center">Experiencia Profesional</h2>
              {experience.map(exp => (
                <div key={exp.id} className="mb-4">
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>{exp.company.toUpperCase()}</span>
                    <span>{exp.location}</span>
                  </div>
                  <div className="flex justify-between text-[11px] italic">
                    <span>{exp.role}</span>
                    <span>{exp.startDate} – {exp.current ? 'Presente' : exp.endDate}</span>
                  </div>
                  <p className="text-[10.5px] mt-1 text-justify whitespace-pre-line leading-snug">{exp.description}</p>
                </div>
              ))}
            </section>

            {projects.length > 0 && (
              <section>
                <h2 className="text-xs font-bold border-b border-black mb-2 text-center">Proyectos Destacados</h2>
                {projects.map(p => (
                  <div key={p.id} className="mb-3">
                    <div className="flex justify-between font-bold text-[11px]">
                      <span>{p.name}</span>
                      {p.link && <span className="text-[9px] underline italic">{p.link}</span>}
                    </div>
                    <p className="text-[10.5px] leading-relaxed text-justify">{p.description}</p>
                  </div>
                ))}
              </section>
            )}

            <section>
              <h2 className="text-xs font-bold border-b border-black mb-2 text-center">Educación</h2>
              {education.map(edu => (
                <div key={edu.id} className="mb-2">
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>{edu.institution}</span>
                    <span>{edu.startDate} – {edu.endDate}</span>
                  </div>
                  <p className="text-[11px] italic">{edu.degree} — {edu.location}</p>
                </div>
              ))}
            </section>

            {certifications.length > 0 && (
              <section>
                <h2 className="text-xs font-bold border-b border-black mb-2 text-center">Certificaciones</h2>
                <ul className="list-disc ml-4 space-y-0.5">
                  {certifications.map(c => (
                    <li key={c.id} className="text-[11px]">
                      <span className="font-bold">{c.name}</span>, {c.issuer} ({c.date})
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="grid grid-cols-2 gap-8">
              <section>
                <h2 className="text-xs font-bold border-b border-black mb-2">Habilidades</h2>
                <p className="text-[10px] leading-relaxed">
                  <span className="font-bold">Técnicas:</span> {technicalSkills.map(s => s.name).join(', ')}
                </p>
                <p className="text-[10px] leading-relaxed mt-1">
                  <span className="font-bold">Blandas:</span> {softSkills.map(s => s.name).join(', ')}
                </p>
              </section>
              <section>
                <h2 className="text-xs font-bold border-b border-black mb-2">Idiomas</h2>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {languages.map(l => (
                    <span key={l.id} className="text-[10px]"><span className="font-bold">{l.name}:</span> {l.level}</span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        );

      case CVTemplateType.MODERN:
        return (
          <div className="flex min-h-full bg-white">
            <aside className="w-[240px] bg-[#f8fafc] border-r p-8 flex flex-col gap-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-primary tracking-widest">Contacto</h3>
                <div className="space-y-3 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">mail</span>
                    <span className="truncate">{personal.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    <span>{personal.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span>{personal.city}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-primary tracking-widest">Habilidades</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 mb-2">TÉCNICAS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {technicalSkills.map(s => (
                        <span key={s.id} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] text-slate-700">{s.name}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 mb-2">BLANDAS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {softSkills.map(s => (
                        <span key={s.id} className="px-2 py-0.5 bg-primary/5 text-primary rounded text-[9px] font-medium">{s.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-primary tracking-widest">Idiomas</h3>
                {languages.map(l => (
                  <div key={l.id} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold">{l.name}</span>
                      <span className="text-slate-400">{l.level}</span>
                    </div>
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: l.level === 'Nativo' ? '100%' : l.level === 'Avanzado' ? '85%' : l.level === 'Intermedio' ? '60%' : '30%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {certifications.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-primary tracking-widest">Certificaciones</h3>
                  <div className="space-y-3">
                    {certifications.map(c => (
                      <div key={c.id}>
                        <p className="text-[10px] font-bold leading-tight">{c.name}</p>
                        <p className="text-[9px] text-slate-400">{c.issuer} | {c.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
            <main className="flex-1 p-10 space-y-8">
              <header className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 leading-tight">{personal.firstName}<br />{personal.lastName}</h1>
                <div className="h-1.5 w-12 bg-primary rounded-full"></div>
              </header>

              <section className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Perfil</h2>
                <p className="text-[12px] leading-relaxed text-slate-700 text-justify">{personal.profileSummary}</p>
              </section>

              <section className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Experiencia</h2>
                {experience.map(exp => (
                  <div key={exp.id} className="relative pl-6 border-l-2 border-slate-100 last:border-0 pb-2">
                    <div className="absolute -left-[9px] top-1 size-4 bg-white border-4 border-primary rounded-full"></div>
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-[13px] font-bold text-slate-900">{exp.role}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{exp.startDate} — {exp.current ? 'Actual' : exp.endDate}</span>
                    </div>
                    <p className="text-[11px] font-medium text-primary mb-2">{exp.company}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
                  </div>
                ))}
              </section>

              {projects.length > 0 && (
                <section className="space-y-6">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Proyectos</h2>
                  {projects.map(p => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between">
                        <h4 className="text-[12px] font-bold text-slate-900">{p.name}</h4>
                        {p.link && <a href={p.link} className="text-[9px] text-primary underline truncate max-w-[150px]">{p.link}</a>}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed text-justify">{p.description}</p>
                    </div>
                  ))}
                </section>
              )}

              {education.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Formación</h2>
                  {education.map(edu => (
                    <div key={edu.id}>
                      <h4 className="text-[12px] font-bold">{edu.degree}</h4>
                      <p className="text-[11px] text-slate-500">{edu.institution} | {edu.endDate}</p>
                    </div>
                  ))}
                </section>
              )}
            </main>
          </div>
        );

      case CVTemplateType.ATS:
      default:
        return (
          <div className="p-12 space-y-5 font-sans text-[#222]">
            <header className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">{personal.firstName.toUpperCase()} {personal.lastName.toUpperCase()}</h1>
              <p className="text-xs mt-1">
                {personal.city}, {personal.country} | {personal.phone} | {personal.email}
              </p>
              <div className="flex justify-center gap-3 text-[10px] text-blue-800 font-medium underline mt-1">
                {personal.linkedin && <span>{personal.linkedin}</span>}
                {personal.website && <span>{personal.website}</span>}
              </div>
            </header>

            <section className="space-y-1">
              <h2 className="text-sm font-bold border-b border-black uppercase tracking-wide">Perfil Profesional</h2>
              <p className="text-xs leading-normal text-justify">{personal.profileSummary}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold border-b border-black uppercase tracking-wide">Experiencia Laboral</h2>
              {experience.map(exp => (
                <div key={exp.id}>
                  <div className="flex justify-between font-bold text-xs">
                    <span>{exp.company}</span>
                    <span>{exp.startDate} — {exp.current ? 'Presente' : exp.endDate}</span>
                  </div>
                  <div className="flex justify-between italic text-xs mb-1">
                    <span>{exp.role}</span>
                    <span>{exp.location}</span>
                  </div>
                  <ul className="list-disc ml-4 space-y-0.5">
                    {exp.description.split('\n').map((line, i) => (
                      <li key={i} className="text-xs leading-snug">{line.replace(/^[•\-\*]\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            {projects.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-sm font-bold border-b border-black uppercase tracking-wide">Proyectos</h2>
                {projects.map(p => (
                  <div key={p.id} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-xs">
                      <span>{p.name}</span>
                      {p.link && <span className="font-normal text-[10px] underline">{p.link}</span>}
                    </div>
                    <p className="text-xs text-justify leading-snug">{p.description}</p>
                  </div>
                ))}
              </section>
            )}

            <section className="space-y-2">
              <h2 className="text-sm font-bold border-b border-black uppercase tracking-wide">Formación Académica</h2>
              {education.map(edu => (
                <div key={edu.id} className="flex justify-between text-xs">
                  <div>
                    <span className="font-bold">{edu.institution}</span>, {edu.degree}
                  </div>
                  <span className="font-medium">{edu.startDate} — {edu.endDate}</span>
                </div>
              ))}
            </section>

            <section className="space-y-1">
              <h2 className="text-sm font-bold border-b border-black uppercase tracking-wide">Habilidades, Idiomas y Certificaciones</h2>
              <div className="text-xs space-y-1">
                <p><span className="font-bold">Habilidades Técnicas:</span> {technicalSkills.map(s => s.name).join(', ')}</p>
                <p><span className="font-bold">Habilidades Blandas:</span> {softSkills.map(s => s.name).join(', ')}</p>
                <p><span className="font-bold">Idiomas:</span> {languages.map(l => `${l.name} (${l.level})`).join(', ')}</p>
                {certifications.length > 0 && (
                  <p><span className="font-bold">Certificaciones:</span> {certifications.map(c => `${c.name} (${c.issuer}, ${c.date})`).join('; ')}</p>
                )}
              </div>
            </section>
          </div>
        );
    }
  };

  return (
    <div
      className="a4-paper overflow-hidden shadow-2xl origin-top"
      style={{ transform: `scale(${scale})` }}
    >
      {renderTemplate()}
    </div>
  );
};

export default CVPreview;
