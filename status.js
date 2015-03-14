'use strict';

var map = {
    succeed: { code: 200, msg: '성공' },
    authFailed: { code: 401, httpStatus: 401, msg: '인증 오류' },
    authExpired: { code: 403, httpStatus: 403, msg: '세션이 만료되었습니다.'},
    noParameter: { code: 412, httpStatus: 412, msg: '파라미터가 부족합니다.'},
    tooLarge: { code: 413, httpStatus: 413, msg: '파라미터의 길이가 너무 깁니다.'},

    // Global Error
    connectionFailed: { code: 1000, msg: 'Connection Failed.'},
    idNotFound: { code: 1001, msg: '해당 Object를 찾을 수 없습니다.'},
    imageNotFound: { code: 1004, httpStatus: 404, msg: 'Image cannot found'},
    invalidState: { code: 1005, msg: '잘못된 상태입니다.' },

    // User Status
    userExists: { code: 2002, msg: '이미 가입된 이메일입니다.'},

    custom: function(code, msg) {
        return { 'code': code, 'msg': msg };
    }
};

function Status(errorKey, errorMessage) {
    if (!errorKey) return;
    var status = map[errorKey];
    if (!status) return;
    status.msg = errorMessage || status.msg;
    return status;
}

Status.isStatus = function(status) {
    return status.code && status.msg;
}

module.exports = Status;
