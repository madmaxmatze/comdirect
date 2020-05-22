<?php

include_once "ComdirectDepotLoader.php";
include_once "ComdirectDepot.php";
include_once "ComdirectStock.php";
include_once "ComdirectDepotHelper.php";
include_once "vendor/FileCache.php";

$out = "";

$cache = new FileCache(__DIR__ . '/data/cache');

$portfolioKeyParam = (isset($_GET['portfolio_key']) && $_GET['portfolio_key'] ? $_GET['portfolio_key'] : null);

if (!$portfolioKeyParam){
	echo('Please provide a comdirect.de portfolio_key as explained <a href="https://nutzer.comdirect.de/cms/help/core0432_help.html" target="_blank" rel="nofollow">here</a>.');
	die();
}

$depotLoader = new ComdirectDepotLoader($cache);

$portfolioKeys = explode(",", trim($portfolioKeyParam));
foreach ($portfolioKeys as $portfolioKey) {
	$depotCacheKey = "depot" . $portfolioKey;
	
	$depot = $cache->get($depotCacheKey);
	if (!$depot) {
		$depot = $depotLoader->load($portfolioKey);
		// $cache->put($depotCacheKey, $depot, 60);
	}

	if ($depot && $depot->isValid()) {  			
		$out .= "<div class='menu'>≡</div>";
		$out .= "<table class='mmmdepot tablesorter focus-highlight' data-portfoliokey='" . $portfolioKeyParam . "' data-portfoliotitle='" . $depot->getTitle() . "'>" .
					"<thead>" .
					"<tr>".
						"<th></th>".
						// colspan=2 because of finanznachrichten link
						"<th class='alignleft stockname'>" . $depot->getTitle() . "</th>" .
						"<th>Kaufdatum</th>".
						"<th>Börse</th>".
						"<th>Kaufkurs</th>".
						"<th>Anzahl</th>".
						"<th>Kaufwert</th>".
				
						"<th>Kurs</th>".
						"<th>%</th>".
						"<th>Abs</th>".
						
						"<th>Wert</th>".
						"<th>%</th>".
						"<th class='sortcolumn headerSortUp'>Abs</th>".
					"</tr>" .
					"</thead>" .
				"<tbody>";
		
		$i = 0;

		$depotHelper = new ComdirectDepotHelper();

		foreach ($depot->getStocks() as $stock) {
			try {
				$stockClass = "isDataLive";
				if (!$stock->isDataFromToday()) {
					$stockClass = "isDataFromYesterday";
				} else if ($stock->getAgeOfDataInSeconds() > 2000) {
					$stockClass = "isDataOld";
				}
				
				$isFinanznachrichten = ($stock->getType() == "Aktie"); 
				$out .= "<tr
							data-wkn='" . $stock->getWkn() . "'
							data-symbol='" . $stock->getSymbol() . "'
							data-isin='" . $stock->getIsin() . "'
							data-type='" . $stock->getType() . "' 
							data-comdirectid='" . $stock->getId() . "'
							class='" . (["odd", "even"])[$i++ % 2] . " " . ($stock->getCount() ? "" : "watchlist") . "'
						>".
							"<td class='stockiterator'></td>".
							"<td class='stockname'>" . 
								"<a>" . $stock->getName() . "</a>".
							"</td>" .
							
							// Datum
							"<td class='stockdate'>" . ($stock->getCount() ? $stock->getBuyDate()->format("d/m/y") : "") . "</td>".
						
							// Börse
							"<td class='stockmarket'>" . $stock->getMarket() . "</td>".

							// Kaufpreis
							"<td class='stockbuyprice'>" . ($stock->getCount() ? number_format($stock->getBuyPrice(), 2, ',', '.') . "€" : "") . "</td>".

							"<td class='stockcount'>" . ($stock->getCount() ? ceil($stock->getCount()) : "") . "</td>".
							
							// Kaufgesamtwert
							"<td class='totalbuyprice'>" . ($stock->getCount() ? number_format($stock->getTotalBuyPrice(), 0, ',', '.') . "€" : "") . "</td>".


							// Aktueller Preis
							"<td class='stockprice " . ($stock->getAgeOfDataInSeconds() < 2000 ? "isDataLive1" : "") . "' title='" . $stock->getFormatedDate("Y/m/d H:i:s") . "'><span>" . ($stock->getPrice() < 1 && strlen($stock->getPrice()) > 4 ? str_replace('.', ',', $stock->getPrice()) : number_format($stock->getPrice(), 2, ',', '.')) . $stock->getCurrencySymbol() . "</span></td>".
							"<td class='stockpricediff " . $stockClass . "' style='color: " . $depotHelper->getColorForNumber($stock->getDifferencePercentage() * 100) . "'><span>" . number_format($stock->getDifferencePercentage(), 2, ',', '.') . "%</span></td>".
							"<td class='stockpricediffabs " . $stockClass . "' style='color: " . $depotHelper->getColorForNumber($stock->getDifferenceAbsolute() * 100) . "'><span>" . number_format($stock->getDifferenceAbsolute(), 0, ',', '.') . "€</span></td>".
					

							// Akt Gesamtwert
							"<td class='stocktotalvalue'>" . ($stock->getCount() ? number_format($stock->getTotalPrice(), 0, ',', '.') . "€" : "") . "</td>".
						
							// Gesamtprozent
							"<td class='stocktotaldiff' style='color: " . $depotHelper->getColorForNumber($stock->getTotalDifferenceAbsolute() / $depot->getTotalValue() * 10000) . "'>" . number_format($stock->getTotalDifferencePercentage(), 1, ',', '.') . "%</td>".

							// Gewinn
							"<td class='stocktotaldiffabs sortcolumn' style='color: " . $depotHelper->getColorForNumber($stock->getTotalDifferenceAbsolute() / $depot->getTotalValue() * 10000) . "'>" . number_format($stock->getTotalDifferenceAbsolute(), 0, ',', '.') . "€</td>".
						"</tr>";

			} catch (Exception $exception) {
		
			}
		}
		
		$currencySymbol = $depotHelper->getCurrencySymbol($depot->getCurrency());
		$out .= "</tbody>" . 
				"<tfoot>" .
					"<tr class='footer'>" . 
						"<th></th>" .
						"<th>" .
							($depot->getNewestStockTimestamp() ? $depot->getNewestStockTimestamp()->format("y/m/d - H:i") : "") .
					  	"</th>".
						
						"<th></th>" .
						"<th></th>" .
						"<th></th>" .
						"<th></th>" . 
						"<th>" . number_format($depot->getBuyTotalValue(), 0, ',', '.') . $currencySymbol . "</th>" .
						
						"<th></th>" .

						($depot->isTradingDay() ?
							"<th style='color: " . $depotHelper->getColorForNumber($depot->getDifferencePercentageForToday()) . "' title='" . $depot->getDifferencePercentageForToday() . "'>" . 
								number_format($depot->getDifferencePercentageForToday(), 2, ',', '.') . "%" .
							"</th>".
							"<th style='color: " . $depotHelper->getColorForNumber($depot->getDifferenceAbsoluteForToday()) . "'>" .
								number_format($depot->getDifferenceAbsoluteForToday() , 0, ',', '.') . $currencySymbol . 
							"</th>"
							:
							"<th></th>" .
							"<th></th>"
						) .

						"<th>" . 
							number_format($depot->getTotalValue(), 0, ',', '.') . $currencySymbol . 
						"</th>" . 
				
						"<th style='color: " . $depotHelper->getColorForNumber($depot->getDiffererencePercentage()) . "'>".
							number_format($depot->getDiffererencePercentage(), 1, ',', '.') . "%" .
						"</th>".
						
						"<th style='color: " . $depotHelper->getColorForNumber($depot->getDiffererenceAbsolute()) . "'>" .
							number_format($depot->getDiffererenceAbsolute(), 0, ',', '.') . $currencySymbol .
						"</th>".
					"</tr>" .
				"</tfoot>"
				;
		
		$stockGuVImageUrl = "";
		$stockCircleImageUrl = "";
		$depotDevelopmentHtml = "";
		try {
			$stockGuVImageUrl = $depotHelper->getStockGuVImageUrl($depot);
			$stockCircleImageUrl = $depotHelper->getStockCircleImageUrl($depot);
			$depotDevelopmentHtml = $depotHelper->getDepotDevelopmentHtml($depot);
		} catch (Exception $exception) {
		
		}	

		$out .= "</table>";

		$out .= '<br>' .
				'<a class="imgwrapper" href="' . $stockGuVImageUrl . '">' . 
					'<img class="lazy" data-src="' . $stockGuVImageUrl . '" />' . 
				'</a>' .
				'<br class="clear"><br>' . 
				'<a class="imgwrapper" href="' . $stockCircleImageUrl . '">' . 
					'<img class="lazy" data-src="' . $stockCircleImageUrl . '" />' . 
				'</a>' . 
				'<br class="clear"><br>' . 
				$depotDevelopmentHtml . 
				'<br class="clear"><br>' . 
				'<div id="total_depot_chart" style="clear: both; width: 100%"></div>' .
				'';
	
	} else {
		$out .= "Error loading: <a href='" . $depot->getUrl() . "' target='_blank'>Depot</a>";	
	}
}	


