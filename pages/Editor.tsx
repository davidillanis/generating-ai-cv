import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CVData, Experience, Education, Skill, Language, Certification, Project, AIAction } from '../types';
import CVPreview from '../components/CVPreview';
import AIChatPanel from '../components/AIChatPanel';
import { optimizeSummary } from '../services/geminiService';

interface EditorProps {
  data: CVData;
  onUpdate: (data: CVData) => void;
}

type SectionType = 'personal' | 'experience' | 'education' | 'skills' | 'languages' | 'certifications' | 'projects';

const Editor: React.FC<EditorProps> = ({ data, onUpdate }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionType>('personal');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleUpdate = (newData: Partial<CVData>) => {
    onUpdate({ ...data, ...newData });
  };

  const handlePersonalChange = (field: string, value: string) => {
    handleUpdate({ personal: { ...data.personal, [field]: value } });
  };

  const addItem = <T extends { id: string }>(key: keyof CVData, newItem: T) => {
    handleUpdate({ [key]: [...(data[key] as any[]), newItem] });
  };

  const removeItem = (key: keyof CVData, id: string) => {
    handleUpdate({ [key]: (data[key] as any[]).filter((item: any) => item.id !== id) });
  };

  const updateItem = (key: keyof CVData, id: string, fields: any) => {
    handleUpdate({
      [key]: (data[key] as any[]).map((item: any) => item.id === id ? { ...item, ...fields } : item)
    });
  };

  const handleOptimizeProfile = async (startText: string, sectionOrField: string, contentOrContext: string, numberLines: number, itemId?: string) => {
    setIsOptimizing(true);

    // Determine arguments based on usage logic to support both signatures
    let textToOptimize = startText;
    let instructionContext = contentOrContext;
    let isSectionUpdate = false;

    // Check if we are updating a specific section item (Experience or Projects)
    // Heuristic: If sectionOrField is 'experience' or 'projects', the arguments are likely:
    // arg1: Instruction/Context Title (e.g. "Logros...")
    // arg2: Section Name
    // arg3: Content to optimize
    if (sectionOrField === 'experience' || sectionOrField === 'projects') {
      isSectionUpdate = true;
      textToOptimize = contentOrContext; // Content is 3rd arg
      instructionContext = startText;    // Instruction is 1st arg
    } else {
      // Existing behavior for Profile Summary
      // arg1: Content
      // arg2: Field Name (personalChange)
      // arg3: Context Title
      textToOptimize = startText;
      instructionContext = contentOrContext;
    }

    const role = data.experience[0]?.role || "Profesional";
    const optimized = await optimizeSummary(textToOptimize, role, instructionContext, numberLines);

    if (isSectionUpdate && itemId) {
      updateItem(sectionOrField as keyof CVData, itemId, { description: optimized });
    } else {
      handlePersonalChange(sectionOrField, optimized);
    }

    setIsOptimizing(false);
  };

  const handleExportPDF = () => {
    // Breve retraso para asegurar que cualquier cambio pendiente se renderice antes de abrir el diálogo de impresión
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleAIAction = (action: AIAction) => {
    console.log("Executing AI Action:", action);
    switch (action.type) {
      case 'create':
        // Ensure ID
        const newItem = { ...action.data, id: action.data.id || Date.now().toString() };
        addItem(action.section as any, newItem);
        break;
      case 'update':
        if (action.section === 'personal') {
          handleUpdate({ personal: { ...data.personal, ...action.data } });
        } else if (action.id) {
          updateItem(action.section as any, action.id, action.data);
        }
        break;
      case 'delete':
        if (action.id) {
          removeItem(action.section as any, action.id);
        }
        break;
    }
  };

  const navItems = [
    { id: 'personal', label: 'Datos Personales', icon: 'person' },
    { id: 'experience', label: 'Experiencia', icon: 'work' },
    { id: 'education', label: 'Formación', icon: 'school' },
    { id: 'skills', label: 'Habilidades', icon: 'bolt' },
    { id: 'languages', label: 'Idiomas', icon: 'language' },
    { id: 'certifications', label: 'Certificaciones', icon: 'verified' },
    { id: 'projects', label: 'Proyectos', icon: 'account_tree' },
  ];

  return (
    <div className="h-screen flex flex-col bg-background-light overflow-hidden">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
            <span className="font-black text-lg">CV IA PRO</span>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
          <input
            value={data.title}
            onChange={(e) => handleUpdate({ title: e.target.value })}
            className="border-none bg-transparent font-bold focus:ring-0 text-slate-700 w-48 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/templates')} className="h-9 px-4 border rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[18px]">palette</span> Cambiar Plantilla
          </button>
          <button
            onClick={handleExportPDF}
            className="h-9 px-4 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-hover shadow-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Exportar PDF
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r flex flex-col shrink-0">
          <nav className="p-4 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as SectionType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === item.id ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Dynamic Form Area */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] custom-scroll">
          <div className="max-w-3xl mx-auto p-12 space-y-10">

            {activeSection === 'personal' && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Datos Personales</h2>
                  <p className="text-slate-500 text-sm">Información básica para que los reclutadores te contacten.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
                    <input className="w-full rounded-xl border-slate-200 h-11 text-sm focus:border-primary focus:ring-1 focus:ring-primary" value={data.personal.firstName} onChange={e => handlePersonalChange('firstName', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Apellidos</label>
                    <input className="w-full rounded-xl border-slate-200 h-11 text-sm focus:border-primary focus:ring-1 focus:ring-primary" value={data.personal.lastName} onChange={e => handlePersonalChange('lastName', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                    <input className="w-full rounded-xl border-slate-200 h-11 text-sm focus:border-primary focus:ring-1 focus:ring-primary" value={data.personal.email} onChange={e => handlePersonalChange('email', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Teléfono</label>
                    <input className="w-full rounded-xl border-slate-200 h-11 text-sm focus:border-primary focus:ring-1 focus:ring-primary" value={data.personal.phone} onChange={e => handlePersonalChange('phone', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Ciudad</label>
                    <input className="w-full rounded-xl border-slate-200 h-11 text-sm" value={data.personal.city} onChange={e => handlePersonalChange('city', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">País</label>
                    <input className="w-full rounded-xl border-slate-200 h-11 text-sm" value={data.personal.country} onChange={e => handlePersonalChange('country', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">URL de Foto (Opcional)</label>
                  <input
                    className="w-full rounded-xl border-slate-200 h-11 text-sm"
                    placeholder="https://..."
                    value={data.personal.photoUrl || ''}
                    onChange={e => handlePersonalChange('photoUrl', e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400">La foto solo se mostrará en la plantilla "Modern Blue".</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumen Profesional</label>
                    <button
                      onClick={() => handleOptimizeProfile(data.personal.profileSummary, "profileSummary", "resumen profesional", 8)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                      disabled={isOptimizing}
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      {isOptimizing ? 'Optimizando...' : 'Mejorar con IA'}
                    </button>
                  </div>
                  <textarea
                    className="w-full rounded-xl border-slate-200 h-40 text-sm leading-relaxed p-4 focus:ring-primary focus:border-primary"
                    placeholder="Escribe un breve resumen de tu trayectoria y objetivos..."
                    value={data.personal.profileSummary}
                    onChange={e => handlePersonalChange('profileSummary', e.target.value)}
                  />
                </div>
              </section>
            )}

            {activeSection === 'experience' && (
              <section className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Experiencia Laboral</h2>
                    <p className="text-slate-500 text-sm">Tu historial de empleos en orden cronológico inverso.</p>
                  </div>
                  <button
                    onClick={() => addItem('experience', { id: Date.now().toString(), role: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' })}
                    className="h-10 px-4 bg-white border border-primary text-primary font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined">add</span> Añadir Puesto
                  </button>
                </div>
                <div className="space-y-4">
                  {data.experience.map(exp => (
                    <div key={exp.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 group relative hover:border-primary/30 transition-colors">
                      <button onClick={() => removeItem('experience', exp.id)} className="absolute right-4 top-4 text-slate-300 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Cargo (ej. Director de Ventas)" className="rounded-lg border-slate-200 text-sm h-10" value={exp.role} onChange={e => updateItem('experience', exp.id, { role: e.target.value })} />
                        <input placeholder="Empresa" className="rounded-lg border-slate-200 text-sm h-10" value={exp.company} onChange={e => updateItem('experience', exp.id, { company: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <input type="month" className="rounded-lg border-slate-200 text-sm h-10" value={exp.startDate} onChange={e => updateItem('experience', exp.id, { startDate: e.target.value })} />
                        {!exp.current && <input type="month" className="rounded-lg border-slate-200 text-sm h-10" value={exp.endDate} onChange={e => updateItem('experience', exp.id, { endDate: e.target.value })} />}
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input type="checkbox" checked={exp.current} onChange={e => updateItem('experience', exp.id, { current: e.target.checked })} className="rounded text-primary" /> Actualmente aquí
                        </label>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Logros y Responsabilidades</label>
                          <button
                            onClick={() => handleOptimizeProfile("Logros y responsabilidades", "experience", exp.description + " " + exp.role + " " + exp.company, 4, exp.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                            disabled={isOptimizing}
                          >
                            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                            {isOptimizing ? 'Optimizando...' : 'Mejorar con IA'}
                          </button>
                        </div>
                        <textarea placeholder="Logros y responsabilidades..." className="w-full rounded-lg border-slate-200 text-sm h-28" value={exp.description} onChange={e => updateItem('experience', exp.id, { description: e.target.value })} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === 'education' && (
              <section className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-black text-slate-900">Formación Académica</h2>
                  <button
                    onClick={() => addItem('education', { id: Date.now().toString(), degree: '', institution: '', location: '', startDate: '', endDate: '' })}
                    className="h-10 px-4 bg-white border border-primary text-primary font-bold rounded-xl text-xs flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">add</span> Añadir Estudio
                  </button>
                </div>
                {data.education.map(edu => (
                  <div key={edu.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 relative">
                    <button onClick={() => removeItem('education', edu.id)} className="absolute right-4 top-4 text-slate-300 hover:text-red-500">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                    <input placeholder="Grado o Título" className="w-full rounded-lg border-slate-200 text-sm h-10" value={edu.degree} onChange={e => updateItem('education', edu.id, { degree: e.target.value })} />
                    <input placeholder="Institución" className="w-full rounded-lg border-slate-200 text-sm h-10" value={edu.institution} onChange={e => updateItem('education', edu.id, { institution: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="month" className="rounded-lg border-slate-200 text-sm h-10" value={edu.startDate} onChange={e => updateItem('education', edu.id, { startDate: e.target.value })} />
                      <input type="month" className="rounded-lg border-slate-200 text-sm h-10" value={edu.endDate} onChange={e => updateItem('education', edu.id, { endDate: e.target.value })} />
                    </div>
                  </div>
                ))}
              </section>
            )}

            {activeSection === 'skills' && (
              <section className="space-y-6 animate-in fade-in">
                <h2 className="text-2xl font-black text-slate-900">Habilidades</h2>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Técnicas (Hard Skills)</h4>
                    <div className="space-y-2">
                      {data.skills.filter(s => s.type === 'Technical').map(s => (
                        <div key={s.id} className="flex gap-2">
                          <input className="flex-1 rounded-lg border-slate-200 text-xs h-9" value={s.name} onChange={e => updateItem('skills', s.id, { name: e.target.value })} />
                          <button onClick={() => removeItem('skills', s.id)} className="text-slate-300 hover:text-red-500"><span className="material-symbols-outlined text-[18px]">close</span></button>
                        </div>
                      ))}
                      <button onClick={() => addItem('skills', { id: Date.now().toString(), name: '', type: 'Technical' })} className="w-full border-2 border-dashed rounded-lg py-2 text-[10px] font-bold text-slate-400 hover:border-primary hover:text-primary transition-all">+ Añadir Técnica</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Blandas (Soft Skills)</h4>
                    <div className="space-y-2">
                      {data.skills.filter(s => s.type === 'Soft').map(s => (
                        <div key={s.id} className="flex gap-2">
                          <input className="flex-1 rounded-lg border-slate-200 text-xs h-9" value={s.name} onChange={e => updateItem('skills', s.id, { name: e.target.value })} />
                          <button onClick={() => removeItem('skills', s.id)} className="text-slate-300 hover:text-red-500"><span className="material-symbols-outlined text-[18px]">close</span></button>
                        </div>
                      ))}
                      <button onClick={() => addItem('skills', { id: Date.now().toString(), name: '', type: 'Soft' })} className="w-full border-2 border-dashed rounded-lg py-2 text-[10px] font-bold text-slate-400 hover:border-primary hover:text-primary transition-all">+ Añadir Blanda</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'languages' && (
              <section className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-black text-slate-900">Idiomas</h2>
                  <button onClick={() => addItem('languages', { id: Date.now().toString(), name: '', level: 'Básico' })} className="text-primary text-xs font-bold">+ Añadir Idioma</button>
                </div>
                {data.languages.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl text-slate-400 bg-slate-50">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">translate</span>
                    <p className="text-sm font-medium">No has añadido idiomas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.languages.map((lang) => (
                      <div
                        key={lang.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row gap-3">
                          {/* Input idioma */}
                          <div className="flex-1 min-w-0">
                            <input
                              className="w-full rounded-lg border-slate-200 text-sm h-10 focus:border-primary focus:ring-1 focus:ring-primary"
                              value={lang.name}
                              onChange={e => updateItem('languages', lang.id, { name: e.target.value })}
                              placeholder="Ej: Inglés, Español"
                            />
                          </div>

                          {/* Select nivel */}
                          <div className="w-full sm:w-40">
                            <select
                              className="w-full rounded-lg border-slate-200 text-sm h-10 font-medium focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                              value={lang.level}
                              onChange={e => updateItem('languages', lang.id, { level: e.target.value })}
                            >
                              <option value="Básico">Básico</option>
                              <option value="Intermedio">Intermedio</option>
                              <option value="Avanzado">Avanzado</option>
                              <option value="Nativo">Nativo</option>
                            </select>
                          </div>

                          {/* Botón eliminar */}
                          <button
                            onClick={() => removeItem('languages', lang.id)}
                            className="h-10 w-full sm:w-10 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeSection === 'certifications' && (
              <section className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Cursos y Certificaciones</h2>
                    <p className="text-slate-500 text-sm">Añade tus certificaciones, diplomas o cursos relevantes.</p>
                  </div>
                  <button
                    onClick={() => addItem('certifications', { id: Date.now().toString(), name: '', issuer: '', date: '' })}
                    className="h-10 px-4 bg-white border border-primary text-primary font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined">add</span> Añadir Certificación
                  </button>
                </div>
                <div className="space-y-4">
                  {data.certifications.map(cert => (
                    <div key={cert.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 relative group">
                      <button onClick={() => removeItem('certifications', cert.id)} className="absolute right-4 top-4 text-slate-300 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre del Curso / Certificación</label>
                          <input
                            placeholder="Ej. Scrum Master Professional"
                            className="w-full rounded-lg border-slate-200 text-sm h-10 focus:ring-primary focus:border-primary"
                            value={cert.name}
                            onChange={e => updateItem('certifications', cert.id, { name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Institución Emisora</label>
                          <input
                            placeholder="Ej. Google, Coursera, Universidad..."
                            className="w-full rounded-lg border-slate-200 text-sm h-10 focus:ring-primary focus:border-primary"
                            value={cert.issuer}
                            onChange={e => updateItem('certifications', cert.id, { issuer: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="w-1/3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Año de Finalización</label>
                        <input
                          type="text"
                          placeholder="Ej. 2023"
                          className="w-full rounded-lg border-slate-200 text-sm h-10 focus:ring-primary focus:border-primary"
                          value={cert.date}
                          onChange={e => updateItem('certifications', cert.id, { date: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                  {data.certifications.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed rounded-2xl text-slate-400">
                      No has añadido certificaciones todavía.
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeSection === 'projects' && (
              <section className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Proyectos Destacados</h2>
                    <p className="text-slate-500 text-sm">Muestra proyectos personales, freelancing o iniciativas clave.</p>
                  </div>
                  <button
                    onClick={() => addItem('projects', { id: Date.now().toString(), name: '', description: '', link: '' })}
                    className="h-10 px-4 bg-white border border-primary text-primary font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined">add</span> Añadir Proyecto
                  </button>
                </div>
                <div className="space-y-4">
                  {data.projects.map(project => (
                    <div key={project.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 group relative hover:border-primary/30 transition-colors">
                      <button onClick={() => removeItem('projects', project.id)} className="absolute right-4 top-4 text-slate-300 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre del Proyecto</label>
                          <input placeholder="Ej. App de Gestión de Inventarios" className="w-full rounded-lg border-slate-200 text-sm h-10" value={project.name} onChange={e => updateItem('projects', project.id, { name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Enlace (Opcional)</label>
                          <input placeholder="https://github.com/..." className="w-full rounded-lg border-slate-200 text-sm h-10" value={project.link || ''} onChange={e => updateItem('projects', project.id, { link: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Descripción</label>
                          <button
                            onClick={() => handleOptimizeProfile("Descripción del proyecto", "projects", project.name + " " + project.description, 4, project.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                            disabled={isOptimizing}
                          >
                            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                            {isOptimizing ? 'Optimizando...' : 'Mejorar con IA'}
                          </button>
                        </div>
                        <textarea placeholder="Describe el impacto, tecnologías usadas y tu rol..." className="w-full rounded-lg border-slate-200 text-sm h-28" value={project.description} onChange={e => updateItem('projects', project.id, { description: e.target.value })} />
                      </div>
                    </div>
                  ))}
                  {data.projects.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed rounded-2xl text-slate-400">
                      No has añadido proyectos todavía.
                    </div>
                  )}
                </div>
              </section>
            )}

          </div>
        </main>

        {/* Live Preview Panel */}
        <aside className="hidden xl:flex w-[600px] bg-slate-200 border-l flex-col">
          <div className="h-12 bg-white/80 backdrop-blur border-b flex items-center justify-between px-6 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">visibility</span> Vista Previa
            </span>
            <div className="flex gap-2 items-center">
              <span className="size-2 rounded-full bg-green-500"></span>
              <span className="text-[10px] font-bold text-green-700">Modo Edición Real-Time</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto flex justify-center custom-scroll">
            <CVPreview data={data} scale={0.65} />
          </div>
        </aside>
      </div>

      <AIChatPanel currentCV={data} onAction={handleAIAction} />
    </div>
  );
};

export default Editor;
