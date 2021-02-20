<?php

include_once "vendor/FileCache.php";
include_once "Peerfolio.php";
include_once "Stock.php";
include_once "StockInfo.php";

class ComdirectDepotLoader{
  const COMDIRECT_FRIENDS_URL = "https://www.comdirect.de/inf/musterdepot/pmd/freunde.html?SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO&SORTDIR=ASCENDING&portfolio_key=";

  private $cache;
  private $depotKey;

  public function __construct($cache) {
    $this->cache = $cache;
  }

  // includes saving - ugly side effect, but that's should just be the default
  public function load($depotKey) {
    $depot = $this->loadCachedWithoutSaving($depotKey);
    $this->saveDepotDetails($depot);
    return $depot;
  }

  // and sometimes load without saving
  public function loadCachedWithoutSaving($depotKey) {
    $this->depotKey = $depotKey;
    $depot = new Peerfolio($depotKey);

    $depotHtml = @file_get_contents(self::COMDIRECT_FRIENDS_URL . $depotKey); 
    if ($depotHtml !== null){
      $depotHtml = $this->replaceStringsInContent($depotHtml);
      $depot->setTitle($this->parseTitle($depotHtml))
            ->setStocks($this->parseStocks($depotHtml));
    }
    
    return $depot;
  }

  private function parseTitle($depotHtml) {
    $title = null;
    if (preg_match('/<h1>\s*Musterdepot\:\s*\-*(.*?)<\/h1>/si', $depotHtml, $match)) {
      $title = trim($match[1]);
      if ($title == "0") {
        $title = null;
      }
    }
  
    return $title;
  }

  private function parseStocks($depotHtml) {
    $stocks = array();
  
    $stocksHtml = "";
    if (preg_match("/\<\/thead\>\s*\<tbody\>(.+)\<\/tbody\>/s", $depotHtml, $match)) {
      $stocksHtml = $match[1];
    }

    if (preg_match_all('/<tr(.+?)<\/tr>/s', $stocksHtml, $match)) {
      foreach ($match[0] as $stockHtml) {
        $stock = $this->mapHtmlToStock($stockHtml);
        $stock = $this->addAdditionalAttributes($stock);
        $stocks[] = $stock;
      }
    }

    return $stocks;
  }

  private function addAdditionalAttributes($stock) {
    $stockInfo = new StockInfo($this->cache, $stock->getId());
    $attributes = $stockInfo->getAttributes();

    if (isset($attributes["symbol"])) {
      $stock->setSymbol($attributes["symbol"]);
    }
    if (isset($attributes["isin"])) {
      $stock->setIsin($attributes["isin"]);
    }
    
    return $stock;
  }

  private function removeHtml($html) {
    $html = trim($html);  
    $html = strip_tags($html);
    return $html;
  }

  private function arrayFilterNotEmpty($content) {
    $content = trim($content);
    return (!in_array($content, array("", "&nbsp;", "Realtime")));
  }

  private function mapHtmlToStock($html) {
    $data = $this->getCreateCleanedUpArray($html);

    $stock = new Stock();
    
    $buyValue = $this->toNumber($data[18]);
    $name = $this->parseStockName($data[2]);

    $stock  // ->setUrl($data[1])
        ->setId($this->getIdFromUrl($data[1]))
        ->setName($name)
        // if count was defined but no value given
        ->setCount($buyValue ? $this->toNumber($data[0]) : 0)
        ->setNote($data[3])
        ->setWKN($data[4])
        ->setType($data[5])
        ->setPrice($this->toNumber($data[7]))
        ->setPriceDiffAbs($this->toNumber($data[8]))
        // ->setDifferencePercentage($this->toNumber($data[9]))
        ->setValue($this->toNumber($data[10]))
        ->setDate(DateTime::createFromFormat('d.m.y H:i:s', $data[13] . " " . $data[14], new DateTimeZone('Europe/Berlin')))
        ->setMarket($data[15])
        ->setBuyPrice($this->toNumber($data[16]))
        ->setBuyDate(DateTime::createFromFormat('d.m.y', $data[17], new DateTimeZone('Europe/Berlin')))
        ->setBuyValue($buyValue)
        ->setLimitTop($this->toNumber($data[19]))
        ->setLimitBottom($this->toNumber($data[20]));
    
    // some fixes
    $standardTypes = ["Currency", "Crypto", "Commodity", "Index"];
    if (in_array($data[5], $standardTypes)) {  // type
      $stock->setName("*" . $name);
    }

    if ($data[5] != "Index") {  // type
      $stock->setCurrency(preg_replace("/\W*/i", "", $data[6]));
    }

    if ($data[15] == "BITFINEX") {  // market
      $stock->setType("Crypto");
    }
  
    return $stock;
  }

