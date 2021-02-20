<?php

class History {
  private $cache;
  private $portfolioKey;
  
  private $filterStockId = 0;
  private $maxDate = null;
  private $isSharable = true;

  private $depotData = [];
  private $lastDepotValue = 0;
  private $timeSeries = [];
  private $ownedStocks = [];
  private $transactions = [];
  
  public function __construct($cache, $portfolioKey, $params) {
    $this->cache = $cache;
    $this->portfolioKey = $portfolioKey;
    
    if (isset($params["filterStockId"])) {
      $this->filterStockId = $params["filterStockId"];
    }
    if (isset($params["maxDate"])) {
      $this->maxDate = $params["maxDate"];
    }
    if (isset($params["isSharable"])) {
      $this->isSharable = $params["isSharable"];
    }

    $this->loadDepotData();
    $this->cleanupDepotData();
    $this->createTimeSeriesFromDepotData();
    $this->createOwnedStocksFromDepotData();
    $this->createTransactionsFromDepotData();
    $this->makeSharable();
  }

  public function getTimeSeries () {
    return $this->timeSeries;
  }

  public function getOwnedStocks () {
    return $this->ownedStocks;
  }

  public function getTransactions () {
    return $this->transactions;
  }

  private function loadDepotData() {
    $keys = array_reverse($this->cache->getKeys("rawdepot", $this->portfolioKey));

    foreach ($keys as $index => $key) {
      if (memory_get_usage() > pow(10, 8)) {     // hosting MaxMem is 128MB = 2^27
        break;
      }
      $singleDayDepotData = $this->cache->get("rawdepot", $key);
      $date = substr($key, strlen($this->portfolioKey) + 1); 
      $this->depotData[$date] = $singleDayDepotData;
    }

    ksort($this->depotData);  // data is loaded in reverse, therefore sort now
  }

  /**
   * Remove data points which are similar to the one before and after, to reduce data load
   */
  private function cleanupDepotData() {
    $dates = array_keys($this->depotData);
    $i = 1;
    $emergencyExit = 5000;
    while ($i < count($dates) - 2 && $emergencyExit--) {
      $lastValue    = $this->depotData[$dates[$i - 1]]["value"];
      $currentValue = $this->depotData[$dates[$i]]["value"];
      $nextValue    = $this->depotData[$dates[$i + 1]]["value"];
        
      $lastDiffPer = abs($lastValue - $currentValue) / $currentValue * 100;
      $nextDiffPer = abs($nextValue - $currentValue) / $currentValue * 100;
      
      if ($lastDiffPer < 0.1 && $nextDiffPer < 0.1) {
        unset($this->depotData[$dates[$i]]);
        array_splice($dates, $i, 1);
        
        // actually remove file
        $this->cache->remove("rawdepot", $this->portfolioKey . "_" . $dates[$i]);
      } else {
        $i++;
      }
    }
  }

  private function createTimeSeriesFromDepotData () {
    foreach($this->depotData as $dateKey => $values) {
      $date = new DateTime($dateKey);
      $value = $values["value"];
      $diffAbs = $values["diffAbs"];
      $count = 0;

      $this->lastDepotValue = $value - $diffAbs;

      if ($this->filterStockId) { // overwrite values for single stock
        $value = 0;
        $diffAbs = 0;
        if (isset($values["stocks"][$this->filterStockId]["value"])) {
          $stock = $values["stocks"][$this->filterStockId];
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
        
      $arr = [
        round($value, 2),
        round($diffAbs, 2),
      ];
      if ($value && $count) {
        array_push($arr, $count);
      }
      
      $this->timeSeries[$date->format("c")] = $arr;
    }
  }

  private function createOwnedStocksFromDepotData () {
    foreach($this->depotData as $values) {
      if (isset($values["stocks"])) {
        foreach ($values["stocks"] as $stock) {
          if (isset($stock["count"]) && $stock["count"] > 0) {
            $this->ownedStocks[$stock['comdirectId']] = isset($stock['name']) ? $stock['name'] : "";
          }
        }
      }
    }
  }

  private function createTransactionsFromDepotData () {
    $prev = null;
    $curr = reset($this->depotData);
    $dateKeys = array_keys($this->depotData);
    foreach($dateKeys as $index => $dateKey) {
      if ($index < count($dateKeys) - 2) {
        $next = $this->depotData[$dateKeys[$index + 1]];
      }
        
      if (isset($prev["stocks"]) && isset($curr["stocks"])) {
        foreach($curr["stocks"] as $comdirectId => $stock) {
          if ($this->filterStockId && $this->filterStockId != $comdirectId) { 
            continue;
          }
          if (!isset($stock["count"]) || !isset($stock["buyValue"])) {
            continue;
          }

          // complete new buy
          if (!isset($prev["stocks"][$comdirectId])) {
            $this->addTransaction(
              $comdirectId,
              $stock["count"],
              $stock["buyValue"],
              $dateKey,
            );

          
          // addition or removal of existing stock
          } else if (
            isset($prev["stocks"][$comdirectId])
            && isset($prev["stocks"][$comdirectId]["count"])
            && $prev["stocks"][$comdirectId]["count"] != $stock["count"]
            && isset($prev["stocks"][$comdirectId]["buyValue"])
          ) {
            $buyValue = $stock["buyValue"] - $prev["stocks"][$comdirectId]["buyValue"];
            $this->addTransaction(
              $comdirectId,
              // TODO: fix the math - get the proper price etc
              round($stock["count"] - $prev["stocks"][$comdirectId]["count"], 6),
              round($buyValue, 2),
              $dateKey,
            );
          }
        }

        // completely sold stock
        foreach(array_diff_key($prev["stocks"], $curr["stocks"]) as $soldStock) {
          if (isset($soldStock["count"])
            && (!$this->filterStockId || $this->filterStockId == $soldStock["comdirectId"])) {
            // TODO fix in source data
            $value = (isset($soldStock["value"]) ? $soldStock["value"] : $soldStock["count"] * $soldStock["price"]);
            $this->addTransaction(
              $soldStock["comdirectId"],
              round($soldStock["count"] * -1, 6),
              round($value, 2),
              $dateKey,
            );
          }
        }
      }

      $prev = $curr;
      $curr = $next;
      $next = null;
    }
  }

  private function addTransaction($comdirectId, $count, $buyValue, $dateStr) {
    if (abs($buyValue) < 25) {  // even too small for sparplan, must be a correction
      return;
    }
    if (!isset($this->transactions[$dateStr])) {
      $this->transactions[$dateStr] = [];
    }
    $this->transactions[$dateStr][] = [
      "id" => $comdirectId,
      "count" => $count,
      "buyValue" => $buyValue,
      // "date" => $dateStr,
    ];
  }

  private function makeSharable() {
    // scale to 1k if public depot link
    if ($this->isSharable && $this->lastDepotValue) {
      $multiplier = 1000 / $this->lastDepotValue;
      foreach($this->transactions as &$dateArray) {
        foreach($dateArray as &$transaction) {
          $transaction["count"] = $transaction["count"] > 0 ? 1 : -1;
          $transaction["buyValue"] = 0;
        }
      }
      foreach($this->timeSeries as &$values) {
        $values[0] = round($values[0] * $multiplier, 2);
        $values[1] = round($values[1] * $multiplier, 2);
        if (isset($values[2])) {
          $values[2] = round($values[2] * $multiplier, 4);
        }
      }
    }
  }
}