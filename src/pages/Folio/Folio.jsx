import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Search, Filter, Plus, FileText, CreditCard } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate, formatDateTime } from '../../services/formatters';

const Folio = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ROLE_HOTEL_ADMIN' || user?.role === 'HOTEL_ADMIN';
    const { t } = useLanguage();
    const [folios, setFolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showMethodModal, setShowMethodModal] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedFolioId, setSelectedFolioId] = useState(null);
    const [receipts, setReceipts] = useState([]);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showChargeTypeModal, setShowChargeTypeModal] = useState(false);
    const [newChargeType, setNewChargeType] = useState({ name: '', description: '', active: true });
    
    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currencies, setCurrencies] = useState([]);

    const [newMethod, setNewMethod] = useState({ name: '', description: '' });
    const [chargeTypes, setChargeTypes] = useState([]);
    const [newCharge, setNewCharge] = useState({
        chargeTypeId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxPct: 0,
        discountPct: 0
    });
    const [newPayment, setNewPayment] = useState({
        paymentMethodId: '',
        amount: 0,
        currencyCode: 'USD',
        exchangeRate: 1,
        referenceNumber: ''
    });

    useEffect(() => {
        // No pagination reset needed
    }, [searchQuery, statusFilter]);

    const handleOpenChargeModal = (id) => {
        setSelectedFolioId(id);
        setShowModal(true);
    };

    const handlePostCharge = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newCharge,
                chargeTypeId: parseInt(newCharge.chargeTypeId) > 0 ? parseInt(newCharge.chargeTypeId) : null,
                quantity: parseFloat(newCharge.quantity) || 0,
                unitPrice: parseFloat(newCharge.unitPrice) || 0,
                taxPct: parseFloat(newCharge.taxPct) || 0,
                discountPct: parseFloat(newCharge.discountPct) || 0
            };
            await api.post(`/folios/${selectedFolioId}/charges?userId=${user?.id || 1}`, payload);
            setShowModal(false);
            const response = await api.get('/folios');
            setFolios(response.data);
            setNewCharge({ chargeTypeId: chargeTypes[0]?.id || '', description: '', quantity: 1, unitPrice: 0, taxPct: 0, discountPct: 0 });
        } catch (err) {
            console.error('Failed to post charge', err);
            const msg = err.response?.data?.message || 'Failed to post charge.';
            alert(msg);
        }
    };

    const handleOpenPaymentModal = (id, balance) => {
        setSelectedFolioId(id);
        setNewPayment({ ...newPayment, amount: balance });
        setShowPaymentModal(true);
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newPayment,
                amount: parseFloat(newPayment.amount) || 0,
                paymentMethodId: parseInt(newPayment.paymentMethodId)
            };
            await api.post(`/folios/${selectedFolioId}/payments?userId=${user?.id || 1}`, payload);
            setShowPaymentModal(false);
            
            // Fetch receipts for this folio to show the new one
            const receiptsRes = await api.get(`/folios/receipts/folio/${selectedFolioId}`);
            setReceipts(receiptsRes.data);
            setShowReceiptModal(true);

            const response = await api.get('/folios');
            setFolios(response.data);
            setNewPayment({ paymentMethodId: '', amount: 0, referenceNumber: '' });
        } catch (err) {
            console.error('Failed to record payment', err);
            const msg = err.response?.data?.message || 'Failed to record payment.';
            alert(msg);
        }
    };

    const handleViewReceipts = async (folioId) => {
        try {
            const response = await api.get(`/folios/receipts/folio/${folioId}`);
            setReceipts(response.data);
            setSelectedFolioId(folioId);
            setShowReceiptModal(true);
        } catch (err) {
            console.error('Failed to fetch receipts', err);
            alert('Failed to fetch receipts.');
        }
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleCloseFolio = async (id) => {
        if (!window.confirm('Are you sure you want to close this folio? It cannot be reopened.')) return;
        try {
            await api.post(`/folios/${id}/close?userId=${user?.id || 1}`);
            const response = await api.get('/folios');
            setFolios(response.data);
        } catch (err) {
            console.error('Failed to close folio', err);
            alert('Failed to close folio. Ensure balance is zero.');
        }
    };

    const handleCreatePaymentMethod = async (e) => {
        e.preventDefault();
        try {
            await api.post('/folios/payment-methods', newMethod);
            const response = await api.get('/folios/payment-methods');
            setPaymentMethods(response.data);
            setNewMethod({ name: '', description: '' });
            setShowMethodModal(false);
        } catch (err) {
            console.error('Failed to create payment method', err);
            alert('Failed to create payment method.');
        }
    };

    const handleCreateChargeType = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/charge-types', newChargeType);
            const response = await api.get('/charge-types');
            setChargeTypes(response.data);
            setNewCharge(prev => ({ ...prev, chargeTypeId: res.data.id }));
            setNewChargeType({ name: '', description: '', active: true });
            setShowChargeTypeModal(false);
        } catch (err) {
            console.error('Failed to create charge type', err);
            alert('Failed to create charge type.');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [foliosRes, methodsRes, chargeTypesRes, currenciesRes] = await Promise.all([
                    api.get('/folios'),
                    api.get('/folios/payment-methods'),
                    api.get('/charge-types'),
                    api.get('/currencies/active')
                ]);
                setFolios(foliosRes.data);
                setPaymentMethods(methodsRes.data);
                setChargeTypes(chargeTypesRes.data);
                setCurrencies(currenciesRes.data);
                if (chargeTypesRes.data.length > 0) {
                    setNewCharge(prev => ({ ...prev, chargeTypeId: chargeTypesRes.data[0].id }));
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <h1 className="text-xl font-bold text-slate-800">{t('Folio & Billing')}</h1>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-2" onClick={() => navigate('/charge-types')}>
                        <Plus size={14} /> {t('Charge Types')}
                    </button>
                    <button className="flex-1 sm:flex-none btn-secondary !py-1.5 !px-3 text-xs flex items-center justify-center gap-2 whitespace-nowrap" onClick={() => setShowMethodModal(true)}>
                        <CreditCard size={14} /> {t('Payment Methods')}
                    </button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="premium-card px-4 py-3 mb-5 flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-maroon transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('Search by Folio ID...')} 
                        className="w-full pl-11 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-maroon/10 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold whitespace-nowrap px-2">
                        <Filter size={16} /> {t('Status')}:
                    </div>
                    <select 
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-maroon/10 outline-none cursor-pointer hover:border-slate-300 transition-all w-full md:w-[160px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">{t('All Status')}</option>
                        <option value="OPEN">{t('Open')}</option>
                        <option value="CLOSED">{t('Completed')}</option>
                    </select>
                </div>
            </div>

            <div className="premium-card overflow-hidden">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse text-lg">{t('Loading...')}</div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="management-table" style={{ minWidth: '900px' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '100px' }}>{t('Folio #')}</th>
                                    <th>{t('Guest / Details')}</th>
                                    <th style={{ width: '100px' }}>{t('Type')}</th>
                                    <th style={{ width: '120px' }}>{t('Opened At')}</th>
                                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">{t('Amount')}</th>
                                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">{t('Status')}</th>
                                    {isAdmin && <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">{t('Audit')}</th>}
                                    <th className="px-4 py-3 font-bold text-slate-500 text-right uppercase tracking-wider">{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filteredFolios = folios
                                        .filter(f => {
                                            const guestMatch = f.guestName?.toLowerCase().includes(searchQuery.toLowerCase());
                                            const roomMatch = f.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase());
                                            const matchesSearch = f.id.toString().includes(searchQuery) || 
                                                                 f.folioType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                 guestMatch || roomMatch;
                                            const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
                                            return matchesSearch && matchesStatus;
                                        })
                                        .sort((a, b) => b.id - a.id); // Most recent on top
                                    
                                    if (filteredFolios.length > 0) {
                                        return filteredFolios.map((folio) => (
                                        <tr key={folio.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="font-bold text-slate-700">#{folio.id.toString().padStart(5, '0')}</td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{folio.guestName || 'Internal / Other'}</span>
                                                    {folio.roomNumber && (
                                                        <span className="text-[10px] text-slate-500 font-medium">Room {folio.roomNumber}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    folio.folioType === 'STAY' ? 'bg-slate-100 text-maroon' :
                                                    folio.folioType === 'RESERVATION' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {folio.folioType}
                                                </span>
                                            </td>
                                            <td>{formatDate(folio.openedAt)}</td>
                                            <td>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                                    folio.status === 'OPEN' ? 'bg-maroon/5 text-maroon' : 
                                                    folio.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                    {folio.status}
                                                </span>
                                            </td>
                                            <td className="font-bold text-maroon">$ {folio.totalAmount.toLocaleString()}</td>
                                            {isAdmin && (
                                                <td>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] text-text-slate font-medium">{t('Created')}: <span className="font-bold text-text-dark">{folio.createdBy || '-'}</span></span>
                                                        <span className="text-[10px] text-text-slate font-medium">{t('Modified')}: <span className="font-bold text-text-dark">{folio.modifiedBy || '-'}</span></span>
                                                    </div>
                                                </td>
                                            )}
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-black hover:bg-slate-50 text-[11px] font-bold transition-all flex items-center gap-1.5 border border-transparent hover:border-slate-200" 
                                                        onClick={() => handleOpenChargeModal(folio.id)}
                                                    >
                                                        {t('Post Charge')}
                                                    </button>
                                                    {folio.status === 'OPEN' && (
                                                        <button 
                                                            className="bg-maroon text-white hover:bg-maroon-dark px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all shadow-sm shadow-maroon/10" 
                                                            onClick={() => handleOpenPaymentModal(folio.id, folio.totalAmount)}
                                                        >
                                                            {t('Pay')}
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-black hover:bg-slate-50 text-[11px] font-bold transition-all flex items-center gap-1.5 border border-transparent hover:border-slate-200" 
                                                        onClick={() => handleViewReceipts(folio.id)}
                                                    >
                                                        {t('Receipts')}
                                                    </button>
                                                    {folio.status === 'OPEN' && folio.totalAmount <= 0 && (
                                                        <button 
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-bold text-[11px] transition-all shadow-sm shadow-emerald-500/10" 
                                                            onClick={() => handleCloseFolio(folio.id)}
                                                        >
                                                            {t('Settle')}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        ));
                                    } else {
                                        return (
                                            <tr>
                                                <td colSpan={isAdmin ? 8 : 7} className="text-center py-20 text-text-slate">{t('No active folios found.')}</td>
                                            </tr>
                                        );
                                    }
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Post Charge Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={<span className="flex items-center gap-2"><Plus className="text-maroon" /> Post Charge to #{selectedFolioId?.toString().padStart(5, '0')}</span>}
                size="md"
                customClasses="!w-[85%] !max-w-[700px]"
            >
                <form onSubmit={handlePostCharge}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>{t('Charge Type')}</label>
                                    <div className="flex gap-2">
                                        <select className="flex-1" value={newCharge.chargeTypeId} onChange={(e) => setNewCharge({...newCharge, chargeTypeId: e.target.value})}>
                                            {chargeTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                        <button 
                                            type="button"
                                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors"
                                            onClick={() => setShowChargeTypeModal(true)}
                                            title={t('Add')}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group full-width">
                                    <label>{t('Description')}</label>
                                    <input type="text" value={newCharge.description} onChange={(e) => setNewCharge({...newCharge, description: e.target.value})} placeholder="e.g. Dinner" />
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
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-8">{t('Cancel')}</button>
                                <button type="submit" className="btn-primary !px-8">{t('Submit Charge')}</button>
                            </div>
                        </form>
            </Modal>

            {/* Record Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title={<span className="flex items-center gap-2"><CreditCard className="text-maroon" /> Record Payment for #{selectedFolioId?.toString().padStart(5, '0')}</span>}
                size="md"
                customClasses="!w-[85%] !max-w-[600px]"
            >
                <form onSubmit={handleRecordPayment}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>{t('Payment Method')}</label>
                                    <div className="flex gap-2">
                                        <select className="flex-1" required value={newPayment.paymentMethodId} onChange={(e) => setNewPayment({...newPayment, paymentMethodId: e.target.value})}>
                                            <option value="">{t('Payment Method')}</option>
                                            {paymentMethods.map(method => (
                                                <option key={method.id} value={method.id}>{method.name}</option>
                                            ))}
                                        </select>
                                        <button 
                                            type="button"
                                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors"
                                            onClick={() => setShowMethodModal(true)}
                                            title={t('Add')}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('Amount')}</label>
                                    <div className="flex gap-2">
                                        <input type="number" step="0.01" required className="flex-1" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value) || 0})} />
                                        <select 
                                            className="w-[100px]" 
                                            value={newPayment.currencyCode} 
                                            onChange={(e) => {
                                                const code = e.target.value;
                                                const curr = currencies.find(c => c.code === code);
                                                setNewPayment({
                                                    ...newPayment, 
                                                    currencyCode: code,
                                                    exchangeRate: curr ? curr.exchangeRate : 1
                                                });
                                            }}
                                        >
                                            <option value="USD">USD</option>
                                            {currencies.filter(c => c.code !== 'USD').map(c => (
                                                <option key={c.id} value={c.code}>{c.code}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {newPayment.currencyCode !== 'USD' && (
                                        <p className="text-[10px] text-slate-500 mt-1 italic">
                                            {t('Covers approx.')} ${(newPayment.amount / (newPayment.exchangeRate || 1)).toFixed(2)} USD ({t('Rate')}: {newPayment.exchangeRate})
                                        </p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>{t('Reference')}</label>
                                    <input type="text" value={newPayment.referenceNumber} onChange={(e) => setNewPayment({...newPayment, referenceNumber: e.target.value})} placeholder={t('Optional comments...')} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary !px-8">{t('Cancel')}</button>
                                <button type="submit" className="btn-primary !px-8">{t('Record Payment')}</button>
                            </div>
                        </form>
            </Modal>

            {/* Manage Payment Methods Modal */}
            <Modal
                isOpen={showMethodModal}
                onClose={() => setShowMethodModal(false)}
                title={<span className="flex items-center gap-2"><CreditCard className="text-maroon" /> Manage Payment Methods</span>}
                size="md"
                customClasses="!w-[85%] !max-w-[700px]"
            >
                <div className="mb-8 max-h-[200px] overflow-y-auto border border-slate-200 p-5 rounded-xl bg-slate-50">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('Existing Methods')}</h4>
                            {paymentMethods.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {paymentMethods.map(m => (
                                        <div key={m.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                                            <span className="font-bold text-slate-700">{m.name}</span>
                                            <span className="text-[12px] text-slate-500">{m.description}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-4 text-slate-400 text-sm italic">{t('No payment methods defined yet.')}</p>
                            )}
                        </div>

                        <form onSubmit={handleCreatePaymentMethod} className="border-t border-slate-200 pt-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('Add New Method')}</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>{t('Method Name')}</label>
                                    <input type="text" required value={newMethod.name} onChange={(e) => setNewMethod({...newMethod, name: e.target.value})} placeholder="e.g. M-Pesa, Visa" />
                                </div>
                                <div className="form-group">
                                    <label>{t('Description')}</label>
                                    <input type="text" value={newMethod.description} onChange={(e) => setNewMethod({...newMethod, description: e.target.value})} placeholder={t('Optional comments...')} />
                                </div>
                            </div>
                            <div className="modal-footer mt-6">
                                <button type="button" onClick={() => setShowMethodModal(false)} className="btn-secondary !px-8">{t('Close')}</button>
                                <button type="submit" className="btn-primary !px-8">{t('Add Method')}</button>
                            </div>
                        </form>
            </Modal>

            {/* Receipts Modal */}
            <Modal
                isOpen={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                size="none"
                customClasses="!w-[95%] !max-w-[700px] print:!max-w-none print:shadow-none print:p-0"
            >
                <div className="modal-header print:hidden">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="text-maroon" /> Receipts for #{selectedFolioId?.toString().padStart(5, '0')}
                    </h2>
                    <button className="close-modal-btn" onClick={() => setShowReceiptModal(false)}>&times;</button>
                </div>

                <div className="flex flex-col gap-10 p-4 print:p-0">
                            {receipts.length > 0 ? (
                                receipts.map(receipt => (
                                    <div key={receipt.id} className="p-10 max-w-[600px] mx-auto w-full bg-white border border-dashed border-slate-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[radial-gradient(circle,theme(colors.slate.300)_1px,transparent_1px)] before:bg-[length:8px_4px] before:bg-repeat-x after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[radial-gradient(circle,theme(colors.slate.300)_1px,transparent_1px)] after:bg-[length:8px_4px] after:bg-repeat-x shadow-md print:shadow-none print:border-none print:mx-0 print:max-w-none">
                                        <div className="text-center border-b-2 border-slate-200 pb-6 mb-6">
                                            <h2 className="text-3xl font-extrabold tracking-[4px] text-maroon m-0">SOLUXE CLUB HOTEL</h2>
                                            <p className="uppercase text-[10px] text-slate-400 mt-1 font-bold tracking-widest">Official Payment Receipt</p>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between text-slate-700">
                                                <span className="text-[13px] font-medium uppercase text-slate-400">Receipt No:</span>
                                                <span className="font-bold">#{receipt.receiptNumber}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-700">
                                                <span className="text-[13px] font-medium uppercase text-slate-400">Date:</span>
                                                <span className="font-medium">{formatDateTime(receipt.issuedAt)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-700">
                                                <span className="text-[13px] font-medium uppercase text-slate-400">Folio ID:</span>
                                                <span className="font-medium">#{receipt.folioId.toString().padStart(5, '0')}</span>
                                            </div>
                                            <div className="py-5 border-t border-dashed border-slate-200 border-b-2 border-primary my-2 flex justify-between items-center bg-slate-50/30 px-2 rounded">
                                                <span className="text-lg font-bold text-slate-800">Amount Paid:</span>
                                                <span className="text-2xl font-extrabold text-emerald-600">$ {receipt.amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-center mt-8 pt-4">
                                            <p className="text-[15px] font-medium text-slate-600">Thank you for choosing Soluxe Club Hotel!</p>
                                            <div className="text-[10px] mt-4 opacity-70 font-mono text-slate-500 flex flex-col items-center">
                                                <p>{t('Auth Code:')} {receipt.paymentId}</p>
                                                <p>{t('Issued by:')} {receipt.issuedBy}</p>
                                            </div>
                                        </div>
                                        <div className="mt-10 print:hidden">
                                            <button className="w-full btn-primary py-3 rounded-xl shadow-sm font-bold text-base" onClick={handlePrintReceipt}>{t('Print Official Receipt')}</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-text-slate border-2 border-dashed border-slate-200 rounded-xl">
                                    <p>{t('No receipts found for this folio.')}</p>
                                </div>
                            )}
                </div>
            </Modal>
            {/* Manage Charge Types Modal */}
            <Modal
                isOpen={showChargeTypeModal}
                onClose={() => setShowChargeTypeModal(false)}
                title={<span className="flex items-center gap-2"><Plus className="text-maroon" /> Manage Charge Types</span>}
                size="md"
                customClasses="!w-[85%] !max-w-[700px]"
                overlayClasses="z-[1100]"
            >
                <div className="mb-8 max-h-[200px] overflow-y-auto border border-slate-200 p-5 rounded-xl bg-slate-50">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Existing Types</h4>
                            {chargeTypes.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {chargeTypes.map(t => (
                                        <div key={t.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                                            <span className="font-bold text-slate-700">{t.name}</span>
                                            <span className="text-[12px] text-slate-500">{t.description}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-4 text-slate-400 text-sm italic">No charge types defined yet.</p>
                            )}
                        </div>

                        <form onSubmit={handleCreateChargeType} className="border-t border-slate-200 pt-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Add New Type</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Type Name</label>
                                    <input type="text" required value={newChargeType.name} onChange={(e) => setNewChargeType({...newChargeType, name: e.target.value})} placeholder="e.g. Laundry, Mini-bar" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input type="text" value={newChargeType.description} onChange={(e) => setNewChargeType({...newChargeType, description: e.target.value})} placeholder="Optional" />
                                </div>
                            </div>
                            <div className="modal-footer mt-6">
                                <button type="button" onClick={() => setShowChargeTypeModal(false)} className="btn-secondary !px-8">Close</button>
                                <button type="submit" className="btn-primary !px-8">Add Type</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default Folio;
