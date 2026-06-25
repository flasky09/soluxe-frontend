import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { User, Bed, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const RoomCalendar = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(null);
    const [occupancy, setOccupancy] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOccupancy = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/rooms/occupancy?date=${selectedDate}`);
                setOccupancy(res.data);
            } catch (err) {
                console.error('Failed to fetch occupancy:', err);
            } finally {
                setLoading(false);
            }
        };
        
        if (selectedDate) {
            fetchOccupancy();
        }
    }, [selectedDate]);

    const handleDateClick = (arg) => {
        setSelectedDate(arg.dateStr);
    };

    // Determine display status for coloring — priority: OCCUPIED > RESERVED > DIRTY/CLEANING/MAINTENANCE > AVAILABLE
    const getDisplayStatus = (room) => {
        if (room.status === 'OCCUPIED') return 'OCCUPIED';
        if (room.status === 'RESERVED') return 'RESERVED';
        // For vacant rooms, use the actual room housekeeping status
        const rs = room.roomStatus;
        if (rs === 'DIRTY' || rs === 'CLEANING' || rs === 'MAINTENANCE') return rs;
        return 'AVAILABLE'; // AVAILABLE or INSPECTED → clean/vacant
    };

    const getRoomColor = (displayStatus) => {
        switch (displayStatus) {
            case 'OCCUPIED':    return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-100';
            case 'RESERVED':    return 'bg-blue-500 text-white border-blue-600 shadow-blue-100';
            case 'DIRTY':
            case 'CLEANING':
            case 'MAINTENANCE': return 'bg-orange-500 text-white border-orange-600 shadow-orange-100';
            default:            return 'bg-red-500 text-white border-red-600 shadow-red-100'; // AVAILABLE (vacant clean)
        }
    };

    const getStatusLabel = (displayStatus) => {
        if (displayStatus === 'OCCUPIED')    return t('Occupied');
        if (displayStatus === 'RESERVED')    return t('Reserved');
        if (displayStatus === 'DIRTY')       return t('Dirty');
        if (displayStatus === 'CLEANING')    return t('Cleaning');
        if (displayStatus === 'MAINTENANCE') return t('Maintenance');
        return t('Vacant');
    };

    const handleRoomClick = (room) => {
        navigate(`/rooms/${room.roomId}`);
    };

    // Stats
    const stats = {
        occupied:  occupancy.filter(r => r.status === 'OCCUPIED').length,
        reserved:  occupancy.filter(r => r.status === 'RESERVED').length,
        dirty:     occupancy.filter(r => r.status === 'VACANT' && (r.roomStatus === 'DIRTY' || r.roomStatus === 'CLEANING' || r.roomStatus === 'MAINTENANCE')).length,
        available: occupancy.filter(r => r.status === 'VACANT' && r.roomStatus !== 'DIRTY' && r.roomStatus !== 'CLEANING' && r.roomStatus !== 'MAINTENANCE').length,
    };

    return (
        <div className="flex flex-col gap-8">

            {!selectedDate ? (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 transform transition-all duration-300 hover:shadow-md">
                    <style>
                        {`
                          /* FullCalendar dynamic overrides for aesthetics */
                          .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9; }
                          .fc .fc-toolbar-title { font-weight: 900; color: #1e293b; font-size: 1.5rem; letter-spacing: -0.025em; }
                          .fc .fc-button-primary { background-color: #f8fafc; border-color: #e2e8f0; color: #475569; font-weight: bold; border-radius: 0.75rem; transition: all 0.2s; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
                          .fc .fc-button-primary:hover { background-color: #7a1a2e; border-color: #7a1a2e; color: white; }
                          .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #7a1a2e; border-color: #7a1a2e; color: white; }
                          .fc-daygrid-day { cursor: pointer; transition: background-color 0.2s; }
                          .fc-daygrid-day:hover { background-color: #f1f5f9; }
                          .fc-day-today { background-color: #fef2f2 !important; font-weight: bold; }
                          .fc-col-header-cell-cushion { color: #64748b; font-weight: 900; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; padding: 0.75rem 0; }
                          .fc-daygrid-day-number { font-weight: 800; color: #334155; padding: 0.5rem; }
                        `}
                    </style>
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        dateClick={handleDateClick}
                        height="auto"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: ''
                        }}
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Toolbar + legend */}
                    <div className="flex flex-col sm:flex-row bg-white p-5 justify-between items-center rounded-2xl border border-slate-200 shadow-sm gap-4">
                        <div className="flex items-center gap-4">
                            <button 
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                onClick={() => setSelectedDate(null)}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">{t('Occupancy Details')}</h2>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedDate}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{t('Occupied')} ({stats.occupied})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{t('Reserved')} ({stats.reserved})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{t('Dirty / Cleaning')} ({stats.dirty})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{t('Vacant / Clean')} ({stats.available})</span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl border border-slate-200"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                            {occupancy.length > 0 ? occupancy.map((room) => {
                                const displayStatus = getDisplayStatus(room);
                                return (
                                    <div 
                                        key={room.roomId}
                                        onClick={() => handleRoomClick(room)}
                                        className={`relative p-2.5 rounded-xl border-2 transition-all cursor-pointer group hover:scale-105 active:scale-95 ${getRoomColor(displayStatus)} shadow-sm hover:shadow-xl flex flex-col items-center justify-center text-center overflow-hidden`}
                                    >
                                        <div className="z-10 flex flex-col items-center gap-0.5 w-full relative">
                                            <span className="text-xl font-black tracking-tight">{room.roomNumber}</span>
                                            <span className="text-[9px] uppercase font-bold tracking-tight opacity-75 truncate max-w-full">{room.roomTypeName || '-'}</span>
                                            <span className="text-[8px] font-black uppercase tracking-wider mt-0.5 px-1.5 py-0.5 rounded-full bg-black/10 text-white">
                                                {getStatusLabel(displayStatus)}
                                            </span>
                                            
                                            {room.guestName && (
                                                <div className="mt-1 text-[10px] font-black w-full px-1 pt-1.5 border-t border-white/20 text-white flex items-center justify-center">
                                                    <span className="flex items-center justify-center gap-1 opacity-90 truncate max-w-full">
                                                        <User size={10} className="min-w-2.5"/> 
                                                        <span className="truncate">{room.guestName}</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                            <Bed size={56} />
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
                                    <Bed size={48} className="opacity-20 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-600 mb-1">{t('No Rooms Found')}</h3>
                                    <p className="text-sm font-medium">{t('No room data available for this date.')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RoomCalendar;
