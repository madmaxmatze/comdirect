<?php

if (isset($_GET["portfolio_key"])) {
	header("Location: https://peerfol.io/" . $_GET["portfolio_key"]);
	die();
} else if (strlen($_SERVER['REQUEST_URI']) <= 1) {
	$html = file_get_contents("content/homepage.html");
	echo $html;
} else {
	$seconds_to_cache = 13600;
	$ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
	header("Expires: $ts");
	header("Pragma: cache");
	header("Cache-Control: max-age=$seconds_to_cache");	

	$html = file_get_contents("app.html");

	$cacheInvalidator = "?cache=" . substr(md5(filectime(__DIR__ . "/depot.css") * filectime(__DIR__ . "/depot.js")), 0, 10);

	$html = preg_replace("/depot\.(js|css)/", "depot.$1" . $cacheInvalidator, $html);

	echo $html;
}