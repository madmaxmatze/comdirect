// module pattern: https://www.smashingmagazine.com/2011/10/essential-jquery-plugin-patterns/

(function($) {
    var DepotTable = (function($element, depot) {
        var visitedPortfolioKeys = JSON.parse(localStorage.getItem('portfoliokeys'));
        var tooltipStockChartUrl = "https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=[TIME]&TYPE=MOUNTAIN&ID_NOTATION=[ID]"

        init = function() {
            $("html").css("background", "none");

            $element.append(
                "<table class='mmmdepot tablesorter focus-highlight'>"
                    + "<thead>"
                        + "<tr>"
                            + "<th class='stockiterator'></th>"
                            + "<th class='alignleft stockname'></th>"
                            + "<th class='stocknote'>Note</th>"
                            + "<th class='stocktype'>Type</th>"
                            + "<th class='stockmarket'>Market</th>"
                            + "<th class='stockprice'>Price</th>"
                            + "<th class='stockpricediff'>%</th>"
                            + "<th class='stockbuydate'>BuyDate</th>"
                            + "<th class='stockbuycount'>BuyCount</th>"
                            + "<th class='stockbuyprice'>BuyPrice</th>"
                            + "<th class='totalbuyprice'>BuyValue</th>"
                            + "<th class='stockpriceabs'>Today</th>"
                            + "<th class='stocktotaldiff'>%</th>"
                            + "<th class='stocktotaldiffabs sortcolumn headerSortUp'>Abs</th>"
                            + "<th class='stocktotalvalue'>Value</th>"
                        + "</tr>"
                    + "</thead>"
                    + "<tbody></tbody>"
                    + "<tfoot></tfoot>"
                + "</table>");

            fillData();
            storePortfolioKey();
            initTableSorter();
            initMenu();
            initStockContextMenu();
        };

        fillData = function() {
            var tableBody = $element.find("tbody");
            for (var id in depot.stocks) {
                var stock = depot.stocks[id];
                tableBody.append(
                    $("<tr>")
                        .data("id", id)
                        .addClass(  (stock.count ? "" : " watchlist")
                                    + (stock.isDataFromToday ? "" : " isDataFromYesterday")
                                    + (stock.isDataOld ? " isDataOld" : "")
                        )
                        .append("<td class='stockiterator'>"
                                + "<td class='stockname'><a>" + stock.name + "</a></td>"
                                + "<td class='stocknote'>" + stock.note + "</td>"
                                + "<td class='stocktype'>" + stock.type + "</td>"
                                + "<td class='stockmarket'>" + stock.market + "</td>"
                                + "<td class='stockprice'>" + $.formatNumber(stock.price, stock.currency, 2) + "</td>"
                                + "<td class='stockpricediff' style='color: " + $.getColorForNumber(stock.priceDiffPercent * 100) + "'>" + $.formatNumber(stock.priceDiffPercent, "%", 1) + "</td>"
                                + "<td class='stockbuydate'>" + (stock.count ? stock.buyDate.toLocaleString(undefined, {"year": "2-digit", "month": "2-digit", "day": "2-digit"}).replace(/\,.*/g, "") : "") + "</td>"
                                + "<td class='stockbuycount'>" + (stock.count ? $.formatNumber(stock.count) : "") + "</td>"
                                + "<td class='stockbuyprice'>" + (stock.count ? $.formatNumber(stock.buyPrice, "€", 2) : "") + "</td>"
                                + "<td class='totalbuyprice'>" + (stock.count ? $.formatNumber(stock.buyValue, depot.currency, 0) : "") + "</td>"
                                + "<td class='stockpricediffabs' style='color: " + $.getColorForNumber(stock.valueDiffToday * 100) + "'>" + (stock.value ? $.formatNumber(stock.valueDiffToday, depot.currency) : "0") + "</td>"
                                + "<td class='stocktotaldiff' style='color: " + $.getColorForNumber((stock.value - stock.buyValue) / depot.value * 10000) + "'>" + (stock.value ? $.formatNumber(stock.valueDiffPercent, "%") : "0") + "</td>"
                                + "<td class='stocktotaldiffabs' style='color: " + $.getColorForNumber((stock.value - stock.buyValue) / depot.value * 10000) + "'>" + (stock.value ? $.formatNumber(stock.value - stock.buyValue, depot.currency) : "0") + "</td>"
                                + "<td class='stocktotalvalue'>" + (stock.value ? $.formatNumber(stock.value, depot.currency) : "") + "</td>"
                        )
                );
            }
        
            var buyValueCellContent = $.formatNumber(depot.buyValue, depot.currency, 0);
            if (depot.sharedKey) {
                buyValueCellContent = " <span style='background: red; color: white;'>" + buyValueCellContent + "</span>";
            }
           
            $element.find("tfoot").append(
                "<tr class='footer'>" +
                    "<th class='stockiterator'></th>" +
                    "<th class='stockname'>" +
                        // ($depot->getNewestStockTimestamp() ? $depot->getNewestStockTimestamp()->format(($depot->isTradingDay() ? "" : "y-m-d - ") . "H:i") : "") .
                    "</th>" +
                    "<th class='stocknote'></th>" +
                    "<th class='stocktype'></th>" + 
                    "<th class='stockmarket'></th>" +
                    "<th class='stockprice'></th>" +
                    "<th class='stockpricediff' style='color: " + $.getColorForNumber(depot.valueDiffPercentToday) + "'>" + 
                        $.formatNumber(depot.valueDiffPercentToday, "%", 1) +
                    "</th>" +
                    "<th class='stockbuydate'></th>" +
                    "<th class='stockbuycount'></th>" + 
                    "<th class='stockbuyprice'></th>" +
                    "<th class='totalbuyprice'>" + buyValueCellContent + "</th>" +
                    "<th class='stockpricediffabs' style='color: " + $.getColorForNumber(depot.valueDiffToday) + "'>" + 
                        $.formatNumber(depot.valueDiffToday, depot.currency, 0) +
                    "</th>" +
                    "<th class='stocktotaldiff' style='color:" + $.getColorForNumber(depot.valueDiffPercent) + "'>" +
                        $.formatNumber(depot.valueDiffPercent, "%", 1) +
                    "</th>" +
                    "<th class='stocktotaldiffabs' style='color:" + $.getColorForNumber(depot.valueDiff) + "'>" +
                        $.formatNumber(depot.valueDiff, depot.currency, 0) + 
                    "</th>" +
                    "<th class='stocktotalvalue'>" +
                        $.formatNumber(depot.value, depot.currency, 0) + 
                    "</th>" + 
                "</tr>"
            );
        };

        initMenu = function() {
            $element.find("tr th.stockname div").html("<div>" + 
                (depot.sharedKey ? " <span style='float: left; background: red; color: white; margin-right: 5px'>Public 1k</span>" : "") +
                "<span>" + depot.title + "</span>" + 
            "</div>");

            var html = (depot.key ? "<p><a href='http://www.comdirect.de/inf/musterdepot/pmd/freunde.html?portfolio_key=" + depot.key + "&SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO_PCT&SORTDIR=ASCENDING' target='_blank'>" +
                            "Original Comdirect Portfolio" +
                        "</a></p>" : "");

            html += (depot.key ? "<p><a href='?portfolio_key=s" + depot.key.substring(0, depot.key.length - 20) + "' target='_blank'>" +
                            "Share 1k-Public Portfolio" +
                        "</a></p>" : "");

            if (visitedPortfolioKeys && Object.keys(visitedPortfolioKeys).length > 1) {
                html += "Recently visited:" +
                        "<ul style='margin-top: 0;'>";
                for (var prop in visitedPortfolioKeys) {
                    if (prop && prop != depot.key && prop != depot.sharedKey && visitedPortfolioKeys[prop]) {
                        html += "<li><a href='?portfolio_key=" + prop + "'>" + visitedPortfolioKeys[prop] + "</a></li>";
                    }
                }
                html += "</ul>";
            }
           
            if (html) {
                var menuElement = $( "<div class='menu'>≡</div>" );
                $element.after(menuElement);
                menuElement.qtip({
                    content: {
                        // title: "Menu",
                        // button: 'Close',
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
            $element.children("table").tablesorter({
                sortList: [[13,0], [1,0]],
                sortAppend: [[1,0]],
                widgets: ["zebra", "columns"],
                widgetOptions : {
                    columns: [ "sortcolumn" ]   // css class for sorted column
                },
                usNumberFormat: false,
                headers: {
                    0 : { sorter: false }
                }
            });
        }

        setTooltipChartDuration = function (clickedLink, comdirectId) {
            var link = $(clickedLink.target);
            link.parent().find("a").removeClass("active");
            link.addClass("active");
            
            var duration = link.text();
            if (duration == "max") {
                duration = "SE";
            }
            
            link.parent().parent().find("img").attr("src", tooltipStockChartUrl.replace("[TIME]", duration).replace("[ID]", comdirectId));
        };

        initStockContextMenu = function () {
            $element.find('tbody tr').each(function() {
                var row = $(this);            
                var cell = row.find("td.stockname");
                var id = row.data("id");
                var stock = depot.stocks[id];

                var html = "<div style='max-width: 500px'>" +
                            "<div style='margin: 5px 0'>" +  
                                stock.price + "€ " + stock.priceDiff + "€ " + 
                                (typeof stock.priceDiffPercent !== 'undefined' ? stock.priceDiffPercent + "%" : "") + 
                                "<br>" + 
                                stock.market + " | " + stock.type +
                                (stock.wkn ? " | " + stock.wkn : "") +
                                (stock.isin ? " | " + stock.isin : "") +
                            "</div>";
                         
                if (stock.count) {
                    html += (stock.note ? "<div style='font-weight: bold; margin: 5px 0'>\"" + stock.note + "\"</div>" : "");

                    html += stock.buyDate.toLocaleString() + "<br>" + 
                            stock.count + " x " + stock.buyPrice + "€ = <br>";
                      
                    html += "<table style='margin: 5px; border-spacing: 0px;'>" + 
                                "<tr>" + 
                                    "<td></td>" +
                                    "<td style='text-align: right;'>" +
                                        stock.buyValue.toLocaleString() + "€" +
                                    "</td>" + 
                                    "<td style='text-align:right; color: gray'></td>" +
                                "</tr>" +
                                "<tr style='color:" + (stock.valueDiffPercent > 0 ? "green" : "red") + "'>" + 
                                    "<td>" +
                                        (stock.valueDiffPercent > 0 ? "+" : "-") + 
                                    "</td><td style='text-align: right;'>" +
                                        Math.abs(stock.valueDiff).toLocaleString() + "€" +
                                    "</td><td style='text-align:right'>" +
                                        "(" + (stock.valueDiffPercent > 0 ? "+" : "") + stock.valueDiffPercent + "%)" + 
                                    "</td>" +
                                "</tr>" + 
                                "<tr>" + 
                                    "<td colspan=2 style='text-align: right; border-top: 1px solid #333; font-weight:bold'>" +
                                        stock.value.toLocaleString() + "€" + 
                                    "</td>" + 
                                    "<td style='text-align:right; color: gray'></td>" + 
                                "</tr>" +
                            "</table>" +
                            "<br>"; 
                }

                html += "<a href='https://www.comdirect.de/inf/aktien/detail/uebersicht.html?ID_NOTATION=" + stock.comdirectId + "' target='_blank'><img src='https://lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w32' width='32' /></a> " +
                        (stock.isin ? 
                            "<a href='https://aktie.traderfox.com/visualizations/" + stock.isin + "' target='_blank'><img src='https://pbs.twimg.com/profile_images/797361743626465280/eAhqkp1P_400x400.jpg' width='32' /></a> " 
                            + "<a href='http://markets.businessinsider.com/searchresults?_search=" + stock.isin + "' target='_blank'><img src='https://static1.businessinsider.com/assets/images/us/favicons/favicon-32x32.png' width='32' /></a> " 
                            + "<a href='http://m.ariva.de/search/search.m?searchname=" + stock.isin + "' target='_blank'><img src='https://pbs.twimg.com/profile_images/435793734886645760/TmtKTE6Y.png' width='32' /></a> " 
                            + "<a href='https://www.onvista.de/aktien/" + stock.isin + "' target='_blank'><img src='https://s.onvista.de/css-69545/web/portal/nl/layout_img/favicon.png' width='32' /></a> " 
                            + "<a href='http://www.finanzen.net/suchergebnis.asp?_search=" + stock.isin + "' target='_blank'><img src='https://images.finanzen.net/images/favicon/favicon-32x32.png' width='32' /></a> " 
                            + "<a href='https://www.consorsbank.de/euroWebDe/-?$part=Home.security-search&$event=search&pattern=" + stock.isin + "' target='_blank'><img src='https://www.consorsbank.de/content/dam/de-cb/system/images/evr/favicon.ico' width='32' /></a> " 
                            : "") +
                        (stock.symbol ? 
                           "<a href='https://finance.yahoo.com/quote/" + stock.symbol + "' target='_blank'><img src='https://finance.yahoo.com/favicon.ico' width='32' /></a> " 
                           + "<a href='https://www.google.de/search?tbm=fin&q=" + stock.symbol + "' target='_blank'><img src='https://www.google.de/images/branding/product/ico/googleg_lodp.ico' width='32' /></a> " 
                            : "") +
                        (stock.wkn && stock.type == "Stock" ? 
                            "<a href='http://www.finanznachrichten.de/suche/suchergebnis.asp?words=" + stock.wkn + "' target='_blank'><img src='https://fns1.de/g/fb.png' width='32' /></a> " 
                            : "") +

                        "<div class='chart'>" + 
                            "<div class='controls'><a class='active'>10d</a> <a>6m</a> <a>5y</a> <a>max</a></div>" + 
                            "<img src='" + tooltipStockChartUrl.replace("[TIME]", "10D").replace("[ID]", stock.comdirectId) + "' />" +
                        "</div>";

                html += "</div>";
               
                cell.qtip({
                    prerender: false,
                    content: {
                        title: stock.name + (stock.symbol ? " (" + stock.symbol + ")" : ""),
                        button: 'Close',
                        text: html
                    },
                    position: {
                        my: 'top left',
                        at: 'top left',
                        target: cell
                    },
                    show: {
                        event: 'click',
                        solo: true
                    },
                    hide: {
                        fixed: true,
                        delay: 300
                    },
                    events: {
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



(function($) {
    var PortfolioHistoryChart = (function($element, portfolioKey) {
        var dataTable = null;
        var dataView = null;
        var duration = null;
        var chart = null;
        var chartOptions = {
            width: '100%',
            height: 400,
            hAxis: {
                textStyle : {
                    fontSize: 12 // or the number you want
                }
            },
            animation: {
                duration: 600,
                easing: 'inAndOut',
            },
            focusTarget: 'category',
            chartArea: {
                top: 10,
                bottom: 40,
                left: 40,
                right: 40
            },
            tooltip: {isHtml: true},
            isStacked: 'absolute',
            vAxes: {
                0: { 
                    format: 'short',
                    textStyle : {
                    //    color: '#006600',
                        fontSize: 12
                    }
                },
                1: {
                    // baselineColor: '#98B3F0',
                    gridlines: {
                        count : 0
                    },
                    format: 'percent',
                    textStyle : {
                    //    color: '#0000FF',
                        fontSize: 12
                    }
                }
            },
            annotations: {
                textStyle: {
                    fontSize: 8,
                    color: '#000000',
                    // The color of the text outline.
                    auraColor: '#FFFFFF',
                    // The transparency of the text.
                    // opacity: 0.8
                }
            },
            legend: 'none', // {position: 'right', textStyle: {color: 'blue', fontSize: 16}},
            seriesType: 'area',
            series: {
                0: {
                    targetAxisIndex: 0,
                    lineWidth: 0,
                    color: '#777777'    // gray area
                },
                1: {
                    targetAxisIndex: 0,
                    lineWidth: 0,
                    color: '#006600'    // green area
                },
                2: {
                    targetAxisIndex: 0,
                    lineWidth: 0,
                    color: '#FFBBBB'    // red area
                },
                3: {
                    targetAxisIndex: 0,
                    type: 'line',
                    lineWidth: 1
                },
                4: {
                    targetAxisIndex: 1,
                    type: 'line',
                    lineWidth: 1,
                    lineDashStyle: [4, 4]
                }
            }
        };

        init = function() {
            loadData();
            $(window).on('resizeEnd', drawChart);
        
            $element.append("<div></div><div class='controls'><a data-duration='31'>1m</a> <a data-duration='184'>6m</a> <a data-duration='365'>1y</a> <a>max</a></div>");
            $element.find("a").click(setDuration);
            chart = new google.visualization.ComboChart($element.find("div")[0]);
        };

        setDuration = function (clickedLink) {
            var link = $(clickedLink.target);
            link.parent().find("a").removeClass("active");
            link.addClass("active");
            
            duration = link.data("duration");
            
            drawChart();
        };

        loadData = function () {
            $.ajax({
                url: "https://apps.mathiasnitzsche.de/comdirect/data.php?type=history&portfolio_key=" + portfolioKey,
                jsonp: "wrapper",
                dataType: "jsonp",
                // jsonpCallback: 'historyData',
                async: true, // not working with jsonp
                success: function(response) {
                    dataTable = new google.visualization.DataTable(response);
                    prepareDataView();
                    $element.find("a:nth-child(2)").click();
                }
            });
        }

        prepareDataView = function(){
            dataView = new google.visualization.DataView(dataTable);
            
            dataView.setColumns([
                0 // date
                ,{ // tooltip
                    type: 'string'
                    ,role: 'tooltip'
                    ,properties: {
                         html: true
                    }
                    ,calc: function (dt, row) {
                        var date = dt.getValue(row, 0);
                        //removing the timezone offset.
                        date.setHours(0, -date.getTimezoneOffset(), 0, 0); 
                        var value = dt.getValue(row, 1);
                        var diff = dt.getValue(row, 2);
                        var percent = (diff / (value - diff) * 100).toFixed(1);
                        var weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                   
                        return  "<table style='margin: 5px; border-spacing: 0px;'>" + 
                                    "<tr>" +
                                        "<td colspan=3 style='font-weight:bold'>" +
                                            date.toISOString().substr(0, 10) + ", " + weekdays[date.getDay()] + 
                                        "</td>" + 
                                    "</tr>" + 
                                    "<tr>" + 
                                        "<td></td>" +
                                        "<td style='text-align: right;'>" +
                                            (value - diff).toLocaleString() + "€" +
                                        "</td>" + 
                                        "<td></td>" +
                                    "</tr>" +
                                    "<tr style='color:" + (diff > 0 ? "green" : "red") + "'>" + 
                                        "<td>" +
                                            (diff > 0 ? "+" : "-") + 
                                        "</td><td style='text-align: right;'>" +
                                            Math.abs(diff).toLocaleString() + "€" +
                                        "</td><td>" +
                                            "(" + (diff > 0 ? "+" : "") + percent + "%)" + 
                                        "</td>" +
                                    "</tr>" + 
                                    "<tr>" + 
                                        "<td colspan=2 style='text-align: right; border-top: 1px solid #333; font-weight:bold'>" +
                                            value.toLocaleString() + "€" + 
                                        "</td>" + 
                                        "<td></td>" + 
                                    "</tr>" +
                                "</table>";
                    }
                }
                ,{ // gray area
                    calc: function (dt, row) {
                        var value = dt.getValue(row, 1);
                        var diff = dt.getValue(row, 2);
                        return value - Math.max(diff, 0);
                    }
                    ,type:'number'
                }
                ,{ // green area
                    calc: function (dt, row) {
                        var diff = dt.getValue(row, 2);
                        return Math.max(diff, 0);
                    }
                    ,type:'number'
                }
                ,{ // red area
                    calc: function (dt, row) {
                        var diff = dt.getValue(row, 2);
                        return Math.abs(Math.min(diff, 0));
                    }
                    ,type:'number'
                }
                ,1 // total value red/green line
                ,{ // + styling
                    calc: function (dt, row) {
                        var diff = dt.getValue(row, 2);
                        return "color:" + (diff > 0 ? "green" : "red");
                    }
                    ,type: 'string'
                    ,role: 'style'    
                }
                ,{ // + annotationMarker
                    calc: function (dt, row) {
                        return (row == 0 ? "absolute" : null);
                    }
                    ,type: 'string'
                    ,role: 'annotation'    
                }
                ,{ // percentage value red/green line
                    calc: function (dt, row) {
                        var value = dt.getValue(row, 1);
                        var diff = dt.getValue(row, 2);
                        return diff / (value - diff);
                    }
                    ,type:'number'
                }
                ,{ //  + styling
                    calc: function (dt, row) {
                        var diff = dt.getValue(row, 2);
                        return "color:" + (diff > 0 ? "green" : "red");
                    }
                    ,type: 'string'
                    ,role: 'style'    
                }
                ,{ // + annotationMarker
                    calc: function (dt, row) {
                        return (row == 0 ? "percental" : null);
                    }
                    ,type: 'string'
                    ,role: 'annotation'    
                }
            ]);
        }

        drawChart = function() {
            var priorDate = new Date().setDate((new Date()).getDate() - duration);
            dataView.setRows(dataTable.getFilteredRows([{column: 0, minValue: priorDate}]));

            /* change to image
            google.visualization.events.addListener(linearChart, 'ready', function () {
               element.innerHTML = '<img src="' + linearChart.getImageURI() + '">';
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





(function($) {
    var ProfitAndLossChart = (function($element, depot) {
        var dataTable = null;
        var dataView = null;
        var chartOptions = {
            bar: {groupWidth: "80%"},
            bars: 'horizontal',
            legend: { position: "none" },
            isStacked: true,
            focusTarget: 'category',
            theme: 'material',
            width: '100%',
            height: 600,
            backgroundColor : "transparent",
            hAxis: {
                format : "short"
            },
            chartArea: {
              top: 10,
              bottom: 25,
              left: 125,
              right: 25
            },
            tooltip: {isHtml: true},         
            annotations: {
                style: "point",
                textStyle: {
                  fontSize: 10,
                  bold: true,
                  // italic: true,
                  // The color of the text.
                  color: '#333',
                  // The color of the text outline.
                  // auraColor: '#eee',
                  // The transparency of the text.
                  // opacity: 0.8
                }
            },
            series: {
                0: {
                    targetAxisIndex: 0,
                    lineWidth: 0,
                    color: '#777777'    // gray area
                },
                1: {
                    targetAxisIndex: 0,
                    lineWidth: 0,
                    color: '#006600'    // green area
                },
                2: {
                    targetAxisIndex: 0,
                    lineWidth: 0,
                    dataOpacity: 0.1,
                    color: '#ff7777'    // red area
                }
            }
        };

        init = function() {
            loadData();
            drawChart1();
            $(window).on('resizeEnd', drawChart1);
        };

        loadData = function () {
            dataTable = new google.visualization.DataTable();
            dataTable.addColumn('string', "Name");
            dataTable.addColumn({role: 'tooltip', type: 'string', p: {'html': true}});
            dataTable.addColumn('number', "Gray");
            dataTable.addColumn('number', "Green");
            dataTable.addColumn({role: "annotation", type: "string"});
            dataTable.addColumn('number', "Red");

            for (var id in depot.stocks) {
                var stock = depot.stocks[id];
                if (stock.count) {
                    var tooltipHtml = "<table style='margin: 5px; border-spacing: 0px;'>" + 
                            "<tr>" +
                                "<td colspan=3 style='font-weight:bold'>" +
                                    stock.name.substr(0, 50) + 
                                "</td>" + 
                            "</tr>" + 
                            "<tr>" + 
                                "<td></td>" +
                                "<td style='text-align: right;'>" +
                                    stock.buyValue.toLocaleString() + "€" +
                                "</td>" + 
                                "<td style='text-align:right; color: gray'>(" + stock.buyPrice + "€)</td>" +
                            "</tr>" +
                            "<tr style='color:" + (stock.valueDiffPercent > 0 ? "green" : "red") + "'>" + 
                                "<td>" +
                                    (stock.valueDiffPercent > 0 ? "+" : "-") + 
                                "</td><td style='text-align: right;'>" +
                                    Math.abs(stock.valueDiff).toLocaleString() + "€" +
                                "</td><td style='text-align:right'>" +
                                    "(" + (stock.valueDiffPercent > 0 ? "+" : "") + stock.valueDiffPercent + "%)" + 
                                "</td>" +
                            "</tr>" + 
                            "<tr>" + 
                                "<td colspan=2 style='text-align: right; border-top: 1px solid #333; font-weight:bold'>" +
                                    stock.value.toLocaleString() + "€" + 
                                "</td>" + 
                                "<td style='text-align:right; color: gray'>(" + stock.price + "€)</td>" + 
                            "</tr>" +
                        "</table>";

                    dataTable.addRow([
                        stock.name.substr(0, 50),                   // label
                        tooltipHtml,                                // tooltip
                        Math.min(stock.value, stock.buyValue),      // gray
                        Math.max(0, stock.valueDiff),               // green
                        ((stock.valueDiffPercent > 0 ? "+" : "") +  // annotation
                           stock.valueDiffPercent.toFixed(Math.abs(stock.valueDiffPercent) > 10 ? 0 : 1) + "%"),
                        Math.max(0, stock.valueDiff * -1)           // red
                    ]);
                }
            }
        }

        drawChart1 = function() {
            chartOptions.height = dataTable.getNumberOfRows() * 20 + 80;
            
            var chart = new google.visualization.BarChart($element[0]);
            chart.draw(dataTable, chartOptions);
        }
        
        init();
    });

    $.fn.profitAndLossChart = function(depot) {
        new ProfitAndLossChart($(this), depot);
        return this;
    };
})(jQuery);




(function($) {
    var ShareChart = (function($element, depot) {
        var dataTable = null;
        var dataView = null;
        var duration = "today";
        var chart = null;
        var chartOptions = {
            animation: {
                duration: 300,
                easing: 'inAndOut',
            },
            highlightOnMouseOver: true,
            maxDepth: 0,
            showScale: true,
            minColorValue: -50, 
            maxColorValue: 50,
            minColor: '#ff0000', 
            midColor: '#cccccc',
            maxColor: '#009900',
            noColor: '#FFFFFF',
            width: '100%',
            height: 400,

            generateTooltip: function (row, share, color) {
                var stockId = dataTable.getValue(row, 6);
                var stock = depot.stocks[stockId];
              
                return '<div style="background:#eee; padding:3px; border:1px solid #777">' + 
                            "<b>" + stock.name + (stock.symbol ? " ("  + stock.symbol + ")" : "") + "</b><br>" +
                            "share: " + (share * 100).toFixed(1) + "%" + "<br>" +
                            "total: " + (stock.valueDiffPercent > 0 ? "+" : "") + stock.valueDiffPercent.toFixed(1) + "%<br>" + 
                            (stock.isDataFromToday ? "today: " + (stock.priceDiffPercent > 0 ? "+" : "") + stock.priceDiffPercent.toFixed(1) + "%" : "") + 
                        ' </div>';
            }
        };

        init = function() {
            $element.html("<div></div><div class='controls'><a>today</a> <a>all</a></div>");
 
            prepareDataView2();
            
            $(window).on('resizeEnd', drawChart2);

            chart = new google.visualization.TreeMap($element.find("div:first")[0]);
            google.visualization.events.addListener(chart, 'select', function () {
                chart.setSelection([]);
            });

            $element.find("a").click(setDuration);
            $element.find("a:first").click();
        };

        setDuration = function (clickedLink) {
            duration = clickedLink.target.innerText;
            $(clickedLink.target).parent().find("a").removeClass("active");
            $(clickedLink.target).addClass("active");
            drawChart2();
        };
        
        prepareDataView2 = function(){
            var rootKey = "Portfolio";

            dataTable = new google.visualization.DataTable();
            dataTable.addColumn('string', "LabelToday");
            dataTable.addColumn('string', "Parent");
            dataTable.addColumn('number', "Size");
            dataTable.addColumn('number', "ColorToday");
            dataTable.addColumn('string', "LabelTotal");
            dataTable.addColumn('number', "ColorTotal");
            dataTable.addColumn('number', "StockId");
            
            dataTable.addRow([rootKey, "", 0, 0, rootKey, 0, 0]);

            for (var id in depot.stocks) {
                var stock = depot.stocks[id];
                if (stock.count) {
                    var label = stock.name;
    
                    if (stock.symbol) {
                        if (stock.symbol.length < label.length) {
                            label = stock.symbol;
                        } else {
                            label = label.toUpperCase();
                        }
                    }
                    var share = stock.value / depot.value * 100;
                    var sharelabel = share.toFixed(share >= 10 ? 0 : 1) + "%";

                    var todayLabel = (stock.priceDiffPercent > 0 ? "+" : "") + stock.priceDiffPercent.toFixed(Math.abs(stock.priceDiffPercent) >= 10 ? 0 : 1) + "%";
                    var totalLabel = (stock.valueDiffPercent > 0 ? "+" : "") + stock.valueDiffPercent.toFixed(Math.abs(stock.valueDiffPercent) >= 10 ? 0 : 1) + "%";
                    
                    totalLabel = label + "(" + totalLabel + ", " + sharelabel + ")";
                    todayLabel = label + "(" + (stock.isDataFromToday ? todayLabel + ", " : "") + sharelabel + ")";

                    dataTable.addRow([
                        todayLabel,
                        rootKey,
                        stock.value / depot.value, 
                        (stock.isDataFromToday ? stock.priceDiffPercent : null),
                        totalLabel,
                        stock.valueDiffPercent,
                        parseInt(id)
                    ]);
                }
            }

            dataView = new google.visualization.DataView(dataTable); 
        }

        drawChart2 = function() {
            if (duration == "today") {
                chartOptions.minColorValue = -5; 
                chartOptions.maxColorValue = 5;
                dataView.setColumns([0, 1, 2, 3]);
            } else {
                chartOptions.minColorValue = -50; 
                chartOptions.maxColorValue = 50;
                dataView.setColumns([4, 1, 2, 5]); 
            }
        
            chart.draw(dataView, chartOptions);           
        }
        
        init();
    });

    $.fn.shareChart = function(depot) {
        new ShareChart($(this), depot);
        return this;
    };
})(jQuery);




(function($) {
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
                $(this).attr('src', imgUrl.replace('TIMEPLACEHOLDER', duration.toUpperCase()))
                        .fadeIn('fast');
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
                html += "<span style='color: " + (parseInt(i) ? "white" : "#" + colors[i]) + "; font-size: 10pt; white-space: nowrap; background-color: " + (parseInt(i) ? "#" + colors[i] : "transparent;") + ";'> " + 
                            realStocks[i].name + 
                        " </span> &#160;";
            }

            imgUrl = imgUrl.replace("IDPLACEHOLDER", ids.join('+'));
            imgUrl = imgUrl.replace("COLORPLACEHOLDER", colors.join('+'));
            
            $element.html(  "<b>Top10 Stocks (" + Math.round(top10value / depot.value * 100) + "% of total)</b><br>" +
                            "<img src='' /><br />" + 
                            html + "<br>" +
                            "<div class='controls' style='top:50px'><a>10d</a> <a>6m</a> <a>5y</a> <a>max</a></div>"
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
 




(function ($) {
    $.extend({
        getColorForNumber: function (numberBetweenMinusAndPlus100) {            
            var minColor = 80;
            var maxColor = 230;
            var number = numberBetweenMinusAndPlus100  * (maxColor - minColor) / 100;

            var red = Math.round(Math.min(maxColor, minColor - (number < 0 ? number : 0)));
            var green = Math.round(Math.min(maxColor, minColor + (number > 0 ? number : 0)));

            return "rgb(" + red + "," + green + "," + minColor + ")";
        },

        formatNumber: function (number, type, decimals) {  
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

            var formatOptions = {
                maximumFractionDigits : decimals,
                minimumFractionDigits : decimals
            };

            var formatter = new Intl.NumberFormat('de-DE', formatOptions);
            number = formatter.format(number)
                + (type == "percent" || type == "%" ? "%" : "")
                + (type == "EUR" || type == "€" ? "€" : "")
                + (type == "DOL" || type == "USD" || type == "$" ? "$" : "")
            ;
            
            return number; 
        }
    });
})(jQuery);



$(function() {
    // to prevent error in browsers which not support console.log
    if(typeof window.console === "undefined") {
        window.console = {
            log: function() {}
        };
    }
    window.console.log ("Hope you like the app! https://mathiasnitzsche.de/comdirect");

    // create trigger to resizeEnd event     
    // https://stackoverflow.com/questions/8950761/google-chart-redraw-scale-on-window-resize
    $(window).resize(function() {
        if(this.resizeTO) {
            clearTimeout(this.resizeTO);
        }
        this.resizeTO = setTimeout(function() {
            $(this).trigger('resizeEnd');
        }, 500);
    });


    // Load depot from backend
    var url = new URL(window.location);
    var portfolioKey = url.searchParams.get("portfolio_key");

    if (portfolioKey) {
        $("body").append(
            "<div id='depot_table'></div>"
            + "<div id='depot_chart_share' class='chart'></div>"
            + "<div id='depot_chart_dev' class='chart'></div>"
            + "<div id='depot_chart_history' class='chart'></div>"
            + "<div id='depot_chart_pnl' class='chart'></div>"
        );

        $.ajax({
            url: "https://apps.mathiasnitzsche.de/comdirect/data.php?type=stocks&portfolio_key=" + portfolioKey,
            jsonp: "wrapper",
            dataType: "jsonp",
            // jsonpCallback: 'historyData',
            async: true, // not working with jsonp
            success: function(depot) {
                // precalc some values in depot
                var today = (new Date());
                depot.value = 0;
                depot.buyValue = 0;
                depot.valueDiffToday = 0;

                for (var id in depot.stocks) {
                    depot.stocks[id].priceDiffPercent = Math.round(depot.stocks[id].priceDiff / (depot.stocks[id].price - depot.stocks[id].priceDiff) * 10000) / 100;
                
                    if (depot.stocks[id].date) {
                        depot.stocks[id].date = new Date(depot.stocks[id].date);
                        depot.stocks[id].isDataFromToday =  today.getFullYear() === depot.stocks[id].date.getFullYear() &&
                                                            today.getMonth() === depot.stocks[id].date.getMonth() &&
                                                            today.getDate() === depot.stocks[id].date.getDate();
                        depot.stocks[id].isDataOld = (Math.abs(today.getTime() - depot.stocks[id].date.getTime()) > 2000);
                        if (!depot.date || depot.date < depot.stocks[id].date) {
                            depot.date = depot.stocks[id].date;
                        }
                    }

                    if (depot.stocks[id].count) {
                        depot.value += depot.stocks[id].value;
                        depot.buyValue += depot.stocks[id].buyValue;
                        if (depot.stocks[id].isDataFromToday) {
                            depot.valueDiffToday += depot.stocks[id].valueDiffToday;
                        }

                        if (depot.stocks[id].buyDate) {
                            depot.stocks[id].buyDate = new Date(depot.stocks[id].buyDate);
                        }
                        depot.stocks[id].valueDiff = depot.stocks[id].value - depot.stocks[id].buyValue;
                        depot.stocks[id].valueDiffPercent = Math.round(depot.stocks[id].valueDiff / depot.stocks[id].buyValue * 10000) / 100;
                    }
                }
                depot.isDataFromToday = today.getFullYear() === depot.date.getFullYear()
                                        && today.getMonth() === depot.date.getMonth()
                                        && today.getDate() === depot.date.getDate();
                
                depot.valueDiffPercentToday = Math.round(depot.valueDiffToday / depot.value * 10000) / 100;

                depot.valueDiff = depot.value - depot.buyValue;
                depot.valueDiffPercent = Math.round(depot.valueDiff / depot.buyValue * 10000) / 100;
                
                if (url.searchParams.get("dark")) {
                    $("html").addClass("darkmode");
                }

                $("head title").text(depot.title);

                $("#depot_table").depotTable(depot);

                google.charts.load('current', {'packages': ['corechart', 'treemap', 'bar']});
                google.charts.setOnLoadCallback(function() {
                    $("#depot_chart_share").shareChart(depot);
                    $("#depot_chart_dev").depotDevelopmentChart(depot);
                    $("#depot_chart_history").portfolioHistoryChart(portfolioKey);
                    $("#depot_chart_pnl").profitAndLossChart(depot);
                    // last 12 months chart: https://developers.google.com/chart/interactive/docs/gallery/calendar
                });    
            }
        });
    }
});
