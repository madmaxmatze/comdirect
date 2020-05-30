<?php

try {
	include_once "vendor/FileCache.php";

	$cache = new FileCache(__DIR__ . '/data/cache');
	$cacheKeys = $cache->getKeys("/history\_[0-9]+/");

	foreach ($cacheKeys as $cacheKey) {
		$url = 	
			"https://" .
			$_SERVER["SERVER_NAME"] .
			preg_replace("/ping\.php/", "", $_SERVER["REQUEST_URI"]) .
			"?portfolio_key=" . 
			preg_replace("/history\_/", "", $cacheKey);

		// echo $url . "<br>";

		$content = @file_get_contents($url);
	}
	
	echo 'OK';
} catch (Exception $e) {
    echo 'Exception';
}