<?php

class ComdirectDepot{
  private $depotKey = null;
  private $shareDepotKey = null;
  private $title = null;
  private $stocks = [];
  private $currency = "EUR";

  public function __construct($depotKey) {
    // $depotKey = preg_replace("/\D*/", "", $depotKey);  // sanatize
    $this->depotKey = $depotKey;
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

  public function isValid() {
    return ($this->getTitle() !== null && $this->getTitle() !== "") 
          && $this->getLatestStockDate();
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
    return $this->stocks;
  }

  public function setStocks($stocks) {
    $this->stocks = $stocks;
    return $this;
  }

  public function setCurrency($currency) {
    $this->currency = $currency;
    return $this;
  }

  private function stocksToArray() {
    $stocksArray = [];
    foreach ($this->getStocks() as $stock) {
      $stocksArray[$stock->getId()] = $stock->toArray();
    }
    return $stocksArray;
  }

  public function toArray() {
    return [
      "title" => $this->getTitle(),
      "date" => $this->getLatestStockDate()->format("c"),
      "timestamp" => time(),
      "currency" => $this->currency,
      "stocks" => $this->stocksToArray(),
      "key" => $this->getDepotKey(),
      "value" => round($this->getValue(), 2),
      "diffAbs" => round($this->getDiffAbs(), 2),
    ];
  }

  public function getLatestStockDate() {
    return array_reduce($this->getStocks(), function($latestDateTime, $stock){
      return ($latestDateTime || $latestDateTime > $stock->getDate() ? $latestDateTime : $stock->getDate());
    });
  }

  private function getValue() {
    return array_reduce($this->getStocksWithCount(), function($addedValue, $stock){
      return $addedValue + $stock->getValue();
    });
  }

  private function getStocksWithCount() {
    return array_filter($this->stocks, function ($stock) {
      return !$stock->isWatchlist();
    });
  }

  private function getDiffAbs() {
    return array_reduce($this->getStocksWithCount(), function($addedDiffAbs, $stock){
      return $addedDiffAbs + $stock->getDiffAbs();
    });
  }
}