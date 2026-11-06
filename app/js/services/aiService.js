/**
 * Study Flow Organizer - AI Service Client
 * Handles AI model querying, settings persistence, prompt context formulation & smart action generation.
 */

import { isServerConnected } from '../api.js';
import { formatDualDate, gregorianToJalali } from '../jalali.js';
import { AppState } from '../state.js';

const AI_CONFIG_KEY = 'study_flow_ai_config_v1';

export const DEFAULT_AI_CONFIG = {
    provider: 'gemini',
    apiKey: '',
    baseUrl: '',
    model: '',
    modelsList: []
};

/**
 * Retrieve saved AI configuration from localStorage
 */
export function getAiConfig() {
    try {
        const raw = localStorage.getItem(AI_CONFIG_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { ...DEFAULT_AI_CONFIG, ...parsed };
        }
    } catch (e) {
        console.warn('[AI Service] Failed to read ai config:', e);
    }
    return { ...DEFAULT_AI_CONFIG };
}

/**
 * Save AI configuration to localStorage
 */
export function saveAiConfig(cfg) {
    try {
        localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));
    } catch (e) {
        console.error('[AI Service] Failed to save ai config:', e);
    }
}

/**
 * Fetch available models from the selected provider API
 */
export async function fetchAiModels(provider, apiKey, baseUrl = '') {
    if (!apiKey || !apiKey.trim()) {
        throw new Error('API Key is required to fetch models.');
    }

    const cleanKey = apiKey.trim();
    const cleanBaseUrl = baseUrl.trim();

    // 1. If server is online, use server proxy (avoids CORS issues entirely)
    if (isServerConnected()) {
        const res = await fetch('/api/ai/models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider,
                apiKey: cleanKey,
                baseUrl: cleanBaseUrl
            })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.error || `Server returned status ${res.status}`);
        }
        return data.models || [];
    }

    // 2. Direct browser fallback (if server is not running)
    if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`;
        const res = await fetch(url);
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `Google API returned status ${res.status}`);
        }
        const data = await res.json();
        const raw = Array.isArray(data.models) ? data.models : [];
        return raw
            .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => {
                const cleanId = m.name.replace(/^models\//, '');
                return {
                    id: cleanId,
                    rawId: m.name,
                    displayName: m.displayName || cleanId,
                    description: m.description || ''
                };
            });
    } else {
        const endpoint = (cleanBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
        const url = `${endpoint}/models`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${cleanKey}` }
        });
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `API returned status ${res.status}`);
        }
        const data = await res.json();
        const raw = Array.isArray(data.data) ? data.data : (Array.isArray(data.models) ? data.models : []);
        return raw.map(m => ({
            id: m.id || m.name,
            displayName: m.id || m.name,
            description: m.owned_by ? `By ${m.owned_by}` : ''
        }));
    }
}

/**
 * Format a reference calendar schedule table for the LLM
 * Pre-computes today, tomorrow, current week, and next week dates in both Gregorian and Shamsi.
 */
function buildCalendarReferenceContext(baseDate = new Date()) {
    const PERSIAN_DAY_NAMES = [
        'یک‌شنبه',   // 0 = Sunday
        'دوشنبه',    // 1 = Monday
        'سه‌شنبه',   // 2 = Tuesday
        'چهارشنبه',  // 3 = Wednesday
        'پنج‌شنبه',  // 4 = Thursday
        'جمعه',     // 5 = Friday
        'شنبه'      // 6 = Saturday
    ];

    const ENGLISH_DAY_NAMES = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ];

    const formatDayInfo = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const isoDate = `${y}-${m}-${day}`;
        const dayOfWeekIndex = d.getDay();
        const enDay = ENGLISH_DAY_NAMES[dayOfWeekIndex];
        const faDay = PERSIAN_DAY_NAMES[dayOfWeekIndex];
        const dual = formatDualDate(d);
        const shamsi = dual ? dual.shamsiFull : '';
        return { isoDate, enDay, faDay, shamsi };
    };

    const addDays = (d, n) => {
        const res = new Date(d.getTime());
        res.setDate(res.getDate() + n);
        return res;
    };

    const today = formatDayInfo(baseDate);
    const tomorrow = formatDayInfo(addDays(baseDate, 1));
    const dayAfterTomorrow = formatDayInfo(addDays(baseDate, 2));

    // Calculate start of current Iranian week (Saturday)
    // Sunday is 0, Monday is 1, ..., Friday is 5, Saturday is 6
    // Days since Saturday: (dayOfWeekIndex + 1) % 7
    const currentDayIdx = baseDate.getDay();
    const daysSinceSaturday = (currentDayIdx + 1) % 7;
    const currentSaturday = addDays(baseDate, -daysSinceSaturday);

    const getWeekDays = (startSaturday) => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(formatDayInfo(addDays(startSaturday, i)));
        }
        return days;
    };

    const currentWeekDays = getWeekDays(currentSaturday);
    const nextSaturday = addDays(currentSaturday, 7);
    const nextWeekDays = getWeekDays(nextSaturday);
    const weekAfterNextSaturday = addDays(nextSaturday, 7);
    const weekAfterNextDays = getWeekDays(weekAfterNextSaturday);

    return {
        today,
        tomorrow,
        dayAfterTomorrow,
        currentWeekDays,
        nextWeekDays,
        weekAfterNextDays
    };
}

