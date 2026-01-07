import React, { useState } from 'react';
import { Upload, FileText, Settings, ArrowRight } from 'lucide-react';
import { parseExcelFile } from '../utils/excelParser';
import ColumnMapper from './ColumnMapper';

const FileUpload = ({ onDataLoaded, t }) => {
    // Files
    const [bankFile, setBankFile] = useState(null);
    const [bookFile, setBookFile] = useState(null);

    // Status
    const [isProcessing, setIsProcessing] = useState(false);

    // Parsed Data for Mapper
    const [bankDataPreview, setBankDataPreview] = useState(null);
    const [bookDataPreview, setBookDataPreview] = useState(null);
    const [bankHeaders, setBankHeaders] = useState([]);
    const [bookHeaders, setBookHeaders] = useState([]);
    const [showMapper, setShowMapper] = useState(false);

    // Settings
    const [toleranceDays, setToleranceDays] = useState(0);
    const [useRefMatching, setUseRefMatching] = useState(false);

    const handleFileChange = (e, type) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'bank') setBankFile(file);
            else setBookFile(file);
        }
    };

    const handleProcessFiles = async () => {
        if (!bankFile || !bookFile) {
            alert(t('upload.errorFile'));
            return;
        }

        setIsProcessing(true);
        try {
            // Parse Bank
            const bankResult = await parseExcelFile(bankFile);
            setBankDataPreview(bankResult.data);
            setBankHeaders(bankResult.headers || []);

            // Parse Book
            const bookResult = await parseExcelFile(bookFile);
            setBookDataPreview(bookResult.data);
            setBookHeaders(bookResult.headers || []);

            setShowMapper(true);
        } catch (error) {
            console.error("Error parsing files:", error);
            alert("Error reading files. Please check format.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMappingComplete = (bankMapped, bookMapped) => {
        onDataLoaded(bankMapped, bookMapped, toleranceDays, useRefMatching);
    };

    // If Mapper is active
    if (showMapper) {
        return (
            <ColumnMapper
                bankData={bankDataPreview}
                bookData={bookDataPreview}
                bankHeaders={bankHeaders}
                bookHeaders={bookHeaders}
                onComplete={handleMappingComplete}
                t={t}
            />
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ textAlign: 'right', flex: 1 }}>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                        {t('upload.title')}
                    </h2>
                    <p className="text-gray-500 mt-2">{t('upload.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* File 1 Upload: Bank Statement */}
                <div className={`upload-card ${bankFile ? 'border-emerald-500 bg-emerald-50' : ''}`}>
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Upload size={48} className={`mb-4 ${bankFile ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <h3 className="text-lg font-semibold mb-2">
                            {t('upload.file1.bank')}
                        </h3>
                        {bankFile ? (
                            <div className="flex items-center gap-2 text-emerald-700 bg-white px-4 py-2 rounded-full shadow-sm">
                                <FileText size={16} />
                                <span className="font-medium">{bankFile.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); setBankFile(null); }} className="ml-2 hover:text-red-500">×</button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500 mb-4">{t('upload.dragDrop')}</p>
                                <label className="btn btn-primary cursor-pointer">
                                    {t('upload.selectFile')}
                                    <input type="file" accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'bank')} />
                                </label>
                            </>
                        )}
                    </div>
                </div>

                {/* File 2 Upload: Book Record */}
                <div className={`upload-card ${bookFile ? 'border-emerald-500 bg-emerald-50' : ''}`}>
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Upload size={48} className={`mb-4 ${bookFile ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <h3 className="text-lg font-semibold mb-2">
                            {t('upload.file2.bank')}
                        </h3>
                        {bookFile ? (
                            <div className="flex items-center gap-2 text-emerald-700 bg-white px-4 py-2 rounded-full shadow-sm">
                                <FileText size={16} />
                                <span className="font-medium">{bookFile.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); setBookFile(null); }} className="ml-2 hover:text-red-500">×</button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500 mb-4">{t('upload.dragDrop')}</p>
                                <label className="btn btn-primary cursor-pointer">
                                    {t('upload.selectFile')}
                                    <input type="file" accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'book')} />
                                </label>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Settings & Action */}
            <div className="flex flex-col items-center gap-6">
                <div className="settings-panel card w-full max-w-2xl bg-gray-50">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Settings size={18} /> {t('upload.settings')}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">{t('upload.tolerance')}</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={toleranceDays}
                                    onChange={(e) => setToleranceDays(parseInt(e.target.value) || 0)}
                                    className="input-field w-20"
                                />
                                <span className="text-xs text-gray-500">{t('upload.toleranceDesc').replace('X', toleranceDays)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="refMatch"
                                checked={useRefMatching}
                                onChange={(e) => setUseRefMatching(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                            <label htmlFor="refMatch" className="text-sm text-gray-700 cursor-pointer select-none">
                                {t('upload.refMatch')}
                            </label>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleProcessFiles}
                    disabled={!bankFile || !bookFile || isProcessing}
                    className={`btn btn-large w-full max-w-md ${(!bankFile || !bookFile) ? 'opacity-50 cursor-not-allowed' : 'btn-primary'}`}
                >
                    {isProcessing ? (
                        <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t('upload.processing')}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            {t('upload.next')} <ArrowRight size={20} />
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default FileUpload;
