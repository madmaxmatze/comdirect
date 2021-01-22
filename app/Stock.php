<?php

class Stock{
  private $count = 0;
  private $id = "";
  private $name = "";
  private $isin = "";
  private $wkn = "";
  private $symbol = "";
  private $note = "";
  private $type = "";
  private $currency = "";
  private $price = "";
  private $value = 0;
  private $priceDiffAbs = 0;
  private $diffAbs = 0;
  private $market = "";
  private $buyPrice = 0;
  private $buyDate = null;
  private $date = null;
  private $limitBottom = 0;
  private $limitTop = 0;

  public function setCount($count){
    $this->count = $count;
    return $this;
  }

  public function getCount(){
    return $this->count;
  }

  public function isWatchlist(){
    return (!$this->buyPrice || !$this->buyDate);
  }

  public function setName($name) {
    $this->name = $name;
    return $this;
  }
  
  public function setId($id) {
    $this->id = $id;
    return $this;
  }

  public function getId() {
    return $this->id;
  }

  public function setWkn($wkn) {
    $this->wkn = $wkn;
    return $this;
  }

  public function setSymbol($symbol) {
    $this->symbol = $symbol;
    return $this;
  }

  public function setIsin($isin) {
    $this->isin = $isin;
    return $this;
  }

  public function setNote($note){
    $this->note = $note;
    return $this;
  }

  public function setType($type) {
    $this->type = $type;
    return $this;
  }

  public function setCurrency($currency) {
    $this->currency = $currency;
    return $this;
  }

  public function setLimitTop($limit) {
    $this->limitTop = $limit;
    return $this;
  }

  public function setLimitBottom($limit) {
    $this->limitBottom = $limit;
    return $this;
  }

  public function setPrice($price) {
    $this->price = $price;
    return $this;
  }

  public function setValue($value) {
    $this->value = $value;
    return $this;
  }

  public function getValue() {
    return $this->value;
  }

  public function getDiffAbs() {
    return $this->value - $this->buyValue;
  }

  public function setPriceDiffAbs($priceDiffAbs) {
    $this->priceDiffAbs = $priceDiffAbs;
    return $this;
  }

  public function setMarket($market) {
    $this->market = $market;
    return $this;
  }

  public function setBuyPrice($buyPrice) {
    $this->buyPrice = $buyPrice;
    return $this;
  }

  public function setBuyDate($buyDate) {
    $this->buyDate = $buyDate;
    return $this;
  }

  public function setBuyValue($buyValue) {
    $this->buyValue = $buyValue;
    return $this;
  }

  public function setDate($date) {
    $this->date = $date;
    return $this;
  }

  public function getDate() {
    return $this->date;
  }

  private function getDiffAbsToday() {
    $isBoughtToday = ($this->buyDate
      && $this->buyDate->format("d/m/y") == (new DateTime('now'))->format("d/m/y"));

    return ($isBoughtToday ? $this->diffAbs : $this->priceDiffAbs * $this->count);
  }

  public function toArray() {
    $stockArray = [
      "name" => $this->name,
      "comdirectId" => $this->id,
      "type" => $this->type,
      "market" => $this->market,
      "price" => $this->price,
      "priceDiffAbs" => $this->priceDiffAbs,
      "buyDate" => $this->buyDate ? $this->buyDate->format('c') : null,
      "date" => $this->date->format('c'),
    ];
    if ($this->count) {
      $stockArray += [
        "count" => $this->count,
        "buyPrice" => $this->buyPrice,        
        "buyValue" => $this->buyValue,
        "value" => $this->value,
        "valueDiffAbsToday" => $this->getDiffAbsToday(),
      ];
    }
    if ($this->currency) {
      $stockArray["currency"] = $this->currency;
    }
    if ($this->symbol) {
      $stockArray["symbol"] = $this->symbol;
    }
    if ($this->wkn) {
      $stockArray["wkn"] = $this->wkn;
    }
    if ($this->isin) {
      $stockArray["isin"] = $this->isin;
    } 
    if ($this->note) {
      $stockArray["note"] = $this->note;
    }
    if ($this->limitBottom) {
      $stockArray["limitBottom"] = $this->limitBottom;
    }
    if ($this->limitTop) {
      $stockArray["limitTop"] = $this->limitTop;
    }

    return $stockArray;
  }
}