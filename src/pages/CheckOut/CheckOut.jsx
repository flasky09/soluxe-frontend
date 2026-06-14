                            <button className="close-modal-btn" onClick={() => setShowExtensionModal(false)}>&times;</button>
                        </div>
                        <div className="p-8">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 flex items-center justify-between shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-maroon/20 blur-[60px] rounded-full -mr-10 -mt-10"></div>
                                <div className="flex flex-col relative z-10">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Current Check-out</p>
                                    <p className="text-3xl font-black text-white leading-none">{formatDate(selectedStay.dateOut)}</p>
                                    <p className="text-[11px] text-white/60 font-medium mt-3">Room {getRoomNumber(selectedStay.roomId)} • {getGuestName(selectedStay.guestId)}</p>
                                </div>
                                <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center relative z-10">
                                    <FileText className="text-maroon-light" size={28} />
                                </div>
                            </div>

                            <form onSubmit={handleExtendStay} className="space-y-8">
                                <div className="form-group">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] mb-3 block">New Departure Date</label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            required
                                            min={selectedStay.dateOut.split('T')[0]}
                                            className="w-full !py-4 !px-6 !rounded-2xl !border-slate-200 !text-lg font-black text-slate-900 focus:!border-maroon transition-all shadow-sm"
                                            value={extensionDate}
                                            onChange={e => setExtensionDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-start gap-3 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="w-5 h-5 bg-maroon/10 rounded-full flex items-center justify-center text-maroon shrink-0 mt-0.5">
                                            <span className="font-bold text-[10px]">i</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                                            Extending the stay will automatically post room charges for the added nights based on the current nightly rate.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowExtensionModal(false)} 
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-[2] bg-maroon hover:bg-[#6b0f11] text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-maroon/20 transition-all flex items-center justify-center gap-2"
                                        disabled={extensionLoading}
                                    >
                                        {extensionLoading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Processing...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <CheckCircle size={20} /> Confirm Extension
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </Modal>
            {/* Post Charge Modal */}
            <Modal
                isOpen={showPostChargeModal}
                onClose={() => setShowPostChargeModal(false)}
                title={<span className="flex items-center gap-2"><Plus className="text-maroon" /> Post Charge to #{folio?.id?.toString().padStart(5, '0')}</span>}
                size="md"
                customClasses="!w-[85%] !max-w-[700px]"
            >
                <form onSubmit={handlePostCharge}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>{t('Charge Type')}</label>
                            <select required value={newCharge.chargeTypeId} onChange={(e) => setNewCharge({...newCharge, chargeTypeId: e.target.value})}>
                                <option value="">{t('Select Charge Type')}</option>
                                {chargeTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group full-width">
                            <label>{t('Description')}</label>
                            <input type="text" required value={newCharge.description} onChange={(e) => setNewCharge({...newCharge, description: e.target.value})} placeholder="e.g. Minibar, Restaurant" />
                        </div>
                        <div className="form-group">
                            <label>{t('Quantity')}</label>
                            <input type="number" step="0.01" required value={newCharge.quantity} onChange={(e) => setNewCharge({...newCharge, quantity: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="form-group">
                            <label>{t('Unit Price ($)')}</label>
                            <input type="number" step="0.01" required value={newCharge.unitPrice} onChange={(e) => setNewCharge({...newCharge, unitPrice: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>
                    <div className="modal-footer mt-6">
                        <button type="button" onClick={() => setShowPostChargeModal(false)} className="btn-secondary !px-8">{t('Cancel')}</button>
                        <button type="submit" className="btn-primary !px-8">{t('Submit Charge')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CheckOut;
