import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, CreditCard } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';

const PaymentMethods = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const { t } = useLanguage();
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        active: true
    });
    const [serverErrors, setServerErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMethods = async () => {
        try {
            const response = await api.get('/folios/payment-methods');
            setMethods(response.data);
        } catch (err) {
            console.error('Failed to fetch payment methods:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMethods();
    }, []);

    const handleOpenModal = (method = null) => {
        if (method) {
            setEditingMethod(method);
            setFormData({
                name: method.name,
                active: method.active ?? true
            });
        } else {
            setEditingMethod(null);
            setFormData({ 
                name: '', 
                active: true
            });
        }
        setServerErrors({});
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerErrors({});
        try {
            if (editingMethod) {
                await api.put(`/folios/payment-methods/${editingMethod.id}`, formData);
            } else {
                await api.post('/folios/payment-methods', formData);
            }
            setShowModal(false);
            fetchMethods();
        } catch (err) {
            console.error('Failed to save payment method:', err);
            if (err.response && (err.response.status === 400 || err.response.status === 409)) {
                setServerErrors(err.response.data);
            } else {
                alert('Failed to save payment method. Please try again.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this payment method?')) {
            try {
                await api.delete(`/folios/payment-methods/${id}`);
                fetchMethods();
            } catch (err) {
                console.error('Failed to delete payment method:', err);
                alert('Failed to delete payment method. It might be in use.');
            }
        }
    };

    const filteredMethods = methods.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredMethods.length / PAGE_SIZE);
    const paginatedMethods = filteredMethods.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search payment methods..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Payment Method</button>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                    {loading ? (
                        <div className="text-center py-20 text-text-slate animate-pulse font-medium">Syncing payment methods...</div>
                    ) : (
                        <table className="management-table" style={{ minWidth: '500px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Method Name')}</th>
                                    <th>{t('Status')}</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                        <tbody>
                            {paginatedMethods.length > 0 ? paginatedMethods.map((m) => (
                                <tr key={m.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-800">{m.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${(m.isActive ?? m.active) ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {(m.isActive ?? m.active) ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(m)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all" onClick={() => handleDelete(m.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-20 text-slate-400 italic">
                                        {searchTerm ? 'No methods match your search.' : 'No payment methods registered yet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {!loading && filteredMethods.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredMethods.length}
                    pageSize={PAGE_SIZE}
                />
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingMethod ? 'Edit Payment Method' : 'Register New Method'}
                size="sm"
                customClasses="!w-[85%] !max-w-[500px]"
            >
                {serverErrors.error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                        {serverErrors.error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6 p-7">
                                <div className="form-group">
                                    <label>{t('Method Name')}</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. M-Pesa, Cash, Bank Transfer"
                                    />
                                    {serverErrors.name && <p className="text-red-500 text-[10px] mt-1">{serverErrors.name}</p>}
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <input 
                                        type="checkbox" 
                                        id="activeStatus"
                                        checked={formData.active} 
                                        onChange={(e) => setFormData({...formData, active: e.target.checked})} 
                                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="activeStatus" className="mb-0 cursor-pointer font-bold text-slate-700">Method is Active (Visible at Checkout)</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Save Payment Method</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default PaymentMethods;
