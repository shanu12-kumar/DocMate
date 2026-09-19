import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle';
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ 
  slotId, 
  format = 'horizontal',
  className = '' 
}) => {
  const { settings } = useApp();
  const adRef = useRef<HTMLDivElement>(null);

  const publisherId = settings.adsensePublisherId;
  const activeSlot = slotId || settings.bannerAdSlot;

  // Only render if legitimate AdSense Publisher ID is configured
  if (!publisherId || !activeSlot) {
    return null; // Clean empty state - never show fake ads
  }

  return (
    <div 
      ref={adRef} 
      className={`w-full max-w-5xl mx-auto my-6 p-2 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center overflow-hidden ${className}`}
      id="docmate-ad-slot-container"
    >
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 select-none">
        Advertisement
      </span>
      <div className="w-full flex justify-center items-center min-h-[90px]">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', textAlign: 'center' }}
          data-ad-client={publisherId}
          data-ad-slot={activeSlot}
          data-ad-format={format === 'horizontal' ? 'horizontal' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

export default AdSlot;
