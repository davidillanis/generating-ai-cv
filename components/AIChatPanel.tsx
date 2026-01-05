
import React, { useState } from 'react';
import { chatWithAI } from '../services/geminiService';
import { CVData } from '../types';

interface AIChatPanelProps {
  currentCV: CVData;
  onApplyImprovement?: (suggestion: string) => void;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ currentCV, onApplyImprovement }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    { role: 'ai', text: '¡Hola! Soy tu asistente de carrera. ¿En qué puedo ayudarte hoy con tu CV?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await chatWithAI(userMsg, currentCV);
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
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
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-2xl animate-pulse text-xs">Gemini está pensando...</div>
          </div>
        )}
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
          <button onClick={handleSend} className="bg-primary text-white p-2 rounded-lg hover:bg-primary-hover">
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
