import * as pdfjsLib from 'pdfjs-dist';

// Set worker using the CDN or local file (preferred for Vite bundling)
// In a Vite environment, we often need to point to the worker explicitly.
// We'll try dynamic import for worker if possible, or use a CDN fallback to avoid build issues.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const parsePdfFile = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullTextItems = [];

    // Iterate over all pages
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Map items to a simpler structure: { str, x, y, w, h }
        const items = textContent.items.map(item => {
            // item.transform is [scaleX, skewY, skewX, scaleY, x, y]
            // PDF coordinate system: (0,0) is usually bottom-left.
            const tx = item.transform;
            return {
                str: item.str,
                x: tx[4],
                y: tx[5], // Higher Y is higher on the page
                w: item.width,
                h: item.height || (tx[3]) // Approximate height from scaling factor
            };
        });

        fullTextItems.push(...items);
    }

    if (fullTextItems.length === 0) {
        throw new Error("No text found in PDF. It might be scanned image.");
    }

    // Sort all items: First by Y (descending -> Top to Bottom), then by X (ascending -> Left to Right)
    // We give a small tolerance for Y to group them into lines
    fullTextItems.sort((a, b) => {
        const yDiff = b.y - a.y;
        if (Math.abs(yDiff) < 5) return a.x - b.x; // Same line (roughly), sort by X
        return yDiff; // Different line, sort by Y
    });

    // Group into rows
    const rows = [];
    let currentRow = [];
    let currentY = null;

    for (const item of fullTextItems) {
        if (!item.str.trim()) continue; // Skip empty whitespace items

        if (currentY === null || Math.abs(item.y - currentY) < 8) {
            // Same row
            if (currentY === null) currentY = item.y;
            currentRow.push(item);
        } else {
            // New row
            rows.push(currentRow);
            currentRow = [item];
            currentY = item.y;
        }
    }
    if (currentRow.length > 0) rows.push(currentRow);

    // Convert rows to JSON-like structure
    // We need to guess headers. We'll assume the first row with > 1 items is the header.
    // However, bank statements often have metadata at the top.

    // Strategy: Find the row with the most items and use that as "Column Count" reference?
    // Better Strategy for MVP: Just dump everything into generic columns "Col1", "Col2" unless we find a Header row.

    // Let's create a generic table. We need to align columns.
    // Simple approach: Just join items in a row with some heuristic or keep them as array.

    // To make it compatible with the rest of the app (which expects array of objects),
    // We will try to find a header row (often contains keywords like "Date", "Amount", "Description").
    // If not found, we use the first row as header.

    // Let's look for common header keywords
    const headerKeywords = ['date', 'amount', 'description', 'reference', 'balance', 'debit', 'credit', 'ref', 'details', 'val'];
    let headerRowIndex = -1;

    for (let i = 0; i < Math.min(rows.length, 20); i++) { // Check first 20 rows
        const rowText = rows[i].map(c => c.str.toLowerCase()).join(' ');
        let matchCount = 0;
        headerKeywords.forEach(k => {
            if (rowText.includes(k)) matchCount++;
        });
        if (matchCount >= 2) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) headerRowIndex = 0; // Fallback to first row

    const headers = rows[headerRowIndex].map((item, idx) => item.str.trim() || `Col_${idx}`);
    // Deduplicate headers
    const uniqueHeaders = [];
    const counts = {};
    headers.forEach(h => {
        if (counts[h]) {
            counts[h]++;
            uniqueHeaders.push(`${h}_${counts[h]}`);
        } else {
            counts[h] = 1;
            uniqueHeaders.push(h);
        }
    });

    const data = [];

    // Process rows after header
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const rowItems = rows[i];
        const rowObj = {};

        // Naive mapping: Map item 0 to header 0, item 1 to header 1...
        // This fails if a column is empty in PDF (no text object).
        // A better way is using X-coordinate to map to nearest header X-coordinate.

        // Calculate header X boundaries (center points)
        const headerCenters = rows[headerRowIndex].map(h => h.x + (h.w / 2));

        rowItems.forEach(item => {
            const itemCenter = item.x + (item.w / 2);
            // Find closest header
            let closestIdx = -1;
            let minDiff = Infinity;

            headerCenters.forEach((hc, idx) => {
                const diff = Math.abs(hc - itemCenter);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIdx = idx;
                }
            });

            if (closestIdx !== -1 && minDiff < 100) { // Threshold for column alignment
                const key = uniqueHeaders[closestIdx];
                // If multiple items map to same column in one row (e.g. wrapped text), append them
                rowObj[key] = rowObj[key] ? rowObj[key] + ' ' + item.str : item.str;
            } else {
                // If it doesn't align well, maybe put it in a catch-all or just push to closest
                if (closestIdx !== -1) {
                    const key = uniqueHeaders[closestIdx];
                    rowObj[key] = rowObj[key] ? rowObj[key] + ' ' + item.str : item.str;
                }
            }
        });

        // Clean up
        Object.keys(rowObj).forEach(k => {
            rowObj[k] = rowObj[k].trim();
        });

        if (Object.keys(rowObj).length > 0) {
            data.push(rowObj);
        }
    }

    return {
        data,
        headers: uniqueHeaders
    };
};
