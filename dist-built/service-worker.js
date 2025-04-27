// Service Worker for Math Alarm App
const CACHE_NAME = 'math-alarm-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/sounds/alarm_clock.mp3',
        '/sounds/digital_alarm.mp3',
        '/sounds/beep.mp3'
      ]);
    })
  );
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/alarm-icon.png',
    badge: '/alarm-icon.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('Math Alarm', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Send message to client that notification was clicked
  self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clients) => {
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'NOTIFICATION_CLICK'
      });
      clients[0].focus();
    } else {
      self.clients.openWindow('/');
    }
  });
});