
var async = require('async');

function argumentToArray(arg) {
    var array = [];
    for (var i in arg) {
        array.push(arg[i]);
    }
    return array;
}

function stepResult() {
    if (arguments.length < 2) {
        return new Error("waterfall needs at least 2 arguments");
    }

    var response = arguments[0];
    var tasks = argumentToArray(arguments).slice(1);

    // Default End Method
    var callback = function done(err, result) {
        if (err) return response.send(err);
        if (result) {
            response.send(result);
        } else {
            response.send(Status('idNotFound'));
        }
    };

    return async.waterfall(tasks, callback);
}

function step() {
    if (arguments.length < 2) {
        return new Error("waterfall needs at least 2 arguments");
    }

    var response = arguments[0];
    var tasks = argumentToArray(arguments).slice(1);

    // Default End Method
    var callback = function done(err, result) {
        if (err) return response.send(err);
        response.status(200).end();
    };

    return async.waterfall(tasks, callback);
}

module.exports = {
    step: step,
    stepResult: stepResult
};
