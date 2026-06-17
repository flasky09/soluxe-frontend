import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';
import useAuthStore from '../../store/authStore';

const Users = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ROLE_HOTEL_ADMIN' || user?.role === 'HOTEL_ADMIN';
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'RECEPTIONIST',
        isActive: true
    });
    const [serverErrors, setServerErrors] = useState({});

    const roles = [
        'HOTEL_ADMIN', 'MANAGER', 'ACCOUNTANT', 'RECEPTIONIST', 
        'CASHIER', 'WAITER', 'CHEF', 'STORE_KEEPER', 
        'HOUSEKEEPING', 'MAINTENANCE'
    ];

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                fullName: user.fullName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                password: '', // Don't show password hash
                role: user.role,
                isActive: user.isActive ?? user.active ?? true
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                fullName: '',
                email: '',
                phoneNumber: '',
                password: '',
                role: 'RECEPTIONIST',
                isActive: true
            });
        }
        setServerErrors({});
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerErrors({});
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
            if (err.response && (err.response.status === 400 || err.response.status === 409)) {
                setServerErrors(err.response.data);
            } else {
                alert('An unexpected error occurred. Please try again.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (err) {
                console.error('Failed to delete user:', err);
                alert('Failed to delete user.');
            }
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'HOTEL_ADMIN': return 'bg-purple-100 text-purple-700';
            case 'MANAGER': return 'bg-blue-100 text-blue-700';
            case 'RECEPTIONIST': return 'bg-green-100 text-green-700';
            case 'ACCOUNTANT': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
    const paginatedUsers = filteredUsers.slice(
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
                        placeholder={t('Search')}
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary flex-shrink-0" onClick={() => handleOpenModal()}>{t('Add New User')}</button>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                    {loading ? (
                        <div className="text-center py-20 text-text-slate animate-pulse font-medium italic">Synchronizing security records...</div>
                    ) : (
                        <table className="management-table" style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>{t('User Profile')}</th>
                                    <th>{t('System Role')}</th>
                                    <th>{t('Contact Details')}</th>
                                    <th>{t('Status')}</th>
                                    {isAdmin && <th>{t('Audit')}</th>}
                                    <th className="text-right">{t('Actions')}</th>
                                </tr>
                            </thead>
                        <tbody>
                            {paginatedUsers.length > 0 ? paginatedUsers.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <Link to={`/users/${u.id}`} className="font-bold text-indigo-700 text-base hover:text-indigo-500 hover:underline transition-colors uppercase cursor-pointer" title={t('View Audit Report')}>
                                                {u.username}
                                            </Link>
                                            <span className="text-[12px] text-text-slate font-medium">{u.fullName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${getRoleBadgeColor(u.role)}`}>
                                            {u.role.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-0.5 text-sm">
                                            <span className="text-slate-700 font-medium">{u.email}</span>
                                            <span className="text-slate-500">{u.phoneNumber}</span>
                                        </div>
                                    </td>
                                    <td>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {u.isActive ? t('Authenticated') : t('Disabled')}
                                    </span>
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-text-slate font-medium">Created: <span className="font-bold text-text-dark">{u.createdByName || u.createdBy || '-'}</span></span>
                                                <span className="text-[10px] text-text-slate font-medium">Modified: <span className="font-bold text-text-dark">{u.modifiedByName || u.modifiedBy || '-'}</span></span>
                                            </div>
                                        </td>
                                    )}
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(u)}>{t('Configure')}</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-bold transition-all duration-300 ml-2" onClick={() => handleDelete(u.id)}>{t('Retract Access')}</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-slate-400 font-medium italic">
                                        No security profiles found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {!loading && filteredUsers.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredUsers.length}
                    pageSize={PAGE_SIZE}
                />
            )}

            {showModal && (
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingUser ? t('Update Profile') : t('Register New Staff Member')}
                size="md"
                customClasses="!w-[80%]"
            >
                {serverErrors.error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                        {serverErrors.error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>{t('Username')}</label>
                            <input type="text" required minLength={3} maxLength={50} value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="e.g. admin_soluxe" disabled={editingUser} />
                            {serverErrors.username && <p className="text-red-500 text-xs mt-1">{serverErrors.username}</p>}
                        </div>
                        <div className="form-group">
                            <label>{t('System Role')}</label>
                            <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                {roles.map(r => (
                                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                            {serverErrors.role && <p className="text-red-500 text-xs mt-1">{serverErrors.role}</p>}
                        </div>
                        <div className="form-group">
                            <label>{t('Full Name')}</label>
                            <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Jane Doe" />
                            {serverErrors.fullName && <p className="text-red-500 text-xs mt-1">{serverErrors.fullName}</p>}
                        </div>
                        <div className="form-group">
                            <label>{t('Email Address')}</label>
                            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="jane@soluxeclubhotel.com" />
                            {serverErrors.email && <p className="text-red-500 text-xs mt-1">{serverErrors.email}</p>}
                        </div>
                        <div className="form-group">
                            <label>{t('Phone Number')}</label>
                            <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} placeholder="+254..." />
                        </div>
                        <div className="form-group">
                            <label>{editingUser ? t('New Password (Optional)') : t('Initial Password')}</label>
                            <input type="password" required={!editingUser} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <input 
                                    type="checkbox" 
                                    id="active"
                                    checked={formData.isActive} 
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20" 
                                />
                                <label htmlFor="active" className="mb-0 text-sm font-semibold text-slate-700 uppercase tracking-wide">{t('Account Active & Enabled')}</label>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">{t('Cancel')}</button>
                        <button type="submit" className="btn-primary !px-10">{editingUser ? t('Update Profile') : t('Provision User')}</button>
                    </div>
                </form>
            </Modal>
            )}
        </div>
    );
};

export default Users;
