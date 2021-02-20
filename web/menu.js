class DepotMenu {
  visitedPortfolioKeys = JSON.parse(localStorage.getItem("portfoliokeys")) || {};

  constructor ($element, depot) {
    this.$element = $element;
    this.depot = depot;
    this.init();
  } 

  init() {
    var html = "";

    if (this.depot.key) {     
      html += "<p>"
          + "Comdirect: "
          + "<a href='http://www.comdirect.de/inf/musterdepot/pmd/freunde.html?portfolio_key=" + this.depot.key
            + "&SORT=PROFIT_LOSS_POTENTIAL_CURRENCY_PORTFOLIO_PCT&SORTDIR=ASCENDING' target='_blank'>Open</a>"
          + " | "
          + "<a href='https://nutzer.comdirect.de/inf/musterdepot/pmd/meineuebersicht.html?name=" + this.depot.title
            + "' target='_blank'>Edit</a>"
        + "</p>"
        + "<p>"
          + "<a href='/s" + this.depot.key.substring(0, 12) + "' target='_blank'>Share 1k-Peerfolio</a>"
        + "</p>"
        + "<p>"
          + "<a href='/api/v1/stocks?format=csv&portfolio_key=" + this.depot.key
            + (this.depot.isDataFromToday ? "" : "&date=" + this.depot.date.toISOString().split('T')[0])
            + "' target='_blank'>Export</a>"
        + "</p>";
    }

    if (this.visitedPortfolioKeys && Object.keys(this.visitedPortfolioKeys).length > 1) {
      html += "Recently visited:"
              + "<ul>"
                + Object.keys(this.visitedPortfolioKeys).reduce((prevVal, key) => {
                  return prevVal + (key && this.visitedPortfolioKeys[key] ? "<li>"
                    + (key.charAt() == "s" ? "<span class='shareDepotLabel'>1k</span> " : "")
                    + "<a href='/" + key + "'>" + this.visitedPortfolioKeys[key] + "</a></li>" : "");
                }, '')
              + "</ul>";
    }

    if (html) {
      this.$element.qtip({
        content: {
          text: html
        },
        style: {classes: "menu-tooltip"},
        position: {
          my: "top right"
          ,at: "bottom right"
          ,adjust: {
            y: -8
          }
        },
        show: {
          event: "click",
          solo: true,
          delay: 1,
          effect: function(el) {
            $(this).slideDown(300);
          }
        },
        hide: {
          inactive: 4000
          ,fixed: true
          ,delay: 300
          ,event: "click mouseleave"
        },
        events: {
          toggle: (event, api) => {
            $(api.elements.target).toggleClass("menuOpen", (event.type === 'tooltipshow')); 
          }
        }
      });
    }

    this.storePortfolioKey();
  }

  storePortfolioKey () {
    if (this.depot.sharedKey) {
      this.visitedPortfolioKeys[this.depot.sharedKey] = this.depot.title;

      // remove sharedKey if key already exists
      if (Object.keys(this.visitedPortfolioKeys).some((key) => (key && key.startsWith(this.depot.sharedKey.substr(1))))) {
        delete this.visitedPortfolioKeys[this.depot.sharedKey];
      }
    } else if (this.depot.key) {
      this.visitedPortfolioKeys[this.depot.key] = this.depot.title;

      // remove sharedKey if key added
      delete this.visitedPortfolioKeys["s" + this.depot.key.substring(0, 12)];
    }

    // and here is the functions side effect ;D
    localStorage.setItem("portfoliokeys", JSON.stringify(this.visitedPortfolioKeys));
  }
}