
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { CVData, CVTemplateType, FormalityLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const optimizeSummary = async (summary: string, roleGoal: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Optimiza este resumen profesional para un puesto de ${roleGoal} en Perú. Hazlo conciso (máximo 4 líneas), profesional y directo. Resumen original: "${summary}"`,
      config: {
        systemInstruction: "Eres un experto reclutador especializado en el mercado laboral peruano y latinoamericano.",
      },
    });
    return response.text || summary;
  } catch (error) {
    console.error("Gemini optimization error:", error);
    return summary;
  }
};

export const chatWithAI = async (message: string, currentCV: CVData): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        { text: `CV ACTUAL:\n${JSON.stringify(currentCV, null, 2)}\n\nUSUARIO: ${message}` }
      ],
      config: {
        systemInstruction: `Eres un experto en redacción de CVs. Responde en español peruano profesional.

FORMATO DE RESPUESTA:
- Usa **negritas** para conceptos clave
- Separa ideas con saltos de línea dobles
- Si sugieres múltiples puntos, usa listas con guiones (-)
- Sé breve, claro y conciso

Ejemplo:
Para mejorar tu perfil profesional:

- Añade logros cuantificables (ej: "Aumenté ventas 30%")
- Especifica tecnologías dominadas
- Usa verbos de acción al inicio

¿Quieres que te ayude con alguna sección específica?`,
      },
    });
    return response.text || "No pude procesar tu solicitud.";
  } catch (error) {
    console.error("Error:", error);
    return "Error al conectar con el asistente.";
  }
};

export const analyzeJobDescription = async (jobDesc: string, cv: CVData): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza esta descripción de puesto y compárala con el CV del usuario. Sugiere 3 cambios específicos para mejorar el emparejamiento (matching). CV: ${JSON.stringify(cv.experience)}. Puesto: ${jobDesc}`,
    });
    return response.text || "No se detectaron mejoras inmediatas.";
  } catch (error) {
    return "Error al analizar la vacante.";
  }
}

export const parseCVDocument = async (base64Data: string, mimeType: string): Promise<Partial<CVData>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        { text: "Extrae toda la información de este currículum y devuélvela estrictamente en formato JSON siguiendo la estructura de CVData. Si falta información, deja los campos vacíos o arreglos vacíos. El idioma de salida debe ser el del documento original (preferiblemente español)." }
      ],
      config: {
        responseMimeType: "application/json",
        systemInstruction: `Eres un asistente experto en extracción de datos de currículums (CV parsing).
        Tu TAREA es extraer toda la información relevante de la imagen o documento del CV proporcionado y estructurarla estrictamente en el siguiente formato JSON.
        NO inventes datos. Si un campo no existe en el CV, déjalo como string vacío "" o array vacío [].
        
        ESTRUCTURA JSON OBLIGATORIA:
        {
          "personal": {
            "firstName": "string (Nombres)",
            "lastName": "string (Apellidos)",
            "email": "string",
            "phone": "string",
            "city": "string",
            "country": "string",
            "linkedin": "string (URL completa si existe)",
            "website": "string",
            "profileSummary": "string (Resumen o Perfil profesional completo)"
          },
          "experience": [
             {
               "id": "string (generar un timestamp único p.ej 'exp-1')",
               "role": "string (Cargo/Puesto)",
               "company": "string (Empresa)",
               "location": "string (Ciudad/País)",
               "startDate": "string (YYYY-MM)",
               "endDate": "string (YYYY-MM o 'Presente')",
               "current": boolean (true si es el trabajo actual),
               "description": "string (Descripción de responsabilidades y logros)",
               "achievements": ["string", "string"]
             }
          ],
          "education": [
             {
               "id": "string (generar timestamp único p.ej 'edu-1')",
               "degree": "string (Título/Grado)",
               "institution": "string (Universidad/Instituto)",
               "location": "string",
               "startDate": "string (YYYY-MM)",
               "endDate": "string (YYYY-MM)",
               "description": "string"
             }
          ],
          "skills": [
             {
               "id": "string (generar id único)",
               "name": "string (Nombre de la habilidad)",
               "type": "Technical" (O 'Soft', inferir según contexto)
             }
          ],
          "languages": [
             {
               "id": "string (generar id único)",
               "name": "string (Idioma)",
               "level": "Básico" (O 'Intermedio', 'Avanzado', 'Nativo')
             }
          ],
          "certifications": [
             {
               "id": "string (generar id único)",
               "name": "string (Nombre certificación)",
               "issuer": "string (Entidad emisora)",
               "date": "string (Año o fecha)"
             }
          ],
          "projects": [
             {
               "id": "string (generar id único)",
               "name": "string",
               "description": "string",
               "link": "string"
             }
          ]
        }
        
        IMPORTANTE: Devuelve SOLAMENTE el objeto JSON. No incluyas bloques de código markdown (\`\`\`json).`,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (error) {
    console.error("Error parsing CV document:", error);
    throw error;
  }
}
