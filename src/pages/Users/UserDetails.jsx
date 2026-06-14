import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../services/formatters';
import { ArrowLeft, User, Activity, CalendarDays } from 'lucide-react';

const UserDetails = () => {
    const { id } = useParams();
    const { t } = useLanguage();
    const [userProfile, setUserProfile] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRes = await api.get(`/users/${id}`);
                setUserProfile(userRes.data);
                
                // Use server-side filter — GET /api/activities?userId=X
                const actRes = await api.get(`/activities?userId=${id}`);
                setActivities(actRes.data);
            } catch (err) {
                console.error("Failed to load user info or activities", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    if (loading) {
        return <div className="text-center py-20 animate-pulse text-lg text-slate-500">{t('Loading audit logs...')}</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 mb-2">
                <Link to="/users" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-maroon transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">{userProfile?.username || t('User')} {t('Audit Report')}</h1>
                    <p className="text-slate-500 text-sm">{userProfile?.fullName || ''} - {userProfile?.role?.replace(/_/g, ' ') || ''}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="premium-card p-6 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg shadow-indigo-500/30">
                            {userProfile?.username?.substring(0, 2).toUpperCase() || <User size={32} />}
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">{userProfile?.fullName || userProfile?.username}</h2>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mt-2">
                            {userProfile?.role?.replace(/_/g, ' ')}
                        </span>
                        
                        <div className="w-full h-px bg-slate-100 my-6"></div>
                        
                        <div className="w-full flex flex-col gap-3 text-left">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Email')}</span>
                                <span className="text-sm font-semibold text-slate-700">{userProfile?.email || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Phone')}</span>
                                <span className="text-sm font-semibold text-slate-700">{userProfile?.phoneNumber || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Status')}</span>
                                <span className={`text-sm font-semibold ${userProfile?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                    {userProfile?.isActive ? t('Active') : t('Disabled')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="md:col-span-2">
                    <div className="premium-card p-6 min-h-[500px]">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <Activity className="text-maroon" />
                            <h3 className="text-lg font-bold text-slate-800">{t('Recent Activity & Transactions')}</h3>
                        </div>

                        {activities.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {activities.map((act) => (
                                    <div key={act.id} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <CalendarDays size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                <span className="font-bold text-slate-800 text-sm">{act.action}</span>
                                                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                                                    {formatDate(act.timestamp)}
                                                </span>
                                            </div>
                                            <span className="text-sm text-slate-600 mt-1">{act.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                <Activity size={40} className="mb-4 opacity-50" />
                                <p className="font-medium text-center px-4">
                                    {t('No recorded system activity for this user yet.')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetails;
