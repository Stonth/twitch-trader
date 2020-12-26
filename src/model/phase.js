const Model = require('./model');

const Phase = function (fields) {
    Model.call(this, fields);
};
Phase.prototype = Object.create(Model.prototype);

Phase.prototype.table = 'phases';
Phase.prototype.constructor = Phase;

Phase.next = function () {
    return new Promise((resolve, reject) => {
        const phase = new Phase();
        phase.save().then(() => resolve(phase)).catch(reject);
    });
};

Phase.getLatest = function () {
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                connection.query('SELECT * FROM phases ORDER BY time DESC LIMIT 1;', (err, results) => {
                    if (err) {
                        reject2(err);
                    } else {
                        resolve2(new Phase(results[0]));
                    }
                });
            })
        }).then(resolve1).catch(reject1);
    });
};

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
