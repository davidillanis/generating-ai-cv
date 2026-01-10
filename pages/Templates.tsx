
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CVData, CVTemplateType, TemplateConfig } from '../types';
import CVPreview from '../components/CVPreview';

interface TemplatesProps {
  data: CVData;
  onUpdate: (data: CVData) => void;
}

const Templates: React.FC<TemplatesProps> = ({ data, onUpdate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [myTemplates, setMyTemplates] = useState<TemplateConfig[]>([]);
  const [communityTemplates, setCommunityTemplates] = useState<TemplateConfig[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchTemplates = async () => {
      const { data: fetchedTemplates, error } = await supabase
        .from('cv_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error fetching templates:", error);
        return;
      }

      if (fetchedTemplates) {
        const all: TemplateConfig[] = fetchedTemplates.map(d => ({
          ...d.config,
          id: d.id,
          author: d.author,
          isPublic: d.is_public,
          authorId: d.author_id // Map DB author_id to internal field
        }));

        setMyTemplates(all.filter(t => (t as any).authorId === user.id));
        setCommunityTemplates(all.filter(t => (t as any).authorId !== user.id && t.isPublic));
      }
    };
    fetchTemplates();
  }, [user]);

  const handleSelect = (type: CVTemplateType) => {
    // Clear custom template when selecting standard
    const updatedData = { ...data, templateType: type };
    delete updatedData.customTemplate;
    onUpdate(updatedData);
    navigate('/editor');
  };

  const handleSelectCustom = (template: TemplateConfig) => {
    onUpdate({
      ...data,
      templateType: CVTemplateType.CUSTOM,
      customTemplate: template
    });
    navigate('/editor');
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;

    try {
      const res = await supabase.from('cv_templates').delete().eq('id', id);
      console.log(res);
      if (res.error) throw res.error;
      setMyTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  const handleUpdateDesign = (field: 'primaryColor' | 'fontFamily', value: string) => {
    onUpdate({
      ...data,
      personal: {
        ...data.personal,
        design: {
          ...data.personal.design,
          [field]: value
        }
      }
    });
  };

  const colors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Purple', value: '#9333ea' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Slate', value: '#334155' },
    { name: 'Black', value: '#000000' },
  ];

  const fonts = [
    { name: 'Inter (Moderno)', value: 'Inter, sans-serif' },
    { name: 'Roboto (Estándar)', value: 'Roboto, sans-serif' },
    { name: 'Merriweather (Serif)', value: 'Merriweather, serif' },
    { name: 'Montserrat (Geométrico)', value: 'Montserrat, sans-serif' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  ];

  const templates = [
    {
      type: CVTemplateType.ATS,
      title: 'ATS Standard',
      desc: 'Optimizado para sistemas automáticos de reclutamiento. Sin distracciones.',
      tag: 'Más Popular'
    },
    {
      type: CVTemplateType.HARVARD,
      title: 'Harvard Classic',
      desc: 'El estándar de oro para puestos ejecutivos y legales. Seriedad máxima.',
      tag: 'Nivel Ejecutivo'
    },
    {
      type: CVTemplateType.MODERN,
      title: 'Modern Blue',
      desc: 'Diseño asimétrico con barra lateral. Excelente para tecnología.',
      tag: 'Creativo'
    },
    {
      type: CVTemplateType.CLASSIC,
      title: 'Elegante Profesional',
      desc: 'Equilibrio perfecto entre diseño tradicional y legibilidad moderna.',
      tag: 'Versátil'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="h-20 bg-white border-b flex items-center justify-between px-10 shrink-0 sticky top-0 z-50">
        <button onClick={() => navigate('/editor')} className="flex items-center gap-2 font-bold text-slate-600 hover:text-primary transition-all">
          <span className="material-symbols-outlined">arrow_back</span> Regresar
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900">Elige tu Estilo</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Cambia el formato en cualquier momento</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/template-builder')}
            className="bg-white border text-slate-600 border-slate-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:border-primary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span> Crear
          </button>
          <button
            onClick={() => setIsCustomizing(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">palette</span> Personalizar
          </button>
        </div>
      </header>



      <main className="max-w-7xl mx-auto w-full p-12 space-y-12">
        {/* My Templates Section */}
        {myTemplates.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">folder_special</span> Mis Plantillas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {myTemplates.map((t) => (
                <div
                  key={t.id}
                  className={`group bg-white rounded-[2rem] border-2 transition-all p-5 cursor-pointer flex flex-col items-center relative shadow-sm hover:shadow-2xl hover:-translate-y-2 ${data.customTemplate?.id === t.id ? 'border-primary ring-8 ring-primary/5' : 'border-transparent'}`}
                  onClick={() => handleSelectCustom(t)}
                >
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`text-white text-[9px] font-black px-2 py-1 rounded-full uppercase ${t.isPublic ? 'bg-indigo-500' : 'bg-slate-500'}`}>
                      {t.isPublic ? 'Pública' : 'Privada'}
                    </span>
                  </div>

                  {/* Preview Mini */}
                  <div className="w-full aspect-[210/297] bg-slate-50 rounded-[1.5rem] mb-6 overflow-hidden flex items-center justify-center relative shadow-inner">
                    <div className="scale-[0.25] pointer-events-none origin-top">
                      <CVPreview data={{ ...data, templateType: CVTemplateType.CUSTOM, customTemplate: t }} scale={1} />
                    </div>
                    {data.customTemplate?.id === t.id && (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in">
                        <div className="bg-white text-primary p-4 rounded-full shadow-2xl scale-110">
                          <span className="material-symbols-outlined text-4xl">done_all</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center px-2 w-full">
                    <h3 className="text-lg font-black mb-1 truncate">{t.name}</h3>
                    <p className="text-[10px] text-slate-400">Creado por ti</p>
                  </div>

                  <div className="flex gap-2 w-full mt-6">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/template-builder?id=${t.id}`); }}
                      className="flex-1 py-2 rounded-xl bg-slate-50 text-slate-600 font-bold text-[10px] uppercase hover:bg-white border hover:border-slate-300 transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span> Editar
                    </button>
                    <button
                      onClick={(e) => handleDeleteTemplate(e, t.id)}
                      className="py-2 px-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                  <button className={`mt-2 w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${data.customTemplate?.id === t.id ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white'}`}>
                    {data.customTemplate?.id === t.id ? 'Activo' : 'Usar'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Community Templates Section */}
        {communityTemplates.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">public</span> Comunidad
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {communityTemplates.map((t) => (
                <div
                  key={t.id}
                  className={`group bg-white rounded-[2rem] border-2 transition-all p-5 cursor-pointer flex flex-col items-center relative shadow-sm hover:shadow-2xl hover:-translate-y-2 ${data.customTemplate?.id === t.id ? 'border-primary ring-8 ring-primary/5' : 'border-transparent'}`}
                  onClick={() => handleSelectCustom(t)}
                >
                  <div className="absolute top-4 left-4 z-10 w-[90%] flex justify-between">
                    <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase shadow-md">
                      Comunidad
                    </span>
                  </div>

                  <div className="w-full aspect-[210/297] bg-slate-50 rounded-[1.5rem] mb-6 overflow-hidden flex items-center justify-center relative shadow-inner">
                    <div className="scale-[0.25] pointer-events-none origin-top">
                      <CVPreview data={{ ...data, templateType: CVTemplateType.CUSTOM, customTemplate: t }} scale={1} />
                    </div>
                    {data.customTemplate?.id === t.id && (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in">
                        <div className="bg-white text-primary p-4 rounded-full shadow-2xl scale-110">
                          <span className="material-symbols-outlined text-4xl">done_all</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center px-2 w-full">
                    <h3 className="text-lg font-black mb-1 truncate">{t.name}</h3>
                    <p className="text-[10px] text-slate-400">Por: {t.author}</p>
                  </div>

                  <div className="flex gap-2 w-full mt-6">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/template-builder?cloneId=${t.id}`); }}
                      className="flex-1 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-[10px] uppercase hover:bg-indigo-100 border border-indigo-100 transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span> Clonar
                    </button>
                  </div>
                  <button className={`mt-2 w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${data.customTemplate?.id === t.id ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white'}`}>
                    {data.customTemplate?.id === t.id ? 'Activo' : 'Usar'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Standard Templates Section */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">grid_view</span> Estándar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {templates.map((t) => (
              <div
                key={t.type}
                className={`group bg-white rounded-[2rem] border-2 transition-all p-5 cursor-pointer flex flex-col items-center relative shadow-sm hover:shadow-2xl hover:-translate-y-2 ${data.templateType === t.type && !data.customTemplate ? 'border-primary ring-8 ring-primary/5' : 'border-transparent'}`}
                onClick={() => handleSelect(t.type)}
              >
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase">{t.tag}</span>
                </div>

                <div className="w-full aspect-[210/297] bg-slate-50 rounded-[1.5rem] mb-6 overflow-hidden flex items-center justify-center relative shadow-inner">
                  <div className="scale-[0.25] pointer-events-none origin-top">
                    {/* Clean preview without custom props for standard templates */}
                    <CVPreview data={{ ...data, templateType: t.type, customTemplate: undefined }} scale={1} />
                  </div>

                  {data.templateType === t.type && !data.customTemplate && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center transition-all animate-in fade-in duration-300">
                      <div className="bg-white text-primary p-4 rounded-full shadow-2xl scale-110">
                        <span className="material-symbols-outlined text-4xl">done_all</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center px-2">
                  <h3 className="text-lg font-black mb-1">{t.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed h-8 line-clamp-2">{t.desc}</p>
                </div>

                <button className={`mt-6 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${data.templateType === t.type && !data.customTemplate ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white'}`}>
                  {data.templateType === t.type && !data.customTemplate ? 'Diseño Activo' : 'Seleccionar'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Style Customization Modal */}
      {
        isCustomizing && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col space-y-8 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-black text-slate-900">Personalizar Estilo</h3>
                <button onClick={() => setIsCustomizing(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Color Principal</label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleUpdateDesign('primaryColor', c.value)}
                      className={`size-10 rounded-full border-2 transition-all flex items-center justify-center ${data.personal.design?.primaryColor === c.value ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    >
                      {data.personal.design?.primaryColor === c.value && (
                        <span className="material-symbols-outlined text-white text-lg drop-shadow-md">check</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipografía</label>
                <div className="grid grid-cols-1 gap-2">
                  {fonts.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => handleUpdateDesign('fontFamily', f.value)}
                      className={`px-4 py-3 rounded-xl border text-left text-sm transition-all flex justify-between items-center ${data.personal.design?.fontFamily === f.value ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      style={{ fontFamily: f.value }}
                    >
                      <span className="truncate">{f.name}</span>
                      {data.personal.design?.fontFamily === f.value && (
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsCustomizing(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                Listo
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Templates;
