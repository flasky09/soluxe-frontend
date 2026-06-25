import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Globe, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useAlert } from '../../context/AlertContext';

const Currencies = () => {
    const { t } = useLanguage();
    const { alert, confirm } = useAlert();
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        symbol: '',
        name: '',
        exchangeRate: 1.0,
        baseCurrency: false,
        active: true
    });

    useEffect(() => {
        fetchCurrencies();
    }, []);

    const fetchCurrencies = async () => {
        setLoading(true);
        try {
            const response = await api.get('/currencies');
            setCurrencies(response.data);
        } catch (error) {
            console.error('Error fetching currencies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (currency = null) => {
        if (currency) {
            setEditingCurrency(currency);
            setFormData({
                code: currency.code,
                symbol: currency.symbol,
                name: currency.name,
                exchangeRate: currency.exchangeRate,
                baseCurrency: currency.baseCurrency,
                active: currency.active
            });
        } else {
            setEditingCurrency(null);
            setFormData({
                code: '',
                symbol: '',
                name: '',
                exchangeRate: 1.0,
                baseCurrency: false,
                active: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCurrency) {
                await api.put(`/currencies/${editingCurrency.id}`, formData);
            } else {
                await api.post('/currencies', formData);
            }
            setShowModal(false);
            fetchCurrencies();
        } catch (error) {
            console.error('Error saving currency:', error);
            await alert('Failed to save currency', 'Error', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!(await confirm(t('Are you sure you want to delete this currency?'), 'Delete Currency', 'warning'))) return;
        try {
            await api.delete(`/currencies/${id}`);
            fetchCurrencies();
        } catch (error) {
            console.error('Error deleting currency:', error);
            await alert('Failed to delete currency', 'Error', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="text-maroon" /> {t('Currencies')}
                    </h1>
                    <p className="text-slate-500">{t('Manage system currencies and exchange rates')}</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()} 
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} /> {t('Add New')}
                </button>
            </div>

            <div className="premium-card overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center animate-pulse">{t('Loading...')}</div>
                ) : (
                    <table className="management-table w-full">
                        <thead>
                            <tr>
                                <th>{t('Code')}</th>
                                <th>{t('Symbol')}</th>
                                <th>{t('Name')}</th>
                                <th>{t('Exchange Rate')}</th>
                                <th>{t('Status')}</th>
                                <th className="text-right">{t('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currencies.map(c => (
                                <tr key={c.id}>
                                    <td className="font-bold">
                                        {c.code}
                                        {c.baseCurrency && (
                                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">
                                                {t('BASE')}
                                            </span>
                                        )}
                                    </td>
                                    <td>{c.symbol}</td>
                                    <td>{c.name}</td>
                                    <td>1 {currencies.find(cc => cc.baseCurrency)?.code || 'BASE'} = {c.exchangeRate} {c.code}</td>
                                    <td>
                                        {c.active ? (
                                            <CheckCircle className="text-green-500 h-5 w-5" />
                                        ) : (
                                            <XCircle className="text-slate-300 h-5 w-5" />
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(c)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCurrency ? t('Edit Currency') : t('Add New Currency')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>{t('Currency Code')}</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.code} 
                                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                placeholder="e.g. USD"
                                disabled={editingCurrency}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Symbol')}</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.symbol} 
                                onChange={e => setFormData({...formData, symbol: e.target.value})}
                                placeholder="e.g. $"
                            />
                        </div>
                        <div className="form-group col-span-2">
                            <label>{t('Name')}</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. US Dollar"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Exchange Rate')}</label>
                            <input 
                                type="number" 
                                step="0.0001" 
                                required 
                                value={formData.exchangeRate} 
                                onChange={e => setFormData({...formData, exchangeRate: parseFloat(e.target.value) || 0})}
                            />
                        </div>
                        <div className="flex flex-col gap-2 pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.baseCurrency} 
                                    onChange={e => setFormData({...formData, baseCurrency: e.target.checked})}
                                />
                                <span className="text-sm font-semibold">{t('Base Currency')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.active} 
                                    onChange={e => setFormData({...formData, active: e.target.checked})}
                                />
                                <span className="text-sm font-semibold">{t('Active')}</span>
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">{t('Cancel')}</button>
                        <button type="submit" className="btn-primary">{t('Save')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Currencies;
