import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ICONS } from '../app/js/icons.js';

describe('Card View Options, Banner Theme Sync & Pin Icon Enhancements', () => {
    const viewsCss = fs.readFileSync(path.resolve('app/css/views.css'), 'utf-8');
    const cardsViewJs = fs.readFileSync(path.resolve('app/js/views/cardsView.js'), 'utf-8');
    const variablesCss = fs.readFileSync(path.resolve('app/css/variables.css'), 'utf-8');

    describe('1. General Task Banner Dynamic Theme Sync', () => {
        it('should use theme CSS variables for General tasks card banner instead of hardcoded blue', () => {
            // Must define --general-banner-bg in variables.css
            expect(variablesCss).toMatch(/--general-banner-bg:\s*linear-gradient/);
            expect(variablesCss).toMatch(/--general-banner-text:/);

            // In views.css, general-card header banner must use var(--general-banner-bg)
            expect(viewsCss).toMatch(/\.subject-card\.general-card\s+\.subject-header-banner\s*\{[^}]*background:\s*var\(--general-banner-bg\)/);
            expect(viewsCss).toMatch(/\.subject-card\.general-card\s+\.subject-header-banner\s*\{[^}]*color:\s*var\(--general-banner-text\)/);

            // Must NOT have hardcoded blue rgba(30, 41, 59...) or #1e293b in the general-card header banner
            const generalCardBannerSection = viewsCss.slice(viewsCss.indexOf('.subject-card.general-card .subject-header-banner'), viewsCss.indexOf('.add-course-card'));
            expect(generalCardBannerSection).not.toContain('rgba(30, 41, 59');
            expect(generalCardBannerSection).not.toContain('#1e293b');
        });
    });

    describe('2. Top Options Three-Dot Menu & Drag-and-Drop Removal', () => {
        it('should render three-dot menu dropdown on both General Tasks and Course cards', () => {
            // General Tasks Card
            expect(cardsViewJs).toContain('card-dots-menu-btn');
            expect(cardsViewJs).toContain('card-dropdown-floating-menu');
            expect(cardsViewJs).toContain('btn-menu-pin-general');
            expect(cardsViewJs).toContain('btn-menu-add-general');

            // Course Card
            expect(cardsViewJs).toContain('btn-menu-pin-subj');
            expect(cardsViewJs).toContain('btn-menu-add-item');
            expect(cardsViewJs).toContain('btn-menu-add-folder');
            expect(cardsViewJs).toContain('btn-menu-edit-subj');
        });

        it('should remove drag and drop option and handle from cards', () => {
            // Card must not be draggable
            expect(cardsViewJs).not.toContain('card.draggable = true');
            // Drag handle icon must not be rendered
            expect(cardsViewJs).not.toContain('subject-drag-handle');
            expect(cardsViewJs).not.toContain('dragGrip');
            // HTML5 drag listeners must not be attached to cards
            expect(cardsViewJs).not.toMatch(/card\.addEventListener\(['"]dragstart['"]/);
            expect(cardsViewJs).not.toMatch(/card\.addEventListener\(['"]dragover['"]/);
            expect(cardsViewJs).not.toMatch(/card\.addEventListener\(['"]drop['"]/);
        });

        it('should elevate z-index and handle overflow when card menu is opened', () => {
            expect(viewsCss).toContain('.card-menu-dropdown-wrap');
            expect(viewsCss).toContain('.card-dots-menu-btn');
            expect(viewsCss).toContain('.card-dropdown-floating-menu');
            expect(viewsCss).toContain('.subject-card.has-open-menu');
            expect(viewsCss).toMatch(/\.subject-card\.has-open-menu\s*\{[^}]*overflow:\s*visible/);
        });
    });

    describe('3. True Pushpin SVG Vector Icon', () => {
        it('should use recognizable pushpin SVG with needle line and cap/body without emojis', () => {
            // Outline pin
            expect(ICONS.pin).toContain('<svg');
            expect(ICONS.pin).toContain('<line x1="12" y1="17" x2="12" y2="22"');
            expect(ICONS.pin).toContain('M5 17h14');

            // Filled pin
            expect(ICONS.pinFilled).toContain('<svg');
            expect(ICONS.pinFilled).toContain('<line x1="12" y1="17" x2="12" y2="22"');
            expect(ICONS.pinFilled).toContain('fill="currentColor"');

            // Zero emojis
            expect(ICONS.pin).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
            expect(ICONS.pinFilled).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
        });
    });
});
