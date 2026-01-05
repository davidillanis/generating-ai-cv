
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CVData, CVTemplateType } from '../types';
import CVPreview from '../components/CVPreview';

interface TemplatesProps {
  data: CVData;
  onUpdate: (data: CVData) => void;
}

const Templates: React.FC<TemplatesProps> = ({ data, onUpdate }) => {
  const navigate = useNavigate();

  const handleSelect = (type: CVTemplateType) => {
    onUpdate({ ...data, templateType: type });
    navigate('/editor');
  };

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
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Cambia el formato en cualquier momento sin perder datos</p>
          </div>
          <div className="w-32"></div>
       </header>

       <main className="max-w-7xl mx-auto w-full p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {templates.map((t) => (
              <div 
                key={t.type}
                className={`group bg-white rounded-[2rem] border-2 transition-all p-5 cursor-pointer flex flex-col items-center relative shadow-sm hover:shadow-2xl hover:-translate-y-2 ${data.templateType === t.type ? 'border-primary ring-8 ring-primary/5' : 'border-transparent'}`}
                onClick={() => handleSelect(t.type)}
              >
                 <div className="absolute top-4 left-4 z-10">
                    <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase">{t.tag}</span>
                 </div>
                 
                 <div className="w-full aspect-[210/297] bg-slate-50 rounded-[1.5rem] mb-6 overflow-hidden flex items-center justify-center relative shadow-inner">
                    <div className="scale-[0.25] pointer-events-none origin-top">
                      <CVPreview data={{...data, templateType: t.type}} scale={1} />
                    </div>
                    
                    {data.templateType === t.type && (
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

                 <button className={`mt-6 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${data.templateType === t.type ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white'}`}>
                    {data.templateType === t.type ? 'Diseño Activo' : 'Seleccionar'}
                 </button>
              </div>
            ))}
          </div>
       </main>
    </div>
  );
};

export default Templates;
