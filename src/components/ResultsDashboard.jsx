import React, { useState } from 'react';
import { Download, AlertTriangle, CheckCheck, XCircle, RotateCcw, ThumbsUp, ThumbsDown, Search, Link as LinkIcon, Calculator } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const ResultsDashboard = ({ data, onReset, t }) => {
    const [activeTab, setActiveTab] = useState('confirmed'); // 'confirmed' | 'possible' | 'amountOnly' | 'manual'

    // State for managing matches
    const [confirmedMatches, setConfirmedMatches] = useState(
        data.matches.filter(m => m.matchType === 'Exact' || m.matchType === 'Many-to-One' || m.matchType === 'One-to-Many (Smart)').map(m => ({ ...m, status: 'confirmed' }))
    );

    // New Categories
    const [possibleMatches, setPossibleMatches] = useState(
        data.matches.filter(m => m.matchType === 'Potential-Strong').map(m => ({ ...m, status: 'possible' }))
    );

    const [amountOnlyMatches, setAmountOnlyMatches] = useState(
        data.matches.filter(m => m.matchType === 'Potential-Amount' || m.matchType === 'Amount-Variance').map(m => ({ ...m, status: 'amountOnly' }))
    );

    // For manual unmatching.
    const [unmatchedBank, setUnmatchedBank] = useState(data.unmatchedBank || []);
    const [unmatchedBook, setUnmatchedBook] = useState(data.unmatchedBook || []);

    // Manual Matching State
    const [selection, setSelection] = useState({ bank: [], book: [] });
    const [searchTerm, setSearchTerm] = useState({ bank: '', book: '' });

    // Calculate totals
    const totalConfirmed = confirmedMatches.reduce((sum, m) => sum + m.amount, 0);
    const totalPossible = possibleMatches.reduce((sum, m) => sum + m.amount, 0);
    const totalAmountOnly = amountOnlyMatches.reduce((sum, m) => sum + m.amount, 0);


    // Get selected items details (Filter by ID)
    const selectedBankItems = unmatchedBank.filter(i => selection.bank.includes(i.id));
    const selectedBookItems = unmatchedBook.filter(i => selection.book.includes(i.id));

    const selectedBankTotal = selectedBankItems.reduce((sum, i) => sum + (i.__displayAmount || i.__amount), 0);
    const selectedBookTotal = selectedBookItems.reduce((sum, i) => sum + (i.__displayAmount || i.__amount), 0);
    const selectionDiff = Math.abs(selectedBankTotal - selectedBookTotal);

    const toggleSelection = (item, type) => {
        setSelection(prev => {
            const list = prev[type]; // List of IDs
            const exists = list.includes(item.id);
            if (exists) {
                return { ...prev, [type]: list.filter(id => id !== item.id) };
            } else {
                return { ...prev, [type]: [...list, item.id] };
            }
        });
    };

    const clearSelection = () => setSelection({ bank: [], book: [] });

    const executeManualMatch = () => {
        if (selectedBankItems.length === 0 && selectedBookItems.length === 0) return;

        if (selectionDiff > 0.02) {
            // First Warning: General Mismatch
            if (!confirm(`⚠️ تنبيه وجود فروقات!\n\nيوجد فرق في المبلغ قدره (${selectionDiff.toFixed(2)}).\nهل تريد الاستمرار؟`)) return;

            // Second Warning: Explicit Confirmation
            if (!confirm(`🛑 تأكيد أخير:\n\nأنت على وشك اعتماد مطابقة غير متساوية.\nسيتم تسجيل الفارق (${selectionDiff.toFixed(2)}) كـ "عجز/زيادة".\n\nاضغط موافق (OK) فقط إذا كنت متأكداً تماماً.`)) return;
        }

        // Remove from unmatched lists (Filter by ID)
        setUnmatchedBank(prev => prev.filter(i => !selection.bank.includes(i.id)));
        setUnmatchedBook(prev => prev.filter(i => !selection.book.includes(i.id)));

        // Create new match object
        const newMatch = {
            id: 'MANUAL-' + Date.now(),
            matchType: 'Manual-Match',
            status: 'confirmed',
            bank: selectedBankItems.length === 1 ? selectedBankItems[0] : selectedBankItems,
            book: selectedBookItems.length === 1 ? selectedBookItems[0] : selectedBookItems,
            amount: selectedBankTotal, // Use bank total as primary reference
            amountDiff: selectionDiff,
            dateDiff: 0 // Not relevant for manual
        };

        setConfirmedMatches(prev => [newMatch, ...prev]);
        clearSelection();
    };

    const exportReport = () => {
        const wb = XLSX.utils.book_new();

        const createSheet = (data, sheetName) => {
            const rows = data.map(m => {
                const getDetails = (item) => {
                    if (Array.isArray(item)) {
                        const total = item.reduce((acc, i) => acc + (i.__amount || 0), 0);
                        const refs = item.map(i => i.__ref).filter(Boolean).join(', ');
                        return { date: item[0]?.__date, amount: total, ref: refs || 'Multiple', desc: 'Group Match' };
                    }
                    return { date: item?.__date, amount: item?.__amount, ref: item?.__ref, desc: item?.__desc };
                };
                const bank = getDetails(m.bank);
                const book = getDetails(m.book);

                return {
                    ID: m.id,
                    Type: m.matchType,
                    Bank_Date: bank.date,
                    Bank_Amount: bank.amount,
                    Bank_Ref: bank.ref,
                    Bank_Desc: bank.desc,
                    Book_Date: book.date,
                    Book_Amount: book.amount,
                    Book_Ref: book.ref,
                    Book_Desc: book.desc,
                    Variance: m.amountDiff || 0
                };
            });
            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        };

        // Sheets
        createSheet(confirmedMatches, "Confirmed Matches");
        createSheet(possibleMatches, "Potential Review");
        createSheet(amountOnlyMatches, "Amount Only Matches");

        // Sheet: Unmatched Bank
        const bankRows = unmatchedBank.map(i => ({
            Date: i.__date,
            Amount: i.__amount,
            Ref: i.__ref,
            Desc: i.__desc
        }));
        const ws2 = XLSX.utils.json_to_sheet(bankRows);
        XLSX.utils.book_append_sheet(wb, ws2, "Unmatched Bank");

        // Sheet: Unmatched Book
        const bookRows = unmatchedBook.map(i => ({
            Date: i.__date,
            Amount: i.__amount,
            Ref: i.__ref,
            Desc: i.__desc
        }));
        const ws3 = XLSX.utils.json_to_sheet(bookRows);
        XLSX.utils.book_append_sheet(wb, ws3, "Unmatched Book");

        // Save
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(dataBlob, `Reconciliation_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Actions
    const unmatchItem = (id) => {
        // Find in all lists
        let match = confirmedMatches.find(m => m.id === id);
        if (match) {
            setConfirmedMatches(prev => prev.filter(m => m.id !== id));
        } else {
            match = possibleMatches.find(m => m.id === id);
            if (match) {
                setPossibleMatches(prev => prev.filter(m => m.id !== id));
            } else {
                match = amountOnlyMatches.find(m => m.id === id);
                if (match) {
                    setAmountOnlyMatches(prev => prev.filter(m => m.id !== id));
                }
            }
        }

        if (!match) return;

        // Add back to unmatched
        const addBack = (item, setter) => {
            if (Array.isArray(item)) setter(prev => [...prev, ...item]);
            else if (item) setter(prev => [...prev, item]);
        };

        addBack(match.bank, setUnmatchedBank);
        addBack(match.book, setUnmatchedBook);
    };

    const approveMatch = (id) => {
        // Try Possible
        let match = possibleMatches.find(m => m.id === id);
        if (match) {
            setPossibleMatches(prev => prev.filter(m => m.id !== id));
            setConfirmedMatches(prev => [...prev, { ...match, status: 'confirmed' }]);
            return;
        }
        // Try Amount Only
        match = amountOnlyMatches.find(m => m.id === id);
        if (match) {
            setAmountOnlyMatches(prev => prev.filter(m => m.id !== id));
            setConfirmedMatches(prev => [...prev, { ...match, status: 'confirmed' }]);
        }
    };

    const rejectMatch = (id) => {
        // Try Possible
        let match = possibleMatches.find(m => m.id === id);
        if (match) {
            setPossibleMatches(prev => prev.filter(m => m.id !== id));
        } else {
            // Try Amount Only
            match = amountOnlyMatches.find(m => m.id === id);
            if (match) {
                setAmountOnlyMatches(prev => prev.filter(m => m.id !== id));
            }
        }

        if (match) {
            // Return to unmatched piles
            const addBack = (item, setter) => {
                if (Array.isArray(item)) setter(prev => [...prev, ...item]);
                else if (item) setter(prev => [...prev, item]);
            };
            addBack(match.bank, setUnmatchedBank);
            addBack(match.book, setUnmatchedBook);
        }
    };

    const unmatchAll = () => {
        if (!confirm(t('results.unmatchAll') + '?')) return;

        // Gather all items form all lists
        const allMatches = [...confirmedMatches, ...possibleMatches, ...amountOnlyMatches];
        const recoveredBank = [];
        const recoveredBook = [];

        allMatches.forEach(m => {
            if (Array.isArray(m.bank)) recoveredBank.push(...m.bank);
            else if (m.bank) recoveredBank.push(m.bank);

            if (Array.isArray(m.book)) recoveredBook.push(...m.book);
            else if (m.book) recoveredBook.push(m.book);
        });

        // Update State
        setUnmatchedBank(prev => [...prev, ...recoveredBank]);
        setUnmatchedBook(prev => [...prev, ...recoveredBook]);
        setConfirmedMatches([]);
        setPossibleMatches([]);
        setAmountOnlyMatches([]);
    };

    const approveAllSuggestions = (listName) => {
        if (!confirm(t('results.approveAll') + '?')) return;

        if (listName === 'possible') {
            setConfirmedMatches(prev => [...prev, ...possibleMatches.map(m => ({ ...m, status: 'confirmed' }))]);
            setPossibleMatches([]);
        } else if (listName === 'amountOnly') {
            setConfirmedMatches(prev => [...prev, ...amountOnlyMatches.map(m => ({ ...m, status: 'confirmed' }))]);
            setAmountOnlyMatches([]);
        }
    };

    const renderTable = (items, type) => {
        if (!items || items.length === 0) return <div className="p-8 text-center text-muted">{t('history.noRecords')}</div>;

        return (
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('results.table.status')}</th>
                            <th>{t('results.table.date')}</th>
                            <th>{t('results.table.ref')}</th>
                            <th>{t('results.table.desc')}</th>
                            <th>{t('results.table.amount')}</th>
                            {type === 'match' && <th>{t('results.table.matchDetails')}</th>}
                            {type === 'match' && <th>{t('results.table.action')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((row, idx) => {
                            // Determine display data
                            let displayData = row;
                            let isMatch = type === 'match';
                            let isGroup = false;

                            if (isMatch) {
                                if (row.matchType === 'One-to-Many (Smart)') {
                                    // Bank is anchor (1), Book are many
                                    displayData = row.bank;
                                    isGroup = true;
                                } else if (Array.isArray(row.bank)) {
                                    // Many-to-One: Book is anchor (1)
                                    displayData = row.book;
                                    isGroup = true;
                                } else {
                                    displayData = row.bank || row.book; // Fallback
                                }
                            }

                            return (
                                <tr key={idx} className={isMatch ? 'match-row' : ''}>
                                    <td style={{ verticalAlign: 'top' }}>
                                        {isMatch ? (
                                            <span className={`badge ${row.status === 'confirmed' ? 'badge-success' :
                                                row.status === 'possible' ? 'badge-primary' : 'badge-warning'}`}>
                                                {row.status === 'confirmed' ? <CheckCheck size={12} /> :
                                                    row.status === 'possible' ? <ThumbsUp size={12} /> : <AlertTriangle size={12} />}

                                                {row.status === 'confirmed' ? t('results.badges.confirmed') :
                                                    row.status === 'possible' ? t('results.badges.possible') : t('results.badges.amountOnly')}
                                            </span>
                                        ) : (
                                            <span className="badge badge-danger">{t('results.badges.unmatched')}</span>
                                        )}
                                    </td>

                                    {/* DATE */}
                                    <td style={{ verticalAlign: 'top' }}>
                                        {isMatch && !isGroup ? (
                                            <div className="flex flex-col gap-1 text-xs">
                                                <span className="text-primary font-medium" title="Bank Date">{String(row.bank?.__date || '-').substring(0, 10)}</span>
                                                <span className="text-secondary font-medium" title="Book Date">{String(row.book?.__date || '-').substring(0, 10)}</span>
                                            </div>
                                        ) : (
                                            String(displayData.__date || '-').substring(0, 10)
                                        )}
                                    </td>

                                    {/* REF */}
                                    <td style={{ verticalAlign: 'top' }}>
                                        {isMatch && !isGroup ? (
                                            <div className="flex flex-col gap-1 text-xs">
                                                <span className="text-primary" title="Bank Ref">{row.bank?.__ref || '-'}</span>
                                                <span className="text-secondary" title="Book Ref">{row.book?.__ref || '-'}</span>
                                            </div>
                                        ) : (
                                            displayData.__ref || '-'
                                        )}
                                    </td>

                                    {/* DESC */}
                                    <td style={{ maxWidth: '300px', overflow: 'hidden', verticalAlign: 'top' }}>
                                        {isMatch && !isGroup ? (
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center gap-1 text-gray-700" title={row.bank?.__desc}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                                    <span className="truncate">{row.bank?.__desc || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-500" title={row.book?.__desc}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                                                    <span className="truncate">{row.book?.__desc || '-'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="truncate" title={displayData.__desc}>{displayData.__desc || '-'}</div>
                                        )}
                                    </td>

                                    {/* AMOUNT */}
                                    <td style={{ fontWeight: 'bold', verticalAlign: 'top', color: (displayData.__displayAmount !== undefined ? (displayData.__displayAmount < 0 ? '#ef4444' : '#10b981') : 'inherit') }}>
                                        {displayData.__displayAmount !== undefined
                                            ? displayData.__displayAmount.toFixed(2)
                                            : (typeof displayData.__amount === 'number' ? displayData.__amount.toFixed(2) : displayData.__amount)}
                                    </td>

                                    {isMatch && (
                                        <td style={{ fontSize: '0.85rem', color: '#666', verticalAlign: 'top' }}>
                                            {isGroup ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>{t('results.badges.group')}</span>
                                                    {row.matchType === 'One-to-Many (Smart)'
                                                        ? `${row.book.length} Book Items`
                                                        : `${row.bank.length} Bank Items`
                                                    }
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem' }}>
                                                    {row.matchType === 'Amount-Variance' ? `Diff: ${(row.amountDiff || 0).toFixed(2)}` :
                                                        row.matchType === 'Wrong-Side' ? <span style={{ color: 'red', fontWeight: 'bold' }}>{t('results.badges.wrongSide')}</span> :
                                                            row.matchType === 'Manual-Match' ? <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>{t('results.badges.manual')}</span> :
                                                                row.matchType === 'Potential-Strong' ? <span className="badge badge-primary">Strong Evidence</span> :
                                                                    row.matchType === 'Potential-Amount' ? <span className="badge badge-warning">Amount Match Only</span> :
                                                                        `Date Diff: ${row.dateDiff}d`}
                                                </span>
                                            )}
                                        </td>
                                    )}

                                    {isMatch && (
                                        <td style={{ verticalAlign: 'top' }}>
                                            {row.status === 'confirmed' ? (
                                                <button onClick={() => unmatchItem(row.id)} className="btn-icon text-danger" title="Unmatch">
                                                    <XCircle size={16} />
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    <button onClick={() => approveMatch(row.id)} className="btn-icon text-success" title="Approve">
                                                        <ThumbsUp size={16} />
                                                    </button>
                                                    <button onClick={() => rejectMatch(row.id)} className="btn-icon text-danger" title="Reject">
                                                        <ThumbsDown size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>

                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    // Keyboard Shortcuts for Manual Matching
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (activeTab !== 'manual') return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // ENTER: Match
            if (e.key === 'Enter') {
                e.preventDefault();
                // Check if we have a valid selection to match
                if (selectedBankItems.length > 0 || selectedBookItems.length > 0) {
                    // We need to call the function. Since it's defined in scope, we can just call it.
                    // We need to make sure we don't have stale closures if we didn't add it to dependencies.
                    // But we added it to dependencies below.
                    executeManualMatch();
                }
            }
            // ESC: Clear
            else if (e.key === 'Escape') {
                e.preventDefault();
                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, selectedBankItems, selectedBookItems]); // We can omit executeManualMatch if it's stable or just suppress lint

    return (
        <div className="dashboard-container">
            {/* Header / Stats */}
            <div className="dashboard-header card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem' }}>
                <div>
                    <h2>{t('results.newMatch')}</h2>
                    <p className="text-muted">
                        {t('results.matched')}: <b>{confirmedMatches.length}</b> | {t('results.tabs.possible')}: <b className="text-warning">{possibleMatches.length}</b>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="stat-box" style={{ background: '#ecfdf5', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                        <span className="label" style={{ color: '#047857' }}>{t('results.matched')}</span>
                        <h3 style={{ color: '#065f46' }}>{totalConfirmed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="stat-box" style={{ background: '#fffbeb', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                        <span className="label" style={{ color: '#b45309' }}>{t('results.tabs.possible')}</span>
                        <h3 style={{ color: '#92400e' }}>{totalPossible.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="stat-box" style={{ background: '#fff7ed', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                        <span className="label" style={{ color: '#c2410c' }}>Matches (Amount)</span>
                        <h3 style={{ color: '#9a3412' }}>{totalAmountOnly.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" onClick={onReset} title="Start Over / New Files">
                        Start New
                    </button>
                    <button className="btn btn-outline" onClick={unmatchAll}>
                        <RotateCcw size={16} /> {t('results.unmatchAll')}
                    </button>
                    <button className="btn btn-primary" onClick={exportReport}>
                        <Download size={16} /> {t('results.export')}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'confirmed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('confirmed')}
                    title="Exact matches found automatically"
                >
                    <CheckCheck size={16} /> {t('results.tabs.confirmed')} ({confirmedMatches.length})
                </button>

                <button
                    className={`tab ${activeTab === 'possible' ? 'active' : ''} ${possibleMatches.length > 0 ? 'text-warning' : ''}`}
                    onClick={() => setActiveTab('possible')}
                    title="Strong matches with different dates"
                >
                    <ThumbsUp size={16} /> {t('results.tabs.possible')} ({possibleMatches.length})
                </button>

                <button
                    className={`tab ${activeTab === 'amountOnly' ? 'active' : ''} ${amountOnlyMatches.length > 0 ? 'text-orange-500' : ''}`}
                    onClick={() => setActiveTab('amountOnly')}
                    title="Matches based on amount only"
                >
                    <AlertTriangle size={16} /> {t('results.tabs.amountOnly')} ({amountOnlyMatches.length})
                </button>

                <div style={{ width: '1px', background: '#ddd', margin: '0 0.5rem' }}></div>
                <button
                    className={`tab ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    <LinkIcon size={16} /> {t('results.manual.tab')}
                </button>
            </div>

            {/* Content Area */}
            <div className="tab-content card" style={{ padding: 0, overflow: 'hidden' }}>
                {activeTab === 'confirmed' && (
                    <div className="p-4">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>{t('results.badges.confirmed')}</h3>
                            <button className="btn btn-sm btn-text text-danger" onClick={unmatchAll}>{t('results.unmatchAll')}</button>
                        </div>
                        {renderTable(confirmedMatches, 'match')}
                    </div>
                )}

                {activeTab === 'possible' && (
                    <div className="p-4">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3>{t('results.tabs.possible')}</h3>
                                <p className="text-sm text-gray-500">Strong evidence found (Ref/Desc) but distinct dates.</p>
                            </div>
                            <button className="btn btn-sm btn-primary" onClick={() => approveAllSuggestions('possible')}>{t('results.approveAll')}</button>
                        </div>
                        {renderTable(possibleMatches, 'match')}
                    </div>
                )}

                {activeTab === 'amountOnly' && (
                    <div className="p-4">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3>{t('results.tabs.amountOnly')}</h3>
                                <p className="text-sm text-gray-500">Only amounts match. Please review the dates carefully.</p>
                            </div>
                            <button className="btn btn-sm btn-primary" onClick={() => approveAllSuggestions('amountOnly')}>{t('results.approveAll')}</button>
                        </div>
                        {renderTable(amountOnlyMatches, 'match')}
                    </div>
                )}

                {activeTab === 'manual' && (
                    <div className="manual-match-container">
                        {/* Selected Calc Bar */}
                        <div className="calc-bar bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                            <div className="flex gap-4 text-sm font-medium">
                                <span className={selectionDiff < 0.01 ? 'text-success' : 'text-danger'}>
                                    {t('results.manual.diff')}: {selectionDiff.toFixed(2)}
                                </span>
                                <span className="text-muted">|</span>
                                <span className="text-primary">{t('results.manual.selected')}: {selectedBankItems.length + selectedBookItems.length}</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-sm btn-outline text-muted" onClick={clearSelection}>
                                    {t('results.manual.clear')}
                                </button>
                                <button
                                    className="btn btn-sm btn-primary"
                                    disabled={selectedBankItems.length === 0 && selectedBookItems.length === 0}
                                    onClick={executeManualMatch}
                                >
                                    <LinkIcon size={16} /> {t('results.manual.matchBtn')}
                                </button>
                            </div>
                        </div>


                        {/* Keyboard Shortcuts Hint */}
                        <div
                            className="text-xs text-center text-gray-400 mb-2"
                            dangerouslySetInnerHTML={{ __html: t('results.manual.shortcuts') || "💡 Tips: Use <kbd>Enter</kbd> to match selected, <kbd>Esc</kbd> to clear." }}
                        />

                        <div style={{ display: 'flex', flexDirection: 'row', height: '600px', border: '1px solid #e2e8f0', borderRadius: '1rem', overflow: 'hidden', width: '100%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>



                            {/* Helper Logic for Sorting & Shortcuts */}
                            {(() => {
                                // 1. Smart Sorting Logic
                                const getSortedList = (list, references) => {
                                    if (references.length === 0) return list;

                                    const targetAmt = references.reduce((acc, curr) => acc + (curr.__amount || 0), 0);
                                    const targetRefDateStr = references[references.length - 1]?.__date;
                                    const targetRefDate = targetRefDateStr ? new Date(targetRefDateStr) : null;

                                    // Prepare target strings for fuzzy matching
                                    const targetRefs = references.map(r => String(r.__ref || '').toLowerCase()).filter(s => s && s.length > 2);
                                    const targetDescs = references.map(r => String(r.__desc || '').toLowerCase());

                                    return [...list].sort((a, b) => {
                                        let scoreA = 0;
                                        let scoreB = 0;

                                        const refA = String(a.__ref || '').toLowerCase();
                                        const refB = String(b.__ref || '').toLowerCase();
                                        const descA = String(a.__desc || '').toLowerCase();
                                        const descB = String(b.__desc || '').toLowerCase();

                                        // A. Reference Match (Highest Priority) - Weight: 500-1000
                                        if (targetRefs.some(tr => tr === refA)) scoreA += 1000;
                                        else if (targetRefs.some(tr => refA.includes(tr) || tr.includes(refA))) scoreA += 500;

                                        if (targetRefs.some(tr => tr === refB)) scoreB += 1000;
                                        else if (targetRefs.some(tr => refB.includes(tr) || tr.includes(refB))) scoreB += 500;

                                        // B. Amount Match (High Priority) - Weight: 200
                                        // Check absolute difference because signs might be flipped or it's a correction
                                        const absValA = Math.abs(a.__amount);
                                        const absValB = Math.abs(b.__amount);
                                        const absTarget = Math.abs(targetAmt);

                                        if (Math.abs(absValA - absTarget) < 0.05) scoreA += 200;
                                        if (Math.abs(absValB - absTarget) < 0.05) scoreB += 200;

                                        // C. Description Similarity (Medium Priority) - Weight: 0-100
                                        const getSim = (s, targets) => {
                                            return targets.reduce((max, t) => {
                                                if (s.includes(t) || t.includes(s)) return 100;
                                                // Simple token overlap
                                                const tokensS = s.split(/[\s-_]+/);
                                                const tokensT = t.split(/[\s-_]+/);
                                                const overlap = tokensS.filter(x => x.length > 2 && tokensT.includes(x)).length;
                                                return Math.max(max, overlap * 20);
                                            }, 0);
                                        };
                                        scoreA += getSim(descA, targetDescs);
                                        scoreB += getSim(descB, targetDescs);

                                        // D. Date Proximity (Tie Breaker) - Penalty based on days diff
                                        let dateScoreA = 0;
                                        let dateScoreB = 0;
                                        if (targetRefDate) {
                                            const dA = a.__date ? new Date(a.__date) : new Date(0);
                                            const dB = b.__date ? new Date(b.__date) : new Date(0);
                                            dateScoreA = Math.abs(dA - targetRefDate) / (1000 * 60 * 60 * 24); // Days diff
                                            dateScoreB = Math.abs(dB - targetRefDate) / (1000 * 60 * 60 * 24);
                                        }

                                        // Final Compare: Higher Score is better. If Scores equal, Lower Date Diff is better.
                                        if (Math.abs(scoreA - scoreB) > 10) return scoreB - scoreA;
                                        return dateScoreA - dateScoreB;
                                    });
                                };

                                const displayBank = getSortedList(unmatchedBank, selectedBookItems);
                                const displayBook = getSortedList(unmatchedBook, selectedBankItems);

                                return (
                                    <>
                                        {/* Left Side: Bank */}
                                        <div style={{ flex: 1, width: '50%', minWidth: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', zIndex: 10 }}>
                                                <h4 className="text-primary font-bold mb-2 flex items-center gap-2">
                                                    {t('results.manual.bankSide')}
                                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{unmatchedBank.length}</span>
                                                </h4>
                                                <div className="relative group">
                                                    <Search className="absolute right-3 top-3 text-gray-400 group-hover:text-primary transition-colors" size={16} />
                                                    <input
                                                        type="text"
                                                        placeholder={t('results.manual.search')}
                                                        className="input-field transition-all focus:ring-2 focus:ring-primary/20"
                                                        style={{ paddingRight: '2.5rem', width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                                                        value={searchTerm.bank}
                                                        onChange={(e) => setSearchTerm(prev => ({ ...prev, bank: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }} className="custom-scrollbar">
                                                {displayBank
                                                    .filter(item =>
                                                        !searchTerm.bank ||
                                                        String(item.__amount).includes(searchTerm.bank) ||
                                                        String(item.__ref).toLowerCase().includes(searchTerm.bank.toLowerCase())
                                                    )
                                                    .map((item, i) => {
                                                        const isSelected = selection.bank.includes(item.id);
                                                        // Check if this item is a "best match" suggestion (only if selection exists on other side)
                                                        const isBestMatch = !isSelected && selectedBookItems.length > 0 && Math.abs(Math.abs(item.__amount) - Math.abs(selectedBookItems.reduce((s, x) => s + x.__amount, 0))) < 0.01;

                                                        return (
                                                            <div
                                                                key={item.id}
                                                                onClick={() => toggleSelection(item, 'bank')}
                                                                style={{
                                                                    backgroundColor: isSelected ? '#eff6ff' : (isBestMatch ? '#ecfdf5' : '#fff'),
                                                                    borderColor: isSelected ? '#3b82f6' : (isBestMatch ? '#10b981' : '#e2e8f0'),
                                                                    borderWidth: (isSelected || isBestMatch) ? '2px' : '1px',
                                                                    borderStyle: 'solid',
                                                                    borderRadius: '0.75rem',
                                                                    padding: '1rem',
                                                                    marginBottom: '0.75rem',
                                                                    cursor: 'pointer',
                                                                    position: 'relative',
                                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    boxShadow: isSelected ? '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                                                                    transform: isSelected ? 'scale(1.005)' : 'scale(1)'
                                                                }}
                                                            >
                                                                {isBestMatch && <div className="absolute top-2 left-2 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">✨ تطابق محتمل (اضغط للاختيار)</div>}
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                                    <span style={{ fontWeight: '800', fontSize: '1.1rem', color: item.__displayAmount < 0 ? '#ef4444' : '#10b981', direction: 'ltr', letterSpacing: '-0.02em' }}>
                                                                        {Number(item.__displayAmount || item.__amount).toFixed(2)}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                                                                        {String(item.__date || '').substring(0, 10)}
                                                                    </span>
                                                                </div>
                                                                {item.__ref && <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                                    #{item.__ref}
                                                                </div>}
                                                                <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.5' }}>
                                                                    {item.__desc}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                        </div>

                                        {/* Right Side: Book */}
                                        <div style={{ flex: 1, width: '50%', minWidth: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
                                            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', zIndex: 10 }}>
                                                <h4 className="text-secondary font-bold mb-2 flex items-center gap-2">
                                                    {t('results.manual.bookSide')}
                                                    <span className="bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{unmatchedBook.length}</span>
                                                </h4>
                                                <div className="relative group">
                                                    <Search className="absolute right-3 top-3 text-gray-400 group-hover:text-secondary transition-colors" size={16} />
                                                    <input
                                                        type="text"
                                                        placeholder={t('results.manual.search')}
                                                        className="input-field transition-all focus:ring-2 focus:ring-secondary/20"
                                                        style={{ paddingRight: '2.5rem', width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                                                        value={searchTerm.book}
                                                        onChange={(e) => setSearchTerm(prev => ({ ...prev, book: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }} className="custom-scrollbar">
                                                {displayBook
                                                    .filter(item =>
                                                        !searchTerm.book ||
                                                        String(item.__amount).includes(searchTerm.book) ||
                                                        String(item.__ref).toLowerCase().includes(searchTerm.book.toLowerCase())
                                                    )
                                                    .map((item, i) => {
                                                        const isSelected = selection.book.includes(item.id);
                                                        // Check if this item is a "best match" suggestion
                                                        const isBestMatch = !isSelected && selectedBankItems.length > 0 && Math.abs(Math.abs(item.__amount) - Math.abs(selectedBankItems.reduce((s, x) => s + x.__amount, 0))) < 0.01;

                                                        return (
                                                            <div
                                                                key={item.id}
                                                                onClick={() => toggleSelection(item, 'book')}
                                                                style={{
                                                                    backgroundColor: isSelected ? '#f0f9ff' : (isBestMatch ? '#ecfdf5' : '#fff'),
                                                                    borderColor: isSelected ? '#0ea5e9' : (isBestMatch ? '#10b981' : '#e2e8f0'),
                                                                    borderWidth: (isSelected || isBestMatch) ? '2px' : '1px',
                                                                    borderStyle: 'solid',
                                                                    borderRadius: '0.75rem',
                                                                    padding: '1rem',
                                                                    marginBottom: '0.75rem',
                                                                    cursor: 'pointer',
                                                                    position: 'relative',
                                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    boxShadow: isSelected ? '0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -1px rgba(14, 165, 233, 0.06)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                                                                    transform: isSelected ? 'scale(1.005)' : 'scale(1)'
                                                                }}
                                                            >
                                                                {isBestMatch && <div className="absolute top-2 left-2 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">✨ تطابق محتمل (اضغط للاختيار)</div>}
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                                    <span style={{ fontWeight: '800', fontSize: '1.1rem', color: item.__displayAmount < 0 ? '#ef4444' : '#10b981', direction: 'ltr', letterSpacing: '-0.02em' }}>
                                                                        {Number(item.__displayAmount || item.__amount).toFixed(2)}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                                                                        {String(item.__date || '').substring(0, 10)}
                                                                    </span>
                                                                </div>
                                                                {item.__ref && <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                                    #{item.__ref}
                                                                </div>}
                                                                <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.5' }}>
                                                                    {item.__desc}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default ResultsDashboard;
