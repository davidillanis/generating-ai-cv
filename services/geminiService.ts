
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { CVData, CVTemplateType, FormalityLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const optimizeSummary = async (summary: string, roleGoal: string, titleText: string = "resumen", numberLines: number = 4): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Optimiza este ${titleText} para un puesto de ${roleGoal} en Perú. Hazlo breve, claro y conciso (maximo ${numberLines} líneas), profesional y directo. ${titleText} original: "${summary}"`,
      config: {
        systemInstruction: `Eres un experto reclutador especializado en el mercado laboral peruano y latinoamericano con un legunaje Natural y accesible, profesional, moderademente tecnico, orientado al valor, centrado en competencias generales y un poco simple en resumen un leguaje equilibrado. Solo responde con el ${titleText} optimizado.`,
      },
    });
    return response.text || summary;
  } catch (error) {
    console.error("Gemini optimization error:", error);
    return summary;
  }
};

export const chatWithAI = async (message: string, currentCV: CVData): Promise<{ message: string, action?: any }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Use a faster/smarter model if available, or fallback
      contents: [
        { text: `CONTEXTO DEL CV ACTUAL (Referencia para IDs y datos):\n${JSON.stringify(currentCV)}\n\nUSUARIO: ${message}` }
      ],
      config: {
        systemInstruction: `Eres un asistente agente experto en CVs (CV IA PRO). Tu objetivo es ayudar al usuario a mejorar su currículum y realizar cambios directamente si te lo piden.
        
        MODOS DE RESPUESTA:
        1. Si el usuario pide AGREGAR, EDITAR o ELIMINAR información (ej: "Agrega inglés avanzado", "Borra el proyecto X", "Cambia mi teléfono a 999..."), DEBES devolver un JSON estrictamente con este formato:
        {
          "message": "Texto confirmando la acción...",
          "action": {
             "type": "create" | "update" | "delete",
             "section": "personal" | "experience" | "education" | "skills" | "languages" | "certifications" | "projects",
             "data": { ... objeto con los datos a insertar/actualizar ... },
             "id": "string" (ID del elemento a editar/borrar. Búscalo en el Contexto del CV. Para 'create' ignora esto o usa null)
          }
        }

        2. Para consultas generales, consejos o saludos, responde solo con TEXTO plano (sin JSON), usando formato Markdown amable y profesional.
        
        REGLAS PARA ACCIONES:
        - Para 'create': 'data' debe tener los campos del tipo correspondiente (ej: { name: 'Inglés', level: 'Avanzado' }). Genera ID temporal si es necesario o deja que el frontend lo haga.
        - Para 'update': Debes encontrar el ID correcto en el JSON del CV provisto. Si no estás seguro, pregunta antes de actuar.
        - Para 'delete': Solo necesitas el ID y el tipo de sección.
        - Para 'personal': Sección única. type='update', section='personal', data={campo: valor}.

        IMPORTANTE: Si respondes con JSON, NO uses bloques de código (\`\`\`json), envía el JSON puro.`,
      },
    });

    let text = response.text || '';

    // Limpiar bloques de código markdown si existen (ej: ```json ... ```)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    }

    // Intentar encontrar el objeto JSON principal
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');

    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      const jsonCandidate = text.substring(firstOpen, lastClose + 1);
      try {
        const parsed = JSON.parse(jsonCandidate);
        // Validar que tenga la estructura mínima esperada
        if (parsed.message || parsed.action) {
          return { message: parsed.message || "Acción realizada", action: parsed.action };
        }
      } catch (e) {
        console.warn("Error parsing extracted JSON:", e);
      }
    }

    return { message: text };

  } catch (error) {
    console.error("Gemini chat error:", error);
    return { message: "Ocurrió un error al conectar con el asistente inteligente." };
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

export const generateCVFromPrompt = async (prompt: string): Promise<Partial<CVData>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          text: `Genera un currículum completo en formato JSON basado en la siguiente descripción del usuario: "${prompt}".
        
        Si faltan datos específicos en la descripción, INFIERE información realista y profesional coherente con el perfil descrito para completar TODOS los campos (experiencia, educación, habilidades, etc) no te inventes cosas. El objetivo es tener un CV base listo para editar.` }
      ],
      config: {
        responseMimeType: "application/json",
        systemInstruction: `Eres un experto redactor de CVs. Tu tarea es generar una estructura JSON de currículum rica y detallada basada en una descripción breve.
        
        REGLAS:
        1. INVENTA/RELLENA datos realistas si no se proporcionan explícitamente (fechas, nombres de empresas genéricos si es necesario, descripciones de tareas detalladas, títulos universitarios típicos para el rol).
        2. Usa el idioma español por defecto.
        
        ESTRUCTURA JSON OBLIGATORIA (Sigue estrictamente este esquema):
        {
          "personal": {
            "firstName": "string",
            "lastName": "string",
            "email": "string",
            "phone": "string",
            "city": "string",
            "country": "string",
            "profileSummary": "string (Un resumen profesional impactante de 3-4 líneas)"
          },
          "experience": [
             {
               "id": "string (timestamp único)",
               "role": "string",
               "company": "string",
               "location": "string",
               "startDate": "string (YYYY-MM)",
               "endDate": "string (YYYY-MM o 'Presente')",
               "current": boolean,
               "description": "string (bullets points o párrafos detallados de logros)"
             }
          ],
          "education": [
             {
               "id": "string",
               "degree": "string",
               "institution": "string",
               "location": "string",
               "startDate": "string",
               "endDate": "string"
             }
          ],
          "skills": [
             { "id": "string", "name": "string", "type": "Technical" | "Soft" }
          ],
          "languages": [
             { "id": "string", "name": "string", "level": "Básico" | "Intermedio" | "Avanzado" | "Nativo" }
          ],
          "certifications": [
             { "id": "string", "name": "string", "issuer": "string", "date": "string" }
          ],
          "projects": [
             { "id": "string", "name": "string", "description": "string", "link": "string" }
          ]
        }`,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (error) {
    console.error("Error generating CV from prompt:", error);
    throw error;
  }
}
