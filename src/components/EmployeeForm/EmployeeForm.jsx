import React, { useState } from 'react';
import api from '../../services/api';
import { User, Mail, Phone, BadgeCheck, Briefcase, Building } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAlert } from '../../context/AlertContext';

const EmployeeForm = ({ initialData, onSuccess, onCancel }) => {
    const { t } = useLanguage();
    const { alert } = useAlert();
    const [formData, setFormData] = useState(initialData || {
        fullName: '',
        phone: '',
        email: '',
        designation: '',
        basicSalary: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        idType: 'NATIONAL_ID',
        idNumber: '',
        departmentId: 1
    });
    const [isSaving, setIsSaving] = useState(false);
    const [serverErrors, setServerErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setServerErrors({});
        try {
            if (formData.id) {
                await api.put(`/employees/${formData.id}`, formData);
            } else {
                await api.post('/employees', formData);
            }
            onSuccess();
        } catch (err) {
            console.error('Failed to save employee:', err);
            if (err.response?.data) {
                setServerErrors(err.response.data);
            } else {
                await alert('An error occurred while saving the employee.', 'Error', 'error');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="form-grid">
                <div className="form-group col-span-full mb-4">
                    <label className="flex items-center gap-2">
                        <User size={14} className="text-maroon" />
                        {t('Full Name')} *
                    </label>
                    <input 
                        type="text" 
                        name="fullName"
                        value={formData.fullName} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g. Jane Doe"
                    />
                    {serverErrors.fullName && <p className="text-red-500 text-[10px] mt-1">{serverErrors.fullName}</p>}
                </div>

                <div className="form-group">
                    <label className="flex items-center gap-2">
                        <Mail size={14} className="text-maroon" />
                        {t('Email Address')} *
                    </label>
                    <input 
                        type="email" 
                        name="email"
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                        placeholder="jane@example.com"
                    />
                    {serverErrors.email && <p className="text-red-500 text-[10px] mt-1">{serverErrors.email}</p>}
                </div>

                <div className="form-group">
                    <label className="flex items-center gap-2">
                        <Phone size={14} className="text-maroon" />
                        {t('Phone Number')} *
                    </label>
                    <input 
                        type="text" 
                        name="phone"
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                        placeholder="+254..."
                    />
                    {serverErrors.phone && <p className="text-red-500 text-[10px] mt-1">{serverErrors.phone}</p>}
                </div>

                <div className="form-group">
                    <label className="flex items-center gap-2">
                        <Briefcase size={14} className="text-maroon" />
                        {t('Designation')} *
                    </label>
                    <input 
                        type="text" 
                        name="designation"
                        value={formData.designation} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g. Front Desk Manager"
                    />
                </div>

                <div className="form-group">
                    <label className="flex items-center gap-2">
                        <Building size={14} className="text-maroon" />
                        {t('Department')}
                    </label>
                    <select name="departmentId" value={formData.departmentId} onChange={handleChange}>
                        <option value={1}>Front Desk</option>
                        <option value={2}>Housekeeping</option>
                        <option value={3}>Food & Beverage</option>
                        <option value={4}>Finance</option>
                        <option value={5}>HR</option>
                        <option value={6}>Maintenance</option>
                        <option value={7}>IT</option>
                        <option value={8}>Security</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>{t('ID Type')}</label>
                    <select name="idType" value={formData.idType} onChange={handleChange}>
                        <option value="NATIONAL_ID">National ID</option>
                        <option value="PASSPORT">Passport</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="flex items-center gap-2">
                        <BadgeCheck size={14} className="text-maroon" />
                        {t('ID Number')} *
                    </label>
                    <input 
                        type="text" 
                        name="idNumber"
                        value={formData.idNumber} 
                        onChange={handleChange} 
                        required 
                    />
                    {serverErrors.idNumber && <p className="text-red-500 text-[10px] mt-1">{serverErrors.idNumber}</p>}
                </div>

                <div className="form-group">
                    <label>{t('Date of Joining')}</label>
                    <input 
                        type="date" 
                        name="dateOfJoining"
                        value={formData.dateOfJoining} 
                        onChange={handleChange} 
                    />
                </div>

                <div className="form-group">
                    <label>{t('Basic Salary')}</label>
                    <input 
                        type="number" 
                        name="basicSalary"
                        value={formData.basicSalary} 
                        onChange={handleChange} 
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div className="modal-footer mt-8">
                <button type="button" onClick={onCancel} className="btn-secondary !px-10">
                    {t('Cancel')}
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary !px-10">
                    {isSaving ? t('Saving...') : formData.id ? t('Update Employee') : t('Add Employee')}
                </button>
            </div>
        </form>
    );
};

export default EmployeeForm;
