import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { 
  FaUser, 
  FaRobot, 
  FaPaperPlane, 
  FaRegLightbulb, 
  FaRedoAlt, 
  FaHeartbeat 
} from 'react-icons/fa';

const Assistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello, I am your **Cardiocare AI Clinical Assistant**. I can assist you with interpreting clinical values, looking up AHA/ESC cardiology guidelines, defining vital thresholds, or analyzing resting ECG parameters. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Quick prompt templates
  const quickPrompts = [
    "Explain resting ECG Left Ventricular Hypertrophy (LVH).",
    "What are the 2017 AHA Blood Pressure classification thresholds?",
    "Statins guidelines for patients age 40-75 with high risk.",
    "Calculate target heart rate zone for a 60-year-old."
  ];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    if (!textToSend) setInput('');

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await api.post('/chat', {
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
      });

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.reply
        }
      ]);
    } catch (err) {
      console.error('Failed to get chat response:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: '⚠️ **System Error**: Unable to contact the clinical AI assistant. Check your backend server and Gemini API keys.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: 'Conversation reset. I am ready for your next cardiology diagnostic or guidelines question.'
      }
    ]);
  };

  // Convert markdown-style bold (**text**) and lists into styled HTML safely
  const formatMessage = (txt) => {
    return txt.split('\n').map((line, idx) => {
      // Bold formatting
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // List formatting
      if (formatted.trim().startsWith('- ')) {
        return <li key={idx} className="ml-4 list-disc mt-1" dangerouslySetInnerHTML={{ __html: formatted.replace('- ', '') }} />;
      }
      return <p key={idx} className="min-h-[1em]" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col space-y-4">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FaRobot className="text-medical-500" />
            AI Clinical Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Consult the integrated Google Gemini AI engine regarding cardiac guidelines and ECG details.
          </p>
        </div>

        <button
          onClick={handleResetChat}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer text-xs font-bold"
        >
          <FaRedoAlt className="h-3 w-3" />
          Reset Chat
        </button>
      </div>

      {/* Chat Area Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Left column: Quick prompts */}
        <div className="md:col-span-1 hidden md:flex flex-col gap-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <FaRegLightbulb className="text-amber-500" />
            Quick Guidelines Help
          </span>
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(prompt)}
              className="text-left p-3 rounded-xl border border-slate-150 bg-white/50 text-[11px] text-slate-700 hover:border-medical-500 hover:bg-medical-50/20 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300 dark:hover:border-medical-900 dark:hover:bg-medical-950/20 transition cursor-pointer font-semibold leading-relaxed"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Right column: Main Messaging window */}
        <div className="md:col-span-3 flex flex-col bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-medical-500 to-sky-500 flex items-center justify-center text-white">
              <FaHeartbeat className="h-4.5 w-4.5 animate-pulse-heart" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-150">Gemini Cardiologist Copilot</span>
              <span className="block text-[9px] text-emerald-500 font-bold uppercase">Clinical Advisor Active</span>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                  {/* Bubble Avatar */}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isUser ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {isUser ? <FaUser className="h-3 w-3" /> : <FaRobot className="h-3.5 w-3.5" />}
                  </div>

                  {/* Bubble Content */}
                  <div className={`p-3.5 rounded-2xl leading-relaxed space-y-1.5 shadow-sm ${isUser ? 'bg-gradient-to-br from-medical-500 to-sky-600 text-white rounded-tr-none' : 'bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100/50 dark:border-slate-800/40'}`}>
                    {formatMessage(msg.content)}
                  </div>
                </div>
              );
            })}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center animate-pulse">
                  <FaRobot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 text-slate-400 p-3.5 rounded-2xl rounded-tl-none border border-slate-100/50 dark:border-slate-800/40 flex items-center gap-1.5 shadow-sm">
                  <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="text-[10px] ml-1 select-none font-semibold">Gemini is writing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Mobile Quick Prompts */}
          <div className="md:hidden px-3 pt-2 pb-0.5 flex flex-col gap-1 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <FaRegLightbulb className="text-amber-500" />
              Quick Suggestions
            </span>
            <div className="flex overflow-x-auto gap-2 pb-1 whitespace-nowrap scrollbar-none">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] text-slate-700 hover:border-medical-500 hover:bg-medical-50/20 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-350 dark:hover:border-medical-900 dark:hover:bg-medical-950/20 transition cursor-pointer font-semibold shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Form Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask about vitals thresholds, statins, restecg codes..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-750 dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-medical-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded-xl bg-medical-500 hover:bg-medical-600 text-white font-bold transition disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              <FaPaperPlane className="h-3 w-3" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};

export default Assistant;
