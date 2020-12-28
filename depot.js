// module pattern: https://www.smashingmagazine.com/2011/10/essential-jquery-plugin-patterns/

(function($) { // Depot Table
  var DepotTable = (function($element, depot) {
    var visitedPortfolioKeys = JSON.parse(localStorage.getItem('portfoliokeys'));
    var tooltipStockChartUrl = "https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=[TIME]&TYPE=MOUNTAIN&ID_NOTATION=[ID]"

    init = function() {
      $("html").addClass("loadingFinished");

      if (depot.sharedKey) {
        $("html").addClass("shareDepot");
        $("body").prepend("<div class='shareDepotLabel'>Please note: This portfolio is <b>scaled to 1000€</b> to allow public sharing. The actual total depot value is larger.</div>");
      }

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
      for (var id in depot.stocks) {
        var stock = depot.stocks[id];
        tableBody.append(
          $("<tr>")
            .data("stock", stock)
            .addClass(stock.count ? "" : "watchlist")
            .addClass(stock.isDataFromToday ? "" : "isDataFromYesterday")
            .addClass(stock.isDataOld ? "isDataOld" : "")
            .append("<td class='iterator'>"
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
      }

      refreshFooter();
    };

    refreshFooter = function() {
      var buyValue = 0;
      var value = 0;
      var buyDateAgeAverage = 0;
      var valueDiffAbsToday = 0;

      $element.find('> table > tbody > tr:visible').each(function(){
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
         
      var footerFields = $element.find('> table > tfoot > tr > th');
      footerFields.filter('.buyDate').html($.formatDuration(buyDateAgeAverage));
      footerFields.filter('.buyValue').html("<span" + (depot.sharedKey ? " class='shareDepotLabel'" : "") + ">"
                      + $.formatNumber(buyValue, depot.currency, 0) + "</span>");
      footerFields.filter('.priceDiffPer').html($.formatNumber(valueDiffAbsToday / (value - valueDiffAbsToday) * 100, "%"))
                                          .css("color", $.getColorForNumber(valueDiffAbsToday));
      footerFields.filter('.valueDiffAbsToday').html($.formatNumber(valueDiffAbsToday, depot.currency, 0))
                                                .css("color", $.getColorForNumber(valueDiffAbsToday));
      footerFields.filter('.valueDiffPer').html($.formatNumber(valueDiffPer, "%"))
                                          .css("color", $.getColorForNumber(valueDiffPer * 2));
      footerFields.filter('.valueDiffAbs').html($.formatNumber(valueDiffAbs, depot.currency, 0))
                                          .css("color", $.getColorForNumber(valueDiffAbs));
      footerFields.filter('.value').html($.formatNumber(value, depot.currency, 0));     
    }

    initMenu = function() {
      var html = "";

      if (depot.key) {
        html += "<p><a href='http://www.comdirect.de/inf/musterdepot/pmd/freunde.html?portfolio_key=" + depot.key + "&SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO_PCT&SORTDIR=ASCENDING' target='_blank'>"
                + "Original Comdirect Portfolio"
              + "</a></p>";

        html += "<p><a href='?portfolio_key=s" + depot.key.substring(0, depot.key.length - 20) + "' target='_blank'>"
                + "Share 1k-Public Portfolio"
              + "</a></p>";
      }

      if (visitedPortfolioKeys && Object.keys(visitedPortfolioKeys).length > 1) {
        html += "Recently visited:"
              + "<ul>";
        for (var prop in visitedPortfolioKeys) {
          if (prop && prop != depot.key && prop != depot.sharedKey && visitedPortfolioKeys[prop]) {
            html += "<li><a href='?portfolio_key=" + prop + "'>" + visitedPortfolioKeys[prop] + "</a></li>";
          }
        }
        html += "</ul>";
      }
       
      if (html) {
        var menuElement = $("<div class='menu'>≡</div>");
        $element.append(menuElement);
        menuElement.qtip({
          content: {
            text: html
          },
          style: { classes: 'menu-tooltip' },    
          position: {
            my: 'top left',
            at: 'top left'
          },
          show: {
            event: 'click',
            solo: true,
            delay: 1 
          },
          hide: {
            fixed: true,
            delay: 300
          }
        });
      }
    }

    initTableSorter = function () {
      var sortColumnNumber = $element.find("> table > tfoot > tr > th.valueDiffAbs").addClass("sortcolumn headerSortUp").prevAll().length;
      
      $element.children("table").tablesorter({
        sortList: [[sortColumnNumber,0], [1,0]],
        sortAppend: [[1,0]],
        widgets: ["zebra", "columns", "filter"],
        widgetOptions : {
          columns: [ "sortcolumn" ],   // css class for sorted column
          filter_columnFilters: false,
          filter_placeholder: { search : 'Note' },
          filter_external : '.search',
          // filter_saveFilters : true,
        },
        usNumberFormat: false,
        headers: {
          0 : { sorter: false }
        }
      })
      .on('initialized filterEnd', refreshFooter);
    }

    setTooltipChartDuration = function (clickedLink, comdirectId) {
      var link = $(clickedLink.target);
      link.parent().find("a").removeClass("active");
      link.addClass("active");
      
      var duration = link.text();
      if (duration == "max") {
        duration = "SE";
      }
      
      var imgUrl = tooltipStockChartUrl.replace("[TIME]", duration).replace("[ID]", comdirectId); 
      link.parent().parent().find("img").attr("src", imgUrl);
    };

    initStockContextMenu = function () {
      $element.find('> table > tbody > tr').each(function() {
        var row = $(this);            
        var stock = row.data("stock");
        
        var html = "<p>"
          + "<span class='price'>" + $.formatNumber(stock.price, stock.currency, 2) + "</span>" 
          + " <span class='priceDiffAbs'" + $.getStyleColorForNumber(stock.priceDiffPer * 100) + ">" + $.formatNumber(stock.priceDiffAbs, stock.currency, 2, true) + "</span>" 
          + (typeof stock.priceDiffPer !== 'undefined' ?
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
                "headline" : stock.buyDate.toISOString().substr(0, 10) + " (" + $.formatDuration(stock.buyDateAge) + ")",
                "valueCurrency" : depot.currency,
                "valueStart" : stock.buyValue,
                "valueEnd" : stock.value,
                "count" : stock.count,
                "priceStart" : stock.buyPrice,
                "priceCurrency" : stock.currency
            })
          + "</p>" 

          + (stock.note ? '<p><i>"' + stock.note + '"</i></p>' : "");
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
            ,button: 'Close'
            ,text: html
          }
          ,position: {
            my: 'top left'
            ,at: 'top left'
            ,target: cell
          }
          ,show: {
            event: 'click'
            ,solo: true
          }
          ,hide: {
            fixed: true
            ,delay: 300
          }
          ,events: {
            show: function(event, api) {
              $(api.elements.tooltip).find(".controls a").click(function(link) {
                setTooltipChartDuration(link, stock.comdirectId);
              });
            }
          }
        });
      });
    }

    storePortfolioKey = function () {
      // save all portfolios
      if (depot.key) {
         // var keyToStore = portfolioKey ? portfolioKey : sharablePortfolioKey;
      
        /*
        if (keyToStore) {
          // save all portfolios
          if (!visitedPortfolioKeys) {
            visitedPortfolioKeys = {};
          }

          visitedPortfolioKeys[keyToStore] = portfolioTitle;
        
          var arrayAsString = JSON.stringify(visitedPortfolioKeys);

           keyToStore.substring(1, portfolioKey.length - 21)


          arrayAsString.split(find).length - 1;

          var count = (temp.match(/is/g) || []).length;

          arrayAsString. portfolioKey.substring(1, portfolioKey.length - 21)

             
          if (keyToStore == sharablePortfolioKey 
            && visitedPortfolioKeys[]) {
            
          }


          // clean up - key where 1k and normal Key exists
          for (var prop in visitedPortfolioKeys) {

          }

        && !JSON.stringify(visitedPortfolioKeys).includes(keyToStore.substr(1))) {
         
          // and here is the functions side effect ;D
          localStorage.setItem('portfoliokeys', JSON.stringify(visitedPortfolioKeys)); 
        */

        if (!visitedPortfolioKeys) {
          visitedPortfolioKeys = {};
        }
        visitedPortfolioKeys[depot.key] = depot.title;

        // and here is the functions side effect ;D
        localStorage.setItem('portfoliokeys', JSON.stringify(visitedPortfolioKeys));
      }
    }

    init();        
  });

  $.fn.depotTable = function(depot) {
    var depotTable = new DepotTable($(this), depot);
    return depotTable;
  };
})(jQuery);



