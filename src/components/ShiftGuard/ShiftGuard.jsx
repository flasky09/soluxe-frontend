import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import shiftService from '../../services/shiftService';
import { Clock, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const ShiftGuard = ({ children }) => {
    const { user } = useAuthStore();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [hasActiveShift, setHasActiveShift] = useState(true); // Default to true to prevent flickering
    const [loading, setLoading] = useState(true);

    const isReceptionist = user?.roles?.some(r => r === 'ROLE_RECEPTIONIST' || r === 'RECEPTIONIST');
    const isHandoverPage = location.pathname === '/shift-handover';

    useEffect(() => {
        if (isReceptionist && !isHandoverPage) {
            checkShift();
        } else {
            setLoading(false);
        }
    }, [location.pathname, isReceptionist, isHandoverPage]);

    const checkShift = async () => {
        try {
            const current = await shiftService.getCurrentShift();
            setHasActiveShift(!!current);
        } catch (error) {
            console.error('Error checking shift:', error);
            setHasActiveShift(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    if (isReceptionist && !hasActiveShift && !isHandoverPage) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                    <div className="bg-maroon p-8 flex justify-center">
                        <div className="bg-white/20 p-4 rounded-full">
                            <Clock className="text-white h-12 w-12 animate-pulse" />
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">{t('Shift Clock-In Required')}</h2>
                            <p className="text-slate-500">
                                {t('You must clock in for your shift before you can access the system operations.')}
                            </p>
                        </div>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-left">
                            <AlertTriangle className="text-amber-600 h-5 w-5 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                {t('This is a security policy to ensure your sales and activities are correctly tracked.')}
                            </p>
                        </div>

                        <button 
                            onClick={() => navigate('/shift-handover')}
                            className="w-full bg-maroon text-white font-bold py-4 rounded-xl shadow-lg shadow-maroon/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowRightLeft size={20} />
                            {t('Go to Shift Handover')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default ShiftGuard;
