export const normalizeAmount = (val) => {
    if (typeof val === 'number') return Math.abs(val);
    if (typeof val === 'string') {
        const clean = val.replace(/[^0-9.-]/g, '');
        return Math.abs(parseFloat(clean) || 0);
    }
    return 0;
};

const findDateColumn = (row) => {
    if (row.__date !== undefined) return '__date';
    const keys = Object.keys(row);
    const candidates = ['date', 'time', 'day', 'التاريخ', 'تاريخ', 'يوم', 'الوقت'];
    let match = keys.find(k => candidates.some(c => k.toLowerCase().includes(c)));
    if (match) return match;
    return keys.find(k => row[k] instanceof Date);
};

// Helper to safely parse dates (handles Excel serial, ISO strings, and DD/MM/YYYY)
const parseDateHelper = (val) => {
    if (!val) return null;

    // If it's already a date object
    if (val instanceof Date) return val;

    // If it's a number (Excel serial) - unlikely here as XLSX usually converts, but good to check
    if (typeof val === 'number') {
        // Simple check if it looks like Excel date (>25569 is 1970+)
        if (val > 25569 && val < 2958465) {
            const utc_days = Math.floor(val - 25569);
            return new Date(utc_days * 86400 * 1000);
        }
        return new Date(val); // Timestamp?
    }

    if (typeof val === 'string') {
        // Try DD/MM/YYYY format (common in regions using this app)
        // Regex for DD/MM/YYYY or DD-MM-YYYY
        const dmy = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dmy) {
            return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));
        }

        // Try standard parse
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
    }

    return null;
};

export const getDayDiff = (d1, d2) => {
    const date1 = parseDateHelper(d1);
    const date2 = parseDateHelper(d2);

    if (!date1 || !date2) return NaN; // Return NaN to indicate invalid date, handled in UI

    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const findReferenceColumn = (row) => {
    if (row.__ref !== undefined) return '__ref';
    const keys = Object.keys(row);
    const candidates = ['ref', 'check', 'cheque', 'doc', 'no', 'id', 'مرجع', 'رقم', 'شيك', 'سند', 'مستند'];
    return keys.find(k => candidates.some(c => k.toLowerCase().includes(c) && !k.toLowerCase().includes('date') && !k.toLowerCase().includes('amount')));
};

export const findAmountColumn = (row) => {
    if (row.__amount !== undefined) return '__amount';
    const keys = Object.keys(row);
    const candidates = ['amount', 'debit', 'credit', 'balance', 'المبلغ', 'القيمة', 'رصيد', 'مدين', 'دائن'];
    return keys.find(k => candidates.some(c => k.toLowerCase().includes(c))) || keys.find(k => typeof row[k] === 'number');
};

// Helper to check if signs match (Safe for legacy data)
const isSameSign = (item1, item2) => {
    // If __displayAmount is missing (legacy), assume true or skip strict check
    if (item1.__displayAmount === undefined || item2.__displayAmount === undefined) return true;

    // Treat 0 as matching any sign, though 0s are usually filtered.
    // Use Math.sign: 1 for pos, -1 for neg
    return Math.sign(item1.__displayAmount) === Math.sign(item2.__displayAmount);
};

// --- CORE MATCHING FUNCTIONS ---

// --- REFACTORED MATCHING LOGIC (Granular Classification) ---

// Helper: Check Description Intersection
const hasDescMatch = (d1, d2) => {
    if (!d1 || !d2) return false;
    const clean = str => str.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF ]/g, ''); // Keep Arabic
    const t1 = clean(d1).split(/\s+/).filter(x => x.length > 2);
    const t2 = clean(d2).split(/\s+/).filter(x => x.length > 2);
    // Return true if any significant token overlaps
    return t1.some(token => t2.includes(token));
};

