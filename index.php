<?php
$config = [
	'url' => '',
	'analytics' => 'UA-77400806-1',
	'description' => '',
	'home' => '/page/index/index.php'
];
$browser = '<b>Вы используете устаревший браузер</b><br />Для работы с сайтом необходима поддержка Javascript и Cookies';
$color = '#F44336';
$title = 'Ошибка';
$url = '';
$button = '';
$msg = '';
if (!empty($_GET['code'])) {
	$code = [
		400 => ['Неверный запрос', 'Серверу не удалось разобрать синтаксис запроса.'],
		401 => ['Неавторизован', 'Запрос требует проверки подлинности.'],
		403 => ['Доступ запрещен', 'Сервер отказывает запросу.'],
		404 => ['Страница не найдена', 'Сервер не может найти запрашиваемую страницу.'],
		405 => ['Недопустимый метод', 'Метод, указанный в запросе, не разрешен.'],
		406 => ['Неприемлемый запрос', 'Запрашиваемая страница не может быть возвращена с указанными в запросе характеристиками содержания.'],
		408 => ['Тайм-аут запроса', 'На сервере истекло время ожидания запроса.'],
		412 => ['Hе выполнено предварительное условие', 'Сервер не соответствует одному из предварительных условий, указанных отправителем в запросе.'],
		413 => ['Слишком большой размер запроса', 'Сервер не может обработать запрос, потому что его размер превышает максимально допустимый.'],
		414 => ['Слишком большой размер запрашиваемого URI', 'Запрашиваемый URI (обычно URL-адрес) имеет слишком большой размер для обработки сервером.'],
		415 => ['Неподдерживаемый тип содержания', 'Формат запроса не поддерживается запрашиваемой страницей.'],
		500 => ['Внутренняя ошибка сервера', 'На сервере возникла ошибка, и он не может выполнить запрос.'],
		501 => ['Метод не поддерживается', 'Сервер не располагает функциональностью для выполнения запроса.'],
		502 => ['Неверный шлюз', 'Сервер получил неправильный ответ.'],
		503 => ['Служба недоступна', 'Сервер временно недоступен (так как он перегружен или отключен для обслуживания).'],
		504 => ['Истекло время ожидания шлюза', 'Вышестоящий сервер не ответил за установленное время.'],
		505 => ['Версия HTTP не поддерживается', 'Сервер не поддерживает версию протокола НТТР, используемую при запросе.']
	];
	if ($_GET['code'] == 'true') {
		foreach ($code as $k=>$v) {
			echo 'error_page '.$k.' /index.php?code='.$k.';'.PHP_EOL;
		}
		exit;
	}
	$msg = (
		isset($code[$_GET['code']])
		? '<b>'.$code[$_GET['code']][0].'</b><br />'.$code[$_GET['code']][1]
		: '<b>Код ошибки не правильный.</b>'
	);
}else if (isset($_GET['url'])) {
	$origin = 'http'.(($_SERVER['SERVER_PORT'] == '443') ? 's' : '').'://'.$_SERVER['HTTP_HOST'];
	$color = '#4285F4';
	$title = 'Переход по внешней ссылке';
	$msg = 'Вы покидаете сайт <b><a href="'.$origin.'">'.$origin.'</a></b> по внешней ссылке <b>'.$_GET['url'].'</b>.<br/ >Мы не несем ответственности за содержимое сайта <b>'.$_GET['url'].'</b> и настоятельно рекомендует <b>не указывать</b> никаких своих личных данных на сторонних сайтах.<br />Кроме того, сайт <b>'.$_GET['url'].'</b> может содержать вирусы, трояны и другие вредоносные программы, опасные для Вашего компьютера.';
	$url = $_GET['url'];
	$button = 'Перейти';
}else if (isset($_GET['browser']))
	$msg = $browser;
else if (isset($config['home']))
	header('Location: '.$config['home'], true, 302);
?>
<!DOCTYPE html>
<html lang="ru">
<head>
	<link rel="icon" type="image/png" href="data/images/icon.png" />
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
	<?php foreach ($config as $k=>$v) { ?>
		<meta name="<?= $k; ?>" content="<?= $v; ?>" />
	<?php } ?>
	<title>QAD CMF</title>
</head>
<body>
	<noscript>
		<div class="card" style="background:#F44336">
			<h2>Ошибка</h2>
			<p><?= $browser; ?></p>
			<a href="https://chrome.com/" target="_blank"><button>Установить Google Chrome</button></a>
		</div>
	</noscript>
	<?php if ($msg) { ?>
		<div class="template">
			<div class="card" style="background:<?= $color; ?>">
				<h2><?= $title; ?></h2>
				<p><?= $msg; ?></p>
				<?php if (isset($_GET['browser'])) { ?>
					<a href="https://chrome.com/" target="_blank"><button>Установить Google Chrome</button></a>
				<?php }else{ ?>
					<button onclick="window.history.back()">Назад</button>
				<?php } ?>
				<?php if ($url) { ?>
					<a href="<?= $url; ?>"><button style="float:right"><?= $button; ?></button></a>
				<?php } ?>
			</div>
		</div>
	<?php } ?>
	<script>
		if (location.hostname != 'localhost' && !location.pathname.split('/')[location.pathname.split('/').length-1])
			if (document.querySelector('meta[name="analytics"]')) {
				(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
				(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
				m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
				})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
				ga('create', document.querySelector('meta[name="analytics"]').content, 'auto');
				ga('send', 'pageview');
				if (location.search.indexOf('?code') == 0)
				ga('send','event','Error Page',location.search.replace('?code=',''),document.referrer);
				else if (location.search.indexOf('?url') == 0)
				ga('send','event','Redirect Page',location.search.replace('?url=',''),document.referrer);
			}
	</script>
	<style>
		html {
			height: inherit !important;
		}
		body {
			font-family: sans-serif;
			background: #f1f1f1;
			top: 0 !important;
		}
		.template, noscript {
			display: table-cell;
			vertical-align: middle;
			height: 95vh;
			width: 100vw;
		}
		.card {
			border-radius: 0.125rem;
			box-shadow: 0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.2),0 1px 5px 0 rgba(0,0,0,.12);
		}
		.card h2 {
			color: white;
			font-weight: 300;
			text-align: center;
			font-size: 18px;
			margin: 0;
			padding: 8px 0;
			line-height: 28px;
		}
		.card > p {
			margin: 8px 0 0 0;
			padding: 16px;
			border-bottom: 1px solid rgba(0,0,0,.1);
			color: rgba(0,0,0,.54);
			font-size: 13px;
			line-height: 24px;
		}
		.card button {
			background: 0;
			box-shadow: none;
			margin: 8px 16px;
			color: #fff;
			border: none;
			height: 36px;
			padding: 0 16px;
			text-transform: uppercase;
			cursor: pointer;
			outline: none;
		}
		iframe {
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			border: none;
		}
	</style>
</body>
</html>
