<?php


function getDollar () {return getYahooInformation('http://download.finance.yahoo.com/d/quotes.csv?s=EURUSD=X&f=sl1d1t1c1ohgv&e=.csv');}
function getDax () {return getYahooInformation('http://download.finance.yahoo.com/d/quotes.csv?s=%5EGDAXI&f=sl1d1t1c1ohgv&e=.csv');}
function getDow () {return getYahooInformation('http://download.finance.yahoo.com/d/quotes.csv?s=%5EDJI&f=sl1d1t1c1ohgv&ignore=.csv');}

// http://www.gummy-stuff.org/Yahoo-data.htm  -  DowJones not working
// http://finance.yahoo.com/d/quotes.csv?s=%5EDJI+EURUSD=X+%5EGDAXI&f=snd1l1yr

function getYahooInformation ($url) {
	if ($filedata = @getUrlContent($url)) {
		$file = explode(',', $filedata);
		$retVal['value'] = floor($file[1] * 100) / 100;
		if ($file[4] != 'N/A') {
			$retVal['diffabs'] = floor($file[4]);
			$retVal['diffabs'] = ($retVal['diffabs'] > 0 ? '+' : '') . $retVal['diffabs'];
			if (is_int($retVal['value'])) {
				$retVal['diffpro'] = floor(($retVal['diffabs'] / $retVal['value']) * 10000) / 100; 
				$retVal['diffpro'] = ($retVal['diffpro'] > 0 ? '+' : '') . $retVal['diffpro'];
			}
		}
		return $retVal;
	}
	return "";
}