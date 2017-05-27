<?php
/*
=====================================================
Qad Framework (qad.php)
-----------------------------------------------------
https://qwedl.com/
-----------------------------------------------------
Copyright (c) 2016 Alex Smith
=====================================================
*/
header('Content-Type: text/html; charset=utf-8');
session_start();
class Qad {
	public static $config;
	public static $cache;
	public static $sql;
	public static $nosql;
	public static $document;
	private static $debug = [
		'status' => false,
		'sql' => []
	];
	
	public function __construct() {
		$conf = (file_exists('data/config.php') ? 'data/config.php' : dirname(__DIR__).'/config.php');
		if (file_exists($conf))
			self::$config = include($conf);
		if (self::$debug['status']) {
			ini_set('display_errors', 1);
			ini_set('error_reporting', 2047);
		}
    }	
	private function _parseServer($socket, $response) {
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
	public function csrf($check=false) {
		if ($check) {
			if (hash_equals($_SESSION['csrf'], $_REQUEST['csrf']))
				return true;
			else
				return false;
		}else{
			if (empty($_SESSION['csrf']))
				$_SESSION['csrf'] = bin2hex(random_bytes(32));
			return '<input type="hidden" name="csrf" value="'.$_SESSION['csrf'].'" />';
		}
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
	public static function debug() {
		self::$debug['status'] = true;
	}
	public function furl($s) {
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
		$resultMerge = array_count_values(explode('; ', substr($keywords[0], 0, -2)));
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
	public function recaptcha($recaptcha) {
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
	public function mail($to, $subject, $message, $headers='') {
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
			return  $e->getMessage();
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
	public function cache($exec,$name='') {
		switch($exec) {
			case 'json': {
				if (file_exists(dirname(__DIR__).'/../upload/cache/') && !empty($name)) {
					if (empty(self::$cache)) {
						self::$cache = dirname(__DIR__).'/../upload/cache/'.md5(getcwd().(!empty($name) ? $name : '')).'_json.cache';
						if (file_exists(self::$cache) && (time()-86400)<filemtime(self::$cache))
							return file_get_contents(self::$cache);
					}else{
						$cached = fopen(self::$cache, 'w');
						fwrite($cached, $name);
						fclose($cached);
						self::$cache = null;
					}
				}
				break;
			}
			case 'start': {
				if (file_exists(dirname(__DIR__).'/../upload/cache/')) {
					self::$cache = dirname(__DIR__).'/../upload/cache/'.md5(getcwd().(!empty($name) ? $name : '')).'_'.md5($_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']).'.cache';
					if (file_exists(self::$cache) && (time()-86400)<filemtime(self::$cache))
						return file_get_contents(self::$cache);
					ob_start();
				}
				return null;
				break;
			}
			case 'clear': {
				if (file_exists(dirname(__DIR__).'/../upload/cache/'))
					array_map('unlink', glob(dirname(__DIR__).'/../upload/cache/'.md5(getcwd().(!empty($name) ? $name : '')).'_*.cache'));
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
	public function db($sql='', $param=null, $exec=true) {
		try {
			if (empty(self::$sql)) {
				if (self::$config['db_driver'] == 'mysql')
					self::$sql = new PDO('mysql:host='.self::$config['db_host'].';dbname='.self::$config['db_name'], $config['db_login'], $config['db_password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));
				else if (self::$config['db_driver'] == 'sqlite')
					self::$sql = new PDO('sqlite:'.(
						file_exists(self::$config['db_name'].'.sqlite')
						? self::$config['db_name'].'.sqlite'
						: $_SERVER['DOCUMENT_ROOT'].'/'.self::$config['db_name'].'.sqlite'
					));
				else
					die ('empty $config["db_driver"]');
				self::$sql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
				self::$sql->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
			}
			if (self::$debug['status'])
				self::$debug['sql'][] = ($param ? [$sql, $param] : $sql);
			$q = self::$sql->prepare($sql);
			if ($exec) {
				$q->execute($param);
				if (!(stripos($sql, 'insert') === false))
					return self::$sql->lastInsertId();
			}
			return $q;
		}catch (Exception $e) {
			echo json_encode([$e, $sql, $param]);
			throw $e;
		}
	}
	public function sql($exec,$p1='',$p2='',$p3='',$p4='') {
		switch($exec) {
			case 'create': {
				$q = 'create table if not exists '.$p1.' (`id` integer primary key autoincrement, `created` default null';
				foreach ($p2 as $k)
					$q .= ', `'.$k.'` text default null';
				$q .= ')';
				$stmt = self::$sql->prepare($q);
				$stmt->execute();
				break;
			}
			case 'search': {
				if ($p3 == '')
					$p3 = 0;
				$find = explode(':',$p1);
				if (preg_match('/\*/', $find[count($find)-1])) {
					$q = 'select id from "'.$find[0].'" where "'.$find[1].'" like ? order by id desc '.(!empty($p2) ? 'limit '.$p3.','.$p2 : '');
					$stmt = self::$sql->prepare($q);
					$stmt->execute(array('%'.str_replace('*','',$find[count($find)-1]).'%'));
				}else{
					$q = 'select id from "'.$find[0].'" where "'.$find[1].'" = ? order by id desc '.(!empty($p2) ? 'limit '.$p3.','.$p2 : '');
					$stmt = self::$sql->prepare($q);
					$stmt->execute(array($find[count($find)-1]));
				}
				$res = array();
				foreach ($stmt->fetchAll() as $n)
					$res[] = $n['id'];
				return json_encode($res);
				break;
			}
			case 'delete': {
				$stmt = self::$sql->prepare('delete from '.$p1.' WHERE id = ?');
				$res = $stmt->execute(array($p2));
				return json_encode(['status'=>$res]);
				break;
			}
			case 'select': {
				try {
					if (gettype($p2) == 'integer' || empty($p2)) {
						if ($p3 == '')
							$p3 = 0;
						$q = 'select '.(!empty($p4) ? 'id,'.implode(',',$p4) : '*').' from '.$p1.' order by id desc '.(!empty($p2) ? 'limit '.$p3.','.$p2 : '');
						$stmt = self::$sql->prepare($q);
						$stmt->execute();
						$ret = array();
						foreach ($stmt->fetchAll() as $n) {
							$ret[] = array(
								'id' => $n['id'],
								'response' => array_diff_key($n,array_flip(array('id')))
							);
						}
						return $ret;
					}else if (gettype($p2) == 'string') {
						$q = 'select '.(!empty($p4) ? 'id,'.implode(',',$p4) : '*').' from '.$p1.' where '.$p2.' = ?';
						$stmt = self::$sql->prepare($q);
						$stmt->execute(array($p3));
						$ret = $stmt->fetch();
						if ($ret)
							return json_encode(array(
								'id' => $ret['id'],
								'response' => array_diff_key($ret,array_flip(array('id')))
							));
						else
							return json_encode(['id'=>null]);
					}
				} catch(Exception $e) {
					return false;
				}
				break;
			}
			case 'update': {
				foreach ($p3 as $n=>$t) {
					if (preg_match('/\/\//', $n)) {
						$p3[explode('//', $n)[1]] = $t;
						unset($p3[$n]);
					}else if (preg_match('/\//', $n)) {
						$p3[explode('/', $n)[1]] = $t;
						unset($p3[$n]);
					}
				}
				$q = 'update '.$p1.' set ';
				$i == 0;
				$count = count($p3);
				foreach ($p3 as $n=>$t) {
					++$i;
					$q .= $n.' = :'.$n;
					if ($i < $count)
						$q .= ', ';
				}
				$q .= ' where id = :id';
				$p3['id'] = $p2;
				$stmt = self::$sql->prepare($q);
				$res = $stmt->execute($p3);
				return json_encode(['status'=>$res]);
				break;
			}
			case 'insert': {
				foreach ($p2 as $n=>$t) {
					if (preg_match('/\/\//', $n)) {
						$p2[explode('//', $n)[1]] = $t;
						unset($p2[$n]);
					}else if (preg_match('/\//', $n)) {
						$p2[explode('/', $n)[1]] = $t;
						unset($p2[$n]);
					}
				}
				$q = 'insert into '.$p1.' (';
				$count = count($p2);
				for ($i = 1, $j = 0; $i <=2; ++$i)
					foreach ($p2 as $n=>$t) {
						++$j;
						$q .= ($i == 1 ? '' : ':').$n;
						if ($j < $count)
							$q .= ', ';
						else{
							if ($i == 1)
								$q .= ', created) values (';
							$j = 0;
						}
					}
				$q .= ', :created)';
				$p2['created'] = time();
				$stmt = self::$sql->prepare($q);
				$stmt->execute($p2);
				return json_encode(['id'=>(int) self::$sql->lastInsertId()]);
				break;
			}
			default: {
				try {
					if (empty($p1)) {
						if (isset(self::$config) && !empty(self::$config['db_host']))
							$p1 = self::$config['db_host'];
						else
							$p1 = 'sql/';
					}
					if (empty($p2) && !empty(self::$config['db_login']))
						$p2 = self::$config['db_login'];
					if (empty($p3) && !empty(self::$config['db_password']))
						$p3 = self::$config['db_password'];
					if (!empty($p1) && !empty($p2) && !empty($p3)) {
						self::$sql = new PDO('mysql:host='.$p1.';dbname='.$exec, $p2, $p3, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));
						self::$sql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
						self::$sql->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_NAMED);
						return self::$sql;
					}else if (file_exists($p1)) {
						self::$sql = new PDO('sqlite:'.$p1.$exec.'.sqlite');
						self::$sql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
						self::$sql->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_NAMED);
						return self::$sql;
					}else
						exit('Connect error');
				} catch(Exception $e) {
					exit('Connect error');
				}
				break;
			}
		}
	}
	public function nosql($exec,$p1='',$p2='',$p3='',$p4='') {
		switch($exec) {
			case 'search': {
				$p1 = mb_strtolower($p1);
				if (file_exists(dirname(__DIR__).'/../upload/cache/')) {
					$cache = dirname(__DIR__).'/../upload/cache/search_'.str_replace([':*',':'],['','_'],$p1).md5(self::$nosql->getOption(Redis::OPT_PREFIX).$p2.$p3).'.cache';
					if (file_exists($cache) && (time()-1800)<filemtime($cache)) {
						$cached = file_get_contents($cache);
						return $cached;
						exit;
					}
				}
				//$it = null;
				//while($a = self::$nosql->scan($it,self::$nosql->getOption(Redis::OPT_PREFIX).mb_strtolower($p1),1000)) {
				$a = self::$nosql->keys($p1);
				if ($p3 == '')
					$p3 = 0;
				for (; $p3<count($a); ++$p3) {
					if (substr_count($p1,'*') >= 2) {
						$t = explode(':',$a[$p3]);
						$arr[] = $t[array_search('id',$t)+1];
					}else
						$arr[] = str_replace([
							str_replace('*','',$p1),
							self::$nosql->getOption(Redis::OPT_PREFIX)
						],'',$a[$p3]);
					if ($p2 != '') {
						--$p2;
						if ($p2 == 0)
							break;
					}
				}
				//}
				$json = json_encode($arr);
				if (isset($cache)) {
					$cached = fopen($cache, 'w');
					fwrite($cached, $json);
					fclose($cached);
				}
				return $json;
				break;
			}
			case 'get': {
				$value = self::$nosql->get($p1);
				if (($result = @unserialize($value)) === false)
					return $value;
				return $result;
				break;
			}
			case 'set': {
				if (is_array($p2))
					$p2 = serialize($p2);
				self::$nosql->set($p1, $p2);
				self::$nosql->save();
				break;
			}
			case 'delete': {
				if (self::$nosql->exists($p1) && self::$nosql->type($p1)!=2)
					self::$nosql->del($p1);
				if (!empty($p2)) {
					$w = self::$nosql->hgetall($p1.':id:'.$p2);
					foreach ($w as $k=>$v) {
						if (self::$nosql->exists($p1.':'.$k.':'.mb_strtolower($v)))
							self::$nosql->del($p1.':'.$k.':'.mb_strtolower($v));
						else if ($p1.':'.$k.':id:'.$p2.':'.mb_strtolower($v))
							self::$nosql->del($p1.':'.$k.':id:'.$p2.':'.mb_strtolower($v));
					}
					self::$nosql->sRem($p1,$p2);
					$res = self::$nosql->del($p1.':id:'.$p2);
				}
				self::$nosql->save();
				if (file_exists(dirname(__DIR__).'/../upload/cache/'))
					array_map('unlink', glob(dirname(__DIR__).'/../upload/cache/search_'.str_replace([':*',':'],['','_'],$p1).'_*.cache'));
				return json_encode(['status'=>$res]);
				break;
			}
			case 'select': {
                if (gettype($p2) == 'integer' || empty($p2)) {
                    if ($p3 == '')
                        $p3 = 0;
                    $data = self::$nosql->sort($p1, array(
                        'limit' => ($p2>='0' ? array($p3,$p2) : null),
                        'sort' => 'desc'
                    ));
                    foreach ($data as $id)
						if (self::$nosql->exists($p1.':id:'.$id)) {
							if (empty($p4))
								$ret[] = [
									'id' => $id,
									'response' => self::$nosql->hgetall($p1.':id:'.$id)
								];
							else
								$ret[] = [
									'id' => $id,
									'response' => self::$nosql->hmget($p1.':id:'.$id,$p4)
								];
						}
					//$ret['count'] = count($data);
                    if ($ret)
                        return $ret;
                }else if (gettype($p2) == 'string') {
                    if ($p2 != 'id')
                        $p3 = self::$nosql->get($p1.':'.$p2.':'.$p3);
					if (!self::$nosql->exists($p1.':id:'.$p3))
						return json_encode(['id'=>null]);
                    if (empty($p4))
                        $ret = self::$nosql->hgetall($p1.':id:'.$p3);
                    else
                        $ret = self::$nosql->hmget($p1.':id:'.$p3,$p4);
                    if ($ret)
                        return json_encode(['id'=>$p3,'response'=>$ret]);
                }
				break;
			}
			case 'update': {
				foreach ($p3 as $k=>$v) {
					if (substr($k,0,1) == '/') {
						$o = self::$nosql->hmget($p1.':id:'.$p2,[substr($k,1)])[substr($k,1)];
						if ($o != $v) {
							if (is_array($o))
								$o = json_encode($o);
							if (self::$nosql->exists($p1.':'.substr($k,1).':id:'.$p2.':'.mb_strtolower($o)))
								self::$nosql->del($p1.':'.substr($k,1).':id:'.$p2.':'.mb_strtolower($o));
							else if (self::$nosql->exists($p1.':'.substr($k,1).':id:'.$p2.':'))
								self::$nosql->del($p1.':'.substr($k,1).':id:'.$p2.':');
							if (!empty($v)) {
								if (is_array($v))
									$v = json_encode($v);
								self::$nosql->set($p1.':'.substr($k,1).':id:'.$p2.':'.mb_strtolower($v),null);
							}
							$p3[substr($k,1)] = $v;
						}
						unset($p3[$k]);
					}else{
						$o = self::$nosql->hmget($p1.':id:'.$p2,[$k])[$k];
						if (self::$nosql->exists($p1.':'.$k.':'.$o)) {
							self::$nosql->del($p1.':'.$k.':'.$o);
							self::$nosql->set($p1.':'.$k.':'.$v, $p2);
						}
					}
				}
				$res = self::$nosql->hmset($p1.':id:'.$p2, $p3);
				self::$nosql->save();
				return json_encode(['status'=>$res]);
				break;
			}
			case 'insert': {
				$id = (self::$nosql->sCard($p1))+1;
				foreach ($p2 as $k=>$v)
					if (substr($k,0,2) == '//') {
						$p2[substr($k,2)] = $v;
						unset($p2[$k]);
						self::$nosql->set($p1.':'.substr($k,2).':'.mb_strtolower($v), $id);
					}else if (substr($k,0,1) == '/') {
						$p2[substr($k,1)] = $v;
						unset($p2[$k]);
						self::$nosql->set($p1.':'.substr($k,1).':id:'.$id.':'.mb_strtolower($v),null);
					}
				$p2['created'] = time();
				self::$nosql->hmset($p1.':id:'.$id, $p2);
				self::$nosql->sAdd($p1,$id);
				self::$nosql->save();
				if (file_exists(dirname(__DIR__).'/../upload/cache/'))
					array_map('unlink', glob(dirname(__DIR__).'/../upload/cache/search_'.str_replace([':*',':'],['','_'],$p1).'*.cache'));
				return json_encode(['id'=>$id]);
				break;
			}
			default: {
				try {
					self::$nosql = new Redis();
					if (empty($p1)) {
						if (isset(self::$config) && !empty(self::$config['db_host'])) {
							$p1 = self::$config['db_host'];
							$p2 = self::$config['db_port'];
							if (!empty(self::$config['db_password']))
								$p3 = self::$config['db_password'];
						}else{
							$p1 = 'localhost';
							$p2 = '6379';
						}
					}
					self::$nosql->connect($p1,$p2);
					if (!empty($p3))
						self::$nosql->auth($p3);
					self::$nosql->setOption(Redis::OPT_PREFIX,$exec.'.');
					return self::$nosql;
				} catch(RedisException $e) {
					exit('Connect error');
				}
				break;
			}
		}
	}
	public function document($obj,$exec='',$html=null) {
		if ($exec == 'attr') {
			$xml = (array) simplexml_import_dom($obj);
			return $xml['@attributes'];
		}else if ($exec == 'innerHTML') {
			if (gettype($html) == 'string') {
				while ($obj->hasChildNodes())
					$obj->removeChild($obj->firstChild);
				if (!empty($html)) {
					$tmpDoc = new DOMDocument('1.0', 'UTF-8');
					$tmpDoc->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
					$tmpDoc->encoding = 'utf-8';
					foreach ($tmpDoc->getElementsByTagName('body')->item(0)->childNodes as $node) {
						$node = $obj->ownerDocument->importNode($node, true);
						$obj->appendChild($node);
					}
				}
			}else
				return implode(array_map([$obj->ownerDocument,"saveHTML"],iterator_to_array($obj->childNodes)));
		}else if (preg_match('/http:\/\//', $obj) || preg_match('/https:\/\//', $obj) || preg_match('/.php/', $obj) || preg_match('/.html/', $obj)) {
			libxml_use_internal_errors(true);
			self::$document = new DOMDocument('1.0', 'UTF-8');
			self::$document->loadHTMLFile($obj);
			self::$document->encoding = 'utf-8';
			return self::$document;
		}else{
			$find = explode(' ', $obj);
			$count = count($find);
			$res = self::$document;
			for ($i = 0; $i < $count; ++$i) {
				$v = $find[$i];
				if (preg_match('/\./', $v)) {
					$arr = [];
					$v = explode('.', $v);
					$el = self::$document->getElementsByTagName(($v[0] != '' ? $v[0] : '*'));
					for ($j = 0; $j < $el->length; ++$j)
						if ($el->item($j)->attributes->getNamedItem('class')->nodeValue == $v[1])
							$arr[] = $res = $el->item($j);
					if ($exec == 'all' && ($i+1)==$count)
						return $arr;
				}else if (preg_match('/\#/', $v)) {
					$v = explode('#', $v);
					$res = $res->getElementById($v[1]);
				}else{
					if ($exec == 'all' && ($i+1)==$count)
						$res = $res->getElementsByTagName($v);
					else
						$res = $res->getElementsByTagName($v)[0];
				}
			}
			return $res;
		}
	}
	public static function redirect($url=null, $params=[], $time=0) {
		if ($url)
			header('Refresh: '.$time.'; url='.$url.($params ? '?'.http_build_query($params) : ''));
		else
			return $_SERVER['REQUEST_URI'];
	}
	public static function pagination($count=10, $page=1, $list=null, $limits=null, $total=null) {
		if ($page == 0)
			$page = 1;
		if ($list) {
			$url = (stristr($_SERVER['REQUEST_URI'], 'page='.$page) === FALSE
						? (stristr($_SERVER['REQUEST_URI'], '?') === FALSE
							? $_SERVER['REQUEST_URI'].'?page=#page#'
							: $_SERVER['REQUEST_URI'].'&page=#page#'
						)
						: str_replace('page='.$page, 'page=#page#', $_SERVER['REQUEST_URI'])
					);
			return [
				'list' => array_slice($list, 0, -1),
				'button' => [
					'prev' => ($page > 1 ? ($page-1) : null),
					'prev_url' => str_replace('#page#', $page-1, $url),
					'next' => (count($list) > $count ? ($page+1) : null),
					'next_url' => str_replace('#page#', $page+1, $url),
					'url' => $url,
					'count' => $count,
					'total' => $total,
					'limits' => $limits,
					'pages' => ($limits ? ceil($total / $count) : null),
					'page' => $page
				]
			];
		}else
			return ($page-1)*$count.', '.($count+1);
	}
	public static function params($param=null, $default=null, $prefix=null) {
		$query = (isset($_SERVER['QUERY_STRING']) ? $_SERVER['QUERY_STRING'] : '');
		$params = (object) array_change_key_case(array_merge(['argo' => explode('&', $query)[0]], $_FILES, $_GET, $_POST, $_COOKIE, $_SESSION), CASE_LOWER);
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
			header('HTTP/1.1 404 Not Found');
			header('Status: 404 Not Found');
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
	public static function template($t, $data=[]) {
		ob_start();
		ob_implicit_flush(false);
		extract($data, EXTR_OVERWRITE);
		include 'page/'.$t.'.php';
		if (self::$debug['status'])
			self::dump(self::$debug['sql']);
		return ob_get_clean();
	}
	public function rest($serviceClass) {
		if (stristr($_SERVER['SCRIPT_FILENAME'], '/api/') === FALSE)
			return;
		if (self::params('method') || !empty($serviceClass::$method)) {
			$rArray = (array) self::params();
			$method = self::params('method', (!empty($serviceClass::$method) ? $serviceClass::$method : null));
			if (method_exists($serviceClass, $method)) {
				$ref = new ReflectionMethod($serviceClass, $method);
				$params = $ref->getParameters();
				$pCount = count($params);
				$pArray = array();
				$paramStr = "";
				$i = 0;
				foreach ($params as $param) {
					$pArray[strtolower($param->getName())] = null;
					$paramStr .= $param->getName();
					if ($i != $pCount-1)
						$paramStr .= ", ";
					$i++;
				}
				foreach ($pArray as $key => $val)
					$pArray[strtolower($key)] = $rArray[strtolower($key)];
				if (count($pArray) == $pCount && !in_array(null, $pArray)) {
					$response = call_user_func_array(array($serviceClass, $method), $pArray);
					if (gettype($response) == 'array' || gettype($response) == 'object') {
						if (isset($rArray['callback'])) {
							header('Content-Type: application/x-javascript');
							echo $rArray['callback'].'('.json_encode($response).');';
						}else{
							header('Content-Type: application/json');
							echo json_encode($response);
						}
					}else{
						if (isset($rArray['callback'])) {
							header('Content-Type: application/x-javascript');
							echo $rArray['callback'].'("'.addslashes($response).'");';
						}else
							echo $response;
					}
				}else{
					if (isset($rArray['callback'])) {
						header('Content-Type: application/x-javascript');
						echo $rArray['callback'].'('.json_encode(array('error' => 'Required parameter(s) for '.$method.': '. $paramStr)).');';
					}else{
						header('Content-Type: application/json');
						echo json_encode(array('error' => 'Required parameter(s) for '.$method.': '. $paramStr));
					}
				}
			}else{
				if (isset($rArray['callback'])) {
					header('Content-Type: application/x-javascript');
					echo $rArray['callback'].'('.json_encode(array('error' => 'The method '.$method.' does not exist.')).');';
				}else{
					header('Content-Type: application/json');
					echo json_encode(array('error' => 'The method '.$method.' does not exist.'));
				}
			}
		}else{
			header('Content-Type: application/json');
			echo json_encode(array('error' => 'No method was requested.'));
		}
	}
}
$qad = new Qad();
