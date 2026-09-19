import React, { useState } from 'react';
import { 
  Search, 
  Menu, 
  X, 
  User, 
  ShieldCheck, 
  LogOut,
  ChevronDown,
  Sparkles,
  Heart
} from 'lucide-react';
import { Logo } from './Logo';
import { useApp } from '../context/AppContext';
import { DonateModal } from './DonateModal';

export const Header: React.FC = () => {
  const { currentPath, navigate, user, isAdmin, logout, setSearchQuery } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [headerSearchText, setHeaderSearchText] = useState('');

  // Clean Navigation
  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'PDF Tools', path: '/pdf-tools' },
    { label: 'Image Tools', path: '/image-tools' },
    { label: 'All Tools', path: '/all-tools' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearchText.trim()) {
      setSearchQuery(headerSearchText);
      navigate('/all-tools');
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo (Left) */}
          <div 
            onClick={() => handleNavClick('/')}
            className="cursor-pointer flex items-center hover:opacity-95 transition-opacity"
            id="header-brand-logo"
          >
            <Logo variant="horizontal" size="md" />
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-6" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`relative py-2 px-2.5 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-[#0066FF] font-semibold' 
                      : 'text-slate-600 hover:text-[#0066FF]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2.5 right-2.5 h-[2.5px] bg-[#0066FF] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Tip / Support Creator Button */}
            <button
              onClick={() => setDonateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 border border-pink-200 text-pink-700 text-xs font-bold rounded-full transition-all shadow-2xs"
              title="Support DocMate development"
            >
              <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
              <span>Tip Creator</span>
            </button>

            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-slate-500 hover:text-[#0066FF] hover:bg-slate-50 rounded-full transition-colors"
              title="Search tools"
              aria-label="Search tools"
            >
              <Search className="w-4.5 h-4.5 text-slate-600" />
            </button>

            {user ? (
              /* Logged In User Dropdown */
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 text-sm font-medium text-slate-700 bg-white transition-all shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[110px] truncate">{user.name}</span>
                  {isAdmin && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> ADMIN
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => handleNavClick('/dashboard')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-400" /> Dashboard & History
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleNavClick('/admin')}
                        className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 font-medium"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-500" /> Admin Console
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-red-500" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Auth Buttons */
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleNavClick('/login')}
                  className="px-5 py-2 text-sm font-semibold text-[#0066FF] border border-[#0066FF]/30 hover:border-[#0066FF] hover:bg-blue-50/50 rounded-full transition-all duration-150"
                  id="header-login-btn"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavClick('/signup')}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-sm hover:shadow rounded-full transition-all duration-150"
                  id="header-signup-btn"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-slate-600 hover:text-[#0066FF] rounded-lg"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Expandable Search Input Bar */}
        {searchOpen && (
          <form onSubmit={handleSearchSubmit} className="py-3 border-t border-slate-100 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={headerSearchText}
                onChange={(e) => setHeaderSearchText(e.target.value)}
                placeholder="Search any PDF or image tool (e.g. merge, compress, crop)..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-[#0066FF] focus:bg-white"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0066FF] text-white text-sm font-medium rounded-full hover:bg-[#0052CC]"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-xl">
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`text-left px-3 py-2.5 rounded-lg text-base font-medium ${
                  currentPath === link.path
                    ? 'text-[#0066FF] bg-blue-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            {user ? (
              <>
                <button
                  onClick={() => handleNavClick('/dashboard')}
                  className="w-full text-left px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                >
                  Dashboard & History
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleNavClick('/admin')}
                    className="w-full text-left px-3 py-2.5 text-indigo-600 bg-indigo-50/60 rounded-lg font-medium"
                  >
                    Admin Console
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleNavClick('/login')}
                  className="w-full py-2.5 text-center text-sm font-semibold text-[#0066FF] border border-[#0066FF]/30 rounded-full"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavClick('/signup')}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-[#0066FF] rounded-full shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Razorpay Tip / Support Modal */}
      <DonateModal 
        isOpen={donateModalOpen} 
        onClose={() => setDonateModalOpen(false)} 
      />
    </header>
  );
};

export default Header;
