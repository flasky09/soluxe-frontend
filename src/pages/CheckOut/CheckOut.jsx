import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { FileText, CheckCircle, Plus } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';
import { formatDate } from '../../services/formatters';
import { useAlert } from '../../context/AlertContext';

const CheckOut = () => {
    const { user, hasRole } = useAuthStore();
    const isAdmin = hasRole('ROLE_HOTEL_ADMIN');
    const { t } = useLanguage();
    const { alert, confirm } = useAlert();
    const PAGE_SIZE = 20;
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Data state
    const [activeStays, setActiveStays] = useState([]);
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [chargeTypes, setChargeTypes] = useState([]);
    const [folio, setFolio] = useState(null);

    // Selected stay
    const [selectedStay, setSelectedStay] = useState(null);

    // Extension modal state
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [extensionDate, setExtensionDate] = useState('');
    const [extensionLoading, setExtensionLoading] = useState(false);

    // Post charge modal state
    const [showPostChargeModal, setShowPostChargeModal] = useState(false);
    const [newCharge, setNewCharge] = useState({
        chargeTypeId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
    });

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [staysRes, guestsRes, roomsRes, chargeTypesRes] = await Promise.all([
                api.get('/stays/active'),
                api.get('/guests'),
                api.get('/rooms'),
                api.get('/charge-types'),
            ]);
            setActiveStays(staysRes.data);
            setGuests(guestsRes.data);
            setRooms(roomsRes.data);
            setChargeTypes(chargeTypesRes.data);
            if (chargeTypesRes.data.length > 0) {
                setNewCharge(prev => ({ ...prev, chargeTypeId: chargeTypesRes.data[0].id }));
            }
        } catch (err) {
            console.error('Failed to load check-out data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const getGuestName = (id) => {
        const g = guests.find(g => g.id === id);
        return g ? g.fullName : `Guest #${id}`;
    };

    const getRoomNumber = (id) => {
        const r = rooms.find(r => r.id === id);
        return r ? r.roomNumber : id;
    };

    const handleCheckOut = async (stay, approveAdjustment = false) => {
        if (!approveAdjustment && !(await confirm(`Check out ${getGuestName(stay.guestId)} from Room ${getRoomNumber(stay.roomId)}?`, 'Confirm Checkout', 'question'))) return;
        try {
            await api.post(`/stays/${stay.id}/check-out?userId=${user?.id || 1}${approveAdjustment ? '&approveAdjustment=true' : ''}`);
            await alert('Check-out successful.', 'Success', 'success');
            fetchAllData();
        } catch (err) {
            console.error('Check-out failed:', err);
            const msg = err.response?.data?.message || '';
            if (msg.includes('Early check-out detected')) {
                if (await confirm(msg + '\n\nDo you want to apply this adjustment and proceed?', 'Early Checkout Warning', 'warning')) {
                    handleCheckOut(stay, true);
                    return;
                }
            } else {
                await alert(msg || 'Check-out failed.', 'Checkout Failed', 'error');
            }
        }
    };

    const handleOpenExtensionModal = async (stay) => {
        setSelectedStay(stay);
        setExtensionDate(stay.dateOut ? stay.dateOut.split('T')[0] : '');
        try {
            const folioRes = await api.get(`/folios/stay/${stay.id}`);
            setFolio(folioRes.data);
        } catch {
            setFolio(null);
        }
        setShowExtensionModal(true);
    };

    const handleExtendStay = async (e) => {
        e.preventDefault();
        if (!selectedStay) return;
        setExtensionLoading(true);
        try {
            await api.post(`/stays/${selectedStay.id}/extend?userId=${user?.id || 1}`, { newDateOut: extensionDate });
            setShowExtensionModal(false);
            await alert('Stay extended successfully.', 'Success', 'success');
            fetchAllData();
        } catch (err) {
            console.error('Extension failed:', err);
            await alert(err.response?.data?.message || 'Failed to extend stay.', 'Extension Failed', 'error');
        } finally {
            setExtensionLoading(false);
        }
    };

    const handleOpenPostChargeModal = async (stay) => {
        setSelectedStay(stay);
        try {
            const folioRes = await api.get(`/folios/stay/${stay.id}`);
            setFolio(folioRes.data);
        } catch {
            setFolio(null);
        }
        setShowPostChargeModal(true);
    };

    const handlePostCharge = async (e) => {
        e.preventDefault();
        if (!folio) return;
        try {
            const payload = {
                ...newCharge,
                chargeTypeId: parseInt(newCharge.chargeTypeId) > 0 ? parseInt(newCharge.chargeTypeId) : null,
                quantity: parseFloat(newCharge.quantity) || 0,
                unitPrice: parseFloat(newCharge.unitPrice) || 0,
            };
            await api.post(`/folios/${folio.id}/charges?userId=${user?.id || 1}`, payload);
            setShowPostChargeModal(false);
            await alert('Charge posted successfully.', 'Success', 'success');
            fetchAllData();
        } catch (err) {
            console.error('Failed to post charge:', err);
            await alert(err.response?.data?.message || 'Failed to post charge.', 'Error', 'error');
        }
    };

    const totalPages = Math.ceil(activeStays.length / PAGE_SIZE);
    const paginatedStays = activeStays.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className="flex flex-col">
            {/* Active Stays Table */}
            <div className="premium-card">
                <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center bg-red-50/30">
                    <h2 className="text-lg font-bold text-text-dark">{t('In-House Now')}</h2>
                    <span className="bg-maroon/10 text-maroon text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {t('Check-Out')}
                    </span>
                </div>
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">{t('Loading...')}</div>
                ) : activeStays.length === 0 ? (
                    <div className="text-center py-20 text-text-slate italic">{t('No active stays found.')}</div>
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
                                        <td><span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold">{t('Room')} {getRoomNumber(stay.roomId)}</span></td>
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
                                            <div className="table-actions">
                                                <button
                                                    className="btn-secondary !py-1 !px-3 text-[10px] flex items-center gap-1"
                                                    onClick={() => handleOpenPostChargeModal(stay)}
                                                >
                                                    <Plus size={11} /> {t('Charge')}
                                                </button>
                                                <button
                                                    className="btn-secondary !py-1 !px-3 text-[10px] flex items-center gap-1"
                                                    onClick={() => handleOpenExtensionModal(stay)}
                                                >
                                                    <FileText size={11} /> {t('Extend')}
                                                </button>
                                                <button
                                                    className="view-btn !bg-maroon !text-white !py-1 !px-3 text-[10px]"
                                                    onClick={() => handleCheckOut(stay)}
                                                >
                                                    {t('Check Out')}
                                                </button>
                                            </div>
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
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={activeStays.length}
                            pageSize={PAGE_SIZE}
                        />
                    </div>
                )}
            </div>

            {/* Extend Stay Modal */}
            <Modal
                isOpen={showExtensionModal && !!selectedStay}
                onClose={() => setShowExtensionModal(false)}
                title={<span className="flex items-center gap-2"><FileText className="text-maroon" /> {t('Extend Stay')}</span>}
                size="none"
                customClasses="!w-[90%] !max-w-[600px] !p-0 overflow-hidden"
            >
                {selectedStay && (
                    <>
                        <div className="modal-header !p-6 border-b border-slate-100">
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-800 m-0">
                                <div className="bg-maroon/10 p-2 rounded-lg">
                                    <FileText className="text-maroon" size={20} />
                                </div>
                                {t('Extend Stay')}
                            </h2>
                            <button className="close-modal-btn" onClick={() => setShowExtensionModal(false)}>&times;</button>
                        </div>
                        <div className="p-8">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 flex items-center justify-between shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-maroon/20 blur-[60px] rounded-full -mr-10 -mt-10"></div>
                                <div className="flex flex-col relative z-10">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Current Check-out</p>
                                    <p className="text-3xl font-black text-white leading-none">{formatDate(selectedStay.dateOut)}</p>
                                    <p className="text-[11px] text-white/60 font-medium mt-3">Room {getRoomNumber(selectedStay.roomId)} • {getGuestName(selectedStay.guestId)}</p>
                                </div>
                                <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center relative z-10">
                                    <FileText className="text-maroon-light" size={28} />
                                </div>
                            </div>

                            <form onSubmit={handleExtendStay} className="space-y-8">
                                <div className="form-group">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] mb-3 block">New Departure Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            required
                                            min={selectedStay.dateOut.split('T')[0]}
                                            className="w-full !py-4 !px-6 !rounded-2xl !border-slate-200 !text-lg font-black text-slate-900 focus:!border-maroon transition-all shadow-sm"
                                            value={extensionDate}
                                            onChange={e => setExtensionDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-start gap-3 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="w-5 h-5 bg-maroon/10 rounded-full flex items-center justify-center text-maroon shrink-0 mt-0.5">
                                            <span className="font-bold text-[10px]">i</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                                            Extending the stay will automatically post room charges for the added nights based on the current nightly rate.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowExtensionModal(false)}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] bg-maroon hover:bg-[#6b0f11] text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-maroon/20 transition-all flex items-center justify-center gap-2"
                                        disabled={extensionLoading}
                                    >
                                        {extensionLoading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Processing...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <CheckCircle size={20} /> Confirm Extension
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </Modal>
            {/* Post Charge Modal */}
            <Modal
                isOpen={showPostChargeModal}
                onClose={() => setShowPostChargeModal(false)}
                title={<span className="flex items-center gap-2"><Plus className="text-maroon" /> Post Charge to #{folio?.id?.toString().padStart(5, '0')}</span>}
                size="md"
                customClasses="!w-[85%] !max-w-[700px]"
            >
                <form onSubmit={handlePostCharge}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>{t('Charge Type')}</label>
                            <select required value={newCharge.chargeTypeId} onChange={(e) => setNewCharge({...newCharge, chargeTypeId: e.target.value})}>
                                <option value="">{t('Select Charge Type')}</option>
                                {chargeTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group full-width">
                            <label>{t('Description')}</label>
                            <input type="text" required value={newCharge.description} onChange={(e) => setNewCharge({...newCharge, description: e.target.value})} placeholder="e.g. Minibar, Restaurant" />
                        </div>
                        <div className="form-group">
                            <label>{t('Quantity')}</label>
                            <input type="number" step="0.01" required value={newCharge.quantity} onChange={(e) => setNewCharge({...newCharge, quantity: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="form-group">
                            <label>{t('Unit Price ($)')}</label>
                            <input type="number" step="0.01" required value={newCharge.unitPrice} onChange={(e) => setNewCharge({...newCharge, unitPrice: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>
                    <div className="modal-footer mt-6">
                        <button type="button" onClick={() => setShowPostChargeModal(false)} className="btn-secondary !px-8">{t('Cancel')}</button>
                        <button type="submit" className="btn-primary !px-8">{t('Submit Charge')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CheckOut;
