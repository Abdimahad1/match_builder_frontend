// pages/Loading.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Loading({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [team, setTeam] = useState('');
  const [answers, setAnswers] = useState({});
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentCelebration, setCurrentCelebration] = useState('');
  const audioCacheRef = useRef({});
  const timeoutsRef = useRef([]);

  const questions = [
    {
      id: 1,
      question: "What's your football spirit animal? 🦁",
      options: [
        { text: "Lion - Fearless leader", animal: "lion" },
        { text: "Cheetah - Speed demon", animal: "cheetah" },
        { text: "Eagle - Strategic vision", animal: "eagle" },
        { text: "Wolf - Team player", animal: "wolf" }
      ]
    },
    {
      id: 2,
      question: "On match day, you're mostly... ⚽",
      options: [
        { text: "The hype man 🎉", animal: "monkey" },
        { text: "The strategist 🧠", animal: "owl" },
        { text: "The calm supporter 😌", animal: "dolphin" },
        { text: "The nervous wreck 😅", animal: "rabbit" }
      ]
    },
    {
      id: 3,
      question: "Favorite celebration dance? 💃",
      options: [
        { text: "The classic knee slide", animal: "tiger" },
        { text: "Backflip (in my dreams)", animal: "kangaroo" },
        { text: "Point to the sky 🙏", animal: "elephant" },
        { text: "Team group hug 🫂", animal: "penguin" }
      ]
    }
  ];

  const teams = [
    { name: "Thunder Strikers ⚡", color: "from-yellow-400 to-orange-500" },
    { name: "Blue Phoenix 🔥", color: "from-blue-500 to-purple-600" },
    { name: "Golden Lions 🦁", color: "from-amber-500 to-red-500" },
    { name: "Forest Rangers 🌲", color: "from-green-500 to-emerald-600" }
  ];

  const animalAnimations = {
    lion: { emoji: "🦁", sound: "ROAR!", color: "from-yellow-400 to-orange-500" },
    cheetah: { emoji: "🐆", sound: "ZOOM!", color: "from-orange-400 to-yellow-500" },
    eagle: { emoji: "🦅", sound: "SCREECH!", color: "from-blue-400 to-gray-600" },
    wolf: { emoji: "🐺", sound: "HOWL!", color: "from-gray-400 to-blue-600" },
    monkey: { emoji: "🐵", sound: "OO OO!", color: "from-brown-400 to-yellow-500" },
    owl: { emoji: "🦉", sound: "HOOT!", color: "from-brown-400 to-orange-300" },
    dolphin: { emoji: "🐬", sound: "CLICK!", color: "from-blue-300 to-blue-500" },
    rabbit: { emoji: "🐇", sound: "SQUEAK!", color: "from-white to-gray-300" },
    tiger: { emoji: "🐯", sound: "GROWL!", color: "from-orange-500 to-black" },
    kangaroo: { emoji: "🦘", sound: "BOING!", color: "from-brown-300 to-orange-400" },
    elephant: { emoji: "🐘", sound: "TRUMPET!", color: "from-gray-400 to-gray-600" },
    penguin: { emoji: "🐧", sound: "HONK!", color: "from-black to-blue-500" }
  };

  const animalSounds = {
    lion: 'https://cdn.pixabay.com/download/audio/2022/01/13/audio_d2332d17b4.mp3?filename=lion-roar-6002.mp3',
    cheetah: 'https://cdn.pixabay.com/download/audio/2021/08/08/audio_6f9bdb646d.mp3?filename=cheetah-growl-6325.mp3',
    eagle: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_4b8805a97f.mp3?filename=eagle-cry-6341.mp3',
    wolf: 'https://cdn.pixabay.com/download/audio/2021/08/08/audio_1bc105b956.mp3?filename=wolf-howl-6320.mp3',
    monkey: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_3c696bcb67.mp3?filename=monkeys-6343.mp3',
    owl: 'https://cdn.pixabay.com/download/audio/2021/08/06/audio_50187f20b3.mp3?filename=owl-hoot-6287.mp3',
    dolphin: 'https://cdn.pixabay.com/download/audio/2022/02/14/audio_3e1dba87c1.mp3?filename=dolphin-sound-effect-10140.mp3',
    rabbit: 'https://cdn.pixabay.com/download/audio/2022/10/10/audio_507c3fd01a.mp3?filename=small-creature-squeak-122130.mp3',
    tiger: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_5bb5a7ab6d.mp3?filename=tiger-guttural-roar-6225.mp3',
    kangaroo: 'https://cdn.pixabay.com/download/audio/2022/03/13/audio_d5112019ba.mp3?filename=bounce-cartoon-112997.mp3',
    elephant: 'https://cdn.pixabay.com/download/audio/2021/08/08/audio_74fd9f5d9b.mp3?filename=elephant-call-6318.mp3',
    penguin: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_400f3d5c7a.mp3?filename=penguin-calls-6340.mp3'
  };

  const scheduleTimeout = (callback, delay) => {
    const timeoutId = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId);
      callback();
    }, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  };

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  };

  const playAnimalSound = (animal) => {
    const soundUrl = animalSounds[animal];
    if (!soundUrl) return;

    let audio = audioCacheRef.current[animal];
    if (!audio) {
      audio = new Audio(soundUrl);
      audio.crossOrigin = 'anonymous';
      audioCacheRef.current[animal] = audio;
    }

    try {
      audio.currentTime = 0;
      audio.play().catch(() => {
        const fallback = new Audio(soundUrl);
        fallback.crossOrigin = 'anonymous';
        fallback.play().catch(() => {});
      });
    } catch {
      // ignore audio failures
    }
  };

  useEffect(() => {
    if (showWelcome) {
      const timer = scheduleTimeout(() => setShowWelcome(false), 3000);
      return () => {
        clearTimeout(timer);
        timeoutsRef.current = timeoutsRef.current.filter(id => id !== timer);
      };
    }
  }, [showWelcome]);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
      Object.values(audioCacheRef.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  const handleAnswer = (answer, animal) => {
    playAnimalSound(animal);
    setAnswers(prev => ({ ...prev, [currentStep]: answer }));
    setCurrentCelebration(animal);
    setShowCelebration(true);

    scheduleTimeout(() => {
      setShowCelebration(false);
      if (currentStep < questions.length - 1) {
        scheduleTimeout(() => setCurrentStep(prev => prev + 1), 500);
      } else {
        // After last question, assign a team based on answers
        scheduleTimeout(() => {
          const randomTeam = teams[Math.floor(Math.random() * teams.length)];
          setTeam(randomTeam.name);
        }, 500);
      }
    }, 2000);
  };

  const handleEnterLeague = () => {
    // Call the onComplete prop to signal that loading is done
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    clearAllTimeouts();
    Object.values(audioCacheRef.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    if (onComplete) {
      onComplete();
    }
  };

  const SkipButton = () => (
    <button
      onClick={handleSkip}
      className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-semibold hover:bg-black/60 transition"
    >
      <span>Skip Intro</span>
      <span className="text-lg">⏭️</span>
    </button>
  );

  if (showWelcome) {
    return (
      <motion.div 
        className="relative min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <SkipButton />
        <motion.div
          className="text-center text-white"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <motion.h1 
            className="text-6xl font-bold mb-6"
            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⚽
          </motion.h1>
          <motion.h2 
            className="text-4xl font-bold mb-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Welcome to Face2Face League!
          </motion.h2>
          <motion.p 
            className="text-xl opacity-90"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            Get ready for the ultimate football experience!
          </motion.p>
          <motion.div
            className="mt-8 w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </motion.div>
    );
  }

  if (showCelebration) {
    const animal = animalAnimations[currentCelebration];
    return (
      <motion.div 
        className="relative min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <SkipButton />
        <div className="text-center text-white">
          {/* Animal running across screen */}
          <motion.div
            className="text-8xl mb-8"
            initial={{ x: -200, scale: 0.5, opacity: 0 }}
            animate={{ x: 200, scale: 1.5, opacity: 1 }}
            transition={{ 
              x: { duration: 1, ease: "easeOut" },
              scale: { duration: 0.5 },
              opacity: { duration: 0.5 }
            }}
          >
            {animal.emoji}
          </motion.div>
          
          <motion.h2
            className="text-6xl font-bold mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            {animal.sound}
          </motion.h2>
          
          <motion.p
            className="text-2xl opacity-90"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Amazing choice! 
          </motion.p>

          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {['⭐', '🎉', '🔥', '💫', '✨'][i % 5]}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (team) {
    return (
      <motion.div 
        className="relative min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <SkipButton />
        <motion.div
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <motion.div
            className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🏆
          </motion.div>
          
          <motion.h2 
            className="text-3xl font-bold text-gray-800 mb-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Welcome to Team {team}!
          </motion.h2>
          
          <motion.p 
            className="text-gray-600 mb-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Based on your legendary football spirit, you've been assigned to {team}. Get ready to dominate the league! ⚽
          </motion.p>

          <motion.div
            className="space-y-4 mb-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex justify-between text-sm text-gray-500">
              <span>⚡ Team Spirit</span>
              <span>MAX LEVEL</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 1 }}
              />
            </div>
          </motion.div>

          <motion.button
            onClick={handleEnterLeague}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Enter The League 🚀
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentStep];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <SkipButton />
      <div className="max-w-lg w-full">
        {/* Progress Bar */}
        <motion.div 
          className="flex justify-between mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {questions.map((_, index) => (
            <motion.div
              key={index}
              className={`w-8 h-2 rounded-full ${
                index <= currentStep ? 'bg-white' : 'bg-white/30'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="bg-white rounded-3xl p-8 shadow-2xl"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <motion.h2 
              className="text-2xl font-bold text-gray-800 mb-6 text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {currentQuestion.question}
            </motion.h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswer(option.text, option.animal)}
                  className="w-full p-4 text-left bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  <span className="font-medium text-gray-800">{option.text}</span>
                </motion.button>
              ))}
            </div>

            <motion.div 
              className="mt-6 text-center text-gray-500 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Question {currentStep + 1} of {questions.length}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}