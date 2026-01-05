
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
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        { text: `CONTEXTO DEL CV ACTUAL:\n${JSON.stringify(currentCV)}\n\nUSUARIO: ${message}` }
      ],
      config: {
        systemInstruction: "Eres un asistente experto en redacción de CVs. Tu objetivo es ayudar al usuario a mejorar su currículum, sugerir secciones, corregir gramática y adaptar el tono. Habla siempre en español peruano profesional.",
      },
    });
    return response.text || "Lo siento, no pude procesar tu solicitud.";
  } catch (error) {
    console.error("Gemini chat error:", error);
    return "Ocurrió un error al conectar con el asistente inteligente.";
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
        systemInstruction: "Eres un extractor de datos de CV profesional. Debes identificar Nombre, Apellidos, Email, Teléfono, Ciudad, País, Resumen, Experiencia (Cargo, Empresa, Fechas, Descripción), Educación, Habilidades, Idiomas y Certificaciones. Devuelve un JSON puro.",
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (error) {
    console.error("Error parsing CV document:", error);
    throw error;
  }
}
