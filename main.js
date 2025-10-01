// main.js - Bitwarden CSV Cleaner
// This script handles file upload, CSV parsing, duplicate removal, and download logic for the Bitwarden CSV Cleaner web app.

/**
 * Stores the cleaned credential data after processing.
 * @type {Array<Object>|null}
 */
let cleanedData = null;

/**
 * Stores the CSV headers from the uploaded file.
 * @type {Array<string>|null}
 */
let headers = null;

// --- File Upload and Drag & Drop Setup ---

/**
 * Upload area DOM element for drag & drop and click-to-upload.
 * @type {HTMLElement}
 */
const uploadArea = document.getElementById('uploadArea');

/**
 * File input DOM element (hidden).
 * @type {HTMLInputElement}
 */
const fileInput = document.getElementById('fileInput');

// Open file dialog on upload area click
uploadArea.addEventListener('click', () => fileInput.click());

// Highlight upload area on drag over
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

// Remove highlight on drag leave
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

// Handle file drop event
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    // Only process if a CSV file is dropped
    if (files.length > 0 && files[0].type === 'text/csv') {
        processFile(files[0]);
    }
});

// Handle file selection via input
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        processFile(e.target.files[0]);
    }
});

/**
 * Appends a message to the process log area in the UI.
 * @param {string} message - The log message to display.
 */
function addLog(message) {
    const logContent = document.getElementById('logContent');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

/**
 * Extracts the domain from a given URL string.
 * @param {string} url - The URL to extract the domain from.
 * @returns {string} The domain, or the original string if parsing fails.
 */
function extractDomain(url) {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

/**
 * Processes the uploaded CSV file: parses, removes duplicates, updates UI, and triggers download.
 * @param {File} file - The uploaded CSV file.
 */
function processFile(file) {
    addLog('File processing started...');

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            if (!results.data || results.data.length === 0) {
                addLog('Error: The file is empty or is invalid');
                return;
            }

            headers = results.meta.fields;
            const data = results.data;
            const originalCount = data.length;

            addLog(`File loaded: ${originalCount} credential(s) found`);

            // Step 1: Remove exact duplicates (name + username + password)
            const seen = new Set();
            const afterExact = [];
            let exactDupsRemoved = 0;

            for (const entry of data) {
                const key = `${entry.name || ''}|${entry.login_username || ''}|${entry.login_password || ''}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    afterExact.push(entry);
                } else {
                    exactDupsRemoved++;
                    addLog(`Exact duplicate removed: ${entry.name || 'with no name'}`);
                }
            }

            addLog(`Step 1 completed: ${exactDupsRemoved} exact duplicates removed`);

            // Step 2: Remove duplicates by domain (domain + username + password)
            const domainMap = new Map();
            let domainDupsRemoved = 0;

            for (const entry of afterExact) {
                const domain = extractDomain(entry.login_uri);
                const key = `${domain}|${entry.login_username || ''}|${entry.login_password || ''}`;

                if (!domainMap.has(key)) {
                    domainMap.set(key, entry);
                } else {
                    // Prefer the entry with the shorter URI (more generic)
                    const existing = domainMap.get(key);
                    if ((entry.login_uri || '').length < (existing.login_uri || '').length) {
                        domainMap.set(key, entry);
                        addLog(`Replacing longer URI: ${existing.login_uri} -> ${entry.login_uri}`);
                    } else {
                        addLog(`Duplicate by domain removed: ${entry.login_uri || 'With no URI'}`);
                    }
                    domainDupsRemoved++;
                }
            }

            cleanedData = Array.from(domainMap.values());

            addLog(`Step 2 completed: ${domainDupsRemoved} duplicates by domain removed`);
            addLog(`Process finished: ${cleanedData.length} unique credentials`);

            // Update statistics in the UI
            document.getElementById('totalOriginal').textContent = originalCount;
            document.getElementById('exactDuplicates').textContent = exactDupsRemoved;
            document.getElementById('domainDuplicates').textContent = domainDupsRemoved;
            document.getElementById('totalClean').textContent = cleanedData.length;

            // Show relevant UI elements
            document.getElementById('stats').style.display = 'block';
            document.getElementById('processLog').style.display = 'block';
            document.getElementById('warning').style.display = 'block';
            document.getElementById('success').style.display = 'block';
            document.getElementById('actions').style.display = 'block';

            // Automatically download the cleaned CSV file
            downloadCleanedCSV();
        }
    });
}

/**
 * Generates and triggers download of the cleaned CSV file.
 */
function downloadCleanedCSV() {
    if (!cleanedData || !headers) return;

    const csv = Papa.unparse({
        fields: headers,
        data: cleanedData
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bitwarden_cleaned_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    URL.revokeObjectURL(url);
}

// --- UI Button Event Listeners ---

document.getElementById('downloadBtn').addEventListener('click', downloadCleanedCSV);

document.getElementById('resetBtn').addEventListener('click', () => {
    location.reload();
});