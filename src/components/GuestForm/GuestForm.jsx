import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Camera, X, Check } from 'lucide-react';
import api from '../../services/api';

const GuestForm = ({ initialData, onSuccess, onCancel, isSaving: externalIsSaving, isQuickMode = false }) => {
    const [formData, setFormData] = useState(initialData || {
        fullName: '', phone: '', email: '', nationality: '', dateOfBirth: '', gender: 'MALE', 
        idType: 'NATIONAL_ID', idNumber: '', address: '', companyName: '', 
        preferences: '', vehicleRegistration: '', emergencyContactName: '', emergencyContactPhone: '', imageUrl: ''
    });
    const [uploading, setUploading] = useState(false);
    const [serverErrors, setServerErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [docLoading, setDocLoading] = useState(false);
    
    const fetchDocuments = useCallback(async () => {
        try {
            const res = await api.get(`/guests/${formData.id}/documents`);
            setDocuments(res.data);
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        }
    }, [formData.id]);

    useEffect(() => {
        if (formData.id) {
            fetchDocuments();
        }
    }, [formData.id, fetchDocuments]);

    const handleDocUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('type', 'ID'); // Defaulting to ID for now
        
        setDocLoading(true);
        try {
            await api.post(`/guests/${formData.id}/documents`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchDocuments();
        } catch (err) {
            console.error('Doc upload failed:', err);
            alert('Failed to upload document.');
        } finally {
            setDocLoading(false);
        }
    };
    
    // Camera state
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const idTypes = [
        { value: 'NATIONAL_ID', label: 'National ID' },
        { value: 'PASSPORT', label: 'Passport' }
    ];

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            setIsCameraOpen(true);
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access camera. Please ensure you have given permission.');
        }
    };

    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = async () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], "guest-photo.jpg", { type: "image/jpeg" });
            await uploadFile(file);
            stopCamera();
        }, 'image/jpeg', 0.8);
    };

    const uploadFile = async (file) => {
        setUploading(true);
        try {
            // 1. Get signature from backend
            const folder = 'soluxe-hotel';
            const { data: sigData } = await api.get('/cloudinary/signature', {
                params: { folder }
            });
            
            // 2. Upload to Cloudinary
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('api_key', sigData.api_key);
            uploadData.append('timestamp', sigData.timestamp);
            uploadData.append('signature', sigData.signature);
            uploadData.append('folder', folder);
            
            const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
                method: 'POST',
                body: uploadData
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                console.error('Cloudinary error details:', errorData);
                throw new Error(errorData.error?.message || 'Cloudinary upload failed');
            }
            
            const data = await res.json();
            setFormData({ ...formData, imageUrl: data.secure_url });
        } catch (err) {
            console.error('Upload failed:', err);
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) uploadFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setServerErrors({});
        try {
            let res;
            if (formData.id) {
                res = await api.put(`/guests/${formData.id}`, formData);
            } else {
                res = await api.post('/guests', formData);
            }
            onSuccess(res.data);
        } catch (err) {
            console.error('Failed to save guest:', err);
            if (err.response && (err.response.status === 400 || err.response.status === 409)) {
                setServerErrors(err.response.data);
            } else {
                alert('Failed to save guest profile.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
            {serverErrors.error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                    {serverErrors.error}
                </div>
            )}
            <div className="form-grid">
                {/* Profile Image Row */}
                <div className="col-span-full border-b border-slate-100 pb-6 mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Profile Picture</label>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-slate-300 text-3xl"><User size={48} /></div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <label className="btn-secondary !py-2 !px-4 text-xs cursor-pointer inline-flex items-center gap-2">
                                    <User size={14} />
                                    {formData.imageUrl ? 'Change Photo' : 'Upload Photo'}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                                <button 
                                    type="button" 
                                    className="btn-secondary !py-2 !px-4 text-xs inline-flex items-center gap-2"
                                    onClick={() => isCameraOpen ? stopCamera() : startCamera()}
                                    disabled={uploading}
                                >
                                    <Camera size={14} />
                                    {isCameraOpen ? 'Close Camera' : 'Take Photo'}
                                </button>
                            </div>
                            <p className="text-[11px] text-text-slate leading-relaxed max-w-[200px]">Use a local file or take a picture directly.</p>
                        </div>
                    </div>

                    {isCameraOpen && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center gap-4">
                            <div className="relative w-full max-w-[320px] aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={capturePhoto} className="btn-primary !rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                    <Camera size={20} />
                                </button>
                                <button type="button" onClick={stopCamera} className="btn-secondary !rounded-full w-12 h-12 flex items-center justify-center bg-white">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-group leading-tight">
                    <label>Full Name</label>
                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="John Doe" />
                    {serverErrors.fullName && <p className="text-red-500 text-[10px] mt-1">{serverErrors.fullName}</p>}
                </div>
                <div className="form-group leading-tight">
                    <label>Email Address {isQuickMode && <span className="text-slate-400 font-normal text-[10px]">(optional)</span>}</label>
                    <input type="email" required={!isQuickMode} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                    {serverErrors.email && <p className="text-red-500 text-[10px] mt-1">{serverErrors.email}</p>}
                </div>
                <div className="form-group leading-tight">
                    <label>Company Name</label>
                    <input type="text" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder="Optional: Corporate Guest" />
                </div>
                <div className="form-group leading-tight">
                    <label>Phone Number</label>
                    <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 890" />
                    {serverErrors.phone && <p className="text-red-500 text-[10px] mt-1">{serverErrors.phone}</p>}
                </div>
                <div className="form-group leading-tight">
                    <label>Nationality</label>
                    <input type="text" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} placeholder="e.g. American" />
                </div>
                <div className="form-group leading-tight">
                    <label>Date of Birth</label>
                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} />
                </div>
                <div className="form-group leading-tight">
                    <label>Gender</label>
                    <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
                <div className="form-group leading-tight">
                    <label>ID Type</label>
                    <select required value={formData.idType} onChange={(e) => setFormData({...formData, idType: e.target.value})}>
                        {idTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group leading-tight">
                    <label>Passport/ID No</label>
                    <input type="text" required value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} placeholder="ID Number" />
                    {serverErrors.idNumber && <p className="text-red-500 text-[10px] mt-1">{serverErrors.idNumber}</p>}
                </div>
                <div className="form-group leading-tight">
                    <label>Vehicle Registration</label>
                    <input type="text" value={formData.vehicleRegistration} onChange={(e) => setFormData({...formData, vehicleRegistration: e.target.value})} placeholder="e.g. ABC-1234" />
                </div>
                <div className="form-group leading-tight">
                    <label>Emergency Contact Name</label>
                    <input type="text" value={formData.emergencyContactName} onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})} placeholder="Full Name" />
                </div>
                <div className="form-group leading-tight">
                    <label>Emergency Contact Phone</label>
                    <input type="text" value={formData.emergencyContactPhone} onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})} placeholder="+254..." />
                </div>

                <div className="form-group full-width leading-tight">
                    <label>Special Requirements / Preferences</label>
                    <textarea 
                        value={formData.preferences} 
                        onChange={(e) => setFormData({...formData, preferences: e.target.value})} 
                        placeholder="Allergies, room preferences, dietary restrictions..."
                        className="min-h-[80px]"
                    />
                </div>
                <div className="form-group full-width leading-tight">
                    <label>Address</label>
                    <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Full physical address..." className="min-h-[60px]" rows="2" />
                </div>

                {/* Documents Section */}
                {formData.id && (
                    <div className="col-span-full mt-6 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guest Documents (ID/Passport)</label>
                            <label className="btn-secondary !py-1 !px-3 text-[10px] cursor-pointer inline-flex items-center gap-2">
                                + Upload New
                                <input type="file" className="hidden" onChange={handleDocUpload} disabled={docLoading} />
                            </label>
                        </div>
                        
                        {docLoading ? (
                            <div className="text-center py-4 text-xs text-slate-400 italic">Uploading...</div>
                        ) : documents.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {documents.map(doc => (
                                    <div key={doc.id} className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-200 rounded-xl min-w-[140px]">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{doc.documentType}</span>
                                        <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{doc.fileName}</span>
                                        <a href={doc.filePath} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary mt-1 hover:underline">View Document</a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No documents uploaded for this guest.</p>
                        )}
                    </div>
                )}
            </div>
            <div className="modal-footer">
                <button type="button" onClick={onCancel} className="btn-secondary !px-10">Cancel</button>
                <button type="submit" className="btn-primary !px-10" disabled={isSaving || externalIsSaving}>
                    {isSaving || externalIsSaving ? 'Processing...' : formData.id ? 'Update Guest' : 'Save Guest Profile'}
                </button>
            </div>
        </form>
    );
};

export default GuestForm;
