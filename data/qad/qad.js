/*
=====================================================
Qad Framework (qad.js)
-----------------------------------------------------
https://qwedl.com/
-----------------------------------------------------
Copyright (c) 2016-2018 Alex Smith
=====================================================
*/
var Qad = {
	dev: false,
	intent: !!location.hash.match('\\$intent\\$'),
	touch: (function() {
		var touch = ('ontouchstart' in window);
		if (document.querySelector('body'))
			document.querySelector('body').dataset.touch = touch;
		else
			document.querySelector('html').setAttribute('dev', true);
		return touch;
	})(),
	libs: (function(e) {
		var arr = [];
		var c = function(e, p, pp) {
			for (var i in e) {
				if (e[i].constructor.name == 'Object')
					c(e[i], i, p);
				else{
					if (typeof((pp ? window[pp][p][i] : (p ? window[p][i] : window[i]))) == 'function')
						continue;
					arr.push((p ? p+'.' : '')+i);
					if (e[i].constructor.name == 'Function')
						e[i]();
					else if (e[i].constructor.name == 'Array') {
						for (var j in e[i]) {
							var add;
							if ((e[i][j].indexOf('.js') > -1) && (e[i][j].indexOf('.css') == -1)) {
								add = document.createElement('script');
								add.src = e[i][j];
							}else if ((e[i][j].indexOf('.css') > -1) && (e[i][j].indexOf('.js') == -1)) {
								add = document.createElement('link');
								add.type = 'text/css';
								add.rel = 'stylesheet';
								add.href = e[i][j];
							}
							document.querySelector('head').appendChild(add);
						}
					}
				}
			}
		}
		c(e);
		return arr;
	})({
		fetch: ['https://cdnjs.cloudflare.com/ajax/libs/fetch/2.0.3/fetch.min.js'],
		Promise: ['https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.auto.min.js'],
		HTMLDialogElement: [
			'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.4.9/dialog-polyfill.min.js',
			'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.4.9/dialog-polyfill.min.css'
		],
		Object: {
			assign: function() {
				Object.defineProperty(Object, 'assign', {
					enumerable: false,
					configurable: true,
					writable: true,
					value: function(target) {
						'use strict';
						if (target === undefined || target === null)
							throw new TypeError('Cannot convert first argument to object');
						var to = Object(target);
						for (var i = 1; i < arguments.length; i++) {
							var nextSource = arguments[i];
							if (nextSource === undefined || nextSource === null)
								continue;
							nextSource = Object(nextSource);
							var keysArray = Object.keys(Object(nextSource));
							for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
								var nextKey = keysArray[nextIndex];
								var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
								if (desc !== undefined && desc.enumerable)
									to[nextKey] = nextSource[nextKey];
							}
						}
						return to;
					}
				});
			}
		},
		Element: {
			prototype: {
				matches: function() {
					var matches = (Element.prototype.matches || Element.prototype.matchesSelector || Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector);
					(!matches ? (Element.prototype.matches = Element.prototype.matchesSelector = function matches(selector) {
						var matches = document.querySelectorAll(selector);
						var th = this;
						return Array.prototype.some.call(matches, function(e) {
							return (e === th);
						});
					}) : (Element.prototype.matches = Element.prototype.matchesSelector = matches));
				},
				closest: function() {
					Element.prototype.closest = function(css) {
						var node = this;
						while (node) {
							if (node.matches(css))
								return node;
							else
								node = node.parentElement;
						}
						return null;
					}
				}
			}
		}
	}),
	event: {},
	passport: {},
	$$$: (typeof($$$) == 'object' ? (function() {
		if (document.querySelector('body') && ($$$.sdk() < 21))
			document.querySelector('body').dataset.sdk = 'webview';
		window.addEventListener('error', function(message, source, lineno) {
			if (typeof(lineno) != 'undefined')
				$$$.addLog(JSON.stringify({
					message: (source ? message : (message.stack ? message.stack.split('\n')[0] : message)),
					source: (source ? source.split('/').slice(-1)[0].split('.')[0]+':'+lineno : (message.stack ? message.stack.split('\n').slice(1).join('\n') : source))
				}));
		});
		return $$$;
	})() : null),
	$$: function(id) {
		return document.querySelectorAll(id);
	},
	$: function(el) {
		var obj;
		if (el) {
			if (el.target && typeof(el.preventDefault) == 'function') {
				el.preventDefault();
				obj = el.target;
			}else if (typeof(el) == 'string') {
				/* if (el.slice(0, 2) == './')
					return document.evaluate(el, document.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				else */ if (el.slice(0, 1) == '/') {
					if (el == '/svg')
						return Qad.$(document.createElementNS('http://www.w3.org/2000/svg','svg'));
					else
						return Qad.$(document.createElement(el.slice(1)));
				}else if (el.indexOf('iframe') != -1) {
					var _el;
					iframe = el.split(' ');
					if (iframe.length > 1 && (_el = document.querySelector(iframe[0])) && (_el.tagName == 'IFRAME'))
						return Qad.$(_el.contentDocument.querySelector(el.replace(iframe[0]+' ','')));
				}else if (el.slice(0, 1) == '$') {
					el = el.slice(1).split('->');
					var forms = document.forms;
					for (var i in el) {
						forms = forms[el[i]];
					}
					return (forms && Qad.$(forms));
				}
				obj = document.querySelector(el);
			}else if (typeof(el) == 'function')
				return (/in/.test(document.readyState) ? setTimeout('$('+el+')', 9) : el());
			else
				obj = el;
		}else if (typeof(el) == 'undefined') {
			var vars = {};
			var parts = location.search.replace(/[?&]+([^=&]+)([^&]*)/gi, function(m,key,value) {
				vars[key] = (value.slice(0, 1) == '=' ? value.slice(1) : value);
			});
			return vars;
		}
		if (obj == null)
			return false;
		obj.add = function(el, before) {
			if (el.constructor.name == 'Array') {
				el.map(function(d) {
					obj.appendChild(d);
				});
				return obj;
			}else{
				(before ? obj.parentNode.insertBefore(el, obj) : obj.appendChild(el));
				return el;
			}
		}
		obj.empty = function() {
			obj.classList.remove('template');
			obj.value = null;
			obj.innerHTML = null;
			return obj;
		}
		obj.attr = function(key, value) {
			if (typeof(key) == 'object')
				for (var i in key) {
					obj.attr(i, key[i]);
				}
			else if (typeof(value) == 'boolean' && value == false)
				obj.removeAttribute(key);
			else if (typeof(value) == 'undefined')
				return obj.getAttribute(key);
			else
				obj.setAttribute(key, value);
			return obj;
		}
		obj.resize = function() {
			if (obj.tagName == 'IFRAME') {
				obj.height = obj.contentWindow.document.body.scrollHeight+'px';
				obj.width = obj.contentWindow.document.body.scrollWidth+'px';
			}else if (obj.tagName == 'TEXTAREA') {
				height = obj.value.split(/\n/).length*20;
				obj.style['height'] = (height>40 ? height+'px' : '40px');
			}
		}
		obj.pos = function() {
			var box = obj.getBoundingClientRect();
			var body = document.body;
			var docEl = document.documentElement;
			var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
			var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
			var clientTop = docEl.clientTop || body.clientTop || 0;
			var clientLeft = docEl.clientLeft || body.clientLeft || 0;
			var top  = box.top +  scrollTop - clientTop;
			var left = box.left + scrollLeft - clientLeft;
			return {
				top: Math.round(top),
				left: Math.round(left),
				width: Math.round(box.width),
				height: Math.round(box.height)
			};
		}
		obj.$ = function(html,offset) {
			if ((typeof(html) == 'object') && (html.constructor.name == 'Array') && html[0]._) {
				for (var i in html) {
					var p = $('/'+html[i]._);
					for (var j in html[i]) {
						if (j == '_')
							obj.add(p);
						else if (j == '$')
							p.$(html[i].$);
						else if (j != '$')
							p.attr(j, html[i][j]);
					}
				}
				return obj;
			}else if ((typeof(html) == 'object') && (html.constructor.name == 'Object') && html._)
				return obj.$([html]);
			if (obj.tagName == 'INPUT' || obj.tagName == 'TEXTAREA')
				val = obj.value;
			else
				val = obj.innerHTML;
			if (html && html.indexOf('+') == 0)
				val += html.slice(1);
			else if (html && html.indexOf('-') == 0)
				val = val.replace(html.slice(1),'');
			else if (html && html.indexOf('~') == 0) {
				html = html.slice(1);
				var endIndex, range, doc = el.ownerDocument;
				endIndex = obj.selectionEnd;
				obj.value = val.slice(0, endIndex) + html + val.slice(endIndex);
				obj.selectionStart = obj.selectionEnd = endIndex + html.length+(offset?offset:0);
				obj.focus();
				return;
			}else if (html)
				val = html;
			else
				return val;
			if (obj.tagName == 'INPUT' || obj.tagName == 'TEXTAREA')
				obj.value = val;
			else
				obj.innerHTML = val;
			return obj;
		}
		obj.status = function(s,f) {
			if (obj.dataset.time)
				clearTimeout(obj.dataset.time);
			if (!obj.dataset.html)
				obj.dataset.html = obj.innerHTML;
			if (s == true) {
				if (!obj.classList.contains('onload'))
					obj.innerHTML = 'done';
				obj.style['background'] = '#4CAF50';
			}else if (s == false) {
				if (!obj.classList.contains('onload'))
					obj.innerHTML = 'close';
				obj.style['background'] = '#F44336';
			}else{
				obj.classList.add('spinner');
				return;
			}
			obj.classList.remove('spinner');
			if (typeof(f) == 'function')
				setTimeout(function() {
					f();
				}, 1000);
			obj.status.time = setTimeout(function() {
				obj.innerHTML = obj.dataset.html;
				if (obj.tagName == 'INPUT' || obj.tagName == 'SELECT')
					obj.style['background'] = 'none';
				else
					obj.style['background'] = Qad.$('meta[name="theme-color"]').content;
			}, 2000);
		}
		obj.on = function(e,f,c) {
			switch (e) {
				case 'mouse':
					e = 'mousedown';
					break;
				case 'key':
					e = 'keydown';
					break;
				case 'scroll': {
					if (obj.tagName == 'BODY')
						obj = window;
					obj.addEventListener('scroll', function(e) {
						e.top = window.scrollY; //document.body.scrollTop;
						e.down = document.body.scrollHeight - (document.documentElement.clientHeight + e.top);
						e.pos = (e.top == 0 ? 'top' : (e.down == 0 ? 'down' : null));
						f(e);
					});
					return;
					break;
				}
				case 'swipe':
					var swipe, startX, startY, startTime;
					obj.addEventListener((document.ontouchstart === null ? 'touchstart' : 'mousedown'), function(e) {
						swipe = 'none';
						startX = Math.round((document.ontouchstart === null ? e.changedTouches[0].pageX : e.clientX));
						startY = Math.round((document.ontouchstart === null ? e.changedTouches[0].pageY : e.clientY));
						startTime = new Date().getTime();
					}, false);
					obj.addEventListener((document.ontouchstart === null ? 'touchmove' : 'mousemove'), function(e) {
						if (!startX || !startY)
							return;
						if (((new Date().getTime())-startTime) < 50)
							e.preventDefault();
						f({
							x: (document.ontouchstart === null ? e.changedTouches[0].pageX : e.clientX),
							y: (document.ontouchstart === null ? e.changedTouches[0].pageY : e.clientY),
							sx: startX,
							sy: startY,
							swipe: 'move'
						});
					}, false);
					obj.addEventListener((document.ontouchstart === null ? 'touchend' : 'mouseup'), function(e) {
						var distX = (document.ontouchstart === null ? e.changedTouches[0].pageX : e.clientX)-startX;
						var distY = (document.ontouchstart === null ? e.changedTouches[0].pageX : e.clientY)-startY;
						var sx = startX;
						var sy = startY;
						startX = null;
						startY = null;
						if (Math.abs(distX) >= 50 && Math.abs(distY) <= 50)
							swipe = (distX < 0)? 'left' : 'right';
						else if (Math.abs(distY) >= 50 && Math.abs(distX) <= 50)
							swipe = (distY < 0)? 'up' : 'down';
						else if (distX >= 50)
							swipe = (distY < 0)? 'up,right' : 'down,right';
						else if (distX <= -50)
							swipe = (distY < 0)? 'up,left' : 'down,left';
						if (swipe == 'none')
							return;
						else if (((new Date().getTime())-startTime) > 300)
							swipe = 'none';
						f({
							x: (document.ontouchstart === null ? e.changedTouches[0].pageX : e.clientX),
							y: (document.ontouchstart === null ? e.changedTouches[0].pageY : e.clientY),
							sx: sx,
							sy: sy,
							swipe: swipe
						});
					}, false);
					return;
					break;
			}
			if (typeof(f) == 'function') {
				if(!(obj in Qad.event))
					Qad.event[obj] = {};
				if(!(e in Qad.event[obj]))
					Qad.event[obj][e] = [];
				Qad.event[obj][e].push([f,c]);
				obj.addEventListener(e,f);
			}else{
				if (obj in Qad.event) {
					var handlers = Qad.event[obj];
					if (e in handlers) {
						var eventHandlers = handlers[e];
						for (var i = eventHandlers.length; i--;) {
							var handler = eventHandlers[i];
							if (handler[1] == c) {
								eventHandlers.splice(i,1);
								obj.removeEventListener(e,handler[0]);
							}
						}
					}
					if (Qad.event[obj][e] && Qad.event[obj][e].length == 0)
						delete Qad.event[obj][e];
				}
			}
			return obj;
		}
		obj.clone = function() {
			return Qad.$(obj.cloneNode(true));
		}
		obj.remove = function() {
			return obj.parentNode.removeChild(obj);
		}
		obj.css = function(style) {
			if (obj.tagName == 'STYLE') {
				var css = '';
				for (var i in style) {
					css += i+Qad.replace([
						/"/g,
						/,/g
					], [
						'',
						';'
					], Qad.json(style[i]));
				}
				obj.$(css);
			}else
				Object.assign(obj.style, style);
			return obj;
		}
		obj.template = function(d,t) {
			var key = function(d,key) {
				if (t && key)
					d[key] = JSON.parse(d[key]);
				$key = (key ? Object.assign(d[key], {
					_: key,
					map: function(k, f) {
						var res = '';
						k.map(function(i) {
							if (typeof(f) == 'function')
								res += f(i);
							else{
								/*
								var t;
								if (typeof(f) == 'string')
									t = f.replace(new RegExp('\\$', 'g'), i);
								else
									for (var ii in i) {
										t = f.replace(new RegExp('\\$'+ii, 'g'), i[ii]);
									}
								res += t || f;
								*/
								var t = f;
								for (var ii in i) {
									t = t.replace(new RegExp('\\$'+ii, 'g'), i[ii]);
								}
								t = t.replace(new RegExp('\\$', 'g'), i);
								res += t;
							}
						});
						return res;
					}
				}) : d);
				obj.innerHTML += obj.shab.replace(/{(.*?)}/gim, function(m,v) {
					if (!$key)
						return;
					else if (v == '@' && key)
						return key;
					else if (v.indexOf('@') == 0) {
						if (v.indexOf('/') != -1) {
							p = v.replace('@','').split('/');
							if (p.length == 2)
								return $key[p[0]][p[1]];
							else if (p.length == 3)
								return $key[p[0]][p[1]][p[2]];
						}else if ($key[v.replace('@','')])
							return $key[v.replace('@','')];
						else
							return '';
					}else if (v.slice(0,1) == '$' || v.slice(0,1) == '(') {
						v = v.replace(/@(.*?);/gim, function(p) {
							p = p.replace(';','');
							if (p == '@' && key)
								return key;
							else if (p.indexOf('@') == 0)
								return $key[p.replace('@','')];
						});
						var res = new Function('return '+v)();
						return (res ? res : '');
					}
				});
				delete $key;
			}
			if (!obj.shab) {
				Qad.for(obj.querySelectorAll('[data-action][data-on]'), function(el) {
					el.attr('data-on', false);
				});
				if ((obj.shab = obj.innerHTML) && (localStorage.getItem('qad_lazyload_off') == 'true'))
					obj.shab = obj.shab.replace(/data-src/g, 'src');
			}
			obj.innerHTML = '';
			if (d.response)
				key(d);
			else if (Object.keys(d).length > 0)
				for (k in d) {
					if (['_', 'map'].indexOf(k) == -1)
						key(d, k);
				}
			else
				return false;
			if (obj.tagName == 'DIV' || obj.tagName == 'ARTICLE')
				obj.style['display'] = 'block';
			else if (obj.tagName != 'SCRIPT')
				obj.style['display'] = 'table-row-group';
			return true;
		}
		obj.find = function(e, all) {
			var link = {
				first: 'firstElementChild',
				last: 'lastElementChild',
				next: 'nextElementSibling',
				prev: 'previousElementSibling'
			};
			return (all ? [].map.call(obj.querySelectorAll(e), function(el) {
				return Qad.$(el);
			}) : Qad.$(((typeof(e) == 'string') && link[e]) ? obj[link[e]] : obj.querySelector(e)));
		}
		obj.code = function() {
			return obj.outerHTML;
		}
		//obj.parent = Qad.$(obj.parentNode);
		obj.parent = function(e) {
			if (el = (e ? (
				typeof(e) == 'string'
				? obj.closest(e)
				: e.reduce(function(r, e) {
					if (!obj.closest(e))
						return r;
					return obj.closest(e);
				}, null)
			) : obj.parentNode))
				return Qad.$(el);
			else
				return false;
		}
		if (obj.tagName == 'DIALOG') {
			if ((Qad.libs.indexOf('HTMLDialogElement') > -1) && !obj.hasAttribute('role'))
				dialogPolyfill.registerDialog(obj);
			obj.popup = function() {
				if (Qad.$('dialog[open]'))
					Qad.$('dialog[open]').close();
				if (obj._close = obj.find('[data-close]:not([data-on])'))
					obj._close.onclick = obj.close.bind(obj);
				if (obj._tmp = !obj.parent())
					Qad.$('body').add(obj);
				obj.showModal();
				obj.scrollTop = 0;
				[].forEach.call(obj.children, function(el) {
					el.scrollTop = 0;
				});
				if (typeof(Qad.controller) == 'object') {
					Qad.controller.reload();
					Qad.controller.find(obj.find('[tabindex]'));
				}
				if (!obj.onclose) {
					if (Qad.$$$) {
						document.body.scroll_ = window.scrollY;
						document.body.style.position = 'fixed';
					}
					document.body.style.overflow = 'hidden';
					obj.onclose = function() {
						document.body.style.overflow = '';
						if (Qad.$$$) {
							document.body.style.position = '';
							window.scrollTo(0, document.body.scroll_);
						}
						obj.onclose = null;
						if (obj._tmp)
							obj.remove();
					}
				}
				return obj;
			}
		}
		return obj;
	},
	config: function(key, options, sync) {
		var self, id, f, u;
		return new Promise(function(resolve, reject) {
			self = Object.assign((localStorage.getItem(key) ? self = Qad.json(localStorage.getItem(key)) : options), f = {
				reload: function() {
					return Object.assign((localStorage.getItem(key) ? Qad.json(localStorage.getItem(key)) : options), f);
				},
				clear: function() {
					Qad.session.set(key);
					localStorage.removeItem(key);
				},
				save: function(self) {
					self._save = Math.round(new Date().getTime()/1000);
					var cook = {};
					for (var k in self) {
						if (self[k] == null)
							delete self[k];
						else if (k.slice(0, 1) == '$')
							cook[k.slice(1)] = self[k];
					}
					Qad.session.set(key, Qad.json(cook));
					localStorage.setItem(key, Qad.json(self));
					return self;
				},
				sync: (sync ? (function() {
					if (id = (typeof(sync.id) == 'function') ? sync.id(self) : sync.id)
						fetch(sync.base || '/api/sw.php', {
							method: 'POST',
							body: Qad.form({
								method: 'sync',
								action: 'load',
								sync: key,
								id: id,
								type: sync.type,
								time: (self._sync || 0)
							})
						}).then(function(res) {
							return res.json();
						}).then(function(e) {
							if (e._sync) {
								e._sync = parseInt(e._sync);
								self.save(e);
							}
							console.log(e);
							resolve(((Object.keys(e).length > 0) ? Object.assign(e, f) : self));
						}).catch(reject);
					return function(self) {
						if (!window.onbeforeunload)
							u = !!(window.onbeforeunload = function() {
								return true;
							});
						return new Promise(function(resolve) {
							self._sync = Math.round(new Date().getTime()/1000);
							self.save(self);
							if (id = (typeof(sync.id) == 'function') ? sync.id(self) : sync.id)
								fetch(sync.base || '/api/sw.php', {
									method: 'POST',
									body: Qad.form({
										method: 'sync',
										action: 'save',
										sync: key,
										id: id,
										type: sync.type,
										time: self._sync,
										data: Qad.json(self),
									})
								}).then(function() {
									if (u)
										window.onbeforeunload = null;
									resolve();
								}).catch(reject);
							else{
								if (u)
									window.onbeforeunload = null;
								resolve();
							}
						});
					};
				})() : null)
			});
			if (!sync || !id)
				resolve(self);
		});
	},
	loop: function(callback, params, time, loop, force_start) {
		var e = null;
		(function(p) {
			if (loop == false)
				setTimeout(function() {
					callback(p);
				}, time);
			else{
				e = setInterval(function() {
					callback(p, function() {
						clearInterval(e)
					});
				}, time);
				if (force_start != false)
					callback(p, function() {
						clearInterval(e);
					});
			}
		})(params);
	},
	clipboard: function(i) {
		var tmp = Qad.$('/input'),
			focus = document.activeElement;
		tmp.value = (
			(typeof(i) == 'object')
			? (
				(['INPUT','TEXTAREA'].indexOf(i.tagName) > -1)
				? i.value
				: i.innerText
			)
			: i
		);
		document.body.appendChild(tmp);
		tmp.select();
		document.execCommand('copy');
		document.body.removeChild(tmp);
		focus.focus();
	},
	download: function(file, name, type) {
		var a = Qad.$('/a');
		if ((typeof(file) != 'string') || (file.substr(0, 4) != 'http'))
			file = URL.createObjectURL(
				new Blob([file], {
					type: (type ? type : 'text/plain')
				})
			);
		a.href = file;
		a.download = (name ? name : file.split('/').slice(-1).join());
		a.click();
		console.log(a);
	},
	genavatar: function(obj) {
		if (!obj)
			return '#333333';
		var hash = 0,
			color = '#',
			s = (typeof(obj) == 'object' ? (obj.getAttribute('data-value') ? obj.getAttribute('data-value') : obj.innerHTML) : obj);
		for (var i = 0; i < s.length; i++)
			hash = s.charCodeAt(i) + ((hash << 5) - hash);
		for (var i = 0; i < 3; i++)
			color += ('00'+((hash >> (i * 8)) & 0xFF).toString(16)).substr(-2);
		if (typeof(obj) == 'object')
			obj.innerHTML = s.substr(0,1);
		return color;
	},
	template: function(s) {
		s = s.replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, ' ').replace(/\{([\s\S]+?)\}/g, function(m, v) {
			return "'+("+v+"||'')+'";
		})
		try {
			return new Function('$', "var out='"+s+"';return out;");
		}catch (e) {
			return function() {
				return 'Template is not compiled';
			}
		}
	},
	dump: function(obj,level) {
		var res = '',
			lp = '';
		if(typeof(obj) == 'object') {
			if (!level)
				level = 0;
			for(var j=0;j<level+1;j++)
				lp += "    ";
			if (level == 0)
				res += typeof(obj)+'('+Object.keys(obj).length+") {\n";
			for(var i in obj) {
				var v = obj[i];
				if(v && typeof(v) == 'object') {
					res += lp+'['+i+'] => '+typeof(v)+'('+Object.keys(v).length+") {\n";
					res += Qad.dump(v,level+1);
					res += lp+"}\n";
				}else
					res += lp+'['+i+'] => '+typeof(v)+(typeof(v)=='string' ? '('+v.length+') "'+v+'"' : '('+v+')')+"\n";
			}
			if (level == 0)
				res += '}';
		}else
			res = typeof(obj)+(typeof(obj)=='string' ? '('+obj.length+') "'+obj+'"' : '('+obj+')');
		return res;
	},
	ads: function() {
		Qad.for('.ads', function(el, i) {
			if (el.dataset.directadvert)
				Qad.$('head').add(Qad.$('/script').attr({
					async: true,
					charset: 'windows-1251',
					src: 'https://code.directadvert.ru/data/'+el.dataset.directadvert+'.js?async=1&div='+(el.id = (el.id || ['div', 'ads', i, el.dataset.directadvert].join('_')))+'&t='+Math.random()
				})).on('load', function() {
					Qad.ads._ = true;
				}).on('error', function(e) {
					Qad.ads._ = false;
					(el.dataset.error ? el.attr('class', [el.attr('class'), 'error'].join(' ')).add(Qad.$('/div').$(el.dataset.error).css({
						padding: '12px'
					})) : el.remove());
					e.target.remove();
				});
			else if (el.dataset.iframe)
				el.empty().add(Qad.$('/iframe').attr('data-src', el.dataset.iframe+'&t='+Math.random()).on('load', function(e) {
					if (e.target.src && (e.target.src != location.href) && e.target.contentDocument)
						e.target.style.height = (!e.target.contentDocument.body.innerText ? '0px' : '');
				}));
		});
	},
	debug: function(args) {
		var debug = {
			update: function() {
				if (!location.pwd.match('/page/'))
					return;
				location.href = location.href.replace(location.pwd.split('/page/')[0], 'http://localhost:8080');
			},
			history: function(args) {
				return {
					args: args,
					location: location.pwd,
					uagent: navigator.userAgent,
					qad_debug: Qad.json(localStorage.getItem('qad_debug')),
					qad_debug_old: Qad.json(localStorage.getItem('qad_debug_old'))
				}
			},
			save: function() {
				localStorage.setItem('qad_debug', Qad.json({
					error: Qad.debug.error,
					log: Qad.debug.log,
				}));
			},
			push: function(response) {
				if (response)
					args = response;
				Qad.debug.log.push(args);
				debug.save();
			},
			error: function(message, source, lineno) {
				Qad.debug.error.push({
					message: (source ? message : (message.stack ? message.stack.split("\n")[0] : message)),
					source: (source ? source+':'+lineno : (message.stack ? message.stack.split("\n").slice(1).join("\n") : source))
				});
				debug.save();
			}
		}
		if (!Qad.debug.error) {
			Qad.debug.error = [];
			Qad.debug.log = [];
			if (localStorage.getItem('qad_debug')) {
				localStorage.setItem('qad_debug_old', localStorage.getItem('qad_debug'));
				localStorage.removeItem('qad_debug');
			}
		}
		if (args) {
			if (typeof(args) == 'function') {
				try {
					var res = new Function('return '+args)()();
					if (res) {
						debug.push({
							'function': args.toString(),
							'return': res
						});
						return res;
					}
				}catch(e) {
					debug.error(e);
				}
			}else
				debug.push();
		}
		return debug;
	},
	alert: function(l, t) {
		var dialog;
		dialog = Qad.$('/dialog').attr('class', 'middle'+(t ? ' '+t : '')).add([
			Qad.$('/div').$(l),
			Qad.$('/button').attr('data-right', true).$('OK').on('click', function() {
				dialog.onclose();
			})
		]).popup();
		console.log(dialog);
	},
	confirm: function(l) {
		var close, dialog;
		return new Promise(function(resolve) {
			close = (dialog = Qad.$('/dialog').attr('class', 'middle').add([].concat((l && [Qad.$('/div').$(l), $('/br')]), [
				Qad.$('/button').attr('data-right', true).$('OK').on('click', function() {
					close(resolve(true));
				}),
				Qad.$('/button').attr('data-right', true).$('CANCEL').on('click', function() {
					dialog.onclose()
				})
			]).filter(Boolean)).popup()).onclose.bind(dialog);
			dialog.onclose = function() {
				close(resolve(false));
			}
		});
	},
	prompt: function(l, v, t) {
		var close, dialog, input, ok,
			time = Qad.time();
		return new Promise(function(resolve, reject) {
			close = (dialog = Qad.$('/dialog').attr('class', 'middle').add([].concat((l && (['checkbox', 'radio'].indexOf(t) == -1) && [Qad.$('/div').attr('class', 'p').$(l.toString())]), [
				(
					(t && (['checkbox', 'radio'].indexOf(t)) > -1)
					? Qad.$('/div').add(Object.keys(l).map(function(k) {
						return Qad.$('/label').attr('class', t).add([
							Qad.$('/input').attr({
								name: time,
								type: t,
								value: k,
								checked: !(!v || (v.split(',').indexOf(k) == -1))
							}),
							Qad.$('/span').$(l[k]),
							Qad.$('/br')
						]);
					}))
					: Qad.$('/label').attr('class', 'input w').add([
						(input = Qad.$('/input').attr({
							type: (t || 'text'),
							value: (v || ''),
							step: (((t == 'time') && v && (v.split(':').length == 3)) ? 1 : false)
						}).on('keyup', function(e) {
							if (e.keyCode === 13)
								ok.click();
						}))
					])
				),
				(ok = Qad.$('/button').attr('data-right', true).$('OK').on('click', function() {
					if (t && (['checkbox', 'radio'].indexOf(t)) > -1)
						close(resolve(dialog.find('input', true).filter(function(el) {
							return el.checked;
						}).map(function(el) {
							return el.value
						}).join()));
					else
						close(resolve((input.value || null)));
				})),
				Qad.$('/button').attr('data-right', true).$('CANCEL').on('click', function() {
					dialog.onclose();
				})
			]).filter(Boolean)).popup()).onclose.bind(dialog);
			dialog.onclose = function() {
				close(reject(null));
				//close(resolve(null));
			}
		});
	},
	json: function(data, url) {
		if (typeof(data) == 'string')
			data = JSON.parse(data);
		else if (typeof(data) == 'object')
			data = (url 
				? decodeURIComponent(Object.keys(data).map(function(k) {
					if (typeof(data[k]) == 'object')
						return Object.keys(data[k]).map(function(kk) {
							return encodeURIComponent(k+'['+kk+']')+'='+encodeURIComponent(data[k][kk])
						}).join('&');
					else
						return encodeURIComponent(k)+'='+encodeURIComponent(data[k])
				}).join('&')).replace(/#/g, '%23')
				: JSON.stringify(data)
			);
		return data;
	},
	form: function(object, form, prefix) {
		if (!form)
			form = new FormData();
		for (var i in object) {
			form.append((prefix ? prefix+'['+i+']' : i), object[i]);
		}
		return form;
	},
	replace: function(search, replace, subject) {
		if (search.constructor.name == 'Array')
			search.map(function(s, i) {
				subject = subject.replace(s, (replace.constructor.name == 'Array' ? replace[i] : replace));
			});
		else
			subject = subject.replace(search, replace);
		return subject;
	},
	find: function(a,v) {
		if (a.indexOf)
			return a.indexOf(v);
		for (var i = 0; i < a.length; i++)
			if (a[i] === v)
				return i;
		return -1;
	},
	for: function (i,o) {
		var j = 0;
		if (typeof(i) == 'object' && i.length)
			i.forEach(function(e1) {
				o(e1, j);
				++j;
			});
		else if (typeof(i) == 'string' && document.querySelector(i))
			[].forEach.call(Qad.$$(i), function(e1) {
				o(Qad.$(e1), j);
				++j;
			});
		else
			return false;
	},
	gcm: {
		add: function(topic) {
			return new Promise(function(resolve, reject) {
				Qad.sw.pushManager.subscribe({
					userVisibleOnly: true
				}).then(function(sub) {
					Qad.gcm._token = sub.endpoint.split('gcm/send/')[1];
					if (topic)
						fetch('/service-worker.php', {
							method: 'POST',
							body: Qad.form({
								gcm: 'add',
								topics: topic,
								token: Qad.gcm._token
							})
						}).then(function() {
							resolve({
								token: Qad.gcm._token,
								msg: 'Subscribed to "'+topic+'"'
							});
						}).catch(reject);
					else
						resolve({token: Qad.gcm._token});
				}).catch(reject);
			});
		},
		list: function() {
			return new Promise(function(resolve, reject) {
				Qad.sw.pushManager.getSubscription().then(function(sub) {
					if (sub && sub.endpoint) {
						Qad.gcm._token = sub.endpoint.split('gcm/send/')[1];
						fetch('/service-worker.php', {
							method: 'POST',
							body: Qad.form({
								gcm: 'list',
								token: Qad.gcm._token
							})
						}).then(function(res) {
							return res.text();
						}).then(resolve).catch(reject);
					}else
						reject('no subscription');
				});
			});
		},
		remove: function(topic) {
			return new Promise(function(resolve, reject) {
				Qad.gcm.list().then(function(topics) {
					Qad.sw.pushManager.getSubscription().then(function(sub) {
						sub.unsubscribe().then(function() {
							if (topic && topics)
								topics.split(',').map(function(id) {
									if (id != topic)
										Qad.gcm.add(id);
								});
							resolve();
						});
					});
				});
			});
		}
	},
	ip: {
		local: function() {
			return new Promise(function(resolve, reject) {
				var pc = new (window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection)({iceServers:[]});
				pc.createDataChannel('');
				pc.createOffer(pc.setLocalDescription.bind(pc), function() {});
				pc.onicecandidate = function(ice) {
					if (ice && ice.candidate && ice.candidate.candidate)
						resolve(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1], (pc.onicecandidate = null));
				}
			});
		}
	},
	geo: {
		id: {},
		key: null,
		init: function(id) {
			if (typeof(google) == 'undefined' || typeof(google.maps) == 'undefined') {
				s = Qad.$('/script');
				s.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=places&callback=document.'+id+(Qad.geo.key ? '&key='+Qad.geo.key : '');
				Qad.$('body').add(s);
			}else
				document[id]();
		},
		me: function(id) {
			document.me = function() {
				if (id) {
					ac = new google.maps.places.Autocomplete(Qad.$('#'+id),{types: ['geocode']});
					ac.addListener('place_changed', function() {
						var p = ac.getPlace();
						document.dispatchEvent(new CustomEvent('geo.me',{'detail':{
							'status': true,
							'type': 'autocomplete',
							'lat': p.geometry.location.lat(),
							'lng': p.geometry.location.lng(),
							'address': p.formatted_address
						}}));
					});
				}
				if ((!id || !Qad.$('#'+id).value) && navigator.geolocation)
					navigator.geolocation.getCurrentPosition(function(position) {
						var latlng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
						var geocoder = new google.maps.Geocoder();
						geocoder.geocode({'latLng': latlng}, function(results, status) {
							if (status == google.maps.GeocoderStatus.OK) {
								if (results[1]) {
									document.dispatchEvent(new CustomEvent('geo.me',{'detail':{
										'status': true,
										'type': 'location',
										'lat': position.coords.latitude,
										'lng': position.coords.longitude,
										'time': position.coords.timestamp,
										'address': results[1].formatted_address
									}}));
								}
							}else
								document.dispatchEvent(new CustomEvent('geo.me',{'detail':{
									'status': false,
									'type': 'location',
									'error': status
								}}));
						});
					}, function(e) {
						if (e.code == 1)
							e.title = 'PERMISSION_DENIED';
						else if (e.code == 2)
							e.title = 'POSITION_UNAVAILABLE';
						else
							e.title = 'UNKNOWN_ERROR';
						document.dispatchEvent(new CustomEvent('geo.me',{'detail':{
							'status': false,
							'type': 'location',
							'error': e.title
						}}));
					}, {maximumAge: 75000});
				else
					document.dispatchEvent(new CustomEvent('geo.me',{'detail':{
						'status': false,
						'type': 'location'
					}}));
			}
			Qad.geo.init('me');
		},
		distance: function(a, b) {
			var lat1 = a.lat * Math.PI / 180,
				lat2 = b.lat * Math.PI / 180,
				cl1 = Math.cos(lat1),
				cl2 = Math.cos(lat2),
				sl1 = Math.sin(lat1),
				sl2 = Math.sin(lat2),
				delta = b.lng * Math.PI / 180 - a.lng * Math.PI / 180,
				cdelta = Math.cos(delta),
				y = Math.sqrt(Math.pow(cl2 * Math.sin(delta), 2) + Math.pow(cl1 * sl2 - sl1 * cl2 * cdelta, 2)),
				x = sl1 * sl2 + cl1 * cl2 * cdelta;
			return Qad.format(Math.round(Math.atan2(y, x) * 6372795)*1000000, 'metric');
		},
		center: function(d) {
			var bounds = new google.maps.LatLngBounds();
			d.getPath().forEach(function(element,index) {
				bounds.extend(element)
			});
			return bounds.getCenter();
		},
		label: function(d) {
			label = function(d) {
				if (typeof(d.position.lat) != 'function')
					d.position = new google.maps.LatLng(d.position);
				if (typeof(this.setValues) == 'function')
					this.setValues(d);
			};
			label.prototype = new google.maps.OverlayView;
			label.prototype.changed = function() {
				var canvas = this.canvas;
				if (!canvas) return;
				var style = canvas.style;
				var text = this.get('text');
				var ctx = canvas.getContext('2d');
				ctx.font = this.get('size')+'px sans-serif';
				ctx.fillStyle = this.get('color');
				ctx.textBaseline = 'top';
				ctx.strokeStyle = '#ffffff';
				ctx.lineWidth = 4;
				ctx.strokeText(text, 4, 4);
				ctx.fillText(text, 4, 4);
				style.marginLeft = (this.get('left')?this.get('left'):'-15')+'px';
				style.marginTop = (this.get('top')?this.get('top'):'-15')+'px';
			};
			label.prototype.onAdd = function() {
				this.canvas = document.createElement('canvas');
				this.canvas.style.position = 'absolute';
				this.changed();
				var panes = this.getPanes();
				panes.mapPane.appendChild(this.canvas);
			};
			label.prototype.draw = function() {
				var projection = this.getProjection();
				if (!projection)
					return;
				var latLng = (this.get('position'));
				var pos = projection.fromLatLngToDivPixel(latLng);
				var style = this.canvas.style;
				style['top'] = pos.y+'px';
				style['left'] = pos.x+'px';
			};
			return new label(d);
		},
		coords: function(address, callback) {
			document.coords = function() {
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode({'address': address}, function(res, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
							res.lat = res[0].geometry.location.lat().toString();
							res.lng = res[0].geometry.location.lng().toString();
							callback(res);
						}else
							console.log('No results found');
					}else
						console.log('Geocode was not successful for the following reason: '+status);
				});
			}
			Qad.geo.init('coords');
		},
		maps: function(address, zoom, id, callback) {
			document.maps = function() {
				var map = new google.maps.Map((
						id
						? (
							typeof(id) == 'string'
							? Qad.$('#'+id)
							: Qad.$(id)
						)
						: Qad.$('#map')
					), {
					center: (typeof(address)=='object'?address:null),
					scrollwheel: false,
					zoom: zoom,
					disableDefaultUI: true,
					zoomControl: true,
					zoomControlOptions: {
						position: google.maps.ControlPosition.LEFT_CENTER
					}
				});
				if (id)
				   Qad.geo.id[id] = map;
				if (typeof(address) == 'object')
					var marker = new google.maps.Marker({
						map: map,
						position: address,
						title: address.title
					});
				else
					Qad.geo.coords(address, function(res) {
						map.setCenter(res[0].geometry.location);
						var marker = new google.maps.Marker({
							position: res[0].geometry.location,
							map: map,
							title: address
						});
						google.maps.event.addListener(marker, 'click', function() {
							window.open('https://www.google.ru/maps/place/'+res.lat+','+res.lng+'/@'+res.lat+','+res.lng+','+zoom+'z/');
						});
					});
				if (typeof(callback) == 'function')
					callback();
			}
			Qad.geo.init('maps');
		}
	},
	rand: function(min, max) {
		return Math.floor(Math.random() * ((max ? max : 9) - (min ? min : 0) + 1)) + (min ? min : 0);
	},
	format: function(data,type,add) {
		if (type == 'date' && !isNaN(data)) {
			if (!data)
				data = new Date(Date.now());
			else if (typeof(date) != 'object')
				data = new Date(1000*data);
			d = function() {
				var d = f(data.getDate()),
					m = f(data.getMonth()+1),
					y = f(data.getFullYear()%100),
					h = f(data.getHours()),
					i = f(data.getMinutes());
				return d+'.'+m+'.'+y+' '+h+':'+i;
			}
			f = function(n) {
				return (n < 10) ? '0'+n : n;
			}
			var e = (Date.now()-data)/1000;
			return (e < 10 && e > 0) ? 'now':(e < 60 && e > 0) ? Math.floor(e)+' sec':(e < 3600 && e > 0) ? Math.floor(e/60)+' min':d();
		}else if (type == 'price' && !isNaN(data)) {
			//data=Math.round(parseFloat(data)*Math.pow(10,0))/Math.pow(10,0);
			rr = Number(data)./*toFixed(0).*/toString().split('.');
			b = rr[0].replace(/(\d{1,3}(?=(\d{3})+(?:\.\d|\b)))/g,'\$1 ');
			data = (rr[1]?b+'.'+rr[1]:b);
		}else if ((type == 'metric' || type == 'byte') && !isNaN(data)) {
			if (!add)
				add = (
					type == 'metric'
					? ['mm', 'cm', 'm', 'km']
					: ['B','KB','MB','GB','TB','PB','EB','ZB','YB']
				);
			if (data == 0)
				return '0 '+add[0];
			var i = Math.floor(Math.log(data) / Math.log(1000));
			if (i >= add.length)
				i = add.length-1;
			return (data/Math.pow(1000,i)).toFixed(3).replace('.000', '')+' '+add[i];
		}else
			return data;
		return (add ? data+' '+add : data);
	},
	screen: function(o) {
		if (o['lock']) {
			if (o['lock'] == 'exit')
				screen.orientation.unlock();
			else
				screen.orientation.lock(o['lock']);
		}
		if (o['fullscreen']) {
			if (o['fullscreen'] == 'exit') {
				if (document.exitFullscreen)
					document.requestFullScreen();
				else if (document.webkitExitFullscreen)
					document.webkitExitFullscreen();
				else if (document.mozCancelFullscreen)
					document.mozRequestFullScreen();
			}else{
				el = Qad.$(o['fullscreen']);
				if (el.requestFullScreen)
					el.requestFullScreen();
				else if (el.webkitRequestFullScreen)
					el.webkitRequestFullScreen();
				else if (el.mozRequestFullScreen)
					el.mozRequestFullScreen();
			}
		}
		if (o['sleep']) {
			if (o['sleep'] == 'exit') {
				if (document.noSleepVideo)
					document.noSleepVideo.pause();
			}else{
				var media = "data:video/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA=";
				document.noSleepVideo = document.createElement('video');
				document.noSleepVideo.setAttribute("loop", "");
				var source = document.createElement('source');
				source.src = media;
				source.type = 'video/webm';
				document.noSleepVideo.appendChild(source);
				document.noSleepVideo.play();
			}
		}
	},
	up: function(id, p) {
		var w = window.pageYOffset,
			t = Qad.$((id ? ((typeof(id) == 'string') ? '#'+id : id) : 'body')).getBoundingClientRect().top,
			start = null;
		if (id) {
			if (Qad.$('header')) {
				if (Qad.$('header').pos().height == 299)
					t -= 110;
				else
					t -= Qad.$('header').pos().height;
			}
			if (p)
				t = t - p;
			if (Qad.$('header nav.tabs') && !Qad.$('header[data-effect]'))
				t -= Qad.$('nav.tabs').pos().height+5;
		}
		if ((typeof(id) == 'object') && Qad.$(id).parent('.scroll')) {
			while (true) {
				if (Qad.$(id).parent().classList.contains('scroll'))
					break
				else
					id = Qad.$(id).parent();
				break;
			}
			Qad.$(id).parent('.scroll').scrollTo((Qad.$(id).parent().offsetLeft - Qad.$(id).pos().width), (Qad.$(id).parent().offsetTop - Qad.$(id).pos().height));
		}
		requestAnimationFrame(step);
		function step(time) {
			if (start === null)
				start = time;
			var progress = time - start,
				r = (t<0 ? Math.max(w-progress,w+t) : Math.min(w+progress,w+t));
			window.scrollTo(0,r);
			if (r != w+t)
				requestAnimationFrame(step)
			//else location.hash = id
		}
	},
	session: {
		set: function(key, value, cookie) {
			if (Qad.$$$) {
				if (!value)
					localStorage.removeItem('session_'+key);
				else
					localStorage.setItem('session_'+key, value);
			}else{
				if (!value)
					document.cookie = key+'=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
				else if (cookie) {
					var expires = new Date();
					expires.setTime(expires.getTime()+(1*24*60*60*1000));
					document.cookie = key+'='+value+';path=/'+';expires='+expires.toUTCString();
				}else
					document.cookie = key+'='+value+';path=/'+';expires=0';
			}
		},
		get: function(key) {
			if (Qad.$$$)
				return localStorage.getItem('session_'+key);
			else{
				var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
				return keyValue ? keyValue[2] : null;
			}
		}
	},
	load: function(params) {
		if (!$('iframe.load'))
			return;
		if (typeof(params) != 'string')
			params = Qad.json(params, true);
		Qad.$('.load').src = 'server.php?'+params;
	},
	redirect: function(url, c) {
		if (window.event)
			window.event.preventDefault(window.event.stopPropagation());
		if (Qad.$('.menu[open]'))
			Qad.$('.menu[open]').click()
		if (typeof(url) != 'string')
			url = url.href;
		if ((location.prev = location.href) == url)
			return false;
		if (Qad.$('.ads'))
			Qad.ads();
		if ((typeof(ajax) == 'function') || (typeof(c) == 'function')) {
			Qad.api.clear();
			history.pushState(null, null, (history.url = url));
			return (c ? c(url) : ajax(url, location.prev));
		}else
			location.href = url;
		return false;
	},
	spinner: Object.assign(function(show) {
		if (!show) {
			if (Qad.spinner.st == false)
				return;
			/*
			if (Qad.$$$)
				Qad.$$$.spinner(false);
			else */ if (Qad.$('.clear'))
				Qad.$('.clear').classList.remove('spinner');
		}else{
			if (Qad.spinner.st == true)
				return;
			/* if (Qad.$$$)
				Qad.$$$.spinner(true);
			else */ if (Qad.$('.clear'))
				Qad.$('.clear').classList.add('spinner');
		}
		Qad.spinner.st = show;
	}, { st: false }),
	open: function(url) {
		if (Qad.$$$)
			Qad.$$$.open(url);
		else
			window.open(url, '_blank');
	},
	time: function() {
		return Math.round(new Date().getTime()/1000);
	},
	/* api: function(method, params, callback, err) {
		var id = '_'+Qad.rand(0, 100)+'_'+Qad.time();
		if (method.indexOf('googleapis.com') != -1)
			provider = 'google';
		else if (method.indexOf('api.vk.com') != -1)                                                                    
            provider = 'vk';
		else
			provider = 'default';
		if (!params)
			params = {};
		params.callback = ((typeof(callback) == 'string') ? callback : 'Qad.api.'+id);
		Qad.api[id] = (callback ? callback : function() {});
		Qad.session.set('oauth-scope',null);
		Qad.session.set('oauth-redirect',null);
		if (Qad.session.get('oauth-token-'+provider))
			params.access_token = Qad.session.get('oauth-token-'+provider);
		Qad.api.oauth = function() {
			Qad.session.set('oauth-token-'+provider,null);
			Qad.session.set('oauth-scope',params.scope);
			location.href = params.base+'?method='+provider+'&oauth-redirect='+location.href;
		}
		Qad.$('head').add(Qad.$('/script').attr({
			'data-api': id,
			src: method+'?'+Qad.json(params, true)
		}).on('error', ((typeof(err) == 'function') ? err : null)).on('load', function(e) {
			(function(e) {
				setTimeout(function() {
					delete Qad.api[e.dataset.api];
					e.remove();
				}, 1000);
			})(e.target);
		}));
	}, */
	api: Object.assign(function(method, params, callback, err) {
		var id = '_'+Qad.rand(0, 100)+'_'+Qad.time();
		if (method.indexOf('googleapis.com') != -1)
			provider = 'google';
		else if (method.indexOf('graph.facebook.com') != -1)                                                                    
            provider = 'facebook';
		else if (method.indexOf('api.vk.com') != -1)                                                                    
            provider = 'vk';
		else
			provider = 'default';
		if (!params)
			params = {};
		params.callback = 'Qad.api.list.'+id+'.callback';
		Qad.session.set('oauth-scope', null);
		Qad.session.set('oauth-redirect', null);
		if (Qad.session.get('oauth-token-'+provider))
			params.access_token = Qad.session.get('oauth-token-'+provider);
		Qad.api.oauth = function() {
			Qad.session.set('oauth-token-'+provider, null);
			Qad.session.set('oauth-scope', params.scope);
			location.href = params.base+'?method='+provider+'&oauth-redirect='+location.href;
		}
		Qad.api.list[id] = {
			callback: (callback ? callback : function() {}),
			loader: Qad.$('head').add(Qad.$('/script').attr({
				'data-api': id,
				src: method+'?'+Qad.json(params, true)
			}).on('error', function(e) {
				((typeof(err) == 'function') ? err(e) : null);
			}).on('load', function(e) {
				(function(e) {
					setTimeout(function() {
						if (!Qad.api.list[e.dataset.api])
							return;
						Qad.api.list[e.dataset.api].loader.remove();
						delete Qad.api.list[e.dataset.api];
					}, 1000);
				})(e.target);
			}))
		};
	}, {
		list: [],
		clear: function() {
			Object.keys(Qad.api.list).map(function(v) {
				Qad.api.list[v].loader.remove();
				delete Qad.api.list[v];
			});
		}
	}),
	modules: Object.assign(function(scripts) {
		var i = 0;
		scripts = ((typeof(scripts) == 'string') ? [scripts] : scripts);
		return new Promise(function(resolve, reject) {
			scripts.forEach(function(id) {
				var file = {
					name: id.split('/').slice(-1).join(''),
					path: id.split('/').slice(0, -1).join('/')
				};
				if (!file.path)
					file.path = location.pwd.split('/page')[0]+'/data/modules';
				// if (Qad.$('script[qad-modules="'+file.name+'"]')) {
				if (Qad.$('script[data-modules="'+file.name+'"]')) {
					if (scripts.length == (++i))
						resolve();
				}else{
					Qad.modules.list.push(file.name);
					var script = Qad.$('/script');
					//script.src = file.path+'/'+file.name+(file.name.slice(-3) == '.js' ? '' : '.js');
					script.src = file.path+'/'+file.name+(file.name.match('\\.js') ? '' : '.js');
					script.async = false;
					script.dataset.modules = file.name;
					script.on('load', function(e) {
						if (Qad.modules[file.name] && Qad.modules[file.name].module) {
							Qad.modules[file.name].module.path = file.path;
							if (Qad.modules[file.name].module.style == true)
								Qad.$('body').add(Qad.$('/link').attr({href: file.path+'/'+file.name+'.css', type: 'text/css', rel: 'stylesheet'}));
							if (Qad.modules[file.name].module.dependencies && Qad.modules[file.name].module.dependencies.length > 0)
								Qad.modules(Qad.modules[file.name].module.dependencies).then(resolve);
						}
						if (scripts.length == (++i))
							resolve(Qad.modules[file.name]);
					}).on('error', function(e) {
						if (scripts.length == (++i))
							reject(e);
					});
					document.head.appendChild(script);
				}
			});
		});
	}, {
		list: []
	}),
	/* modules: Object.assign(function(scripts) {
		scripts = ((typeof(scripts) == 'string') ? [scripts] : scripts);
		Qad.modules.count[0] += scripts.length;
		return new Promise(function(resolve, reject) {
			scripts.map(function(id, i) {
				var file = {
					name: id.split('/').slice(-1).join(''),
					path: id.split('/').slice(0, -1).join('/')
				};
				if (!file.path)
					file.path = location.pwd.split('/page')[0]+'/data/modules';
				if (Qad.$('script[qad-modules="'+file.name+'"]'))
					Qad.modules.load(resolve);
				else{
					Qad.modules.list.push(file.name);
					Qad.$('body').add(Qad.$('/script').attr({
						async: false,
						src: file.path+'/'+file.name+(file.name.slice(-3) == '.js' ? '' : '.js'),
						'qad-modules': file.name
					}).on('load', function(e) {
						if (Qad.modules[file.name] && Qad.modules[file.name].module) {
							Qad.modules[file.name].module.path = file.path;
							if (Qad.modules[file.name].module.style == true)
								Qad.$('body').add(Qad.$('/link').attr({href: file.path+'/'+file.name+'.css', type: 'text/css', rel: 'stylesheet'}));
							if (Qad.modules[file.name].module.dependencies && Qad.modules[file.name].module.dependencies.length > 0)
								Qad.modules(Qad.modules[file.name].module.dependencies).then(resolve);
						}
						Qad.modules.load(resolve);
					}).on('error', reject));
				}
			});
		});
	}, {
		count: [0, 0],
		list: [],
		load: function(f) {
			if (Qad.modules.count[0] == (++Qad.modules.count[1]))
				f();
		}
	}), */
	speech: {
		rec: function(e, options) {
			if (typeof(Qad._rec) == 'undefined') {
				if (Qad.$$$) {
					if (typeof(e) != 'function')
						Qad.$(e).style['color'] = '#F44336';
					window.callback = function(res) {
						if (typeof(e) == 'function')
							e(res);
						else{
							Qad.$(e).style['color'] = '#757575';
							var input = Qad.$(e).parent().find('input');
							input.value = res;
							if ((typeof(input.ondata) == 'function') && (res != ''))
								input.ondata(res, input);
						}
					}
					Qad.$$$.speech_rec();
				}else{
					Qad._rec = Object.assign(new webkitSpeechRecognition(), {
						lang: navigator.language,
						onresult: function(event) {
							var res = event['results'][0][0]['transcript'];
							if (typeof(e) == 'function')
								e(res, event['results']);
							else{
								var input = Qad.$(e).parent().find('input');
								input.value = res;
								if (typeof(input.ondata) == 'function')
									input.ondata(res, input);
							}
						},
						onstart: function() {
							if (typeof(e) != 'function')
								Qad.$(e).style['color'] = '#F44336';
						},
						onend: function() {
							if (typeof(e) != 'function')
								Qad.$(e).style['color'] = '#757575';
							delete Qad._rec;
						}
					}, options);
					Qad._rec.start();
				}
			}else
				Qad._rec.stop();
		},
		tts: function(q, lang) {
			if (!q)
				return;
			var tts = speechSynthesis;
			setTimeout(function() {
				var utterance = new SpeechSynthesisUtterance(q);
				tts.getVoices().map(function(voice) {
					if (voice.lang.match(lang || navigator.language))
						utterance.voice = voice;
				});
				if (utterance.voice)
					speechSynthesis.speak(utterance);
				else
					fetch('/service-worker.php', {
						method: 'POST',
						body: Qad.form({
							q: q,
							tl: lang || navigator.language
						}, null, 'tts')
					}).then(function(res) {
						return res.blob();
					}).then(function(e) {
						new Audio(window.URL.createObjectURL(e)).play();
					});
			});
		}
	},
	fs: {
		open: function(name,callback) {
			window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
				fs.root.getFile(name, {}, function(fileEntry) {
					fileEntry.file(function(file) {
						var reader = new FileReader();
						reader.onloadend = function(e) {
							callback(this.result);
						};
						reader.readAsText(file);
					});
				});
			});
		},
		add: function(name,data,callback,type,error) {
			window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
				if (name.indexOf('/') != -1) {
					var path = '';
					var mkdir = name.split('/');
					delete mkdir[(mkdir.length-1)];
					for (key in mkdir) {
						path += mkdir[key]+'/';
						fs.root.getDirectory(path, {create: true});
					}
				}
				fs.root.getFile(name, {create: true}, function(fileEntry) {
					fileEntry.createWriter(function(fileWriter) {
						if (!type)
							type = 'text/plain';
						var blob = new Blob([data], {type: type});
						console.log(blob);
						fileWriter.write(blob);
					});
					fs.toURL = fileEntry.toURL();
					if (typeof(callback) == 'function')
						callback(fs);
				},error);
			},error);
		},
		remove: function(name) {
			window.requestFileSystem(window.TEMPORARY, 0, function(fs) {
				if (name.slice(-1) == '/')
					fs.root.getDirectory(name, {}, function(dirEntry) {
						dirEntry.removeRecursively(function() {});
					});
				else
					fs.root.getFile(name, {create: false}, function(fileEntry) {
						fileEntry.remove(function() {});
					},function(){
						return false;
					});
			},function(){
				return false;
			});
		},
		ls: function(name,callback) {
			window.requestFileSystem(window.TEMPORARY, 0, function(fs) {
				fs.root.getDirectory(name, {}, function(dirEntry){
					var dirReader = dirEntry.createReader();
					var arr = [];
					dirReader.readEntries(function(entries) {
						for(var i = 0; i < entries.length; i++) {
							var entry = entries[i];
							if (entry.isDirectory)
								arr.push(entry.fullPath+'/');
							else if (entry.isFile)
								arr.push(entry.fullPath);
						}
						callback(arr);
					});
				});
			});
		},
		exist: function(name,callback,error) {
			if (window.requestFileSystem)
				window.requestFileSystem(window.TEMPORARY, 0, function(fs) {
					fs.root.getFile(name, {create: false}, callback, error);
				}, error);
			else
				error();
		}
	},
	code: {
		el: null,
		id: null,
		file: null,
		code: null,
		accept: null,
		style: 'min-height:150px;width:98%;margin-left:5px',
		upload: function(id) {
			if (!id || id == 'null')
				id = Qad.code.id;
		    Qad.$('iframe[data-code="'+id+'"]').contentWindow.focus();
		    //if (Qad.$('#'+id+' form[target="file"]').action) {
		    if (Qad.$('[id="'+id+'"] form[target="file"]').action) {
		        if (!Qad.$('iframe[name=file]')) {
		            file = Qad.$('/iframe');
		            file.name = 'file';
		            file.style['display'] = 'none';
		            Qad.$('body').add(file);
		        }
		        Qad.$('iframe[name=file]').onload = function() {
                    if (!(res = Qad.$('iframe[name=file] body').$()))
                        return;
					if (['jpg', 'png', 'gif'].indexOf(res.split('.').slice(-1)[0]) != -1)
						Qad.$('iframe[data-code="'+id+'"]').contentWindow.document.execCommand('insertHTML', false, '<img src="'+res+'" style="max-width: 100%" />');
					else
						Qad.$('iframe[data-code="'+id+'"]').contentWindow.document.execCommand('insertHTML', false, '<a href="'+res+'"><li><strong>'+res.split('/').slice(-1)[0]+'</strong></li></a>');
                    //Qad.$('iframe[data-code='+id+']').contentWindow.document.execCommand('insertImage', false, Qad.$('iframe[name=file] body').$());
                }
                Qad.$('[id="'+id+'"] form[target="file"]').submit();
                //Qad.$('#'+id+' form[target="file"]').submit();
		    }else{
    		    files = window.event.target.files;
    		    for (var i = 0, f; f = files[i]; i++) {
                    var reader = new FileReader();
                    t = f;
                    reader.onload = function(e) {
                        if (t.type.match('image.*'))
                            Qad.$('iframe[data-code="'+id+'"]').contentWindow.document.execCommand('insertHTML', false, '<img src="'+e.target.result+'" style="max-width: 100%" />');
                            //Qad.$('iframe[data-code='+id+']').contentWindow.document.execCommand('insertImage', false, e.target.result);
                        else
                            Qad.$('iframe[data-code="'+id+'"]').contentWindow.document.execCommand('insertHTML', false, '<a href="'+e.target.result+'" download="'+escape(t.name)+'"><li><strong>'+escape(t.name)+'</strong> ('+(t.type ? t.type : 'n/a')+') - '+t.size+' ('+t.lastModifiedDate.toLocaleDateString()+')</li></a>');
                    }
                    reader.readAsDataURL(f);
    		    }
		    }
		},
		html: function() {
			var t = (Qad.$('textarea[name="'+Qad.code.id+'"]') || Qad.$('textarea[data-name="'+Qad.code.id+'"]'));
			t.hidden = (t.hidden ? false : true);
			// Qad.$('textarea[name="'+Qad.code.id+'"]').hidden = (Qad.$('textarea[name="'+Qad.code.id+'"]').hidden ? false : true);
			Qad.$('iframe[data-code="'+this.id+'"]').hidden = (Qad.$('iframe[data-code="'+this.id+'"]').hidden ? false : true);
			Qad.$('iframe[data-code="'+this.id+'"] body').$(t.$());
		},
		iframe: function() {
			var el = Qad.$('iframe[data-code="'+this.id+'"]');
			Qad.prompt('Вставьте html код iframe, или ссылку на подключаемую страницу').then(function(e) {
				if (!e)
					return;
				el.contentWindow.focus();
				el.contentWindow.document.execCommand('insertHTML', false, (e.match('<iframe') ? e : '<iframe width="100%" height="315" src="'+e+'" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'));
			});
		},
		link: function() {
			var el = Qad.$('iframe[data-code="'+this.id+'"]');
			Qad.prompt('URL адрес').then(function(u) {
				if (!u)
					return;
				Qad.prompt('Заголовок').then(function(t) {
					if (!t)
						return;
					Qad.prompt(['Ссылка', 'Кнопка'], null, 'radio').then(function(s) {
						if (!s)
							return;
						el.contentWindow.focus();
						el.contentWindow.document.execCommand('insertHTML', false, '<a href="'+u+'">'+((s == 1) ? '<button>'+t+'</button>' : t)+'</a>');
					});
				});
			});
		},
		format: function(type,attr,nofocus) {
            if (!nofocus)
			    Qad.$('iframe[data-code="'+this.id+'"]').contentWindow.focus();
            Qad.$('iframe[data-code="'+this.id+'"]').contentWindow.document.execCommand(type, null, attr);
		},
		text: function() {
            Qad.$('textarea[name="'+Qad.code.id+'"]').value = Qad.$('iframe[data-code="'+Qad.code.id+'"] body').$();
		},
		focus: function(id, force) {
			if (force) {
				Qad.code.id = id.name;
				Qad.$('iframe[data-code="'+code.id+'"]').contentWindow.focus();
			}else
				Qad.code.id = id;
		},
		button: function(id) {
		    return '\
                '+(this.file ? '<label>\
                    <i class="material-icons" onclick="window.event.target.parentNode.dataset.ev = 1">attach_file</i>\
                    <form target="file" method="post" '+(this.file==true ? '' : 'action="'+this.file+'"')+' enctype="multipart/form-data" hidden>\
                        <input onclick="return (window.event.target.parentNode.dataset.ev ? window.event.target.parentNode.removeAttribute(\'data-ev\') : false)" type="file" name="upload" onchange="Qad.code.upload(\''+this.id+'\')" '+(this.accept ? 'accept="image/*"' : '')+' style="width:0px;padding:0;border:0;overflow:hidden;" />\
                    </form>\
                </label>' : '')+'\
                <label>\
                    <i class="material-icons" onclick="(parentNode.querySelector(\'select\').style[\'width\']==\'0px\' ? parentNode.querySelector(\'select\').style[\'width\'] = \'124px\' : parentNode.querySelector(\'select\').style[\'width\'] = \'0\')">font_download</i>\
                    <select style="width:0;color:black" onchange="Qad.code.format(\'fontName\',this.value,true)" data-right>\
                        <option>Verdana</option>\
                        <option>Arial</option>\
                        <option>Calibri</option>\
                        <option>Comic Sans MS</option>\
                        <option>Courier New</option>\
                    </select>\
                </label>\
                <label>\
                    <i class="material-icons" onclick="(parentNode.querySelector(\'input\').style[\'width\']==\'0px\' ? parentNode.querySelector(\'input\').style[\'width\'] = \'24px\' : parentNode.querySelector(\'input\').style[\'width\'] = \'0\')">text_fields</i>\
                    <input type="number" min="1" max="7" value="3" oninput="Qad.code.format(\'fontSize\',this.value,true)" style="width:0px;padding:0;border:0;overflow:hidden;height:24px;float:right" />\
                </label>\
                <label>\
                    <i class="material-icons">format_color_text</i>\
                    <input type="color" onchange="Qad.code.format(\'foreColor\',this.value)" style="width:0px;padding:0;border:0;overflow:hidden;" />\
                </label>\
                <label>\
                    <i class="material-icons">format_color_fill</i>\
                    <input type="color" onchange="Qad.code.format(\'backColor\',this.value)" style="width:0px;padding:0;border:0;overflow:hidden;" />\
                </label>\
                <i onclick="Qad.code.id = \''+id+'\'; Qad.code.format(\'bold\')" class="material-icons">format_bold</i>\
                <i onclick="Qad.code.id = \''+id+'\'; Qad.code.format(\'italic\')" class="material-icons">format_italic</i>\
                <i onclick="Qad.code.id = \''+id+'\'; Qad.code.format(\'underline\')" class="material-icons">format_underlined</i>\
                <i onclick="Qad.code.id = \''+id+'\'; Qad.code.format(\'justifyRight\')" class="material-icons">format_align_right</i>\
                <i onclick="Qad.code.id = \''+id+'\'; Qad.code.format(\'justifyCenter\')" class="material-icons">format_align_center</i>\
                <i onclick="Qad.code.id = \''+id+'\'; Qad.code.format(\'justifyLeft\')" class="material-icons">format_align_left</i>\
                <i onclick="Qad.code.id = \''+id+'\'; Qad.code.link()" class="material-icons">insert_link</i>\
                '+(this.code ? '\
					<i onclick="Qad.code.id = \''+id+'\'; Qad.code.iframe()" class="material-icons">insert_invitation</i>\
					<i onclick="Qad.code.id = \''+id+'\'; Qad.code.html()" class="material-icons">code</i>\
				' : '')+'\
                '+(this.title ? '<span data-left>'+this.title+'</span>' : '')+'\
            ';
        },
		init: function(o) {
		    for (k in o) {
		        this[k] = o[k];
			}
		    html = Qad.$(this.el).$();
		    this.id = (this.el.id || this.el.dataset.id);
            Qad.$(this.el).$((this.button ? '<h2>'+this.button(this.id)+'</h2><br />' : '' )+'<iframe onmouseover="Qad.code.focus(\''+this.id+'\')" onmouseout="Qad.code.text(\''+this.id+'\')" frameborder="no" style="'+this.style+'" data-code="'+this.id+'"></iframe><br /><textarea '+(this.el.id ? 'name="'+this.id+'"' : 'data-name="'+this.id+'"')+' style="margin-top:-10px;'+this.style+'" hidden>'+html+'</textarea>');
            Qad.$('iframe[data-code="'+this.id+'"]').contentDocument.open(); 
            Qad.$('iframe[data-code="'+this.id+'"]').contentDocument.write(html); 
            Qad.$('iframe[data-code="'+this.id+'"]').contentDocument.close();
            Qad.$('iframe[data-code="'+this.id+'"]').contentDocument.designMode = 'on';
            Qad.$('iframe[data-code="'+this.id+'"] body').addEventListener('blur', function() {
				Qad.code.text();
			});
		}
	},
	banners: function(el) {
		return (((typeof HTMLElement === 'object') ? el instanceof HTMLElement : (el && (typeof el === 'object') && (el !== null) && (el.nodeType === 1) && (typeof el.nodeName === 'string'))) ? (Qad.$('#banners') ? !!Qad.$('#banners').add([el]) : (Qad.$('.clear + *') ? !!Qad.$('.clear + *').parentNode.insertBefore(Qad.$('/div').attr('id', 'banners').add([el]), Qad.$('.clear + *')) : false)) : false);
	},
	notification: function(title,time) {
		var notification = {
			body: ((typeof(title) != 'string') ? title.body : ''),
			icon: (((typeof(title) != 'string') && title.icon) ? title.icon : (Qad.$('link[rel="icon"]') ? Qad.$('link[rel="icon"]').href : '')),
			dir: 'auto',
			actions: ((typeof(title) != 'string') ? title.actions : [])
		}
		if (typeof(title) != 'string')
			notification = Object.assign(notification, title);
		if ($$.$$$)
			$$.$$$.notification(((typeof(title) == 'string') ? title : title.title), $$.json(notification));
		else if (!notification.nopush && 'Notification' in window) {
			Notification.requestPermission(function (permission) {
				if (permission === 'granted') {
					if (Qad.sw)
						notification.e = Qad.sw.showNotification(((typeof(title) == 'string') ? title : title.title), notification);
					else{
						notification.e = new Notification(((typeof(title) == 'string') ? title : title.title), notification);
						if ((typeof(title) == 'object') && title.action)
							notification.e.onclick = function(e) {
								if ($$actions && $$actions[title.action])
									$$actions[title.action](e);
								else
									location.href = title.action;
							}
					}
				}
			});
		}
		if (notification.nohtml)
			return;
		if (Qad.$$('div#notification').length == 2)
			Qad.for('div#notification', function(el) {
				clearTimeout(el.time);
				el.remove();
			});
		var div;
		if (!(notification.tag && (div = Qad.$('#notification[data-tag="'+notification.tag+'"]')))) {
			div = Qad.$('/div');
			if (notification.tag)
				div.dataset.tag = notification.tag;
			div.innerHTML = ((typeof(title) == 'string') ? title : title.title);
			div.id = 'notification';
			div.style['margin-bottom'] = 60*(Qad.$$('#notification').length)+20+'px';
			if (typeof(title) == 'object') {
				for (key in title.actions) {
					if (!title.actions[key]['title'])
						continue;
					var span = Qad.$('/span');
					//span.onclick = actions[title.actions[key].action];
					span.dataset._action = title.actions[key].action;
					span.onclick = function(e) {
						if ($$actions && $$actions[e.target.dataset._action])
							$$actions[e.target.dataset._action](e);
						else
							location.href = title.actions[key].action;
					}
					span.innerHTML = title.actions[key].title;
					div.add(span);
				}
				if (title.action)
					div.onclick = function(e) {
						if ($$actions && $$actions[title.action])
							$$actions[title.action](e);
						else
							location.href = title.action;
					}
			}
			Qad.$('body').add(div);
			if (time) {
				div.time = setTimeout(function() {
					if (notification.e && (notification.e.constructor.name != 'Promise'))
						notification.e.close();
					div.remove();
					//Qad.$('#notification').remove();
				},time);
			}
		}else
			div.innerHTML = ((typeof(title) == 'string') ? title : title.title);
		console.log("%c"+(typeof(title)=='string'?title:title.title),'color:DodgerBlue;font-weight:bold;');
		return Object.assign(div, {
			set: function(opt) {
				Qad.notification(Object.assign(notification, opt));
				return div;
			}
		});
	},
	compiler: {
		css: function(css){
			var startIndex = 0, 
				endIndex = 0,
				preserve = false;
			while ((startIndex = css.indexOf("/*", startIndex)) >= 0) {
				preserve = css.length > startIndex + 2 && css[startIndex + 2] === '!';
				endIndex = css.indexOf("*/", startIndex + 2);
				if (endIndex >= startIndex + 2) {
					if (!preserve)
						css = css.slice(0, startIndex) + css.slice(endIndex + 2);
				}
			};
			css = css.replace(/\s+([!{};:>+\(\)\],])/g, '$1');
			css = css.replace(/\band\(/gi, "and (");
			css = css.replace(/([!{}:;>+\(\[,])\s+/g, '$1');
			css = css.replace(/;+}/g, "}");
			css = css.replace(/([\s:])(0)(px|em|%|in|cm|mm|pc|pt|ex)/gi, "$1$2");
			css = css.replace(/(:|\s)0+\.(\d+)/g, "$1.$2");
			css = css.replace(/rgb\s*\(\s*([0-9,\s]+)\s*\)/gi, function(){
				var rgbcolors = arguments[1].split(',');
				for (var i = 0; i < rgbcolors.length; i++) {
					rgbcolors[i] = parseInt(rgbcolors[i], 10).toString(16);
					if (rgbcolors[i].length === 1)
						rgbcolors[i] = '0' + rgbcolors[i];
				}
				return '#'+rgbcolors.join('');
			});
			css = css.replace(/calc\((.*?)\)/gi, function(){
				return 'calc('+arguments[1].replace('+',' + ')+')';
			});
			css = css.replace(/[^\};\{\/]+\{\}/g, "");
			css = css.replace(/^\s+|\s+$/g, "");
			return css;
		}
	},
	gencss: function(css, file) {
		if (Qad.session.get('theme-color'))
			Qad.$('meta[name=theme-color]').content = '#'+Qad.session.get('theme-color');
		else if (!css)
			css = (Qad.$('meta[name="theme-color"]')?Qad.$('meta[name="theme-color"]').content.slice(1):'style');
		else
			Qad.$('meta[name=theme-color]').content = '#'+css;
		if (file) {
			link = Qad.$('/link');
			link.rel = 'stylesheet/qad';
			link.href = file;
			Qad.$('head').add(link);
		}
		var style = function() {
			var el = Qad.$('link[rel="stylesheet/qad"]'),
				style;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', el.href);
			xhr.onload = function () {
				var res = xhr.responseText;
				for (var i=0; i<2; ++i) {
					res = res.replace(/var\(--(.*?)\)/gim, function(str, key) {
						var _el = Qad.$('meta[name="theme-'+key+'"]');
						if (_el)
							return _el.content;
						else{
							if ((_el = str.split(',')).length > 1)
								return _el[1].slice(0, -1);
							else
								return str;
						}
					});
				}
				style = Qad.compiler.css(res).replace(/url\(..\//g, 'url('+location.href.split('/page')[0]+'/data/');
				if (window.requestFileSystem)
					Qad.fs.add('style/'+css+'.css', style, function(e) {
						setTimeout(function() {
							Qad.$('link[rel="stylesheet/qad"]').attr({
								href: e.toURL,
								rel: 'stylesheet',
								'data-qad': true
							});
						},500);
					}, null, function() {
						add = Qad.$('/style');
						add.innerHTML = style;
						Qad.$('head').add(add);
					});
				else{
					add = Qad.$('/style');
					add.innerHTML = style;
					Qad.$('head').add(add);
				}
			}
			xhr.onerror = function() {
				Qad.$('link[rel="stylesheet/qad"]').rel = 'stylesheet';
			}
			xhr.send();
		}
		Qad.fs.exist('style/'+css+'.css', function(e) {
			var load = function() {
				Qad.$('link[rel="stylesheet/qad"]').attr({
					href: e.toURL(),
					rel: 'stylesheet',
					'data-qad': true
				});
			}
			e.file(function(f) {
				if ((Math.round(new Date().getTime()/1000.0) - 86400) > Math.round(f.lastModified/1000.0))
					style();
				else
					load();
			}, load);
		}, style);
	},
	init: function(type, action) {
		if (!type) {
			if (Qad.$('html[data-ajax]'))
				Qad.init('ajax');
			if (Qad.$('html[data-controller]'))
				Qad.init('controller');
			if (Qad.$('[data-src]'))
				Qad.init('[data-src]');
			if (Qad.$('button#menu + nav'))
				Qad.init('button#menu + nav');
			if (Qad.$('nav.tabs'))
				Qad.init('nav.tabs');
			if (Qad.$('.menu'))
				Qad.init('.menu');
			if (Qad.$('ul.emoji'))
				Qad.init('ul.emoji');
			if (Qad.$('select[placeholder]:not([data-on])'))
				Qad.init('select[placeholder]:not([data-on])');
			if (Qad.$('input[list][data-select]'))
				Qad.init('input[list][data-select]');
			if (Qad.$('.parallax img'))
				Qad.init('.parallax img');
			if (Qad.$('[data-action]'))
				Qad.init('[data-action]');
			if (Qad.$('dialog [data-close]'))
				Qad.init('dialog [data-close]');
			if (Qad.$('label.speech'))
				Qad.init('label.speech');
			if (Qad.$('label.tags'))
				Qad.init('label.tags');
			if (Qad.$('#fullpage'))
				Qad.init('#fullpage');
			if (Qad.$('[contextmenu]'))
				Qad.init('[contextmenu]');
			if (Qad.$('[autocomplete="off"][readonly]'))
				Qad.init('[autocomplete="off"][readonly]');
			if (Qad.$('script[type="nodejs"][src]'))
				Qad.init('script[type="nodejs"][src]');
		}else{
			switch (type) {
				case 'ajax': {
					Qad.for('html[data-ajax] a:not([target]):not([onclick]):not([data-intent]):not([data-action]):not([data-on]):not([download])', function(el) {
						el.attr({
							'data-on': true,
							onclick: 'return Qad.redirect(this);'
						});
					});
					break;
				}
				case 'controller': {
					var r;
					Qad.controller = Object.assign((r = function () {
						return ['.menu[data-for]', '#button-header', '.content', '#button-float'].reduce(function(arr, k) {
							var el = Qad.$$(k);
							Array.prototype.slice.call(el).map(function(el_) {
								var i_ = 0;
								el_.list = Qad.$(el_).find(((el_.tagName == 'UL') ? 'li' : '[tabindex]')+':not([hidden])', true).filter(function(f) {
									return (
										([/* 'dialog', */ '.menu[data-for]', '#button-header', '#button-float'].indexOf(k) > -1)
										? true
										: !f.parent([/* 'dialog', */ '.menu[data-for]', '#button-header', '#button-float'])
									);
								}).reduce(function(arr, k, i, l) {
									if (l[(i - 1)] && ((k.pos().top - l[(i - 1)].pos().top) > 15)) {
										arr[++i_] = [];
									}
									arr[i_].push(k);
									return arr;
								}, [[]]);
							});
							return arr.concat(Array.prototype.slice.call(el));
						}, []);
					})(), {
						i: -1, j: -1, n: -1, a: null, y: null, s: true, p: false,
						reload: r,
						keys: {},
						find: function(el) {
							Qad.controller.forEach(function(i_, i) {
								i_.list.forEach(function(j_, j) {
									j_.forEach(function(n_, n) {
										if (n_ == el)
											(Qad.controller.a = Qad.controller[(Qad.controller.i = i)].list[(Qad.controller.j = j)][(Qad.controller.n = n)]).classList.add('focus');
									});
								});
							});
							setTimeout(function() {
								if (Qad.controller.a && !Qad.controller.a.parent(['dialog', '.menu[data-for]', '#button-header', '#button-float']))
									Qad.up(Qad.controller.a, 100);
							}, 1000);
						},
						onscroll: ((Qad.$$$ && document.scrollingElement && (typeof(Qad.controller) == 'undefined')) && Qad.$('html').on('mousedown', function(e) {
							if ((['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) == -1) && !e.target.dataset.action && !e.target.onclick)
								e.preventDefault((Qad.controller.y = e.clientY), (Qad.controller.p = (e.target.closest('dialog[open]') ? (e.target.closest('.content') || e.target.closest('dialog[open]')): document.scrollingElement)));
						}).on('mouseup', function() {
							document.body.removeAttribute('data-touchmove', (Qad.controller.y = null));
						}).on('mousemove', function(e) {
							if (Qad.controller.y != null) {
								document.body.dataset.touchmove = 1;
								Qad.controller.p.scrollTop -= (- Qad.controller.y + (Qad.controller.y = e.clientY));
							}
						})),
						onkey: Qad.$('html').on('key', null, 'controller').on('key', function(e) {
							if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) > -1)
								return;
							if (!Qad.controller.s)
								return e.preventDefault();
							var el_, s;
							if (((e.key == 'Backspace') || (e.key == 'Escape')) && history.url && (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) == -1) && (s = true))
								e.preventDefault((Qad.$('dialog[open]') ? Qad.$('dialog[open]').close() : (history.url = window.history.back())));
							else if ((e.key == 'Enter') && (s = true) && Qad.controller.a)
								Qad.controller.a.click();
							else if ((e.key == 'PageUp') || (e.key == 'NavigatePrevious'))
								while (true) {
									if ((Qad.controller.i > -1) && Qad.controller[--Qad.controller.i] && ((Qad.controller[Qad.controller.i].dataset.for && !Qad.$(Qad.controller[Qad.controller.i]).attr('open')) || !Qad.controller[Qad.controller.i].innerHTML))
										continue;
									Qad.controller.j = Qad.controller.n = 0;
									break;
								}
							else if ((e.key == 'PageDown') || (e.key == 'NavigateNext'))
								while (true) {
									if ((Qad.controller.i < Qad.controller.length) && Qad.controller[++Qad.controller.i] && ((Qad.controller[Qad.controller.i].dataset.for && !Qad.$(Qad.controller[Qad.controller.i]).attr('open')) || !Qad.controller[Qad.controller.i].innerHTML))
										continue;
									Qad.controller.j = Qad.controller.n = 0;
									break;
								}
							else if (e.key == 'ArrowLeft') {
								if (Qad.controller[Qad.controller.i] && Qad.controller[Qad.controller.i].list[Qad.controller.j]) {
									if (Qad.controller.n > 0)
										--Qad.controller.n;
									else if (Qad.controller[Qad.controller.i].list[(Qad.controller.j - 1)])
										Qad.controller.n = (Qad.controller[Qad.controller.i].list[--Qad.controller.j].length - 1);
								}
							}else if (e.key == 'ArrowUp') {
								if (Qad.controller[Qad.controller.i] && (Qad.controller.j > 0)) {
									if (!Qad.controller[Qad.controller.i].list[--Qad.controller.j][Qad.controller.n])
										Qad.controller.n = Qad.controller[Qad.controller.i].list[Qad.controller.j].length - 1;
								}else if (!(Qad.controller.a && Qad.controller.a.parent('dialog[open]')))
									while (true) {
										if (Qad.controller.i > -1) {
											Qad.controller.j = Qad.controller.n = 0;
											if (Qad.controller[--Qad.controller.i] && ((Qad.controller[Qad.controller.i].dataset.for && !Qad.$(Qad.controller[Qad.controller.i]).attr('open')) || !Qad.controller[Qad.controller.i].innerHTML))
												continue;
										}
										break;
									}
							}else if (e.key == 'ArrowRight') {
								if (Qad.controller[Qad.controller.i] && Qad.controller[Qad.controller.i].list[Qad.controller.j]) {
									if ((Qad.controller.n + 1) < Qad.controller[Qad.controller.i].list[Qad.controller.j].length)
										++Qad.controller.n;
									else if (Qad.controller[Qad.controller.i].list[(Qad.controller.j + 1)]) {
										++Qad.controller.j;
										Qad.controller.n = 0;
									}
								}
							}else if (e.key == 'ArrowDown') {
								if (Qad.controller[Qad.controller.i] && ((Qad.controller.j + 1) < Qad.controller[Qad.controller.i].list.length)) {
									if (!Qad.controller[Qad.controller.i].list[++Qad.controller.j][Qad.controller.n])
										Qad.controller.n = Qad.controller[Qad.controller.i].list[Qad.controller.j].length - 1;
								}else if (!(Qad.controller.a && Qad.controller.a.parent('dialog[open]')))
									while (true) {
										if (Qad.controller.i < Qad.controller.length) {
											Qad.controller.j = Qad.controller.n = 0;
											if (Qad.controller[++Qad.controller.i] && ((Qad.controller[Qad.controller.i].dataset.for && !Qad.$(Qad.controller[Qad.controller.i]).attr('open')) || !Qad.controller[Qad.controller.i].innerHTML))
												continue;
										}
										break;
									}
							}else{
								s = true;
								if ((typeof($controller) == 'object') && $controller[e.key])
									$controller[e.key](e, Qad.controller);
							}
							if (Qad.controller.a)
								Qad.controller.a.blur(Qad.controller.a.classList.remove('focus'));
							if (!s && Qad.controller[Qad.controller.i] && (Qad.controller.a = Qad.controller[Qad.controller.i].list[Qad.controller.j][Qad.controller.n])) {
								Qad.$(e);
								Qad.controller.a.classList.add('focus');
								if (el_ = Qad.controller.a.parent('div[hidden]'))
									el_.hidden = false;
								else if (el_ = Qad.controller.a.parent('details'))
									el_.attr('open', true);
								if (Qad.controller.a.parent('dialog'))
									Qad.controller.a.parent(['dialog', '.content']).scrollTop = Qad.controller.a.offsetTop - Qad.controller.a.pos().height;
								else if (!Qad.controller.a.parent(['.menu[data-for]', '#button-header', '#button-float']))
									Qad.up(Qad.controller.a, 100);
							}
						}, 'controller')
					});
					break;
				}
				case '[data-src]': {
					var els = [].slice.call(Qad.$$('[data-src]:not([data-on])'));
					if (('IntersectionObserver' in window) && !(localStorage.getItem('qad_lazyload_off') == 'true')) {
						var lazyObserver = new IntersectionObserver(function(entries, observer) {
							entries.forEach(function(entry) {
								if (entry.isIntersecting) {
									entry.target.dataset.on = !!(entry.target.src = entry.target.dataset.src);
									lazyObserver.unobserve(entry.target);
								}
							});
						});
						els.forEach(function(el) {
							lazyObserver.observe(el);
						});
					}else
						els.forEach(function(el) {
							el.dataset.on = !!(el.src = el.dataset.src);
						});
					break;
				}
				case 'button#menu + nav': {
					if (Qad.$('button#menu:not([data-on])'))
						Qad.modules('panel').then(function() {
							Qad.$('button#menu').on('click', Qad.modules.panel.open).dataset.on = true;
						});
					break;
				}
				case 'nav.tabs': {
					var open = function(id) {
						if (!Qad.$('nav.tabs a[href="#'+id+'"]'))
							return false;
						if (Qad.$('nav.tabs a.active'))
							Qad.$('nav.tabs a.active').classList.remove('active');
						if (Qad.$('div.tabs.active'))
							Qad.$('div.tabs.active').classList.remove('active');
						if (Qad.$('div.tabs#'+id))
							Qad.$('div.tabs#'+id).classList.add('active');
						Qad.$('nav.tabs a[href="#'+id+'"]').classList.add('active');
						var s = location.search;
						if (s.indexOf('tab') != -1)
							location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m) {
								if (m.indexOf('tab') != -1)
									s = s.replace(m,'');
							});
						if (s.slice(0,1) == '&')
							s = '?'+s.slice(1);
						if (location.origin != 'file://' && location.origin.indexOf('chrome-extension')==-1)
							history.pushState(null, null, (history.url = (s!='' ? s+'&' : '?')+'tab='+id));
						if (typeof(tabs) == 'function')
							tabs(id);
					}
					if (action)
						open(action);
					var i = 0;
					Qad.for('nav.tabs a', function(el){
						Qad.$(el).attr('data-index',i);
						el.onclick = function(e){
							if (el.href != '#' && el.href.indexOf('#') != -1) {
								var id = el.href.split('#')[1];
								if (!id)
									return;
								if (Qad.$('div.tabs#'+id))
									open(id);
								if (Qad.$('#'+id))
									Qad.up(id);
								else
									Qad.up();
								e.preventDefault();
							}
						}
						++i;
					});
					Qad.$('html').on('swipe', function(e){
						if (e.sx < 50 || !Qad.$()['tab'])
							return;
						var a = Number(Qad.$('nav.tabs a[href="#'+Qad.$()['tab']+'"]').attr('data-index')),
							m = $$.$$('nav.tabs a').length-1;
						if (e.swipe == 'left' && a<m)
							Qad.$$('nav.tabs a')[a+1].click();
						else if (e.swipe == 'right' && a>0)
							Qad.$$('nav.tabs a')[a-1].click();
					});
					break;
				}
				case '.menu': {
					Qad.for(':not(ul).menu', function(el) {
						el.onclick = function(e) {
							var menu = Qad.$('.menu[data-for][open]');
							var hide = function(_e) {
								if (!menu || (_e && _e.target && (_e.target.tagName == 'SUMMARY')))
									return;
								Qad.$('body').removeAttribute('data-menu');
								menu.removeAttribute('open');
								menu.style.left = '';
								menu.style.top = '';
								Qad.$('html').onclick = null;
							}
							if (menu)
								return hide();
							if (menu = Qad.$('.menu[data-for="'+el.id+'"]'))
								menu.attr('open', true);
							setTimeout(function() {
								Qad.$('html').onclick = hide;
							});
						}
					});
					/*
					ul = function(e) {
						if (!Qad.$('ul[open]') || Qad.$('ul[open]').dataset.for == e.target.id)
							return;
						pos = Qad.$('ul[open]').pos();
						if ((e.y < pos.top || e.x < pos.left || e.y > pos.top+pos.height || e.x > pos.left+pos.width) && !Qad.$(e.target).attr('data-menu')) {
							if ((e.target.tagName == 'LI') && e.target.parent().classList.contains('menu'))
								e.target.click();
							else
								Qad.$('#'+Qad.$('ul[open]').dataset.for).click();
						}
					}
					Qad.for(type, function(el) {
						if (el.tagName != 'UL')
							el.onclick = function(e) {
								if (el.classList.contains('menu') && el.id && Qad.$('ul[data-for='+el.id+']')) {
									if (Qad.$('ul[data-for='+el.id+']').style['display'] == 'block') {
										Qad.$('html').on('mouse',null,'ul');
										Qad.$('ul[data-for='+el.id+']').style['display'] = '';
										Qad.$('ul[data-for='+el.id+']').attr('open', false);
									}else{
										if (Qad.$('ul[open]'))
											Qad.$('#'+Qad.$('ul[open]').dataset.for).click();
										Qad.$('html').on('mouse',ul,'ul');
										Qad.$('ul[data-for='+el.id+']').style['display'] = 'block';
										Qad.$('ul[data-for='+el.id+']').attr('open', true);
									}
									e.preventDefault();
								}
							}
					});
					Qad.for('.menu *', function(el) {
						Qad.$(el).attr('data-menu',true);
					});
					*/
					break;
				}
				case 'ul.emoji': {
					if (navigator.userAgent.match(/Android/i))
						Qad.for('ul.emoji',function(el) {
							Qad.$('#'+Qad.$(el).dataset.for).remove();
							el.remove();
						});
					else{
						var emoji = '';
						for (var i=0; i<=3; ++i) {
							for (var j=0; j<=15; ++j) {
								emoji += '<li>&#x1f6'+i+''+
									(j==10 ? 'A' : (j==11 ? 'B' : (j==12 ? 'C' : (j==13 ? 'D' : (j==14 ? 'E' : (j==15 ? 'F' : j))))))
								+';</li>';
							}
						}
						Qad.for('ul.emoji',function(el) {
							if (Qad.$('[data-emoji="'+Qad.$(el).dataset.for+'"]')) {
								Qad.$(el).$(emoji);
								el.onclick = function() {
									Qad.$('[data-emoji="'+Qad.$(this).dataset.for+'"]').$('~'+Qad.$(window.event.target).$());
								}
							}
						});
					}
					break;
				}
				case 'select[placeholder]:not([data-on])': {
					Qad.for(type, function(el) {
						if (el.find('[selected]'))
							return el.removeAttribute('placeholder');
						var o = new Option(el.attr('placeholder'), '');
						el.dataset.on = o.disabled = o.selected = o.hidden = true;
						el.options.add(o, false);
						el.on('change', function(e) {
							el.removeAttribute('placeholder', el.options[0].remove(), el.on('change'));
						});
					});
					break;
				}
				case 'input[list][data-select]': {
					Qad.for(type, function(el) {
						el.onchange = function() {
							var optionFound = false,
								datalist = this.list;
							for (var j = 0; j < datalist.options.length; j++)
								if (this.value == datalist.options[j].value) {
									optionFound = true;
									break;
								}
							if (optionFound)
								this.setCustomValidity('');
							else
								this.setCustomValidity('Please select a valid value.');
						}
					});
					break;
				}
				case '.parallax img': {
					Qad.for(type, function(el) {
						var parent = el.parent().pos(),
							top = window.scrollY, //document.body.scrollTop,
							height = window.innerHeight;
						if (!(((top + height) >= parent.top) && ((parent.top  + parent.height >= top))))
							return;
						percent = (top + height - parent.top) / (parent.height + height);
						el.style.transform = 'translate3D(-50%,'+Math.round(((el.pos().height - parent.height) * percent))+'px, 0)';
					});
					break;
				}
				case '[data-action]': {
					Qad.for(type, function(e) {
						if (!e.dataset.on && (e.f = ((typeof(window['_'+e.dataset.action]) == 'function') ? '_'+e.dataset.action : (
							(window.actions && (typeof(window.actions[e.dataset.action]) == 'function')) ? '__'+e.dataset.action : null
						)))) {
							e.dataset.on = true;
							e.on('click', function(ev) {
								if (e.dataset.action) {
									if (window.actions && (e.f.indexOf('__') == 0) && (typeof(window.actions[e.f.slice(2)]) == 'function'))
										window.actions[e.f.slice(2)](ev);
									else if (typeof(window[e.f]) == 'function')
										window[e.f](ev);
								}
							}, 'action');
						}
					});
					break;
				}
				case 'dialog [data-close]': {
					Qad.for(type, function(e) {
						if (!e.dataset.on) {
							e.dataset.on = true;
							e.on('click', function() {
								e.parent('dialog').close();
							});
						}
					});
					break;
				}
				case 'label.speech': {
					Qad.for(type, function(e) {
						if (e.speech)
							return;
						e.speech = true;
						var speech = Qad.$('/i');
						speech.onclick = Qad.speech.rec;
						e.add(speech);
					});
					break;
				}
				case 'label.tags': {
					Qad.for(type, function(el) {
						if (el.querySelector('input.input'))
							return;
						var input = el.querySelector('input'),
							tags = input.value.split(',').filter(Boolean),
							_input = Qad.$('/input');
						input.style.display = 'none';
						input.style.visibility = 'hidden';
						el.addTag = function(e, tag) {
							if (e) {
								tag = e.target.value;
								e.target.value = '';
								if (input.value.split(',').indexOf(tag) > -1)
									return;
								input.value = input.value+tag+',';
							}
							if (!tag.trim())
								return;
							var chip = document.createElement('div');
							chip.classList.add('chip');
							chip.textContent = tag;
							chip.addEventListener('click', function(e) {
								el.removeTag(e);
							}, false);
							el.insertBefore(chip, _input);
							if (((e && !e.no_up) || !e) && typeof(_input.update) == 'function')
								_input.update(input);
						}
						el.clear = function(no_up) {
							input.value = '';
							el.find('.chip', true).map(function(e) {
								e.remove();
							});
							if (!no_up && (typeof(_input.update) == 'function'))
								_input.update();
						}
						el.removeTag = function(e) {
							var tag = e.target.textContent+',';
							if (input.value.indexOf(tag) > -1) {
								input.value = input.value.replace(tag, '');
								e.target.parentNode.removeChild(e.target);
							}
							if (typeof(_input.update) == 'function')
								_input.update(input);
						}
						_input.type = 'text';
						_input.classList.add('input');
						_input.attr(Object.assign({}, input.dataset));
						if (input.dataset.update && window[input.dataset.update])
							_input.update = window[input.dataset.update];
						if (input.dataset.list && (typeof(_input.update) != 'function')) {
							var list = Qad.$('#'+input.dataset.list),
								sel = Qad.$('/select').attr('multiple', true);
							if (Qad.$$$)
								list.style.display = 'block';
							while (list.lastChild) {
								sel.insertBefore(list.lastChild, sel.firstChild);
							}
							list.add(sel).on('change', function(e) {
								el.clear(true);
								[].map.call(Qad.$(e).options, function(_el) {
									(_el.selected && el.addTag({no_up: true, target: {
										value: (_el.value || _el.text)
									}}));
								});
							});
							_input.update = function() {
								[].map.call(sel.options, function(_el) {
									_el.selected = (input.value.split(',').filter(Boolean).indexOf((_el.value || _el.text)) > -1);
								});
							}
						}
						el.classList.add('tags');
						el.appendChild(_input);
						if (tags.length > 0)
							tags.forEach(function(tag) {
								el.addTag('', tag);
							});
						_input.onkeydown = function(e) {
							if (([13, 9].indexOf(e.keyCode) > -1) || ([',', ';'].indexOf(e.key) > -1))
								window.event.preventDefault(el.addTag(e));
						}
						_input.onblur = function(e) {
							el.addTag(e);
						}
						el.onclick = function(e) {
							if (e.target.tagName != 'SELECT')
								_input.focus();
						}
					});
					break;
				}
				case '#fullpage': {
					if (Qad.$('#fullpage .page')) {
						Qad.$('body').style.overflow = 'hidden';
						var fullpage = function(e) {
							var obj = Qad.$('#fullpage'),
								step = Qad.$(obj).find('.page').pos().height,
								slength = (obj.style.transform ? parseInt(obj.style.transform.replace('translateY(', '')) : 0),
								plength = parseInt(obj.offsetHeight / (Math.min(window.innerHeight, window.innerWidth) / step));
							if (!obj.top)
								obj.top = (obj.pos().top < 0 ? 0 : obj.pos().top);
							if (e.key) {
								if (['ArrowUp', 'PageUp'].indexOf(e.key) > -1) {
									e.deltaY = -1;
								}else if (['ArrowDown', 'PageDown'].indexOf(e.key) > -1) {
									e.deltaY = 1;
								}else if (['0','1','2','3','4','5','6','7','8','9'].indexOf(e.key) > -1 && Qad.$$('#fullpage .page')[e.key]) {
									e = Qad.$$('.page')[e.key];
								}else
									return true;
							}
							if (typeof(e.preventDefault) == 'function')
								e.preventDefault();
							if (e.deltaY) {
								if (e.deltaY > 0 && Math.abs(slength) < (plength - plength / Qad.$(obj).querySelectorAll('.page').length))
									slength = slength - step;
								else if (e.deltaY < 0 && slength < 0)
									slength = slength + step;
							}else
								slength = obj.top + Qad.$(e).pos().top * -1 + slength;
							if (obj.hold != true) {
								obj.hold = true;
								obj.style.transform = 'translateY('+(slength < 0 ? slength : 0)+'px)';
								setTimeout(function() {
									var i = 0;
									Qad.for('#fullpage .page', function(el) {
										if (el.pos().top == obj.top) {
											if (Qad.$$('#navpage input')[i])
												Qad.$$('#navpage input')[i].checked = true;
											else if (Qad.$('#navpage input:checked'))
												Qad.$('#navpage input:checked').checked = false;
										}else
											++i;
									});
									obj.hold = false;
								}, 1000);
							}
						}
						Qad.$('html').on('key', fullpage);
						Qad.$('#fullpage').addEventListener('touchstart', function(e) {
							sX = e.changedTouches[0].pageX;
							sY = e.changedTouches[0].pageY;
							stT = new Date().getTime();
						});
						Qad.$('#fullpage').addEventListener('touchmove', function(e) {
							e.preventDefault()
						});
						Qad.$('#fullpage').addEventListener('touchend', function(e) {
							var dY = e.changedTouches[0].pageY - sY;
							if (((new Date().getTime() - stT) <= 500) && (Math.abs(dY) >= 100 && Math.abs(e.changedTouches[0].pageX - sX) <= 50)) {
								e.key = (dY < 0 ? 'ArrowDown' : 'ArrowUp');
								fullpage(e);
							}
						});
						Qad.$('#fullpage').addEventListener('wheel', fullpage);
						if (Qad.$('#navpage input'))
							Qad.$('#navpage').on('click', function(e) {
								var i = 0;
								Qad.for('#navpage input', function(el) {
									if (el == e.target)
										fullpage(Qad.$$('#fullpage .page')[i]);
									else
										++i;
								});
							});
					}
					break;
				}
				case '[contextmenu]': {
					Qad.for(type, function(el) {
						el.oncontextmenu = function(e) {
							e.preventDefault();
							var menu = Qad.$('menu[open]');
							var hide = function() {
								if (!menu)
									return;
								Qad.$('body').removeAttribute('data-menu');
								menu.removeAttribute('open');
								menu.style.left = '';
								menu.style.top = '';
								Qad.$('html').onclick = null;
							}
							if (menu)
								hide();
							Qad.$('body').attr('data-menu', true);
							var menu = Qad.$('menu#'+el.attr('contextmenu'));
							Qad.for(menu.querySelectorAll('menuitem'), function(item) {
								item.root = el;
							});
							if (menu.attr('width'))
								menu.style.width = menu.attr('width')+'px';
							menu.style.left = (e.pageX - 10)+'px';
							menu.style.top = (e.pageY - 10)+'px';
							menu.attr('open', true);
							Qad.$('html').onclick = hide;
						};
					});
					break;
				}
				case '[autocomplete="off"][readonly]': {
					Qad.for('[autocomplete="off"][readonly]', function(el) {
						el.onfocus = function() {
							if (!this.hasAttribute('readonly'))
								return;
							this.removeAttribute('readonly');
							this.blur();
							this.focus();
						}
					});
					break;
				}
				case 'script[type="nodejs"][src]': {
					Qad.for('script[type="nodejs"][src]', function(el) {
						fetch(el.src).then(function(res) {
							return res.text();
						}).then(function(res) {
							el.attr('src', false);
							Qad.$('body').add(
								Qad.$('/script').$(
									t = Qad.replace([
										/\/\*(.|[\r\n])*?\*\//g,
										'#!/usr/bin/env node',
										/\(typeof\(module\) == 'object'\) \? 'node' : /g,
									], '', res.replace(/node:(?: |)function[\s\S]*error:(?: |)function/g, 'error:\ function')).trim()
								)
							);
							Qad.init();
						});
					});
					break;
				}
				default: {
					((type.constructor.name == 'Array') ? type.forEach(function(t) {
						Qad.init(t);
					}) : console.error('No find type: '+type));
				}
			}
		}
	}
};
if (!window.onerror)
	window.onerror = Qad.debug().error;
