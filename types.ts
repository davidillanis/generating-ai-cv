
export enum CVTemplateType {
  ATS = 'ATS',
  MODERN = 'MODERN',
  CLASSIC = 'CLASSIC',
  HARVARD = 'HARVARD'
}

export enum FormalityLevel {
  VERY_FORMAL = 'VERY_FORMAL',
  PROFESSIONAL = 'PROFESSIONAL',
  CREATIVE = 'CREATIVE'
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements?: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  type: 'Technical' | 'Soft';
}

export interface Language {
  id: string;
  name: string;
  level: 'Básico' | 'Intermedio' | 'Avanzado' | 'Nativo';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link?: string;
}

export interface PersonalData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedin: string;
  website: string;
  profileSummary: string;
}

export interface CVData {
  id: string;
  title: string;
  lastModified: string;
  templateType: CVTemplateType;
  formality: FormalityLevel;
  language: string;
  personal: PersonalData;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
  projects: Project[];
}

export interface AIAction {
  type: 'create' | 'update' | 'delete';
  section: 'personal' | 'experience' | 'education' | 'skills' | 'languages' | 'certifications' | 'projects';
  data?: any; // Para create/update
  id?: string; // Para update/delete
}

export interface AIActionResponse {
  message: string;
  action?: AIAction;
}