// 1. Perfect Match (Pass 1)
// - Exact Amount
// - Date Diff == 0 (Strict)
// - Ref Match (If enabled and available)
const findPerfectMatches = (bankItems, bookItems, useRefMatching) => {
    const matches = [];
    const usedBookIndices = new Set();
    const unmatchedBank = [];

    bankItems.forEach(bankItem => {
        const matchIndex = bookItems.findIndex((bookItem, idx) => {
            if (usedBookIndices.has(idx)) return false;

            // 1. Amount
            if (Math.abs(bankItem.__amount - bookItem.__amount) >= 0.01) return false;

            // 2. Date (Strict 0)
            if (getDayDiff(bankItem.__date, bookItem.__date) !== 0) return false;

            // 3. Ref (If Strict Mode enabled)
            if (useRefMatching) {
                if (!bankItem.__ref || !bookItem.__ref || bankItem.__ref !== bookItem.__ref) return false;
            }

            // 4. Sign
            if (!isSameSign(bankItem, bookItem)) return false;

            return true;
        });

        if (matchIndex !== -1) {
            usedBookIndices.add(matchIndex);
            matches.push({
                id: `perfect-${Date.now()}-${Math.random()}`,
                bank: bankItem,
                book: bookItems[matchIndex],
                amount: bankItem.__amount,
                dateDiff: 0,
                matchType: 'Exact' // Keep legacy ID for "Confirmed" bucket logic in frontend
            });
        } else {
            unmatchedBank.push(bankItem);
        }
    });

    const remainingBook = bookItems.filter((_, idx) => !usedBookIndices.has(idx));
    return { matches, remainingBank: unmatchedBank, remainingBook };
};

// 2. Strong Potential Matches (Pass 2)
// - Exact Amount
// - Date Diff > 0 (Up to 60 days to catch delayed clearing)
// - PLUS: Ref Match OR Desc Match
const findStrongMatches = (bankItems, bookItems) => {
    const matches = [];
    const usedBookIndices = new Set();
    const unmatchedBank = [];

    bankItems.forEach(bankItem => {
        const matchIndex = bookItems.findIndex((bookItem, idx) => {
            if (usedBookIndices.has(idx)) return false;

            // 1. Amount
            if (Math.abs(bankItem.__amount - bookItem.__amount) >= 0.01) return false;

            // 2. Sign
            if (!isSameSign(bankItem, bookItem)) return false;

            // 3. Date Check (Loose - up to 60 days)
            const diff = getDayDiff(bankItem.__date, bookItem.__date);
            if (diff > 60) return false;

            // 4. Evidence Chceck (Ref OR Desc)
            const refMatch = (bankItem.__ref && bookItem.__ref && bankItem.__ref === bookItem.__ref);
            const descMatch = hasDescMatch(bankItem.__desc, bookItem.__desc);

            if (refMatch || descMatch) return true;

            return false;
        });

        if (matchIndex !== -1) {
            usedBookIndices.add(matchIndex);
            matches.push({
                id: `strong-${Date.now()}-${Math.random()}`,
                bank: bankItem,
                book: bookItems[matchIndex],
                amount: bankItem.__amount,
                dateDiff: getDayDiff(bankItem.__date, bookItems[matchIndex].__date),
                matchType: 'Potential-Strong' // New Type
            });
        } else {
            unmatchedBank.push(bankItem);
        }
    });

    const remainingBook = bookItems.filter((_, idx) => !usedBookIndices.has(idx));
    return { matches, remainingBank: unmatchedBank, remainingBook };
};

// 3. Amount Only Matches (Pass 3)
// - Exact Amount
// - Date Diff within User Tolerance (or default 7 days if 0)
// - No other evidence
const findAmountOnlyMatches = (bankItems, bookItems, toleranceDays) => {
    const matches = [];
    const usedBookIndices = new Set();
    const unmatchedBank = [];

    // If user says tolerance=0, they usually mean strict. But here we want to offer suggestions.
    // Let's use max(tolerance, 7) for suggestions.
    const effectiveTolerance = Math.max(toleranceDays, 7);

    bankItems.forEach(bankItem => {
        const matchIndex = bookItems.findIndex((bookItem, idx) => {
            if (usedBookIndices.has(idx)) return false;

            // 1. Amount
            if (Math.abs(bankItem.__amount - bookItem.__amount) >= 0.01) return false;

            // 2. Sign
            if (!isSameSign(bankItem, bookItem)) return false;

            // 3. Date
            const diff = getDayDiff(bankItem.__date, bookItem.__date);
            if (diff > effectiveTolerance) return false;

            return true;
        });

        if (matchIndex !== -1) {
            usedBookIndices.add(matchIndex);
            matches.push({
                id: `amount-${Date.now()}-${Math.random()}`,
                bank: bankItem,
                book: bookItems[matchIndex],
                amount: bankItem.__amount,
                dateDiff: getDayDiff(bankItem.__date, bookItems[matchIndex].__date),
                matchType: 'Potential-Amount' // New Type
            });
        } else {
            unmatchedBank.push(bankItem);
        }
    });

    const remainingBook = bookItems.filter((_, idx) => !usedBookIndices.has(idx));
    return { matches, remainingBank: unmatchedBank, remainingBook };
};

