<?php // include "mrm.php";

include "ComdirectDepotLoader.php";
include "ComdirectDepot.php";
include "ComdirectStock.php";
include "ComdirectDepotHelper.php";
include "depotlib.php";

$out = "";
$portfolioKey = (isset($_GET['portfolio_key']) && $_GET['portfolio_key'] ? $_GET['portfolio_key'] : null);
if ($portfolioKey){
	$depotLoader = new ComdirectDepotLoader();

	$portfolioKeys = explode(",", trim($portfolioKey));
	foreach ($portfolioKeys as $portfolioKey) {
		if ($portfolioKey == "header") {
			$dollar = getDollar();
			$dax = getDax();
			$dj = getDow();
		} else {

		}

		// produce HTML of all depots
		$out .= "<link rel='stylesheet' href='http://apps.mathiasnitzsche.de/comdirect/depot.css'><table border='0' class='mmmdepot' cellspacing='0' cellpadding='0'>".
					"<tr>".
						"<td class='info'>" . ($portfolioKey == "header" ? date("d.M H:i", time() - 15 * 60) : "") .  "</td>".
						"<td class='finanzNachrichtenCell'>&#160;</td>" .
						"<td class='info sizer alignright' colspan='3'>" .
							($portfolioKey == "header" ?
								($dollar ? 	"<a href='http://www.comdirect.de/inf/waehrungen/detail/uebersicht.html?ID_NOTATION=8381868' target='_blank' title='weitere Informationen zum EUR/DOL Kurs'>$/&euro;:" . $dollar['value'] . "</a>&#160;" : "")
								. ($dax ? 	"<a href='http://www.comdirect.de/inf/indizes/detail/uebersicht.html?ID_NOTATION=20735' target='_blank' title='diff: " . $dax['diffabs'] . "; " . $dax['diffpro'] . "%'>Dax:<span style='color: " . getColorForNumber($dax['diffpro']) . "'>" . floor($dax['value']) . "</span></a>&#160;" : "")
								. ($dj ? 	"<a href='http://www.comdirect.de/inf/indizes/detail/uebersicht.html?ID_NOTATION=324977' target='_blank' title='diff: " . $dj['diffabs'] . "; " . $dj['diffpro'] . "%'>DJ:<span style='color: " . getColorForNumber($dj['diffpro']) . "'>" . floor($dj['value']) . "</span></a>" : "") 
								// . "<a target='_blank' style='float: right' class='android' href='http://mrm.madmaxmatze.de/mrmmodulebackend.php?portfolio_key=" . $saveurl . "' style='height: 12px; width: 15px; display:block; overflow: hidden;'><img src='http://mrm.madmaxmatze.de/src/android.png' style='border: none' /></a>"
							: "").
						"</td>" .
					"</tr>";

		if ($portfolioKey != "header") {
			$depot = $depotLoader->load($portfolioKey);
			
			if (isset($_GET["type"]) && $_GET["type"] == "qr") {
				$imageGenerator = new ComdirectDepotImage($depot);
				
				header("Location: " . $imageGenerator->getQRCodeImageUrl());
				die();
			}

			if ($depot) {  	
				$depotHelper = new ComdirectDepotHelper();

				$out .= "<tr>".				// headline
							// colspan=2 because of finanznachrichten link
							"<th class='alignleft stockname' colspan='2'>". 
								"<img class='triangle' style='float: left; margin-right: 4px' src='http://apps.mathiasnitzsche.de/comdirect/src/opentriangle.gif' />".
								"<a style='float: left; margin-right: 4px; vertical-align: middle' href='http://www.comdirect.de/inf/musterdepot/pmd/freunde.html?portfolio_key=" . $portfolioKey . "&SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO_PCT&SORTDIR=ASCENDING' target='_blank' title='" . $depot->getTitle() . " | loaded in " . $depotLoader->getLoadingDuration() . " | last update " . date("d.M H:i", $depotLoader->getLoadingTime()). " (15min delayed)'>" . $depot->getTitle() . "</a> ". 
			
								"<a target='_blank' class='' title='Open in new window' href='?portfolio_key=" . urldecode($portfolioKey) . "' style='height: 12px; width: 16px; display:inline-block; overflow: hidden;'><img src='https://lh4.googleusercontent.com/-jDj_8QoCWtI/Ty6Lpm2TefI/AAAAAAAAGO8/IFqXEteEIsw/s800/newWindow.png' style='border: none' /></a> " .
						
								"<a target='_blank' class='qrcode' title='Show QR-code to transfer you depot url to your smartphone' 
									href='?portfolio_key=" . urldecode($portfolioKey) . "&type=qr' style='height: 12px; width: 16px; display:inline-block; overflow: hidden;'>
									<img src='https://lh5.googleusercontent.com/-zJPLUu7eljk/Ty6H23crfTI/AAAAAAAAGOk/kv9KrXFvW9o/s800/qrcode-small.png' style='border: none' /></a> " .
							"</th>".
							"<th colspan='2'>akt. Kurs</th>".
							"<th>abs.</th>".
						"</tr>";
				
				foreach ($depot->getStocks() as $stock) {
					try {
						$todayChange = ($stock->getDifferencePercentage() ? "-" : number_format($stock->getDifferencePercentage(), 2, ',', '.') . "%");
						
						$isFinanznachrichten = ($stock->getType() == "Aktie" && $stock->isCurrencyEur()); 
						$out .= "<tr class='stockrow " . (1 ? "alternate " : "") . "' title='" .
									"Kauf: " . $stock->getCount() . " x " . $stock->getPrice() . "&euro; = " . strip_tags($stock->getTotalBuyPrice()) . "&euro; (" . $stock->getBuyDate() . ") | " .
									"Aktuell: " . $stock->getPrice() . "&euro; (GuV=" . $stock->getDifferenceAbsolute() . "&euro;) "  .
								"'>".
								"<td class='stockname'" . ($isFinanznachrichten ? "" : " colspan='2'") . "><a href='" . $stock->getUrl() . "' target='_blank'>" . $stock->getName() . "</a></td>".
								($isFinanznachrichten ? "<td class='finanzNachrichtenCell'>".						
									"<a href='http://www.finanznachrichten.de/suche/suchergebnis.asp?words=" . $stock->getWkn() . "' target='_blank'>".
										"<div class='finanzNachrichtenLink' title='open related news'>&#160;&#160;&#160;&#160;</div>".
									"</a>" .
								"</td>" : "") .
								
								"<td class='alignright borderleft'>" . 
								($stock->getPrice() < 1 && strlen($stock->getPrice()) > 4 ? str_replace('.', ',', $stock->getPrice()) : number_format($stock->getPrice(), 2, ',', '.')) . $stock->getCurrencySymbol() . "</td>".
								"<td class='alignright' style='color: " . $depotHelper->getColorForNumber($stock->getDifferencePercentage()) . "'>" . number_format($stock->getDifferencePercentage(), 2, ',', '.') . "%</td>".
								"<td class='alignright borderleft' style='color: " . $depotHelper->getColorForNumber($stock->getTotalDifferencePercentage()) . "'>" . number_format($stock->getTotalDifferencePercentage(), 2, ',', '.') . "%</td>".
								
							"</tr>";
					} catch (Exception $exception) {
				
					}
				}
				
				$currencySymbol = $depotHelper->getCurrencySymbol($depot->getCurrency());
				$out .= "<tr>" . 
							"<th class='alignright' colspan='2'>" . 
								'<div style="font-weight: normal; font-size: 90%">' . 
									($depot->getNewestStockTimestamp() ? $depot->getNewestStockTimestamp()->format("d. M y - H:i") : "") . 
								'</div>' .
								number_format($depot->getTotalValue(), 2, ',', '.') . $currencySymbol .
							"</th>".
							"<th colspan='2' class='alignright' style='color: " . $depotHelper->getColorForNumber($depot->getDiffererenceAbsolute()) . "'>" . 
								'<div style="font-weight: normal; font-size: 90%; color: ' . $depotHelper->getColorForNumber($depot->getDifferencePercentageComparedToYesterday()) . '">' . 
									number_format($depot->getDifferenceAbsoluteComparedToYesterday() , 2, ',', '.') . 
									$currencySymbol . 
								"</div>" .
								number_format($depot->getDiffererenceAbsolute(), 2, ',', '.') . $currencySymbol .
							"</th>".
							"<th class='alignright' style='color: " . $depotHelper->getColorForNumber($depot->getDiffererencePercentage()) . "'>".
								'<div style="font-weight: normal; font-size: 90%; color: ' . $depotHelper->getColorForNumber($depot->getDifferencePercentageComparedToYesterday()) . '">' . 
									number_format($depot->getDifferencePercentageComparedToYesterday(), 2, ',', '.') . "%" .
								"</div>" .
								number_format($depot->getDiffererencePercentage(), 2, ',', '.') . "%" .
							"</th>".
						"</tr>";
				
				$stockGuVImageUrl = "";
				try {
					$stockGuVImageUrl = $depotHelper->getStockGuVImageUrl($depot);
				} catch (Exception $exception) {

				}

				$stockCircleImageUrl = "";
				try {
					$stockCircleImageUrl = $depotHelper->getStockCircleImageUrl($depot);
				} catch (Exception $exception) {
				
				}

				$out .= '<tr><td colspan="4"><br>' .
							'<a class="guv" style="margin: 20px; border: 1px solid #DDD" href="' . $stockGuVImageUrl . '">' . 
								'<img src="' . $stockGuVImageUrl . '" />' . 
							'</a>' .
							'<br class="clear"> ' . 
							'<a class="stockcicle" style="margin: 20px; border: 1px solid #DDD" href="' . $stockCircleImageUrl . '">' . 
								'<img src="' . $stockCircleImageUrl . '" />' . 
							'</a>' . 
							'<br class="clear"> ' . 
						'</td></tr>';
				
			} else {
				// if no depot data are found
				$out .= "<tr><th style='text-align:center' colspan='5'>Kann <a href='" . "--" . "' target='_blank'>Depot</a> nicht &ouml;ffnen</th></tr>";	
			}
		}

		$out .= "</table>";
	}

	if ($portfolioKey != "header" && !isset($_GET['igoogle'])) {
		$out = "<div id='mmmdepotdiv'>" . $out . "</div>" . 
				'<script type="text/javascript">if ((screen.width < 1024)) {document.getElementById("mmmdepotdiv").className = "mobile";}</SCRIPT>';
	}
} else {
	$out = 'Please provide a comdirect.de portfolio_key as explained <a href="https://nutzer.comdirect.de/cms/help/core0432_help.html" target="_blank" rel="nofollow">here</a>.';
}

echo $out;