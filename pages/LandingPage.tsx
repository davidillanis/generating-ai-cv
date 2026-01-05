
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <header className="flex items-center justify-between px-6 lg:px-20 py-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
          <h2 className="text-xl font-bold tracking-tight">CV Inteligente</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-semibold hover:text-primary transition-colors">Iniciar Sesión</button>
          <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-lg hover:bg-primary-hover transition-all">Crear CV Gratis</button>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 lg:px-40 py-20 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
              <span className="text-xs font-bold text-primary uppercase">Optimizado para el mercado Peruano</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight">
              Construye tu futuro con <span className="text-primary">IA Generativa</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-xl">
              Crea currículums de alto impacto que superan los filtros ATS en minutos. Analiza vacantes, mejora tu redacción y consigue más entrevistas.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                Empezar Ahora <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button className="px-8 py-4 bg-white border rounded-xl font-bold text-lg hover:bg-gray-50 flex items-center gap-2">
                Ver Plantillas <span className="material-symbols-outlined">visibility</span>
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="w-full aspect-square bg-blue-50 rounded-3xl overflow-hidden shadow-2xl rotate-3">
              <img 
                src="https://picsum.photos/800/800?grayscale&random=1" 
                alt="App Showcase" 
                className="w-full h-full object-cover mix-blend-multiply opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 px-6 lg:px-40">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { icon: 'description', title: 'Plantillas ATS', desc: 'Formatos diseñados para ser leídos correctamente por sistemas de reclutamiento.' },
                { icon: 'auto_fix', title: 'Escritura con IA', desc: 'Mejora tu perfil y logros automáticamente con sugerencias de expertos.' },
                { icon: 'content_paste_search', title: 'Análisis de Vacantes', desc: 'Adapta tu CV a una postulación específica pegando el texto del anuncio.' }
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-2xl border hover:border-primary transition-colors space-y-4">
                  <span className="material-symbols-outlined text-primary text-4xl">{f.icon}</span>
                  <h3 className="text-xl font-bold">{f.title}</h3>
                  <p className="text-gray-500">{f.desc}</p>
                </div>
              ))}
           </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
