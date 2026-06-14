import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {  } from '../../services/formatters';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
    <div className={`premium-card p-5 flex flex-col gap-1 border-l-4 ${accent || 'border-l-primary'}`}>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-3xl font-extrabold text-primary">{value}</div>
        {sub && <div className="text-[12px] text-slate-400 font-medium">{sub}</div>}
    </div>
);

// ─── Loading Placeholder ──────────────────────────────────────────────────────
const LoadingRow = () => (
    <tr><td colSpan="20" className="py-16 text-center text-slate-400 italic">Loading data…</td></tr>
);

// ─────────────────────────────────────────────────────────────────────────────
//  GENERAL REPORTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
const GeneralReports = () => {
    const { t } = useLanguage();

    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [reservations, setReservations] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [staffPerformance, setStaffPerformance] = useState([]);
    const [roomReport, setRoomReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                const val = row[h] === null || row[h] === undefined ? '' : row[h];
                return `"${val.toString().replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${today}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [resRes, , roomRes, staffRes, roomReportRes] = await Promise.allSettled([
                api.get('/reservations'),
                api.get('/guests'),
                api.get('/rooms'),
                api.get(`/reports/user-performance?startDate=${startDate}&endDate=${endDate}`),
                api.get(`/reports/room-report?startDate=${startDate}&endDate=${endDate}`)
            ]);
            if (resRes.status === 'fulfilled') setReservations(resRes.value.data || []);
            if (roomRes.status === 'fulfilled') setRooms(roomRes.value.data || []);
            if (staffRes.status === 'fulfilled') setStaffPerformance(staffRes.value.data || []);
            if (roomReportRes.status === 'fulfilled') setRoomReport(roomReportRes.value.data || null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [startDate, endDate]);

    // Reservation status breakdown
    const statusGroups = reservations.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-general, #print-general * { visibility: visible; }
                    #print-general { position: fixed; top: 0; left: 0; width: 100%; padding: 2rem; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div id="print-general" className="flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div>
                        <h1 className="text-2xl font-black text-text-dark">{t('Management Reports')}</h1>
                        <p className="text-text-slate mt-1">{t('Performance and operational snapshot')}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn-secondary !bg-white !px-5 border border-slate-200 flex items-center gap-2"
                            onClick={() => downloadCSV(reservations, 'reservations_report')}
                        >
                            <FileText size={16} />
                            {t('Export CSV')}
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="btn-secondary !px-5 transition-all hover:bg-maroon hover:text-white"
                        >
                            {t('Print Report')}
                        </button>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="flex flex-wrap items-center gap-4 no-print mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Start Date')}:</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('End Date')}:</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <button onClick={fetchAll} className="btn-primary !py-2 !px-6 ml-auto">{t('Refresh Reports')}</button>
                </div>

                {/* KPI Row - Periodic Performance */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <StatCard 
                        label={t('Occupancy Rate')} 
                        value={roomReport ? `${roomReport.occupancyRate.toFixed(1)}%` : '—'} 
                        sub={roomReport ? `${roomReport.occupiedRooms} / ${roomReport.totalRooms} ${t('rooms')}` : 'Calculating...'} 
                        accent="border-l-indigo-500" 
                    />
                    <StatCard 
                        label={t('ADR')} 
                        value={roomReport ? `$ ${roomReport.adr.toLocaleString()}` : '—'} 
                        sub={t('Average Daily Rate')} 
                        accent="border-l-blue-500" 
                    />
                    <StatCard 
                        label={t('RevPAR')} 
                        value={roomReport ? `$ ${roomReport.revPar.toLocaleString()}` : '—'} 
                        sub={t('Revenue Per Available Room')} 
                        accent="border-l-amber-500" 
                    />
                    <StatCard 
                        label={t('Period Revenue')} 
                        value={roomReport ? `$ ${roomReport.totalRevenue.toLocaleString()}` : '—'} 
                        sub={t('Total room charges')} 
                        accent="border-l-green-500" 
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8 bg-white p-5 rounded-2xl border border-slate-100">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Arrivals')}</span>
                        <span className="text-xl font-black text-slate-700">{roomReport?.checkIns || 0}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Departures')}</span>
                        <span className="text-xl font-black text-slate-700">{roomReport?.checkOuts || 0}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('In House Stays')}</span>
                        <span className="text-xl font-black text-slate-700">{roomReport?.occupiedRooms || 0}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Total Rooms')}</span>
                        <span className="text-xl font-black text-slate-700">{roomReport?.totalRooms || 0}</span>
                    </div>
                </div>

                {/* Staff Performance Section */}
                <div className="premium-card mb-8">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{t('Receptionist Performance Report')}</h3>
                            <p className="text-[11px] text-slate-400 font-medium">{t('Financial collections and client volume by user')}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>{t('Receptionist')}</th>
                                    <th className="text-center">{t('Check-ins')}</th>
                                    <th className="text-center">{t('Check-outs')}</th>
                                    <th className="text-center">{t('Clients Served')}</th>
                                    <th className="text-right">{t('Total Collected')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <LoadingRow /> : staffPerformance.map(sp => (
                                    <tr key={sp.userId} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="font-semibold text-slate-700">
                                            {sp.fullName} <span className="text-sm font-normal text-slate-400">({sp.username})</span>
                                        </td>
                                        <td className="text-center font-bold text-blue-600">{sp.checkIns}</td>
                                        <td className="text-center font-bold text-slate-500">{sp.checkOuts}</td>
                                        <td className="text-center font-bold text-indigo-600">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs">{sp.clientsServed}</span>
                                        </td>
                                        <td className="text-right font-black text-primary">
                                            ${(sp.totalCollected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {!loading && staffPerformance.length === 0 && (
                                    <tr><td colSpan="5" className="text-center text-slate-400 py-12 italic">{t('No performance data for this period.')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Operational snapshot */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="premium-card p-6">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
                            {t('Reservation Status')}
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(statusGroups).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <span className={`status-badge ${status.toLowerCase()}`}>{t(status)}</span>
                                    <span className="font-bold text-slate-800">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 premium-card p-6">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
                            {t('Room Status Overview')}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {['AVAILABLE', 'OCCUPIED', 'ACTIVE', 'DIRTY', 'MAINTENANCE', 'OUT_OF_ORDER'].map(s => {
                                const count = rooms.filter(r => r.status === s).length;
                                return (
                                    <div key={s} className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                                        <span className={`status-badge ${s.toLowerCase()} text-[10px]`}>{t(s)}</span>
                                        <span className="text-2xl font-extrabold text-slate-800">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GeneralReports;
