import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Search } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import GuestForm from '../../components/GuestForm/GuestForm';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../services/formatters';

const Guests = () => {
    const { t } = useLanguage();
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGuest, setEditingGuest] = useState(null);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'history'
    const [stayHistory, setStayHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const refreshData = async () => {
        try {
            const res = await api.get('/guests');
            setGuests(res.data);
            setEditingGuest(null);
        } catch (err) {
            console.error('Failed to fetch guests:', err);
            alert('Failed to load guest data.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleVoidGuest = async (id) => {
        if (!window.confirm('Are you sure you want to VOID this guest? This will hide the guest from the list but keep the record in the database.')) return;
        try {
            await api.post(`/guests/${id}/void`);
            refreshData();
        } catch (err) {
            console.error('Failed to void guest:', err);
            alert(err.response?.data?.message || 'Failed to void guest.');
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleOpenModal = (guest = null) => {
        setEditingGuest(guest);
        setActiveTab('profile');
        setStayHistory([]);
        setShowModal(true);
    };

    const fetchStayHistory = async (guestId) => {
        setHistoryLoading(true);
        try {
            const res = await api.get(`/stays/guest/${guestId}`);
            setStayHistory(res.data);
        } catch (err) {
            console.error('Failed to fetch stay history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredGuests = guests
        .filter(g => 
            g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.idNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => b.id - a.id); // Most recent on top

    useEffect(() => {
        // No pagination reset needed
    }, [searchTerm]);

    // Removed pagination slicing

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder={t('Search guests by name, phone, email or ID...')} 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button className="btn-primary" onClick={() => handleOpenModal()}>{t('Register Guest')}</button>
                </div>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                    {loading ? (
                        <div className="text-center py-20 text-text-slate animate-pulse">{t('Loading guests...')}</div>
                    ) : (
                        <table className="management-table" style={{ minWidth: '900px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Guest')}</th>
                                    <th>{t('Contact')}</th>
                                    <th>{t('ID Info')}</th>
                                    <th>{t('Audit')}</th>
                                    <th className="text-right">{t('Actions')}</th>
                                </tr>
                            </thead>
                        <tbody>
                            {filteredGuests.length > 0 ? filteredGuests.map((guest) => (
                                <tr key={guest.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                                                {guest.imageUrl ? (
                                                    <img src={guest.imageUrl} alt={guest.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                                        {guest.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-text-dark">{guest.fullName || '-'}</span>
                                                {guest.companyName && <span className="text-[12px] text-primary font-medium">{guest.companyName}</span>}
                                                <span className="text-[12px] text-text-slate font-medium uppercase tracking-tight">
                                                    {guest.gender || '-'} • {guest.dateOfBirth ? formatDate(guest.dateOfBirth) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium text-text-dark">{guest.phone || '-'}</span>
                                            <span className="text-[12px] text-text-slate italic">{guest.email || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="inline-block px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase w-fit leading-none">
                                                {guest.idType ? guest.idType.replace('_', ' ') : '-'}
                                            </span>
                                            <span className="text-xs font-mono text-text-dark tracking-wider">{guest.idNumber || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-text-dark font-medium">{guest.nationality || '-'}</span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-text-slate font-medium">Created by: <span className="font-bold text-text-dark">{guest.createdByName || guest.createdBy || '-'}</span></span>
                                            <span className="text-[10px] text-text-slate font-medium">Modified by: <span className="font-bold text-text-dark">{guest.modifiedByName || guest.modifiedBy || '-'}</span></span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <a 
                                                href={`/check-in?guestId=${guest.id}`} 
                                                className="btn-secondary !py-1 !px-3 text-xs"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.location.href = `/check-in?guestId=${guest.id}`;
                                                }}
                                            >
                                                {t('Check In')}
                                            </a>
                                            <button className="view-btn" onClick={() => handleOpenModal(guest)}>{t('Edit')}</button>
                                            <button 
                                                className="btn-secondary !py-1 !px-3 text-xs !bg-slate-50 !text-slate-500 !border-slate-100 hover:!bg-slate-100" 
                                                onClick={() => handleVoidGuest(guest.id)}
                                            >
                                                {t('Void')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-slate-400 font-medium italic">
                                        No guests found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingGuest ? t('Guest Profile') : t('Register New Guest')}
                size="lg"
                customClasses="!max-w-[1000px] !p-0"
            >
                <div className="flex border-b border-border-gray px-6">
                    <button 
                        className={`px-6 py-3 font-bold text-sm transition-all ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-text-slate hover:text-primary'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        {t('Profile Details')}
                    </button>
                    {editingGuest && (
                        <button 
                            className={`px-6 py-3 font-bold text-sm transition-all ${activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-text-slate hover:text-primary'}`}
                            onClick={() => {
                                setActiveTab('history');
                                if (stayHistory.length === 0) fetchStayHistory(editingGuest.id);
                            }}
                        >
                            {t('Stay History')}
                        </button>
                    )}
                </div>

                {activeTab === 'profile' ? (
                    <GuestForm 
                        initialData={editingGuest} 
                        onSuccess={() => {
                            setShowModal(false);
                            refreshData();
                        }}
                        onCancel={() => setShowModal(false)}
                    />
                ) : (
                    <div className="p-6 overflow-y-auto max-h-[80vh]">
                        {historyLoading ? (
                            <div className="text-center py-10 animate-pulse text-text-slate">{t('Loading history...')}</div>
                        ) : stayHistory.length > 0 ? (
                        <div className="overflow-x-auto w-full">
                            <table className="management-table" style={{ minWidth: '600px' }}>
                                <thead>
                                    <tr>
                                        <th>{t('Room')}</th>
                                        <th>{t('Dates')}</th>
                                        <th>{t('Duration')}</th>
                                        <th>{t('Status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stayHistory.map(stay => (
                                        <tr key={stay.id}>
                                            <td><span className="font-bold text-text-dark">{t('Room')} {stay.roomId}</span></td>
                                            <td className="text-xs">
                                                {formatDate(stay.dateIn)} — {stay.actualDateOut ? formatDate(stay.actualDateOut) : (stay.dateOut ? formatDate(stay.dateOut) : 'Active')}
                                            </td>
                                            <td className="text-xs font-medium">
                                                {Math.ceil((new Date(stay.actualDateOut || stay.dateOut || new Date()) - new Date(stay.dateIn)) / (1000 * 60 * 60 * 24))} Night(s)
                                            </td>
                                            <td>
                                                <span className={`status-badge ${stay.status === 'ACTIVE' ? 'status-booked' : stay.status === 'OVERSTAY' ? 'status-cancelled' : 'status-completed'}`}>
                                                    {stay.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        ) : (
                            <div className="text-center py-20 text-text-slate italic">{t('No past stays recorded for this guest.')}</div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
        
export default Guests;
