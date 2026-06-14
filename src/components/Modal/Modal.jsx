import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    size = 'md', 
    children, 
    customClasses = '',
    overlayClasses = ''
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        'sm': '!w-[85%] !max-w-[500px]',
        'md': '!w-[85%] !max-w-[800px]',
        'lg': '!w-[95%] !max-w-[1000px]',
        'xl': '!w-[95%] !max-w-[1200px]',
        'full': '!w-[95%] !max-w-[1400px]',
        'none': ''
    };

    return (
        <div className={`modal-overlay ${overlayClasses}`} onClick={onClose}>
            <div 
                className={`modal-content premium-card ${sizeClasses[size]} ${customClasses}`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="modal-header">
                        <h2 className="text-xl font-bold text-primary">{title}</h2>
                        <button className="close-modal-btn" type="button" onClick={onClose}>
                            &times;
                        </button>
                    </div>
                )}
                
                {children}
            </div>
        </div>
    );
};

export default Modal;
