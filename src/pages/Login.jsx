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
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
  }, []);

  const showAlert = (msg, success = false) => {
    setAlert({ msg, success });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!username.trim() || !password.trim()) {
      showAlert("❌ Please fill in all fields", false);
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    let timeoutId;

    try {
      // Set timeout for the request
      timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds

      const startTime = Date.now();
      
      console.log('🔐 Sending login request to:', `${API_URL}/api/auth/login`);
      
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Request-ID": Date.now().toString()
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'include'
      });

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ Login API response time: ${responseTime}ms`);
      console.log('📨 Response status:', res.status, res.statusText);

      // Check if response is OK
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('✅ Login response data:', data);

      if (!data.success) {
        showAlert("❌ " + (data.message || "Login failed"), false);
        setLoading(false);
        return;
      }

      // ✅ Store user data immediately
      localStorage.clear();
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("role", data.data.role);
      localStorage.setItem("username", data.data.username);

      // ✅ Use the user data from login response directly
      const userData = {
        _id: data.data._id,
        userCode: data.data.userCode,
        username: data.data.username,
        phoneNumber: data.data.phoneNumber,
        role: data.data.role,
        isAdmin: data.data.isAdmin,
        settings: data.data.settings || {
          profileImageUrl: "",
          selectedLeague: { code: "", name: "" },
          selectedTeam: { name: "", logoUrl: "" }
        }
      };
      
      localStorage.setItem("user", JSON.stringify(userData));

      console.log('💾 User data stored:', userData);

      showAlert("🎉 Login Successful! Redirecting...", true);

      // ✅ Navigate immediately
      const route = data.data.role === "admin" ? "/admin" : "/dashboard";
      
      setTimeout(() => {
        navigate(route, { replace: true });
      }, 1000);

    } catch (error) {
      console.error("💥 Login error details:", error);
      console.error("📛 Error name:", error.name);
      console.error("📝 Error message:", error.message);
      
      if (error.name === 'AbortError') {
        showAlert("❌ Request timeout - server took too long to respond", false);
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        showAlert("❌ Network error - cannot connect to server. Please check your connection.", false);
      } else if (error.message.includes('HTTP error')) {
        showAlert("❌ Server error - please try again later", false);
      } else {
        showAlert("❌ Login failed: " + error.message, false);
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
    }
  };

  const closeAlert = () => setAlert(null);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-2 overflow-hidden">

      {/* ANIMATED ALERT */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.8 }}
            animate={{ y: 20, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
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

      {/* MAIN CARD */}
      <div className="w-full max-w-5xl h-[90vh] md:h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* LEFT SIDE IMAGE */}
        <div className="relative w-full md:w-1/2 h-1/3 md:h-full">
          <img
            src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6"
            alt="football"
            className="absolute inset-0 w-full h-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-slate-900/30"></div>
          <div className="absolute bottom-6 left-4 text-white md:hidden">
            <h1 className="text-3xl font-extrabold">Face2Face League</h1>
            <p className="text-blue-200 text-sm">Please login to continue.</p>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-6 md:p-12">
          <div className="w-full max-w-sm">

            <div className="hidden md:block mb-8">
              <h1 className="text-4xl font-bold text-gray-800">Face2Face League</h1>
              <p className="text-gray-600">Welcome back! Please login.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* USERNAME */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 bg-white 
                    focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 
                    transition-all duration-300 shadow-lg hover:shadow-xl"
                    placeholder="Enter username"
                    required
                    disabled={loading}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 
                    bg-gradient-to-r from-blue-400 to-blue-600 rounded-full text-white 
                    flex items-center justify-center text-sm shadow-md">
                    👤
                  </span>
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 bg-white 
                    focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 
                    transition-all duration-300 shadow-lg hover:shadow-xl"
                    placeholder="Enter password"
                    required
                    disabled={loading}
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
                    flex items-center justify-center text-sm shadow-md">
                    🔒
                  </span>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 
                text-white py-4 rounded-2xl font-bold text-lg shadow-xl 
                hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 
                disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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