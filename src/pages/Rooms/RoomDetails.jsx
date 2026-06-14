import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, Info, ArrowLeft, User, Clock, FileText, ReceiptText, LogOut, CalendarPlus } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import useAuthStore from '../../store/authStore';
import Pagination from '../../components/Pagination/Pagination';


const fmt = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + '  '
        + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const statusColor = (s) => {
    if (!s) return 'bg-slate-100 text-slate-500';
    const m = s.toLowerCase();
    if (m === 'checked_in' || m === 'active') return 'bg-emerald-100 text-emerald-700';
    if (m === 'checked_out') return 'bg-slate-100 text-slate-500';
    if (m.includes('overdue')) return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
};

const RoomDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [room, setRoom] = useState(null);
    const [stays, setStays] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [extensionDate, setExtensionDate] = useState('');
    const [extensionLoading, setExtensionLoading] = useState(false);
    const { user } = useAuthStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('LEDGER'); // New tab state
    const [roomRevenue, setRoomRevenue] = useState(0);
    const [roomFolios, setRoomFolios] = useState([]);
    const [maintenanceLogs, setMaintenanceLogs] = useState([]);
    const PAGE_SIZE = 20;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [roomRes, staysRes, reservationsRes, foliosRes, maintenanceRes] = await Promise.all([
                api.get(`/rooms/${id}`),
                api.get('/stays').catch(() => ({ data: [] })),
                api.get('/reservations').catch(() => ({ data: [] })),
                api.get('/folios').catch(() => ({ data: [] })),
                api.get(`/maintenance/room/${id}`).catch(() => ({ data: [] }))
            ]);

            setRoom(roomRes.data);

            const allStays = Array.isArray(staysRes.data) ? staysRes.data : (staysRes.data?.content || []);
            const allReservations = Array.isArray(reservationsRes.data) ? reservationsRes.data : (reservationsRes.data?.content || []);
            const allFolios = Array.isArray(foliosRes.data) ? foliosRes.data : (foliosRes.data?.content || []);
            
            setMaintenanceLogs(Array.isArray(maintenanceRes.data) ? maintenanceRes.data : (maintenanceRes.data?.content || []));

            const matchStays = allStays.filter(s => String(s.roomId) === String(id));
            const matchReservations = allReservations.filter(r => String(r.roomId) === String(id));
            
            const relevantFolios = allFolios.filter(f => f.roomNumber === roomRes.data.roomNumber);
            setRoomFolios(relevantFolios);
            
            const totalRev = relevantFolios
                .reduce((sum, f) => sum + (parseFloat(f.totalAmount) || 0), 0);
            
            setRoomRevenue(totalRev);

            setStays(matchStays);
            setReservations(matchReservations);

            const events = [];
            matchStays.forEach(s => {
                if (s.dateIn) {
                    const end = s.dateOut
                        ? new Date(new Date(s.dateOut).getTime() + 86400000).toISOString().split('T')[0]
                        : s.dateIn.split('T')[0];

                    let color = '#16a34a'; // Vibrant Green-600 (Active)
                    if (s.status?.toUpperCase() === 'CHECKED_OUT') {
                        color = '#dc2626'; // Strong Red-600 (Previous)
                    }

                    events.push({
                        title: s.guestName || 'Stay',
                        start: s.dateIn.split('T')[0],
                        end,
                        display: 'background',
                        backgroundColor: color,
                        extendedProps: { type: 'STAY', status: s.status }
                    });
                }
            });

            matchReservations.forEach(r => {
                if (r.dateIn) {
                    const end = r.dateOut
                        ? new Date(new Date(r.dateOut).getTime() + 86400000).toISOString().split('T')[0]
                        : r.dateIn;

                    events.push({
                        title: r.guestName || 'Reservation',
                        start: r.dateIn,
                        end,
                        display: 'background',
                        backgroundColor: '#9333ea', // Purple-600 (Future)
                        extendedProps: { type: 'RESERVATION', status: r.status }
                    });
                }
            });

            setCalendarEvents(events);
        } catch (err) {
            console.error('Failed to fetch room details:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const handleCheckout = async () => {
        if (!confirm(t('Are you sure you want to checkout this room?'))) return;
        try {
            await api.post(`/stays/${id}/check-out?userId=${user?.id || 1}`, null, {
                params: { approveAdjustment: true }
            });
            fetchData();
        } catch (err) {
            console.error('Checkout failed:', err);
            alert(t('Checkout failed: ') + (err.response?.data?.message || err.message));
        }
    };

    const handleExtendStay = async (e) => {
        e.preventDefault();
        setExtensionLoading(true);
        try {
            await api.post(`/stays/${id}/extend`, null, {
                params: {
                    newDateOut: extensionDate,
                    userId: user?.id || 1
                }
            });
            setShowExtensionModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to extend stay:', err);
            alert(err.response?.data?.message || 'Extension failed.');
        } finally {
            setExtensionLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setCurrentPage(1); // Reset page on room change
        setActiveTab('LEDGER'); // Reset tab on room change
    }, [fetchData]);

    const allRecords = [
        ...stays.map(s => ({ ...s, _type: 'STAY' })),
        ...reservations.map(r => ({ ...r, _type: 'RESERVATION' }))
    ].sort((a, b) => new Date(b.dateIn) - new Date(a.dateIn));

    const calculateNights = (inDate, outDate) => {
        if (!inDate || !outDate) return 0;
        const start = new Date(inDate);
        const end = new Date(outDate);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    };

    if (loading && !room) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-slate-400 font-bold animate-pulse">{t('Loading room details...')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/rooms')}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-maroon hover:border-maroon/20 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        {t('Room')} {room?.roomNumber}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{room?.roomType?.name}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('Floor')} {room?.floor}</span>
                    </div>
                </div>
                 <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0 md:ml-auto">
                    {room?.status === 'OCCUPIED' && (
                        <div className="flex flex-wrap items-center gap-2 border-slate-200 md:border-r md:pr-4">
                             <button 
                                onClick={() => navigate(`/folio?search=${room?.roomNumber}`)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                            >
                                <ReceiptText size={14} />
                                {t('Folio')}
                            </button>
                            <button 
                                onClick={() => {
                                    const activeStay = stays.find(s => s.status === 'CHECKED_IN' || s.status === 'ACTIVE');
                                    if (activeStay) {
                                        setExtensionDate(activeStay.dateOut.split('T')[0]);
                                    }
                                    setShowExtensionModal(true);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-colors"
                            >
                                <CalendarPlus size={14} />
                                {t('Extend')}
                            </button>
                            <button 
                                onClick={handleCheckout}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                            >
                                <LogOut size={14} />
                                {t('Checkout')}
                            </button>
                        </div>
                    )}
                   <div className="flex flex-col items-start md:items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Current Status')}</span>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${
                            room?.status === 'AVAILABLE' ? 'text-emerald-600' :
                            room?.status === 'OCCUPIED' ? 'text-blue-600' :
                            'text-red-600'
                        }`}>{t(room?.status)}</span>
                   </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Top Statistics Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="premium-card !p-4 bg-slate-900 text-white border-none shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black">{allRecords.length}</p>
                                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{t('Total Records')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="premium-card !p-4 bg-emerald-600 text-white border-none shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black">{stays.length}</p>
                                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{t('Past Stays')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="premium-card !p-4 bg-purple-600 text-white border-none shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black">{reservations.length}</p>
                                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{t('Upcoming')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="premium-card !p-4 bg-maroon text-white border-none shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black">{room?.status === 'OCCUPIED' ? t('Occupied') : t('Idle')}</p>
                                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{t('Current State')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Calendar */}
                <div className="premium-card !p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={16} className="text-maroon" />
                            {t('Occupancy & Booking Calendar')}
                        </h3>
                        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded bg-[#16a34a]"></div>
                                {t('Active Stay')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded bg-[#9333ea]"></div>
                                {t('Reserved')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded bg-[#dc2626]"></div>
                                {t('Active Checkout')}
                            </div>
                        </div>
                    </div>
                    <div className="calendar-container">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={calendarEvents}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: ''
                            }}
                            height="450px"
                            displayEventTime={false}
                        />
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex px-8 border-b border-slate-100 bg-white sticky top-0 z-10 overflow-x-auto">
                    {[
                        { id: 'FINANCIAL', label: t('Financial Summary'), icon: ReceiptText },
                        { id: 'LEDGER', label: t('General Ledger'), icon: FileText },
                        { id: 'OPERATIONAL', label: t('Operational Data'), icon: Info }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap
                                ${activeTab === tab.id 
                                    ? 'text-maroon' 
                                    : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-maroon' : 'text-slate-300'} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-maroon rounded-t-full shadow-[0_-2px_10px_rgba(128,0,0,0.2)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-0">
                    {activeTab === 'FINANCIAL' && (
                        <div className="flex flex-col gap-6 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="premium-card p-6 flex flex-col gap-2 border-l-4 border-l-green-500">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('Total Room Revenue')}</div>
                                    <div className="text-3xl font-extrabold text-green-600">$ {roomRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                    <div className="text-[12px] text-slate-400 font-medium">{t('Accumulated from all closed and active folios.')}</div>
                                </div>
                                <div className="premium-card p-6 flex flex-col gap-2 border-l-4 border-l-blue-500">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('Total Folios')}</div>
                                    <div className="text-3xl font-extrabold text-blue-600">{roomFolios.length}</div>
                                    <div className="text-[12px] text-slate-400 font-medium">{t('Recorded billing sessions specific to this room.')}</div>
                                </div>
                            </div>
                            
                            <div className="premium-card mt-2">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2"><ReceiptText size={16}/> {t('Associated Folios')}</h3>
                                </div>
                                <div className="overflow-x-auto w-full">
                                    <table className="management-table">
                                        <thead>
                                            <tr>
                                                <th>{t('Folio ID')}</th>
                                                <th>{t('Guest')}</th>
                                                <th>{t('Status')}</th>
                                                <th>{t('DateOpened')}</th>
                                                <th className="text-right">{t('Amount')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {roomFolios.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-10 text-slate-400 italic text-sm">{t('No folios available for this room.')}</td>
                                                </tr>
                                            ) : (
                                                roomFolios.sort((a,b) => new Date(b.openedAt) - new Date(a.openedAt)).map(f => (
                                                    <tr key={f.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate('/folio?search=' + f.roomNumber)}>
                                                        <td className="font-bold text-slate-500">#{f.id}</td>
                                                        <td className="font-semibold text-slate-800">{f.guestName || '—'}</td>
                                                        <td>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                                f.status === 'CLOSED' ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                                                            }`}>
                                                                {t(f.status)}
                                                            </span>
                                                        </td>
                                                        <td className="text-slate-500 text-[12px]">{fmt(f.openedAt)}</td>
                                                        <td className="text-right font-black text-slate-800">$ {parseFloat(f.totalAmount || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'LEDGER' && (
                        <div className="overflow-x-auto w-full">
                            <table className="management-table">
                                <thead>
                                    <tr>
                                        <th>{t('Type')}</th>
                                        <th>{t('Guest Name')}</th>
                                        <th>{t('Check-In')}</th>
                                        <th>{t('Check-Out')}</th>
                                        <th>{t('Duration')}</th>
                                        <th>{t('Status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-20 text-slate-300">
                                                <Info size={40} strokeWidth={1} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-xs uppercase font-black tracking-widest">{t('No history records found')}</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        allRecords
                                            .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                                            .map((rec, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm
                                                        ${rec._type === 'RESERVATION' ? 'bg-purple-600 text-white' : 
                                                          (rec.status === 'CHECKED_OUT' ? 'bg-red-600 text-white' : 'bg-green-600 text-white')
                                                        }`}>
                                                        {rec._type === 'STAY' ? t('Stay') : t('Booked')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400">
                                                            {rec.guestName ? rec.guestName[0] : 'G'}
                                                        </div>
                                                        <span className="font-bold text-slate-800">{rec.guestName || t('Walk-in Guest')}</span>
                                                    </div>
                                                </td>
                                                <td className="text-[12px] font-bold text-slate-600">
                                                    {fmt(rec.dateIn)}
                                                </td>
                                                <td className="text-[12px] font-bold text-slate-600">
                                                    {fmt(rec.actualDateOut || rec.dateOut)}
                                                </td>
                                                <td>
                                                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                        {calculateNights(rec.dateIn, rec.dateOut)} {t('Nights')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor(rec.status)}`}>
                                                        {rec.status?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'OPERATIONAL' && (
                        <div className="flex flex-col gap-6 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="premium-card p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('Housekeeping Status')}</p>
                                    <p className={`text-xl font-black ${room?.status === 'DIRTY' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {t(room?.status === 'DIRTY' ? 'DIRTY' : 'CLEAN')}
                                    </p>
                                </div>
                                <div className="premium-card p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('Max Occupancy')}</p>
                                    <p className="text-xl font-black text-slate-800">{room?.roomType?.maxOccupancy || 0} {t('Persons')}</p>
                                </div>
                                <div className="premium-card p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('Total Historical Stays')}</p>
                                    <p className="text-xl font-black text-slate-800">{stays.length}</p>
                                </div>
                            </div>

                            <div className="premium-card mt-2">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2"><Info size={16}/> {t('Maintenance History')}</h3>
                                </div>
                                <div className="overflow-x-auto w-full">
                                    <table className="management-table">
                                        <thead>
                                            <tr>
                                                <th>{t('Ticket ID')}</th>
                                                <th>{t('Reported')}</th>
                                                <th>{t('Title')}</th>
                                                <th>{t('Status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {maintenanceLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-10 text-slate-400 italic text-sm">{t('No active or previous maintenance tickets for this room.')}</td>
                                                </tr>
                                            ) : (
                                                maintenanceLogs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(log => (
                                                    <tr key={log.id} className="hover:bg-slate-50">
                                                        <td className="font-bold text-slate-500">#{log.id}</td>
                                                        <td className="text-slate-500 text-[12px]">{fmt(log.createdAt)}</td>
                                                        <td className="font-semibold text-slate-800">{log.title}</td>
                                                        <td>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                                log.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                                {log.status?.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === 'LEDGER' && allRecords.length > PAGE_SIZE && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={Math.ceil(allRecords.length / PAGE_SIZE)}
                            onPageChange={setCurrentPage}
                            totalItems={allRecords.length}
                            pageSize={PAGE_SIZE}
                        />
                    </div>
                )}
            </div>


            {/* Extension Modal */}
            <Modal
                isOpen={showExtensionModal}
                onClose={() => setShowExtensionModal(false)}
                size="none"
                customClasses="!max-w-[500px]"
            >
                <div className="modal-header px-6 py-4 border-b border-slate-100">
                    <h2 className="flex items-center gap-2 text-lg font-black text-slate-800 m-0 uppercase tracking-tight">
                        <CalendarPlus className="text-maroon" size={20} />
                        {t('Extend Guest Stay')}
                    </h2>
                </div>
                <form onSubmit={handleExtendStay} className="p-8 space-y-6">
                    <div className="form-group">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            {t('New Departure Date')}
                        </label>
                        <input 
                            type="date" 
                            required
                            className="w-full !p-4 !rounded-xl !border-slate-200 font-bold text-slate-700"
                            value={extensionDate}
                            onChange={e => setExtensionDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="mt-2 text-[10px] text-slate-400 font-medium">
                            {t('Modifying the departure date will update occupancy schedules for this room.')}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            type="button" 
                            onClick={() => setShowExtensionModal(false)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-4 rounded-xl transition-all uppercase tracking-widest text-[11px]"
                        >
                            {t('Cancel')}
                        </button>
                        <button 
                            type="submit" 
                            disabled={extensionLoading}
                            className="flex-[2] bg-maroon hover:bg-[#6b0f11] text-white font-black py-4 rounded-xl shadow-lg transition-all uppercase tracking-widest text-[11px] disabled:opacity-50"
                        >
                            {extensionLoading ? t('Processing...') : t('Update Stay')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RoomDetails;
