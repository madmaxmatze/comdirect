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
  logLoading: function(stepTitle) {
    $(".loaderInfo p").text(stepTitle);
    var duration = (new Date()).getTime() - window.starttime.getTime();
    var logText = stepTitle + " | " + duration + "ms";
    console.log (logText);
  },

  getSelectedControl: function (clickedControl) {
    clickedControl = $(clickedControl.target);
    clickedControl.addClass("active").siblings().removeClass("active");
    return clickedControl;
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

    Object.keys(diffs).forEach((d) => {
      if (durationInSecond >= diffs[d]) {
        diffsFormated.push(Math.floor(durationInSecond / diffs[d]) + d);
        durationInSecond = durationInSecond % diffs[d];
      }
    });

    return diffsFormated.slice(0, 2).join(" ");
  },

  isSameDay: function(date1, date2) {
    return (date1 && date2
      && date1.getFullYear() === date2.getFullYear()
      && date1.getMonth() === date2.getMonth()
      && date1.getDate() === date2.getDate());
  },

  formatNumber: function (number, type, decimals, includeSign) {
    if (!number) {
      number = 0;
      decimals = decimals || 0;
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

    var suffix = "";
    if (type === "%" && number > 9999) { // fix 10000% cazyness
      number = Math.round(number) / 1000;
      suffix = "k";
    }

    var formatter = new Intl.NumberFormat(
      (navigator.language || navigator.userLanguage)
      ,{
        minimumFractionDigits : decimals
        ,maximumFractionDigits : decimals
      }
    );

    return (includeSign && number > 0 ? "+" : "")
        + formatter.format(number) + suffix
        + (type === "%" ? "%" : "")
        + (type === "EUR" ? "&euro;" : "")
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
          + (options.commentStart ? options.commentStart : "")
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
    return (url.searchParams.get("dark") ||
            window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  },

  initDepot: function () {
    var url = new URL(window.location);
    var dateParam = url.searchParams.get("date");
    var islocalCachingAllowed = url.searchParams.get("cache");
    var portfolioKey = url.searchParams.get("portfolio_key");
    var matches = window.location.pathname.substr(1).match(/^(\w+)$/ig);
    if (matches) {
      portfolioKey = matches[0];
    }
   
    var handleDepotJson = function(depot){
      $("html") .scrollTop(0)    // small fix 
                .addClass("loadingFinished")
                .addClass(depot.sharedKey ? "shareDepot" : "");

      if (!depot.title) {
        $.logLoading("Failure loading from Comdirect. Check Peerfolio ID.");
        return;
      }
     
      if (islocalCachingAllowed) {
        sessionStorage.setItem("cachedDepot", JSON.stringify(depot));
      }

      var today = (new Date());
      depot.value = 0;
      depot.valueDiffAbsToday = 0;

      Object.keys(depot.stocks).forEach((id) => {
        if (depot.date) {
          depot.date = new Date(depot.date);
        }

        depot.stocks[id].priceDiffPer = Math.round(
          depot.stocks[id].priceDiffAbs / (depot.stocks[id].price - depot.stocks[id].priceDiffAbs) * 10000) / 100;

        if (depot.stocks[id].limitTop && depot.stocks[id].price > depot.stocks[id].limitTop) {
          depot.stocks[id].isAboveLimit = true;
        }
        if (depot.stocks[id].limitBottom && depot.stocks[id].price < depot.stocks[id].limitBottom) {
          depot.stocks[id].isBelowLimit = true;
        }

        depot.stocks[id].note = depot.stocks[id].note || "";

        if (depot.stocks[id].date) {
          depot.stocks[id].date = new Date(depot.stocks[id].date);
          depot.stocks[id].isDataFromToday =  $.isSameDay(today, depot.stocks[id].date);
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
          depot.stocks[id].valueDiffPer =
            Math.round(depot.stocks[id].valueDiffAbs / depot.stocks[id].buyValue * 10000) / 100;
        }
      });

      if (depot.date) {
        depot.isDataFromToday =  today.getFullYear() === depot.date.getFullYear()
                              && today.getMonth() === depot.date.getMonth()
                              && today.getDate() === depot.date.getDate();
        depot.dateAge = (today.getTime() - depot.date.getTime()) / 1000;
        depot.isDataOld = (depot.dateAge > 1800);
      }
     
      $("body").prepend(
        "<h1><a href='https://www.peerfol.io'>peerfol.io</a></h1>"
        + "<div class='shareDepotInfo'>"
          + "This Peerfolio is <b>scaled to 1000&euro;</b> to allow public sharing. "
          + "The actual total depot value is different."
        + "</div>"
        + "<div class='menu'>Menu</div>"
        + "<div id='depot_table'></div>"
        + "<div id='depot_chart_share' class='chartContainer'></div>"
        + "<div id='depot_chart_history' class='chartContainer'></div>"
        + "<div id='depot_chart_pnl' class='chartContainer'></div>"
        + "<div id='depot_chart_dev' class='chartContainer'></div>"
        + "<div id='depot_credits' class='chartContainer'>More information: "
          + "<a href='https://www.peerfol.io' target='_blank'>www.peerfol.io</a>"
        + "</div>"
      );

      $("head title").text(depot.title + " - peerfol.io");

      $(".loaderInfo").hide();
      
      $.logLoading("Rending Table");

      new DepotTable($("#depot_table"), depot);
      new DepotMenu($(".menu"), depot);
      
      if (!Object.values(depot.stocks).filter((stock) => stock.count > 0).length) {
        $("#depot_chart_share").html("Please add values and counts to stocks you own to see the peerfol.io analysis");
        return;
      }

      $.logLoading("Loading Google Charts Lib");
      google.charts.load("current", {"packages": ["corechart", "treemap", "bar"]});
      google.charts.setOnLoadCallback(function() {
        $.logLoading("Rendering Charts");

        new ShareChart($("#depot_chart_share"), depot);
        new HistoryChart($("#depot_chart_history"), depot);
        new ProfitAndLossChart($("#depot_chart_pnl"), depot);
        new DevelopmentChart($("#depot_chart_dev"), depot);
        
        $.logLoading("Stock Charts created");
      });
    };

    $.ajax({
      url: "https://peerfol.io/api/v1/stocks"
      ,data : {
        portfolio_key : portfolioKey
        ,date : dateParam
      }
      ,jsonp: "wrapper"
      ,dataType: "jsonp"
      // ,jsonpCallback: 'historyData'
      ,async: true // not working with jsonp
      ,beforeSend: function() {
        $.logLoading("Loading Data");
        if (islocalCachingAllowed) {
          var cachedDepot = sessionStorage.getItem("cachedDepot");
          if (cachedDepot) {
            $.logLoading("Completed Loading Data");

            handleDepotJson($.parseJSON(cachedDepot));
            return false;
          }
        }
      }
    }).done((data, textStatus, jqXHR) => {
      $.logLoading("Data loaded | " + data.loadtime + "ms server side");
      handleDepotJson(data);
    }).fail((jqXHR, textStatus, errorThrown) => {
      $.logLoading("Failure loading from peerfol.io");
      console.log (errorThrown);
    });
  }
});


$(function() {
  $("html").addClass($.isDarkmode() ? "darkmode" : "lightmode");
  $("body").append("<div class='loaderInfo'><p class='spinner'></p></div>");

  $.logLoading("Initializing peerfol.io");

  $.initDepot();
});