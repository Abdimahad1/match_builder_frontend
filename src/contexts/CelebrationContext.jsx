import React, { createContext, useContext, useState, useEffect } from 'react';

const CelebrationContext = createContext();

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
};

export const CelebrationProvider = ({ children }) => {
  const [celebratingWinners, setCelebratingWinners] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentCelebration, setCurrentCelebration] = useState(null);
  const [userDismissedCelebrations, setUserDismissedCelebrations] = useState(new Set());

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchCelebratingWinners = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/leagues/winners/celebrating`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCelebratingWinners(data.data);
          
          // Show celebration if there are winners and user hasn't dismissed them
          if (data.data.length > 0) {
            const firstCelebration = data.data[0];
            const celebrationKey = `${firstCelebration._id}_${firstCelebration.winner.teamName}`;
            
            if (!userDismissedCelebrations.has(celebrationKey)) {
              setCurrentCelebration(firstCelebration);
              setShowCelebration(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching celebrating winners:', error);
    }
  };

  const dismissCelebration = (celebrationId, teamName) => {
    const celebrationKey = `${celebrationId}_${teamName}`;
    setUserDismissedCelebrations(prev => new Set([...prev, celebrationKey]));
    setShowCelebration(false);
    setCurrentCelebration(null);
  };

  const dismissAllCelebrations = () => {
    celebratingWinners.forEach(celebration => {
      const celebrationKey = `${celebration._id}_${celebration.winner.teamName}`;
      setUserDismissedCelebrations(prev => new Set([...prev, celebrationKey]));
    });
    setShowCelebration(false);
    setCurrentCelebration(null);
  };

  useEffect(() => {
    fetchCelebratingWinners();
    
    // Poll for new celebrations every 30 seconds
    const interval = setInterval(fetchCelebratingWinners, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    celebratingWinners,
    showCelebration,
    currentCelebration,
    dismissCelebration,
    dismissAllCelebrations,
    refetchCelebrations: fetchCelebratingWinners
  };

  return (
    <CelebrationContext.Provider value={value}>
      {children}
    </CelebrationContext.Provider>
  );
};