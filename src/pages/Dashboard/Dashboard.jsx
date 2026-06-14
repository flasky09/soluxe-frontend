import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import useAuthStore from '../../store/authStore';

import {
    CalendarCheck, LogIn, LogOut, FileText, Sparkles, Users,
    Bed, BarChart2, Settings, KeyRound, CreditCard, Layers,
    Building2, CalendarDays, History, Info, AlertTriangle, CheckCircle2, Wrench
} from 'lucide-react';
import { formatDate } from '../../services/formatters';

// ─── Module Tile ──────────────────────────────────────────────────────────────
function ModuleTile({ icon, label, subtitle, stat, statLabel, gradient, onClick }) {
    const Icon = icon;
    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col justify-between p-5 rounded-3xl ${gradient} hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 cursor-pointer text-left overflow-hidden`}
            style={{ minHeight: '130px' }}
        >
            {/* Watermark icon */}
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                <Icon size={110} className="text-white" />
            </div>

            {/* Top: icon + label */}
            <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/30 transition-all duration-200 shrink-0">
                    <Icon size={20} className="text-white" />
                </div>
                <div className="pt-0.5">
                    <div className="text-sm font-extrabold text-white leading-tight drop-shadow-sm">{label}</div>
                    <div className="text-[11px] text-white/70 font-medium mt-0.5 leading-tight">{subtitle}</div>
                </div>
            </div>

            {/* Bottom: live stat */}
            {stat !== undefined && (
                <div className="mt-4">
                    <span className="text-4xl font-black text-white drop-shadow">{stat}</span>
                    {statLabel && <span className="text-[11px] font-bold text-white/70 ml-2 uppercase tracking-wider">{statLabel}</span>}
                </div>
            )}
        </button>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { t } = useLanguage();

    const [stats, setStats] = useState({
        totalArrivalsToday: 0,
        totalDeparturesToday: 0,
        activeStays: 0,
        totalRooms: 0,
        occupancyRate: 0,
        pendingHousekeeping: 0,
        cleanRooms: 0,
        dirtyRooms: 0,
        maintenanceRooms: 0,
        availableRoomsByType: {}
    });
    const [recentArrivals, setRecentArrivals] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryRes, arrivalsRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/reservations/arrivals').catch(() => ({ data: [] }))
                ]);
                setStats(summaryRes.data);
                if (Array.isArray(arrivalsRes.data)) {
                    setRecentArrivals(arrivalsRes.data.slice(0, 5));
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            }
        };
        fetchDashboardData();
    }, []);

    const hasRole = (...roles) => roles.some(r => user?.roles?.includes(r));

    const tiles = [
        {
            icon: CalendarCheck,
            label: t('Reservations'),
            subtitle: t('Bookings & upcoming stays'),
            stat: stats.totalArrivalsToday,
            statLabel: t('arrivals today'),
            gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
            route: '/reservations',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: LogIn,
            label: t('Check-In'),
            subtitle: t('Welcome arriving guests'),
            stat: stats.totalArrivalsToday,
            statLabel: t('expected'),
            gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
            route: '/check-in',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: LogOut,
            label: t('Check-Out'),
            subtitle: t('Process departing guests'),
            stat: stats.totalDeparturesToday,
            statLabel: t('departures today'),
            gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
            route: '/check-out',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Users,
            label: t('Guests'),
            subtitle: t('Guest profiles & history'),
            stat: stats.activeStays,
            statLabel: t('in-house'),
            gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
            route: '/guests',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Bed,
            label: t('Rooms'),
            subtitle: t('Room status & availability'),
            stat: stats.totalRooms - stats.activeStays,
            statLabel: t('available'),
            gradient: 'bg-gradient-to-br from-slate-500 to-slate-700',
            route: '/rooms',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Sparkles,
            label: t('Housekeeping'),
            subtitle: t('Cleaning tasks & room status'),
            stat: stats.pendingHousekeeping,
            statLabel: t('pending'),
            gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
            route: '/housekeeping',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_HOUSEKEEPING', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: FileText,
            label: t('Folio & Billing'),
            subtitle: t('Guest charges & invoices'),
            stat: `${stats.occupancyRate}%`,
            statLabel: t('occupancy'),
            gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
            route: '/folio',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: BarChart2,
            label: t('Reports'),
            subtitle: t('Revenue, reservations & guests'),
            gradient: 'bg-gradient-to-br from-rose-500 to-rose-700',
            route: '/reports',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: CreditCard,
            label: t('Payment Methods'),
            subtitle: t('Configure payment options'),
            gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
            route: '/payment-methods',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: Layers,
            label: t('Charge Types'),
            subtitle: t('Manage billing charge items'),
            gradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
            route: '/charge-types',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: Building2,
            label: t('Venues'),
            subtitle: t('Manage venue spaces'),
            gradient: 'bg-gradient-to-br from-pink-500 to-pink-700',
            route: '/venues',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: CalendarDays,
            label: t('Venue Bookings'),
            subtitle: t('Event & function bookings'),
            gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
            route: '/venue-bookings',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: KeyRound,
            label: t('Keycards'),
            subtitle: t('Door keycard management'),
            gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
            route: '/keycards',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Settings,
            label: t('Settings'),
            subtitle: t('System configuration'),
            gradient: 'bg-gradient-to-br from-gray-500 to-gray-700',
            route: '/settings',
            allowed: hasRole('ROLE_HOTEL_ADMIN'),
        },
    ].filter(tile => tile.allowed);

    return (
        <div className="flex flex-col gap-6 pb-8">
            {/* ── Module Tile Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {tiles.map(tile => (
                    <ModuleTile
                        key={tile.route}
                        icon={tile.icon}
                        label={tile.label}
                        subtitle={tile.subtitle}
                        stat={tile.stat}
                        statLabel={tile.statLabel}
                        gradient={tile.gradient}
                        onClick={() => navigate(tile.route)}
                    />
                ))}
            </div>

            <div className="mt-8 flex flex-col gap-8">
                <div className="flex flex-col">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{t('Operations Overview')}</h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {formatDate(new Date().toISOString().split('T')[0])}
                    </p>
                </div>

                {/* Priority Housekeeping Alert */}
                {stats.pendingHousekeeping > 0 && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 md:p-6 bg-white border border-orange-100 rounded-2xl shadow-sm">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-200">
                            <Sparkles size={24} />
                        </div>
                        <div className="flex flex-col text-center sm:text-left">
                            <span className="text-xs md:text-sm font-black text-orange-800 uppercase tracking-[0.2em]">{t('Prioritize Housekeeping')}</span>
                            <span className="text-[10px] md:text-xs text-orange-600 font-bold">{stats.pendingHousekeeping} {t('rooms awaiting cleaning for new arrivals.')}</span>
                        </div>
                        <div className="sm:ml-auto w-full sm:w-auto">
                            <button 
                                onClick={() => navigate('/housekeeping')}
                                className="w-full sm:w-auto px-6 py-2 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                            >
                                {t('Manage Tasks')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Check-In / Check-Out */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                        onClick={() => navigate('/check-in')}
                        className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <History size={28} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('Expected Arrivals')}</span>
                                <span className="text-4xl font-black text-slate-800">{stats.totalArrivalsToday} <span className="text-sm font-bold text-slate-500">{t('Guests')}</span></span>
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">{t('Action Required')}</div>
                    </div>

                    <div 
                        onClick={() => navigate('/check-out')}
                        className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <History size={28} className="rotate-180" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('Expected Departures')}</span>
                                <span className="text-4xl font-black text-slate-800">{stats.totalDeparturesToday} <span className="text-sm font-bold text-slate-500">{t('Guests')}</span></span>
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-widest">{t('Action Required')}</div>
                    </div>
                </div>

                {/* Room Health Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 size={18} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('Clean & Ready')}</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-black text-slate-800">{stats.cleanRooms}</span>
                            <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${(stats.cleanRooms / stats.totalRooms) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                <AlertTriangle size={18} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('Dirty / Pending')}</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-black text-slate-800">{stats.dirtyRooms}</span>
                            <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${(stats.dirtyRooms / stats.totalRooms) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                <Wrench size={18} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('Out of Order')}</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-black text-slate-800">{stats.maintenanceRooms}</span>
                            <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: `${(stats.maintenanceRooms / stats.totalRooms) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Arrivals + Operational Health */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">{t('Recent Arrivals')}</h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">{t('Latest 5')}</span>
                        </div>
                        {recentArrivals.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {recentArrivals.map(arr => (
                                    <div key={arr.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-maroon/5 flex items-center justify-center text-maroon font-black text-xs uppercase shadow-sm">
                                                {arr.guestName?.substring(0, 2)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-sm">{arr.guestName || t('Direct Guest')}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t('Arrived recently')}</span>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-maroon text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm shadow-maroon/20">{t('Room')} {arr.roomNumber || t('TBD')}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                                    <Info size={32} />
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('No recent arrivals')}</p>
                            </div>
                        )}
                        <button 
                            onClick={() => navigate('/guests')}
                            className="w-full mt-6 py-3 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-maroon hover:border-maroon/20 hover:bg-maroon/[0.02] transition-all"
                        >
                            {t('View All Guests')}
                        </button>
                    </div>

                    <div className="bg-maroon rounded-3xl p-6 text-white shadow-xl shadow-maroon/20 flex flex-col justify-between overflow-hidden relative">
                        {/* Decorative watermark */}
                        <div className="absolute -right-8 -top-8 opacity-10 rotate-12">
                            <BarChart2 size={200} />
                        </div>

                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 text-center">{t('Operational Health')}</span>
                                <div className="w-28 h-28 rounded-full border-4 border-yellow/20 flex flex-col items-center justify-center mb-2 shadow-2xl bg-white/5 backdrop-blur-sm">
                                    <span className="text-3xl font-black text-yellow leading-none">{stats.occupancyRate}%</span>
                                    <span className="text-[8px] font-black text-white/60 uppercase tracking-widest mt-1">{t('Total')}</span>
                                </div>
                                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{t('Current Occupancy')}</span>
                            </div>

                            <div className="h-px bg-white/10 w-full"></div>

                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="flex flex-col px-4 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">{t('In-House')}</span>
                                    <span className="text-xl font-black">{stats.activeStays}</span>
                                </div>
                                <div className="flex flex-col px-4 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">{t('Available')}</span>
                                    <span className="text-xl font-black text-yellow">{stats.totalRooms - stats.activeStays}</span>
                                </div>
                            </div>

                            {stats.availableRoomsByType && Object.keys(stats.availableRoomsByType).length > 0 && (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <span className="text-[10px] font-black text-white/50 block mb-3 border-b border-white/10 pb-2 uppercase tracking-widest text-center">{t('Available by Type')}</span>
                                    <div className="flex flex-col gap-2">
                                        {Object.entries(stats.availableRoomsByType).map(([type, count]) => (
                                            <div key={type} className="flex justify-between items-center bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                                <span className="text-[9px] font-black text-white/70 truncate mr-2 uppercase tracking-tighter" title={type}>{type}</span>
                                                <span className="text-sm font-black text-yellow">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{t('Health Target')}</span>
                                    <span className="text-[10px] font-black uppercase bg-yellow text-maroon px-2 py-0.5 rounded-full">{t('85% Goal')}</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-yellow transition-all duration-1000 shadow-[0_0_12px_rgba(255,234,0,0.6)]" style={{ width: `${Math.min(100, (stats.occupancyRate / 85) * 100)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
