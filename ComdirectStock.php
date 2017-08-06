<?php

class ComdirectStock{
	private $count = 0;
	private $name = "";
	private $wkn = "";
	private $type = "";
	private $currency = "";
	private $currencySymbol = null;
	private $url = "";
	private $price = "";
	private $differenceAbsolutePerStock = 0;
	private $differencePercentage = 0;
	private $totalPrice = 0;
	private $totalDifferenceAbsolute = 0;
	private $market = "";
	private $buyPrice = 0;
	private $buyDate = 0;
	private $date = null;
	private $now = null;

	public function __construct() {
		$this->now = new DateTime('now');
	} 

	static function compareByPercentageDifference($a, $b) {
		return ($a->getTotalDifferencePercentage() > $b->getTotalDifferencePercentage());
	}

	static function compareByPercentageAbsolute($a, $b) {
		return ($a->getTotalDifferenceAbsolute() > $b->getTotalDifferenceAbsolute());
	}

	public function setCount($count){
		$this->count = $count;
	}

	public function getCount(){
		return $this->count;
	}

	public function getCountRounded(){
		return round($this->count * 100) / 100;
	}

	public function setName($name) {
		$this->name = $name;
	}
	
	public function getName() {
		return $this->name;
	}

	public function setWkn($wkn) {
		$this->wkn = $wkn;
	}

	public function getWkn() {
		return $this->wkn;
	}

	public function setType($type) {
		$this->type = $type;
	}

	public function getType() {
		return $this->type;
	}

	public function setCurrency($currency) {
		$this->currency = $currency;
	}

	public function getCurrency() {
		return $this->currency;
	}

	public function getCurrencySymbol() {
		if ($this->currencySymbol === null) {
			$this->currencySymbol = "?";
			
			if ($this->currency == "EUR") {
				$this->currencySymbol = "&euro;";
			} elseif ($this->currency == "USD") {
				$this->currencySymbol = "$";
			}
		}

		return $this->currencySymbol;
	}

	public function isCurrencyEur() {
		return ($this->currency == "EUR");
	}

	public function setUrl($url) {
		$this->url = $url;
	}

	public function getUrl() {
		return $this->url;
	}

	public function setPrice($price) {
		$this->price = $price;
	}

	public function getPrice() {
		return $this->price;
	}

	public function setDifferenceAbsolutePerStock($differenceAbsolutePerStock) {
		$this->differenceAbsolutePerStock = $differenceAbsolutePerStock;
	}

	public function getDifferenceAbsolutePerStock() {
		return $this->differenceAbsolutePerStock;
	}

	public function getDifferenceAbsolute() {
		return $this->differenceAbsolutePerStock * $this->count;
	}

	public function setDifferencePercentage($differencePercentage) {
		$this->differencePercentage = $differencePercentage;
	}

	public function getDifferencePercentage() {
		return $this->differencePercentage;
	}

	public function setTotalPrice($totalPrice) {
		$this->totalPrice = $totalPrice;
	}

	public function getTotalPrice() {
		return $this->totalPrice;
	}

	public function setTotalDifferenceAbsolute($totalDifferenceAbsolute) {
		$this->totalDifferenceAbsolute = $totalDifferenceAbsolute;
	}

	public function getTotalDifferenceAbsolute() {
		return $this->totalDifferenceAbsolute;
	}

	public function setTotalDifferencePercentage($totalDifferencePercentage) {
		$this->totalDifferencePercentage = $totalDifferencePercentage;
	}

	public function getTotalDifferencePercentage() {
		return $this->totalDifferencePercentage;
	}

	public function setMarket($market) {
		$this->market = $market;
	}

	public function getMarket() {
		return $this->market;
	}

	public function setBuyPrice($buyPrice) {
		$this->buyPrice = $buyPrice;
	}

	public function getBuyPrice() {
		return $this->buyPrice;
	}	

	public function setBuyDate($buyDate) {
		$this->buyDate = $buyDate;
	}

	public function getBuyDate() {
		return $this->buyDate;
	}			
	
	public function setTotalBuyPrice($totalBuyPrice) {
		$this->totalBuyPrice = $totalBuyPrice;
	}

	public function getTotalBuyPrice() {
		return $this->totalBuyPrice;
	}	

	public function setDate($date) {
		$this->date = $date;
	}

	public function getDate() {
		return $this->date;
	}

	public function getAgeOfDataInSeconds() {
		return ($this->now->getTimestamp() - $this->getDate()->getTimestamp());
	}

	public function isDataFromToday() {
		return ($this->getDate()->format('d') == $this->now->format('d'));
	}
}