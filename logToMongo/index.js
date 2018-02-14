const mongoose = require('mongoose');

function logToMongo(name) {
    let mongoDB = mongoose.connection.db.collection('logs');
    return function (req, res, next) {
        let reqData = "";
        let start = null;
        req.on('data', function (chunk) {
            reqData += chunk;
        });
        req.on('end', function(){
            start = new Date();
			let reqBody = reqData && reqData.length !==0 ? JSON.parse(reqData) : null;
            mongoDB.insert({
                name: name,
                reqBody: reqBody,
				method: req.method,
                reqHeaders: req.headers,
                timestamp: start,
                url: req.originalUrl,
                source: req.connection.remoteAddress,
                deleted: false
            });
        });
        
        res.on('finish', function () {
            let end = new Date();
            let diff = end - start;
            mongoDB.insert({
                name: name,
                url: req.originalUrl,
                reqBody: req.body,
                reqHeaders: req.headers,
				method: req.method,
                timestamp: end,
                resStatusCode: res.statusCode,
                source: req.connection.remoteAddress,
                completionTime: diff,
                deleted: false
            });
        });
        next();
    };
}

module.exports = logToMongo;