/**
 * Study Flow Organizer - Dynamic Theme & Color Palette Engine
 * 
 * Strict Zero-Hardcoded Color System:
 * Every UI element dynamically derives its palette, glows, surfaces,
 * borders, text, accents, and topic headers from active CSS variables.
 */

export const PALETTE_PRESETS = {
    default: {
        id: 'default',
        name: 'Teal Slate (Default)',
        colors: {
            primary: '#197278',       // Stormy Teal
            primaryLight: '#228b93',
            canvas: '#1e2e2c',        // Canvas Dark Base
            canvasDeep: '#14201e',
            surface: '#283D3B',       // Card Slate
            surfaceHover: '#334c49',
            text: '#EDDDD4',          // Powder Petal
            urgent: '#C44536',        // Tomato Jam
            secondary: '#772E25',     // Chestnut
            success: '#2dd4bf'        // Success Accent
        }
    },
    black: {
        id: 'black',
        name: 'Ultra Minimalist Black',
        colors: {
            primary: '#f4f4f5',       // Crisp Light Silver / White Accent
            primaryLight: '#ffffff',
            canvas: '#000000',        // Pure OLED Black
            canvasDeep: '#09090b',
            surface: '#121214',       // Deep Carbon Slate
            surfaceHover: '#1c1c1f',
            text: '#ffffff',          // Pure Crisp White Text
            urgent: '#ef4444',        // Crisp Red
            secondary: '#27272a',     // Dark Zinc
            success: '#38bdf8'        // Ice Sky Blue
        }
    },
    dark_blue: {
        id: 'dark_blue',
        name: 'Flat Dark Blue',
        colors: {
            primary: '#3a86ff',       // Electric Azure Blue
            primaryLight: '#5c9bff',
            canvas: '#070d1e',        // Deep Midnight Navy
            canvasDeep: '#040711',
            surface: '#121c38',       // Rich Indigo Slate
            surfaceHover: '#18254b',
            text: '#e2e8f0',          // Ice Mist White
            urgent: '#ff5a5f',        // Coral Crimson Alert
            secondary: '#25355e',     // Muted Navy Accent
            success: '#00d2d3'        // Neon Turquoise
        }
    },
    custom: {
        id: 'custom',
        name: 'Custom 5-Color',
        colors: {
            primary: '#197278',
            primaryLight: '#228b93',
            canvas: '#1e2e2c',
            canvasDeep: '#14201e',
            surface: '#283D3B',
            surfaceHover: '#334c49',
            text: '#EDDDD4',
            urgent: '#C44536',
            secondary: '#772E25',
            success: '#2dd4bf'
        }
    }
};

/**
 * Generates dynamic gradients and flat solids from a given palette
 */
export function generateSubjectColors(paletteColors, isFlat = false) {
    const { primary, canvas, surface, urgent, secondary, primaryLight } = paletteColors;
    const sec = secondary || adjustBrightness(primary, -30);

    if (isFlat) {
        return [
            { name: "Accent 1", css: primary, primary: primary, isFlat: true },
            { name: "Accent 2", css: surface, primary: surface, isFlat: true },
            { name: "Accent 3", css: urgent, primary: urgent, isFlat: true },
            { name: "Accent 4", css: sec, primary: sec, isFlat: true },
            { name: "Accent 5", css: adjustBrightness(primary, -15), primary: primary, isFlat: true },
            { name: "Accent 6", css: adjustBrightness(surface, 20), primary: surface, isFlat: true }
        ];
    }

    return [
        {
            name: "Gradient 1",
            css: `linear-gradient(135deg, ${canvas} 0%, ${primary} 100%)`,
            primary: primary
        },
        {
            name: "Gradient 2",
            css: `linear-gradient(135deg, ${adjustBrightness(surface, -15)} 0%, ${surface} 50%, ${adjustBrightness(surface, 20)} 100%)`,
            primary: surface
        },
        {
            name: "Gradient 3",
            css: `linear-gradient(135deg, ${adjustBrightness(urgent, -30)} 0%, ${adjustBrightness(urgent, -10)} 50%, ${urgent} 100%)`,
            primary: urgent
        },
        {
            name: "Gradient 4",
            css: `linear-gradient(135deg, ${canvas} 0%, ${sec} 100%)`,
            primary: sec
        },
        {
            name: "Gradient 5",
            css: `linear-gradient(135deg, ${primary} 0%, ${adjustBrightness(primary, -15)} 60%, ${surface} 100%)`,
            primary: primary
        },
        {
            name: "Gradient 6",
            css: `linear-gradient(135deg, ${surface} 0%, ${sec} 60%, ${urgent} 100%)`,
            primary: urgent
        }
    ];
}

export let DYNAMIC_SUBJECT_GRADIENTS = generateSubjectColors(PALETTE_PRESETS.default.colors, false);

/**
 * Apply selected palette to document via CSS custom properties
 */
