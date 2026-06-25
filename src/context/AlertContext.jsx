import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle, X } from 'lucide-react';

const AlertContext = createContext(null);

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // 'success' | 'error' | 'warning' | 'info' | 'question'
        isConfirm: false,
        resolvePromise: null,
    });

    const alert = (message, title = 'Alert', type = 'info') => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                title,
                message,
                type,
                isConfirm: false,
                resolvePromise: resolve,
            });
        });
    };

    const confirm = (message, title = 'Confirm', type = 'warning') => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                title,
                message,
                type,
                isConfirm: true,
                resolvePromise: resolve,
            });
        });
    };

    const handleClose = (value) => {
        if (modalState.resolvePromise) {
            modalState.resolvePromise(value);
        }
        setModalState(prev => ({ ...prev, isOpen: false, resolvePromise: null }));
    };

    // Helper to render type-specific icons and colors
    const renderIcon = () => {
        const size = 40;
        switch (modalState.type) {
            case 'success':
                return <CheckCircle2 className="text-emerald-500" size={size} />;
            case 'error':
                return <XCircle className="text-red-500" size={size} />;
            case 'warning':
                return <AlertTriangle className="text-amber-500" size={size} />;
            case 'question':
                return <HelpCircle className="text-indigo-500" size={size} />;
            case 'info':
            default:
                return <Info className="text-blue-500" size={size} />;
        }
    };

    return (
        <AlertContext.Provider value={{ alert, confirm }}>
            {children}
            {modalState.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-[450px] w-full overflow-hidden flex flex-col p-6 relative animate-in fade-in zoom-in duration-200">
                        <button 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            onClick={() => handleClose(false)}
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="flex flex-col items-center text-center mt-4">
                            <div className="mb-4 p-3 bg-slate-50 rounded-2xl">
                                {renderIcon()}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                {modalState.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap px-2">
                                {modalState.message}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 mt-8">
                            {modalState.isConfirm ? (
                                <>
                                    <button
                                        onClick={() => handleClose(false)}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-2xl transition-all text-sm cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleClose(true)}
                                        className={`flex-1 font-bold py-3 rounded-2xl transition-all text-sm text-white cursor-pointer ${
                                            modalState.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                                            modalState.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                            modalState.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' :
                                            'bg-maroon hover:bg-[#6b0f11]'
                                        }`}
                                    >
                                        Confirm
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleClose(true)}
                                    className="w-full bg-maroon hover:bg-[#6b0f11] text-white font-bold py-3 rounded-2xl transition-all text-sm cursor-pointer"
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
};
