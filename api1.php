<?php

$timer = microtime(true);

include_once __DIR__ . "/app/ComdirectDepotLoader.php";
include_once __DIR__ . "/app/Peerfolio.php";
include_once __DIR__ . "/app/vendor/FileCache.php";



// handle params ----------------------------------------------------------------------
/*
if (defined('STDIN')) {
  var_export($argv[1]);
}
*/

function getGETParam($name) {
  $param = ($name && isset($_GET[$name]) && $_GET[$name] ? $_GET[$name] : null);
  // if (!$param) die("No " . urlencode($name) . " param");
  return $param;
}
$type = getGETParam('type');
$cache = new FileCache(__DIR__ . '/data/cache');
$wrapperParam = getGETParam('wrapper');
$dateParam = getGETParam('date'); // format = 2020-12-30
$portfolioKeyParam = getGETParam('portfolio_key');
$sharedPortfolioKey = null;

// in case the portfolio is a 1000k share link
// replace $portfolioKey with real key and save shared one in $sharedPortfolioKey
if ($portfolioKeyParam && substr($portfolioKeyParam, 0, 1) === "s" && strlen($portfolioKeyParam) == 13) {
  $sharedPortfolioKey = $portfolioKeyParam;
  $rawDepotKey = $cache->getLastKey("rawdepot", substr($portfolioKeyParam, 1));
  if (preg_match('#\d{20,}#iuxs', $rawDepotKey, $matches)) {
    $portfolioKeyParam = $matches[0];
  }
}

$responseData = [];









