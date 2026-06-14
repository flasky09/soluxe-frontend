import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';

const ChargeTypes = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const { t } = useLanguage();
    const [chargeTypes, setChargeTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        active: true
    });
    const [serverErrors, setServerErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const fetchChargeTypes = async () => {
        try {
            const response = await api.get('/charge-types');
            setChargeTypes(response.data);
        } catch (err) {
            console.error('Failed to fetch charge types:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChargeTypes();
    }, []);

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                active: type.active ?? true
            });
        } else {
            setEditingType(null);
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
            if (editingType) {
                await api.put(`/charge-types/${editingType.id}`, formData);
            } else {
                await api.post('/charge-types', formData);
            }
            setShowModal(false);
            fetchChargeTypes();
        } catch (err) {
            console.error('Failed to save charge type:', err);
            if (err.response && (err.response.status === 400 || err.response.status === 409)) {
                setServerErrors(err.response.data);
            } else {
                alert('Failed to save charge type. Please try again.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this charge type?')) {
            try {
                await api.delete(`/charge-types/${id}`);
                fetchChargeTypes();
            } catch (err) {
                console.error('Failed to delete charge type:', err);
                alert('Failed to delete charge type.');
            }
        }
    };

    const filteredTypes = chargeTypes.filter(type => 
        type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredTypes.length / PAGE_SIZE);
    const paginatedTypes = filteredTypes.slice(
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
                        placeholder="Search charge types by name..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Charge Type</button>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium">Loading charge types...</div>
                ) : (
                    <table className="management-table" style={{ minWidth: '400px' }}>
                        <thead>
                            <tr>
                                <th>{t('Name')}</th>
                                <th>{t('Status')}</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTypes.length > 0 ? paginatedTypes.map((type) => (
                                <tr key={type.id}>
                                    <td><span className="font-bold text-slate-800">{type.name}</span></td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${(type.isActive ?? type.active) ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {(type.isActive ?? type.active) ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(type)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all" onClick={() => handleDelete(type.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-20 text-slate-400 italic">
                                        {searchTerm ? 'No types match your search.' : 'No charge types defined yet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {!loading && filteredTypes.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredTypes.length}
                    pageSize={PAGE_SIZE}
                />
            )}

            <Modal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)} 
                title={editingType ? 'Edit Charge Type' : 'Add New Charge Type'}
                size="sm"
            >
                {serverErrors.error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                        {serverErrors.error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="form-grid p-6">
                        <div className="form-group full-width">
                            <label>{t('Type Name')}</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                placeholder="e.g. Laundry, Spa, Extra Bed"
                            />
                            {serverErrors.name && <p className="text-red-500 text-[10px] mt-1">{serverErrors.name}</p>}
                        </div>
                        <div className="form-group flex items-center gap-2 mt-4">
                            <input 
                                type="checkbox" 
                                id="activeStatus"
                                checked={formData.active} 
                                onChange={(e) => setFormData({...formData, active: e.target.checked})} 
                            />
                            <label htmlFor="activeStatus" className="m-0 cursor-pointer text-sm font-semibold text-slate-700">Set as Active</label>
                        </div>
                    </div>
                    <div className="modal-footer mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                        <button type="submit" className="btn-primary !px-10">Save Charge Type</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ChargeTypes;
