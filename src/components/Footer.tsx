import React from 'react';
import { Youtube, Twitter, Instagram, Facebook } from 'lucide-react';
import { Logo } from './Logo';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { navigate } = useApp();
  const currentYear = new Date().getFullYear();

  const handleNav = (path: string) => {
    navigate(path);
  };

  return (
    <footer className="bg-[#0B132B] text-slate-300 border-t border-slate-800/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-800">
          
          {/* Col 1: Brand & Tagline */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              onClick={() => handleNav('/')} 
              className="cursor-pointer inline-block"
              id="footer-brand-logo"
            >
              <Logo variant="white-footer" size="lg" showTagline={true} />
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Fast, private, and completely free online tools to convert, compress, edit, and organize all your PDF and image files right in your browser.
            </p>
          </div>

          {/* Col 2: Tools */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider">Tools</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => handleNav('/pdf-tools')} className="hover:text-white transition-colors">
                  PDF Tools
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('/image-tools')} className="hover:text-white transition-colors">
                  Image Tools
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('/all-tools')} className="hover:text-white transition-colors">
                  All Tools
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => handleNav('/about')} className="hover:text-white transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('/contact')} className="hover:text-white transition-colors">
                  Contact Us
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('/privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('/terms')} className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('/cookies')} className="hover:text-white transition-colors">
                  Cookie Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Support & Connect */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white tracking-wider">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <button onClick={() => handleNav('/about')} className="hover:text-white transition-colors">
                    Help Center
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav('/contact')} className="hover:text-white transition-colors">
                    FAQs
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav('/contact')} className="hover:text-white transition-colors">
                    Feedback
                  </button>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Connect With Us</h4>
              <div className="flex items-center space-x-3">
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#0066FF] transition-all"
                  aria-label="DocMate on YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#0066FF] transition-all"
                  aria-label="DocMate on X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#0066FF] transition-all"
                  aria-label="DocMate on Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#0066FF] transition-all"
                  aria-label="DocMate on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} DocMate. All rights reserved.</p>
          <p className="font-medium text-slate-400">Your Files. Made Simple.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
