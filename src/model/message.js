const Model = require('./model');

const Message = function (fields) {
    Model.call(this, fields);
};
Message.prototype = Object.create(Model.prototype);

Message.prototype.table = 'messages';
Message.prototype.constructor = Message;

Message.initialize = function () {
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                connection.query(
                    'CREATE TABLE IF NOT EXISTS messages (' +
                        'id INTEGER NOT NULL AUTO_INCREMENT, ' +
                        'user_id INTEGER NOT NULL, ' +
                        'message TEXT NOT NULL, ' +
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

module.exports = Message;
