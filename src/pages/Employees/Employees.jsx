import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, UserPlus, Mail, Phone, BadgeCheck, Building, MoreHorizontal, UserCircle, Briefcase, Users as Users2, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../services/formatters';
import useAuthStore from '../../store/authStore';
import Modal from '../../components/Modal/Modal';
import EmployeeForm from '../../components/EmployeeForm/EmployeeForm';
import { useAlert } from '../../context/AlertContext';

const Employees = () => {
    const { t } = useLanguage();
    const { user } = useAuthStore();
    const { alert, confirm } = useAlert();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const isAdmin = user?.roles?.includes('ROLE_HOTEL_ADMIN');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/employees');
            setEmployees(response.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (emp = null) => {
        setEditingEmployee(emp);
        setShowModal(true);
    };

    const handleDeleteEmployee = async (id) => {
        if (!(await confirm(t('Are you sure you want to delete this employee?'), t('Delete Employee'), 'warning'))) return;
        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (err) {
            console.error('Failed to delete employee:', err);
            await alert(t('Failed to delete employee.'), t('Error'), 'error');
        }
    };

    const filteredEmployees = employees.filter(emp => 
        (emp.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.designation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.idNumber || '').includes(searchQuery)
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('Employee Directory')}</h1>
                    <p className="text-slate-500 text-sm mt-1">{t('Manage and view all staff members across departments')}</p>
                </div>
                {isAdmin && (
                    <button className="btn-primary flex items-center gap-2" onClick={() => handleOpenModal()}>
                        <UserPlus size={18} />
                        {t('Add Employee')}
                    </button>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="premium-card p-4 flex items-center gap-4 border-l-4 border-l-maroon">
                    <div className="h-12 w-12 rounded-xl bg-maroon/5 flex items-center justify-center text-maroon">
                        <Users2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Total Staff')}</p>
                        <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
                    </div>
                </div>
                <div className="premium-card p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                        <Building size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Departments')}</p>
                        <p className="text-2xl font-bold text-slate-900">8</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="premium-card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('Search staff by name, email, or designation...')}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-maroon/10 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-maroon/10 w-full md:w-[200px]">
                    <option value="">{t('All Departments')}</option>
                    <option value="Front Desk">{t('Front Desk')}</option>
                    <option value="Housekeeping">{t('Housekeeping')}</option>
                    <option value="Accounts">{t('Accounts')}</option>
                </select>
            </div>

            {/* Employee Grid/Table */}
            <div className="premium-card overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="h-12 w-12 border-4 border-maroon/20 border-t-maroon rounded-full animate-spin" />
                        <p className="text-slate-500 font-medium">{t('Loading staff directory...')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th className="pl-6">{t('Employee')}</th>
                                    <th>{t('Designation')}</th>
                                    <th>{t('Contact Info')}</th>
                                    <th>{t('ID / Identity')}</th>
                                    <th>{t('Joined Date')}</th>
                                    <th>{t('Audit')}</th>
                                    <th className="text-right pr-6">{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((emp) => (
                                        <tr key={emp.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-maroon to-maroon/80 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                                                        {emp.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 group-hover:text-maroon transition-colors">{emp.fullName}</span>
                                                        <span className="text-[11px] text-slate-400 font-medium">#{emp.id.toString().padStart(4, '0')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                                        <Briefcase size={14} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-700">{emp.designation}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                        <Mail size={12} className="text-slate-400" />
                                                        {emp.email}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                        <Phone size={12} className="text-slate-400" />
                                                        {emp.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <BadgeCheck size={14} className="text-emerald-500" />
                                                    <span className="text-xs font-mono font-bold text-slate-600 tracking-wider bg-slate-100 px-2 py-0.5 rounded leading-none">{emp.idNumber}</span>
                                                </div>
                                            </td>
                                            <td className="text-sm font-medium text-slate-600">
                                                {emp.dateOfJoining ? formatDate(emp.dateOfJoining) : '-'}
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Created: <span className="font-bold text-slate-700">{emp.createdByName || emp.createdBy || '-'}</span></span>
                                                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Modified: <span className="font-bold text-slate-700">{emp.modifiedByName || emp.modifiedBy || '-'}</span></span>
                                                </div>
                                            </td>
                                            <td className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(emp)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-slate-400 hover:text-blue-600" title={t('Edit')}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600" title={t('Delete')}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-slate-500">
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <UserCircle size={48} />
                                                <p className="font-medium">{t('No employees found matching your search')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingEmployee ? t('Edit Employee') : t('Add New Employee')}
                size="lg"
            >
                <EmployeeForm 
                    initialData={editingEmployee}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchEmployees();
                    }}
                    onCancel={() => setShowModal(false)}
                />
            </Modal>
        </div>
    );
};

export default Employees;
