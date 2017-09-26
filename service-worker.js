/*
=====================================================
Qad Framework (serwice-worker.js)
-----------------------------------------------------
https://qwedl.com/
-----------------------------------------------------
Copyright (c) 2016-2017 Alex Smith
=====================================================
*/
var BLACKLIST = [
		//'https://*'
	],
	FILES = [],
	CACHENAME = location.search.split('?')[1],
	UPDATE = upday();
self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(UPDATE).then(cache => {
			console.log('Install app');
			return cache.addAll(FILES);
		})
	);
});
self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(keys => {
			return Promise.all(keys.map((key, i) => {
				if(key !== UPDATE)
					return caches.delete(keys[i]);
			}))
		})
	);
});
self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request).then(response => {
			return response || fetch(event.request).then(response => caches.open(UPDATE).then(cache => {
				if (response.status == 200 && event.request.method == 'GET' && !(event.request.mode == 'cors' && !event.request.url.match('/data/')))
					cache.put(event.request, response.clone());
				return response;
			}));
		})
	);
});
self.addEventListener('notificationclick', event => {
	console.log('Notification click: tag ', event.notification.tag);
	event.notification.close();
	if (!event.action)
		return;
	event.waitUntil(
		clients.matchAll({
			type: 'window'
		}).then(windowClients => {
			for (var i = 0; i < windowClients.length; i++) {
				var client = windowClients[i];
				if (client.url === location.origin+CACHENAME+'?actions='+event.action && 'focus' in client)
					return client.focus();
			}
			if (clients.openWindow)
				return clients.openWindow(location.origin+CACHENAME+'?actions='+event.action);
		})
	);
});
function upday() {
	var now = new Date(),
		start = new Date(now.getFullYear(), 0, 0),
		diff = now - start,
		oneDay = 1000 * 60 * 60 * 24;
	return Math.floor(diff / oneDay);
}
