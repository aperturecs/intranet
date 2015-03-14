/**
 * Redish - redis modeling.
 */
'use strict';

var instauuid = require('instauuid');
var async = require('async');
var redis = require('redis');

function Redish() {
    this.client = null;
    this.models = {};
    this.defaultBucketSize = 512;
}

/**
 * Set redis client.
 */
Redish.prototype.setClient = function(client) {
    this.client = client;
}

/**
 * Set default bucket size.
 */
Redish.prototype.setDefaultBucketSize = function(size) {
    this.defaultBucketSize = size;
}

// function uuidGenerator() {}

/**
 * Compile the schema as a model.
 *
 * @param name The name of model - used to {@link Redish#model(name)}
 * @param schema 
 * @param [methods]
 * @param [statics]
 */
Redish.prototype.compile = function() {
    if (this.client == null) throw new Error("you haven't set the redis client yet.");
    var client = this.client;

    // arguments
    var name, schema, methods, statics, saveToRdb, rdbSchema, rdbTableName;
    if (typeof arguments[0] === 'object') {
        var options = arguments[0];
        name = options.name;
        schema = options.schema;
        methods = options.methods;
        statics = options.statics;
        saveToRdb  = options.saveToRdb;
        rdbSchema = options.rdbSchema;
        rdbTableName = options.rdbTableName;
    }
    else if (arguments.length != 2) throw new Error('invalid argument');
    else {
        name = arguments[0];
        schema = arguments[1];
    }

    if (!name) throw new Error("no model name specified");
    if (!schema) throw new Error("no schema specified for model " + name);

    // Pre-compile schema
    var precompiled = {};
    var getterSetterSchema = false;
    for (var key in schema) {
        if (schema[key].get || schema[key].set) {
            getterSetterSchema = true;

            // Define Getter/setter
            (function(object, key, schema) {
                var getter, setter;
                if (schema.get) getter = function() {
                    if (this.$.getDefault[key]) {
                        delete this.$.getDefault[key];
                        return this.$.data[key];
                    }
                    this.$.getDefault[key] = true;
                    return schema.get();
                }
                else getter = function() {
                    return this.$.data[key];
                }

                if (schema.set) setter = function(v) {
                    this.$.data[key] = this.$.modified[key] = schema.set(v);
                }
                else setter = function(v) {
                    this.$.data[key] = this.$.modified[key] = v;
                }

                // Getter/setter
                Object.defineProperty(object, key, {
                    get: getter,
                    set: setter,
                    enumerable: true
                });
            })(precompiled, key, schema[key]);
        }
    }

    // Model's constructor
    var Model;
    if (getterSetterSchema) {
        // getter/setter schema constructor
        Model = function(data, isOld) {
            this.$ = { original: {}, data: {}, modified: {}, getDefault: {} };
            for (var key in schema) {
                if (schema[key].get || schema[key].set) {
                    // copy from precompiled
                    this.__defineGetter__(key, precompiled.__lookupGetter__(key));
                    this.__defineSetter__(key, precompiled.__lookupSetter__(key));
                }

                // Set value (or default value)
                var value = schema[key];
                if (data && data[key]) this.$.data[key] = this.$.modified[key] = data[key];

                if (isOld) continue;
                else if (value.default) this.$.data[key] = this.$.modified[key] =
                    (value.default instanceof Function ? value.default() : value.default);
                else this.$.data[key] = (value instanceof Function ? value : value.type)();
            }
            // make id...
            if (!isOld) {
                this.id = this.$.modified.id = instauuid();
                this.$.field = Model.namespace + this.id;
                ths.$.isNew = true;
            }
        }
    } else {
        // normal schema constructor
        var convertTable = {}, defaultTable = {};
        var code = `
            var Model = this.constructor;
            Object.defineProperty(this, '$', {writable: true, value: { original: {}, modified: {} }});
            if (isOld) {`;

        for (var key in schema) {
            code += `
                if (data['${key}']) this['${key}'] = Model._convertTable['${key}'](data['${key}']);`;
            var type = (typeof schema[key] === 'function' ? schema[key] : schema[key].type);
            if (type === Boolean) type = function(v) { return v === true || v === 'true' };
            convertTable[key] = type;
        }
        code += `
           return;
        }`+'\n';

        for (var key in schema) {
            var value = schema[key];
            code += `if (data['${key}']) this['${key}'] = this.$.modified['${key}'] = data['${key}'];`+'\n';

            code += `else this['${key}'] = this.$.modified['${key}'] = `;
            if (schema[key].default) {
                if (schema[key].default instanceof Function) {
                    defaultTable[key] = schema[key].default;
                    code += `Model._defaultTable['${key}']();`;
                }
                else code += `${typesafe(schema[key].default)};`;
            }
            else code += `${typesafe((schema[key] instanceof Function ? schema[key] : schema[key].type)())};`;
            code += '\n';
        }
        code += `
            this.id = this.$.modified.id = Model._idGen();
            Object.defineProperty(this.$, 'field', {writable: true, value: Model.namespace + this.id});
            this.$.isNew = true;`;

        Model = new Function('data', 'isOld', code);
        Model._convertTable = convertTable;
        Model._defaultTable = defaultTable;
        Model._idGen = instauuid;

        /*
        Model = function(data, isOld) {
            this.$ = { original: {}, modified: {} };
            if (isOld) {
                for (var key in data) this[key] = data[key];
                return;
            }

            for (var key in schema) {
                var value = schema[key];
                if (data && data[key]) this[key] = this.$.modified[key] = data[key];
                else if (value.default) this[key] = this.$.modified[key] =
                    (value.default instanceof Function ? value.default() : value.default);
                else this[key] = (value instanceof Function ? value : value.type)();
            }
            // make id...
            this.id = this.$.modified.id = instauuid();
            this.field = Model.namespace + this.id;
        }*/
    }

    Model.namespace = name + ':';
    Model._keys = Object.keys(schema);

    Model.prototype.save = function(callback) {
        if (!callback) callback = function() {};
        
        for (var i in Model._keys) {
            var key = Model._keys[i];
            if (this[key] && this[key] !== this.$.original[key]) {
                this.$.original[key] = this.$.modified[key] = this[key];
            }
        }
        if (Object.keys(this.$.modified).length > 0) client.hmset(this.$.field, this.$.modified, callback);
        else callback(null, null);
        this.$.modified = {};
        this.$.isNew = false;
    };

    Model.prototype.markAsModified = function(keys) {
        var modifiedList = keys.split(' ');
        for (var i in modifiedList) {
            var key = modifiedList[i];
            this.$.modified[key] = this[key];
        }
    };

    Model.create = function(id, data) {
        var object = new Model(data, true);
        object.$.field = Model.namespace + id;
        object.$.original = data;
        object.id = id;
        return object;
    };

    Model.exists = function(id, callback) {
        client.exists(Model.namespace + id, callback);
    };

    Model.get = function(id, fields, callback) {
        var constructor = Model;
        if (fields instanceof Function) {
            callback = fields;
            fields = null;
        }

        if (fields) {
            // fields에 적혀있는 원하는 키들만 가져옴.
            var keys;
            if (fields === 'id' || fields === '') keys = ['id'];
            else keys = fields.split(' ');
            client.hmget(Model.namespace + id, keys, function(err, array) {
                if (err) return done(err);

                // array를 가공
                var result;
                if (!isEmptyResponse(array)) {
                    result = {};
                    for (var i in array) result[keys[i]] = array[i];
                }
                done(err, result);
            });

        } else client.hgetall(Model.namespace + id, done);

        function done(err, data) {
            if (err) return callback(err);
            else if (!data) return callback(Status('idNotFound'));

            return callback(null, constructor.create(id, data));
        }
    }

    Model.prototype.remove = function(callback) {
        if (!callback) callback = function() {};

        client.del(this.$.field, function(err) {
            callback(err);
        });
    }

    if (methods) for (var key in methods) Model.prototype[key] = methods[key];
    if (statics) for (var key in statics) Model[key] = statics[key];

    this.models[name] = Model;
    return Model;
}

