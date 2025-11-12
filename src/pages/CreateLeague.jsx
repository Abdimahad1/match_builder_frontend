// pages/CreateLeague.jsx
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  CalendarDays,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Shuffle,
  Calendar,
  Clock,
  Slash,
  CheckSquare,
  Play,
  Copy,
  UserPlus,
  Crown,
  Eye,
  EyeOff,
  Share2,
  QrCode
} from "lucide-react";
import PageLayout from "../components/PageLayout";
import {
  LEAGUE_ICON_OPTIONS,
  DEFAULT_LEAGUE_ICON_ID,
  extractLeagueIconId,
  LeagueIconDisplay
} from "../utils/leagueIcons";

const API_URL = import.meta.env.VITE_API_URL;

export default function CreateLeague() {
  const location = useLocation();
  const [leagueName, setLeagueName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [leagueIconId, setLeagueIconId] = useState(DEFAULT_LEAGUE_ICON_ID);
  const [alert, setAlert] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [activeTab, setActiveTab] = useState("create");
  const [editLeagueId, setEditLeagueId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLeagueId, setExpandedLeagueId] = useState(null);
  const [selectedLeagueForMatches, setSelectedLeagueForMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showJoinCode, setShowJoinCode] = useState(null);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [tempHomeGoals, setTempHomeGoals] = useState("");
  const [tempAwayGoals, setTempAwayGoals] = useState("");
  const [savingResult, setSavingResult] = useState(false);
  const [participantDetails, setParticipantDetails] = useState({}); // Store participant details with logos

  // Function to get team logo - enhanced to use actual participant logos
  const getTeamLogo = (teamName, league) => {
    if (!teamName) {
      return `https://api.dicebear.com/7.x/shapes/svg?seed=unknown&backgroundColor=blue,green,yellow,red,purple&size=80`;
    }

    const normalizedTeamName = teamName.trim().toLowerCase();

    // First, check if we have cached participant details with logos
    if (participantDetails[teamName]) {
      return participantDetails[teamName];
    }

    // Check in league participants for team logo
    const participant = league?.participants?.find(
      p => p.teamName && p.teamName.trim().toLowerCase() === normalizedTeamName
    );
    
    if (participant?.teamLogoUrl || participant?.teamLogo) {
      const logoUrl = participant.teamLogoUrl || participant.teamLogo;
      // Cache the logo URL
      setParticipantDetails(prev => ({
        ...prev,
        [teamName]: logoUrl
      }));
      return logoUrl;
    }

    // Check in league teams (if any)
    const leagueTeam = league?.teams?.find(
      team => team.name && team.name.trim().toLowerCase() === normalizedTeamName
    );
    if (leagueTeam?.logoUrl || leagueTeam?.logo) {
      const logoUrl = leagueTeam.logoUrl || leagueTeam.logo;
      setParticipantDetails(prev => ({
        ...prev,
        [teamName]: logoUrl
      }));
      return logoUrl;
    }

    // Fallback to dicebear
    const fallbackLogo = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=blue,green,yellow,red,purple&size=80`;
    setParticipantDetails(prev => ({
      ...prev,
      [teamName]: fallbackLogo
    }));
    return fallbackLogo;
  };

  const showAlert = (msg, success = false) => {
    setAlert({ msg, success });
    setTimeout(() => setAlert(null), 3000);
  };

  // Get user info on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
    }
  }, []);

  // Honor initial tab from navigation state or query param
  useEffect(() => {
    const stateTab = location.state?.tab;
    const urlParams = new URLSearchParams(window.location.search);
    const queryTab = urlParams.get('tab');
    const initialTab = stateTab || queryTab;
    if (initialTab && ["create", "list", "matches"].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [location.state]);

  // Enhanced fetch leagues to include participant details
  const fetchLeagues = useCallback(async ({ silent = false } = {}) => {
    const token = localStorage.getItem('token');
    const shouldToggleLoading = !silent;
    try {
      if (shouldToggleLoading) setLoading(true);
      const res = await fetch(`${API_URL}/api/leagues`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (data.success) {
        setLeagues(data.data);

        // Pre-cache participant logos
        const newParticipantDetails = {};
        data.data.forEach(league => {
          league.participants?.forEach(participant => {
            if (participant.teamName && (participant.teamLogoUrl || participant.teamLogo)) {
              newParticipantDetails[participant.teamName] = participant.teamLogoUrl || participant.teamLogo;
            }
          });
        });
        setParticipantDetails(prev => ({ ...prev, ...newParticipantDetails }));
      }
      return data;
    } catch (err) {
      console.error(err);
      if (shouldToggleLoading) showAlert("Could not fetch leagues", false);
      return null;
    } finally {
      if (shouldToggleLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "list" && activeTab !== "matches") return;
    fetchLeagues();
    const intervalId = setInterval(() => {
      fetchLeagues({ silent: true });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [activeTab, fetchLeagues]);

  // Create league
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leagueName || !description || !startDate || !endDate) {
      showAlert("Please fill in all fields!", false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const method = editLeagueId ? "PUT" : "POST";
      const url = editLeagueId
        ? `${API_URL}/api/leagues/${editLeagueId}`
        : `${API_URL}/api/leagues`;

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: leagueName,
          description,
          startDate,
          endDate,
          maxParticipants,
          leagueLogoUrl: `icon:${leagueIconId}`
        }),
      });

      const data = await res.json();
      if (data.success) {
        showAlert(
          editLeagueId
            ? `League "${data.data.name}" updated successfully! 🎉`
            : `League "${data.data.name}" created successfully! 🎉`,
          true
        );
        setLeagueName("");
        setDescription("");
        setStartDate("");
        setEndDate("");
        setMaxParticipants(20);
        setLeagueIconId(DEFAULT_LEAGUE_ICON_ID);
        setEditLeagueId(null);
        fetchLeagues();
        setActiveTab("list");
      } else {
        showAlert(data.message || "Failed to save league", false);
      }
    } catch (err) {
      console.error(err);
      showAlert("Server error: Could not save league", false);
    }
  };

  const handleEditLeague = (league) => {
    setActiveTab("create");
    setEditLeagueId(league._id);
    setLeagueName(league.name);
    setDescription(league.description);
    setStartDate(new Date(league.startDate).toISOString().split("T")[0]);
    setEndDate(new Date(league.endDate).toISOString().split("T")[0]);
    setMaxParticipants(league.maxParticipants);
    const iconId = extractLeagueIconId(league.leagueLogoUrl);
    setLeagueIconId(iconId || DEFAULT_LEAGUE_ICON_ID);
  };

  const handleDeleteLeague = async (id) => {
    if (!window.confirm("Are you sure you want to delete this league? This will remove all participants and matches.")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/leagues/${id}`, { 
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showAlert("League deleted successfully!", true);
        fetchLeagues();
      } else showAlert("Failed to delete league", false);
    } catch (err) {
      console.error(err);
      showAlert("Server error: Could not delete league", false);
    }
  };

  // Generate matches from participants
  const generateMatches = async (leagueId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/leagues/${leagueId}/generate-matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        showAlert("Matches generated successfully! League is now active.", true);
        await fetchLeagues();
        const freshLeagues = await (await fetch(`${API_URL}/api/leagues`)).json();
        if (freshLeagues.success) {
          const league = freshLeagues.data.find((l) => l._id === leagueId);
          setSelectedLeagueForMatches(league);
        }
      } else {
        showAlert(data.message || "Failed to generate matches", false);
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      showAlert("Server error while generating matches", false);
    }
  };

  // Copy join code
  const copyJoinCode = (code) => {
    navigator.clipboard.writeText(code);
    showAlert("Join code copied to clipboard!", true);
  };

  // Share league
  const shareLeague = (league) => {
    const shareText = `Join my league "${league.name}"! Use code: ${league.joinCode}`;
    if (navigator.share) {
      navigator.share({
        title: league.name,
        text: shareText,
        url: window.location.href,
      });
    } else {
      copyJoinCode(league.joinCode);
    }
  };

  const filteredLeagues = leagues.filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (activeTab === "matches") {
      if (leagues.length > 0) {
        setSelectedLeagueForMatches((prev) => {
          if (prev) {
            const exists = leagues.find((l) => l._id === prev._id);
            return exists || leagues[0];
          }
          return leagues[0];
        });
      } else {
        setSelectedLeagueForMatches(null);
      }
    }
  }, [activeTab, leagues]);

  const getStandingsData = (league) => {
    if (league.teams && league.teams.length > 0) {
      return league.teams.map(team => ({
        ...team,
        logo: getTeamLogo(team.name, league)
      }));
    }
    if (league.participants && league.participants.length > 0) {
      return league.participants.map((participant) => {
        const participantLogo = getTeamLogo(participant.teamName, league);
        return {
          name: participant.teamName,
          logo: participantLogo,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        };
      });
    }
    return [];
  };

  const beginEditResult = (match) => {
    setEditingMatchId(match._id);
    setTempHomeGoals(match.homeGoals ?? "");
    setTempAwayGoals(match.awayGoals ?? "");
  };

  const cancelEditResult = () => {
    setEditingMatchId(null);
    setTempHomeGoals("");
    setTempAwayGoals("");
  };

  const saveMatchResult = async (leagueId, matchId) => {
    const h = tempHomeGoals === "" ? 0 : parseInt(tempHomeGoals, 10);
    const a = tempAwayGoals === "" ? 0 : parseInt(tempAwayGoals, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      showAlert("Please enter valid non-negative numbers for goals", false);
      return;
    }
    try {
      setSavingResult(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/leagues/match/${matchId}/result`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ homeGoals: h, awayGoals: a })
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Match result saved.", true);
        await fetchLeagues();
        const fresh = await (await fetch(`${API_URL}/api/leagues`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })).json();
        if (fresh.success && selectedLeagueForMatches) {
          const updated = fresh.data.find(l => l._id === leagueId);
          if (updated) setSelectedLeagueForMatches(updated);
        }
        cancelEditResult();
      } else {
        showAlert(data.message || "Failed to save result", false);
      }
    } catch (err) {
      console.error(err);
      showAlert("Server error: Could not save result", false);
    } finally {
      setSavingResult(false);
    }
  };

  // Shuffle participants order (admin, draft)
  const shuffleParticipants = async (league) => {
    if (league.status !== 'draft' || league.admin._id !== user?._id) return;
    try {
      const shuffled = [...(league.participants || [])]
        .map(p => ({ p, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map(({ p }) => ({
          userId: p.userId?._id || p.userId,
          teamName: p.teamName,
          teamLogoUrl: p.teamLogoUrl || "",
          status: p.status || 'approved',
          joinedAt: p.joinedAt
        }));
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/leagues/${league._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ participants: shuffled })
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Teams shuffled successfully.", true);
        fetchLeagues();
      } else {
        showAlert(data.message || "Failed to shuffle teams", false);
      }
    } catch (err) {
      console.error(err);
      showAlert("Server error: Could not shuffle teams", false);
    }
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

  const canGenerateMatches = (league) => {
    return league.status === 'draft' && 
           league.participants && 
           league.participants.length >= 2 &&
           league.admin._id === user?._id;
  };

  // Enhanced participant display with logos
  const renderParticipantWithLogo = (participant, league) => {
    const teamLogo = getTeamLogo(participant.teamName, league);
    
    return (
      <div
        key={participant._id || participant.teamName}
        className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
      >
        <img 
          src={teamLogo} 
          alt={participant.teamName}
          className="w-6 h-6 rounded-full object-cover"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(participant.teamName)}&backgroundColor=blue,green&size=80`;
          }}
        />
        <span className="text-sm font-medium">{participant.teamName}</span>
        <span className="text-xs text-gray-500">
          ({participant.userId?.name || participant.userId?.username || 'User'})
        </span>
      </div>
    );
  };

  return (
    <PageLayout
      pageTitle="🏆 League Management"
      pageDescription="Create and manage football leagues. Generate join codes and start leagues when players have joined."
      pageColor="from-yellow-400 to-orange-500"
    >
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

      {/* Admin Badge */}
      <div className="flex justify-center mb-6">
        <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 border border-purple-200">
          <Crown className="w-4 h-4" />
          League Administrator
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        {["create", "list", "matches"].map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "list" || tab === "matches") fetchLeagues();
            }}
            className={`px-6 py-2 rounded-full font-semibold shadow-lg transition-all ${
              activeTab === tab
                ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab === "create" ? "➕ Create League" : tab === "list" ? "📋 Leagues" : "⚔️ Matches"}
          </motion.button>
        ))}
      </div>

      {/* CREATE tab - unchanged */}
      {activeTab === "create" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-200 relative"
        >
          <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-yellow-400 text-white px-4 py-2 rounded-bl-3xl font-semibold shadow-lg">
            {editLeagueId ? "Edit Mode" : "New League"}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
            <Trophy className="text-yellow-500 w-7 h-7" />
            {editLeagueId ? "Edit League" : "Create League"}
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">League Name</label>
              <div className="relative">
                <Users className="absolute left-4 top-3 text-yellow-500" />
                <input
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  placeholder="Enter league name"
                  className="w-full p-3 md:p-4 pl-12 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the league"
                rows={4}
                className="w-full p-3 md:p-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 transition-all shadow-inner resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">League Icon</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-yellow-200 bg-yellow-50/40">
                  <LeagueIconDisplay
                    league={{ name: leagueName || "League", leagueLogoUrl: `icon:${leagueIconId}` }}
                    iconId={leagueIconId}
                    size={80}
                    className="border-none shadow-none bg-white"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-600">
                    Choose an icon to represent your league. Icons render consistently across all devices and avoid image loading issues.
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Tap to select an icon:</p>
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {LEAGUE_ICON_OPTIONS.map((option) => {
                  const OptionIcon = option.icon;
                  const selected = leagueIconId === option.id;
                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => setLeagueIconId(option.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                        selected
                          ? "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-400"
                          : "border-gray-200 hover:border-yellow-400 hover:bg-yellow-50/60"
                      }`}
                    >
                      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-inner border border-yellow-200 text-yellow-600">
                        <OptionIcon className="w-6 h-6" />
                      </div>
                      <span className={`text-xs font-medium ${selected ? "text-yellow-600" : "text-gray-600"}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">Start Date</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-3 text-yellow-500" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 pl-12 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3 text-yellow-500" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 pl-12 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">Max Participants</label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-3 text-yellow-500" />
                <input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  min="2"
                  max="50"
                  placeholder="Maximum number of teams"
                  className="w-full p-3 pl-12 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Players will join with their team names. Matches will be generated automatically when you start the league.
              </p>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-2xl shadow-2xl hover:shadow-yellow-400/50 transition-all"
            >
              {editLeagueId ? "Update League" : "Create League"}
            </motion.button>
          </form>

          {/* Creation Tips */}
          {!editLeagueId && (
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                How it works:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Create league with basic info and max participants</li>
                <li>• Share the auto-generated join code with players</li>
                <li>• Players join with their team names and logos</li>
                <li>• Start league when enough players have joined</li>
                <li>• Matches are automatically generated between all teams</li>
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* LIST tab - Enhanced with team logos */}
      {activeTab === "list" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="🔍 Search my leagues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mb-4 p-3 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 shadow-md"
              />

              {filteredLeagues.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">You haven't created any leagues yet.</p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-semibold"
                  >
                    Create Your First League
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {filteredLeagues.map((league) => (
                  <motion.div
                    key={league._id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border p-4 md:p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <LeagueIconDisplay
                          league={league}
                          size={56}
                          className="shadow-md border-slate-200 bg-white"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{league.name}</h3>
                            {getStatusBadge(league.status)}
                          </div>
                          <p className="text-sm text-gray-500">{league.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(league.startDate).toLocaleDateString()} —{" "}
                            {new Date(league.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Join Code Display */}
                        <div className="relative">
                          <button
                            onClick={() => setShowJoinCode(showJoinCode === league._id ? null : league._id)}
                            className="px-3 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 flex items-center gap-2"
                          >
                            <QrCode className="w-4 h-4" />
                            {showJoinCode === league._id ? league.joinCode : 'Show Code'}
                          </button>
                          
                          {showJoinCode === league._id && (
                            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border p-3 z-10">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-lg font-bold">{league.joinCode}</span>
                                <button
                                  onClick={() => copyJoinCode(league.joinCode)}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                              <button
                                onClick={() => shareLeague(league)}
                                className="w-full px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center justify-center gap-1"
                              >
                                <Share2 className="w-3 h-3" />
                                Share
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => openMatchesForLeague(league)}
                          className="px-3 py-2 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 flex items-center gap-2"
                          title="Open Matches view"
                        >
                          <Play className="w-4 h-4" /> Matches
                        </button>
                        <button
                          onClick={() => setExpandedLeagueId(expandedLeagueId === league._id ? null : league._id)}
                          className="px-3 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 flex items-center gap-2"
                          title="Toggle Standings"
                        >
                          <CheckSquare className="w-4 h-4" /> Standings
                        </button>

                        <button
                          onClick={() => handleEditLeague(league)}
                          className="px-3 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" /> Edit
                        </button>

                        <button
                          onClick={() => handleDeleteLeague(league._id)}
                          className="px-3 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Participants and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">
                          Participants ({league.participants?.length || 0}/{league.maxParticipants})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {league.participants?.length > 0 ? (
                            league.participants.map((participant) => 
                              renderParticipantWithLogo(participant, league)
                            )
                          ) : (
                            <p className="text-sm text-gray-500">No participants yet. Share the join code to get players!</p>
                          )}
                        </div>
                      </div>

                      {/* Generate Matches Button */}
                      {canGenerateMatches(league) && (
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => shuffleParticipants(league)}
                              disabled={loading}
                              className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 flex items-center gap-2 disabled:opacity-50"
                            >
                              <Shuffle className="w-4 h-4" />
                              Shuffle Teams
                            </button>
                          </div>
                          <div className="h-2" />
                          <button
                            onClick={() => generateMatches(league._id)}
                            disabled={loading}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50"
                          >
                            <CheckSquare className="w-4 h-4" />
                            {loading ? 'Starting...' : 'Start League'}
                          </button>
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            Ready to start!
                          </p>
                        </div>
                      )}

                      {league.status === 'draft' && league.participants?.length < 2 && (
                        <div className="ml-4">
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-semibold flex items-center gap-2"
                          >
                            <Clock className="w-4 h-4" />
                            Need {2 - (league.participants?.length || 0)} more
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Standings */}
                    {expandedLeagueId === league._id && (
                      <div className="mt-4 w-full">
                        <div className="overflow-x-auto rounded-lg border">
                          {getStandingsData(league).length > 0 ? (
                            <table className="w-full text-sm md:text-base">
                              <thead className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                                <tr>
                                  <th className="px-3 py-2">#</th>
                                  <th className="px-3 py-2 text-left">Team</th>
                                  <th className="px-3 py-2">P</th>
                                  <th className="px-3 py-2">W</th>
                                  <th className="px-3 py-2">D</th>
                                  <th className="px-3 py-2">L</th>
                                  <th className="px-3 py-2">GF</th>
                                  <th className="px-3 py-2">GA</th>
                                  <th className="px-3 py-2">GD</th>
                                  <th className="px-3 py-2">PTS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getStandingsData(league)
                                  .slice()
                                  .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor)
                                  .map((team, idx) => (
                                    <tr key={idx} className="text-center border-b hover:bg-yellow-50">
                                      <td className="px-2 py-2">{idx + 1}</td>
                                      <td className="flex items-center gap-3 text-left px-3 py-2">
                                        <img 
                                          src={team.logo} 
                                          alt={team.name} 
                                          className="w-8 h-8 rounded-full object-cover"
                                          onError={(e) => {
                                            e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(team.name)}&backgroundColor=blue,green&size=80`;
                                          }}
                                        />
                                        <span className="font-semibold">{team.name}</span>
                                      </td>
                                      <td>{team.played}</td>
                                      <td className="text-green-600 font-medium">{team.won}</td>
                                      <td className="text-yellow-600 font-medium">{team.drawn}</td>
                                      <td className="text-red-600 font-medium">{team.lost}</td>
                                      <td>{team.goalsFor}</td>
                                      <td>{team.goalsAgainst}</td>
                                      <td className={team.goalDifference > 0 ? 'text-green-600' : team.goalDifference < 0 ? 'text-red-600' : ''}>
                                        {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                                      </td>
                                      <td className="font-bold">{team.points}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="py-6 text-center text-sm text-gray-500">
                              No teams available yet. Add participants to view standings.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* RIGHT column - summary / actions */}
            <div className="space-y-4">
              <div className="bg-white/90 rounded-2xl shadow-md p-4">
                <h4 className="font-bold mb-2">Quick Actions</h4>
                <p className="text-sm text-gray-500 mb-3">Manage your leagues</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setActiveTab("create")}
                    className="w-full p-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-semibold text-center hover:shadow-lg transition-all"
                  >
                    Create New League
                  </button>
                  <button
                    onClick={() => setActiveTab("matches")}
                    className="w-full p-3 bg-gradient-to-r from-indigo-400 to-purple-500 text-white rounded-xl font-semibold text-center hover:shadow-lg transition-all"
                  >
                    Manage Matches
                  </button>
                </div>
              </div>

              <div className="bg-white/90 rounded-2xl shadow-md p-4">
                <h4 className="font-bold mb-2">League Stats</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Total Leagues</span>
                    <span className="font-semibold">{leagues.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Draft Leagues</span>
                    <span className="font-semibold text-blue-600">
                      {leagues.filter(l => l.status === 'draft').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Leagues</span>
                    <span className="font-semibold text-green-600">
                      {leagues.filter(l => l.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Participants</span>
                    <span className="font-semibold">
                      {leagues.reduce((acc, l) => acc + (l.participants?.length || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 rounded-2xl shadow-md p-4">
                <h4 className="font-bold mb-2">Admin Tips</h4>
                <div className="text-xs text-gray-600 space-y-2">
                  <p>• Create leagues with future start dates</p>
                  <p>• Share join codes with players</p>
                  <p>• Start league when you have at least 2 participants</p>
                  <p>• Matches are auto-generated between all teams</p>
                  <p>• Update match results to auto-update standings</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* MATCHES tab - Enhanced with team logos */}
      {activeTab === "matches" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {leagues.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No leagues yet</h3>
              <p className="text-gray-500 mb-4">
                Create a league first, then you can generate and manage matches here.
              </p>
              <button
                onClick={() => setActiveTab("create")}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-semibold"
              >
                Create League
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border p-4 space-y-3">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Choose League
                </h3>
                <p className="text-sm text-slate-500">
                  Select a league to view or generate its matches.
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {leagues.map((league) => (
                    <button
                      key={league._id}
                      onClick={() => setSelectedLeagueForMatches(league)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        selectedLeagueForMatches?._id === league._id
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg border-transparent"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate">{league.name}</span>
                        <span className="text-xs">{league.participants?.length || 0} teams</span>
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-2">
                        {getStatusBadge(league.status)}
                        <span className="text-slate-400">
                          {new Date(league.startDate).toLocaleDateString()} -{" "}
                          {new Date(league.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {selectedLeagueForMatches ? (
                  <>
                    <div className="bg-white/90 rounded-2xl shadow-lg border p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <LeagueIconDisplay
                            league={selectedLeagueForMatches}
                            size={64}
                            className="border-slate-200 bg-white"
                            rounded={false}
                          />
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">
                              {selectedLeagueForMatches.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {selectedLeagueForMatches.description}
                            </p>
                            <div className="text-xs text-slate-400 mt-1">
                              {new Date(selectedLeagueForMatches.startDate).toLocaleDateString()} -{" "}
                              {new Date(selectedLeagueForMatches.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-600">
                              Participants: {selectedLeagueForMatches.participants?.length || 0}/
                              {selectedLeagueForMatches.maxParticipants}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-600">
                              Matches: {selectedLeagueForMatches.matches?.length || 0}
                            </span>
                          </div>
                          <div>
                            {selectedLeagueForMatches.status === "draft" ? (
                              <button
                                onClick={() => generateMatches(selectedLeagueForMatches._id)}
                                disabled={
                                  loading ||
                                  (selectedLeagueForMatches.participants?.length || 0) < 2
                                }
                                className="w-full md:w-auto px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading ? "Generating..." : "Generate Matches"}
                              </button>
                            ) : (
                              <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium text-center">
                                {selectedLeagueForMatches.status === "active"
                                  ? "League is in progress"
                                  : "League completed"}
                              </div>
                            )}
                          </div>
                          {selectedLeagueForMatches.status === "draft" &&
                            (selectedLeagueForMatches.participants?.length || 0) < 2 && (
                              <p className="text-xs text-red-500">
                                Need at least 2 participants to generate matches.
                              </p>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/90 rounded-2xl shadow-lg border p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-indigo-500" />
                          Matches
                        </h4>
                        <div className="text-sm text-slate-500">
                          {selectedLeagueForMatches.matches?.length || 0} scheduled
                        </div>
                      </div>

                      {selectedLeagueForMatches.matches && selectedLeagueForMatches.matches.length > 0 ? (
                        <div className="space-y-6">
                          {/* Group matches by round */}
                          {Array.from(new Set(selectedLeagueForMatches.matches.map(m => m.roundNumber || 1)))
                            .sort((a, b) => a - b)
                            .map(roundNum => {
                              const roundMatches = selectedLeagueForMatches.matches
                                .filter(m => (m.roundNumber || 1) === roundNum)
                                .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
                              
                              return (
                                <div key={roundNum} className="space-y-3">
                                  <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-indigo-200">
                                    <div className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-bold text-sm">
                                      Round {roundNum}
                                    </div>
                                    <span className="text-xs text-slate-500">
                                      {roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}
                                    </span>
                                  </div>
                                  {roundMatches.map((match, idx) => (
                                    <div
                                      key={match._id || `${roundNum}-${idx}`}
                                      className="p-4 border rounded-xl bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                                    >
                                      <div className="flex items-center gap-4 flex-1">
                                        <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                          <div className="text-xs font-medium text-slate-500">Match</div>
                                          <div className="text-lg font-bold text-indigo-600">
                                            #{match.matchNumber || idx + 1}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-1">
                                          <div className="flex items-center gap-2">
                                            <img
                                              src={getTeamLogo(match.homeTeam, selectedLeagueForMatches)}
                                              alt={match.homeTeam}
                                              className="w-10 h-10 rounded-lg object-cover"
                                              onError={(e) => {
                                                e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(match.homeTeam)}&backgroundColor=blue,green&size=80`;
                                              }}
                                            />
                                            <span className="font-semibold text-slate-800">{match.homeTeam}</span>
                                          </div>
                                          <span className="text-slate-400 font-semibold">vs</span>
                                          <div className="flex items-center gap-2">
                                            <img
                                              src={getTeamLogo(match.awayTeam, selectedLeagueForMatches)}
                                              alt={match.awayTeam}
                                              className="w-10 h-10 rounded-lg object-cover"
                                              onError={(e) => {
                                                e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(match.awayTeam)}&backgroundColor=purple,orange&size=80`;
                                              }}
                                            />
                                            <span className="font-semibold text-slate-800">{match.awayTeam}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        {editingMatchId === match._id ? (
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="number"
                                              min="0"
                                              value={tempHomeGoals}
                                              onChange={(e) => setTempHomeGoals(e.target.value)}
                                              className="w-16 text-center border rounded-lg p-2"
                                              placeholder="0"
                                            />
                                            <span className="font-bold">-</span>
                                            <input
                                              type="number"
                                              min="0"
                                              value={tempAwayGoals}
                                              onChange={(e) => setTempAwayGoals(e.target.value)}
                                              className="w-16 text-center border rounded-lg p-2"
                                              placeholder="0"
                                            />
                                            <button
                                              onClick={() => saveMatchResult(selectedLeagueForMatches._id, match._id)}
                                              disabled={savingResult}
                                              className="px-3 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50"
                                            >
                                              {savingResult ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                              onClick={cancelEditResult}
                                              className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="text-sm text-slate-600">
                                              {match.played
                                                ? `Final: ${match.homeGoals} - ${match.awayGoals}`
                                                : match.date
                                                  ? new Date(match.date).toLocaleDateString()
                                                  : "TBD"}
                                            </div>
                                            <div
                                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                match.played ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                                              }`}
                                            >
                                              {match.played ? "Finished" : "Scheduled"}
                                            </div>
                                            <button
                                              onClick={() => beginEditResult(match)}
                                              className="px-3 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600"
                                            >
                                              Enter Result
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-slate-500 border border-dashed border-slate-200 rounded-xl">
                          <p className="text-lg font-semibold mb-2">No matches yet</p>
                          {selectedLeagueForMatches.status === "draft" ? (
                            <p className="text-sm">
                              Generate matches once you have at least two teams.
                            </p>
                          ) : (
                            <p className="text-sm">Matches will appear here once scheduled.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500">Select a league to manage its matches.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </PageLayout>
  );

  // Choose a league for match operations
  function openMatchesForLeague(league) {
    setSelectedLeagueForMatches(league);
    setActiveTab("matches");
  }
}