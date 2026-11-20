import { describe, it, expect, beforeEach } from 'vitest';
import {
    PALETTE_PRESETS,
    getLuminance,
    getContrastRatio,
    getHighContrastText,
    generateSubjectColors,
    applyPalette,
    getActivePaletteId,
    applyThemeStyle,
    getActiveThemeStyle,
    DYNAMIC_SUBJECT_GRADIENTS
} from '../app/js/theme.js';

describe('Theme & Rigid Color System', () => {
    it('should have all 5 master palette presets defined with required keys', () => {
        const requiredKeys = ['primary', 'canvas', 'surface', 'text', 'urgent'];
        const presetKeys = Object.keys(PALETTE_PRESETS);
        expect(presetKeys).toContain('default');
        expect(presetKeys).toContain('black');
        expect(presetKeys).toContain('dark_blue');
        expect(presetKeys).toContain('nord_light');
        expect(presetKeys).toContain('custom');

        presetKeys.forEach(key => {
            const preset = PALETTE_PRESETS[key];
            expect(preset.id).toBe(key);
            requiredKeys.forEach(field => {
                expect(preset.colors[field]).toBeDefined();
                expect(preset.colors[field]).toMatch(/^#[0-9a-fA-F]{6}$/);
            });
        });
    });

    it('should accurately calculate relative luminance for black, white and colors', () => {
        expect(getLuminance('#000000')).toBe(0);
        expect(getLuminance('#ffffff')).toBeCloseTo(1, 2);
        // Slate / deep dark has low luminance
        expect(getLuminance('#1e2e2c')).toBeLessThan(0.1);
        // Light paper has high luminance
        expect(getLuminance('#f8fafc')).toBeGreaterThan(0.9);
    });

    it('should guarantee high contrast text (WCAG contrast >= 4.5:1) for any background', () => {
        const testBgs = [
            '#000000', // OLED black -> text must be white
            '#ffffff', // Pure white -> text must be dark
            '#f4f4f5', // Crisp light silver (Black theme primary) -> text must be dark!
            '#197278', // Stormy teal -> text must be white
            '#0369a1', // Deep cerulean blue -> text must be white
            '#ef4444', // Red -> text must be white
            '#f59e0b', // Amber / Gold -> text must be dark!
            '#283D3B'  // Dark slate surface -> text must be white / petal
        ];

        testBgs.forEach(bg => {
            const text = getHighContrastText(bg);
            const ratio = getContrastRatio(bg, text);
            expect(ratio).toBeGreaterThanOrEqual(4.5);
            // Verify light backgrounds get dark text and dark get light text
            if (bg === '#ffffff' || bg === '#f4f4f5') {
                expect(text).toMatch(/#09090b|#0f172a|#000000/);
            }
            if (bg === '#000000' || bg === '#1e2e2c') {
                expect(text).toBe('#ffffff');
            }
        });
    });

    it('should generate 6 distinct subject accents where none vanishes into card surface', () => {
        ['default', 'nord_light', 'black', 'dark_blue'].forEach(presetKey => {
            const colors = PALETTE_PRESETS[presetKey].colors;
            // Test Flat mode
            const flatAccents = generateSubjectColors(colors, true);
            expect(flatAccents.length).toBe(6);
            flatAccents.forEach(accent => {
                // In flat mode, the accent must NOT be the same as the card surface!
                expect(accent.primary).not.toBe(colors.surface);
                expect(accent.contrastText).toBeDefined();
                const ratio = getContrastRatio(accent.primary, accent.contrastText);
                expect(ratio).toBeGreaterThanOrEqual(3.5); // Meets WCAG AA large/banner text requirement
            });

            // Test Glass mode
            const glassAccents = generateSubjectColors(colors, false);
            expect(glassAccents.length).toBe(6);
            glassAccents.forEach(accent => {
                expect(accent.css).toContain('linear-gradient');
                expect(accent.contrastText).toBeDefined();
            });
        });
    });

    it('should dispatch studyflow:themechange custom event when applying palette', () => {
        let eventFired = false;
        let eventDetail = null;

        const store = {};
        globalThis.localStorage = {
            getItem: (k) => store[k] ?? null,
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; }
        };

        const bus = new EventTarget();
        globalThis.window = bus;

        const handler = (e) => {
            eventFired = true;
            eventDetail = e.detail;
        };

        bus.addEventListener('studyflow:themechange', handler);
        applyPalette('nord_light');

        expect(eventFired).toBe(true);
        expect(eventDetail.paletteId).toBe('nord_light');
        expect(eventDetail.isLight).toBe(true);

        // Also test applyThemeStyle event dispatch
        let themeEventFired = false;
        let themeEventDetail = null;
        bus.addEventListener('studyflow:themechange', (e) => {
            themeEventFired = true;
            themeEventDetail = e.detail;
        });

        applyThemeStyle('flat');
        expect(themeEventFired).toBe(true);
        expect(getActiveThemeStyle()).toBe('flat');
        expect(themeEventDetail.isFlat).toBe(true);

        delete globalThis.window;
        delete globalThis.localStorage;
    });

    it('should dynamically sync General tasks banner CSS custom properties with active themes', () => {
        const rootProps = {};
        const mockDoc = {
            documentElement: {
                style: {
                    setProperty: (k, v) => { rootProps[k] = v; },
                    getPropertyValue: (k) => rootProps[k] ?? ''
                }
            },
            body: {
                classList: {
                    toggle: () => {},
                    add: () => {},
                    remove: () => {}
                },
                dataset: {}
            }
        };

        globalThis.document = mockDoc;
        globalThis.localStorage = {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
        };

        // 1. Default Teal Slate palette
        applyPalette('default');
        expect(rootProps['--general-banner-bg']).toBeDefined();
        expect(rootProps['--general-banner-bg']).toContain('linear-gradient');
        // Must NOT be the old hardcoded blue (rgba(30, 41, 59...))
        expect(rootProps['--general-banner-bg']).not.toContain('30, 41, 59');
        expect(rootProps['--general-banner-text']).toBe(PALETTE_PRESETS.default.colors.text);

        // 2. Ultra Minimalist Black palette
        applyPalette('black');
        expect(rootProps['--general-banner-bg']).toBeDefined();
        // Must be carbon/black, never blue
        expect(rootProps['--general-banner-bg']).not.toContain('30, 41, 59');
        expect(rootProps['--general-banner-bg']).not.toContain('#1e293b');
        expect(rootProps['--general-banner-text']).toBe('#ffffff');

        // 3. Clean Daylight (nord_light) palette
        applyPalette('nord_light');
        expect(rootProps['--general-banner-bg']).toBeDefined();
        expect(rootProps['--general-banner-text']).toBe('#0f172a');
        expect(rootProps['--general-banner-subtitle']).toBe('#334155');

        // 4. Flat mode style
        applyPalette('default');
        // Glass mode has linear-gradient
        expect(rootProps['--general-banner-bg']).toContain('linear-gradient');

        delete globalThis.document;
        delete globalThis.localStorage;
    });

    it('should use a true vector pushpin SVG for ICONS.pin and ICONS.pinFilled without emojis', async () => {
        const { ICONS } = await import('../app/js/icons.js');

        expect(ICONS.pin).toBeDefined();
        expect(ICONS.pinFilled).toBeDefined();

        // Must be valid SVG elements
        expect(ICONS.pin).toContain('<svg');
        expect(ICONS.pinFilled).toContain('<svg');

        // Must contain standard pushpin elements: needle line and pin head/body path
        expect(ICONS.pin).toContain('<line x1="12" y1="17" x2="12" y2="22"');
        expect(ICONS.pinFilled).toContain('<line x1="12" y1="17" x2="12" y2="22"');
        expect(ICONS.pinFilled).toContain('fill="currentColor"');

        // Must not contain any emoji characters
        expect(ICONS.pin).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
        expect(ICONS.pinFilled).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
    });
});
