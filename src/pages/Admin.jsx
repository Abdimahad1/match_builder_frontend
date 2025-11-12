// pages/Admin.jsx
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { useNavigate } from 'react-router-dom'; // <-- import hook
import { useEffect, useMemo, useState } from 'react';

const Admin = () => {
const navigate = useNavigate(); // <-- hook

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLeagues: 0,
    pendingMatches: 0,
    revenue: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    phoneNumber: '',
    role: 'player'
  });
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createPwVisible, setCreatePwVisible] = useState(false);

  // Edit per-user
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    phoneNumber: '',
    role: 'player',
    password: '' // optional reset
  });
  const [editBusy, setEditBusy] = useState(false);
  const [pwVisibleUserId, setPwVisibleUserId] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/stats', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        const data = await res.json();
        if (data.success) {
          setStats({
            totalUsers: data.data.totalUsers || 0,
            activeLeagues: data.data.activeLeagues || 0,
            pendingMatches: data.data.pendingMatches || 0,
            revenue: data.data.revenue || 0
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, [token]);

  // User management helpers
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await fetch('http://localhost:5000/api/auth/users', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  const openUserModal = () => {
    setUserModalOpen(true);
    setCreateError('');
    setCreateSuccess('');
    fetchUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    if (!createForm.username || !createForm.password || !createForm.phoneNumber) {
      setCreateError('Please fill all fields');
      return;
    }
    try {
      setCreateBusy(true);
      const res = await fetch('http://localhost:5000/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (!data.success) {
        setCreateError(data.message || 'Failed to create user');
        return;
      }
      setCreateSuccess('User created successfully');
      setCreateForm({ username: '', password: '', phoneNumber: '', role: 'player' });
      fetchUsers();
      // refresh stats to update counts
      setLoadingStats(true);
      try {
        const sres = await fetch('http://localhost:5000/api/auth/stats', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const sdata = await sres.json();
        if (sdata.success) {
          setStats({
            totalUsers: sdata.data.totalUsers || 0,
            activeLeagues: sdata.data.activeLeagues || 0,
            pendingMatches: sdata.data.pendingMatches || 0,
            revenue: sdata.data.revenue || 0
          });
        }
      } catch {}
      setLoadingStats(false);
    } catch (e) {
      console.error(e);
      setCreateError('Server error while creating user');
    } finally {
      setCreateBusy(false);
    }
  };

  const beginEditUser = (u) => {
    setEditingUserId(u._id);
    setPwVisibleUserId(null);
    setEditForm({
      username: u.username || '',
      phoneNumber: u.phoneNumber || '',
      role: u.role || 'player',
      password: ''
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setPwVisibleUserId(null);
    setEditForm({ username: '', phoneNumber: '', role: 'player', password: '' });
  };

  const saveEditUser = async (id) => {
    try {
      setEditBusy(true);
      const payload = {
        username: editForm.username,
        phoneNumber: editForm.phoneNumber,
        role: editForm.role
      };
      if (editForm.password) payload.password = editForm.password;
      const res = await fetch(`http://localhost:5000/api/auth/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to update user');
        return;
      }
      await fetchUsers();
      // refresh stats as well
      const sres = await fetch('http://localhost:5000/api/auth/stats', {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const sdata = await sres.json();
      if (sdata.success) {
        setStats({
          totalUsers: sdata.data.totalUsers || 0,
          activeLeagues: sdata.data.activeLeagues || 0,
          pendingMatches: sdata.data.pendingMatches || 0,
          revenue: sdata.data.revenue || 0
        });
      }
      cancelEditUser();
    } catch (e) {
      console.error(e);
      alert('Server error while updating user');
    } finally {
      setEditBusy(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to delete user');
        return;
      }
      await fetchUsers();
      // refresh stats
      const sres = await fetch('http://localhost:5000/api/auth/stats', {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const sdata = await sres.json();
      if (sdata.success) {
        setStats({
          totalUsers: sdata.data.totalUsers || 0,
          activeLeagues: sdata.data.activeLeagues || 0,
          pendingMatches: sdata.data.pendingMatches || 0,
          revenue: sdata.data.revenue || 0
        });
      }
    } catch (e) {
      console.error(e);
      alert('Server error while deleting user');
    }
  };

  const adminCards = [
   {
      id: 1,
      title: "Create League",
      description: "Create new football leagues and tournaments",
      icon: "🏆",
      color: "from-yellow-500 to-orange-500",
      action: "Create",
      stats: `${stats.activeLeagues} Active Leagues`,
      route: "/create-league" // <-- add route for navigation
    },
    {
      id: 2,
      title: "Manage Matches",
      description: "Schedule and manage face-to-face matches",
      icon: "⚽",
      color: "from-green-500 to-emerald-500",
      action: "Manage",
      stats: `${stats.pendingMatches} Upcoming Matches`,
      route: { path: "/create-league", tab: "matches" }
    },
    {
      id: 3,
      title: "User Management",
      description: "Create and manage user accounts",
      icon: "👥",
      color: "from-blue-500 to-cyan-500",
      action: "Manage Users",
      stats: `${stats.totalUsers} Registered Users`,
      onClick: openUserModal
    },
    {
      id: 4,
      title: "Reports & Analytics",
      description: "View system reports and analytics",
      icon: "📈",
      color: "from-purple-500 to-pink-500",
      action: "View Reports",
      stats: "24/7 Monitoring"
    },
    {
      id: 5,
      title: "System Settings",
      description: "Configure system-wide settings",
      icon: "⚙️",
      color: "from-gray-500 to-gray-700",
      action: "Configure",
      stats: "All Systems Operational"
    },
    {
      id: 6,
      title: "Content Management",
      description: "Manage website content and announcements",
      icon: "📝",
      color: "from-indigo-500 to-blue-500",
      action: "Manage Content",
      stats: "—"
    },
    {
      id: 7,
      title: "Payment Management",
      description: "Handle payments and subscriptions",
      icon: "💳",
      color: "from-green-500 to-teal-500",
      action: "Manage Payments",
      stats: `$${stats.revenue}`
    },
    {
      id: 8,
      title: "Security & Logs",
      description: "Monitor security and access logs",
      icon: "🔒",
      color: "from-red-500 to-pink-500",
      action: "View Logs",
      stats: "0 Security Issues"
    }
  ];

  const quickStats = [
    { label: "Total Users", value: String(stats.totalUsers), change: "", icon: "👥" },
    { label: "Active Leagues", value: String(stats.activeLeagues), change: "", icon: "🏆" },
    { label: "Pending Matches", value: String(stats.pendingMatches), change: "", icon: "⚽" },
    { label: "Revenue", value: `$${stats.revenue}`, change: "", icon: "💳" }
  ];

return (<>
  <PageLayout
    pageTitle="Admin Dashboard"
    pageDescription="Manage your football league system, users, matches, and analytics from one centralized dashboard."
    pageColor="from-purple-500 to-pink-500"
  >
    {/* Quick Stats */}
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {(loadingStats ? [
        { label: "Total Users", value: "—", change: "", icon: "👥" },
        { label: "Active Leagues", value: "—", change: "", icon: "🏆" },
        { label: "Pending Matches", value: "—", change: "", icon: "⚽" },
        { label: "Revenue", value: "—", change: "", icon: "💳" }
      ] : quickStats).map((stat, index) => (
        <motion.div
          key={stat.label}
          className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200"
          whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 300 } }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-400">
                {stat.change || ''}
              </p>
            </div>
            <div className="text-2xl">{stat.icon}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>

    {/* Admin Cards Grid */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Administration Tools</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
{adminCards.map((card, index) => (
  <motion.div
    key={card.id}
    className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group cursor-pointer"
    whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300 } }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, delay: index * 0.1 + 0.3 }}
  >
    {/* Card Header */}
    <div className="flex items-center justify-between mb-4">
      <motion.div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${card.color} flex items-center justify-center text-white text-xl`}
        whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
      >
        {card.icon}
      </motion.div>
      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
        {card.stats}
      </span>
    </div>

    {/* Card Content */}
    <h3 className="text-lg font-bold text-slate-800 mb-2">{card.title}</h3>
    <p className="text-slate-600 text-sm mbh-4">{card.description}</p>

    {/* Action Button */}
    <motion.button
      className={`w-full py-2 px-4 rounded-xl bg-gradient-to-r ${card.color} text-white font-semibold text-sm group-hover:shadow-lg transition-all duration-300`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        if (card.onClick) return card.onClick();
        if (card.route) {
          if (typeof card.route === 'string') {
            navigate(card.route);
          } else if (typeof card.route === 'object' && card.route.path) {
            navigate(card.route.path, { state: { tab: card.route.tab } });
          }
        }
      }} // <-- enhanced navigation (matches tab)
    >
      {card.action}
    </motion.button>
  </motion.div>
))}

      </div>
    </motion.div>

    {/* Recent Activity Section */}
    <motion.div
      className="mt-12 bg-white rounded-3xl p-6 shadow-lg border border-slate-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Activity</h2>

      <div className="space-y-4">
        {[
          { action: "New user registration", user: "John Smith", time: "2 minutes ago", icon: "👤" },
          { action: "League created", user: "Premier League", time: "1 hour ago", icon: "🏆" },
          { action: "Match scheduled", user: "Team A vs Team B", time: "3 hours ago", icon: "⚽" },
          { action: "Payment received", user: "$150.00", time: "5 hours ago", icon: "💳" },
          { action: "System backup", user: "Completed", time: "1 day ago", icon: "💾" }
        ].map((activity, index) => (
          <motion.div
            key={index}
            className="flex items-center space-x-4 p-3 rounded-xl hover:bg-slate-50 transition-colors duration-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 1 }}
          >
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-lg">{activity.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{activity.action}</p>
              <p className="text-sm text-slate-600">{activity.user} • {activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </PageLayout>

  {/* User Management Modal */}
  {userModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setUserModalOpen(false)} />
      <div className="relative bg-white w-[95%] md:w-[900px] rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">User Management</h3>
          <button
            onClick={() => setUserModalOpen(false)}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
          >
            Close
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create form */}
          <div className="rounded-2xl border p-4">
            <h4 className="font-semibold mb-3 text-slate-800">Create New User</h4>
            {createError && <div className="mb-2 text-sm text-red-600">{createError}</div>}
            {createSuccess && <div className="mb-2 text-sm text-green-600">{createSuccess}</div>}
            <form className="space-y-3" onSubmit={handleCreateUser}>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="e.g. admin001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                <input
                  type={createPwVisible ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setCreatePwVisible(v => !v)}
                  className="mt-2 text-xs text-slate-600 underline"
                >
                  {createPwVisible ? 'Hide password' : 'Show password'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={createForm.phoneNumber}
                  onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="+252 61 379 7852"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  <option value="player">Player</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createBusy}
                className={`w-full py-2 rounded-xl text-white font-semibold ${createBusy ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {createBusy ? 'Creating…' : 'Create User'}
              </button>
            </form>
          </div>
          {/* Users list */}
          <div className="rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-800">Existing Users</h4>
              <button
                onClick={fetchUsers}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
              >
                Refresh
              </button>
            </div>
            <div className="max-h-[380px] overflow-y-auto pr-1">
              {usersLoading ? (
                <div className="text-slate-500 text-sm">Loading users…</div>
              ) : users.length === 0 ? (
                <div className="text-slate-500 text-sm">No users yet.</div>
              ) : (
                <div className="space-y-2">
                  {users.map(u => {
                    const isEditing = editingUserId === u._id;
                    return (
                      <div key={u._id} className="p-3 rounded-xl border">
                        {!isEditing ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">👤</div>
                              <div>
                                <div className="font-medium text-slate-800">{u.username}</div>
                                <div className="text-xs text-slate-500">{u.phoneNumber}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                {u.role}
                              </span>
                              <button
                                onClick={() => beginEditUser(u)}
                                className="px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteUser(u._id)}
                                className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Username</label>
                                <input
                                  type="text"
                                  value={editForm.username}
                                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                  className="w-full rounded-lg border px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Phone</label>
                                <input
                                  type="tel"
                                  value={editForm.phoneNumber}
                                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                  className="w-full rounded-lg border px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Role</label>
                                <select
                                  value={editForm.role}
                                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                  className="w-full rounded-lg border px-3 py-2 bg-white"
                                >
                                  <option value="player">Player</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">New Password (optional)</label>
                                <input
                                  type={pwVisibleUserId === u._id ? 'text' : 'password'}
                                  value={editForm.password}
                                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                  className="w-full rounded-lg border px-3 py-2"
                                  placeholder="Leave blank to keep current"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPwVisibleUserId(prev => prev === u._id ? null : u._id)}
                                  className="mt-1 text-xs text-slate-600 underline"
                                >
                                  {pwVisibleUserId === u._id ? 'Hide' : 'Show'} password
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={cancelEditUser}
                                className="px-3 py-2 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEditUser(u._id)}
                                disabled={editBusy}
                                className={`px-3 py-2 text-xs rounded-lg text-white ${editBusy ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                              >
                                {editBusy ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</>);

};

export default Admin;