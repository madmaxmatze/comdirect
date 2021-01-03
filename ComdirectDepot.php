<?php

class ComdirectDepot{
	private $startTime = 0;
	private $stopTime = 0;
	private $depotKey = null;
	private $shareDepotKey = null;
	private $title = null;
	private $stocks = array();
	private $totalValue = null;
	private $buyTotalValue = null;
	private $differerenceAbsolute = null;
	private $differenceComparedToYesterday = null;
	private $newestStockTimestamp = null;
	private $currency = null;
	private $loadingTime = 0;

	// sum of lost of all stocks in minus
	private $totalLost = null;
	// sum of gains of all stocks in plus
	private $totalProfit = null;

	public function __construct($depotKey) {
		$this->startTime = microtime(true); 
		// $depotKey = preg_replace("/\D*/", "", $depotKey);  // sanatize
		$this->depotKey = $depotKey;
	}
	
	public function isValid() {
		return ($this->getTitle() !== null);
	}

	public function getTitle() {
		return $this->title;
	}

	public function setTitle($title) {
		$this->title = $title;
	}

	public function getDepotKey() {
		return $this->depotKey;
	}

	public function getShareDepotKey() {
		return $this->shareDepotKey;
	}

	public function makeSharable($shareDepotKey) {
		$this->shareDepotKey = $shareDepotKey;

		$divider = $this->getBuyTotalValue() / 1000;
				
		foreach ($this->getStocksWithCount() as $stock) {
			$stock->setTotalBuyValue($stock->getTotalBuyValue() / $divider);
			$stock->setTotalValue($stock->getTotalValue() / $divider);
			$stock->setCount($stock->getCount() / $divider);
		}
	
		$this->totalValue = null;
		$this->buyTotalValue = null;	
	}

	public function getStocks() {
		usort($this->stocks, array("ComdirectStock", "compareByDifferenceAbsolute"));
	
		return $this->stocks;
	}

	public function setStocks($stocks) {
		$this->stocks = $stocks;
	}

	public function getStocksWithCount() {
		$stocksWithCount = [];

		foreach ($this->stocks as $i => $stock) {
			if (!$stock->isWatchlist()) {
				$stocksWithCount[] = $stock;
			}
		}
		
		return $stocksWithCount;
	}

	private function getBuyTotalValue() {
		if ($this->buyTotalValue === null) {
			$this->buyTotalValue = 0;
			foreach ($this->getStocksWithCount() as $stock) {
				$this->buyTotalValue += $stock->getTotalBuyValue();
			}
		}
		return $this->buyTotalValue;
	}

	public function getTotalValue() {
		if ($this->totalValue === null) {
			$this->totalValue = 0;
			foreach ($this->getStocksWithCount() as $stock) {
				$this->totalValue += $stock->getTotalValue();
			}
		}
		return $this->totalValue;	
	}

	public function getDiffererenceAbsolute() {
		if ($this->differerenceAbsolute === null) {
			$this->differerenceAbsolute = 0;
			foreach ($this->getStocksWithCount() as $stock) {
				$this->differerenceAbsolute += $stock->getTotalDifferenceAbsolute();
			}
		}
		return $this->differerenceAbsolute;
	}

	public function setDifferenceAbsoluteComparedToYesterday($differenceComparedToYesterday) {
		$this->differenceComparedToYesterday = $differenceComparedToYesterday;
	}


	public function getNewestStockTimestamp() {
		if ($this->newestStockTimestamp == null) {
			foreach ($this->stocks as $stock) {
				if ($this->newestStockTimestamp == null || $this->newestStockTimestamp < $stock->getDate()) {
					$this->newestStockTimestamp = $stock->getDate();
				}
			}
		}

		return $this->newestStockTimestamp;
	}

	public function getTotalProfit() {
		$this->calculateTotalLostAndProfit();
		return $this->totalProfit;
	}

	public function getTotalLost() {
		$this->calculateTotalLostAndProfit();
		return $this->totalLost;
	}

	private function calculateTotalLostAndProfit() {
		if ($this->totalLost !== null 
			&& $this->totalProfit !== null) {
			return;
		}

		$this->totalLost = 0;
		$this->totalProfit = 0;
		foreach ($this->stocks as $stock) {
			$change = $stock->getTotalDifferenceAbsolute();
			if ($change < 0) {
				$this->totalLost += $change;
			} else {
				$this->totalProfit += $change;
			}
		}
		$this->totalProfit = round($this->totalProfit, 2);
		$this->totalLost = round($this->totalLost, 2);
	}

	public function getCurrency() {
		return $this->currency;
	}

	public function setCurrency($currency) {
		$this->currency = $currency;
	}

	public function loadingFinished() {
		$this->stopTime = microtime(true); 
	}

	public function getLoadingDuration() {
		return round(($this->stopTime - $this->startTime) * 1000);
	}

