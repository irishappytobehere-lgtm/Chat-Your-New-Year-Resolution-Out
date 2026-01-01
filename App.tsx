import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import ResolutionBoard from './components/ResolutionBoard';
import { Resolution } from './types';

const App: React.FC = () => {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);

  const handleResolutionAdded = (newRes: Resolution) => {
    setResolutions(prev => [newRes, ...prev]);
  };

  const handleRemoveResolution = (id: string) => {
    setResolutions(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-gold-500/30 font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gold-600/10 rounded-full blur-[128px]" />
      </div>

      <div className="container mx-auto h-screen p-4 md:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        
        {/* Left Panel: Chat */}
        <div className="flex-1 h-[60%] md:h-full min-h-[400px]">
          <ChatInterface onResolutionAdded={handleResolutionAdded} />
        </div>

        {/* Right Panel: Board */}
        <div className="w-full md:w-[400px] lg:w-[450px] h-[40%] md:h-full min-h-[300px]">
          <ResolutionBoard 
            resolutions={resolutions} 
            onRemove={handleRemoveResolution}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
