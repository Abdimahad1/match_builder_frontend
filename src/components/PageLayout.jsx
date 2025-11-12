// components/PageLayout.jsx
import { useState } from 'react';
import Sidebar from './Sidebar';

const PageLayout = ({ children, pageTitle, pageDescription, pageColor = 'from-blue-500 to-cyan-500' }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Mobile Header - This is the only menu icon now */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 z-50 p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 rounded-lg bg-slate-800 text-white"
          >
            {isMobileSidebarOpen ? '✕' : '☰'}
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
              👤
            </div>
            <span className="text-white font-semibold">Face2Face</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-40 transition-transform duration-300
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar 
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Overlay for mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pt-0 pt-16">
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 overflow-auto">
          {/* Mobile Header Space */}
          <div className="md:hidden h-4"></div>

          {/* REMOVED: Mobile Page Title Bar with duplicate menu icon */}

          {/* Page Header */}
          <div className={`bg-gradient-to-r ${pageColor} rounded-3xl p-6 md:p-8 text-white shadow-xl mb-6 md:mb-8`}>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">
              {pageTitle}
            </h1>
            <p className="text-blue-100 text-sm md:text-lg">
              {pageDescription}
            </p>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;