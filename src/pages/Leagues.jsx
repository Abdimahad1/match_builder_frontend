// pages/Leagues.jsx
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { LeagueIconDisplay } from '../utils/leagueIcons';

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

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/leagues`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch leagues');
        }
        const leagueList = Array.isArray(data.data) ? data.data : [];
        setLeagues(leagueList);
        if (leagueList.length > 0) {
          setActiveLeagueId(leagueList[0]._id);
        }
      } catch (err) {
        console.error('Error fetching leagues:', err);
        setError(err.message || 'Unable to load leagues');
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

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

  return (
    <PageLayout
      pageTitle="Leagues & Tournaments"
      pageDescription="Explore different leagues, tournaments, and competitions. Track standings and your team's progress."
      pageColor="from-yellow-500 to-orange-500"
    >
      {loading && (
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 mb-6 text-center text-slate-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Fetching leagues…
        </motion.div>
      )}

      {!loading && error && (
        <motion.div
          className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {noLeaguesAvailable && (
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
          <h2 className="text-xl font-bold text-slate-800 mb-2">No leagues for selected filters</h2>
          <p className="text-slate-600">Try choosing a different year or month.</p>
        </motion.div>
      )}

      {currentLeague && (
        <>
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
              {filteredLeagues.map((league) => (
                <motion.button
                  key={league._id}
                  onClick={() => setActiveLeagueId(league._id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    activeLeagueId === league._id
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LeagueIconDisplay
                    league={league}
                    size={32}
                    className="bg-white border-slate-200"
                  />
                  <span>{league.name}</span>
                </motion.button>
              ))}
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
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                  <span className="text-sm font-semibold">
                    Matchday {matchdayDisplay}/{totalMatches}
                  </span>
                </div>
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
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
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
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      userTeam.position <= 2
                        ? 'bg-green-100 text-green-800'
                        : userTeam.position <= 4
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {userTeam.position <= 2
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
              {standings.map((team, index) => (
                <motion.div
                  key={team.position}
                  className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-xl border transition-all duration-300 ${
                    team.isUserTeam
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: team.isUserTeam ? 1 : 1.02 }}
                >
                  <div className="col-span-1 flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        team.position === 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : team.position === 2
                          ? 'bg-slate-200 text-slate-800'
                          : team.position === 3
                          ? 'bg-orange-100 text-orange-800'
                          : team.position <= 4
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {team.position}
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
                        team.isUserTeam ? 'text-blue-700 font-bold' : 'text-slate-800'
                      }`}
                    >
                      {team.team}
                    </span>
                    {team.isUserTeam && (
                      <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                        YOU
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
                    <span className="bg-slate-800 text-white px-2 py-1 rounded-full text-sm font-bold min-w-8 text-center">
                      {team.points}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
                  <span>Champion</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded" />
                  <span>Runner-up</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded" />
                  <span>Third Place</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded" />
                  <span>European Places</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-50 border-2 border-blue-300 border-dashed rounded" />
                  <span className="font-medium text-blue-700">Your Team</span>
                </div>
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
                return (
                  <div
                    key={participant._id || index}
                    className={`flex items-center space-x-2 bg-slate-100 rounded-full px-3 py-2 ${
                      participant.teamName === userParticipant?.teamName ? 'bg-blue-100 border border-blue-200' : ''
                    }`}
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
                    {participant.teamName === userParticipant?.teamName && (
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