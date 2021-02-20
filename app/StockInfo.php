<?php

class StockInfo{
  private $cache;
  private $id;

  private $attributes = null;

  public function __construct($cache, $id) {
    $this->cache = $cache;
    $this->id = $id;
    $this->loadAttributes();
  }

  public function getAttributes() {
    return $this->attributes;
  }

  private function loadAttributes() {
    $this->attributes = $this->cache->get("stockinfo", $this->id);
    if (!$this->attributes) {
      $this->attributes = [
        "loaded_at" => time(),
        "comdirect_id" => $this->id,
      ];

      $stockHtml = @file_get_contents("https://www.comdirect.de/inf/aktien/detail/uebersicht.html?ID_NOTATION=" . $this->id);

      if ($stockHtml) {
        // echo $stockHtml;
  
        if (preg_match('/' .
            '\<td.*?\>Symbol\<\/td\>.*?' . 
            '\<td.*?\>\-*(\w*)\<\/td\>' . 
          '/s', $stockHtml, $match)) {
          $this->attributes["symbol"] = trim($match[1]);
        }

        if (preg_match('/\<h1.+?>\s*(.+?)\s*\</ms', $stockHtml, $match)) {
          $this->attributes["name"] = trim($match[1]);
        }

        if (preg_match('/' .
            '\wkn\=([A-Z0-9]+)&isin\=([A-Z0-9]+)\&' . 
          '/s', $stockHtml, $match)) {
          $this->attributes["wkn"] = trim($match[1]);
          $this->attributes["isin"] = trim($match[2]);
        }  
      }
    
      $this->cache->put("stockinfo", $this->id, $this->attributes);
    }
  }
}
