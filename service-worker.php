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
if (empty($_SERVER['HTTP_REFERER']) || explode('/', $_SERVER['HTTP_REFERER'])[2] != $_SERVER['HTTP_HOST']) {
	header('HTTP/1.1 404 Not Found');
	header('Status: 404 Not Found');
	exit;
}
include_once 'data/qad/qad.php';
if (!empty($_GET['gcm']) && !empty(Qad::$config['gcm'])) {
	Qad::$config = [
		'db_driver' => 'sqlite',
		'db_name' => 'upload/sql/gcm',
		'gcm' => Qad::$config['gcm']
	];
	$db = [
		'table' => 'gcm',
		'columns' => [
			'id' => 'INTEGER PRIMARY KEY AUTOINCREMENT', // ID
			'topic' => 'CHAR(50) NOT NULL', // Канал подписки
			'notification' => 'TEXT NOT NULL', // Уведомление
			'date' => 'DATETIME DEFAULT CURRENT_TIMESTAMP' // Дата
		]
	];
	if ($_GET['gcm'] == 'get' && !empty($_GET['topics'])) {
		$qad->db('create', $db);
		$filter = explode(',', $_GET['topics']);
		if ($row = $qad->db('select * from gcm where topic in ('.str_repeat('?,', count($filter)-1).'?'.') order by date desc', $filter)->fetch())
			echo $row->notification;
	}else if ($_GET['gcm'] == 'push' && !empty($_GET['push']) && isset($_GET['key']) && $_GET['key'] == Qad::$config['gcm']) {
		$qad->db('create', $db);
		$to = $_GET['push']['to'];
		$_GET['push']['to'] = '/topics/'.$to;
		$json = json_encode($_GET['push']);
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
	}else if ($_GET['gcm'] == 'add' && !empty($_GET['topics']) && !empty($_GET['token'])) {
		$qad->fetch('https://iid.googleapis.com/iid/v1/'.$_GET['token'].'/rel/topics/'.$_GET['topics'], [
			'header' => [
				'Authorization: key='.Qad::$config['gcm'],
				'Content-Length: 0',
				'Content-Type: application/json'
			],
			'cache' => 'no-cache',
			'method' => 'post'
		]);
	}else if ($_GET['gcm'] == 'list' && !empty($_GET['token'])) {
		$res = $qad->fetch('https://iid.googleapis.com/iid/info/'.$_GET['token'].'/?details=true', [
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
}
