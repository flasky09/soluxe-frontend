import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../services/api';
import Modal from '../Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, LogIn, LogOut, Info } from 'lucide-react';

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

const RoomDetailsModal = ({ isOpen, onClose, roomId, roomNumber }) => {
    const { t } = useLanguage();
    const [stays, setStays] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchRoomData = React.useCallback(async () => {
        if (!roomId) return;
        setLoading(true);
        try {
            const [staysRes, reservationsRes] = await Promise.all([
                api.get('/stays').catch(() => ({ data: [] })),
                api.get('/reservations').catch(() => ({ data: [] }))
            ]);

            const allStays = Array.isArray(staysRes.data)
                ? staysRes.data
                : (staysRes.data?.content || []);
            const allReservations = Array.isArray(reservationsRes.data)
                ? reservationsRes.data
                : (reservationsRes.data?.content || []);

            const roomStays = allStays.filter(
                s => String(s.roomId) === String(roomId)
            );
            const roomReservations = allReservations.filter(
                r => String(r.roomId) === String(roomId)
            );

            setStays(roomStays);
            setReservations(roomReservations);

            // Build background calendar events
            const events = [];

            roomStays.forEach(s => {
                if (s.dateIn) {
                    // FullCalendar end is exclusive, so add 1 day to include checkout day
                    const end = s.dateOut
                        ? new Date(new Date(s.dateOut).getTime() + 86400000)
                            .toISOString().split('T')[0]
                        : s.dateIn.split('T')[0];

                    let color = '#059669'; // Strong Emerald-600 (Active)
                    const status = s.status ? s.status.toUpperCase() : '';

                    if (status === 'CHECKED_OUT') {
                        color = '#dc2626'; // Strong Red-600 (Previous)
                    } else if (status === 'CANCELLED' || status === 'VOIDED') {
                        return; // Don't show cancelled/voided stays on calendar
                    }

                    events.push({
                        title: '',
                        start: s.dateIn.split('T')[0],
                        end,
                        display: 'background',
                        backgroundColor: color,
                        extendedProps: { type: 'STAY', status }
                    });
                }
            });

            roomReservations.forEach(r => {
                if (r.dateIn) {
                    const status = r.status ? r.status.toUpperCase() : '';
                    if (status === 'CANCELLED' || status === 'VOIDED') {
                        return;
                    }

                    const end = r.dateOut
                        ? new Date(new Date(r.dateOut).getTime() + 86400000)
                            .toISOString().split('T')[0]
                        : r.dateIn;
                    events.push({
                        title: '',
                        start: r.dateIn,
                        end,
                        display: 'background',
                        backgroundColor: '#9333ea', // Strong Purple-600 (Future)
                        extendedProps: { type: 'RESERVATION', status }
                    });
                }
            });

            setCalendarEvents(events);
        } catch (err) {
            console.error('Failed to fetch room details:', err);
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        if (isOpen && roomId) {
            fetchRoomData();
        }
    }, [isOpen, roomId, fetchRoomData]);

    const allRecords = [
        ...stays.map(s => ({ ...s, _type: 'STAY' })),
        ...reservations.map(r => ({ ...r, _type: 'RESERVATION' }))
    ].sort((a, b) => new Date(b.dateIn) - new Date(a.dateIn));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('Room')} ${roomNumber} — ${t('History & Calendar')}`}
            size="lg"
            customClasses="!w-[90%] !max-w-[1200px]"
        >
            <div className="flex flex-col lg:flex-row gap-6 p-4 h-[75vh]">

                {/* Left: Calendar */}
                <div className="flex-1 bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold uppercase tracking-wider text-xs">
                        <Calendar size={13} className="text-maroon" />
                        {t('Occupancy Calendar')}
                    </div>
                    <div className="flex-1">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={calendarEvents}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: ''
                            }}
                            height="100%"
                            displayEventTime={false}
                        />
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-[#059669] opacity-80"></div>
                            {t('Active Stay')}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-[#dc2626] opacity-80"></div>
                            {t('Previous Stay')}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-[#9333ea] opacity-80"></div>
                            {t('Reserved')}
                        </div>
                    </div>
                </div>

                {/* Right: Stay History */}
                <div className="w-full lg:w-[420px] bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold uppercase tracking-wider text-xs">
                        <Calendar size={13} className="text-maroon" />
                        {t('Stay & Reservation History')}
                        <span className="ml-auto bg-white border border-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {allRecords.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                        {loading ? (
                            <div className="text-center py-16 text-slate-400 text-xs animate-pulse">{t('Loading...')}</div>
                        ) : allRecords.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-300 opacity-60">
                                <Info size={30} strokeWidth={1.5} className="mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">{t('No records found')}</p>
                            </div>
                        ) : (
                            allRecords.map((rec, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-3.5"
                                >
                                    {/* Type badge + status */}
                                    <div className="flex items-center justify-between mb-2.5">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full 
                                            ${rec._type === 'RESERVATION' ? 'bg-purple-600 text-white' : 
                                              (rec.status === 'CHECKED_OUT' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white')
                                            }`}>
                                            {rec._type === 'STAY' ? t('Stay') : t('Reservation')}
                                        </span>
                                        {rec.status && (
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor(rec.status)}`}>
                                                {rec.status.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Check-in row */}
                                    <div className="flex items-start gap-2 mb-1.5">
                                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                                            <LogIn size={11} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{t('Check-In')}</div>
                                            <div className="text-[12px] font-bold text-slate-700">{fmt(rec.dateIn)}</div>
                                        </div>
                                    </div>

                                    {/* Check-out row */}
                                    <div className="flex items-start gap-2">
                                        <div className="w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                                            <LogOut size={11} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{t('Check-Out')}</div>
                                            <div className="text-[12px] font-bold text-slate-700">
                                                {fmt(rec.actualDateOut || rec.dateOut)}
                                                {rec.actualDateOut && rec.dateOut && rec.actualDateOut !== rec.dateOut && (
                                                    <span className="ml-1.5 text-[9px] text-slate-400 font-medium">(planned: {fmt(rec.dateOut)})</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default RoomDetailsModal;
