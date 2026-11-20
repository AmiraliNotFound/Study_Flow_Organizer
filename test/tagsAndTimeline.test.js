import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ICONS } from '../app/js/icons.js';
import {
    AppState,
    normalizeData,
    DEFAULT_CONFIG,
    removeGlobalTag,
    addGlobalTag
} from '../app/js/state.js';

describe('Tags Ribbon Wrench & Modal Deletion, Timeline Header Removal & Viewport Floating Button', () => {
    const indexHtml = fs.readFileSync(path.resolve('app/index.html'), 'utf-8');
    const timelineViewJs = fs.readFileSync(path.resolve('app/js/views/timelineView.js'), 'utf-8');
    const tagModalJs = fs.readFileSync(path.resolve('app/js/modals/tagModal.js'), 'utf-8');
    const viewsCss = fs.readFileSync(path.resolve('app/css/views.css'), 'utf-8');
    const modalsCss = fs.readFileSync(path.resolve('app/css/modals.css'), 'utf-8');

    describe('1. Wrench Icon in Tags Ribbon & Modal Deletion Support', () => {
        it('should define a valid ICONS.wrench SVG without emojis', () => {
            expect(ICONS.wrench).toBeDefined();
            expect(ICONS.wrench).toContain('<svg');
            expect(ICONS.wrench).toContain('</svg>');
            expect(ICONS.wrench).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
        });

        it('should use the wrench icon on #btnOpenNewTagModal instead of the plus icon', () => {
            expect(indexHtml).toContain('id="btnOpenNewTagModal"');
            // Must contain wrench path / SVG attributes
            expect(indexHtml).toContain('title="Manage Topics & Tags"');
            // Confirm the plus SVG path (M12 5v14M5 12h14) is replaced with wrench SVG in #btnOpenNewTagModal
            const btnMatch = indexHtml.match(/<button[^>]*id="btnOpenNewTagModal"[^>]*>([\s\S]*?)<\/button>/);
            expect(btnMatch).not.toBeNull();
            expect(btnMatch[1]).toContain('14.7 6.3a1 1 0 0 0 0 1.4l1.6');
            expect(btnMatch[1]).not.toContain('d="M12 5v14M5 12h14"');
        });

        it('should render delete buttons for each tag in tagModal.js', () => {
            expect(tagModalJs).toContain('btn-delete-tag');
            expect(tagModalJs).toContain('removeGlobalTag');
            expect(modalsCss).toContain('.btn-delete-tag');
            expect(modalsCss).toContain('.modal-tag-chip-row');
        });

        it('should correctly remove tags using removeGlobalTag without resurrecting default tags', async () => {
            // Setup AppState with custom tags and subjects
            AppState.config.tags = ['Core', 'Elective', 'Math', 'Physics'];
            AppState.subjects = [
                { id: 's1', title: 'Calculus', tags: ['Math', 'Core'] },
                { id: 's2', title: 'Mechanics', tags: ['Physics', 'Core'] }
            ];
            AppState.activeTagFilter = 'Math';

            // Delete 'Math'
            await removeGlobalTag('Math');

            // 'Math' should be removed from config.tags
            expect(AppState.config.tags).toEqual(['Core', 'Elective', 'Physics']);
            // 'Math' should be removed from subjects[0].tags
            expect(AppState.subjects[0].tags).toEqual(['Core']);
            // activeTagFilter should be reset from 'Math' to 'all'
            expect(AppState.activeTagFilter).toBe('all');

            // Delete all remaining tags
            await removeGlobalTag('Core');
            await removeGlobalTag('Elective');
            await removeGlobalTag('Physics');
            expect(AppState.config.tags).toEqual([]);

            // normalizeData must NOT resurrect DEFAULT_CONFIG.tags when tags is explicitly an empty array
            const normalized = normalizeData({ config: { tags: [] } });
            expect(normalized.config.tags).toEqual([]);
        });
    });

    describe('2. Timeline Header Box Removal', () => {
        it('should not contain timeline-header-box in timelineView.js', () => {
            expect(timelineViewJs).not.toContain('timeline-header-box');
            expect(timelineViewJs).not.toContain('Timeline Schedule');
            expect(timelineViewJs).not.toContain('Proportional milestone spacing');
        });
    });

    describe('3. Window Floating Jump to Today Button', () => {
        it('should append the floating button directly to document.body and not inside the scrolling wrapper', () => {
            expect(timelineViewJs).toContain('document.getElementById(\'timelineFloatingJumpBtn\')');
            expect(timelineViewJs).toContain('document.body.appendChild(floatingBtn)');
            // Should not append floatingBtn to wrapper
            expect(timelineViewJs).not.toMatch(/wrapper\.appendChild\(\s*floatingBtn\s*\)/);
        });

        it('should have viewport fixed positioning styles that do not move with scroll', () => {
            expect(viewsCss).toMatch(/(?:#timelineFloatingJumpBtn|timeline-floating-jump-today)[^{]*\{[^}]*position:\s*fixed/);
            expect(viewsCss).toMatch(/(?:#timelineFloatingJumpBtn|timeline-floating-jump-today)[^{]*\{[^}]*bottom:\s*28px/);
            expect(viewsCss).toMatch(/(?:#timelineFloatingJumpBtn|timeline-floating-jump-today)[^{]*\{[^}]*right:\s*28px/);
            expect(viewsCss).toMatch(/(?:#timelineFloatingJumpBtn|timeline-floating-jump-today)[^{]*\{[^}]*z-index:\s*9999/);
        });
    });
});
