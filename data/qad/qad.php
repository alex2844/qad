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
class Qad{
	public $smtp_user;
	public $smtp_pass;
	public $smtp_from;
	public $smtp_host = 'ssl://smtp.gmail.com';
	public $smtp_port = 465;
	static public $nosql;
	
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

	public function passport($data,$key='',$scope='') {
		if (!is_array($data))
			$data = json_decode($data,true);
		$passport = [
			'id' => $data['id'],
			'type' => ($data['response']['type']?$data['response']['type']:1),
			'email' => $data['response']['email'],
			'login' => $data['response']['login'],
			'first_name' => $data['response']['first_name'],
			'last_name' => $data['response']['last_name'],
			'utc' => $data['response']['utc'],
			'update' => time()
		];
		if ($scope)
			for ($i=0; $i<count($scope); ++$i)
				$passport['scope'][$scope[$i]] = $data['response'][$scope[$i]];
		$passport = json_encode($passport);
		setcookie('passport'.($key!=''?'.'.$key:''), $passport, time()+60*60*24*30, '/');
		return $passport;
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
		if ($headers == '')
			$headers= "MIME-Version: 1.0\r\nContent-type: text/html; charset=utf-8\r\nFrom: ".$this->smtp_from."\r\n";
		$contentMail = "Date: ".date("D, d M Y H:i:s")." UT\r\n";
		$contentMail .= 'Subject: =?utf-8?B?'.base64_encode($subject)."=?=\r\n";
		$contentMail .= $headers."\r\n";
		$contentMail .= $message."\r\n";
		$errno = 0;
		$errstr = '';
		try {
			if(!$socket = fsockopen($this->smtp_host, $this->smtp_port, $errno, $errstr, 30)){
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
			fputs($socket, base64_encode($this->smtp_user) . "\r\n");
			if (!$this->_parseServer($socket, 334)) {
				fclose($socket);
				throw new Exception('Autorization error');
			}
			fputs($socket, base64_encode($this->smtp_pass) . "\r\n");
			if (!$this->_parseServer($socket, 235)) {
				fclose($socket);
				throw new Exception('Autorization error');
			}
			fputs($socket, "MAIL FROM: <".$this->smtp_user.">\r\n");
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
				$it = null;
				while($a = self::$nosql->scan($it,self::$nosql->getOption(Redis::OPT_PREFIX).$p1,1000)) {
					if ($p3 == '')
						$p3 = 0;
					for (; $p3<count($a); ++$p3) {
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
				}
				return json_encode($arr);
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
				if (self::$nosql->exists($p1))
					self::$nosql->del($p1);
				if (!empty($p2)) {
					$w = self::$nosql->hgetall($p1.':id:'.$p2);
					foreach ($w as $k=>$v)
						if (self::$nosql->exists($p1.':'.$k.':'.$v))
							self::$nosql->del($p1.':'.$k.':'.$v);
					$res = self::$nosql->del($p1.':id:'.$p2);
				}
				self::$nosql->save();
				return json_encode(['status'=>$res]);
				break;
			}
			case 'select': {
				if ($p2 != 'id')
					$p3 = self::$nosql->get($p1.':'.$p2.':'.$p3);
				if (empty($p4))
					$ret = self::$nosql->hgetall($p1.':id:'.$p3);
				else
					$ret = self::$nosql->hmget($p1.':id:'.$p3,$p4);
				if ($ret)
					return json_encode(['id'=>$p3,'response'=>$ret]);
				break;
			}
			case 'update': {
				foreach ($p3 as $k=>$v) {
					$o = self::$nosql->hmget($p1.':id:'.$p2,[$k])[$k];
					if (self::$nosql->exists($p1.':'.$k.':'.$o)) {
						self::$nosql->del($p1.':'.$k.':'.$o);
						self::$nosql->set($p1.':'.$k.':'.$v, $p2);
					}
				}
				$res = self::$nosql->hmset($p1.':id:'.$p2, $p3);
				self::$nosql->save();
				return json_encode(['status'=>$res]);
				break;
			}
			case 'insert': {
				$id = self::$nosql->incr($p1.':id');
				foreach ($p2 as $k=>$v)
					if (substr($k,0,1) == '/') {
						$p2[substr($k,1)] = $v;
						unset($p2[$k]);
						self::$nosql->set($p1.':'.substr($k,1).':'.$v, $id);
					}
				self::$nosql->hmset($p1.':id:'.$id, $p2);
				self::$nosql->save();
				return json_encode(['id'=>$id]);
				break;
			}
			default: {
				try {
					self::$nosql = new Redis();
					if (empty($p1))
						$p1 = 'localhost:6379';
					self::$nosql->connect($p1);
					if (!empty($p2))
						self::$nosql->auth($p2);
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