(function($) { // PortfolioHistoryChart
  var PortfolioHistoryChart = (function($element, portfolioKey) {
    var dataTable = null;
    var dataView = null;
    var duration = null;
    var chart = null;
    var chartOptions = {
      width: '100%'
      ,height: 400
      ,hAxis: {
        textStyle : {
          fontSize : 12
        }
      }
      ,backgroundColor : "transparent"
      ,animation: {
        duration: 600
        ,easing: 'inAndOut'
      }
      ,focusTarget: 'category'
      ,chartArea: {
        top: 10
        ,bottom: 40
        ,left: 40
        ,right: 40
      }
      ,tooltip: {isHtml: true}
      ,isStacked: 'absolute'
      ,vAxes: {
        0: { 
          format: 'short'
          ,textStyle : {fontSize: 12}
        }
        ,1: {
          gridlines: {count : 0}
          ,format: 'percent'
          ,textStyle : {fontSize: 12}
          ,viewWindowMode : 'maximized'
        }
      }
      
      ,annotations: {
        textStyle: {
          fontSize: 8
          ,color: '#000000'
          ,auraColor: '#FFFFFF'
        }
      }
      ,legend: 'none'
      ,seriesType: 'area'
      ,series: {
        0: {
          targetAxisIndex: 0
          ,lineWidth: 0
          ,color: '#AAA'    // gray area
        }
        ,1: {
          targetAxisIndex: 0
          ,lineWidth: 0
          ,color: '#006600'    // green area
        }
        ,2: {
          targetAxisIndex: 0
          ,lineWidth: 0
          ,color: '#FFBBBB'    // red area
        }
        ,3: {
          targetAxisIndex: 0
          ,type: 'line'
          ,lineWidth: 1
        }
        ,4: {
          targetAxisIndex: 1   // right axis percentage
          ,type: 'line'
          ,lineWidth: 1
        }
      }
    };

    init = function() {
      loadData();
      if ($("html").hasClass("darkmode")) {
        chartOptions.hAxis.textStyle.color = '#DDD';
        chartOptions.vAxes[0].textStyle.color = '#DDD';
        chartOptions.vAxes[0].gridlines = {color : '#444'};
        chartOptions.vAxes[0].minorGridlines = {color : '#444'}
        
        chartOptions.vAxes[1].textStyle.color = '#DDD';
        chartOptions.vAxes[1].baselineColor = {color : '#AAA'};

        chartOptions.series[0].color = '#FFF';
        chartOptions.series[1].color = '#00FF00';
        chartOptions.series[2].color = '#FF0000';
        chartOptions.series[4].lineWidth = 2;
      }

      $(window).on('resizeEnd', drawChart);
    
      $element.append("<div></div><div class='controls'><a data-duration='31'>1m</a> <a data-duration='184'>6m</a> <a data-duration='365'>1y</a> <select style='position: relative; display: none'><option data-duration='100000'>max</option></select></div>");
      $element.find("a").click(setDuration);
      $element.find("select").on("click change", setDuration);
 
      chart = new google.visualization.ComboChart($element.find("div")[0]);
    };

    setDuration = function (clickedElement) {
      var clickedElement = $(clickedElement.target);
    
      clickedElement.parent().find("*").removeClass("active");
      clickedElement.addClass("active");
      if (clickedElement[0].selectedOptions) {        // for select options
        duration = $(clickedElement[0].selectedOptions).attr("data-duration");
      } else {
        duration = clickedElement.data("duration");   // for a href links
      }
    
      drawChart();      
    };

    loadData = function () {
      var depotPath = "https://apps.mathiasnitzsche.de/comdirect/";
      $.ajax({
        url: depotPath + "data.php?type=history&portfolio_key=" + portfolioKey,
        jsonp: "wrapper",
        dataType: "jsonp",
        // jsonpCallback: 'historyData',
        async: true, // not working with jsonp
        success: function(response) {
          prepareDataView(response);
          $element.find("a:nth-child(2)").click();
        }
      });
    }

    prepareDataView = function(historyData){
      var rows = [];
      for (var dateString in historyData.rows) {
        var date = new Date(dateString);
        date.setHours(0, -date.getTimezoneOffset(), 0, 0);  //removing the timezone offset
        var value = historyData.rows[dateString][0];
        var diff = historyData.rows[dateString][1];
      
        rows.push([
          date                       
          ,$.getPnlTable({
            "headline" : date.toISOString().substr(0, 10) + ", " + $.getWeekday(date)
            ,"valueCurrency" : "€"
            ,"valueStart" : (value - diff)
            ,"valueEnd" : value
          })
          ,(value - Math.max(diff, 0))                    // gray
          ,Math.max(diff, 0)                              // green
          ,Math.abs(Math.min(diff, 0))                    // red
          ,value                                          // Abs Line
          ,"color:" + (diff > 0 ? "#99AA99" : "#FFCCCC")  // absLineStyle
          ,diff / (value - diff)                          // percLine
          ,"color:" + (diff > 0 ? "green" : "red")        // percLineStyle
        ]);
      }

      dataTable = new google.visualization.DataTable();
      dataTable.addColumn('date', "Date");
      dataTable.addColumn({role: 'tooltip', type: 'string', p: {'html': true}});
      dataTable.addColumn('number', "GreyArea");
      dataTable.addColumn('number', "GreenArea");
      dataTable.addColumn('number', "RedArea");
      dataTable.addColumn('number', "AbsLine");
      dataTable.addColumn({role: 'style', type: 'string'});  // line style
      dataTable.addColumn('number', "PercLine");
      dataTable.addColumn({role: 'style', type: 'string'});  // line style
      dataTable.addRows(rows);

      var dateRange = dataTable.getColumnRange(0);
      if (dateRange.min && dateRange.max) {
        var minYear = dateRange.min.getFullYear();
        var maxYear = dateRange.max.getFullYear();
        if (minYear != maxYear) {
          $element.find("select").show();
          for (var y = minYear; y <= maxYear; y++) {
            $element.find("select").append("<option data-duration='" + y + "'>" + y + "</option>")
          }
        }
      }
      
      dataView = new google.visualization.DataView(dataTable);
    }

    drawChart = function() {
      var minDate = new Date().setDate((new Date()).getDate() - duration);
      var maxDate = new Date();

      if (duration > 1000 && duration < 3000) {     // a year
        minDate = new Date(duration, 0, 1);
        maxDate = new Date(duration, 11, 31, 23, 59, 59);
      }

      dataView.setRows(dataTable.getFilteredRows([{
        column: 0
        ,minValue: minDate
        ,maxValue: maxDate
      }]));

      /*
      google.visualization.events.addListener(chart, 'ready', function () {
         $element.controls.append($("<a href='" + chart.getImageURI() + "' target='_blank'>img</a>"));
      }); 
      */

      chart.draw(dataView, chartOptions);
    }
    
    init();
  });

  $.fn.portfolioHistoryChart = function(portfolioKey) {
    new PortfolioHistoryChart($(this), portfolioKey);
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
      ,bars: 'horizontal'
      ,legend: { position: "none" }
      ,isStacked: true
      ,focusTarget: 'category'
      ,theme: 'material'
      ,width: '100%'
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
        style: "point"
        ,textStyle: {
          fontSize: 10
          ,bold: true
          ,color: '#111'
        }
      }
      ,series: {
        0: {
          targetAxisIndex: 0
          ,lineWidth: 0
          ,color: '#777777'    // gray area
        }
        ,1: {
          targetAxisIndex: 0
          ,lineWidth: 0
          ,color: '#006600'    // green area
        }
        ,2: {
          targetAxisIndex: 0  // red area
          ,lineWidth: 0
          ,dataOpacity: 0.1
          ,color: '#ff7777'
        }
      }
    };

    init = function() {
      if ($("html").hasClass("darkmode")) {
        chartOptions.hAxis = {textStyle: {color: '#DDD'}};
        chartOptions.vAxis = chartOptions.hAxis;
        chartOptions.annotations.textStyle.color = '#DDD';
        chartOptions.series[2].dataOpacity = 0.3;
      }

      loadData();
      $(window).on('resizeEnd', drawBarChart);

      $element.html("<div style='padding-top:13px'></div> <div class='controls'><a>total</a> <a>abs</a> <a>rel</a></div>");
      $element.find("a").click(switchBarType).first().click();
    };

    switchBarType = function (clickedLink) {
      var link = $(clickedLink.target);
      link.parent().find("a").removeClass("active");
      link.addClass("active");
      sortColumn = link.prevAll().length;

      drawBarChart();
    }

    loadData = function () {
      dataTable = new google.visualization.DataTable();
      dataTable.addColumn('number', "absSort");
      dataTable.addColumn('number', "relSort");
      dataTable.addColumn('number', "totalSort");
      dataTable.addColumn('string', "Name");
      dataTable.addColumn({role: 'tooltip', type: 'string', p: {'html': true}});
      dataTable.addColumn('number', "Gray");
      dataTable.addColumn('number', "Green");
      dataTable.addColumn({type: 'string', role: 'style'});
      dataTable.addColumn({role: "annotation", type: "string"});
      dataTable.addColumn('number', "Red");
      
      for (var id in depot.stocks) {
        var stock = depot.stocks[id];
        if (stock.count) {
          var tooltipHtml = $.getPnlTable({
            "headline" : stock.name.substr(0, 50),
            "valueCurrency" : depot.currency,
            "valueStart" : stock.buyValue,
            "valueEnd" : stock.value,
            "priceCurrency" : stock.currency,
            "priceStart" : stock.buyPrice,
            "priceEnd" : stock.price
          });
      
          dataTable.addRow([
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
          ]);
        }
      }

      dataView = new google.visualization.DataView(dataTable);
    }

    drawBarChart = function() {
      chartOptions.height = dataView.getNumberOfRows() * 20 + 80;
      dataView.setRows(dataTable.getSortedRows({column: sortColumn}));
      dataView.hideColumns([0,1,2]); // remove sort columns

      var chart = new google.visualization.BarChart($element.find("div:first")[0]);
      chart.draw(dataView, chartOptions);
    }
    
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
        ,easing: 'inAndOut'
      }
      ,highlightOnMouseOver: true
      ,maxDepth: 0
      ,headerHeight: 0
      ,showScale: false
      ,minColorValue: -50
      ,maxColorValue: 50
      ,fontColor: (isDarkMode ? '#DDD' : '#000000')
      ,noColor: (isDarkMode ? '#000000' : '#F5F5F5')
      ,minColor: '#ff0000'
      ,midColor: (isDarkMode ? '#333' : '#cccccc')
      ,maxColor: '#009900'
      ,width: '100%'
      ,height: 400
      ,generateTooltip: function (row, share, color) {
        return dataTables[duration].getValue(row, 4);
      }
    };

    init = function() {
      $element.html("<div></div><div class='controls'><a>today</a>| <a>total</a> <a>type</a></div>");
 
      prepareTreeDataTables();
      
      $(window).on('resizeEnd', drawTreeChart);

      chart = new google.visualization.TreeMap($element.find("div:first")[0]);
      google.visualization.events.addListener(chart, 'select', function () {
        chart.setSelection([]);
      });

      $element.find("a").click(setDuration).first().click();
    };

    setDuration = function (clickedLink) {
      clickedLink = $(clickedLink.target);
      duration = clickedLink.prevAll("a").length;
      clickedLink.parent().find("a").removeClass("active");
      clickedLink.addClass("active");
      drawTreeChart();
    };
    
    prepareTreeDataTables = function(){
      var rootKey = "Portfolio";

      dataTables[0] = new google.visualization.DataTable({
        cols: [{label: 'Label', type: 'string'}
          ,{label: 'Parent', type: 'string'}
          ,{label: 'Size', type: 'number'}
          ,{label: 'Color', type: 'number'}
          ,{label: 'Tooltip', type: 'string'}
        ],
        rows: [{c:[{v:rootKey},{v:""},{v:0},{v:0},{v:""}]}] // add root
      });
      dataTables[1] = dataTables[0].clone();
      dataTables[2] = dataTables[0].clone();
      
      var typeData = {};
     
      for (var id in depot.stocks) {
        var stock = depot.stocks[id];
        if (stock.count) {
          var label = stock.name;
          if (stock.symbol) {
            label = stock.symbol.length < label.length ? stock.symbol : label.toUpperCase();
          }

          var share = stock.value / depot.value * 100;
          var sharelabel = $.formatNumber(share, "%");
          var todayLabel = $.formatNumber(stock.priceDiffPer, "%", (Math.abs(stock.priceDiffPer) >= 10 ? 0 : 1), true);
          var totalLabel = $.formatNumber(stock.valueDiffPer, "%", (Math.abs(stock.valueDiffPer) >= 10 ? 0 : 1), true);
         
          var tooltip = "<div class='treemapTooltip'>"
            + "<b>" + stock.name + (stock.symbol ? " ("  + stock.symbol + ")" : "") + "</b><br>"
            + "share: " + $.formatNumber(share, "%") + "<br>"
            + "total: <span " + $.getStyleColorForNumber(stock.valueDiffPer) + ">" 
              + $.formatNumber(stock.valueDiffPer, "%", null, true)
            + "</span><br>"
            + (stock.isDataFromToday ? "today: <span " + $.getStyleColorForNumber(stock.priceDiffPer * 10) + ">" 
              + $.formatNumber(stock.priceDiffPer, "%", null, true) 
              + "</span>" : "")
          + " </div>";

          dataTables[0].addRow([
            label + " (" + (stock.isDataFromToday ? todayLabel + ", " : "") + sharelabel + ")"
            ,rootKey
            ,stock.value / depot.value / 10   // devide by 10 to change range from +-50 to +-5
            ,(stock.isDataFromToday ? stock.priceDiffPer : null)
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
            typeData[stock.type] = {"value":0, "diff":0}
          }
          typeData[stock.type]["value"] += stock.value;
          typeData[stock.type]["diff"] += stock.valueDiffAbs;
        }
      }

      for (var type in typeData) {
        var share = typeData[type].value / depot.value;
        var diffPer = typeData[type].diff / (typeData[type].value - typeData[type].diff) * 100;
        dataTables[2].addRow([
          type
          ,rootKey
          ,share
          ,diffPer
          ,"<div class='treemapTooltip'>"
            + "<b>" + type + "</b><br>"
            + "share: " + $.formatNumber(share * 100, "%") + "<br>"
            + "diff: <span " + $.getStyleColorForNumber(diffPer) + ">" 
              + $.formatNumber(diffPer, "%", null, true)
            + "</span><br>"
          + " </div>"
        ]);
      }
    }

    drawTreeChart = function() {
      chart.draw(dataTables[duration], chartOptions);           
    }
    
    init();
  });

  $.fn.shareChart = function(depot) {
    new ShareChart($(this), depot);
    return this;
  };
})(jQuery);



