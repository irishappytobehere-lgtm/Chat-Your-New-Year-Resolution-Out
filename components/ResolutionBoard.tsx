import React, { useMemo, useRef, useState } from 'react';
import { Resolution, ResolutionCategory, ChartDataPoint } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import html2canvas from 'html2canvas';

interface ResolutionBoardProps {
  resolutions: Resolution[];
  onRemove: (id: string) => void;
}

const ResolutionBoard: React.FC<ResolutionBoardProps> = ({ resolutions, onRemove }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const chartData = useMemo(() => {
    const categories = Object.values(ResolutionCategory);
    const data: ChartDataPoint[] = categories.map(cat => ({
      subject: cat,
      A: 0,
      fullMark: 5 // Scaling factor
    }));

    resolutions.forEach(res => {
      const idx = data.findIndex(d => d.subject === res.category);
      if (idx !== -1) {
        data[idx].A += 1;
      }
    });
    
    return data;
  }, [resolutions]);

  const handleExport = async () => {
    if (!boardRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const element = boardRef.current;
      
      // Clone the element to render it fully expanded (handling overflow) off-screen
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Style the clone to ensure full height is captured
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = `${element.offsetWidth}px`;
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      
      // We need to find the internal scrollable container in the clone and expand it too
      // The scrollable div is the second child in our structure (Header is first)
      const scrollableContent = clone.querySelector('.overflow-y-auto') as HTMLElement;
      if (scrollableContent) {
        scrollableContent.style.height = 'auto';
        scrollableContent.style.overflow = 'visible';
        scrollableContent.style.maxHeight = 'none';
      }

      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        backgroundColor: '#0F172A', // Force dark background
        scale: 2, // Better quality
        logging: false,
        useCORS: true
      });

      document.body.removeChild(clone);

      const link = document.createElement('a');
      link.download = `My_2026_Vision_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export vision. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
      
      {/* Wrapper for capture: Includes Header and List */}
      <div ref={boardRef} className="flex-1 flex flex-col min-h-0 relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-900/80">
          <h2 className="font-serif text-2xl text-slate-100">Your Vision</h2>
          <p className="text-slate-400 text-sm mt-1">
            {resolutions.length === 0 
              ? "Chat to start building your 2026."
              : `${resolutions.length} resolution${resolutions.length > 1 ? 's' : ''} set.`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-900/40">
          
          {/* Chart Section */}
          {resolutions.length > 0 && (
            <div className="h-64 w-full relative -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar
                    name="Focus"
                    dataKey="A"
                    stroke="#EAB308"
                    strokeWidth={2}
                    fill="#EAB308"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-4 pb-4">
            {resolutions.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl">
                <span className="text-4xl block mb-2">✨</span>
                <p className="text-slate-400">No resolutions yet.</p>
              </div>
            ) : (
              resolutions.map((res) => (
                <div 
                  key={res.id} 
                  className="group relative bg-slate-800/50 border border-slate-700/50 rounded-xl p-5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gold-500 bg-gold-500/10 px-2 py-1 rounded-full">
                      {res.category}
                    </span>
                    <button 
                      onClick={() => onRemove(res.id)}
                      // Hide remove button in export via class check or opacity (html2canvas captures opacity)
                      // But better to just let it be hidden by default opacity 0 logic
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                      data-html2canvas-ignore="true" // Hint to ignore this element
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-serif font-medium text-slate-100 mb-3">{res.title}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">WHY</p>
                      <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-slate-600 pl-3">
                        "{res.motivation}"
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">FIRST STEP</p>
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        {res.firstStep}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Footer / Action */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-700 text-center z-10">
        <button 
          onClick={handleExport}
          disabled={isExporting || resolutions.length === 0}
          className={`w-full py-3 rounded-xl transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 ${
            isExporting || resolutions.length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-slate-800 text-slate-300 hover:text-gold-400 hover:bg-slate-700 hover:shadow-lg'
          }`}
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-500 border-t-gold-500 rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
              Export Vision
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ResolutionBoard;