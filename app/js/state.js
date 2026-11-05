/**
 * Central Reactive State Store & Data Normalization
 */

import { saveData } from './api.js';

export const SUBJECT_GRADIENTS = [
    { name: "Stormy Teal", css: "linear-gradient(135deg, #1d2d2c 0%, #197278 100%)", primary: "#197278" },
    { name: "Dark Slate", css: "linear-gradient(135deg, #1f2f2e 0%, #283D3B 50%, #3a5552 100%)", primary: "#283D3B" },
    { name: "Tomato Jam", css: "linear-gradient(135deg, #441814 0%, #772E25 50%, #C44536 100%)", primary: "#C44536" },
    { name: "Chestnut Earth", css: "linear-gradient(135deg, #2c120e 0%, #772E25 100%)", primary: "#772E25" },
    { name: "Teal Petal", css: "linear-gradient(135deg, #197278 0%, #2b5755 60%, #466e6b 100%)", primary: "#197278" },
    { name: "Slate Terracotta", css: "linear-gradient(135deg, #283D3B 0%, #523733 50%, #C44536 100%)", primary: "#C44536" }
];

export const DEFAULT_CONFIG = {
    taskTypes: [
        { id: "tt_hw", name: "HW", icon: "📚" },
        { id: "tt_project", name: "Project", icon: "💻" },
        { id: "tt_report", name: "Lab Report", icon: "📄" },
        { id: "tt_reading", name: "Reading", icon: "📖" },
        { id: "tt_custom", name: "Custom", icon: "📌" }
    ],
    eventTypes: [
        { id: "et_quiz", name: "Quiz", icon: "📝" },
        { id: "et_midterm", name: "Midterm Exam", icon: "🎓" },
        { id: "et_final", name: "Final Exam", icon: "🏆" },
        { id: "et_presentation", name: "Presentation", icon: "📊" },
        { id: "et_class", name: "Review Session", icon: "🏛️" },
        { id: "et_custom", name: "Custom Event", icon: "📌" }
    ],
    materialTypes: [
        { id: "mat_folder", name: "Course Folder", icon: "📁" }
    ]
};

export const AppState = {
    user: { username: "student" },
    config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    subjects: [],
    items: [],
    materials: [],

    currentView: 'grid', // 'grid' | 'table' | 'timeline'
    activeFilter: 'all',  // 'all' | 'only_tasks' | 'only_events' | 'urgent' | 'pending' | 'completed'
    searchQuery: '',

    cardSubTabs: {}, // subjectId -> 'schedule' | 'folders'
    expandedGridSubjectTasks: new Set(),
    expandedTableSubjectIds: new Set(),
    isServerActive: false
};

const listeners = new Set();

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function notify(eventName = 'change') {
    listeners.forEach(fn => {
        try { fn(AppState, eventName); } catch (e) { console.error('[State Listener Error]', e); }
    });
}

/**
 * Normalizes input JSON into v4 schema.
 */
export function normalizeData(raw) {
    if (!raw || typeof raw !== 'object') raw = {};

    const config = {
        taskTypes: Array.isArray(raw.config?.taskTypes) && raw.config.taskTypes.length > 0
            ? raw.config.taskTypes.map(t => ({ ...t }))
            : JSON.parse(JSON.stringify(DEFAULT_CONFIG.taskTypes)),
        eventTypes: Array.isArray(raw.config?.eventTypes) && raw.config.eventTypes.length > 0
            ? raw.config.eventTypes.map(t => ({ ...t }))
            : JSON.parse(JSON.stringify(DEFAULT_CONFIG.eventTypes)),
        materialTypes: [{ id: "mat_folder", name: "Course Folder", icon: "📁" }]
    };

    const subjects = Array.isArray(raw.subjects) ? raw.subjects.map(s => ({
        id: s.id || `subj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: s.title || "Subject",
        code: s.code || "",
        gradientIndex: typeof s.gradientIndex === 'number' ? s.gradientIndex : Math.floor(Math.random() * SUBJECT_GRADIENTS.length),
        createdAt: s.createdAt || new Date().toISOString(),
        ...s
    })) : [];

    const rawItems = Array.isArray(raw.items) ? raw.items : (Array.isArray(raw.tasks) ? raw.tasks : []);
    const items = rawItems.map(item => {
        const isTask = item.kind !== 'event';
        return {
            id: item.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            kind: isTask ? 'task' : 'event',
            typeId: item.typeId || (isTask ? 'tt_hw' : 'et_quiz'),
            typeName: item.typeName || (isTask ? 'HW' : 'Quiz'),
            typeIcon: item.typeIcon || (isTask ? '📚' : '📝'),
            subjectId: item.subjectId,
            title: item.title || "",
            extraInfo: {
                number: item.extraInfo?.number ?? item.detailNumber ?? "",
                location: item.extraInfo?.location ?? item.location ?? "",
                notes: item.extraInfo?.notes ?? item.notes ?? ""
            },
            dueDate: item.dueDate || new Date().toISOString(),
            completed: Boolean(item.completed),
            createdAt: item.createdAt || new Date().toISOString()
        };
    });

    const rawMaterials = Array.isArray(raw.materials) ? raw.materials : [];
    const materials = rawMaterials.map(mat => ({
        id: mat.id || `mat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        subjectId: mat.subjectId,
        itemId: mat.itemId || "",
        name: mat.name || "Course Folder",
        filePath: mat.filePath || "",
        typeId: "mat_folder",
        typeName: "Course Folder",
        icon: "📁",
        notes: mat.notes || "",
        createdAt: mat.createdAt || new Date().toISOString()
    }));

    return {
        $schema: "StudyFlowOrganizer_v4",
        metadata: {
            version: "4.0.0",
            appName: "Study Flow Organizer",
            lastSaved: raw.metadata?.lastSaved || new Date().toISOString(),
            language: "en"
        },
        user: raw.user || { username: "student" },
        config,
        subjects,
        items,
        materials
    };
}

