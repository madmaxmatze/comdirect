<?php

include_once "ComdirectDepotLoader.php";
include_once "vendor/FileCache.php";


function getGETParam($name) {
  $param = ($name && isset($_GET[$name]) && $_GET[$name] ? $_GET[$name] : null);
  // if (!$param) die("No " . urlencode($name) . " param");
  return $param;
}


$type = getGETParam('type');
$cache = new FileCache(__DIR__ . '/data/cache');

$depotLoader = new ComdirectDepotLoader($cache);


if ($type == "rate") {
  $name = getGETParam('name');
  $date = getGETParam('date');
  $apikey = getGETParam('apikey'); // 03DA46E5-2F78-4010-8A97-6EC488E521CB
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

  /*
  $multiplier = 1;
  if ($depot->getShareDepotKey()) {
    $lastData = end($data);
    $multiplier = 1000 / ($lastData["value"] - $lastData["diffAbs"]);
  }
  */ 

  $filterStockId = getGETParam('filterStockId');
  
  $today = new DateTime('now');
  $responseData = [
    "rows"=>[],
    "stockFilterAvailable" => [],
    "stockFilterUsed" => ($filterStockId ? $filterStockId : 0)
  ];


  $historyData = $cache->get("history_" . $depot->getDepotKey());
  if ($historyData) {

    $lastBuyValue = 0;

    foreach($historyData as $dateKey => $values) {
      $date = new DateTime($dateKey);
      $value = round($values["value"]);
      $diffAbs = round($values["diffAbs"]);
      $count = 0;

      if ($date->format("N") <= 5   // no weekend
        // && ($date->diff($today)->days < 365 || $date->format("N") == 1) // only Monday when older then one year --> TODO: change to weekly average
        /*
          $weekData = [];
          $date = new DateTime($date);
          $week = $date->format("W");
        */

      ){
        $lastBuyValue = $value - $diffAbs; // just take the very last buyValue

        // overwrite values for single stock
        if ($filterStockId) {
          $value = 0;
          $diffAbs = 0;
          if (isset($values["stocks"]) && isset($values["stocks"][$filterStockId])) {
            $stock = $values["stocks"][$filterStockId];
            $count = $stock["count"];
            $value = round($stock["value"]);          
            if (isset($stock["buyValue"])) {
              $buyValue = $stock["buyValue"];
            } else if ($stock["price"] == $stock["buyPrice"]) {   // workaround for Euro
              $buyValue = $value;
            } else {
              $buyValue = $stock["buyPrice"] * $stock["count"];
            }
            $diffAbs = round($value - $buyValue);
          }
        }
        
        $responseData["rows"][$date->format("Y-m-d")] = [
          $value,
          $diffAbs
        ];
        if ($value && $count) {
          array_push($responseData["rows"][$date->format("Y-m-d")], $count);
        }
        
        if (isset($values["stocks"])) {
          foreach ($values["stocks"] as $id => $stock) {
            if (isset($stock["count"]) && $stock["count"] > 0) {
              $responseData["stockFilterAvailable"][$stock['comdirectId']] = isset($stock['name']) ? $stock['name'] : "";
            }
          }
        }
      }
    }

    // scale to 1k if public depot link
    if ($depot->getShareDepotKey() && $lastBuyValue) {
      $multiplier = 1000 / $lastBuyValue;
      foreach($responseData["rows"] as $dateKey => $values) {
        $responseData["rows"][$dateKey][0] *= $multiplier;
        $responseData["rows"][$dateKey][1] *= $multiplier;
        if (isset($responseData["rows"][$dateKey][2])) {
          $responseData["rows"][$dateKey][2] *= $multiplier;
        }
      }
    }
  }

  echo $wrapper . "(" . json_encode($responseData) . ");";
}