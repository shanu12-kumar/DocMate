import React from 'react';
import { FileText, Image as ImageIcon, FileCode, Wrench } from 'lucide-react';
import { DocMateEmblem } from './Logo';

export const HeroGraphic: React.FC = () => {
  return (
    <div className="relative w-full max-w-[420px] aspect-square mx-auto flex items-center justify-center select-none">
      
      {/* Background Soft Blue Glow and Orbit Rings */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/60 via-blue-50/40 to-transparent rounded-full blur-2xl -z-10" />
      
      {/* Circular Dotted Orbit Paths */}
      <svg className="absolute inset-0 w-full h-full text-blue-200/80 -z-10 animate-spin-slow" viewBox="0 0 400 400" fill="none">
        <circle cx="200" cy="200" r="160" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="200" cy="200" r="110" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
      </svg>

      {/* Main Center DocMate Brand Card */}
      <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-slate-100 shadow-2xl shadow-blue-500/10 flex flex-col items-center text-center transform hover:scale-[1.02] transition-transform duration-300">
        <DocMateEmblem size={88} className="drop-shadow-md" />
        
        <div className="mt-4 flex items-center font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <span className="text-3xl text-slate-900">Doc</span>
          <span className="text-3xl text-[#0066FF]">Mate</span>
        </div>

        <p className="text-xs font-medium text-slate-500 mt-1 tracking-wide">
          Your Files. Made Simple.
        </p>
      </div>

      {/* Floating Badge 1: PDF (Top) */}
      <div className="absolute -top-1 right-12 z-20 bg-white p-3 rounded-2xl shadow-lg shadow-red-500/10 border border-slate-100 flex items-center gap-2 transform hover:-translate-y-1 transition-transform animate-float">
        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
          <div className="flex flex-col items-center">
            <FileText className="w-4 h-4 text-red-500" />
            <span className="text-[7px] font-extrabold uppercase -mt-0.5">PDF</span>
          </div>
        </div>
      </div>

      {/* Floating Badge 2: Image (Top Right) */}
      <div className="absolute top-10 -right-2 z-20 bg-white p-3 rounded-2xl shadow-lg shadow-emerald-500/10 border border-slate-100 flex items-center gap-2 transform hover:-translate-y-1 transition-transform animate-float" style={{ animationDelay: '1s' }}>
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-emerald-500" />
        </div>
      </div>

      {/* Floating Badge 3: Document (Bottom Left) */}
      <div className="absolute bottom-6 -left-2 z-20 bg-white p-3 rounded-2xl shadow-lg shadow-blue-500/10 border border-slate-100 flex items-center gap-2 transform hover:-translate-y-1 transition-transform animate-float" style={{ animationDelay: '2s' }}>
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center">
          <FileCode className="w-5 h-5 text-[#0066FF]" />
        </div>
      </div>

      {/* Floating Badge 4: Tool / Edit (Bottom Right) */}
      <div className="absolute -bottom-2 right-10 z-20 bg-white p-3 rounded-2xl shadow-lg shadow-purple-500/10 border border-slate-100 flex items-center gap-2 transform hover:-translate-y-1 transition-transform animate-float" style={{ animationDelay: '1.5s' }}>
        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-purple-500" />
        </div>
      </div>

    </div>
  );
};
