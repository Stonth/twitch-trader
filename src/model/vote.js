const Model = require('./model');

const Vote = function (fields) {
    Model.call(this, fields);
};
Vote.prototype = Object.create(Model.prototype);

Vote.prototype.table = 'votes';
Vote.prototype.constructor = Vote;

Vote.initialize = function () {
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                connection.query(
                    'CREATE TABLE IF NOT EXISTS votes (' +
                        'id INTEGER NOT NULL AUTO_INCREMENT, ' +
                        'user_id INTEGER NOT NULL, ' +
                        'suggestion_id INTEGER NOT NULL, ' +
                        'phase_id INTEGER NOT NULL, ' +
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

module.exports = Vote;
