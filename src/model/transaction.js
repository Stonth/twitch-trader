const Model = require('./model');

const Transaction = function (fields) {
    Model.call(this, fields);
};
Transaction.prototype = Object.create(Model.prototype);

Transaction.prototype.table = 'transactions';
Transaction.prototype.constructor = Transaction;

Transaction.initialize = function () {
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                connection.query(
                    'CREATE TABLE IF NOT EXISTS transactions (' +
                        'id INTEGER NOT NULL AUTO_INCREMENT, ' +
                        'suggestion_id INTEGER, ' +
                        'price DOUBLE, ' +
                        'balance DOUBLE NOT NULL, ' +
                        'time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
                        'PRIMARY KEY (id)' +
                    ');'
                , (err) => {
                    // This could be just a table already exists warning.
                    if (err) {
                        console.warn(err);
                    }

                    // If there are no items in the database, add the initial balance.
                    const all = new Transaction();
                    all.get().then((results) => {
                        if (results.length <= 0) {
                            const initial = new Transaction({balance: 1000000});
                            initial.save().then(resolve2).catch(reject2);
                        } else {
                            resolve2();
                        }
                    }).catch(reject2);
                });
            })
        }).then(resolve1).catch(reject1);
    });
};

module.exports = Transaction;
