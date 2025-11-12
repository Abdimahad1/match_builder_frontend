// components/MainContent.jsx
import { motion } from 'framer-motion';

const MainContent = ({ activePage, onMenuToggle }) => {
  const pageTitles = {
    dashboard: 'Dashboard Overview',
    match: 'Match Center',
    leagues: 'Leagues & Tournaments',
    settings: 'Settings & Preferences',
    report: 'Report an Issue'
  };

  const pageColors = {
    dashboard: 'from-blue-500 to-cyan-500',
    match: 'from-green-500 to-emerald-500',
    leagues: 'from-yellow-500 to-orange-500',
    settings: 'from-gray-500 to-gray-700',
    report: 'from-red-500 to-pink-500'
  };

  const pageDescriptions = {
    dashboard: 'Welcome to your dashboard! Here you can overview your team performance, upcoming matches, and league standings.',
    match: 'Manage your matches, view schedules, and track live scores. Stay updated with all match-related activities.',
    leagues: 'Explore different leagues, tournaments, and competitions. Join new leagues and track your progress.',
    settings: 'Customize your experience, manage your profile, and configure app preferences.',
    report: 'Found an issue? Let us know! We\'re here to help improve your experience.'
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 overflow-auto">
      {/* Mobile Header Space */}
      <div className="md:hidden h-4"></div>

      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Mobile Page Title Bar */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg bg-white shadow-md text-slate-700"
          >
            ☰
          </button>
          <h1 className="text-xl font-bold text-slate-800">
            {pageTitles[activePage].split(' ')[0]}
          </h1>
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>

        {/* Header */}
        <div className={`bg-gradient-to-r ${pageColors[activePage]} rounded-3xl p-6 md:p-8 text-white shadow-xl mb-6 md:mb-8`}>
          <motion.h1 
            className="text-2xl md:text-4xl font-bold mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {pageTitles[activePage]}
          </motion.h1>
          <motion.p 
            className="text-blue-100 text-sm md:text-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {pageDescriptions[activePage]}
          </motion.p>
        </div>

        {/* Content Card */}
        <motion.div
          className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-slate-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center py-8 md:py-12">
            <motion.div
              className="text-4xl md:text-6xl mb-4 md:mb-6"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              {activePage === 'dashboard' && '📊'}
              {activePage === 'match' && '⚽'}
              {activePage === 'leagues' && '🏆'}
              {activePage === 'settings' && '⚙️'}
              {activePage === 'report' && '🐛'}
            </motion.div>
            
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 md:mb-4">
              Welcome to {pageTitles[activePage]}!
            </h2>
            
            <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto mb-4 md:mb-6">
              This section is actively being developed with amazing features for the Face2Face League experience.
            </p>

            {/* Quick Actions for Mobile */}
            <div className="md:hidden grid grid-cols-2 gap-3 mb-6 max-w-xs mx-auto">
              <button className="bg-blue-500 text-white py-2 px-3 rounded-xl text-sm font-medium">
                Quick Action
              </button>
              <button className="bg-green-500 text-white py-2 px-3 rounded-xl text-sm font-medium">
                View Stats
              </button>
            </div>

            {/* Progress indicator */}
            <motion.div 
              className="mt-6 md:mt-8 max-w-md mx-auto bg-slate-200 rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.6, duration: 1 }}
            >
              <motion.div 
                className={`h-2 rounded-full bg-gradient-to-r ${pageColors[activePage]}`}
                initial={{ width: "0%" }}
                animate={{ width: "65%" }}
                transition={{ delay: 1, duration: 2 }}
              />
            </motion.div>
            
            <motion.p 
              className="text-xs md:text-sm text-slate-500 mt-3 md:mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              65% developed - Exciting features coming soon!
            </motion.p>

            {/* Mobile Bottom Navigation Hint */}
            <div className="md:hidden mt-6 text-xs text-slate-400">
              💡 Tap the menu icon to navigate
            </div>
          </div>
        </motion.div>

        {/* Mobile Quick Stats */}
        <div className="md:hidden grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white rounded-2xl p-3 shadow-md text-center">
            <div className="text-lg">⚽</div>
            <div className="text-xs text-slate-600">Matches</div>
            <div className="font-bold text-slate-800">12</div>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-md text-center">
            <div className="text-lg">🏆</div>
            <div className="text-xs text-slate-600">Leagues</div>
            <div className="font-bold text-slate-800">3</div>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-md text-center">
            <div className="text-lg">⭐</div>
            <div className="text-xs text-slate-600">Points</div>
            <div className="font-bold text-slate-800">156</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MainContent;