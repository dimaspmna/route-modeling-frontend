import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiKey, FiArrowRight } from 'react-icons/fi';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import API from '../../../api/Api'; // Pastikan path API ini benar
import { APP_VERSION } from '../../../SetupVersion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const Auth = async e => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setMsg('');
    try {
      // Menggunakan API.post sesuai dengan konfigurasi axios kamu
      const response = await API.post('/login', { email, password }, { withCredentials: true });
      const { accessToken, user } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      // ✅ Daftar role dikembalikan lengkap agar navigasi berfungsi
      const roleRoutes = {
        admin: '/admin/dashboard',
        user: '/user/dashboard',
        fuel: '/fuel/dashboard',
        fw: '/fw/dashboard',
        passenger: '/passenger/dashboard',
        fleet: '/fleet/dashboard',
        captain: '/captain/dashboard',
        spv: '/spv/dashboard',
        superadmin: '/superadmin/dashboard',
        ipb: '/ipb/dashboard',
      };

      // Arahkan sesuai role, jika tidak ada di list arahkan ke root '/'
      navigate(roleRoutes[user.role] || '/');
    } catch (error) {
      if (error.response) {
        setMsg(error.response.data.msg || 'Login failed. Please try again.');
      } else {
        setMsg('Network error. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(37,99,235,0.05) 0%, transparent 80%)'
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-md border border-slate-200 mb-4">
            <img src="/logo_new.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-slate-900 text-2xl font-bold tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            Route <span className="text-blue-600">Modelling</span>
          </h1>
          <p className="text-slate-400 text-[11px] uppercase tracking-[0.2em] mt-1 font-bold">
            Vessel Intelligence System
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50">
          <div className="mb-8 text-center">
            <h2 className="text-slate-800 text-xl font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Welcome Back</h2>
            <p className="text-slate-500 text-sm font-medium">Please enter your details</p>
          </div>

          {msg && (
            <div className="bg-red-50 border border-red-100 text-red-500 px-4 py-3 rounded-xl mb-6 text-xs text-center font-medium">
              {msg}
            </div>
          )}

          <form onSubmit={Auth} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">User ID / Email</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Enter your ID"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className={`w-full py-4 mt-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                isLoading || !email || !password
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-[0.98]'
              }`}
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  SIGN IN TO SYSTEM
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">
            © 2026 Route Modelling App
          </p>
          <div className="inline-block px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
            <p className="text-slate-500 text-[10px] font-bold">
              VERSION <span className="text-blue-600 ml-1">{APP_VERSION}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;