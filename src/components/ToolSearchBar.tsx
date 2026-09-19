import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { TOOLS } from '../data/tools';
import { ToolDefinition } from '../types';
import { ToolIconRenderer } from './ToolCard';
import { useApp } from '../context/AppContext';

export const ToolSearchBar: React.FC = () => {
  const { navigate, searchQuery, setSearchQuery } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTools = searchQuery.trim()
    ? TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectTool = (tool: ToolDefinition) => {
    navigate(`/${tool.slug}`);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto z-30">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search a tool..."
          className="w-full pl-12 pr-12 py-4 text-base text-slate-800 bg-white border border-slate-200/90 rounded-full shadow-lg shadow-slate-100/80 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400"
          id="homepage-tool-search-input"
        />

        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Instant Dropdown Results */}
      {isOpen && searchQuery.trim().length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-96 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-150">
          {filteredTools.length > 0 ? (
            <div className="divide-y divide-slate-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Tools ({filteredTools.length})
              </div>
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => handleSelectTool(tool)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/60 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      tool.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#0066FF]'
                    }`}>
                      <ToolIconRenderer name={tool.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-[#0066FF]">
                          {tool.name}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {tool.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {tool.shortDescription}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0066FF] group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">
              <p className="font-semibold text-slate-700">No tools found for "{searchQuery}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for merge, compress, resize, format or convert</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
