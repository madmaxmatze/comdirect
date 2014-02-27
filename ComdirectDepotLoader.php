<?php

class ComdirectDepotLoader{
	private $startTime = 0;
	private $stopTime = 0;

	public function __construct() {
	}

	public function load($depotKey) {
		$depot = null;
		
		$this->startTime = microtime(true); 
		
		$depotKey = $this->parseDepotKey($depotKey);
		
		$depotUrl = ComdirectDepot::COMDIRECT_FRIENDS_URL . $depotKey;		
		$depotHtml = $this->getContentFromUrl($depotUrl);
		
		if ($depotHtml !== null){
			$depot = new ComdirectDepot($depotKey);
			$depotHtml = $this->replaceStringsInContent($depotHtml);
		
			$depot->setTitle($this->getTitle($depotHtml));
			$depot->setStocks($this->getStocks($depotHtml));
			$depot->setTotalValue($this->getCurrentTotalValue($depotHtml));
			$depot->setDiffererenceAbsolute($this->getDiffererenceAbsolute($depotHtml));
			$depot->setDifferenceAbsoluteComparedToYesterday($this->getDifferenceAbsoluteComparedToYesterday($depotHtml));
			$depot->setCurrency($this->getCurrency($depotHtml));
		}
		
		$this->stopTime = microtime(true); 	

		return $depot;
	}

	private function getTitle($depotHtml) {
		$title = "Depot";
		if (preg_match('/<h1>(.+)<\/h1>/s', $depotHtml, $match)) {
			$title = $match[1];
		}
	
		return $title;
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

	public function getLoadingDuration() {
		return sprintf ("%01.3f", ($this->stopTime - $this->startTime) / 1000000) . " sec";
	}

	public function getLoadingTime() {
		return $this->startTime - (15 * 60);
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

		usort($stocks, array("ComdirectStock", "compareByPercentageDifference"));

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
		$stock->setName($data[2]);

		$stock->setWKN($data[3]);
		$stock->setType($data[4]);
		$stock->setCurrency($data[5]);

		$stock->setPrice($this->toNumber($data[6]));
		$stock->setDifferenceAbsolute($this->toNumber($data[7]));
		$stock->setDifferencePercentage($this->toNumber($data[8]));

		$stock->setTotalPrice($this->toNumber($data[9]));
		$stock->setTotalDifferenceAbsolute($this->toNumber($data[10]));
		$stock->setTotalDifferencePercentage($this->toNumber($data[11]));
		$stock->setDate(DateTime::createFromFormat('d.m.y H:i:s', $data[12] . " " . $data[13]));

		$stock->setMarket($data[14]);
		$stock->setBuyPrice($this->toNumber($data[15]));
		$stock->setBuyDate($data[16]);
		$stock->setTotalBuyPrice($this->toNumber($data[17]));
									
		// var_export($stock);
		// $output[$i]['DIFFABSTODAY'] = $output[$i]['COUNT'] * $output[$i]['DIFFABS'];
		
		return $stock;
	}

	private function getCreateCleanedUpArray($html){
		$data = explode("\n", $html);
		$data = array_map(array($this, "removeHtml"), $data);
		$data = array_filter($data, array($this, "arrayFilterNotEmpty"));
		$data = array_values($data);
		return $data;
	}

	private function parseDepotKey($depotKey) {
		$depotKey = preg_replace("/\D*/", "", $depotKey);
		return $depotKey;
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
