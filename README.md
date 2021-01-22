[peerfol.io](https://www.peerfol.io "www.peerfol.io")
=========

## Summary
Peerfol.io provides a new and much better view of a Comdirect Portfolio - adding many features never seen before in any other portfolio or broker app.

Read more on the official project page: https://www.peerfol.io/

## History
This project started 2005 with a small parser cleaning up the Comdirect HTML to make it load faster and suitable for mobile devices. Over the years many small additions have been added, which finally resulted in what you see today. As the prroject is still under development, feel free to [suggest further features](https://github.com/peerfolio/app/discussions "suggest further features directly via github").

## Tech

##### Backend
 - PHP, no framework
 - no DB, just a simple [file cache](https://github.com/peerfolio/app/blob/master/vendor/FileCache.php "file cache") to persists some JSONs #NoSql
 - [ComdirectDepotLoader](https://github.com/peerfolio/app/blob/master/ComdirectDepotLoader.php "ComdirectDepotLoader.php") - Parser which takes a *portfolioKey* as input, loads the HTML from Comdirect and extract the required information to return the portfolio
 - [ComdirectDepot](https://github.com/peerfolio/app/blob/master/ComdirectDepot.php "ComdirectDepot.php") and [ComdirectStock](https://github.com/peerfolio/app/blob/master/ComdirectStock.php "ComdirectStock.php") to represent the information in simple classes
 - [Api](https://github.com/peerfolio/app/blob/master/api1.php "api1.php") serves the information via simple, open RestAPI

##### Frontend
- Fully Javascript based
- old school jQuery (yes, there was a time before React)
- no fancy build or deploy tools
- additional libriaries loaded via public CDNs: [Google Charts](https://developers.google.com/chart "Google Charts"), [Tablesorter](https://mottie.github.io/tablesorter/docs/ "Tablesorter"), [qtip](https://github.com/qTip2/qTip2/ "qtip"), [Modernizr](https://modernizr.com/ "Modernizr")
- [app.js](https://github.com/peerfolio/app/blob/master/app.js "app.js") contains jQuery Plugins for the table, each chart and also some Utilitly funtions
- [app.css](https://github.com/peerfolio/app/blob/master/depot.css "app.css") make the peerfolio a little pretty, and super useful


## Outlook
Just check the stuff currently in development and in the [backlog](https://github.com/peerfolio/app/issues "issue tracker").

Most of all I would like to not rely on Comdirect as the Admin interface and stock quote provider anymore, but move to an own solution. What keeps me away is that this Comdirect hack required no work and is just too convinient to invest any time to replace it.