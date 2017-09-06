<?php // include "mrm.php";

include "ComdirectDepotLoader.php";
include "ComdirectDepot.php";
include "ComdirectStock.php";
include "ComdirectDepotHelper.php";
include "depotlib.php";

/*
if (isset($_GET["type"]) && $_GET["type"] == "qr") {
	$depotLoader = new ComdirectDepotLoader();
	$depot = $depotLoader->load($portfolioKey);
	$imageGenerator = new ComdirectDepotImage($depot);
	header("Location: " . $imageGenerator->getQRCodeImageUrl());
	die();
}
*/

$portfolioKeyParam = (isset($_GET['portfolio_key']) && $_GET['portfolio_key'] ? $_GET['portfolio_key'] : null);

?><!doctype html>
<html class="no-js notranslate" lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Depot</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="shortcut icon" type="image/x-icon" href="http://www.iconarchive.com/download/i100101/iynque/ios7-style/Stocks.ico">
		<link rel="apple-touch-icon" sizes="32x32" href="http://icons.iconarchive.com/icons/iynque/ios7-style/32/Stocks-icon.png">
        <link rel="apple-touch-icon" sizes="128x128" href="http://icons.iconarchive.com/icons/iynque/ios7-style/128/Stocks-icon.png">
        <link rel="apple-touch-icon" sizes="512x512" href="http://icons.iconarchive.com/icons/iynque/ios7-style/512/Stocks-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="http://icons.iconarchive.com/icons/iynque/ios7-style/32/Stocks-icon.png">
		<link rel="icon" type="image/png" sizes="128x128" href="http://icons.iconarchive.com/icons/iynque/ios7-style/128/Stocks-icon.png">
		<link rel="icon" type="image/png" sizes="512x512" href="http://icons.iconarchive.com/icons/iynque/ios7-style/512/Stocks-icon.png">
        
        <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script> 
		<script type="text/javascript" src="https://bowercdn.net/c/jquery.tablesorter-2.0.24/js/jquery.tablesorter.min.js"></script> 
  		<script src="https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js"></script>
      
      	<link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/qtip2/3.0.3/basic/jquery.qtip.min.css" />
		<script type="text/javascript" src="https://cdn.jsdelivr.net/qtip2/3.0.3/basic/jquery.qtip.min.js"></script>

        <!-- 
			<link rel='stylesheet' href='//apps.mathiasnitzsche.de/comdirect/depot.css' />
        -->
	    <style>
    		/* copied: http://www.irishstu.com/stublog/2011/12/13/tables-responsive-design-part-2-nchilds/ */
			html {margin:0; padding: 3px;}
			body {margin:0; padding: 0;}

			.mmmdepot {
				border-collapse:collapse;
				font-family:Arial, Sans-Serif;
				font-size:12px;
				width: 100%;
			}
				
			.mmmdepot th {
				text-align: right;
				padding:1px;
				border-bottom: 1px solid #aaa;
			}
			.mmmdepot .footer th {
				border-bottom: none;
				border-top: 1px solid #aaa;
			}

			.mmmdepot td {
				border-collapse:collapse;
				padding:1px 3px;
				text-align:right;
				overflow:hidden; 
				position: relative;
			}
			
			.mmmdepot td.stockname a {
				display: block; 
				border: none !important;
				text-align: left; 
				height: 1em;
				overflow:hidden; 
			}
			.finanzNachrichtenLink {
				border: none !important;
			}
			.mmmdepot td .finanzNachrichtenLink {background: url('https://fns1.de/g/favicon.ico') center center no-repeat;}

			.mmmdepot tbody tr.even:hover td,
			.mmmdepot tbody tr.odd:hover td {background-color: #dcdefd !important;}

			.mmmdepot tr.odd {background-color: #EEE;}

			.mmmdepot tr.even > .sortcolumn {background-color: #F4F4F4;}
			.mmmdepot tr.odd > .sortcolumn,
			.mmmdepot thead tr > th.sortcolumn {background-color: #DDD;}

			.mmmdepot td a, .mmmdepot td a:visited, .mmmdepot th a, .mmmdepot th a:visited {text-decoration: none; color: #222;}
			.mmmdepot td a:hover, .mmmdepot th a:hover {text-decoration: underline; color: blue;}

			.imgwrapper {
		        margin-top: 10px;
		    	width: 600px;
		    	float: left;	
		    }	
		    .imgwrapper img {
		    	width: 100%;	
		    }

	    	tr > *:nth-child(2)
	    	, tr > *:nth-child(3)
	    	, tr > *:nth-child(8)
	    	, tr > *:nth-child(11)
	    	{
    			border-left: 1px solid #aaa;
			}
	    	tr > *:nth-child(1)
			, tr > *:nth-child(2)
	    	, tr > *:nth-child(7)
	    	, tr > *:nth-child(10)
	    	{
    			border-right: 1px solid #aaa;
	    	}

			td.isDataLive span {
				font-weight: bold;
			}

			td.isDataOld span {
				opacity: 0.7;
						    /*
			    text-decoration: line-through; 
			    text-decoration-style: dashed; 
			    text-decoration-color: gray;
			    */
	    	}
	    	td.isDataFromYesterday span {
				opacity: 0.3;
			    /*
			    text-decoration: line-through; 
			    text-decoration-style: solid; 
			    text-decoration-color: black;
			    */
	    	}

			th.header {
    			cursor: ns-resize;
	    	}

	    	th.headerSortDown {
    			cursor: n-resize;
	    	}
			
	    	th.headerSortUp {
    			cursor: s-resize;
	    	}

			@media only screen and (max-width: 700px) {
				.qtip-default
				, tr th:nth-child(1), tr td:nth-child(1)
				, tr th:nth-child(4), tr td:nth-child(4)
				{
					display:none; visibility:hidden;
				}
				.imgwrapper {
					width: 100%;
					float: none;
				}
			}

			@media only screen and (max-width: 600px) {
				tr th:nth-child(3), tr td:nth-child(3)
				, tr th:nth-child(6), tr td:nth-child(6)
				{
					display:none; visibility:hidden;
				}
			}

			@media only screen and (max-width: 500px) {
				tr th:nth-child(5), tr td:nth-child(5)
				, tr th:nth-child(7), tr td:nth-child(7)
				{
					display:none; visibility:hidden;
				}
			}

			@media only screen and (max-width: 400px) {
				tr th:nth-child(10), tr td:nth-child(10)
				{
					display:none; visibility:hidden;
				}	
			}

			@media only screen and (max-width: 300px) {
				tr th:nth-child(11), tr td:nth-child(11)
				{
					display:none; visibility:hidden;
				}
			}

			/* make white */
			.qtip-default{
				border: 1px solid gray;
				background-color: white;
				max-width: 1000px;
			}
		</style>
		<script type="text/javascript">
		    $.tablesorter.addParser({ 
		        id: 'tonumber', 
		        is: function(s) { return false; }, 
		        format: function(s) {return Number(s.replace(".", "").replace("%", "").replace("$", "").replace("€", "").replace(",", "."));}, 
		        type: 'numeric' 
		    }); 
		    $.tablesorter.addParser({ 
		        id: 'germandate', 
		        is: function(s) { return false; }, 
		        format: function(s) {return s.substring(6, 8) + s.substring(3, 5) + s.substring(0, 2);}, 
		        type: 'text' 
		    }); 
			$().ready(function() { 
		        $(".mmmdepot").tablesorter({
		        	sortList: [[12,0]],
		         	widgets: ['zebra'],
			        headers: { 
			        	// 1: number
			        	2: {sorter:'germandate'},
			            // 3: market
			            4: {sorter:'tonumber'},
			            5: {sorter:'tonumber'},
			          	6: {sorter:'tonumber'},
			          	7: {sorter:'tonumber'},
			          	8: {sorter:'tonumber'},
			          	9: {sorter:'tonumber'},
			          	10: {sorter:'tonumber'},
			          	11: {sorter:'tonumber'},
			          	12: {sorter:'tonumber'}
			        }
			    })
			    .bind("sortEnd",function() { 
			        $(".sortcolumn").removeClass('sortcolumn');
			        var sortcolumn = $('tr th.headerSortDown, tr th.headerSortUp').index();
			        $(".mmmdepot tr > :nth-child(" + (sortcolumn + 1) + ")").addClass('sortcolumn');

			        <? /* https://stackoverflow.com/questions/6549518/jquery-tablesorter-with-row-numbers */ ?>
		            var i = 1;
				    $(".mmmdepot").find("tr:gt(0)").each(function(){
				        $(this).find("td:eq(0)").text(i);
				        i++;
				    });
			    });


				$('[data-wkn!=""]').each(function() {
				    var wkn = $(this).data("wkn");
				    if ($(this).data("wkn")) {
					    $(this).find("td.stockname").qtip({ // 
					        content: {
					            text: 
					            	"<img src='https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=5Y&TYPE=MOUNTAIN&ID_NOTATION=" + wkn + "'> " +
					            	"<img src='https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=6M&TYPE=MOUNTAIN&ID_NOTATION=" + wkn + "'>" +
					            	"<img src='https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=10D&TYPE=MOUNTAIN&ID_NOTATION=" + wkn + "'>"
					        },
					        style: {
							    width: 800
							}
					    });
				    }
				});

			});
		</script>
    </head>
    <body><?php

    	$out = "";
		if ($portfolioKeyParam){
			$depotLoader = new ComdirectDepotLoader();

			/*
			$dollar = getDollar();
			$dax = getDax();
			$dj = getDow();
			($dollar ? 	"<a href='http://www.comdirect.de/inf/waehrungen/detail/uebersicht.html?ID_NOTATION=8381868' target='_blank' title='weitere Informationen zum EUR/DOL Kurs'>$/&euro;:" . $dollar['value'] . "</a>&#160;" : "")
			. ($dax ? 	"<a href='http://www.comdirect.de/inf/indizes/detail/uebersicht.html?ID_NOTATION=20735' target='_blank' title='diff: " . $dax['diffabs'] . "; " . $dax['diffpro'] . "%'>Dax:<span style='color: " . getColorForNumber($dax['diffpro']) . "'>" . floor($dax['value']) . "</span></a>&#160;" : "")
			. ($dj ? 	"<a href='http://www.comdirect.de/inf/indizes/detail/uebersicht.html?ID_NOTATION=324977' target='_blank' title='diff: " . $dj['diffabs'] . "; " . $dj['diffpro'] . "%'>DJ:<span style='color: " . getColorForNumber($dj['diffpro']) . "'>" . floor($dj['value']) . "</span></a>" : "") 
			*/

			$portfolioKeys = explode(",", trim($portfolioKeyParam));
			foreach ($portfolioKeys as $portfolioKey) {
				$depot = $depotLoader->load($portfolioKey);

				if ($depot && $depot->isValid()) {  			
					$out .= "<table border='0' class='mmmdepot tablesorter' cellspacing='0' cellpadding='0'>" .
								"<thead>" .
								"<tr>".
									"<th>#</th>".
									// colspan=2 because of finanznachrichten link
									"<th class='alignleft stockname'>". 
										"<a style='float: left; margin-right: 4px; vertical-align: middle' href='http://www.comdirect.de/inf/musterdepot/pmd/freunde.html?portfolio_key=" . $portfolioKey . "&SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO_PCT&SORTDIR=ASCENDING' target='_blank' title='" . $depot->getTitle() . " | loaded in " . sprintf ("%01.3f", $depot->getLoadingDuration() / 1000000) . "s | last update " . date("d.M H:i", $depot->getLoadingTime()). " (15min delayed)'>" . $depot->getTitle() . 
										"</a> ". 
									"</th>".
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
									"<th class='headerSortUp'>Abs</th>".
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
							$out .= "<tr data-wkn='" . $stock->getId() . "' class='" . ($i++ % 2 ? "even" : "odd") . "'>".
										"<td>" . $i . "</td>".
										"<td class='stockname'>" . 
											"<a href='" . $stock->getUrl() . "' target='_blank'>" . $stock->getName() . "</a>".
											($isFinanznachrichten ?
											"<div class='finanzNachrichtenLink' style='width: 20px; position: absolute; top: 0px; right: 0px' title='open related news'>" .
												"<a href='http://www.finanznachrichten.de/suche/suchergebnis.asp?words=" . $stock->getWkn() . "' target='_blank'>".
													"&#160;&#160;&#160;&#160;" .
												"</a>" .
											"</div>"
											: "") .
										"</td>" .
										
										// Datum
										"<td>" . $stock->getBuyDate() . "</td>".
									
										// Börse
										"<td>" . $stock->getMarket() . "</td>".

										// Kaufpreis
										"<td>" . number_format($stock->getBuyPrice(), 2, ',', '.') . "€</td>".

										"<td>" . ceil($stock->getCount()) . "</td>".
										
										// Kaufgesamtwert
										"<td>" . number_format($stock->getTotalBuyPrice(), 0, ',', '.') . "€</td>".


										// Aktueller Preis
										"<td class='" . ($stock->getAgeOfDataInSeconds() < 2000 ? "isDataLive1" : "") . "' title='" . $stock->getDate()->format("Y/m/d H:i:s") . "'><span>" . ($stock->getPrice() < 1 && strlen($stock->getPrice()) > 4 ? str_replace('.', ',', $stock->getPrice()) : number_format($stock->getPrice(), 2, ',', '.')) . $stock->getCurrencySymbol() . "</span></td>".
										"<td class='" . $stockClass . "' style='color: " . $depotHelper->getColorForNumber($stock->getDifferencePercentage() * 100) . "'><span>" . number_format($stock->getDifferencePercentage(), 2, ',', '.') . "%</span></td>".
										"<td class='" . $stockClass . "' style='color: " . $depotHelper->getColorForNumber($stock->getDifferencePercentage() * 100) . "'><span>" . number_format($stock->getDifferenceAbsolute(), 0, ',', '.') . "€</span></td>".
								

										// Akt Gesamtwert
										"<td>" . number_format($stock->getTotalPrice(), 0, ',', '.') . "€</td>".
									
										// Gesamtprozent
										"<td style='color: " . $depotHelper->getColorForNumber($stock->getTotalDifferenceAbsolute() / $depot->getTotalValue() * 10000) . "'>" . number_format($stock->getTotalDifferencePercentage(), 1, ',', '.') . "%</td>".

										// Gewinn
										"<td style='color: " . $depotHelper->getColorForNumber($stock->getTotalDifferenceAbsolute() / $depot->getTotalValue() * 10000) . "'>" . number_format($stock->getTotalDifferenceAbsolute(), 0, ',', '.') . "€</td>".
									"</tr>";

						} catch (Exception $exception) {
					
						}
					}
					
					$currencySymbol = $depotHelper->getCurrencySymbol($depot->getCurrency());
					$out .= "</tbody>" . 
								"<tr class='footer'>" . 
									"<th></th>" .
									"<th>" .
										"<a href='http://www.comdirect.de/inf/musterdepot/pmd/freunde.html?portfolio_key=" . $portfolioKey . "&SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO_PCT&SORTDIR=ASCENDING' target='_blank' title=''>" . ($depot->getNewestStockTimestamp() ? $depot->getNewestStockTimestamp()->format("d. M y - H:i") : "") . "</a> ". 
								  	"</th>".
									
									"<th></th>" .
									"<th></th>" .
									"<th></th>" .
									"<th></th>" . 
									"<th>" . number_format($depot->getBuyTotalValue(), 0, ',', '.') . $currencySymbol . "</th>" .
									
									"<th></th>" .

									($depot->isTradingDay() ?
										"<th style='color: " . $depotHelper->getColorForNumber($depot->getDifferencePercentageForToday()) . "'>" . 
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
								"</tr>";
					
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
								'<img src="' . $stockGuVImageUrl . '" />' . 
							'</a>' .
							'<br class="clear"><br>' . 
							'<a class="imgwrapper" href="' . $stockCircleImageUrl . '">' . 
								'<img src="' . $stockCircleImageUrl . '" />' . 
							'</a>' . 
							'<br class="clear"><br>' . 
							$depotDevelopmentHtml . 
							'<br class="clear"> ' . 
							'';
				
				} else {
					$out .= "Error loading: <a href='" . $depot->getUrl() . "' target='_blank'>Depot</a>";	
				}

			}	
		} else {
			$out = 'Please provide a comdirect.de portfolio_key as explained <a href="https://nutzer.comdirect.de/cms/help/core0432_help.html" target="_blank" rel="nofollow">here</a>.';
		}

		echo $out; 
		?>
	</body>
</html>


<!-- 

https://developers.google.com/chart/image/docs/gallery/line_charts


https://chart.googleapis.com/chart?cht=lc&chd=s:UVVUVVUUUVVUSSVVVXXYadfhjlllllllmmliigdbbZZXVVUUUTU&chco=0000FF&chls=2.0,1.0,0.0&chxt=x,y&chxl=0:|Sept|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Aug|Aug|Aug|1:%7C0%7C25%7C50%7C75%7C100&chs=600x400&chg=100.0,25.0&chf=c,ls,0,CCCCCC,0.8,FFFFFF,1

-->