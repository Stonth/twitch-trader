const Model = require('./model');
const Phase = require('./phase');
const Vote = require('./vote');
const Ticker = require('./ticker');
const Suggestion = require('./suggestion');
const Position = require('./position');

const User = function (fields) {
    Model.call(this, fields);
};
User.prototype = Object.create(Model.prototype);

User.prototype.table = 'users';
User.prototype.constructor = User;

/*
    Suggest
*/
User.prototype.suggest = function (type, ticker, quantity) {
    return new Promise((resolve, reject) => {
        if (!this.fieldExists('id')) {
            reject(new Error('user is missing id field'));
        } else if (type != 'buy' && type != 'sell') {
            reject(new Error(type + ' is not a valid type'));
        } else {
            const userId = this.getField('id');
            Phase.getLatest().then((phase) => {
                const phaseId = phase.getField('id');
                // Get/put/check the ticker.
                Ticker.getPutTicker(ticker).then((t) => {
                    const tickerId = t.getField('id');

                    // check if the suggestion already exists.
                    const existsSearch = new Suggestion({
                        phase_id: phaseId,
                        ticker_id: tickerId,
                        type,
                        quantity
                    });
                    existsSearch.get().then((results) => {
                        if (results.length > 0) {
                            reject('this suggestion has already been made');
                        } else {
                            const suggestionIsValid = function () {
                                // See if the user has already provided a suggestion.
                                const suggestionSearch = new Suggestion({phase_id: phaseId, user_id: userId});
                                suggestionSearch.get().then((results) => {
                                    if (results.length > 0) {
                                        const suggestion = results[i];
                                        suggestion.setField('type', type);
                                        suggestion.setField('ticker_id', tickerId);
                                        suggestion.setField('quantity', quantity);
                                        suggestion.save().then(() => resolve(suggestion)).catch(reject);
                                    } else {
                                        const suggestion = new Suggestion({
                                            user_id: userId,
                                            ticker_id: tickerId,
                                            phase_id: phaseId,
                                            type,
                                            quantity
                                        });
                                        suggestion.save().then(() => resolve(suggestion)).catch(reject);
                                    }
                                }).catch(reject);
                            };
                            
                            if (type == 'buy') {
                                // Check if the order would go over the max.
                                const all = new Position({});
                                all.get(['ticker_id<>' + tickerId]).then((positions) => {
                                    if (positions.length >= Position.MAX_COUNT) {
                                        reject(new Error('buying ' + ticker + ' would cause position count to go above the max'));
                                    } else {
                                        suggestionIsValid();
                                    }
                                }).catch(reject);
                            } else {
                                // Check if there is enough quantity to sell.
                                const position = new Position({ticker_id: tickerId});
                                position.get().then((positions) => {
                                    const p = positions[0];
                                    const q = p.getField('quantity');
                                    if (quantity > q) {
                                        reject(new Error('cannot sell ' + quantity + ' ' + ticker + ', only ' + q + ' shared available'));
                                    } else {
                                        suggestionIsValid();
                                    }
                                }).catch(reject);
                            }
                        }
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        }
    });
};

/*
    Vote on a suggestion.
*/
User.prototype.vote = function (suggestionIndex) {
    return new Promise((resolve, reject) => {
        if (!this.fieldExists('id')) {
            reject(new Error('user is missing id field'));
        } else {
            const userId = this.getField('id');
            Phase.getLatest().then((phase) => {
                const phaseId = phase.getField('id');
                const suggestionSearch = new Suggestion({phase_id: phaseId});
                suggestionSearch.get([], 'ORDER BY time ASC LIMIT 1 OFFSET ' + suggestionIndex + ';').then((results) => {
                    if (results.length <= 0) {
                        reject(suggestionIndex + ' is not a valid suggestion index');
                    } else {
                        const suggestion = results[0];
                        // Check if the suggestion belongs to the user.
                        if (suggestion.getField('user_id') == userId) {
                            reject(suggestionIndex + ' was proposed by user');
                        } else {
                            // Check if the user has already voted for the suggestion.
                            const vote = new Vote({
                                user_id: userId,
                                phase_id: phaseId,
                                suggestion_id: suggestion.getField('id')
                            });
                            vote.get().then((results) => {
                                if (results.length > 0) {
                                    reject('user has already voted for this suggestion');
                                } else {
                                    vote.save().then(resolve).catch(reject);
                                }
                            }).catch(reject);
                        }
                    }
                }).catch(reject);
            }).catch(reject);
        }
    });
};

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

                    // If there are no items in the database, add the trade bot.
                    const all = new User();
                    all.get().then((results) => {
                        if (results.length <= 0) {
                            const initial = new User({username: 'Trade Bot'});
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

module.exports = User;
