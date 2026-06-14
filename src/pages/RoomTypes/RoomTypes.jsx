import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';

const RoomTypes = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        defaultRate: '',
        capacity: 2,
        bedType: 'Queen'
    });

    const fetchRoomTypes = async () => {
        try {
            const response = await api.get('/room-types');
            setRoomTypes(response.data);
        } catch (err) {
            console.error('Failed to fetch room types:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomTypes();
    }, []);

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                defaultRate: type.defaultRate || '',
                capacity: type.capacity || 2,
                bedType: type.bedType || 'Queen'
            });
        } else {
            setEditingType(null);
            setFormData({ 
                name: '', 
                defaultRate: '',
                capacity: 2,
                bedType: 'Queen'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                defaultRate: parseFloat(formData.defaultRate) || 0,
                weekendRate: parseFloat(formData.defaultRate) || 0
            };
            if (editingType) {
                await api.put(`/room-types/${editingType.id}`, payload);
            } else {
                await api.post('/room-types', payload);
            }
            setShowModal(false);
            fetchRoomTypes();
        } catch (err) {
            console.error('Failed to save room type:', err);
            alert('Failed to save room type.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this room type?')) {
            try {
                await api.delete(`/room-types/${id}`);
                fetchRoomTypes();
            } catch (err) {
                console.error('Failed to delete room type:', err);
                alert('Failed to delete room type.');
            }
        }
    };

    const totalPages = Math.ceil(roomTypes.length / PAGE_SIZE);
    const paginatedTypes = roomTypes.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">{t('Room Types')}</h1>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>{t('Add Room Type')}</button>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                    {loading ? (
                        <div className="text-center py-20 text-text-slate animate-pulse font-medium">Loading room directory...</div>
                    ) : (
                        <table className="management-table" style={{ minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Name')}</th>
                                    <th>{t('Setup')}</th>
                                    <th>{t('Rate')}</th>
                                    <th className="text-right">{t('Actions')}</th>
                                </tr>
                            </thead>
                        <tbody>
                            {paginatedTypes.length > 0 ? paginatedTypes.map((type) => (
                                <tr key={type.id}>
                                    <td><span className="font-bold text-slate-800">{type.name}</span></td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{type.capacity} Pax</span>
                                            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{type.bedType}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="font-extrabold text-slate-900 tracking-tight">$ {parseFloat(type.defaultRate || 0).toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(type)}>{t('Edit')}</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all" onClick={() => handleDelete(type.id)}>{t('Delete')}</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-20 text-slate-400 italic font-medium">
                                        {t('No room types defined yet.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {!loading && roomTypes.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={roomTypes.length}
                    pageSize={PAGE_SIZE}
                />
            )}

            {showModal && (
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingType ? t('Edit Room Type') : t('Register New Type')}
                size="sm"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-grid !grid-cols-1">
                        <div className="form-group">
                            <label>{t('Room Category Name')}</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                placeholder="e.g. Executive Queen Suite"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Max Occupancy')}</label>
                            <input 
                                type="number" 
                                required 
                                min="1"
                                value={formData.capacity} 
                                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 1})} 
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Bed Configuration')}</label>
                            <select 
                                value={formData.bedType} 
                                onChange={(e) => setFormData({...formData, bedType: e.target.value})}
                            >
                                <option value="Single">Single Bed</option>
                                <option value="Double">Double Bed</option>
                                <option value="Twin">Twin Beds</option>
                                <option value="Queen">Queen Size</option>
                                <option value="King">King Size</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>{t('Room Rate ($ per Night)')}</label>
                            <input 
                                type="number" 
                                required 
                                value={formData.defaultRate} 
                                onChange={(e) => setFormData({...formData, defaultRate: e.target.value})} 
                                placeholder="0.00"
                                className="!text-lg !font-bold text-primary"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">{t('Cancel')}</button>
                        <button type="submit" className="btn-primary !px-10">{t('Save Settings')}</button>
                    </div>
                </form>

            </Modal>
            )}
        </div>
    );
};

export default RoomTypes;
