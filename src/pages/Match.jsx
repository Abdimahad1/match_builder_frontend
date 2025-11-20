// pages/Match.jsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "../components/PageLayout";
import axios from "axios";
import { LeagueIconDisplay } from "../utils/leagueIcons";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  Play,
  UserPlus,
  Copy,
  QrCode,
  CheckSquare,
  X,
  ChevronRight,
  Crown,
  UserCheck,
  Lock,
  CalendarDays,
  Edit3,
  Save,
  AlertCircle,
  MoreVertical,
  Award,
  Star
} from "lucide-react";
import { useCelebration } from "../contexts/CelebrationContext";
import CelebrationModal from "../components/CelebrationModal";

const tabs = [
  { id: "all", label: "All Matches", icon: "📅" },
  { id: "finished", label: "Finished", icon: "✅" },
  { id: "scheduled", label: "Scheduled", icon: "⏰" },
];

const API_URL = import.meta.env.VITE_API_URL;

const Match = () => {
  const [leagues, setLeagues] = useState([]);
  const [myLeagues, setMyLeagues] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [activeLeague, setActiveLeague] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [alert, setAlert] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [tempScores, setTempScores] = useState({});
  const [generatingMatches, setGeneratingMatches] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  const [myTeamName, setMyTeamName] = useState(null);
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false);
  const [celebratingWinners, setCelebratingWinners] = useState([]);

  // Celebration context
  const { 
    showCelebration, 
    currentCelebration, 
    dismissCelebration,
    dismissAllCelebrations 
  } = useCelebration();

  const userSelectedTeam = useMemo(() => {
    if (userSettings?.selectedTeam) {
      return userSettings.selectedTeam;
    }
    if (user?.settings?.selectedTeam) {
      return user.settings.selectedTeam;
    }
    try {
      const cachedUserRaw = localStorage.getItem('user');
      if (!cachedUserRaw) return null;
      const cachedUser = JSON.parse(cachedUserRaw);
      return cachedUser?.settings?.selectedTeam || null;
    } catch (err) {
      console.error("Failed to read cached user selected team", err);
      return null;
    }
  }, [userSettings, user]);

  // Get user info on component mount and auto-fill team name
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        setIsAdmin(userObj.role === 'admin');
        const settings = userObj.settings || null;
        setUserSettings(settings);
        const preferredTeamName = settings?.selectedTeam?.name || userObj.username || '';
        setTeamName(preferredTeamName || '');
      } catch (err) {
        console.error("Failed to parse cached user data for match page", err);
      }
    }
  }, []);

  const showAlert = useCallback((msg, success = false) => {
    setAlert({ msg, success });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const fetchLeagueData = useCallback(async ({ showSpinner = false } = {}) => {
    const token = localStorage.getItem('token');
    try {
      if (showSpinner) setLoading(true);
      const [leaguesRes, myLeaguesRes] = await Promise.all([
        axios.get(`${API_URL}/api/leagues`).catch((err) => {
          console.error("Error fetching leagues:", err);
          return { data: { success: false, data: [] } };
        }),
        axios.get(`${API_URL}/api/leagues/my-leagues`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        }).catch((err) => {
          console.error("Error fetching my leagues:", err);
          return { data: { success: false, data: [] } };
        })
      ]);

      if (!isMountedRef.current) return null;

      if (leaguesRes.data.success) {
        setLeagues(leaguesRes.data.data || []);
      } else if (showSpinner) {
        showAlert("Failed to load leagues", false);
      }

      if (myLeaguesRes.data.success) {
        const mine = myLeaguesRes.data.data || [];
        setMyLeagues(mine);
        setActiveLeague((prev) => {
          if (prev && mine.some((league) => league._id === prev)) {
            return prev;
          }
          return mine.length > 0 ? mine[0]._id : null;
        });
      } else {
        if (showSpinner) showAlert("Failed to load your leagues", false);
        setMyLeagues([]);
      }

      // Fetch celebrating winners
      await fetchCelebratingWinners();

      return true;
    } catch (err) {
      console.error("Error loading data:", err);
      if (showSpinner) showAlert("Failed to load leagues", false);
      if (isMountedRef.current) {
        setLeagues([]);
        setMyLeagues([]);
      }
      return null;
    } finally {
      if (showSpinner && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [showAlert, fetchCelebratingWinners]);

  // Fetch leagues on mount and poll
  useEffect(() => {
    fetchLeagueData({ showSpinner: true });
    const intervalId = setInterval(() => {
      fetchLeagueData();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [fetchLeagueData]);

  // Track my team name for the active league
  useEffect(() => {
    if (!user || !activeLeague) {
      setMyTeamName(null);
      return;
    }
    const league = myLeagues.find(l => l._id === activeLeague);
    if (!league || !league.participants) {
      setMyTeamName(null);
      return;
    }
    const me = league.participants.find(p => {
      const participantUserId = p.userId?._id || p.userId;
      return participantUserId === user._id;
    });
    setMyTeamName(me?.teamName || null);
  }, [user, activeLeague, myLeagues]);

  const handleLeagueClick = (league) => {
    const isMyLeague = myLeagues.some(l => l._id === league._id);
    if (isMyLeague) {
      setActiveLeague(league._id);
      setShowLeagueDropdown(false);
    } else {
      if (league.status !== 'draft') {
        if (league.status === 'active') {
          showAlert(`This league is currently ongoing. It will end on ${new Date(league.endDate).toLocaleDateString()}. You cannot join ongoing leagues.`, false);
        } else if (league.status === 'completed') {
          showAlert("This league has already ended. You cannot join completed leagues.", false);
        }
        return;
      }
      
      if (league.participants?.length >= league.maxParticipants) {
        showAlert("This league is full. You cannot join at this time.", false);
        return;
      }
      
      setSelectedLeague(league);
      setShowJoinModal(true);
    }
  };

  const handleJoinLeague = async () => {
    if (!selectedLeague) {
      showAlert("Please select a league", false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const cachedUserRaw = localStorage.getItem('user');
      let cachedUser = null;
      if (cachedUserRaw) {
        try {
          cachedUser = JSON.parse(cachedUserRaw);
        } catch (err) {
          console.error("Failed to parse cached user when joining league", err);
        }
      }
      const preferredTeamName = teamName.trim() || userSelectedTeam?.name || cachedUser?.settings?.selectedTeam?.name || cachedUser?.username || user?.username;
      const preferredTeamLogo = userSelectedTeam?.logoUrl || cachedUser?.settings?.selectedTeam?.logoUrl || '';

      if (!preferredTeamName) {
        showAlert("Team name is required", false);
        return;
      }

      const res = await axios.post(`${API_URL}/api/leagues/join`, 
        {
          joinCode: selectedLeague.joinCode,
          teamName: preferredTeamName,
          teamLogoUrl: preferredTeamLogo
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        setMyLeagues(prev => [...prev, res.data.data]);
        setActiveLeague(selectedLeague._id);
        setShowJoinModal(false);
        setSelectedLeague(null);
        const myParticipant = res.data.data?.participants?.find(p => {
          const participantId = p.userId?._id || p.userId;
          const currentUserId = (user?._id || user?.id || '').toString();
          return participantId && currentUserId && participantId.toString() === currentUserId;
        });
        if (myParticipant?.teamName) {
          setTeamName(myParticipant.teamName);
        } else {
          setTeamName(preferredTeamName);
        }
        showAlert("Successfully joined league! 🎉", true);
        
        await fetchLeagueData();
      }
    } catch (err) {
      console.error("Error joining league:", err);
      showAlert(err.response?.data?.message || "Failed to join league", false);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      showAlert("Please enter a join code", false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const cachedUserRaw = localStorage.getItem('user');
      let cachedUser = null;
      if (cachedUserRaw) {
        try {
          cachedUser = JSON.parse(cachedUserRaw);
        } catch (err) {
          console.error("Failed to parse cached user when joining by code", err);
        }
      }
      const preferredTeamName = teamName.trim() || userSelectedTeam?.name || cachedUser?.settings?.selectedTeam?.name || cachedUser?.username || user?.username;
      const preferredTeamLogo = userSelectedTeam?.logoUrl || cachedUser?.settings?.selectedTeam?.logoUrl || '';

      if (!preferredTeamName) {
        showAlert("Team name is required", false);
        return;
      }

      const res = await axios.post(`${API_URL}/api/leagues/join`, 
        {
          joinCode: joinCode.trim().toUpperCase(),
          teamName: preferredTeamName,
          teamLogoUrl: preferredTeamLogo
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.data.success) {
        setMyLeagues(prev => [...prev, res.data.data]);
        setActiveLeague(res.data.data._id);
        setShowJoinByCode(false);
        setJoinCode("");
        const myParticipant = res.data.data?.participants?.find(p => {
          const participantId = p.userId?._id || p.userId;
          const currentUserId = (cachedUser?._id || user?._id || '').toString();
          return participantId && currentUserId && participantId.toString() === currentUserId;
        });
        if (myParticipant?.teamName) {
          setTeamName(myParticipant.teamName);
        } else {
          setTeamName(preferredTeamName);
        }
        showAlert("Successfully joined league! 🎉", true);
        
        await fetchLeagueData();
      }
    } catch (err) {
      console.error("Error joining league details:", err);
      console.error("Error response:", err.response);
      
      if (err.response) {
        showAlert(err.response.data?.message || `Error: ${err.response.status} - ${err.response.statusText}`, false);
      } else if (err.request) {
        showAlert("No response from server. Please check your connection.", false);
      } else {
        showAlert(`Request error: ${err.message}`, false);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = (code) => {
    navigator.clipboard.writeText(code);
    showAlert("Join code copied to clipboard!", true);
  };

const updateMatchResult = async (matchId, homeGoals, awayGoals) => {
  // Check if user is admin for the current league
  if (!isAdmin || !currentLeague || currentLeague.admin._id !== user?._id) {
    showAlert("Only the league admin can update match results", false);
    return;
  }

  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await axios.put(`${API_URL}/api/leagues/match/${matchId}/result`, 
      {
        homeGoals: parseInt(homeGoals),
        awayGoals: parseInt(awayGoals)
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (res.data.success) {
      showAlert("Match result updated successfully!", true);
      setEditingMatch(null);
      setTempScores({});
      await fetchLeagueData();
    }
  } catch (err) {
    console.error("Error updating match:", err);
    if (err.response?.status === 403) {
      showAlert("Only league admin can update match results", false);
    } else {
      showAlert(err.response?.data?.message || "Failed to update match result", false);
    }
  } finally {
    setLoading(false);
  }
};

  const startEditingMatch = (match) => {
    if (!isAdmin) return;
    setEditingMatch(match._id);
    setTempScores({
      homeGoals: match.homeGoals || '',
      awayGoals: match.awayGoals || ''
    });
  };

  const cancelEditing = () => {
    setEditingMatch(null);
    setTempScores({});
  };

  const saveMatchResult = (match) => {
    const homeGoals = tempScores.homeGoals === '' ? 0 : parseInt(tempScores.homeGoals);
    const awayGoals = tempScores.awayGoals === '' ? 0 : parseInt(tempScores.awayGoals);
    
    if (homeGoals < 0 || awayGoals < 0) {
      showAlert("Goals cannot be negative", false);
      return;
    }
    
    updateMatchResult(match._id, homeGoals, awayGoals);
  };

  const generateMatchesForLeague = async (leagueId) => {
    if (!isAdmin || currentLeague?.admin?._id !== user?._id) {
      showAlert("Only the league admin can generate matches", false);
      return;
    }
    if (currentLeague?.status !== 'draft') {
      showAlert("Matches can only be generated before the league starts", false);
      return;
    }

    try {
      setGeneratingMatches(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/leagues/${leagueId}/generate-matches`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        showAlert("Matches generated successfully! League is now active.", true);
        await fetchLeagueData();
      }
    } catch (err) {
      console.error("Error generating matches:", err);
      showAlert(err.response?.data?.message || "Failed to generate matches", false);
    } finally {
      setGeneratingMatches(false);
    }
  };

  const currentLeague = myLeagues.find((l) => l._id === activeLeague);
  const availableLeagues = leagues.filter(l => 
    !myLeagues.some(myL => myL._id === l._id) && 
    l.status === 'draft' &&
    l.participants?.length < l.maxParticipants
  );

  const filteredMatches = currentLeague
    ? (currentLeague.matches || [])
        .filter((m) => {
          if (activeTab === "finished" && !m.played) return false;
          if (activeTab === "scheduled" && m.played) return false;
          
          if (selectedRound !== null && (m.roundNumber || 1) !== selectedRound) return false;
          
          return true;
        })
        .sort((a, b) => {
          const roundA = a.roundNumber || 1;
          const roundB = b.roundNumber || 1;
          if (roundA !== roundB) return roundA - roundB;
          const matchA = a.matchNumber || 0;
          const matchB = b.matchNumber || 0;
          return matchA - matchB;
        })
    : [];

  const getUniqueOpponents = (teamName) => {
    if (!currentLeague || !currentLeague.matches) return 0;
    const opponents = new Set();
    currentLeague.matches.forEach(match => {
      if (match.homeTeam === teamName) {
        opponents.add(match.awayTeam);
      } else if (match.awayTeam === teamName) {
        opponents.add(match.homeTeam);
      }
    });
    return opponents.size;
  };

  const availableRounds = currentLeague && currentLeague.matches
    ? Array.from(new Set(currentLeague.matches.map(m => m.roundNumber || 1))).sort((a, b) => a - b)
    : [];

  const getTeamLogo = (teamName, league) => {
    if (!teamName) {
      return `https://api.dicebear.com/7.x/shapes/svg?seed=unknown&backgroundColor=blue,green,yellow,red,purple&size=80`;
    }

    const normalizedTeamName = teamName.trim().toLowerCase();

    if (
      userSelectedTeam?.name &&
      userSelectedTeam?.logoUrl &&
      userSelectedTeam.name.trim().toLowerCase() === normalizedTeamName
    ) {
      return userSelectedTeam.logoUrl;
    }

    const participant = league?.participants?.find(
      participantEntry =>
        participantEntry.teamName &&
        participantEntry.teamName.trim().toLowerCase() === normalizedTeamName
    );
    if (participant?.teamLogoUrl || participant?.teamLogo) {
      return participant.teamLogoUrl || participant.teamLogo;
    }

    const leagueTeam = league?.teams?.find(
      team =>
        team.name && team.name.trim().toLowerCase() === normalizedTeamName
    );
    if (leagueTeam?.logoUrl || leagueTeam?.logo) {
      return leagueTeam.logoUrl || leagueTeam.logo;
    }

    return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=blue,green,yellow,red,purple&size=80`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Joining' },
      active: { color: 'bg-green-100 text-green-800', icon: Play, label: 'Active' },
      completed: { color: 'bg-gray-100 text-gray-800', icon: CheckSquare, label: 'Completed' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const isUserTeam = (teamName) => {
    if (!myTeamName) return false;
    return teamName === myTeamName;
  };

  const getUserDisplayName = () => {
    if (userSelectedTeam?.name) {
      return userSelectedTeam.name;
    }
    return user?.username || 'Your Team';
  };

  // Calculate days left for celebration
  const getDaysLeft = (celebrationEnds) => {
    const endDate = new Date(celebrationEnds);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <PageLayout
      pageTitle="⚽ Match Center"
      pageDescription="View matches, results, and schedules across your leagues."
      pageColor="from-green-500 to-emerald-500"
    >
      {/* Celebration Modal */}
      <CelebrationModal
        celebration={currentCelebration}
        onDismiss={() => dismissCelebration(currentCelebration?._id, currentCelebration?.winner.teamName)}
      />

      {/* Alerts */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.8 }}
            animate={{ y: 20, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md bg-opacity-90 text-white font-semibold flex items-center space-x-4 ${
              alert.success ? "bg-green-500/90" : "bg-red-500/90"
            }`}
          >
            <span>{alert.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Champions Banner */}
      {celebratingWinners.length > 0 && (
        <motion.div
          className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-4 shadow-2xl text-white mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Crown className="w-5 h-5" />
              🏆 Current Champions
            </h3>
            <button
              onClick={dismissAllCelebrations}
              className="text-white/80 hover:text-white text-sm bg-white/20 px-3 py-1 rounded-full transition-colors"
            >
              Dismiss All
            </button>
          </div>
          
          <div className="space-y-3">
            {celebratingWinners.map((league) => {
              const daysLeft = getDaysLeft(league.celebrationEnds);
              const isUserWinner = myTeamName === league.winner.teamName;
              
              return (
                <motion.div
                  key={league._id}
                  className="bg-white/20 rounded-2xl p-3 backdrop-blur-sm border border-white/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          {league.winner.teamLogo ? (
                            <img 
                              src={league.winner.teamLogo} 
                              alt={league.winner.teamName}
                              className="w-8 h-8 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(league.winner.teamName)}&backgroundColor=yellow,orange,red&size=80`;
                              }}
                            />
                          ) : (
                            <Trophy className="w-6 h-6 text-yellow-200" />
                          )}
                        </div>
                        {isUserWinner && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                            <Star className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {league.winner.teamName}
                          {isUserWinner && (
                            <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                              YOU
                            </span>
                          )}
                        </h4>
                        <p className="text-white/80 text-xs">{league.name}</p>
                        <p className="text-yellow-200 text-xs font-medium flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          TAAJ CROWN PRINCE • {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                        CHAMPION
                      </div>
                      <p className="text-white/70 text-xs mt-1">
                        Since {new Date(league.winner.awardedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Role Badge */}
      <div className="flex justify-center mb-6">
        <div className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 ${
          isAdmin 
            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {isAdmin ? <Crown className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          {isAdmin ? 'League Administrator' : 'Player'}
        </div>
      </div>

      {/* QUICK STATS - Responsive Grid */}
      <motion.div
        className="grid grid-cols-2 gap-3 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {[
          { 
            label: "My Leagues", 
            value: myLeagues.length, 
            icon: "🏆", 
            color: "from-green-500 to-emerald-500",
            subtitle: "Joined"
          },
          { 
            label: "Available", 
            value: availableLeagues.length, 
            icon: "🔓", 
            color: "from-blue-500 to-cyan-500",
            subtitle: "To Join"
          },
          { 
            label: "Matches", 
            value: currentLeague?.matches?.length || 0, 
            icon: "⚽", 
            color: "from-purple-500 to-pink-500",
            subtitle: "Total"
          },
          { 
            label: "Finished", 
            value: currentLeague?.matches?.filter(m => m.played).length || 0, 
            icon: "✅", 
            color: "from-yellow-500 to-amber-500",
            subtitle: "Played"
          }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300, delay: i * 0.1 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs font-medium">{stat.label}</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.subtitle}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white text-sm shadow-lg`}
              >
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* FEATURED LEAGUE - Mobile Responsive */}
      {currentLeague ? (
        <motion.div
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-4 md:p-5 shadow-2xl text-white mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-0">
              <div className="relative">
                <LeagueIconDisplay
                  league={currentLeague}
                  size={currentLeague ? 64 : 48}
                  className="bg-white/80 border border-white/40"
                  rounded={false}
                />
                {currentLeague.isCelebrating && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white/20 rounded-full px-2 py-1 inline-block mb-2">
                  <span className="text-xs font-semibold">
                    {currentLeague.status === 'draft' ? 'JOINING PHASE' : 
                     currentLeague.status === 'active' ? 'ACTIVE LEAGUE' : 'COMPLETED'}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold truncate">{currentLeague.name}</h3>
                <p className="text-white/80 text-sm truncate hidden md:block">{currentLeague.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarDays className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-white/70 text-xs md:text-sm">
                    {new Date(currentLeague.startDate).toLocaleDateString()} - {new Date(currentLeague.endDate).toLocaleDateString()}
                  </span>
                </div>
                {myTeamName && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold">
                      My Team: {myTeamName}
                    </span>
                    {currentLeague.isCelebrating && currentLeague.winner?.teamName === myTeamName && (
                      <span className="bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                        🏆 CHAMPION
                      </span>
                    )}
                  </div>
                )}
                {currentLeague.isCelebrating && (
                  <div className="mt-2 bg-yellow-500/20 rounded-full px-3 py-1 text-xs text-yellow-200 border border-yellow-300/30">
                    🎉 {currentLeague.winner?.teamName} is celebrating their victory!
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 md:space-x-4 w-full md:w-auto justify-between md:justify-normal">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold">{currentLeague.participants?.length || 0}</div>
                <div className="text-white/70 text-xs">Teams</div>
              </div>
              <div className="h-6 md:h-8 w-px bg-white/30"></div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold">{currentLeague.matches?.length || 0}</div>
                <div className="text-white/70 text-xs">Matches</div>
              </div>
              {currentLeague.admin._id === user?._id && (
                <>
                  <div className="h-6 md:h-8 w-px bg-white/30"></div>
                  <button
                    onClick={() => copyJoinCode(currentLeague.joinCode)}
                    className="bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 flex items-center space-x-2 transition-all text-sm"
                  >
                    <Copy className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="font-mono text-xs md:text-sm">{currentLeague.joinCode}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 shadow-2xl text-white mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-80" />
          <h3 className="text-xl font-bold mb-2">No Active League</h3>
          <p className="text-white/80 mb-4">
            {isAdmin 
              ? "Create or join a league to start managing matches!" 
              : "Join a league to start tracking matches!"
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowJoinByCode(true)}
              className="bg-white text-orange-600 px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-all"
            >
              Join with Code
            </button>
            {isAdmin && (
              <button
                onClick={() => window.location.href = '/create-league'}
                className="bg-white/20 text-white px-6 py-2 rounded-xl font-semibold hover:bg-white/30 transition-all"
              >
                Create League
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* LEAGUE SELECTION - Mobile Optimized */}
      <motion.div
        className="bg-white rounded-3xl p-4 md:p-5 shadow-lg border border-slate-200 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-slate-800">My Leagues</h2>
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 text-sm bg-slate-100 px-3 py-1 rounded-full">
              {myLeagues.length} joined
            </span>
            <button
              onClick={() => setShowJoinByCode(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center space-x-2 hover:shadow-lg transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Join League</span>
            </button>
          </div>
        </div>

        {/* Mobile League Dropdown */}
        <div className="md:hidden mb-4 relative">
          <button
            onClick={() => setShowLeagueDropdown(!showLeagueDropdown)}
            className="w-full flex items-center justify-between p-4 bg-slate-100 rounded-xl text-slate-700 font-medium"
          >
            <span>
              {currentLeague ? currentLeague.name : "Select League"}
            </span>
            <ChevronRight className={`w-4 h-4 transition-transform ${showLeagueDropdown ? 'rotate-90' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showLeagueDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 z-10 max-h-60 overflow-y-auto"
              >
                {myLeagues.map((league) => {
                  const isCelebrating = league.isCelebrating && league.winner?.teamName;
                  return (
                    <button
                      key={league._id}
                      onClick={() => handleLeagueClick(league)}
                      className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-b-0"
                    >
                      <div className="relative">
                        <LeagueIconDisplay
                          league={league}
                          size={40}
                          className="bg-white border-slate-200"
                        />
                        {isCelebrating && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Crown className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{league.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          {league.participants?.length || 0} teams
                          {isCelebrating && (
                            <span className="bg-yellow-500 text-yellow-900 text-xs px-1 rounded-full">
                              🏆
                            </span>
                          )}
                        </div>
                      </div>
                      {activeLeague === league._id && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop League Cards */}
        <div className="hidden md:flex space-x-3 overflow-x-auto pb-3 -mx-2 px-2">
          {myLeagues.map((league) => {
            const userTeam = league.participants?.find(p => {
              const participantUserId = p.userId?._id || p.userId;
              return participantUserId === user?._id;
            })?.teamName;
            const isCelebrating = league.isCelebrating && league.winner?.teamName;

            return (
              <motion.button
                key={league._id}
                onClick={() => setActiveLeague(league._id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 min-w-[200px] relative ${
                  activeLeague === league._id
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCelebrating && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Crown className="w-2 h-2 text-white" />
                  </div>
                )}
                <LeagueIconDisplay
                  league={league}
                  size={40}
                  className="bg-white border-slate-200"
                />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold truncate">{league.name}</div>
                  <div className="text-xs opacity-70 truncate flex items-center gap-1">
                    {league.participants?.length || 0} teams • {getStatusBadge(league.status)}
                    {userTeam && (
                      <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs">
                        {userTeam}
                      </span>
                    )}
                    {isCelebrating && (
                      <span className="bg-yellow-500 text-yellow-900 px-1 rounded text-xs">
                        🏆
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeLeague === league._id ? 'text-white' : 'text-slate-400'}`} />
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* MATCHES SECTION - Mobile Optimized */}
      {currentLeague && (
        <motion.div
          className="bg-white rounded-3xl p-4 md:p-5 shadow-lg border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800">Matches</h2>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span className="text-xs sm:text-sm">
                  {new Date(currentLeague.startDate).toLocaleDateString()} - {new Date(currentLeague.endDate).toLocaleDateString()}
                </span>
              </div>
              
              {myTeamName && (
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Your Team: {myTeamName}</span>
                  {currentLeague.isCelebrating && currentLeague.winner?.teamName === myTeamName && (
                    <span className="bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                      🏆 CHAMPION
                    </span>
                  )}
                </div>
              )}
              
              {isAdmin && currentLeague.admin._id === user?._id && currentLeague.status === 'active' && (
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Admin Mode</span>
                </div>
              )}
            </div>

            {isAdmin && currentLeague.admin._id === user?._id && (
              currentLeague.status === 'draft' ? (
                <button
                  onClick={() => generateMatchesForLeague(currentLeague._id)}
                  disabled={generatingMatches}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-60"
                >
                  {generatingMatches ? "Generating..." : "Generate Matches"}
                </button>
              ) : (
                <div className="px-3 py-1 rounded-full text-sm border border-slate-200 text-slate-600 bg-slate-100 w-fit">
                  {currentLeague.status === 'active' ? "League is ongoing" : "League completed"}
                </div>
              )
            )}
          </div>

          {/* MATCH TABS - Mobile Optimized */}
          <div className="flex space-x-1 bg-slate-100 rounded-2xl p-1 mb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-1 flex-1 min-w-[100px] ${
                  activeTab === tab.id
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ROUND FILTER - Mobile Optimized */}
          {availableRounds.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Filter by Round:</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRound(null)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedRound === null
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  All Rounds
                </button>
                {availableRounds.map((round) => (
                  <button
                    key={round}
                    onClick={() => setSelectedRound(round)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedRound === round
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    Round {round}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MATCHES LIST - Mobile Optimized */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeLeague}-${activeTab}-${selectedRound}`}
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match, index) => {
                  const isUserHome = isUserTeam(match.homeTeam);
                  const isUserAway = isUserTeam(match.awayTeam);
                  const isUserMatch = isUserHome || isUserAway;
                  
                  return (
                    <motion.div
                      key={match._id || index}
                      className={`bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-3 border transition-all duration-300 group ${
                        isUserMatch 
                          ? 'border-blue-200 bg-blue-50/50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      whileHover={{ scale: 1.01, y: -1 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Match Header - Mobile Compact */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {match.matchNumber && (
                            <div className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
                              #{match.matchNumber}
                            </div>
                          )}
                          {match.roundNumber && (
                            <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              R{match.roundNumber}
                            </div>
                          )}
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            match.played
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {match.played ? "✅" : "⏰"}
                        </div>
                      </div>

                      {/* Teams Row - Mobile Optimized */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Home Team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border">
                              <img
                                src={getTeamLogo(match.homeTeam, currentLeague)}
                                alt={match.homeTeam}
                                className="w-6 h-6 rounded object-cover"
                              />
                            </div>
                            {isUserHome && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold text-xs truncate ${
                              isUserHome ? 'text-blue-700' : 'text-slate-800'
                            }`}>
                              {match.homeTeam}
                            </p>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="flex flex-col items-center mx-1">
                          {match.played ? (
                            editingMatch === match._id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={tempScores.homeGoals}
                                  onChange={(e) => setTempScores(prev => ({
                                    ...prev,
                                    homeGoals: e.target.value
                                  }))}
                                  className="w-8 text-center border rounded p-1 text-xs font-bold"
                                  placeholder="0"
                                />
                                <span className="text-sm font-bold">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={tempScores.awayGoals}
                                  onChange={(e) => setTempScores(prev => ({
                                    ...prev,
                                    awayGoals: e.target.value
                                  }))}
                                  className="w-8 text-center border rounded p-1 text-xs font-bold"
                                  placeholder="0"
                                />
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-slate-800">
                                {match.homeGoals}-{match.awayGoals}
                              </span>
                            )
                          ) : (
                            editingMatch === match._id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={tempScores.homeGoals}
                                  onChange={(e) => setTempScores(prev => ({
                                    ...prev,
                                    homeGoals: e.target.value
                                  }))}
                                  className="w-8 text-center border rounded p-1 text-xs"
                                  placeholder="0"
                                />
                                <span className="text-xs font-bold">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={tempScores.awayGoals}
                                  onChange={(e) => setTempScores(prev => ({
                                    ...prev,
                                    awayGoals: e.target.value
                                  }))}
                                  className="w-8 text-center border rounded p-1 text-xs"
                                  placeholder="0"
                                />
                              </div>
                            ) : (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-semibold">
                                VS
                              </span>
                            )
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <div className="min-w-0 flex-1 text-right">
                            <p className={`font-semibold text-xs truncate ${
                              isUserAway ? 'text-blue-700' : 'text-slate-800'
                            }`}>
                              {match.awayTeam}
                            </p>
                          </div>
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border">
                              <img
                                src={getTeamLogo(match.awayTeam, currentLeague)}
                                alt={match.awayTeam}
                                className="w-6 h-6 rounded object-cover"
                              />
                            </div>
                            {isUserAway && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Match Footer - Mobile Compact */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-1">
                          {isUserMatch && (
                            <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                              Your Team
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {editingMatch === match._id ? (
                            <>
                              <button
                                onClick={cancelEditing}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                                disabled={loading}
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => saveMatchResult(match)}
                                className="text-green-500 hover:text-green-700 transition-colors p-1"
                                disabled={loading}
                              >
                                <Save className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              {isAdmin && currentLeague.admin._id === user?._id && currentLeague.status === 'active' && (
                                <button
                                  onClick={() => startEditingMatch(match)}
                                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                                  title="Edit match result"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div 
                  className="text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-slate-500 text-sm font-medium mb-2">No matches found</p>
                  <p className="text-slate-400 text-xs">
                    {activeTab === 'all' 
                      ? currentLeague.status === 'draft' 
                        ? "Matches will be generated when the league starts"
                        : "No matches in this league yet." 
                      : `No ${activeTab} matches found.`}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* JOIN MODAL */}
      <AnimatePresence>
        {showJoinModal && selectedLeague && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Join {selectedLeague.name}
                </h3>
                <p className="text-slate-600 text-sm">
                  {selectedLeague.description}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={`Enter your team name (default: ${getUserDisplayName()})`}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleJoinLeague}
                  disabled={loading || !teamName.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Joining...</span>
                    </div>
                  ) : (
                    "Join League"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JOIN BY CODE MODAL */}
      <AnimatePresence>
        {showJoinByCode && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowJoinByCode(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Join with Code</h3>
                <button
                  onClick={() => setShowJoinByCode(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Join Code
                  </label>
                  <div className="relative">
                    <QrCode className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit code"
                      className="w-full p-3 pl-10 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all uppercase font-mono text-sm"
                      maxLength="6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={`Enter your team name (default: ${getUserDisplayName()})`}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-sm"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || !joinCode.trim() || !teamName.trim()}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Joining...</span>
                    </div>
                  ) : (
                    "Join League"
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

export default Match;