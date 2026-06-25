import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';
import { LayoutGrid, List as ListIcon, History, Search, Plus, Settings, CalendarDays, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useAlert } from '../../context/AlertContext';

const Rooms = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { alert, confirm } = useAlert();
    const { hasRole } = useAuthStore();
    const isAdminOrManager = hasRole('ROLE_HOTEL_ADMIN') || hasRole('ROLE_MANAGER');
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dashStats, setDashStats] = useState({
        occupancyRate: 0,
        activeStays: 0,
        totalArrivalsToday: 0,
        totalDeparturesToday: 0,
        cleanRooms: 0,
    });
    
    const [showModal, setShowModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({
        roomNumber: '',
        floor: '',
        roomTypeId: '',
        status: 'AVAILABLE'
    });

    const [typeFormData, setTypeFormData] = useState({
        name: '',
        description: '',
        basePrice: ''
    });

    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [roomsRes, typesRes, dashRes] = await Promise.all([
                api.get('/rooms'),
                api.get('/room-types'),
                api.get('/dashboard/summary').catch(() => ({ data: {} }))
            ]);
            setRooms(roomsRes.data);
            setRoomTypes(typesRes.data);
            if (dashRes.data) {
                setDashStats(prev => ({ ...prev, ...dashRes.data }));
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredRooms = rooms.filter(room => {
        const roomNum = room.roomNumber.toLowerCase();
        const typeName = (room.roomType?.name || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return roomNum.includes(search) || typeName.includes(search);
    });

    const fetchRoomTypes = async () => {
        try {
            const res = await api.get('/room-types');
            setRoomTypes(res.data);
        } catch (err) {
            console.error('Failed to fetch room types:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateType = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...typeFormData,
                basePrice: parseFloat(typeFormData.basePrice) || 0
            };
            await api.post('/room-types', payload);
            setShowTypeModal(false);
            setTypeFormData({ name: '', description: '', basePrice: '' });
            fetchRoomTypes();
        } catch (err) {
            console.error('Failed to create room type', err);
            await alert('Failed to create room type.', 'Error', 'error');
        }
    };

    const handleOpenModal = (room = null) => {
        if (room) {
            setEditingRoom(room);
            setFormData({
                roomNumber: room.roomNumber,
                floor: room.floor,
                roomTypeId: room.roomType?.id || '',
                status: room.status
            });
        } else {
            setEditingRoom(null);
            setFormData({ roomNumber: '', floor: '', roomTypeId: '', status: 'AVAILABLE' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                roomNumber: formData.roomNumber,
                floor: formData.floor,
                roomTypeId: parseInt(formData.roomTypeId) || 0,
                status: formData.status
            };

            if (editingRoom) {
                await api.put(`/rooms/${editingRoom.id}`, payload);
            } else {
                await api.post('/rooms', payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save room:', err);
            await alert('Failed to save room.', 'Error', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (await confirm('Are you sure you want to delete this room?', 'Delete Room', 'warning')) {
            try {
                await api.delete(`/rooms/${id}`);
                setShowModal(false);
                fetchData();
            } catch (err) {
                console.error('Failed to delete room:', err);
                await alert('Failed to delete room.', 'Error', 'error');
            }
        }
    };

    const getStatusClass = (status) => {
        if (!status) return 'unknown';
        return status.toLowerCase().replace('_', '-');
    };

    const getRoomColor = (room) => {
        // Status Mapping based on client request:
        // Green: In-house (OCCUPIED)
        // Dark Jungle Green: Occupied (DIRTY/OCCUPIED)
        // Red: Check out (DIRTY/AVAILABLE)
        // Orange: Maintenance (MAINTENANCE)
        // Purple: Reserved (RESERVED)
        
        const status = room.status || 'AVAILABLE';
        
        switch (status) {
            case 'OCCUPIED': return 'bg-[#22c55e] text-white'; // Green (In-house)
            case 'DIRTY': return 'bg-[#ef4444] text-white'; // Red (Check-out)
            case 'MAINTENANCE': return 'bg-[#f97316] text-white'; // Orange
            case 'RESERVED': return 'bg-[#a855f7] text-white'; // Purple
            case 'CLEANING': return 'bg-[#14532d] text-white'; // Dark Jungle Green (Occupied/Cleaning)
            default: return 'bg-white border-slate-200 text-slate-700'; // Available
        }
    };

    const handleRoomClick = (room) => {
        navigate(`/rooms/${room.id}`);
    };

    const roomStats = {
        total: rooms.length,
        available: rooms.filter(r => r.status === 'AVAILABLE').length,
        occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
        dirty: rooms.filter(r => r.status === 'DIRTY' || r.status === 'CLEANING').length,
        maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
        reserved: rooms.filter(r => r.status === 'RESERVED').length
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Operational Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-gradient-to-br from-maroon to-[#7a1a2e] text-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-200 mb-0.5">{t('Occupancy')}</span>
                    <span className="text-2xl font-black">{dashStats.occupancyRate}%</span>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-200 mb-0.5">{t('In-House')}</span>
                    <span className="text-2xl font-black">{dashStats.activeStays}</span>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-green-200 mb-0.5">{t('Arrivals')}</span>
                    <span className="text-2xl font-black">{dashStats.totalArrivalsToday}</span>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-200 mb-0.5">{t('Departures')}</span>
                    <span className="text-2xl font-black">{dashStats.totalDeparturesToday}</span>
                </div>
                <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-teal-200 mb-0.5">{t('Clean')}</span>
                    <span className="text-2xl font-black">{dashStats.cleanRooms}</span>
                </div>
            </div>

            {/* Room Status Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex flex-col items-center justify-center transition-all hover:shadow-md cursor-default">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 mb-0.5">{t('Available')}</span>
                    <span className="text-2xl font-black text-emerald-700">{roomStats.available}</span>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl flex flex-col items-center justify-center transition-all hover:shadow-md cursor-default">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-600 mb-0.5">{t('Reserved')}</span>
                    <span className="text-2xl font-black text-purple-700">{roomStats.reserved}</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl flex flex-col items-center justify-center transition-all hover:shadow-md cursor-default">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600 mb-0.5">{t('In-House')}</span>
                    <span className="text-2xl font-black text-blue-700">{roomStats.occupied}</span>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl flex flex-col items-center justify-center transition-all hover:shadow-md cursor-default">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-600 mb-0.5">{t('Dirty')}</span>
                    <span className="text-2xl font-black text-orange-700">{roomStats.dirty}</span>
                </div>
                <div className="bg-red-50 border border-red-100 p-3 rounded-2xl flex flex-col items-center justify-center transition-all hover:shadow-md cursor-default">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-600 mb-0.5">{t('Maintenance')}</span>
                    <span className="text-2xl font-black text-red-700">{roomStats.maintenance}</span>
                </div>
                <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center transition-all hover:shadow-md cursor-default">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">{t('All Rooms')}</span>
                    <span className="text-2xl font-black text-slate-600">{roomStats.total}</span>
                </div>
            </div>

            <div className="table-tools !bg-transparent !p-0 !border-none">
                <div className="table-search !bg-white">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={t('Search Room Number or Type...')} 
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                        <button 
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-maroon text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-maroon text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setViewMode('table')}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm bg-white hover:bg-slate-50 transition-colors flex items-center gap-2" onClick={() => navigate('/room-calendar')}>
                        <CalendarDays size={18} />
                        <span>{t('Calendar View')}</span>
                    </button>
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm bg-white hover:bg-slate-50 transition-colors" onClick={() => setShowTypeModal(true)}>
                        {t('Configure Types')}
                    </button>
                    <button className="btn-primary" onClick={() => handleOpenModal()}>{t('Add New Room')}</button>
                </div>
            </div>

            {loading && rooms.length === 0 ? (
                <div className="text-center py-20 text-text-slate animate-pulse font-medium">{t('Loading rooms...')}</div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {filteredRooms.map((room) => (
                        <div 
                            key={room.id}
                            onClick={() => handleRoomClick(room)}
                            className={`relative h-24 p-3 rounded-xl shadow-sm border transition-all hover:scale-105 hover:shadow-lg cursor-pointer flex flex-col justify-between group ${getRoomColor(room)} overflow-hidden`}
                        >
                            <div className="flex justify-between items-start z-10">
                                <span className="font-black text-base tracking-tighter">{room.roomNumber}</span>
                                <div className="p-1 rounded-md bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <History size={12} />
                                </div>
                            </div>
                            <div className="z-10">
                                <p className="text-[10px] font-bold uppercase tracking-tight truncate opacity-80 leading-none mb-1">
                                    {room.roomType?.name || '-'}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-60">FL {room.floor}</span>
                                    <button 
                                        className="p-1 opacity-60 hover:opacity-100 transition-opacity drop-shadow-sm"
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(room); }}
                                    >
                                        <Edit size={14} className="text-current" />
                                    </button>
                                </div>
                            </div>
                            {/* Decorative background number */}
                            <span className="absolute -bottom-4 -right-2 text-6xl font-black opacity-10 select-none">{room.roomNumber}</span>
                        </div>
                    ))}
                    {filteredRooms.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-400 font-medium italic">
                            {searchTerm ? t('No rooms match your search.') : t('No rooms found.')}
                        </div>
                    )}
                </div>
            ) : (
                <div className="premium-card">
                    <div className="overflow-x-auto w-full">
                        <table className="management-table" style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Room Number')}</th>
                                    <th>{t('Type')}</th>
                                    <th>{t('Floor')}</th>
                                    <th>{t('Status')}</th>
                                    <th>{t('Housekeeping')}</th>
                                    <th className="text-right">{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRooms.map((room) => (
                                    <tr key={room.id}>
                                        <td className="font-bold text-slate-900">{t('Room')} {room.roomNumber}</td>
                                        <td>
                                            <span className="font-semibold text-slate-700">{room.roomType?.name || '-'}</span>
                                        </td>
                                        <td>{t('Floor')} {room.floor}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(room.status)}`}>
                                                {room.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                                                {room.status === 'DIRTY' ? (
                                                    <span className="text-amber-600">{t('Needs Cleaning')}</span>
                                                ) : (
                                                    <span className="text-emerald-600">{t('Clean')}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="view-btn" onClick={() => handleRoomClick(room)}>{t('View History')}</button>
                                                <button className="view-btn" onClick={() => handleOpenModal(room)}>{t('Edit')}</button>
                                                {isAdminOrManager && room.status === 'AVAILABLE' && (
                                                    <button className="delete-btn" onClick={() => handleDelete(room.id)}>{t('Delete')}</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}



            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingRoom ? t('Edit Room') : t('Add New Room')}
                size="md"
                customClasses="!w-[70%] !max-w-[800px]"
            >
                <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>{t('Room Number')}</label>
                                    <input type="text" required value={formData.roomNumber} onChange={(e) => setFormData({...formData, roomNumber: e.target.value})} placeholder="e.g. 101" />
                                </div>
                                <div className="form-group">
                                    <label>{t('Floor')}</label>
                                    <input type="text" required value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})} placeholder="e.g. 1" />
                                </div>
                                <div className="form-group">
                                    <label>{t('Room Category')}</label>
                                    <select 
                                        required 
                                        value={formData.roomTypeId} 
                                        onChange={(e) => setFormData({...formData, roomTypeId: e.target.value})}
                                    >
                                        <option value="">{t('-- Select Type --')}</option>
                                        {roomTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>{t('Status')}</label>
                                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                        <option value="AVAILABLE">{t('AVAILABLE')}</option>
                                        <option value="OCCUPIED">{t('OCCUPIED')}</option>
                                        <option value="MAINTENANCE">{t('MAINTENANCE')}</option>
                                        <option value="DIRTY">{t('DIRTY')}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                {editingRoom && isAdminOrManager && editingRoom.status === 'AVAILABLE' && (
                                    <button 
                                        type="button" 
                                        onClick={() => handleDelete(editingRoom.id)} 
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-bold transition-all mr-auto"
                                    >
                                        {t('Delete Room')}
                                    </button>
                                )}
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">{t('Cancel')}</button>
                                <button type="submit" className="btn-primary !px-10">{editingRoom ? t('Save Changes') : t('Save Room')}</button>
                            </div>
                        </form>
            </Modal>
            <Modal
                isOpen={showTypeModal}
                onClose={() => setShowTypeModal(false)}
                title={t('Add Room Category')}
                size="sm"
                customClasses="!w-[90%] !max-w-[500px]"
            >
                <form onSubmit={handleCreateType} className="form-grid">
                            <div className="form-group full-width">
                                <label>{t('Category Name')}</label>
                                <input type="text" required value={typeFormData.name} onChange={e => setTypeFormData({...typeFormData, name: e.target.value})} placeholder="e.g. Deluxe Suite" />
                            </div>
                            <div className="form-group full-width">
                                <label>{t('Base Price ($)')}</label>
                                <input type="number" required value={typeFormData.basePrice} onChange={e => setTypeFormData({...typeFormData, basePrice: e.target.value})} placeholder="5000" />
                            </div>
                            <div className="form-group full-width">
                                <label>{t('Description')}</label>
                                <textarea required value={typeFormData.description} onChange={e => setTypeFormData({...typeFormData, description: e.target.value})} placeholder="Features and amenities..." />
                            </div>
                            <div className="modal-footer col-span-full">
                                <button type="button" onClick={() => setShowTypeModal(false)} className="btn-secondary">{t('Cancel')}</button>
                                <button type="submit" className="btn-primary">{t('Create Category')}</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default Rooms;
