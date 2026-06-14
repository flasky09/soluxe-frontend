import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { CreditCard, Hash, User, Calendar, CheckCircle, AlertCircle, Clock, RefreshCw, UserCheck } from 'lucide-react';

const Keycards = () => {
    const { t } = useLanguage();
    const [rooms, setRooms] = useState([]);
    const [activeStays, setActiveStays] = useState([]);
    const [guests, setGuests] = useState([]);
    const [arrivals, setArrivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isWriting, setIsWriting] = useState(false);
    const [writeSuccess, setWriteSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        guestName: '',
        idNumber: '',
        roomNumber: '',
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [roomsRes, staysRes, guestsRes, arrivalsRes] = await Promise.all([
                api.get('/rooms'),
                api.get('/stays/active'),
                api.get('/guests'),
                api.get('/reservations/arrivals')
            ]);
            setRooms(roomsRes.data);
            setActiveStays(staysRes.data);
            setGuests(guestsRes.data);
            setArrivals(arrivalsRes.data);
        } catch (err) {
            console.error('Failed to fetch keycard sync data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Map room to its active stay and guest
    const roomMap = React.useMemo(() => {
        const map = {};
        activeStays.forEach(stay => {
            const guest = guests.find(g => g.id === stay.guestId);
            map[stay.roomId] = { ...stay, guestName: guest?.fullName || `Guest #${stay.guestId}`, idNumber: guest?.passportNumber || guest?.idNumber || '' };
        });
        return map;
    }, [activeStays, guests]);

    const handleCreateKeycard = (room = null) => {
        const activeStay = room ? (roomMap[room.id] || roomMap[room.roomNumber]) : null;
        
        if (activeStay) {
            setFormData({
                guestName: activeStay.guestName,
                idNumber: activeStay.idNumber,
                roomNumber: room.roomNumber,
                checkIn: activeStay.dateIn ? activeStay.dateIn.split('T')[0] : new Date().toISOString().split('T')[0],
                checkOut: activeStay.dateOut ? activeStay.dateOut.split('T')[0] : ''
            });
        } else {
            setFormData({
                guestName: '',
                idNumber: '',
                roomNumber: room ? room.roomNumber : '',
                checkIn: new Date().toISOString().split('T')[0],
                checkOut: ''
            });
        }
        setWriteSuccess(false);
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsWriting(true);
        
        // Simulate "Writing to Card" process
        setTimeout(() => {
            setIsWriting(false);
            setWriteSuccess(true);
            setTimeout(() => {
                setShowModal(false);
            }, 2000);
        }, 3000);
    };

    const getRoomColor = (status) => {
        switch (status) {
            case 'OCCUPIED': return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-100'; // Green
            case 'AVAILABLE': return 'bg-red-500 text-white border-red-600 shadow-red-100';    // Red (Vacant)
            case 'DIRTY':
            case 'CLEANING':
            case 'MAINTENANCE': return 'bg-orange-500 text-white border-orange-600 shadow-orange-100'; // Orange
            default: return 'bg-slate-300 text-slate-700 border-slate-400';
        }
    };

    const getStatusLabel = (status) => {
        if (status === 'AVAILABLE') return t('Vacant');
        if (status === 'OCCUPIED') return t('Occupied');
        if (['DIRTY', 'CLEANING', 'MAINTENANCE'].includes(status)) return t('Cleaning/Issue');
        return status;
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <CreditCard className="text-maroon" size={32} />
                        {t('Door Keycards Management')}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">{t('Real-time synchronization with active check-ins')}</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                        title={t('Refresh Data')}
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => handleCreateKeycard()}
                        className="flex items-center gap-2 bg-maroon text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-maroon/90 transition-all active:scale-95"
                    >
                        <CreditCard size={18} />
                        {t('Create New Keycard')}
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="premium-card !bg-emerald-50 border-emerald-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('In-House Guests')}</p>
                        <p className="text-2xl font-black text-emerald-900">{activeStays.length}</p>
                    </div>
                </div>
                <div className="premium-card !bg-amber-50 border-amber-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t('Pending Arrivals')}</p>
                        <p className="text-2xl font-black text-amber-900">{arrivals.length}</p>
                    </div>
                </div>
                <div className="premium-card !bg-slate-50 border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-maroon text-white rounded-xl flex items-center justify-center shadow-lg shadow-maroon/10">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('Total Rooms')}</p>
                        <p className="text-2xl font-black text-slate-900">{rooms.length}</p>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{t('Occupied')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{t('Vacant')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-500"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{t('Cleaning / Issue')}</span>
                </div>
            </div>

            {/* Room Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {[...Array(16)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {rooms.map((room) => {
                        const stay = roomMap[room.id] || roomMap[room.roomNumber];
                        return (
                            <div 
                                key={room.id}
                                onClick={() => handleCreateKeycard(room)}
                                className={`
                                    relative p-4 rounded-2xl border-2 transition-all cursor-pointer group hover:scale-105 active:scale-95
                                    ${getRoomColor(room.status)}
                                    shadow-sm hover:shadow-xl flex flex-col items-center justify-center text-center overflow-hidden
                                `}
                            >
                                <div className="z-10 flex flex-col items-center gap-1">
                                    <span className="text-3xl font-black">{room.roomNumber}</span>
                                    <span className="text-[9px] font-black uppercase tracking-wider opacity-90 bg-black/10 px-2 py-0.5 rounded-full">{getStatusLabel(room.status)}</span>
                                    
                                    {stay && (
                                        <div className="mt-2 text-[10px] font-bold border-t border-white/20 pt-2 w-full max-w-[80px] truncate">
                                            {stay.guestName}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Background design element */}
                                <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
                                    <CreditCard size={80} />
                                </div>

                                {/* Hover action overlay */}
                                <div className="absolute inset-0 bg-black/80 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <CreditCard size={24} className="text-yellow animate-bounce" />
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">{t('Issue Card')}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Keycard Creation Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => !isWriting && setShowModal(false)}
                title={t('Encode Guest Keycard')}
                size="md"
            >
                {writeSuccess ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-pill">
                            <CheckCircle size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('Card Written Successfully!')}</h2>
                        <p className="text-slate-500 mt-2 font-medium">
                            {t('Access for')} <span className="text-maroon font-black">{formData.guestName}</span> {t('is now active on Room')} <span className="font-black text-maroon">{formData.roomNumber}</span>
                        </p>
                    </div>
                ) : isWriting ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="relative w-48 h-28 bg-slate-100 rounded-2xl overflow-hidden mb-8 border-4 border-slate-200 shadow-inner flex items-center justify-center">
                            <div className="absolute inset-0 bg-linear-to-r from-maroon/5 via-maroon/20 to-maroon/5 animate-[loading_1.5s_infinite]"></div>
                            <CreditCard className="text-maroon opacity-50 animate-pulse" size={48} />
                            <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-maroon w-1/2 animate-[progress_2s_ease-in-out_infinite]"></div>
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 animate-pulse tracking-tight">{t('Encoding RFID Keycard...')}</h2>
                        <p className="text-slate-400 text-sm mt-2 font-medium">{t('Hold the proximity card against the USB encoder')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4">
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="form-group flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <User size={14} className="text-maroon" /> {t('Guest Full Name')}
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.guestName}
                                        onChange={e => setFormData({...formData, guestName: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-maroon/5 focus:border-maroon outline-none transition-all placeholder:text-slate-300 shadow-sm"
                                        placeholder="First & Last Name"
                                    />
                                </div>
                                <div className="form-group flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <Hash size={14} className="text-maroon" /> {t('Passport / ID Information')}
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.idNumber}
                                        onChange={e => setFormData({...formData, idNumber: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-maroon/5 focus:border-maroon outline-none transition-all placeholder:text-slate-300 shadow-sm"
                                        placeholder="P12345678"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="form-group flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <Hash size={14} className="text-maroon" /> {t('Target Room')}
                                    </label>
                                    <select 
                                        required 
                                        value={formData.roomNumber}
                                        onChange={e => setFormData({...formData, roomNumber: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-maroon/5 focus:border-maroon outline-none transition-all appearance-none shadow-sm h-[60px]"
                                    >
                                        <option value="">{t('Select Room')}</option>
                                        {rooms.map(r => (
                                            <option key={r.id} value={r.roomNumber}>{t('Room')} {r.roomNumber} {roomMap[r.id] ? `(${t('Reserved')})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <Calendar size={14} className="text-maroon" /> {t('Check-In Date')}
                                    </label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={formData.checkIn}
                                        onChange={e => setFormData({...formData, checkIn: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-maroon/5 focus:border-maroon outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="form-group flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <Calendar size={14} className="text-maroon" /> {t('Check-Out Date')}
                                    </label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={formData.checkOut}
                                        onChange={e => setFormData({...formData, checkOut: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-maroon/5 focus:border-maroon outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-8 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    {t('Cancel')}
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] px-8 py-5 bg-maroon text-white rounded-[24px] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-maroon/30 hover:bg-maroon/90 hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    {t('Confirm & Write Card')}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                @keyframes progress {
                    0% { width: 0; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }
            ` }} />
        </div>
    );
};

export default Keycards;
