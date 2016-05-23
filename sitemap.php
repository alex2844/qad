<?php
if (empty($_GET['type']) || empty($_GET['page']))
  exit;
if ($_GET['type'] == 'amp') {
  if (!file_exists('page/'.$_GET['page']))
    exit;
  function find($b,$e,$d) {
    return explode($e,explode($b,$d)[1])[0];
  }
  $file = file_get_contents('page/'.$_GET['page']);
  $d = array(
    '/<link (.*?) \/>/',
    '/<meta name="description" (.*?) \/>/',
    '/<meta name="keywords" (.*?) \/>/',
    '/<meta name="theme-color" (.*?) \/>/',
    '/<meta name="analytics" (.*?) \/>/',
    '/<script(.*?)\/script>/',
    '/ style="(.*?)"/',
    '/ onclick="(.*?)"/',
    "'<form[^>]*?>.*?</form>'si",
    "'<iframe[^>]*?>.*?</iframe>'si",
    "'<button[^>]*?>.*?</button>'si",
    "'<nav[^>]*?>.*?</nav>'si",
    "'<header[^>]*?>.*?</header>'si",
    '/<div(.*?)>/',
    '/<\/div>/',
    '/<i class="material-icons">(.*?)<\/i>/'
  );
  $color = find('theme-color" content="','"',$file);
  $json = find('<script data-config src="','"',$file);
  $file = preg_replace($d,'',$file);
  $dir = dirname('page/'.$_GET['page']).'/';
  if (!empty($json)) {
    $json = json_decode('{'.preg_replace('/(.*?) =/','"$1":',file_get_contents($dir.$json)).'}', true);
    $arr = array();
    preg_replace_callback('/<(.*?) (.*?)class="template"(.*?)data-config="(.*?)"(.*?)>/',function($data){
      global $arr;
      $arr[] = array($data[1],$data[4]);
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
  $t = array(
    '/ dev/',
    '/<img(.*?)src="(.*?)"(.*?)\/>/',
    '/<html/',
    '/<\/head>/',
    '/<body(.*?)>/',
  );
  $b = array(
    '',
    '<amp-img width=300 height=300 src="'.$dir.'$2"></amp-img>',
    '<html amp',
    '<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript><link rel="canonical" href="page/'.$_GET['page'].'" /><script async src="https://cdn.ampproject.org/v0.js"></script><style amp-custom>h2{text-align:center;}a {text-decoration: none;color: '.$color.';}header,footer {text-align: center;background: '.$color.';border-top: 1px solid #e4e4e4;width: 100%;padding: 25px 0;}header a,footer a {color: #fff;}</style></head>',
    '<body><header><a href="page/'.$_GET['page'].'">Открыть</a></header>',
  );
  $file = preg_replace($t,$b,$file);
  echo $file;
}