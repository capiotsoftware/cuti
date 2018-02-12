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
            start = Date.now();
			let reqBody = reqData && reqData.length !==0 ? JSON.parse(reqData) : null;
            mongoDB.insert({
                name: name,
                reqBody: reqBody,
				method: req.method,
                reqHeaders: req.headers,
                timestamp: start,
                url: req.protocol + '://' + req.get('host') + req.originalUrl
            });
        });
        
        res.on('finish', function () {
            let end = Date.now();
            let diff = end - start;
            mongoDB.insert({
                name: name,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                reqBody: req.body,
                reqHeaders: req.headers,
				method: req.method,
                timestamp: end,
                resStatusCode: res.statusCode,
                completionTime: diff
            });
        });
        next();
    };
}

module.exports = logToMongo;