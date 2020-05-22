<?php

include_once "vendor/FileCache.php";

$out = "";

$cache = new FileCache(__DIR__ . '/data/cache');

function getGETParam($name) {
	$param = ($name && isset($_GET[$name]) && $_GET[$name] ? $_GET[$name] : null);
	if (!$param) die("No " . urlencode($name) . " param");
	return $param;
}

$portfolioKeyParam = getGETParam('portfolio_key');
$type = getGETParam('type');
$functionName = getGETParam('wrapper');


if ($type == "history") {
	$data = $cache->get("history_" . $portfolioKeyParam);
	if (!$data) {
		die("No data loaded");
	}	

	$rowData = [];
	foreach($data as $dateKey => $values) {
		$date = new DateTime($dateKey);
		if ($date->format("N") <= 5) {		// no weekend
			$rowData[] =
				"{c:[" .
					"{v:new Date(" . $date->format("Y," . ($date->format("m")-1) . ",j") . ")}" . 
	           		",{v:" . round($values["value"]) . "}" .
	            	",{v:" . round($values["profit"] + $values["lost"]) . "}" .
	           	"]}";
	   	}
	}

	$out = $functionName . "({" .
		"cols:[{type:'date',label:'Date'}" .
		    ",{type:'number'}" .
		    ",{type:'number'}" .
		"]," .
		"rows:[" . join(",", $rowData) . "]" .
	"});";
}

echo $out;
