/*
=====================================================
Qad Framework (qad-server.js)
-----------------------------------------------------
https://qwedl.com/
-----------------------------------------------------
Copyright (c) 2018 Alex Smith
=====================================================
*/
(global = Object.assign(global, {
	os: require('os'),
	fs: require('fs'),
	domain: require('domain'),
	cluster: require('cluster'),
	http: require('http'),
	path: require('path'),
	fetch: require('node-fetch'),
	mailer: require('nodemailer'),
	dom: require('jsdom').JSDOM,
	peer: require('node-peerjs'),
	closure: require('node-closure'),
	module: (module, reload) => {
		var file, load;
		try {
			if (reload === undefined)
				return (global.module[module] ? global.module[module] : (global.module[module] = require(module)));
			else{
				if ((load = require.cache[(file = require.resolve(module))]) && reload)
					delete require.cache[file];
				return (global[replace([/api\//g, /\.js/g, /\./g, /\//g], '', module)] = ((!reload && load) ? load.exports : require(file)));
			}
		} catch (e) {
			if ((module.indexOf('.js') > -1) && (module.indexOf('../../api/') == -1))
				return global.module('../../api/'+module, reload);
			console.log(e);
			return null;
		}
	},
	body: (options) => {
		return decodeURIComponent(Object.keys(options).map(k => encodeURIComponent(k)+'='+encodeURIComponent(options[k])).join('&')).replace(/#/g, '%23');
	},
	parse: (url, location) => {
		var res = {};
		if (location) {
			var match = url.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
			res = Object.assign({
				_hostname: location[0],
				hostname: location[0],
				api: location[1],
				origin: '',
			}, (match && {
				url: url,
				protocol: match[1],
				host: match[2],
				origin: match[1]+'//'+match[2],
				hostname: match[3],
				port: match[4],
				pathname: match[5],
				search: match[6],
				hash: match[7]
			}));
		}else{
			((typeof(url) == 'function') ? url.toString().split('(')[1].split(')')[0].replace(/([^=,]+)([^,]*)/gi, (s, k, v) => {
				res[k.trim()] = (v ? (new Function('return '+v.replace('=', '').trim()))() : null);
			}) : url.replace(/[?&]+([^=&]+)([^&]*)/gi, (s, k, v) => {
				res[k] = (v.slice(0, 1) == '=' ? v.slice(1) : v);
			}));
		}
		return res;
	},
	replace: (s, r, t) => {
		if (!t)
			return t;
		if (t.constructor.name != 'String')
			for (var k in t) {
				t[k] = replace(s, r, t[k]);
			}
		else if (s.constructor.name == 'Array')
			s.map((s, i) => {
				t = t.replace(s, (r.constructor.name == 'Array' ? r[i] : r));
			});
		else
			t = t.replace(s, r);
		return t;
	},
	mail: (data) => {
		return new Promise((resolve, reject) => {
			var transport = mailer.createTransport({
				service: 'gmail',
				auth: (data.auth || {
					user: 'qwedl.com@gmail.com',
					pass: 'qecywthoudzudyot'
				})
			});
			transport.sendMail({
				from: (data.from || 'PCMasters Inc <no-reply@qwedl.com>'),
				to: data.to,
				subject: data.title,
				html: data.text
			}, (err, res) => transport.close((err ? reject(err) : resolve(res))));
		});
	},
	hash: (s) => {
		return s.split('').reduce((a, b) => {
			a = ((a<<5)-a)+b.charCodeAt(0);
			return a&a;
		}, 0);
	},
	cache: {
		dir: () => {
			return cache._dir;
		},
		get: (name, ttl) => {
			return ((fs.existsSync((name = cache.dir()+'/'+name.replace(/\//g, ''))) && ((Date.now() - (ttl || 86400) * 1000) < Math.round(fs.statSync(name).mtimeMs))) ?  new Promise((resolve, reject) => resolve(JSON.parse(fs.readFileSync(name, 'utf8')))) : null);
		},
		set: (name, data) => {
			fs.writeFileSync((name = cache.dir()+'/'+name.replace(/\//g, '')), ((typeof(data) == 'object') ? JSON.stringify(data) : data), {encoding: 'utf8'});
			return data;
		},
		clear: (callback) => {
			fs.readdir(cache._dir, (err, files) => {
				(files ? Promise.all(files.map((file) => fs.unlink(cache._dir+'/'+file, (err) => {
					if (err)
						return console.log(err);
				}))).then(() => fs.rmdir(cache._dir, callback)) : callback());
			});
		}
	},
	main: {
		server: () => {
			if (!cache._dir && !fs.existsSync((cache._dir = path.join(os.tmpdir(), 'qad-server'))))
				fs.mkdirSync((cache._dir = path.join(os.tmpdir(), 'qad-server')));
			if (cluster.isMaster) {
				console.log('Master '+process.pid+' is running');
				for (var i=0; i<(os.cpus().length * 4); ++i) {
					cluster.fork();
				}
				cluster.on('exit', (worker, code, signal) => {
					console.log('worker '+worker.process.pid+' died');
				});
				if (process.argv[3] == 'nginx')
					fs.readdir('../api/', (err, files) => {
						var nginx = [];
						Promise.all(files.filter(file => (file.substr(-3) === '.js')).map(file => fs.readFileSync('../api/'+file, 'utf8').replace(/_nginx:(?: |)\[(?:([^]+?:?)\])/, (s, r) => nginx.push(r.replace(/'(.*)'(,|)/g, '$1'))))).then(() => {
							fs.writeFile(cache._dir+'/nginx.conf', [
								//'user chronos chronos;',
								'pid '+cache._dir+'/nginx.pid; error_log '+cache._dir+'/nginx.error_log info; events {worker_connections  1024;}',
								'http {',
									'add_header Last-Modified $date_gmt; add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"; if_modified_since off; expires off; etag off;',
									'default_type application/octet-stream; client_body_temp_path '+cache._dir+'; proxy_temp_path '+cache._dir+'; fastcgi_temp_path '+cache._dir+'; uwsgi_temp_path '+cache._dir+'; scgi_temp_path '+cache._dir+'; access_log '+cache._dir+'/nginx.access_log;',
									/*'server {',
										'listen 443;',
										'server_name localhost;',
										'root '+process.cwd().split('/').slice(0, -1).join('/')+';',
										'ssl on;',
										'ssl_certificate /usr/local/ssl/project.crt;',
										'ssl_certificate_key /usr/local/ssl/project.key;',
										'index index.html;',
										'location /api/ {proxy_pass http://127.0.0.1:'+(process.env.npm_package_config_port_api || 8000)+'; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; proxy_set_header Host $host; proxy_cache_bypass $http_upgrade;}',
										'location /peerjs {proxy_pass http://127.0.0.1:'+(process.env.npm_package_config_port_peer || 8008)+'; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";}',
										nginx.join(''),
									'}',*/
									'server {',
										'listen '+(process.env.npm_package_config_port_nginx || 8080)+';',
										'server_name localhost;',
										'root '+process.cwd().split('/').slice(0, -1).join('/')+';',
										'index index.html;',
										'location /api/ {proxy_pass http://127.0.0.1:'+(process.env.npm_package_config_port_api || 8000)+'; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; proxy_set_header Host $host; proxy_cache_bypass $http_upgrade;}',
										'location /peerjs {proxy_pass http://127.0.0.1:'+(process.env.npm_package_config_port_peer || 8008)+'; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";}',
										nginx.join(''),
									'}',
									'types {text/html html htm shtml; text/css css; text/xml xml; image/gif gif; image/jpeg jpeg jpg; application/x-javascript js; text/plain txt; image/png png; image/tiff tif tiff; image/vnd.wap.wbmp wbmp; image/x-icon ico; image/svg+xml svg svgz; image/webp webp; audio/mpeg mp3; audio/x-m4a m4a; video/mp4 mp4; video/webm webm; video/x-m4v m4v;}',
								'}'
							].join('\n'), () => (global.system = require('child_process').exec)('sudo iptables -I INPUT -p tcp -m tcp --dport 8080 -j ACCEPT; nginx -p '+cache._dir+' -c nginx.conf', console.log.bind(console)));
						});
					});
				process.on('SIGINT', () => {
					if (process.argv[3] == 'nginx')
						global.system('kill -9 $(pidof nginx)');
					cache.clear(() => process.exit(console.log('Server JSON Api stop')));
				});
				fs.exists('/home/git/ssl/privkey.pem', exists => {
					peer.PeerServer((exists ? {
						//proxied: true,
						ssl: {
							key: fs.readFileSync('/home/git/ssl/privkey.pem'),
							cert: fs.readFileSync('/home/git/ssl/fullchain.pem')
						}
					} : null)).on('connection', console.log.bind(console, 'connection')).on('disconnect', console.log.bind(console, 'disconnect'));
				});
			}else{
				console.log('Worker '+process.pid+' started');
				return domain.create().run(() => http.createServer((req, res) => {
					var method, result, fargs, cargs,
						file = req.url.split('?')[0].split('/').slice(-1)[0]+'.js',
						parse = global.parse(req.url),
						reqd = domain.create();
					reqd.add(req);
					reqd.add(res);
					reqd.on('error', err => {
						try {
							console.error(err = {
								code: 500,
								msg: err.message,
								url: req.url
							});
							res.writeHead(500);
							res.end(JSON.stringify(err));
						} catch (er2) {
							console.error('Error sending 500', er2, req.url);
						}
					});
					reqd.run(() => {
						global.location = global.parse((req.headers.referer || ''), [req.headers.host, req.url]);
						fs.exists('../api/'+file, (exists) => {
							if (!exists)
								return res.end(res.writeHead(404));
							method = global.module(file, (parse.reload !== undefined));
							if ((parse.method || (!parse.method && (parse.method = method._main))) && (typeof(method[parse.method]) == 'function')) {
								cargs = Object.keys(fargs = global.parse(method[parse.method])).map(k => (parse[k] || fargs[k])).filter(v => (v != undefined));
								result = (((fargs = Object.keys(fargs)).length == cargs.length) ? method[parse.method].apply(null, Array.prototype.slice.call(cargs)) : {error: 'Required parameter(s) for '+file.replace('.js', '')+': '+fargs.join(', ')});
							}else
								result = {error: (parse.method ? 'The method '+parse.method+' does not exist.' : 'No method was requested.')};
							(cb => {
								((result && (result.constructor.name == 'Promise')) ? result.then(e => cb(e)).catch(err => {
									console.error({
										api: file,
										method: parse.method,
										error: err
									});
									cb({error: err});
								}) : cb(result));
							})(result => {
								if (parse.__amp_source_origin)
									result = {
										items: [{
											[parse.method]: (parse.replace ? replace((parse.replace = JSON.parse(decodeURIComponent(parse.replace)))[0], parse.replace[1], result) :result)
										}]
									};
								(((typeof(result) == 'object') && result.header) ? res.writeHead((result.status || 200), result.header) : (((typeof(result) == 'object') && result.error && result.error.header) ? res.writeHead((result.error.status || 200), result.error.header) : res.writeHead(200, {
									'Content-Type': (parse.callback ? 'application/x-javascript' : ((typeof(result) == 'object') ? 'application/json' : 'text/html')),
									'Cache-Control': 'max-age=3600'
								})));
								res.end((parse.callback ? parse.callback+'('+JSON.stringify(result)+')' : ((typeof(result) == 'object') ? JSON.stringify(result, undefined, 4) : result)));
							});
						});
					});
				}).listen((process.env.npm_package_config_port_api || 8000), err => (err && console.log(err))));
			}
		},
		make: () => {
			if (!cache._dir && !fs.existsSync((cache._dir = path.join(os.tmpdir(), 'qad-server'))))
				fs.mkdirSync(cache._dir);
			var v = {
				nps: ['https://www.modpagespeed.com/doc/build_ngx_pagespeed_from_source', /NPS_VERSION=(.*)/],
				nginx: ['https://nginx.org/en/download.html', /Stable[a-zA-Z0-9\/<>=%"\-. ]*(nginx-[0-9.]*:?)[.]tar[.]gz/]
			};
			require('node-osinfo')(osinfo => {
				Promise.all(Object.keys(v).map(k => fetch(v[k][0]).then(e => e.text()).then(body => body.replace(v[k][1], (s, r) => (v[k] = r))))).then(() => {
					fs.writeFile(cache._dir+'/server.sh', [
						'cd '+cache._dir,
						((['Chrome OS', 'Chromium OS'].indexOf(osinfo.distro) > -1)
						? 'sudo mount -o remount,exec /tmp; crew update; crew install automake bison libxml2; ln -s /usr/local/bin/aclocal /usr/local/bin/aclocal-1.15; ln -s /usr/local/bin/automake /usr/local/bin/automake-1.15'
						: 'sudo apt update; sudo apt install automake bison libxml2-dev uuid-dev -y'),
						'wget https://github.com/apache/incubator-pagespeed-ngx/archive/v'+v.nps+'.zip && unzip v'+v.nps+'.zip',
						'nps_dir=$(find . -name "*pagespeed-ngx-'+v.nps+'" -type d) && cd "$nps_dir"',
						'psol_url=https://dl.google.com/dl/page-speed/psol/'+v.nps+'.tar.gz',
						'[ -e scripts/format_binary_url.sh ] && psol_url=$(scripts/format_binary_url.sh PSOL_BINARY_URL)',
						'wget ${psol_url} && tar -xzvf $(basename ${psol_url})',
						'cd ../',
						'git clone https://github.com/luvit/pcre.git; git clone https://github.com/openssl/openssl.git; git clone https://github.com/madler/zlib.git',
						'wget http://nginx.org/download/'+v.nginx+'.tar.gz --quiet -O '+v.nginx+'.tar.gz && tar zxf ./'+v.nginx+'.tar.gz && cd ./'+v.nginx,
						'./configure --prefix=. --conf-path=nginx.conf --error-log-path='+cache._dir+'/error.log --http-client-body-temp-path='+cache._dir+' --http-proxy-temp-path='+cache._dir+' --http-fastcgi-temp-path='+cache._dir+' --http-uwsgi-temp-path='+cache._dir+' --http-scgi-temp-path='+cache._dir+' --pid-path='+cache._dir+'/nginx.pid --with-http_ssl_module --with-http_gzip_static_module --with-http_stub_status_module --without-mail_pop3_module --without-mail_imap_module --without-mail_smtp_module --with-http_v2_module --with-pcre=../pcre/ --with-openssl=../openssl/ --with-zlib=../zlib/ --add-module=../${nps_dir:2} && make && cp -f objs/nginx '+process.cwd()+'/nginx && rm -rf '+cache._dir
					].join('\n'), () => console.log(cache._dir+'/server.sh'));
				});
			});
		},
		min: () => {
			closure.ignore = ['../**/node_modules/**', '../**/upload/**', '../**/api/**'];
			closure.build('../**/*.{js,css,html}');
		}
	},
	init: (s) => {
		((process.argv[2] && (typeof(global.main[process.argv[2]]) == 'function')) ? global.main[process.argv[2]]() : console.error('Could not open parameter file'));
	}
})).init();
