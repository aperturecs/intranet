/*
 * Register : 회원가입
 */
'use strict';

var User = redish.model('user');
var encrypt = require('../lib/encrypt');
var redis = redish.client;

var app = module.exports = express.Router();
app.post('/', register);

function register(req, res) {
    if (!req.hasBody('email', 'pw', 'sid', 'name', 'phone')) return;
    req.body.pw = encrypt(req.body.pw);

    var user;
    async.waterfall([
        function userExists(next) {
            User.emailExists(req.body.email, next);
        },
        function newUser(exists, done) {
            if (exists) return done(Status('userExists'));

            user = new User({
                email: req.body.email,
                pw: req.body.pw,
                studentId: req.body.sid,
                name: req.body.name,
                phoneNumber: req.body.phone
            });

            user.refreshRefreshToken();
            user.refreshAccessToken();

            async.parallel([
                function tableSave(done) {
                    redis.multi()
                        .hset('user:logintable', user.email + ':' + user.pw, user.id)
                        .hset('user:existtable', user.email, user.id)
                        .set('user:tokens:' + user.accessToken, user.id)
                        .expire('user:tokens:' + user.accessToken, 3 * 86400)
                        .hset('user:reftokens', user.refreshToken, user.id)
                        .exec(done);
                },
                function userSave(done) {
                    user.save(done);
                }
            ], done);
        }
    ], function done(err) {
        if (err) return res.send(err);
        res.send({
            userId: user.id,
            refreshToken: user.refreshToken,
            accessToken: user.accessToken
        });
    });
}