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
	
	// sum of lost of all stocks in minus
	private $totalLost = null;
	// sum of gains of all stocks in plus
	private $totalProfit = null;

	public function __construct($depotKey) {
		// $depotKey = preg_replace("/\D*/", "", $depotKey);  // sanatize
		$this->depotKey = $depotKey;
	}
	
	public function isValid() {
		return ($this->getTitle() !== null && $this->getTitle() !== "");
	}

	public function getTitle() {
		return $this->title;
	}

	public function setTitle($title) {
		$this->title = $title;
		return $this;
	}

	public function getDepotKey() {
		return $this->depotKey;
	}

	public function getStocks() {
		usort($this->stocks, array("ComdirectStock", "compareByDifferenceAbsolute"));
	
		return $this->stocks;
	}

	public function setStocks($stocks) {
		$this->stocks = $stocks;
		return $this;
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
		return $this;
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

	/*
	private function getTotalProfit() {
		$this->calculateTotalLostAndProfit();
		return $this->totalProfit;
	}

	private function getTotalLost() {
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
	*/

	public function getCurrency() {
		return $this->currency;
	}

	public function setCurrency($currency) {
		$this->currency = $currency;
		return $this;
	}

	public function toArray() {
		$depotArray = [
			"title" => $this->getTitle(),
			"date" => $this->getNewestStockTimestamp()->format("c"),
			"timestamp" => time(),
			"currency" => $this->getCurrency(),
			"stocks" => [],
			
			// critical information 			
			"key" => $this->getDepotKey(),
			"value" => round($this->getTotalValue(), 2),
			"diffAbs" => round($this->getDiffererenceAbsolute(), 2),
		];
				
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
			if ($stock->getCount()) {
				$stockArray += [
					"count" => $stock->getCount(),
					"buyPrice" => $stock->getBuyPrice(),				
					"buyValue" => $stock->getTotalBuyValue(),
					"value" => $stock->getTotalValue(),
					"valueDiffAbsToday" => $stock->getDifferenceAbsolute(),
				];
			}
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

	static function makeDepotArraySharable($depotArray) {
		if (!isset($depotArray["key"]) || !isset($depotArray["value"]) || !isset($depotArray["diffAbs"])) {
			return [];
		}

		$depotArray["sharedKey"] = "s" . substr($depotArray["key"], 0, 12);
		unset($depotArray["key"]);

		$divider = ($depotArray["value"] - $depotArray["diffAbs"]) / 1000;
		foreach ($depotArray["stocks"] as &$stock) {
			if (isset($stock["count"]) && $stock["count"]) {
				$stock["buyValue"] /= $divider;
				$stock["value"] /= $divider;
				$stock["count"] /= $divider;
			}
		}

		unset($depotArray["value"]);
  		unset($depotArray["diffAbs"]);

  		return $depotArray;
	}
}