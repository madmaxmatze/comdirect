<?php

class ComdirectDepot{
	const COMDIRECT_FRIENDS_URL = "http://www.comdirect.de/inf/musterdepot/pmd/freunde.html?portfolio_key=";
	private $depotKey = null;
	private $title = null;
	
	private $stocks = null;
	private $totalValue = null;
	private $differerenceAbsolute = null;
	private $differenceComparedToYesterday = null;
	private $currency = null;
	private $currencySymbol = null;
	private $newestStockTimestamp = null;

	public function __construct($depotKey) {
		$this->depotKey = $depotKey;
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

	public function getStockCount() {
		return count($this->stocks);
	}

	public function getStocks() {
		return $this->stocks;
	}

	public function setStocks($stocks) {
		$this->stocks = $stocks;
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
		return $this->differerenceAbsolute / ($this->totalValue - $this->differerenceAbsolute) * 100;
	}

	public function getDifferenceAbsoluteComparedToYesterday() {
		return $this->differenceComparedToYesterday;
	}

	public function getDifferencePercentageComparedToYesterday() {
		return $this->differenceComparedToYesterday / ($this->totalValue - $this->differenceComparedToYesterday) * 100;
	}

	public function setDifferenceAbsoluteComparedToYesterday($differenceComparedToYesterday) {
		$this->differenceComparedToYesterday = $differenceComparedToYesterday;
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
}
