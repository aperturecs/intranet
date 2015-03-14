/*
 *  index: 메인 페이지
 */
'use strict';

var User = redish.model('user');
var encrypt = require('../lib/encrypt');
var redis = redish.client;

var app = module.exports = express.Router();
app.get('/', index);
app.post('/', login);

function index(req, res) {
    res.render('login');
}

function login(req,res) {
    console.log(req.body);
    if (!req.hasBody('email', 'pw')) return;
    req.body.pw = encrypt(req.body.pw);

    async.waterfall([
        getId,
        getUser,
        refreshToken
    ], done);
    
    var userId, user;
    function getId(next) {
        redis.hget('user:logintable', req.body.email + ':' + req.body.pw, next);
    }
    function getUser(id, next) {
        userId = id;
        if (!userId) return next(Status('authFailed'));
        User.get(id, 'accessToken', next);
    }
    function refreshToken(usr, done) {
        user = usr;
        user.refreshAuth(done);
    }
    function done(err) {
        if (err) {
            return res.send('<script>alert("'+(err.message || err.msg)+'"); location.href="/login";</script>');
        }
        user.save();

        res.cookie('_accessToken', user.accessToken, { maxAge: 86400 });
        res.redirect('/');
    }
}
