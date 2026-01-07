import React, { useState, useEffect } from 'react';
import { Table, ArrowRight } from 'lucide-react';

const ColumnMapper = ({ bankData, bookData, bankHeaders, bookHeaders, onComplete, t }) => {
    // Separate mapping state for both files
    const [mapping, setMapping] = useState({
        bank: { date: '', amount: '', ref: '', desc: '', deposit: '', withdrawal: '' },
        book: { date: '', amount: '', ref: '', desc: '', deposit: '', withdrawal: '' }
    });

    // Helper for auto-detection
    const autoDetectMapping = (data, currentHeaders) => {
        if (!data || !currentHeaders || !Array.isArray(currentHeaders) || currentHeaders.length === 0) {
            return { date: '', amount: '', ref: '', desc: '', deposit: '', withdrawal: '' };
        }

        // Safe lowercase conversion
        const lowerCols = currentHeaders.map(c => (c ? String(c).toLowerCase() : ''));
        const findCol = (keywords) => {
            const idx = lowerCols.findIndex(c => keywords.some(k => c.includes(k)));
            return idx !== -1 ? currentHeaders[idx] : '';
        };

        const autoDate = findCol(['date', 'time', 'day', 'تاريخ', 'وقت', 'يوم']);
        const autoRef = findCol(['ref', 'check', 'cheque', 'doc', 'no.', 'id', 'num', 'مرجع', 'رقم', 'شيك', 'سند']);
        const autoDesc = findCol(['desc', 'narr', 'detail', 'memo', 'partic', 'info', 'بيان', 'شرح', 'تفاصيل', 'وصف']);

        let autoDep = findCol(['dep', 'credit', 'cr', 'in', 'إيداع', 'ايداع', 'دائن', 'قبض', 'مقبوضات', 'وارد', 'له']);
        let autoWith = findCol(['with', 'debit', 'dr', 'out', 'سحب', 'مسحوبات', 'مدين', 'صرف', 'منصرف', 'مدفوعات', 'علي', 'منه']);
        let autoAmount = '';

        // If no explicit Dr/Cr, look for generic 'Amount'
        if (!autoDep && !autoWith) {
            const genericAmt = findCol(['amount', 'balance', 'value', 'مبلغ', 'رصيد', 'قيمة']);
            if (genericAmt) {
                // If generic amount found, heuristic:
                // Maybe they use signed amount?
                // Let's set it as deposit for now (sign logic handles it if same col mapped to both)
                autoDep = genericAmt;
                autoWith = genericAmt;
                autoAmount = genericAmt;
            }
        }

        return {
            date: autoDate,
            ref: autoRef,
            desc: autoDesc,
            deposit: autoDep,
            withdrawal: autoWith,
            amount: autoAmount
        };
    };

    useEffect(() => {
        const bankAutoMapping = autoDetectMapping(bankData, bankHeaders);
        const bookAutoMapping = autoDetectMapping(bookData, bookHeaders);

        setMapping({
            bank: bankAutoMapping,
            book: bookAutoMapping
        });
    }, [bankHeaders, bookHeaders]); // Depend on headers only to avoid loops

    const handleMappingChange = (type, field, value) => {
        setMapping(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }));
    };

    const handleNext = () => {
        // Basic validation
        if (!mapping.bank.date || (!mapping.bank.deposit && !mapping.bank.withdrawal)) {
            // Try to be generic or specific
            alert(t('mapper.validation_error'));
            return;
        }
        if (!mapping.book.date || (!mapping.book.deposit && !mapping.book.withdrawal)) {
            alert(t('mapper.validation_error'));
            return;
        }

        const processData = (data, map, prefix) => {
            return data.map((row, index) => {
                let amount = 0;
                let displayAmount = 0;

                // Robust value parsing
                const parseVal = (val) => {
                    if (val === null || val === undefined || val === '') return 0;
                    // Remove currency symbols, commas, spaces
                    const clean = String(val).replace(/[^0-9.-]/g, '');
                    return parseFloat(clean) || 0;
                };

                const depVal = parseVal(row[map.deposit]);
                const withVal = parseVal(row[map.withdrawal]);

                // Logic Selection
                if (map.deposit === map.withdrawal) {
                    // Single Column Logic (Signed)
                    // Assumption: Positive = Deposit logic, Negative = Withdrawal logic
                    displayAmount = depVal; // Keep original sign for display
                    amount = Math.abs(depVal);
                } else {
                    // Two Column Logic
                    // Prioritize non-zero
                    if (Math.abs(depVal) > 0) {
                        amount = Math.abs(depVal);
                        displayAmount = amount; // Deposit is positive
                    } else if (Math.abs(withVal) > 0) {
                        amount = Math.abs(withVal);
                        displayAmount = -amount; // Withdrawal is negative
                    }
                }

                return {
                    id: `${prefix}-${index}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
                    __date: row[map.date],
                    __amount: amount,
                    __displayAmount: displayAmount,
                    __ref: row[map.ref] || '',
                    __desc: row[map.desc] || '',
                    ...row // Keep original data
                };
            });
        };

        const bankMapped = processData(bankData, mapping.bank, 'BANK');
        const bookMapped = processData(bookData, mapping.book, 'BOOK');

        // Filter out invalid rows 
        const cleanBank = bankMapped.filter(r => r.__amount > 0 || r.__date);
        const cleanBook = bookMapped.filter(r => r.__amount > 0 || r.__date);

        onComplete(cleanBank, cleanBook);
    };

    const renderColumnSelect = (headers, type, field, labelKey, required = false) => (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                {t(labelKey)} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                className="input-select"
                value={mapping[type][field]}
                onChange={(e) => handleMappingChange(type, field, e.target.value)}
                style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    fontSize: '0.9rem'
                }}
            >
                <option value="">{t('mapper.select')}</option>
                {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Table size={24} className="text-emerald-600" /> {t('mapper.title')}
                </h2>
                <p className="text-gray-500 mt-2">{t('mapper.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* File 1 Mapping */}
                <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-6 text-emerald-800 border-b pb-2">
                        {t('mapper.file1.bank')}
                    </h3>

                    {renderColumnSelect(bankHeaders, 'bank', 'date', 'mapper.date', true)}
                    {renderColumnSelect(bankHeaders, 'bank', 'desc', 'mapper.desc')}
                    {renderColumnSelect(bankHeaders, 'bank', 'ref', 'mapper.ref')}

                    <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50 p-4 rounded-md">
                        <label className="text-sm font-bold text-gray-700 block mb-2">{t('mapper.amounts')}</label>
                        <p className="text-xs text-gray-500 mb-4">{t('mapper.amount_note')}</p>

                        {renderColumnSelect(bankHeaders, 'bank', 'deposit', 'mapper.col1.bank')}
                        {renderColumnSelect(bankHeaders, 'bank', 'withdrawal', 'mapper.col2.bank')}
                    </div>
                </div>

                {/* File 2 Mapping */}
                <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-6 text-emerald-800 border-b pb-2">
                        {t('mapper.file2.bank')}
                    </h3>

                    {renderColumnSelect(bookHeaders, 'book', 'date', 'mapper.date', true)}
                    {renderColumnSelect(bookHeaders, 'book', 'desc', 'mapper.desc')}
                    {renderColumnSelect(bookHeaders, 'book', 'ref', 'mapper.ref')}

                    <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50 p-4 rounded-md">
                        <label className="text-sm font-bold text-gray-700 block mb-2">{t('mapper.amounts')}</label>
                        <p className="text-xs text-gray-500 mb-4">{t('mapper.amount_note')}</p>

                        {renderColumnSelect(bookHeaders, 'book', 'deposit', 'mapper.col1.bank')}
                        {renderColumnSelect(bookHeaders, 'book', 'withdrawal', 'mapper.col2.bank')}
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-8">
                <button
                    onClick={handleNext}
                    className="btn btn-primary flex items-center gap-2 px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                    {t('mapper.next')} <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default ColumnMapper;