window.addEventListener('load',function() {
	if (!navigator.cookieEnabled && location.origin != 'file://' && location.origin.indexOf('chrome-extension')==-1)
		return (location.href = '/?browser');
	var locarray = location.href.split('#')[0].replace(location.search,'').split('/');
	location.file = (locarray[(locarray.length-1)]?locarray[(locarray.length-1)]:'index.html');
	if (location.file.slice(-1) == '?')
		location.file = location.file.slice(0,-1);
	delete locarray[(locarray.length-1)];
	if (location.file.indexOf('.') == -1 && location.pathname != '/') {
		location.pathname += '/';
		return;
	}
	location.pwd = locarray.join('/').slice(0,-1);
	location.qr = 'https://chart.googleapis.com/chart?chs=177x177&cht=qr&chl='+encodeURIComponent(location.href)+'&chld=L|1&choe=UTF-8';
	if (Qad.$('meta[name="passport"]') && Qad.session.get('passport::'+Qad.$('meta[name="passport"]').content.split(',')[2])) {
		Qad.passport = JSON.parse(decodeURIComponent(Qad.session.get('passport::'+Qad.$('meta[name="passport"]').content.split(',')[2])));
		if (!Qad.passport.type)
			Qad.passport.type = 1;
	}else
		Qad.passport.type = 0;
	if (Qad.$('meta[name="passport"]') && Qad.passport.type < Qad.$('meta[name="passport"]').content.split(',')[0]) {
		top.location.href = Qad.$('meta[name="passport"]').content.split(',')[1];
		return;
	}
	if (Qad.$()['actions'] && typeof($$actions)!='undefined')
		$$actions[Qad.$()['actions']]();
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	if (typeof(console) !=="undefined" && console.log)
		console.info("%c Сюда вставлять не что не надо, иначе откроете доступ к своему аккаунту!",'color:red;font-weight:bold;font-style:italic;font-size:16px;');
	if (Qad.$('html[data-clearcache]'))
		Qad.$('html[data-clearcache]').on('key', function(e) {
			if (e.ctrlKey && e.altKey && e.keyCode == 82) {
				alert('Server cache clear');
				Qad.fs.remove('style/');
				location.href = Qad.$('html[data-clearcache]').dataset.clearcache;
			}else if (e.ctrlKey && e.shiftKey && e.keyCode == 82)
				alert('Client cache clear');
		}, 'cache');
	if (Qad.$('link[rel="stylesheet/qad"]')) {
		if (!Qad.$('meta[name=theme-color]')) {
			color = Qad.$('/meta');
			color.name = 'theme-color';
			color.content = '#4285F4';
			Qad.$('head').add(color);
		}
		Qad.gencss();
	}else{
		if (Qad.$('body[data-sdk="webview"]') && Qad.$('link[href="../../data/qad/qad.css"]')) {
			Qad.$('link[href="../../data/qad/qad.css"]').rel = 'stylesheet/qad';
			Qad.gencss();
		}else if (Qad.$('link[rel="stylesheet"][data-qad]'))
			Qad.$('head').add(Qad.$('/style').attr('id', 'theme-color').css({
				':root': {
					'--color': (Qad.$('meta[name=theme-color]').content || '#4285F4')+' !important'
				}
			}));
	}
	Qad.init();
	inc = document.querySelectorAll('#button-float button');
	if (inc.length > 0) {
		document.onkeydown = function(e) {
			var key = e.which || e.keyCode;
			for (var i = 0; i < inc.length; i++) {
				if (inc[i].id == 'add' && e.ctrlKey && key == 65 && !Qad.$('textarea:focus') && !Qad.$('input[type="text"]:focus')) {
					inc[i].click();
					e.preventDefault();
				}else if (inc[i].id == 'create' && e.ctrlKey && key == 65 && !Qad.$('textarea:focus') && !Qad.$('input[type="text"]:focus')) {
					inc[i].click();
					e.preventDefault();
				}else if (inc[i].id == 'save' && e.ctrlKey && key == 83) {
					inc[i].click();
					e.preventDefault();
				}else if (inc[i].id == 'send' && e.ctrlKey && key == 13) {
					inc[i].click();
					e.preventDefault();
				}else if (key == 112) {
					console.log('help');
					e.preventDefault();
				}
			}
		}
	}
	if (Qad.$('meta[name="analytics"]')) {
		if (!Qad.$('script[data-analytics]'))
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
		if (typeof(ga) == 'function') {
			ga('create', Qad.$('meta[name="analytics"]').content, 'auto');
			ga('send', 'pageview');
		}
		/*
		if (Qad.$('meta[name="analytics-ya"]'))
			(function (d, w, c) {
				(w[c] = w[c] || []).push(function() {
					try {
						w['yaCounter'+Qad.$('meta[name="analytics-ya"]').content] = new Ya.Metrika2({
							id: Qad.$('meta[name="analytics-ya"]').content,
							clickmap: true, trackLinks: true, accurateTrackBounce: true, trackHash: true
						});
					} catch(e) {}
				});
				var n = d.getElementsByTagName("script")[0],
				s = d.createElement('script'),
				f = function () { n.parentNode.insertBefore(s, n); };
				s.type = 'text/javascript';
				s.async = true;
				s.src = 'https://mc.yandex.ru/metrika/tag.js';
				((w.opera == "[object Opera]") ? d.addEventListener('DOMContentLoaded', f, false) : f());
			})(document, window, 'yandex_metrika_callbacks2');
		*/
	}
	if (Qad.$('meta[name="gtm"]'))
		(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',Qad.$('meta[name="gtm"]').content);
	if (Qad.$('html').lang) {
		document.translate = function() {
			if (Qad.$('#google_translate') && Qad.$('#google_translate').$() == '')
				Qad.$('#google_translate').$('&#xE8E2').attr('class','material-icons');
			Qad.for('.material-icons', function(el) {
				el.classList.add('notranslate');
			});
			if (Qad.$('footer'))
				Qad.$('footer').classList.add('notranslate');
			if (Qad.$('html').lang != navigator.language && !Qad.session.get('googtrans'))
				Qad.session.set('googtrans', '/'+Qad.$('html').lang+'/'+navigator.language);
			new google.translate.TranslateElement({
				pageLanguage: Qad.$('html').lang,
				layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
				gaTrack: true,
				gaId: Qad.$('meta[name="analytics"]').content
			}, 'google_translate');
			setTimeout(function() {
				if (!Qad.$('iframe.goog-te-menu-frame'))
					return;
				var color = Qad.$('meta[name="theme-color"]').content;
				Qad.$('iframe.goog-te-menu-frame').css({
					position: 'absolute',
					'max-width': '100%',
					'margin-top': '10px',
					'border-radius': '0.125rem',
					'box-shadow': '0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.2),0 1px 5px 0 rgba(0,0,0,.12)'
				});
				Qad.$('iframe.goog-te-menu-frame body').add($('/style').attr('id', 'theme-color').css({
					':root': {
						'--color': color
					}
				}));
				Qad.$('iframe.goog-te-menu-frame body').add($('/style').css({
					'::-webkit-scrollbar': {
						width: '5px',
						height: '5px'
					},
					'::-webkit-scrollbar-thumb': {
						background: 'var(--color)',
						'border-radius': '10px'
					},
					'.goog-te-menu2': {
						height: 'auto !important',
						border: '1px solid #ccc',
						'max-width': '100%',
						'overflow-x': 'auto'
					},
					'.goog-te-menu2-item div, .goog-te-menu2-item:link div': {
						color: 'var(--color)'
					},
					'.goog-te-menu2-item:hover div': {
						background: 'var(--color)',
						color: 'fff'
					}
				}));
			}, 1000);
		}
		Qad.$('head').add($('/script').attr('src', '//translate.google.com/translate_a/element.js?cb=document.translate'));
	}
	if (Qad.$('.ads'))
		Qad.ads();
	if (navigator.serviceWorker && !Qad.$('html[dev]')) {
		navigator.serviceWorker.register('/service-worker.js?'+location.pathname, {scope: location.pathname}).then(function(_sw) {
			console.log('◕‿◕', _sw.status = (_sw.installing ? 'installing' : (_sw.waiting ? 'installed' : (_sw.active ? 'active' : 'hmmm'))));
			Qad.sw = _sw;
			if (typeof(sw) == 'function')
				sw(_sw);
			if ((navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i)) && Qad.$('[rel="icon"]') && Qad.$('footer') && (localStorage.getItem('qad_notification-bookmark-ios_'+location.pathname.split('/').slice(0, -1).join('_')) != 'true'))
				Qad.$('footer').find('next').add(Qad.$('/div').attr('id', 'notification-bookmark-ios').add([
					Qad.$('/div').$('<img src="'+Qad.$('[rel="icon"]').href+'" /><b>Установить приложение</b>:<br> Нажмите сохранить, затем <br> <b>"На экран Домой"</b>').add([
						Qad.$('/span').$('X').on('click', function() {
							Qad.$('#notification-bookmark-ios').remove();
							localStorage.setItem('qad_notification-bookmark-ios_'+location.pathname.split('/').slice(0, -1).join('_'), 'true');
						})
					])
				]), true);
		}, function() {
			console.log('ಠ_ಠ');
		});
	}else if (Qad.$('html[dev]') && Qad.$()['dev'])
		new Function('return '+decodeURIComponent(Qad.$()['dev']))();
	if (typeof(main) == 'function')
		main();
	if (typeof(open) == 'function') {
		if (Qad.$()['tab'])
			Qad.init('nav.tabs',Qad.$()['tab']);
		else if (Qad.$('nav.tabs a.active'))
			Qad.init('nav.tabs',Qad.$('nav.tabs a.active').href.split('#')[1]);
	}
	if (Qad.$('iframe.load') && typeof(load) == 'function') {
		load(Qad.$('iframe.load body').innerHTML);
		Qad.$('iframe.load').onload = function() {
			load(Qad.$('iframe.load body').innerHTML);
			if (Qad.$('header + .clear:not(.onload)'))
				Qad.$('header + .clear:not(.onload)').classList.add('onload');
		}
	}
	Qad.for('a[target="_blank"]', function(el) {
		el.rel = 'noopener';
	});
	window.ononline();
	if (Qad.$('header + .clear:not(.onload)')) {
		Qad.$('header + .clear:not(.onload)').classList.add('onload');
		Qad.$('body').classList.add('onload');
	}
});
window.addEventListener('message',function(e) {
	var d;
	if (typeof(e.data) == 'string' && (e.data.slice(0,1) == '[' || e.data.slice(0,1) == '{' || e.data.slice(0,2) == ' {'))
		d = Qad.json(e.data);
	else
		d = e.data;
	if (d.callback && typeof(window[d.callback]) == 'function')
		window[d.callback](d,e);
	else if (typeof(message) == 'function')
		message(d,e);
});
window.addEventListener('popstate', function(e) {
	Qad.api.clear();
	if (typeof(ajax) == 'function') {
		if (Qad.$('dialog[open]')) {
			if (history.url)
				history.pushState(null, null, history.url);
			Qad.$('dialog[open]').close();
		}else{
			ajax();
			if (Qad.$('.ads'))
				Qad.ads();
			history.url = e.srcElement.location.href;
		}
	}
});
window.onscroll = function() {
	Qad.for('[data-effect]:not([data-preloadeffect])',function(el) {
		//var scroll = document.documentElement.clientHeight + document.body.scrollTop - Qad.$(el).pos().top;
		var scroll = document.documentElement.clientHeight + window.scrollY - Qad.$(el).pos().top;
		if (-50 < scroll && 50 > scroll && Qad.$(el).pos().top > document.documentElement.clientHeight) {
			Qad.$(el).attr('data-preloadeffect',Qad.$(el).attr('data-effect'));
			Qad.$(el).attr('data-effect',false);
			setTimeout(function() {
				Qad.$('[data-preloadeffect]:not([data-effect])').attr('data-effect',Qad.$('[data-preloadeffect]:not([data-effect])').attr('data-preloadeffect'));
			}, 1)
		}
	});
	Qad.for('header.tabs nav.tabs a', function(el) {
		var id = el.href.replace(location.href, '');
		if (id == '#')
			id = '';
		//if (document.body.scrollTop == 0 && ((id == '') || ((location.file == 'index.html') && (id == '?index')))) {
		if (window.scrollY == 0 && ((id == '') || ((location.file == 'index.html') && (id == '?index')))) {
			if (Qad.$('header.tabs nav.tabs a.active'))
				Qad.$('header.tabs nav.tabs a.active').classList.remove('active');
			el.classList.add('active');
		}else if (id.slice(0, 1) == '#' && Qad.$(id)) {
			//var scroll = document.body.scrollTop + Qad.$('header').pos().height;
			var scroll = window.scrollY + Qad.$('header').pos().height;
			if (((scroll + 54) >= Qad.$(id).pos().top) && ((Qad.$(id).pos().top  + Qad.$(id).pos().height >= scroll))) {
				if (Qad.$('header.tabs nav.tabs a.active'))
					Qad.$('header.tabs nav.tabs a.active').classList.remove('active');
				el.classList.add('active');
			}
		}
	});
	if (Qad.$('.parallax img'))
		Qad.init('.parallax img');
}
window.ononline = window.onoffline = function() {
	Qad.for('[data-online]', function(el) {
		el.hidden = !navigator.onLine;
	});
	Qad.for('[data-offline]', function(el) {
		el.hidden = navigator.onLine;
	});
	if (typeof(navigator.upOnline) == 'function') {
		navigator.upOnline();
		delete navigator.upOnline;
	}
}
if (!Qad.$('html[qad-noglobal]')) {
	var $$ = Qad,
		$ = $$.$;
}
