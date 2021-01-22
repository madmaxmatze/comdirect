<?php

class History {
	private $cache;
	private $portfolioKey;
	
	private $filterStockId = 0;
	private $maxDate = null;
	private $isSharable = true;

	private $depotData = [];
	private $timeSeries = [];
	private $ownedStocks = [];
	
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
  	$this->makeSharable();
	}

	public function getTimeSeries () {
		return $this->timeSeries;
	}

	public function getOwnedStocks () {
		return $this->ownedStocks;
	}

	private function loadDepotData() {
    $keys = $this->cache->getKeys("rawdepot", $this->portfolioKey);
  
	 	foreach ($keys as $key) {
	    $singleDayDepotData = $this->cache->get("rawdepot", $key);
	    $date = substr($key, strlen($this->portfolioKey) + 1); 
	    $this->depotData[$date] = $singleDayDepotData;
	  }
	}

	/**
	 * Remove data points which are similar to the one before and after, to reduce data load
	 */
	private function cleanupDepotData() {
	  $dates = array_keys($this->depotData);
	  
	  $i = 1;
	  $emergencyExit = 1000;
	  while ($i < count($dates) - 2 && $emergencyExit--) {
	  	$lastValue 		= $this->depotData[$dates[$i - 1]]["value"];
  		$currentValue = $this->depotData[$dates[$i]]["value"];
  		$nextValue 		= $this->depotData[$dates[$i + 1]]["value"];
	  		
			$lastDiffPer = abs($lastValue - $currentValue) / $currentValue * 100;
			$nextDiffPer = abs($nextValue - $currentValue) / $currentValue * 100;
    	
    	if ($lastDiffPer < 0.1 && $nextDiffPer < 0.1) {
				unset($this->depotData[$dates[$i]]);
				array_splice($dates, $i, 1);
    	} else {
    		$i++;
    	}
    }
	}

	private function createTimeSeriesFromDepotData () {
	 	foreach($this->depotData as $dateKey => $values) {
	    $date = new DateTime($dateKey);
	    $value = round($values["value"]);
	    $diffAbs = round($values["diffAbs"]);
	    $count = 0;

	    //if ($date->format("N") <= 5   // no weekend
	    // ){
	      $lastBuyValue = $value - $diffAbs; // just take the very last buyValue

	      // overwrite values for single stock
	      if ($this->filterStockId) {
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
          $value,
          $diffAbs,
        ];
        if ($value && $count) {
          array_push($arr, $count);
        }
        $this->timeSeries[$date->format("c")] = $arr;
	    //}
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

	private function makeSharable() {
		// scale to 1k if public depot link
		$lastSeriesValue = end($this->timeSeries);
		$lastBuyValue = $lastSeriesValue[0] - $lastSeriesValue[1];

	  if ($this->isSharable && $lastBuyValue) {
	    $multiplier = 1000 / $lastBuyValue;
	    foreach($this->timeSeries as &$values) {
	      $values[0] *= $multiplier;
	      $values[1] *= $multiplier;
	      if (isset($values[2])) {
	        $values[2] *= $multiplier;
	      }
	    }
	  }
	}
}