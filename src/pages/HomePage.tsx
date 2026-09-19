import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Lock, 
  ArrowRight, 
  FileText, 
  Image as ImageIcon, 
  Sparkles,
  Layers,
  Scissors,
  FileArchive,
  Wand2,
  Crop,
  CheckCircle2,
  FolderLock
} from 'lucide-react';
import { ToolSearchBar } from '../components/ToolSearchBar';
import { CategoryCard } from '../components/CategoryCard';
import { ToolCard } from '../components/ToolCard';
import { HeroGraphic } from '../components/HeroGraphic';
import { AdSlot } from '../components/AdSlot';
import { TOOLS, CATEGORIES } from '../data/tools';
import { useApp } from '../context/AppContext';

export const HomePage: React.FC = () => {
  const { navigate } = useApp();

  // 8 Popular tools
  const popularTools = TOOLS.filter((t) => t.popular).slice(0, 8);

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 sm:pt-14 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headings & Search */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0066FF] text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>100% Free • Fast • Private • In-Browser</span>
              </div>

              {/* Main Headline */}
              <h1 
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Everyday PDF & Image Tasks, <span className="text-[#0066FF]">Made Simple.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Merge, compress, convert, crop, and edit your documents and photos in seconds with zero uploads to remote servers. Completely free for everyone.
              </p>

              {/* Interactive Tool Search Bar */}
              <div className="pt-2 max-w-xl mx-auto lg:mx-0">
                <ToolSearchBar />
              </div>

              {/* Quick Trust Highlights */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-2 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>Client-Side Privacy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Instant Processing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
                  <span>No Subscriptions Needed</span>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Graphic Visual */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroGraphic />
            </div>

          </div>

        </div>
      </section>

      {/* Non-intrusive Ad Banner (if configured) */}
      <AdSlot />

      {/* 2. CATEGORY PILLS / CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Explore by Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Quickly jump into specialized file tools</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* 3. POPULAR TOOLS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Most Popular Tools
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">The most frequently used document & image converters</p>
          </div>

          <button
            onClick={() => navigate('/all-tools')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#0066FF] hover:text-[#0052CC] transition-colors"
          >
            <span>View all 20+ tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <button
            onClick={() => navigate('/all-tools')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-full transition-colors"
          >
            <span>View all 20+ tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 4. WHY CHOOSE DOCMATE (3 Features) */}
      <section className="bg-slate-50/70 border-y border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Why Choose DocMate?
            </h2>
            <p className="text-sm text-slate-600">
              Engineered with modern web standards for maximum reliability, speed, and privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Instant Processing
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transform files directly in your web browser with zero waiting queues, rapid conversions, and instant one-click downloads.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Privacy-First Architecture
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your files remain strictly inside your browser sandbox. Your personal documents and private photos are never uploaded or stored on remote servers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                100% Free For Everyone
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enjoy unrestricted access to all PDF and Image utilities with no subscriptions, credit cards, or locked tools.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. FREE & UNLIMITED MESSAGING BLOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="free-unlimited-section">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0055EE] to-[#0044CC] text-white p-8 sm:p-12 shadow-xl shadow-blue-500/10">
          
          {/* Subtle background decoration */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none flex items-center justify-end pr-10">
            <Sparkles className="w-96 h-96 text-white" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-[11px] font-bold tracking-wide uppercase text-blue-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free & Unlimited</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Free & Unlimited Document & Image Utilities
            </h2>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed font-normal">
              Convert, merge, split, compress, and edit all your PDFs and images without limitations, account requirements, or hidden fees. All processing runs securely directly in your browser.
            </p>
            
            <div className="pt-2">
              <button
                onClick={() => navigate('/all-tools')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-blue-50 text-[#0066FF] font-bold text-xs rounded-full shadow-lg transition-all transform hover:-translate-y-0.5"
                id="homepage-explore-all-btn"
              >
                <span>Explore All Free Tools</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default HomePage;
