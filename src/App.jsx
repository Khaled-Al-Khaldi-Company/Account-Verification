import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ResultsDashboard from './components/ResultsDashboard';
import HistoryViewer from './components/HistoryViewer';
import WelcomeScreen from './components/WelcomeScreen';
import { reconcileData } from './utils/matcher';
import { getHistoryList, saveToHistory } from './utils/historyManager';
import { translations } from './utils/translations';
import { LayoutGrid, History, ShieldCheck, FileText, Globe } from 'lucide-react';

function App() {
  // State
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState('reconcile'); // 'reconcile' | 'history' | 'report'
  const [reconcileStep, setReconcileStep] = useState('upload'); // 'upload' | 'results'
  const [results, setResults] = useState(null);
  const [lastReport, setLastReport] = useState(null);

  // Language State
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'ar'); // Default AR

  // Effect to handle language changes (RTL/LTR and Fonts)
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.style.fontFamily = lang === 'ar' ? 'Tajawal, sans-serif' : 'Inter, sans-serif';
  }, [lang]);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    if (!value) return key;
    Object.keys(params).forEach(param => {
      value = value.replace(`{${param}}`, params[param]);
    });
    return value;
  };

  const handleDataLoaded = (bankData, bookData, toleranceDays, useRefMatching) => {
    // Save to History (Archive)
    saveToHistory(bankData, 'bank');
    saveToHistory(bookData, 'book');

    // Process Data
    const reconciliationResults = reconcileData(bankData, bookData, toleranceDays, useRefMatching);
    setResults(reconciliationResults);
    setLastReport(reconciliationResults); // Save backup for 'Last Report' tab
    setReconcileStep('results');
  };

  const handleReconcileArchive = () => {
    const bankHist = getHistoryList('bank');
    const bookHist = getHistoryList('book');
    if (bankHist.length === 0 || bookHist.length === 0) {
      alert(t('history.noData'));
      return;
    }

    const results = reconcileData(bankHist, bookHist, 0, false);
    setResults(results);
    setLastReport(results);
    setReconcileStep('results');
    setActiveTab('reconcile');
  };

  const handleReset = () => {
    setResults(null);
    setReconcileStep('upload');
  };

  return (
    <>
      {showWelcome ? (
        <WelcomeScreen onStart={() => setShowWelcome(false)} t={t} />
      ) : (
        <div className="app-main animate-fade-in">
          {/* Top Navigation Bar */}
          <header className="app-header">
            <div className="brand">
              <ShieldCheck size={28} className="text-primary" />
              <span>{t('appTitle')}</span>
            </div>

            <nav className="nav-links">
              <button
                className={`nav-item ${activeTab === 'reconcile' ? 'active' : ''}`}
                onClick={() => setActiveTab('reconcile')}
              >
                <LayoutGrid size={18} /> {t('nav.reconcile')}
              </button>
              <button
                className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}
                onClick={() => setActiveTab('report')}
              >
                <FileText size={18} /> {t('nav.report')}
              </button>
              <button
                className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={18} /> {t('nav.history')}
              </button>

              <div style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 0.5rem' }}></div>

              <button onClick={toggleLang} className="nav-item" title="Switch Language / تغيير اللغة">
                <Globe size={18} /> {lang === 'en' ? 'عربي' : 'English'}
              </button>
            </nav>
          </header>

          {/* Main Content Area */}
          <main className="main-content animate-fade-in">

            {/* View: Reconciliation */}
            {activeTab === 'reconcile' && (
              <>
                {reconcileStep === 'upload' && (
                  <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <FileUpload
                      onDataLoaded={handleDataLoaded}
                      t={t}
                    />
                  </div>
                )}

                {reconcileStep === 'results' && results && (
                  <ResultsDashboard data={results} onReset={handleReset} t={t} />
                )}
              </>
            )}

            {/* View: Last Report */}
            {activeTab === 'report' && (
              <>
                {lastReport ? (
                  <div className="animate-fade-in">
                    <div style={{ padding: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', marginBottom: '1rem', color: '#065f46' }}>
                      <b>{lang === 'ar' ? 'عرض التقرير الأخير' : 'Viewing Last Generated Report'}</b> <br />
                      <span style={{ fontSize: '0.9rem' }}>{lang === 'ar' ? 'هذه نسخة محفوظة من آخر مطابقة ناجحة.' : 'This is a saved copy of your last successful reconciliation.'}</span>
                    </div>
                    <ResultsDashboard data={lastReport} onReset={() => setActiveTab('reconcile')} t={t} />
                  </div>
                ) : (
                  <div className="card text-center p-8">
                    <div style={{ color: '#ccc', marginBottom: '1rem' }}><FileText size={64} /></div>
                    <h3>{t('history.noRecords') || "No Reports Available"}</h3>
                    <button className="btn btn-primary" onClick={() => setActiveTab('reconcile')} style={{ marginTop: '1rem' }}>
                      {t('nav.reconcile')}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* View: History */}
            {activeTab === 'history' && (
              <HistoryViewer onBack={() => setActiveTab('reconcile')} onReconcile={handleReconcileArchive} t={t} />
            )}

          </main>
        </div>
      )}
    </>
  );
}

export default App;
