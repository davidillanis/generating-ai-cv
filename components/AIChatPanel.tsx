import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/geminiService';
import { CVData, AIAction } from '../types';

interface AIChatPanelProps {
  currentCV: CVData;
  onApplyImprovement?: (suggestion: string) => void;
  onAction?: (action: AIAction) => void;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ currentCV, onApplyImprovement, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: '¡Hola! Soy tu asistente de carrera. ¿En qué puedo ayudarte hoy con tu CV?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);


  useEffect(() => {
    // Inicializar reconocimiento de voz
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Cambiado a false
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setInput(prev => prev + finalTranscript + ' ');
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Error de reconocimiento:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Dependencias vacías

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);
        setIsListening(false);
      }
    }
  };


  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await chatWithAI(userMsg, currentCV);
    setMessages(prev => [...prev, { role: 'ai', text: response.message }]);

    if (response.action && onAction) {
      console.log("Acción del agente:", response.action);
      onAction(response.action);
    }

    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 size-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <span className="material-symbols-outlined text-3xl">smart_toy</span>
      </button>
    );
  }

  const formatMessage = (text: string) => {
    const paragraphs = text.split('\n\n');
    return paragraphs.map((p, i) => {
      if (p.includes('\n-') || p.includes('\n•')) {
        const items = p.split('\n').filter(line => line.trim());
        const title = items[0].match(/^[^-•]/) ? items.shift() : null;

        return (
          <div key={i} className="mb-3">
            {title && <p className="font-semibold mb-1">{title}</p>}
            <ul className="list-disc list-inside space-y-1 ml-2">
              {items.map((item, j) => (
                <li key={j} className="text-sm">{item.replace(/^[-•]\s*/, '')}</li>
              ))}
            </ul>
          </div>
        );
      }
      const withBold = p.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      return <p key={i} className="mb-2">{withBold}</p>;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white border rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-5">
      <div className="p-4 border-b bg-primary text-white rounded-t-2xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined">auto_awesome</span>
          <span className="font-bold">Asistente IA</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:opacity-75">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user'
              ? 'bg-primary text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}>
              {m.role === 'ai' ? formatMessage(m.text) : m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-2xl animate-pulse text-xs">Gemini está pensando...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pide un cambio o consejo..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
          />
          <button
            onClick={toggleVoiceInput}
            className={`p-2 rounded-lg transition-colors ${isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            title={isListening ? 'Detener grabación' : 'Hablar'}
          >
            <span className="material-symbols-outlined">
              {isListening ? 'mic' : 'mic_none'}
            </span>
          </button>
          <button onClick={handleSend} className="bg-primary text-white p-2 rounded-lg hover:bg-primary-hover">
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;