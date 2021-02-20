<?php

// when just loading https://peerfol.io[/]
if (strlen($_SERVER["REQUEST_URI"]) < 2) {
  header("Location: https://www.peerfol.io", true, 301);
  die();
}

$seconds_to_cache = 13600;
$ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
header("Expires: $ts");
header("Pragma: cache");
header("Cache-Control: max-age=$seconds_to_cache"); 

$cacheInvalidator = "?v=" . substr(md5(exec("find " . __DIR__ . "/web/ -name '*' -printf '%m%c%p'")), 0, 10);
$html = file_get_contents("web/app.html");
$html = preg_replace("/development.*\.js/si", "app.js", $html);
$html = preg_replace("/app\.(js|css)/", "app.$1" . $cacheInvalidator, $html);
echo $html;
