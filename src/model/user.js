const Model = require('./model');

const User = function (fields) {
    Model.call(this, fields);
};
User.prototype = Object.create(Model.prototype);

User.prototype.table = 'users';
User.prototype.constructor = User;

/*
    If the user does not exist, add them.
    Then, get that user, regardless of
    whether or not they were new.
*/
User.putGetUser = function (username) {
    const user = new User({username});
    return new Promise((resolve, reject) => {
        user.get().then((users) => {
            if (users.length > 0) {
                resolve(users[0]);
            } else {
                user.save().then(() => {
                    resolve(user);
                }).catch(reject);
            }
        }).catch(reject);
    });
};

User.initialize = function () {
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                connection.query(
                    'CREATE TABLE IF NOT EXISTS users (' +
                        'id INTEGER NOT NULL AUTO_INCREMENT, ' +
                        'username TEXT NOT NULL, ' +
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

module.exports = User;
