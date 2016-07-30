<?php
/*
=====================================================
Qad Framework (qad.php)
-----------------------------------------------------
https://pcmasters.ml/
-----------------------------------------------------
Copyright (c) 2016 Alex Smith
=====================================================
*/
header('Content-Type: text/html; charset=utf-8');
session_start();
class Qad{
	public static $nosql;
	public static $config;
	
	public function __construct() {
		$conf = dirname(__DIR__).'/config.php';
		if (file_exists($conf))
			self::$config = include($conf);
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
			$calculatedCode = $this->getCode($p1, $currentTimeSlice,$validChars);
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
		$shab['header'] = preg_replace(array(
			"'<header[^>](.*?)>.*?</header>'si",
			'/ tabs/'
		),array(
			'<header $1></header>'
		),explode('<section>',$file)[0]).'<section>';
		$shab['footer'] = '</section>'.explode('</section>',$file)[1];
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
			if(!$socket = fsockopen(self::$config['smtp_host'], self::$config['smtp_port'], $errno, $errstr, 30)){
				throw new Exception($errno.".".$errstr);
			}
			if (!$this->_parseServer($socket, 220))
				throw new Exception('Connection error');
			$server_name = $_SERVER["SERVER_NAME"];
			fputs($socket, "HELO $server_name\r\n");
			if (!$this->_parseServer($socket, 250)) {
				fclose($socket);
				throw new Exception('Error of command sending: HELO');
			}
			fputs($socket, "AUTH LOGIN\r\n");
			if (!$this->_parseServer($socket, 334)) {
				fclose($socket);
				throw new Exception('Autorization error');
			}
			fputs($socket, base64_encode(self::$config['smtp_user']) . "\r\n");
			if (!$this->_parseServer($socket, 334)) {
				fclose($socket);
				throw new Exception('Autorization error');
			}
			fputs($socket, base64_encode(self::$config['smtp_pass']) . "\r\n");
			if (!$this->_parseServer($socket, 235)) {
				fclose($socket);
				throw new Exception('Autorization error');
			}
			fputs($socket, "MAIL FROM: <".self::$config['smtp_user'].">\r\n");
			if (!$this->_parseServer($socket, 250)) {
				fclose($socket);
				throw new Exception('Error of command sending: MAIL FROM');
			}
			$arr = explode(',', $to);
			foreach($arr as $key=>$email) {
				fputs($socket, "RCPT TO: <".$email.">\r\n");
				if (!$this->_parseServer($socket, 250)) {
					fclose($socket);
					throw new Exception('Error of command sending: RCPT TO');
				}
			}
			fputs($socket, "DATA\r\n");     
			if (!$this->_parseServer($socket, 354)) {
				fclose($socket);
				throw new Exception('Error of command sending: DATA');
			}
			fputs($socket, $contentMail."\r\n.\r\n");
			if (!$this->_parseServer($socket, 250)) {
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
					$res = self::$nosql->del($p1.':id:'.$p2);
				}
				self::$nosql->save();
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
                    if ($ret)
                        return $ret;
                }else if (gettype($p2) == 'string') {
                    if ($p2 != 'id')
                        $p3 = self::$nosql->get($p1.':'.$p2.':'.$p3);
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
	public function rest($serviceClass) {
		if (array_key_exists('method', array_change_key_case($_REQUEST, CASE_LOWER))) {
			$rArray = array_change_key_case($_REQUEST, CASE_LOWER);
			$method = $rArray['method'];
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
					if (gettype($response) == 'array') {
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
							echo $rArray['callback'].'("'.$response.'");';
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
