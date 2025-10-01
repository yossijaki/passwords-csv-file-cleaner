# 🔐 Passwords CSV file Cleaner

A simple web tool to clean duplicated credentials from any browser- or Bitwarden-exported CSV file securely, directly in your browser.

## ✨ Features
- 🗑️ Removes exact duplicate credentials (same name, username, and password)
- 🌐 Removes duplicates per domain (same domain, username, and password)
- 🛡️ No data leaves your device—all processing is done locally in your browser
- 📥 Cleaned file is automatically downloaded

## 🚀 Usage
1. 📦 **Download or clone this repository.**
2. 🌍 Open `Passwords-csv-files-cleaner.html` in your web browser.
3. 📂 Drag and drop your credentials CSV file into the upload area, or click to select a file.
4. ⏳ Wait for the process to complete. The cleaned CSV will be downloaded automatically.
5. 👀 Review the cleaned file before importing it back into Bitwarden or any password manager.
6. 🔁 (Optional) Use the provided buttons to download the cleaned file again or process another file.

## 🔒 Security Recommendations
- 🖥️ **Local Processing:** All file processing is performed locally in your browser. No data is uploaded or sent to any server.
- 💾 **Backup:** Always back up your original CSV file before cleaning or importing it into any password manager.
- 👓 **Review:** Carefully review the cleaned file to ensure no important credentials were removed by mistake.
- 🤫 **Sensitive Data:** Do not share your CSV files or cleaned files with anyone. Handle them as sensitive information.
- 📝 **Open Source:** You can inspect the code (`main.js`) to verify that no data is transmitted externally.

## 🌐 Supported Browsers
- Chrome
- Firefox
- Edge
- Safari

## 📄 License
This project is open source and available under the GNU General Public License v2.0 (GPL-2.0).
See the LICENSE file for details.
