<?php

class ComdirectDepotLoader{
	public function __construct() {
	}

	public function load($depotKey) {
		$depot = new ComdirectDepot($depotKey);

		$depotHtml = $this->getContentFromUrl($depot->getUrl());

		if ($depotHtml !== null){
			$depotHtml = $this->replaceStringsInContent($depotHtml);
		
			$currentTotalValue = $this->getCurrentTotalValue($depotHtml);
			if ($currentTotalValue) {
				$depot->setTitle($this->getTitle($depotHtml));
				$depot->setTotalValue($currentTotalValue);
				$depot->setBuyTotalValue($this->getBuyTotalValue($depotHtml));
				$depot->setStocks($this->getStocks($depotHtml));
				$depot->setDiffererenceAbsolute($this->getDiffererenceAbsolute($depotHtml));
				$depot->setDifferenceAbsoluteComparedToYesterday($this->getDifferenceAbsoluteComparedToYesterday($depotHtml));
				$depot->setCurrency($this->getCurrency($depotHtml));
			}
		} else {
			die("loading failed");
		}
		
		$depot->loadingFinished();

		return $depot;
	}

	private function getTitle($depotHtml) {
		$title = "Depot";
		if (preg_match('/<h1>(.+)<\/h1>/s', $depotHtml, $match)) {
			$title = $match[1];
		}
	
		return $title;
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


	private function getDiffererenceAbsolute($depotHtml) {
		$totalDifference = 0;
		if (preg_match('/Diff\. zum Kauf\:.*?\<b.*?\>\s*(.*?)\s*\<\/b\>/s', $depotHtml, $match)) {
			$totalDifference = $this->toNumber($match[1]);
		}
	
		return $totalDifference;
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
				$stocks[] = $stock;
			}
		}

		usort($stocks, array("ComdirectStock", "compareByPercentageAbsolute"));

		return $stocks;
	}


	private function removeHtml($html) {
		$html = trim($html);
		$html = strip_tags($html);
		return $html;
	}

	private function arrayFilterNotEmpty($content) {
		$content = trim($content);
		return (!in_array($content, array("", "Notizen", "Realtime")));
	}

	private function mapHtmlToStock($html) {
		$data = $this->getCreateCleanedUpArray($html);
		// var_export($data);

		$stock = new ComdirectStock();

		$stock->setCount($this->toNumber($data[0]));
		
		$stock->setUrl($data[1]);
		$stock->setName($this->parseStockName($data[2]));

		$stock->setWKN($data[3]);
		$stock->setType($data[4]);
		$stock->setCurrency($data[5]);

		$stock->setPrice($this->toNumber($data[6]));
		$stock->setDifferenceAbsolutePerStock($this->toNumber($data[7]));
		$stock->setDifferencePercentage($this->toNumber($data[8]));

		$stock->setTotalPrice($this->toNumber($data[9]));
		$stock->setTotalDifferenceAbsolute($this->toNumber($data[10]));
		$stock->setTotalDifferencePercentage($this->toNumber($data[11]));
		$stock->setDate(DateTime::createFromFormat('d.m.y H:i:s', $data[12] . " " . $data[13]));

		$stock->setMarket($data[14]);
		$stock->setBuyPrice($this->toNumber($data[15]));
		$stock->setBuyDate($data[16]);
		$stock->setTotalBuyPrice($this->toNumber($data[17]));
		
		// $output[$i]['DIFFABSTODAY'] = $output[$i]['COUNT'] * $output[$i]['DIFFABS'];
		
		return $stock;
	}

	private function parseStockName($name){
		// add spaces for the replacement
		$name = " " . $name . " ";

		// replace special chars
		$name = str_replace("&#8203;", "", $name);	

		// cut away crap in names (starting from things like AG to the end) 
		$name = preg_replace("/(\ ag\ |Namens\-Aktien\ O\.N\.|\ Oyj|\ Vz|plc|inc\.|\ kgaa\ |Reg\.|Fund\ |\ corp|\ Com|\,|act\.|reg\.|\ \-\ LC|\ \-\ Ld|inhaber|\/|\ kgag\ |\ se\ |\ GmbH|\ co\ |\ cp\ |co\.|\ \-\ P\ |\ \-\ A|\ A\ |\'A\').*$/i", "", $name);
		// make first letter of all words (text with leading space) big if only in big or only in small letters - so don't do with eg: ProSiebenMedia AG 
		$name = preg_replace("/(\ ([A-Z]+|[a-z]+))/e", "ucwords(strtolower('\\1'))", $name);
		
		return trim($name);
	}


	private function getCreateCleanedUpArray($html){
		$data = explode("\n", $html);
		$data = array_map(array($this, "removeHtml"), $data);
		$data = array_filter($data, array($this, "arrayFilterNotEmpty"));
		$data = array_values($data);
		return $data;
	}

	private function getContentFromUrl ($url) {
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
		$content = curl_exec($ch);
		curl_close($ch);
		return $content;
	}

	private function replaceStringsInContent($dataStr) {
		$dataStr = 	preg_replace(	// replace certain strings
							array('/<a href="\/inf\/ewf\/redirect(.*?)">/',				"/\&nbsp\;/", 	"/ %/", "/\s*\>/", "/\-\-/"),
							array("http://www.comdirect.de/inf/ewf/redirect$1\n", 	"", 			"%",	">",   "0"), 
							$dataStr		// cut off useless end and beginning of file and combine to one string																			
						);
		return $dataStr;
	}

	private function toNumber ($number) {
		// elimate all strange values at the end (sometime numbers come as "4.123,3...")
		$number = preg_replace('/\D+$/', '', $number);
		
		// first transform german number format to english
		if (substr_count($number, '.') <= 1) {
			$number = str_replace ('.', '', $number);
		}
		$number = strtr($number , array(','=>'.', '%'=>''));
		if (strval($number) == strval(floatval ($number))) {
			$number = floatval ($number);
		}

		return $number;
	}
}
