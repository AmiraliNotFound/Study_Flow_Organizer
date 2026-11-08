/**
 * Study Flow Organizer - Dynamic Theme & Color Palette Engine
 * 
 * Supports:
 * 1. Default (Teal Slate / Earth 5-color palette)
 * 2. Ultra Minimalistic Black (Monochrome / Onyx)
 * 3. Flat Dark Blue (Midnight Navy / Ice Blue)
 * 4. Custom 5-Color User Palette (100% dynamic CSS variables)
 * 5. Dynamic Topic Gradients & Flat solids synchronized with the active palette
 */

export const PALETTE_PRESETS = {
    default: {
        id: 'default',
        name: 'Teal Slate (Default)',
        icon: '🌿',
        colors: {
            primary: '#197278',       // Stormy Teal
            canvas: '#1e2e2c',        // Canvas Dark Base
            surface: '#283D3B',       // Card Slate
            text: '#EDDDD4',          // Powder Petal
            urgent: '#C44536',        // Tomato Jam
            secondary: '#772E25'      // Chestnut
        }
    },
    black: {
        id: 'black',
        name: 'Ultra Minimalist Black',
        icon: '⚫',
        colors: {
            primary: '#d4d4d4',       // Crisp Silver / White Accent
            canvas: '#09090b',        // Pure Deep Onyx
            surface: '#141416',       // Deep Charcoal Card
            text: '#f4f4f5',          // Pure Crisp White Text
            urgent: '#ef4444',        // Crisp Red
            secondary: '#27272a'      // Dark Zinc Border/Accent
        }
    },
    dark_blue: {
        id: 'dark_blue',
        name: 'Flat Dark Blue',
        icon: '🌊',
        colors: {
            primary: '#3a86ff',       // Electric Ocean Azure
            canvas: '#0a1128',        // Deep Midnight Navy
            surface: '#1c2541',       // Rich Navy Slate
            text: '#e0e1dd',          // Ice Mist White
            urgent: '#ff5a5f',        // Coral Crimson
            secondary: '#415a77'      // Slate Indigo
        }
    },
    custom: {
        id: 'custom',
        name: 'Custom 5-Color',
        icon: '🎨',
        colors: {
            primary: '#197278',
            canvas: '#1e2e2c',
            surface: '#283D3B',
            text: '#EDDDD4',
            urgent: '#C44536',
            secondary: '#772E25'
        }
    }
};

/**
 * Generates dynamic gradients and flat solids from a given 5-color palette
 */
export function generateSubjectColors(paletteColors, isFlat = false) {
    const { primary, canvas, surface, text, urgent, secondary } = paletteColors;

    if (isFlat) {
        return [
            { name: "Accent 1", css: primary, primary: primary, isFlat: true },
            { name: "Accent 2", css: surface, primary: surface, isFlat: true },
            { name: "Accent 3", css: urgent, primary: urgent, isFlat: true },
            { name: "Accent 4", css: secondary || '#772E25', primary: secondary || '#772E25', isFlat: true },
            { name: "Accent 5", css: adjustBrightness(primary, -20), primary: primary, isFlat: true },
            { name: "Accent 6", css: adjustBrightness(surface, 25), primary: surface, isFlat: true }
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
            css: `linear-gradient(135deg, ${adjustBrightness(urgent, -35)} 0%, ${adjustBrightness(urgent, -15)} 50%, ${urgent} 100%)`,
            primary: urgent
        },
        {
            name: "Gradient 4",
            css: `linear-gradient(135deg, ${canvas} 0%, ${secondary || '#772E25'} 100%)`,
            primary: secondary || '#772E25'
        },
        {
            name: "Gradient 5",
            css: `linear-gradient(135deg, ${primary} 0%, ${adjustBrightness(primary, -15)} 60%, ${surface} 100%)`,
            primary: primary
        },
        {
            name: "Gradient 6",
            css: `linear-gradient(135deg, ${surface} 0%, ${secondary || '#772E25'} 60%, ${urgent} 100%)`,
            primary: urgent
        }
    ];
}

/**
 * Dynamic subject gradients/colors list - mutated when palette or theme changes
 */
export let DYNAMIC_SUBJECT_GRADIENTS = generateSubjectColors(PALETTE_PRESETS.default.colors, false);

/**
 * Apply selected palette to the document via CSS custom properties
 */
export function applyPalette(paletteId = 'default', customColors = null) {
    let preset = PALETTE_PRESETS[paletteId] || PALETTE_PRESETS.default;
    let colors = { ...preset.colors };

    if (paletteId === 'custom') {
        const savedCustom = customColors || getSavedCustomColors();
        colors = { ...colors, ...savedCustom };
        PALETTE_PRESETS.custom.colors = colors;
    }

    const isFlat = document.body.classList.contains('theme-flat');
    const root = document.documentElement;

    // Apply Dynamic CSS Variables
    root.style.setProperty('--palette-dark-slate', colors.surface);
    root.style.setProperty('--palette-stormy-teal', colors.primary);
    root.style.setProperty('--palette-powder-petal', colors.text);
    root.style.setProperty('--palette-tomato-jam', colors.urgent);
    root.style.setProperty('--palette-chestnut', colors.secondary || '#772E25');

    root.style.setProperty('--bg-canvas', colors.canvas);
    root.style.setProperty('--bg-canvas-deep', adjustBrightness(colors.canvas, -15));
    root.style.setProperty('--card-surface', colors.surface);
    root.style.setProperty('--card-surface-glass', hexToRgba(colors.surface, 0.82));
    root.style.setProperty('--card-surface-hover', hexToRgba(colors.surface, 0.94));
    root.style.setProperty('--card-border', hexToRgba(colors.text, 0.14));
    root.style.setProperty('--card-border-hover', hexToRgba(colors.primary, 0.70));

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-light', adjustBrightness(colors.primary, 15));
    root.style.setProperty('--color-primary-dark', adjustBrightness(colors.primary, -20));
    root.style.setProperty('--color-primary-glow', hexToRgba(colors.primary, 0.40));
    root.style.setProperty('--color-primary-subtle', hexToRgba(colors.primary, 0.16));

    root.style.setProperty('--text-primary', colors.text);
    root.style.setProperty('--text-secondary', hexToRgba(colors.text, 0.78));
    root.style.setProperty('--text-muted', hexToRgba(colors.text, 0.52));
    root.style.setProperty('--text-subtle', hexToRgba(colors.text, 0.32));

    root.style.setProperty('--color-urgent', colors.urgent);
    root.style.setProperty('--color-urgent-light', adjustBrightness(colors.urgent, 15));
    root.style.setProperty('--color-urgent-glow', hexToRgba(colors.urgent, 0.45));
    root.style.setProperty('--color-urgent-subtle', hexToRgba(colors.urgent, 0.18));

    // Update dynamic topic colors
    DYNAMIC_SUBJECT_GRADIENTS = generateSubjectColors(colors, isFlat);

    localStorage.setItem('study_flow_palette_id', paletteId);
    if (paletteId === 'custom') {
        localStorage.setItem('study_flow_custom_colors', JSON.stringify(colors));
    }
}

export function getActivePaletteId() {
    return localStorage.getItem('study_flow_palette_id') || 'default';
}

export function getSavedCustomColors() {
    try {
        const raw = localStorage.getItem('study_flow_custom_colors');
        if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { ...PALETTE_PRESETS.default.colors };
}

// Helpers
function hexToRgba(hex, alpha = 1) {
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

function adjustBrightness(hex, percent) {
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
