import React, { useState } from 'react';
import { Layers, Search, Filter } from 'lucide-react';
import { TOOLS, CATEGORIES } from '../data/tools';
import { ToolCard } from '../components/ToolCard';
import { useApp } from '../context/AppContext';
import { ToolCategory } from '../types';

export const AllToolsPage: React.FC = () => {
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory } = useApp();
  const [selectedType, setSelectedType] = useState<'all' | 'pdf' | 'image'>('all');

  const filtered = TOOLS.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesType = selectedType === 'all' || t.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0066FF] text-xs font-bold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>COMPLETE CATALOG ({TOOLS.length} TOOLS)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
          All DocMate Tools
        </h1>
        <p className="text-slate-600 text-base">
          Browse our entire suite of productivity tools for PDFs, Images, conversions, and document processing.
        </p>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* PDF vs Image toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-full w-full md:w-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`flex-1 md:flex-initial px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType('pdf')}
              className={`flex-1 md:flex-initial px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedType === 'pdf' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PDF Tools
            </button>
            <button
              onClick={() => setSelectedType('image')}
              className={`flex-1 md:flex-initial px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedType === 'image' ? 'bg-[#0066FF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Image Tools
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, format, or task..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-[#0066FF] focus:bg-white"
            />
          </div>

        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 border-t border-slate-100">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id ? 'bg-[#0066FF] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
          <p className="text-base font-semibold text-slate-700">No matching tools found.</p>
          <p className="text-xs text-slate-400 mt-1">Try changing your search terms or category filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); setSelectedType('all'); }}
            className="mt-4 px-4 py-2 text-xs font-bold bg-[#0066FF] text-white rounded-full"
          >
            Show All Tools
          </button>
        </div>
      )}

    </div>
  );
};
