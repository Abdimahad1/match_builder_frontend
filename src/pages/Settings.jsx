// pages/Settings.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../components/PageLayout';

// Curated global leagues with official team logos (sample set)
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
      { name: 'Tottenham Hotspur', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg' }
    ]
  },
  {
    code: 'LL',
    name: 'La Liga',
    teams: [
      { name: 'Real Madrid', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
      { name: 'Barcelona', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
      { name: 'Atlético Madrid', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg' },
      { name: 'Sevilla', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg' }
    ]
  },
  {
    code: 'SA',
    name: 'Serie A',
    teams: [
      { name: 'Juventus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_logo.svg' },
      { name: 'Inter', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Inter_Milan_logo_2021.svg' },
      { name: 'AC Milan', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg' },
      { name: 'Napoli', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Napoli.svg' }
    ]
  }
];

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [selectedLeagueCode, setSelectedLeagueCode] = useState('');
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [selectedTeamLogoUrl, setSelectedTeamLogoUrl] = useState('');

  const fileInputRef = useRef(null);
  const token = useMemo(() => localStorage.getItem('token') || '', []);

  const selectedLeague = useMemo(
    () => GLOBAL_LEAGUES.find(l => l.code === selectedLeagueCode) || null,
    [selectedLeagueCode]
  );
  const leagueTeams = selectedLeague ? selectedLeague.teams : [];

  const showAlert = (msg, success = false) => setAlert({ msg, success });
  const closeAlert = () => setAlert(null);

  // Load current user settings
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        const data = await res.json();
        if (!data.success) {
          showAlert('Failed to load settings', false);
          setLoading(false);
          return;
        }
        const s = data.data?.settings || {};
        setProfileImageUrl(s.profileImageUrl || '');
        setSelectedLeagueCode(s.selectedLeague?.code || '');
        setSelectedTeamName(s.selectedTeam?.name || '');
        setSelectedTeamLogoUrl(s.selectedTeam?.logoUrl || '');
        if (data.data) {
          localStorage.setItem('user', JSON.stringify(data.data));
        }
      } catch (e) {
        console.error(e);
        showAlert('Server error while loading settings', false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  // Handle local team selection updates logo
  useEffect(() => {
    if (!selectedLeague) return;
    const team = selectedLeague.teams.find(t => t.name === selectedTeamName);
    if (team) {
      setSelectedTeamLogoUrl(team.logoUrl);
    }
  }, [selectedLeague, selectedTeamName]);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Convert to base64 data URL for simple persistence
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result?.toString() || '';
      setProfileImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const updatedSettings = {
        profileImageUrl,
        selectedLeague: {
          code: selectedLeagueCode,
          name: selectedLeague?.name || ''
        },
        selectedTeam: {
          name: selectedTeamName,
          logoUrl: selectedTeamLogoUrl
        }
      };
      const res = await fetch('http://localhost:5000/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(updatedSettings)
      });
      const data = await res.json();
      if (!data.success) {
        showAlert(data.message || 'Failed to save settings', false);
        return;
      }
      showAlert('Settings saved successfully', true);
      if (data.data) {
        localStorage.setItem('user', JSON.stringify(data.data));
        const updated = data.data.settings || {};
        setProfileImageUrl(updated.profileImageUrl || '');
        setSelectedLeagueCode(updated.selectedLeague?.code || '');
        setSelectedTeamName(updated.selectedTeam?.name || '');
        setSelectedTeamLogoUrl(updated.selectedTeam?.logoUrl || '');
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
      pageDescription="Your team identity, avatar, and preferences — beautifully organized."
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avatar Card */}
            <div className="col-span-1">
              <div className="rounded-2xl border p-4 md:p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Team Profile Image</h3>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border flex items-center justify-center overflow-hidden">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">🧑‍🎤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={profileImageUrl}
                      onChange={(e) => setProfileImageUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        onChange={onPickFile}
                        type="file"
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
                      >
                        Choose from device
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileImageUrl('')}
                        className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* League and Team selection */}
            <div className="col-span-1 lg:col-span-2">
              <div className="rounded-2xl border p-4 md:p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Pick Your Original Team Logo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">League</label>
                    <select
                      value={selectedLeagueCode}
                      onChange={(e) => {
                        setSelectedLeagueCode(e.target.value);
                        setSelectedTeamName('');
                        setSelectedTeamLogoUrl('');
                      }}
                      className="w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
                      className="w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      disabled={!selectedLeagueCode}
                    >
                      <option value="">{selectedLeagueCode ? 'Select a team' : 'Select league first'}</option>
                      {leagueTeams.map((t) => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Preview</label>
                    <div className="w-full h-24 rounded-2xl bg-slate-50 border flex items-center justify-center overflow-hidden">
                      {selectedTeamLogoUrl ? (
                        <img src={selectedTeamLogoUrl} alt="team logo" className="w-24 h-24 object-contain" />
                      ) : (
                        <span className="text-slate-400 text-sm">No team selected</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Choose your favorite team from global leagues; we’ll use the official crest as your team’s logo.
                </p>
              </div>
            </div>

            {/* Save Actions */}
            <div className="col-span-1 lg:col-span-3">
              <div className="rounded-2xl border p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-slate-600 text-sm">
                  Your changes are saved to your account and apply across the app.
                </div>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className={`px-5 py-3 rounded-2xl text-white font-bold shadow-md transition ${
                    saving ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {saving ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </PageLayout>
  );
};

export default Settings;