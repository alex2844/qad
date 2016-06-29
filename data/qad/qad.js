/*
=====================================================
Qad Framework (qad.js)
-----------------------------------------------------
https://pcmasters.ml/
-----------------------------------------------------
Copyright (c) 2016 Alex Smith
=====================================================
*/
var Qad={
	dev: false,
	event: {},
	passport: {},
	$$: function(id) {
		return document.querySelectorAll(id);
	},
	$:function(el) {
		var obj;
		if (el) {
			if (typeof el == 'string') {
				if (el.indexOf('/') == 0) {
					if (el == '/svg')
						return document.createElementNS('http://www.w3.org/2000/svg','svg')
					else
						return document.createElement(el.slice(1));
				}else if (el.indexOf('iframe') != -1) {
					iframe = el.split(' ');
					if (iframe.length > 1 && document.querySelector(iframe[0]))
						return Qad.$(document.querySelector(iframe[0]).contentDocument.querySelector(el.replace(iframe[0]+' ','')));
				}
				obj=document.querySelector(el);
			}else
				obj=el;
		}else{
			var vars = {};
			var parts = location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
				vars[key] = value;
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
			else{
				obj.setAttribute(key,value);
				return value
			}
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
		}
		obj.status = function(s) {
			tmp = obj.innerHTML;
			if (s == true) {
				obj.innerHTML = 'done';
				obj.style['background'] = '#4CAF50';
			}else if (s == false) {
				obj.innerHTML = 'close';
				obj.style['background'] = '#F44336';
			}
			setTimeout(function() {
				obj.innerHTML = tmp;
				obj.style['background'] = Qad.$('meta[name="theme-color"]').content;
			},2000);
		}
		obj.on = function(e,f,c) {
			switch (e) {
				case 'mouse':
					e = 'mousedown';
				break;
				case 'key':
					e = 'keydown';
				break;
				case 'swipe':
					var swipe, startX, startY, startTime;
					obj.addEventListener('touchstart', function(e){
						swipe = 'none';
						startX = Math.round(e.changedTouches[0].pageX);
						startY = Math.round(e.changedTouches[0].pageY);
						startTime = new Date().getTime();
					}, false);
					obj.addEventListener('touchmove', function(e){
						if (((new Date().getTime())-startTime) < 50)
							e.preventDefault();
					}, false);
					obj.addEventListener('touchend', function(e){
						var distX = e.changedTouches[0].pageX-startX;
						var distY = e.changedTouches[0].pageY-startY;
						if (((new Date().getTime())-startTime) <= 300) {
							if (Math.abs(distX) >= 50 && Math.abs(distY) <= 50)
								swipe = (distX < 0)? 'left' : 'right';
							else if (Math.abs(distY) >= 50 && Math.abs(distX) <= 50)
								swipe = (distY < 0)? 'up' : 'down';
						}
						f({x:startX,y:startY,swipe:swipe});
					}, false);
					return;
				break;
			}
			console.log(e);
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
			return obj.cloneNode(true);
		}
		obj.template = function(d,t) {
			if (!obj.shab)
				obj.shab = obj.innerHTML;
			obj.innerHTML = '';
			for (key in d) {
				if (t)
					d[key] = JSON.parse(d[key]);
				obj.innerHTML += obj.shab.replace(/{(.*?)}/gim, function(m,v) {
					if (!d[key])
						return;
					else if (v == '@')
						return key;
					else if (v.indexOf('@') == 0) {
						if (v.indexOf('/') != -1) {
							p = v.replace('@','').split('/');
							if (p.length == 2)
								return d[key][p[0]][p[1]];
							else if (p.length == 3)
								return d[key][p[0]][p[1]][p[2]];
						}else if (d[key][v.replace('@','')])
							return d[key][v.replace('@','')];
						/*
						if (d[key]['response'][v.replace('@','')])
							return d[key]['response'][v.replace('@','')];
						else if (d[key][v.replace('@','')])
							return d[key][v.replace('@','')];
						*/
					}else{
						v = v.replace(/@(.*?);/gim, function(p) {
							p = p.replace(';','');
							if (p == '@')
								return key;
							else if (p.indexOf('@') == 0)
								return d[key][p.replace('@','')];
						});
						return new Function('return '+v)();
					}
				});
			}
			if (obj.tagName == 'DIV' || obj.tagName == 'ARTICLE')
				obj.style['display'] = 'block';
			else
				obj.style['display'] = 'table-row-group';
			console.log(obj.shab)
		}
		obj.parent = obj.parentNode;
		return obj;
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
	var_dump: function(obj) {
		var out = '';
		for (var i in obj) {
			if(typeof obj[i] === 'object')
				Qad.var_dump(obj[i]);
			else
				out += i + ": " + obj[i] + "\n";
		}
		return out;
	},
	format: function(data,type,add) {
		if (type == 'price' && !isNaN(data)) {
			data=Math.round(parseFloat(data)*Math.pow(10,0))/Math.pow(10,0);
			rr=Number(data).toFixed(0).toString().split('.');
			b=rr[0].replace(/(\d{1,3}(?=(\d{3})+(?:\.\d|\b)))/g,'\$1 ');
			data=(rr[1]?b+'.'+rr[1]:b);
		}else
			return data;
		if (add)
			data += ' '+add;
		return data;
	},
	json: function(data) {
		if (typeof(data) == 'string')
			data = JSON.parse(data);
		else if (typeof(data) == 'object')
			data = JSON.stringify(data);
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
		//console.log(i.length);
		if (typeof(i) == 'object' && i.length)
			i.forEach(function(e1) {
				o(e1);
			});
		else if (typeof(i) == 'string' && document.querySelector(i))
			[].forEach.call(document.querySelectorAll(i), function(e1) {
				o(e1);
			});
		else
			return false;
	},
	geo: {
		id: {},
		me: function(id) {
			document.me = function() {
				id = 'location_name';
				//autocomplete = new google.maps.places.Autocomplete(Qad.$('#'+id),{types: ['geocode']});
				if (navigator.geolocation)
					navigator.geolocation.getCurrentPosition(function(position) {
						var geocoder = new google.maps.Geocoder();
						var latlng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);        
						geocoder.geocode({'latLng': latlng}, function(results, status) {
							if (status == google.maps.GeocoderStatus.OK) {
								if (results[1])
									Qad.$('#'+id).$(results[1].formatted_address);
							}else
								console.log('Geocoder failed due to: ' + status);
						});
					});
			}
			if (typeof(google) == 'undefined' || typeof(google.maps) == 'undefined') {
				s = Qad.$('/script');
				s.src = '//maps.googleapis.com/maps/api/js?v=3.exp&libraries=places&callback=document.me';
				Qad.$('body').add(s);
			}else
				document.me();
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
		maps: function(address,zoom,id) {
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
			}
			if (typeof(google) == 'undefined' || typeof(google.maps) == 'undefined') {
				s = Qad.$('/script');
				s.src = '//maps.googleapis.com/maps/api/js?v=3.exp&libraries=places&callback=document.maps';
				Qad.$('body').add(s);
			}else
				document.maps();
		}
	},
	/*random: function(min, max, num=1) {
		var i, arr = [], res = [];
		for (i = min; i <= max; i++ )
			arr.push(i);
		for (i = 0; i < num; i++)
			res.push(arr.splice(Math.floor(Math.random() * (arr.length)), 1)[0]);
		return res;
	},
	byte: function(bytes,sizes,div) {
		if (!sizes)
			sizes = ['B','KB','MB','GB','TB','PB','EB','ZB','YB'];
		if(bytes == 0 || isNaN(bytes))
			return '0 '+sizes[0];
		var k = 1000;
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i]+(div != null ? '/'+div : '');
	},
	date: function(date) {
		if (!date)
			date = new Date(Date.now());
		else if (typeof date != 'object')
			date = new Date(1000*date);
		d = function() {
			var d = f(date.getDate()),
				m = f(date.getMonth()+1),
				y = f(date.getFullYear()%100),
				h = f(date.getHours()),
				i = f(date.getMinutes());
			return d+'.'+m+'.'+y+' '+h+':'+i;
		}
		f = function(n) {
			return (n < 10) ? '0'+n : n;
		}
		var e = (Date.now()-date)/1000;
		return (e < 10 && e > 0) ? 'now':(e < 60 && e > 0) ? Math.floor(e)+' sec':(e < 3600 && e > 0) ? Math.floor(e/60)+' min':d();
	},*/
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
			t = document.querySelector((id ? '#'+id : 'body')).getBoundingClientRect().top,
			start = null;
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
	api: function(method,callback,params) {
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
		document.api = {};
		document.api.method = method;
		if (callback)
			document.api.callback = callback;
		else
			document.api.callback = function(){};
		Qad.session.set('oauth-scope',null);
		Qad.session.set('oauth-redirect',null);
		document.api.oauth = function() {
			Qad.session.set('oauth-token-'+provider,null);
			Qad.session.set('oauth-scope',params.scope);
			//Qad.session.set('oauth-redirect',location.href);
			location.href = params.base+'?method='+provider+'&oauth-redirect='+location.href;
		};
		if (Qad.session.get('oauth-token-'+provider))
			params.access_token = Qad.session.get('oauth-token-'+provider);
		if (location.origin.indexOf('chrome-extension')==-1) {
			var script = Qad.$('/script');
			script.src = method+'?callback=document.api.callback&'+Qad.http_build_query(params);
			Qad.$('head').add(script);
		}else{
			var xhr = new XMLHttpRequest();
			xhr.open('GET', method+'?'+Qad.http_build_query(params));
			xhr.onload = function () {
				document.api.callback(JSON.parse(xhr.responseText));
			}
			xhr.send();
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
		accept: null,
		upload: function(id) {
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
                    Qad.$('iframe[data-code='+id+']').contentWindow.document.execCommand('insertImage', false, Qad.$('iframe[name=file] body').$());
                }
                Qad.$('#'+id+' form').submit();
		    }else{
    		    files = window.event.target.files;
    		    for (var i = 0, f; f = files[i]; i++) {
                    var reader = new FileReader();
                    t = f;
                    reader.onload = function(e) {
                        if (t.type.match('image.*'))
                            Qad.$('iframe[data-code='+id+']').contentWindow.document.execCommand('insertImage', false, e.target.result);
                        else
                            Qad.$('iframe[data-code='+id+']').contentWindow.document.execCommand('insertHTML', false, '<a href="'+e.target.result+'" download="'+escape(t.name)+'"><li><strong>'+escape(t.name)+'</strong> ('+(t.type ? t.type : 'n/a')+') - '+t.size+' ('+t.lastModifiedDate.toLocaleDateString()+')</li></a>');
                    }
                    reader.readAsDataURL(f);
    		    }
		    }
		},
		format: function(type,attr,nofocus) {
            if (!nofocus)
			    Qad.$('iframe[data-code='+this.id+']').contentWindow.focus();
            Qad.$('iframe[data-code='+this.id+']').contentWindow.document.execCommand(type, null, attr);
		},
		text: function() {
            Qad.$('textarea[name='+Qad.code.id+']').value = Qad.$('iframe[data-code='+Qad.code.id+'] body').$();
		},
		focus: function(id) {
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
            ';
        },
		init: function(o) {
		    for (k in o)
		        this[k] = o[k];
		    html = Qad.$(this.el).$();
		    this.id = Qad.$(this.el).id;
            Qad.$(this.el).$((this.button ? '<h2>'+this.button()+'</h2><br />' : '' )+'<iframe onmouseover="Qad.code.focus(\''+this.id+'\')" frameborder="no" style="width:98%;margin-left:5px" data-code="'+this.id+'"></iframe><br /><textarea name="'+this.id+'" hidden>'+html+'</textarea>');
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
		set: function(image) {
			$(this.el).style['background-image'] = "url("+image+")";
		},
		init: function() {
			if (!this.src && !this.el)
				return;
			this.set(this.src[this.frame]);
			if (this.time)
				this.time = setInterval(function() {
					$$.slider.next();
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
		console.log(div);
		if (time) {
			setTimeout(function() {
				Qad.$('#notification').remove();
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
	gencss: function() {
		/* if (!window.requestFileSystem) {
			Qad.$('link[rel="stylesheet/qad"]').rel = 'stylesheet';
			Qad.$('head').innerHTML += '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">';
			Qad.$('body').style['display'] = 'block';
		}else{ */
			var css = (Qad.$('meta[name="theme-color"]')?Qad.$('meta[name="theme-color"]').content.slice(1):'style');
			var style = function() {
				var style;
				var xhr = new XMLHttpRequest();
				xhr.open('GET', Qad.$('link[rel="stylesheet/qad"]').href);
				xhr.onload = function () {
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
						Qad.$('body').style['display'] = 'block';
					}else
						Qad.fs.add('style/'+css+'.css',style,function(e) {
							setTimeout(function() {
								Qad.$('link[rel="stylesheet/qad"]').href = e.toURL;
								Qad.$('link[rel="stylesheet/qad"]').rel = 'stylesheet';
								Qad.$('body').style['display'] = 'block';
							},500);
						},null,function(){
							add = Qad.$('/style');
							add.innerHTML = style;
							Qad.$('head').add(add);
							Qad.$('body').style['display'] = 'block';
						});
				}
				xhr.onerror = function() {
					Qad.$('link[rel="stylesheet/qad"]').rel = 'stylesheet';
					Qad.$('body').style['display'] = 'block';
				}
				xhr.send();
			}
			Qad.fs.exist('style/'+css+'.css',function(e){
				Qad.$('link[rel="stylesheet/qad"]').href = e.toURL();
				Qad.$('link[rel="stylesheet/qad"]').rel = 'stylesheet';
				Qad.$('body').style['display'] = 'block';
			},style);
		//}
	},
	http_build_query: function(data) {
		var key, use_val, use_key, i = 0, tmp_arr = [];
		for(key in data){
			use_key = key;
			use_val = data[key].toString();
			use_val = use_val.replace(/%20/g, '+');
			tmp_arr[i] = use_key+'='+use_val;
			i++;
		}
		return tmp_arr.join('&');
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
	}
};
/*
window.onpopstate = function() {
	location.reload();
}
*/
window.addEventListener('load',function() {
	var locarray = location.href.split('#')[0].replace(location.search,'').split('/');
	location.file = (locarray[(locarray.length-1)]?locarray[(locarray.length-1)]:'index.html');
	delete locarray[(locarray.length-1)];
	location.pwd = locarray.join('/').slice(0,-1);
	if (Qad.$('meta[name="passport"]') && Qad.session.get('passport.'+Qad.$('meta[name="passport"]').content.split(',')[2])) {
		Qad.passport = JSON.parse(decodeURIComponent(Qad.session.get('passport.'+Qad.$('meta[name="passport"]').content.split(',')[2])));
		if (!Qad.passport.type)
			Qad.passport.type = 1;
	}else
		Qad.passport.type = 0;
	if (Qad.$('meta[name="passport"]') && Qad.passport.type != Qad.$('meta[name="passport"]').content.split(',')[0]) {
		location.href = Qad.$('meta[name="passport"]').content.split(',')[1];
		return;
	}
	if (Qad.$()['actions'] && typeof(actions)!='undefined')
		actions[Qad.$()['actions']]();
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	if (typeof console !=="undefined" && console.log)
		console.info("%c Сюда вставлять не что не надо, иначе откроете доступ к своему аккаунту!",'color:red;font-weight:bold;font-style:italic;font-size:16px;');
	if (Qad.$('button#menu + nav')) {
		menu = function(e) {
			if (e.x > 300)
				Qad.$('button#menu').click();
		}
		Qad.$('button#menu').onclick = function() {
			if (Qad.$('body[data-menu]')) {
				Qad.$('body').attr('data-menu',false);
				Qad.$('html').on('mouse',null,'menu');
			}else{
				Qad.$('body').attr('data-menu',true);
				Qad.$('html').on('mouse',menu,'menu');
			}
		}
	}
	if (Qad.$('link[rel="stylesheet/qad"]')) {
		color = Qad.$('/meta');
		color.name = 'theme-color';
		color.content = '#4285F4';
		Qad.$('head').add(color);
		Qad.gencss();
	}else
		Qad.$('body').style['display'] = 'block';
	if (Qad.$('nav.tabs')) {
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
			if (location.origin != 'file://' && location.origin.indexOf('chrome-extension')==-1)
				history.pushState(null, null, '?tab='+id);
			if (typeof tabs == 'function')
				tabs(id);
		}
		if (Qad.$()['tab'])
			open(Qad.$()['tab']);
		else if (Qad.$('nav.tabs a.active'))
			open(Qad.$('nav.tabs a.active').href.split('#')[1]);
		Qad.for('nav.tabs a', function(el){
			el.onclick = function(e){
				if (el.href.indexOf('#') != -1) {
					Qad.up();
					open(el.href.split('#')[1]);
					e.preventDefault();
				}
			}
		});
	}
	if (Qad.$('.menu')) {
		menu = function(e) {
			if (e.target.id == Qad.$('ul[open]').attr('for'))
				return;
			pos = Qad.$('ul[open]').pos();
			if ((e.y < pos.top || e.x < pos.left || e.y > pos.top+pos.height || e.x > pos.left+pos.width) && e.target.tagName != 'LI')
				Qad.$('#'+Qad.$('ul[open]').attr('for')).click();
		}
		Qad.for('.menu', function(el){
			if (el.tagName != 'UL')
				el.onclick = function(e){
					if (Qad.$('ul[for='+el.id+']')) {
						if (Qad.$('ul[for='+el.id+']').style['display'] == 'block') {
							Qad.$('html').on('mouse',null,'menu');
							Qad.$('ul[for='+el.id+']').style['display'] = '';
							Qad.$('ul[for='+el.id+']').attr('open',false);
						}else{
							Qad.$('html').on('mouse',menu,'menu');
							Qad.$('ul[for='+el.id+']').style['display'] = 'block';
							Qad.$('ul[for='+el.id+']').attr('open',true);
						}
						e.preventDefault();
					}
				}
		});
	}
	if (Qad.$('input[list][data-select]')) {
		Qad.for('input[list][data-select]', function(el){
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
	}
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
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
		ga('create', Qad.$('meta[name="analytics"]').content, 'auto');
		ga('send', 'pageview');
	}
	if (Qad.$('html').lang) {
		var script = Qad.$('/script');
		document.translate = function() {
			if (Qad.$('#google_translate'))
				Qad.$('#google_translate').$('&#xE8E2').attr('class','material-icons');
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
	if (typeof main == 'function')
		main();
	if (Qad.$('iframe.load') && typeof load == 'function') {
		load(Qad.$('iframe.load body').innerHTML);
		Qad.$('iframe.load').onload = function() {
			load(Qad.$('iframe.load body').innerHTML);
		}
	}
});
var $$ = Qad;
var $ = $$.$;
