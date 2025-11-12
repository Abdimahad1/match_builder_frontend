// pages/Settings.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../components/PageLayout';

const API_URL = import.meta.env.VITE_API_URL;

// Curated global leagues with official team logos (20 teams each)
const GLOBAL_LEAGUES = [
  {
    code: 'EPL',
    name: 'Premier League',
    teams: [
      { name: 'Arsenal', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
      { name: 'Chelsea', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg' },
      { name: 'Liverpool', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
      { name: 'Manchester City', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
      { name: 'Manchester United', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg' },
      { name: 'Tottenham Hotspur', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg' },
      { name: 'Newcastle United', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg' },
      { name: 'Brighton & Hove Albion', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg' },
      { name: 'West Ham United', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg' },
      { name: 'Crystal Palace', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg' },
      { name: 'Aston Villa', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_FC_crest_%282016%29.svg' },
      { name: 'Everton', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg' },
      { name: 'Leicester City', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2d/Leicester_City_crest.svg' },
      { name: 'Wolverhampton Wanderers', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg' },
      { name: 'Southampton', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c9/FC_Southampton.svg' },
      { name: 'Leeds United', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/54/Leeds_United_F.C._logo.svg' },
      { name: 'Nottingham Forest', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg' },
      { name: 'Fulham', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg' },
      { name: 'Brentford', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg' },
      { name: 'Bournemouth', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg' }
    ]
  },
  {
    code: 'LL',
    name: 'La Liga',
    teams: [
      { name: 'Real Madrid', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
      { name: 'Barcelona', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
      { name: 'Atlético Madrid', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg' },
      { name: 'Sevilla', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg' },
      { name: 'Valencia', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/92/Valencia_CF.svg' },
      { name: 'Villarreal', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7e/Villarreal_CF_logo.svg' },
      { name: 'Real Betis', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_Betis_logo.svg' },
      { name: 'Real Sociedad', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg' },
      { name: 'Athletic Bilbao', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/03/Athletic_Club_Bilbao_logo.svg' },
      { name: 'Osasuna', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6b/CA_Osasuna_logo.svg' },
      { name: 'Celta Vigo', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/92/RC_Celta_de_Vigo_logo.svg' },
      { name: 'Mallorca', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/43/RCD_Mallorca_logo.svg' },
      { name: 'Girona', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/69/Girona_FC_logo.svg' },
      { name: 'Getafe', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/92/Getafe_CF_logo.svg' },
      { name: 'Almería', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/UD_Almer%C3%ADa_logo.svg' },
      { name: 'Rayo Vallecano', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/86/Rayo_Vallecano_logo.svg' },
      { name: 'Cádiz', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Cadiz_CF_logo.svg' },
      { name: 'Granada', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5f/Granada_CF_logo.svg' },
      { name: 'Las Palmas', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/21/UD_Las_Palmas_logo.svg' },
      { name: 'Deportivo Alavés', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Deportivo_Alav%C3%A9s_logo.svg' }
    ]
  },
  {
    code: 'SA',
    name: 'Serie A',
    teams: [
      { name: 'Juventus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_logo.svg' },
      { name: 'Inter', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Inter_Milan_logo_2021.svg' },
      { name: 'AC Milan', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg' },
      { name: 'Napoli', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Napoli.svg' },
      { name: 'Roma', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo.svg' },
      { name: 'Lazio', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e4/SS_Lazio_badge.svg' },
      { name: 'Atalanta', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6d/AtalantaBC.svg' },
      { name: 'Fiorentina', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6d/ACF_Fiorentina_2.svg' },
      { name: 'Bologna', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e0/Bologna_F.C._1909_logo.svg' },
      { name: 'Torino', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2d/Torino_FC_Logo.svg' },
      { name: 'Monza', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6d/AC_Monza_logo.svg' },
      { name: 'Genoa', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/37/Genoa_CFC_logo.svg' },
      { name: 'Lecce', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7d/U.S._Lecce_logo.svg' },
      { name: 'Sassuolo', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/05/U.S._Sassuolo_Calcio_logo.svg' },
      { name: 'Frosinone', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8c/Frosinone_Calcio_logo.svg' },
      { name: 'Udinese', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Udinese_Calcio_logo.svg' },
      { name: 'Empoli', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5c/Empoli_FC_logo.svg' },
      { name: 'Verona', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Hellas_Verona_FC_logo.svg' },
      { name: 'Cagliari', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/81/Cagliari_Calcio_2021.svg' },
      { name: 'Salernitana', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0d/U.S._Salernitana_1919_logo.svg' }
    ]
  },
  {
    code: 'BL',
    name: 'Bundesliga',
    teams: [
      { name: 'Bayern Munich', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg' },
      { name: 'Borussia Dortmund', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/66/Borussia_Dortmund_logo.svg' },
      { name: 'RB Leipzig', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg' },
      { name: 'Bayer Leverkusen', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg' },
      { name: 'Eintracht Frankfurt', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/04/Eintracht_Frankfurt_logo.svg' },
      { name: 'Wolfsburg', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f3/VfL_Wolfsburg_logo.svg' },
      { name: 'Borussia Mönchengladbach', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Borussia_M%C3%B6nchengladbach_logo.svg' },
      { name: 'Freiburg', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/28/SC_Freiburg_logo.svg' },
      { name: 'Union Berlin', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/44/1._FC_Union_Berlin_logo.svg' },
      { name: 'Stuttgart', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/33/VfB_Stuttgart_1893_Logo.svg' },
      { name: 'Werder Bremen', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/29/SV_Werder_Bremen_logo.svg' },
      { name: 'Hoffenheim', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f6/TSG_1899_Hoffenheim_logo.svg' },
      { name: 'Augsburg', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5f/FC_Augsburg_logo.svg' },
      { name: 'Mainz 05', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/91/1._FSV_Mainz_05_logo.svg' },
      { name: 'Köln', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/1._FC_K%C3%B6ln_logo.svg' },
      { name: 'Bochum', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/72/VfL_Bochum_logo.svg' },
      { name: 'Darmstadt 98', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6c/SV_Darmstadt_98_logo.svg' },
      { name: 'Heidenheim', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/67/1._FC_Heidenheim_logo.svg' },
      { name: 'Mönchengladbach', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Borussia_M%C3%B6nchengladbach_logo.svg' },
      { name: 'Hertha Berlin', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/81/Hertha_BSC_Logo_2012.svg' }
    ]
  },
  {
    code: 'L1',
    name: 'Ligue 1',
    teams: [
      { name: 'Paris Saint-Germain', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg' },
      { name: 'Marseille', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/43/Olympique_de_Marseille_logo.svg' },
      { name: 'Lyon', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/56/Olympique_Lyonnais_logo.svg' },
      { name: 'Monaco', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/28/AS_Monaco_FC_logo.svg' },
      { name: 'Lille', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/76/Lille_OSC_2018_logo.svg' },
      { name: 'Rennes', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3a/Stade_Rennais_FC_logo.svg' },
      { name: 'Nice', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2a/OGC_Nice_logo.svg' },
      { name: 'Lens', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4e/Racing_Club_de_Lens_logo.svg' },
      { name: 'Montpellier', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4e/Montpellier_H%C3%A9rault_Sport_Club_logo.svg' },
      { name: 'Reims', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7d/Stade_de_Reims_logo.svg' },
      { name: 'Nantes', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5c/FC_Nantes_logo.svg' },
      { name: 'Toulouse', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/67/Toulouse_FC_logo.svg' },
      { name: 'Strasbourg', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6a/Racing_Club_de_Strasbourg_logo.svg' },
      { name: 'Brest', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8c/Stade_Brestois_29_logo.svg' },
      { name: 'Le Havre', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Le_Havre_AC_logo.svg' },
      { name: 'Metz', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9a/FC_Metz_logo.svg' },
      { name: 'Clermont Foot', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6a/Clermont_Foot_63_logo.svg' },
      { name: 'Lorient', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9a/FC_Lorient_logo.svg' },
      { name: 'Auxerre', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7c/AJ_Auxerre_logo.svg' },
      { name: 'Angers', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6d/Angers_SCO_logo.svg' }
    ]
  }
];

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const [selectedLeagueCode, setSelectedLeagueCode] = useState('');
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [selectedTeamLogoUrl, setSelectedTeamLogoUrl] = useState('');

  const selectedLeague = useMemo(
    () => GLOBAL_LEAGUES.find(l => l.code === selectedLeagueCode) || null,
    [selectedLeagueCode]
  );
  const leagueTeams = selectedLeague ? selectedLeague.teams : [];

  const showAlert = useCallback((msg, success = false) => setAlert({ msg, success }), []);
  const closeAlert = () => setAlert(null);

  // Load current user settings - ONLY ONCE
  const fetchSettings = useCallback(async () => {
    const authToken = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : ''
        }
      });
      const data = await res.json();
      
      if (data.success) {
        const s = data.data?.settings || {};
        // Only set initial values, these won't be overwritten later
        setSelectedLeagueCode(s.selectedLeague?.code || '');
        setSelectedTeamName(s.selectedTeam?.name || '');
        setSelectedTeamLogoUrl(s.selectedTeam?.logoUrl || '');
        
        if (data.data) {
          localStorage.setItem('user', JSON.stringify(data.data));
        }
      } else {
        showAlert('Failed to load settings', false);
      }
    } catch (e) {
      console.error(e);
      showAlert('Server error while loading settings', false);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  // Load settings only once when component mounts
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle local team selection updates logo
  useEffect(() => {
    if (!selectedLeague) return;
    const team = selectedLeague.teams.find(t => t.name === selectedTeamName);
    if (team) {
      setSelectedTeamLogoUrl(team.logoUrl);
    }
  }, [selectedLeague, selectedTeamName]);

  const onSave = async () => {
    setSaving(true);
    try {
      const authToken = localStorage.getItem('token');
      const updatedSettings = {
        selectedLeague: {
          code: selectedLeagueCode,
          name: selectedLeague?.name || ''
        },
        selectedTeam: {
          name: selectedTeamName,
          logoUrl: selectedTeamLogoUrl
        }
      };
      
      const res = await fetch(`${API_URL}/api/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : ''
        },
        body: JSON.stringify(updatedSettings)
      });
      
      const data = await res.json();
      if (!data.success) {
        showAlert(data.message || 'Failed to save settings', false);
        return;
      }
      
      showAlert('Settings saved successfully', true);
      
      // Update local storage with new settings
      if (data.data) {
        localStorage.setItem('user', JSON.stringify(data.data));
        // Don't reset the state here - keep the user's current selection
      }
    } catch (e) {
      console.error(e);
      showAlert('Server error while saving settings', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout
      pageTitle="Settings & Preferences"
      pageDescription="Choose your favorite team from global leagues and manage your preferences."
      pageColor="from-gray-500 to-gray-700"
    >
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className={`mb-4 w-full px-4 py-3 rounded-2xl text-sm font-semibold ${
              alert.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{alert.msg}</span>
              <button onClick={closeAlert} className="text-xs px-2 py-1 rounded-md bg-black/10">Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="bg-white rounded-3xl p-4 md:p-8 shadow-lg border border-slate-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading settings…</div>
        ) : (
          <div className="space-y-6">
            {/* League and Team selection */}
            <div className="rounded-2xl border p-4 md:p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Choose Your Team Identity</h3>
              <p className="text-slate-600 mb-6">
                Select your favorite team from top leagues around the world. This will be used as your team's identity across all leagues you join.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">League</label>
                  <select
                    value={selectedLeagueCode}
                    onChange={(e) => {
                      setSelectedLeagueCode(e.target.value);
                      setSelectedTeamName('');
                      setSelectedTeamLogoUrl('');
                    }}
                    className="w-full rounded-xl border px-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                  >
                    <option value="">Select a league</option>
                    {GLOBAL_LEAGUES.map((l) => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Team</label>
                  <select
                    value={selectedTeamName}
                    onChange={(e) => setSelectedTeamName(e.target.value)}
                    className="w-full rounded-xl border px-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                    disabled={!selectedLeagueCode}
                  >
                    <option value="">{selectedLeagueCode ? 'Select a team' : 'Select league first'}</option>
                    {leagueTeams.map((t) => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Team Logo Preview</label>
                  <div className="w-full h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    {selectedTeamLogoUrl ? (
                      <img src={selectedTeamLogoUrl} alt="team logo" className="w-20 h-20 object-contain" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <div className="text-2xl mb-1">⚽</div>
                        <div className="text-xs">No team selected</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* League Info */}
              {selectedLeague && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-800">{selectedLeague.name}</h4>
                      <p className="text-blue-600 text-sm">
                        {leagueTeams.length} teams available • Choose your favorite
                      </p>
                    </div>
                    <div className="text-blue-800 font-bold text-sm">
                      {selectedLeague.code}
                    </div>
                  </div>
                </motion.div>
              )}

              <p className="text-xs text-slate-500 mt-4">
                Your selected team's official logo will be used as your identity across all leagues and matches.
              </p>
            </div>

            {/* Selected Team Preview */}
            {selectedTeamName && selectedTeamLogoUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border-2 border-green-200 bg-green-50 p-6"
              >
                <h4 className="font-bold text-green-800 mb-3">Your Selected Team</h4>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-xl border border-green-300 flex items-center justify-center overflow-hidden">
                    <img src={selectedTeamLogoUrl} alt={selectedTeamName} className="w-14 h-14 object-contain" />
                  </div>
                  <div>
                    <div className="font-bold text-green-900 text-lg">{selectedTeamName}</div>
                    <div className="text-green-700 text-sm">{selectedLeague?.name}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Save Actions */}
            <div className="rounded-2xl border p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-slate-600 text-sm">
                Your team selection will be saved to your account and used across the application.
              </div>
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !selectedTeamName}
                className={`px-6 py-3 rounded-2xl text-white font-bold shadow-md transition ${
                  saving || !selectedTeamName 
                    ? 'bg-indigo-300 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                }`}
              >
                {saving ? 'Saving…' : 'Save Team Selection'}
              </button>
            </div>

            {/* Available Leagues Overview */}
            <div className="rounded-2xl border p-4 md:p-6 bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-4">Available Leagues</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GLOBAL_LEAGUES.map((league) => (
                  <div
                    key={league.code}
                    className={`p-3 rounded-xl border transition-all ${
                      selectedLeagueCode === league.code
                        ? 'bg-white border-indigo-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-800 text-sm">{league.name}</span>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
                        {league.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {league.teams.length} teams
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </PageLayout>
  );
};

export default Settings;