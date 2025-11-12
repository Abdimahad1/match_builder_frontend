// pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Calendar, Trophy, Users, TrendingUp, Play, CheckSquare, Clock } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState(null);
  const [myLeagues, setMyLeagues] = useState([]);
  const [userMatches, setUserMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcoming: 0,
    leagues: 0,
    points: 0,
    winRate: 0,
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0
  });
  const [nextMatch, setNextMatch] = useState(null);
  const [userTeamNames, setUserTeamNames] = useState([]);
  const [userSettings, setUserSettings] = useState(null);

  // Get user info and fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error("No token found");
          setLoading(false);
          return;
        }

        // Fetch current user from API
        const [userRes, leaguesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          }).catch((err) => {
            console.error("Error fetching user:", err);
            return { data: { success: false } };
          }),
          axios.get("http://localhost:5000/api/leagues/my-leagues", {
            headers: { Authorization: `Bearer ${token}` }
          }).catch((err) => {
            console.error("Error fetching leagues:", err);
            return { data: { success: false, data: [] } };
          })
        ]);

        // Set user if fetch was successful
        if (userRes.data.success && userRes.data.data) {
          const userObj = userRes.data.data;
          setUser(userObj);
          setUserSettings(userObj.settings || null);
          localStorage.setItem('user', JSON.stringify(userObj));
        } else {
          // Fallback to localStorage if API fails
          const userData = localStorage.getItem('user');
          if (userData) {
            const userObj = JSON.parse(userData);
            setUser(userObj);
            setUserSettings(userObj.settings || null);
          }
        }

        if (leaguesRes.data && leaguesRes.data.success) {
          const leagues = leaguesRes.data.data || [];
          setMyLeagues(leagues);

          // Get current user ID (from API or localStorage fallback)
          const currentUser = userRes.data.success ? userRes.data.data : (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);
          const currentUserId = currentUser?._id || currentUser?.id;

          // Extract user's team names from all leagues
          const teamNames = [];
          leagues.forEach(league => {
            league.participants?.forEach(participant => {
              // Handle both populated userId object and string ID
              const participantUserId = participant.userId?._id || participant.userId?.id || participant.userId;
              if (participantUserId && (participantUserId.toString() === currentUserId?.toString() || participantUserId === currentUserId)) {
                teamNames.push(participant.teamName);
              }
            });
          });
          setUserTeamNames(teamNames);

          // Collect all matches where user's team is involved
          const allMatches = [];
          leagues.forEach(league => {
            if (league.matches && league.matches.length > 0) {
              league.matches.forEach(match => {
                const isUserTeam = teamNames.includes(match.homeTeam) || teamNames.includes(match.awayTeam);
                if (isUserTeam) {
                  allMatches.push({
                    ...match,
                    leagueName: league.name,
                    leagueId: league._id,
                    userTeam: teamNames.includes(match.homeTeam) ? match.homeTeam : match.awayTeam,
                    opponent: teamNames.includes(match.homeTeam) ? match.awayTeam : match.homeTeam,
                    isHome: teamNames.includes(match.homeTeam)
                  });
                }
              });
            }
          });

          // Sort matches by round and match number
          allMatches.sort((a, b) => {
            const roundA = a.roundNumber || 1;
            const roundB = b.roundNumber || 1;
            if (roundA !== roundB) return roundA - roundB;
            return (a.matchNumber || 0) - (b.matchNumber || 0);
          });

          setUserMatches(allMatches);

          // Find next match (first unplayed match)
          const next = allMatches.find(m => !m.played);
          setNextMatch(next);

          // Calculate statistics
          const playedMatches = allMatches.filter(m => m.played);
          const upcomingMatches = allMatches.filter(m => !m.played);
          
          let wins = 0;
          let draws = 0;
          let losses = 0;
          let totalPoints = 0;

          playedMatches.forEach(match => {
            const userTeam = match.userTeam;
            const isHome = match.isHome;
            const homeGoals = match.homeGoals || 0;
            const awayGoals = match.awayGoals || 0;
            
            if (isHome) {
              if (homeGoals > awayGoals) {
                wins++;
                totalPoints += 3;
              } else if (homeGoals === awayGoals) {
                draws++;
                totalPoints += 1;
              } else {
                losses++;
              }
            } else {
              if (awayGoals > homeGoals) {
                wins++;
                totalPoints += 3;
              } else if (awayGoals === homeGoals) {
                draws++;
                totalPoints += 1;
              } else {
                losses++;
              }
            }
          });

          const winRate = playedMatches.length > 0 
            ? Math.round((wins / playedMatches.length) * 100) 
            : 0;

          setStats({
            upcoming: upcomingMatches.length,
            leagues: leagues.length,
            points: totalPoints,
            winRate: winRate,
            matchesPlayed: playedMatches.length,
            wins,
            draws,
            losses
          });
        } else {
          // If leagues API failed, set empty arrays
          setMyLeagues([]);
          setUserMatches([]);
          setUserTeamNames([]);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        // Set empty state on error
        setMyLeagues([]);
        setUserMatches([]);
        setUserTeamNames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTeamLogo = (teamName, league) => {
    if (!teamName) {
      return `https://api.dicebear.com/7.x/shapes/svg?seed=unknown&backgroundColor=blue,green&size=80`;
    }

    const normalizedTeamName = teamName.trim().toLowerCase();

    const selectedTeam = userSettings?.selectedTeam;
    if (
      selectedTeam?.name &&
      selectedTeam?.logoUrl &&
      selectedTeam.name.trim().toLowerCase() === normalizedTeamName
    ) {
      return selectedTeam.logoUrl;
    }

    const participantLogo = league?.participants?.find(
      participant => participant.teamName && participant.teamName.trim().toLowerCase() === normalizedTeamName
    );
    if (participantLogo?.teamLogoUrl || participantLogo?.teamLogo) {
      return participantLogo.teamLogoUrl || participantLogo.teamLogo;
    }

    const leagueTeam = league?.teams?.find(
      team => team.name && team.name.trim().toLowerCase() === normalizedTeamName
    );
    if (leagueTeam?.logoUrl || leagueTeam?.logo) {
      return leagueTeam.logoUrl || leagueTeam.logo;
    }

    return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=blue,green&size=80`;
  };

  const filteredMatches = userMatches.filter(match => {
    if (activeTab === "all") return true;
    if (activeTab === "now") return false; // No live matches for now
    if (activeTab === "finished") return match.played;
    if (activeTab === "scheduled") return !match.played;
    return true;
  });

  const tabs = [
    { id: "all", label: "All Matches", count: userMatches.length },
    { id: "finished", label: "Finished", count: userMatches.filter(m => m.played).length },
    { id: "scheduled", label: "Scheduled", count: userMatches.filter(m => !m.played).length }
  ];

  if (loading) {
    return (
      <PageLayout
        pageTitle="Dashboard Overview"
        pageDescription="Welcome to your dashboard! View upcoming matches, track your team, and manage the league."
        pageColor="from-blue-500 to-cyan-500"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your dashboard...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      pageTitle="Dashboard Overview"
      pageDescription="Welcome to your dashboard! View upcoming matches, track your team, and manage the league."
      pageColor="from-blue-500 to-cyan-500"
    >
      {/* Next Match Card */}
      {nextMatch ? (
        <motion.div
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-4 shadow-2xl text-white mb-6 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col items-center space-y-4">
            {/* NEXT MATCH Badge */}
            <motion.div 
              className="bg-white/20 rounded-full px-4 py-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-sm font-semibold">NEXT MATCH</span>
            </motion.div>

            {/* League Name */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-bold">{nextMatch.leagueName}</h3>
              {nextMatch.roundNumber && (
                <p className="text-sm text-white/80 mt-1">Round {nextMatch.roundNumber} • Match #{nextMatch.matchNumber}</p>
              )}
            </motion.div>

            {/* Teams Row */}
            <div className="flex items-center justify-between w-full px-2">
              {/* User Team */}
              <motion.div 
                className="flex flex-col items-center text-center flex-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-2">
                  <img 
                    src={getTeamLogo(nextMatch.userTeam, myLeagues.find(l => l._id === nextMatch.leagueId))} 
                    alt={nextMatch.userTeam}
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                </div>
                <p className="font-semibold text-sm mb-1">{nextMatch.userTeam}</p>
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full mt-1">
                  My Team
                </span>
              </motion.div>

              {/* VS Center */}
              <motion.div 
                className="flex flex-col items-center mx-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center font-bold text-white mb-2">
                  VS
                </div>
              </motion.div>

              {/* Opponent Team */}
              <motion.div 
                className="flex flex-col items-center text-center flex-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-2">
                  <img 
                    src={getTeamLogo(nextMatch.opponent, myLeagues.find(l => l._id === nextMatch.leagueId))} 
                    alt={nextMatch.opponent}
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                </div>
                <p className="font-semibold text-sm mb-1">{nextMatch.opponent}</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="bg-gradient-to-r from-slate-400 to-slate-500 rounded-3xl p-6 shadow-2xl text-white mb-6 w-full text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-80" />
          <h3 className="text-xl font-bold mb-2">No Upcoming Matches</h3>
          <p className="text-white/80">
            {myLeagues.length === 0 
              ? "Join a league to start playing matches!" 
              : "All your matches have been played or no matches have been generated yet."}
          </p>
        </motion.div>
      )}

      {/* Quick Stats */}
      <motion.div 
        className="grid grid-cols-2 gap-3 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {[
          { label: "Matches Played", value: stats.matchesPlayed, icon: Play, color: "from-blue-500 to-cyan-500" },
          { label: "Leagues", value: stats.leagues, icon: Trophy, color: "from-green-500 to-emerald-500" },
          { label: "Points", value: stats.points, icon: TrendingUp, color: "from-yellow-500 to-orange-500" },
          { label: "Win Rate", value: `${stats.winRate}%`, icon: Users, color: "from-purple-500 to-pink-500" }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="bg-white rounded-2xl p-3 shadow-lg border border-slate-200"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, delay: index * 0.1 + 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-xs font-medium">{stat.label}</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center text-white`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Detailed Stats */}
      {stats.matchesPlayed > 0 && (
        <motion.div
          className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Match Record</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
              <div className="text-xs text-slate-600 mt-1">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.draws}</div>
              <div className="text-xs text-slate-600 mt-1">Draws</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
              <div className="text-xs text-slate-600 mt-1">Losses</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Matches Section */}
      {userMatches.length > 0 ? (
        <motion.div
          className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">My Matches</h2>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-100 rounded-2xl p-1 mb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap flex items-center space-x-1 ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className="bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Match List */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match, index) => {
                  const league = myLeagues.find(l => l._id === match.leagueId);
                  
                  // Calculate score from user's perspective
                  let userScore = null;
                  let opponentScore = null;
                  let matchResult = null; // 'win', 'loss', 'draw', or null
                  
                  if (match.played) {
                    const homeGoals = match.homeGoals || 0;
                    const awayGoals = match.awayGoals || 0;
                    
                    // Determine user's score and opponent's score based on isHome
                    if (match.isHome) {
                      userScore = homeGoals;
                      opponentScore = awayGoals;
                    } else {
                      userScore = awayGoals;
                      opponentScore = homeGoals;
                    }
                    
                    // Determine result
                    if (userScore > opponentScore) {
                      matchResult = 'win';
                    } else if (userScore < opponentScore) {
                      matchResult = 'loss';
                    } else {
                      matchResult = 'draw';
                    }
                  }
                  
                  return (
                    <motion.div
                      key={match._id || index}
                      className="bg-slate-50 rounded-2xl p-3 border border-slate-200 hover:border-slate-300 transition-all duration-300 group cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => window.location.href = '/match'}
                    >
                      {/* Teams Row */}
                      <div className="flex items-center justify-between">
                        {/* User Team */}
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <img 
                              src={getTeamLogo(match.userTeam, league)} 
                              alt={match.userTeam}
                              className="w-8 h-8 object-contain rounded-lg"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 text-sm truncate">{match.userTeam}</p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                            My Team
                          </span>
                        </div>

                        {/* Match Center */}
                        <div className="flex flex-col items-center mx-2">
                          <div className="mb-1">
                            {match.played && userScore !== null ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-xl font-bold ${
                                  matchResult === 'win' ? 'text-green-600' : 
                                  matchResult === 'loss' ? 'text-red-600' : 
                                  'text-yellow-600'
                                }`}>
                                  {userScore} - {opponentScore}
                                </span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  matchResult === 'win' ? 'bg-green-100 text-green-700' : 
                                  matchResult === 'loss' ? 'bg-red-100 text-red-700' : 
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {matchResult === 'win' ? 'WIN' : matchResult === 'loss' ? 'LOSS' : 'DRAW'}
                                </span>
                              </div>
                            ) : (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                VS
                              </span>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-slate-600 text-xs">{match.leagueName}</p>
                            {match.roundNumber && (
                              <p className="text-slate-500 text-xs">Round {match.roundNumber}</p>
                            )}
                          </div>
                        </div>

                        {/* Opponent Team */}
                        <div className="flex items-center space-x-2 flex-1 justify-end">
                          <div className="min-w-0 flex-1 text-right">
                            <p className="font-semibold text-slate-800 text-sm truncate">{match.opponent}</p>
                          </div>
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <img 
                              src={getTeamLogo(match.opponent, league)} 
                              alt={match.opponent}
                              className="w-8 h-8 object-contain rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status Bar */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                          match.played 
                            ? matchResult === 'win' 
                              ? 'bg-green-100 text-green-800' 
                              : matchResult === 'loss'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {match.played ? (
                            <>
                              <CheckSquare className="w-3 h-3" />
                              {matchResult === 'win' ? 'Won' : matchResult === 'loss' ? 'Lost' : 'Drawn'}
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Scheduled
                            </>
                          )}
                        </span>
                        <span className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors flex items-center space-x-1">
                          <span>View Details</span>
                          <span>→</span>
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No matches found for this filter.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Matches Yet</h3>
          <p className="text-slate-500 mb-4">
            {myLeagues.length === 0 
              ? "Join a league to start playing matches!" 
              : "Matches will appear here once they are generated for your leagues."}
          </p>
          {myLeagues.length === 0 && (
            <button
              onClick={() => window.location.href = '/match'}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Browse Leagues
            </button>
          )}
        </motion.div>
      )}
    </PageLayout>
  );
};

export default Dashboard;
