const Model = require('./model');

const Suggestion = function (fields) {
    Model.call(this, fields);
};
Suggestion.prototype = Object.create(Model.prototype);

Suggestion.prototype.table = 'suggestions';
Suggestion.prototype.constructor = Suggestion;

Suggestion.initialize = function () {
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                connection.query(
                    'CREATE TABLE IF NOT EXISTS suggestions (' +
                        'id INTEGER NOT NULL AUTO_INCREMENT, ' +
                        'user_id INTEGER NOT NULL, ' +
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
