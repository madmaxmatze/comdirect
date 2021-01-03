// module pattern: https://www.smashingmagazine.com/2011/10/essential-jquery-plugin-patterns/

(function($) { // Depot Table
  var DepotTable = (function($element, depot) {
    var visitedPortfolioKeys = JSON.parse(localStorage.getItem("portfoliokeys"));
    var tooltipStockChartUrl = "https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=[TIME]&TYPE=MOUNTAIN&ID_NOTATION=[ID]";

    init = function() {
      $("html") .addClass("loadingFinished")
                .addClass(depot.sharedKey ? "shareDepot" : "");

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
          + "<th class='limitBottom'>Limit↓</th>"
          + "<th class='limitTop'>Limit↑</th>"
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
      $.logDuration(starttime, "table rendered");
    };

    fillData = function() {
      var sortingZero = -0.0000001;

      var tableBody = $element.find("> table > tbody");
      Object.values(depot.stocks).forEach(function(stock) {
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
              + "<span>" + (stock.count ? $.formatNumber(stock.valueDiffAbsToday, depot.currency) : sortingZero) + "</span>"
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
                  + "<a href='http://www.comdirect.de/inf/musterdepot/pmd/freunde.html?portfolio_key=" + depot.key + "&SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO_PCT&SORTDIR=ASCENDING' target='_blank'>Open</a> | "
                  + "<a href='https://nutzer.comdirect.de/inf/musterdepot/pmd/meineuebersicht.html?name=" + depot.title + "' target='_blank'>Edit</a> </p>"
                + "</p>"
                + "<p>"
                  + "<a href='/s" + depot.key.substring(0, 12) + "' target='_blank'>Share 1k-Peerfolio</a>"
                + "</p>";
      }

      if (visitedPortfolioKeys && Object.keys(visitedPortfolioKeys).length > 1) {
        html += "Recently visited:"
                + "<ul>"
                  + Object.keys(visitedPortfolioKeys).reduce(function(prevVal, key) {
                      return prevVal + (key && visitedPortfolioKeys[key] ? "<li><a href='/" + key + "'>" + visitedPortfolioKeys[key] + "</a></li>" : "");
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
            my: "top right",
            at: "top right"
          },
          show: {
            event: "click",
            solo: true,
            delay: 1
          },
          hide: {
            fixed: true,
            delay: 300
          }
        });
      }
    };

    initTableSorter = function () {
      var sortColumnNumber = $element.find("> table > tfoot > tr > th.valueDiffAbs").addClass("sortcolumn headerSortUp").prevAll().length;

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
        ,usNumberFormat: false
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
          + " <span class='priceDiffAbs'" + $.getStyleColorForNumber(stock.priceDiffPer * 100) + ">" + $.formatNumber(stock.priceDiffAbs, stock.currency, 2, true) + "</span>"
          + (typeof stock.priceDiffPer !== "undefined" ?
            " <span class='priceDiffPer'" + $.getStyleColorForNumber(stock.priceDiffPer * 100) + ">" + $.formatNumber(stock.priceDiffPer, "%", null, true) + "</span>"
            : "")
          + (stock.limitBottom || stock.limitTop ?
              "<br>"
              + (stock.limitBottom ? "<span" + (stock.isBelowLimit ? " class='alert'" : "") + ">" + $.formatNumber(stock.limitBottom, stock.currency, 2) + " < </span>" : "")
              + "Limit"
              + (stock.limitTop ? "<span" + (stock.isAboveLimit ? " class='alert'" : "") + "> > " + $.formatNumber(stock.limitTop, stock.currency, 2) + "</span>" : "")
            : "")
        + "</p>";

        if (stock.count) {
          html += "<p>"
            + "Diff Today: <span class='valueDiffAbsToday'" + $.getStyleColorForNumber(stock.valueDiffAbsToday) + ">" +
              $.formatNumber(stock.valueDiffAbsToday, depot.currency, 2)
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

          + (stock.note ? "<p><i>\"" + stock.note + "\"</i></p>" : "");
        }

        html += "<p>"
          + stock.market + " | " + stock.type
          + (stock.wkn ? " | " + stock.wkn : "")
          + (stock.isin ? " | " + stock.isin : "")
          + " | age " + $.formatDuration(stock.dateAge) + "<br>"
        + "</p>"

        + "<p>"
          + "<a href='https://www.comdirect.de/inf/aktien/detail/uebersicht.html?ID_NOTATION=" + stock.comdirectId + "' target='_blank'><img src='https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w32' width='32' /></a> "
          + (stock.isin ?
            "<a href='https://aktie.traderfox.com/visualizations/" + stock.isin + "' target='_blank'><img src='https://pbs.twimg.com/profile_images/797361743626465280/eAhqkp1P_400x400.jpg' width='32' /></a> "
            + "<a href='http://markets.businessinsider.com/searchresults?_search=" + stock.isin + "' target='_blank'><img src='https://i.insider.com/596e4e7a552be51d008b50fd?width=600&format=jpeg&auto=webp' width='32' /></a> "
            + "<a href='http://m.ariva.de/search/search.m?searchname=" + stock.isin + "' target='_blank'><img src='https://pbs.twimg.com/profile_images/435793734886645760/TmtKTE6Y.png' width='32' /></a> "
            + "<a href='https://www.onvista.de/aktien/" + stock.isin + "' target='_blank'><img src='https://s.onvista.de/css-69545/web/portal/nl/layout_img/favicon.png' width='32' /></a> "
            + "<a href='http://www.finanzen.net/suchergebnis.asp?_search=" + stock.isin + "' target='_blank'><img src='https://images.finanzen.net/images/favicon/favicon-32x32.png' width='32' /></a> "
            + "<a href='https://www.consorsbank.de/euroWebDe/-?$part=Home.security-search&$event=search&pattern=" + stock.isin + "' target='_blank'><img src='https://www.consorsbank.de/content/dam/de-cb/system/images/evr/favicon.ico' width='32' /></a> "
            : "")
          + (stock.symbol ?
             "<a href='https://finance.yahoo.com/quote/" + stock.symbol + "' target='_blank'><img src='https://finance.yahoo.com/favicon.ico' width='32' /></a> "
             + "<a href='https://www.google.de/search?tbm=fin&q=" + stock.symbol + "' target='_blank'><img src='https://www.google.de/images/branding/product/ico/googleg_lodp.ico' width='32' /></a> "
            : "")
          + (stock.isin && stock.type == "ETF" ?
             "<a href='https://www.justetf.com/de/etf-profile.html?isin=" + stock.isin + "' target='_blank'><img src='https://www.justetf.com/images/logo/justetf_icon_m.png' width='32' /></a> "
             + "<a href='https://de.extraetf.com/etf-profile/" + stock.isin + "' target='_blank'><img src='https://de.extraetf.com/favicon.ico' width='32' /></a> "
             + "<a href='https://www.trackingdifferences.com/ETF/ISIN/" + stock.isin + "' target='_blank'><img src='https://www.trackingdifferences.com/images/favicon-32.png' width='32' /></a> "
            : "")
          + (stock.wkn && stock.type == "Stock" ?
            "<a href='http://www.finanznachrichten.de/suche/suchergebnis.asp?words=" + stock.wkn + "' target='_blank'><img src='https://fns1.de/g/fb.png' width='32' /></a> "
            : "")
          + "<div class='chart'>"
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
            show: function(event, api) {
              $(api.elements.tooltip).find(".controls a").click(function(clickedLink) {
                clickedLink = $.getSelectedControl(clickedLink);
                var src = tooltipStockChartUrl
                            .replace("[TIME]", clickedLink.text().replace("max", "SE").toUpperCase())
                            .replace("[ID]", stock.comdirectId);
                var img = clickedLink.parent().parent().find("img").attr("src", src);
              });
            }
          }
        });
      });
    };

    storePortfolioKey = function () {
      // save all portfolios
      if (!visitedPortfolioKeys) {
        visitedPortfolioKeys = {};
      }

      if (depot.sharedKey) {
        visitedPortfolioKeys[depot.sharedKey] = depot.title + " (Public 1k)";

        // remove sharedKey if key already exists
        if (JSON.stringify(visitedPortfolioKeys).search("\"" + depot.sharedKey.substr(1)) > 0) {
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



(function($) { // PortfolioHistoryChart
  var PortfolioHistoryChart = (function($element, depot) {
    var dataTables = [];
    var dataView = null;
    var filterStockId = 0;
    var duration = 184;
    var chart = null;
    var chartOptions = {
      width: "100%"
      ,height: 400
      ,hAxis: {
        textStyle : {
          fontSize : 12
        }
      }
      ,backgroundColor : "transparent"
      ,animation: {
        duration: 600
        ,easing: "inAndOut"
      }
      ,focusTarget: "category"
      ,chartArea: {
        top: 10
        ,bottom: 40
        ,left: 40
        ,right: 40
      }
      ,tooltip: {isHtml: true}
      ,isStacked: "absolute"
      ,vAxes: [
        {
          format: "short"
          ,textStyle : {fontSize: 12}
        }
        ,{
          gridlines: {count : 0}
          ,format: "percent"
          ,textStyle : {fontSize: 12}
          ,viewWindowMode : "maximized"
        }
      ]
      ,annotations: {
        textStyle: {
          fontSize: 8
          ,color: "#000000"
          ,auraColor: "#FFFFFF"
        }
      }
      ,legend: "none"
      ,seriesType: "area"
      ,series: [
        {
          targetAxisIndex: 0
          ,lineWidth: 0
          ,color: "#AAA"    // gray area
        }
        ,{
          targetAxisIndex: 0
          ,lineWidth: 0
          ,color: "#006600"    // green area
        }
        ,{
          targetAxisIndex: 0
          ,lineWidth: 0
          ,color: "#FFBBBB"    // red area
        }
        ,{
          targetAxisIndex: 0
          ,type: "line"
          ,lineWidth: 1
        }
        ,{
          targetAxisIndex: 1   // right axis percentage
          ,type: "line"
          ,lineWidth: 1
        }
      ]
    };

    init = function() {
      drawChart();

      if ($("html").hasClass("darkmode")) {
        chartOptions.hAxis.textStyle.color = "#DDD";
        chartOptions.vAxes[0].textStyle.color = "#DDD";
        chartOptions.vAxes[0].gridlines = {color : "#444"};
        chartOptions.vAxes[0].minorGridlines = {color : "#444"};

        chartOptions.vAxes[1].textStyle.color = "#DDD";
        chartOptions.vAxes[1].baselineColor = {color : "#AAA"};

        chartOptions.series[0].color = "#FFF";
        chartOptions.series[1].color = "#00FF00";
        chartOptions.series[2].color = "#FF0000";
        chartOptions.series[4].lineWidth = 2;
      }

      $(window).on("resizeEnd", drawChart);

      $element.append("<div></div>"
       + "<div class='history_info'></div>"
       // <a data-duration='31'>1m</a> <a data-duration='184'>6m</a> <a data-duration='365'>1y</a> 
       + "<div class='controls'>"
        + "<select id='duration_filter'>"
          + "<option value='31'>1m</option>"
          + "<option value='184' selected='selected'>6m</option>"
          + "<option value='365'>1y</option>"
          + "<option value='100000'>max</option>"
        + "</select>"
        + "<select id='stock_filter'>"
          + "<option value='0'>All</option>"
          + "<optgroup label='Current'></optgroup>"
          + "<optgroup label='Old'></optgroup>"
         + "</select>"
       + "</div>"
      );

      $element.find("select").on("change", function() {
        duration = $("#duration_filter").val();
        filterStockId = $("#stock_filter").val();
        drawChart();
      });

      chart = new google.visualization.ComboChart($element.find("div")[0]);
    };

    loadHistoryData = function () {
      $.ajax({
        url: "https://peerfol.io/data.php"
        ,data: {
          type : "history"
          ,portfolio_key : (depot.key ? depot.key : depot.sharedKey)
          ,filterStockId : filterStockId
        }
        ,jsonp: "wrapper"
        ,dataType: "jsonp"
        // ,jsonpCallback: 'historyData'
        ,async: true // not working with jsonp
        ,success: function(response) {
          // date loaded
          prepareDataTable(response);
          drawChart();
        }
      });
    };

    prepareDataTable = function(response){
      filterStockId = response.stockFilterUsed;

      dataTables[filterStockId] = new google.visualization.DataTable(
        {cols: [
           {type: "date", label: "Date"}
          ,{type: "string", role: "tooltip", p: {"html": true}}
          ,{type: "number", label: "GreyArea"}
          ,{type: "number", label: "GreenArea"}
          ,{type: "number", label: "RedArea"}
          ,{type: "number", label: "AbsLine"}
          ,{type: "string", role: "style"}  // line style
          ,{type: "number", label: "PercLine"}
          ,{type: "string", role: "style"}  // line style
      ]});

      var rows = Object.keys(response.rows).map(dateString => {
        var date = new Date(dateString);
        date.setHours(0, -date.getTimezoneOffset(), 0, 0);  //removing the timezone offset
        var value = response.rows[dateString][0];
        var diff = response.rows[dateString][1];
        var count = response.rows[dateString][2];

        return [
          date
          ,$.getPnlTable({
            headline : date.toISOString().substr(0, 10) + ", " + $.getWeekday(date)
            ,valueCurrency : "€"
            ,valueStart : (value - diff)
            ,valueEnd : value
            ,count : (count ? count : null)
            ,priceStart : (count ? (value - diff) / count : null)
          })
          ,(value - Math.max(diff, 0))                    // gray
          ,Math.max(diff, 0)                              // green
          ,Math.abs(Math.min(diff, 0))                    // red
          ,value                                          // Abs Line
          ,"color:" + (diff > 0 ? "#99AA99" : "#FFCCCC")  // absLineStyle
          ,diff / (value - diff)                          // percLine
          ,"color:" + (diff > 0 ? "green" : "red")        // percLineStyle
        ];
      });
      dataTables[filterStockId].addRows(rows);

      if (dataTables.length == 1) {   // only update filters the first time
        updateFilters(response.stockFilterAvailable);
      }
    };

    updateFilters = function(stockFilterAvailable) {
      var dateRange = dataTables[filterStockId].getColumnRange(0);
      if (dateRange.min && dateRange.max) {
        var minYear = dateRange.min.getFullYear();
        var maxYear = dateRange.max.getFullYear();
        if (minYear != maxYear) {
          // $element.find("select").show();
          for (y = minYear; y <= maxYear; y+=1) {
            $("#duration_filter").append("<option value='" + y + "'>" + y + "</option>");
          }
        }
      }

      for (const [comdirectId, name] of Object.entries(stockFilterAvailable).sort((a, b) => a[1] > b[1] ? 1 : -1)) {
        var isCurrentStock = (depot.stocks[comdirectId] && depot.stocks[comdirectId].count);
        $("#stock_filter optgroup:nth-child(" + (isCurrentStock ? 2 : 3) + ")").append(
          "<option value='" + comdirectId + "'>" + (name ? name : comdirectId) + "</option>"
        );
      }
    };

    updateStatsBelowChart = function(dataTableVisibleRowIds) {
      var startProfit = null;
      var endProfit = 0;
      var sumBuyValue = 0;
      var sumValue = 0;
      dataTableVisibleRowIds.forEach(function(rowId) {
        endProfit = dataTables[filterStockId].getValue(rowId, 3) - dataTables[filterStockId].getValue(rowId, 4); // profit - loss
        if (startProfit === null) {
          startProfit = endProfit;
        }
        sumBuyValue += dataTables[filterStockId].getValue(rowId, 2) + dataTables[filterStockId].getValue(rowId, 4); // value + loss
        sumValue += dataTables[filterStockId].getValue(rowId, 2) + dataTables[filterStockId].getValue(rowId, 3) + dataTables[filterStockId].getValue(rowId, 4); // value + loss + profit
      });

      $element.find(" > div:nth-child(2)").html(
        "<b>Ø BuyValue</b> " + $.formatNumber(sumBuyValue / dataTableVisibleRowIds.length, "€")
        + " | <b>Ø Value</b> " + $.formatNumber(sumValue / dataTableVisibleRowIds.length, "€")
        + " | <b>Profit</b> " + $.formatNumber(endProfit - startProfit, "€", 0, true)
        + " | <b>Profit/BuyValue</b> " + $.formatNumber((endProfit - startProfit) / (sumBuyValue / dataTableVisibleRowIds.length) * 100, "%", null, true)
        + " (excl. realised profit)"
      );
    };

    drawChart = function() {
      if (!dataTables[filterStockId]) {
        loadHistoryData();
        return;
      }
      
      var minDate = new Date().setDate((new Date()).getDate() - duration);
      var maxDate = new Date();

      if (duration > 1000 && duration < 3000) {     // a year
        minDate = new Date(duration, 0, 1);
        maxDate = new Date(duration, 11, 31, 23, 59, 59);
      }

      // filter fo date range
      var dataTableVisibleRowIds = dataTables[filterStockId].getFilteredRows([{
        column: 0
        ,minValue: minDate
        ,maxValue: maxDate
      }]);
      dataView = new google.visualization.DataView(dataTables[filterStockId]);
      dataView.setRows(dataTableVisibleRowIds);
      chart.draw(dataView, chartOptions);

      /* export to image
      google.visualization.events.addListener(chart, 'ready', function () {
         $element.controls.append($("<a href='" + chart.getImageURI() + "' target='_blank'>img</a>"));
      });
      */

      updateStatsBelowChart(dataTableVisibleRowIds);
    };

    init();
  });

  $.fn.portfolioHistoryChart = function(depot) {
    new PortfolioHistoryChart($(this), depot);
    return this;
  };
})(jQuery);



(function($) { // ProfitAndLossChart
  var ProfitAndLossChart = (function($element, depot) {
    var dataTable = null;
    var dataView = null;
    var sortColumn = 0;
    var chartOptions = {
      bar: {groupWidth: "80%"}
      ,bars: "horizontal"
      ,legend: { position: "none" }
      ,isStacked: true
      ,focusTarget: "category"
      ,theme: "material"
      ,width: "100%"
      ,height: 600
      ,backgroundColor : "transparent"
      ,hAxis: {
        format : "short"
      }
      ,vAxis : {
        maxTextLines : 1
      }
      ,chartArea: {
        top: 10
        ,bottom: 25
        ,left: 140
        ,right: 25
      }
      ,tooltip: {isHtml: true}
      ,annotations: {
        datum : {
          stem : {
            length : 4
            ,color : "transparent"
          }
        }
        ,style: "point"
        ,textStyle: {
          fontSize: 10
          ,bold: true
          ,color: "#111"
        }
      }
      ,series: [
        {
          targetAxisIndex: 0
          ,lineWidth: 0
          ,color: "#777777"    // gray area
        }
        ,{
          targetAxisIndex: 0
          ,lineWidth: 0
          ,color: "#006600"    // green area
        }
        ,{
          targetAxisIndex: 0  // red area
          ,lineWidth: 0
          ,dataOpacity: 0.1
          ,color: "#ff7777"
        }
      ]
    };

    init = function() {
      if ($("html").hasClass("darkmode")) {
        chartOptions.hAxis = {textStyle: {color: "#DDD"}};
        chartOptions.vAxis = chartOptions.hAxis;
        chartOptions.annotations.textStyle.color = "#DDD";
        chartOptions.series[2].dataOpacity = 0.3;
      }

      prepData();
      $(window).on("resizeEnd", drawBarChart);

      $element.html("<div style='padding-top:13px'></div> <div class='controls'><a>total</a> <a>abs</a> <a>rel</a></div>");
      $element.find("a").click(function (clickedLink) {
        clickedLink = $.getSelectedControl(clickedLink);
        sortColumn = clickedLink.prevAll().length;
        drawBarChart();
      }).first().click();
    };

    prepData = function () {
      dataTable = new google.visualization.DataTable({
        cols: [
           {type: "number", label: "absSort"}
          ,{type: "number", label: "relSort"}
          ,{type: "number", label: "totalSort"}
          ,{type: "string", label: "Name"}
          ,{type: "string", role: "tooltip", p: {"html": true}}
          ,{type: "number", label: "Gray"}
          ,{type: "number", label: "Green"}
          ,{type: "string", role: "style"}
          ,{type: "string", role: "annotation"}
          ,{type: "number", label: "Red"}
      ]});

      dataTable.addRows(
        Object.values(depot.stocks)
        .filter(stock => stock.count > 0)
        .map(stock => {
          var tooltipHtml = $.getPnlTable({
            headline : stock.name.substr(0, 50),
            valueCurrency : depot.currency,
            valueStart : stock.buyValue,
            valueEnd : stock.value,
            priceCurrency : stock.currency,
            priceStart : stock.buyPrice,
            priceEnd : stock.price
          });

          return [
            stock.value                                 // FOR TOTAL SORTING
            ,stock.valueDiffAbs                         // FOR ABS SORTING
            ,stock.valueDiffPer                         // FOR REL SORTING
            ,stock.name                                 // label
            ,tooltipHtml                                // tooltip
            ,Math.min(stock.value, stock.buyValue)      // gray
            ,Math.max(0, stock.valueDiffAbs)            // green
            ,"color:" + (stock.valueDiffPer > 1 ? "#007700" : (stock.valueDiffPer < -1 ? "#FF0000" : "#777777"))
            ,$.formatNumber(stock.valueDiffPer, "%", null, true) // annotation
            ,Math.max(0, stock.valueDiffAbs * -1)       // red
          ];
        })
      ); 

      dataView = new google.visualization.DataView(dataTable);
    };

    drawBarChart = function() {
      chartOptions.height = dataView.getNumberOfRows() * 20 + 80;
      dataView.setRows(dataTable.getSortedRows({column: sortColumn}));
      dataView.hideColumns([0,1,2]); // remove sort columns

      var chart = new google.visualization.BarChart($element.find("div:first")[0]);
      chart.draw(dataView, chartOptions);
    };

    init();
  });

  $.fn.profitAndLossChart = function(depot) {
    new ProfitAndLossChart($(this), depot);
    return this;
  };
})(jQuery);



(function($) { // ShareChart
  var ShareChart = (function($element, depot) {
    var dataTables = [];
    var duration = 0;
    var chart = null;
    var isDarkMode = ($element.parents(".darkmode").length > 0);
    var chartOptions = {
      animation: {
        duration: 300
        ,easing: "inAndOut"
      }
      ,highlightOnMouseOver: true
      ,maxDepth: 0
      ,headerHeight: 0
      ,showScale: false
      ,minColorValue: -50
      ,maxColorValue: 50
      ,fontColor: (isDarkMode ? "#DDD" : "#000000")
      ,noColor: (isDarkMode ? "#000000" : "#F5F5F5")
      ,minColor: "#ff0000"
      ,midColor: (isDarkMode ? "#333" : "#cccccc")
      ,maxColor: "#009900"
      ,width: "100%"
      ,height: 400
      ,generateTooltip: function (row, share, color) {
        return dataTables[duration].getValue(row, 4);
      }
    };

    init = function() {
      $element.html("<div></div><div class='controls'><a>today</a>| <a>total</a> <a>type</a></div>");

      prepareTreeDataTables();

      $(window).on("resizeEnd", drawTreeChart);

      chart = new google.visualization.TreeMap($element.find("div:first")[0]);
      google.visualization.events.addListener(chart, "select", function () {
        chart.setSelection([]);
      });

      $element.find("a").click(function (clickedLink) {
        clickedLink = $.getSelectedControl(clickedLink);
        duration = clickedLink.prevAll("a").length;
        drawTreeChart();
      }).first().click();
    };

    prepareTreeDataTables = function(){
      var rootKey = "Portfolio";

      dataTables[0] = new google.visualization.DataTable({
        cols: [
           {type: "string", label: "Label"}
          ,{type: "string", label: "Parent"}
          ,{type: "number", label: "Size"}
          ,{type: "number", label: "Color"}
          ,{type: "string", label: "Tooltip"}
        ],
        rows: [{c:[{v:rootKey},{v:""},{v:0},{v:0},{v:""}]}] // add root
      });
      dataTables[1] = dataTables[0].clone();
      dataTables[2] = dataTables[0].clone();

      var typeData = {};

      Object.values(depot.stocks)
      .filter(stock => stock.count > 0)
      .forEach(function (stock) {
        var label = stock.name;
        if (stock.symbol) {
          label = (stock.symbol.length < label.length ? stock.symbol : label.toUpperCase());
        }

        var share = stock.value / depot.value * 100;
        var sharelabel = $.formatNumber(share, "%");
        var todayLabel = $.formatNumber(stock.priceDiffPer, "%", (Math.abs(stock.priceDiffPer) >= 10 ? 0 : 1), true);
        var totalLabel = $.formatNumber(stock.valueDiffPer, "%", (Math.abs(stock.valueDiffPer) >= 10 ? 0 : 1), true);

        var tooltip = "<div class='treemapTooltip'>"
          + "<b>" + stock.name + (stock.symbol ? " ("  + stock.symbol + ")" : "") + "</b><br>"
          + "Perf total: <span " + $.getStyleColorForNumber(stock.valueDiffPer) + ">"
            + $.formatNumber(stock.valueDiffPer, "%", null, true)
          + "</span><br>"
          + (stock.isDataFromToday ? "Perf today: <span " + $.getStyleColorForNumber(stock.priceDiffPer * 10) + ">"
            + $.formatNumber(stock.priceDiffPer, "%", null, true)
            + "</span><br>" : "")
          + "Share: " + $.formatNumber(share, "%")
        + " </div>";

        dataTables[0].addRow([
          label + " (" + (stock.isDataFromToday ? todayLabel + ", " : "") + sharelabel + ")"
          ,rootKey
          ,stock.value / depot.value
          ,(stock.isDataFromToday ? stock.priceDiffPer : null)  * 10 // change range from +-5 to +-50
          ,tooltip
        ]);

        dataTables[1].addRow([
          label + " (" + totalLabel + ", " + sharelabel + ")"
          ,rootKey
          ,stock.value / depot.value
          ,stock.valueDiffPer
          ,tooltip
        ]);

        // collect typechart data
        if (!typeData[stock.type]) {
          typeData[stock.type] = {"value":0, "diff":0};
        }
        typeData[stock.type].value += stock.value;
        typeData[stock.type].diff += stock.valueDiffAbs;
      });

      dataTables[2].addRows(
        Object.keys(typeData).map(function (type) {
          var share = typeData[type].value / depot.value * 100;
          var diffPer = typeData[type].diff / (typeData[type].value - typeData[type].diff) * 100;
          return [
            type + " (" + $.formatNumber(diffPer, "%", null, true) + ", " + $.formatNumber(share, "%") + ")"
            ,rootKey
            ,share
            ,diffPer
            ,"<div class='treemapTooltip'>"
              + "<b>" + type + "</b><br>"
              + "Perf: <span " + $.getStyleColorForNumber(diffPer) + ">"
                + $.formatNumber(diffPer, "%", null, true)
              + "</span><br>"
              + "Share: " + $.formatNumber(share, "%") + "<br>"
            + " </div>"
          ]
        })
      );
    };

    drawTreeChart = function() {
      chart.draw(dataTables[duration], chartOptions);
    };

    init();
  });

  $.fn.shareChart = function(depot) {
    new ShareChart($(this), depot);
    return this;
  };
})(jQuery);



(function($) { // DepotDevelopmentChart
  var DepotDevelopmentChart = (function($element, depot) {
    var top10stocks = Object.values(depot.stocks)
                      .filter(x => x.count > 0)
                      .sort((a, b) => (a.value > b.value) ? 1 : -1)
                      .slice(-10)
                      .reverse();
    
    // add MSCI WORLD to beginning of the array
    top10stocks.unshift({
      name : "MSCI WORLD"
      ,comdirectId : "12221463"
      ,value : 0
    });

    // comdirect: black,   green,   lime,    red,     purple,  blue,    pink,    green,   d.orange,d.yellow,cyan
    var colors = ["000000","056937","999900","cc0000","990099","330099","ff92ff","00cc33","ff6600","ffd21f","00FFFF"];

    var top10value = top10stocks.reduce((prevVal, stock) => prevVal + stock.value, 0);
    $element.html("<b>Top10 Stocks (" + Math.round(top10value / depot.value * 100) + "% of total)</b><br>"
      + "<img src='' /><br />"
      + top10stocks.reduce((prevVal, stock, i) => {
          return prevVal
              + "<span style='color: " + (i ? "white" : "#" + colors[i]) + "; font-size: 10pt;"
                + " white-space: nowrap; background-color: " + (i ? "#" + colors[i] : "transparent;") + ";'> "
                + stock.name
              + " </span> &#160;";
        }, '')
      + "<br>"
      + "<div class='controls' style='top:50px'><a>10d</a> <a>6m</a> <a>1y</a> <a>5y</a> <a>max</a></div>"
    );

    $element.find("a").click(function (clickedLink) {
      clickedLink = $.getSelectedControl(clickedLink);

      $element.find("img").fadeOut("fast", function () {
        var src = "https://charts.comdirect.de/charts/rebrush/design_large.chart?TYPE=CONNECTLINE&TIME_SPAN=TIMEPLACEHOLDER&AXIS_SCALE=log&DATA_SCALE=rel&LNOTATIONS=IDPLACEHOLDER&LCOLORS=COLORPLACEHOLDER&AVGTYPE=simple&HCMASK=3&SHOWHL=0"
                    .replace("TIMEPLACEHOLDER", clickedLink.text().replace("max", "SE").toUpperCase())
                    .replace("IDPLACEHOLDER", top10stocks.map(stock => stock.comdirectId).join("+"))
                    .replace("COLORPLACEHOLDER", colors.join("+"));
        $(this).attr("src", src).fadeIn("fast");
      });
    }).first().click();
  });

  $.fn.depotDevelopmentChart = function(depot) {
    new DepotDevelopmentChart($(this), depot);
    return this;
  };
})(jQuery);



(function ($) { // $.extend.function
  // create trigger to resizeEnd event
  // https://stackoverflow.com/questions/8950761/google-chart-redraw-scale-on-window-resize
  $(window).resize(function() {
    if(this.resizeTO) {
      clearTimeout(this.resizeTO);
    }
    this.resizeTO = setTimeout(function() {
      if (!window.lastResizeWidth || Math.abs(window.lastResizeWidth - window.innerWidth) > 5) {
        window.lastResizeWidth = window.innerWidth;
        $(this).trigger("resizeEnd");
      }
    }, 500);
  });

  $.extend({
    logDuration: function(startTime, stepTitle) {
      var duration = (new Date()).getTime() - startTime.getTime();
      console.log (duration + "ms - " + stepTitle);
    },

    getSelectedControl: function (clickedControl) {
      clickedControl = $(clickedControl.target);
      clickedControl.addClass("active").siblings().removeClass("active");
      return clickedControl;
    },

    getWeekday: function (date) {
      var weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      return weekdays[date.getDay()];
    },

    getStyleColorForNumber: function (numberBetweenMinusAndPlus100, includingStyleTag) {
      return " style='color:" + $.getColorForNumber(numberBetweenMinusAndPlus100, includingStyleTag) + "' ";
    },

    getColorForNumber: function (numberBetweenMinusAndPlus100, includingStyleTag) {
      var minColor = 80;
      var maxColor = 230;
      var number = numberBetweenMinusAndPlus100  * (maxColor - minColor) / 100;
      var red = Math.round(Math.min(maxColor, minColor - Math.min(number, 0)));
      var green = Math.round(Math.min(maxColor, minColor + Math.max(number, 0)));

      return "rgb(" + red + "," + green + "," + minColor + ")";
    },

    formatDuration: function (durationInSecond) {
      if (!durationInSecond) {return "";}

      var diffsFormated = [];
      var diffs = {
        y : 60 * 60 * 24 * 365,
        w : 60 * 60 * 24 * 7,
        d : 60 * 60 * 24,
        h : 60 * 60,
        m : 60,
        s : 1
      };

      Object.keys(diffs).forEach(function(d) {
        if (durationInSecond >= diffs[d]) {
          diffsFormated.push(Math.floor(durationInSecond / diffs[d]) + d);
          durationInSecond = durationInSecond % diffs[d];
        }
      });

      return diffsFormated.slice(0, 2).join(" ");
    },

    formatNumber: function (number, type, decimals, includeSign) {
      if (!number) {
        number = 0;
        decimals = (decimals ? decimals : 0);
      }

      /*
       * without decimals defined:
       * - 100.123  -> 100
       * - 10.123   -> 10
       * - 1.123    -> 1.1
       * - 0.123    -> 0.12
       */
      if (decimals === null || typeof decimals === "undefined") {
        decimals = Math.ceil(Math.max(0, 1 - Math.log10(Math.abs(number))));
      }
      decimals = Math.min(decimals, 2);

      var formatOptions = {
        maximumFractionDigits : decimals,
        minimumFractionDigits : decimals
      };

      var formatter = new Intl.NumberFormat("de-DE", formatOptions);
      return  (includeSign && number > 0 ? "+" : "")
          + formatter.format(number)
          + (type === "percent" || type === "%" ? "%" : "")
          + (type === "EUR" || type === "€" ? "€" : "")
          + (type === "DOL" || type === "USD" ? "$" : "")
      ;
    },

    getPnlTable: function (options) {
      var diff = options.valueEnd - options.valueStart;
      var diffPercent = diff / options.valueStart * 100;

      return "<table class='pnlTable'>"
        + (options.headline ? "<tr><th colspan='3'>" + options.headline + "</th></tr>" : "")
        + "<tr>"
          + "<td></td>"
          + "<td>"
            + $.formatNumber(options.valueStart, options.valueCurrency, 0)
          + "</td>"
          + "<td class='price'>"
            + (options.priceStart ?
              "("
                + (options.count ? "=" + $.formatNumber(options.count) + " x " : "")
                + $.formatNumber(options.priceStart, options.priceCurrency, 2)
              + ")" : "")
          + "</td>"
        + "</tr>"
        + "<tr" + $.getStyleColorForNumber(diffPercent > 0 ? 70 : -70) + ">"
          + "<td>"
            + (diffPercent > 0 ? "+" : "-")
          + "</td><td>"
            + $.formatNumber(Math.abs(diff), options.valueCurrency, 0)
          + "</td><td class='diff'>"
            + "(" + $.formatNumber(diffPercent, "%", null, true) + ")"
          + "</td>"
        + "</tr>"
        + "<tr>"
          + "<td colspan='2' class='total'>"
            + $.formatNumber(options.valueEnd, options.valueCurrency, 0)
          + "</td>"
          + "<td class='price'>"
            + (options.priceEnd ? "(" + $.formatNumber(options.priceEnd, options.priceCurrency, 2) + ")" : "")
          + "</td>"
        + "</tr>"
      + "</table>";
    },

    isDarkmode: function () {
      var url = new URL(window.location);
      return (url.searchParams.get("dark") || window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  });
})(jQuery);



(function ($) { // Depot loader
  $.extend({
    initDepot: function () {
      var url = new URL(window.location);
      var portfolioKey = url.searchParams.get("portfolio_key");
      var islocalCachingAllowed = url.searchParams.get("cache");

      var matches = window.location.pathname.substr(1).match(/^(\w+)$/ig);
      if (matches) {
        portfolioKey = matches[0];
      }
      if (!portfolioKey) {return;}


      var handleDepotJson = function(depot){
        if (islocalCachingAllowed) {
          sessionStorage.setItem("cachedDepot", JSON.stringify(depot));
        }

        var today = (new Date());
        depot.value = 0;
        depot.valueDiffAbsToday = 0;

        Object.keys(depot.stocks).forEach(function(id) {
          depot.stocks[id].priceDiffPer = Math.round(depot.stocks[id].priceDiffAbs / (depot.stocks[id].price - depot.stocks[id].priceDiffAbs) * 10000) / 100;

          if (depot.stocks[id].limitTop && depot.stocks[id].price > depot.stocks[id].limitTop) {
            depot.stocks[id].isAboveLimit = true;
          }
          if (depot.stocks[id].limitBottom && depot.stocks[id].price < depot.stocks[id].limitBottom) {
            depot.stocks[id].isBelowLimit = true;
          }

          if (!depot.stocks[id].note) {
            depot.stocks[id].note = "";
          }

          if (depot.stocks[id].date) {
            depot.stocks[id].date = new Date(depot.stocks[id].date);

            depot.stocks[id].isDataFromToday =  today.getFullYear() === depot.stocks[id].date.getFullYear() &&
                              today.getMonth() === depot.stocks[id].date.getMonth() &&
                              today.getDate() === depot.stocks[id].date.getDate();

            depot.stocks[id].dateAge = (today.getTime() - depot.stocks[id].date.getTime()) / 1000;

            depot.stocks[id].isDataOld = (depot.stocks[id].dateAge > 1800);

            if (!depot.date || depot.date < depot.stocks[id].date) {
              depot.date = depot.stocks[id].date;
            }
          }

          if (depot.stocks[id].count) {
            depot.value += depot.stocks[id].value;
            if (depot.stocks[id].isDataFromToday) {
              depot.valueDiffAbsToday += depot.stocks[id].valueDiffAbsToday;
            }

            depot.stocks[id].buyDate = new Date(depot.stocks[id].buyDate);
            depot.stocks[id].buyDateAge = (today.getTime() - depot.stocks[id].buyDate.getTime()) / 1000;

            depot.stocks[id].valueDiffAbs = depot.stocks[id].value - depot.stocks[id].buyValue;
            depot.stocks[id].valueDiffPer = Math.round(depot.stocks[id].valueDiffAbs / depot.stocks[id].buyValue * 10000) / 100;
          }
        });

        if (depot.date) {
          depot.isDataFromToday =  today.getFullYear() === depot.date.getFullYear()
                                && today.getMonth() === depot.date.getMonth()
                                && today.getDate() === depot.date.getDate();
        }

        $("body").prepend(
          "<h1><a href='https://peerfol.io'>peerfol.io</a></h1>"
          + "<div class='shareDepotInfo'><b>Please note:</b> This portfolio is <b>scaled to 1000€</b> to allow public sharing. The actual total depot value is larger.</div>"
          + "<div id='depot_table'></div>"
          + "<div id='depot_chart_share' class='chart'></div>"
          + "<div id='depot_chart_history' class='chart'></div>"
          + "<div id='depot_chart_pnl' class='chart'></div>"
          + "<div id='depot_chart_dev' class='chart'></div>"
          + "<div id='depot_credits' class='chart'>More information: "
            + "<a href='https://peerfol.io' target='_blank'>peerfol.io</a>"
          + "</div>"
        );

        $("head title").text(depot.title);

        $("#depot_table").depotTable(depot);

        google.charts.load("current", {"packages": ["corechart", "treemap", "bar"]});
        google.charts.setOnLoadCallback(function() {
          $.logDuration(starttime, "chart lib loaded");

          $("#depot_chart_share").shareChart(depot);
          $("#depot_chart_history").portfolioHistoryChart(depot);
          $("#depot_chart_pnl").profitAndLossChart(depot);
          $("#depot_chart_dev").depotDevelopmentChart(depot);
          // last 12 months chart: https://developers.google.com/chart/interactive/docs/gallery/calendar

          $.logDuration(starttime, "charts rendered");
        });
      }

      $.ajax({
        url: "https://peerfol.io/data.php"
        ,data : {
          type : "stocks"
          ,portfolio_key : portfolioKey
        }
        ,jsonp: "wrapper"
        ,dataType: "jsonp"
        // ,jsonpCallback: 'historyData'
        ,async: true // not working with jsonp
        ,beforeSend: function() {
          if (islocalCachingAllowed) {
            var cachedDepot = sessionStorage.getItem("cachedDepot");
            if (cachedDepot) {
              $.logDuration(starttime, "data loaded from cache");

              handleDepotJson($.parseJSON(cachedDepot));
              return false;
            }
          }
        }
        ,success: function (depot) {
          $.logDuration(starttime, "data loaded (" + depot.loadtime + "ms server side)");
          handleDepotJson(depot);
        }
      });
    }
  });
})(jQuery);



$(function() { // main
  $.logDuration(starttime, "js loaded");

  $("html").addClass($.isDarkmode() ? "darkmode" : "lightmode");

  $.initDepot();
});