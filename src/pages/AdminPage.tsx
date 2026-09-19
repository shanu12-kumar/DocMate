import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  AlertTriangle, 
  Activity, 
  Database, 
  Save, 
  RefreshCw,
  Trash2,
  Download,
  Terminal,
  Server,
  Cpu,
  HardDrive,
  CheckCircle2,
  Tv,
  Globe,
  Radio
} from 'lucide-react';
import { useApp, OWNER_ADMIN_EMAIL } from '../context/AppContext';

interface BackendLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'system';
  category: 'HTTP' | 'SYSTEM' | 'PROCESS' | 'API';
  method?: string;
  url?: string;
  status?: number;
  durationMs?: number;
  ip?: string;
  message: string;
  details?: any;
}

interface SystemHealth {
  status: string;
  service: string;
  environment: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  timestamp: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  totalRequests: number;
  memoryUsage: {
    rssMB: string;
    heapTotalMB: string;
    heapUsedMB: string;
    externalMB: string;
  };
}

export const AdminPage: React.FC = () => {
  const { settings, updateSettings, adminLogs, user, isAdmin, jobs, navigate } = useApp();
  const [formSettings, setFormSettings] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Backend Live Telemetry & Log state
  const [backendLogs, setBackendLogs] = useState<BackendLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'system'>('all');
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'system' | 'serverLogs' | 'audit'>('system');

  const fetchBackendData = async () => {
    try {
      setLoadingLogs(true);
      const [healthRes, logsRes] = await Promise.all([
        fetch('/api/health').then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch(`/api/logs?level=${logFilter}&limit=100`).then((r) => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (healthRes) {
        setSystemHealth(healthRes);
      }
      if (logsRes && Array.isArray(logsRes.logs)) {
        setBackendLogs(logsRes.logs);
      }
    } catch (err) {
      console.error('Failed to query backend telemetry:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchBackendData, 5000);
    return () => clearInterval(interval);
  }, [logFilter, autoRefresh]);

  const handleClearBackendLogs = async () => {
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        fetchBackendData();
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backendLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `docmate-server-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // If not admin, show access request notice
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Owner & Administrator Access
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The owner ID is configured as <span className="font-semibold text-slate-700">{OWNER_ADMIN_EMAIL}</span>. Sign in with the owner email to access full administrative controls.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 bg-[#0066FF] text-white text-xs font-bold rounded-full shadow-md"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const successfulJobs = jobs.filter((j) => j.status === 'completed').length;
  const failedJobs = jobs.filter((j) => j.status === 'failed').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Admin Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                DocMate System & Server Control
              </h1>
              <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                SYSTEM ADMINISTRATOR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin Session: <span className="text-white font-semibold">{user?.email || OWNER_ADMIN_EMAIL}</span> • Node {systemHealth?.nodeVersion || process.version}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBackendData}
            disabled={loadingLogs}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-[#0066FF]' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System configuration saved and synced with server!</span>
        </div>
      )}

      {/* Real-Time System Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Server Status</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xl font-bold text-emerald-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {systemHealth?.status === 'healthy' ? 'Online & Healthy' : 'Active (Local)'}
          </p>
          <p className="text-[10px] text-slate-400">Port 3000 • Ingress Ready</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Server Uptime</span>
            <Server className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {systemHealth?.uptimeFormatted || 'Running'}
          </p>
          <p className="text-[10px] text-slate-400">Requests: {systemHealth?.totalRequests || jobs.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memory (Heap)</span>
            <Cpu className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {systemHealth?.memoryUsage?.heapUsedMB ? `${systemHealth.memoryUsage.heapUsedMB} MB` : 'Optimal'}
          </p>
          <p className="text-[10px] text-slate-400">RSS: {systemHealth?.memoryUsage?.rssMB ? `${systemHealth.memoryUsage.rssMB} MB` : 'Active'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Tasks</span>
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {jobs.length} Total
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold">{successfulJobs} succeeded • {failedJobs} failed</p>
        </div>
      </div>

      {/* Navigation Tab Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('serverLogs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'serverLogs'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Backend Server Logs ({backendLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'system'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-blue-400" />
          <span>Website & Ad Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Admin Audit Logs ({adminLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: BACKEND SERVER LOGS */}
      {activeTab === 'serverLogs' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
          
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter Level:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                {(['all', 'info', 'warn', 'error', 'system'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                      logFilter === lvl
                        ? 'bg-[#0066FF] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#0066FF] rounded"
                />
                <span>Auto Refresh (5s)</span>
              </label>

              <button
                onClick={handleExportLogs}
                disabled={backendLogs.length === 0}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={handleClearBackendLogs}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            </div>
          </div>

          {/* Terminal-Style Log Console */}
          <div className="p-4 bg-slate-950 font-mono text-xs text-slate-200 max-h-[550px] overflow-y-auto space-y-1.5 select-text">
            {backendLogs.length > 0 ? (
              backendLogs.map((log) => {
                const isErr = log.level === 'error' || (log.status && log.status >= 500);
                const isWarn = log.level === 'warn' || (log.status && log.status >= 400 && log.status < 500);
                const isSys = log.level === 'system';

                const badgeColor = isErr 
                  ? 'text-red-400 bg-red-950/60 border border-red-800/40' 
                  : isWarn 
                  ? 'text-amber-300 bg-amber-950/60 border border-amber-800/40' 
                  : isSys 
                  ? 'text-purple-300 bg-purple-950/60 border border-purple-800/40' 
                  : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40';

                return (
                  <div 
                    key={log.id} 
                    className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-2.5">
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider ${badgeColor}`}>
                        {log.level}
                      </span>
                      {log.category && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {log.category}
                        </span>
                      )}
                      <span className="text-slate-200 text-xs break-all">
                        {log.message}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 whitespace-nowrap pl-6 sm:pl-0">
                      {log.durationMs !== undefined && (
                        <span className="text-blue-400">{log.durationMs}ms</span>
                      )}
                      {log.ip && (
                        <span className="text-slate-500">{log.ip}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-slate-500 space-y-2">
                <Terminal className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p>No backend server logs recorded yet for filter "{logFilter}".</p>
                <p className="text-[11px] text-slate-600">All live HTTP API requests and system events will stream here.</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Buffer capacity: 200 real-time events</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> Live Telemetry Feed
            </span>
          </div>

        </div>
      )}

      {/* TAB 2: SYSTEM SETTINGS */}
      {activeTab === 'system' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Settings className="w-5 h-5 text-[#0066FF]" />
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Website & System Configuration
            </h2>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-800">System Maintenance Mode</p>
                <p className="text-[11px] text-slate-500">Display friendly maintenance notice to visitors</p>
              </div>
              <input
                type="checkbox"
                checked={formSettings.maintenanceMode}
                onChange={(e) => setFormSettings({ ...formSettings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 accent-[#0066FF] rounded cursor-pointer"
              />
            </div>

            {/* Announcement Banner */}
            <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800">Global Announcement Banner</p>
                <input
                  type="checkbox"
                  checked={formSettings.isAnnouncementActive}
                  onChange={(e) => setFormSettings({ ...formSettings, isAnnouncementActive: e.target.checked })}
                  className="w-4 h-4 accent-[#0066FF] rounded cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={formSettings.announcementText}
                onChange={(e) => setFormSettings({ ...formSettings, announcementText: e.target.value })}
                placeholder="e.g. Welcome to DocMate — 100% Free in-browser PDF & Image suite with zero watermarks!"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Support Contact Email</label>
                <input
                  type="email"
                  value={formSettings.contactEmail}
                  onChange={(e) => setFormSettings({ ...formSettings, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max File Size Limit (MB)</label>
                <input
                  type="number"
                  value={formSettings.maxFileSizeMB}
                  onChange={(e) => setFormSettings({ ...formSettings, maxFileSizeMB: parseInt(e.target.value, 10) || 50 })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Watermark Text</label>
              <input
                type="text"
                value={formSettings.watermarkText}
                onChange={(e) => setFormSettings({ ...formSettings, watermarkText: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            {/* ADVERTISING CONFIGURATION */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#0066FF]" />
                <h3 className="text-sm font-bold text-slate-900">Advertising & Monetization Integration</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Google AdSense Publisher ID</label>
                  <input
                    type="text"
                    value={formSettings.adsensePublisherId || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, adsensePublisherId: e.target.value })}
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Ad Slot ID</label>
                  <input
                    type="text"
                    value={formSettings.bannerAdSlot || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, bannerAdSlot: e.target.value })}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save All System & Server Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ADMIN AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Admin Configuration Change History
            </h2>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {adminLogs.length > 0 ? (
              adminLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{log.details}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-12">
                No admin changes recorded yet. Configuration updates will appear here in real-time.
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;
