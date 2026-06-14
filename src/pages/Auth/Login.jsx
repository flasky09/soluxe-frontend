import React, { useState } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const login = useAuthStore((state) => state.login);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const navigate = useNavigate();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const response = await api.post('/auth/login', credentials);
            const { token, id, username, role } = response.data;
            
            // Store user data and token in Zustand
            // Wrapping role in an array as authStore expects 'roles'
            login({ id, username, roles: [role] }, token);
            
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const visualStyles = {
        background: `linear-gradient(rgba(123, 17, 19, 0.7), rgba(123, 17, 19, 0.7)), url('https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=2070') center/cover no-repeat`
    };

    return (
        <div className="flex h-screen bg-white font-inter overflow-hidden">
            <div 
                className="hidden lg:flex flex-1 items-center justify-center p-16 relative overflow-hidden"
                style={visualStyles}
            >
                <div className="max-w-[500px] text-center">
                    <h1 className="text-[48px] font-extrabold mb-6 text-white leading-tight">Premium Service.</h1>
                    <p className="text-xl text-yellow font-medium">Elevate your hospitality and delight your guests.</p>
                </div>
            </div>
            
            <div className="w-full lg:w-[650px] flex items-center justify-center p-6 sm:p-10 bg-white overflow-y-auto h-full">
                <div className="w-full max-w-[480px] premium-card !p-8 sm:!p-12">
                    <div className="text-center mb-8">
                        <img src="/logo/soluxe-logo.jpeg" alt="Soluxe Logo" className="w-[100px] h-[100px] mx-auto mb-6 rounded-2xl object-cover shadow-xl border-4 border-slate-50" />
                        <h2 className="text-[28px] font-bold mb-2 text-text-dark">Soluxe HMS</h2>
                        <p className="text-text-slate text-sm">Sign in to your staff account</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 animate-pulse">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="username" className="text-[13px] font-semibold text-text-dark">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                value={credentials.username} 
                                onChange={handleChange} 
                                placeholder="staff_member"
                                required 
                                className="bg-white border border-border-gray p-3 px-4 rounded-[10px] text-text-dark text-[15px] transition-all duration-300 focus:outline-none focus:border-yellow focus:shadow-[0_0_0_4px_rgba(250,204,21,0.2)]"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="password" className="text-[13px] font-semibold text-text-dark">Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    id="password" 
                                    name="password" 
                                    value={credentials.password} 
                                    onChange={handleChange} 
                                    placeholder="••••••••"
                                    required 
                                    className="w-full bg-white border border-border-gray p-3 px-4 pr-12 rounded-[10px] text-text-dark text-[15px] transition-all duration-300 focus:outline-none focus:border-yellow focus:shadow-[0_0_0_4px_rgba(250,204,21,0.2)]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-slate hover:text-maroon transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-[13px]">
                            <label className="flex items-center gap-2 text-text-slate cursor-pointer">
                                <input type="checkbox" className="accent-maroon" /> Remember me
                            </label>
                            <a href="#" className="text-maroon no-underline font-semibold hover:text-maroon/80 transition-colors">Forgot password?</a>
                        </div>

                        <button type="submit" className="btn-primary w-full mt-2.5 text-lg" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-text-slate">
                        <p>Don't have an account? <a href="#" className="text-maroon no-underline font-semibold hover:text-maroon/80 transition-colors">Contact support</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
