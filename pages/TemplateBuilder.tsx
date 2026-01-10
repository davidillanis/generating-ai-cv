import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TemplateConfig, CVTemplateType, CVData, FormalityLevel } from '../types';
import CVPreview from '../components/CVPreview';

// Rich dummy data for visualization
const DUMMY_PREVIEW_DATA: CVData = {
    id: 'preview',
    title: 'Preview',
    lastModified: new Date().toISOString(),
    templateType: CVTemplateType.CUSTOM,
    formality: FormalityLevel.PROFESSIONAL,
    language: 'es',
    personal: {
        firstName: 'Alex',
        lastName: 'Dev',
        email: 'alex.dev@example.com',
        phone: '+51 987 654 321',
        city: 'Lima',
        country: 'Perú',
        linkedin: 'linkedin.com/in/alexdev',
        website: 'alexdev.io',
        profileSummary: 'Desarrollador Full Stack apasionado por construir experiencias web increíbles. Especialista en React y Node.js.'
    },
    experience: [
        { id: '1', role: 'Senior Developer', company: 'Tech Corp', location: 'Lima', startDate: '2020-01', endDate: 'Present', current: true, description: 'Liderazgo de equipo y desarrollo de arquitecturas escalables.' },
        { id: '2', role: 'Frontend Dev', company: 'StartUp Inc', location: 'Remote', startDate: '2018-03', endDate: '2019-12', current: false, description: 'Desarrollo de interfaces reactivas con Vue.js.' }
    ],
    education: [
        { id: '1', degree: 'Ingeniería de Software', institution: 'Universidad Tech', location: 'Lima', startDate: '2014', endDate: '2019' }
    ],
    skills: [
        { id: '1', name: 'React', type: 'Technical' },
        { id: '2', name: 'TypeScript', type: 'Technical' },
        { id: '3', name: 'Liderazgo', type: 'Soft' }
    ],
    languages: [
        { id: '1', name: 'Español', level: 'Nativo' },
        { id: '2', name: 'Inglés', level: 'Avanzado' }
    ],
    certifications: [],
    projects: []
};

const TemplateBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    const cloneId = searchParams.get('cloneId');
    const { user } = useAuth();
    const [name, setName] = useState('Mi Plantilla Personalizada');
    const [isPublic, setIsPublic] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Default initial config
    const [config, setConfig] = useState<TemplateConfig>({
        id: crypto.randomUUID(),
        name: 'Custom',
        author: user?.email || 'User',
        isPublic: false,
        styles: {
            primaryColor: '#6366f1',
            backgroundColor: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            bodyColor: '#334155',
            titleColor: '#0f172a'
        },
        layout: {
            type: 'sidebar-left',
            sidebarWidth: '30%',
            sidebarSections: ['personal', 'skills', 'languages', 'certifications'],
            mainSections: ['profile', 'experience', 'education', 'projects']
        }
    });

    useEffect(() => {
        if ((!editId && !cloneId) || !user) return;

        const targetId = editId || cloneId;

        const loadTemplate = async () => {
            const { data, error } = await supabase
                .from('cv_templates')
                .select('*')
                .eq('id', targetId)
                .single();

            if (error) {
                console.error('Error loading template', error);
                return;
            }

            if (data) {
                if (editId) {
                    // Edit Mode
                    setName(data.name);
                    setIsPublic(data.is_public);
                    setConfig({
                        ...data.config,
                        id: data.id
                    });
                } else {
                    // Clone Mode
                    setName(`Copia de ${data.name}`);
                    setIsPublic(false); // Default to private for clones
                    setConfig({
                        ...data.config,
                        id: crypto.randomUUID(), // New ID for the clone
                        name: `Copia de ${data.name}`,
                        author: user.email,
                        isPublic: false
                    });
                }
            }
        };
        loadTemplate();
    }, [editId, cloneId, user]);

    const handleStyleChange = (key: keyof TemplateConfig['styles'], value: string) => {
        setConfig(prev => ({
            ...prev,
            styles: { ...prev.styles, [key]: value }
        }));
    };

    const handleLayoutTypeChange = (type: TemplateConfig['layout']['type']) => {
        // When switching to single column, move everything to main
        if (type === 'single') {
            setConfig(prev => ({
                ...prev,
                layout: {
                    ...prev.layout,
                    type,
                    mainSections: [...prev.layout.sidebarSections, ...prev.layout.mainSections],
                    sidebarSections: []
                }
            }));
        } else {
            // Basic reset for simplicity when switching back to columns
            setConfig(prev => ({
                ...prev,
                layout: {
                    ...prev.layout,
                    type
                }
            }));
        }
    };

    // Simple drag/drop logic simulation (moving items between lists)
    const moveSection = (sectionId: string, from: 'sidebar' | 'main', to: 'sidebar' | 'main') => {
        setConfig(prev => {
            const newSidebar = [...prev.layout.sidebarSections];
            const newMain = [...prev.layout.mainSections];

            if (from === 'sidebar') {
                const idx = newSidebar.indexOf(sectionId);
                if (idx > -1) newSidebar.splice(idx, 1);
            } else {
                const idx = newMain.indexOf(sectionId);
                if (idx > -1) newMain.splice(idx, 1);
            }

            if (to === 'sidebar') {
                newSidebar.push(sectionId);
            } else {
                newMain.push(sectionId);
            }

            return {
                ...prev,
                layout: {
                    ...prev.layout,
                    sidebarSections: newSidebar,
                    mainSections: newMain
                }
            };
        });
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const templateData = {
                name: name,
                author: user.email, // Or specific profile name
                author_id: user.id,
                is_public: isPublic,
                config: {
                    ...config,
                    name: name,
                    isPublic: isPublic,
                    // Ensure ID is preserved or set
                    id: editId || config.id
                }
            };

            let error;
            if (editId) {
                // Update existing
                const result = await supabase
                    .from('cv_templates')
                    .update(templateData)
                    .eq('id', editId);
                error = result.error;
            } else {
                // Create new
                const result = await supabase
                    .from('cv_templates')
                    .insert(templateData);
                error = result.error;
            }

            if (error) throw error;
            alert('¡Plantilla guardada con éxito!');
            navigate('/templates');
        } catch (err) {
            console.error(err);
            alert('Error al guardar la plantilla');
        } finally {
            setIsSaving(false);
        }
    };

    // Prepare preview data with the config
    const previewData = { ...DUMMY_PREVIEW_DATA, customTemplate: config };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/templates')} className="text-slate-500 hover:text-slate-700">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <input
                        className="font-black text-xl bg-transparent border-none focus:ring-0 placeholder-slate-300"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre de tu Plantilla"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded text-primary" />
                        Público (Compartir)
                    </label>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Controls Sidebar */}
                <aside className="w-80 bg-white border-r overflow-y-auto p-6 space-y-8 shadow-lg z-10">
                    <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Estructura</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleLayoutTypeChange('single')}
                                className={`flex-1 p-2 border rounded-lg text-xs font-bold ${config.layout.type === 'single' ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-slate-50'}`}
                            >
                                Columna Única
                            </button>
                            <button
                                onClick={() => handleLayoutTypeChange('sidebar-left')}
                                className={`flex-1 p-2 border rounded-lg text-xs font-bold ${config.layout.type === 'sidebar-left' ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-slate-50'}`}
                            >
                                Sidebar Izq
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Estilos Globales</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Color Principal</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={config.styles.primaryColor}
                                        onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                                        className="h-8 w-12 rounded cursor-pointer border-0 p-0"
                                    />
                                    <span className="text-xs text-slate-500 font-mono">{config.styles.primaryColor}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Color de Fondo</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={config.styles.backgroundColor}
                                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                        className="h-8 w-12 rounded cursor-pointer border-0 p-0"
                                    />
                                    <span className="text-xs text-slate-500 font-mono">{config.styles.backgroundColor}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Tipografía</label>
                                <select
                                    value={config.styles.fontFamily}
                                    onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                                    className="w-full text-xs rounded-lg border-slate-200"
                                >
                                    <option value="Inter, sans-serif">Modern (Inter)</option>
                                    <option value="Merriweather, serif">Classic (Merriweather)</option>
                                    <option value="'Courier New', monospace">Technical (Mono)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Distribución</h3>

                        {(config.layout.type === 'sidebar-left' || config.layout.type === 'sidebar-right') && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-primary mb-2">Barra Lateral</h4>
                                <div className="space-y-2 min-h-[50px] bg-slate-50 p-2 rounded-lg dashed-border">
                                    {config.layout.sidebarSections.map(sid => (
                                        <div key={sid} className="bg-white p-2 rounded shadow-sm text-xs font-bold flex justify-between items-center cursor-move border border-slate-200">
                                            {sid.toUpperCase()}
                                            <button onClick={() => moveSection(sid, 'sidebar', 'main')} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
                                        </div>
                                    ))}
                                    {config.layout.sidebarSections.length === 0 && <p className="text-[10px] text-slate-400 text-center py-2">Arrastra items aquí (click flecha)</p>}
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="text-xs font-bold text-slate-700 mb-2">Contenido Principal</h4>
                            <div className="space-y-2 bg-slate-50 p-2 rounded-lg dashed-border">
                                {config.layout.mainSections.map(mid => (
                                    <div key={mid} className="bg-white p-2 rounded shadow-sm text-xs font-bold flex justify-between items-center cursor-move border border-slate-200">
                                        {(config.layout.type !== 'single') && (
                                            <button onClick={() => moveSection(mid, 'main', 'sidebar')} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[16px]">arrow_back</span></button>
                                        )}
                                        {mid.toUpperCase()}
                                        {/* Placeholder for real reorder */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Preview Area */}
                <main className="flex-1 bg-slate-200 p-8 flex justify-center items-start overflow-y-auto">
                    <div className="scale-[0.85] origin-top shadow-2xl">
                        <CVPreview data={previewData} scale={1} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TemplateBuilder;
