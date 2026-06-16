import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { CalendarDays, User, Bed, ArrowLeft } from 'lucide-react';
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
        if (selectedDate) {
            setLoading(true);
            api.get(`/rooms/occupancy?date=${selectedDate}`)
                .then(res => setOccupancy(res.data))
                .catch(err => console.error('Failed to fetch occupancy:', err))
                .finally(() => setLoading(false));
        }
    }, [selectedDate]);

    const handleDateClick = (arg) => {
        setSelectedDate(arg.dateStr);
    };

    const getRoomColor = (status) => {
        switch (status) {
            case 'OCCUPIED': return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-100';
            case 'RESERVED': return 'bg-blue-500 text-white border-blue-600 shadow-blue-100';    
            default: return 'bg-slate-300 text-slate-700 border-slate-400';
        }
    };

    const getStatusLabel = (status) => {
        if (status === 'OCCUPIED') return t('Occupied');
        if (status === 'RESERVED') return t('Reserved');
        return status;
    };

    const handleRoomClick = (room) => {
        navigate(`/rooms/${room.roomId}`);
    };

    // Filter to only show occupied or reserved rooms
    const activeRooms = occupancy.filter(r => r.status === 'OCCUPIED' || r.status === 'RESERVED');

    return (
        <div className="flex flex-col gap-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <CalendarDays className="text-maroon" size={32} />
                        {t('Room Calendar')}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">{t('Select a date to view in-house and arriving guests')}</p>
                </div>
            </div>

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
                    <div className="flex flex-col sm:flex-row bg-white p-5 justify-between items-center rounded-2xl border border-slate-200 shadow-sm">
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
                        
                        <div className="flex flex-wrap gap-4 mt-4 sm:mt-0">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{t('Occupied')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{t('Reserved')}</span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {activeRooms.length > 0 ? activeRooms.map((room) => (
                                <div 
                                    key={room.roomId}
                                    onClick={() => handleRoomClick(room)}
                                    className={`
                                        relative p-4 rounded-2xl border-2 transition-all cursor-pointer group hover:scale-105 active:scale-95
                                        ${getRoomColor(room.status)}
                                        shadow-sm hover:shadow-xl flex flex-col items-center justify-center text-center overflow-hidden
                                    `}
                                >
                                    <div className="z-10 flex flex-col items-center gap-1 w-full relative">
                                        <span className="text-3xl font-black">{room.roomNumber}</span>
                                        <span className="text-[10px] uppercase font-bold tracking-tight opacity-75">{room.roomTypeName || '-'}</span>
                                        <span className="text-[9px] font-black uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full bg-black/10 text-white">
                                            {getStatusLabel(room.status)}
                                        </span>
                                        
                                        {room.guestName && (
                                            <div className="mt-2 text-[11px] font-black w-full px-2 pt-2 border-t border-white/20 text-white flex items-center justify-center">
                                                <span className="flex items-center justify-center gap-1 opacity-90 truncate max-w-full">
                                                    <User size={12} className="min-w-3"/> 
                                                    <span className="truncate">{room.guestName}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                        <Bed size={80} />
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
                                    <Bed size={48} className="opacity-20 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-600 mb-1">{t('No Occupied Rooms')}</h3>
                                    <p className="text-sm font-medium">{t('There are no active stays or reservations scheduled for this date.')}</p>
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
