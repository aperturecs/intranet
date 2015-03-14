/**
 *  User Auth Server 
 *  Code written by vista in 2014. Licensed under MIT License.
 */

var cluster = require('cluster');

// Global Init
with (global) {
    config = require('./config');
    Status = require('./status');
    log = require('./lib/logger');

    // Frequently used modules
    express = require('express');
    database = require('./database');
    mongoose = require('mongoose');
    redish = require('./lib/redish');
    th = require('./lib/th');
    async = require('async');
}

// Master Process의 경우 CPU 스레드 수만큼 Worker를 복제한다.
if (cluster.isMaster && config.production !== 'dev') {
    var numCpus = require('os').cpus().length / 2;
    for (var i = 0; i < numCpus; i++) cluster.fork();

    if (config.haEnabled) {
        cluster.on('exit', function(deadWorker, code, signal) {
            var worker = cluster.fork();
            var newPID = worker.process.pid;
            var oldPID = deadWorker.process.pid;
            log.error('Worker ' + oldPID + ' died! Restarting to worker ' + newPID);
        });
    }

} else {
    // Start app server
    require('./app');
}
