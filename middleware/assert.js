'use strict';

module.exports = function() {
    return function(req, res, next) {
        req.hasBody = function() {
            if (arguments.length < 1) return true;
            for (var i in arguments) {
                if (!req.body[arguments[i]]) {
                    res.send(Status('noParameter'));
                    return false;
                }
            }
            return true;
        };
        req.assertCondition = function() {
            if (arguments.length < 1) return;
            for (var i in arguments) {
                if (arguments[i]) return res.send(Status('tooLarge'));
            }
        };
        next();
    }
}
