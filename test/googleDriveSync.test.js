import { describe, it, expect, beforeEach } from 'vitest';
import { mergeDatasets } from '../app/js/services/googleDriveSync.js';

describe('Google Drive Sync Service - Three-Way Merge Engine', () => {
    it('should return local data if remote data is empty or invalid', () => {
        const local = {
            subjects: [{ id: 'sub_1', name: 'Mathematics' }],
            items: [{ id: 'task_1', title: 'Calculus HW', status: 'pending' }]
        };
        const result = mergeDatasets(local, null);
        expect(result.merged.items).toHaveLength(1);
        expect(result.merged.items[0].title).toBe('Calculus HW');
    });

    it('should combine non-overlapping tasks from mobile and desktop', () => {
        const local = {
            subjects: [{ id: 'sub_1', name: 'Math' }],
            items: [
                { id: 'task_desktop', title: 'Desktop Task', status: 'pending', updatedAt: '2026-11-20T10:00:00Z' }
            ]
        };
        const remote = {
            subjects: [{ id: 'sub_2', name: 'Physics' }],
            items: [
                { id: 'task_mobile', title: 'Mobile Task', status: 'done', updatedAt: '2026-11-20T11:00:00Z' }
            ]
        };

        const result = mergeDatasets(local, remote);
        expect(result.merged.items).toHaveLength(2);
        expect(result.merged.subjects).toHaveLength(2);
        expect(result.merged.items.map(i => i.id)).toContain('task_desktop');
        expect(result.merged.items.map(i => i.id)).toContain('task_mobile');
    });

    it('should resolve concurrent edit by picking the item with the newer timestamp', () => {
        const local = {
            subjects: [],
            items: [
                {
                    id: 'task_shared',
                    title: 'Midterm Prep',
                    status: 'pending',
                    updatedAt: '2026-11-20T12:00:00Z'
                }
            ]
        };
        const remote = {
            subjects: [],
            items: [
                {
                    id: 'task_shared',
                    title: 'Midterm Prep (Updated on Mobile)',
                    status: 'done',
                    updatedAt: '2026-11-20T14:30:00Z' // Newer
                }
            ]
        };

        const result = mergeDatasets(local, remote);
        expect(result.merged.items).toHaveLength(1);
        expect(result.merged.items[0].status).toBe('done');
        expect(result.merged.items[0].title).toBe('Midterm Prep (Updated on Mobile)');
    });

    it('should preserve local newer edits over older remote edits', () => {
        const local = {
            subjects: [],
            items: [
                {
                    id: 'task_shared',
                    title: 'Latest Local Edit',
                    status: 'in_progress',
                    updatedAt: '2026-11-20T16:00:00Z' // Newer
                }
            ]
        };
        const remote = {
            subjects: [],
            items: [
                {
                    id: 'task_shared',
                    title: 'Old Mobile Edit',
                    status: 'pending',
                    updatedAt: '2026-11-20T13:00:00Z'
                }
            ]
        };

        const result = mergeDatasets(local, remote);
        expect(result.merged.items).toHaveLength(1);
        expect(result.merged.items[0].title).toBe('Latest Local Edit');
        expect(result.merged.items[0].status).toBe('in_progress');
    });

    it('should merge tags without duplicates', () => {
        const local = { items: [], tags: ['homework', 'urgent'] };
        const remote = { items: [], tags: ['exam', 'homework'] };

        const result = mergeDatasets(local, remote);
        expect(result.merged.tags).toContain('homework');
        expect(result.merged.tags).toContain('urgent');
        expect(result.merged.tags).toContain('exam');
        expect(result.merged.tags).toHaveLength(3);
    });
});