	public function getLoadingTime() {
		return $this->startTime - (15 * 60);
	}

	public function toArray() {
		$depotArray = [
			"title" => $this->getTitle(),
			"currency" => $this->getCurrency(),
			"loadtime" => $this->getLoadingDuration(),
			"stocks" => [],
		];
		
		if ($this->getShareDepotKey()) {
			$depotArray["sharedKey"] = $this->getShareDepotKey();
		} else if ($this->getDepotKey()) {
			$depotArray["key"] = $this->getDepotKey();
		}
		
		foreach ($this->getStocks() as $stock) {
			$stockArray = [
				"name" => $stock->getName(),
				"comdirectId" => $stock->getId(),
				"type" => $stock->getType(),
				"market" => $stock->getMarket(),
				"price" => $stock->getPrice(),
				"priceDiffAbs" => $stock->getDifferenceAbsolutePerStock(),
				"buyDate" => $stock->getBuyDate() ? $stock->getBuyDate()->format('D M d Y H:i:s O') : null,
				"date" => $stock->getDate()->format('D M d Y H:i:s O'),
			];
			if ($stock->getCurrency()) {
				$stockArray["currency"] = $stock->getCurrency();
			}
			if ($stock->getSymbol()) {
				$stockArray["symbol"] = $stock->getSymbol();
			}
			if ($stock->getWkn()) {
				$stockArray["wkn"] = $stock->getWkn();
			}
			if ($stock->getIsin()) {
				$stockArray["isin"] = $stock->getIsin();
			}
			if ($stock->getCount()) {
				$stockArray["count"] = $stock->getCount();
				$stockArray["buyPrice"] = $stock->getBuyPrice();				
				$stockArray["buyValue"] = $stock->getTotalBuyValue();
				$stockArray["value"] = $stock->getTotalValue();
				$stockArray["valueDiffAbsToday"] = $stock->getDifferenceAbsolute();
			}	
			if ($stock->getNote()) {
				$stockArray["note"] = $stock->getNote();
			}
			if ($stock->getLimitBottom()) {
				$stockArray["limitBottom"] = $stock->getLimitBottom();
			}
			if ($stock->getLimitTop()) {
				$stockArray["limitTop"] = $stock->getLimitTop();
			}
			$depotArray["stocks"][$stock->getId()] = $stockArray;
		}
	
		return $depotArray;
	}




	// private $newestStockTimestamp = null;
	// private $differenceAbsoluteForToday = null;
	// private $differenceAbsoluteStockValueForToday = null;
	// private $currencySymbol = null;


/*
	public function setTotalValue($totalValue) {
		// $this->totalValue = $totalValue;
	}
*/

/*
	

	public function isTradingDay() {
		$now = new DateTime('now');
		return ($this->getNewestStockTimestamp() && $this->getNewestStockTimestamp()->format("d/m/y") == $now->format("d/m/y"));
	}
*/

/*
	public function sortByTotalValue() {
		usort($this->stocks, array("ComdirectStock", "compareByTotalValue"));
	}
*/

/*
	public function setBuyTotalValue($buyTotalValue) {
		$this->buyTotalValue = $buyTotalValue;
	}
*/


/*	public function getStockCount() {
		return count($this->stocks);
	}
*/


	/* 
	public function setDiffererenceAbsolute($differerenceAbsolute) {
		$this->differerenceAbsolute = $differerenceAbsolute;
	}
	*/
/*
	public function getDiffererencePercentage() {
		return $this->getTotalValue() ? $this->getDiffererenceAbsolute() / ($this->getTotalValue() - $this->getDiffererenceAbsolute()) * 100 : 0;
	}
*/
	/*
	private function getDifferenceAbsoluteComparedToYesterday() {
		return $this->differenceComparedToYesterday;
	}
	*/

/*
	public function getDifferencePercentageComparedToYesterday() {
		return $this->totalValue ? $this->differenceComparedToYesterday / ($this->totalValue - $this->differenceComparedToYesterday) * 100 : 0;
	}
*/



/*
	private function getDifferenceAbsoluteForToday() {
		if ($this->differenceAbsoluteForToday == null) {
			$this->differenceAbsoluteForToday = 0;
			foreach ($this->stocks as $stock) {
				if ($stock->isDataFromToday()) {
					$this->differenceAbsoluteForToday += $stock->getDifferenceAbsolute();
					$this->differenceAbsoluteStockValueForToday += $stock->getTotalValue();
				}
			}
		}

		return $this->differenceAbsoluteForToday;
	}
*/

/*
	public function getDifferencePercentageForToday() {
		if ($this->differenceAbsoluteStockValueForToday == null) {
			$this->getDifferenceAbsoluteForToday();
		}

		if ($this->differenceAbsoluteForToday == 0) {
			return 0;
		} else {
			return $this->differenceAbsoluteForToday / $this->totalValue * 100;
		}	
	}
*/

}
