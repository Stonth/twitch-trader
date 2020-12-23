const Model = require('./model');

const rp = require('request-promise');

const Ticker = function (fields) {
    Model.call(this, fields);
};
Ticker.prototype = Object.create(Model.prototype);

Ticker.prototype.table = 'tickers';
Ticker.prototype.constructor = Ticker;

/*
    Gets a ticker from the database. If it doesn't exist,
    look the ticker up. If it is a valid ticker, add it
    to the database. In the end, a ticker object will be returned.
*/
Ticker.getPutTicker = function (ticker) {
    return new Promise((resolve, reject) => {
        const tickerSearch = new Ticker({ticker});
        tickerSearch.get().then((results) => {
            if (results.length > 0) {
                resolve(results[0]);
            } else {
                rp('https://dumbstockapi.com/stock?format=json&ticker_search=' + encodeURIComponent(ticker)).then((data) => {
                    const results = JSON.parse(data);
                    for (const t of results) {
                        if (t.ticker == ticker) {
                            const tickerNew = new Ticker({ticker: t.ticker, name: t.name, exchange: t.exchange});
                            tickerNew.save().then(() => {
                                resolve(tickerNew);
                            }).catch(reject);
                            return;
                        }
                    }
                    reject(new Error(ticker + ' is not a valid ticker'));
                }).catch(reject);
            }
        }).catch(reject);
    });
};

Ticker.initialize = function () {
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                connection.query(
                    'CREATE TABLE IF NOT EXISTS tickers (' +
                    'id INTEGER NOT NULL AUTO_INCREMENT, ' +
                    'ticker VARCHAR(8) NOT NULL, ' +
                    'name TEXT NOT NULL, ' +
                    'exchange VARCHAR(8) NOT NULL, ' +
                    'price DOUBLE, ' +
                    'percent_change DOUBLE, ' +
                    'price_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ' +
                    'time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
                    'PRIMARY KEY (id)' +
                    ');'
                    , (err) => {
                        // This could be just a table already exists warning.
                        if (err) {
                            console.warn(err);
                        }
                        resolve2();
                    });
            })
        }).then(resolve1).catch(reject1);
    });
};

module.exports = Ticker;
