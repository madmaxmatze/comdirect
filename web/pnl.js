;(function($) { // ProfitAndLossChart
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

      $element.html("<div style='padding-top:13px' class='chart'></div> " + 
                    "<div class='controls'><a>total</a> <a>abs</a> <a>rel</a></div>");
      $element.find("a").click((clickedLink) => {
        clickedLink = $.getSelectedControl(clickedLink);
        sortColumn = clickedLink.prevAll().length;
        drawBarChart();
      }).first().click();
    };

    prepData = function () {
      dataTable = new google.visualization.DataTable({
        cols: [
          {type: "string", label: "Name"}
          ,{type: "string", role: "tooltip", p: {"html": true}}
          ,{type: "number", label: "Gray"}
          ,{type: "number", label: "Green"}
          ,{type: "string", role: "style"}
          ,{type: "string", role: "annotation"}
          ,{type: "number", label: "Red"}
          ,{type: "number", label: "absSort"}
          ,{type: "number", label: "relSort"}
          ,{type: "number", label: "totalSort"}
      ]});

      dataTable.addRows(
        Object.values(depot.stocks)
        .filter((stock) => stock.count > 0)
        .map((stock) => {
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
            stock.name                                  // label
            ,tooltipHtml                                // tooltip
            ,Math.min(stock.value, stock.buyValue)      // gray
            ,Math.max(0, stock.valueDiffAbs)            // green
            ,"color:" + (stock.valueDiffPer > 1 ? "#007700" : (stock.valueDiffPer < -1 ? "#FF0000" : "#777777"))
            ,$.formatNumber(stock.valueDiffPer, "%", null, true) // annotation
            ,Math.max(0, stock.valueDiffAbs * -1)       // red
            ,stock.value                                // FOR TOTAL SORTING
            ,stock.valueDiffAbs                         // FOR ABS SORTING
            ,stock.valueDiffPer                         // FOR REL SORTING
          ];
        })
      ); 

      dataView = new google.visualization.DataView(dataTable);
    };

    drawBarChart = function() {
      chartOptions.height = dataView.getNumberOfRows() * 20 + 80;
      dataView.setRows(dataTable.getSortedRows({column: sortColumn + 7}));
      dataView.hideColumns([7,8,9]); // remove sort columns

      var chart = new google.visualization.BarChart($element.find(".chart")[0]);
      chart.draw(dataView, chartOptions);
    };

    init();
  });

  $.fn.profitAndLossChart = function(depot) {
    new ProfitAndLossChart($(this), depot);
    return this;
  };
})(jQuery);
