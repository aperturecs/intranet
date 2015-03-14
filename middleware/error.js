'use strict';

// Error handler
module.exports = function() {
    return error;
}

function error(err, req, res, next) {
    res.status(err.status || 500);
    if (err.status != 404) log.error(err);
    res.render('error', {
        name: err.name || 'HTTP ' + err.status || 'Error occured',
        message: err.message
    });
}
