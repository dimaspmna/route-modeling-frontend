import React, { useState } from 'react';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { APP_VERSION } from '../../../SetupVersion';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setconfPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Validasi client-side sederhana
        if (password !== confirmPassword) {
            return setMsg("Passwords do not match");
        }

        setIsLoading(true);
        setMsg('');
        
        try {
            // Pastikan endpoint '/register' sudah benar sesuai API Express Anda
            await axios.post('/register', { 
                name, 
                email, 
                password, 
                confirmPassword 
            }, {
                withCredentials: true // Tambahkan ini jika API Anda mengatur session/cookie
            });
            
            // Jika sukses, arahkan ke halaman Login (root)
            navigate("/");
        } catch (error) {
            if (error.response) {
                setMsg(error.response.data.msg || "Registration failed");
            } else {
                setMsg("Network error. Please check your connection.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background Glow Soft */}
            <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(37,99,235,0.05) 0%, transparent 80%)' }} 
            />

            <div className="relative z-10 w-full max-w-[480px]">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md mb-4 overflow-hidden">
                        <img src="/logo_new.jpeg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-slate-900 text-xl font-bold tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                        Create <span className="text-blue-600">Account</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">
                        Join Route Modelling System
                    </p>
                </div>

                {/* Register Card */}
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50">
                    {msg && (
                        <div className="bg-red-50 border border-red-100 text-red-500 px-4 py-3 rounded-xl mb-6 text-xs text-center font-medium">
                            {msg}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Name Field */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4" />
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Confirm</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
                                        value={confirmPassword} 
                                        onChange={(e) => setconfPassword(e.target.value)} 
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3.5 mt-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                                isLoading 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-[0.98]'
                            }`}
                            style={{ fontFamily: 'Sora, sans-serif' }}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="uppercase tracking-wider">Create Account</span> 
                                    <FiArrowRight />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-xs font-bold">
                            ALREADY HAVE AN ACCOUNT?{' '}
                            <button 
                                onClick={() => navigate("/")} 
                                className="text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-tight ml-1"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>

                {/* Version & Footer */}
                <div className="mt-8 text-center space-y-3">
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

export default Register;