// 4. Many-to-One Match (Keep Existing Logic, but adapt)
const findManyToOneMatches = (bankItems, bookItems, toleranceDays) => {
    const matches = [];
    const usedBankIndices = new Set();
    const usedBookIndices = new Set();
    const range = Math.max(toleranceDays, 3); // Minimal range for grouping

    bookItems.forEach((bookItem, bookIdx) => {
        if (usedBookIndices.has(bookIdx)) return;

        const candidateIndices = [];
        let currentSum = 0;

        bankItems.forEach((bankItem, bankIdx) => {
            if (usedBankIndices.has(bankIdx)) return;
            if (!isSameSign(bankItem, bookItem)) return;

            const diff = getDayDiff(bookItem.__date, bankItem.__date);
            if (diff <= range) {
                candidateIndices.push(bankIdx);
                currentSum += bankItem.__amount;
            }
        });

        if (candidateIndices.length > 1 && Math.abs(currentSum - bookItem.__amount) < 0.05) {
            usedBookIndices.add(bookIdx);
            candidateIndices.forEach(idx => usedBankIndices.add(idx));
            matches.push({
                id: `m2o-${Date.now()}-${matches.length}`,
                bank: candidateIndices.map(idx => bankItems[idx]),
                book: bookItem,
                amount: bookItem.__amount,
                dateDiff: 0,
                matchType: 'Many-to-One'
            });
        }
    });

    const remainingBank = bankItems.filter((_, idx) => !usedBankIndices.has(idx));
    const remainingBook = bookItems.filter((_, idx) => !usedBookIndices.has(idx));
    return { matches, remainingBank, remainingBook };
};

// 5. One-to-Many (Keep Existing)
const findOneToManyMatches = (bankItems, bookItems, toleranceDays) => {
    const matches = [];
    const usedBankIndices = new Set();
    const usedBookIndices = new Set();
    const range = Math.max(toleranceDays, 3);

    for (let i = 0; i < bankItems.length; i++) {
        if (usedBankIndices.has(i)) continue;
        const bankItem = bankItems[i];

        const candidates = bookItems.map((item, idx) => ({ item, idx }))
            .filter(({ item, idx }) => {
                if (usedBookIndices.has(idx)) return false;
                if (!isSameSign(bankItem, item)) return false;
                if (item.__amount > bankItem.__amount + 0.01) return false;
                const diff = getDayDiff(bankItem.__date, item.__date);
                return diff <= range;
            })
            .sort((a, b) => b.item.__amount - a.item.__amount);

        const target = bankItem.__amount;
        let solution = null;

        const solve = (idx, currentSum, indices) => {
            if (solution) return;
            if (Math.abs(currentSum - target) < 0.05) {
                solution = indices;
                return;
            }
            if (idx >= candidates.length || indices.length >= 5) return;
            if (currentSum > target + 0.05) return;

            solve(idx + 1, currentSum + candidates[idx].item.__amount, [...indices, candidates[idx].idx]);
            solve(idx + 1, currentSum, indices);
        };

        if (candidates.length > 1) {
            solve(0, 0, []);
        }

        if (solution && solution.length > 1) {
            usedBankIndices.add(i);
            solution.forEach(idx => usedBookIndices.add(idx));
            matches.push({
                id: `o2m-${Date.now()}-${matches.length}`,
                bank: bankItem,
                book: solution.map(idx => bookItems[idx]),
                amount: bankItem.__amount,
                dateDiff: 0,
                matchType: 'One-to-Many (Smart)'
            });
        }
    }

    const remainingBank = bankItems.filter((_, idx) => !usedBankIndices.has(idx));
    const remainingBook = bookItems.filter((_, idx) => !usedBookIndices.has(idx));
    return { matches, remainingBank, remainingBook };
};

