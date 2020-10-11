<?php

$seconds_to_cache = 13600;
$ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
header("Expires: $ts");
header("Pragma: cache");
header("Cache-Control: max-age=$seconds_to_cache");	


$html = file_get_contents("test.html");

$cacheInvalidator = "?cache=" . substr(md5(filectime(__DIR__ . "/depot.css") * filectime(__DIR__ . "/depot.js")), 0, 10);

$html = preg_replace("/depot\.(js|css)/", "depot.$1" . $cacheInvalidator, $html);

echo $html;