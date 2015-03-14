/*
 *  index: 메인 페이지
 */
'use strict';

var app = module.exports = express.Router();
var User = redish.model('user');
// var auth = require('../middleware/auth');
// app.use(auth());
app.get('/', index);

function index(req, res) {
    if (!req.cookies._accessToken) return res.render('login');

    async.waterfall([
        function auth(next) {
            User.auth(req.cookies._accessToken, next);
        }
    ], function done(err, user) {
        if (err) {
            console.log(err);
            return res.render('login');
        }
        res.render('index', { user: user });
    });
}
