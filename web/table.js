;(function($) { // Depot Table
  var DepotTable = (function($element, depot) {
    var visitedPortfolioKeys = JSON.parse(localStorage.getItem("portfoliokeys")) || {};
    var tooltipStockChartUrl = "https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=[TIME]&TYPE=MOUNTAIN&ID_NOTATION=[ID]";

    init = function() {
      var headRow = "<tr>"
          + "<th class='iterator'></th>"
          + "<th class='name'>" + depot.title + "</th>"
          + "<th class='note'><input class='search' data-column='2' placeholder='Note' /></th>"
          + "<th class='type'><input class='search' data-column='3' placeholder='Type' /></th>"
          + "<th class='market'>Market</th>"
          + "<th class='buyDate'>BuyDate</th>"
          + "<th class='buyCount'>BuyCount</th>"
          + "<th class='buyPrice'>BuyPrice</th>"
          + "<th class='buyValue'>BuyValue</th>"
          + "<th class='limitBottom'>Limit</th>"
          + "<th class='limitTop'>Limit</th>"
          + "<th class='price'>Price</th>"
          + "<th class='priceDiffPer'>%</th>"
          + "<th class='valueDiffAbsToday'>Today</th>"
          + "<th class='valueDiffPer'>Abs%</th>"
          + "<th class='valueDiffAbs'>Abs</th>"
          + "<th class='value'>Value</th>"
        + "</tr>";

      $element.append(
        "<table class='depot'>"
          + "<thead>" + headRow + "</thead>"
          + "<tbody></tbody>"
          + "<tfoot>" + headRow.replace(/\'\>.*?\<\/th\>/g, "'></th>") + "</tfoot>"
        + "</table>");

      fillData();
      storePortfolioKey();
      initTableSorter();
      initMenu();
      initStockContextMenu();
    };

    fillData = function() {
      var sortingZero = -0.0000001;

      var tableBody = $element.find("> table > tbody");
      Object.values(depot.stocks).forEach((stock) => {
        tableBody.append(
          $("<tr>")
          .data("stock", stock)
          .addClass(stock.count ? "" : "watchlist")
          .addClass(stock.isDataFromToday ? "" : "isDataFromYesterday")
          .addClass(stock.isDataOld ? "isDataOld" : "")
          .append("<td class='iterator'></td>"
            + "<td class='name" + (stock.isAboveLimit || stock.isBelowLimit ? " alert" : "") + "'>"
              + stock.name
            + "</td>"
            + "<td class='note' title='" + stock.note.replace(/\'/i, "\"") + "'>" + stock.note + "</td>"
            + "<td class='type'>" + stock.type + "</td>"
            + "<td class='market'>" + stock.market + "</td>"
            + "<td class='buyDate'>"
              + (stock.count ? stock.buyDate.toISOString().substr(0, 10) : "")
            + "</td>"
            + "<td class='buyCount'>"
              + (stock.count ? $.formatNumber(stock.count) : "")
            + "</td>"
            + "<td class='buyPrice'>"
              + (stock.count ? $.formatNumber(stock.buyPrice, stock.currency, 2) : "")
            + "</td>"
            + "<td class='buyValue'>"
              + (stock.count ? $.formatNumber(stock.buyValue, depot.currency, 0) : "")
            + "</td>"
            + "<td class='limitBottom" + (stock.isBelowLimit ? " alert" : "") + "'>"
              + (stock.limitBottom ? $.formatNumber(stock.limitBottom, stock.currency, 2) : "")
            + "</td>"
            + "<td class='limitTop" + (stock.isAboveLimit ? " alert" : "") + "'>"
              + (stock.limitTop ? $.formatNumber(stock.limitTop, stock.currency, 2) : "")
            + "</td>"
            + "<td class='price'>"
              + "<span>" + $.formatNumber(stock.price, stock.currency, 2) + "</span>"
            + "</td>"
            + "<td class='priceDiffPer'" + $.getStyleColorForNumber(stock.priceDiffPer * 100) + ">"
              + "<span>" + $.formatNumber(stock.priceDiffPer, "%", 1) + "</span>"
            + "</td>"
            + "<td class='valueDiffAbsToday'" + $.getStyleColorForNumber(stock.priceDiffPer * 100) + ">"
              + "<span>"
                + (stock.count ? $.formatNumber(stock.valueDiffAbsToday, depot.currency) : sortingZero)
              + "</span>"
            + "</td>"
            + "<td class='valueDiffPer'" + $.getStyleColorForNumber(stock.valueDiffPer) + ">"
              + (stock.count ? $.formatNumber(stock.valueDiffPer, "%") : sortingZero)
            + "</td>"
            + "<td class='valueDiffAbs'" + $.getStyleColorForNumber((stock.value - stock.buyValue) / depot.value * 10000) + ">"
              + (stock.count ? $.formatNumber(stock.value - stock.buyValue, depot.currency) : sortingZero)
            + "</td>"
            + "<td class='value'>"
              + (stock.count ? $.formatNumber(stock.value, depot.currency) : "")
            + "</td>"
          )
        );
      });

      refreshFooter();
    };

    refreshFooter = function() {
      var buyValue = 0;
      var value = 0;
      var buyDateAgeAverage = 0;
      var valueDiffAbsToday = 0;

      $element.find("> table > tbody > tr:visible").each(function(){
        var stock = $(this).data("stock");
        if (stock.count) {
          if (stock.isDataFromToday) {
            valueDiffAbsToday += stock.valueDiffAbsToday;
          }
          buyValue += stock.buyValue;
          value += stock.value;
          buyDateAgeAverage += stock.buyDateAge * stock.value;
        }
      });
      var valueDiffAbs = (value - buyValue);
      var valueDiffPer = valueDiffAbs / buyValue * 100;
      if (buyDateAgeAverage) {
        buyDateAgeAverage = buyDateAgeAverage / value;
      }

      var footerFields = $element.find("> table > tfoot > tr > th");
      if (depot.isDataOld) {
        footerFields.filter(".name").html(
          depot.isDataFromToday ? 
            " <span style='background: #DDD'>" + $.formatDuration(depot.dateAge) + " old data</span>" : 
            " <span style='background: red'>" + depot.date.toISOString().replace(/[A-Z]+/ig, " ").substr(0, 19) + "</span>"
        );
      }
      footerFields.filter(".buyDate").html($.formatDuration(buyDateAgeAverage));
      footerFields.filter(".buyValue").html("<span" + (depot.sharedKey ? " class='shareDepotLabel'" : "") + ">"
                                              + $.formatNumber(buyValue, depot.currency, 0) + "</span>");
      footerFields.filter(".priceDiffPer").html($.formatNumber(valueDiffAbsToday / (value - valueDiffAbsToday) * 100, "%"))
                                          .css("color", $.getColorForNumber(valueDiffAbsToday));
      footerFields.filter(".valueDiffAbsToday").html($.formatNumber(valueDiffAbsToday, depot.currency, 0))
                                                .css("color", $.getColorForNumber(valueDiffAbsToday));
      footerFields.filter(".valueDiffPer").html($.formatNumber(valueDiffPer, "%"))
                                          .css("color", $.getColorForNumber(valueDiffPer * 2));
      footerFields.filter(".valueDiffAbs").html($.formatNumber(valueDiffAbs, depot.currency, 0))
                                          .css("color", $.getColorForNumber(valueDiffAbs));
      footerFields.filter(".value").html($.formatNumber(value, depot.currency, 0));
    };

    initMenu = function() {
      var html = "";

      if (depot.key) {     
        html += "<p>"
                  + "Comdirect: "
                  + "<a href='http://www.comdirect.de/inf/musterdepot/pmd/freunde.html?portfolio_key=" + depot.key
                    + "&SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO_PCT&SORTDIR=ASCENDING' target='_blank'>Open</a>"
                  + " | "
                  + "<a href='https://nutzer.comdirect.de/inf/musterdepot/pmd/meineuebersicht.html?name=" + depot.title
                    + "' target='_blank'>Edit</a>"
                + "</p>"
                + "<p>"
                  + "<a href='/s" + depot.key.substring(0, 12) + "' target='_blank'>Share 1k-Peerfolio</a>"
                + "</p>"
                + "<p>"
                  + "<a href='/api/v1/stocks?format=csv&portfolio_key=" + depot.key
                    + (depot.isDataFromToday ? "" : "&date=" + depot.date.toISOString().split('T')[0])
                    + "' target='_blank'>Export</a>"
                + "</p>";
      }

      if (visitedPortfolioKeys && Object.keys(visitedPortfolioKeys).length > 1) {
        html += "Recently visited:"
                + "<ul>"
                  + Object.keys(visitedPortfolioKeys).reduce((prevVal, key) => {
                    return prevVal + (key && visitedPortfolioKeys[key] ? "<li>"
                      + (key.charAt() == "s" ? "<span class='shareDepotLabel'>1k</span> " : "")
                      + "<a href='/" + key + "'>" + visitedPortfolioKeys[key] + "</a></li>" : "");
                  }, '')
                + "</ul>";
      }

      if (html) {
        var menuElement = $("<div class='menu'>Menu</div>");
        $element.before(menuElement);
        menuElement.qtip({
          content: {
            text: html
          },
          style: {classes: "menu-tooltip"},
          position: {
            my: "top right"
            ,at: "bottom right"
            ,adjust: {
              y: -8
            }
          },
          show: {
            event: "click",
            solo: true,
            delay: 1,
            effect: function(offset) {
              $(this).slideDown(300);
            }
          },
          hide: {
            inactive: 4000
            ,fixed: true
            ,delay: 300
            ,event: "click mouseleave"
          },
          events: {
            toggle: function(event, api) {
              $(api.elements.target).toggleClass("menuOpen", (event.type === 'tooltipshow')); 
            }
          }
        });
      }
    };

    initTableSorter = function () {
      var sortColumnNumber = $element.find("> table > tfoot > tr > th.valueDiffAbs")
                                    .addClass("sortcolumn headerSortUp").prevAll().length;

      $element.children("table").tablesorter({
        sortList: [[sortColumnNumber,0], [1,0]]
        ,sortAppend: [[1,0]]
        ,widgets: ["zebra", "columns", "filter"]
        ,widgetOptions : {
          columns: [ "sortcolumn" ]   // css class for sorted column
          ,filter_columnFilters: false
          ,filter_placeholder: {search : "Note"}
          ,filter_external : ".search"
          // filter_saveFilters : true,
        }
        ,usNumberFormat: ((1.1).toLocaleString(navigator.language || navigator.userLanguage).substr(1,1) == ".")
        ,headers: [
          { sorter: false }
        ]
      })
      .on("initialized filterEnd", refreshFooter);
    };

    initStockContextMenu = function () {
      $element.find("> table > tbody > tr").each(function() {
        var row = $(this);
        var stock = row.data("stock");

        var html = "<p>"
          + "<span class='price'>" + $.formatNumber(stock.price, stock.currency, 2) + "</span>"
          + " <span class='priceDiffAbs'" + $.getStyleColorForNumber(stock.priceDiffPer * 100) + ">"
            + $.formatNumber(stock.priceDiffAbs, stock.currency, 2, true)
          + "</span>"
          + (typeof stock.priceDiffPer !== "undefined" ?
            " <span class='priceDiffPer'" + $.getStyleColorForNumber(stock.priceDiffPer * 100) + ">"
              + $.formatNumber(stock.priceDiffPer, "%", null, true)
            + "</span>"
            : "")
          + (stock.limitBottom || stock.limitTop ?
              "<br>"
              + (stock.limitBottom ? "<span" + (stock.isBelowLimit ? " class='alert'" : "") + ">"
                  + $.formatNumber(stock.limitBottom, stock.currency, 2) + " < </span>" : "")
              + "Limit"
              + (stock.limitTop ? "<span" + (stock.isAboveLimit ? " class='alert'" : "") + "> > "
                  + $.formatNumber(stock.limitTop, stock.currency, 2) + "</span>" : "")
            : "")
        + "</p>";

        if (stock.count) {
          html += "<p>"
            + "Diff Today: <span class='valueDiffAbsToday'" + $.getStyleColorForNumber(stock.valueDiffAbsToday) + ">"
              + $.formatNumber(stock.valueDiffAbsToday, depot.currency, 2)
            + "</span>"
          + "</p>"

          + "<p>"
            + $.getPnlTable({
                headline : stock.buyDate.toISOString().substr(0, 10) + " (" + $.formatDuration(stock.buyDateAge) + ")",
                valueCurrency : depot.currency,
                valueStart : stock.buyValue,
                valueEnd : stock.value,
                count : stock.count,
                priceStart : stock.buyPrice,
                priceCurrency : stock.currency
            })
          + "</p>"

          + (stock.note ? "<p><i>&quot;" + stock.note + "&quot;</i></p>" : "");
        }

        html += "<p>"
          + stock.market + " | " + stock.type
          + (stock.wkn ? " | " + stock.wkn : "")
          + (stock.isin ? " | " + stock.isin : "")
          + " | age " + $.formatDuration(stock.dateAge) + "<br>"
        + "</p>"

        + "<p>"
          + "<a href='https://www.comdirect.de/inf/aktien/detail/uebersicht.html?ID_NOTATION=" + stock.comdirectId
            + "' target='_blank'>"
            + "<img src='https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w32' "
            + "width='32' />"
          + "</a> "
          + (stock.isin ?
            "<a href='https://aktie.traderfox.com/visualizations/" + stock.isin + "' target='_blank'>"
              + "<img src='https://pbs.twimg.com/profile_images/797361743626465280/eAhqkp1P_400x400.jpg' width='32' />"
            + "</a> "
            + "<a href='http://markets.businessinsider.com/searchresults?_search=" + stock.isin + "' target='_blank'>"
              + "<img src='https://i.insider.com/596e4e7a552be51d008b50fd?width=600&format=jpeg&auto=webp' width='32' />"
            + "</a> "
            + "<a href='http://m.ariva.de/search/search.m?searchname=" + stock.isin + "' target='_blank'>"
              + "<img src='https://pbs.twimg.com/profile_images/435793734886645760/TmtKTE6Y.png' width='32' />"
            + "</a> "
            + "<a href='https://www.onvista.de/aktien/" + stock.isin + "' target='_blank'>"
              + "<img src='https://s.onvista.de/css-69545/web/portal/nl/layout_img/favicon.png' width='32' />"
            + "</a> "
            + "<a href='http://www.finanzen.net/suchergebnis.asp?_search=" + stock.isin + "' target='_blank'>"
              + "<img src='https://images.finanzen.net/images/favicon/favicon-32x32.png' width='32' />"
            + "</a> "
            + "<a href='https://www.consorsbank.de/euroWebDe/-?$part=Home.security-search&$event=search"
              + "&pattern=" + stock.isin + "' target='_blank'>"
              + "<img src='https://www.consorsbank.de/content/dam/de-cb/system/images/evr/favicon.ico' width='32' />"
            + "</a> "
            : "")
          + (stock.symbol ?
            "<a href='https://finance.yahoo.com/quote/" + stock.symbol + "' target='_blank'>"
              + "<img src='https://finance.yahoo.com/favicon.ico' width='32' />"
            + "</a> "
            + "<a href='https://www.google.de/search?tbm=fin&q=" + stock.symbol + "' target='_blank'>"
              + "<img src='https://www.google.de/images/branding/product/ico/googleg_lodp.ico' width='32' />"
            + "</a> "
            : "")
          + (stock.isin && stock.type == "ETF" ?
              "<a href='https://www.justetf.com/de/etf-profile.html?isin=" + stock.isin + "' target='_blank'>"
                + "<img src='https://www.justetf.com/images/logo/justetf_icon_m.png' width='32' />"
              + "</a> "
              + "<a href='https://de.extraetf.com/etf-profile/" + stock.isin + "' target='_blank'>"
                + "<img src='https://de.extraetf.com/favicon.ico' width='32' />"
              + "</a> "
              + "<a href='https://www.trackingdifferences.com/ETF/ISIN/" + stock.isin + "' target='_blank'>"
                + "<img src='https://www.trackingdifferences.com/images/favicon-32.png' width='32' />"
              + "</a> "
            : "")
          + (stock.wkn && stock.type == "Stock" ?
              "<a href='http://www.finanznachrichten.de/suche/suchergebnis.asp?words=" + stock.wkn + "' target='_blank'>"
                + "<img src='https://fns1.de/g/fb.png' width='32' />"
              + "</a> "
            : "")
          + "<div class='chartContainer'>"
            + "<div class='controls'><a class='active'>10d</a> <a>6m</a> <a>1y</a> <a>5y</a> <a>max</a></div>"
            + "<img src='" + tooltipStockChartUrl.replace("[TIME]", "10D").replace("[ID]", stock.comdirectId) + "' />"
          + "</div>"
        + "</p>";

        html = "<div style='max-width: 600px'>" + html + "</div>";

        var cell = row.find("> td.name");
        cell.qtip({
          prerender: false
          ,content: {
            title: stock.name + (stock.symbol ? " (" + stock.symbol + ")" : "")
            ,button: "Close"
            ,text: html
          }
          ,position: {
            my: "top left"
            ,at: "top left"
            ,target: cell
          }
          ,show: {
            event: "click"
            ,solo: true
          }
          ,hide: {
            fixed: true
            ,delay: 300
          }
          ,events: {
            show: (event, api) => {
              $(api.elements.tooltip).find(".controls a").click((clickedLink) => {
                clickedLink = $.getSelectedControl(clickedLink);
                var src = tooltipStockChartUrl
                            .replace("[TIME]", clickedLink.text().replace("max", "SE").toUpperCase())
                            .replace("[ID]", stock.comdirectId);
                clickedLink.parent().parent().find("img").attr("src", src);
              });
            }
          }
        });
      });
    };

    storePortfolioKey = function () {
      if (depot.sharedKey) {
        visitedPortfolioKeys[depot.sharedKey] = depot.title;

        // remove sharedKey if key already exists
        if (Object.keys(visitedPortfolioKeys).some((key) => (key && key.startsWith(depot.sharedKey.substr(1))))) {
          delete visitedPortfolioKeys[depot.sharedKey];
        }
      } else if (depot.key) {
        visitedPortfolioKeys[depot.key] = depot.title;

        // remove sharedKey if key added
        delete visitedPortfolioKeys["s" + depot.key.substring(0, 12)];
      }

      // and here is the functions side effect ;D
      localStorage.setItem("portfoliokeys", JSON.stringify(visitedPortfolioKeys));
    };

    init();
  });

  $.fn.depotTable = function(depot) {
    var depotTable = new DepotTable($(this), depot);
    return depotTable;
  };
})(jQuery);