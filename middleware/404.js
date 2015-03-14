
module.exports = function() {
    return notFound;
}

// catch 404 and forward to error handler
function notFound(req, res, next) {
    var err = new Error('페이지를 찾을 수 없습니다.');
    err.status = 404;
    next(err);
}
