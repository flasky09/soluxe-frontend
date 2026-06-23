import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../services/formatters';
import Modal from '../../components/Modal/Modal';
import { Search, Filter, Plus, FileText, CreditCard, Wallet, Trash2, Edit } from 'lucide-react';

const Expenses = () => {
    const { user, hasRole } = useAuthStore();
    const isAdmin = hasRole('ROLE_HOTEL_ADMIN') || hasRole('ROLE_MANAGER');
    const { t } = useLanguage();

    const [expenses, setExpenses] = useState([]);
    const [expenseTypes, setExpenseTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);

    // Form states
    const [newExpenseType, setNewExpenseType] = useState({ name: '', description: '' });
    const [expenseData, setExpenseData] = useState({
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        expenseTypeId: '',
        paymentMethod: 'CASH',
        referenceNumber: ''
    });
    const [editingExpenseId, setEditingExpenseId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expensesRes, typesRes] = await Promise.all([
                api.get('/expenses'),
                api.get('/expense-types')
            ]);
            setExpenses(expensesRes.data);
            setExpenseTypes(typesRes.data);
            if (typesRes.data.length > 0 && !expenseData.expenseTypeId) {
                setExpenseData(prev => ({ ...prev, expenseTypeId: typesRes.data[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch expenses data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenModal = (expense = null) => {
        if (expense) {
            setEditingExpenseId(expense.id);
            setExpenseData({
                description: expense.description,
                amount: expense.amount,
                expenseDate: expense.expenseDate ? expense.expenseDate.split('T')[0] : new Date().toISOString().split('T')[0],
                expenseTypeId: expense.expenseType?.id || (expenseTypes.length > 0 ? expenseTypes[0].id : ''),
                paymentMethod: expense.paymentMethod || 'CASH',
                referenceNumber: expense.referenceNumber || ''
            });
        } else {
            setEditingExpenseId(null);
            setExpenseData({
                description: '',
                amount: '',
                expenseDate: new Date().toISOString().split('T')[0],
                expenseTypeId: expenseTypes.length > 0 ? expenseTypes[0].id : '',
                paymentMethod: 'CASH',
                referenceNumber: ''
            });
        }
        setShowModal(true);
    };

    const handleSaveExpense = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                description: expenseData.description,
                amount: parseFloat(expenseData.amount) || 0,
                expenseDate: expenseData.expenseDate,
                expenseType: { id: parseInt(expenseData.expenseTypeId) },
                paymentMethod: expenseData.paymentMethod,
                referenceNumber: expenseData.referenceNumber
            };

            if (editingExpenseId) {
                await api.put(`/expenses/${editingExpenseId}?userId=${user?.id || 1}`, payload);
            } else {
                await api.post(`/expenses?userId=${user?.id || 1}`, payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save expense', err);
            alert('Failed to save expense. Please check your inputs.');
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense? This action cannot be reversed.')) return;
        try {
            await api.delete(`/expenses/${id}`);
            fetchData();
        } catch (err) {
            console.error('Failed to delete expense', err);
            alert('Failed to delete expense.');
        }
    };

    const handleCreateExpenseType = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/expense-types', newExpenseType);
            const response = await api.get('/expense-types');
            setExpenseTypes(response.data);
            setExpenseData(prev => ({ ...prev, expenseTypeId: res.data.id }));
            setNewExpenseType({ name: '', description: '' });
            setShowTypeModal(false);
        } catch (err) {
            console.error('Failed to create expense type', err);
            alert('Failed to create expense category.');
        }
    };

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch = exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              exp.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || (exp.expenseType && exp.expenseType.name === statusFilter);
        return matchesSearch && matchesStatus;
    }).sort((a, b) => b.id - a.id);

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <h1 className="text-xl font-bold text-slate-800">{t('Expenses')}</h1>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-2" onClick={() => setShowTypeModal(true)}>
                        <Filter size={14} /> {t('Manage Categories')}
                    </button>
                    <button className="flex-1 sm:flex-none btn-primary !py-1.5 !px-4 text-xs flex items-center justify-center gap-2" onClick={() => handleOpenModal()}>
                        <Plus size={14} /> {t('Add Expense')}
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="premium-card p-5 border-l-4 border-l-amber-500 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Total Items')}</p>
                        <h3 className="text-2xl font-black text-text-dark mt-1">{filteredExpenses.length}</h3>
                    </div>
                    <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                        <FileText size={20} />
                    </div>
                </div>
                <div className="premium-card p-5 border-l-4 border-l-red-500 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Total Amount')}</p>
                        <h3 className="text-2xl font-black text-red-600 mt-1">$ {totalExpenses.toLocaleString()}</h3>
                    </div>
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                        <Wallet size={20} />
                    </div>
                </div>
            </div>

            {/* filter */}
            <div className="premium-card px-4 py-3 flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-maroon transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('Search expenses...')} 
                        className="w-full pl-11 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-maroon/10 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold whitespace-nowrap px-2">
                        <Filter size={16} /> {t('Category')}:
                    </div>
                    <select 
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-maroon/10 outline-none cursor-pointer hover:border-slate-300 transition-all w-full md:w-[160px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">{t('All Categories')}</option>
                        {expenseTypes.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
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
                                    <th>{t('Date')}</th>
                                    <th>{t('Description')}</th>
                                    <th>{t('Category')}</th>
                                    <th>{t('Payment Info')}</th>
                                    <th className="font-bold text-slate-500 uppercase tracking-wider">{t('Amount')}</th>
                                    {isAdmin && <th className="font-bold text-slate-500 uppercase tracking-wider">{t('Audit')}</th>}
                                    <th className="text-right uppercase tracking-wider">{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.length > 0 ? (
                                    filteredExpenses.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="font-medium text-slate-600">{formatDate(exp.expenseDate)}</td>
                                            <td><span className="font-bold text-slate-900">{exp.description}</span></td>
                                            <td>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                                                    {exp.expenseType?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold text-slate-700">{exp.paymentMethod || '-'}</span>
                                                    {exp.referenceNumber && (
                                                        <span className="text-[10px] text-slate-500">Ref: {exp.referenceNumber}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="font-bold text-red-600">$ {parseFloat(exp.amount || 0).toLocaleString()}</td>
                                            {isAdmin && (
                                                <td>
                                                    <div className="flex flex-col gap-1 text-[10px] text-slate-500">
                                                        <span>Created: <span className="font-bold text-slate-700">{exp.createdBy || '-'}</span></span>
                                                        <span>Modified: <span className="font-bold text-slate-700">{exp.modifiedBy || '-'}</span></span>
                                                    </div>
                                                </td>
                                            )}
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" 
                                                        onClick={() => handleOpenModal(exp)}
                                                        title={t('Edit')}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    {isAdmin && (
                                                        <button 
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" 
                                                            onClick={() => handleDeleteExpense(exp.id)}
                                                            title={t('Delete')}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? 7 : 6} className="text-center py-20 text-text-slate">{t('No expenses found.')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal for saving Expense */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={<span className="flex items-center gap-2"><Plus className="text-maroon" /> {editingExpenseId ? t('Edit Expense') : t('Add Expense')}</span>}
                size="md"
                customClasses="!w-[85%] !max-w-[700px]"
            >
                <form onSubmit={handleSaveExpense}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>{t('Description')}</label>
                            <input type="text" required value={expenseData.description} onChange={(e) => setExpenseData({...expenseData, description: e.target.value})} placeholder={t('What was this expense for?')} />
                        </div>
                        <div className="form-group full-width">
                            <label>{t('Category')}</label>
                            <div className="flex gap-2">
                                <select className="flex-1" required value={expenseData.expenseTypeId} onChange={(e) => setExpenseData({...expenseData, expenseTypeId: e.target.value})}>
                                    <option value="">{t('-- Select Category --')}</option>
                                    {expenseTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                                <button 
                                    type="button"
                                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors"
                                    onClick={() => setShowTypeModal(true)}
                                    title={t('Add Category')}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('Amount ($)')}</label>
                            <input type="number" step="0.01" required value={expenseData.amount} onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>{t('Date')}</label>
                            <input type="date" required value={expenseData.expenseDate} onChange={(e) => setExpenseData({...expenseData, expenseDate: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>{t('Payment Method')}</label>
                            <select value={expenseData.paymentMethod} onChange={(e) => setExpenseData({...expenseData, paymentMethod: e.target.value})}>
                                <option value="CASH">CASH</option>
                                <option value="CREDIT_CARD">CREDIT CARD</option>
                                <option value="BANK_TRANSFER">BANK TRANSFER</option>
                                <option value="MOBILE_PAY">MOBILE PAY</option>
                                <option value="CHECK">CHECK</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t('Reference No. (Optional)')}</label>
                            <input type="text" value={expenseData.referenceNumber} onChange={(e) => setExpenseData({...expenseData, referenceNumber: e.target.value})} placeholder="Receipt or Txn ID" />
                        </div>
                    </div>
                    <div className="modal-footer mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-8">{t('Cancel')}</button>
                        <button type="submit" className="btn-primary !px-8">{editingExpenseId ? t('Update') : t('Save Expense')}</button>
                    </div>
                </form>
            </Modal>

            {/* Modal for adding Category */}
            <Modal
                isOpen={showTypeModal}
                onClose={() => setShowTypeModal(false)}
                title={<span className="flex items-center gap-2"><Plus className="text-maroon" /> {t('Manage Expense Categories')}</span>}
                size="md"
                customClasses="!w-[85%] !max-w-[500px]"
                overlayClasses="z-[1100]"
            >
                <div className="mb-6 max-h-[200px] overflow-y-auto border border-slate-200 p-4 rounded-xl bg-slate-50">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{t('Existing Categories')}</h4>
                    {expenseTypes.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {expenseTypes.map(t => (
                                <div key={t.id} className="flex justify-between items-center py-1.5 border-b border-slate-200 last:border-0">
                                    <span className="font-bold text-slate-700 text-sm">{t.name}</span>
                                    {t.description && <span className="text-[11px] text-slate-500">{t.description}</span>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-2 text-slate-400 text-xs italic">{t('No categories defined yet.')}</p>
                    )}
                </div>

                <form onSubmit={handleCreateExpenseType} className="border-t border-slate-200 pt-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">{t('Add New Category')}</h4>
                    <div className="flex flex-col gap-4">
                        <div className="form-group w-full">
                            <label>{t('Category Name')}</label>
                            <input type="text" required value={newExpenseType.name} onChange={(e) => setNewExpenseType({...newExpenseType, name: e.target.value})} placeholder="e.g. Maintenance, Office Supplies" />
                        </div>
                        <div className="form-group w-full">
                            <label>{t('Description')}</label>
                            <input type="text" value={newExpenseType.description} onChange={(e) => setNewExpenseType({...newExpenseType, description: e.target.value})} placeholder={t('Optional')} />
                        </div>
                    </div>
                    <div className="modal-footer mt-6 !px-0">
                        <button type="button" onClick={() => setShowTypeModal(false)} className="btn-secondary !px-6">{t('Close')}</button>
                        <button type="submit" className="btn-primary !px-6">{t('Add Category')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Expenses;
