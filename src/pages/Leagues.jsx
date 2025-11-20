// pages/Leagues.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { LeagueIconDisplay } from '../utils/leagueIcons';
import { Crown, Trophy, Star, Award } from 'lucide-react';
import { useCelebration } from '../contexts/CelebrationContext';
import CelebrationModal from '../components/CelebrationModal';

const API_URL = import.meta.env.VITE_API_URL;

const months = [
  { id: 'all', name: 'All Months' },
  { id: 'jan', name: 'January' },
  { id: 'feb', name: 'February' },
  { id: 'mar', name: 'March' },
  { id: 'apr', name: 'April' },
  { id: 'may', name: 'May' },
  { id: 'jun', name: 'June' },
  { id: 'jul', name: 'July' },
  { id: 'aug', name: 'August' },
  { id: 'sep', name: 'September' },
  { id: 'oct', name: 'October' },
  { id: 'nov', name: 'November' },
  { id: 'dec', name: 'December' }
];

const weeks = [
  { id: 'all', name: 'All Weeks' },
  { id: '1', name: 'Week 1' },
  { id: '2', name: 'Week 2' },
  { id: '3', name: 'Week 3' },
  { id: '4', name: 'Week 4' }
];

const monthIds = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Enhanced function to get team logo with proper fallbacks
const getTeamLogo = (teamName, league, userTeamName = '') => {
  if (!teamName) {
    return `https://api.dicebear.com/7.x/shapes/svg?seed=unknown&backgroundColor=blue,green,yellow,red,purple&size=80`;
  }

  const normalizedTeamName = teamName.trim().toLowerCase();

  // First, check if this is the user's team and we have user settings
  if (userTeamName && normalizedTeamName === userTeamName.trim().toLowerCase()) {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const userObj = JSON.parse(userData);
        const userSelectedTeam = userObj?.settings?.selectedTeam;
        if (userSelectedTeam?.logoUrl) {
          return userSelectedTeam.logoUrl;
        }
      }
    } catch (err) {
      console.error("Error reading user settings for team logo", err);
    }
  }

  // Check in league participants for team logo
  const participant = league?.participants?.find(
    p => p.teamName && p.teamName.trim().toLowerCase() === normalizedTeamName
  );
  
  if (participant?.teamLogoUrl || participant?.teamLogo) {
    return participant.teamLogoUrl || participant.teamLogo;
  }

  // Check in league teams (if any)
  const leagueTeam = league?.teams?.find(
    team => team.name && team.name.trim().toLowerCase() === normalizedTeamName
  );
  if (leagueTeam?.logoUrl || leagueTeam?.logo) {
    return leagueTeam.logoUrl || leagueTeam.logo;
  }

  // Fallback to dicebear with team-specific colors
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=blue,green,yellow,red,purple&size=80`;
};

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const buildStandings = (league, userTeamName = '') => {
  if (!league) return [];
  const userNormalized = normalize(userTeamName);

  if (Array.isArray(league.teams) && league.teams.length > 0) {
    const sorted = [...league.teams].sort((a, b) => {
      const pointsDiff = (b.points ?? 0) - (a.points ?? 0);
      if (pointsDiff !== 0) return pointsDiff;
      const diffA = a.goalDifference ?? (a.goalsFor ?? 0) - (a.goalsAgainst ?? 0);
      const diffB = b.goalDifference ?? (b.goalsFor ?? 0) - (b.goalsAgainst ?? 0);
      if (diffA !== diffB) return diffB - diffA;
      const goalsDiff = (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
      if (goalsDiff !== 0) return goalsDiff;
      return normalize(a.name).localeCompare(normalize(b.name));
    });

    return sorted.map((team, index) => {
      const name = team.name || `Team ${index + 1}`;
      return {
        position: index + 1,
        team: name,
        played: team.played ?? 0,
        won: team.won ?? 0,
        drawn: team.drawn ?? 0,
        lost: team.lost ?? 0,
        goalsFor: team.goalsFor ?? 0,
        goalsAgainst: team.goalsAgainst ?? 0,
        goalDifference:
          team.goalDifference ?? (team.goalsFor ?? 0) - (team.goalsAgainst ?? 0),
        points: team.points ?? 0,
        isUserTeam: userNormalized && normalize(name) === userNormalized,
        logo: getTeamLogo(name, league, userTeamName)
      };
    });
  }

  const participants = Array.isArray(league.participants) ? [...league.participants] : [];

  return participants
    .sort((a, b) => normalize(a.teamName).localeCompare(normalize(b.teamName)))
    .map((participant, index) => {
      const name = participant.teamName || `Team ${index + 1}`;
      return {
        position: index + 1,
        team: name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        isUserTeam: userNormalized && normalize(name) === userNormalized,
        logo: getTeamLogo(name, league, userTeamName)
      };
    });
};

const Leagues = () => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLeagueId, setActiveLeagueId] = useState(null);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [user, setUser] = useState(null);
  const [celebratingWinners, setCelebratingWinners] = useState([]);
  const [settingWinner, setSettingWinner] = useState(null);

  // Celebration context
  const { 
    showCelebration, 
    currentCelebration, 
    dismissCelebration,
    dismissAllCelebrations 
  } = useCelebration();

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check if user is admin of a league
  const checkIfUserIsAdmin = useCallback((league) => {
    if (!user || !league) return false;
    
    const userId = user._id || user.id;
    const leagueAdminId = league.admin?._id || league.admin;
    
    // Convert both to string for comparison (handles ObjectId and string)
    return userId && leagueAdminId && userId.toString() === leagueAdminId.toString();
  }, [user]);

  // Fetch celebrating winners
  const fetchCelebratingWinners = useCallback(async () => {
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
        }
      }
    } catch (error) {
      console.error('Error fetching celebrating winners:', error);
    }
  }, []);

  const fetchLeaguesData = useCallback(async ({ showSpinner = false } = {}) => {
    try {
      if (showSpinner) setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/leagues`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const data = await res.json();
      if (!isMountedRef.current) return data;
      if (!data.success) {
        if (showSpinner) setError(data.message || 'Failed to fetch leagues');
        setLeagues([]);
        return data;
      }
      const leagueList = Array.isArray(data.data) ? data.data : [];
      setLeagues(leagueList);
      setActiveLeagueId(prev => {
        if (prev && leagueList.some(league => league._id === prev)) {
          return prev;
        }
        return leagueList.length > 0 ? leagueList[0]._id : null;
      });
      setError(null);

      // Fetch celebrating winners
      await fetchCelebratingWinners();

      return data;
    } catch (err) {
      console.error('Error fetching leagues:', err);
      if (isMountedRef.current) {
        if (showSpinner) setError(err.message || 'Unable to load leagues');
        setLeagues([]);
      }
      return null;
    } finally {
      if (showSpinner && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchCelebratingWinners]);

  // Set winner function with admin check
  const handleSetWinner = useCallback(async (leagueId, teamName, teamLogo = '') => {
    const league = leagues.find(l => l._id === leagueId);
    
    // Check if user is admin of this league
    if (!checkIfUserIsAdmin(league)) {
      setError('Only the league admin can set the winner');
      return;
    }

    setSettingWinner(leagueId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/leagues/${leagueId}/set-winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          teamName,
          teamLogo
        })
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Only admin can set winner');
        }
        throw new Error('Failed to set winner');
      }
      
      const data = await response.json();
      if (data.success) {
        // Refresh leagues data
        await fetchLeaguesData();
        setError(null);
      }
    } catch (error) {
      console.error('Error setting winner:', error);
      setError(error.message || 'Failed to set winner');
    } finally {
      setSettingWinner(null);
    }
  }, [leagues, checkIfUserIsAdmin, fetchLeaguesData]);

  // Set winner from standings
  const handleSetWinnerFromStandings = useCallback((team) => {
    if (!currentLeague) return;
    
    if (!checkIfUserIsAdmin(currentLeague)) {
      setError('Only the league admin can set the winner');
      return;
    }

    const confirmSet = window.confirm(`Set ${team.team} as league winner?`);
    if (confirmSet) {
      handleSetWinner(currentLeague._id, team.team, team.logo);
    }
  }, [currentLeague, checkIfUserIsAdmin, handleSetWinner]);

  useEffect(() => {
    fetchLeaguesData({ showSpinner: true });
    const intervalId = setInterval(() => {
      fetchLeaguesData();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [fetchLeaguesData]);

  const years = useMemo(() => {
    const uniqueYears = new Set();
    leagues.forEach((league) => {
      if (!league?.startDate) return;
      const start = new Date(league.startDate);
      if (!Number.isNaN(start.valueOf())) {
        uniqueYears.add(start.getFullYear());
      }
    });
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [leagues]);

  const filteredLeagues = useMemo(() => {
    return leagues.filter((league) => {
      const startDate = league?.startDate ? new Date(league.startDate) : null;
      const validDate = startDate && !Number.isNaN(startDate.valueOf());
      const matchesYear =
        selectedYear === 'all' || (validDate && startDate.getFullYear() === Number(selectedYear));
      const matchesMonth =
        selectedMonth === 'all' || (validDate && monthIds[startDate.getMonth()] === selectedMonth);
      return matchesYear && matchesMonth;
    });
  }, [leagues, selectedYear, selectedMonth]);

  useEffect(() => {
    if (filteredLeagues.length === 0) {
      setActiveLeagueId(null);
      return;
    }
    if (!activeLeagueId) {
      setActiveLeagueId(filteredLeagues[0]._id);
      return;
    }
    const exists = filteredLeagues.some((league) => league._id === activeLeagueId);
    if (!exists) {
      setActiveLeagueId(filteredLeagues[0]._id);
    }
  }, [filteredLeagues, activeLeagueId]);

  const currentLeague = useMemo(() => {
    return (
      filteredLeagues.find((league) => league._id === activeLeagueId) ||
      filteredLeagues[0] ||
      null
    );
  }, [filteredLeagues, activeLeagueId]);

  const userId = user?._id || user?.id;
  const userParticipant = useMemo(() => {
    if (!currentLeague || !userId) return null;
    return (
      currentLeague.participants?.find((participant) => {
        const participantId =
          participant.userId?._id || participant.userId?.id || participant.userId;
        return participantId && participantId.toString() === userId.toString();
      }) || null
    );
  }, [currentLeague, userId]);

  const standings = useMemo(() => {
    return buildStandings(currentLeague, userParticipant?.teamName);
  }, [currentLeague, userParticipant]);

  const totalMatches = currentLeague?.matches?.length || 0;
  const playedMatches = currentLeague?.matches?.filter((match) => match.played)?.length || 0;
  const remainingMatches = Math.max(totalMatches - playedMatches, 0);
  const matchdayDisplay = totalMatches > 0 ? playedMatches : 0;

  const seasonYears = years.length > 0 ? years : [];
  const userTeam = standings.find((team) => team.isUserTeam);
  const description =
    currentLeague?.description ||
    (currentLeague?.admin?.username
      ? `Managed by ${currentLeague.admin.username}`
      : 'Community league');

  const noLeaguesAvailable = !loading && !error && leagues.length === 0;
  const noFilteredLeagues =
    !loading && !error && leagues.length > 0 && filteredLeagues.length === 0;

  // Calculate days left for celebration
  const getDaysLeft = (celebrationEnds) => {
    const endDate = new Date(celebrationEnds);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Check if current league has a celebrating winner
  const currentLeagueWinner = useMemo(() => {
    if (!currentLeague || !currentLeague.isCelebrating) return null;
    return currentLeague.winner;
  }, [currentLeague]);

  // Check if user is admin of current league
  const isCurrentLeagueAdmin = useMemo(() => {
    return checkIfUserIsAdmin(currentLeague);
  }, [currentLeague, checkIfUserIsAdmin]);

  return (
    <PageLayout
      pageTitle="Leagues & Tournaments"
      pageDescription="Explore different leagues, tournaments, and competitions. Track standings and your team's progress."
      pageColor="from-yellow-500 to-orange-500"
    >
      {/* Celebration Modal */}
      <CelebrationModal
        celebration={currentCelebration}
        onDismiss={() => dismissCelebration(currentCelebration?._id, currentCelebration?.winner.teamName)}
      />

      {loading && (
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 mb-6 text-center text-slate-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
            <div>Fetching leagues…</div>
          </div>
        </motion.div>
      )}

      {!loading && error && (
        <motion.div
          className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-red-800">Error Loading Leagues</h3>
              <p>{error}</p>
            </div>
            <button
              onClick={() => fetchLeaguesData({ showSpinner: true })}
              className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </motion.div>
      )}

      {noLeaguesAvailable && (
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No leagues available yet</h2>
          <p className="text-slate-600">
            Leagues created by administrators will appear here with live stats and standings.
          </p>
        </motion.div>
      )}

      {noFilteredLeagues && (
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No leagues for selected filters</h2>
          <p className="text-slate-600">Try choosing a different year or month.</p>
          <button
            onClick={() => {
              setSelectedYear('all');
              setSelectedMonth('all');
              setSelectedWeek('all');
            }}
            className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-full hover:bg-slate-900 transition-colors"
          >
            Reset Filters
          </button>
        </motion.div>
      )}

      {currentLeague && (
        <>
          {/* Admin Controls */}
          {isCurrentLeagueAdmin && (
            <motion.div
              className="bg-blue-50 border border-blue-200 rounded-3xl p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">League Admin Controls</span>
                </div>
                <div className="text-sm text-blue-600">
                  You are the admin of this league
                </div>
              </div>
              
              {/* Set Winner Button - Only show if no winner is set */}
              {!currentLeagueWinner && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-blue-100">
                  <p className="text-sm text-slate-600 mb-2">
                    Set the league winner from the standings below by clicking the crown icon next to a team.
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-full flex items-center justify-center">
                      <Crown className="w-2 h-2 text-yellow-600" />
                    </div>
                    <span>Click crown icon in standings to set winner</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Current Champions Banner for Active League */}
          {currentLeagueWinner && (
            <motion.div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-4 shadow-2xl text-white mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      {currentLeagueWinner.teamLogo ? (
                        <img 
                          src={currentLeagueWinner.teamLogo} 
                          alt={currentLeagueWinner.teamName}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(currentLeagueWinner.teamName)}&backgroundColor=yellow,orange,red&size=80`;
                          }}
                        />
                      ) : (
                        <Trophy className="w-8 h-8 text-yellow-200" />
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      🏆 LEAGUE CHAMPION
                    </h3>
                    <h4 className="text-xl font-bold text-white">
                      {currentLeagueWinner.teamName}
                    </h4>
                    <p className="text-yellow-200 text-sm font-medium flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      TAAJ CROWN PRINCE • {getDaysLeft(currentLeague.celebrationEnds)} day{getDaysLeft(currentLeague.celebrationEnds) !== 1 ? 's' : ''} left
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-yellow-500 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold">
                    CHAMPION
                  </div>
                  <p className="text-white/70 text-xs mt-1">
                    Crowned on {new Date(currentLeagueWinner.awardedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Leagues</h2>
              <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full">
                <span className="text-slate-600 text-sm">Season</span>
                <span className="text-slate-800 text-sm font-bold">
                  {selectedYear === 'all' ? seasonYears[0] ?? 'All' : selectedYear}
                </span>
              </div>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2">
              {filteredLeagues.map((league) => {
                const isCelebrating = league.isCelebrating && league.winner?.teamName;
                const isAdmin = checkIfUserIsAdmin(league);
                return (
                  <motion.button
                    key={league._id}
                    onClick={() => setActiveLeagueId(league._id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 relative ${
                      activeLeagueId === league._id
                        ? 'bg-slate-800 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isCelebrating && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Crown className="w-2 h-2 text-white" />
                      </div>
                    )}
                    {isAdmin && !isCelebrating && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Award className="w-2 h-2 text-white" />
                      </div>
                    )}
                    <LeagueIconDisplay
                      league={league}
                      size={32}
                      className="bg-white border-slate-200"
                    />
                    <span>{league.name}</span>
                    {isCelebrating && (
                      <span className="bg-yellow-500 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">
                        🏆
                      </span>
                    )}
                    {isAdmin && !isCelebrating && (
                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl p-4 shadow-2xl text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <LeagueIconDisplay
                  league={currentLeague}
                  size={56}
                  className="bg-white border-white/40"
                  rounded={false}
                />
                <div>
                  <h3 className="text-lg font-bold">{currentLeague.name}</h3>
                  <p className="text-white/80 text-sm line-clamp-2">{description}</p>
                  {currentLeagueWinner && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-white/20 rounded-full px-2 py-1 text-xs">
                        🏆 Champion: {currentLeagueWinner.teamName}
                      </div>
                    </div>
                  )}
                  {isCurrentLeagueAdmin && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-blue-500/80 rounded-full px-2 py-1 text-xs flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        You are Admin
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                  <span className="text-sm font-semibold">
                    Matchday {matchdayDisplay}/{totalMatches}
                  </span>
                </div>
                {currentLeague.status === 'completed' && (
                  <div className="mt-2 bg-green-500/80 rounded-full px-3 py-1 text-xs font-semibold">
                    COMPLETED
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="all">All Years</option>
                  {seasonYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {months.map((month) => (
                    <option key={month.id} value={month.id}>
                      {month.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Week</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {weeks.map((week) => (
                    <option key={week.id} value={week.id}>
                      {week.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {userTeam && (
            <motion.div
              className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    userTeam.position === 1 && currentLeagueWinner
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`}>
                    <span className="text-white font-bold text-sm">{userTeam.position}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <img 
                      src={userTeam.logo} 
                      alt={userTeam.team}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(userTeam.team)}&backgroundColor=blue,green&size=80`;
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-slate-800">Your Position</h4>
                      <p className="text-slate-600 text-sm">
                        {userTeam.team} • {userTeam.points} pts
                      </p>
                      {userTeam.position === 1 && currentLeagueWinner && (
                        <p className="text-yellow-600 text-xs font-bold flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          LEAGUE CHAMPION!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      userTeam.position === 1 && currentLeagueWinner
                        ? 'bg-yellow-100 text-yellow-800'
                        : userTeam.position <= 2
                        ? 'bg-green-100 text-green-800'
                        : userTeam.position <= 4
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {userTeam.position === 1 && currentLeagueWinner
                      ? 'CHAMPION'
                      : userTeam.position <= 2
                      ? 'Champions League'
                      : userTeam.position <= 4
                      ? 'Europa League'
                      : 'Mid Table'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">League Standings</h2>
              <div className="flex items-center space-x-2 text-slate-600">
                <span className="text-xs">P: Played</span>
                <span className="text-xs">GD: Goal Difference</span>
                <span className="text-xs">PTS: Points</span>
              </div>
            </div>

            {/* Updated standings header to accommodate logos */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 mb-2">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Team</div>
              <div className="col-span-1 text-center">P</div>
              <div className="col-span-1 text-center">W</div>
              <div className="col-span-1 text-center">D</div>
              <div className="col-span-1 text-center">L</div>
              <div className="col-span-1 text-center">GD</div>
              <div className="col-span-2 text-center">PTS</div>
            </div>

            <div className="space-y-1">
              {standings.map((team, index) => {
                const isChampion = team.position === 1 && currentLeagueWinner;
                const canSetWinner = isCurrentLeagueAdmin && !currentLeagueWinner;
                return (
                  <motion.div
                    key={team.position}
                    className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-xl border transition-all duration-300 ${
                      isChampion
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-sm'
                        : team.isUserTeam
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    } ${canSetWinner ? 'cursor-pointer hover:shadow-md' : ''}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: team.isUserTeam || isChampion || canSetWinner ? 1.02 : 1 }}
                    onClick={() => canSetWinner && handleSetWinnerFromStandings(team)}
                  >
                    <div className="col-span-1 flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isChampion
                            ? 'bg-yellow-500 text-white'
                            : team.position === 1
                            ? 'bg-yellow-100 text-yellow-800'
                            : team.position === 2
                            ? 'bg-slate-200 text-slate-800'
                            : team.position === 3
                            ? 'bg-orange-100 text-orange-800'
                            : team.position <= 4
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        } ${canSetWinner && team.position === 1 ? 'cursor-pointer hover:bg-yellow-200' : ''}`}
                      >
                        {isChampion ? (
                          <Crown className="w-3 h-3" />
                        ) : canSetWinner && team.position === 1 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetWinnerFromStandings(team);
                            }}
                            className="w-full h-full flex items-center justify-center hover:scale-110 transition-transform"
                            title="Set as winner"
                          >
                            <Crown className="w-3 h-3 text-yellow-600" />
                          </button>
                        ) : (
                          team.position
                        )}
                      </div>
                    </div>

                    <div className="col-span-4 flex items-center space-x-2">
                      <img 
                        src={team.logo} 
                        alt={team.team}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(team.team)}&backgroundColor=blue,green&size=80`;
                        }}
                      />
                      <span
                        className={`font-medium text-sm truncate ${
                          isChampion
                            ? 'text-yellow-700 font-bold'
                            : team.isUserTeam 
                            ? 'text-blue-700 font-bold' 
                            : 'text-slate-800'
                        }`}
                      >
                        {team.team}
                      </span>
                      {isChampion && (
                        <span className="ml-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          CHAMP
                        </span>
                      )}
                      {team.isUserTeam && !isChampion && (
                        <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                          YOU
                        </span>
                      )}
                      {canSetWinner && team.position === 1 && !isChampion && (
                        <span className="ml-1 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                          Set Winner
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 flex items-center justify-center">
                      <span className="text-sm text-slate-700">{team.played}</span>
                    </div>

                    <div className="col-span-1 flex items-center justify-center">
                      <span className="text-sm text-green-600 font-medium">{team.won}</span>
                    </div>

                    <div className="col-span-1 flex items-center justify-center">
                      <span className="text-sm text-yellow-600 font-medium">{team.drawn}</span>
                    </div>

                    <div className="col-span-1 flex items-center justify-center">
                      <span className="text-sm text-red-600 font-medium">{team.lost}</span>
                    </div>

                    <div className="col-span-1 flex items-center justify-center">
                      <span
                        className={`text-sm font-medium ${
                          team.goalDifference > 0
                            ? 'text-green-600'
                            : team.goalDifference < 0
                            ? 'text-red-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {team.goalDifference > 0 ? '+' : ''}
                        {team.goalDifference}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center justify-center">
                      <span className={`px-2 py-1 rounded-full text-sm font-bold min-w-8 text-center ${
                        isChampion
                          ? 'bg-yellow-500 text-white'
                          : 'bg-slate-800 text-white'
                      }`}>
                        {team.points}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 border border-yellow-600 rounded" />
                  <span className="font-bold">Champion</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
                  <span>1st Place</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded" />
                  <span>2nd Place</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded" />
                  <span>3rd Place</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded" />
                  <span>European Places</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-50 border-2 border-blue-300 border-dashed rounded" />
                  <span className="font-medium text-blue-700">Your Team</span>
                </div>
                {isCurrentLeagueAdmin && !currentLeagueWinner && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
                      <Crown className="w-2 h-2 text-yellow-600" />
                    </div>
                    <span className="font-medium text-yellow-700">Click to set winner</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-3">Season Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Matches Played</span>
                  <span>
                    {playedMatches}/{totalMatches}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <motion.div
                    className="bg-green-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${totalMatches > 0 ? (playedMatches / totalMatches) * 100 : 0}%` }}
                    transition={{ duration: 1, delay: 0.7 }}
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-slate-600 text-sm">
                  {remainingMatches} {remainingMatches === 1 ? 'match' : 'matches'} remaining this season
                </p>
              </div>
            </div>
          </motion.div>

          {/* Participants Section with Logos */}
          <motion.div
            className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-3">League Participants</h3>
            <div className="flex flex-wrap gap-3">
              {currentLeague.participants?.map((participant, index) => {
                const teamLogo = getTeamLogo(participant.teamName, currentLeague, userParticipant?.teamName);
                const isChampion = currentLeagueWinner && participant.teamName === currentLeagueWinner.teamName;
                return (
                  <div
                    key={participant._id || index}
                    className={`flex items-center space-x-2 rounded-full px-3 py-2 relative ${
                      isChampion
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300'
                        : participant.teamName === userParticipant?.teamName 
                        ? 'bg-blue-100 border border-blue-200' 
                        : 'bg-slate-100'
                    }`}
                  >
                    {isChampion && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Crown className="w-2 h-2 text-white" />
                      </div>
                    )}
                    <img 
                      src={teamLogo} 
                      alt={participant.teamName}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(participant.teamName)}&backgroundColor=blue,green&size=80`;
                      }}
                    />
                    <span className={`text-sm font-medium ${
                      isChampion ? 'text-yellow-700 font-bold' : ''
                    }`}>
                      {participant.teamName}
                    </span>
                    {isChampion && (
                      <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        🏆
                      </span>
                    )}
                    {participant.teamName === userParticipant?.teamName && !isChampion && (
                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </PageLayout>
  );
};

export default Leagues;