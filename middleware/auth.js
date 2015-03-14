'use strict';

var User = redish.model('user');

module.exports = function() {
    return auth;
}

// Auth middleware
function auth(req, res, next) {
    // console.log(req.cookies);
    // if (!req.cookies._accessToken) return res.render('login');
    // else {
    //     User.auth(req.cookies._accessToken, function(err, user) {
    //         if (err) {
    //             console.log(err);
    //             return res.render('login');
    //         }
    //         req.user = user;
            next();
    //     });
    // }
}
