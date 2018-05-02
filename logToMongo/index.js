const mongoose = require('mongoose');

function logToMongo(name) {
    let mongoDB = mongoose.connection.db.collection('logs');
    return function (req, res, next) {
        let start = new Date();
        
        res.on('finish', function () {
            let end = new Date();
            let diff = end - start;
            let headers = req.headers;
            headers.authorization = "JWT *************************";
            mongoDB.insert({
                name: name,
                url: req.originalUrl,
                method: req.method,
                reqHeaders: headers,
                reqBody: req.body,
                timestamp: start,
                resHeaders: res.getHeaders(),
                resStatusCode: res.statusCode,
                source: req.connection.remoteAddress,
                completionTime: diff,
                _deleted: false
            });
        });
        next();
    };
}

module.exports = logToMongo;
