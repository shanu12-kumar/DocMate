import React from 'react';
import { 
  User, 
  Clock, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  HardDrive,
  Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin, jobs, clearHistory, navigate } = useApp();

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalBytesProcessed = jobs.reduce((acc, j) => acc + j.fileSize, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#0066FF] flex items-center justify-center font-black text-2xl">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {user?.name || 'Guest User'}
              </h1>
              {isAdmin && (
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" /> ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{user?.email || 'Active In-Browser Session'}</p>
          </div>
        </div>

        <div>
          <button
            onClick={() => navigate('/all-tools')}
            className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1.5 transition-all"
          >
            <span>Explore All Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real Usage Metrics (Derived purely from authentic browser actions) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Processed Tasks</span>
            <Activity className="w-4 h-4 text-[#0066FF]" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 pt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {jobs.length}
          </p>
          <p className="text-[11px] text-slate-500">Total operations executed in session</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Processed Volume</span>
            <HardDrive className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 pt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {formatBytes(totalBytesProcessed)}
          </p>
          <p className="text-[11px] text-slate-500">Transformed in client-side memory</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">DocMate Platform</span>
            <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
          </div>
          <p className="text-3xl font-extrabold text-[#0066FF] pt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            100% FREE
          </p>
          <p className="text-[11px] text-slate-500">All tools unlocked with zero fees</p>
        </div>
      </div>

      {/* Real Processing History Log */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Recent File Activity
            </h2>
            <p className="text-xs text-slate-500">Your recent tool operations executed in this browser session</p>
          </div>

          {jobs.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
          )}
        </div>

        {jobs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <div key={job.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 truncate">{job.fileName}</p>
                    <p className="text-[10px] text-slate-400">
                      {job.toolName} • {formatBytes(job.fileSize)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right shrink-0">
                  <span className="text-[10px] text-slate-400">
                    {new Date(job.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {job.status === 'completed' ? (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  ) : (
                    <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No processing history yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Whenever you convert, merge, compress, or edit files, your runs will be securely listed here.
            </p>
            <button
              onClick={() => navigate('/all-tools')}
              className="mt-2 px-5 py-2 bg-[#0066FF] text-white text-xs font-bold rounded-full inline-flex items-center gap-1"
            >
              <span>Explore Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
