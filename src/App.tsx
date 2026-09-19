import React from 'react';
import { useApp, AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { PdfToolsPage } from './pages/PdfToolsPage';
import { ImageToolsPage } from './pages/ImageToolsPage';
import { AllToolsPage } from './pages/AllToolsPage';
import { AboutPage, ContactPage } from './pages/AboutPage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { LegalPage } from './pages/LegalPages';
import { ToolWorkspace } from './components/ToolWorkspace';
import { TOOLS } from './data/tools';
import { AlertTriangle, Bell, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentPath, settings, updateSettings } = useApp();

  // Find if currentPath matches any tool slug (e.g. /merge-pdf or /compress-pdf)
  const activeToolSlug = currentPath.replace(/^\//, '');
  const activeTool = TOOLS.find((t) => t.slug === activeToolSlug);

  // Render view depending on URL path
  const renderCurrentView = () => {
    // If maintenance mode active and not on admin page
    if (settings.maintenanceMode && currentPath !== '/admin' && currentPath !== '/login') {
      return (
        <div className="max-w-xl mx-auto my-24 p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            System Maintenance in Progress
          </h2>
          <p className="text-sm text-amber-800">
            DocMate is performing scheduled system optimizations. We will be back online shortly. Thank you for your patience!
          </p>
        </div>
      );
    }

    if (activeTool) {
      return <ToolWorkspace tool={activeTool} />;
    }

    switch (currentPath) {
      case '/':
      case '':
        return <HomePage />;
      case '/pdf-tools':
        return <PdfToolsPage />;
      case '/image-tools':
        return <ImageToolsPage />;
      case '/all-tools':
        return <AllToolsPage />;
      case '/about':
        return <AboutPage />;
      case '/contact':
        return <ContactPage />;
      case '/login':
        return <LoginPage />;
      case '/signup':
        return <SignupPage />;
      case '/dashboard':
        return <DashboardPage />;
      case '/admin':
        return <AdminPage />;
      case '/privacy':
        return <LegalPage type="privacy" />;
      case '/terms':
        return <LegalPage type="terms" />;
      case '/cookies':
        return <LegalPage type="cookies" />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFF] text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      
      {/* System Announcement Banner */}
      {settings.isAnnouncementActive && settings.announcementText && (
        <div className="bg-[#0066FF] text-white px-4 py-2 text-xs font-semibold flex items-center justify-between z-50">
          <div className="flex items-center gap-2 max-w-5xl mx-auto truncate">
            <Bell className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{settings.announcementText}</span>
          </div>
          <button 
            onClick={() => updateSettings({ isAnnouncementActive: false })}
            className="text-white/80 hover:text-white p-1"
            aria-label="Close announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header />

      {/* Dynamic Route Content */}
      <main className="flex-1 flex flex-col">
        {renderCurrentView()}
      </main>

      {/* Main Footer */}
      <Footer />
      
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
