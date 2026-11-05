/**
 * Study Flow Organizer - Desktop Application Launcher
 *
 * Responsibilities:
 * 1. Checks if the background server is already active on port 3456.
 * 2. Starts the internal HTTP server if not running.
 * 3. Launches a dedicated standalone desktop window via Edge or Chrome in app mode.
 * 4. Ensures clean process termination when the window is closed.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const PORT = process.env.PORT || 3456;
const APP_URL = `http://127.0.0.1:${PORT}`;

function isServerRunning() {
    return new Promise((resolve) => {
        const req = http.get(`${APP_URL}/api/health`, { timeout: 1000 }, (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                resolve(false);
            }
            res.resume();
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
    });
}

function waitForServer(maxAttempts = 30) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            const running = await isServerRunning();
            if (running) {
                clearInterval(interval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                reject(new Error('Server timed out during startup'));
            }
        }, 150);
    });
}

function findBrowserPath() {
    if (process.platform !== 'win32') return null;

    const localAppData = process.env.LOCALAPPDATA || '';
    const progFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    const candidates = [
        path.join(progFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(progFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(progFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
    ];

    for (const candidate of candidates) {
        if (candidate && fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

function getAppProfileDir() {
    const baseAppData = process.env.APPDATA || (
        process.platform === 'darwin'
            ? path.join(os.homedir(), 'Library', 'Application Support')
            : path.join(os.homedir(), '.config')
    );
    const profileDir = path.join(baseAppData, 'StudyFlowOrganizer', 'desktop_profile');
    if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
    }
    return profileDir;
}

async function main() {
    let server = null;
    const alreadyRunning = await isServerRunning();

    if (!alreadyRunning) {
        // Start internal server
        const serverPath = path.resolve(__dirname, '..', 'server', 'server.js');
        server = require(serverPath);
        await waitForServer();
    }

    const browserExe = findBrowserPath();
    const profileDir = getAppProfileDir();

    if (browserExe) {
        // Launch as a standalone application window (no URL bar, no browser tabs)
        const browserArgs = [
            `--app=${APP_URL}`,
            `--user-data-dir=${profileDir}`,
            `--window-size=1360,860`,
            `--app-id=study_flow_organizer`,
            `--disable-features=TranslateUI`,
            `--no-first-run`,
            `--no-default-browser-check`
        ];

        const browserProcess = spawn(browserExe, browserArgs, {
            stdio: 'ignore',
            detached: false,
            windowsHide: true
        });

        browserProcess.on('exit', () => {
            if (server) {
                try { server.close(); } catch (e) {}
            }
            process.exit(0);
        });

        browserProcess.on('error', () => {
            // Fallback to opening default system browser
            openDefaultBrowser();
        });
    } else {
        openDefaultBrowser();
    }
}

function openDefaultBrowser() {
    if (process.platform === 'win32') {
        spawn('cmd.exe', ['/c', 'start', '', APP_URL], { stdio: 'ignore' });
    } else if (process.platform === 'darwin') {
        spawn('open', [APP_URL], { stdio: 'ignore' });
    } else {
        spawn('xdg-open', [APP_URL], { stdio: 'ignore' });
    }
}

main().catch((err) => {
    console.error('Launcher fatal error:', err);
    process.exit(1);
});
