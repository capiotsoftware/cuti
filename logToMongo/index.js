const mongoose = require('mongoose');

function logToMongo() {
    let mongoDB = mongoose.connection.db.collection('logs');
    return function (req, res, next) {
        let reqData = "";
        let start = null;
        req.on('data', function (chunk) {
            reqData += chunk;
        });
        req.on('end', function(){
            start = Date.now();
            mongoDB.insert({
                reqBody: JSON.parse(reqData),
                reqHeaders: req.headers,
                timestamp: start,
                url: req.protocol + '://' + req.get('host') + req.originalUrl
            });
        });
        
        res.on('finish', function () {
            let end = Date.now();
            let diff = end - start;
            mongoDB.insert({
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                reqBody: req.body,
                reqHeaders: req.headers,
                timestamp: end,
                resStatusCode: res.statusCode,
                completionTime: diff
            });
        });
        next();
    };
}

module.exports = logToMongo;