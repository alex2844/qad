<?php
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
         case 'delete': {
            $w = self::$nosql->hgetall($p1.':id:'.$p2);
            foreach ($w as $k=>$v)
               if (self::$nosql->exists($p1.':'.$k.':'.$v))
                  self::$nosql->del($p1.':'.$k.':'.$v);
            $res = self::$nosql->del($p1.':id:'.$p2);
            self::$nosql->save();
            return json_encode(['status'=>$res]);
            break;
         }
         case 'select': {
            global $redis;
            if ($p2 != 'id')
               $p3 = self::$nosql->get($p1.':'.$p2.':'.$p3);
            if (empty($p4))
               return json_encode(self::$nosql->hgetall($p1.':id:'.$p3));
            else
               return json_encode(self::$nosql->hmget($p1.':id:'.$p3,$p4));
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
