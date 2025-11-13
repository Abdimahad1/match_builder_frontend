// pages/Report.jsx
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { useState } from 'react';

const Report = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const developerInfo = {
    name: "Your Name",
    title: "Full Stack Developer",
    location: "Your City, Country",
    phone: "+1234567890",
    email: "your.email@domain.com",
    skills: ["React", "Node.js", "JavaScript", "TypeScript", "UI/UX Design"],
    experience: "5+ Years",
    projects: "50+ Completed"
  };

  return (
    <PageLayout
      pageTitle="Developer Profile"
      pageDescription="Passionate developer creating amazing digital experiences"
      pageColor="from-blue-500 to-purple-600"
    >
      {/* Main Profile Card */}
      <motion.div
        className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 mx-4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Profile Header with 3D Animation */}
        <motion.div 
          className="text-center py-6"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1 shadow-lg"
            animate={{ 
              rotateY: isFlipped ? 180 : 0,
            }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img 
                src="/src/assets/developer-image.jpg" 
                alt="Developer"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full bg-gradient-to-br from-blue-200 to-purple-300 rounded-full flex items-center justify-center text-4xl">
                👨‍💻
              </div>
            </div>
          </motion.div>
          
          <motion.h2 
            className="text-2xl md:text-3xl font-bold text-slate-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {developerInfo.name}
          </motion.h2>
          
          <motion.p 
            className="text-purple-600 font-semibold text-lg mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {developerInfo.title}
          </motion.p>
        </motion.div>

        {/* Info Cards in Row Layout (Mobile Friendly) */}
        <div className="space-y-4">
          {/* Contact Info Card */}
          <motion.div
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                <span className="text-white text-lg">📱</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Contact Info</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📍</span>
                <span className="text-slate-700">{developerInfo.location}</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">📞</span>
                <span className="text-slate-700">{developerInfo.phone}</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">✉️</span>
                <span className="text-slate-700 text-sm">{developerInfo.email}</span>
              </div>
            </div>
          </motion.div>

          {/* Skills Card */}
          <motion.div
            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100 shadow-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                <span className="text-white text-lg">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Skills & Expertise</h3>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {developerInfo.skills.map((skill, index) => (
                <motion.span
                  key={skill}
                  className="bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-700 border border-purple-200 shadow-sm"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Experience Card */}
          <motion.div
            className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-5 border border-green-100 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                <span className="text-white text-lg">🚀</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Experience</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                className="text-center p-3 bg-white rounded-xl shadow-sm border"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl mb-1">📅</div>
                <div className="font-bold text-slate-800">{developerInfo.experience}</div>
                <div className="text-xs text-slate-600">Experience</div>
              </motion.div>
              
              <motion.div 
                className="text-center p-3 bg-white rounded-xl shadow-sm border"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl mb-1">💼</div>
                <div className="font-bold text-slate-800">{developerInfo.projects}</div>
                <div className="text-xs text-slate-600">Projects</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            className="text-center pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <motion.button
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              Connect With Me
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Report;