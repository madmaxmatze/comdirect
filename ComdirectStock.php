<?php

class ComdirectStock{
  private $count = 0;
  private $totalCount = 0;
  private $id = "";
  private $name = "";
  private $isin = "";
  private $wkn = "";
  private $symbol = "";
  private $note = "";
  private $type = "";
  private $currency = "";
  private $currencySymbol = null;
  private $url = "";
  private $price = "";
  private $differenceAbsolutePerStock = 0;
  private $differencePercentage = 0;
  private $totalValue = 0;
  private $totalDifferenceAbsolute = 0;
  private $market = "";
  private $buyPrice = 0;
  private $buyDate = null;
  private $date = null;
  private $now = null;
  private $limitBottom = 0;
  private $limitTop = 0;

  public function __construct() {
    $this->now = new DateTime('now');
  } 

  static function compareByTotalValue($a, $b) {
    return ($a->getTotalValue() > $b->getTotalValue());
  }

  static function compareByPercentageDifference($a, $b) {
    return ($a->getTotalDifferencePercentage() > $b->getTotalDifferencePercentage());
  }

  static function compareByDifferenceAbsolute($a, $b) {
    // primiary sort
    $diffA = $a->getTotalDifferenceAbsolute();
    $diffB = $b->getTotalDifferenceAbsolute();
    if ($diffA === 0) {
      $diffA = 0.001;
    }
    if ($diffB === 0) {
      $diffB = 0.001;
    }

    $diff = $diffA - $diffB;
    if ($diff) {
      return $diff > 0;
    }

    // secondary sort
    return $a->getName() > $b->getName();
  }

  public function setCount($count){
    $this->count = $count;
  }

  public function getCount(){
    return $this->count;
  }

  /*
  public function setTotalCount($totalCount){
    $this->totalCount = $totalCount;
  }

  public function getTotalCount(){
    return $this->totalCount;
  }
  */

  public function isWatchlist(){
    return (!$this->buyPrice || !$this->buyDate);
  }

  public function setName($name) {
    $this->name = $name;
  }
  
  public function getName() {
    return $this->name;
  }

  public function setId($id) {
    $this->id = $id;
  }

  public function getId() {
    return $this->id;
  }

  public function setWkn($wkn) {
    $this->wkn = $wkn;
  }

  public function getWkn() {
    return $this->wkn;
  }

  public function setSymbol($symbol) {
    $this->symbol = $symbol;
  }

  public function getSymbol() {
    return $this->symbol;
  }

  public function setIsin($isin) {
    $this->isin = $isin;
  }

  public function getIsin() {
    return $this->isin;
  }

  public function setNote($note){
    $this->note = $note;
  }

  public function getNote(){
    return $this->note;
  } 

  public function setType($type) {
    $this->type = $type;
  }

  public function getType() {
    return $this->type;
  }

  public function setCurrency($currency) {
    $currency = preg_replace("/\W*/i", "", $currency);
    if ($currency) {
      $this->currency = $currency;
    }
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

  public function getLimitTop() {
    return $this->limitTop;
  }

  public function setLimitTop($limit) {
    $this->limitTop = $limit;
  }

  public function getLimitBottom() {
    return $this->limitBottom;
  }

  public function setLimitBottom($limit) {
    $this->limitBottom = $limit;
  }

  public function setUrl($url) {
    $this->url = $url;
  }

  public function getUrl() {
    return "https://www.comdirect.de/inf/aktien/detail/uebersicht.html?ID_NOTATION=" . $this->getId();
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
    return ($this->isBoughtToday() ? 
      $this->getTotalDifferenceAbsolute() : 
      $this->differenceAbsolutePerStock * $this->count
    );
  }

  public function setDifferencePercentage($differencePercentage) {
    $this->differencePercentage = $differencePercentage;
  }

  public function getDifferencePercentage() {
    return $this->differencePercentage;
  }

  public function setTotalValue($totalValue) {
    $this->totalValue = $totalValue;
  }

  public function getTotalValue() {
    return $this->totalValue;
  }

  public function getTotalDifferenceAbsolute() {
    return $this->totalValue - $this->totalBuyValue;
  }

  public function getTotalDifferencePercentage() {
    return ($this->totalBuyValue ? $this->getTotalDifferenceAbsolute() / $this->totalBuyValue * 100 : 0);
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
  
  public function setTotalBuyValue($totalBuyValue) {
    $this->totalBuyValue = $totalBuyValue;
  }

  public function getTotalBuyValue() {
    return $this->totalBuyValue;
  } 

  public function setDate($date) {
    $this->date = $date;
  }

  public function getDate() {
    return $this->date;
  }

  public function getFormatedDate($format) {
    return ($this->getDate() ? $this->getDate()->format($format) : "n/a");
  }

  public function getAgeOfDataInSeconds() {
    return ($this->now->getTimestamp() - ($this->getDate() ? $this->getDate()->getTimestamp() : 0));
  }

  private function getFormatedBuyDate($format) {
    return ($this->getBuyDate() ? $this->getBuyDate()->format($format) : "n/a");
  }

  private function isBoughtToday(){
    return ($this->getFormatedBuyDate("d/m/y") == $this->now->format("d/m/y"));
  }

  public function isDataFromToday() {
    return ($this->getFormatedDate("d/m/y") == $this->now->format("d/m/y"));
  }
}