(function($) { // DepotDevelopmentChart
  var DepotDevelopmentChart = (function($element, depot) {
    var imgUrl = "https://charts.comdirect.de/charts/rebrush/design_large.chart?TYPE=CONNECTLINE&TIME_SPAN=TIMEPLACEHOLDER&AXIS_SCALE=log&DATA_SCALE=rel&LNOTATIONS=IDPLACEHOLDER&LCOLORS=COLORPLACEHOLDER&AVGTYPE=simple&HCMASK=3&SHOWHL=0";
    var colors = [  // orinial Comdirect colors, just the last one replaced
      "000000"   // black (default)
      ,"056937"  // green
      ,"999900"  // lime
      ,"cc0000"  // red
      ,"990099"  // purple
      ,"330099"  // blue
      ,"ff92ff"  // pink
      ,"00cc33"  // green
      ,"ff6600"  // dark orange  
      ,"ffd21f"  // dark yellow
      ,"00FFFF"  // cyan replaced - light yellow  ffff23
    ];
  
    init = function() {
      drawDepotDevelopementChart();            
    };

    setDuration = function (clickedLink) {
      $(clickedLink.target).parent().find("a").removeClass("active");
      $(clickedLink.target).addClass("active");

      var duration = clickedLink.target.innerText;
      if (duration == "max") {
        duration = "SE";
      }

      $element.find("img").fadeOut('fast', function () {
        $(this).attr('src', imgUrl.replace('TIMEPLACEHOLDER', duration.toUpperCase())).fadeIn('fast');
      });
    };

    getSortedTop10Stocks = function() {
      var realStocks = depot.stocks.filter((x) => x.count > 0);
      function sortBy(field) {
        return function(a, b) {
          return (a[field] > b[field]) - (a[field] < b[field]);
        };
      }
      realStocks = realStocks.sort(sortBy('value'));
      realStocks = realStocks.slice(Math.max(realStocks.length - 10, 0)).reverse();
      return realStocks;
    };

    drawDepotDevelopementChart = function() {
      realStocks = getSortedTop10Stocks();

      // add MSCI WORLD to beginning of the array
      realStocks.unshift({
        'name' : "MSCI WORLD",
        'comdirectId' : "12221463",
        'value' : 0
      });

      var ids = [];
      var html = "";
      var top10value = 0;
      for (var i in realStocks) {
        top10value += realStocks[i].value;
        ids.push(realStocks[i].comdirectId);
        html += "<span style='color: " + (parseInt(i) ? "white" : "#" + colors[i]) + "; font-size: 10pt; white-space: nowrap; background-color: " + (parseInt(i) ? "#" + colors[i] : "transparent;") + ";'> "
            + realStocks[i].name
          + " </span> &#160;";
      }

      imgUrl = imgUrl.replace("IDPLACEHOLDER", ids.join('+'));
      imgUrl = imgUrl.replace("COLORPLACEHOLDER", colors.join('+'));
      
      $element.html(  "<b>Top10 Stocks (" + Math.round(top10value / depot.value * 100) + "% of total)</b><br>"
        + "<img src='' /><br />"
        + html + "<br>"
        + "<div class='controls' style='top:50px'><a>10d</a> <a>6m</a> <a>1y</a> <a>5y</a> <a>max</a></div>"
      );
 
      $element.find("a").click(setDuration).first().click();
    }
    
    init();
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
        $(this).trigger('resizeEnd');
      }
    }, 500);
  }); 

  $.extend({
    logDuration: function(startTime, stepTitle) {
      var duration = (new Date()).getTime() - startTime.getTime();
      console.log (duration + "ms - " + stepTitle);
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
      if (!durationInSecond) return "";

      var diffsFormated = [];
      var diffs = {
        "y" : 60 * 60 * 24 * 365,
        "w" : 60 * 60 * 24 * 7,
        "d" : 60 * 60 * 24,
        "h" : 60 * 60,
        "m" : 60,
        "s" : 1
      };

      for (var d in diffs) {
        if (durationInSecond >= diffs[d]) {
          diffsFormated.push(Math.floor(durationInSecond / diffs[d]) + d);
          durationInSecond = durationInSecond % diffs[d];
        }
      }    

      return diffsFormated.slice(0, 2).join(" ");
    },

    formatNumber: function (number, type, decimals, includeSign) {  
      if (!number) {
        number = 0;
        decimals = decimals ? decimals : 0;
      }

      /*
       * without decimals defined:
       * - 100.123  -> 100
       * - 10.123   -> 10
       * - 1.123    -> 1.1
       * - 0.123    -> 0.12
       */
      if (decimals === null || typeof decimals === 'undefined') {
        decimals = Math.ceil(Math.max(0, 1 - Math.log10(Math.abs(number))));
      }
      decimals = Math.min(decimals, 2);

      var formatOptions = {
        maximumFractionDigits : decimals,
        minimumFractionDigits : decimals
      };

      var formatter = new Intl.NumberFormat('de-DE', formatOptions);
      return  (includeSign && number > 0 ? "+" : "")
          + formatter.format(number)
          + (type == "percent" || type == "%" ? "%" : "")
          + (type == "EUR" || type == "€" ? "€" : "")
          + (type == "DOL" || type == "USD" ? "$" : "")
      ;
    }, 

    getPnlTable: function (options) { 
      var diff = options.valueEnd - options.valueStart;
      var diffPercent = diff / options.valueStart * 100;

      return "<table class='pnlTable'>"
        + (options.headline ?
          "<tr>"
            + "<th colspan='3'>"
              + options.headline
            + "</th>"
          + "</tr>" : "")
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
      return (url.searchParams.get("dark") || window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  });
})(jQuery);



