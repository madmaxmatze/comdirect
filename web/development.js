
(function($) { // DepotDevelopmentChart
  var DepotDevelopmentChart = (function($element, depot) {
    var top10stocks = Object.values(depot.stocks)
                      .filter((x) => x.count > 0)
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

    $element.find("a").click((clickedLink) => {
      clickedLink = $.getSelectedControl(clickedLink);

      $element.find("img").fadeOut("fast", function () {
        var src = "https://charts.comdirect.de/charts/rebrush/design_large.chart?TYPE=CONNECTLINE"
                    + "&AXIS_SCALE=log&DATA_SCALE=rel&AVGTYPE=simple&HCMASK=3&SHOWHL=0"
                    + "&TIME_SPAN=" + clickedLink.text().replace("max", "SE").toUpperCase()
                    + "&LNOTATIONS=" + top10stocks.map((stock) => stock.comdirectId).join("+")
                    + "&LCOLORS=" + colors.join("+");
        $(this).attr("src", src).fadeIn("fast");
      });
    }).first().click();
  });

  $.fn.depotDevelopmentChart = function(depot) {
    new DepotDevelopmentChart($(this), depot);
    return this;
  };
})(jQuery);
