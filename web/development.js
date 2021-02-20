class DevelopmentChart {
  // comdirect: black,   green,   lime,    red,     purple,  blue,    pink,    green,   d.orange,d.yellow,cyan
  colors = ["000000","056937","999900","cc0000","990099","330099","ff92ff","00cc33","ff6600","ffd21f","00FFFF"];

  constructor ($element, depot) {
    this.$element = $element;
    this.depot = depot;
    this.calcuateTop10Stocks();
    this.drawChart();
    this.registerControls();
  } 

  calcuateTop10Stocks () {
    this.top10stocks = Object.values(this.depot.stocks)
                        .filter((x) => x.count > 0)
                        .sort((a, b) => (a.value > b.value) ? 1 : -1)
                        .slice(-10)
                        .reverse();

    this.top10stocks.unshift({  // add benchmark stock
      name : "MSCI WORLD"
      ,comdirectId : "12221463"
      ,value : 0
    });
  }

  drawChart () {
    var top10value = this.top10stocks.reduce((prevVal, stock) => prevVal + stock.value, 0);
    this.$element.html(
      "<h4>Top10 Stocks (" + Math.round(top10value / this.depot.value * 100) + "% of total)</h4>"
      + "<div class='controls'><a>10d</a> <a>6m</a> <a>1y</a> <a>5y</a> <a>max</a></div><br>"
      + "<img src='' /><br />"
      + this.top10stocks.reduce((prevVal, stock, i) => {
          return prevVal
              + "<span style='color: " + (i ? "white" : "#" + this.colors[i]) + "; font-size: 10pt;"
                + " white-space: nowrap; background-color: " + (i ? "#" + this.colors[i] : "transparent;") + ";'> "
                + stock.name
              + " </span> &#160;";
        }, '')
    );
  }

  registerControls () {
    this.$element.find("a").click((clickedLink) => {
      var src = "https://charts.comdirect.de/charts/rebrush/design_large.chart?TYPE=CONNECTLINE"
        + "&AXIS_SCALE=log&DATA_SCALE=rel&AVGTYPE=simple&HCMASK=3&SHOWHL=0"
        + "&TIME_SPAN=" + $.getSelectedControl(clickedLink).text().replace("max", "SE").toUpperCase()
        + "&LNOTATIONS=" + this.top10stocks.map((stock) => stock.comdirectId).join("+")
        + "&LCOLORS=" + this.colors.join("+");
      this.$element.find("img").attr("src", src);
    }).first().click();
  }
}