$cacheInvalidator = "?cache=" . substr(md5(filectime(__DIR__ . "/depot.css") * filectime(__DIR__ . "/depot.js")), 0, 10);

?><!doctype html>
<html class="no-js notranslate" lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>Depot</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="shortcut icon" type="image/x-icon" href="https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w32">
	<link rel="apple-touch-icon" sizes="32x32" href="https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w32">
    <link rel="apple-touch-icon" sizes="128x128" href="https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w128">
    <link rel="apple-touch-icon" sizes="512x512" href="https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w512">
    <link rel="icon" type="image/png" sizes="32x32" href="https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w32">
	<link rel="icon" type="image/png" sizes="128x128" href="https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w128">
	<link rel="icon" type="image/png" sizes="512x512" href="https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w512">

	<link rel="stylesheet" href="depot.css<?php echo $cacheInvalidator; ?>" />
</head>
<body>

<?php echo $out; ?>

</body>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<!-- <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script> 
-->
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.3/js/jquery.tablesorter.min.js"></script> 

<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.3/js/jquery.tablesorter.widgets.min.js"></script> 

<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js"></script>

<script type="text/javascript" src="https://cdn.jsdelivr.net/qtip2/3.0.3/basic/jquery.qtip.min.js"></script>
<link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/qtip2/3.0.3/basic/jquery.qtip.min.css" />

<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/jquery.lazy/1.7.9/jquery.lazy.min.js"></script>

<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>

<script type="text/javascript" src="depot.js<?php echo $cacheInvalidator; ?>"></script>

</html>