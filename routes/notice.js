/*
 *  board: 게시판
 */
'use strict';

var app = module.exports = express.Router();
var User = redish.model('user');
var auth = require('../middleware/auth');
// app.use(auth());
app.get('/', index);

function index(req, res) {
    if (!req.cookies._accessToken) return res.render('login');

    async.waterfall([
        function auth(next) {
            User.auth(req.cookies._accessToken, next);
        }
    ], function done(err, user) {
        if (err) return res.render('login');
        res.render('board', {
            user: user,
            articles: [
         { num: 0, name: '현재 준비중인 기능입니다.', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 재수가 좋다!', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 재수가 좋다!', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 재수가 좋다!', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '갈려나가는 서버 개발자', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 웹 해본적도 없는데', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '하하하하하하하ㅏ', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: 'ㄴㅇ라ㅣㄴㅁ이란ㅇㄹ', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 재수가 좋다', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 재수가 좋다', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 재수가 좋다', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 재수가 좋다', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 재수가 좋다', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 재수가 좋다', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
         { num: 0, name: '나는 재수가 좋다', authorName: '김효준', createdAt: Date.now(), viewCount: 339},
       ]
        });
    });
}
