<?php

require "vendor/FileCache.php";
include_once "ComdirectDepot.php";
include_once "ComdirectStock.php";
// include_once "ComdirectDepotHelper.php";

class ComdirectDepotLoader{
	const COMDIRECT_FRIENDS_URL = "https://www.comdirect.de/inf/musterdepot/pmd/freunde.html?SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO&SORTDIR=ASCENDING&portfolio_key=";

	private $cache;

	public function __construct($cache) {
		$this->cache = $cache;
	}

	public function loadCachedWithoutSaving($depotKey) {
		return $this->loadportfolio($depotKey, true);
	}
	public function load($depotKey) {
		return $this->loadportfolio($depotKey, false);
	}

	private function loadportfolio($depotKey, $cached = true) {
		$shareDepotKey = null;

		// load with substring of portfolio key
		if (substr($depotKey, 0, 1) === "s") {
			$shareDepotKey = $depotKey;
			$cacheKeys = $this->cache->getKeys("/^history\_[0-9]+/");
			$keyPart = substr($depotKey, 1);

			foreach ($cacheKeys as $cacheKey) {
				if (strpos($cacheKey, $keyPart)) {
					$depotKey = preg_replace("/^history\_/", "", $cacheKey);
				}
			}
		}
		
		$depot = new ComdirectDepot($depotKey);

		try {
			$url = self::COMDIRECT_FRIENDS_URL . $depotKey;
			$depotHtml = $this->getContentFromUrl($url, 60);

			if ($depotHtml !== null){
				$depotHtml = $this->replaceStringsInContent($depotHtml);
			
				$currentTotalValue = $this->getCurrentTotalValue($depotHtml);
				if ($currentTotalValue) {
					$depot->setTitle($this->getTitle($depotHtml));
				//	$depot->setTotalValue($currentTotalValue);
				// 	$depot->setBuyTotalValue($this->getBuyTotalValue($depotHtml));
					$depot->setStocks($this->getStocks($depotHtml));
					
					$depot->setDifferenceAbsoluteComparedToYesterday($this->getDifferenceAbsoluteComparedToYesterday($depotHtml));
					$depot->setCurrency($this->getCurrency($depotHtml));
	
					if (!$shareDepotKey && !$cached && $depot->isValid()) {
						$this->saveDepotTotals($depot);
					}
				
					if ($shareDepotKey) {
						$depot->makeSharable($shareDepotKey);
					}
				}
			}
		} catch (Exception $e) {
		    // ignore
		}
		// else {
		//	die("loading failed");
		// }
		
		$depot->loadingFinished();

		return $depot;
	}

	private function getTitle($depotHtml) {
		$title = "Depot";
		if (preg_match('/<h1>(.+)<\/h1>/s', $depotHtml, $match)) {
			$title = str_replace("Musterdepot:", "", $match[1]);
		}
	
		return trim($title);
	}

	private function getBuyTotalValue($depotHtml) {
		$totalValue = 0;
		if (preg_match('/Kaufwert\:.*?title\=\"(.*?)"/s', $depotHtml, $match)) {
			$totalValue = $this->toNumber($match[1]);
		}
		
		return $totalValue;
	}


	private function getStockId($depotHtml) {
		$id = "";
		if (preg_match('/ID\_NOTATION\=(:*?)\&amp\;/s', $depotHtml, $match)) {
			$id = $match[1];
		}
	
		return $id;
	}


	private function getCurrentTotalValue($depotHtml) {
		$totalValue = 0;
		if (preg_match('/Depotwert\:.*?\<b.*?\>\s*(.*?)\s*\<\/b\>/s', $depotHtml, $match)) {
			$totalValue = $this->toNumber($match[1]);
		}
	
		return $totalValue;
	}

	private function getCurrency($depotHtml) {
		$currency = 0;
		if (preg_match('/Depotwert\:.*?\<b.*?\>.*?([A-Z]+).*?\<\/b\>/s', $depotHtml, $match)) {
			$currency = $match[1];
		}
	
		return $currency;
	}

	private function getDifferenceAbsoluteComparedToYesterday($depotHtml) {
		$totalDifferenceToYesterday = 0;
		if (preg_match('/Diff\. zum Vortag\:.*?\<b.*?\>\s*(.*?)\s*\<\/b\>/s', $depotHtml, $match)) {
			$totalDifferenceToYesterday = $this->toNumber($match[1]);
		}
	
		return $totalDifferenceToYesterday;
	}

