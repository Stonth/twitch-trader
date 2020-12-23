const Model = require('./model');

const Phase = function (fields) {
    Model.call(this, fields);
};
Phase.prototype = Object.create(Model.prototype);

Phase.prototype.table = 'phases';
Phase.prototype.constructor = Phase;

Phase.initialize = function () {
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                connection.query(
                    'CREATE TABLE IF NOT EXISTS phases (' +
                        'id INTEGER NOT NULL AUTO_INCREMENT, ' +
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

module.exports = Phase;
