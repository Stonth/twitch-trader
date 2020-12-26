const Model = require('./model');
const Ticker = require('./ticker');

const rp = require('request-promise');
const Transaction = require('./transaction');

const Position = function (fields) {
    Model.call(this, fields);
};
Position.prototype = Object.create(Model.prototype);

Position.prototype.table = 'positions';
Position.prototype.constructor = Position;

// Can only have 20 positions max at a time!
Position.MAX_COUNT = 20;

// Get the total worth.
Position.getTotalWorth = function (phase) {
    return new Promise((resolve1, reject1) => {
        if (!phase.fieldExists('id')) {
            reject('phase is missing id');
        } else {
            Model.database((connection) => {
                return new Promise((resolve2, reject2) => {
                    // Get the total for all the positions.
                    connection.query(
                        'SELECT SUM(a.x) as s FROM (' + 
                            'SELECT tickers.price*positions.quantity as x ' + 
                            'FROM positions ' +
                            'INNER JOIN tickers ON positions.ticker_id=tickers.id' +
                        ') as a;'
                    , (err, results) => {
                        if (err) {
                            reject2(err);
                        } else {
                            const stockValue = results[0].s;
                            const transactions = new Transaction({after_phase_id: phase.getField('id')});
                            transactions.get().then((results) => {
                                if (results.length <= 0) {
                                    reject2(new Error('invalid phase'));
                                } else {
                                    // Resolve stock value + last cash balance.
                                    resolve2(stockValue + results[0].getField('balance'));
                                }
                            }).catch(reject2);
                        }
                    });
                })
            }).then(resolve1).catch(reject1);
        }
    });
};

Position.refreshPrices = function () {
    return new Promise((resolve, reject) => {
        const all = new Position({});
        all.get().then((positions) => {
            let positionsToRefresh = positions.length;
            const tickerRefreshFail = function (err) {
                console.warn('Ticker refresh failed');
                console.error(err);
                positionsToRefresh--;
                if (positionsToRefresh <= 0) {
                    resolve();
                }
            };
            const tickerRefreshPass = function () {
                positionsToRefresh--;
                if (positionsToRefresh <= 0) {
                    resolve();
                }
            };
            for (const p of positions) {
                const ticker = new Ticker({id: p.getField('ticker_id')});
                ticker.get().then((tickers) => {
                    const t = tickers[0];
                    rp('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='
                        + t.getField('ticker') + '&apikey=' + Position.apiKey).then((data) => {

                        // Get the price data, and change the values in the database.
                        const results = JSON.parse(data);
                        const snapshot = results[Object.keys(results)[0]];
                        const priceField = Object.keys(snapshot).find(x => x.indexOf('price') > -1);
                        const openField = Object.keys(snapshot).find(x => x.indexOf('open') > -1);
                        t.replaceField('price', snapshot[priceField]);
                        t.replaceField('percent_change', (snapshot[priceField] - snapshot[openField]) * 100 / snapshot[openField]);
                        t.save().then(tickerRefreshPass).catch(tickerRefreshFail);
                    }).catch(tickerRefreshFail);
                }).catch(tickerRefreshFail);
            }
        }).catch(reject);
    });
};

Position.initialize = function (key) {
    Position.apiKey = key;
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                connection.query(
                    'CREATE TABLE IF NOT EXISTS positions (' +
                        'id INTEGER NOT NULL AUTO_INCREMENT, ' +
                        'ticker_id INTEGER, ' +
                        'quantity INTEGER, ' +
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

module.exports = Position;
