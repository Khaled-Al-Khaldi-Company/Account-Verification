import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Database, Search, Download, Play } from 'lucide-react';
import { getHistoryList, clearHistory } from '../utils/historyManager';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const HistoryViewer = ({ onBack, onReconcile, t }) => {
    const [bankHistory, setBankHistory] = useState([]);
    const [bookHistory, setBookHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('bank'); // 'bank' | 'book'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setBankHistory(getHistoryList('bank'));
        setBookHistory(getHistoryList('book'));
    };

    const handleClear = () => {
        if (confirm(t('history.clear') + '?')) {
            clearHistory();
            loadData();
        }
    };

    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        const ws1 = XLSX.utils.json_to_sheet(bankHistory);
        XLSX.utils.book_append_sheet(wb, ws1, "Bank Archive");
        const ws2 = XLSX.utils.json_to_sheet(bookHistory);
        XLSX.utils.book_append_sheet(wb, ws2, "Book Archive");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(dataBlob, `Archive_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const filterData = (data) => {
        if (!searchTerm) return data;
        const lowerSearch = searchTerm.toLowerCase();
        return data.filter(item =>
            String(item.desc || '').toLowerCase().includes(lowerSearch) ||
            String(item.ref || '').toLowerCase().includes(lowerSearch) ||
            String(item.amount || '').includes(lowerSearch)
        );
    };

    const currentData = activeTab === 'bank' ? filterData(bankHistory) : filterData(bookHistory);

    return (
        <div className="card animate-fade-in">
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'left' }}>
                    <button onClick={onBack} className="btn-text" style={{ marginBottom: '0.5rem', paddingLeft: 0 }}>
                        <ArrowLeft size={16} /> {t('nav.reconcile')}
                    </button>
                    <h2>{t('history.title')}</h2>
                    <p className="text-muted">{t('history.subtitle')}</p>
                </div>
                <div style={{ gap: '0.5rem', display: 'flex' }}>
                    <button onClick={onReconcile} className="btn btn-primary" title={t('history.runMatching')}>
                        <Play size={16} /> {t('history.runMatching')}
                    </button>
                    <button onClick={handleExport} className="btn btn-outline" title={t('results.export')}>
                        <Download size={16} />
                    </button>
                    <button onClick={handleClear} className="btn btn-outline text-danger" title={t('history.clear')}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="tabs" style={{ margin: 0 }}>
                    <button
                        className={`tab ${activeTab === 'bank' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bank')}
                    >
                        {t('history.bankTab')} ({bankHistory.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'book' ? 'active' : ''}`}
                        onClick={() => setActiveTab('book')}
                    >
                        {t('history.bookTab')} ({bookHistory.length})
                    </button>
                </div>

                <div className="search-box" style={{ position: 'relative' }}>
                    <Search className="search-icon" size={16} />
                    <input
                        type="text"
                        placeholder={t('history.title') + "..."}
                        className="input-field"
                        style={{ paddingLeft: '2rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('results.table.date')}</th>
                            <th>{t('results.table.amount')}</th>
                            <th>{t('results.table.ref')}</th>
                            <th>{t('results.table.desc')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.length > 0 ? (
                            currentData.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{String(row.date || row.__date || '').substring(0, 10)}</td>
                                    <td style={{ fontWeight: 'bold', color: (row.displayAmount || row.__displayAmount) < 0 ? 'red' : 'green' }}>
                                        {(row.displayAmount !== undefined ? row.displayAmount : (row.amount || row.__amount))?.toFixed(2)}
                                    </td>
                                    <td>{row.ref || row.__ref}</td>
                                    <td style={{ maxWidth: '300px' }}>{row.desc || row.__desc}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted" style={{ padding: '2rem' }}>
                                    {t('history.noRecords')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888', textAlign: 'right' }}>
                {currentData.length > 0 && t('history.showing') ? t('history.showing') : ''}
            </div>
        </div>
    );
};

export default HistoryViewer;
