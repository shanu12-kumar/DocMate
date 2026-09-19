export type ToolCategory = 
  | 'all'
  | 'pdf' 
  | 'image' 
  | 'convert' 
  | 'compress' 
  | 'edit' 
  | 'security' 
  | 'create';

export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ToolCategory;
  type: 'pdf' | 'image';
  icon: string;
  badge?: string;
  popular?: boolean;
  acceptedFileTypes: string[];
  multipleFiles?: boolean;
  isAvailable: boolean;
}

export interface ProcessingJob {
  id: string;
  toolId: string;
  toolName: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultSize?: number;
  timestamp: number;
  error?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export interface AdminActivityLog {
  id: string;
  action: string;
  adminEmail: string;
  details: string;
  timestamp: number;
}

export interface SystemSettings {
  websiteName: string;
  tagline: string;
  contactEmail: string;
  announcementText: string;
  isAnnouncementActive: boolean;
  maintenanceMode: boolean;
  watermarkText: string;
  maxFileSizeMB: number;
  // Legitimate Advertising Configuration
  adsensePublisherId?: string;
  bannerAdSlot?: string;
  rewardedAdUnitId?: string;
  rewardedAdsEnabled: boolean;
}
