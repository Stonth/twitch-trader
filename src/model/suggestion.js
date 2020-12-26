const Model = require('./model');
const Position = require('./position');
const Phase = require('./phase');
const Transaction = require('./transaction');
const Ticker = require('./ticker');

const Suggestion = function (fields) {
    Model.call(this, fields);
};
Suggestion.prototype = Object.create(Model.prototype);

Suggestion.prototype.table = 'suggestions';
Suggestion.prototype.constructor = Suggestion;

Suggestion.getLatest = function () {
    return new Promise((resolve, reject) => {
        Phase.getLatest().then((phase) => {
            const phaseId = phase.getField('id');
            const suggestion = new Suggestion({phase_id: phaseId});
            suggestion.get().then((suggestions) => {
                resolve(suggestions);
            }).catch(reject);
        });
    });
};

/*
    Applies a suggestion.

    Note: this also refreshes prices!
*/
Suggestion.apply = function (suggestions) {
    return new Promise((resolve, reject) => {
        const currentIndex = 0;
        const trySuggestion = function () {
            if (currentIndex >= suggestions.length) {
                reject('no valid suggestions');
            } else {
                const type = this.getField('type');
                const quantity = this.getField('quantity');
                const tickerId = this.getField('ticker_id');
                const phaseId = this.getField('phase_id');
                // First, have to refresh prices.
                Position.refreshPrices().then(() => {
                    // Get the latest phase.
                    Phase.getLatest().then((phase) => {
                        const phaseId = phase.getField('id');
                        // Get the latest transaction.
                        const transaction = new Transaction({after_phase_id: phaseId - 1});
                        transaction.get().then((results) => {
                            // There should be a transaction here.
                            const balance = results[0].getField('balance');
                            // Get the price.
                            const ticker = new Ticker({id: tickerId});
                            ticker.get().then((results) => {
                                // There should be a ticker here.
                                const price = results[0].getField('price');
                                if (type == 'buy') {
                                    // Handle buy order.
                                    if (balance < price * quantity) {
                                        // Try the next suggestion.
                                        currentIndex++;
                                        trySuggestion();
                                    } else {
                                        const position = new Position({ticker_id: tickerId});
                                        position.get().then((results) => {
                                            // Create a new transaction.
                                            const transaction = new Transaction({
                                                suggestion_id: getField('id'),
                                                price,
                                                balance: balance - price * quantity,
                                                after_phase_id: phaseId
                                            });
                                            transaction.save().then(() => {
                                                // Save the position and resolve.
                                                if (results.length > 0) {
                                                    const p = results[0];
                                                    p.setField('quantity', p.getField('quantity') + quantity);
                                                    p.save().then(resolve).catch(reject);
                                                } else {
                                                    position.setField('quantity', quantity)
                                                    position.save().then(resolve).catch(reject);
                                                }
                                            }).catch(reject);
                                        }).catch(reject);
                                    }
                                } else {
                                    // Sell order.
                                    const position = new Position({ticker_id: tickerId});
                                    position.get().then((results) => {
                                        // Create a new transaction.
                                        const transaction = new Transaction({
                                            suggestion_id: getField('id'),
                                            price,
                                            balance: balance + price * quantity,
                                            after_phase_id: phaseId
                                        });
                                        transaction.save().then(() => {
                                            // This row should already exist.
                                            // Remove the shares and resolve.
                                            const p = results[0];
                                            if (p.getField('quantity') <= quantity) {
                                                p.delete().then(resolve).catch(reject);
                                            } else {
                                                p.setField('quantity', p.getField('quantity') - quantity)
                                                p.save().then(resolve).catch(reject);
                                            }
                                        }).catch(reject);
                                    }).catch(reject);                                
                                }
                            }).catch(reject);
                        }).catch(reject);
                    }).catch(reject);
                });
            }
        };
        trySuggestion();
    });
};

Suggestion.mostPopular = function () {
    return new Promise((resolve1, reject1) => {
        Phase.getLatest().then((phase) => {
            const phaseId = phase.getField('id');
            Model.database((connection) => {
                return new Promise((resolve2, reject2) => {
                    connection.query(
                        'SELECT a.* FROM ( ' +
                            'SELECT * FROM suggestions WHERE phase_id=? ORDER BY RAND() ' +
                        ') AS a LEFT JOIN ( ' +
                            'SELECT suggestion_id, COUNT(*) AS amount FROM votes ' +
                            'GROUP BY suggestion_id ORDER BY amount DESC ' +
                        ') AS b ON a.id=b.suggestion_id ORDER BY amount DESC;',
                        [phaseId],
                        (err, results) => {
                            if (err) {
                                reject2(err);
                            } else {
                                resolve2(results.map(x => new Suggestion(x)));
                            }
                        });
                });
            }).then(resolve1).catch(reject1);
        }).catch(reject1);
    });
};

Suggestion.initialize = function () {
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                connection.query(
                    'CREATE TABLE IF NOT EXISTS suggestions (' +
                    'id INTEGER NOT NULL AUTO_INCREMENT, ' +
                    'user_id INTEGER, ' +
                    'type VARCHAR(8) NOT NULL, ' +
                    'ticker_id INTEGER NOT NULL, ' +
                    'phase_id INTEGER NOT NULL, ' +
                    'quantity INTEGER NOT NULL, ' +
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

module.exports = Suggestion;
