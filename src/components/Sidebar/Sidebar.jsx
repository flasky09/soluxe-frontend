import React, { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { 
    LayoutDashboard, 
    Wrench, 
    CalendarCheck, 
    LogIn, 
    LogOut, 
    Users, 
    Bed, 
    BedDouble, // Added
    MapPin, 
    CalendarPlus, 
    Sparkles, 
    Utensils, 
    CreditCard, 
    ChefHat, 
    FileText, 
    Settings, 
    Layers, 
    Box, 
    Truck, 
    UsersRound, 
    Building2, 
    Settings2,
    Wallet,
    CalendarDays,
    Clock9,
    ShoppingCart,
    PiggyBank,
    HandCoins,
    Users2,
    FileSpreadsheet,
    Scale,
    ShieldCheck,
    Globe,
    ReceiptText,
    ArrowRightLeft
} from 'lucide-react';

const dashboardItem = { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard };

const menuGroups = [
    {
        title: 'Front Desk',
        icon: CalendarCheck,
        items: [
            { label: 'Reservations', path: '/reservations', icon: CalendarCheck, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Check-in', path: '/check-in', icon: LogIn, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Check-out', path: '/check-out', icon: LogOut, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Guests', path: '/guests', icon: Users, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Rooms', path: '/rooms', icon: Bed, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Housekeeping', path: '/housekeeping', icon: Sparkles, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_HOUSEKEEPING', 'ROLE_RECEPTIONIST'] },
            { label: 'Venues', path: '/venues', icon: Building2, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Venue Bookings', path: '/venue-bookings', icon: CalendarDays, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Shift Handover', path: '/shift-handover', icon: ArrowRightLeft, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
        ]
    },
    {
        title: 'Accounts',
        icon: Wallet,
        items: [
            { label: 'Folio & Billing', path: '/folio', icon: FileText, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT'] },
            { label: 'Charge Types', path: '/charge-types', icon: Layers, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'] },
            { label: 'Payment Methods', path: '/payment-methods', icon: CreditCard, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'] },
            { label: 'Currencies', path: '/currencies', icon: Globe, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'] },
            { label: 'Expenses', path: '/expenses', icon: Wallet, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'] },
        ]
    },
    {
        title: 'Reports',
        icon: FileSpreadsheet,
        items: [
            { label: 'General Reports', path: '/reports/general', icon: FileText, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'] },
            { label: 'Financial Reports', path: '/reports/financial', icon: ReceiptText, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'] },
        ]
    },
    {
        title: 'System Admin',
        icon: Settings,
        items: [
            { label: 'User Management', path: '/users', icon: UsersRound, allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Employees', path: '/employees', icon: Users2, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER'] },
            { label: 'Room Types', path: '/room-types', icon: Layers, allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Settings', path: '/settings', icon: Settings2, allowedRoles: ['ROLE_HOTEL_ADMIN'] },
        ]
    },
    {
        title: 'Integrations',
        icon: Globe,
        items: [
            { label: 'Keycards', path: '/keycards', icon: CreditCard, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
        ]
    }
];


const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper to check if item is allowed for current user
    const isItemAllowed = useCallback((item) => {
        if (!item.allowedRoles) return true;
        return item.allowedRoles.some(role => user?.roles?.includes(role));
    }, [user?.roles]);

    // Filter groups and items
    const filteredGroups = useMemo(() => {
        return menuGroups.map(group => ({
            ...group,
            items: group.items.filter(isItemAllowed)
        })).filter(group => group.items.length > 0);
    }, [isItemAllowed]);

    // Derive active group from current path
    const activeGroupTitle = useMemo(() => {
        const currentPath = location.pathname;
        const activeGroup = filteredGroups.find(group => 
            group.items.some(item => item.path === currentPath)
        );
        return activeGroup ? activeGroup.title : null;
    }, [location.pathname, filteredGroups]);

    const [openGroupState, setOpenGroupState] = useState(null);
    const [prevActiveGroup, setPrevActiveGroup] = useState(null);

    // Sync state with active group change during render (React recommended pattern)
    let openGroup = openGroupState;
    if (activeGroupTitle !== prevActiveGroup) {
        setPrevActiveGroup(activeGroupTitle);
        setOpenGroupState(activeGroupTitle);
        openGroup = activeGroupTitle;
    }


    const toggleGroup = (title) => {
        setOpenGroupState(openGroup === title ? null : title);
    };

    return (
        <>
            {/* Backdrop Overlay for Mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[90] lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}
            
            <aside className={`w-[90%] max-w-[300px] lg:w-[260px] h-screen bg-maroon border-r border-border-gray flex flex-col py-6 fixed left-0 top-0 z-[100] transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                <div className="px-6 mb-4 flex items-center justify-between lg:justify-start gap-4">
                <div className="flex items-center gap-4">
                    <img src="/logo/soluxe-logo.jpeg" alt="Soluxe Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg border border-white/20" />
                    <span className="text-xl font-extrabold -tracking-tight text-white uppercase tracking-tighter">Soluxe <span className="text-yellow">Club Hotel</span></span>
                </div>
                <button onClick={onClose} className="lg:hidden text-white/50 hover:text-white transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <nav className="flex-1 flex flex-col overflow-y-auto pt-2">
                {/* Standalone Dashboard Link */}
                <NavLink 
                    to={dashboardItem.path} 
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) => 
                        `flex items-center gap-3 px-6 py-4 no-underline text-white font-bold text-sm transition-all duration-300 border-l-4 border-transparent hover:text-yellow hover:bg-yellow/5 ${isActive ? 'text-yellow bg-yellow/10 border-l-yellow' : 'opacity-80 hover:opacity-100'}`
                    }
                >
                    <LayoutDashboard size={18} />
                    <span>{t(dashboardItem.label)}</span>
                </NavLink>

                <div className="h-px bg-white/10 mx-6 my-2" />

                {filteredGroups.map((group) => (
                    <div key={group.title} className="flex flex-col mb-2">
                        <div 
                            className="flex justify-between items-center px-6 py-3 cursor-pointer text-white/40 text-[11px] uppercase tracking-wider font-bold transition-all duration-300 hover:text-white/80" 
                            onClick={() => toggleGroup(group.title)}
                        >
                            <div className="flex items-center gap-3">
                                {group.icon && <group.icon size={14} className="opacity-70" />}
                                <span>{t(group.title)}</span>
                            </div>
                            <span className={`text-[10px] transition-transform duration-300 ${openGroup === group.title ? 'rotate-0' : '-rotate-90'}`}>▼</span>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 bg-black/10 ${openGroup === group.title ? 'max-h-[800px]' : 'max-h-0'}`}>
                            {group.items.map((item) => (
                                <NavLink 
                                    key={item.label} 
                                    to={item.path} 
                                    onClick={() => window.innerWidth < 1024 && onClose()}
                                    className={({ isActive }) => 
                                        `flex items-center gap-3 px-6 py-3 pl-8 no-underline text-white/70 font-medium text-sm transition-all duration-300 border-l-4 border-transparent hover:text-yellow hover:bg-yellow/5 ${isActive ? 'text-yellow bg-yellow/10 border-l-yellow font-bold' : ''}`
                                    }
                                >
                                    {item.icon && <item.icon size={16} />}
                                    <span>{t(item.label)}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>



            <div className="px-6 pb-6 border-t border-border-gray pt-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-linear-to-br from-yellow to-yellow-dark rounded-[10px] flex items-center justify-center font-bold text-[13px] text-white">
                        {user ? user.username.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{user ? user.username : 'Guest User'}</span>
                        <span className="text-[12px] text-white/70">
                            {user?.roles?.includes('ROLE_HOTEL_ADMIN') ? t('Hotel Admin') : 
                             user?.roles?.includes('ROLE_MANAGER') ? t('Manager') : 
                             user?.roles?.includes('ROLE_RECEPTIONIST') ? t('Receptionist') : 
                             user?.roles?.includes('ROLE_HOUSEKEEPING') ? t('Housekeeping Staff') : 
                             user?.roles?.includes('ROLE_ACCOUNTANT') ? t('Accountant') : 
                             user?.roles?.includes('ROLE_CHEF') ? t('Chef') : 
                             user?.roles?.includes('ROLE_WAITER') ? t('Waiter') : 
                             user?.roles?.includes('ROLE_CASHIER') ? t('Cashier') : 
                             user?.roles?.includes('ROLE_STORE_KEEPER') ? t('Store Keeper') : 
                             user?.roles?.includes('ROLE_MAINTENANCE') ? t('Maintenance Staff') : t('Staff')}
                        </span>
                    </div>
                </div>
                <button 
                    className="mt-5 w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 hover:bg-maroon hover:text-white hover:border-maroon" 
                    onClick={handleLogout} 
                    title="Sign Out"
                >
                    <LogOut size={16} />
                    <span>{t('Logout')}</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default Sidebar;
