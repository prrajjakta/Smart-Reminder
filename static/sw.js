// Service Worker for Remindly — handles background notifications
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Listen for messages from the main page to show notifications
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    self.registration.showNotification(title, {
      body,
      tag,                        // deduplicate same reminder
      icon: '/static/icon.png',   // optional; browser uses default if missing
      badge: '/static/icon.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false
    });
  }
});

// Clicking the notification brings the tab into focus
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
