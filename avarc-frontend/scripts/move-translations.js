const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOCALES = {
    'de': 'de-DE',
    'tr': 'tr-TR'
};

const FILES = [
    'user.json',
    'auth.json',
    'dashboard.json',
    'home.json',
    'common.json',
    'api.json'
];

function prepareForUpload() {
    console.log('Preparing translations for upload...');

    // Create full locale directories if they don't exist
    Object.values(LOCALES).forEach(locale => {
        const targetDir = path.join('public', 'locales', locale);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
    });

    // Copy files from two-letter code to full locale
    Object.entries(LOCALES).forEach(([twoLetterCode, fullLocale]) => {
        FILES.forEach(file => {
            const sourcePath = path.join('public', 'locales', twoLetterCode, file);
            const targetPath = path.join('public', 'locales', fullLocale, file);

            if (fs.existsSync(sourcePath)) {
                console.log(`Copying ${sourcePath} to ${targetPath}`);
                fs.copyFileSync(sourcePath, targetPath);
            }
        });
    });
}

function cleanupAfterUpload() {
    console.log('Cleaning up full locale directories...');

    // Remove full locale directories and their contents
    Object.values(LOCALES).forEach(locale => {
        const fullLocaleDir = path.join('public', 'locales', locale);
        if (fs.existsSync(fullLocaleDir)) {
            console.log(`Removing ${fullLocaleDir}`);
            fs.rmSync(fullLocaleDir, { recursive: true, force: true });
        }
    });
}

function moveAfterDownload() {
    console.log('Moving translations after download...');

    // Create target directories if they don't exist
    Object.keys(LOCALES).forEach(locale => {
        const targetDir = path.join('public', 'locales', locale);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
    });

    // Move files from full locale to two-letter code
    Object.entries(LOCALES).forEach(([twoLetterCode, fullLocale]) => {
        FILES.forEach(file => {
            const sourcePath = path.join('public', 'locales', fullLocale, file);
            const targetPath = path.join('public', 'locales', twoLetterCode, file);

            if (fs.existsSync(sourcePath)) {
                console.log(`Moving ${sourcePath} to ${targetPath}`);
                fs.renameSync(sourcePath, targetPath);
            }
        });

        // Remove the full locale directory if empty
        const fullLocaleDir = path.join('public', 'locales', fullLocale);
        if (fs.existsSync(fullLocaleDir) && fs.readdirSync(fullLocaleDir).length === 0) {
            fs.rmdirSync(fullLocaleDir);
        }
    });
}

// Check command line argument to determine which function to run
const command = process.argv[2];
if (command === 'prepare') {
    prepareForUpload();
    console.log('Translation preparation completed successfully');
} else if (command === 'cleanup') {
    cleanupAfterUpload();
    console.log('Cleanup completed successfully');
} else if (command === 'move') {
    moveAfterDownload();
    console.log('Translation move completed successfully');
} else {
    console.error('Please specify either "prepare", "cleanup", or "move" as the command');
    process.exit(1);
}