	public function getStocks($depotHtml) {
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

		usort($stocks, array("ComdirectStock", "compareByDifferenceAbsolute"));
	
		return $stocks;
	}

	private function addAdditionalAttributes($stock) {
		$additionalAttr = $this->getAdditionalAttributes($stock);

		if (isset($additionalAttr["symbol"])) {
			$stock->setSymbol($additionalAttr["symbol"]);
		}
		if (isset($additionalAttr["isin"])) {
			$stock->setIsin($additionalAttr["isin"]);
		}
		if (isset($additionalAttr["totalcount"])) {
			$stock->setTotalCount($additionalAttr["totalcount"]);
		}
		
	 	return $stock;
	}

	private function getAdditionalAttributes($stock) {
		$additionalAttrKey = "stock_info_" . $stock->getId();
		$additionalAttr = $this->cache->get($additionalAttrKey);
		if (!$additionalAttr) {
			$additionalAttr = [
				"comdirect_id" => $stock->getId(),
				"wkn" => $stock->getWkn(),
				"name" => $stock->getName(),
			];

			/*
			if ($stockHtml) {
				if (preg_match('/' .
						'\<td.*?\>Symbol\<\/td\>.*?' . 
						'\<td.*?\>(.*?)\<\/td\>' . 
					'/s', $stockHtml, $match)) {
					$symbol = trim($match[1]);
					if (strlen($symbol) == 3) {
						$symbol = "ETR:" . $symbol;
					} 
					$additionalAttr["symbol"] = $symbol;
				}
			}
			*/

			$stockHtml = $this->getContentFromUrl("https://www.comdirect.de/inf/aktien/detail/uebersicht.html?ID_NOTATION=" . $stock->getId());
			if ($stockHtml) {
				if (preg_match('/' .
						'\<td.*?\>Symbol\<\/td\>.*?' . 
						'\<td.*?\>\-*(\w*)\<\/td\>' . 
					'/s', $stockHtml, $match)) {
					$additionalAttr["symbol"] = trim($match[1]);
				}
				if (preg_match('/' .
						'\<td.*?\>ISIN\<\/td\>.*?' . 
						'\<td.*?\>\-*(.*?)\<\/td\>' . 
					'/s', $stockHtml, $match)) {
					$additionalAttr["isin"] = trim($match[1]);
				}

				if (preg_match('/' .
						'\<td.*?\>Aktienanzahl\<\/td\>.*?' . 
						'\<td\>.*?(\d[\d\,\.]+).*?\<\/td\>' . 
					'/s', $stockHtml, $match)) {
					$count = $match[1];
					$count = str_replace(".", "", $count);
					$count = str_replace(",", ".", $count);
					$count = intval($count) ;
					if ($count) {
						$additionalAttr["totalcount"] = $count * 1000000;
					}
				}
			}
		
			$this->cache->put($additionalAttrKey, $additionalAttr);
		}
		
		
	 	return $additionalAttr;
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
		// var_export($data);

		$stock = new ComdirectStock();
		$stock->setCount($this->toNumber($data[0]));
		
		$stock->setUrl($data[1]);
		$id = $this->getIdFromUrl($data[1]);
		$stock->setId($id);
		$stock->setName($this->parseStockName($data[2]));

		$stock->setNote($data[3]);

		$stock->setWKN($data[4]);
		$stock->setType($data[5]);
		$standardTypes = array("Currency", "Commodity", "Index");
		if (in_array($stock->getType(), $standardTypes)) {
			$stock->setName("*" . $stock->getName());
		}

		if ($stock->getType() != "Index") {
			$stock->setCurrency($data[6]);
		}

		$stock->setPrice($this->toNumber($data[7]));
		$stock->setDifferenceAbsolutePerStock($this->toNumber($data[8]));
		$stock->setDifferencePercentage($this->toNumber($data[9]));

		$stock->setTotalValue($this->toNumber($data[10]));
		// $stock->setTotalDifferenceAbsolute($this->toNumber($data[10]));
		// $stock->setTotalDifferencePercentage($this->toNumber($data[11]));
		$stock->setDate(DateTime::createFromFormat('d.m.y H:i:s', $data[13] . " " . $data[14], new DateTimeZone('Europe/Berlin')));

		$stock->setMarket($data[15]);
		$stock->setBuyPrice($this->toNumber($data[16]));
		$stock->setBuyDate(DateTime::createFromFormat('d.m.y', $data[17], new DateTimeZone('Europe/Berlin')));
		$stock->setTotalBuyValue($this->toNumber($data[18]));

		// $output[$i]['DIFFABSTODAY'] = $output[$i]['COUNT'] * $output[$i]['DIFFABS'];
		
		return $stock;
	}

