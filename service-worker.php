<?php
/*
=====================================================
Qad Framework (serwice-worker.php)
-----------------------------------------------------
https://qwedl.com/
-----------------------------------------------------
Copyright (c) 2016-2017 Alex Smith
=====================================================
 */
/*
if ((empty($_SERVER['HTTP_REFERER']) || explode('/', $_SERVER['HTTP_REFERER'])[2] != $_SERVER['HTTP_HOST']) && (empty($_POST['app']) || $_POST['app'] == 'false')) {
	header('HTTP/1.1 404 Not Found');
	header('Status: 404 Not Found');
	exit;
}
 */
include_once 'data/qad/qad.php';
if (!empty($_GET['error']))
	$qad->debug(json_decode($_GET['error']));
else if (!empty($_GET['hash'])) {
	if ($_GET['text'] == '[object ArrayBuffer]')
		$_GET['text'] = file_get_contents('php://input');
	if ($_GET['hash'] == 'sha1')
		echo sha1($_GET['text']);
	else if ($_GET['hash'] == 'md5')
		echo md5($_GET['text']);
}else if (!empty($_POST['tts'])) {
	if ($res = file_get_contents('https://translate.google.com/translate_tts?ie=UTF-8&tl='.$_POST['tts']['tl'].'&q='.urlencode($_POST['tts']['q']).'&total=1&idx=0&client=tw-ob')) {
		header('Content-type: audio/mpeg');
		header('Content-length: '.strlen($res));
		header('Cache-Control: no-cache');
		echo $res;
	}
}else if (!empty($_POST['gcm']) && !empty(Qad::$config['gcm'])) {
	Qad::$config = [
		'gcm' => Qad::$config['gcm']
	];
	$db = [
		'driver' => 'sqlite',
		'path' => 'upload/sql',
		'table' => 'gcm',
		'columns' => [
			'id' => 'INTEGER PRIMARY KEY AUTOINCREMENT', // ID
			'topic' => 'CHAR(50) NOT NULL', // Канал подписки
			'notification' => 'TEXT NOT NULL', // Уведомление
			'date' => 'DATETIME DEFAULT CURRENT_TIMESTAMP' // Дата
		],
		'autoclean' => '1 hour'
	];
	if ($_POST['gcm'] == 'get' && !empty($_POST['topics'])) {
		$qad->db('create', $db);
		$filter = explode(',', $_POST['topics']);
		if ($row = $qad->db('select notification from gcm where topic in ('.str_repeat('?,', count($filter)-1).'?'.') order by date desc', $filter)->fetch())
			echo $row->notification;
	}else if ($_POST['gcm'] == 'push' && !empty($_POST['push']) && isset($_POST['key']) && $_POST['key'] == Qad::$config['gcm']) {
		$qad->db('create', $db);
		$to = $_POST['push']['to'];
		$_POST['push']['to'] = '/topics/'.$to;
		$json = json_encode($_POST['push']);
		if ($qad->db('insert', array_merge($db, [
				'data' => [
					'topic' => $to,
					'notification' => $json
				]
			]))
		)
			echo $qad->fetch('https://fcm.googleapis.com/fcm/send', [
				'header' => [
					'Authorization: key='.Qad::$config['gcm'],
					'Content-Type: application/json'
				],
				'body' => $json,
				'cache' => 'no-cache',
				'method' => 'post'
			]);
	}else if ($_POST['gcm'] == 'add' && !empty($_POST['topics']) && !empty($_POST['token'])) {
		$qad->fetch('https://iid.googleapis.com/iid/v1/'.$_POST['token'].'/rel/topics/'.$_POST['topics'], [
			'header' => [
				'Authorization: key='.Qad::$config['gcm'],
				'Content-Length: 0',
				'Content-Type: application/json'
			],
			'cache' => 'no-cache',
			'method' => 'post'
		]);
	}else if ($_POST['gcm'] == 'list' && !empty($_POST['token'])) {
		$res = $qad->fetch('https://iid.googleapis.com/iid/info/'.$_POST['token'].'/?details=true', [
			'header' => [
				'Authorization: key='.Qad::$config['gcm'],
				'Content-Length: 0',
				'Content-Type: application/json'
			],
			'cache' => 'no-cache',
			'method' => 'post'
		], 'array');
		$topics = [];
		if (!empty($res['rel']) && !empty($res['rel']['topics']))
			foreach ($res['rel']['topics'] as $k=>$v) {
				$topics[] = $k;
			}
		echo implode(',', $topics);
	}
}else if (!empty($_POST['p2p'])) {
	$db = [
		'driver' => 'sqlite',
		'path' => 'upload/sql',
		'table' => 'p2p',
		'columns' => [
			'id' => 'CHAR(50) NOT NULL', // Канал подписки
			'offer' => 'TEXT NOT NULL', // Владелец канала
			'answer' => 'TEXT DEFAULT NULL', // Пользователь канала
			'date' => 'DATETIME DEFAULT CURRENT_TIMESTAMP' // Дата
		],
		'autoclean' => '5 minute'
	];
	$qad->db('create', $db);
	$json = (object) $_POST['p2p'];
	if (isset($json->token)) {
		if ($json->type == 'offer') {
			$db['data']['id'] = md5($json->token);
			$db['data']['offer'] = $json->token;
			if ($qad->db('insert', $db))
				echo $db['data']['id'];
		}else if ($json->type == 'answer')
			$qad->db('update', array_merge($db, [
				'data' => [
					'id' => $json->id,
					'answer' => $json->token
				]
			]));
	}else if (isset($json->id)) {
		if ($row = $qad->db('select id, answer, offer from p2p where id = :id', [
			'id' => $json->id
		])->fetch()) {
			if ($row->answer && $row->offer && $json->type == 'answer')
				$qad->db('delete from p2p where id = :id', [
					'id' => $json->id
				]);
			$res = [];
			$res[$json->type] = $row->{$json->type};
		}else
			$res = ['error' => 'no find'];
		echo json_encode($res);
	}else
		print_r($json);
}else if (!empty($_POST['sync'])) {
	$qad->db('create', $db = [
		'driver' => 'sqlite',
		'path' => 'upload/sql',
		'table' => 'sync',
		'columns' => [
			'id' => 'CHAR(50) PRIMARY KEY', // ID
			'type' => 'CHAR(10) DEFAULT NULL', // Тип аккаунта
			'topic' => 'CHAR(50) NOT NULL', // Канал
			'data' => 'TEXT NOT NULL' // Настройки
		]
	]);
	$row = $qad->db('select data from sync where id = :id and type = :type and topic = :topic', array_merge($db, [
		'id' => $_POST['id'],
		'type' => (empty($_POST['type']) ? null : $_POST['type']),
		'topic' => $_POST['sync']
	]))->fetch();
	switch ($_POST['action']) {
		case 'load': {
			echo ($row ? $row->data : '{}');
			break;
		}
		case 'save': {
			echo json_encode($_POST);
			if ($row)
				$qad->db('update', array_merge($db, [
					'data' => [
						'id' => $_POST['id'],
						'type' => (empty($_POST['type']) ? null : $_POST['type']),
						'topic' => $_POST['sync'],
						'data' => $_POST['data']
					]
				]));
			else
				$qad->db('insert', array_merge($db, [
					'data' => [
						'id' => $_POST['id'],
						'type' => (empty($_POST['type']) ? null : $_POST['type']),
						'topic' => $_POST['sync'],
						'data' => $_POST['data']
					]
				]));
			break;
		}
	}
}