(function ($) { // Depot loader
  $.extend({
    initDepot: function () {  
      var url = new URL(window.location);
      var portfolioKey = url.searchParams.get("portfolio_key");
      if (!portfolioKey) return;

      var islocalCachingAllowed = url.searchParams.get("cache");
      
      var handleDepotJson = function(depot){
        if (islocalCachingAllowed) {
          sessionStorage.setItem('cachedDepot', JSON.stringify(depot));
        }

        var today = (new Date());
        depot.value = 0;
        depot.valueDiffAbsToday = 0;
        
        for (var id in depot.stocks) {
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
        }
        depot.isDataFromToday =  today.getFullYear() === depot.date.getFullYear()
                              && today.getMonth() === depot.date.getMonth()
                              && today.getDate() === depot.date.getDate();
         
        $.logDuration(starttime, "data loaded (" + depot.loadtime + "ms server side)");

        $("body").append(
          "<div id='depot_table'></div>"
          + "<div id='depot_chart_share' class='chart'></div>"
          + "<div id='depot_chart_history' class='chart'></div>"
          + "<div id='depot_chart_pnl' class='chart'></div>"
          + "<div id='depot_chart_dev' class='chart'></div>"
          + "<div id='depot_credits' class='chart'>More information:<br>"
            + "<a href='https://mathiasnitzsche.de/comdirect' target='_blank'>https://mathiasnitzsche.de/comdirect</a>"
          + "</div>"
        );

        $("head title").text(depot.title);
        $("#depot_table").depotTable(depot);
        
        google.charts.load('current', {'packages': ['corechart', 'treemap', 'bar']});
        google.charts.setOnLoadCallback(function() {
          $.logDuration(starttime, "chart lib loaded");
          
          $("#depot_chart_share").shareChart(depot);
          $("#depot_chart_history").portfolioHistoryChart(portfolioKey);
          $("#depot_chart_pnl").profitAndLossChart(depot);
          $("#depot_chart_dev").depotDevelopmentChart(depot);
          // last 12 months chart: https://developers.google.com/chart/interactive/docs/gallery/calendar
          
          $.logDuration(starttime, "charts rendered");
        }); 
      }

      $.ajax({
        url: "https://apps.mathiasnitzsche.de/comdirect/data.php?type=stocks&portfolio_key=" + portfolioKey,
        jsonp: "wrapper",
        dataType: "jsonp",
        // jsonpCallback: 'historyData',
        async: true, // not working with jsonp
        beforeSend: function() {
          if (islocalCachingAllowed) {
            var cachedDepot = sessionStorage.getItem('cachedDepot');
            if (cachedDepot) {
              handleDepotJson($.parseJSON(cachedDepot));
              return false;
            }
          }
        },
        success: handleDepotJson
      });
    }
  });
})(jQuery);



$(function() { // main
  $.logDuration(starttime, "js loaded");

  $("html").addClass($.isDarkmode() ? "darkmode" : "lightmode");

  $.initDepot();
});