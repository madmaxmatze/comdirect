class DepotTable {
  tooltipStockChartUrl = "https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=[TIME]&TYPE=MOUNTAIN&ID_NOTATION=[ID]";

  constructor ($element, depot) {
    this.$element = $element;
    this.depot = depot;
    this.init();
  } 

  init () {
    var headRow = "<tr>"
        + "<th class='iterator'></th>"
        + "<th class='name'>" + this.depot.title + "</th>"
        + "<th class='note'><input class='search' data-column='2' placeholder='Note' /></th>"
        + "<th class='type'><input class='search' data-column='3' placeholder='Type' /></th>"
        + "<th class='market'>Market</th>"
        + "<th class='buyDate'>BuyDate</th>"
        + "<th class='buyCount'>BuyCount</th>"
        + "<th class='buyPrice'>BuyPrice</th>"
        + "<th class='buyValue'>BuyValue</th>"
        + "<th class='limitBottom'>Limit</th>"
        + "<th class='limitTop'>Limit</th>"
        + "<th class='price'>Price</th>"
        + "<th class='priceDiffPer'>%</th>"
        + "<th class='valueDiffAbsToday'>Today</th>"
        + "<th class='valueDiffPer'>Abs%</th>"
        + "<th class='valueDiffAbs'>Abs</th>"
        + "<th class='value'>Value</th>"
      + "</tr>";

    this.$element.append(
      "<table class='depot'>"
        + "<thead>" + headRow + "</thead>"
        + "<tbody></tbody>"
        + "<tfoot>" + headRow.replace(/\'\>.*?\<\/th\>/g, "'></th>") + "</tfoot>"
      + "</table>");

    this.fillData();
    this.initTableSorter();
    this.initStockContextMenu();
  }

  fillData () {
    var sortingZero = -0.0000001;

    var tableBody = this.$element.find("> table > tbody");
    Object.values(this.depot.stocks).forEach((stock) => {
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
            + (stock.count ? $.formatNumber(stock.buyValue, this.depot.currency, 0) : "")
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
            + "<span>"
              + (stock.count ? $.formatNumber(stock.valueDiffAbsToday, this.depot.currency) : sortingZero)
            + "</span>"
          + "</td>"
          + "<td class='valueDiffPer'" + $.getStyleColorForNumber(stock.valueDiffPer) + ">"
            + (stock.count ? $.formatNumber(stock.valueDiffPer, "%") : sortingZero)
          + "</td>"
          + "<td class='valueDiffAbs'" + $.getStyleColorForNumber((stock.value - stock.buyValue) / this.depot.value * 10000) + ">"
            + (stock.count ? $.formatNumber(stock.value - stock.buyValue, this.depot.currency) : sortingZero)
          + "</td>"
          + "<td class='value'>"
            + (stock.count ? $.formatNumber(stock.value, this.depot.currency) : "")
          + "</td>"
        )
      );
    });

    this.refreshFooter();
  }

  refreshFooter () {
    var buyValue = 0;
    var value = 0;
    var buyDateAgeAverage = 0;
    var valueDiffAbsToday = 0;

    this.$element.find("> table > tbody > tr:visible").each((i, el) => {
      var stock = $(el).data("stock");
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

    var footerFields = this.$element.find("> table > tfoot > tr > th");
    if (this.depot.isDataOld) {
      footerFields.filter(".name").html(
        this.depot.isDataFromToday ? 
          " <span style='background: #DDD'>" + $.formatDuration(this.depot.dateAge) + " old data</span>" : 
          " <span style='background: red'>" + this.depot.date.toISOString().replace(/[A-Z]+/ig, " ").substr(0, 19) + "</span>"
      );
    }
    footerFields.filter(".buyDate").html($.formatDuration(buyDateAgeAverage));
    footerFields.filter(".buyValue").html("<span" + (this.depot.sharedKey ? " class='shareDepotLabel'" : "") + ">"
                                            + $.formatNumber(buyValue, this.depot.currency, 0) + "</span>");
    footerFields.filter(".priceDiffPer").html($.formatNumber(valueDiffAbsToday / (value - valueDiffAbsToday) * 100, "%"))
                                        .css("color", $.getColorForNumber(valueDiffAbsToday));
    footerFields.filter(".valueDiffAbsToday").html($.formatNumber(valueDiffAbsToday, this.depot.currency, 0))
                                              .css("color", $.getColorForNumber(valueDiffAbsToday));
    footerFields.filter(".valueDiffPer").html($.formatNumber(valueDiffPer, "%"))
                                        .css("color", $.getColorForNumber(valueDiffPer * 2));
    footerFields.filter(".valueDiffAbs").html($.formatNumber(valueDiffAbs, this.depot.currency, 0))
                                        .css("color", $.getColorForNumber(valueDiffAbs));
    footerFields.filter(".value").html($.formatNumber(value, this.depot.currency, 0));
  }

  initTableSorter () {
    var sortColumnNumber = this.$element.find("> table > tfoot > tr > th.valueDiffAbs")
                                  .addClass("sortcolumn headerSortUp").prevAll().length;

    this.$element.children("table").tablesorter({
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
      ,usNumberFormat: ((1.1).toLocaleString(navigator.language || navigator.userLanguage).substr(1,1) == ".")
      ,headers: [
        { sorter: false }
      ]
    })
    .on("initialized filterEnd", () => {this.refreshFooter();});
  };

  initStockContextMenu () {
    this.$element.find("> table > tbody > tr").each((i, el) => {
      var row = $(el);
      var stock = row.data("stock");

      var html = "<p>"
        + "<span class='price'>" + $.formatNumber(stock.price, stock.currency, 2) + "</span>"
        + " <span class='priceDiffAbs'" + $.getStyleColorForNumber(stock.priceDiffPer * 100) + ">"
          + $.formatNumber(stock.priceDiffAbs, stock.currency, 2, true)
        + "</span>"
        + (typeof stock.priceDiffPer !== "undefined" ?
          " <span class='priceDiffPer'" + $.getStyleColorForNumber(stock.priceDiffPer * 100) + ">"
            + $.formatNumber(stock.priceDiffPer, "%", null, true)
          + "</span>"
          : "")
        + (stock.limitBottom || stock.limitTop ?
            "<br>"
            + (stock.limitBottom ? "<span" + (stock.isBelowLimit ? " class='alert'" : "") + ">"
                + $.formatNumber(stock.limitBottom, stock.currency, 2) + " < </span>" : "")
            + "Limit"
            + (stock.limitTop ? "<span" + (stock.isAboveLimit ? " class='alert'" : "") + "> > "
                + $.formatNumber(stock.limitTop, stock.currency, 2) + "</span>" : "")
          : "")
      + "</p>";

      if (stock.count) {
        html += "<p>"
          + "Diff Today: <span class='valueDiffAbsToday'" + $.getStyleColorForNumber(stock.valueDiffAbsToday) + ">"
            + $.formatNumber(stock.valueDiffAbsToday, this.depot.currency, 2)
          + "</span>"
        + "</p>"

        + "<p>"
          + $.getPnlTable({
            headline : stock.buyDate.toISOString().substr(0, 10) + " (" + $.formatDuration(stock.buyDateAge) + ")"
            ,valueCurrency : this.depot.currency
            ,valueStart : stock.buyValue
            ,valueEnd : stock.value
            ,count : stock.count
            ,priceStart : stock.buyPrice
            ,priceCurrency : stock.currency
          })
        + "</p>"

        + (stock.note ? "<p><i>&quot;" + stock.note + "&quot;</i></p>" : "");
      }

      html += "<p>"
        + stock.market + " | " + stock.type
        + (stock.wkn ? " | " + stock.wkn : "")
        + (stock.isin ? " | " + stock.isin : "")
        + " | age " + $.formatDuration(stock.dateAge) + "<br>"
      + "</p>"

      + "<p>"
        + "<a href='https://www.comdirect.de/inf/aktien/detail/uebersicht.html?ID_NOTATION=" + stock.comdirectId
          + "' target='_blank'>"
          + "<img src='https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w32' "
          + "width='32' />"
        + "</a> "
        + (stock.isin ?
          "<a href='https://aktie.traderfox.com/visualizations/" + stock.isin + "' target='_blank'>"
            + "<img src='https://pbs.twimg.com/profile_images/797361743626465280/eAhqkp1P_400x400.jpg' width='32' />"
          + "</a> "
          + "<a href='http://markets.businessinsider.com/searchresults?_search=" + stock.isin + "' target='_blank'>"
            + "<img src='https://i.insider.com/596e4e7a552be51d008b50fd?width=600&format=jpeg&auto=webp' width='32' />"
          + "</a> "
          + "<a href='http://m.ariva.de/search/search.m?searchname=" + stock.isin + "' target='_blank'>"
            + "<img src='https://pbs.twimg.com/profile_images/435793734886645760/TmtKTE6Y.png' width='32' />"
          + "</a> "
          + "<a href='https://www.onvista.de/aktien/" + stock.isin + "' target='_blank'>"
            + "<img src='https://s.onvista.de/css-69545/web/portal/nl/layout_img/favicon.png' width='32' />"
          + "</a> "
          + "<a href='http://www.finanzen.net/suchergebnis.asp?_search=" + stock.isin + "' target='_blank'>"
            + "<img src='https://images.finanzen.net/images/favicon/favicon-32x32.png' width='32' />"
          + "</a> "
          + "<a href='https://www.consorsbank.de/euroWebDe/-?$part=Home.security-search&$event=search"
            + "&pattern=" + stock.isin + "' target='_blank'>"
            + "<img src='https://www.consorsbank.de/content/dam/de-cb/system/images/evr/favicon.ico' width='32' />"
          + "</a> "
          : "")
        + (stock.symbol ?
          "<a href='https://finance.yahoo.com/quote/" + stock.symbol + "' target='_blank'>"
            + "<img src='https://finance.yahoo.com/favicon.ico' width='32' />"
          + "</a> "
          + "<a href='https://www.google.de/search?tbm=fin&q=" + stock.symbol + "' target='_blank'>"
            + "<img src='https://www.google.de/images/branding/product/ico/googleg_lodp.ico' width='32' />"
          + "</a> "
          : "")
        + (stock.isin && stock.type == "ETF" ?
            "<a href='https://www.justetf.com/de/etf-profile.html?isin=" + stock.isin + "' target='_blank'>"
              + "<img src='https://www.justetf.com/images/logo/justetf_icon_m.png' width='32' />"
            + "</a> "
            + "<a href='https://de.extraetf.com/etf-profile/" + stock.isin + "' target='_blank'>"
              + "<img src='https://de.extraetf.com/favicon.ico' width='32' />"
            + "</a> "
            + "<a href='https://www.trackingdifferences.com/ETF/ISIN/" + stock.isin + "' target='_blank'>"
              + "<img src='https://www.trackingdifferences.com/images/favicon-32.png' width='32' />"
            + "</a> "
          : "")
        + (stock.wkn && stock.type == "Stock" ?
            "<a href='http://www.finanznachrichten.de/suche/suchergebnis.asp?words=" + stock.wkn + "' target='_blank'>"
              + "<img src='https://fns1.de/g/fb.png' width='32' />"
            + "</a> "
          : "")
        + "<div class='chartContainer'>"
          + "<div class='controls'><a class='active'>10d</a> <a>6m</a> <a>1y</a> <a>5y</a> <a>max</a></div>"
          + "<img src='" + this.tooltipStockChartUrl.replace("[TIME]", "10D").replace("[ID]", stock.comdirectId) + "' />"
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
          show: (event, api) => {
            $(api.elements.tooltip).find(".controls a").click((clickedLink) => {
              clickedLink = $.getSelectedControl(clickedLink);
              var src = this.tooltipStockChartUrl
                          .replace("[TIME]", clickedLink.text().replace("max", "SE").toUpperCase())
                          .replace("[ID]", stock.comdirectId);
              clickedLink.parent().parent().find("img").attr("src", src);
            });
          }
        }
      });
    });
  }
}