/**
 * Builds the comprehensive AI Schedule Assistant System Prompt containing reference dates,
 * enrolled courses, existing tasks/events, categories and strict JSON schema.
 */
export function buildAiScheduleSystemPrompt(appState, currentDate = new Date()) {
    const cal = buildCalendarReferenceContext(currentDate);

    const coursesContext = (appState.subjects || []).map(s => ({
        id: s.id,
        title: s.title,
        code: s.code || ''
    }));

    const itemsContext = (appState.items || []).map(i => {
        const subj = (appState.subjects || []).find(s => s.id === i.subjectId);
        return {
            id: i.id,
            kind: i.kind,
            typeId: i.typeId,
            typeName: i.typeName,
            title: i.title,
            subjectId: i.subjectId,
            subjectTitle: subj ? subj.title : '',
            dueDate: i.dueDate,
            completed: Boolean(i.completed)
        };
    });

    const taskTypes = (appState.config?.taskTypes || []).map(t => ({ id: t.id, name: t.name, icon: t.icon }));
    const eventTypes = (appState.config?.eventTypes || []).map(t => ({ id: t.id, name: t.name, icon: t.icon }));

    const currentIsoString = currentDate.toISOString();

    return `
You are the AI Schedule Assistant, an intelligent and precise academic planner for the "Study Flow Organizer" application.
Your mission is to understand user voice or text instructions (given in Persian / Farsi, English, or mixed) and extract concrete, structured schedule actions: creating deadlines, scheduling exams/quizzes, marking existing homework or tasks completed, or updating due dates.

### CRITICAL STRICT LANGUAGE REQUIREMENT (100% ENGLISH ONLY):
- ALL fields in your JSON response (summary, title, courseTitle, subjectTitle, typeName, notes, location, reason) MUST BE 100% IN ENGLISH.
- NEVER output Persian / Farsi script in any field.
- If the user writes or speaks in Persian (e.g. "مکانیک سیالات", "ترمودینامیک", "طراحی اجزا", "کوییز لایه مرزی", "تمرین", "میانترم"), TRANSLATE all terms into clean, standard academic English:
  - "میان‌ترم ترمودینامیک" -> "Thermodynamics Midterm Exam"
  - "کوییز طراحی اجزا" -> "Machine Design Quiz"
  - "کوییز سیالات (لایه مرزی)" -> "Fluid Mechanics Quiz (Boundary Layer)"
  - "مباحث لایه مرزی" -> "Boundary Layer Topics"
  - "تمرین ارتعاشات" -> "Vibrations Assignment"
- The "summary" field MUST be a clear, concise English summary of the proposed actions (e.g. "Scheduled Thermodynamics Midterm Exam for Sunday, and Machine Design Quiz for Monday.").

### CURRENT TIME & CALENDAR TRUTH:
- Current Timestamp: ${currentIsoString}
- Today: ${cal.today.enDay} (${cal.today.faDay}), ${cal.today.isoDate} • Shamsi: ${cal.today.shamsi}
- Tomorrow: ${cal.tomorrow.enDay} (${cal.tomorrow.faDay}), ${cal.tomorrow.isoDate}
- Day After Tomorrow: ${cal.dayAfterTomorrow.enDay} (${cal.dayAfterTomorrow.faDay}), ${cal.dayAfterTomorrow.isoDate}

### IRANIAN ACADEMIC WEEK SCHEDULE:
In Iran, the academic week runs from Saturday (شنبه) to Friday (جمعه).
Use these exact pre-calculated calendar dates when the user specifies relative days:

[CURRENT WEEK (این هفته)]:
${cal.currentWeekDays.map(d => `- ${d.faDay} (${d.enDay}): ${d.isoDate}`).join('\n')}

[NEXT WEEK (هفته بعد)]:
${cal.nextWeekDays.map(d => `- ${d.faDay} (${d.enDay}): ${d.isoDate}`).join('\n')}

[WEEK AFTER NEXT (دو هفته بعد)]:
${cal.weekAfterNextDays.map(d => `- ${d.faDay} (${d.enDay}): ${d.isoDate}`).join('\n')}

### USER'S ENROLLED COURSES:
${JSON.stringify(coursesContext, null, 2)}

### USER'S EXISTING TASKS & EVENTS:
${JSON.stringify(itemsContext, null, 2)}

### CONFIGURED CATEGORIES:
- Task Types: ${JSON.stringify(taskTypes)}
- Event Types: ${JSON.stringify(eventTypes)}

### CRITICAL INTERPRETATION RULES:
1. **Course Name Matching & Un-enrolled Courses**:
   - The user may mention courses in Persian, English, or abbreviations.
   - For example:
     - "مکانیک سیالات" or "سیالات" -> matches "Fluid Mechanics"
     - "ارتعاشات" or "ارتعاشات مکانیکی" -> matches "Mechanical Vibrations"
     - "ترمودینامیک" -> "Thermodynamics"
     - "طراحی اجزا" -> "Machine Design"
     - "ریاضی مهندسی" -> "Engineering Mathematics"
   - If an existing course in USER'S ENROLLED COURSES matches:
     Use its exact \`subjectId\` and \`subjectTitle\`. Set \`courseTitle\` to its title.
   - If the user mentions a course that does NOT exist in the enrolled courses list (e.g. "Thermodynamics" or "ترمودینامیک"):
     Set \`subjectId: null\`, and set \`courseTitle\` to the clean English title of the course (e.g. "Thermodynamics", "Machine Components Design").
     DO NOT output a separate "create_subject" action. Output the event or task with \`courseTitle\` set to the new course name. The app's editable dropdown will automatically offer to create this course on commit.

2. **Date & Time Calculations**:
   - "دوشنبه هفته بعد" = Monday of Next Week -> Look up in [NEXT WEEK] above (${cal.nextWeekDays.find(d => d.enDay === 'Monday')?.isoDate || 'Next Monday'}).
   - "فرداش" = The day immediately following the previously mentioned item's date! For example, if the previous item was on Monday, "فرداش" means Tuesday (${cal.nextWeekDays.find(d => d.enDay === 'Tuesday')?.isoDate || 'Next Tuesday'}).
   - "پس‌فردا" = 2 days after today (${cal.dayAfterTomorrow.isoDate}).
   - Default time for a deadline / homework (task): 23:59:00 local time.
   - Default time for an exam / quiz / class (event): 10:00:00 local time (or specific time mentioned, e.g. "ساعت ۱۰" -> 10:00).
   - Format \`dueDate\` as a valid ISO 8601 string (e.g. "YYYY-MM-DDT23:59:00.000Z" or local timestamp).

3. **Task Completion Detection ("انجام دادم", "done", "finished")**:
   - If user indicates an item is done or completed:
     - Check existing items for that course.
     - Emit \`actionType: "update_item"\` with its \`itemId\`, and set \`completed: true\`.
     - If no matching task exists yet, emit \`actionType: "create_item"\` with \`completed: true\` and title e.g. "HW #1".

4. **Task vs Event Classification**:
   - Task: Homework, assignment, deadline, report, project ("تکلیف", "تمرین", "ددلاین", "پروژه", "گزارشکار", "HW", "Assignment", "Project").
     Kind: "task", typeId: "tt_hw" (or "tt_project", "tt_report").
   - Event: Quiz, exam, midterm, final, review session ("کوییز", "امتحان", "میان‌ترم", "پایان‌ترم", "جلسه رفع اشکال", "Quiz", "Midterm", "Exam").
     Kind: "event", typeId: "et_quiz" (or "et_midterm", "et_final", "et_class").

5. **JSON OUTPUT REQUIREMENT**:
   You must output ONLY valid, parseable JSON with NO surrounding conversational prose.
   Use the exact structure:
{
  "summary": "Short conversational summary in 100% English explaining all detected changes",
  "actions": [
    {
      "actionType": "create_item", // "create_item" | "update_item" | "delete_item"
      "itemId": null, // Required string if update_item or delete_item, null if create_item
      "kind": "event", // "task" | "event"
      "subjectId": "matching_subject_id_or_null",
      "courseTitle": "Course Name in English",
      "typeId": "et_midterm", // matched from configured categories
      "typeName": "Midterm",
      "typeIcon": "📝",
      "title": "Thermodynamics Midterm Exam",
      "dueDate": "2026-11-08T10:00:00.000Z",
      "completed": false,
      "extraInfo": {
        "number": "1",
        "location": "Main Hall",
        "notes": ""
      },
      "reason": "Midterm exam for Thermodynamics next Sunday"
    }
  ]
}
`.trim();
}

