/**
 * Study Flow Organizer - Service Worker (v4.4 PWA)
 * Provides offline caching for static assets and enables Android PWA installation.
 */

const CACHE_NAME = 'study-flow-cache-v4.4';

const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './favicon.ico',
    './icon.png',
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/views.css',
    './css/modals.css',
    './css/custom-controls.css',
    './js/app.js',
    './js/api.js',
    './js/state.js',
    './js/types.js',
    './js/icons.js',
    './js/theme.js',
    './js/toast.js',
    './js/dateUtils.js',
    './js/jalali.js',
    './js/markdown.js',
    './js/components/commandPalette.js',
    './js/components/customDatePicker.js',
    './js/components/customSelect.js',
    './js/components/customTimePicker.js',
    './js/components/editableCourseSelect.js',
    './js/modals/aiModal.js',
    './js/modals/backupModal.js',
    './js/modals/folderModal.js',
    './js/modals/itemModal.js',
    './js/modals/modalMount.js',
    './js/modals/modalTemplates.js',
    './js/modals/subjectModal.js',
    './js/modals/tagModal.js',
    './js/modals/trashModal.js',
    './js/services/aiService.js',
    './js/services/quickAiVoice.js',
    './js/views/calendarView.js',
    './js/views/cardsView.js',
    './js/views/kanbanView.js',
    './js/views/timelineView.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Bypass API calls, Google auth, and external services
    if (
        url.pathname.startsWith('/api/') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('google.com') ||
        url.hostname.includes('gstatic.com') ||
        event.request.method !== 'GET'
    ) {
        return;
    }

    // Stale-while-revalidate for static assets
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Network failed; cachedResponse will be returned if available
            });

            return cachedResponse || fetchPromise;
        })
    );
});
