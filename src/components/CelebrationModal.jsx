import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Trophy, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

const CelebrationModal = ({ celebration, onDismiss }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onDismiss, 300);
    }, 8000); // Auto-dismiss after 8 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!celebration || !celebration.winner) return null;

  const handleDismiss = () => {
    setShow(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop - Highest z-index */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
            onClick={handleDismiss}
          />
          
          {/* Modal Container - Higher than backdrop */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            onClick={handleDismiss}
          >
            <div 
              className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 rounded-3xl p-8 max-w-md w-full mx-auto text-white text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button - Highest z-index within modal */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-[10001]"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Confetti Elements - Behind content */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl z-0">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-200 z-0"
                    initial={{ 
                      y: -100, 
                      x: Math.random() * 100 - 50,
                      opacity: 0,
                      rotate: 0
                    }}
                    animate={{ 
                      y: 500, 
                      opacity: [0, 1, 0],
                      rotate: 360 
                    }}
                    transition={{ 
                      duration: 2 + Math.random() * 2,
                      delay: Math.random() * 1,
                      repeat: Infinity 
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                    }}
                  >
                    <Star className="w-4 h-4" />
                  </motion.div>
                ))}
              </div>

              {/* Content - Above confetti but below close button */}
              <div className="relative z-10">
                {/* Crown Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 bg-gradient-to-r from-yellow-200 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-white"
                >
                  <Crown className="w-10 h-10 text-yellow-600" />
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold mb-2 text-white drop-shadow-lg"
                >
                  🏆 LEAGUE CHAMPION! 🏆
                </motion.h2>

                {/* League Name */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg font-semibold mb-4 text-white/90"
                >
                  {celebration.name}
                </motion.p>

                {/* Winner Team Logo and Name */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-4 mb-6"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-yellow-300">
                    {celebration.winner.teamLogo ? (
                      <img 
                        src={celebration.winner.teamLogo} 
                        alt={celebration.winner.teamName}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(celebration.winner.teamName)}&backgroundColor=yellow,orange,red&size=80`;
                        }}
                      />
                    ) : (
                      <Trophy className="w-8 h-8 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">
                      {celebration.winner.teamName}
                    </h3>
                    <p className="text-yellow-200 text-sm font-medium">
                      CROWNED CHAMPION! 👑
                    </p>
                  </div>
                </motion.div>

                {/* Celebration Message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-white/80 text-sm mb-6"
                >
                  Celebrating their incredible victory across the platform! 
                  The celebration continues for 3 days. Join in congratulating the champions!
                </motion.p>

                {/* TAAJ Crown Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2 mb-4"
                >
                  <Crown className="w-4 h-4" />
                  TAAJ CROWN PRINCE
                </motion.div>

                {/* Auto-dismiss notice */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-white/60 text-xs"
                >
                  This celebration will auto-dismiss in a few seconds
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CelebrationModal;