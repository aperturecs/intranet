/**
 * Request Logger and common logger.
 */
'use strict';

var fs = require('fs');
var morgan = require('morgan');
var winston = require('winston');

// Make logs directory
try {
    fs.mkdirSync(__dirname + '/../logs');
} catch(e) {
    if (e.code !== 'EEXIST') throw e;
}

// Normal Logger: Winston 
var logger = new (winston.Logger)({
    transports: [
        // 콘솔에 기록
        new (winston.transports.Console)({colorize: true, level: 'info'}),

        // 파일에 기록, 하루마다
        new (winston.transports.DailyRotateFile)({
            level: 'info',
            filename: __dirname + '/../logs/log'
        })
    ]
});

// Request Logger : Morgan
morgan.token('type', function(req, res) { return req.query.type; });
var logFormat = ':remote-addr - HTTP :method :status :url, Elasped :response-time ms';
var requestLogger = function() {
    return morgan(logFormat, { stream: { write: function(msg) { logger.info(msg.substring(msg, msg.length-1)) }}});
};

module.exports = logger;
module.exports.requestLogger = requestLogger;