if ($type == "stocks") {
  if (isset($dateParam) && $dateParam) {
    // load depot from specific date
    $responseData = $cache->getLast("rawdepot", $portfolioKeyParam . "_" . $dateParam);
  } else {
    // check last depot - to check for recently loaded depot and be prepared for comdirect failing
    $lastKey = $cache->getLastKey("rawdepot", $portfolioKeyParam);
    // important to make sure the whole portfolioKey is provided
    // only do for not share links, until makeSharable can be applied on depot arrays
    if (!$sharedPortfolioKey && str_contains($lastKey, $portfolioKeyParam . "_")) {
      $responseData = $cache->get("rawdepot", $lastKey);
    }

    if ($sharedPortfolioKey || !isset($responseData["timestamp"]) || time() - $responseData["timestamp"] > 60) {
      // normal depot loading from comdiect
      $depotLoader = new ComdirectDepotLoader($cache);
      $depot = $depotLoader->load($portfolioKeyParam);
      if ($depot && $depot->isValid()) {
        $responseData = $depot->toArray();
      }
    }
  }

  // if loaded via shared key, scale to 1k --> TODO: Move logic out of Depot class to be reusable for other $depotArray 
  if ($sharedPortfolioKey) {
    $responseData = Peerfolio::makeDepotArraySharable($responseData);
  }
  unset($responseData["value"]);
  unset($responseData["diffAbs"]);


  if (getGETParam('format') == "csv") {
    if ($sharedPortfolioKey) {die();}
    include_once __DIR__ . "/app/vendor/CsvExporter.php";
    
    $csvExporter = new CsvExporter(
      "peerfolio_export" . ($dateParam ? "_" . $dateParam : "") . ".csv",
      $responseData["stocks"]
    );
  }






} else if ($type == "history") { 
  $filterStockId = getGETParam('filterStockId') ?: 0;
  
  include_once __DIR__ . "/app/History.php";
  $history = new History($cache, $portfolioKeyParam, [
    "filterStockId" => $filterStockId,
    "maxDate" => $dateParam,
    "isSharable" => ($sharedPortfolioKey !== null),
  ]);

  $responseData = [
    "transactions" => $history->getTransactions(),
    "rows" => $history->getTimeSeries(),
    "stockFilterAvailable" => $history->getOwnedStocks(),
    "stockFilterUsed" => $filterStockId,
  ];







} else if ($type === "users") {
  $historyFiles = $cache->getKeys("history");
  
  $totals = [];

  $today = new DateTime();
  foreach ($historyFiles as $depotkey) {
    $historyData = $cache->get("history", $depotkey);
    if ($historyData && count($historyData)) {
      $start = new DateTime(array_key_first($historyData));
      $startInterval = $today->diff($start)->days;
     
      if (isset($totals[$startInterval])) {
        $totals[$startInterval]++; 
      } else {
        $totals[$startInterval] = 1;
      }
     
      $end = new DateTime(array_key_last($historyData));
      $endInterval = $today->diff($end)->days;
      if ($endInterval > 3) {
        if (isset($totals[$endInterval])) {
          $totals[$endInterval]--; 
        } else {
          $totals[$endInterval] = -1;
        }
      }
    }
  }
 
  ksort($totals);

  $responseData = [
    "total" => array_sum($totals),
    "age" => $totals,
  ];






} else if ($type === "ping") {
  $responseData = [
    "valid" => 0,
    "invalid" => 0,
  ];

  $depotLoader = new ComdirectDepotLoader($cache);
  
  $cacheKeys = $cache->getKeys("history");
  foreach ($cacheKeys as $cacheKeyPortfolioParam) {
    $depot = $depotLoader->load($cacheKeyPortfolioParam);
    $responseData[$depot->isValid() ? "valid" : "invalid"]++;
    // echo $depot->getTitle() . " - " . $depot->getDepotKey() . "<br>";
  }  








} else if ($type === "rate") {
  $comdirectId = getGETParam('comdirectId');
  // https://peerfol.io/api/v2/rate?comdirectId=234033038
  if ($comdirectId) {
    $url = 'https://www.comdirect.de/inf/snippet$lsg.layer.quotelist.content.ajax?DATETIME_TZ_START_RANGE_FORMATED=01.10.2020&DATETIME_TZ_END_RANGE_FORMATED=08.01.2021&INTERVALL=16&TIME=22%3A00&WITH_EARNINGS=false&ID_NOTATION=' . $comdirectId; // &OFFSET=1000

    $config = $cache->get("config", "config");
    if (isset($config["scrapestack_api_key"])) {
      $content = file_get_contents("http://api.scrapestack.com/scrape?access_key=" . $config["scrapestack_api_key"] . "&url=" . urlencode($url));
      if ($content 
        && preg_match_all('#Datum">([\d\.]+?)</td>.*?Schluss">(.+?)</td>#iuxs', $content, $matches, PREG_SET_ORDER)) {
        foreach ($matches as $id => $match) {
          echo $match[1] . ": " . $match[2] . "<br>";
        }
      }
    }
  }
  die();






} else if ($type === "css") {
  header("Content-Type: text/css");
  echo file_get_contents('web/app.css');
  die();




} else if ($type === "js") {
  require 'app/vendor/Packer.php'; // https://github.com/tholu/php-packer
  
  $js = array_reduce(glob (__DIR__ . "/web/*\.js"), function ($carry, $file) {
    return $carry . ";" . file_get_contents($file);
  }, "");
  $packedJs = (new Tholu\Packer\Packer($js, 'Normal', true, false, false))->pack();

  header("Content-Type: application/javascript");
  die("/* peerfol.io JS - " . date("c") . " - "
      . strlen($js) . "b>" . strlen($packedJs) . "b "
      . "(" . round(strlen($packedJs) / strlen($js) * 100) . "%)" . " */\n" 
      . $packedJs);





} else if ($type === "test") {
  $info = "test";

  // bitcoin = 234033038
  include_once __DIR__ . "/app/StockInfo.php";
  $stockInfo = new StockInfo($cache, 9385804);
  $attributes = $stockInfo->getAttributes();


  $responseData["info"] = $attributes;
  /*
    foreach ($history as $date => $depotItem) {
      if (isset($depotItem["stocks"])) {
        $stocksWithIds = [];
        foreach ($depotItem["stocks"] as $stock) {
          if (isset($stock["count"])) {
            if (!isset($stock["name"])) {
              $additionalAttr = $this->cache->get("stockinfo", $stock["comdirectId"]);
              if (isset($additionalAttr["name"])) {
                $stock["name"] = $additionalAttr["name"];
              }
            }

            if (!isset($stock["buyValue"]) && isset($stock["buyPrice"])) {
              $stock["buyValue"] = $stock["buyPrice"] * $stock["count"];
            }

            $id = isset($stock["id"]) ? $stock["id"] : $stock["comdirectId"];
            $stock["comdirectId"] = $id;
            unset($stock["id"]);
            $stocksWithIds[$id] = $stock;
          }
        }
        $history[$date]["stocks"] = $stocksWithIds;
      }
      if (isset($history[$date]["stocks"]) && count($history[$date]["stocks"]) == 0) {
        unset ($history[$date]["stocks"]);
      }
    }
    */


} else if ($type === "backup") {
  /**** Migrate Peerfolios to new ID ************
  $oldPeerfolioId = "xxx";
  $newPeerfolioId = "yyy";
  $oldPeerfolioKeys = $cache->getkeys("rawdepot", $oldPeerfolioId);
  foreach ($oldPeerfolioKeys as $oldKey) {
    $content = $cache->get("rawdepot", $oldKey);
    $content["key"] = $newPeerfolioId;
    $newKey = str_replace($oldPeerfolioId, $newPeerfolioId, $oldKey);
    $cache->put("rawdepot", $newKey, $content);
  }
  ***********************************************/ 





}




$responseData = [
                  'responsetime' => round((microtime(true) - $timer) * 1000),
                  'memusage_mb' => round(memory_get_usage() / pow(1024, 2), 1)
                ] + $responseData;
$output = json_encode($responseData);  // , JSON_PRETTY_PRINT

header("Content-Type: application/json");
echo (isset($wrapperParam) ? $wrapperParam . "(" . $output . ")" : $output) . ";";