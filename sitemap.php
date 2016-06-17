<?php
/*
=====================================================
Qad Framework (sitemap.php)
-----------------------------------------------------
https://pcmasters.ml/
-----------------------------------------------------
Copyright (c) 2016 Alex Smith
=====================================================
*/
/*
if (file_exists('upload/cache/')) {
	$cache = 'upload/cache/sitemap_'.md5($_SERVER['REQUEST_URI']).'.cache';
	if (file_exists($cache) && (time()-86400)<filemtime($cache)) {
		$cached = file_get_contents($cache);
		if (substr($cached,2,3) == 'xml')
			header('Content-Type:text/xml');
		echo $cached;
		exit;
	}
	ob_start();
}
*/
if (!empty($_GET['page'])) {
	$page = explode('?',$_GET['page']);
	if (!file_exists('page/'.$page[0]))
		exit;
	function find($b,$e,$d) {
		return explode($e,explode($b,$d)[1])[0];
	}
	$file = file_get_contents('page/'.$page[0]);
	$d = array(
		'/<link (.*?) \/>/',
		'/<meta name="description" (.*?) \/>/',
		'/<meta name="keywords" (.*?) \/>/',
		'/<meta name="theme-color" (.*?) \/>/',
		'/<meta name="analytics" (.*?) \/>/',
		'/<script(.*?)\/script>/',
		'/ style="(.*?)"/',
		'/ onclick="(.*?)"/',
		"'<div hidden[^>]*?>.*?</div>'si",
		"'<dialog[^>]*?>.*?</dialog>'si",
		"'<iframe[^>]*?>.*?</iframe>'si",
		"'<button[^>]*?>.*?</button>'si",
		"'<nav[^>]*?>.*?</nav>'si",
		"'<header[^>]*?>.*?</header>'si",
		"'<style[^>]*?>.*?</style>'si",
		'/<form(.*?)>/',
		'/<\/form>/',
		'/<i class="material-icons">(.*?)<\/i>/',
	);
	$color = find('theme-color" content="','"',$file);
	$analytics = find('analytics" content="','"',$file);
	$json = find('<script data-config src="','"',$file);
	$file = preg_replace($d,'',$file);
	$dir = dirname('page/'.$_GET['page']).'/';
	$arr = array();
	preg_replace_callback('/<(.*?) (.*?)class="(.*?)config(.*?)"(.*?)data-db="(.*?)"(.*?)>/',function($data){
		global $file, $id, $nosql, $conf;
		$conf = explode(':',$data[6]);
		if (!$nosql) {
			include 'data/qad/qad.php';
			$nosql = 'Qad::nosql';
			$nosql($conf[0]);
		}
		$id = $data[6];
		$file = preg_replace_callback("'".$data[0]."(.*?)<p></p>(.*?)</".$data[1].">'si",function($dd){
			global $id, $nosql, $conf;
			return $dd[1].'<p>'.$nosql('get',$conf[1]).'</p>';
		},$file);
	},$file);
	if (!empty($json)) {
		$json = json_decode('{'.preg_replace('/(.*?) =/','"$1":',file_get_contents($dir.$json)).'}', true);
		$arr = array();
		preg_replace_callback('/<(.*?) (.*?)class="(.*?)template(.*?)"(.*?)data-config="(.*?)"(.*?)>/',function($data){
			global $arr;
			$arr[] = array($data[1],$data[6]);
		},$file);
		$rep = array();
		$j = 0;
		for ($i=0; $i<count($arr); ++$i)
			$file = preg_replace_callback("'<".$arr[$i][0]."(.*?)data-config=\"".$arr[$i][1]."\"(.*?)[^>]*?>.*?</".$arr[$i][0].">'si",function($data){
				global $arr, $i, $json, $rep, $j;
				$out = preg_replace(array(
					'/<'.$arr[$i][0].'(.*?)>/',
					'/<\/'.$arr[$i][0].'>/',
				),'',$data[0]);
				$conf = explode('.',$arr[$i][1]);
				$replace = '';
				$rep = $json[$conf[0]][$conf[1]];
				for ($j=0; $j<count($rep); ++$j)
					$replace .= preg_replace_callback('/{\$.(.*?)}/',function($data){
						global $j, $rep;
						$data[1] = preg_replace_callback('/(.*?)\$.(.*?),(.*?)\)/',function($d){
							return $d[2];
						},$data[1]);
						$out = $rep[$j][$data[1]];
						return $out;
					},$out);
				return $replace;
			},$file);
	}
	$arr = array();
	preg_replace_callback('/<(.*?) (.*?)class="(.*?)template(.*?)"(.*?)data-db="(.*?)"(.*?)>/',function($data){
		global $arr;
		$arr[] = array($data[1],$data[6]);
	},$file);
	$j = 0;
	for ($i=0; $i<count($arr); ++$i)
		$file = preg_replace_callback("'<".$arr[$i][0]."(.*?)data-db=\"".$arr[$i][1]."\"(.*?)[^>]*?>.*?</".$arr[$i][0].">'si",function($data){
			global $arr, $i, $j, $nosql, $rep, $page;
			$rep = array();
			$out = preg_replace(array(
				'/<'.$arr[$i][0].'(.*?)>/',
				'/<\/'.$arr[$i][0].'>/',
			),'',$data[0]);
			$conf[0] = explode(':',$arr[$i][1])[0];
			$conf[1] = preg_replace('/'.$conf[0].':/','',preg_replace('/@/','*',$arr[$i][1]));
			$conf[2] = explode(':',$conf[1])[0];
			$replace = '';
			if (!$nosql) {
				include 'data/qad/qad.php';
				$nosql = 'Qad::nosql';
				$nosql($conf[0]);
			}
			if (substr_count($conf[1],'#') == 0) {
				$search = json_decode($nosql('search',$conf[1],50),true);
				if ($search)
					foreach ($search as $id)
						$rep[] = json_decode($nosql('select',$conf[2],'id',$id),true);
			}else{
				$get = explode('=',$page[1]);
				$rep[] = json_decode($nosql('select',$conf[2],$get[0],$get[1]),true);
			}
			for ($j=0; $j<count($rep); ++$j)
				$replace .= preg_replace_callback('/{\@(.*?)}/',function($data){
					global $j, $rep, $title;
					if (substr_count($data[1],'response') == 0)
						return $rep[$j][$data[1]];
					else{
						if ($data[1] == 'response/title')
							$title = $rep[$j]['response'][explode('/',$data[1])[1]];
						return $rep[$j]['response'][explode('/',$data[1])[1]];
					}
				},$out);
			return $replace;
		},$file);
	$t = array(
		'/ dev/',
		'/<a(.*?)href="(.*?)"(.*?)>/',
		'/<html/',
		'/<\/head>/',
		'/<body(.*?)>/'
	);
	$b = array(
		'',
		'<a href="'.$dir.'$2">',
		'<html amp',
		'<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript><link rel="canonical" href="page/'.$_GET['page'].'" /><script async src="https://cdn.ampproject.org/v0.js"></script><style amp-custom>h2{text-align:center;}a {text-decoration: none;color: '.$color.';}header,footer {text-align: center;background: '.$color.';border-top: 1px solid #e4e4e4;width: 100%;padding: 25px 0;}header a,footer a {color: #fff;}.config{display:block;}p{white-space: pre-line;}</style>'.($analytics?'<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>':'').'</head>',
		'<body>'.($analytics?'<amp-analytics type="googleanalytics" id="analytics1"><script type="application/json">{"vars": {"account": "'.$analytics.'"},"triggers": {"trackPageview": {"on": "visible","request": "pageview"}}}</script></amp-analytics>':'').'<header><a href="page/'.$_GET['page'].'">Открыть</a></header>'
	);
	$file = preg_replace($t,$b,$file);
	if (isset($title))
		$file = preg_replace('/<title>(.*?)<\/title>/','<title>'.$title.' :: $1</title>',$file);
	$file = preg_replace_callback('/<img(.*?)src="(.*?)"(.*?)\/>/',function($data){
		global $dir;
		if ((substr_count($data[2],'http://') == 0) && (substr_count($data[2],'https://') == 0))
			return '<amp-img width=300 height=300 src="'.$dir.$data[2].'"></amp-img>';
		else
			return '<amp-img width=300 height=300 src="'.$data[2].'"></amp-img>';
	},$file);
	echo $file;
}else{
	include 'data/qad/qad.php';
	$nosql = 'Qad::nosql';
	if (empty($qad::$config['sitemap']))
		exit;
	$sitemap = $qad::$config['sitemap'];
	$location = ($_SERVER['HTTPS']?'https://':'http://').$_SERVER['HTTP_HOST'];
		$txt = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.google.com/schemas/sitemap/0.84 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">';
		foreach ($sitemap as $db) {
			$conf = explode('::',$db);
			$conf[3] = explode(':id',$conf[1])[0];
			$qad->nosql($conf[0]);
			$search = json_decode($nosql('search',$conf[1],45000),true);
			if ($search)
				foreach ($search as $id) {
					$res = json_decode($nosql('select',$conf[3],'id',$id,['created']),true);
					$txt .= '<url><loc>'.$location.'/sitemap.php?page='.$conf[2].'?id='.$id.'</loc><lastmod>'.gmdate('c',$res['response']['created']).'</lastmod><changefreq>daily</changefreq><priority>0.50</priority></url>';
				}
		}
		$txt .='</urlset>';
		header('Content-Type:text/xml');
	echo $txt;
}
/*
if (isset($cache)) {
	$cached = fopen($cache, 'w');
	fwrite($cached, ob_get_contents());
	fclose($cached);
	ob_end_flush();
}
*/
