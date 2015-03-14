
var crypto = require('crypto');
var encrypt = require('../lib/encrypt');
var moment = require('moment');
var redis = redish.client;
var User;

function onModuleInit() {
    User = redish.model('user');
}

var schema = {
    // 기본 정보
    email: String,
    pw: String,

    // 인증 정보
    refreshToken: String,
    accessToken: String,
    accessExpires: Number,

    // 프로필
    name: String,
    studentId: String,
    phoneNumber: String,
};

/** 
 * 인증
 */
function userAuth(token, fields, callback) {
    if (!token) return callback(Status('authFailed'));

    if (typeof fields === 'function') {
        callback = fields;
        fields = null;
    }

    var userId;
    async.waterfall([
        function getId(next) {
            redis.get('user:tokens:' + token, next);
        },
        function getUser(id, done) {
            if (!id) return done(Status('authFailed'));
            userId = id;
            
            if (fields) {
                if (fields.indexOf('id')) done(null, User.create(id, {}));
                else User.get(id, fields, done);
            }
            else User.get(id, done);
        }
    ], function done(err, user) {
        if (err) return callback(err);
        // if (Date.now() > user.accessExpires) return callback(Status('authExpired'));
        return callback(null, user);
    });
}

/**
 * 중복 검사
 */
function userExists(email, callback) {
    redis.hget('user:existtable', email, function(err, value) {
        return callback(err, value != null);
    });
}

function getProfile() {
    return {
        id: this.id,
        name: this.name,
        picture: this.picture
    }
}

function refreshAuth(callback) {
    var user = this;
    var previous = user.accessToken;
    user.refreshAccessToken();

    async.parallel([
        function tableSet(done) {
            redis.multi()
                .del('user:tokens:' + previous)
                .set('user:tokens:' + user.accessToken, user.id)
                .expire('user:tokens:' + user.accessToken, 3 * 86400)
                .exec(done);
        },
        function saveUser(done) {
            user.save(done);
        }
    ], function(err) {
        if (err) return callback(err);
        callback(null, user.accessToken);
    });
}

function makeToken(token, expires) {
    return new Buffer(JSON.stringify([
        token,
        expires
    ])).toString('base64');
}

/**
 *  Refresh Token을 갱신한다. 왠만하면 호출할 일 없다...
 */
function refreshRefreshToken() {
    // 랜덤한 8바이트 시드 생성
    var seed = crypto.randomBytes(4).toString('hex');

    this.refreshToken = encrypt(seed + this.email);
    return this.refreshToken;
}

/**
 *  Access Token을 갱신한다.
 *  토큰 만료해서 Auth시, 로그인시 무조건 거쳐야 한다.
 */
function refreshAccessToken() {
    // 랜덤한 8바이트 시드 생성
    var seed = crypto.randomBytes(4).toString('hex');

    // 액세스 토큰은 3일 뒤에 만료된다.
    var expires = moment().add(3, 'days').toDate().getTime();

    this.accessExpires = expires;
    this.accessToken = makeToken(encrypt(seed + this.email), expires);
    return this.accessToken;
}

/**
 * 유저 삭제
 */
function deleteUser(next) {
    redis.multi()
        .hdel('user:logintable', this.email + ':' + this.pw)
        .hdel('user:existtable', this.email)
        .del('user:tokens:' + this.accessToken)
        .del(this.field + ':followings')
        .del(this.field + ':followers')
        .del('user:' + this.id)
        .exec(next);
}

// Model Descriptor
module.exports = {
    name: 'user',
    type: 'redis',
    schema: schema,
    methods: {
        profile: getProfile,
        refreshAuth: refreshAuth,
        refreshRefreshToken: refreshRefreshToken,
        refreshAccessToken: refreshAccessToken,
        deleteUser: deleteUser
    },
    statics: {
        auth: userAuth,
        emailExists: userExists
    }
};
module.exports.onModuleInit = onModuleInit;