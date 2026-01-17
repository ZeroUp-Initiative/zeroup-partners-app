// Firebase Cloud Messaging service worker
// This file handles push notifications when the app is in the background

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase with your config
firebase.initializeApp({
  apiKey: 'AIzaSyAcpEr3RseZdfekkRJcMZ69y_QSusI21gs',
  authDomain: 'zeroup-partners-hub-5404-34b69.firebaseapp.com',
  projectId: 'zeroup-partners-hub-5404-34b69',
  storageBucket: 'zeroup-partners-hub-5404-34b69.firebasestorage.app',
  messagingSenderId: '71869767739',
  appId: '1:71869767739:web:0c7ffdfc110b4bceb5bc1e',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'ZeroUp Partners';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.data?.url || payload.data?.click_action || '/dashboard',
      ...payload.data,
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: payload.data?.tag || 'zeroup-notification',
    renotify: true,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[firebase-messaging-sw.js] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
    }).then((subscription) => {
      console.log('[firebase-messaging-sw.js] New subscription:', subscription);
      // You could send this to your server to update the user's token
    })
  );
});
