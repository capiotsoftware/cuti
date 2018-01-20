var logMiddleware = (logger) => {
    var counter = 0;
    return (req, res, next) => {
        var reqId = counter++;
        if (reqId == Number.MAX_VALUE) {
            reqId = counter = 0;
        }
        logger.info(reqId + " " + req.ip + " " + req.method + " " + req.originalUrl);
        next();
        logger.trace(reqId + " Sending Response");
    };
}



module.exports.getLogMiddleware = logMiddleware;