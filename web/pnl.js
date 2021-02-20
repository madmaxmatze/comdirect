class ProfitAndLossChart {
  dataTable = null;
  dataView = null;
  sortColumn = 0;
  chartOptions = {
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

  constructor ($element, depot) {
    this.$element = $element;
    this.depot = depot;
    this.init();
  } 

  init () {
    $(window).on("resizeEnd", () => {this.drawChart();});

    if ($("html").hasClass("darkmode")) {
      this.chartOptions.hAxis = {textStyle: {color: "#DDD"}};
      this.chartOptions.vAxis = this.chartOptions.hAxis;
      this.chartOptions.annotations.textStyle.color = "#DDD";
      this.chartOptions.series[2].dataOpacity = 0.3;
    }

    this.prepData();

    this.$element.html("<div class='controls'><a>total</a> <a>abs</a> <a>rel</a></div>"
                        + "<div style='padding-top:13px' class='chart'></div> ");

    this.$element.find("a").click((clickedLink) => {
      this.sortColumn = $.getSelectedControl(clickedLink).prevAll().length;
      this.drawChart();
    }).first().click();
  }

  prepData () {
    this.dataTable = new google.visualization.DataTable({
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

    this.dataTable.addRows(
      Object.values(this.depot.stocks)
      .filter((stock) => stock.count > 0)
      .map((stock) => {
        return Object.values({
          "label" : stock.name
          ,"tooltip" : $.getPnlTable({
            headline : stock.name.substr(0, 50)
            ,valueCurrency : this.depot.currency
            ,valueStart : stock.buyValue
            ,valueEnd : stock.value
            ,priceCurrency : stock.currency
            ,priceStart : stock.buyPrice
            ,priceEnd : stock.price
          })
          ,"gray" : Math.min(stock.value, stock.buyValue)
          ,"green" : Math.max(0, stock.valueDiffAbs)
          ,"style" : "color:" + (stock.valueDiffPer > 1 ? "#007700" : (stock.valueDiffPer < -1 ? "#FF0000" : "#777777"))
          ,"annotation" : $.formatNumber(stock.valueDiffPer, "%", null, true)
          ,"red" : Math.max(0, stock.valueDiffAbs * -1)
          ,"totalSorting" : stock.value
          ,"absSorting" : stock.valueDiffAbs
          ,"relativeSorting" : stock.valueDiffPer
        });
      })
    ); 

    this.dataView = new google.visualization.DataView(this.dataTable);
  }

  drawChart () {
    this.chartOptions.height = this.dataView.getNumberOfRows() * 20 + 80;
    this.dataView.setRows(this.dataTable.getSortedRows({column: this.sortColumn + 7}));
    this.dataView.hideColumns([7,8,9]); // remove sort columns

    var chart = new google.visualization.BarChart(this.$element.find(".chart")[0]);
    chart.draw(this.dataView, this.chartOptions);
  }
}