export function applyPalette(paletteId = 'default', customColors = null) {
    let preset = PALETTE_PRESETS[paletteId] || PALETTE_PRESETS.default;
    let colors = { ...preset.colors };

    if (paletteId === 'custom') {
        const savedCustom = customColors || getSavedCustomColors();
        colors = {
            ...colors,
            ...savedCustom,
            primaryLight: adjustBrightness(savedCustom.primary || colors.primary, 15),
            canvasDeep: adjustBrightness(savedCustom.canvas || colors.canvas, -15),
            surfaceHover: adjustBrightness(savedCustom.surface || colors.surface, 15)
        };
        PALETTE_PRESETS.custom.colors = colors;
    }

    const isFlat = typeof document !== 'undefined' && document.body?.classList.contains('theme-flat');

    if (typeof document !== 'undefined') {
        const root = document.documentElement;

        // Core Palette Swatches
        root.style.setProperty('--palette-dark-slate', colors.surface);
        root.style.setProperty('--palette-stormy-teal', colors.primary);
        root.style.setProperty('--palette-powder-petal', colors.text);
        root.style.setProperty('--palette-tomato-jam', colors.urgent);
        root.style.setProperty('--palette-chestnut', colors.secondary || '#772E25');

        // Backgrounds & Canvas
        root.style.setProperty('--bg-canvas', colors.canvas);
        root.style.setProperty('--bg-canvas-deep', colors.canvasDeep || adjustBrightness(colors.canvas, -15));
        root.style.setProperty('--card-surface', colors.surface);
        root.style.setProperty('--card-surface-glass', hexToRgba(colors.surface, 0.85));
        root.style.setProperty('--card-surface-hover', colors.surfaceHover || adjustBrightness(colors.surface, 15));
        root.style.setProperty('--card-border', hexToRgba(colors.text, 0.14));
        root.style.setProperty('--card-border-hover', hexToRgba(colors.primary, 0.70));

        // Primary Interactive
        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-primary-light', colors.primaryLight || adjustBrightness(colors.primary, 15));
        root.style.setProperty('--color-primary-dark', adjustBrightness(colors.primary, -20));
        root.style.setProperty('--color-primary-glow', hexToRgba(colors.primary, 0.45));
        root.style.setProperty('--color-primary-subtle', hexToRgba(colors.primary, 0.18));

        // Typography & Light Surfaces
        root.style.setProperty('--text-primary', colors.text);
        root.style.setProperty('--text-secondary', hexToRgba(colors.text, 0.80));
        root.style.setProperty('--text-muted', hexToRgba(colors.text, 0.54));
        root.style.setProperty('--text-subtle', hexToRgba(colors.text, 0.32));

        // Alerts & Urgency
        root.style.setProperty('--color-urgent', colors.urgent);
        root.style.setProperty('--color-urgent-light', adjustBrightness(colors.urgent, 15));
        root.style.setProperty('--color-urgent-glow', hexToRgba(colors.urgent, 0.45));
        root.style.setProperty('--color-urgent-subtle', hexToRgba(colors.urgent, 0.20));

        // Success State
        const successCol = colors.success || '#2dd4bf';
        root.style.setProperty('--color-success', successCol);
        root.style.setProperty('--color-success-subtle', hexToRgba(successCol, 0.18));

        // Backward-Compatibility Aliases
        root.style.setProperty('--card-slate', colors.surface);
        root.style.setProperty('--blue-accent-cyan', colors.primary);
        root.style.setProperty('--blue-glow', hexToRgba(colors.primary, 0.45));
        root.style.setProperty('--urgent-red', colors.urgent);
        root.style.setProperty('--urgent-amber', colors.secondary || colors.urgent);
        root.style.setProperty('--success-emerald', successCol);
    }

    const newGradients = generateSubjectColors(colors, isFlat);
    DYNAMIC_SUBJECT_GRADIENTS.length = 0;
    DYNAMIC_SUBJECT_GRADIENTS.push(...newGradients);

    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('study_flow_palette_id', paletteId);
        if (paletteId === 'custom') {
            localStorage.setItem('study_flow_custom_colors', JSON.stringify(colors));
        }
    }
}

export function getActivePaletteId() {
    if (typeof localStorage === 'undefined') return 'default';
    return localStorage.getItem('study_flow_palette_id') || 'default';
}

export function getSavedCustomColors() {
    if (typeof localStorage === 'undefined') return { ...PALETTE_PRESETS.default.colors };
    try {
        const raw = localStorage.getItem('study_flow_custom_colors');
        if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { ...PALETTE_PRESETS.default.colors };
}

// Helpers
export function hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== 'string') return `rgba(40, 61, 59, ${alpha})`;
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
        clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return `rgba(40, 61, 59, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function adjustBrightness(hex, percent) {
    if (!hex || typeof hex !== 'string') return hex;
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    let num = parseInt(clean, 16);
    if (isNaN(num)) return hex;
    let r = Math.min(255, Math.max(0, ((num >> 16) & 255) + Math.round(255 * (percent / 100))));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 255) + Math.round(255 * (percent / 100))));
    let b = Math.min(255, Math.max(0, (num & 255) + Math.round(255 * (percent / 100))));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