/**
 * Update AppState from raw data and notify subscribers.
 */
export function setAppStateData(rawData) {
    const normalized = normalizeData(rawData);
    AppState.config = normalized.config;
    AppState.subjects = normalized.subjects;
    AppState.items = normalized.items;
    AppState.materials = normalized.materials;
    AppState.user = normalized.user;
    notify('data-loaded');
}

/**
 * Persist current state to disk and notify subscribers.
 */
export async function persistCurrentState() {
    const payload = {
        $schema: "StudyFlowOrganizer_v4",
        metadata: {
            version: "4.0.0",
            appName: "Study Flow Organizer",
            lastSaved: new Date().toISOString(),
            language: "en"
        },
        user: AppState.user,
        config: AppState.config,
        subjects: AppState.subjects,
        items: AppState.items,
        materials: AppState.materials
    };
    const result = await saveData(payload);
    notify('data-saved');
    return result;
}

// --- CRUD Actions ---

export async function addOrUpdateSubject(subjData) {
    if (subjData.id) {
        const idx = AppState.subjects.findIndex(s => s.id === subjData.id);
        if (idx !== -1) {
            AppState.subjects[idx] = { ...AppState.subjects[idx], ...subjData };
        }
    } else {
        const newSubj = {
            id: `subj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: subjData.title,
            code: subjData.code || "",
            gradientIndex: typeof subjData.gradientIndex === 'number' ? subjData.gradientIndex : 0,
            createdAt: new Date().toISOString()
        };
        AppState.subjects.push(newSubj);
    }
    await persistCurrentState();
}

export async function deleteSubject(subjectId) {
    AppState.subjects = AppState.subjects.filter(s => s.id !== subjectId);
    AppState.items = AppState.items.filter(i => i.subjectId !== subjectId);
    AppState.materials = AppState.materials.filter(m => m.subjectId !== subjectId);
    await persistCurrentState();
}

export async function addOrUpdateItem(itemData) {
    if (itemData.id) {
        const idx = AppState.items.findIndex(i => i.id === itemData.id);
        if (idx !== -1) {
            AppState.items[idx] = { ...AppState.items[idx], ...itemData };
        }
    } else {
        const newItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            completed: false,
            createdAt: new Date().toISOString(),
            ...itemData
        };
        AppState.items.push(newItem);
    }
    await persistCurrentState();
}

export async function toggleItemComplete(itemId) {
    const item = AppState.items.find(i => i.id === itemId);
    if (item) {
        item.completed = !item.completed;
        await persistCurrentState();
    }
}

export async function deleteItem(itemId) {
    AppState.items = AppState.items.filter(i => i.id !== itemId);
    AppState.materials.forEach(m => {
        if (m.itemId === itemId) m.itemId = "";
    });
    await persistCurrentState();
}

export async function addOrUpdateMaterial(matData) {
    if (matData.id) {
        const idx = AppState.materials.findIndex(m => m.id === matData.id);
        if (idx !== -1) {
            AppState.materials[idx] = { ...AppState.materials[idx], ...matData };
        }
    } else {
        const newMat = {
            id: `mat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            createdAt: new Date().toISOString(),
            typeId: "mat_folder",
            typeName: "Course Folder",
            icon: "📁",
            ...matData
        };
        AppState.materials.push(newMat);
    }
    await persistCurrentState();
}

export async function deleteMaterial(materialId) {
    AppState.materials = AppState.materials.filter(m => m.id !== materialId);
    await persistCurrentState();
}

/**
 * Filter items according to search query and active filter pill.
 */
export function getFilteredItems() {
    let result = [...AppState.items];

    // Filter by type / status
    if (AppState.activeFilter === 'only_tasks') {
        result = result.filter(i => i.kind === 'task');
    } else if (AppState.activeFilter === 'only_events') {
        result = result.filter(i => i.kind === 'event');
    } else if (AppState.activeFilter === 'pending') {
        result = result.filter(i => !i.completed);
    } else if (AppState.activeFilter === 'completed') {
        result = result.filter(i => i.completed);
    } else if (AppState.activeFilter === 'urgent') {
        const now = Date.now();
        result = result.filter(i => {
            if (i.completed) return false;
            const diffHours = (new Date(i.dueDate).getTime() - now) / (1000 * 60 * 60);
            return diffHours <= 48;
        });
    }

    // Filter by search query
    if (AppState.searchQuery.trim()) {
        const q = AppState.searchQuery.toLowerCase().trim();
        result = result.filter(item => {
            const subj = AppState.subjects.find(s => s.id === item.subjectId);
            const subjText = subj ? `${subj.title} ${subj.code}`.toLowerCase() : '';
            const titleText = (item.title || '').toLowerCase();
            const notesText = (item.extraInfo?.notes || '').toLowerCase();
            const locText = (item.extraInfo?.location || '').toLowerCase();
            return titleText.includes(q) || subjText.includes(q) || notesText.includes(q) || locText.includes(q);
        });
    }

    return result;
}
