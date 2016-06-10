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
if (empty($_GET['type']) || empty($_GET['page']))
	exit;
if ($_GET['type'] == 'amp') {
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
		"'<form[^>]*?>.*?</form>'si",
		"'<iframe[^>]*?>.*?</iframe>'si",
		"'<button[^>]*?>.*?</button>'si",
		"'<nav[^>]*?>.*?</nav>'si",
		"'<header[^>]*?>.*?</header>'si",
		"'<style[^>]*?>.*?</style>'si",
		//'/<div(.*?)>/',
		//'/<\/div>/',
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
					global $j, $rep;
					if (substr_count($data[1],'response') == 0)
						return $rep[$j][$data[1]];
					else
						return $rep[$j]['response'][explode('/',$data[1])[1]];
				},$out);
			return $replace;
		},$file);
	$t = array(
		'/ dev/',
		'/<html/',
		'/<\/head>/',
		'/<body(.*?)>/'
	);
	$b = array(
		'',
		'<html amp',
		'<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript><link rel="canonical" href="page/'.$_GET['page'].'" /><script async src="https://cdn.ampproject.org/v0.js"></script><style amp-custom>h2{text-align:center;}a {text-decoration: none;color: '.$color.';}header,footer {text-align: center;background: '.$color.';border-top: 1px solid #e4e4e4;width: 100%;padding: 25px 0;}header a,footer a {color: #fff;}.config{display:block;}</style>'.($analytics?'<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>':'').'</head>',
		'<body>'.($analytics?'<amp-analytics type="googleanalytics" id="analytics1"><script type="application/json">{"vars": {"account": "'.$analytics.'"},"triggers": {"trackPageview": {"on": "visible","request": "pageview"}}}</script></amp-analytics>':'').'<header><a href="page/'.$_GET['page'].'">Открыть</a></header>'
	);
	$file = preg_replace($t,$b,$file);
	$file = preg_replace_callback('/<img(.*?)src="(.*?)"(.*?)\/>/',function($data){
		global $dir;
		if ((substr_count($data[2],'http://') == 0) && (substr_count($data[2],'https://') == 0))
			return '<amp-img width=300 height=300 src="'.$dir.$data[2].'"></amp-img>';
		else
			return '<amp-img width=300 height=300 src="'.$data[2].'"></amp-img>';
	},$file);
	echo $file;
}