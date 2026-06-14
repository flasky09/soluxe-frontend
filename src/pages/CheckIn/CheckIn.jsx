import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import GuestForm from '../../components/GuestForm/GuestForm';
import { Wallet } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';
import { formatDate } from '../../services/formatters';

const CheckIn = () => {
    const [currentPageStays, setCurrentPageStays] = useState(1);
    const [currentPageRes, setCurrentPageRes] = useState(1);
    const PAGE_SIZE = 20;
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ROLE_HOTEL_ADMIN' || user?.role === 'HOTEL_ADMIN';
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showDirectCheckInModal, setShowDirectCheckInModal] = useState(false);
    const [showReservationModal, setShowReservationModal] = useState(false);
    const [showQuickGuestModal, setShowQuickGuestModal] = useState(false);

    // Reservation check-in state
    const [reservations, setReservations] = useState([]);
    const [guests, setGuests] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [resCheckInRoomId, setResCheckInRoomId] = useState('');
    const [resCheckInLoading, setResCheckInLoading] = useState(false);

    // Active Stays state
    const [activeStays, setActiveStays] = useState([]);

    // Payment states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [activeFolio, setActiveFolio] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        paymentMethodId: '',
        referenceNumber: '',
        notes: ''
    });

    // Direct Check-in state
    const [allRooms, setAllRooms] = useState([]);
    const [directCheckInData, setDirectCheckInData] = useState({
        guestId: '',
        roomId: '',
        adults: 1,
        children: 0,
        dateOut: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
        arrivingFrom: '',
        nextDestination: '',
        arrivalFlightNo: '',
        departureFlightNo: '',
        notes: ''
    });
    const [directCheckInLoading, setDirectCheckInLoading] = useState(false);
    const [directCheckInSuccess, setDirectCheckInSuccess] = useState(null);
    const [directCheckInError, setDirectCheckInError] = useState(null);

    const [searchParams] = useSearchParams();
    const resIdParam = searchParams.get('resId');
    const guestIdParam = searchParams.get('guestId');

    // --- RESERVATION CHECK-IN ---
    const handleOpenResModal = useCallback(async (res, roomsList = null) => {
        setSelectedReservation(res);
        setResCheckInRoomId('');
        const sourceRooms = roomsList || allRooms;
        const availableAll = sourceRooms.filter(r => r.status === 'AVAILABLE');
        const filtered = availableAll.filter(r => {
            const rTypeId = r.roomType?.id ?? r.roomTypeId;
            return Number(rTypeId) === Number(res.roomTypeId);
        });
        
        if (filtered.length === 0 && res.roomTypeId) {
            console.warn(`No rooms found for RoomType ID: ${res.roomTypeId}. Falling back to all available rooms.`);
        }
        setAvailableRooms(filtered.length > 0 ? filtered : availableAll);
        setShowReservationModal(true);
    }, [allRooms]);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [resRes, guestsRes, typesRes, roomsRes, paymentMethodsRes, activeStaysRes] = await Promise.all([
                api.get('/reservations/arrivals'),
                api.get('/guests'),
                api.get('/room-types'),
                api.get('/rooms'),
                api.get('/folios/payment-methods'),
                api.get('/stays/active')
            ]);
            // Today's arrivals only
            setReservations(resRes.data);
            setGuests(guestsRes.data);
            setRoomTypes(typesRes.data);
            setAllRooms(roomsRes.data);
            setPaymentMethods(paymentMethodsRes.data);
            setActiveStays(activeStaysRes.data);

            // If resId in URL, auto-open modal
            if (resIdParam) {
                let res = resRes.data.find(r => r.id === parseInt(resIdParam));
                if (!res) {
                    // Reservation not in today's arrivals (future date?) — fetch directly
                    try {
                        const singleRes = await api.get(`/reservations/${resIdParam}`);
                        res = singleRes.data;
                    } catch {
                        console.warn('Could not load reservation by ID:', resIdParam);
                    }
                }
                if (res) {
                    setSelectedReservation(res);
                    setResCheckInRoomId('');
                    const availableAll = roomsRes.data.filter(r => r.status === 'AVAILABLE');
                    const filtered = availableAll.filter(r => {
                        const rTypeId = r.roomType?.id ?? r.roomTypeId;
                        return Number(rTypeId) === Number(res.roomTypeId);
                    });
                    setAvailableRooms(filtered.length > 0 ? filtered : availableAll);
                    setShowReservationModal(true);
                }
            }

            // If guestId in URL, auto-open walk-in modal
            if (guestIdParam) {
                const guest = guestsRes.data.find(g => g.id === parseInt(guestIdParam));
                if (guest) {
                    setDirectCheckInData(prev => ({ ...prev, guestId: guest.id }));
                    setShowDirectCheckInModal(true);
                }
            }
        } catch (err) {
            console.error('Failed to load check-in data:', err);
        } finally {
            setLoading(false);
        }
    }, [resIdParam, guestIdParam]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const getGuestName = (id) => {
        const g = guests.find(g => g.id === id);
        return g ? g.fullName : `Guest #${id}`;
    };

    const getRoomTypeName = (id) => {
        const t = roomTypes.find(t => t.id === id);
        return t ? t.name : `Type #${id}`;
    };


    const handleResCheckIn = async (e) => {
        e.preventDefault();
        setResCheckInLoading(true);
        try {
            const payload = {
                reservationId: selectedReservation.id,
                roomId: parseInt(resCheckInRoomId),
                userId: user?.id || 1,
            };
            await api.post('/stays/check-in', payload);
            setShowReservationModal(false);
            alert('Check-in successful. Stay is now active.');
            fetchAllData();
        } catch (err) {
            console.error('Reservation check-in failed:', err);
            alert(err.response?.data?.message || 'Check-in failed. Please ensure the room is available.');
        } finally {
            setResCheckInLoading(false);
        }
    };

    const handleOpenPaymentModal = async (res) => {
        try {
            const folioRes = await api.get(`/folios/reservation/${res.id}`);
            setActiveFolio(folioRes.data);
            setSelectedReservation(res);
            setPaymentData({
                amount: '',
                paymentMethodId: paymentMethods[0]?.id || '',
                referenceNumber: '',
                notes: ''
            });
            setShowPaymentModal(true);
        } catch (err) {
            console.error('Failed to fetch folio:', err);
            alert('Could not initialize payment.');
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!activeFolio) return;
        try {
            const payload = {
                ...paymentData,
                amount: parseFloat(paymentData.amount),
                paymentMethodId: parseInt(paymentData.paymentMethodId)
            };
            await api.post(`/folios/${activeFolio.id}/payments?userId=${user?.id || 1}`, payload);
            setShowPaymentModal(false);
            alert('Payment recorded successfully!');
            fetchAllData();
        } catch (err) {
            console.error('Failed to record payment:', err);
            alert(err.response?.data?.message || 'Error recording payment.');
        }
    };

    // --- DIRECT CHECK-IN ---
    const availableDirectCheckInRooms = allRooms.filter(r => r.status === 'AVAILABLE');

    const handleDirectCheckIn = async (e) => {
        e.preventDefault();
        setDirectCheckInLoading(true);
        setDirectCheckInSuccess(null);
        setDirectCheckInError(null);
        try {
            const res = await api.post('/stays/direct', {
                guestId: parseInt(directCheckInData.guestId),
                roomId: parseInt(directCheckInData.roomId),
                adults: parseInt(directCheckInData.adults) || 1,
                children: parseInt(directCheckInData.children) || 0,
                dateOut: directCheckInData.dateOut,
                arrivingFrom: directCheckInData.arrivingFrom,
                nextDestination: directCheckInData.nextDestination,
                arrivalFlightNo: directCheckInData.arrivalFlightNo,
                departureFlightNo: directCheckInData.departureFlightNo,
                notes: directCheckInData.notes,
                userId: user?.id || 1,
            });
            setDirectCheckInSuccess(`Check-in successful. Stay #${res.data.id} is now ACTIVE.`);
            setDirectCheckInData({ 
                guestId: '', 
                roomId: '', 
                adults: 1, 
                children: 0,
                dateOut: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
                arrivingFrom: '',
                nextDestination: '',
                arrivalFlightNo: '',
                departureFlightNo: '',
                notes: ''
            });
            setTimeout(() => {
                setShowDirectCheckInModal(false);
                setDirectCheckInSuccess(null);
            }, 2000);
            fetchAllData();
        } catch (err) {
            setDirectCheckInError(err.response?.data?.message || 'Check-in failed. Please try again.');
        } finally {
            setDirectCheckInLoading(false);
        }
    };

    const handleVoidStay = async (stayId) => {
        if (!window.confirm('Are you sure you want to VOID this stay? The room will be set back to AVAILABLE and any linked reservation will be restored to BOOKED.')) return;
        try {
            await api.post(`/stays/${stayId}/void?userId=${user?.id || 1}`);
            alert('Stay voided successfully.');
            fetchAllData();
        } catch (err) {
            console.error('Failed to void stay:', err);
            alert(err.response?.data?.message || 'Failed to void stay.');
        }
    };

    const handleQuickGuestSuccess = (newGuest) => {
        setGuests(prev => [...prev, newGuest]);
        setDirectCheckInData(prev => ({ ...prev, guestId: newGuest.id }));
        setShowQuickGuestModal(false);
    };

    const totalPagesStays = Math.ceil(activeStays.length / PAGE_SIZE);
    const paginatedStays = activeStays.slice(
        (currentPageStays - 1) * PAGE_SIZE,
        currentPageStays * PAGE_SIZE
    );

    const totalPagesRes = Math.ceil(reservations.length / PAGE_SIZE);
    const paginatedRes = reservations.slice(
        (currentPageRes - 1) * PAGE_SIZE,
        currentPageRes * PAGE_SIZE
    );

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center mb-8">
                <button 
                    className="btn-primary flex items-center gap-2"
                    onClick={() => {
                        setDirectCheckInSuccess(null);
                        setDirectCheckInError(null);
                        setShowDirectCheckInModal(true);
                    }}
                >
                    + {t('Check-In Guest')}
                </button>
            </div>

            {/* ACTIVE STAYS LIST */}
            <div className="premium-card">
                <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center bg-green-50/30">
                    <h2 className="text-lg font-bold text-text-dark">{t('In-House Now')}</h2>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {t('In-House')}
                    </span>
                </div>
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">{t('Loading...')}</div>
                ) : activeStays.length === 0 ? (
                    <div className="text-center py-20 text-text-slate italic">{t('No reservations found')}</div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="management-table" style={{ minWidth: '900px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Guest')}</th>
                                    <th>{t('Room')}</th>
                                    <th>{t('Check-in')}</th>
                                    <th>{t('Check-out')}</th>
                                    <th>{t('Occupancy (Adults / Kids)')}</th>
                                    <th>{t('Status')}</th>
                                    {isAdmin && <th>{t('Audit')}</th>}
                                    <th>{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedStays.map(stay => (
                                    <tr key={stay.id}>
                                        <td><span className="font-bold text-text-dark">{getGuestName(stay.guestId)}</span></td>
                                        <td><span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold">{t('Room')} {stay.roomId}</span></td>
                                        <td className="text-xs">{formatDate(stay.dateIn)}</td>
                                        <td className="text-xs">{formatDate(stay.dateOut)}</td>
                                        <td className="text-xs">{stay.adults} {t('Adults')}, {stay.children || 0} {t('Children')}</td>
                                        <td>
                                            <span className={`status-badge ${stay.status === 'OVERSTAY' ? 'status-cancelled' : 'status-booked'}`}>
                                                {stay.status}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-text-slate font-medium">{t('Created')}: <span className="font-bold text-text-dark">{stay.createdBy || '-'}</span></span>
                                                    <span className="text-[10px] text-text-slate font-medium">{t('Modified')}: <span className="font-bold text-text-dark">{stay.modifiedBy || '-'}</span></span>
                                                </div>
                                            </td>
                                        )}
                                        <td>
                                            <button 
                                                className="btn-secondary !py-1 !px-3 text-[10px] !bg-slate-50 !text-slate-500 !border-slate-200 hover:!bg-slate-100"
                                                onClick={() => handleVoidStay(stay.id)}
                                            >
                                                {t('Void')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!loading && activeStays.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <Pagination 
                            currentPage={currentPageStays}
                            totalPages={totalPagesStays}
                            onPageChange={setCurrentPageStays}
                            totalItems={activeStays.length}
                            pageSize={PAGE_SIZE}
                        />
                    </div>
                )}
            </div>

            {/* RESERVATIONS LIST */}
            <div className="premium-card mt-12">
                <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center">
                    <h2 className="text-lg font-bold text-text-dark">{t('Pending Arrivals')}</h2>
                    <span className="bg-maroon/10 text-maroon text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {t('Reservations')}
                    </span>
                </div>
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">{t('Loading...')}</div>
                ) : reservations.length === 0 ? (
                    <div className="text-center py-20 text-text-slate italic">{t('No reservations pending check-in.')}</div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="management-table" style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Guest')}</th>
                                    <th>{t('Room Category')}</th>
                                    <th>{t('Check-in')}</th>
                                    <th>{t('Check-out')}</th>
                                    <th>{t('Occupancy (Adults / Kids)')}</th>
                                    {isAdmin && <th>{t('Audit')}</th>}
                                    <th>{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRes.map(res => (
                                    <tr key={res.id}>
                                        <td><span className="font-bold text-text-dark">{getGuestName(res.guestId)}</span></td>
                                        <td>{getRoomTypeName(res.roomTypeId)}</td>
                                        <td>{formatDate(res.dateIn)}</td>
                                        <td>{formatDate(res.dateOut)}</td>
                                        <td>{res.adults} {t('Adults')}, {res.children || 0} {t('Children')}</td>
                                        {isAdmin && (
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-text-slate font-medium">{t('Created')}: <span className="font-bold text-text-dark">{res.createdBy || '-'}</span></span>
                                                    <span className="text-[10px] text-text-slate font-medium">{t('Modified')}: <span className="font-bold text-text-dark">{res.modifiedBy || '-'}</span></span>
                                                </div>
                                            </td>
                                        )}
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn-secondary !py-1 !px-3 flex items-center gap-1.5" onClick={() => handleOpenPaymentModal(res)}>
                                                    <Wallet size={12} /> {t('Payment')}
                                                </button>
                                                <button className="view-btn" onClick={() => handleOpenResModal(res)}>
                                                    {t('Check In')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!loading && reservations.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <Pagination 
                            currentPage={currentPageRes}
                            totalPages={totalPagesRes}
                            onPageChange={setCurrentPageRes}
                            totalItems={reservations.length}
                            pageSize={PAGE_SIZE}
                        />
                    </div>
                )}
            </div>

            {/* GUEST CHECK-IN MODAL */}
            <Modal
                isOpen={showDirectCheckInModal}
                onClose={() => setShowDirectCheckInModal(false)}
                title={t('Guest Check-In')}
                size="md"
            >
                        
                        {directCheckInSuccess && (
                            <div className="m-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium animate-pulse">{directCheckInSuccess}</div>
                        )}
                        {directCheckInError && (
                            <div className="m-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{directCheckInError}</div>
                        )}

                        <form onSubmit={handleDirectCheckIn} className="p-6">
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>{t('Select Guest')}</label>
                                    <select
                                        required
                                        value={directCheckInData.guestId}
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, guestId: e.target.value })}
                                    >
                                        <option value="">{t('-- Search for a Guest --')}</option>
                                        {guests.map(g => (
                                            <option key={g.id} value={g.id}>{g.fullName} {g.email ? `(${g.email})` : ''}</option>
                                        ))}
                                    </select>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-text-slate italic">{t('Not in the list?')}</span>
                                        <button
                                            type="button"
                                            className="text-maroon hover:underline text-[11px] font-bold"
                                            onClick={() => setShowQuickGuestModal(true)}
                                        >
                                            + {t('REGISTER NEW GUEST')}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>{t('Assign Room')}</label>
                                    <select
                                        required
                                        value={directCheckInData.roomId}
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, roomId: e.target.value })}
                                    >
                                        <option value="">{t('-- Choose Room --')}</option>
                                        {availableDirectCheckInRooms.map(room => (
                                            <option key={room.id} value={room.id}>
                                                {t('Room')} {room.roomNumber} — {t('Floor')} {room.floor} {room.roomType?.name ? `(${room.roomType.name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>{t('Adults')}</label>
                                    <input
                                        type="number" min="1" required
                                        value={directCheckInData.adults}
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, adults: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{t('Children')}</label>
                                    <input
                                        type="number" min="0" required
                                        value={directCheckInData.children}
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, children: e.target.value })}
                                    />
                                </div>
                                
                                <div className="form-group full-width">
                                    <label>{t('Expected Checkout Date')}</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={directCheckInData.dateOut}
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, dateOut: e.target.value })}
                                    />
                                    <p className="text-[10px] text-text-slate mt-1 italic leading-tight">
                                        {t('The total room charge will be calculated and posted to the folio automatically based on this date.')}
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label>{t('Arriving From')}</label>
                                    <input type="text" value={directCheckInData.arrivingFrom} onChange={e => setDirectCheckInData({ ...directCheckInData, arrivingFrom: e.target.value })} placeholder={t('City or Country')} />
                                </div>
                                <div className="form-group">
                                    <label>{t('Next Destination')}</label>
                                    <input type="text" value={directCheckInData.nextDestination} onChange={e => setDirectCheckInData({ ...directCheckInData, nextDestination: e.target.value })} placeholder={t('Target Destination')} />
                                </div>
                                <div className="form-group">
                                    <label>{t('Arrival Flight #')}</label>
                                    <input type="text" value={directCheckInData.arrivalFlightNo} onChange={e => setDirectCheckInData({ ...directCheckInData, arrivalFlightNo: e.target.value })} placeholder="e.g. KQ101" />
                                </div>
                                <div className="form-group">
                                    <label>{t('Departure Flight #')}</label>
                                    <input type="text" value={directCheckInData.departureFlightNo} onChange={e => setDirectCheckInData({ ...directCheckInData, departureFlightNo: e.target.value })} placeholder="e.g. KQ102" />
                                </div>
                                <div className="form-group full-width">
                                    <label>{t('Stay Notes')}</label>
                                    <textarea 
                                        className="w-full min-h-[60px]" 
                                        value={directCheckInData.notes} 
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, notes: e.target.value })} 
                                        placeholder={t('Special requests, billing instructions, etc.')}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer !px-0 mt-8">
                                <button type="button" onClick={() => setShowDirectCheckInModal(false)} className="btn-secondary !px-10">{t('Cancel')}</button>
                                <button type="submit" className="btn-primary !px-10" disabled={directCheckInLoading}>
                                    {directCheckInLoading ? t('Loading...') : t('Confirm Check-In')}
                                </button>
                            </div>
                        </form>
            </Modal>

            {/* Reservation Check-in Room Selection Modal */}
            <Modal
                isOpen={showReservationModal && !!selectedReservation}
                onClose={() => setShowReservationModal(false)}
                title={t('Room Assignment')}
                size="md"
                customClasses="!w-[80%] !max-w-[700px]"
            >
                {selectedReservation && (
                    <form onSubmit={handleResCheckIn}>
                                <div className="bg-slate-50 p-5 rounded-xl border border-border-gray mb-6 flex flex-col gap-2">
                                    <p className="text-text-dark"><strong>{t('Guest')}:</strong> {getGuestName(selectedReservation.guestId)}</p>
                                    <p className="text-text-dark"><strong>{t('Category')}:</strong> {getRoomTypeName(selectedReservation.roomTypeId)}</p>
                                    <p className="text-text-dark"><strong>{t('Dates')}:</strong> {formatDate(selectedReservation.dateIn)} → {formatDate(selectedReservation.dateOut)}</p>
                                </div>
                                <div className="form-group full-width">
                                    <label>{t('Available Rooms')}</label>
                                    {availableRooms.length === 0 ? (
                                        <p className="text-red-500 text-sm font-medium mt-1">{t('No available rooms match this category.')}</p>
                                    ) : (
                                        <select
                                            required
                                            value={resCheckInRoomId}
                                            onChange={e => setResCheckInRoomId(e.target.value)}
                                        >
                                            <option value="">{t('-- Select Room Number --')}</option>
                                            {availableRooms.map(room => (
                                                <option key={room.id} value={room.id}>{t('Room')} {room.roomNumber} — {t('Floor')} {room.floor}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowReservationModal(false)} className="btn-secondary">{t('Cancel')}</button>
                                    <button type="submit" className="btn-primary" disabled={!resCheckInRoomId || availableRooms.length === 0 || resCheckInLoading}>
                                        {resCheckInLoading ? t('Loading...') : t('Confirm Check-In')}
                                    </button>
                                </div>
                        </form>
                )}
            </Modal>
            {/* Quick Guest Registration Modal */}
            <Modal
                isOpen={showQuickGuestModal}
                onClose={() => setShowQuickGuestModal(false)}
                title={t('Quick Register Guest')}
                size="md"
                customClasses="!w-[90%] !max-w-[800px]"
                overlayClasses="z-[2000]"
            >
                <GuestForm 
                            isQuickMode={true}
                            onSuccess={handleQuickGuestSuccess} 
                    onCancel={() => setShowQuickGuestModal(false)} 
                />
            </Modal>
            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                size="none"
                customClasses="!max-w-[750px] !p-0 overflow-hidden"
                overlayClasses="z-[1100]"
            >
                <div className="modal-header !p-6 border-b border-slate-100">
                    <h2 className="flex items-center gap-3 text-xl font-bold text-slate-800 m-0">
                        <div className="bg-maroon/10 p-2 rounded-lg">
                            <Wallet className="text-maroon" size={20} />
                        </div>
                        {t('Record Arrival Payment')}
                    </h2>
                    <button className="close-modal-btn !top-6 !right-6" onClick={() => setShowPaymentModal(false)}>&times;</button>
                </div>
                        
                        <div className="p-8">
                            {/* Summary Card */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('Guest')}</p>
                                    <p className="text-xl font-black text-slate-900 leading-tight">{getGuestName(selectedReservation?.guestId)}</p>
                                    <p className="text-xs text-slate-500 font-medium">{t('Folio')} #{activeFolio?.id.toString().padStart(5, '0')}</p>
                                </div>
                                <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 text-right shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('Current Balance')}</span>
                                    <span className="text-2xl font-black text-maroon">$ {parseFloat(activeFolio?.totalAmount || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <form onSubmit={handleRecordPayment} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block text-left">{t('Amount to Pay ($)')}</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                            <input 
                                                type="number" step="0.01" required autoFocus
                                                className="w-full !pl-8 !py-3 !rounded-xl !border-slate-200 !text-lg font-black text-slate-900"
                                                value={paymentData.amount} 
                                                onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group text-left">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('Payment Method')}</label>
                                        <select 
                                            required 
                                            className="w-full !py-3 !px-4 !rounded-xl !border-slate-200 font-bold text-slate-700 h-[50px] bg-slate-50"
                                            value={paymentData.paymentMethodId} 
                                            onChange={e => setPaymentData({...paymentData, paymentMethodId: e.target.value})}
                                        >
                                            {paymentMethods.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group text-left">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('Reference Code')}</label>
                                        <input 
                                            type="text" 
                                            className="w-full !py-3 !px-4 !rounded-xl !border-slate-200 font-semibold"
                                            value={paymentData.referenceNumber} 
                                            onChange={e => setPaymentData({...paymentData, referenceNumber: e.target.value})} 
                                            placeholder={t('Receipt / TXN ID')} 
                                        />
                                    </div>
                                    <div className="form-group text-left">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('Internal Notes')}</label>
                                        <input 
                                            type="text" 
                                            className="w-full !py-3 !px-4 !rounded-xl !border-slate-200 font-semibold"
                                            value={paymentData.notes} 
                                            onChange={e => setPaymentData({...paymentData, notes: e.target.value})} 
                                            placeholder={t('Optional comments...')} 
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPaymentModal(false)} 
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-xl transition-all"
                                    >
                                        {t('Cancel')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-[2] bg-maroon hover:bg-[#6b0f11] text-white font-black text-lg py-4 rounded-xl shadow-lg shadow-maroon/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Wallet size={18} /> {t('Confirm Payment')}
                                    </button>
                                </div>
                            </form>
                        </div>
            </Modal>
        </div>
    );
};

export default CheckIn;
