class ShareChart {
  dataTables = [];
  duration = 0;
  chart = null;
  chartOptions = {
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
    ,fontColor: "#000000"
    ,noColor: "#F5F5F5"
    ,minColor: "#ff0000"
    ,midColor: "#cccccc"
    ,maxColor: "#009900"
    ,width: "100%"
    ,height: 400
    ,generateTooltip: (row, share, color) => {
      return this.dataTables[this.duration].getValue(row, 4);
    }
  };

  constructor ($element, depot) {
    this.$element = $element;
    this.depot = depot;
    this.init();
  } 

  init () {
    $(window).on("resizeEnd", () => {this.drawChart();});

    if ($("html").hasClass("darkmode")) {
      this.chartOptions.fontColor = "#DDD";
      this.chartOptions.noColor = "#000000";
      this.chartOptions.midColor = "#333";
    }

    this.$element.html("<div class='controls'><a>today</a> | <a>total</a> <a>type</a></div>"
                      + "<div class='chart'></div>");

    this.prepareTreeDataTables();

    this.chart = new google.visualization.TreeMap(this.$element.find(".chart")[0]);
    google.visualization.events.addListener(this.chart, "select", () => {
      this.chart.setSelection([]);
    });

    this.$element.find("a").click((clickedLink) => {
      this.duration = $.getSelectedControl(clickedLink).prevAll("a").length;
      this.drawChart();
    }).first().click();
  }

  prepareTreeDataTables () {
    var rootKey = "Portfolio";

    this.dataTables[0] = new google.visualization.DataTable({
      cols: [
         {type: "string", label: "Label"}
        ,{type: "string", label: "Parent"}
        ,{type: "number", label: "Size"}
        ,{type: "number", label: "Color"}
        ,{type: "string", label: "Tooltip"}
      ],
      rows: [{c:[{v:rootKey},{v:""},{v:0},{v:0},{v:""}]}] // add root
    });
    this.dataTables[1] = this.dataTables[0].clone();
    this.dataTables[2] = this.dataTables[0].clone();

    var typeData = {};

    Object.values(this.depot.stocks)
    .filter((stock) => stock.count > 0)
    .forEach((stock) => {
      var label = stock.name;
      if (stock.symbol) {
        label = (stock.symbol.length < label.length ? stock.symbol : label.toUpperCase());
      }

      var share = stock.value / this.depot.value * 100;
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

      this.dataTables[0].addRow([
        label + " (" + (stock.isDataFromToday ? todayLabel + ", " : "") + sharelabel + ")"
        ,rootKey
        ,stock.value / this.depot.value
        ,(stock.isDataFromToday ? stock.priceDiffPer : null)  * 10 // change range from +-5 to +-50
        ,tooltip
      ]);

      this.dataTables[1].addRow([
        label + " (" + totalLabel + ", " + sharelabel + ")"
        ,rootKey
        ,stock.value / this.depot.value
        ,stock.valueDiffPer
        ,tooltip
      ]);

      // collect typechart data
      typeData[stock.type] = typeData[stock.type] || {"value":0, "diff":0};
      typeData[stock.type].value += stock.value;
      typeData[stock.type].diff += stock.valueDiffAbs;
    });

    this.dataTables[2].addRows(
      Object.keys(typeData).map((type) => {
        var share = typeData[type].value / this.depot.value * 100;
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
  }

  drawChart () {
    this.chart.draw(this.dataTables[this.duration], this.chartOptions);
  }
}