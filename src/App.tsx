import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Droplets, 
  Eye, 
  EyeOff, 
  ArrowRight,
  MapPin,
  UserCircle,
  LogOut,
  AlertCircle,
  Power,
  CheckCircle2,
  Share2,
  Heart,
  ShieldCheck,
  Zap,
  Bell,
  Calendar,
  Clock,
  Navigation
} from 'lucide-react';
import { BLOOD_GROUPS, User as UserType, AppNotification } from './types';

// --- Components ---

const BloodDropLogo = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5C50 5 15 50 15 80C15 99.33 30.67 115 50 115C69.33 115 85 99.33 85 80C85 50 50 5 50 5Z" fill="#C53030" />
    <rect x="44" y="65" width="12" height="30" rx="2" fill="white" />
    <rect x="35" y="74" width="30" height="12" rx="2" fill="white" />
  </svg>
);

const AuthPage = ({ onLoginSuccess }: { onLoginSuccess: (user: UserType) => void }) => {
  const [mode, setMode] = useState<'landing' | 'login' | 'signup' | 'forgot'>('landing');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    blood_group: 'O+',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (mode === 'forgot' && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    let endpoint = '';
    let body = {};

    if (mode === 'login') {
      endpoint = '/api/auth/login';
      body = { email: formData.email, password: formData.password };
    } else if (mode === 'signup') {
      endpoint = '/api/auth/signup';
      body = formData;
    } else {
      endpoint = '/api/auth/forgot-password';
      body = { email: formData.email, phone: formData.phone, newPassword: formData.password };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (response.ok) {
          if (mode === 'forgot') {
            setSuccess("Password reset successful! You can now login.");
            setMode('login');
          } else {
            onLoginSuccess(data);
          }
        } else {
          setError(data.error || 'Operation failed');
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        setError(`Server error: ${response.status}. Please try again.`);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(`Connection error: ${err.message || 'Check your internet connection'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <AnimatePresence mode="wait">
            {mode === 'landing' ? (
              <motion.div 
                key="landing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="text-center py-6"
              >
                <div className="inline-flex items-center justify-center mb-6">
                  <BloodDropLogo className="w-24 h-28" />
                </div>
                <h1 className="text-6xl font-black text-[#C53030] tracking-tighter mb-2">LFYHub</h1>
                <p className="text-gray-600 font-bold text-lg mb-8">Every drop counts. Connect with life-saving donors in seconds.</p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => setMode('signup')}
                    className="w-full py-4 bg-[#C53030] text-white rounded-2xl font-black text-xl shadow-xl shadow-red-200 hover:scale-[1.02] transition-transform"
                  >
                    GET STARTED
                  </button>
                  <button 
                    onClick={() => setMode('login')}
                    className="w-full py-4 bg-white text-gray-700 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-colors"
                  >
                    I already have an account
                  </button>
                  <button 
                    onClick={async () => {
                      const shareData = {
                        title: 'LFYHub - Blood Donation',
                        text: 'Join LFYHub to save lives. Find blood donors near you in real-time.',
                        url: window.location.origin,
                      };
                      
                      try {
                        if (navigator.share && navigator.canShare?.(shareData)) {
                          await navigator.share(shareData);
                        } else {
                          throw new Error('Share not supported');
                        }
                      } catch (err: any) {
                        if (err.name !== 'AbortError') {
                          await navigator.clipboard.writeText(window.location.origin);
                          alert('App link copied to clipboard!');
                        }
                      }
                    }}
                    className="w-full py-3 text-gray-400 font-bold text-sm flex items-center justify-center gap-2 hover:text-gray-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share with friends
                  </button>
                </div>

                <div className="mt-12 flex items-center justify-center gap-12 text-gray-400">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-gray-700">24/7</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center">Support</span>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-gray-700">Free</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center">Platform</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="auth-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center mb-4">
                    <BloodDropLogo className="w-16 h-20" />
                  </div>
                  <h1 className="text-4xl font-extrabold text-[#C53030] tracking-tight">LFYHub</h1>
                </div>

                {(mode === 'login' || mode === 'signup') && (
                  <button 
                    onClick={() => setMode('landing')}
                    className="text-indigo-600 font-bold flex items-center gap-2 hover:underline mb-6"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back
                  </button>
                )}

                {mode === 'forgot' && (
                  <div className="mb-6">
                    <button 
                      onClick={() => setMode('login')}
                      className="text-indigo-600 font-bold flex items-center gap-2 hover:underline mb-4"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Back to Login
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                    <p className="text-gray-500 text-sm">Enter your registered email and phone to set a new password.</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input 
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  )}

                  {(mode === 'signup' || mode === 'forgot') && (
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input 
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div className="relative">
                      <Droplets className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                      <select 
                        name="blood_group"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none text-gray-800"
                        value={formData.blood_group}
                        onChange={e => setFormData({...formData, blood_group: e.target.value})}
                      >
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input 
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="Email Address"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder={mode === 'forgot' ? "New Password" : "Password"}
                      required
                      className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {(mode === 'signup' || mode === 'forgot') && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input 
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
                        value={formData.confirmPassword}
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      />
                    </div>
                  )}

                  {mode === 'login' && (
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center text-gray-600 cursor-pointer">
                        <input type="checkbox" className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        Remember me
                      </label>
                      <button 
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      {success}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : (mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Reset Password')}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </button>

                  {mode === 'login' && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Don't have an account?{' '}
                      <button 
                        type="button"
                        onClick={() => setMode('signup')}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        Sign Up
                      </button>
                    </p>
                  )}

                  {mode === 'signup' && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Already have an account?{' '}
                      <button 
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        Login
                      </button>
                    </p>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }: { user: UserType, onLogout: () => void }) => {
  const [searchGroup, setSearchGroup] = useState('O+');
  const [results, setResults] = useState<UserType[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [availability, setAvailability] = useState(user.availability === 1);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [stats, setStats] = useState({ total: 0, available: 0 });
  const [view, setView] = useState<'home' | 'results' | 'history'>('home');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [lastDonation, setLastDonation] = useState<string | undefined>(user.last_donation_date);
  const [donationHistory, setDonationHistory] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Stats fetch error", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?user_id=${user.id}`);
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Notifications fetch error", err);
    }
  };

  const markNotificationRead = async (id: number) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error("Mark read error", err);
    }
  };

  const checkEligibility = () => {
    if (!lastDonation) return;
    const lastDate = new Date(lastDonation);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Eligibility rule: 90 days for blood donation
    if (diffDays >= 90) {
      // Check if we already have an eligibility notification
      const hasNotify = notifications.some(n => n.type === 'eligibility' && n.is_read === 0);
      if (!hasNotify) {
        // In a real app, the server would handle this. 
        // For this demo, we'll just show a UI hint.
      }
    }
  };

  const updateLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus('requesting');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          setLocationStatus('granted');
          fetch('/api/users/update-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id, latitude: loc.lat, longitude: loc.lng })
          });
        },
        (err) => {
          console.error("Location error", err);
          setLocationStatus('denied');
        }
      );
    }
  };

  const fetchDonationHistory = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/donations`);
      const data = await res.json();
      setDonationHistory(data);
    } catch (err) {
      console.error("History fetch error", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchDonationHistory();
    updateLocation();

    // Initialize Socket.io
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to real-time server");
      socket.emit("join", user.id);
    });

    socket.on("stats_update", (newStats) => {
      setStats(newStats);
    });

    socket.on("new_notification", (notification: AppNotification) => {
      setNotifications(prev => [notification, ...prev]);
      // Optional: Show a browser notification or a custom toast
      if (window.Notification && window.Notification.permission === "granted") {
        new window.Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico"
        });
      }
    });

    // Request notification permission
    if ("Notification" in window && window.Notification.permission === "default") {
      window.Notification.requestPermission();
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    checkEligibility();
  }, [lastDonation, notifications]);

  const handleSearch = async (group: string, emergencyMode: boolean = isEmergency) => {
    if (!group) return;
    setLoading(true);
    setView('results');
    try {
      const res = await fetch(`/api/users/search?blood_group=${encodeURIComponent(group)}&current_user_id=${user.id}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      
      if (emergencyMode && location) {
        const filtered = data.filter((u: any) => {
          if (!u.latitude || !u.longitude) return false;
          const dist = Math.sqrt(
            Math.pow(u.latitude - location.lat, 2) + 
            Math.pow(u.longitude - location.lng, 2)
          );
          return dist < 0.15;
        });
        setResults(filtered);
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmergency = async () => {
    const newEmergencyState = !isEmergency;
    setIsEmergency(newEmergencyState);
    
    if (newEmergencyState) {
      // Broadcast emergency request
      try {
        await fetch('/api/requests/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requester_id: user.id,
            blood_group: user.blood_group,
            hospital_name: "Emergency Location",
            latitude: location?.lat,
            longitude: location?.lng,
            is_emergency: true
          })
        });
        alert("🚨 Emergency broadcasted to nearby donors!");
      } catch (err) {
        console.error("Broadcast error", err);
      }
    }

    if (view === 'results') {
      handleSearch(searchGroup, newEmergencyState);
    }
  };

  const handleMarkDonated = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch('/api/users/update-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, last_donation_date: today })
      });
      if (res.ok) {
        setLastDonation(today);
        fetchDonationHistory();
        alert("Thank you for your donation! Your record has been updated.");
        fetchStats();
      }
    } catch (err) {
      console.error("Update donation error", err);
    }
  };

  const toggleAvailability = async () => {
    const newVal = !availability;
    setAvailability(newVal);
    try {
      await fetch('/api/users/toggle-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, availability: newVal })
      });
      fetchStats();
    } catch (err) {
      console.error("Toggle error", err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'LFYHub - Blood Donation',
      text: 'Join LFYHub to save lives. Find blood donors near you in real-time.',
      url: window.location.origin,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error('Share not supported');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(window.location.origin);
          alert('App link copied to clipboard!');
        } catch (clipErr) {
          console.error('Clipboard failed', clipErr);
        }
      }
    }
  };

  if (view === 'history') {
    return (
      <div className="min-h-screen sky-bg flex flex-col items-center py-10 px-4 relative">
        <button 
          onClick={() => setView('home')}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-full soft-shadow text-[#2B6CB0] font-bold hover:scale-105 transition-transform border border-gray-100 z-10"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
          Back
        </button>

        <div className="w-full max-w-lg space-y-6 mt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#2D3748]">Donation History</h2>
            <p className="text-gray-500 font-bold">Your life-saving contributions</p>
          </div>

          <div className="space-y-4">
            {donationHistory.length > 0 ? (
              donationHistory.map((donation, idx) => (
                <motion.div 
                  key={donation.id || idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-6 rounded-3xl soft-shadow border border-emerald-100 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900">{donation.hospital_name || 'Nearby Hospital'}</h4>
                    <p className="text-sm text-gray-500 font-medium">Recorded on {new Date(donation.donation_date).toLocaleDateString()}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">Verified</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white py-16 rounded-3xl text-center soft-shadow border border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No History Yet</h3>
                <p className="text-gray-400 font-medium px-8">Start your journey by donating blood and saving lives today!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'results') {
    return (
      <div className="min-h-screen sky-bg flex flex-col items-center py-10 px-4 relative">
        <button 
          onClick={() => setView('home')}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-full soft-shadow text-[#2B6CB0] font-bold hover:scale-105 transition-transform border border-gray-100 z-10"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
          Back
        </button>

        <div className="w-full max-w-lg space-y-6 mt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#2D3748]">Donors Found</h2>
            <p className="text-gray-500 font-bold">Blood Group: {searchGroup}</p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B6CB0]"></div>
                <p className="text-gray-500 font-bold">Searching for donors...</p>
              </div>
            ) : results.length > 0 ? (
              results.map(res => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={res.id}
                  className="bg-white p-6 rounded-2xl soft-shadow flex items-center justify-between border border-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-[#C53030] font-black text-xl shadow-inner">
                      {res.blood_group}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{res.name}</h4>
                      <p className="text-gray-500 flex items-center gap-1 font-medium">
                        <Phone className="w-4 h-4" /> {res.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <a 
                      href={`tel:${res.phone}`}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-600 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      CALL
                    </a>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Donations</div>
                      <div className="text-xl font-black text-[#2B6CB0]">{res.total_donations}</div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white py-16 rounded-3xl text-center soft-shadow border border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Donors Found</h3>
                <p className="text-gray-400 font-medium px-8">We couldn't find any donors matching your criteria at this moment.</p>
                <button 
                  onClick={() => setView('home')}
                  className="mt-6 px-8 py-3 bg-[#2B6CB0] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen sky-bg flex flex-col items-center py-10 px-4 relative">
      {/* Top Navigation */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full soft-shadow text-gray-600 font-bold hover:scale-105 transition-transform border border-gray-100"
          >
            <Share2 className="w-5 h-5" />
            <span className="hidden sm:inline">Share</span>
          </button>
          
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center gap-2 px-4 py-2 bg-white rounded-full soft-shadow text-gray-600 font-bold hover:scale-105 transition-transform border border-gray-100"
          >
            <Bell className="w-5 h-5" />
            {notifications.some(n => n.is_read === 0) && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
        </div>

        <button 
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full soft-shadow text-[#2B6CB0] font-bold hover:scale-105 transition-transform border border-gray-100"
        >
          <UserCircle className="w-6 h-6" />
          <span className="hidden sm:inline">Profile</span>
        </button>
      </div>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-20 left-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${n.is_read ? 'opacity-60' : 'bg-blue-50/30 hover:bg-blue-50/50'}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === 'emergency' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {n.type === 'emergency' ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 font-medium">
                  No notifications yet
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo & Title Section */}
      <div className="flex flex-col items-center mb-6 mt-12">
        <div className="flex items-center gap-2 mb-2">
          <BloodDropLogo className="w-16 h-20" />
          <h1 className="text-6xl font-extrabold text-[#C53030] tracking-tight">LFYHub</h1>
        </div>
        <div className="flex items-center gap-1 text-gray-600 font-semibold cursor-pointer hover:text-[#2B6CB0] transition-colors" onClick={updateLocation}>
          <MapPin className={`w-5 h-5 ${locationStatus === 'requesting' ? 'animate-bounce' : ''}`} />
          <span>{locationStatus === 'granted' ? 'Location Active' : locationStatus === 'denied' ? 'Location Denied' : 'Tirupati'}</span>
        </div>
      </div>

      <div className="w-full max-w-lg space-y-6">
        {/* Availability Toggle Card */}
        <div className="bg-[#EBF4FF] rounded-2xl p-4 flex items-center justify-between soft-shadow">
          <span className="text-[#2D3748] text-xl font-bold">Available to Donate</span>
          <div className="flex items-center gap-3">
            <span className="text-[#2B6CB0] font-black text-lg">ON</span>
            <button 
              onClick={toggleAvailability}
              className={`relative w-16 h-8 rounded-full transition-colors duration-200 focus:outline-none ${availability ? 'bg-[#2B6CB0]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${availability ? 'translate-x-8' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl p-8 soft-shadow text-center">
          <h2 className="text-2xl font-bold text-[#2D3748] mb-6">Find Blood Donor</h2>
          
          <div className="space-y-6">
            <div className="relative">
              <select 
                className="w-full px-6 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-semibold text-gray-700 text-lg shadow-sm"
                value={searchGroup}
                onChange={e => setSearchGroup(e.target.value)}
              >
                <option value="" disabled>Select Blood Group</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <button 
              onClick={() => handleSearch(searchGroup)}
              className="w-full py-4 blue-gradient-btn text-white rounded-2xl font-black text-xl tracking-wider shadow-lg hover:opacity-90 transition-opacity"
            >
              SEARCH
            </button>
          </div>
        </div>

        {/* Emergency Button */}
        <button 
          onClick={toggleEmergency}
          className={`w-full py-4 rounded-2xl font-black text-xl tracking-wider shadow-lg flex items-center justify-center gap-3 transition-all hover:opacity-90 ${isEmergency ? 'bg-red-700 ring-4 ring-red-200' : 'red-gradient-btn'}`}
        >
          <span className="text-2xl">{isEmergency ? '🔔' : '🚨'}</span>
          {isEmergency ? 'EMERGENCY MODE ON' : 'EMERGENCY NEED BLOOD'}
        </button>

        {/* Stats Section */}
        <div className="bg-[#F7FAFC] rounded-2xl p-5 soft-shadow flex items-center justify-between border border-gray-100">
          <div className="flex-1 text-center border-r border-gray-200">
            <span className="text-gray-600 font-bold text-lg">Total Donors: </span>
            <span className="text-[#2D3748] font-black text-xl">{stats.total}</span>
          </div>
          <div className="flex-1 text-center">
            <span className="text-gray-600 font-bold text-lg">Available Now: </span>
            <span className="text-[#38A169] font-black text-xl">{stats.available}</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Verified Donors</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Instant Alerts</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <Heart className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Community Driven</span>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="h-32 bg-gradient-to-r from-[#2B6CB0] to-[#4299E1]" />
              <div className="px-8 pb-8">
                <div className="relative -mt-16 mb-6">
                  <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-xl mx-auto">
                    <div className="w-full h-full rounded-2xl bg-blue-50 flex items-center justify-center text-[#2B6CB0]">
                      <User className="w-16 h-16" />
                    </div>
                  </div>
                </div>
                
                <div className="text-center space-y-1 mb-8">
                  <h3 className="text-3xl font-bold text-gray-900">{user.name}</h3>
                  <p className="text-gray-500 font-medium">{user.email}</p>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-[#C53030] rounded-full text-sm font-black mt-3 border border-red-100">
                    <Droplets className="w-4 h-4" />
                    BLOOD GROUP: {user.blood_group}
                  </div>
                </div>

                {/* Donation Eligibility Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl mb-8 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-indigo-700 font-black text-sm uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      Eligibility Status
                    </div>
                    {(!lastDonation || (Math.ceil(Math.abs(new Date().getTime() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24)) >= 90)) ? (
                      <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full">ELIGIBLE</span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-400 text-white text-[10px] font-black rounded-full">WAITING</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-bold mb-1">Last Donation</p>
                      <p className="text-lg font-black text-gray-800">{lastDonation ? new Date(lastDonation).toLocaleDateString() : 'Never'}</p>
                    </div>
                    <div className="w-px h-10 bg-blue-200" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-bold mb-1">Next Eligible</p>
                      <p className="text-lg font-black text-gray-800">
                        {lastDonation ? new Date(new Date(lastDonation).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'Now'}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleMarkDonated}
                    className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-2xl font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 border border-indigo-100"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    MARK AS DONATED TODAY
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Donations</div>
                    <div className="text-3xl font-black text-[#2B6CB0]">{user.total_donations}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Status</div>
                    <div className={`text-sm font-black ${availability ? 'text-[#38A169]' : 'text-gray-400'}`}>
                      {availability ? 'ACTIVE DONOR' : 'INACTIVE'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl text-gray-700 border border-gray-100">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="font-bold text-lg">{user.phone}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setShowProfile(false);
                      setView('history');
                    }}
                    className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-100"
                  >
                    <Clock className="w-5 h-5 text-gray-400" />
                    VIEW DONATION HISTORY
                  </button>
                  <button 
                    onClick={onLogout}
                    className="w-full py-4 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    SIGN OUT
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);

  return (
    <div>
      {user ? (
        <Dashboard user={user} onLogout={() => setUser(null)} />
      ) : (
        <AuthPage onLoginSuccess={setUser} />
      )}
    </div>
  );
}
