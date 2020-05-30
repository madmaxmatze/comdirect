<?php

class ComdirectDepot{
	const COMDIRECT_FRIENDS_URL = "https://www.comdirect.de/inf/musterdepot/pmd/freunde.html?SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO&SORTDIR=ASCENDING&portfolio_key=";

	private $startTime = 0;
	private $stopTime = 0;
	
	private $depotKey = null;
	private $title = null;
	
	private $stocks = array();
	private $totalValue = null;
	private $buyTotalValue = null;
	private $differerenceAbsolute = null;
	private $differenceComparedToYesterday = null;
	private $currency = null;
	private $currencySymbol = null;
	private $newestStockTimestamp = null;
	private $loadingTime = 0;
	private $differenceAbsoluteForToday = null;
	private $differenceAbsoluteStockValueForToday = null;

	// sum of lost of all stocks in minus
	private $totalLost = null;
	// sum of gains of all stocks in plus
	private $totalProfit = null;

	public function __construct($depotKey) {
		$this->startTime = microtime(true); 
		$depotKey = preg_replace("/\D*/", "", $depotKey); // sanatize
		$this->depotKey = $depotKey;
	}
	
	public function isValid() {
		return ($this->getTotalValue() !== null);
	}

	public function getTitle() {
		return $this->title;
	}

	public function setTitle($title) {
		$this->title = $title;
	}

	public function getUrl() {
		return self::COMDIRECT_FRIENDS_URL . $this->depotKey;
	}

	public function getDepotKey() {
		return $this->depotKey;
	}

	public function getStockCount() {
		return count($this->stocks);
	}

	public function getStocks() {
		return $this->stocks;
	}

	public function getStocksWithCount() {
		$stocksWithCount = [];

		foreach ($this->stocks as $i => $stock) {
			if ($stock->getCount() > 0) {
				$stocksWithCount[] = $stock;
			}
		}
		
		return $stocksWithCount;
	}

	public function setStocks($stocks) {
		$this->stocks = $stocks;
	}

	public function getBuyTotalValue() {
		return $this->buyTotalValue;
	}

	public function setBuyTotalValue($buyTotalValue) {
		$this->buyTotalValue = $buyTotalValue;
	}


	public function getTotalValue() {
		return $this->totalValue;
	}

	public function setTotalValue($totalValue) {
		$this->totalValue = $totalValue;
	}

	public function getDiffererenceAbsolute() {
		return $this->differerenceAbsolute;
	}

	public function setDiffererenceAbsolute($differerenceAbsolute) {
		$this->differerenceAbsolute = $differerenceAbsolute;
	}

	public function getDiffererencePercentage() {
		return $this->totalValue ? $this->differerenceAbsolute / ($this->totalValue - $this->differerenceAbsolute) * 100 : 0;
	}

	public function getDifferenceAbsoluteComparedToYesterday() {
		return $this->differenceComparedToYesterday;
	}

	public function getDifferencePercentageComparedToYesterday() {
		return $this->totalValue ? $this->differenceComparedToYesterday / ($this->totalValue - $this->differenceComparedToYesterday) * 100 : 0;
	}

	public function setDifferenceAbsoluteComparedToYesterday($differenceComparedToYesterday) {
		$this->differenceComparedToYesterday = $differenceComparedToYesterday;
	}

	public function getDifferenceAbsoluteForToday() {
		if ($this->differenceAbsoluteForToday == null) {
			$this->differenceAbsoluteForToday = 0;
			foreach ($this->stocks as $stock) {
				if ($stock->isDataFromToday()) {
					$this->differenceAbsoluteForToday += $stock->getDifferenceAbsolute();
					$this->differenceAbsoluteStockValueForToday += $stock->getTotalPrice();
				}
			}
		}

		return $this->differenceAbsoluteForToday;
	}

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

	public function isTradingDay() {
		$now = new DateTime('now');
		return ($this->getNewestStockTimestamp()->format("d/m/y") == $now->format("d/m/y"));
	}

	public function loadingFinished() {
		$this->stopTime = microtime(true); 
	}


	public function sortByTotalValue() {
		usort($this->stocks, array("ComdirectStock", "compareByTotalValue"));
	}


	public function getLoadingDuration() {
		return $this->stopTime - $this->startTime;
	}

	public function getLoadingTime() {
		return $this->startTime - (15 * 60);
	}
}
