
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CVData, CVTemplateType, FormalityLevel } from './types';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Templates from './pages/Templates';

// Mock Initial Data conforme a estándares de Perú
const INITIAL_CV_SKELETON: CVData = {
  id: '',
  title: '',
  lastModified: '',
  templateType: CVTemplateType.ATS,
  formality: FormalityLevel.PROFESSIONAL,
  language: 'Español (Perú)',
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    linkedin: '',
    website: '',
    profileSummary: ''
  },
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: []
};

const INITIAL_CV: CVData = {
  ...INITIAL_CV_SKELETON,
  id: '1',
  title: 'Mi CV Profesional',
  lastModified: new Date().toISOString(),
  personal: {
    firstName: 'Juan',
    lastName: 'Pérez García',
    email: 'juan.perez@email.com',
    phone: '+51 987 654 321',
    city: 'Lima',
    country: 'Perú',
    linkedin: 'linkedin.com/in/juanperez',
    website: 'juanperez.dev',
    profileSummary: 'Ingeniero de Sistemas con más de 6 años de experiencia en desarrollo de software escalable. Especialista en arquitecturas cloud (AWS/GCP) y liderazgo de equipos técnicos bajo metodologías ágiles. Enfocado en resultados y optimización de procesos críticos de negocio.'
  },
  experience: [
    {
      id: 'e1',
      role: 'Senior Software Engineer',
      company: 'Banco de Crédito del Perú (BCP)',
      location: 'Lima, Perú',
      startDate: '2021-01',
      endDate: '',
      current: true,
      description: '• Lideré el desarrollo de la nueva plataforma de banca móvil, impactando a más de 2 millones de usuarios.\n• Optimicé los tiempos de respuesta de la API en un 35% mediante el uso de Redis.\n• Implementé pipelines de CI/CD reduciendo los errores en despliegue en un 20%.'
    }
  ],
  education: [
    {
      id: 'ed1',
      degree: 'Ingeniería de Sistemas',
      institution: 'Pontificia Universidad Católica del Perú (PUCP)',
      location: 'Lima, Perú',
      startDate: '2014-03',
      endDate: '2019-12'
    }
  ],
  skills: [
    { id: 's1', name: 'React & Redux', type: 'Technical' },
    { id: 's2', name: 'Node.js / Express', type: 'Technical' },
    { id: 's3', name: 'AWS (S3, Lambda, EC2)', type: 'Technical' },
    { id: 's4', name: 'Gestión de Equipos', type: 'Soft' },
    { id: 's5', name: 'Pensamiento Analítico', type: 'Soft' },
    { id: 's6', name: 'Comunicación Asertiva', type: 'Soft' }
  ],
  languages: [
    { id: 'l1', name: 'Español', level: 'Nativo' },
    { id: 'l2', name: 'Inglés', level: 'Avanzado' }
  ],
  certifications: [
    { id: 'c1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', date: '2022' }
  ],
  projects: []
};

const App: React.FC = () => {
  const [cvs, setCvs] = useState<CVData[]>([INITIAL_CV]);
  const [activeCVId, setActiveCVId] = useState<string>(INITIAL_CV.id);

  const activeCV = cvs.find(c => c.id === activeCVId) || INITIAL_CV;

  const updateActiveCV = (newData: CVData) => {
    setCvs(prev => prev.map(c => c.id === newData.id ? { ...newData, lastModified: new Date().toISOString() } : c));
  };

  const createNewCV = (initialData?: Partial<CVData>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    
    // Deep merge or structure assignment for parsed data
    const newCV: CVData = { 
      ...INITIAL_CV_SKELETON, 
      ...initialData,
      id: newId, 
      title: initialData?.title || 'Nuevo Currículum', 
      lastModified: new Date().toISOString(),
      personal: {
        ...INITIAL_CV_SKELETON.personal,
        ...(initialData?.personal || {})
      },
      experience: initialData?.experience || [],
      education: initialData?.education || [],
      skills: initialData?.skills || [],
      languages: initialData?.languages || [],
      certifications: initialData?.certifications || [],
      projects: initialData?.projects || []
    };
    
    setCvs(prev => [...prev, newCV]);
    setActiveCVId(newId);
    return newId;
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/dashboard" 
          element={<Dashboard cvs={cvs} onSelect={setActiveCVId} onCreate={createNewCV} />} 
        />
        <Route 
          path="/editor" 
          element={<Editor data={activeCV} onUpdate={updateActiveCV} />} 
        />
        <Route 
          path="/templates" 
          element={<Templates data={activeCV} onUpdate={updateActiveCV} />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
