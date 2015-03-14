/**
 *  Aperture Intranet
 *  Code written by vista in 2015. Licensed under MIT License.
 */
'use strict';

var importer = require('node-importer');
var assert = require('./middleware/assert');
var notFound = require('./middleware/404');
var cors = require('express-cors');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var errorHandler = require('./middleware/error');

// Database Initialization
database.init('write');

// Initializing Express Framework
var app = express();
app.locals.moment = require('moment');

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(assert());
app.use(cookieParser());
app.use(log.requestLogger());


// Importer
importer.express(app, 'routes/');

// 404 and error handler
app.use(notFound());
app.use(errorHandler());

// Port setting
app.enable('trust proxy');
app.set('port', process.env.PORT || config.port.intranet);

// Start server
app.listen(app.get('port'), function listen() {
    log.info('server listening on port ' + app.get('port'));
});

