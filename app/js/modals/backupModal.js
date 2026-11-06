/**
 * Backup, Export, Import & Standard Data Location Controller
 */

import { AppState, setAppStateData, persistCurrentState } from '../state.js';
import { isServerConnected } from '../api.js';
import { getAiConfig, saveAiConfig, fetchAiModels } from '../services/aiService.js';
import { CustomSelect } from '../components/customSelect.js';

let aiProviderCustomSelect = null;
let aiModelCustomSelect = null;

export async function openBackupModal() {
    const modal = document.getElementById('settingsModal') || document.getElementById('backupModal');
    if (!modal) return;

    const isConnected = isServerConnected();
    const statusDot = document.getElementById('modalDiskSyncDot');
    const statusText = document.getElementById('modalDiskSyncText');
    const dataDirText = document.getElementById('modalDataDirText');

    if (isConnected) {
        if (statusDot) statusDot.style.background = '#2dd4bf';
        if (statusText) statusText.textContent = '🟢 Connected to standard AppData directory on disk';
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            if (dataDirText && data.dataDirectory) {
                dataDirText.textContent = data.dataDirectory;
            }
        } catch (e) {}
    } else {
        if (statusDot) statusDot.style.background = '#772E25';
        if (statusText) statusText.textContent = '🟠 Standalone Browser Mode (localStorage)';
        if (dataDirText) dataDirText.textContent = 'Browser Internal LocalStorage';
    }

    // Populate AI Assistant Settings
    populateAiSettingsForm();

    modal.classList.add('is-active');
}

/**
 * Populate AI settings fields from persisted configuration
 */
function populateAiSettingsForm() {
    const config = getAiConfig();

    const apiKeyInput = document.getElementById('aiApiKeyInput');
    const baseUrlInput = document.getElementById('aiBaseUrlInput');
    const baseUrlWrap = document.getElementById('aiBaseUrlWrap');
    const statusPill = document.getElementById('aiSettingsStatusPill');
    const statusText = document.getElementById('aiModelStatusText');

    if (aiProviderCustomSelect) {
        aiProviderCustomSelect.setValue(config.provider || 'gemini', false);
    }
    const hiddenProvider = document.getElementById('aiProviderSelect');
    if (hiddenProvider) hiddenProvider.value = config.provider || 'gemini';

    if (apiKeyInput) apiKeyInput.value = config.apiKey || '';
    if (baseUrlInput) baseUrlInput.value = config.baseUrl || '';

    // Show/hide custom baseUrl
    if (baseUrlWrap) {
        baseUrlWrap.classList.toggle('hidden', config.provider !== 'custom');
    }

    // Populate model options
    if (aiModelCustomSelect) {
        let modelOptions = [];
        if (Array.isArray(config.modelsList) && config.modelsList.length > 0) {
            modelOptions = config.modelsList.map(m => ({
                value: m.id || m,
                label: m.displayName || m.id || m,
                secondary: m.id !== m.displayName ? m.id : ''
            }));
        } else if (config.model) {
            modelOptions = [{ value: config.model, label: config.model }];
        }

        aiModelCustomSelect.setOptions(modelOptions, false);
        if (config.model) {
            aiModelCustomSelect.setValue(config.model, false);
        }
    }
    const hiddenModel = document.getElementById('aiModelSelect');
    if (hiddenModel) hiddenModel.value = config.model || '';

    // Update status badge
    if (statusPill) {
        if (config.apiKey && config.model) {
            statusPill.className = 'ai-status-pill status-configured';
            statusPill.textContent = `Active (${config.model})`;
        } else {
            statusPill.className = 'ai-status-pill status-unconfigured';
            statusPill.textContent = 'Key Required';
        }
    }

    if (statusText) statusText.textContent = '';
}

export function closeBackupModal() {
    const modal = document.getElementById('settingsModal') || document.getElementById('backupModal');
    if (modal) modal.classList.remove('is-active');
}

