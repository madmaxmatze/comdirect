<?php

class Peerfolio {
  private $key = null;
  private $title = null;
  private $currency = "EUR";
  private $stocks = [];

  public function __construct($key) {
    $this->key = $key;
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
        $stock["valueDiffAbsToday"] /= $divider;
      }
    }

    unset($depotArray["value"]);
    unset($depotArray["diffAbs"]);

    return $depotArray;
  }

  public function setTitle($title) {
    $this->title = $title;
    return $this;
  }

  public function setStocks($stocks) {
    $this->stocks = $stocks;
    return $this;
  }

  public function setCurrency($currency) {
    $this->currency = $currency;
    return $this;
  }

  public function isValid() {
    return ($this->title && count($this->stocks) && $this->getLatestStockDate());
  }

  public function toArray() {
    return [
      "title" => $this->title,
      "date" => $this->getLatestStockDate()->format("c"),
      "timestamp" => time(),
      "currency" => $this->currency,
      "stocks" => $this->stocksToArray(),
      "key" => $this->key,
      "value" => round($this->getValue(), 2),
      "diffAbs" => round($this->getDiffAbs(), 2),
    ];
  }

  private function getLatestStockDate() {
    return array_reduce(
      $this->stocks,
      fn($latestDateTime, $stock) => ($latestDateTime || $latestDateTime > $stock->getDate() ? $latestDateTime : $stock->getDate())
    );
  }

  private function stocksToArray() {
    return array_reduce($this->stocks, function ($arr, $stock) {
      $arr[$stock->getId()] = $stock->toArray();
      return $arr;
    }, []);
  }

  private function getStocksWithCount() {
    return array_filter(
      $this->stocks,
      fn($stock) => !$stock->isWatchlist()
    );
  }

  private function getValue() {
    return array_reduce(
      $this->getStocksWithCount(),
      fn($addedValue, $stock) => $addedValue + $stock->getValue()
    );
  }

  private function getDiffAbs() {
    return array_reduce(
      $this->getStocksWithCount(),
      fn($addedDiffAbs, $stock) => $addedDiffAbs + $stock->getDiffAbs()
    );
  }
}