  private function parseStockName($name){
    // add spaces for the replacement
    $name = " " . $name . " ";

    // remove token
    $name = preg_replace("/(\ AB\ O\.E\.\ \d*|\(.*\)|Ucits\ Etf\ |\&\#8203\;)*/i", "", $name);

    // cut away crap in names (starting from things like AG to the end) 
    $name = preg_replace("/(\ ag\ |Namens\-Aktien\ O\.N\.|\ Oyj|\ Vz|plc|inc\.|\ kgaa\ |Reg\.|Fund\ |\ corp|\ Com|\,|act\.|reg\.|1C|N\.v\.|\ \-\ LC|\ \-\ Ld|inhaber|Pref\.\ ADR|\ kgag\ |INH\ O\.*N\.*|\ se\ |\ SP\.| sk|B\.v\.|Eo|\ EO\-\,|\ Cl\.|\ Tech|\ Dr\ |\ *\-*\ EUR\ ACC|USD\ DIS|USD\ ACC|Registered\ Shares|o\.N\.|\ Group|\ Holding|GmbH|\ co\ |\ cp\ |co\.|\ \&\#39\;|\ \-\ .\ |\ A\ |\'A\').*$/i", "", $name);

    // make first letter of all words (text with leading space) big if only in big or only in small letters - so don't do with eg: ProSiebenMedia AG
    $name = preg_replace("/[\- ]+$/i", "", $name);
    $name = ucwords(strtolower(trim($name)));
    $name = htmlspecialchars_decode($name);
    
    $name = preg_replace("/\ Us\ /i", " US ", $name);
    $name = preg_replace("/S\&p/i", "S&P", $name);
    $name = preg_replace("/Msci/i", "MSCI", $name);

    $name = preg_replace("/VanEck Vectors /i", "ETF ", $name);
    $name = preg_replace("/Xtrackers /i", "ETF ", $name);
    $name = preg_replace("/Ishares /i", "ETF ", $name);
    $name = preg_replace("/Lyxor /i", "ETF ", $name);
    $name = preg_replace("/Amundi\ (ETF)*(Index)*( )*(Solutions)*/i", "ETF ", $name);
    $name = preg_replace("/(.*) Indikation/", "$1", $name);
    $name = preg_replace("/Euro\ \/\ Euro/", "Euro", $name);
  
    return $name;
  }

  private function getIdFromUrl($url){
    $id = null;
    if (preg_match('/ID\_NOTATION\=(.*?)\&amp\;/s', $url, $match)) {
      $id = $match[1];
    }
    return $id;
  }

  private function getCreateCleanedUpArray($html){
    // Find Notiz before anything else
    $notiz = "";
    if (preg_match('/\<div\ class\=\"tooltipLayerContent\"\>(.*?)\<\/div\>/is', $html, $matches)) {
      $notiz = trim($matches[1]);
      $html = str_replace($matches[0], "", $html);
    }
    
    $data = explode("\n", $html);

    $data = array_map(array($this, "removeHtml"), $data);
    $data = array_filter($data, array($this, "arrayFilterNotEmpty"));
    $data = array_values($data);

    $data[3] = $notiz;

    // change from "Fond" to "ETF", if name contains "ETF"
    if (preg_match("/\ ETF\ /i", $data[2])) {
      $data[5] = "ETF";
    }
    $data[5] = str_replace(["Rohstoffe", "Edelmetalle", "Währung", "Zertifikat", "Aktie"], ["Commodity", "Commodity", "Currency", "Certificat", "Stock"], $data[5]);

    return $data;
  }

  private function replaceStringsInContent($dataStr) {
    $dataStr =  preg_replace( // replace certain strings
      array('/<a href="\/inf\/ewf\/redirect(.*?)">/', "/\&nbsp\;/", "/ %/", "/\s*\>/", "/\-\-/"),
      array("http://www.comdirect.de/inf/ewf/redirect$1\n", "", "%", ">", "0"), 
      $dataStr    // cut off useless end and beginning of file and combine to one string
    );
    return $dataStr;
  }

  private function toNumber ($number) {
    // elimate all strange values at the end (sometime numbers come as "4.123,3...")
    $number = preg_replace('/\D+$/', '', $number);
    
    // first transform german number format to english
    $number = str_replace ('.', '', $number);
    $number = strtr($number , array(','=>'.', '%'=>''));
    $number = floatval ($number);
  
    return $number;
  }

  private function saveDepotDetails(Peerfolio $depot){
    if ($depot->isValid()) {
      $this->cache->put("rawdepot", $this->depotKey . "_" . date("c"), $depot->toArray());
    }
  }   
}