export function exportDataToJson() {
    const payload = {
        $schema: "StudyFlowOrganizer_v4",
        metadata: {
            version: "4.1.0",
            appName: "Study Flow Organizer",
            exportedAt: new Date().toISOString(),
            language: "en"
        },
        user: AppState.user,
        config: AppState.config,
        subjects: AppState.subjects,
        items: AppState.items,
        materials: AppState.materials
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `study_flow_data_${dateStr}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export function initBackupModalEvents() {
    document.getElementById('backupModalCloseBtn')?.addEventListener('click', closeBackupModal);
    document.getElementById('btnCloseBackupModal')?.addEventListener('click', closeBackupModal);

    document.getElementById('btnExportJson')?.addEventListener('click', exportDataToJson);

    // Open Standard AppData in Windows Explorer
    document.getElementById('btnOpenDataFolder')?.addEventListener('click', async () => {
        try {
            await fetch('/api/open-data-dir', { method: 'POST' });
        } catch (e) {
            alert('Could not open AppData folder: ' + e.message);
        }
    });

    // Import JSON
    const fileInput = document.getElementById('importJsonFileInput');
    document.getElementById('btnImportJson')?.addEventListener('click', () => {
        fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                setAppStateData(parsed);
                await persistCurrentState();
                alert('Data restored successfully!');
                closeBackupModal();
            } catch (err) {
                alert('Import error: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Clear All Data
    document.getElementById('btnWipeData')?.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear all data? This will reset your workspace to a clean slate.")) {
            AppState.subjects = [];
            AppState.items = [];
            AppState.materials = [];
            await persistCurrentState();
            alert('Workspace cleared.');
            closeBackupModal();
        }
    });

    // --- AI Configuration Event Listeners ---
    const baseUrlWrap = document.getElementById('aiBaseUrlWrap');
    const apiKeyHint = document.getElementById('aiApiKeyHint');
    const apiKeyInput = document.getElementById('aiApiKeyInput');
    const btnToggleKey = document.getElementById('btnToggleApiKeyVisibility');
    const btnFetchModels = document.getElementById('btnFetchAiModels');
    const modelStatusText = document.getElementById('aiModelStatusText');
    const btnSaveAiConfig = document.getElementById('btnSaveAiConfig');
    const btnTestAiConnection = document.getElementById('btnTestAiConnection');

    // 1. Initialize Custom Provider Dropdown
    const providerWrap = document.getElementById('aiProviderSelectWrap');
    if (providerWrap && !aiProviderCustomSelect) {
        aiProviderCustomSelect = new CustomSelect({
            container: providerWrap,
            placeholder: 'Select AI Provider...',
            className: 'custom-select-sm',
            options: [
                { value: 'gemini', label: 'Google Gemini', icon: '⚡', secondary: 'Free Tier Available' },
                { value: 'openai', label: 'OpenAI', icon: '🤖', secondary: 'GPT-4o, GPT-4o-mini' },
                { value: 'custom', label: 'Custom / Compatible', icon: '🌐', secondary: 'OpenRouter, Groq, Ollama' }
            ],
            onChange: (val) => {
                const hidden = document.getElementById('aiProviderSelect');
                if (hidden) hidden.value = val;
                if (baseUrlWrap) baseUrlWrap.classList.toggle('hidden', val !== 'custom');
                if (apiKeyHint) {
                    if (val === 'gemini') {
                        apiKeyHint.innerHTML = 'For Gemini, get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: var(--palette-stormy-teal);">Google AI Studio</a>.';
                    } else if (val === 'openai') {
                        apiKeyHint.innerHTML = 'Get your OpenAI key from <a href="https://platform.openai.com/api-keys" target="_blank" style="color: var(--palette-stormy-teal);">OpenAI Platform</a>.';
                    } else {
                        apiKeyHint.innerHTML = 'Compatible with OpenRouter, Groq, Ollama, DeepSeek, or any OpenAI-compatible API.';
                    }
                }
            }
        });
    }

    // 2. Initialize Custom Model Dropdown
    const modelWrap = document.getElementById('aiModelSelectWrap');
    if (modelWrap && !aiModelCustomSelect) {
        aiModelCustomSelect = new CustomSelect({
            container: modelWrap,
            placeholder: "-- Click 'Fetch Models from API' --",
            className: 'custom-select-sm',
            options: [],
            onChange: (val) => {
                const hidden = document.getElementById('aiModelSelect');
                if (hidden) hidden.value = val;
            }
        });
    }

    // Toggle API Key visibility
    btnToggleKey?.addEventListener('click', () => {
        if (!apiKeyInput) return;
        const isPassword = apiKeyInput.type === 'password';
        apiKeyInput.type = isPassword ? 'text' : 'password';
        btnToggleKey.textContent = isPassword ? '🙈' : '👁️';
    });

    // Fetch Models from API
    btnFetchModels?.addEventListener('click', async () => {
        const provider = aiProviderCustomSelect ? aiProviderCustomSelect.getValue() : 'gemini';
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
        const baseUrl = document.getElementById('aiBaseUrlInput')?.value.trim() || '';

        if (!apiKey) {
            alert('Please enter an API Key first before fetching models.');
            apiKeyInput?.focus();
            return;
        }

        btnFetchModels.disabled = true;
        btnFetchModels.textContent = '🔄 Fetching...';
        if (modelStatusText) {
            modelStatusText.style.color = 'var(--palette-stormy-teal)';
            modelStatusText.textContent = 'Connecting to API and loading available models...';
        }

        try {
            const models = await fetchAiModels(provider, apiKey, baseUrl);

            if (!models || models.length === 0) {
                throw new Error('No compatible models returned from API.');
            }

            const modelOptions = models.map(m => ({
                value: m.id,
                label: m.displayName || m.id,
                secondary: m.id !== m.displayName ? m.id : ''
            }));

            if (aiModelCustomSelect) {
                aiModelCustomSelect.setOptions(modelOptions, false);
                const currentConfig = getAiConfig();
                let chosen = currentConfig.model;
                if (!chosen || !models.some(m => m.id === chosen)) {
                    const defaultModel = models.find(m => m.id.includes('flash') || m.id.includes('4o-mini')) || models[0];
                    chosen = defaultModel.id;
                }
                aiModelCustomSelect.setValue(chosen, true);
            }

            // Auto-persist modelsList
            const config = getAiConfig();
            config.provider = provider;
            config.apiKey = apiKey;
            config.baseUrl = baseUrl;
            config.model = aiModelCustomSelect ? aiModelCustomSelect.getValue() : '';
            config.modelsList = models;
            saveAiConfig(config);

            if (modelStatusText) {
                modelStatusText.style.color = 'var(--color-success)';
                modelStatusText.textContent = `✅ Successfully retrieved ${models.length} model(s).`;
            }

            // Update status pill
            const statusPill = document.getElementById('aiSettingsStatusPill');
            if (statusPill) {
                statusPill.className = 'ai-status-pill status-configured';
                statusPill.textContent = `Active (${config.model})`;
            }
        } catch (err) {
            console.error('[Fetch Models Error]', err);
            if (modelStatusText) {
                modelStatusText.style.color = 'var(--palette-tomato-jam)';
                modelStatusText.textContent = `❌ ${err.message}`;
            }
            alert(`Could not fetch models: ${err.message}`);
        } finally {
            btnFetchModels.disabled = false;
            btnFetchModels.textContent = '🔄 Fetch Models from API';
        }
    });

    // Test Connection
    btnTestAiConnection?.addEventListener('click', async () => {
        const provider = aiProviderCustomSelect ? aiProviderCustomSelect.getValue() : 'gemini';
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
        const baseUrl = document.getElementById('aiBaseUrlInput')?.value.trim() || '';

        if (!apiKey) {
            alert('Please enter an API Key first.');
            apiKeyInput?.focus();
            return;
        }

        btnTestAiConnection.disabled = true;
        btnTestAiConnection.textContent = 'Testing...';

        try {
            const models = await fetchAiModels(provider, apiKey, baseUrl);
            alert(`✅ Connection successful! Found ${models.length} model(s).`);
        } catch (err) {
            alert(`❌ Connection failed: ${err.message}`);
        } finally {
            btnTestAiConnection.disabled = false;
            btnTestAiConnection.textContent = 'Test Connection';
        }
    });

    // Save AI Config
    btnSaveAiConfig?.addEventListener('click', () => {
        const provider = aiProviderCustomSelect ? aiProviderCustomSelect.getValue() : 'gemini';
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
        const baseUrl = document.getElementById('aiBaseUrlInput')?.value.trim() || '';
        const model = aiModelCustomSelect ? aiModelCustomSelect.getValue() : '';

        if (!apiKey) {
            alert('Please enter an API key.');
            apiKeyInput?.focus();
            return;
        }

        const config = getAiConfig();
        config.provider = provider;
        config.apiKey = apiKey;
        config.baseUrl = baseUrl;
        config.model = model;
        saveAiConfig(config);

        const statusPill = document.getElementById('aiSettingsStatusPill');
        if (statusPill) {
            statusPill.className = 'ai-status-pill status-configured';
            statusPill.textContent = `Active (${model || 'Configured'})`;
        }

        // Update AI modal badge if open
        const badge = document.getElementById('aiActiveModelBadge');
        if (badge) {
            badge.className = 'ai-model-badge badge-connected';
            badge.textContent = `${model || provider}`;
        }

        alert('✅ AI settings saved successfully!');
    });
}
