// https://www.smashingmagazine.com/2011/10/essential-jquery-plugin-patterns/

(function ($) {
    $.extend({
        init: function () {
            // http://jquery.eisbehr.de/lazy/
            $('.lazy').Lazy();

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
        }
    });
})(jQuery);






(function($) {
    var DepotTable = (function($element) {
        
        var portfolioKey = $element.data("portfoliokey"),
            portfolioTitle = $element.data("portfoliotitle"),
            visitedPortfolioKeys = JSON.parse(localStorage.getItem('portfoliokeys'));
       
        init = function() {
            storePortfolioKey();
            initTableSorter();
            initMenu();
            initStockContextMenu();
        };

        initMenu = function() {
            var menuElement = $( "<div class='menu'>≡</div>" );
            $element.after(menuElement);
          
            var html =  "<a href='http://www.comdirect.de/inf/musterdepot/pmd/freunde.html?portfolio_key=" + portfolioKey + "&SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO_PCT&SORTDIR=ASCENDING' target='_blank'>" +
                            "Open Comdirect" +
                        "</a>";

            if (Object.keys(visitedPortfolioKeys).length > 1) {
                html += "<br><br>Recently opened:<br>";
                for (var prop in visitedPortfolioKeys) {
                    if (prop != portfolioKey) {
                        html += "<a href='?portfolio_key=" + prop + "'>" + visitedPortfolioKeys[prop] + "</a><br>";
                    }
                }
            }
           
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


        initTableSorter = function () {
            $element.tablesorter({
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

        initStockContextMenu = function () {
            $element.find('[data-comdirectid!=""]').each(function() {
                var row = $(this);
                var comdirectId = row.data("comdirectid"),
                    stockType = row.data("type"),
                    isin = row.data("isin"),
                    wkn = row.data("wkn"),
                    symbol = row.data("symbol"),
                    cell = row.find("td.stockname"),
                    stockcount = row.find("td.stockcount").text();
                                
                    /*
                    Tradergate | 24.03.20
                    ---
                     9.382€ (31,27€ x 300)
                    +3.209€ (+34,2%)
                    ----------------
                    12.591€ (41,97€)
                    */

                    var html = "<a href='https://www.comdirect.de/inf/aktien/detail/uebersicht.html?ID_NOTATION=" + comdirectId + "' target='_blank'><img src='//lh3.ggpht.com/oDdHm6AlrMpjCIazyHQVzeEIcH28_7RSi7CGTUFz629aV6t0M2nAmHG93ZhSJqifGtw=w32' width='32' /></a> " +
                                (symbol ? 
                                   "<a href='https://finance.yahoo.com/quote/" + symbol + "' target='_blank'><img src='//finance.yahoo.com/favicon.ico' width='32' /></a> " 
                                   + "<a href='https://www.google.de/search?tbm=fin&q=" + symbol + "' target='_blank'><img src='//www.google.de/images/branding/product/ico/googleg_lodp.ico' width='32' /></a> " 
                                    : "") +
                                (isin ? 
                                    "<a href='http://markets.businessinsider.com/searchresults?_search=" + isin + "' target='_blank'><img src='//static1.businessinsider.com/assets/images/us/favicons/favicon-32x32.png' width='32' /></a> " 
                                    + "<a href='http://m.ariva.de/search/search.m?searchname=" + isin + "' target='_blank'><img src='//pbs.twimg.com/profile_images/435793734886645760/TmtKTE6Y.png' width='32' /></a> " 
                                    + "<a href='https://www.onvista.de/aktien/" + isin + "' target='_blank'><img src='//s.onvista.de/css-69545/web/portal/nl/layout_img/favicon.png' width='32' /></a> " 
                                    + "<a href='http://www.finanzen.net/suchergebnis.asp?_search=" + isin + "' target='_blank'><img src='//images.finanzen.net/images/favicon/favicon-32x32.png' width='32' /></a> " 
                                    + "<a href='https://www.consorsbank.de/euroWebDe/-?$part=Home.security-search&$event=search&pattern=" + isin + "' target='_blank'><img src='https://www.consorsbank.de/content/dam/de-cb/system/images/evr/favicon.ico' width='32' /></a> " 
                                    : "") +
                                (wkn && stockType == "Stock" ? 
                                    "<a href='http://www.finanznachrichten.de/suche/suchergebnis.asp?words=" + wkn + "' target='_blank'><img src='//fns1.de/g/fb.png' width='32' /></a> " 
                                    : "") +
                                "<br />" +
                                "<img src='https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=5Y&TYPE=MOUNTAIN&ID_NOTATION=" + comdirectId + "'> " +
                                "<img src='https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=6M&TYPE=MOUNTAIN&ID_NOTATION=" + comdirectId + "'> " +
                                "<img src='https://charts.comdirect.de/charts/rebrush/design_small.ewf.chart?WIDTH=256&HEIGHT=173&TIME_SPAN=10D&TYPE=MOUNTAIN&ID_NOTATION=" + comdirectId + "'> "
                                ;
               
                cell.qtip({
                    content: {
                        title: cell.text(),
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
                    }
                });
            });
        }

        storePortfolioKey = function () {
            // save all portfolios
            if (!visitedPortfolioKeys) {
                visitedPortfolioKeys = {};
            }
            visitedPortfolioKeys[portfolioKey] = portfolioTitle;

            // and here is the functions side effect ;D
            localStorage.setItem('portfoliokeys', JSON.stringify(visitedPortfolioKeys));
        }

        init();

        return {
            'getPortfolioKey' : function () {
                return portfolioKey;
            }
        }
    });

    $.fn.depotTable = function() {
        var depotTable = new DepotTable($(this));
        return depotTable;
    };
})(jQuery);





(function($) {
    var DevelopmentImage = (function($element) {
 
        $element.click(function() {
            var src = $(this).attr('src')
                        .replace('10D', 'PLACEHOLDER')
                        .replace('SE', '10D')
                        .replace('5Y', 'SE')
                        .replace('6M', '5Y')
                        .replace('PLACEHOLDER', '6M');
            $(this).attr('src', src);
        });  

    });

    $.fn.developmentImage = function() {
        new DevelopmentImage($(this));
        return this;
    };
})(jQuery);





(function($) {
    var PortfolioHistoryChart = (function($element, portfolioKey) {
        var dataTable = null;
        var dataView = null;
        
        init = function() {
            google.charts.load('current', {'packages': ['corechart']});
            google.charts.setOnLoadCallback(loadData);
            $(window).on('resizeEnd', drawChart);
        };

        loadData = function () {
            $.ajax({
                url: "data.php?type=history&portfolio_key=" + portfolioKey,
                // dataType: "json",
                // The name of the callback parameter, as specified by the YQL service
                jsonp: "wrapper",

                // Tell jQuery we're expecting JSONP
                dataType: "jsonp",
                // jsonpCallback: 'historyData',
                async: true, // not working with jsonp
              
                // Work with the response
                success: function(response) {
                    dataTable = new google.visualization.DataTable(response);
                    prepareData();
                    drawChart();
                }
            });
        }

        prepareData = function(){
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
            var linearChartOptions = {
                // title: 'World Population Since 1400 A.D. in Linear Scale',
                // legend: 'none',
                width: '100%',
                height: 400,
                hAxis: {
                    // title: 'Date',
                    /* https://developers.google.com/chart/interactive/docs/datesandtimes#axesgridlinesticks
                    ridlines: {
                        interval: [7]
                    },
                    minorGridlines: {
                        interval: [1]
                    },
                    */
                    textStyle : {
                        fontSize: 12 // or the number you want
                    }
                },
                // This line makes the entire category's
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
                    lineWidth: 1,
                  },
                  4: {
                    targetAxisIndex: 1,
                    type: 'line',
                    lineWidth: 1,
                    lineDashStyle: [4, 4]
                  },
                }
            };
            
            /* change to image
            google.visualization.events.addListener(linearChart, 'ready', function () {
               element.innerHTML = '<img src="' + linearChart.getImageURI() + '">';
            }); 
            */
            
            var linearChart = new google.visualization.ComboChart($element[0]);
            linearChart.draw(dataView, linearChartOptions);
        }
        
        init();
    });

    $.fn.portfolioHistoryChart = function(portfolioKey) {
        new PortfolioHistoryChart($(this), portfolioKey);
        return this;
    };
})(jQuery);



$(function() {
    $.init(); 
    
    var depot = $(".mmmdepot").depotTable();
    
    $('.developmentImage').developmentImage();

    $('#total_depot_chart').portfolioHistoryChart(depot.getPortfolioKey());
}); 