// 6. Variance Match (Keep Legacy for completeness)
const findVarianceMatches = (bankItems, bookItems, toleranceDays) => {
    const matches = [];
    const usedBookIndices = new Set();
    const unmatchedBank = [];

    const range = Math.max(toleranceDays, 5); // At least 5 days for variance

    bankItems.forEach(bankItem => {
        const matchIndex = bookItems.findIndex((bookItem, idx) => {
            if (usedBookIndices.has(idx)) return false;
            if (!isSameSign(bankItem, bookItem)) return false;

            const diff = Math.abs(bankItem.__amount - bookItem.__amount);
            if (diff < 0.01 || diff >= 1.0) return false;

            const dateDiff = getDayDiff(bankItem.__date, bookItem.__date);
            if (dateDiff > range) return false;

            return true;
        });

        if (matchIndex !== -1) {
            usedBookIndices.add(matchIndex);
            matches.push({
                id: `var-${Date.now()}-${matches.length}`,
                bank: bankItem,
                book: bookItems[matchIndex],
                amount: bankItem.__amount,
                amountDiff: bankItem.__amount - bookItems[matchIndex].__amount,
                dateDiff: getDayDiff(bankItem.__date, bookItems[matchIndex].__date),
                matchType: 'Amount-Variance'
            });
        } else {
            unmatchedBank.push(bankItem);
        }
    });

    const remainingBook = bookItems.filter((_, idx) => !usedBookIndices.has(idx));
    return { matches, remainingBank: unmatchedBank, remainingBook };
};


// --- MAIN RECONCILIATION FUNCTION ---
export const reconcileData = (bankData, bookData, toleranceDays = 0, useRefMatching = false) => {
    let currentBank = bankData.filter(i => i.__amount && i.__amount !== 0);
    let currentBook = bookData.filter(i => i.__amount && i.__amount !== 0);
    let allMatches = [];

    // Pass 1: Perfect Matches (Exact Amount, Date=0, Ref Optional) -> "Confirmed"
    const perfect = findPerfectMatches(currentBank, currentBook, useRefMatching);
    allMatches = [...allMatches, ...perfect.matches];
    currentBank = perfect.remainingBank;
    currentBook = perfect.remainingBook;

    // Pass 2: Strong Matches (Exact Amount, Ref/Desc Hit, Loose Date) -> "Review: Strong"
    const strong = findStrongMatches(currentBank, currentBook);
    allMatches = [...allMatches, ...strong.matches];
    currentBank = strong.remainingBank;
    currentBook = strong.remainingBook;

    // Pass 3: Group Matches (Many-to-One / One-to-Many) -> "Confirmed" or "Review" depending on implementation
    // We treat existing Group algos as reasonably safe, but maybe classify as "Confirmed"?
    // The previous app logic put them in "Confirmed" (Exact/M2O).
    // Let's stick them in Confirmed logic or keep their type 'Many-to-One' which goes to Confirmed in frontend.
    const m2o = findManyToOneMatches(currentBank, currentBook, toleranceDays);
    allMatches = [...allMatches, ...m2o.matches];
    currentBank = m2o.remainingBank;
    currentBook = m2o.remainingBook;

    const o2m = findOneToManyMatches(currentBank, currentBook, toleranceDays);
    allMatches = [...allMatches, ...o2m.matches];
    currentBank = o2m.remainingBank;
    currentBook = o2m.remainingBook;

    // Pass 4: Amount Only (Exact Amount, Reasonable Date, No Evidence) -> "Review: Check Date"
    const amountOnly = findAmountOnlyMatches(currentBank, currentBook, toleranceDays);
    allMatches = [...allMatches, ...amountOnly.matches];
    currentBank = amountOnly.remainingBank;
    currentBook = amountOnly.remainingBook;

    // Pass 5: Variance (Small diff, e.g. floating point or fee) -> "Review: Variance"
    const variance = findVarianceMatches(currentBank, currentBook, toleranceDays);
    allMatches = [...allMatches, ...variance.matches];
    currentBank = variance.remainingBank;
    currentBook = variance.remainingBook;

    return {
        matches: allMatches,
        unmatchedBank: currentBank,
        unmatchedBook: currentBook
    };
};
