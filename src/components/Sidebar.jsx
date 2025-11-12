import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname.replace('/', '') || 'dashboard';

  const username = localStorage.getItem('username') || 'Unknown';
  const role = localStorage.getItem('role') || 'player'; // 'admin' or 'player'

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'from-blue-500 to-cyan-500' },
    { id: 'match', label: 'Match', icon: '⚽', color: 'from-green-500 to-emerald-500' },
    { id: 'leagues', label: 'Leagues', icon: '🏆', color: 'from-yellow-500 to-orange-500' },
    { id: 'settings', label: 'Settings', icon: '⚙️', color: 'from-gray-500 to-gray-700' },
    { id: 'report', label: 'Report Issue', icon: '🐛', color: 'from-red-500 to-pink-500' },
    ...(role === 'admin' ? [
      { id: 'admin', label: 'Admin', icon: '👑', color: 'from-purple-500 to-pink-500' }
    ] : [])
  ];

  const handlePageChange = (pageId) => {
    navigate(`/${pageId}`);
    if (window.innerWidth < 768) onMobileClose();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true }); // Redirect directly to login
  };

  const isMobile = window.innerWidth < 768;

  return (
    <motion.div
      className={`bg-gradient-to-b from-slate-900 to-slate-800 text-white relative transition-all duration-300 h-screen ${
        isCollapsed && !isMobile ? 'w-20' : 'w-64'
      } ${isMobile ? 'w-64' : ''}`}
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      {isMobile && (
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors z-10"
        >
          ✕
        </button>
      )}

      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-slate-800 hover:bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center border-2 border-slate-600 transition-all duration-300 z-10"
        >
          <motion.span
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isCollapsed ? '→' : '←'}
          </motion.span>
        </button>
      )}

      <div className="p-6 border-b border-slate-700 pt-16 md:pt-6">
        <motion.div className="flex flex-col items-center space-y-3" layout>
          <motion.div
            className="relative"
            whileHover={{ scale: isMobile ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              👤
            </div>
            <motion.div
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-900"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <h3 className="font-bold text-lg">{role === 'admin' ? 'Admin' : 'Player'}</h3>
                <p className="text-slate-400 text-sm">
                  {role === 'admin' ? `${username} ID: ${username}` : `Player ID: ${username}`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            onClick={() => handlePageChange(item.id)}
            className={`w-full flex items-center rounded-xl p-3 transition-all duration-300 group relative overflow-hidden ${
              activePage === item.id
                ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            whileHover={{ scale: isMobile ? 1 : 1.02, x: isMobile ? 0 : 8 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {activePage === item.id && (
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                layoutId="activeIndicator"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            <motion.span
              className={`text-xl ${(isCollapsed && !isMobile) ? '' : 'mr-3'}`}
              animate={{ scale: activePage === item.id ? 1.2 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {item.icon}
            </motion.span>

            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.span
                  className="font-medium whitespace-nowrap"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </nav>

      <div className="absolute bottom-6 left-4 right-4">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center rounded-xl p-3 bg-red-600 hover:bg-red-500 shadow-lg text-white font-semibold"
        >
          🔒 {!isCollapsed || isMobile ? 'Logout' : ''}
        </button>
      </div>

      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-6 shadow-2xl w-80 text-center text-white"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <p className="text-xl font-bold mb-4">Are you sure you want to log out?</p>
              <div className="flex justify-around">
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 rounded-lg bg-white text-red-600 font-bold hover:bg-gray-100"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-bold hover:bg-gray-300"
                >
                  No
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Sidebar;
