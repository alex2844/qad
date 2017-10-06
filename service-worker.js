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
	UPDATE = _upday();
self.addEventListener('install', e => {
	self.skipWaiting();
	e.waitUntil(caches.open(UPDATE).then(cache => {
		return cache.addAll(FILES);
	}));
});
self.addEventListener('activate', e => {
	e.waitUntil(_clear);
});
self.addEventListener('fetch', e => {
	e.respondWith(caches.match(e.request).then(res => {
		if (res && (Date.now() - new Date(res.headers.get('date')).valueOf() > 86400000) && navigator.onLine)
			_clear(true);
		return res || fetch(e.request).then(res => caches.open(UPDATE).then(cache => {
			if (res.status == 200 && e.request.method == 'GET' && !(e.request.mode == 'cors' && !e.request.url.match('/data/')))
				cache.put(e.request, res.clone());
			return res;
		}));
	}));
});
self.addEventListener('push', e => {
	e.waitUntil((
		(e.data && (typeof(e.data.text) == 'function'))
		? self.registration.showNotification(e.data.text())
		: self.registration.pushManager.getSubscription().then(sub => {
			if (sub && sub.endpoint)
				fetch('/service-worker.php', {
					method: 'POST',
					body: _form({
						gcm: 'list',
						token: sub.endpoint.split('gcm/send/')[1]
					})
				}).then(res => res.text()).then(topics => {
					fetch('/service-worker.php', {
						method: 'POST',
						body: _form({
							gcm: 'get',
							topics: topics
						})
					}).then(res => res.json()).then(res => {
						self.registration.showNotification(res.notification.title, {
							body: res.notification.body,
							sound: res.notification.sound,
							icon: res.data.icon,
							data: {
								action: res.data.action
							},
							actions: res.data.actions
						})
					});
				});
		})
	));
});
self.addEventListener('notificationclick', e => {
	var action = null;
	e.notification.close();
	if (e.action)
		action = e.action;
	else if (e.notification && e.notification.data && e.notification.data.action)
		action = e.notification.data.action;
	if (action && action != 'close')
		e.waitUntil(
			clients.matchAll({
				type: 'window'
			}).then(windowClients => {
				for (var i = 0; i < windowClients.length; i++) {
					var client = windowClients[i];
					if (client.url === location.origin+CACHENAME+'?actions='+action && 'focus' in client)
						return client.focus();
				}
				if (clients.openWindow)
					return clients.openWindow(location.origin+CACHENAME+'?actions='+action);
			})
		);
});
function _form(object) {
	var form = new FormData();
	for (var i in object) {
		form.append(i, object[i]);
	}
	return form;
}
function _clear(e) {
	return caches.keys().then(keys => {
		return Promise.all(keys.map((key, i) => {
			if ((Number(key) !== UPDATE) || e == true)
				return caches.delete(keys[i]);
		}))
	});
}
function _upday() {
	var now = new Date(),
		start = new Date(now.getFullYear(), 0, 0),
		diff = now - start,
		oneDay = 1000 * 60 * 60 * 24;
	return Math.floor(diff / oneDay);
}
