<?php


class ComdirectDepotHelper {
	// https://developers.google.com/chart/image/docs/post_requests?hl=de-DE


	public function getDepotDevelopmentHtml($depot) {
		if (!$depot->getStockCount()) {
			return "";
		}
	
		$html = "";

		$depot->sortByTotalValue();

		// https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/
		$colors = array(
						"333333", 	// gray (default)
						"0082c8",	// blue
						"911eb4",	// purple
						"e6194b",	// red
						"f58231",	// orange
						"fabebe",	// light pink
						"ffe119",	// yellow
						"aaffc3",	// mind    (3cb44b = green)
						"46f0f0",	// cyan	
						"808000", 	// olive
					);


		$ids = array();
		// more then 10 is not allowed by codirect
		$stocks = array_slice(array_reverse($depot->getStocks()), 0, 10);
		
		$totalValue = 0;

		foreach ($stocks as $i => $stock) {
			$html .= "<span style='color: white; white-space: nowrap; background-color: #" . $colors[$i] . "'> " . $stock->getName() . " </span> &#160;";
			$ids[] = $stock->getId();
			$totalValue += $stock->getTotalPrice();
		}

		// example: https://charts.comdirect.de/charts/rebrush/design_big.chart?WIDTH=645&HEIGHT=655&TYPE=CONNECTLINE&TIME_SPAN=6M&AXIS_SCALE=lin&DATA_SCALE=rel&LNOTATIONS=160043+9386187+16093838+176173+163291185+149533891+119194090+194281+37324151+112645451&LCOLORS=5F696E+5F696E+5F696E+5F696E+5F696E+5F696E+5F696E+5F696E+5F696E+5F696E&AVGTYPE=simple&HCMASK=3&SHOWHL=1
		
		$html = 'Top10 Stocks (' . round($totalValue / $depot->getTotalValue() * 100) . '% of total)<br>' . 
				
				"<script>
					$().ready(function() { 
						$('.imgwrapper img').click(function() {
							var src = $(this).attr('src')
										.replace('10D', '6XXX')
										.replace('5Y', '10D')
										.replace('6M', '5Y')
										.replace('6XXX', '6M');
							$(this).attr('src', src);
						});
					});
				</script>" . 

				'<a class="imgwrapper"><img src="' . "https://charts.comdirect.de/charts/rebrush/design_big.chart?TYPE=CONNECTLINE&TIME_SPAN=10D&AXIS_SCALE=log&DATA_SCALE=rel&LNOTATIONS=" . implode($ids, "+") . "&LCOLORS=" . implode($colors, "+") . "&AVGTYPE=simple&HCMASK=3&SHOWHL=0" . '" /></a><br>' . $html;

		return "<div style='display: block; float: none; clear: both;'>" . $html . "</div>";
	}


	public function getStockGuVImageUrl($depot) {
		if (!$depot->getStockCount()) {
			return "";
		}

		$names = array();
		$labels = array();
		$dataSeries = array(array(), array(),);
		$colorSeries = array(array(), array(),);
		$dataSeriesMax = 0;
		$positiveStockCount = 0;
		
		foreach ($depot->getStocks() as $i => $stock) {
			$name = str_replace("&#38;", "", $stock->getName());
			$name = substr($name, 0, 25);
			array_unshift($names, $name);
			
			if ($stock->getTotalDifferenceAbsolute() > 0) {
				$positiveStockCount++;
			}
			
			$dataSeries[0][] = $stock->getTotalBuyPrice() + ($stock->getTotalDifferenceAbsolute() < 0 ? $stock->getTotalDifferenceAbsolute() : 0);
			$dataSeries[1][] = abs($stock->getTotalDifferenceAbsolute());
			$dataSeriesMax = max($dataSeriesMax, $stock->getTotalBuyPrice(), $stock->getTotalPrice());
			
			$pro = $stock->getTotalDifferencePercentage();
			$colorSeries[1][] = ($pro < -1 ? "FFDDDD" : ($pro > 1 ? "006600" : "777777"));
			
			$labels[] = "t " . (!round($pro) ? 0 : round($pro)) . "%," . 
								($pro < -1 ? "FF0000" : ($pro > 1 ? "008800" : "777777")) . "," . 
								($pro < 0 ? 0 : 1) . ",$i,10";
		}
		
		$potenz = strlen(floor($dataSeriesMax)) - 1;
		$firstDigit = substr($dataSeriesMax, 0, 1) + 1;
		if ($firstDigit <= "2") {
			$firstDigit *= 10;
			$potenz -= 1;
		}
		$steps = max(1, pow(10, $potenz));
		$dataSeriesMax = $firstDigit * $steps;
		
		return "https://chart.googleapis.com/chart?" . 
					"chs=500x" . min(600, ($depot->getStockCount() * 28 + 35)) . 
					"&cht=bhs" . 
					"&chd=t:" . join(",", $dataSeries[0]) . "|" . join(",", $dataSeries[1]) . 
					"&chco=555555," . join("|", $colorSeries[1]) . 
					"&chxt=x,x,y&chxp=1,50&chxr=0,0," . $firstDigit . "," . 1 . 
					"&chds=0," . $dataSeriesMax . 
					"&chxl=1:|in " . $steps . " Euro|2:|" . join("|", $names) . 
					"&chg=" . (floor(100000 / ($dataSeriesMax / $steps)) / 1000) . ",100,10,5,0," . ($positiveStockCount / $depot->getStockCount() * 100) . 
					"&chm=" . join("|", $labels)
					;
	}


