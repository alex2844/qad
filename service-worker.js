/*
=====================================================
Qad Framework (serwice-worker.js)
-----------------------------------------------------
https://pcmasters.ml/
-----------------------------------------------------
Copyright (c) 2016 Alex Smith
=====================================================
*/
var BLACKLIST = [
	'https://*'
];
var FILES = [];
var CACHENAME = location.search.split('?')[1];
var UPDATE = upday();
self.addEventListener('install', function(event){
	event.waitUntil(
		caches.open(UPDATE).then(function (cache) {
			console.log('Opened cache');
			return cache.addAll(FILES);
		})
	);
});
self.addEventListener('activate', function (event) {
	event.waitUntil(
		caches.keys().then(function(keys){
			return Promise.all(keys.map(function(key, i){
				if(key !== UPDATE)
					return caches.delete(keys[i]);
			}))
		})
	)
});
self.addEventListener('fetch', function (event) {
	if (event.request.url.indexOf('localhost') != -1)
		event.respondWith(
			caches.match(event.request).then(function(response){
				return response || fetch(event.request).then(function(response) {
					return caches.open(UPDATE).then(function(cache) {
						cache.put(event.request, response.clone());
						return response;
					});
				});
			})
		)
});
self.addEventListener('notificationclick', function(event) {
	console.log('Notification click: tag ', event.notification.tag);
	event.notification.close();
	if (!event.action)
		return;
	event.waitUntil(
		clients.matchAll({
			type: 'window'
		}).then(function(windowClients) {
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
	var now = new Date();
	var start = new Date(now.getFullYear(), 0, 0);
	var diff = now - start;
	var oneDay = 1000 * 60 * 60 * 24;
	return Math.floor(diff / oneDay);
}
