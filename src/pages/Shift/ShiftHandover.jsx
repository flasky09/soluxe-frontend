import React, { useState, useEffect } from 'react';
import { 
    Clock, 
    ArrowRightLeft, 
    Calendar, 
    DollarSign, 
    User, 
    ClipboardList,
    AlertCircle,
    CheckCircle2,
    CalendarDays,
    History
} from 'lucide-react';
import shiftService from '../../services/shiftService';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';
import { useLanguage } from '../../context/LanguageContext';

const ShiftHandover = () => {
    const { t } = useLanguage();
    const { user } = useAuthStore();
    const [currentShift, setCurrentShift] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clockingIn, setClockingIn] = useState(false);
    const [clockingOut, setClockingOut] = useState(false);
    
    // Form states
    const [shiftType, setShiftType] = useState('DAY_SHIFT');
    const [notes, setNotes] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const current = await shiftService.getCurrentShift();
            setCurrentShift(current);
            
            const past = await shiftService.getShiftHistory();
            setHistory(past);
        } catch (error) {
            console.error('Error fetching shift data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async (e) => {
        e.preventDefault();
        
        if (!window.confirm(t('Are you sure you want to clock in now?'))) {
            return;
        }

        setClockingIn(true);
        try {
            const newShift = await shiftService.clockIn(shiftType);
            setCurrentShift(newShift);
            // Refresh history to see active shift
            const past = await shiftService.getShiftHistory();
            setHistory(past);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to clock in');
        } finally {
            setClockingIn(false);
        }
    };

    const handleClockOut = async (e) => {
        e.preventDefault();

        if (!window.confirm(t('Are you sure you want to clock out and handover?'))) {
            return;
        }

        setClockingOut(true);
        try {
            await shiftService.clockOut(currentShift.id, notes);
            setCurrentShift(null);
            setNotes('');
            // Refresh history
            const past = await shiftService.getShiftHistory();
            setHistory(past);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to clock out');
        } finally {
            setClockingOut(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <ArrowRightLeft className="text-maroon h-8 w-8" />
                        {t('Shift Handover')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('Manage your daily shifts and earnings records')}</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <CalendarDays className="text-maroon h-5 w-5" />
                    <span className="font-semibold text-slate-700">{format(new Date(), 'EEEE, MMMM do, yyyy')}</span>
                </div>
            </div>

            {/* Top Section: Active Shift / Clock In */}
            <div className="w-full">
                {!currentShift ? (
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="bg-maroon p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Clock className="h-6 w-6" />
                                    {t('Clock In')}
                                </h2>
                                <p className="text-white/70 text-sm mt-1">{t('Start your shift record')}</p>
                            </div>
                        </div>
                        <form onSubmit={handleClockIn} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('Shift Type')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShiftType('DAY_SHIFT')}
                                            className={`py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${shiftType === 'DAY_SHIFT' ? 'border-maroon bg-maroon/5 text-maroon' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            <span className="font-bold text-sm">{t('Day Shift')}</span>
                                            <span className="text-[9px] opacity-70">6AM - 6PM</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShiftType('NIGHT_SHIFT')}
                                            className={`py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${shiftType === 'NIGHT_SHIFT' ? 'border-maroon bg-maroon/5 text-maroon' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            <span className="font-bold text-sm">{t('Night Shift')}</span>
                                            <span className="text-[9px] opacity-70">6PM - 6AM</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('Logged In User')}</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={user?.fullName || user?.username || ''} 
                                            readOnly 
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium focus:outline-none focus:ring-1 focus:ring-maroon/20"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={clockingIn}
                                    className="w-full bg-maroon text-white font-bold py-4 rounded-xl shadow-lg shadow-maroon/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {clockingIn ? t('Clocking in...') : t('Clock In Now')}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="bg-green-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CheckCircle2 className="h-6 w-6" />
                                    {t('Active Shift')} — {currentShift.shiftType.replace('_', ' ')}
                                </h2>
                                <p className="text-white/70 text-sm mt-1">{t('Shift started at')} {format(new Date(currentShift.clockInTime), 'hh:mm a')}</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold opacity-70 tracking-widest">{t('Earnings')}</p>
                                    <p className="text-xl font-black">KES {currentShift.totalEarnings?.toLocaleString() || '0'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold opacity-70 tracking-widest">{t('Clients')}</p>
                                    <p className="text-xl font-black">{currentShift.clientsCount || '0'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleClockOut} className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('Shift Notes / Remarks')}</label>
                                    <input 
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={t('Enter hand-over notes, balance details, etc.')}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-maroon/20 focus:border-maroon outline-none transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={clockingOut}
                                    className="w-full md:w-[250px] bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {clockingOut ? t('Clocking out...') : (
                                        <>
                                            <ArrowRightLeft size={18} />
                                            {t('Clock Out & Handover')}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Section: History Table */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <History className="h-6 w-6 text-maroon" />
                        {t('Shift Handover History')}
                    </h2>
                    <button onClick={fetchData} className="text-maroon font-bold text-sm hover:underline">{t('Refresh')}</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 text-left">
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">{t('Date')}</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">{t('Staff Member')}</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">{t('Shift')}</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono text-center">{t('Clients')}</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">{t('Clock In/Out')}</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono text-right">{t('Earnings')}</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">{t('Status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length > 0 ? (
                                history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((shift) => (
                                    <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-700">{format(new Date(shift.date), 'MMM dd, yyyy')}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                                                    {shift.fullName?.substring(0, 2).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm whitespace-nowrap">{shift.fullName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${shift.shiftType === 'DAY_SHIFT' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {shift.shiftType === 'DAY_SHIFT' ? t('Day') : t('Night')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <p className="font-bold text-slate-700">{shift.clientsCount || 0}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                                                    <span className="w-8 opacity-50 font-mono">IN:</span>
                                                    <span className="font-bold">{format(new Date(shift.clockInTime), 'hh:mm a')}</span>
                                                </div>
                                                {shift.clockOutTime && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                                                        <span className="w-8 opacity-50 font-mono">OUT:</span>
                                                        <span className="font-bold">{format(new Date(shift.clockOutTime), 'hh:mm a')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-extrabold text-slate-800">KES {shift.totalEarnings?.toLocaleString() || '0'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {shift.status === 'ACTIVE' ? (
                                                    <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                                        <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></span>
                                                        {t('In Progress')}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs font-medium">
                                                        {t('Closed')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <AlertCircle className="h-12 w-12 opacity-20" />
                                            <p>{t('No shift records found')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {history.length > itemsPerPage && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-xs text-slate-500 font-medium">
                            {t('Showing')} {(currentPage - 1) * itemsPerPage + 1} {t('to')} {Math.min(currentPage * itemsPerPage, history.length)} {t('of')} {history.length} {t('entries')}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                            >
                                {t('Previous')}
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(history.length / itemsPerPage)))}
                                disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                            >
                                {t('Next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShiftHandover;
