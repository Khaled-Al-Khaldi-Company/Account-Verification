import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import FileUpload from './components/FileUpload';
import { translations } from './utils/translations';
import './index.css';

function AppSimple() {
    const [showWelcome, setShowWelcome] = useState(false); // Skip welcome for now
    const [reconMode, setReconMode] = useState('bank');
    const lang = 'ar';

    const t = (key) => {
        // Simple translation mock
        const keys = key.split('.');
        let val = translations[lang];
        for (const k of keys) val = val?.[k];
        return val || key;
    };

    if (showWelcome) {
        return <WelcomeScreen onStart={() => setShowWelcome(false)} t={t} />;
    }

    return (
        <div className="app-main">
            <h1>FileUpload Check</h1>
            <FileUpload
                onDataLoaded={() => alert('Loaded!')}
                t={t}
                reconMode={reconMode}
                setReconMode={setReconMode}
            />
        </div>
    );
}
export default AppSimple;