	public function getStockCircleImageUrl($depot) {
		if (!$depot->getStockCount()) {
			return "";
		}

		$names = array();
		$dataSeries = array(array(), array(),);
		$colorSeries = array(array(), array(),);
		$maxNegativePro = -0.0001;
		$maxPositivePro = 0.0001;
		
		foreach ($depot->getStocks() as $i => $stock) {
			$pro = $stock->getTotalDifferencePercentage();
			if ($pro < $maxNegativePro) {
				$maxNegativePro = $pro;
			}
			if ($pro > $maxPositivePro) {
				$maxPositivePro = $pro;
			}
		}
		
		foreach ($depot->getStocks() as $i => $stock) {
			$betrag = $stock->getTotalDifferencePercentage();
			$gesamtAnteil = ($stock->getTotalPrice() ? round($stock->getTotalPrice() / $depot->getTotalValue(), 4) : 0);
			
			$name = str_replace("&#38;", "", $stock->getName());
			$name = substr($name, 0, 25);
			$names[] = $name . 
						" (" . 
						($gesamtAnteil ? round($gesamtAnteil * 100) . "% Anteil, " : "") . 
						(!round($betrag) ? "%C2%B10" : (round($betrag) > 0 ? "%2B" : "") . round($betrag)) . "%" .
						")";
			
			$dataSeries[0][] = ($stock->getTotalPrice() ? $gesamtAnteil : 1 / $depot->getStockCount());
			
			$relativeProzent = $betrag / ($betrag > 0 ? $maxPositivePro : $maxNegativePro);
			$color = round(230 - 230 * $relativeProzent);
			$specialColor = round(250 - 100 * $relativeProzent);
			$colors = array($color, $color, $color);
			if ($betrag < 0) {
				$colors[0] = $specialColor;
			} else if ($betrag > 0) {
				$colors[1] = $specialColor;
			}
			$colorSeries[0][] = sprintf("%02X%02X%02X", $colors[0], $colors[1], $colors[2]);
		}
		
		return "https://chart.googleapis.com/chart?cht=p&chs=800x350" . 
					"&chp=" . (-6.28 / 4) . 
					"&chd=t:" . join(",", $dataSeries[0]) . 
					"&chl=" . join("|", $names) . 
					"&chco=" . join("|", $colorSeries[0]);
	}


	public function getQRCodeImageUrl($portfolioKey) {
		return "https://chart.googleapis.com/chart?chs=400x400&cht=qr&choe=UTF-8&chl=" .  urlencode ("http://apps.mathiasnitzsche.de/comdirect/depot.php?portfolio_key=" . $portfolioKey);
	}


	public function getCurrencySymbol($currencyStrings) {
		$currencySymbol = "?";
		
		if ($currencyStrings == "EUR") {
			$currencySymbol = "&euro;";
		} elseif ($currencyStrings == "USD") {
			$currencySymbol = "$";
		}

		return $currencySymbol;
	}

	public function getColorForNumber ($numberBetweenMinusAndPlus100) {
		$minColor = 80;
		$maxColor = 230;
		$number = $numberBetweenMinusAndPlus100  * ($maxColor - $minColor) / 100;

		$red = round(min($maxColor, $minColor - ($number < 0 ? $number : 0)));
		$green = round(min($maxColor, $minColor + ($number > 0 ? $number : 0)));

		return "rgb($red, $green, $minColor)";
	}
}