/**
 * Execute AI Schedule Assistant analysis on user prompt and/or audio data
 */
export async function generateAiSchedulePlan(userPrompt = '', appState = null, audioPayload = null) {
    // If called with an audio payload or options object as first argument
    if (userPrompt && typeof userPrompt === 'object') {
        if (userPrompt.audioData || userPrompt.audioChunks) {
            audioPayload = userPrompt;
            userPrompt = '';
        } else if (userPrompt.prompt) {
            audioPayload = userPrompt.audioPayload || null;
            userPrompt = userPrompt.prompt || '';
        }
    }

    const cleanPrompt = typeof userPrompt === 'string' ? userPrompt.trim() : '';
    const hasAudio = Boolean(audioPayload && audioPayload.audioData);

    if (!cleanPrompt && !hasAudio) {
        throw new Error('Please enter an instruction or record a voice note.');
    }

    const config = getAiConfig();
    if (!config.apiKey) {
        throw new Error('AI API Key is not configured. Please open Settings (⚙️) to set up your Google Gemini or OpenAI API key.');
    }
    if (!config.model) {
        throw new Error('No AI Model selected. Please open Settings (⚙️) and select a model.');
    }

    const resolvedState = (appState && typeof appState === 'object' && Array.isArray(appState.subjects))
        ? appState
        : AppState;

    const systemPrompt = buildAiScheduleSystemPrompt(resolvedState, new Date());

    // 1. If server is online, use server proxy endpoint
    if (isServerConnected()) {
        const res = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: config.provider,
                apiKey: config.apiKey,
                baseUrl: config.baseUrl,
                model: config.model,
                prompt: cleanPrompt,
                audioData: hasAudio ? audioPayload.audioData : null,
                audioMimeType: hasAudio ? (audioPayload.audioMimeType || 'audio/webm') : null,
                systemPrompt,
                temperature: 0.1
            })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.error || `Server AI error (${res.status})`);
        }

        if (data.data && Array.isArray(data.data.actions)) {
            return data.data;
        }

        // Fallback: parse rawText if data was not parsed on server
        if (data.rawText) {
            const clean = data.rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            return JSON.parse(clean);
        }

        throw new Error('AI returned an unexpected response format.');
    }

    // 2. Direct browser fallback (if server is not running)
    if (config.provider === 'gemini') {
        const modelId = config.model.startsWith('models/') ? config.model : `models/${config.model}`;
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

        const parts = [];
        if (hasAudio) {
            parts.push({
                inlineData: {
                    mimeType: audioPayload.audioMimeType || 'audio/webm',
                    data: audioPayload.audioData
                }
            });
        }
        if (cleanPrompt) {
            parts.push({ text: cleanPrompt });
        } else if (hasAudio) {
            parts.push({ text: 'Listen to this voice instruction and extract all schedule actions in English strictly adhering to the system instructions.' });
        }

        const payload = {
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [
                {
                    role: 'user',
                    parts
                }
            ],
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `Google API error ${res.status}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return JSON.parse(clean);
    } else {
        const endpoint = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
        const url = `${endpoint}/chat/completions`;

        const payload = {
            model: config.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: cleanPrompt || 'Extract academic schedule actions in English.' }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `AI API error ${res.status}`);
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return JSON.parse(clean);
    }
}
