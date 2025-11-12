// pages/Report.jsx
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';

const Report = () => {
  return (
    <PageLayout
      pageTitle="Report an Issue"
      pageDescription="Found an issue? Let us know! We're here to help improve your experience."
      pageColor="from-red-500 to-pink-500"
    >
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
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
            }}
          >
            🐛
          </motion.div>
          
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 md:mb-4">
            Report Issue
          </h2>
          
          <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto">
            Help us improve by reporting any issues you encounter.
          </p>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Report;