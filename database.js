/**
 *  Database Initializer 
 */
'use strict';

var redis = require('redis');
var importer = require('node-importer');

function modelInit() {
    // 1. load models
    importer('models/', function(desc, filename) {
        // 1.1. compile models
        if (desc.type === 'redis') {
            redish.compile(desc);
        } else {
            // mongoose
            desc.schema = new mongoose.Schema(desc.schema);
            desc.schema.methods = desc.methods || {};
            desc.schema.statics = desc.statics || {};
            mongoose.model(desc.name, desc.schema);
        }
    });

    // 2. call onModuleInit()
    importer('models/', function(desc, filename) {
        if (desc.onModuleInit) desc.onModuleInit();
    });
}

function init(serviceName) {
    var mongoConfig = config.mongo,
        redisConfig = config.redis[serviceName];

    // MongoDB에 접속
    // mongoose.connect(mongoConfig);

    // // Redis에 접속
    var client = redis.createClient(redisConfig.port, redisConfig.host);
    if (redisConfig.pw) client.auth(redisConfig.pw);
    redish.setClient(client);

    // models 폴더에서 스키마들을 긁어와서 controller를 inject한 뒤,
    // 모든 모델들을 initialize시킨다.
    modelInit();
}

exports.init = init;
