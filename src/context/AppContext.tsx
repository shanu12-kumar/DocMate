import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, ProcessingJob, AdminActivityLog, SystemSettings } from '../types';

export const OWNER_ADMIN_EMAIL = 'shanu123456r@gmail.com';

interface AppContextType {
  user: UserAccount | null;
  isAdmin: boolean;
  login: (email: string, name?: string) => Promise<void>;
  signup: (email: string, name: string) => Promise<void>;
  logout: () => void;
  
  // Real Processing History (Strictly real user runs - 0 fake data!)
  jobs: ProcessingJob[];
  addJob: (job: Omit<ProcessingJob, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;

  // Free Watermark Removal & Toggle Controls (100% Free - Clean by Default)
  rewardedAdAvailable: boolean;
  temporaryWatermarkRemoved: boolean;
  setTemporaryWatermarkRemoved: React.Dispatch<React.SetStateAction<boolean>>;
  toggleWatermarkRemoval: (removed?: boolean) => void;
  requestRewardedAd: () => Promise<{ success: boolean; message: string }>;
  clearTemporaryWatermarkBypass: () => void;

  // System Settings & Admin
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  adminLogs: AdminActivityLog[];
  addAdminLog: (action: string, details: string) => void;

  // Search & Navigation
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  currentPath: string;
  navigate: (path: string) => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
  websiteName: 'DocMate',
  tagline: 'Your Files. Made Simple.',
  contactEmail: 'support@docmate.app',
  announcementText: '',
  isAnnouncementActive: false,
  maintenanceMode: false,
  watermarkText: 'Made with DocMate',
  maxFileSizeMB: 50,
  adsensePublisherId: '',
  bannerAdSlot: '',
  rewardedAdUnitId: '',
  rewardedAdsEnabled: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Path state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // User state
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('docmate_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Real Jobs History (Strictly starting empty if no user actions!)
  const [jobs, setJobs] = useState<ProcessingJob[]>(() => {
    try {
      const saved = localStorage.getItem('docmate_jobs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Admin logs (Empty by default unless real admin actions occur)
  const [adminLogs, setAdminLogs] = useState<AdminActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem('docmate_admin_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // System Settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('docmate_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Default: 100% Free - Clean watermark-free output by default
  const [temporaryWatermarkRemoved, setTemporaryWatermarkRemoved] = useState<boolean>(true);

  const toggleWatermarkRemoval = (removed?: boolean) => {
    setTemporaryWatermarkRemoved((prev) => (removed !== undefined ? removed : !prev));
  };

  // Sync state to local storage
  useEffect(() => {
    if (user) localStorage.setItem('docmate_user', JSON.stringify(user));
    else localStorage.removeItem('docmate_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('docmate_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('docmate_admin_logs', JSON.stringify(adminLogs));
  }, [adminLogs]);

  useEffect(() => {
    localStorage.setItem('docmate_settings', JSON.stringify(settings));
  }, [settings]);

  // Handle browser popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase();

  const login = async (email: string, name?: string) => {
    const isOwnerOrAdmin = email.trim().toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase() || email.toLowerCase().includes('admin');
    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      email: email.trim(),
      name: name || email.split('@')[0],
      role: isOwnerOrAdmin ? 'admin' : 'user',
      createdAt: Date.now(),
    };
    setUser(newUser);
  };

  const signup = async (email: string, name: string) => {
    const isOwnerOrAdmin = email.trim().toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase();
    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      email: email.trim(),
      name,
      role: isOwnerOrAdmin ? 'admin' : 'user',
      createdAt: Date.now(),
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    setTemporaryWatermarkRemoved(false);
  };

  const addJob = (jobData: Omit<ProcessingJob, 'id' | 'timestamp'>) => {
    const newJob: ProcessingJob = {
      ...jobData,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
    };
    setJobs((prev) => [newJob, ...prev.slice(0, 49)]); // keep latest 50 real jobs
  };

  const clearHistory = () => {
    setJobs([]);
  };

  const addAdminLog = (action: string, details: string) => {
    const newLog: AdminActivityLog = {
      id: `log_${Date.now()}`,
      action,
      adminEmail: user?.email || OWNER_ADMIN_EMAIL,
      details,
      timestamp: Date.now(),
    };
    setAdminLogs((prev) => [newLog, ...prev]);
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addAdminLog('Update Settings', `Modified settings: ${Object.keys(newSettings).join(', ')}`);
  };

  // Rewarded Ad Watermark Removal Logic
  // Strictly checks whether a legitimate ad provider is configured in window/SDK or settings.
  // Never fakes or simulates fake ad completions.
  const rewardedAdAvailable = Boolean(
    settings.rewardedAdsEnabled && 
    settings.rewardedAdUnitId && 
    (typeof window !== 'undefined' && (window as any).googletag)
  );

  const requestRewardedAd = async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.rewardedAdsEnabled || !settings.rewardedAdUnitId) {
      return {
        success: false,
        message: 'Rewarded ads are currently unavailable. The standard DocMate watermark will be applied.',
      };
    }

    // Check if Google Publisher Tag or real rewarded ad SDK is present
    const gTag = (window as any).googletag;
    if (!gTag || !gTag.cmd) {
      return {
        success: false,
        message: 'Rewarded ads are currently unavailable. The standard DocMate watermark will be applied.',
      };
    }

    try {
      // If a legitimate provider is configured, handle real ad event listener
      return new Promise((resolve) => {
        gTag.cmd.push(() => {
          const rewardedSlot = gTag.defineOutOfPageSlot(
            settings.rewardedAdUnitId,
            gTag.enums.OutOfPageFormat.REWARDED
          );
          if (rewardedSlot) {
            rewardedSlot.addService(gTag.pubads());
            gTag.pubads().addEventListener('rewardedSlotGranted', () => {
              setTemporaryWatermarkRemoved(true);
              resolve({
                success: true,
                message: 'Ad completed. Watermark removed for this file!',
              });
            });
            gTag.pubads().addEventListener('rewardedSlotClosed', () => {
              resolve({
                success: false,
                message: 'Ad was closed before completion. The standard DocMate watermark will be applied.',
              });
            });
            gTag.display(rewardedSlot);
          } else {
            resolve({
              success: false,
              message: 'Rewarded ads are currently unavailable. The standard DocMate watermark will be applied.',
            });
          }
        });
      });
    } catch {
      return {
        success: false,
        message: 'Rewarded ads are currently unavailable. The standard DocMate watermark will be applied.',
      };
    }
  };

  const clearTemporaryWatermarkBypass = () => {
    setTemporaryWatermarkRemoved(false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAdmin,
        login,
        signup,
        logout,
        jobs,
        addJob,
        clearHistory,
        rewardedAdAvailable,
        temporaryWatermarkRemoved,
        setTemporaryWatermarkRemoved,
        toggleWatermarkRemoval,
        requestRewardedAd,
        clearTemporaryWatermarkBypass,
        settings,
        updateSettings,
        adminLogs,
        addAdminLog,
        searchQuery,
        setSearchQuery,
        activeCategory,
        setActiveCategory,
        currentPath,
        navigate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
