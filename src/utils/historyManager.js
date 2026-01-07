// Utility to manage historical data and detect duplicates using LocalStorage
// In a real production app, this would query a backend database.

const STORAGE_KEYS = {
    BANK_HISTORY: 'bank_sheet_history_bank',
    BOOK_HISTORY: 'bank_sheet_history_book'
};

// Generate a unique fingerprint for a transaction
// We use a combination of stable fields to avoid false duplicate flags on similar but distinct items
export const generateFingerprint = (item) => {
    // Ideally use Reference if available
    const ref = item.__ref ? String(item.__ref).trim().toLowerCase() : '';
    const amount = typeof item.__amount === 'number' ? item.__amount.toFixed(2) : '0.00';

    let dateStr = 'no-date';
    if (item.__date !== undefined && item.__date !== null) {
        try {
            // Safely attempt to parse date
            const d = new Date(item.__date);
            if (!isNaN(d.getTime())) {
                dateStr = d.toISOString().split('T')[0];
            } else {
                // If it's a string that Date() couldn't parse, use substring
                dateStr = String(item.__date).substring(0, 10);
            }
        } catch (e) {
            dateStr = 'invalid-date';
        }
    }

    // If we have a distinct Reference, that + Amount is usually unique enough.
    // If No reference, we must rely on Date + Amount + Description excerpt to be safe.
    if (ref && ref.length > 2) {
        return `REF:${ref}|AMT:${amount}`;
    }

    // Fallback for items without good references
    // We add a hash of description to ensure uniqueness
    const descHash = item.__desc ? String(item.__desc).substring(0, 10).toLowerCase().replace(/\s/g, '') : '';
    return `NOREF:${dateStr}|AMT:${amount}|DSC:${descHash}`;
};

export const getHistory = (type) => {
    const key = type === 'bank' ? STORAGE_KEYS.BANK_HISTORY : STORAGE_KEYS.BOOK_HISTORY;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : {}; // Returns object { fingerprint: timestamp }
    } catch (e) {
        console.error("Failed to load history", e);
        return {};
    }
};

export const saveToHistory = (items, type) => {
    const key = type === 'bank' ? STORAGE_KEYS.BANK_HISTORY : STORAGE_KEYS.BOOK_HISTORY;
    const currentHistory = getHistory(type); // This returns the Lookup Map

    // We also need a linear storage for Viewing if the Map is only keys.
    // To save space, let's keep the Map structure, but value is the Data Object instead of just 'timestamp'.

    let addedCount = 0;

    items.forEach(item => {
        try {
            const fp = generateFingerprint(item);
            if (!currentHistory[fp]) {
                // Store minimal data to save space check legacy vs new
                currentHistory[fp] = {
                    date: item.__date,
                    amount: item.__amount,
                    displayAmount: item.__displayAmount, // Save signed amount
                    ref: item.__ref,
                    desc: item.__desc,
                    importedAt: Date.now()
                };
                addedCount++;
            }
        } catch (e) {
            console.warn("Skipping item in history save due to error", e, item);
        }
    });

    try {
        localStorage.setItem(key, JSON.stringify(currentHistory));
    } catch (e) {
        console.error("Storage full or error saving history", e);
        alert("Warning: Local Storage is full. Older history might not be saved.");
    }
    return addedCount;
};

// Function to retrieve list for display
export const getHistoryList = (type) => {
    const hist = getHistory(type);
    return Object.values(hist).map(v => {
        // Handle legacy records which were just numbers (timestamps)
        if (typeof v === 'number') {
            return { importedAt: v, desc: 'Legacy Record (Details unavailable)', amount: 0, date: null };
        }
        return v;
    }).sort((a, b) => b.importedAt - a.importedAt);
};

export const checkDuplicates = (newItems, type) => {
    const history = getHistory(type);
    const uniqueItems = [];
    const duplicates = [];

    newItems.forEach(item => {
        try {
            const fp = generateFingerprint(item);
            if (history[fp]) {
                duplicates.push(item);
            } else {
                uniqueItems.push(item);
            }
        } catch (e) {
            // If we can't fingerprint (unlikely now), assume unique
            uniqueItems.push(item);
        }
    });

    return { uniqueItems, duplicates };
};

export const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEYS.BANK_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.BOOK_HISTORY);
};