function typesafe(val) {
    return typeof val === 'string' ? '\''+val+'\'' : val;
}

function generateKeyList(object) {
    var ret = '(';
    for (var key in object) ret += camelToSnake(key) + ',';
    return ret.substr(0, ret.length-1) + ')';
}

function generateValueList(object) {
    var ret = '(';
    for (var i in Object.keys(object)) {
        ret += '$' + (parseInt(i)+1) + ',';
    }
    return ret.substr(0, ret.length-1) + ')';
}

function generateUpdateList(object) {
    var ret = '', keys = Object.keys(object);
    for (var i in keys) {
        ret += camelToSnake(keys[i]) + '=$' + (parseInt(i)+1) + ',';
    }
    return ret.substr(0, ret.length-1);
}

function generateValues(object) {
    var ret = [];
    for (var key in object) ret.push(object[key]);
    return ret;
}

function camelToSnake(key) {
    var snake = ''+key[0];
    for (var i=1;i<key.length;i++) {
        if ('A' <= key[i] && key[i] <= 'Z') {
            snake += '_' + key[i].toLowerCase();
        }
        else snake += key[i];
    }
    return snake;
}

function isEmptyResponse(array) {
    var deleted = true;
    array.forEach(function(item) {
        if (item !== null) deleted = false;
    });
    return deleted;
}

/**
 * Returns specified model.
 *
 * @param name A model name you want to retrieve.
 * @returns [Redis model / Mongo model]
 */
Redish.prototype.model = function(name) {
    return this.models[name];
}

module.exports = new Redish();
