
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import { supabase } from './services/supabase';
import { CVData, CVTemplateType, FormalityLevel } from './types';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Templates from './pages/Templates';
import Login from './pages/Login';

// Mock Initial Data conforme a estándares de Perú (Failsafe fallback)
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

// Main App Component with State & Auth Logic
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [cvs, setCvs] = useState<CVData[]>([]);
  const [activeCVId, setActiveCVId] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load CVs from Supabase when user is authenticated
  useEffect(() => {
    if (!user) {
      setCvs([]);
      return;
    }

    const loadCVs = async () => {
      try {
        const { data, error } = await supabase
          .from('cvs')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const parsedCvs = data.map(row => ({
            ...row.content,
            id: row.id, // Use DB UUID
            title: row.title, // Sync title from column
            lastModified: row.updated_at
          }));
          setCvs(parsedCvs);
          setActiveCVId(parsedCvs[0].id);
        } else {
             // No CVs found, don't create default yet, let user create one in Dashboard
             setCvs([]);
        }
      } catch (err) {
        console.error('Error loading CVs:', err);
      } finally {
        setDataLoaded(true);
      }
    };

    loadCVs();
  }, [user]);

  const activeCV = cvs.find(c => c.id === activeCVId) || (cvs[0] ?? { ...INITIAL_CV_SKELETON, id: 'temp' });

  const updateActiveCV = async (newData: CVData) => {
    // 1. Optimistic Update
    setCvs(prev => prev.map(c => c.id === newData.id ? { ...newData, lastModified: new Date().toISOString() } : c));
    
    // 2. Persist to Supabase
    if (user && newData.id && newData.id !== 'temp') {
      try {
        const { error } = await supabase
          .from('cvs')
          .update({
            title: newData.title,
            content: newData,
            updated_at: new Date().toISOString()
          })
          .eq('id', newData.id);
          
        if (error) throw error;
      } catch (err) {
        console.error('Error saving CV:', err);
        // Could revert state here
      }
    }
  };

  const createNewCV = async (initialData?: Partial<CVData>) => {
    if (!user) return '';

    const timestamp = new Date().toISOString();
    const tempId = crypto.randomUUID(); // Temporary ID

    const newCVContent: CVData = { 
        ...INITIAL_CV_SKELETON, 
        ...initialData,
        id: tempId,
        title: initialData?.title || 'Nuevo Currículum',
        lastModified: timestamp,
        personal: {
            ...INITIAL_CV_SKELETON.personal,
            ...(initialData?.personal || {})
        }
    };

    try {
        const { data, error } = await supabase
            .from('cvs')
            .insert({
                user_id: user.id,
                title: newCVContent.title,
                content: newCVContent,
                updated_at: timestamp
            })
            .select()
            .single();

        if (error) throw error;
        if (data) {
            const finalCV = { ...newCVContent, id: data.id };
            setCvs(prev => [finalCV, ...prev]);
            setActiveCVId(data.id);
            return data.id;
        }
    } catch (err) {
        console.error('Error creating CV:', err);
        alert('Error al crear el CV');
    }
    return '';
  };

  const deleteCV = async (id: string) => {
    if (!user) return;
    
    // Optimistic update
    const previousCvs = [...cvs];
    setCvs(prev => prev.filter(c => c.id !== id));

    try {
      const { error } = await supabase
        .from('cvs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // If the deleted CV was active, switch to another one
      if (activeCVId === id) {
        const remaining = cvs.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setActiveCVId(remaining[0].id);
        } else {
          setActiveCVId('');
        }
      }
    } catch (err) {
      console.error('Error deleting CV:', err);
      // Revert state on error
      setCvs(previousCvs);
      alert('Error al eliminar el CV');
    }
  };

  if (loading) return null; // Or loading spinner

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      
      <Route 
        path="/dashboard" 
        element={
          <RequireAuth>
            <Dashboard cvs={cvs} onSelect={setActiveCVId} onCreate={createNewCV} onDelete={deleteCV} />
          </RequireAuth>
        } 
      />
      <Route 
        path="/editor" 
        element={
          <RequireAuth>
            <Editor data={activeCV} onUpdate={updateActiveCV} />
          </RequireAuth>
        } 
      />
      <Route 
        path="/templates" 
        element={
          <RequireAuth>
            <Templates data={activeCV} onUpdate={updateActiveCV} />
          </RequireAuth>
        } 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
