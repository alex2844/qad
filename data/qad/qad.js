/*
=====================================================
Qad Framework (qad.js)
-----------------------------------------------------
https://qwedl.com/
-----------------------------------------------------
Copyright (c) 2016-2017 Alex Smith
=====================================================
*/
var Qad={
	dev: false,
	event: {},
	passport: {},
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
				if (el.indexOf('/') == 0) {
					if (el == '/svg')
						return Qad.$(document.createElementNS('http://www.w3.org/2000/svg','svg'));
					else
						return Qad.$(document.createElement(el.slice(1)));
				}else if (el.indexOf('iframe') != -1) {
					iframe = el.split(' ');
					if (iframe.length > 1 && document.querySelector(iframe[0]))
						return Qad.$(document.querySelector(iframe[0]).contentDocument.querySelector(el.replace(iframe[0]+' ','')));
				}else if (el.slice(0,1) == '$') {
					el = el.slice(1).split('->');
					var forms = document.forms;
					for (var i in el)
						forms = forms[el[i]];
					return Qad.$(forms);
				}
				obj = document.querySelector(el);
			}else
				obj = el;
		}else{
			var vars = {};
			var parts = location.search.replace(/[?&]+([^=&]+)([^&]*)/gi, function(m,key,value) {
				vars[key] = (value.slice(0, 1) == '=' ? value.slice(1) : value);
			});
			return vars;
		}
		if (obj==null)
			return false;
		obj.add = function(el) {
			obj.appendChild(el);
			return el;
		}
		obj.empty = function() {
			obj.classList.remove('template');
			obj.value = null;
			obj.innerHTML = null;
			return;
		}
		obj.attr = function(key, value) {
			if (typeof(value) == 'boolean' && value == false)
				obj.removeAttribute(key);
			else if (typeof(value) == 'undefined')
				return obj.getAttribute(key);
			else
				obj.setAttribute(key,value);
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
					obj.addEventListener('scroll', e => {
						e.top = document.body.scrollTop;
						e.down = document.body.scrollHeight - (document.documentElement.clientHeight + document.body.scrollTop);
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
			Object.assign(obj.style, style);
			return obj;
		}
		obj.template = function(d,t) {
			var key = function(d,key) {
				if (t && key)
					d[key] = JSON.parse(d[key]);
				$key = (key ? d[key] : d);
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
				Qad.for(obj.querySelectorAll('[data-action][data-on]'), el => {
					el.attr('data-on', false);
				});
				obj.shab = obj.innerHTML.replace(/data-src/g,'src');
			}
			obj.innerHTML = '';
			if (d.response)
				key(d);
			else if (Object.keys(d).length > 0)
				for (k in d)
					key(d,k);
			else
				return false;
			if (obj.tagName == 'DIV' || obj.tagName == 'ARTICLE')
				obj.style['display'] = 'block';
			else
				obj.style['display'] = 'table-row-group';
			return true;
		}
		obj.find = function(e, all) {
			if (all) {
				all = [];
				obj.querySelectorAll(e).forEach(el => {
					all.push(Qad.$(el));
				});
				return all;
			}else
				return Qad.$(obj.querySelector(e));
			return (all ? obj.querySelectorAll(e) : Qad.$(obj.querySelector(e)));
		}
		obj.parent = Qad.$(obj.parentNode);
		if (typeof HTMLDialogElement != 'function' && obj.tagName == 'DIALOG' && !obj.hasAttribute('role'))
			dialogPolyfill.registerDialog(obj);
		return obj;
	},
	loop: (callback, params, time, loop, force_start) => {
		var e = null;
		(p => {
			if (loop == false)
				setTimeout(() => callback(p), time);
			else{
				e = setInterval(() => callback(p, () => clearInterval(e)), time);
				if (force_start != false)
					callback(p, () => clearInterval(e));
			}
		})(params);
	},
	clipboard: i => {
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
		if (file.substr(0, 4) != 'http') {
			var type = 'text';
			file = URL.createObjectURL(
				new Blob([file], {
					type: (type ? type : 'text/plain')
				})
			);
		}
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
	json: function(data, url) {
		if (typeof(data) == 'string')
			data = JSON.parse(data);
		else if (typeof(data) == 'object')
			data = (url 
				?
					decodeURIComponent(Object.keys(data).map(k => {
						return encodeURIComponent(k)+'='+encodeURIComponent(data[k])
					}).join('&'))
				:
					JSON.stringify(data)
			);
		return data;
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
	geo: {
		id: {},
		key: null,
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
			if (typeof(google) == 'undefined' || typeof(google.maps) == 'undefined') {
				s = Qad.$('/script');
				s.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=places&callback=document.me'+(this.key ? '&key='+this.key : '');
				Qad.$('body').add(s);
			}else
				document.me();
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
		maps: function(address,zoom,id,callback) {
			document.maps = function() {
				var geocoder = new google.maps.Geocoder();
				var map = new google.maps.Map((id?Qad.$('#'+id):Qad.$('#map')), {
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
					geocoder.geocode({'address': address}, function(results, status) {
						if (status == google.maps.GeocoderStatus.OK) {
							if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
								map.setCenter(results[0].geometry.location);
								lat = results[0].geometry.location.lat().toString();
								lng = results[0].geometry.location.lng().toString();
								var marker = new google.maps.Marker({
									position: results[0].geometry.location,
									map: map,
									title: address
								});
								google.maps.event.addListener(marker, 'click', function() {
									window.open('https://www.google.ru/maps/place/'+lat+','+lng+'/@'+lat+','+lng+','+zoom+'z/');
								});
							}else{
								console.log('No results found');
							}
						}else{
							console.log('Geocode was not successful for the following reason: '+status);
						}
					});
				if (typeof(callback) == 'function')
					callback();
			}
			if (typeof(google) == 'undefined' || typeof(google.maps) == 'undefined') {
				s = Qad.$('/script');
				s.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=places&callback=document.maps'+(this.key ? '&key='+this.key : '');
				Qad.$('body').add(s);
			}else
				document.maps();
		}
	},
	rand: (min, max) => {
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
			rr=Number(data)./*toFixed(0).*/toString().split('.');
			b=rr[0].replace(/(\d{1,3}(?=(\d{3})+(?:\.\d|\b)))/g,'\$1 ');
			data=(rr[1]?b+'.'+rr[1]:b);
		}else if (type == 'byte' && !isNaN(data)) {
			if(data == 0)
				return '0 Byte';
			if (!add)
				add = ['B','KB','MB','GB','TB','PB','EB','ZB','YB'];
			var i = Math.floor(Math.log(data) / Math.log(1000));
			return (data/Math.pow(1000,i)).toPrecision(3)+' '+add[i];
		}else
			return data;
		if (add)
			data += ' '+add;
		return data;
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
	up: function(id) {
		var w = window.pageYOffset,
			t = Qad.$((id ? '#'+id : 'body')).getBoundingClientRect().top,
			start = null;
		if (id) {
			if (Qad.$('header')) {
				if (Qad.$('header').pos().height == 299)
					t -= 110;
				else
					t -= Qad.$('header').pos().height;
			}
			if (Qad.$('header nav.tabs') && !Qad.$('header[data-effect]'))
				t -= Qad.$('nav.tabs').pos().height+5;
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
		set: function(key,value,cookie) {
			if (!value)
				document.cookie = key+'=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
			else if (cookie) {
				var expires = new Date();
				expires.setTime(expires.getTime()+(1*24*60*60*1000));
				document.cookie = key+'='+value+';path=/'+';expires='+expires.toUTCString();
			}else
				document.cookie = key+'='+value+';path=/'+';expires=0';
		},
		get: function(key) {
			var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
			return keyValue ? keyValue[2] : null;
		}
	},
	load: function(params) {
		if (!$('iframe.load'))
			return;
		if (typeof(params) != 'string')
			params = Qad.json(params, true);
		Qad.$('.load').src = 'server.php?'+params;
	},
	api: function(method, params, callback) {
		if (method.indexOf('googleapis.com') != -1)
			provider = 'google';
		else if (method.indexOf('graph.facebook.com') != -1)                                                                    
            provider = 'facebook';
		else if (method.indexOf('api.vk.com') != -1)                                                                    
            provider = 'vk';
		else
			provider = 'default';
		if (!params)
			params = {}
		params.callback = 'document.api.callback';
		document.api = {};
		document.api.method = method;
		document.api.callback = (callback ? callback : () => {});
		Qad.session.set('oauth-scope',null);
		Qad.session.set('oauth-redirect',null);
		document.api.oauth = function() {
			Qad.session.set('oauth-token-'+provider,null);
			Qad.session.set('oauth-scope',params.scope);
			location.href = params.base+'?method='+provider+'&oauth-redirect='+location.href;
		};
		if (Qad.session.get('oauth-token-'+provider))
			params.access_token = Qad.session.get('oauth-token-'+provider);
		var script = Qad.$('/script');
		script.src = method+'?'+Qad.json(params, true);
		Qad.$('head').add(script);
	},
	speech: function(e) {
		if (typeof(Qad.rec) == 'undefined') {
			Qad.rec = new webkitSpeechRecognition();
			Qad.rec.lang = navigator.language;
			Qad.rec.start();
			Qad.rec.onresult = function(event) {
				Qad.$(e).parent.find('input').value = event['results'][0][0]['transcript'];
			}
			Qad.rec.onstart = function() {
				Qad.$(e).style['color'] = '#F44336';
			}
			Qad.rec.onend = function() {
				Qad.$(e).style['color'] = '#757575';
				delete Qad.rec;
			}
		}else
			Qad.rec.stop();
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
		accept: null,
		style: 'min-height:150px;width:98%;margin-left:5px',
		upload: function(id) {
			if (!id || id == 'null')
				id = Qad.code.id;
		    Qad.$('iframe[data-code='+id+']').contentWindow.focus();
		    if (Qad.$('#'+id+' form').action) {
		        if (!Qad.$('iframe[name=file]')) {
		            file = Qad.$('/iframe');
		            file.name = 'file';
		            file.style['display'] = 'none';
		            Qad.$('body').add(file);
		        }
		        Qad.$('iframe[name=file]').onload = function() {
                    if (!Qad.$('iframe[name=file] body').$())
                        return;
					Qad.$('iframe[data-code='+id+']').contentWindow.document.execCommand('insertHTML', false, '<img src="'+Qad.$('iframe[name=file] body').$()+'" style="max-width: 100%" />');
                    //Qad.$('iframe[data-code='+id+']').contentWindow.document.execCommand('insertImage', false, Qad.$('iframe[name=file] body').$());
                }
                Qad.$('#'+id+' form').submit();
		    }else{
    		    files = window.event.target.files;
    		    for (var i = 0, f; f = files[i]; i++) {
                    var reader = new FileReader();
                    t = f;
                    reader.onload = function(e) {
                        if (t.type.match('image.*'))
                            Qad.$('iframe[data-code='+id+']').contentWindow.document.execCommand('insertHTML', false, '<img src="'+e.target.result+'" style="max-width: 100%" />');
                            //Qad.$('iframe[data-code='+id+']').contentWindow.document.execCommand('insertImage', false, e.target.result);
                        else
                            Qad.$('iframe[data-code='+id+']').contentWindow.document.execCommand('insertHTML', false, '<a href="'+e.target.result+'" download="'+escape(t.name)+'"><li><strong>'+escape(t.name)+'</strong> ('+(t.type ? t.type : 'n/a')+') - '+t.size+' ('+t.lastModifiedDate.toLocaleDateString()+')</li></a>');
                    }
                    reader.readAsDataURL(f);
    		    }
		    }
		},
		html: function() {
			Qad.$('textarea[name='+Qad.code.id+']').hidden = (Qad.$('textarea[name='+Qad.code.id+']').hidden ? false : true);
			Qad.$('iframe[data-code='+this.id+']').hidden = (Qad.$('iframe[data-code='+this.id+']').hidden ? false : true);
			Qad.$('iframe[data-code='+this.id+'] body').$(Qad.$('textarea[name='+Qad.code.id+']').$());
		},
		format: function(type,attr,nofocus) {
            if (!nofocus)
			    Qad.$('iframe[data-code='+this.id+']').contentWindow.focus();
            Qad.$('iframe[data-code='+this.id+']').contentWindow.document.execCommand(type, null, attr);
		},
		text: function() {
            Qad.$('textarea[name='+Qad.code.id+']').value = Qad.$('iframe[data-code='+Qad.code.id+'] body').$();
		},
		focus: function(id, force) {
			if (force) {
				Qad.code.id = id.name;
				Qad.$('iframe[data-code='+code.id+']').contentWindow.focus();
			}else
				Qad.code.id = id;
		},
		button: function() {
		    return '\
                '+(this.file ? '<label>\
                    <i class="material-icons">attach_file</i>\
                    <form target="file" method="post" '+(this.file==true ? '' : 'action="'+this.file+'"')+' enctype="multipart/form-data" hidden>\
                        <input type="file" name="upload" onchange="Qad.code.upload(\''+this.id+'\')" '+(this.accept ? 'accept="image/*"' : '')+' style="width:0px;padding:0;border:0;overflow:hidden;" />\
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
                <i onclick="Qad.code.format(\'bold\')" class="material-icons">format_bold</i>\
                <i onclick="Qad.code.format(\'italic\')" class="material-icons">format_italic</i>\
                <i onclick="Qad.code.format(\'underline\')" class="material-icons">format_underlined</i>\
                <i onclick="Qad.code.format(\'justifyRight\')" class="material-icons">format_align_right</i>\
                <i onclick="Qad.code.format(\'justifyCenter\')" class="material-icons">format_align_center</i>\
                <i onclick="Qad.code.format(\'justifyLeft\')" class="material-icons">format_align_left</i>\
                <i onclick="Qad.code.html()" class="material-icons">code</i>\
            ';
        },
		init: function(o) {
		    for (k in o)
		        this[k] = o[k];
		    html = Qad.$(this.el).$();
		    this.id = Qad.$(this.el).id;
            Qad.$(this.el).$((this.button ? '<h2>'+this.button()+'</h2><br />' : '' )+'<iframe onmouseover="Qad.code.focus(\''+this.id+'\')" onmouseout="Qad.code.text(\''+this.id+'\')" frameborder="no" style="'+this.style+'" data-code="'+this.id+'"></iframe><br /><textarea name="'+this.id+'" style="margin-top:-10px;'+this.style+'" hidden>'+html+'</textarea>');
            Qad.$('iframe[data-code="'+this.id+'"]').contentDocument.open(); 
            Qad.$('iframe[data-code="'+this.id+'"]').contentDocument.write(html); 
            Qad.$('iframe[data-code="'+this.id+'"]').contentDocument.close();
            Qad.$('iframe[data-code="'+this.id+'"]').contentDocument.designMode = 'on';
            Qad.$('iframe[data-code='+this.id+'] body').onblur = Qad.code.text;
		}
	},
	slider: {
		src: [],
		frame: 0,
		el: null,
		time: null,
		callback: null,
		set: function(image) {
			if (Qad.$(this.el).tagName == 'IMG')
				Qad.$(this.el).src = image;
			else
				Qad.$(this.el).style['background-image'] = "url("+image+")";
			if (this.callback)
				this.callback(this.frame);
		},
		init: function() {
			if (!this.src && !this.el)
				return;
			this.set(this.src[this.frame]);
			if (this.time)
				this.time = setInterval(function() {
					Qad.slider.next();
				},this.time);
		},
		prev: function() {
			this.frame--;
			if(this.frame < 0)
				this.frame = this.src.length-1;
			this.set(this.src[this.frame]);
		},
		next: function() {
			this.frame++;
			if(this.frame == this.src.length)
				this.frame = 0;
			this.set(this.src[this.frame]);		
		}
	},
	player: {
		playlist: null,
		id: null,
		type: null,
		init: function() {
			if (!this.playlist || !this.type) {
				console.log('error');
				return false;
			}
			if (this.player) {
				return false;
			}
			if (this.type == 'audio')
				html = '<div class="progress"><input type="range" class="progress" /><progress></progress></div><button class="material-icons">play_arrow</button><h1></h1><h2></h2><span></span><audio></audio>';
			if (Qad.$('#player'))
				Qad.$('#player').$(html);
			else
				Qad.$('body').$('+<div id="player">'+html+'</div>');
			if (this.button)
				for (key in this.button)
					Qad.$('#player span').$('+<i class="material-icons" id="'+key+'" onclick="'+this.button[key]+'">'+key+'</span>');
			if (this.type == 'audio')
				this.player = Qad.$('#player audio');
			Qad.$('#player').style['display'] = 'inline-flex';
			Qad.$('body').style['padding-bottom'] = '100px';
			Qad.$('#player input').onchange = function() {
				Qad.$('#player progress').value = this.value;
				Qad.player.player.currentTime = this.value;
			}
			Qad.$('#player button').onclick = function() {
				if (Qad.$('#player button').$() == 'pause') {
					Qad.player.player.pause();
					Qad.$('#player button').$('play_arrow');
				}else{
					Qad.player.player.play();
					Qad.$('#player button').$('pause');
				}
			}
			this.player.ontimeupdate = function(){
				Qad.$('#player progress').value = this.currentTime;
				if (this.currentTime == this.duration) {
					Qad.$('#player button').$('play_arrow');
					Qad.player.next();
				}
			}
			this.player.autobuffer = 'true';
		},
		play: function() {
			if (!this.id)
				this.id = 0;
			Qad.$('#player h1').$(this.playlist[this.id].title);
			Qad.$('#player h2').$(this.playlist[this.id].artist);
			Qad.$('#player input').value = 0;
			Qad.$('#player progress').value = 0;
			Qad.$('#player input').max = this.playlist[this.id].duration;
			Qad.$('#player progress').max = this.playlist[this.id].duration;
			Qad.$('#player button').$('pause');
			this.player.src = this.playlist[this.id].url;
			this.player.play();
			if (Qad.$('[data-playlist="'+this.id+'"] .play')) {
				if (Qad.$('[data-playlist] .play.active')) {
					Qad.$('[data-playlist] .play.active').innerHTML = 'play_circle_outline';
					Qad.$('[data-playlist] .play.active').classList.remove('active');
				}
				Qad.$('[data-playlist="'+this.id+'"] .play').innerHTML = 'pause_circle_filled';
				Qad.$('[data-playlist="'+this.id+'"] .play').classList.add('active');
			}
		},
		prev: function() {
			if (this.player.currentTime<3 && Number(this.id)-1 != -1)
				this.id = Number(this.id)-1;
			if (this.playlist[this.id].url)
				this.play();
		},
		next: function() {
			if (Number(this.id)+1 != this.playlist.length)
				this.id = Number(this.id)+1;
			else
				this.id = 0;
			if (this.playlist[this.id].url)
				this.play();
			else
				this.next();
		}
	},
	notification: function(title,time,logo) {
		if ("Notification" in window) {
			Notification.requestPermission(function (permission) {
				if (permission === "granted") {
					if (!logo && Qad.$('link[rel="icon"]'))
						logo = Qad.$('link[rel="icon"]').href;
					var notification = {
						body: (typeof(title)!='string'?title.body:''),
						icon: logo,
						dir: 'auto',
						actions: (typeof(title)!='string'?title.actions:[])
					}
					if (document.sw)
						document.sw.showNotification((typeof(title)=='string'?title:title.title),notification);
					else
						new Notification((typeof(title)=='string'?title:title.title),notification);
				}
			});
		}
		if (Qad.$$('div#notification').length == 2)
			Qad.for('div#notification', function(el) {
				clearTimeout(el.time);
				el.remove();
			});
		var div = Qad.$('/div');
		div.id = 'notification';
		div.innerHTML = (typeof(title)=='string'?title:title.title);
		div.style['margin-bottom'] = 60*(Qad.$$('#notification').length)+20+'px';
		if (typeof(title) == 'object') {
			for (key in title.actions)
				if (title.actions[key]['title']) {
					var span = Qad.$('/span');
					span.onclick = actions[title.actions[key].action];
					span.innerHTML = title.actions[key].title;
					div.appendChild(span);
				}
		}
		Qad.$('body').add(div);
		if (time) {
			div.time = setTimeout(function() {
				div.remove();
				//Qad.$('#notification').remove();
			},time);
		}
		console.log("%c"+(typeof(title)=='string'?title:title.title),'color:DodgerBlue;font-weight:bold;');
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
	gencss: function(css,file) {
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
			var style;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', Qad.$('link[rel="stylesheet/qad"]').href);
			xhr.onload = function () {
				console.log(Qad.$('link[rel="stylesheet/qad"]'));
				style = xhr.responseText;
				if (location.origin == 'file://')
					style = style.replace(/\@location/g,location.href.split('/page')[0]);
				else if (Qad.$('link[rel="stylesheet/qad"]').href.indexOf('master') != -1)
					style = style.replace(/\@location/g,Qad.$('link[rel="stylesheet/qad"]').href.split('data')[0]);
				else
					style = style.replace(/\@location/g,Qad.$('link[rel="stylesheet/qad"]').href.split('data')[0]);
				var parts = style.replace(/@(.*?): (.*?);/gim, function(m,key,value) {
					style = style.replace('@'+key+': '+value+';','');
					if (value.indexOf('meta.') != -1)
						value = Qad.$('meta[name="'+value.replace('meta.','')+'"]').content;
					else if (value.indexOf('data-') != -1)
						value = Qad.$('body').getAttribute(value);
					style = style.replace(new RegExp('@'+key, 'g'), value);
				});
				style = Qad.compiler.css(style);
				if (!window.requestFileSystem) {
					add = Qad.$('/style');
					add.innerHTML = style;
					Qad.$('head').add(add);
				}else
					Qad.fs.add('style/'+css+'.css',style,function(e) {
						setTimeout(function() {
							Qad.$('link[rel="stylesheet/qad"]').href = e.toURL;
							Qad.$('link[rel="stylesheet/qad"]').rel = 'stylesheet';
						},500);
					},null,function(){
						add = Qad.$('/style');
						add.innerHTML = style;
						Qad.$('head').add(add);
					});
			}
			xhr.onerror = function() {
				Qad.$('link[rel="stylesheet/qad"]').rel = 'stylesheet';
			}
			xhr.send();
		}
		Qad.fs.exist('style/'+css+'.css',function(e){
			Qad.$('link[rel="stylesheet/qad"]').href = e.toURL();
			Qad.$('link[rel="stylesheet/qad"]').rel = 'stylesheet';
		},style);
	},
	md5: function(s) {
		var binl_md5 = function(x, len) {
			var bit_rol = function(num, cnt) {
				return (num << cnt) | (num >>> (32 - cnt));
			}
			var md5_cmn = function(q, a, b, x, s, t) {
				return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
			}
			var md5_ff = function(a, b, c, d, x, s, t) {
				return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
			}
			var md5_gg = function(a, b, c, d, x, s, t) {
				return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
			}
			var md5_hh = function(a, b, c, d, x, s, t) {
				return md5_cmn(b ^ c ^ d, a, b, x, s, t);
			}
			var md5_ii = function(a, b, c, d, x, s, t) {
				return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
			}
			var safe_add = function(x, y) {
				var lsw = (x & 0xFFFF) + (y & 0xFFFF);
				var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
				return (msw << 16) | (lsw & 0xFFFF);
			}
			x[len >> 5] |= 0x80 << ((len) % 32);
			x[(((len + 64) >>> 9) << 4) + 14] = len;
			var a =  1732584193;
			var b = -271733879;
			var c = -1732584194;
			var d =  271733878;
			for(var i = 0; i < x.length; i += 16) {
				var olda = a;
				var oldb = b;
				var oldc = c;
				var oldd = d;
				a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
				d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
				c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
				b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
				a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
				d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
				c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
				b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
				a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
				d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
				c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
				b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
				a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
				d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
				c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
				b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);
				a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
				d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
				c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
				b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
				a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
				d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
				c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
				b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
				a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
				d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
				c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
				b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
				a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
				d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
				c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
				b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);
				a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
				d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
				c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
				b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
				a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
				d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
				c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
				b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
				a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
				d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
				c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
				b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
				a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
				d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
				c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
				b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);
				a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
				d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
				c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
				b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
				a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
				d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
				c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
				b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
				a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
				d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
				c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
				b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
				a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
				d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
				c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
				b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);
				a = safe_add(a, olda);
				b = safe_add(b, oldb);
				c = safe_add(c, oldc);
				d = safe_add(d, oldd);
			}
			return Array(a, b, c, d);
		}
		var str2rstr_utf8 = function(input) {
			var output = "";
			var i = -1;
			var x, y;
			while(++i < input.length) {
				x = input.charCodeAt(i);
				y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
				if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
					x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
					i++;
				}
				if(x <= 0x7F)
					output += String.fromCharCode(x);
				else if(x <= 0x7FF)
					output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F), 0x80 | ( x & 0x3F));
				else if(x <= 0xFFFF)
				output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F), 0x80 | ((x >>> 6 ) & 0x3F), 0x80 | ( x & 0x3F));
				else if(x <= 0x1FFFFF)
					output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07), 0x80 | ((x >>> 12) & 0x3F), 0x80 | ((x >>> 6 ) & 0x3F), 0x80 | (x & 0x3F));
			}
			return output;
		}
		var rstr2binl = function(input) {
			var output = Array(input.length >> 2);
			for(var i = 0; i < output.length; i++)
				output[i] = 0;
			for(var i = 0; i < input.length * 8; i += 8)
				output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (i%32);
			return output;
		}
		s = str2rstr_utf8(s);
		s = binl_md5(rstr2binl(s), s.length * 8);
		var output = "";
		for(var i = 0; i < s.length * 32; i += 8)
			output += String.fromCharCode((s[i>>5] >>> (i % 32)) & 0xFF);
		s = output;
		hexcase = 0;
		var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
		var output = "";
		var x;
		for(var i = 0; i < s.length; i++) {
			x = s.charCodeAt(i);
			output += hex_tab.charAt((x >>> 4) & 0x0F) + hex_tab.charAt( x & 0x0F);
		}
		return output;
	},
	devtool: function(c) {
		var devtools = false;
		setInterval(function () {
			if ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) ||
				window.outerWidth - window.innerWidth > 160) {
				if (!devtools)
					c(true);
				devtools = true;
			}else{
				if (devtools)
					c(false);
				devtools = false;
			}
		}, 500);
		if (!window.devtools)
			c(devtools);
		window.devtools = devtools;
	},
	init: function(type, action) {
		switch (type) {
			case 'button#menu + nav': {
				if (Qad.$('html').pos().width > 1366)
					Qad.$('body').attr('data-menu',true);
				else{
					menu = function(e) {
						if (e.x > 300)
							Qad.$('button#menu').click();
					}
					Qad.$('button#menu').onclick = function() {
						$('nav').attr('style',false);
						if (Qad.$('body[data-menu]')) {
							Qad.$('body').attr('data-menu',false);
							Qad.$('html').on('mouse',null,'menu');
						}else{
							Qad.$('body').attr('data-menu',true);
							Qad.$('html').on('mouse',menu,'menu');
						}
					}
					Qad.$('html').on('swipe', function(e) {
						if (
							($(event.target) && $(event.target) === $('button#menu + nav')) ||
							($(event.target).parent && $(event.target).parent === $('button#menu + nav')) ||
							($(event.target).parent.parent && $(event.target).parent.parent === $('button#menu + nav')) ||
							($(event.target).parent.parent.parent && $(event.target).parent.parent.parent === $('button#menu + nav')) ||
							Qad.$('button#menu').disabled ||
							!Qad.$('button#menu + nav')
						)
							return;
						else if (e.swipe == 'move') {
							if (e.sx < 10 && e.sx > 0 && e.x >= 300 && !Qad.$('body[data-menu]')) {
								Qad.$('button#menu + nav').style['left'] = '0px';
								Qad.$('button#menu').click();
							}else if (e.x < 300 && (e.x - e.sx) > 50) {
								if (e.sx > 10 && !Qad.$('body[data-menu]'))
									return;
								Qad.$('button#menu + nav').style['display'] = 'block';
								Qad.$('button#menu + nav').style['left'] = (e.x-300)+'px';
							}else if (e.x < 300 && (e.x - e.sx) < 50)
								Qad.$('button#menu + nav').style['display'] = 'none';
						}else{
							if (e.sx < 50 && !Qad.$('body[data-menu]')) {
								if (e.x > 100)
									Qad.$('button#menu').click();
								else
									Qad.$('button#menu + nav').style['display'] = 'none';
							}else if (e.x < 300 && Qad.$('body[data-menu]'))
								Qad.$('button#menu').click();
						}
					});
					/* Qad.$('html').on('swipe', function(e){
						if (e.x<50 && e.swipe == 'right')
							Qad.$('button#menu').click();
					}); */
				}
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
						history.pushState(null, null, (s!='' ? s+'&' : '?')+'tab='+id);
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
				ul = function(e) {
					if (!Qad.$('ul[open]') || Qad.$('ul[open]').attr('for') == e.target.id)
						return;
					pos = Qad.$('ul[open]').pos();
					if ((e.y < pos.top || e.x < pos.left || e.y > pos.top+pos.height || e.x > pos.left+pos.width) && !Qad.$(e.target).attr('data-menu'))
						Qad.$('#'+Qad.$('ul[open]').attr('for')).click();
				}
				Qad.for(type, function(el) {
					if (el.tagName != 'UL')
						el.onclick = function(e) {
							if (Qad.$('ul[for='+el.id+']')) {
								if (Qad.$('ul[for='+el.id+']').style['display'] == 'block') {
									Qad.$('html').on('mouse',null,'ul');
									Qad.$('ul[for='+el.id+']').style['display'] = '';
									Qad.$('ul[for='+el.id+']').attr('open',false);
								}else{
									if (Qad.$('ul[open]'))
										Qad.$('#'+Qad.$('ul[open]').attr('for')).click();
									Qad.$('html').on('mouse',ul,'ul');
									Qad.$('ul[for='+el.id+']').style['display'] = 'block';
									Qad.$('ul[for='+el.id+']').attr('open',true);
								}
								e.preventDefault();
							}
						}
				});
				Qad.for('.menu *', function(el) {
					Qad.$(el).attr('data-menu',true);
				});
				break;
			}
			case 'ul.emoji': {
				if (navigator.userAgent.match(/Android/i))
					Qad.for('ul.emoji',function(el) {
						Qad.$('#'+Qad.$(el).attr('for')).remove();
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
						if (Qad.$('[data-emoji="'+Qad.$(el).attr('for')+'"]')) {
							Qad.$(el).$(emoji);
							el.onclick = function() {
								Qad.$('[data-emoji="'+Qad.$(this).attr('for')+'"]').$('~'+Qad.$(window.event.target).$());
							}
						}
					});
				}
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
				Qad.for(type, el => {
					var parent = el.parent.pos(),
						top = document.body.scrollTop,
						height = window.innerHeight;
					if (!(((top + height) >= parent.top) && ((parent.top  + parent.height >= top))))
						return;
					percent = (top + height - parent.top) / (parent.height + height);
					el.style.transform = 'translate3D(-50%,'+Math.round(((el.pos().height - parent.height) * percent))+'px, 0)';
				});
				break;
			}
			case '[data-action]': {
				Qad.for(type, e => {
					e.f = '_'+e.dataset.action;
					if (!e.dataset.on && typeof(window[e.f]) == 'function') {
						e.dataset.on = true;
						e.on('click', (ev) => {
							window[e.f](ev);
						}, 'action');
					}
				});
				break;
			}
			case 'dialog [data-close]': {
				Qad.for(type, e => {
					e.on('click', () => {
						e.closest('dialog').close();
					});
				});
				break;
			}
			case 'label.speech': {
				Qad.for(type, e => {
					if (e.speech)
						return;
					e.speech = true;
					console.log(e);
					var speech = Qad.$('/i');
					speech.onclick = Qad.speech;
					e.add(speech);
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
							setTimeout(() => {
								var i = 0;
								Qad.for('#fullpage .page', el => {
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
					Qad.$('#fullpage').addEventListener('touchstart', e => {
						sX = e.changedTouches[0].pageX;
						sY = e.changedTouches[0].pageY;
						stT = new Date().getTime();
					});
					Qad.$('#fullpage').addEventListener('touchmove', e => e.preventDefault());
					Qad.$('#fullpage').addEventListener('touchend', e => {
						var dY = e.changedTouches[0].pageY - sY;
						if (((new Date().getTime() - stT) <= 500) && (Math.abs(dY) >= 100 && Math.abs(e.changedTouches[0].pageX - sX) <= 50)) {
							e.key = (dY < 0 ? 'ArrowDown' : 'ArrowUp');
							fullpage(e);
						}
					});
					Qad.$('#fullpage').addEventListener('wheel', fullpage);
					if (Qad.$('#navpage input'))
						Qad.$('#navpage').on('click', e => {
							var i = 0;
							Qad.for('#navpage input', el => {
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
				Qad.for(type, el => {
					el.oncontextmenu = e => {
						e.preventDefault();
						var menu = Qad.$('menu[open]');
						var hide = () => {
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
						Qad.for(menu.querySelectorAll('menuitem'), item => {
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
			default: {
				console.error('No find type:' +type);
			}
		}
	}
};
/*
window.onpopstate = function() {
	location.reload();
}
*/
window.onerror = Qad.debug().error;
window.addEventListener('load',function() {
	if (!navigator.cookieEnabled && location.origin != 'file://' && location.origin.indexOf('chrome-extension')==-1) {
		location.href = '/?browser';
		return;
	}
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
	if (Qad.$()['actions'] && typeof(actions)!='undefined')
		actions[Qad.$()['actions']]();
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	if (typeof(console) !=="undefined" && console.log)
		console.info("%c Сюда вставлять не что не надо, иначе откроете доступ к своему аккаунту!",'color:red;font-weight:bold;font-style:italic;font-size:16px;');
	if (Qad.$('html[data-clearcache]'))
		Qad.$('html[data-clearcache]').on('key', (e) => {
			if (e.ctrlKey && e.altKey && e.keyCode == 82) {
				alert('Server cache clear');
				$$.fs.remove('style/');
				location.href = Qad.$('html[data-clearcache]').dataset.clearcache;
			}else if (e.ctrlKey && e.shiftKey && e.keyCode == 82)
				alert('Client cache clear');
		}, 'cache');
	if (Qad.$('button#menu + nav'))
		Qad.init('button#menu + nav');
	if (Qad.$('link[rel="stylesheet/qad"]')) {
		if (!Qad.$('meta[name=theme-color]')) {
			color = Qad.$('/meta');
			color.name = 'theme-color';
			color.content = '#4285F4';
			Qad.$('head').add(color);
		}
		Qad.gencss();
	}
	if (Qad.$('nav.tabs'))
		Qad.init('nav.tabs');
	if (Qad.$('.menu'))
		Qad.init('.menu');
	if (Qad.$('ul.emoji'))
		Qad.init('ul.emoji');
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
	if (Qad.$('#fullpage'))
		Qad.init('#fullpage');
	if (Qad.$('[contextmenu]'))
		Qad.init('[contextmenu]');
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
	if (typeof HTMLDialogElement != 'function') {
		var script = Qad.$('/script'),
			link = Qad.$('/link');
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.4.4/dialog-polyfill.js';
		link.href = 'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.4.4/dialog-polyfill.css';
		link.rel = 'stylesheet';
		Qad.$('head').add(script);
		Qad.$('head').add(link);
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
	}
	if (Qad.$('html').lang) {
		var script = Qad.$('/script');
		document.translate = function() {
			if (Qad.$('#google_translate') && Qad.$('#google_translate').$() == '')
				Qad.$('#google_translate').$('&#xE8E2').attr('class','material-icons');
			Qad.for('.material-icons',function(el) {
				el.classList.add('notranslate');
			});
			if (Qad.$('footer'))
				Qad.$('footer').classList.add('notranslate');
			new google.translate.TranslateElement({
				pageLanguage: Qad.$('html').lang,
				layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
				gaTrack: true,
				gaId: Qad.$('meta[name="analytics"]').content
			}, 'google_translate');
		}
		script.src = '//translate.google.com/translate_a/element.js?cb=document.translate';
		Qad.$('head').add(script);
	}
	if (navigator.serviceWorker && !Qad.$('html[dev]')) {
		navigator.serviceWorker.register('/service-worker.js?'+location.pathname,{scope: location.pathname}).then(function(sw) {
			console.log('◕‿◕');
			document.sw = sw;
		},function(){
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
	if (Qad.$('header + .clear:not(.onload)'))
		Qad.$('header + .clear:not(.onload)').classList.add('onload');
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
window.onscroll = function() {
	Qad.for('[data-effect]:not([data-preloadeffect])',function(el) {
		var scroll = document.documentElement.clientHeight + document.body.scrollTop - Qad.$(el).pos().top;
		if (-50 < scroll && 50 > scroll && Qad.$(el).pos().top > document.documentElement.clientHeight) {
			Qad.$(el).attr('data-preloadeffect',Qad.$(el).attr('data-effect'));
			Qad.$(el).attr('data-effect',false);
			setTimeout(function() {
				Qad.$('[data-preloadeffect]:not([data-effect])').attr('data-effect',Qad.$('[data-preloadeffect]:not([data-effect])').attr('data-preloadeffect'));
			}, 1)
		}
	});
	Qad.for('header.tabs nav.tabs a', el => {
		var id = el.href.replace(location.href, '');
		if (id == '#')
			id = '';
		if (document.body.scrollTop == 0 && ((id == '') || ((location.file == 'index.html') && (id == '?index')))) {
			if (Qad.$('header.tabs nav.tabs a.active'))
				Qad.$('header.tabs nav.tabs a.active').classList.remove('active');
			el.classList.add('active');
		}else if (id.slice(0, 1) == '#' && Qad.$(id)) {
			var scroll = document.body.scrollTop + Qad.$('header').pos().height;
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
if (!Qad.$('html[qad-noglobal]')) {
	var $$ = Qad;
	var $ = $$.$;
}
