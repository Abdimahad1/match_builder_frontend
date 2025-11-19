// Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-clear storage for fresh login
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
  }, []);

  const showAlert = (msg, success = false) => {
    setAlert({ msg, success });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      showAlert("❌ Please fill in all fields", false);
      return;
    }

    setLoading(true);
    const performanceStart = performance.now();

    try {
      const requestStart = performance.now();
      console.log('🔐 Starting login process...');
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Request-ID": Date.now().toString(36) + Math.random().toString(36).substr(2)
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const requestTime = performance.now() - requestStart;
      console.log(`⏱️ API response received in: ${requestTime.toFixed(2)}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Login failed: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Login successful, processing response...');

      if (!data.success) {
        showAlert(`❌ ${data.message || "Login failed"}`, false);
        return;
      }

      // ULTRA-FAST STORAGE PROCESSING
      const storageStart = performance.now();
      
      try {
        // Store essential data only - minimal footprint
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("role", data.data.role);
        localStorage.setItem("username", data.data.username);

        // Minimal user data - only what's absolutely needed
        const essentialUserData = {
          _id: data.data._id,
          username: data.data.username,
          role: data.data.role,
          isAdmin: data.data.isAdmin
          // Skip optional fields for faster storage
        };
        
        localStorage.setItem("user", JSON.stringify(essentialUserData));
        
        const storageTime = performance.now() - storageStart;
        console.log(`💾 Storage completed in: ${storageTime.toFixed(2)}ms`);
        
      } catch (storageError) {
        console.error('Storage error:', storageError);
        throw new Error('Failed to save session data');
      }

      // IMMEDIATE NAVIGATION - NO DELAYS
      const totalTime = performance.now() - performanceStart;
      console.log(`🎯 Login completed in: ${totalTime.toFixed(2)}ms - Redirecting immediately`);
      
      showAlert("✅ Login Successful! Redirecting...", true);
      
      // INSTANT navigation - no setTimeout
      const route = data.data.role === "admin" ? "/admin" : "/dashboard";
      navigate(route, { replace: true });

    } catch (error) {
      const totalTime = performance.now() - performanceStart;
      console.error(`💥 Login failed after ${totalTime.toFixed(2)}ms:`, error);
      
      if (error.name === 'AbortError') {
        showAlert("⏰ Request timeout - please try again", false);
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showAlert("🌐 Network error - check your connection", false);
      } else {
        showAlert(`❌ ${error.message}`, false);
      }
    } finally {
      setLoading(false);
    }
  };

  const closeAlert = () => setAlert(null);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-2 overflow-hidden">

      {/* PERFORMANCE-OPTIMIZED ALERT */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl text-white font-semibold flex items-center space-x-4 ${
              alert.success ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <span>{alert.msg}</span>
            <button
              onClick={closeAlert}
              className="ml-4 text-white bg-black/20 hover:bg-black/40 px-2 py-1 rounded-xl font-bold transition"
            >
              ✖
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OPTIMIZED LOGIN CARD */}
      <div className="w-full max-w-5xl h-[90vh] md:h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* LEFT SIDE - OPTIMIZED IMAGE */}
        <div className="relative w-full md:w-1/2 h-1/3 md:h-full">
          <img
            src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6"
            alt="football"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager" // Load immediately
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-slate-900/30"></div>
          <div className="absolute bottom-6 left-4 text-white md:hidden">
            <h1 className="text-3xl font-extrabold">Face2Face League</h1>
            <p className="text-blue-200 text-sm">Please login to continue.</p>
          </div>
        </div>

        {/* RIGHT SIDE - OPTIMIZED FORM */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-6 md:p-12">
          <div className="w-full max-w-sm">

            <div className="hidden md:block mb-8">
              <h1 className="text-4xl font-bold text-gray-800">Face2Face League</h1>
              <p className="text-gray-600">Welcome back! Please login.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* USERNAME FIELD */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 bg-white 
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                    transition-all duration-200"
                    placeholder="Enter username"
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 
                    bg-gradient-to-r from-blue-400 to-blue-600 rounded-full text-white 
                    flex items-center justify-center text-sm">
                    👤
                  </span>
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 bg-white 
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                    transition-all duration-200"
                    placeholder="Enter password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 
                    bg-gradient-to-r from-green-400 to-green-600 rounded-full text-white 
                    flex items-center justify-center text-sm">
                    🔒
                  </span>
                </div>
              </div>

              {/* HIGH-PERFORMANCE SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 
                text-white py-4 rounded-2xl font-bold text-lg shadow-lg 
                hover:shadow-xl transition-all duration-200 
                disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  "Log In →"
                )}
              </button>
            </form>

            <p className="text-xs text-center mt-6 text-gray-500 bg-gray-50 p-3 rounded-2xl border">
              📲 Hadii aadan laheen account fadlan laxiriir +252 613797852.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}