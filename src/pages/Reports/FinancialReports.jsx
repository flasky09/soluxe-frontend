import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../services/formatters';

// ─── Tab Button ───────────────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border
            ${active
                ? 'bg-yellow text-maroon border-yellow shadow-lg shadow-yellow/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-maroon/30 hover:text-maroon'
            }`}
    >
        {label}
    </button>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
    <div className={`premium-card p-5 flex flex-col gap-1 border-l-4 ${accent || 'border-l-primary'}`}>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-3xl font-extrabold text-primary">{value}</div>
        {sub && <div className="text-[12px] text-slate-400 font-medium">{sub}</div>}
    </div>
);

// ─── Section Wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, period, children }) => (
    <div className="flex flex-col gap-6">
        <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-extrabold text-slate-800">{title}</h2>
            {period && <span className="text-xs font-semibold text-slate-400 italic">({period})</span>}
        </div>
        {children}
    </div>
);

// ─── Loading Placeholder ──────────────────────────────────────────────────────
const LoadingRow = () => (
    <tr><td colSpan="20" className="py-16 text-center text-slate-400 italic">Loading data…</td></tr>
);

// ─── Currency badge colors ────────────────────────────────────────────────────
const CURRENCY_COLORS = {
    USD:     'bg-green-100 text-green-700',
    CNY:     'bg-red-100 text-red-700',
    EUR:     'bg-blue-100 text-blue-700',
    VOUCHER: 'bg-purple-100 text-purple-700',
    POS:     'bg-amber-100 text-amber-700',
};

// ─────────────────────────────────────────────────────────────────────────────
//  FINANCIAL REPORTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
const FinancialReports = () => {
    const getFirstOfMonth = () => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    };

    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('summary');
    const [startDate, setStartDate] = useState(getFirstOfMonth());
    const [endDate,   setEndDate]   = useState(new Date().toISOString().split('T')[0]);

    // Filters (request #2 — multi-currency / payment method)
    const [currencyFilter, setCurrencyFilter]   = useState('ALL');
    const [payMethodFilter, setPayMethodFilter] = useState('ALL');

    // Data
    const [revenue,       setRevenue]       = useState(null);
    const [revenueByType, setRevenueByType] = useState({});
    const [fetchedCurrencies, setFetchedCurrencies] = useState([]);
    const [loading,       setLoading]       = useState(true);

    const today = new Date().toISOString().split('T')[0];
    const periodLabel = startDate === endDate
        ? formatDate(startDate)
        : `${formatDate(startDate)} → ${formatDate(endDate)}`;

    // ── Fetch ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [revRes, currRes] = await Promise.allSettled([
                    api.get(`/reports/revenue-report?startDate=${startDate}&endDate=${endDate}`),
                    api.get('/currencies/active')
                ]);
                if (revRes.status === 'fulfilled') {
                    setRevenue(revRes.value.data);
                    setRevenueByType(revRes.value.data?.revenueByChargeType || {});
                }
                if (currRes.status === 'fulfilled') {
                    setFetchedCurrencies(currRes.value.data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [startDate, endDate]);

    // ── CSV Export ────────────────────────────────────────────────────────────
    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        let rows = Array.isArray(data) ? data : [data];
        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => headers.map(h => {
                const val = row[h] === null || row[h] === undefined ? '' : row[h];
                return `"${val.toString().replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${today}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── Filter ledger entries ─────────────────────────────────────────────────
    const allLedger = revenue?.auditTray || [];
    const filteredLedger = allLedger.filter(item => {
        const currencyOk   = currencyFilter   === 'ALL' || (item.currency   || 'USD') === currencyFilter;
        const payMethodOk  = payMethodFilter  === 'ALL' || (item.paymentMethod || '').toUpperCase().includes(payMethodFilter);
        return currencyOk && payMethodOk;
    });

    // ── Derived totals from filtered ledger ───────────────────────────────────
    const filteredRevenue    = filteredLedger.filter(i => i.type === 'REVENUE' || i.type === 'COLLECTION').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const filteredExpenses   = filteredLedger.filter(i => i.type !== 'REVENUE' && i.type !== 'COLLECTION').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

    const tabs = [
        { id: 'summary', label: t('Financial Summary') },
        { id: 'ledger',  label: t('General Ledger') },
    ];
    
    // Dynamic currencies + common non-currency methods like VOUCHER/POS if they exist
    const reportCurrencies = ['ALL', 'USD', ...fetchedCurrencies.filter(c => c.code !== 'USD').map(c => c.code)];
    const payMethods       = ['ALL', 'CASH', 'CARD', 'TRANSFER', 'VOUCHER'];

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-financial, #print-financial * { visibility: visible; }
                    #print-financial { position: fixed; top: 0; left: 0; width: 100%; padding: 2rem; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div id="print-financial" className="flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div>
                        <h1 className="text-2xl font-black text-text-dark tracking-tight">{t('Financial Reports')}</h1>
                        <p className="text-text-slate mt-1">{t('Period')}: {periodLabel}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn-secondary !bg-white !px-5 border border-slate-200 flex items-center gap-2"
                            onClick={() => {
                                if (activeTab === 'summary') downloadCSV(revenue ? [revenue] : [], 'financial_summary');
                                else downloadCSV(filteredLedger, 'ledger_report');
                            }}
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

                {/* Date Range */}
                <div className="flex flex-wrap items-center gap-4 no-print mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Start Date')}:</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('End Date')}:</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                    </div>
                </div>

                {/* Multi-currency / Payment Method Filters (request #2) */}
                <div className="flex flex-wrap items-center gap-3 no-print mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Currency')}:</span>
                        <div className="flex flex-wrap gap-1">
                            {reportCurrencies.map(c => (
                                <button key={c}
                                    onClick={() => setCurrencyFilter(c)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all duration-150
                                        ${currencyFilter === c
                                            ? (CURRENCY_COLORS[c] || 'bg-primary text-white') + ' border-transparent ring-2 ring-primary/20'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                        }`}
                                >
                                    {c === 'ALL' ? t('All Currencies') : c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Method')}:</span>
                        <div className="flex flex-wrap gap-1">
                            {payMethods.map(m => (
                                <button key={m}
                                    onClick={() => setPayMethodFilter(m)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all duration-150
                                        ${payMethodFilter === m
                                            ? 'bg-maroon text-white border-maroon'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                        }`}
                                >
                                    {m === 'ALL' ? t('All Methods') : t(m)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 flex-wrap mb-6 no-print">
                    {tabs.map(tab => (
                        <TabBtn key={tab.id} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
                    ))}
                </div>

                {/* ── Summary Tab ─────────────────────────────────────────── */}
                {activeTab === 'summary' && (
                    <Section title={t('Financial Performance Overview')} period={periodLabel}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard label={t('Gross Revenue')}      value={`$ ${parseFloat(revenue?.totalRevenue   || 0).toLocaleString()}`} sub={`${t('Net')}: $ ${parseFloat(revenue?.netRevenue || 0).toLocaleString()}`}                                                                 accent="border-l-green-500" />
                            <StatCard label={t('Total Collections')}  value={`$ ${parseFloat(revenue?.totalPayments  || 0).toLocaleString()}`} sub={t('Actual cash received')}                                                                                                                accent="border-l-blue-500" />
                            <StatCard label={t('Total Expenses')}     value={`$ ${parseFloat(revenue?.totalExpenses  || 0).toLocaleString()}`} sub={`${t('OpEx')}: $ ${parseFloat(revenue?.operationalExpenses || 0).toLocaleString()}`}                                                      accent="border-l-red-500" />
                            <StatCard label={t('Net Cash Flow')}      value={`$ ${((parseFloat(revenue?.totalPayments || 0)) - (parseFloat(revenue?.totalExpenses || 0))).toLocaleString()}`}                                        sub={t('Collections - Expenses')}                           accent="border-l-indigo-500" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
                            <StatCard label={t('Accounts Receivable')} value={`$ ${parseFloat(revenue?.accountsReceivable || 0).toLocaleString()}`} sub={t('Pending from closed folios')} accent="border-l-amber-500" />
                            <StatCard label={t('Accounts Payable')}    value={`$ ${parseFloat(revenue?.accountsPayable    || 0).toLocaleString()}`} sub={t('Unpaid purchase orders')}      accent="border-l-slate-400" />
                            <StatCard label={t('Supply Costs')}        value={`$ ${parseFloat(revenue?.supplyCosts         || 0).toLocaleString()}`} sub={t('Procurement & Inventory')}    accent="border-l-rose-400" />
                        </div>

                        {/* Revenue by currency summary (derived from filter selection) */}
                        {(currencyFilter !== 'ALL' || payMethodFilter !== 'ALL') && (
                            <div className="premium-card p-5 mt-2 border border-dashed border-primary/20 bg-primary/5">
                                <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-3">
                                    {t('Filtered Totals')} — {currencyFilter !== 'ALL' ? currencyFilter : t('All Currencies')} / {payMethodFilter !== 'ALL' ? t(payMethodFilter) : t('All Methods')}
                                </p>
                                <div className="flex flex-wrap gap-6">
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase">{t('Revenue')}</p>
                                        <p className="text-2xl font-extrabold text-green-600">$ {filteredRevenue.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase">{t('Expenses')}</p>
                                        <p className="text-2xl font-extrabold text-red-600">$ {filteredExpenses.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase">{t('Net')}</p>
                                        <p className={`text-2xl font-extrabold ${(filteredRevenue - filteredExpenses) >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                                            $ {(filteredRevenue - filteredExpenses).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                            {/* Revenue Distribution */}
                            <div className="premium-card p-6">
                                <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                                    {t('Revenue Distribution')}
                                    <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded-full uppercase">{t('Details')}</span>
                                </h3>
                                {Object.keys(revenueByType).length === 0 ? (
                                    <p className="py-10 text-center text-slate-400 italic text-sm">{t('No charges recorded for this period.')}</p>
                                ) : (
                                    <div className="overflow-x-auto w-full">
                                        <table className="management-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('Category')}</th>
                                                    <th className="text-right">{t('Amount ($)')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(revenueByType).map(([type, amount]) => (
                                                    <tr key={type}>
                                                        <td className="capitalize font-medium text-slate-600">{type.replace(/_/g, ' ').toLowerCase()}</td>
                                                        <td className="text-right font-black text-slate-800">{parseFloat(amount).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Asset & Liability */}
                            <div className="premium-card p-6">
                                <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                                    {t('Asset & Liability Summary')}
                                    <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-full uppercase">{t('Balance')}</span>
                                </h3>
                                <div className="space-y-4 pt-2">
                                    {[
                                        [t('Capital Assets Purchased'), revenue?.totalAssets],
                                        [t('Maintenance Reserve'),       revenue?.maintenanceCosts],
                                        [t('Petty Cash Balance'),        revenue?.pettyCash],
                                        [t('Total Payroll Obligations'), revenue?.payrollExpenses],
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                            <span className="text-sm font-semibold text-slate-600">{label}</span>
                                            <span className="font-bold text-slate-800">$ {parseFloat(val || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

                {/* ── Ledger Tab ───────────────────────────────────────────── */}
                {activeTab === 'ledger' && (
                    <Section title={t('Financial Transaction Ledger')} period={periodLabel}>
                        {(currencyFilter !== 'ALL' || payMethodFilter !== 'ALL') && (
                            <div className="text-[12px] text-primary font-semibold bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 mb-2 no-print">
                                {t('Showing')} {filteredLedger.length} {t('of')} {allLedger.length} {t('entries')} — {currencyFilter !== 'ALL' ? currencyFilter : ''} {payMethodFilter !== 'ALL' ? `/ ${t(payMethodFilter)}` : ''}
                            </div>
                        )}
                        <div className="premium-card overflow-hidden">
                            <div className="overflow-x-auto w-full">
                                <table className="management-table">
                                    <thead>
                                        <tr>
                                            <th>{t('Date & Time')}</th>
                                            <th>{t('Type')}</th>
                                            <th>{t('Account / Reference')}</th>
                                            <th>{t('Description')}</th>
                                            <th>{t('Currency')}</th>
                                            <th>{t('Method')}</th>
                                            <th className="text-right">{t('Amount ($)')}</th>
                                            <th className="text-right">{t('Running Balance ($)')}</th>
                                            <th className="text-center">{t('Status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? <LoadingRow /> : filteredLedger.length === 0 ? (
                                            <tr><td colSpan="9" className="py-16 text-center text-slate-400 italic">{t('No ledger entries for this period.')}</td></tr>
                                        ) : filteredLedger.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="whitespace-nowrap text-[12px] font-medium text-slate-500">{new Date(item.timestamp).toLocaleString()}</td>
                                                <td>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                                                        ${item.type === 'REVENUE' || item.type === 'COLLECTION' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {t(item.type)}
                                                    </span>
                                                </td>
                                                <td className="font-semibold text-slate-700">{item.account}</td>
                                                <td className="text-[13px] text-slate-600 max-w-xs truncate">{item.description}</td>
                                                <td>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${CURRENCY_COLORS[item.currency || 'USD'] || 'bg-slate-100 text-slate-600'}`}>
                                                        {item.currency || 'USD'}
                                                    </span>
                                                </td>
                                                <td className="text-[12px] font-medium text-slate-500 capitalize">
                                                    {item.paymentMethod || '—'}
                                                </td>
                                                <td className={`text-right font-bold ${item.type === 'REVENUE' || item.type === 'COLLECTION' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {item.type === 'REVENUE' || item.type === 'COLLECTION' ? '+' : '-'}{parseFloat(item.amount).toLocaleString()}
                                                </td>
                                                <td className="text-right font-black text-slate-800">
                                                    {parseFloat(item.runningBalance).toLocaleString()}
                                                </td>
                                                <td className="text-center">
                                                    <span className="text-[11px] font-bold text-slate-400">{t(item.status)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Section>
                )}
            </div>
        </>
    );
};

export default FinancialReports;
