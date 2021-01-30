<?php

/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/

if (strlen($_SERVER["REQUEST_URI"]) < 2) {	// when just loading https://peerfol.io[/]
  header("Location: https://www.peerfol.io", true, 301);
}

$seconds_to_cache = 13600;
$ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
header("Expires: $ts");
header("Pragma: cache");
header("Cache-Control: max-age=$seconds_to_cache"); 

$cacheInvalidator = "?cache=" . substr(md5(filectime(__DIR__ . "/app/app.css") * filectime(__DIR__ . "/app/app.js")), 0, 10);

$html = file_get_contents("app/app.html");
$html = preg_replace("/app\.(js|css)/", "app.$1" . $cacheInvalidator, $html);
echo $html;