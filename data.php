<?php

include_once "ComdirectDepotLoader.php";
include_once "vendor/FileCache.php";


function getGETParam($name) {
	$param = ($name && isset($_GET[$name]) && $_GET[$name] ? $_GET[$name] : null);
	if (!$param) die("No " . urlencode($name) . " param");
	return $param;
}


$type = getGETParam('type');
$cache = new FileCache(__DIR__ . '/data/cache');

$depotLoader = new ComdirectDepotLoader($cache);


if ($type == "rate") {
	$name = getGETParam('name');
	$date = getGETParam('date');
	$apikey = getGETParam('apikey'); //	03DA46E5-2F78-4010-8A97-6EC488E521CB
	$cacheKey = $type . "_" . $name;
	if ($name == "bitcoin") {
		$bitcoinRates = $cache->get($cacheKey);
		if (!$bitcoinRates) {
			$bitcoinRates = [];
		}
		
		if ($bitcoinRates[$date]) {
			$rate = $bitcoinRates[$date];
		} else {
			$content = file_get_contents("https://rest.coinapi.io/v1/exchangerate/BTC/EUR?output_format=json&apikey=" . $apikey . "&time=" . $date);
			if ($content) {
				$rateInfo = json_decode($content, true);
				$rate = round($rateInfo["rate"]);
				if ($rate) {
					$bitcoinRates[$date] = $rate;
					ksort ($bitcoinRates); 
					$cache->put($cacheKey, $bitcoinRates);
				}
			}
		}
	}

	echo $rate;
	die();
}

if ($type == "ping") {
	try {
		$cacheKeys = $cache->getKeys("/^history\_[0-9]+/");

		$i = 0;
		foreach ($cacheKeys as $cacheKey) {
			$portfolioKeyParam = preg_replace("/history\_/", "", $cacheKey);
			$depot = $depotLoader->load($portfolioKeyParam);
			$i++;
		}
		
		echo 'OK ' . $i;
	} catch (Exception $e) {
	    echo 'Exception';
	}
	die();
}	



$portfolioKeyParam = getGETParam('portfolio_key');
$wrapper = getGETParam('wrapper');



if ($type == "stocks") {	
	$depot = $depotLoader->load($portfolioKeyParam);
	echo $wrapper . "(" . json_encode($depot ? $depot->toArray() : []) . ");";
}


if ($type == "history") {
	$depot = $depotLoader->loadCachedWithoutSaving($portfolioKeyParam);
	if (!$depot) {
		die("No depot loaded");
	}

	$data = $cache->get("history_" . $depot->getDepotKey());
	if (!$data) {
		die("No historical data loaded");
	}

	$multiplier = 1;
	if ($depot->getShareDepotKey()) {
		$lastData = end($data);
		$multiplier = 1000 / ($lastData["value"] - $lastData["profit"] - $lastData["lost"]);
	}
	
	$rowData = [];
	foreach($data as $dateKey => $values) {
		$date = new DateTime($dateKey);
		if ($date->format("N") <= 5) {		// no weekend
			$rowData[] =
				"{c:[" .
					"{v:new Date(" . $date->format("Y," . ($date->format("m")-1) . ",j") . ")}" . 
	           		",{v:" . round($values["value"] * $multiplier) . "}" .
	            	",{v:" . round(($values["profit"] + $values["lost"]) * $multiplier) . "}" .
	           	"]}";
	   	}
	}

	echo $wrapper . "({" .
		"cols:[{type:'date',label:'Date'}" .
		    ",{type:'number'}" .
		    ",{type:'number'}" .
		"]," .
		"rows:[" . join(",", $rowData) . "]" .
	"});";
}



