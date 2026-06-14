import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { Pencil, Trash2, Plus, Info } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';

const Settings = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'RECEPTIONIST',
        password: '',
        isActive: true
    });

    const [hotelInfo, setHotelInfo] = useState({
        name: 'Soluxe Club Hotel',
        address: '123 Luxury Ave, Nairobi, Kenya',
        email: 'info@soluxe.com',
        phone: '+254 700 000 000',
        website: 'www.soluxe.com',
        kraPin: 'P000000000A',
        vatStatus: 'Registered',
        companyReg: 'PVT-12345',
        checkInTime: '14:00',
        checkOutTime: '10:00',
        vatPercentage: 16,
        serviceChargePercentage: 10,
        tourismLevyPercentage: 2,
        logo: '🏨'
    });

    // Global Definitions State
    const [activeDefType, setActiveDefType] = useState('id-types');
    const [definitions, setDefinitions] = useState([]);
    const [defLoading, setDefLoading] = useState(false);
    const [showDefModal, setShowDefModal] = useState(false);
    const [editingDef, setEditingDef] = useState(null);
    const [defFormData, setDefFormData] = useState({ name: '', description: '' });

    const defTypes = useMemo(() => [
        { id: 'id-types', name: 'Identity Types', endpoint: '/id-types' },
        { id: 'inventory-units', name: 'Inventory Units', endpoint: '/inventory-units' },
        { id: 'inventory-categories', name: 'Inventory Categories', endpoint: '/inventory-categories' },
        { id: 'charge-types', name: 'Charge Types', endpoint: '/charge-types' },
        { id: 'maintenance-issue-types', name: 'Maintenance Issues', endpoint: '/maintenance-issue-types' },
        { id: 'leave-types', name: 'Leave Types', endpoint: '/leave-types' },
        { id: 'payment-methods', name: 'Payment Methods', endpoint: '/folios/payment-methods' },
        { id: 'departments', name: 'Departments', endpoint: '/departments' }
    ], []);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDefinitions = useCallback(async (typeId) => {
        setDefLoading(true);
        const type = defTypes.find(t => t.id === typeId);
        try {
            const response = await api.get(type.endpoint);
            setDefinitions(response.data);
        } catch (err) {
            console.error(`Failed to fetch ${typeId}:`, err);
        } finally {
            setDefLoading(false);
        }
    }, [defTypes]);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'definitions') {
            fetchDefinitions(activeDefType);
        }
    }, [activeTab, activeDefType, fetchDefinitions, fetchUsers]);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                fullName: user.fullName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                role: user.role,
                password: '', 
                isActive: user.isActive ?? user.active
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                fullName: '',
                email: '',
                phoneNumber: '',
                role: 'RECEPTIONIST',
                password: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            console.error('Failed to save user:', err);
            alert('Failed to save user details.');
        }
    };

    const handleSaveHotelInfo = (e) => {
        e.preventDefault();
        alert('Hotel profile updated successfully!');
    };

    // Global Definitions CRUD
    const handleOpenDefModal = (def = null) => {
        if (def) {
            setEditingDef(def);
            setDefFormData({ name: def.name, description: def.description || '' });
        } else {
            setEditingDef(null);
            setDefFormData({ name: '', description: '' });
        }
        setShowDefModal(true);
    };

    const handleDefSubmit = async (e) => {
        e.preventDefault();
        const type = defTypes.find(t => t.id === activeDefType);
        try {
            if (editingDef) {
                await api.put(`${type.endpoint}/${editingDef.id}`, defFormData);
            } else {
                await api.post(type.endpoint, defFormData);
            }
            setShowDefModal(false);
            fetchDefinitions(activeDefType);
        } catch (err) {
            console.error(`Failed to save ${activeDefType}:`, err);
            alert(`Failed to save definition.`);
        }
    };

    const handleDefDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this? This might affect records using it.')) return;
        const type = defTypes.find(t => t.id === activeDefType);
        try {
            await api.delete(`${type.endpoint}/${id}`);
            fetchDefinitions(activeDefType);
        } catch (err) {
            console.error(`Failed to delete ${activeDefType}:`, err);
            alert('Failed to delete. It might be in use by other records.');
        }
    };


    return (
        <div className="flex flex-col">

            <div className="flex gap-2 mb-4 border-b border-slate-200">
                <button 
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'users' ? 'text-primary border-primary bg-primary/5' : 'text-text-slate border-transparent hover:text-primary'}`} 
                    onClick={() => setActiveTab('users')}
                >
                    {t('User Management')}
                </button>
                <button 
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'profile' ? 'text-primary border-primary bg-primary/5' : 'text-text-slate border-transparent hover:text-primary'}`} 
                    onClick={() => setActiveTab('profile')}
                >
                    {t('Hotel Profile')}
                </button>
                <button 
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'definitions' ? 'text-primary border-primary bg-primary/5' : 'text-text-slate border-transparent hover:text-primary'}`} 
                    onClick={() => setActiveTab('definitions')}
                >
                    {t('Global Definitions')}
                </button>
            </div>

            {activeTab === 'users' && (
                <>
                    <div className="flex justify-end mb-6">
                        <button className="btn-primary" onClick={() => handleOpenModal()}>+ {t('Add New User')}</button>
                    </div>
                    <div className="premium-card">
                        <div className="overflow-x-auto w-full">
                        {loading ? (
                            <div className="text-center py-20 text-text-slate animate-pulse text-lg">{t('Loading user accounts...')}</div>
                        ) : (
                            <table className="management-table" style={{ minWidth: '800px' }}>
                                <thead>
                                    <tr>
                                        <th>{t('User')}</th>
                                        <th>{t('Contact Information')}</th>
                                        <th>{t('Role')}</th>
                                        <th>{t('Status')}</th>
                                        <th className="text-right">{t('Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center text-xs font-bold uppercase">
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700">{user.username}</span>
                                                        <span className="text-[12px] text-slate-500">{user.fullName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] text-slate-700">{user.email || t('No Email')}</span>
                                                    <span className="text-[11px] text-slate-400 font-medium">{user.phoneNumber || t('No Phone')}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                                    user.role === 'HOTEL_ADMIN' ? 'bg-red-50 text-red-600' :
                                                    user.role === 'MANAGER' ? 'bg-amber-50 text-amber-600' :
                                                    user.role === 'RECEPTIONIST' ? 'bg-green-50 text-green-600' :
                                                    user.role === 'ACCOUNTANT' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${(user.isActive ?? user.active) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {(user.isActive ?? user.active) ? t('Active') : t('Disabled')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex justify-end">
                                                    <button className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded text-[11px] font-bold transition-all" onClick={() => handleOpenModal(user)}>{t('Edit Profile')}</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'profile' && (
                <div className="premium-card p-8 !max-w-[800px] mx-auto">
                    <form onSubmit={handleSaveHotelInfo} className="flex flex-col gap-8">
                        <div className="flex items-center gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="w-16 h-16 bg-slate-100 border border-slate-200 flex items-center justify-center rounded-lg text-sm font-bold text-slate-500">{t('Logo')}</div>
                            <button type="button" className="btn-secondary text-sm">{t('Upload New Logo')}</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-section-title mt-4 md:col-span-2">{t('General Details')}</div>
                            <div className="form-group">
                                <label>{t('Hotel Name')}</label>
                                <input type="text" value={hotelInfo.name} onChange={(e) => setHotelInfo({...hotelInfo, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>{t('Business Email')}</label>
                                <input type="email" value={hotelInfo.email} onChange={(e) => setHotelInfo({...hotelInfo, email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>{t('Contact Phone')}</label>
                                <input type="text" value={hotelInfo.phone} onChange={(e) => setHotelInfo({...hotelInfo, phone: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>{t('Website')}</label>
                                <input type="text" value={hotelInfo.website} onChange={(e) => setHotelInfo({...hotelInfo, website: e.target.value})} />
                            </div>
                            <div className="form-group md:col-span-2">
                                <label>{t('Physical Address')}</label>
                                <textarea rows="2" value={hotelInfo.address} onChange={(e) => setHotelInfo({...hotelInfo, address: e.target.value})} className="min-h-[60px]"></textarea>
                            </div>

                            <div className="form-section-title mt-4 md:col-span-2">{t('Legal & Registration')}</div>
                            <div className="form-group">
                                <label>{t('KRA PIN')}</label>
                                <input type="text" value={hotelInfo.kraPin} onChange={(e) => setHotelInfo({...hotelInfo, kraPin: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>{t('Business Reg. No')}</label>
                                <input type="text" value={hotelInfo.companyReg} onChange={(e) => setHotelInfo({...hotelInfo, companyReg: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>{t('VAT Status')}</label>
                                <select value={hotelInfo.vatStatus} onChange={(e) => setHotelInfo({...hotelInfo, vatStatus: e.target.value})}>
                                    <option value="Registered">{t('Registered')}</option>
                                    <option value="Not Registered">{t('Not Registered')}</option>
                                </select>
                            </div>

                            <div className="form-section-title mt-4 md:col-span-2">{t('Operations')}</div>
                            <div className="form-group">
                                <label>{t('Check-in Time')}</label>
                                <input type="time" value={hotelInfo.checkInTime} onChange={(e) => setHotelInfo({...hotelInfo, checkInTime: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>{t('Check-out Time')}</label>
                                <input type="time" value={hotelInfo.checkOutTime} onChange={(e) => setHotelInfo({...hotelInfo, checkOutTime: e.target.value})} />
                            </div>

                            <div className="form-section-title mt-4 md:col-span-2">{t('Taxes & Charges config')}</div>
                            <div className="form-group">
                                <label>{t('VAT Percentage (%)')}</label>
                                <input type="number" step="0.1" value={hotelInfo.vatPercentage} onChange={(e) => setHotelInfo({...hotelInfo, vatPercentage: parseFloat(e.target.value) || 0})} />
                            </div>
                            <div className="form-group">
                                <label>{t('Service Charge (%)')}</label>
                                <input type="number" step="0.1" value={hotelInfo.serviceChargePercentage} onChange={(e) => setHotelInfo({...hotelInfo, serviceChargePercentage: parseFloat(e.target.value) || 0})} />
                            </div>
                            <div className="form-group">
                                <label>{t('Tourism Levy (%)')}</label>
                                <input type="number" step="0.1" value={hotelInfo.tourismLevyPercentage} onChange={(e) => setHotelInfo({...hotelInfo, tourismLevyPercentage: parseFloat(e.target.value) || 0})} />
                            </div>
                        </div>
                        <div className="flex justify-end pt-6 border-t border-slate-200">
                            <button type="submit" className="btn-primary !px-10">{t('Update Property Profile')}</button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'definitions' && (
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Def Navigation */}
                    <div className="w-full md:w-64 flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-4 whitespace-nowrap">{t('Entity Categories')}</label>
                        {defTypes.map(type => (
                            <button 
                                key={type.id}
                                onClick={() => setActiveDefType(type.id)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeDefType === type.id ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <span>{type.name}</span>
                                {activeDefType === type.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </button>
                        ))}
                    </div>

                    {/* Def List */}
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-extrabold text-slate-800">{defTypes.find(t => t.id === activeDefType)?.name}</h3>
                            <button className="btn-primary-outline flex items-center gap-2 !py-2 !px-4" onClick={() => handleOpenDefModal()}>
                                <Plus size={16} /> {t('Add New')}
                            </button>
                        </div>

                        <div className="premium-card min-h-[400px]">
                            <div className="overflow-x-auto w-full">
                            {defLoading ? (
                                <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 gap-3">
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="font-bold text-sm tracking-wide">{t('Syncing entries...')}</span>
                                </div>
                            ) : definitions.length > 0 ? (
                                <table className="management-table" style={{ minWidth: '500px' }}>
                                    <thead>
                                        <tr>
                                            <th>{t('Name')}</th>
                                            <th>{t('Description')}</th>
                                            <th className="text-right">{t('Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {definitions.map((def) => (
                                            <tr key={def.id}>
                                                <td className="font-bold text-slate-700">{def.name}</td>
                                                <td className="text-sm text-slate-500 max-w-[300px] truncate">{def.description || t('N/A')}</td>
                                                <td>
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleOpenDefModal(def)} className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg">
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button onClick={() => handleDefDelete(def.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[400px] text-slate-300 gap-2">
                                    <Info size={40} strokeWidth={1.5} />
                                    <p className="font-medium">{t('No results found for this category')}</p>
                                    <button className="text-primary font-bold text-xs mt-2 hover:underline" onClick={() => handleOpenDefModal()}>{t('Click here to add your first record')}</button>
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingUser ? t('Edit User Profile') : t('Create New User Account')}
                size="md"
            >
                <form onSubmit={handleSubmit}>
                    {/* ... same as before */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-7">
                        <div className="form-group">
                            <label>{t('Username')}</label>
                            <input 
                                type="text" 
                                required 
                                disabled={!!editingUser}
                                value={formData.username} 
                                onChange={(e) => setFormData({...formData, username: e.target.value})} 
                                placeholder="Identification name"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Full Name')}</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.fullName} 
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Email Address')}</label>
                            <input 
                                type="email" 
                                required 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                placeholder="user@soluxe.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Phone Number')}</label>
                            <input 
                                type="text" 
                                value={formData.phoneNumber} 
                                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} 
                                placeholder="+254..."
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Security Role')}</label>
                            <select 
                                value={formData.role} 
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                            >
                                <option value="HOTEL_ADMIN">Hotel Admin</option>
                                <option value="MANAGER">Manager</option>
                                <option value="RECEPTIONIST">Receptionist</option>
                                <option value="ACCOUNTANT">Accountant</option>
                                <option value="HOUSEKEEPING">Housekeeping</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="CHEF">Chef</option>
                                <option value="STORE_KEEPER">Store Keeper</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{editingUser ? t('New Password (Optional)') : t('Account Password')}</label>
                            <input 
                                type="password" 
                                required={!editingUser}
                                value={formData.password} 
                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <input 
                                    type="checkbox" 
                                    id="isActive"
                                    checked={formData.isActive} 
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="isActive" className="mb-0 font-medium text-slate-700">{t('Account is Active (Allow login and system access)')}</label>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">{t('Cancel')}</button>
                        <button type="submit" className="btn-primary !px-10">{editingUser ? t('Save Updates') : t('Create Account')}</button>
                    </div>
                </form>
            </Modal>

            {/* Global Def Modal */}
            <Modal
                isOpen={showDefModal}
                onClose={() => setShowDefModal(false)}
                title={(
                    <div className="flex flex-col">
                        <span>{editingDef ? t('Edit Definition') : t('Add New Entry')}</span>
                        <span className="text-sm font-medium text-slate-500 mt-1">{defTypes.find(t => t.id === activeDefType)?.name}</span>
                    </div>
                )}
                size="sm"
            >
                <form onSubmit={handleDefSubmit}>
                    <div className="flex flex-col gap-6 p-7">
                        <div className="form-group">
                            <label>{t('Display Name')}</label>
                            <input 
                                type="text" 
                                required 
                                value={defFormData.name} 
                                onChange={(e) => setDefFormData({...defFormData, name: e.target.value})} 
                                placeholder="e.g. Passport, Kgs, Dinner"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Description (Optional)')}</label>
                            <textarea 
                                rows="3"
                                value={defFormData.description} 
                                onChange={(e) => setDefFormData({...defFormData, description: e.target.value})} 
                                placeholder="Brief details about this entry..."
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={() => setShowDefModal(false)} className="btn-secondary !px-8">{t('Cancel')}</button>
                        <button type="submit" className="btn-primary !px-8">{editingDef ? t('Update Entry') : t('Create Entry')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Settings;
