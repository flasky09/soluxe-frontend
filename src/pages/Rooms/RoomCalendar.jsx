import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { CalendarDays, ChevronLeft, ChevronRight, User, Bed, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoomCalendar = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [occupancy, setOccupancy] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOccupancy = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/rooms/occupancy?date=${date}`);
            setOccupancy(res.data);
        } catch (err) {
            console.error('Failed to fetch occupancy:', err);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        fetchOccupancy();
    }, [fetchOccupancy]);

    const changeDate = (days) => {
        const currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() + days);
        setDate(currentDate.toISOString().split('T')[0]);
    };

    const getRoomColor = (status) => {
        switch (status) {
            case 'OCCUPIED': return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-100';
            case 'RESERVED': return 'bg-blue-500 text-white border-blue-600 shadow-blue-100';    
            case 'VACANT': return 'bg-slate-200 text-slate-700 border-slate-300 shadow-slate-100';
            default: return 'bg-slate-300 text-slate-700 border-slate-400';
        }
    };

    const getStatusLabel = (status) => {
        if (status === 'VACANT') return t('Empty');
        if (status === 'OCCUPIED') return t('Occupied');
        if (status === 'RESERVED') return t('Reserved');
        return status;
    };

    const handleRoomClick = (room) => {
        // As discussed, linking to Room details where user can see stays, reservations, or create them.
        navigate(`/rooms/${room.roomId}`);
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <CalendarDays className="text-maroon" size={32} />
                        {t('Room Calendar')}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">{t('Daily outlook mapping guests to rooms')}</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    <button 
                        onClick={() => changeDate(-1)}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                        title={t('Previous Day')}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex flex-col items-center px-4">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('Selected Date')}</span>
                        <input 
                            type="date" 
                            className="bg-transparent font-black text-slate-700 outline-none text-center cursor-pointer"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={() => changeDate(1)}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                        title={t('Next Day')}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{t('Occupied')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{t('Reserved')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-300"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{t('Empty')}</span>
                </div>
            </div>

            {/* Room Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {occupancy.map((room) => {
                        return (
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
                                    <span className={`text-[9px] font-black uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full ${
                                        room.status === 'VACANT' ? 'bg-slate-300/50 text-slate-600' : 'bg-black/10 text-white'
                                    }`}>
                                        {getStatusLabel(room.status)}
                                    </span>
                                    
                                    {room.guestName && (
                                        <div className={`mt-2 text-[11px] font-black truncate w-full px-2 pt-2 border-t ${
                                            room.status === 'VACANT' ? 'border-slate-300 text-slate-500' : 'border-white/20 text-white'
                                        }`}>
                                            <span className="flex items-center justify-center gap-1 opacity-90"><User size={12}/> {room.guestName}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Background design element */}
                                <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                    <Bed size={80} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RoomCalendar;
