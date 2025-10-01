
let cleanedData = null;
let headers = null;

// Configuración de drag & drop
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
        processFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        processFile(e.target.files[0]);
    }
});

function addLog(message) {
    const logContent = document.getElementById('logContent');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

function extractDomain(url) {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

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

            // Paso 1: Eliminar duplicados exactos (name + username + password)
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

            // Paso 2: Eliminar duplicados por dominio
            const domainMap = new Map();
            let domainDupsRemoved = 0;

            for (const entry of afterExact) {
                const domain = extractDomain(entry.login_uri);
                const key = `${domain}|${entry.login_username || ''}|${entry.login_password || ''}`;

                if (!domainMap.has(key)) {
                    domainMap.set(key, entry);
                } else {
                    // Preferir el registro con URI más corta (más genérica)
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

            // Actualizar estadísticas
            document.getElementById('totalOriginal').textContent = originalCount;
            document.getElementById('exactDuplicates').textContent = exactDupsRemoved;
            document.getElementById('domainDuplicates').textContent = domainDupsRemoved;
            document.getElementById('totalClean').textContent = cleanedData.length;

            // Mostrar elementos
            document.getElementById('stats').style.display = 'block';
            document.getElementById('processLog').style.display = 'block';
            document.getElementById('warning').style.display = 'block';
            document.getElementById('success').style.display = 'block';
            document.getElementById('actions').style.display = 'block';

            // Auto-descargar el archivo
            downloadCleanedCSV();
        }
    });
}

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

document.getElementById('downloadBtn').addEventListener('click', downloadCleanedCSV);

document.getElementById('resetBtn').addEventListener('click', () => {
    location.reload();
});