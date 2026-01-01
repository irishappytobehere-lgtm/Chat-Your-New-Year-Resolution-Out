import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageRole } from '../types';
import { sendMessage } from '../services/gemini';

interface ChatInterfaceProps {
  onResolutionAdded: (resolution: any) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onResolutionAdded }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      text: "Hello! I'm Resolv. I'm here to help you craft your New Year's resolutions. Before we look forward, how are you feeling about the past year?",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToolCall = async (toolCall: any) => {
    if (toolCall.name === 'saveResolution') {
      const { title, category, motivation, firstStep } = toolCall.args;
      const newRes = {
        id: Date.now().toString(),
        title,
        category,
        motivation,
        firstStep,
        createdAt: Date.now()
      };
      
      onResolutionAdded(newRes);
      return "Resolution saved successfully to the board.";
    }
    return "Unknown tool";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessage(userMsg.text, handleToolCall);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: responseText || "I've noted that down."
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: "I'm having trouble connecting right now. Please try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900/80 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-gold-500 animate-pulse" />
        <h2 className="font-serif text-xl text-slate-100 tracking-wide">Coach Resolv</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm text-sm sm:text-base leading-relaxed ${
                msg.role === MessageRole.USER
                  ? 'bg-slate-700 text-slate-100 rounded-tr-none'
                  : 'bg-indigo-900/40 text-slate-200 border border-indigo-500/30 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-indigo-900/20 p-4 rounded-2xl rounded-tl-none border border-indigo-500/20">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-700">
        <div className="relative flex items-end gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 focus-within:border-gold-500/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your thoughts here..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 p-2 max-h-32 min-h-[44px] resize-none focus:outline-none text-sm sm:text-base scrollbar-hide"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-lg flex-shrink-0 transition-all duration-200 ${
              input.trim() && !isLoading
                ? 'bg-gold-500 text-slate-900 hover:bg-gold-400 shadow-lg shadow-gold-500/20'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">
          AI can be inaccurate. Reflect on the suggestions provided.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
