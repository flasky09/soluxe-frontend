import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import useNotifications from '../../services/useNotifications';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../services/formatters';

const colorMap = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100'   },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100'    },
    yellow: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100'  },
    green:  { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-100'},
};

// Map path to human-readable page title
const pageTitles = {
    '/':                  'Dashboard',
    '/reservations':      'Reservations',
    '/check-in':          'Check-In',
    '/check-out':         'Check-Out',
    '/guests':            'Guests',
    '/rooms':             'Rooms',
    '/venues':            'Venues',
    '/venue-bookings':    'Venue Bookings',
    '/housekeeping':      'Housekeeping',
    '/restaurant':        'Restaurant POS',
    '/pos':               'Quick POS',
    '/kitchen':           'Kitchen Orders',
    '/menu-items':        'Menu Items',
    '/menu-categories':   'Menu Categories',
    '/tables':            'Tables',
    '/folio':             'Folio & Billing',
    '/reports':           'Reports & Analytics',
    '/inventory':         'Stock Management',
    '/inventory-categories': 'Inventory Categories',
    '/suppliers':         'Suppliers',
    '/maintenance':       'Maintenance',
    '/users':             'User Management',
    '/employees':         'Employees',
    '/departments':       'Departments',
    '/room-types':        'Room Types',
    '/charge-types':      'Charge Types',
    '/payment-methods':   'Payment Methods',
    '/inventory-units':   'Inventory Units',
    '/leave-types':       'Leave Types',
    '/maintenance-issue-types': 'Maintenance Issue Types',
    '/settings':          'Settings',
    '/keycards':          'Door Keycards',
};

const MainLayout = ({ children }) => {
    const { notifications, totalCount } = useNotifications();
    const { language, toggleLanguage } = useLanguage();
    const [panelOpen, setPanelOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const pageTitle = pageTitles[location.pathname] || 'Soluxe HMS';

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAlertClick = (path) => {
        setPanelOpen(false);
        navigate(path);
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[95] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[var(--sidebar-width)]' : 'ml-0 lg:ml-[var(--sidebar-width)]'}`}>

                {/* ── Header ── */}
                <header className="h-[var(--header-height)] px-4 md:px-8 flex items-center justify-between
                                   border-b border-slate-100 bg-white sticky top-0 z-[90]
                                   shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

                    {/* Left side: Hamburger + Breadcrumb */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 lg:hidden text-slate-500 hover:text-maroon transition-colors"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <div className="hidden sm:flex items-center gap-3">
                            <img src="/logo/soluxe-logo.jpeg" alt="Logo" className="w-6 h-6 rounded-md object-cover opacity-80" />
                            <span className="text-[13px] font-semibold text-slate-400">Soluxe Club Hotel</span>
                            <span className="text-slate-200 font-light">/</span>
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 truncate max-w-[150px] sm:max-w-none">{pageTitle}</span>
                    </div>

                    {/* Right-side actions — hidden on mobile */}
                    <div className="hidden md:flex items-center gap-6" ref={panelRef}>
                        
                        {/* Date & Time Display — flex row */}
                        <div className="hidden md:flex items-center gap-2 border-r border-slate-100 pr-6">
                            <span className="text-[13px] font-bold text-slate-700 tracking-tight">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-slate-300 font-light">·</span>
                            <span className="text-[12px] font-semibold text-slate-400">
                                {formatDate(currentTime)}
                            </span>
                        </div>

                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            title={language === 'en' ? 'Switch to Mandarin' : '切换至英文'}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white
                                       text-[11px] font-extrabold text-slate-600 uppercase tracking-widest
                                       hover:border-maroon hover:text-maroon transition-all duration-200 select-none"
                        >
                            <span className="text-base leading-none">{language === 'en' ? '🇨🇳' : '🇬🇧'}</span>
                            {language === 'en' ? '中文' : 'EN'}
                        </button>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setPanelOpen(prev => !prev)}
                                title="Alerts"
                                className={`relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer
                                    ${panelOpen
                                        ? 'bg-maroon text-white border-maroon'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'}`}
                            >
                                {/* Bell SVG */}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                </svg>
                                {totalCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px]
                                                     bg-red-500 text-white text-[9px] font-extrabold
                                                     rounded-full flex items-center justify-center px-0.5
                                                     border-2 border-white leading-none">
                                        {totalCount > 9 ? '9+' : totalCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Panel */}
                            {panelOpen && (
                                <div className="absolute top-[calc(100%+8px)] -right-2 sm:right-0 w-[calc(100vw-2rem)] sm:w-[360px] bg-white
                                                border border-slate-200 rounded-2xl overflow-hidden
                                                shadow-[0_16px_48px_rgba(0,0,0,0.14)] z-[200]"
                                     style={{ animation: 'modalIn 0.18s cubic-bezier(0.16,1,0.3,1)' }}>

                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                        <span className="font-bold text-slate-800 text-sm">Alerts</span>
                                        {totalCount > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {totalCount} active
                                            </span>
                                        )}
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="py-12 text-center text-slate-400">
                                                <div className="text-2xl font-light text-slate-300 mb-2">✓</div>
                                                <p className="text-sm font-semibold">All clear</p>
                                                <p className="text-xs text-slate-300 mt-0.5">No active alerts</p>
                                            </div>
                                        ) : (
                                            <div className="p-2 flex flex-col gap-1">
                                                {notifications.map(n => {
                                                    const c = colorMap[n.color] || colorMap.blue;
                                                    return (
                                                        <button
                                                            key={n.id}
                                                            onClick={() => handleAlertClick(n.path)}
                                                            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border
                                                                        ${c.border} ${c.bg} hover:shadow-sm transition-all duration-150 cursor-pointer`}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`font-bold text-[12.5px] ${c.text}`}>{n.title}</p>
                                                                {n.detail && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{n.detail}</p>}
                                                            </div>
                                                            <span className="text-slate-300 text-sm">›</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/60">
                                        <span className="text-[10px] text-slate-300 font-medium">Refreshes every 2 min</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all duration-200"
                        >
                            {isFullscreen ? (
                                // Compress / exit fullscreen icon
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
                                    <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                                    <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
                                    <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                                </svg>
                            ) : (
                                // Expand / enter fullscreen icon
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
                                    <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                                    <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
                                    <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                                </svg>
                            )}
                        </button>
                    </div>
                </header>

                {/* ── Page Content ── */}
                <div className="flex-1 p-4 md:p-8 overflow-x-clip">
                    <div className="max-w-[1400px] mx-auto">
                        {children || <Outlet />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