	private function parseStockName($name){
		// add spaces for the replacement
		$name = " " . $name . " ";

		// cut away crap in names (starting from things like AG to the end) 
		// remove token
		$name = preg_replace("/(\ AB\ O\.E\.\ \d*|\(.*\)|\ \- |Ucits\ Etf\ |\&\#8203\;)*/i", "", $name);

		// remove token to end
		$name = preg_replace("/(\ ag\ |Namens\-Aktien\ O\.N\.|\ Oyj|\ Vz|plc|inc\.|\ kgaa\ |Reg\.|Fund\ |\ corp|\ Com|\,|act\.|reg\.| N\.v\.|\ \-\ LC|\ \-\ Ld|inhaber|Pref\.\ ADR|\ kgag\ |\ se\ |\ SP\.|\ EO\-\,|\ Cl\.|\ Tech|\ ADR|\ \-\ EUR\ ACC|USD\ ACC|Registered\ Shares|o\.N\.|\ Group|\ Holding|GmbH|\ co\ |\ cp\ |co\.|\ \-\ P\ |\ \&\#39\;|\ \-\ A\ |\ A\ |\'A\').*$/i", "", $name);
		
		// make first letter of all words (text with leading space) big if only in big or only in small letters - so don't do with eg: ProSiebenMedia AG
		$name = ucwords(strtolower(trim($name)));
		$name = htmlspecialchars_decode($name);
		
		$name = preg_replace("/\ Us\ /i", " US ", $name);
		$name = preg_replace("/S\&p/i", "S&P", $name);
		$name = preg_replace("/Msci/i", "MSCI", $name);

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

	private function getContentFromUrl ($url, $maxCacheAgeSeconds = 0) {
		$cacheKey = "url_content_" . md5($url);

		$content = $this->cache->get($cacheKey);
		if (!$content) {
			$content = @file_get_contents($url);
			
			/*
			$ch = curl_init();
			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
			curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
			$content = curl_exec($ch);
			curl_close($ch);
			*/

			if ($maxCacheAgeSeconds) {
				$this->cache->put($cacheKey, $content, $maxCacheAgeSeconds);
			}
		}

		return $content;
	}

	private function replaceStringsInContent($dataStr) {
		$dataStr = 	preg_replace(	// replace certain strings
			array('/<a href="\/inf\/ewf\/redirect(.*?)">/',	"/\&nbsp\;/", "/ %/", "/\s*\>/", "/\-\-/"),
			array("http://www.comdirect.de/inf/ewf/redirect$1\n", "", "%", ">", "0"), 
			$dataStr		// cut off useless end and beginning of file and combine to one string
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

	private function saveDepotTotals(ComdirectDepot $depot){
		$cacheKey = "history_" . $depot->getDepotKey();

		$history = $this->cache->get($cacheKey);
		if (!$history) {
			$history = [];
		}
		$midnightString = $depot->getNewestStockTimestamp()->format("Y-m-d") 
							. "T00:00:00+00:00";
				
		$stocks = [];
		foreach ($depot->getStocksWithCount() as $stock) {
			$stocks[] = [
				"id" => $stock->getId(),
				// "name" => $stock->getName(),
				"count" => $stock->getCount(),
				"buyPrice" => $stock->getBuyPrice(),
				"value" => $stock->getTotalValue(),
				"price" => $stock->getPrice(),
			];
		}

		$history[$midnightString] = [
			"value" => $depot->getTotalValue(),
			"profit" => $depot->getTotalProfit(),
			"lost" => $depot->getTotalLost(),
			"stocks" => $stocks,
		];

		$this->cache->put($cacheKey, $history);
		
		if (count($history) > 1) {
			$this->cache->put("save_" . $depot->getNewestStockTimestamp()->format("Y-m-d") . "_" . $cacheKey, $history);
		}
	}
}
