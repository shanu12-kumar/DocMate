import React from 'react';
import { ShieldCheck, FileText, Lock } from 'lucide-react';

export const LegalPage: React.FC<{ type: 'privacy' | 'terms' | 'cookies' }> = ({ type }) => {
  const getTitle = () => {
    switch (type) {
      case 'privacy': return 'Privacy Policy';
      case 'terms': return 'Terms of Service';
      case 'cookies': return 'Cookie Policy';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {getTitle()}
        </h1>
        <p className="text-xs text-slate-400">Last updated: January 2026</p>
      </div>

      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
        
        {type === 'privacy' && (
          <>
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">1. Client-Side Processing by Default</h2>
              <p>
                DocMate is engineered with a strict client-side-first architecture. When you upload PDFs or images to Merge, Compress, Split, Crop, or Edit, all operations execute within your browser sandbox via JavaScript and WebAssembly. Your files are not stored on our servers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">2. Data We Collect</h2>
              <p>
                We do not collect or inspect the content of your documents. If you choose to create a free account, we only store your basic profile information (name and email) to help you manage your local preferences and history.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">3. Watermarking & Rewarded Ads</h2>
              <p>
                DocMate is a 100% free tool platform. Generated outputs include a small, subtle "Made with DocMate" watermark. Users may optionally watch a sponsored rewarded advertisement to remove the watermark for an eligible processing run.
              </p>
            </section>
          </>
        )}

        {type === 'terms' && (
          <>
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p>
                By using DocMate, you agree to comply with these terms. You represent that you own or have the right to process all documents and images uploaded to the platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">2. Prohibited Uses</h2>
              <p>
                You may not use DocMate to process unlawful materials, distribute malicious files, or attempt to reverse-engineer our web application infrastructure.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">3. 100% Free Service Model</h2>
              <p>
                DocMate tools are provided completely free of charge. There are no paid subscriptions, hidden fees, or recurring charges.
              </p>
            </section>
          </>
        )}

        {type === 'cookies' && (
          <>
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">1. Essential Cookies & Local Storage</h2>
              <p>
                DocMate uses local storage to remember your login session, theme preferences, and your browser's recent processing history.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">2. Third-Party Advertising Cookies</h2>
              <p>
                DocMate is supported by legitimate advertising partners (such as Google AdSense). You can manage or disable non-essential cookies via your browser settings at any time.
              </p>
            </section>
          </>
        )}

      </div>
    </div>
  );
};

export default LegalPage;
