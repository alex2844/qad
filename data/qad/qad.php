<?php
/*
=====================================================
Qad Framework (qad.php)
-----------------------------------------------------
https://qwedl.com/
-----------------------------------------------------
Copyright (c) 2016-2018 Alex Smith
=====================================================
*/
header('Content-Type: text/html; charset=utf-8');
ini_set('session.use_strict_mode', 1);
if (empty(session_id()))
	session_start();
class Qad {
	public static $config;
	public static $cache;
	public static $sql;
	public static $document;
	private static $debug = [
		'status' => false
	];
	private static $color = [
		'red' => "\033[31m%s\033[0m",
		'green' => "\033[32m%s\033[0m",
		'cyan' => "\033[36m%s\033[0m"
	];

	public function __construct() {
		$_SERVER['DOCUMENT_ROOT'] = str_replace('/api', '', explode('/page', ($_SERVER['DOCUMENT_ROOT'] ?: $_SERVER['PWD']))[0]);
		$conf = (file_exists('data/config.php') ? 'data/config.php' : dirname(__DIR__).'/config.php');
		if (file_exists($conf))
			self::$config = include($conf);
		if (self::$debug['status']) {
			ini_set('display_errors', 1);
			ini_set('error_reporting', 2047);
			self::$debug['memory'] = self::_memory();
			self::$debug['time'] = self::_microtime();
		}
	}
	//public function err($errno=null, $errmsg=null, $filename=null, $linenum=null, $vars=null) {
	public static function err($errno=null, $errmsg=null, $filename=null, $linenum=null, $vars=null) {
		$log = ($errmsg ? [
			$errmsg.' ('.$errno.')',
			$filename.' ('.$linenum.')'
		] : $errno);
		if (self::$debug['status'])
			self::$debug['error'][] = $log;
		error_log(sprintf(self::$color['red'], print_r($log, true)));
	}
	private static function _memory($start=null) {
		return (!$start ? memory_get_usage() : sprintf('%.d bytes.', memory_get_usage()-$start));
	}
	private static function _microtime($start=null) {
		$time_arr = explode(' ', microtime());
		$time = $time_arr[1]+$time_arr[0];
		return (!$start ? $time : sprintf('%.5f sec.', $time-$start));
	}
	private static function _parseServer($socket, $response) {
		$responseServer = '';
		while (@substr($responseServer, 3, 1) != ' ') {
			if (!($responseServer = fgets($socket, 256)))
				return false;
		}
		if (!(substr($responseServer, 0, 3) == $response))
			return false;
		return true;
	}
	private function getCode($secret, $timeSlice, $base32chars) {
		if (empty($secret))
			return '';
		$base32charsFlipped = array_flip($base32chars);
		$paddingCharCount = substr_count($secret, '=');
		$allowedValues = array(6, 4, 3, 1, 0);
		if (!in_array($paddingCharCount, $allowedValues))
			return false;
		for ($i = 0; $i < 4; $i++)
			if ($paddingCharCount == $allowedValues[$i] && substr($secret, -($allowedValues[$i])) != str_repeat('=', $allowedValues[$i]))
				return false;
		$secret = str_replace('=','', $secret);
		$secret = str_split($secret);
		$secretkey = '';
		for ($i = 0; $i < count($secret); $i = $i+8) {
			$x = '';
			if (!in_array($secret[$i], $base32chars))
				return false;
			for ($j = 0; $j < 8; $j++)
				$x .= str_pad(base_convert(@$base32charsFlipped[@$secret[$i + $j]], 10, 2), 5, '0', STR_PAD_LEFT);
			$eightBits = str_split($x, 8);
			for ($z = 0; $z < count($eightBits); $z++)
				$secretkey .= ( ($y = chr(base_convert($eightBits[$z], 2, 10))) || ord($y) == 48 ) ? $y:"";
		}
		$time = chr(0).chr(0).chr(0).chr(0).pack('N*', $timeSlice);
		$hm = hash_hmac('SHA1', $time, $secretkey, true);
		$offset = ord(substr($hm, -1)) & 0x0F;
		$hashpart = substr($hm, $offset, 4);
		$value = unpack('N', $hashpart);
		$value = $value[1];
		$value = $value & 0x7FFFFFFF;
		$modulo = pow(10, 6);
		return str_pad($value % $modulo, 6, '0', STR_PAD_LEFT);
	}
	public function config($arr) {
		self::$config = $arr;
		$conf = (file_exists('data/config.php') ? 'data/config.php' : dirname(__DIR__).'/config.php');
		$c = fopen($conf, 'w');
		fputs($c, "<?php\nreturn [\n");
		foreach ($arr as $k=>$v) {
			if (!empty($v))
				fputs($c, '"'.$k.'"=>"'.preg_replace('/"/','/\'/',$v)."\",\n");
		}
		fputs($c, "];");
		fclose($c);
	}
	public function auth($data) {
		if (count($data) > 0) {
			if (!isset($_SERVER['PHP_AUTH_USER'])) {
				header('WWW-Authenticate: Basic realm="My Realm"');
				header('HTTP/1.0 401 Unauthorized');
				exit;
			}else{
				$error = true;
				foreach($data as $l=>$p) {
					if($_SERVER['PHP_AUTH_USER'] == $l && $_SERVER['PHP_AUTH_PW'] == $p)
						$error = false;
				}
				if ($error)
					exit;
				else
					return $_SERVER['PHP_AUTH_USER'];
			}
		}
	}
	public function passport($data,$key='',$scope='') {
		if (!is_array($data))
			$data = json_decode($data,true);
		$passport = [
			'id' => $data['id'],
			'type' => ($data['response']['type']?$data['response']['type']:1),
			'email' => $data['response']['email'],
			'login' => $data['response']['login'],
			'tel' => $data['response']['tel'],
			'avatar' => $data['response']['avatar'],
			'first_name' => $data['response']['first_name'],
			'last_name' => $data['response']['last_name'],
			'utc' => $data['response']['utc'],
			'update' => time()
		];
		if ($scope)
			for ($i=0; $i<count($scope); ++$i)
				$passport['scope'][$scope[$i]] = $data['response'][$scope[$i]];
		$passport = json_encode($passport);
		setcookie('passport'.($key!=''?'::'.$key:''), $passport, time()+60*60*24*30, '/');
		$_SESSION['passport'.($key!=''?'::'.$key:'')] = md5($passport);
		return $passport;
	}
	public static function csrf($check=false) {
		return (
			$check
			? (isset($_REQUEST['csrf']) && isset($_SESSION['csrf']) && isset($_SESSION['csrf_']) && ((time() - $_SESSION['csrf_']) >= 10) && hash_equals($_SESSION['csrf'], $_REQUEST['csrf']))
			: '<input type="hidden" name="csrf" value="'.(empty($_SESSION['csrf']) ? ($_SESSION['csrf'] = bin2hex(($_SESSION['csrf_'] = time()).random_bytes(32))) : $_SESSION['csrf']).'" />'
		);
	}
	public function upload($path, $file, $accept='*/*') {
		$result = [];
		if (!empty($file['name'])) {
			$path = dirname(__DIR__).'/'.$path;
			$type = explode('/', mime_content_type($file['tmp_name']));
			$atype = explode('/', $accept);
			if (empty($name = end(explode('/', $path))))
				$path .= $name = uniqid().'.'.$type[1];
			else if (substr($name, -1) == '.') {
				$name .= $type[1];
				$path .= $type[1];
			}
			if (($accept == '*/*') || ($atype[0] == $type[0] && ($atype[1] == '*' || $atype[1] == $type[1]))) {
				if (move_uploaded_file($file['tmp_name'], $path))
					$result[] = $name;
			}
		}
		return implode(',', $result);
	}
	public static function dump($a=[]) {
		echo '<pre id="dump">';
		print_r($a);
		echo '</pre>';
	}
	public static function location($p=null) {
		$protocol = (isset($_SERVER['SERVER_PROTOCOL']) ? ((strtolower(substr($_SERVER['SERVER_PROTOCOL'], 0, 5)) == 'https') ? 'https:' : 'http:') : 'file:');
        if (isset($_SERVER['SERVER_PORT']) && ($_SERVER['SERVER_PORT'] == 443))
            $protocol = 'https:';
        else if (isset($_SERVER['HTTPS']) && (($_SERVER['HTTPS'] == 'on') || ($_SERVER['HTTPS'] == '1')))
            $protocol = 'https:';
        else if ((!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && ($_SERVER['HTTP_X_FORWARDED_PROTO'] == 'https')) || (!empty($_SERVER['HTTP_X_FORWARDED_SSL']) && ($_SERVER['HTTP_X_FORWARDED_SSL'] == 'on')))
            $protocol = 'https:';
		$res = [
			'protocol' => $protocol,
			'port' => (isset($_SERVER['SERVER_PORT']) ? $_SERVER['SERVER_PORT'] : null),
			'pathname' => (isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : __DIR__),
			'host' => (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : null),
			'href' => (isset($_SERVER['REQUEST_URI']) ? $protocol.'//'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'] : ''),
			'server' => $_SERVER
		];
		return ($p ? $res[$p] : $res);
	}
	public static function debug($i=null) {
		self::$debug['status'] = true;
		if ($i) {
			self::$debug['debug'] = $i;
			error_log(sprintf(self::$color['cyan'], print_r($i, true)));
		}
	}
	public static function furl($s) {
		$s = (string) $s;
		$s = strip_tags($s);
		$s = str_replace(array("\n", "\r"), " ", $s);
		$s = preg_replace("/\s+/", ' ', $s);
		$s = trim($s);
		$s = function_exists('mb_strtolower') ? mb_strtolower($s) : strtolower($s);
		$s = strtr($s, array('а'=>'a','б'=>'b','в'=>'v','г'=>'g','д'=>'d','е'=>'e','ё'=>'e','ж'=>'j','з'=>'z','и'=>'i','й'=>'y','к'=>'k','л'=>'l','м'=>'m','н'=>'n','о'=>'o','п'=>'p','р'=>'r','с'=>'s','т'=>'t','у'=>'u','ф'=>'f','х'=>'h','ц'=>'c','ч'=>'ch','ш'=>'sh','щ'=>'shch','ы'=>'y','э'=>'e','ю'=>'yu','я'=>'ya','ъ'=>'','ь'=>''));
		$s = preg_replace("/[^0-9a-z-_ ]/i", "", $s);
		$s = str_replace(" ", "-", $s);
		return $s;
	}
	public function keywords($text, $skip=[]) {
		$size = ['|<b(.*)>(.+)</b>|iU', '|<h3(.*)>(.+)</h3>|iU', '|<h2(.*)>(.+)</h2>|iU', '|<h1(.*)>(.+)</h1>|iU'];
		if (count($skip) == 0)
			$skip  = ['не','как','в','на','и','а','что','его','к','для','вы','это','с','0','же','о','но','он','чтобы','все','если','за',
				'сб', 'очень','этом','так','однако','лучше','также','после','сразу', 'должен', 'быть', 'то','туда','просто','когда',
				'был', 'по', 'во', 'вс', 'во', 'году', 'года', 'при', 'уже', 'ни','до','только','никогда','а','м', 'от', 'у', 'ещ', 'е', 'или',
				'даже', 'того', 'могут', 'которые', 'может', 'поэтому', 'вашей', 'вероятно', 'важно', 'очень', 'том', 'снова', 'пока', 'чаще', 'еще', 'большое',
				'они', 'были', 'одном', 'об', 'из', 'ежегодном', 'говорится', 'между', 'замечены', 'деле', 'время', 'всего', 'ее', 'вошел'];
		$text = preg_replace("//iu", "", $text);
		$text = function_exists('mb_strtolower') ? mb_strtolower($text) : strtolower($text);
		$keywords = [];
		preg_replace_callback($size, function($matches) use (&$keywords, $size) {
			preg_match_all('~<([^/][^>]*?)>~', $matches[0], $matches[3]);
			$matches[3] = explode(' ', $matches[3][1][0])[0];
			$matches[4] = array_search('|<'.$matches[3].'(.*)>(.+)</'.$matches[3].'>|iU', $size)+2;
			if (empty($keywords[0]))
				$keywords[0] = '';
			$keywords[0] .= str_repeat($matches[2].'; ', $matches[4]*2);
		}, $text);
		$text = strip_tags($text);
		$text = preg_replace("/[^a-zA-ZА-Яа-я0-9\-\s]/iu", "", $text);
		$words = preg_split("/[\s]+/", $text);
		$hash = [];
		$result = [];
		foreach ($words as $idx => $word) {
			if (!$word || is_numeric($word) || in_array($word, $skip))
				continue;
			if (!isset($hash[$word]))
				$hash[$word] = $word;
			if (!isset($result[$word]))
				$result[$word] = [
					'word' => $word,
					'count' => 0, //substr_count($keywords[0], $word),
					'indx' => []
				];
			++$result[$word]['count'];
			$result[$word]['indx'][] = $idx;
		}
		uasort($result, function($w1, $w2) {
			return ($w1['count'] < $w2['count'] ? 1 : -1);
		});
		$resultMerge = (count($keywords) == 0 ? [] : array_count_values(explode('; ', substr($keywords[0], 0, -2))));
		$keywords = (sizeof($result) > 20 ? array_slice($result, 0, 20) : $result);
		foreach ($keywords as $w => $obj) {
			foreach ($obj['indx'] as $inx) {
				foreach (['left','right'] as $k) {
					$n = $inx;
					${$k} = [
						'v' => null,
						'c' => 0,
						'buf' => ''
					];
					while (true) {
						if ($k == 'left')
							--$n;
						else
							++$n;
						${$k}['v'] = isset($words[$n]) ? $words[$n] : null;
						if (!is_null(${$k}['v']) && (is_numeric(${$k}['v']) || in_array(${$k}['v'], $skip))) {
							${$k}['buf'] = ($k == 'left' ? ${$k}['v'].' '.${$k}['buf'] : ${$k}['buf'].' '.${$k}['v']);
							continue;
						}
						if (isset($keywords[${$k}['v']])) {
							${$k}['c'] = ceil($keywords[${$k}['v']]['count'] / 2);
							${$k}['buf'] = ($k == 'left' ? ${$k}['v'].' '.${$k}['buf'] : ${$k}['buf'].' '.${$k}['v']);
							break;
						}
						${$k}['buf'] = '';
						break;
					};
					${$k}['buf'] = trim(${$k}['buf']);
					if(${$k}['buf']) {
						$word = trim(($k == 'left' ? ${$k}['buf'].' '.$obj['word'] : $obj['word'].' '.${$k}['buf']));
						if (!isset($resultMerge[$word]))
							$resultMerge[$word] = $obj['count']+${$k}['c'];
						++$resultMerge[$word];
					}
				}
				if ($left['buf'] && $right['buf']) {
					$word = trim($left['buf'].' '.$obj['word'].' '.$right['buf']);
					if (!isset($resultMerge[$word]))
						$resultMerge[$word] = $obj['count']+$right['c']+$left['c'];
					$resultMerge[$word] += 2;
				}
			}
		}
		uasort($resultMerge, function($w1, $w2) {
			return ($w1 < $w2 ? 1 : -1);
		});
		$keywords = (sizeof($resultMerge) > 10 ? array_slice($resultMerge, 0, 10) : $resultMerge);
		//return $keywords;
		return implode(', ', array_keys($keywords));
	}
	public function otp($p1,$p2) {
		$validChars =  array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '2', '3', '4', '5', '6', '7', '=');
		if ($p1 == 'secret') {
			unset($validChars[32]);
			$secret = '';
			for ($i = 0; $i < 16; $i++)
				$secret .= $validChars[array_rand($validChars)];
			if (!empty(self::$config['name']))
				$name = self::$config['name'];
			else
				$name = $_SERVER['HTTP_HOST'];
    	    return [
				'secret' => $secret,
				'qr' => 'otpauth://totp/'.$p2.'?secret='.$secret.'&issuer='.$name
			];
		}else{
			if (empty($p2))
				return ['check'=>false];
			$currentTimeSlice = floor(time() / 30);
			$calculatedCode = self::getCode($p1, $currentTimeSlice,$validChars);
			if ($calculatedCode == $p2)
				return ['check'=>true];
			else
				return ['chack'=>false];
		}
	}
	public function qr($method,$code) {
		if ($method == 'get')
			return 'https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl='.urlencode($code);
	}
	public static function recaptcha($recaptcha) {
		if(empty($recaptcha) || empty(self::$config['recaptcha']))
			return false;
		$url = 'https://www.google.com/recaptcha/api/siteverify?secret='.self::$config['recaptcha'].'&response='.$recaptcha.'&remoteip='.$_SERVER['REMOTE_ADDR'];
		$res = json_decode(file_get_contents($url),true);
		return $res['success'];
	}
	public function shab() {
		$file = file_get_contents('index.html');
		$shab = array();
		if (strpos($file, '<section>') === false) {
			$shab['header'] = explode('<body>',$file)[0].'<body>';
			$shab['footer'] = '</body>'.explode('</body>',$file)[1];
		}else{
			$shab['header'] = preg_replace(array(
				"'<header(.*?)data-content=\"(.*?)\"(.*?)>(.*?)>.*?</header>'si",
				"'<nav(.*?)>(.*?)</nav>'si",
				'/ tabs/'
			),array(
				'<header class="min" data-content="$2"></header>'
			),explode('<section>',$file)[0]).'<section>';
			$shab['footer'] = '</section>'.explode('</section>',$file)[1];
		}
		return $shab;
	}
	public static function mail($to, $subject, $message, $headers='') {
		if (empty(self::$config['smtp_from']) || empty(self::$config['smtp_user']) || empty(self::$config['smtp_pass']))
			return 'no config';
		if (empty(self::$config['smtp_host']))
			self::$config['smtp_host'] = 'ssl://smtp.gmail.com';
		if (empty(self::$config['smtp_port']))
			self::$config['smtp_port'] = 465;
		if ($headers == '')
			$headers= "MIME-Version: 1.0\r\nContent-type: text/html; charset=utf-8\r\nFrom: ".self::$config['smtp_from']."\r\n";
		$contentMail = "Date: ".date("D, d M Y H:i:s")." UT\r\n";
		$contentMail .= 'Subject: =?utf-8?B?'.base64_encode($subject)."=?=\r\n";
		$contentMail .= $headers."\r\n";
		$contentMail .= $message."\r\n";
		$errno = 0;
		$errstr = '';
		try {
			if (!$socket = fsockopen(self::$config['smtp_host'], self::$config['smtp_port'], $errno, $errstr, 30))
				throw new Exception($errno.".".$errstr);
			if (!self::_parseServer($socket, 220))
				throw new Exception('Connection error');
			$server_name = $_SERVER["SERVER_NAME"];
			fputs($socket, "HELO $server_name\r\n");
			if (!self::_parseServer($socket, 250)) {
				fclose($socket);
				throw new Exception('Error of command sending: HELO');
			}
			fputs($socket, "AUTH LOGIN\r\n");
			if (!self::_parseServer($socket, 334)) {
				fclose($socket);
				throw new Exception('Autorization error');
			}
			fputs($socket, base64_encode(self::$config['smtp_user']) . "\r\n");
			if (!self::_parseServer($socket, 334)) {
				fclose($socket);
				throw new Exception('Autorization error');
			}
			fputs($socket, base64_encode(self::$config['smtp_pass']) . "\r\n");
			if (!self::_parseServer($socket, 235)) {
				fclose($socket);
				throw new Exception('Autorization error');
			}
			fputs($socket, "MAIL FROM: <".self::$config['smtp_user'].">\r\n");
			if (!self::_parseServer($socket, 250)) {
				fclose($socket);
				throw new Exception('Error of command sending: MAIL FROM');
			}
			$arr = explode(',', $to);
			foreach($arr as $key=>$email) {
				fputs($socket, "RCPT TO: <".$email.">\r\n");
				if (!self::_parseServer($socket, 250)) {
					fclose($socket);
					throw new Exception('Error of command sending: RCPT TO');
				}
			}
			fputs($socket, "DATA\r\n");     
			if (!self::_parseServer($socket, 354)) {
				fclose($socket);
				throw new Exception('Error of command sending: DATA');
			}
			fputs($socket, $contentMail."\r\n.\r\n");
			if (!self::_parseServer($socket, 250)) {
				fclose($socket);
				throw new Exception("E-mail didn't sent");
			}
			fputs($socket, "QUIT\r\n");
			fclose($socket);
		} catch (Exception $e) {
			return $e->getMessage();
		}
		return true;
	}
	public function fs($method,$name,$data='') {
		if ($method == 'ls') {
			if(!$odir=opendir($name)) exit;
			while(($file=readdir($odir)) !== false)
				if ($file != "." && $file != "..")
					$res[] = $file;
			return $res;
		}else if ($method == 'add') {
			if (!file_exists(pathinfo($name)['dirname']))
				mkdir(pathinfo($name)['dirname']);
			$fp = fopen($name,'w');
			fwrite($fp,$data);
			fclose($fp);
		}else if ($method == 'exist') {
			if (file_exists($name))
				return true;
			else
				return false;
		}
	}
	public static function tree($els=[], $parent=0) {
		$br = [];
		foreach ($els as $el) {
			$o = (gettype($el) == 'object');
			if (($o ? (isset($el->parent) ? $el->parent : 0) : (isset($el['parent']) ? $el['parent'] : 0)) == $parent) {
				$ch = self::tree($els, ($o ? $el->id : $el['id']));
				if ($ch) {
					if ($o)
						$el->children = $ch;
					else
						$el['children'] = $ch;
				}
				$br[] = $el;
			}
		}
		return $br;
	}
	public static function cache($exec, $name='', $prefix='') {
		if (!empty($prefix))
			$prefix .= '_';
		$clear = (empty(self::$config['ttl']) ? (empty(self::$config['cache_clear']) ? 86400 : self::$config['cache_clear']) : self::$config['ttl']);
		switch($exec) {
			case 'json': {
				if (file_exists(dirname(__DIR__).'/../upload/cache/') && !empty($name)) {
					if (empty(self::$cache)) {
						self::$cache = dirname(__DIR__).'/../upload/cache/'.$prefix.md5(getcwd().(!empty($name) ? $name : '')).'_json.cache';
						if (file_exists(self::$cache) && (time()-$clear)<filemtime(self::$cache)) {
							$name = self::$cache;
							self::$cache = null;
							return file_get_contents($name);
						}
					}else{
						$cached = fopen(self::$cache, 'w');
						self::$cache = null;
						fwrite($cached, $name);
						fclose($cached);
					}
				}
				break;
			}
			case 'css': {
				if (!file_exists(dirname(__DIR__).'/../upload/cache/') || empty($name))
					return $name;
				$file = explode('#', $name);
				$file[] = '/upload/cache/'.$prefix.md5(getcwd().(!empty($name) ? $name : '')).'.css';
				self::$cache = dirname(__DIR__).'/..'.$file[2];
				if (!(file_exists(self::$cache) && (time()-$clear)<filemtime(self::$cache)))
					file_put_contents(self::$cache, str_replace([
						'var(--color)',
						'url(../'
					], [
						'#'.$file[1],
						'url('.explode('/page', pathinfo(Qad::params('location'), PATHINFO_DIRNAME))[0].'/data/'
					], preg_replace([
						"'(\/\/(.*?)\n)|(\/\*(.*?)\*\/)'si",
						"'\r'",
						"'\n'",
						"'	'"
					], '', file_get_contents($file[0]))));
				return $file[2];
				break;
			}
			case 'js': {
				if (!file_exists(dirname(__DIR__).'/../upload/cache/') || empty($name))
					return $name;
				$file = '/upload/cache/'.$prefix.md5(getcwd().(!empty($name) ? $name : '')).'.js';
				self::$cache = dirname(__DIR__).'/..'.$file;
				if (!(file_exists(self::$cache) && (time()-$clear)<filemtime(self::$cache)))
					file_put_contents(self::$cache, file_get_contents($name));
				return $file;
				break;
			}
			case 'image': {
				if (!file_exists(dirname(__DIR__).'/../upload/cache/') || empty($name))
					return $name;
				$href = strripos($name, 'http');
				$file = explode('/', $name);
				$file = end($file);
				$file = explode('.', $file);
				$file = [
					implode('.', array_slice($file, 0, -1)),
					end($file)
				];
				if ($href === false || $href > 0 || !in_array(strtolower($file[1]), ['gif', 'jpg', 'jpeg', 'png']))
					return $name;
				$file[] = '/upload/cache/'.$prefix.md5(getcwd().$file[0]).'.'.$file[1];
				self::$cache = dirname(__DIR__).'/..'.$file[2];
				//if (!(file_exists(self::$cache) && (time()-$clear)<filemtime(self::$cache)))
				if (!file_exists(self::$cache))
					copy($name, self::$cache);
				return $file[2];
				break;
			}
			case 'start': {
				if (file_exists(dirname(__DIR__).'/../upload/cache/')) {
					self::$cache = dirname(__DIR__).'/../upload/cache/'.$prefix.md5(getcwd().(!empty($name) ? $name : '')).'_'.md5($_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']).'.cache';
					if (file_exists(self::$cache) && (time()-$clear)<filemtime(self::$cache))
						return file_get_contents(self::$cache);
					ob_start();
				}
				return null;
				break;
			}
			case 'clear': {
				if (file_exists(dirname(__DIR__).'/../upload/cache/')) {
					if (!empty($name))
						array_map('unlink', glob(dirname(__DIR__).'/../upload/cache/'.$prefix.md5(getcwd().(!empty($name) ? $name : '')).'_*.cache'));
					else if (!empty($prefix))
						array_map('unlink', glob(dirname(__DIR__).'/../upload/cache/'.$prefix.'*'));
				}
				break;
			}
			case 'stop': {
				if (isset(self::$cache)) {
					$cached = fopen(self::$cache, 'w');
					fwrite($cached, ob_get_contents());
					fclose($cached);
					ob_end_flush();
					self::$cache = null;
				}
				break;
			}
		}
	}
	public static function fetch($url, $opts=[], $then='text', $prefix='fetch') {
		if (!empty($opts['form'])) // ['mode' => ['body' => 'do_check'], 'chkfile' => ['file' => 'Screenshot.png']]
			$opts = array_merge($opts, [
				'method' => 'post',
				'header' => array_merge((isset($opts['header']) ? $opts['header'] : []), [
					'Content-Type: multipart/form-data; boundary='.($b = '--------------------------'.microtime(true))
				]),
				'body' => (implode('', array_map(function($k, $v) use ($b) {
					$data = '--'.$b."\r\n";
					if (isset($v['file'])) {
						$data .= 'Content-Disposition: form-data; name="'.$k.'"; filename="'.basename($v['file']).'"'."\r\n";
						if (file_exists($v['file'])) {
							$data .= 'Content-Type: '.mime_content_type($v['file'])."\r\n";
							$v['body'] = file_get_contents($v['file']);
						}else
							$v['body'] = '';
					}else
						$data .= 'Content-Disposition: form-data; name="'.$k.'"'."\r\n";
					$data .= 'Content-Length: '.strlen($v['body'])."\r\n\r\n".$v['body']."\r\n";
					return $data;
				}, array_keys($opts['form']), $opts['form'])).'--'.$b."--\r\n"),
				'cache' => 'no-cache'
			]);
		$self = (object) [
			'url' => $url,
			'opts' => [
				//'follow_location' => false,
				//'ignore_errors' => true,
				'protocol_version' => '1.1',
				'method' => (!empty($opts['method']) ? strtoupper($opts['method']) : 'GET'),
				'header' => (!empty($opts['header']) ? implode("\r\n", $opts['header']) : ((isset($opts['body']) || isset($opts['xml'])) ? 'Content-type: application/x-www-form-urlencoded' : '')),
			],
			'status' => null, 'body' => null, 'cache' => null,
			'headers' => [], 'cookie' => [], 'errors' => []
		];
		$query = (empty($opts['body']) ? '' : ((gettype($opts['body']) == 'string') ? $opts['body'] : http_build_query($opts['body'])));
		if ($self->opts['method'] == 'GET' && !empty($query))
			$self->url .= '?'.$query;
		else
			$self->opts['content'] = $query;
		if (((!empty($opts['cache']) && ($opts['cache'] != 'no-cache')) || empty($opts['cache'])) && ($self->cache = dirname(__DIR__).'/../upload/cache/'.$prefix.'_'.md5(http_build_query(array_merge(['url' => $url], $opts))).'.cache') && file_exists($self->cache))
			$self->body = file_get_contents($self->cache);
		else{
			if (isset($opts['referer']))
				$self->opts['header'] .= "\r\n".'Referer: '.$opts['referer'];
			if (!empty($opts['user_agent']))
				$self->opts['user_agent'] = $opts['user_agent'];
			if (!empty($opts['timeout']))
				$self->opts['timeout'] = $opts['timeout'];
			if (!empty($opts['proxy'])) {
				$self->opts['proxy'] = 'tcp://'.$opts['proxy'];
				$self->opts['request_fulluri'] = true;
			}
			if (!empty($opts['cookie'])) {
				if (gettype($opts['cookie']) == 'string')
					foreach (explode(';', $opts['cookie']) as $cook) {
						$self->cookie[explode('=', ($cook = trim($cook)))[0]] = $cook;
					}
				else
					$self->cookie = array_merge($self->cookie, $opts['cookie']);
			}
			if (count($self->cookie) > 0)
				$self->opts['header'] = (($self->opts['header'] == '') ? '' : $self->opts['header']."\r\n").'Cookie: '.implode('; ', $self->cookie);
			try {
				$self->body = file_get_contents($self->url, false, stream_context_create(['http' => $self->opts]));
			} catch(\Exception $ex) {
				$self->errors[] = $ex->getMessage();
			}
			if (isset($http_response_header))
				foreach ($http_response_header as $h) {
					if ($self->body && stristr($h, 'content-encoding') && stristr($h, 'gzip')) {
						try {
							$self->body = gzdecode($self->body);
						} catch(\Exception $ex) {
							$self->errors[] = $ex->getMessage();
						}
					}else if (preg_match('@Set-Cookie: (([^=]+)=[^;]+)@i', $h, $match))
						$self->cookie[$match[2]] = $match[1];
					else if (preg_match('@Location: (.*)@i', $h, $match))
						$self->url = str_replace([':80', ':443'], '', $match[1]);
					$h = preg_split('/:\s*/', $h);
					if (isset($h[1]))
						$self->headers[strtolower($h[0])] = implode(':', array_slice($h, 1));
					else if (preg_match('#HTTP/[0-9\.]+\s+([0-9]+)#', $h[0], $h[1]))
						$self->status = intval($h[1][1]);
				}
			if (!empty($self->cache) && !empty($self->body))
				file_put_contents($self->cache, $self->body);
		}
		if (self::$debug['status']) {
			self::$debug['fetch'][] = $self;
			error_log(sprintf(self::$color['green'], print_r($self, true)));
		}
		return (empty($then) ? $self : (($then == 'text') ? $self->body : (
			($then == 'json') ? json_decode($self->body) : (
				($then == 'array') ? json_decode($self->body, true) : (
					($then == 'header') ? [$url, (isset($http_response_header) ? $http_response_header : null), $self->body] : (
						($then == 'obj') ? $self : null
					)
				)
			)
		)));
	}
	/* public static function fetch($url, $options=[], $then='text', $prefix='fetch') {
		if (self::$debug['status'])
			$debug = self::_microtime();
		if (!empty($options['file'])) {
			$boundary = '--------------------------'.microtime(true);
			$options = [
				'body' => implode("\r\n", [
					'--'.$boundary,
					'Content-Disposition: form-data; name="file"; filename="'.pathinfo($options['file'])['basename'].'"',
					'Content-Type: image/jpeg',
					'',
					file_get_contents($options['file']),
					'--'.$boundary.'--'
				]),
				'cache' => 'no-cache',
				'header' => 'Content-Type: multipart/form-data; boundary='.$boundary,
				'method' => 'post'
			];
		}
		$query = (
			empty($options['body'])
			? ''
			: (
				gettype($options['body']) == 'string'
				? $options['body']
				: http_build_query($options['body'])
			)
		);
		if ((!empty($options['cache']) && $options['cache'] == 'no-cache') || !$res = self::cache('json', $url.$query, $prefix)) {
			$opts = ['http' => [
				'protocol_version' => '1.1',
				'method' => (empty($options['method']) ? 'GET' : strtoupper($options['method'])),
				'header' => (empty($options['header']) ? 'Content-type: application/x-www-form-urlencoded' : (
					gettype($options['header']) == 'string'
					? $options['header']
					: implode(PHP_EOL, $options['header'])
				)),
				'user_agent' => (empty($options['user_agent']) ? '' : $options['user_agent'])
			]];
			if (!empty($options['timeout']))
				$opts['http']['timeout'] = $options['timeout'];
			if (isset($options['proxy'])) {
				$opts['http']['proxy'] = 'tcp://'.$options['proxy'][0];
				$opts['http']['request_fulluri'] = true;
			}
			if (isset($options['referer']))
				$opts['http']['header'] .= "\r\n".'Referer: '.$options['referer'];
			if (!empty($options['cache']) && $options['cache'] == 'no-cache' && !empty($options['cookie'])) {
				$cook = '';
				if (($options['cookie'] === true) && ($cook = self::params('cook_'.md5($_SERVER['PHP_SELF']))))
					$opts['http']['header'] .= "\r\n".'Cookie: '.implode(';', json_decode($cook, true));
				else if (($n = count(($aCookies = glob($_SERVER['DOCUMENT_ROOT'].'/'.$options['cookie'].'/*.txt')))) !== 0) {
					$i = 0;
					while ($i < $n) {
						$cook .= file_get_contents($aCookies[$i]).';';
						++$i;
					}
					$opts['http']['header'] .= "\r\n".'Cookie: '.$cook;
				}
			}
			if ($opts['http']['method'] == 'GET' && !empty($query))
				$url .= '?'.$query;
			else
				$opts['http']['content'] = $query;
			$context = stream_context_create($opts);
			if ($res = file_get_contents($url, 0, $context)) {
				if (empty($options['cache']) || $options['cache'] != 'no-cache') {
					$http_response_header = array_merge($http_response_header, ['Cache-name: '.self::$cache]);
					self::cache('json', $res, $prefix);
				}else if (!empty($options['cookie'])) {
					$n = count($http_response_header);
					$i = 0;
					$c = [];
					while ($i < $n) {
						if (preg_match('@Set-Cookie: (([^=]+)=[^;]+)@i', $http_response_header[$i], $cook)) {
							if ($options['cookie'] === true)
								$c[$cook[2]] = $cook[1];
							else{
								$fp = fopen($_SERVER['DOCUMENT_ROOT'].'/'.$options['cookie'].'/'.$cook['2'].'.txt', 'w');
								fwrite($fp, $cook['1']);
								fclose($fp);
							}
						}
						++$i;
					}
					if ($c) {
						$fp = json_decode(self::params(($f = 'cook_'.md5($_SERVER['PHP_SELF'])), '[]'), true);
						setcookie($f, json_encode(array_merge($fp, $c)), time()+60*60*24*30, '/');
					}
				}
			}else{
				if (file_exists(self::$cache))
					$res = file_get_contents(self::$cache);
				self::$cache = null;
			}
		}
		if ($res && self::$debug['status']) {
			$log = [
				'url' => $url,
				'options' => $options,
				'time' => self::_microtime($debug)
			];
			self::$debug['fetch'][] = $log;
			error_log(sprintf(self::$color['green'], print_r($log, true)));
		}
		return ($then == 'text' ? $res : (
			$then == 'json' ? json_decode($res) : (
				$then == 'array' ? json_decode($res, true) : (
					$then == 'header' ? [$url, (isset($http_response_header) ? $http_response_header : null), $res] : null
				)
			)
		));
	} */
	public static function json_parse($str) {
		$str = trim(preg_replace([
			'#^\s*//(.+)$#m', '#^\s*/\*(.+)\*/#Us', '#/\*(.+)\*/\s*$#Us'
		], '', $str));
		switch (strtolower($str)) {
		case 'true':
			return true;
		case 'false':
			return false;
		case 'null':
			return null;
		default:
			$m = [];
		if (is_numeric($str)) {
			return (((float)$str == (integer)$str) ? (integer)$str : (float)$str);
		}else if (preg_match('/^("|\').*(\1)$/s', $str, $m) && $m[1] == $m[2]) {
			$delim = substr($str, 0, 1);
			$utf8 = '';
			$strlen_chrs = strlen(($chrs = substr($str, 1, -1)));
			for ($c = 0; $c < $strlen_chrs; ++$c) {
				$substr_chrs_c_2 = substr($chrs, $c, 2);
				$ord_chrs_c = ord($chrs{$c});
				switch (true) {
					case $substr_chrs_c_2 == '\b':
						$utf8 .= chr(0x08);
						++$c;
					break;
					case $substr_chrs_c_2 == '\t':
						$utf8 .= chr(0x09);
						++$c;
					break;
					case $substr_chrs_c_2 == '\n':
						$utf8 .= chr(0x0A);
						++$c;
					break;
					case $substr_chrs_c_2 == '\f':
						$utf8 .= chr(0x0C);
						++$c;
					break;
					case $substr_chrs_c_2 == '\r':
						$utf8 .= chr(0x0D);
						++$c;
					break;
					case $substr_chrs_c_2 == '\\"':
					case $substr_chrs_c_2 == '\\\'':
					case $substr_chrs_c_2 == '\\\\':
					case $substr_chrs_c_2 == '\\/':
						if (($delim == '"' && $substr_chrs_c_2 != '\\\'') || ($delim == "'" && $substr_chrs_c_2 != '\\"'))
							$utf8 .= $chrs{++$c};
					break;
					case ($ord_chrs_c >= 0x20) && ($ord_chrs_c <= 0x7F):
						$utf8 .= $chrs{$c};
					break;
					case ($ord_chrs_c & 0xE0) == 0xC0:
						$utf8 .= substr($chrs, $c, 2);
						++$c;
					break;
					case ($ord_chrs_c & 0xF0) == 0xE0:
						$utf8 .= substr($chrs, $c, 3);
						$c += 2;
					break;
					case ($ord_chrs_c & 0xF8) == 0xF0:
						$utf8 .= substr($chrs, $c, 4);
						$c += 3;
					break;
					case ($ord_chrs_c & 0xFC) == 0xF8:
						$utf8 .= substr($chrs, $c, 5);
						$c += 4;
					break;
					case ($ord_chrs_c & 0xFE) == 0xFC:
						$utf8 .= substr($chrs, $c, 6);
						$c += 5;
					break;
				}
			}
			return $utf8;
		}else if (preg_match('/^\[.*\]$/s', $str) || preg_match('/^\{.*\}$/s', $str)) {
			if ($str{0} == '[') {
				$stk = array(3);
				$arr = [];
			}else{
				$stk = array(4);
				$obj = new stdClass();
			}
			array_push($stk, ['what'  => 1, 'where' => 0, 'delim' => false]);
			$chrs = trim(preg_replace([
				'#^\s*//(.+)$#m', '#^\s*/\*(.+)\*/#Us', '#/\*(.+)\*/\s*$#Us'
			], '', substr($str, 1, -1)));
			if ($chrs == '')
				return ((reset($stk) == 3) ? $arr : $obj);
			$strlen_chrs = strlen($chrs);
			for ($c = 0; $c <= $strlen_chrs; ++$c) {
				$top = end($stk);
				$substr_chrs_c_2 = substr($chrs, $c, 2);
				if (($c == $strlen_chrs) || (($chrs{$c} == ',') && ($top['what'] == 1))) {
					$slice = substr($chrs, $top['where'], ($c - $top['where']));
					array_push($stk, array('what' => 1, 'where' => ($c + 1), 'delim' => false));
					if (reset($stk) == 3)
						array_push($arr, self::json_parse($slice));
					else if (reset($stk) == 4) {
						$parts = [];
						if (preg_match('/^\s*(["\'].*[^\\\]["\'])\s*:\s*(\S.*),?$/Uis', $slice, $parts))
							$obj->{self::json_parse($parts[1])} = self::json_parse($parts[2]);
						else if (preg_match('/^\s*(\w+)\s*:\s*(\S.*),?$/Uis', $slice, $parts))
							$obj->{$parts[1]} = self::json_parse($parts[2]);
					}
				}else if ((($chrs{$c} == '"') || ($chrs{$c} == "'")) && ($top['what'] != 2))
					array_push($stk, array('what' => 2, 'where' => $c, 'delim' => $chrs{$c}));
				else if (($chrs{$c} == $top['delim']) && ($top['what'] == 2) && ((strlen(substr($chrs, 0, $c)) - strlen(rtrim(substr($chrs, 0, $c), '\\'))) % 2 != 1))
					array_pop($stk);
				else if (($chrs{$c} == '[') && in_array($top['what'], array(1, 3, 4)))
					array_push($stk, array('what' => 3, 'where' => $c, 'delim' => false));
				else if (($chrs{$c} == ']') && ($top['what'] == 3))
					array_pop($stk);
				else if (($chrs{$c} == '{') && in_array($top['what'], array(1, 3, 4)))
					array_push($stk, array('what' => 4, 'where' => $c, 'delim' => false));
				elseif (($chrs{$c} == '}') && ($top['what'] == 4))
					array_pop($stk);
				elseif (($substr_chrs_c_2 == '/*') && in_array($top['what'], array(1, 3, 4))) {
					array_push($stk, array('what' => 5, 'where' => $c, 'delim' => false));
					$c++;
				}else if (($substr_chrs_c_2 == '*/') && ($top['what'] == 5)) {
					array_pop($stk);
					$c++;
					for ($i = $top['where']; $i <= $c; ++$i) {
						$chrs = substr_replace($chrs, ' ', $i, 1);
					}
				}
			}
			if (reset($stk) == 3)
				return $arr;
			else if (reset($stk) == 4)
				return $obj;
			}
		}
	}
	public static function is_arr($arr, $children=null, $def=null) {
		if (gettype($arr) != 'array')
			return $def; //false;
		if ($children) {
			foreach ($children as $v) {
				if (!(strripos($v, '*') === false)) {
					$v = str_replace('*', '', $v);
					foreach ($arr as $k=>$vv) {
						if (!(strripos($k, $v) === false))
							$arr = $vv;
					}
				}else if (isset($arr[$v]))
					$arr = $arr[$v];
				else{
					return $def;
					break;
				}
			}
			return $arr;
		}else
			return true;
	}
	public static function db($sql='', $param=null, $exec=true) {
		if ($param && (isset($param['driver']) || isset($param['path']))) {
			if (isset($param['driver'])) {
				if ((self::$config['db_driver'] = $param['driver']) == 'mysql') {
					if (isset($param['file']))
						self::$config['db_name'] = $param['file'];
					if (empty(self::$config['db_host']))
						self::$config['db_host'] = 'localhost';
					if (isset($param['auth'])) {
						self::$config['db_login'] = $param['auth'][0];
						self::$config['db_password'] = $param['auth'][1];
					}
				}
			}
			if (isset($param['path']))
				self::$config['db_name'] = $param['path'].'/'.(isset($param['prefix']) ? $param['prefix'].'_' : '').(isset($param['file']) ? $param['file'] : $param['table']);
			if (!empty($param['where'])) {
				if (gettype($param['where']) == 'array') {
					$where = [null, [], []];
					foreach ($param['where'] as $k=>$v) {
						if (empty($param['where'][$k]))
							continue;
						$where[1][$k] = $param['where'][$k];
						$where[2][] = $k.(in_array($k, ['time_create', 'time_update']) ? ' = cast(:'.$k.' as int)' : ' = :'.$k);
					}
					$where = ['where '.implode(' and ', $where[2]), $where[1], null];
				}else
					$where = ['where '.$param['where'], null, null];
			}
		}
		if ($sql == 'create') {
			// if (!file_exists(self::$config['db_name'].'.sqlite') || self::$config['db_driver'] != 'sqlite') {
				$arr = [];
				if (!empty($param['triggers']) && in_array('time', $param['triggers']))
					$param['columns']['time_create'] = $param['columns']['time_update'] = "default (cast(strftime('%s', 'now') as int))";
				foreach ($param['columns'] as $k=>$v) {
					if (self::$config['db_driver'] == 'mysql')
						$v = preg_replace('/autoincrement/i', 'AUTO_INCREMENT', $v);
					$arr[] = $k.' '.$v;
				}
				if (!empty($param['indexes']) && (self::$config['db_driver'] == 'mysql'))
					foreach ($param['indexes'] as $v) {
						$arr[] = $v[0].' '.$v[0].'_'.implode('_', $v[1]).' ('.implode(', ', $v[1]).')';
					}
				if (isset($param['autoclean']) && (self::$config['db_driver'] == 'sqlite'))
					self::db('PRAGMA auto_vacuum = 1');
				self::db('create table if not exists '.$param['table'].' ('.implode(', ', $arr).')');
				if (!empty($param['columns']['time_update']))
					self::db('create trigger if not exists time after update on '.$param['table'].' begin update '.$param['table'].' set time_update = (cast(strftime("%s", "now") as int)) where id = NEW.id; end;');
			// }else
			if (isset($param['autoclean']))
				self::db('delete from '.$param['table'].' where "date" <= datetime("now", "-'.$param['autoclean'].'")');
			return;
		}else if ($sql == 'insert') {
			$data = (array) $param['data'];
			$arr = [];
			$values = [];
			foreach ($param['columns'] as $k=>$v) {
				if (empty($data[$k]))
					continue;
				$arr[($values[] = $k)] = $data[$k];
				// $arr[$k] = $data[$k];
				// $values[] = ':'.$k;
			}
			return self::db('insert into '.$param['table'].' ('.implode(', ', $values).') values ('.implode(', ', preg_filter('/^/', ':', $values)).')', $arr);
			// return self::db('insert into '.$param['table'].' ('.implode(', ', array_flip($arr)).') values ('.implode(', ', $values).')', $arr);
		}else if ($sql == 'update') {
			$data = (array) $param['data'];
			$arr = [];
			$values = [];
			foreach ($param['columns'] as $k=>$v) {
				if (!isset($data[$k]))
					continue;
				$arr[$k] = (empty($data[$k]) ? null : $data[$k]);
				if ($k != 'id')
					$values[] = $k.' = :'.$k;
			}
			return self::db('update '.$param['table'].' set '.implode(', ', $values).' where id = :id', $arr);
		}else if ($sql == 'count')
			return self::db('select count(id) as count from '.$param['table'].' '.(empty($where) ? '' : $where[0]), (empty($where) ? null : $where[1]))->fetch()->count;
		else if ($sql == 'select')
			return self::db(implode(' ', [
				'select '.(empty($param['select']) ? '*' : $param['select']),
				'from '.$param['table'],
				(empty($param['join']) ? '' : (isset($param['join'][1]) ? $param['join'][1].' ' : '').'join '.implode((isset($param['join'][1]) ? ' '.$param['join'][1] : '').' join ', $param['join'][0])),
				(empty($where) ? '' : $where[0]),
				(empty($param['order']) ? '' : 'order by '.$param['order']),
				(empty($param['limit']) ? '' : 'limit '.$param['limit'])
			]), ((gettype($exec) == 'array') ? $exec : (empty($where) ? null : $where[1])));
		else if ($param && (isset($param['driver']) || isset($param['path'])))
			unset($param['driver'], $param['path'], $param['auth'], $param['table'], $param['columns'], $param['links'], $param['indexes'], $param['autoclean'], $param['prefix'], $param['file'], $param['triggers']);
		try {
			if (empty(self::$sql)) {
				if (self::$config['db_driver'] == 'mysql')
					self::$sql = new PDO('mysql:host='.self::$config['db_host'].';dbname='.self::$config['db_name'], self::$config['db_login'], self::$config['db_password'], [
						// PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8'
						1002 => 'SET NAMES utf8'
					]);
				else if (self::$config['db_driver'] == 'sqlite') {
					self::$sql = new PDO('sqlite:'.(
						file_exists(self::$config['db_name'].'.sqlite')
						? self::$config['db_name'].'.sqlite'
						: $_SERVER['DOCUMENT_ROOT'].'/'.self::$config['db_name'].'.sqlite'
					));
					self::$sql->sqliteCreateFunction('lower', function($res) {
						return mb_strtolower($res);
					});
				}else
					die ('empty $config["db_driver"]');
				self::$sql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
				self::$sql->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
			}
			if (self::$debug['status'])
				self::$debug['db'][] = ($param ? [$sql, $param] : $sql);
			if (!(stripos($sql, 'PRAGMA') === false))
				return self::$sql->query($sql);
			$q = self::$sql->prepare($sql);
			if ($exec) {
				$q->execute($param);
				if (!(stripos($sql, 'insert') === false))
					return self::$sql->lastInsertId();
			}
			return $q;
		}catch (Exception $e) {
			/* if (!(stripos($_SERVER['PHP_SELF'], '/api/') === false))
				echo json_encode([$e, $sql, $param]); */
			throw $e;
		}
	}
	public static function redirect($url=null, $params=[], $time=0) {
		if ($url)
			header('Refresh: '.$time.'; url='.$url.($params ? '?'.http_build_query($params) : ''));
		else
			return $_SERVER['REQUEST_URI'];
	}
	public static function params($param=null, $default=null, $prefix=null) {
		$query = (isset($_SERVER['QUERY_STRING']) ? $_SERVER['QUERY_STRING'] : '');
		$params = (object) array_change_key_case(array_merge([
			'argo' => explode('&', $query)[0],
			'location' => (empty($_SERVER['HTTP_HOST']) ? ($_SERVER['HTTP_HOST'] = '') : ($_SERVER['SERVER_PORT'] == 443 ? 'https' : 'http').'://'.$_SERVER['HTTP_HOST']).$_SERVER['PHP_SELF']
		], $_FILES, $_GET, $_POST, $_COOKIE, $_SESSION), CASE_LOWER);
		if (!empty($_SERVER['argv'][1])) {
			foreach (array_slice($_SERVER['argv'], 1) as $com) {
				if (substr($com, 0, 2) != '--')
					continue;
				$c = explode('=', substr($com, 2));
				$params->{$c[0]} = $c[1];
			}
		}
		if ($param) {
			if (empty($params->{$param}))
				return $default;
			else{
				if ($prefix && count(explode('/', $params->{$param})) == 1)
					return $prefix.'/'.$params->{$param};
				else
					return $params->{$param};
			}
		}else
			return $params;
	}
	public static function routing($route=null)  {
		if (!$route)
			$route = $_GET['controller'];
		if (empty($route))
			return false;
		$controller = explode('/', $route);
		if (!file_exists('page/'.$controller[0].'/controllers.php')) {
			if (file_exists('page/'.$controller[0].'/'.$controller[1].'.php'))
				include 'page/'.$controller[0].'/'.$controller[1].'.php';
			else{
				header('HTTP/1.1 404 Not Found');
				header('Status: 404 Not Found');
			}
			exit;
		}
		include 'page/'.$controller[0].'/controllers.php';
		$controller[] = ucfirst($controller[0]).'Controller';
		if (count($controller) == 3 && $controller[1] == '')
			$controller[1] = 'index';
		else if (count($controller) == 2)
			$controller = array_merge(array_slice($controller,0,1), ['index'], array_slice($controller, 1));
		$controller[] = new $controller[2]();
		if (method_exists($controller[3], 'onready'))
			echo call_user_func([$controller[3], 'onready'], $_GET);
		if (method_exists($controller[3], ucfirst($controller[1]).'Action'))
			echo call_user_func([$controller[3], ucfirst($controller[1]).'Action'], $_GET);
		else{
			if (function_exists('error_page'))
				error_page('404');
			else{
				header('HTTP/1.1 404 Not Found');
				header('Status: 404 Not Found');
			}
			exit;
		}
		if (method_exists($controller[3], 'onload'))
			echo call_user_func([$controller[3], 'onload'], $_GET);
	}
	public static function model($api) {
		foreach ($api as $model) {
			if (file_exists('api/'.$model.'.php'))
				include_once('api/'.$model.'.php');
		}
	}
	public static function template($t, $data=[], $debug=false) {
		ob_start();
		ob_implicit_flush(false);
		extract($data, EXTR_OVERWRITE);
		include 'page/'.$t.'.php';
		if ($debug && self::$debug['status']) {
			self::$debug['memory'] = self::_memory(self::$debug['memory']);
			self::$debug['time'] = self::_microtime(self::$debug['time']);
			error_log(sprintf(self::$color['cyan'], print_r([
				'memory' => self::$debug['memory'],
				'time' => self::$debug['time']
			], true)));
			echo '<script>console.log('.json_encode(self::$debug).');</script>';
		}
		return ob_get_clean();
	}
	public static function array2object($a) {
		return array_map(function($k, $v) {
			return ['k' => $k, 'v' => $v];
		}, array_keys($a), $a);
	}
	public function rest($class) {
		if (!$class)
			$class = get_class();
		if (self::params('method') || !empty($class::$method)) {
			$rArray = (array) self::params();
			$method = self::params('method', (!empty($class::$method) ? $class::$method : null));
			if ($callback = self::params('callback', (!empty($class::$callback) ? $class::$callback : null)))
				header('Content-Type: application/x-javascript; charset=utf-8');
			else
				header('Content-Type: application/json; charset=utf-8');
			if (method_exists($class, $method)) {
				$ref = new ReflectionMethod($class, $method);
				if ($ref->isPublic()) {
					$pCount = count(($params = $ref->getParameters()));
					$pArray = [];
					$paramStr = '';
					$i = 0;
					foreach ($params as $param) {
						$paramStr .= ($n = strtolower($param->getName()));
						$pArray[$n] = ($param->isOptional() ? $param->getDefaultValue() : null);
						if ($i != $pCount-1)
							$paramStr .= ', ';
						++$i;
					}
					foreach ($pArray as $key => $val) {
						if (isset($rArray[($n = strtolower($key))]))
							$pArray[$n] = ((isset($pArray[$n]) && gettype($pArray[$n]) == 'array') ? json_decode($rArray[$n], true) : $rArray[$n]);
					}
					if ((count($pArray) == $pCount) && !in_array(null, $pArray, true)) {
						$response = call_user_func_array([$class, $method], $pArray);
						if ((gettype($response) == 'array') || (gettype($response) == 'object')) {
							if (isset($_GET['__amp_source_origin']))
								$response = ['items' => [[
									$method => (empty($_GET['replace']) ? $response : str_replace(($replace = json_decode($_GET['replace']))[0], $replace[1], $response))
								]]];
							echo (isset($callback) ? $callback.'('.json_encode($response).');' : json_encode($response));
						}else if (isset($callback))
							echo $callback.'("'.addslashes($response).'");';
						else if (isset($response)) {
							header('Content-Type: text/html; charset=utf-8');
							echo $response;
						}
					}else{
						if (isset($callback))
							echo $callback.'('.json_encode(['error' => 'Required parameter(s) for '.$method.': '.$paramStr]).');';
						else
							echo json_encode(['error' => 'Required parameter(s) for '.$method.': '.$paramStr]);
					}
				}else
					echo json_encode(['error' => 'No access to the method.']);
			}else
				echo (isset($callback) ? $callback.'('.json_encode(['error' => 'The method '.$method.' does not exist.']).');' : json_encode(['error' => 'The method '.$method.' does not exist.']));
		}else{
			header('Content-Type: application/json');
			if (isset($_GET['__amp_source_origin']))
				echo json_encode(['items' => [['error' => 'No method was requested.']]]);
			else
				echo json_encode(['error' => 'No method was requested.']);
		}
	}
	/*
	public function rest($serviceClass) {
		/*
		if (stristr($_SERVER['SCRIPT_FILENAME'], '/api/') === FALSE)
			return;
		 * /
		if (self::params('method') || !empty($serviceClass::$method)) {
			$rArray = (array) self::params();
			$method = self::params('method', (!empty($serviceClass::$method) ? $serviceClass::$method : null));
			$callback = self::params('callback', (!empty($serviceClass::$callback) ? $serviceClass::$callback : null));
			if (method_exists($serviceClass, $method)) {
				$ref = new ReflectionMethod($serviceClass, $method);
				$params = $ref->getParameters();
				$pCount = count($params);
				$pArray = array();
				$paramStr = "";
				$i = 0;
				foreach ($params as $param) {
					$pArray[strtolower($param->getName())] = ($param->isOptional() ? $param->getDefaultValue() : null);
					$paramStr .= $param->getName();
					if ($i != $pCount-1)
						$paramStr .= ", ";
					$i++;
				}
				foreach ($pArray as $key => $val) {
					if (isset($rArray[strtolower($key)]))
						$pArray[strtolower($key)] = $rArray[strtolower($key)];
				}
				if (count($pArray) == $pCount && !in_array(null, $pArray)) {
					$response = call_user_func_array(array($serviceClass, $method), $pArray);
					if (gettype($response) == 'array' || gettype($response) == 'object') {
						if (isset($callback)) {
							header('Content-Type: application/x-javascript');
							echo $callback.'('.json_encode($response).');';
						}else{
							header('Content-Type: application/json');
							echo json_encode($response);
						}
					}else{
						if (isset($callback)) {
							header('Content-Type: application/x-javascript');
							echo $callback.'("'.addslashes($response).'");';
						}else
							echo $response;
					}
				}else{
					if (isset($callback)) {
						header('Content-Type: application/x-javascript');
						echo $callback.'('.json_encode(['error' => 'Required parameter(s) for '.$method.': '.$paramStr]).');';
					}else{
						header('Content-Type: application/json');
						echo json_encode(['error' => 'Required parameter(s) for '.$method.': '.$paramStr]);
					}
				}
			}else{
				if (isset($callback)) {
					header('Content-Type: application/x-javascript');
					echo $callback.'('.json_encode(['error' => 'The method '.$method.' does not exist.']).');';
				}else{
					header('Content-Type: application/json');
					echo json_encode(['error' => 'The method '.$method.' does not exist.']);
				}
			}
		}else{
			header('Content-Type: application/json');
			echo json_encode(['error' => 'No method was requested.']);
		}
	}
	 */
}
$qad = new Qad();
set_error_handler('Qad::err');
