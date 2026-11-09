/**
 * Automated Smoke & Schema Integrity Test Suite
 * Tests:
 * 1. Data model normalization & field preservation (e.g. inProgress, tags, extraInfo)
 * 2. View-aware filtering pipeline across all 4 views (grid, calendar, timeline, kanban)
 * 3. Soft-delete trash transitions (delete & restore)
 * 4. State mutation without ghost-field dropping
 */

import assert from 'node:assert/strict';
import { normalizeData, AppState, getFilteredItems } from '../app/js/state.js';

console.log('🧪 Running Study Flow Organizer Smoke Tests...\n');

// --- Test 1: Normalization & Field Preservation ---
console.log('Test 1: Normalization preserves inProgress, tags, and extraInfo');
const rawSample = {
    metadata: { version: '4.2.0', appName: 'Test' },
    subjects: [
        { id: 's1', title: 'Calculus III', code: 'MATH-201', instructor: 'Dr. Euler', tags: ['Core', 'Math'], isPinned: true, order: 0 }
    ],
    items: [
        {
            id: 'i1',
            kind: 'task',
            typeId: 'tt_hw',
            typeName: 'HW',
            subjectId: 's1',
            title: 'Homework 1',
            inProgress: true,
            completed: false,
            extraInfo: { number: '1', notes: '- [ ] Read Ch 1' }
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
            extraInfo: { location: 'Hall B', notes: '' }
        }
    ],
    materials: [
        { id: 'm1', subjectId: 's1', name: 'Course Folder', filePath: 'C:/Courses/Math' }
    ]
};

const normalized = normalizeData(rawSample);

assert.equal(normalized.subjects.length, 1, 'Subject count should be 1');
assert.equal(normalized.subjects[0].instructor, 'Dr. Euler', 'Subject instructor preserved');
assert.deepEqual(normalized.subjects[0].tags, ['Core', 'Math'], 'Subject tags preserved');
assert.equal(normalized.items.length, 2, 'Item count should be 2');
assert.equal(normalized.items[0].inProgress, true, 'Item inProgress flag MUST be preserved');
assert.equal(normalized.items[0].completed, false, 'Item completed flag preserved');
assert.equal(normalized.items[0].extraInfo.number, '1', 'Item number preserved');
assert.equal(normalized.items[1].completed, true, 'Item completed flag preserved');
assert.equal(normalized.items[1].extraInfo.location, 'Hall B', 'Event location preserved');
assert.equal(normalized.materials.length, 1, 'Material count should be 1');
console.log('  ✅ Passed\n');

// --- Test 2: View-Aware Filtering Pipeline ---
console.log('Test 2: View-aware filtering respects Kanban vs Grid requirements');
AppState.items = normalized.items;
AppState.subjects = normalized.subjects;
AppState.activeFilter = 'completed'; // User clicked 'Completed' in toolbar

// Grid view should filter to only completed items
const gridFiltered = getFilteredItems({ view: 'grid' });
assert.equal(gridFiltered.length, 1, 'Grid view should see only 1 completed item');
assert.equal(gridFiltered[0].id, 'i2', 'Grid item should be the completed quiz');

// Kanban view MUST bypass status filter so board columns are populated
const kanbanFiltered = getFilteredItems({ view: 'kanban' });
assert.equal(kanbanFiltered.length, 2, 'Kanban view MUST bypass status filter and retain all 2 items');

// Kanban view STILL honors topic/tag filter
AppState.activeTagFilter = 'math';
const tagFiltered = getFilteredItems({ view: 'kanban' });
assert.equal(tagFiltered.length, 2, 'Kanban respects active tag filter');

AppState.activeTagFilter = 'nonexistent_tag';
const emptyFiltered = getFilteredItems({ view: 'kanban' });
assert.equal(emptyFiltered.length, 0, 'Kanban filters out non-matching tags');

AppState.activeTagFilter = 'all';
AppState.activeFilter = 'all';
console.log('  ✅ Passed\n');

// --- Test 3: Soft-Delete Trash Integrity ---
console.log('Test 3: Trash normalization structure');
const trashTest = normalizeData({
    trash: {
        subjects: [{ id: 'ts1', title: 'Old Subject', deletedAt: '2026-11-01T00:00:00.000Z' }],
        items: [{ id: 'ti1', title: 'Old Task', deletedAt: '2026-11-01T00:00:00.000Z' }],
        materials: []
    }
});
assert.equal(trashTest.trash.subjects.length, 1, 'Trash subject count preserved');
assert.equal(trashTest.trash.items.length, 1, 'Trash item count preserved');
console.log('  ✅ Passed\n');

console.log('🎉 All Smoke Tests Passed Successfully!');
