
(function($) { // PortfolioHistoryChart
  var PortfolioHistoryChart = (function($element, depot) {
    var serverData = [];
    var dataTableTemplate = {cols: [
         {type: "date", label: "Date"}
        ,{type: "string", role: "tooltip", p: {"html": true}}
        ,{type: "number", label: "GreyArea"}
        ,{type: 'number', label: 'BuyPoints'}
        ,{type: 'string', role: 'style'}
        ,{type: "number", label: "GreenArea"}
        ,{type: "number", label: "RedArea"}
        ,{type: "number", label: "AbsLine"}
        ,{type: "string", role: "style", label: "AbsLineStyle"}
        ,{type: "number", label: "PercLine"}
        ,{type: "string", role: "style", label: "PercLineStyle"}
    ]};
    var filterDuration;
    var filterStockId;
    var filterShowTrades;
    var filterTypeAbsolute;
    var chart;
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
      ,tooltip: {
        isHtml: true
      }
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
        datum : {
          stem : {
            length : 2
            ,color : "transparent"
          }
        }
        ,style: "point"
        ,textStyle: {
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
          ,color: "black"    // buy points
          ,pointSize: 7
          //,pointShape: {type: 'square'}
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
          ,lineWidth: 2
        }
      ]
    };

    init = function() {
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

      // TODO: hide durations filter if depot is not old enough
      $element.append(
        "<div class='controls'>"
        + "<select id='filterDuration'>"
          + "<option value='7'>7d</option>"
          + "<option value='30' selected='selected'>1m</option>"
        + "</select>"
        + "<select id='filterStock'>"
          + "<option value='0' data-hideTrades>All</option>"
          + "<option value='0'>All (incl Trades)</option>"
         + "</select>"
        + "<select id='filterType'>"
          + "<option value='abs'>Abs</option>"
          + "<option value='rel' selected='selected'>Rel</option>"
        + "</select>"
       + "</div>"
       + "<div class='chart'></div>"
       + "<div class='history_info'></div>"
      );

      chart = new google.visualization.ComboChart($element.find(".chart")[0]);
      // just to block the space
      chart.draw(new google.visualization.DataTable(dataTableTemplate), chartOptions);
      
      $(window).on("resizeEnd", drawChart);
      $element.find("select, input").on("change", drawChart).first().change(); // init first draw
    };

    loadHistoryData = function () {
      var url = new URL(window.location);
      var isCachingActivated = url.searchParams.get("cache");
      var dateParam = url.searchParams.get("date");

      $.ajax({
        url: "https://peerfol.io/api/v1/history"
        ,data: {
          portfolio_key : (depot.key ? depot.key : depot.sharedKey)
          ,filterStockId : filterStockId
          ,date : dateParam
        }
        ,beforeSend: function( xhr ) {
          $.logLoading("Loading History data");
          $element.addClass("spinner");
        
          if (isCachingActivated) {
            var cachedHistory = sessionStorage.getItem("cachedHistory");
            if (cachedHistory) {
              $.logLoading("Completed Loading Data");
              serverData[filterStockId] = $.parseJSON(cachedHistory);
              drawChart();
              return false;
            }
          }
        }
        ,jsonp: "wrapper"
        ,dataType: "jsonp"
        // ,jsonpCallback: 'historyData'
        ,async: true // not working with jsonp
      }).done(function(data, textStatus, jqXHR) {
        if (isCachingActivated) {
          sessionStorage.setItem("cachedHistory", JSON.stringify(data));
        }
        serverData[filterStockId] = data;
        drawChart();
        $.logLoading("History Chart created");
      }).fail(function(jqXHR, textStatus, errorThrown) {
        if (errorThrown != "canceled") {
          $element.html("Failure loading history from peerfol.io");
          $.logLoading("Failure loading history from peerfol.io");
          console.log ("error: " +  errorThrown);
        }
      }).always(function(jqXHR, textStatus, errorThrown){
        $element.removeClass("spinner");
      });
    };

    getDataTable = function(){
      var dataTable = new google.visualization.DataTable(dataTableTemplate);

      var isLastSignPositive = null;
      var firstDiff = null;
     
      var minDate = null;
      var maxDate = null;
      
      if (filterDuration > 2000 && filterDuration < 2100) {     // a year
        minDate = new Date(filterDuration, 0, 1);
        maxDate = new Date(filterDuration, 11, 31, 23, 59, 59);
      } else {                                      // # of days
        minDate = new Date();
        minDate.setDate((new Date()).getDate() - filterDuration);
      }

      var rows = [];
      Object.entries(serverData[filterStockId].rows).forEach((entry) => {
        const [dateString, row] = entry;
        var date = new Date(dateString);
        // date filter
        if (date < minDate || maxDate && date > maxDate) {
          return;
        }

        // date.setHours(0, -date.getTimezoneOffset(), 0, 0);  //removing the timezone offset
        // serverData[filterStockId].rows[dateString][0]
        const [value, diff, count] = row;
        if (!filterTypeAbsolute && firstDiff === null) {
          firstDiff = diff;
        }

        var buyValue = (value - diff);
        var absLine = filterTypeAbsolute ? value : diff - firstDiff;
        var percLine = filterTypeAbsolute ? diff / buyValue : value / (value - absLine) - 1;
        var isSignsChanging = isLastSignPositive === null || Math.abs(percLine) < 0.01 ? true : (isLastSignPositive ? (absLine <= 0) : (absLine >= 0));
        isLastSignPositive = (absLine > 0);

        var rowData = {
          "date" : date
          ,"tooltip" : $.getPnlTable({
            headline : date.toLocaleString(undefined, {weekday: "short"}) + ", " + date.toLocaleString()
            ,valueCurrency : "EUR"
            ,valueStart : (filterTypeAbsolute ? buyValue : value - absLine)
            // ,commentStart : (filterTypeAbsolute ? "" : minDate.toLocaleDateString())
            ,valueEnd : value
            ,count : (count ? count : null)
            ,priceStart : (count ? buyValue / count : null)
          })
          ,"gray" : (filterTypeAbsolute ? (value - Math.max(diff, 0)) : 0)
          ,"transaction" : null
          ,"transactionFormating" : null
          ,"green" : (filterTypeAbsolute ? Math.max(diff, 0) : Math.max(absLine, 0))
          ,"red" : (filterTypeAbsolute ? Math.abs(Math.min(diff, 0)) : Math.min(absLine, 0))
          ,"absLine" : absLine
          ,"absLineStyle" : "color:" + (isSignsChanging ? "#CCC" : (absLine < 0 ? "#FFCCCC" : "#99AA99"))
          ,"percLine" : percLine
          ,"percLineStyle" : "color:" + (isSignsChanging ? "#888" : (absLine < 0 ? "red" : "green"))
        };

        rows.push(Object.values(rowData));
      });
      dataTable.addRows(rows);

      return dataTable;
    };

    updateFilters = function(dataTable) {
      if ($("#filterStock").data("alreadyUpdated")) {
        return;
      }

      var dates = Object.keys(serverData[filterStockId].rows);
      var dateMin = new Date(dates[0]);
      var dateMax = new Date(dates.pop());
      var dayRange = Math.floor((dateMax.getTime() - dateMin.getTime()) / 1000 / 60 / 60 / 24);
      if (dayRange > 25) {
        // default is one month; but if enough data is available, switch to 3 months
        $("#filterDuration option:selected").removeAttr("selected");
        filterDuration = 90;
        $("#filterDuration").append("<option value='90' selected='selected'>3m</option>");
      }
      if (dayRange > 85) {
        $("#filterDuration").append("<option value='180'>6m</option>");
      }
      if (dayRange > 175) {
        $("#filterDuration").append("<option value='365'>1y</option>");
      }
        
      var minYear = dateMin.getFullYear();
      var maxYear = dateMax.getFullYear();
      if (minYear != maxYear) {
        $("#filterDuration").append("<optgroup label='---'></optgroup>");
       
        // $element.find("select").show();
        for (y = minYear; y <= maxYear; y+=1) {
          $("#filterDuration").append("<option value='" + y + "'>" + y + "</option>");
        }

        $("#filterDuration").append("<option value='100000'>max</option>");
      }

      if (!Object.keys(serverData[filterStockId].transactions).length) {   // hide "All (incl Transactions)"
        $("#filterStock option[value=0]:last").hide();
      }

      var stocksFilters = [
        $("<optgroup label='Current'></optgroup>"),
        $("<optgroup label='Old'></optgroup>")
      ];

      for (const [comdirectId, name] of Object.entries(serverData[filterStockId].stockFilterAvailable).sort((a, b) => a[1] > b[1] ? 1 : -1)) {
        var isCurrentStock = (depot.stocks[comdirectId] && depot.stocks[comdirectId].count);
        stocksFilters[isCurrentStock ? 0 : 1].append(
          "<option value='" + comdirectId + "'>" + (name ? name : comdirectId) + "</option>"
        );
      }

      stocksFilters.forEach((optGroup) => {
        if (optGroup.find("> option").length) {
          $("#filterStock").append(optGroup);
        }
      });

      $("#filterStock").data("alreadyUpdated", true);
    };

    updateStatsBelowChart = function(dataTableVisibleRowIds) {
    /*
      var startProfit = null;
      var endProfit = 0;
      var sumBuyValue = 0;
      var sumValue = 0;
      dataTableVisibleRowIds.forEach(function(rowId) {
        endProfit = dataTables[filterStockId].getValue(rowId, 3) - dataTables[filterStockId].getValue(rowId, 4);
        startProfit = startProfit || endProfit;
        sumBuyValue += dataTables[filterStockId].getValue(rowId, 2) + dataTables[filterStockId].getValue(rowId, 4);
        sumValue += dataTables[filterStockId].getValue(rowId, 2) + dataTables[filterStockId].getValue(rowId, 3)
                    + dataTables[filterStockId].getValue(rowId, 4); // value + loss + profit
      });

      var buyValueProfit = (endProfit - startProfit) / (sumBuyValue / dataTableVisibleRowIds.length) * 100;
      $element.find(" > div:nth-child(2)").html(
        "<b> BuyValue</b> " + $.formatNumber(sumBuyValue / dataTableVisibleRowIds.length, "&euro;")
        + " | <b> Value</b> " + $.formatNumber(sumValue / dataTableVisibleRowIds.length, "&euro;")
        + " | <b>Profit</b> " + $.formatNumber(endProfit - startProfit, "&euro;", 0, true)
        + " | <b>Profit/BuyValue</b> " + $.formatNumber(buyValueProfit, "%", null, true)
        + " (excl. realised profit)"
      );
      */
    };
    
    changeResolution = function(dataTable) {
      var unixTimeWeekOffset =  24 * 60 * 60 * 4; // start on MONDAY, 5Jan1970
      var resolutionInHours = {7:1, 30:8, 100000:48}[filterDuration] || 24;

      var filter = {
        column: 0
        ,test: (value, rowId, columnId, datatable) => {
          if (!rowId || rowId == datatable.getNumberOfRows() - 1) {
            return true; // keep first and last row
          }
          var nextValue = datatable.getValue(rowId + 1, columnId);
          var bucketThisRow = (value.getTime() / 1000 - unixTimeWeekOffset) / (60*60 * resolutionInHours);
          var bucketNextRow = (nextValue.getTime() / 1000 - unixTimeWeekOffset) / (60*60 * resolutionInHours);
          return Math.floor(bucketThisRow) != Math.floor(bucketNextRow);
        }
      };
  
      return dataTable.getFilteredRows([filter]);
    };

    fillTransactions = function(filteredTable) {
      if (filterShowTrades) {
        for (i = 0; i < filteredTable.getNumberOfRows(); i++) {
          var transactionTooltip = "";
          var maxDate = filteredTable.getValue(i, 0);
          var minDate = (i ? filteredTable.getValue(i - 1, 0) : new Date(maxDate.getTime() - 1000));
         
          var hasTrades = false;
          var hasSales = false;
          
          Object.keys(serverData[filterStockId].transactions).forEach((dateStr) => {
            var transactionDate = new Date(dateStr);
            if (transactionDate > minDate && transactionDate <= maxDate) {
              hasTrades = true;
              serverData[filterStockId].transactions[dateStr].forEach((transaction) => {
                if (transaction.count < 0) {
                  // todo: add with or without profit
                  hasSales = true;
                }

                transactionTooltip += "<tr style='" + (transaction.count < 0 ? "font-weight: bold; color: red" : "") + "'>"
                  + (filterStockId ? "" : "<td>" + serverData[filterStockId].stockFilterAvailable[transaction.id].substr(0, 15) + ": </td>")
                  + (transaction.buyValue ? 
                    "<td style='text-align: right'>" + $.formatNumber(transaction.count, null, null, true) + "</td>"
                    + "<td>" + "x" + "</td>"
                    + "<td style='text-align: right'>" + $.formatNumber(transaction.buyValue / Math.abs(transaction.count), "EUR", 2) + "</td>"
                    + "<td>" + "=" + "</td>"
                    + "<td style='text-align: right'>" + $.formatNumber(transaction.buyValue, "EUR") + "</td>"
                    : "<td>" + (transaction.count > 0 ? "buy" : "sell") + "</td>")
                + "</tr>";
              });
            }
          });

          if (hasTrades) {
            filteredTable.setValue(i, 3, 1);
            if (hasSales) {
              filteredTable.setValue(i, 4, 'point {size: 7; fill-color: #a52714; shape-type: triangle; rotation: 180;}');
            } else {
              filteredTable.setValue(i, 4, 'point {size: 4; fill-color: #666; shape-type: square; rotation: 180;}');
            }
          }

          if (transactionTooltip) {
            filteredTable.setValue(i, 1, filteredTable.getValue(i, 1) + "<table>" + transactionTooltip + "</table>");
          }
        }
      }
      return filteredTable;
    };

    drawChart = function() {
      filterDuration = Number($("#filterDuration").val());
      filterStockId = Number($("#filterStock").val());
      filterTypeAbsolute = $("#filterType").val() == "abs";
      filterShowTrades = !$("#filterStock option[data-hideTrades]").is(":checked");
   
      if (!serverData[filterStockId]) {
        loadHistoryData();
        return;
      }

      updateFilters();
    
      var dataTable = getDataTable(dataTable);
      var dataView = new google.visualization.DataView(dataTable);
      
      var visibleRowIds = changeResolution(dataTable);
      dataView.setRows(visibleRowIds);
      
      dataTable = dataView.toDataTable();
      dataTable = fillTransactions(dataTable);

      chart.draw(dataTable, chartOptions);

      /* export to image
      google.visualization.events.addListener(chart, 'ready', function () {
         $element.controls.append($("<a href='" + chart.getImageURI() + "' target='_blank'>img</a>"));
      });
      */

      updateStatsBelowChart(visibleRowIds);
    };

    init();
  });

  $.fn.portfolioHistoryChart = function(depot) {
    new PortfolioHistoryChart($(this), depot);
    return this;
  };
})(jQuery);
