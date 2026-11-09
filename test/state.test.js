import { describe, it, expect } from 'vitest';
import { normalizeData, DEFAULT_CONFIG } from '../app/js/state.js';

describe('State Normalization & Schema Integrity', () => {
    it('should assign fallback configs when raw config is empty', () => {
        const normalized = normalizeData({});
        expect(normalized.$schema).toBe('StudyFlowOrganizer_v4');
        expect(normalized.config.taskTypes.length).toBe(DEFAULT_CONFIG.taskTypes.length);
        expect(normalized.subjects).toEqual([]);
        expect(normalized.items).toEqual([]);
        expect(normalized.trash).toEqual({ subjects: [], items: [], materials: [] });
    });

    it('should preserve inProgress, completed, and extraInfo fields on tasks', () => {
        const sample = {
            subjects: [{ id: 's1', title: 'Machine Design', code: 'ME-401', instructor: 'Dr. Smith' }],
            items: [
                {
                    id: 'i1',
                    kind: 'task',
                    typeId: 'tt_hw',
                    typeName: 'HW',
                    subjectId: 's1',
                    title: 'HW 1',
                    inProgress: true,
                    completed: false,
                    dueDate: '2026-11-15T23:59:00.000Z',
                    extraInfo: { number: '1', notes: '- [ ] Problem 1' }
                },
                {
                    id: 'i2',
                    kind: 'event',
                    typeId: 'et_quiz',
                    typeName: 'Quiz',
                    subjectId: 's1',
                    title: 'Quiz 1',
                    inProgress: false,
                    completed: true,
                    dueDate: '2026-11-10T10:00:00.000Z',
                    extraInfo: { location: 'Room 204' }
                }
            ]
        };

        const normalized = normalizeData(sample);
        const task = normalized.items[0];
        const event = normalized.items[1];

        expect(task.inProgress).toBe(true);
        expect(task.completed).toBe(false);
        expect(task.extraInfo.number).toBe('1');
        expect(task.extraInfo.notes).toBe('- [ ] Problem 1');

        expect(event.inProgress).toBe(false);
        expect(event.completed).toBe(true);
        expect(event.extraInfo.location).toBe('Room 204');
    });

    it('should normalize subject metadata including instructor and tags', () => {
        const sample = {
            subjects: [
                {
                    id: 's2',
                    title: 'Fluid Mechanics',
                    code: 'ME-301',
                    instructor: 'Prof. Reynolds',
                    tags: ['Core', 'Fluids'],
                    isPinned: true,
                    order: 1
                }
            ]
        };

        const normalized = normalizeData(sample);
        const subj = normalized.subjects[0];

        expect(subj.title).toBe('Fluid Mechanics');
        expect(subj.instructor).toBe('Prof. Reynolds');
        expect(subj.tags).toEqual(['Core', 'Fluids']);
        expect(subj.isPinned).toBe(true);
        expect(subj.order).toBe(1);
    });

    it('should maintain soft-delete trash arrays without data loss', () => {
        const sample = {
            trash: {
                subjects: [{ id: 'ts1', title: 'Deleted Math', deletedAt: '2026-11-01T00:00:00.000Z' }],
                items: [{ id: 'ti1', title: 'Deleted Assignment', inProgress: true, deletedAt: '2026-11-01T00:00:00.000Z' }],
                materials: []
            }
        };

        const normalized = normalizeData(sample);
        expect(normalized.trash.subjects.length).toBe(1);
        expect(normalized.trash.items.length).toBe(1);
        expect(normalized.trash.items[0].inProgress).toBe(true);
    });
});
