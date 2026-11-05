/**
 * Git Sync & Push Modal Controller
 */

import { AppState } from '../state.js';
import { getGitStatus, gitPush, gitPull } from '../api.js';

export async function openGitModal() {
    const modal = document.getElementById('gitSyncModal');
    if (!modal) return;

    // Snapshot counts
    document.getElementById('gitModalSubjCount').textContent = String(AppState.subjects.length);
    document.getElementById('gitModalItemsCount').textContent = String(AppState.items.length);
    document.getElementById('gitModalFoldersCount').textContent = String(AppState.materials.length);

    // Fetch live remote details from server
    const remoteEl = document.getElementById('gitModalRemoteText');
    const branchBadge = document.getElementById('gitModalBranchBadge');

    const status = await getGitStatus();
    if (status) {
        if (remoteEl) remoteEl.textContent = status.remote;
        if (branchBadge) branchBadge.textContent = `Connected • Branch: ${status.branch}`;
    } else {
        if (remoteEl) remoteEl.textContent = 'Server not running (Launch via Launch_Study_Flow.bat)';
        if (branchBadge) branchBadge.textContent = 'Standalone Mode';
    }

    modal.classList.add('is-active');
}

export function closeGitModal() {
    const modal = document.getElementById('gitSyncModal');
    if (modal) modal.classList.remove('is-active');
}

export function initGitModalEvents() {
    document.getElementById('gitSyncModalCloseBtn')?.addEventListener('click', closeGitModal);
    document.getElementById('btnCloseGitModal')?.addEventListener('click', closeGitModal);

    // Trigger push
    document.getElementById('btnTriggerGitPush')?.addEventListener('click', async () => {
        const btn = document.getElementById('btnTriggerGitPush');
        const customMsg = document.getElementById('gitCommitMessageInput').value.trim();
        const origText = btn.textContent;
        btn.textContent = '🚀 Pushing updates...';
        btn.disabled = true;

        try {
            const result = await gitPush(customMsg);
            if (result.success) {
                alert(`Successfully pushed updates to GitHub!\n\nBranch: ${result.branch}\n${result.commit || ''}`);
                closeGitModal();
            } else {
                alert(`Push encountered an error:\n${result.pushOutput || result.error}`);
            }
        } catch (e) {
            alert('Push failed: ' + e.message);
        } finally {
            btn.textContent = origText;
            btn.disabled = false;
        }
    });

    // Trigger pull
    document.getElementById('btnTriggerGitPull')?.addEventListener('click', async () => {
        const btn = document.getElementById('btnTriggerGitPull');
        const origText = btn.textContent;
        btn.textContent = '🔄 Pulling contributions...';
        btn.disabled = true;

        try {
            const result = await gitPull();
            if (result.success) {
                alert(`Successfully pulled from GitHub!\n${result.backupFile ? `Snapshot backup created: ${result.backupFile}` : ''}`);
                window.location.reload();
            } else {
                alert(`Pull encountered an error:\n${result.output || result.error}`);
            }
        } catch (e) {
            alert('Pull failed: ' + e.message);
        } finally {
            btn.textContent = origText;
            btn.disabled = false;
        }
    });

    // Copy command
    document.getElementById('btnCopyGitCmd')?.addEventListener('click', () => {
        const cmd = 'git add -A && git commit -m "Update study schedule" && git push origin main';
        navigator.clipboard.writeText(cmd);
        alert('Git command copied to clipboard!');
    });
}
