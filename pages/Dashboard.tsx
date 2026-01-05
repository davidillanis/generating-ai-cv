
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CVData, CVTemplateType, FormalityLevel } from '../types';
import { parseCVDocument } from '../services/geminiService';

import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  cvs: CVData[];
  onSelect: (id: string) => void;
  onCreate: (initialData?: Partial<CVData>) => Promise<string>;
  onDelete: (id: string) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ cvs, onSelect, onCreate, onDelete }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleEdit = (id: string) => {
    onSelect(id);
    navigate('/editor');
  };

  const handleCreateNew = async () => {
    await onCreate();
    navigate('/editor');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este currículum? Esta acción no se puede deshacer.')) {
      await onDelete(id);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Leyendo archivo...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadStatus('Analizando con IA...');
        try {
          const parsedData = await parseCVDocument(base64, file.type);
          await onCreate(parsedData);
          setUploadStatus('¡Completado!');
          setTimeout(() => {
            navigate('/editor');
          }, 500);
        } catch (err) {
          console.error(err);
          setUploadStatus('Error al analizar el documento.');
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadStatus('Error al cargar el archivo.');
      setIsUploading(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="px-6 py-4 bg-white border-b flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-primary">smart_toy</span>
            <span className="font-black text-lg">CV IA PRO</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 hidden md:block">{user?.email}</span>
            <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs uppercase">
              {user?.email?.charAt(0) || 'U'}
            </div>
            <button 
              onClick={() => signOut()} 
              className="text-sm text-slate-500 hover:text-red-500 font-medium ml-2"
            >
              Salir
            </button>
          </div>
       </header>

       <main className="max-w-6xl mx-auto w-full px-6 py-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
                <h1 className="text-3xl font-black text-slate-900">Mis Currículums</h1>
                <p className="text-slate-500">Administra y optimiza tus versiones profesionales.</p>
             </div>
             <div className="flex gap-3">
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 className="hidden" 
                 accept=".pdf,.doc,.docx" 
               />
               <button 
                  disabled={isUploading}
                  onClick={triggerUpload}
                  className="bg-white border border-primary text-primary h-12 px-6 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">{isUploading ? 'sync' : 'upload_file'}</span> 
                  {isUploading ? uploadStatus : 'Importar CV (PDF)'}
               </button>
               <button 
                  disabled={isUploading}
                  onClick={handleCreateNew}
                  className="bg-primary text-white h-12 px-6 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-primary-hover transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">add</span> Nuevo CV
               </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cvs.map(cv => (
              <div 
                key={cv.id}
                className="group bg-white rounded-2xl border p-5 hover:shadow-xl transition-all cursor-pointer relative"
                onClick={() => handleEdit(cv.id)}
              >
                <div className="aspect-[210/297] bg-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                   <span className="material-symbols-outlined text-6xl text-slate-300">description</span>
                   <div className="absolute top-8 right-8 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">ATS {Math.floor(Math.random() * 20) + 75}%</div>
                </div>
                <h3 className="font-bold text-lg truncate">{cv.title}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-400">Modificado: {new Date(cv.lastModified).toLocaleDateString()}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                    <button onClick={(e) => handleDelete(e, cv.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><span className="material-symbols-outlined text-sm">delete</span></button>
                  </div>
                </div>
              </div>
            ))}
            <div 
              onClick={isUploading ? undefined : handleCreateNew}
              className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center h-[400px] text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-5xl mb-4">post_add</span>
              <span className="font-bold">Crear uno nuevo</span>
            </div>
          </div>
       </main>

       {isUploading && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-200">
               <div className="relative">
                  <div className="size-20 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
                  </div>
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-black">Analizando tu CV</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">Nuestra IA está extrayendo tu información profesional para que no tengas que escribirla manualmente.</p>
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full animate-[progress_2s_ease-in-out_infinite]" style={{width: '30%'}}></div>
               </div>
               <p className="text-primary font-bold text-xs uppercase tracking-widest">{uploadStatus}</p>
            </div>
         </div>
       )}

       <style>{`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
       `}</style>
    </div>
  );
};

export default Dashboard;
