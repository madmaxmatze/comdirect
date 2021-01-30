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
      ,generateTooltip: (row, share, color) => {return dataTables[duration].getValue(row, 4);}
    };

    init = function() {
      $element.html("<div class='chart'></div><div class='controls'><a>today</a>| <a>total</a> <a>type</a></div>");

      prepareTreeDataTables();

      $(window).on("resizeEnd", drawTreeChart);

      chart = new google.visualization.TreeMap($element.find(".chart")[0]);
      google.visualization.events.addListener(chart, "select", function () {
        chart.setSelection([]);
      });

      $element.find("a").click((clickedLink) => {
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
      .filter((stock) => stock.count > 0)
      .forEach((stock) => {
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
        typeData[stock.type] = typeData[stock.type] || {"value":0, "diff":0};
        typeData[stock.type].value += stock.value;
        typeData[stock.type].diff += stock.valueDiffAbs;
      });

      dataTables[2].addRows(
        Object.keys(typeData).map((type) => {
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
          ];
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
