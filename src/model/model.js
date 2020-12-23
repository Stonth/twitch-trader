const mysql = require('mysql');

const Model = function (fields) {
    this.fields = Object.assign({}, fields);
};

Model.prototype.addField = function (field, value) {
    if (!this.fieldExists(field)) {
        this.fields[field] = value;
    } else {
        throw new Error('field ' + field + ' already exists.');
    }
};

Model.prototype.setField = function (field, value) {
    if (value === undefined) {
        throw new Error('field ' + field + ' cannot be undefined');
    } else if (!this.fieldExists(field)) {
        throw new Error('field ' + field + ' does not exist');
    } else {
        this.fields[field] = value;
    }
};

Model.prototype.replaceField = function (field, value) {
    if (!this.fieldExists(field)) {
        this.addField(field, value);
    } else {
        this.setField(field, value);
    }
};

Model.prototype.fieldExists = function (field) {
    return !(this.fields[field] === undefined);
};

Model.prototype.deleteField = function (field) {
    if (!this.fieldExists(field)) {
        throw new Error('field ' + field + ' does not exist');
    } else {
        delete this.fields[field];
    }
};

Model.prototype.getField = function (field) {
    if (!this.fieldExists(field)) {
        throw new Error('field ' + field + ' does not exist');
    } else {
        return this.fields[field];
    }
};

/*
    Save into the database te given fields.

    Will replace the fields with the fields
    of the inserted row.
*/
Model.prototype.save = function () {
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                const fieldNames = Object.keys(this.fields);
                const fieldValues = fieldNames.map(x => this.fields[x]);
                connection.query(
                    'REPLACE INTO ' + this.table + ' (' +
                        fieldNames.join(', ') +
                    ') VALUES (' +
                        (new Array(fieldValues.length)).fill('?').join(', ') +
                    ');'
                , fieldValues, (err) => {
                    if (err) {
                        reject2(err);
                    }
                    connection.query(
                        'SELECT * FROM ' + this.table + ' WHERE id=LAST_INSERT_ID();', (err, results) => {
                        if (err) {
                            reject2(err);
                        } else {
                            this.fields = Object.assign({}, results[0]);
                            resolve2(this);
                        }
                    });
                });
            })
        }).then(resolve1).catch(reject1);
    });
};

/*
    Gets a list of objects that correspond to the fields
    or extra queries.
*/
Model.prototype.get = function (extra) {
    if (!extra) {
        extra = [];
    }
    return new Promise((resolve1, reject1) => {
        Model.database((connection) => {
            return new Promise((resolve2, reject2) => {
                const fieldNames = Object.keys(this.fields);
                const fieldValues = fieldNames.map(x => this.fields[x]);
                connection.query(
                    'SELECT * FROM ' + this.table + (extra.length || fieldValues.length ? ' WHERE ' : '') +
                        // Field conditions.
                        fieldNames.map(el => el + '=?').join(' AND ') +
                        (extra.length && fieldValues.length ? ' AND ' : '') +
                        // Extra conditions.
                        extra.join(' AND ') + ';'
                    , fieldValues, (err, results) => {
                    if (err) {
                        reject2(err);
                    } else {
                        // Return an array of results.
                        resolve2(results.map(x => new this.constructor(x)));
                    }
                });
            })
        }).then(resolve1).catch(reject1);
    });
};

Model.database = function (promise) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection(Model.config);
        connection.connect();
        promise(connection).then((data) => {
            connection.end();
            resolve(data);
        }).catch((err) => {
            connection.end();
            reject(err);
        });
    });
};

Model.setConfig = function (config) {
    Model.config = config;
}

module.exports = Model;