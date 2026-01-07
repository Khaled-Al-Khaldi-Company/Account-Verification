import * as XLSX from 'xlsx';
import { parsePdfFile } from './pdfParser';

// Excel stores dates as serial numbers (days since Dec 30 1899)
const excelDateToJSDate = (serial) => {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info;
};

const readExcelOrCsv = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        let workbook;

        // Handle format based on extension or content
        const isCSV = file.name.toLowerCase().endsWith('.csv');

        if (isCSV) {
          workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            codepage: 65001 // Try UTF-8 first
          });
        } else {
          try {
            workbook = XLSX.read(data, { type: 'array', cellDates: true });
          } catch (e2) {
            // Fallback for older XLS formats if basic read fails
            workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          }
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Ensure we get raw values to inspect headers if needed, but sheet_to_json is usually fine
        let rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        // Post-processing check: did we get garbage characters?
        const headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
        const hasGarbage = headers.some(h => h.includes('Ø') || h.includes('Ù'));

        if (hasGarbage && isCSV) {
          // RETRY with Windows-1256 Codepage for Arabic
          const workbookRetry = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            codepage: 1256 // Arabic Windows
          });
          const wsRetry = workbookRetry.Sheets[workbookRetry.SheetNames[0]];
          rawData = XLSX.utils.sheet_to_json(wsRetry, { defval: "" });
        }

        // Extract headers again from final data
        const finalHeaders = rawData.length > 0 ? Object.keys(rawData[0]) : [];

        resolve({
          data: rawData,
          headers: finalHeaders
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export const parseExcelFile = (file) => {
  // Check for PDF
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return parsePdfFile(file);
  }

  // Default to Excel/CSV
  return readExcelOrCsv(file);
};
